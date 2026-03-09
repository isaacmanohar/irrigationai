#!/usr/bin/env python3
"""
Test script to verify the voice API field area collection flow.
This simulates the Twilio webhook calls for field area collection.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_field_area_flow():
    """Test the complete field area collection flow"""
    print("Testing Voice API Field Area Collection Flow")
    print("=" * 60)
    
    # First, let's get a farmer ID to test with
    try:
        # Get farmer details
        farmer_response = requests.get(f"{BASE_URL}/farmers/")
        if farmer_response.status_code == 200:
            farmers = farmer_response.json()
            if farmers:
                farmer_id = farmers[0]["id"]
                farmer_phone = farmers[0]["phone_number"]
                print(f"Using farmer ID: {farmer_id}, Phone: {farmer_phone}")
            else:
                print("No farmers found in database")
                return
        else:
            print(f"Error getting farmers: {farmer_response.status_code}")
            return
    except Exception as e:
        print(f"Error: {e}")
        return
    
    # Test 1: Check if ask-field-area endpoint exists
    print("\n1. Testing /ask-field-area endpoint...")
    test_data = {
        "To": farmer_phone,
        "From": "+1234567890",
        "Digits": ""  # No digits for speech input
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/voice/ask-field-area",
            data=test_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type', 'unknown')}")
        
        if response.status_code == 200:
            print("   ✓ ask-field-area endpoint is working")
            # Check if it returns TwiML
            content = response.text
            if "Gather" in content and "speech" in content:
                print("   ✓ Returns proper TwiML with speech input")
            else:
                print("   ⚠ Response may not be proper TwiML")
        else:
            print(f"   ✗ ask-field-area endpoint failed: {response.text[:100]}")
    except Exception as e:
        print(f"   ✗ Error testing ask-field-area: {e}")
    
    # Test 2: Test save-field-area endpoint with sample data
    print("\n2. Testing /save-field-area endpoint...")
    
    # Test cases for different units
    test_cases = [
        ("2 acres", 2 * 0.404686),
        ("3 bigha", 3 * 0.25),
        ("5 hectares", 5),
        ("2 एकड़", 2 * 0.404686),
    ]
    
    for speech_text, expected_hectares in test_cases:
        test_data = {
            "To": farmer_phone,
            "From": "+1234567890",
            "SpeechResult": speech_text
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/voice/save-field-area",
                data=test_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                print(f"   ✓ '{speech_text}' -> {expected_hectares:.2f} hectares: Status {response.status_code}")
                content = response.text
                if str(round(expected_hectares, 2)) in content:
                    print(f"     ✓ Correctly mentions {round(expected_hectares, 2)} hectares in response")
                if "ask-stage" in content:
                    print(f"     ✓ Correctly redirects to ask-stage endpoint")
            else:
                print(f"   ✗ '{speech_text}': Status {response.status_code}")
        except Exception as e:
            print(f"   ✗ Error with '{speech_text}': {e}")
    
    # Test 3: Verify the flow order
    print("\n3. Testing complete flow order...")
    print("   Expected flow: language-selection → save-language → ask-location → save-location → ask-crop → save-crop → ask-field-area → save-field-area → ask-stage → save-stage")
    
    # Check the voice.py file to confirm flow
    try:
        with open("app/api/voice.py", "r", encoding="utf-8") as f:
            content = f.read()
            
        endpoints = [
            "language-selection",
            "save-language", 
            "ask-location",
            "save-location",
            "ask-crop",
            "save-crop",
            "ask-field-area",
            "save-field-area",
            "ask-stage",
            "save-stage"
        ]
        
        missing = []
        for endpoint in endpoints:
            if f"/{endpoint}" in content:
                print(f"   ✓ {endpoint} endpoint found")
            else:
                print(f"   ✗ {endpoint} endpoint NOT found")
                missing.append(endpoint)
        
        if missing:
            print(f"\n   Warning: Missing endpoints: {missing}")
        else:
            print(f"\n   ✓ All endpoints are implemented")
            
    except Exception as e:
        print(f"   ✗ Error reading voice.py: {e}")
    
    # Test 4: Check database field after hypothetical save
    print("\n4. Checking database structure...")
    try:
        import sqlite3
        conn = sqlite3.connect("irrigation.db")
        cursor = conn.cursor()
        
        # Check if field_area column exists
        cursor.execute("PRAGMA table_info(fields)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "field_area" in columns:
            print("   ✓ field_area column exists in fields table")
            
            # Check current field area value
            cursor.execute("SELECT field_area FROM fields WHERE farmer_id = ?", (farmer_id,))
            result = cursor.fetchone()
            if result:
                current_area = result[0]
                print(f"   Current field area in database: {current_area} hectares")
            else:
                print("   No field area data found for this farmer")
        else:
            print("   ✗ field_area column NOT found in fields table")
        
        conn.close()
    except Exception as e:
        print(f"   ✗ Error checking database: {e}")
    
    print("\n" + "=" * 60)
    print("Field Area Collection Flow Test Complete")
    print("\nSummary:")
    print("- Field area is collected AFTER crop selection")
    print("- Farmers can specify area in acres, bigha, or hectares")
    print("- System converts to hectares for storage")
    print("- Flow continues to growth stage selection after field area")
    print("\nTo test the actual voice call:")
    print("1. Register a farmer through the frontend")
    print("2. Trigger onboarding call via API: POST /api/v1/voice/onboarding/{farmer_id}")
    print("3. The call will ask for language → location → crop → field area → growth stage")

if __name__ == "__main__":
    test_field_area_flow()