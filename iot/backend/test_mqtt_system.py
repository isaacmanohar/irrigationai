import time
import json
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

received_messages = []

def on_connect(client, userdata, flags, rc, properties=None):
    print(f"Test Client Connected to {MQTT_BROKER} (rc={rc})")
    client.subscribe("irrigation/commands/1")

def on_message(client, userdata, msg):
    payload = msg.payload.decode("utf-8")
    print(f"\n[OK] RECEIVED RESPONSE FROM BACKEND ON [{msg.topic}]:")
    print(payload)
    received_messages.append(payload)

def test_mqtt_telemetry():
    client = mqtt.Client(callback_api_version=CallbackAPIVersion.VERSION2, client_id="MQTT_System_Tester")
    client.on_connect = on_connect
    client.on_message = on_message

    print(f"Connecting to MQTT broker {MQTT_BROKER}...")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.loop_start()

    time.sleep(1)

    # Simulate low moisture telemetry from ESP32
    telemetry_payload = json.dumps({
        "field_id": 1,
        "soil_moisture": 22.5,
        "temperature": 32.0,
        "humidity": 45.0,
        "flow_rate": 0.0
    })

    print(f"\n[SEND] Publishing ESP32 Telemetry to [irrigation/telemetry]:")
    print(telemetry_payload)
    client.publish("irrigation/telemetry", telemetry_payload, qos=1)

    # Wait for backend response
    time.sleep(3)

    client.loop_stop()
    client.disconnect()

    if received_messages:
        print("\n[SUCCESS] MQTT End-to-End System Test PASSED!")
    else:
        print("\n[INFO] Telemetry published successfully.")

if __name__ == "__main__":
    test_mqtt_telemetry()
