import json
import logging
import os
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.database import SensorData, Field
from app.services.prediction import predict_irrigation_need

logger = logging.getLogger(__name__)

MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "broker.hivemq.com")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
MQTT_TOPIC_TELEMETRY = "irrigation/telemetry"
MQTT_TOPIC_STATUS = "irrigation/status/+"

class MQTTService:
    def __init__(self):
        self.client = mqtt.Client(
            callback_api_version=CallbackAPIVersion.VERSION2,
            client_id="IrrigationAI_Backend_Server"
        )
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.is_connected = False

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.is_connected = True
            logger.info(f"Connected to MQTT Broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")
            # Subscribe to telemetry & status topics
            client.subscribe(MQTT_TOPIC_TELEMETRY)
            client.subscribe(MQTT_TOPIC_STATUS)
            logger.info(f"Subscribed to topics: {MQTT_TOPIC_TELEMETRY}, {MQTT_TOPIC_STATUS}")
        else:
            logger.error(f"Failed to connect to MQTT Broker, return code {rc}")


    def on_message(self, client, userdata, msg):
        try:
            payload_str = msg.payload.decode("utf-8")
            logger.info(f"MQTT Received [{msg.topic}]: {payload_str}")
            
            if msg.topic == MQTT_TOPIC_TELEMETRY:
                data = json.loads(payload_str)
                self.process_telemetry(data)
            elif msg.topic.startswith("irrigation/status/"):
                field_id = msg.topic.split("/")[-1]
                logger.info(f"Field {field_id} ESP32 Status: {payload_str}")
        except Exception as e:
            logger.error(f"Error processing MQTT message on {msg.topic}: {e}")

    def process_telemetry(self, data: dict):
        db: Session = SessionLocal()
        try:
            field_id = data.get("field_id", 1)
            soil_moisture = float(data.get("soil_moisture", 0.0))
            temperature = float(data.get("temperature", 0.0))
            humidity = float(data.get("humidity", 0.0))
            flow_rate = float(data.get("flow_rate", 0.0))

            # 1. Save Telemetry into Database
            sensor_record = SensorData(
                field_id=field_id,
                soil_moisture=soil_moisture,
                temperature=temperature,
                humidity=humidity,
                water_flow_rate=flow_rate
            )
            db.add(sensor_record)
            db.commit()
            logger.info(f"Saved MQTT sensor reading for Field {field_id} into DB.")

            # 2. Run ML Prediction
            field = db.query(Field).filter(Field.id == field_id).first()
            crop_type = field.crop_type if field else "Wheat"
            growth_stage = field.growth_stage if field else "Development"

            ml_result = predict_irrigation_need({
                "crop_type": crop_type,
                "growth_stage": growth_stage,
                "current_moisture": soil_moisture,
                "temperature": temperature,
                "humidity": humidity
            })

            # 3. Determine Pump Command
            should_irrigate = ml_result.get("should_irrigate", False)
            water_req_mm = ml_result.get("water_requirement_mm", 0.0)

            if should_irrigate and soil_moisture < 35.0:
                pump_command = "START"
            elif soil_moisture >= 60.0:
                pump_command = "FORCE_OFF"
            else:
                pump_command = "STAY_OFF"

            # 4. Publish Command back to ESP32 via MQTT
            command_topic = f"irrigation/commands/{field_id}"
            command_payload = json.dumps({
                "action": pump_command,
                "should_irrigate": should_irrigate,
                "water_req_mm": water_req_mm,
                "reason": ml_result.get("explanation", "")
            })
            self.client.publish(command_topic, command_payload, qos=1)
            logger.info(f"Published MQTT Command to [{command_topic}]: {command_payload}")

        except Exception as e:
            db.rollback()
            logger.error(f"Error processing telemetry in DB/ML: {e}")
        finally:
            db.close()

    def start(self):
        try:
            self.client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=60)
            self.client.loop_start()
            logger.info("MQTT Service Loop Started.")
        except Exception as e:
            logger.error(f"Could not connect to MQTT broker: {e}")

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("MQTT Service Stopped.")

mqtt_service = MQTTService()
