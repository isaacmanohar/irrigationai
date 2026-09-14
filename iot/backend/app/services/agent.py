"""
Agentic Irrigation Decision Engine — Phase 6
=============================================
Implements a REASON → PLAN → DECIDE loop using Groq/Llama as the
reasoning backbone. The LLM reasons over *deterministic* tool outputs
(sensor data, ML predictions, weather, NDVI) — it never invents values.

Architecture:
  DataFusionService → FarmState
      ↓
  IrrigationAgent.decide(farm_state)
      ↓ calls deterministic tools
  ML predictions + weather + NDVI (real numbers)
      ↓ builds grounded context
  Groq LLM reasons and produces structured JSON decision
      ↓
  AgentDecision (structured, validated, returned to API)
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from groq import Groq

load_dotenv()
logger = logging.getLogger(__name__)


# ─── Structured output types ─────────────────────────────────────────────────

@dataclass
class AgentDecision:
    """Structured output from the agentic decision engine."""
    decision: str                    # "irrigate" | "delay" | "skip" | "monitor"
    recommended_water_mm: float      # millimetres to apply (0 = no irrigation)
    scheduled_time: str              # ISO datetime or descriptive string
    confidence: float                # 0.0 – 1.0
    reasoning: List[str]             # ordered reasoning steps
    factors: Dict[str, str]          # key sensor / metric descriptions
    alert_level: str                 # "none" | "low" | "medium" | "high" | "critical"
    human_summary: str               # one-sentence summary for the farmer
    ml_prediction: str               # raw ML model output label
    ml_confidence: float
    water_stress_index: float
    ndvi_trend: str
    sources_used: List[str]
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ─── IrrigationAgent ─────────────────────────────────────────────────────────

class IrrigationAgent:
    """
    Agentic decision engine.
    Uses deterministic tools for ground truth, Groq LLM for reasoning.
    """

    def __init__(self) -> None:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            self.client: Optional[Groq] = Groq(api_key=api_key)
            self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
            logger.info(f"IrrigationAgent: Groq LLM initialized with model {self.model}")
        else:
            self.client = None
            logger.warning("IrrigationAgent: GROQ_API_KEY missing — will use rule-based fallback")

    # ─── Public entry point ──────────────────────────────────────────────────

    def decide(self, farm_state) -> AgentDecision:
        """
        Run the full REASON → PLAN → DECIDE loop for a given FarmState.
        Always calls deterministic tools first, then sends grounded context to LLM.
        """
        from app.services.prediction import predictor

        # ── Step 1: Deterministic tool calls ────────────────────────────────
        ml_features = farm_state.to_ml_features()

        ml_result = predictor.predict_irrigation_need(ml_features)
        water_mm = predictor.predict_water_requirement(ml_features)
        xai_result = predictor.explain_prediction(ml_features)

        needs_irrigation = ml_result.get("needs_irrigation", False)
        ml_label = ml_result.get("prediction", "Unknown")
        ml_conf = ml_result.get("confidence", 0.0)

        logger.info(
            f"Agent tools — ML: {ml_label} ({ml_conf:.0%}), "
            f"water_req={water_mm:.1f}mm, stress={farm_state.water_stress_index:.2f}"
        )

        # ── Step 2: Build grounded context for the LLM ───────────────────────
        context = self._build_context(farm_state, ml_result, water_mm, xai_result)

        # ── Step 3: LLM reasoning ────────────────────────────────────────────
        llm_output = {}
        if self.client:
            llm_output = self._llm_reason(context)
        
        if not llm_output:
            llm_output = self._rule_based_fallback(farm_state, ml_result, water_mm)

        # ── Step 4: Assemble final AgentDecision ─────────────────────────────
        decision = AgentDecision(
            decision=llm_output.get("decision", "monitor"),
            recommended_water_mm=float(llm_output.get("recommended_water_mm", water_mm if needs_irrigation else 0)),
            scheduled_time=llm_output.get("scheduled_time", "Tomorrow morning 06:00"),
            confidence=float(llm_output.get("confidence", ml_conf)),
            reasoning=llm_output.get("reasoning", []),
            factors=llm_output.get("factors", self._build_factors_dict(farm_state)),
            alert_level=llm_output.get("alert_level", self._compute_alert(farm_state)),
            human_summary=llm_output.get("human_summary", ""),
            ml_prediction=ml_label,
            ml_confidence=ml_conf,
            water_stress_index=farm_state.water_stress_index,
            ndvi_trend=farm_state.ndvi_trend,
            sources_used=farm_state.sources_used,
        )

        logger.info(
            f"Agent decision: {decision.decision} | "
            f"water={decision.recommended_water_mm:.1f}mm | "
            f"alert={decision.alert_level} | "
            f"confidence={decision.confidence:.0%}"
        )
        return decision

    # ─── Context builder ─────────────────────────────────────────────────────

    def _build_context(
        self,
        fs,
        ml_result: dict,
        water_mm: float,
        xai_result: dict,
    ) -> str:
        top_factors = xai_result.get("contributions", [])[:4]
        top_factors_str = "\n".join(
            f"  • {f['feature']}: importance={f['importance']:.3f}, "
            f"value={f['value']}, direction={f['direction']}"
            for f in top_factors
        ) or "  (not available)"

        forecast_str = ", ".join(
            f"Day {i+1}: {r:.1f}mm"
            for i, r in enumerate(fs.forecast_rain_7d[:7])
        )

        return f"""
FIELD PROFILE:
  Crop: {fs.crop} | Growth stage: {fs.growth_stage} | Area: {fs.field_area_ha} ha
  Season: {fs.season} | Optimal moisture: {fs.optimal_moisture}%

SENSOR DATA (source: {', '.join(s for s in fs.sources_used if 'iot' in s) or 'unavailable'}):
  Soil moisture: {fs.soil_moisture:.1f}%  (optimal: {fs.optimal_moisture:.0f}%)
  Temperature: {fs.temperature:.1f}°C
  Humidity: {fs.humidity:.1f}%
  Flow rate: {fs.flow_rate:.2f} L/min
  Last reading: {fs.sensor_timestamp or 'unknown'}

SATELLITE (NDVI) (source: {', '.join(s for s in fs.sources_used if 'satellite' in s) or 'unavailable'}):
  NDVI: {fs.ndvi:.3f} ({fs.ndvi_status})
  Trend: {fs.ndvi_trend}
  Stress alert: {fs.ndvi_stress_alert}
  Crop health index: {fs.crop_health_index:.2f}

WEATHER (source: {', '.join(s for s in fs.sources_used if 'weather' in s) or 'unavailable'}):
  Current temp: {fs.weather_temp:.1f}°C | Humidity: {fs.weather_humidity:.1f}%
  Today rainfall: {fs.rainfall_mm:.1f}mm | Rain probability: {fs.rain_probability:.0f}%
  Wind: {fs.wind_speed_kmh:.1f} km/h
  7-day rain forecast: {forecast_str}

IRRIGATION HISTORY:
  Previous irrigation: {fs.prev_irrigation_mm:.1f}mm
  Days since last irrigation: {fs.days_since_irrigation} days

ML MODEL OUTPUTS (Random Forest, deterministic):
  Irrigation needed: {ml_result.get('needs_irrigation', False)} ({ml_result.get('prediction', 'Unknown')})
  Confidence: {ml_result.get('confidence', 0.0):.0%}
  Predicted water requirement: {water_mm:.1f}mm

ML FEATURE IMPORTANCES (XAI — top 4):
{top_factors_str}

DERIVED METRICS:
  Water stress index: {fs.water_stress_index:.3f} (0=none, 1=severe)
  Estimated ET: {fs.evapotranspiration_est:.1f}mm/day
"""

    # ─── LLM reasoning ───────────────────────────────────────────────────────

    def _llm_reason(self, context: str) -> dict:
        system_prompt = """You are an expert precision irrigation AI agent.
You receive GROUND TRUTH data from sensors, satellite, weather, and ML models.
You MUST NOT invent or modify any numerical values — reason only over the provided data.

Your job:
1. OBSERVE: Assess each data source and identify conflicts or confirmations.
2. REASON: Weigh the evidence for/against irrigation — consider interactions.
3. PLAN: Decide the action and timing.
4. DECIDE: Return a single structured JSON decision.

Decision options:
  "irrigate"  — irrigate now or as scheduled (water_mm > 0)
  "delay"     — hold off because rain is expected
  "skip"      — no irrigation needed (good moisture + NDVI)
  "monitor"   — uncertain, gather more data

Key reasoning rules:
  - Low soil moisture + low NDVI + high temp + low rain_prob → irrigate
  - Low soil moisture + HIGH rain probability (>60%) within 1-2 days → delay
  - Good moisture + good NDVI → skip
  - Missing sensor data → lower confidence, recommend monitor
  - Flowering/critical growth stage increases urgency by 1 level

Return ONLY valid JSON — no extra text:
{
  "decision": "irrigate|delay|skip|monitor",
  "recommended_water_mm": <number>,
  "scheduled_time": "<descriptive time or ISO string>",
  "confidence": <0.0-1.0>,
  "alert_level": "none|low|medium|high|critical",
  "reasoning": ["<step 1>", "<step 2>", "<step 3>"],
  "factors": {
    "soil_moisture": "<description>",
    "ndvi": "<description>",
    "weather": "<description>",
    "crop_stage": "<description>"
  },
  "human_summary": "<one friendly sentence for the farmer>"
}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Farm data:\n{context}\n\nProvide your irrigation decision as JSON."},
                ],
                temperature=0.3,      # low temp = consistent, fact-based reasoning
                max_tokens=1000,
            )
            raw = response.choices[0].message.content.strip()
            logger.debug(f"Agent LLM raw output: {raw[:300]}")

            # Extract JSON
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(raw[start:end])
            logger.warning("Agent: LLM returned non-JSON, falling back to rules")
        except json.JSONDecodeError as e:
            logger.warning(f"Agent: JSON parse error — {e}")
        except Exception as e:
            logger.error(f"Agent: LLM call failed — {e}")

        return {}   # triggers rule-based fallback in caller

    # ─── Rule-based fallback ─────────────────────────────────────────────────

    def _rule_based_fallback(self, fs, ml_result: dict, water_mm: float) -> dict:
        """Deterministic decision when LLM is unavailable."""
        needs = ml_result.get("needs_irrigation", False)
        moisture = fs.soil_moisture
        optimal = fs.optimal_moisture
        ndvi = fs.ndvi
        rain_prob = fs.rain_probability
        rain_soon = any(r > 5 for r in fs.forecast_rain_7d[:2])

        if moisture > optimal + 15 or (ndvi > 0.7 and moisture > optimal):
            decision, water, alert = "skip", 0.0, "none"
            summary = f"Soil moisture is adequate ({moisture:.0f}%) — no irrigation needed."
        elif rain_prob > 65 or rain_soon:
            decision, water, alert = "delay", 0.0, "low"
            summary = "Rain is expected soon — delaying irrigation to conserve water."
        elif needs and moisture < optimal - 10:
            decision, water, alert = "irrigate", round(water_mm, 1), "medium"
            summary = f"Low soil moisture ({moisture:.0f}%) with ML recommending irrigation — apply {water_mm:.0f}mm."
        elif fs.water_stress_index > 0.6:
            decision, water, alert = "irrigate", round(water_mm * 1.1, 1), "high"
            summary = f"High water stress index ({fs.water_stress_index:.2f}) — immediate irrigation recommended."
        else:
            decision, water, alert = "monitor", 0.0, "low"
            summary = "Conditions are borderline — continue monitoring."

        return {
            "decision": decision,
            "recommended_water_mm": water,
            "scheduled_time": "Tomorrow morning 06:00",
            "confidence": 0.75,
            "alert_level": alert,
            "reasoning": [
                f"Soil moisture: {moisture:.1f}% vs optimal {optimal:.0f}%",
                f"NDVI: {ndvi:.3f} ({fs.ndvi_status}), trend: {fs.ndvi_trend}",
                f"Rain probability: {rain_prob:.0f}%, forecast: {fs.forecast_rain_7d[:3]}",
                f"ML prediction: {ml_result.get('prediction', 'Unknown')} "
                f"({ml_result.get('confidence', 0):.0%} confidence)",
            ],
            "factors": self._build_factors_dict(fs),
            "human_summary": summary,
        }

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _build_factors_dict(self, fs) -> Dict[str, str]:
        moisture_status = (
            "critical" if fs.soil_moisture < 25 else
            "low" if fs.soil_moisture < fs.optimal_moisture else
            "adequate"
        )
        ndvi_status = (
            "severe stress" if fs.ndvi < 0.3 else
            "moderate stress" if fs.ndvi < 0.5 else
            "healthy"
        )
        return {
            "soil_moisture": f"{fs.soil_moisture:.1f}% — {moisture_status}",
            "ndvi": f"{fs.ndvi:.3f} — {ndvi_status}, trend {fs.ndvi_trend}",
            "temperature": f"{fs.temperature:.1f}°C",
            "rain_probability": f"{fs.rain_probability:.0f}%",
            "water_stress": f"{fs.water_stress_index:.2f} / 1.0",
            "crop_stage": f"{fs.crop} at {fs.growth_stage}",
        }

    def _compute_alert(self, fs) -> str:
        if fs.soil_moisture < 20 or fs.ndvi < 0.25:
            return "critical"
        elif fs.water_stress_index > 0.7:
            return "high"
        elif fs.soil_moisture < fs.optimal_moisture - 10:
            return "medium"
        elif fs.water_stress_index > 0.3:
            return "low"
        return "none"


# Singleton
irrigation_agent = IrrigationAgent()
