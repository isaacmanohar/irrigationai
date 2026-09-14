"""
MQTT Simulator — ESP32 test publisher.

Simulates an ESP32 device publishing sensor telemetry so the backend
MQTT subscriber can be tested without physical hardware.

Usage (from backend/ directory):
    python mqtt_simulator.py [field_id] [count] [interval_s]

Examples:
    python mqtt_simulator.py          # field 1, 10 messages, 2s apart
    python mqtt_simulator.py 1 30 5   # field 1, 30 messages, 5s apart

This script is NOT imported by the production application.
"""

import json
import random
import sys
import time
import os

import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion

# ── Configuration (mirrors mqtt_service.py defaults) ──────────────────────────
BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "broker.hivemq.com")
BROKER_PORT  = int(os.getenv("MQTT_BROKER_PORT", "1883"))
TOPIC        = os.getenv("MQTT_TOPIC_TELEMETRY", "irrigation/telemetry")
USERNAME     = os.getenv("MQTT_USERNAME") or None
PASSWORD     = os.getenv("MQTT_PASSWORD") or None

# ── Simulated sensor baseline ─────────────────────────────────────────────────
BASELINE = {
    "soil_moisture": 38.0,
    "temperature":   28.0,
    "humidity":      62.0,
    "flow_rate":      0.0,
}

def _jitter(value: float, pct: float = 5.0) -> float:
    """Add ±pct% random noise to a value."""
    delta = value * (pct / 100.0)
    return round(value + random.uniform(-delta, delta), 2)


def simulate_reading(field_id: int, step: int) -> dict:
    """
    Generate a realistic sensor reading.
    Every 5th step the soil moisture drops slightly to simulate drying.
    Every 3rd step simulates pump flow if soil moisture is low.
    """
    moisture = _jitter(BASELINE["soil_moisture"] - step * 0.5, pct=3)
    moisture = max(10.0, min(100.0, moisture))

    flow = 0.0
    if moisture < 30:
        flow = round(random.uniform(0.8, 2.5), 2)  # pump running

    return {
        "field_id":     field_id,
        "soil_moisture": moisture,
        "temperature":   _jitter(BASELINE["temperature"], pct=4),
        "humidity":      _jitter(BASELINE["humidity"],    pct=5),
        "flow_rate":     flow,
    }


def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"[simulator] Connected to {BROKER_HOST}:{BROKER_PORT}")
    else:
        print(f"[simulator] Connection failed rc={rc}")


def on_publish(client, userdata, mid, reason_code=None, properties=None):
    print(f"[simulator] Message published (mid={mid})")


def main():
    field_id   = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    count      = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    interval_s = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0

    print(f"[simulator] Publishing {count} readings for field_id={field_id} "
          f"every {interval_s}s → topic={TOPIC}")

    client = mqtt.Client(
        callback_api_version=CallbackAPIVersion.VERSION2,
        client_id=f"IrrigationAI_Simulator_{field_id}",
    )
    if USERNAME and PASSWORD:
        client.username_pw_set(USERNAME, PASSWORD)

    client.on_connect = on_connect
    client.on_publish = on_publish

    try:
        client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)
    except Exception as exc:
        print(f"[simulator] ERROR: Could not connect — {exc}")
        sys.exit(1)

    client.loop_start()
    time.sleep(1)  # let connect settle

    for step in range(count):
        payload = simulate_reading(field_id, step)
        json_str = json.dumps(payload)
        result = client.publish(TOPIC, json_str, qos=1)
        print(f"[simulator] [{step+1}/{count}] → {json_str}  rc={result.rc}")
        time.sleep(interval_s)

    client.loop_stop()
    client.disconnect()
    print("[simulator] Done.")


if __name__ == "__main__":
    main()
