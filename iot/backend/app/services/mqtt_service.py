"""
MQTT Service — bridges ESP32 sensor telemetry into the backend.

Topic contract (matches esp32_firmware_mqtt.ino):
  Publish:   irrigation/telemetry
             Payload: {"field_id":1,"soil_moisture":42.5,"temperature":28.3,
                       "humidity":65.1,"flow_rate":1.2}

  Subscribe: irrigation/commands/<field_id>
             Payload: {"action":"START|STOP|FORCE_OFF|STAY_OFF", ...}

  Status:    irrigation/status/<field_id>   ONLINE | OFFLINE (LWT)

Configuration via environment variables (all optional with defaults):
  MQTT_BROKER_HOST   default: broker.hivemq.com
  MQTT_BROKER_PORT   default: 1883
  MQTT_TOPIC_TELEMETRY   default: irrigation/telemetry
"""

import json
import logging
import os
import time
import threading
from typing import Optional

import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.database import SensorData, Field

logger = logging.getLogger(__name__)

# ─── Configuration (environment-variable driven) ──────────────────────────────
MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "broker.hivemq.com")
MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC_TELEMETRY: str = os.getenv("MQTT_TOPIC_TELEMETRY", "irrigation/telemetry")
MQTT_TOPIC_STATUS_WILDCARD: str = os.getenv("MQTT_TOPIC_STATUS", "irrigation/status/+")
MQTT_RECONNECT_DELAY: int = int(os.getenv("MQTT_RECONNECT_DELAY_S", "10"))

# Optional auth (HiveMQ Cloud etc.)
MQTT_USERNAME: Optional[str] = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD: Optional[str] = os.getenv("MQTT_PASSWORD")

# Sensor value validation bounds
SENSOR_BOUNDS = {
    "soil_moisture": (0.0, 100.0),
    "temperature": (-10.0, 65.0),
    "humidity": (0.0, 100.0),
    "flow_rate": (0.0, 500.0),
}


class MQTTService:
    def __init__(self) -> None:
        self.client = mqtt.Client(
            callback_api_version=CallbackAPIVersion.VERSION2,
            client_id="IrrigationAI_Backend_Server",
        )
        if MQTT_USERNAME and MQTT_PASSWORD:
            self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        self.is_connected: bool = False

    # ─── MQTT Callbacks ───────────────────────────────────────────────────────

    def _on_connect(self, client, userdata, flags, rc, properties=None) -> None:
        if rc == 0:
            self.is_connected = True
            logger.info(
                f"MQTT: Connected to broker {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}"
            )
            client.subscribe(MQTT_TOPIC_TELEMETRY, qos=1)
            client.subscribe(MQTT_TOPIC_STATUS_WILDCARD, qos=0)
            logger.info(
                f"MQTT: Subscribed to [{MQTT_TOPIC_TELEMETRY}] "
                f"and [{MQTT_TOPIC_STATUS_WILDCARD}]"
            )
        else:
            logger.error(
                f"MQTT: Connection failed — broker returned rc={rc}. "
                "Will retry automatically."
            )

    def _on_disconnect(self, client, userdata, rc, properties=None, reason=None) -> None:
        self.is_connected = False
        if rc != 0:
            logger.warning(
                f"MQTT: Unexpected disconnect (rc={rc}). "
                f"Reconnecting in {MQTT_RECONNECT_DELAY}s …"
            )

    def _on_message(self, client, userdata, msg) -> None:
        topic = msg.topic
        try:
            payload_str = msg.payload.decode("utf-8")
        except UnicodeDecodeError:
            logger.warning(f"MQTT: Could not decode payload on [{topic}] — skipping")
            return

        logger.info(f"MQTT: Received [{topic}]: {payload_str[:200]}")

        if topic == MQTT_TOPIC_TELEMETRY:
            self._handle_telemetry(payload_str)
        elif topic.startswith("irrigation/status/"):
            field_id = topic.split("/")[-1]
            logger.info(f"MQTT: ESP32 field={field_id} status={payload_str}")
        else:
            logger.debug(f"MQTT: Unhandled topic [{topic}]")

    # ─── Telemetry processing ─────────────────────────────────────────────────

    def _handle_telemetry(self, payload_str: str) -> None:
        """Parse, validate, and persist an ESP32 telemetry message."""
        # 1. Parse JSON safely
        try:
            data = json.loads(payload_str)
        except json.JSONDecodeError as exc:
            logger.warning(f"MQTT: Invalid JSON in telemetry — {exc}. Payload: {payload_str[:200]}")
            return

        if not isinstance(data, dict):
            logger.warning(f"MQTT: Telemetry payload is not a JSON object — skipped")
            return

        # 2. Extract & type-coerce sensor fields
        field_id = data.get("field_id", 1)
        try:
            field_id = int(field_id)
        except (TypeError, ValueError):
            logger.warning(f"MQTT: Invalid field_id={field_id!r} — defaulting to 1")
            field_id = 1

        sensor_values: dict = {}
        for key in ("soil_moisture", "temperature", "humidity", "flow_rate"):
            raw = data.get(key, 0.0)
            try:
                val = float(raw)
            except (TypeError, ValueError):
                logger.warning(f"MQTT: field={field_id} key={key} value={raw!r} not numeric — using 0.0")
                val = 0.0

            lo, hi = SENSOR_BOUNDS[key]
            if not (lo <= val <= hi):
                logger.warning(
                    f"MQTT: field={field_id} {key}={val} out of bounds [{lo},{hi}] — clamped"
                )
                val = max(lo, min(hi, val))
            sensor_values[key] = val

        # 3. Persist to database
        db: Session = SessionLocal()
        try:
            record = SensorData(
                field_id=field_id,
                soil_moisture=sensor_values["soil_moisture"],
                temperature=sensor_values["temperature"],
                humidity=sensor_values["humidity"],
                flow_rate=sensor_values["flow_rate"],  # ← correct column name
            )
            db.add(record)
            db.commit()
            logger.info(
                f"MQTT: Stored sensor reading for field={field_id}: "
                f"moisture={sensor_values['soil_moisture']:.1f}% "
                f"temp={sensor_values['temperature']:.1f}°C"
            )

            # 4. Derive pump command and publish back to ESP32
            pump_cmd = self._derive_pump_command(db, field_id, sensor_values)
            self._publish_command(field_id, pump_cmd, sensor_values)

        except Exception as exc:
            db.rollback()
            logger.error(f"MQTT: DB error for field={field_id}: {exc}", exc_info=True)
        finally:
            db.close()

    def _derive_pump_command(self, db: Session, field_id: int, sensor: dict) -> str:
        """Return pump command string based on sensor data + ML prediction."""
        from app.services.prediction import predictor

        field = db.query(Field).filter(Field.id == field_id).first()

        moisture = sensor["soil_moisture"]
        threshold = field.optimal_moisture_level if field else 40.0

        # Safety: over-irrigation cutoff
        if moisture >= threshold + 20:
            return "FORCE_OFF"

        # Run ML model if available
        ml_result = predictor.predict_irrigation_need({
            "soil_moisture": moisture,
            "temperature": sensor["temperature"],
            "humidity": sensor["humidity"],
            "crop_type": 1,
            "growth_stage": 1,
        })
        needs_irrigation = ml_result.get("needs_irrigation", False)

        if needs_irrigation and moisture < threshold:
            return "START"
        elif moisture >= threshold:
            return "FORCE_OFF"
        else:
            return "STAY_OFF"

    def _publish_command(self, field_id: int, action: str, sensor: dict) -> None:
        """Publish pump command back to ESP32 on its command topic."""
        topic = f"irrigation/commands/{field_id}"
        payload = json.dumps({
            "action": action,
            "field_id": field_id,
            "soil_moisture": sensor["soil_moisture"],
        })
        try:
            self.client.publish(topic, payload, qos=1)
            logger.info(f"MQTT: Published command [{topic}]: {action}")
        except Exception as exc:
            logger.error(f"MQTT: Failed to publish command to {topic}: {exc}")

    # ─── Lifecycle ────────────────────────────────────────────────────────────

    def start(self) -> None:
        """Connect and start the background network loop with auto-reconnect."""
        try:
            logger.info(
                f"MQTT: Connecting to {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT} …"
            )
            self.client.connect_async(
                MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=60
            )
            # loop_start() runs in a background thread and handles reconnects automatically
            self.client.loop_start()
            logger.info("MQTT: Background loop started (auto-reconnect enabled)")
        except Exception as exc:
            logger.error(
                f"MQTT: Could not connect to broker — service will be unavailable. "
                f"Error: {exc}"
            )

    def stop(self) -> None:
        """Gracefully stop the MQTT loop and disconnect."""
        self.client.loop_stop()
        self.client.disconnect()
        self.is_connected = False
        logger.info("MQTT: Service stopped")


mqtt_service = MQTTService()
