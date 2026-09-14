"""
Agent API — Phase 6 & 7 endpoints
====================================
GET /api/v1/agent/decision/{field_id}
    → Full agentic decision (REASON → PLAN → DECIDE)

GET /api/v1/agent/explain/{field_id}
    → XAI explanation of why the system recommended what it did

GET /api/v1/agent/farm-state/{field_id}
    → Unified FarmState object (diagnostic / dashboard use)
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models.database import Field
from ..services.data_fusion import data_fusion_service
from ..services.agent import irrigation_agent
from ..services.prediction import predictor
from ..schemas.schemas import FeedbackCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["Agentic AI"])


@router.get("/decision/{field_id}")
async def get_agent_decision(field_id: int, db: Session = Depends(get_db)):
    """
    Phase 6 — Full agentic irrigation decision.

    Combines IoT + Weather + Satellite + ML → LLM reasoning → structured decision.
    Returns a machine-readable + human-readable JSON decision.
    """
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail=f"Field {field_id} not found")

    try:
        # Build fused farm state (weather + cached NDVI, no slow GEE call)
        farm_state = await data_fusion_service.build_farm_state(
            field_id=field_id,
            db=db,
            fetch_weather=True,
            fetch_ndvi=False,
        )

        # Run agentic decision engine
        decision = irrigation_agent.decide(farm_state)

        return {
            "status": "success",
            "field_id": field_id,
            "decision": decision.to_dict(),
            # Include a compact summary at the top level for easy frontend access
            "summary": {
                "action": decision.decision,
                "water_mm": decision.recommended_water_mm,
                "alert": decision.alert_level,
                "confidence_pct": round(decision.confidence * 100, 1),
                "human_summary": decision.human_summary,
                "scheduled_time": decision.scheduled_time,
            },
        }

    except Exception as exc:
        logger.error(f"Agent decision error for field {field_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent decision failed: {str(exc)}")


@router.get("/explain/{field_id}")
async def get_xai_explanation(field_id: int, db: Session = Depends(get_db)):
    """
    Phase 7 — XAI explanation.

    Returns feature importances from the RandomForest model plus
    a human-readable sentence explaining the irrigation recommendation.
    """
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail=f"Field {field_id} not found")

    try:
        farm_state = await data_fusion_service.build_farm_state(
            field_id=field_id,
            db=db,
            fetch_weather=True,
            fetch_ndvi=False,
        )
        ml_features = farm_state.to_ml_features()

        # ML prediction
        ml_result = predictor.predict_irrigation_need(ml_features)
        water_mm = predictor.predict_water_requirement(ml_features)

        # XAI
        explanation = predictor.explain_prediction(ml_features)

        # Agentic summary (use rule-based — no LLM for explain endpoint to keep it fast)
        decision = irrigation_agent.decide(farm_state)

        return {
            "status": "success",
            "field_id": field_id,
            "ml_prediction": {
                "needs_irrigation": ml_result.get("needs_irrigation"),
                "confidence": ml_result.get("confidence"),
                "water_requirement_mm": round(water_mm, 1),
            },
            "xai": {
                "method": explanation.get("method"),
                "contributions": explanation.get("contributions", []),
                "human_explanation": explanation.get("human_explanation", ""),
            },
            "agent_reasoning": decision.reasoning,
            "agent_factors": decision.factors,
            "alert_level": decision.alert_level,
            "human_summary": decision.human_summary,
            "data_sources": farm_state.sources_used,
            # Key metrics for the dashboard "Why?" card
            "metrics": {
                "soil_moisture": farm_state.soil_moisture,
                "optimal_moisture": farm_state.optimal_moisture,
                "ndvi": farm_state.ndvi,
                "ndvi_status": farm_state.ndvi_status,
                "ndvi_trend": farm_state.ndvi_trend,
                "temperature": farm_state.temperature,
                "rain_probability": farm_state.rain_probability,
                "water_stress_index": farm_state.water_stress_index,
                "crop": farm_state.crop,
                "growth_stage": farm_state.growth_stage,
                "confidence": round(decision.confidence * 100, 1),
            },
        }

    except Exception as exc:
        logger.error(f"XAI explain error for field {field_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(exc)}")


@router.get("/farm-state/{field_id}")
async def get_farm_state(field_id: int, db: Session = Depends(get_db)):
    """
    Diagnostic endpoint — returns the full fused FarmState object.
    Useful for debugging data fusion and testing from the frontend.
    """
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail=f"Field {field_id} not found")

    try:
        farm_state = await data_fusion_service.build_farm_state(
            field_id=field_id,
            db=db,
            fetch_weather=True,
            fetch_ndvi=False,
        )
        return {"status": "success", "farm_state": farm_state.to_dict()}
    except Exception as exc:
        logger.error(f"Farm state error for field {field_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── Phase 9: Farmer Feedback Loop ─────────────────────────────────────────────

@router.post("/feedback")
async def submit_feedback(
    feedback: "FeedbackCreate",
    db: Session = Depends(get_db),
):
    """
    Phase 9 — Store farmer's response to an AI irrigation recommendation.

    Body:
        field_id            int
        ai_decision         str   (irrigate / delay / skip / monitor)
        recommended_water_mm float
        ai_confidence       float (0-1)
        agent_reasoning     list[str]  (optional)
        farmer_response     str   (accepted / rejected / modified)
        actual_water_mm     float (optional — what was actually applied)
        farmer_notes        str   (optional free-text)
    """
    import json as _json
    from datetime import datetime as _dt
    from ..models.database import AIRecommendationFeedback

    field = db.query(Field).filter(Field.id == feedback.field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail=f"Field {feedback.field_id} not found")

    if feedback.farmer_response not in ("accepted", "rejected", "modified"):
        raise HTTPException(
            status_code=422,
            detail="farmer_response must be 'accepted', 'rejected', or 'modified'",
        )

    record = AIRecommendationFeedback(
        field_id=feedback.field_id,
        ai_decision=feedback.ai_decision,
        recommended_water_mm=feedback.recommended_water_mm,
        ai_confidence=feedback.ai_confidence,
        agent_reasoning=_json.dumps(feedback.agent_reasoning or []),
        farmer_response=feedback.farmer_response,
        actual_water_mm=feedback.actual_water_mm,
        farmer_notes=feedback.farmer_notes,
        recommendation_at=_dt.utcnow(),
        response_at=_dt.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    logger.info(
        f"Feedback stored: field={feedback.field_id} "
        f"ai={feedback.ai_decision} farmer={feedback.farmer_response}"
    )
    return {
        "status": "success",
        "feedback_id": record.id,
        "message": f"Feedback '{feedback.farmer_response}' recorded for field {feedback.field_id}.",
    }


@router.get("/feedback/{field_id}")
async def get_feedback_history(
    field_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """
    Phase 9 — Retrieve farmer feedback history for a field.
    Returns the most recent `limit` feedback records.
    """
    import json as _json
    from ..models.database import AIRecommendationFeedback

    records = (
        db.query(AIRecommendationFeedback)
        .filter(AIRecommendationFeedback.field_id == field_id)
        .order_by(AIRecommendationFeedback.recommendation_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "status": "success",
        "field_id": field_id,
        "count": len(records),
        "feedback": [
            {
                "id": r.id,
                "ai_decision": r.ai_decision,
                "recommended_water_mm": r.recommended_water_mm,
                "ai_confidence": r.ai_confidence,
                "agent_reasoning": _json.loads(r.agent_reasoning or "[]"),
                "farmer_response": r.farmer_response,
                "actual_water_mm": r.actual_water_mm,
                "farmer_notes": r.farmer_notes,
                "recommendation_at": r.recommendation_at.isoformat() if r.recommendation_at else None,
                "response_at": r.response_at.isoformat() if r.response_at else None,
            }
            for r in records
        ],
    }

