import requests
import json

url = "http://localhost:8000/api/v1/sensors/data"
payload = {
    "field_id": 7,
    "soil_moisture": 32.5,
    "temperature": 29.1,
    "humidity": 62.0,
    "flow_rate": 0.5
}

print(f"Sending request to {url}...")
try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
