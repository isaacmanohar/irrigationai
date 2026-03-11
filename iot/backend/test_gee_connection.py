import ee
import os
from dotenv import load_dotenv

load_dotenv()

def test_gee():
    service_account = os.getenv("GEE_SERVICE_ACCOUNT")
    private_key_path = os.getenv("GEE_PRIVATE_KEY_PATH")
    project_id = os.getenv("GEE_PROJECT_ID")

    results = []
    results.append(f"Testing GEE with:")
    results.append(f"Project: {project_id}")
    results.append(f"Account: {service_account}")
    results.append(f"Key Path: {private_key_path}")

    try:
        credentials = ee.ServiceAccountCredentials(service_account, private_key_path)
        ee.Initialize(credentials, project=project_id)
        results.append("SUCCESS: Google Earth Engine initialized!")
        
        # Test a simple query
        image = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20230101T050211_20230101T050210_T44VLR')
        results.append(f"Test Image ID: {image.get('system:id').getInfo()}")
    except Exception as e:
        results.append(f"FAILED: {str(e)}")

    with open("gee_test_clean.log", "w", encoding="utf-8") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    test_gee()
