
import requests

BASE_URL = "http://localhost:8000/api/v1/voice"

print("--- TESTING VOICE ENDPOINTS ---")

def test_endpoint(path, data=None):
    url = f"{BASE_URL}{path}"
    print(f"Testing {url}...", end=" ")
    try:
        if data:
            r = requests.post(url, data=data)
        else:
            r = requests.post(url)
        print(f"[{r.status_code}]")
        if r.status_code != 200:
            print(f"RESPONSE: {r.text[:200]}")
    except Exception as e:
        print(f"ERROR: {e}")

# test_endpoint("/onboarding/1") # Triggers actual call, skip
test_endpoint("/language-selection")
test_endpoint("/save-language", {"Digits": "1", "To": "919502042442"})
test_endpoint("/ask-location", {"To": "919502042442"})
test_endpoint("/save-location", {"To": "919502042442", "SpeechResult": "Hyderabad"})
test_endpoint("/ask-crop", {"To": "919502042442"})
test_endpoint("/save-crop", {"Digits": "1", "To": "919502042442"})
test_endpoint("/ask-field-area", {"To": "919502042442"})
test_endpoint("/save-field-area", {"To": "919502042442", "SpeechResult": "5 acres"})
print("--- DONE ---")
