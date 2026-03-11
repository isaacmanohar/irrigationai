import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def register_and_monitor():
    test_phone = "+918639975947"
    test_email = f"test_{int(time.time())}@farmer.com"
    
    registration_data = {
        "name": "Validation User",
        "email": test_email,
        "password": "testpassword123",
        "phone_number": test_phone,
        "village": "Kadapa",
        "preferred_language": "English"
    }
    
    print(f"--- Registering new user with phone: {test_phone} ---")
    try:
        response = requests.post(
            f"{BASE_URL}/farmers/register",
            json=registration_data,
            timeout=15
        )
        
        print(f"Registration Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Registration successful!")
            print("Response:", response.json())
            print("\nSince the onboarding call is triggered via background_tasks, it should reach the farmer shortly.")
            print("Check the server logs or Twilio dashboard for the call initiation.")
        else:
            print(f"✗ Registration failed: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"✗ Error during registration: {e}")

if __name__ == "__main__":
    register_and_monitor()
