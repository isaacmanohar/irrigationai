
import os
import sys
import json
import logging

# Add the backend to path
sys.path.append(r'd:\iot\iot-day2\iot\iot\backend')

from dotenv import load_dotenv
load_dotenv(r'd:\iot\iot-day2\iot\iot\backend\.env')

# Configure logging to see what's happening
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def debug_gee_init():
    print("--- GEE INITIALIZATION DEBUG ---")
    
    project_id = os.getenv("GEE_PROJECT_ID")
    service_account = os.getenv("GEE_SERVICE_ACCOUNT")
    private_key_path = os.getenv("GEE_PRIVATE_KEY_PATH")
    
    # Path is usually relative to backend dir in .env
    # We are in backend dir, so ./gee-key.json should work if it exists there
    abs_private_key_path = os.path.abspath(private_key_path) if private_key_path else None
    
    print(f"Project ID: {project_id}")
    print(f"Service Account: {service_account}")
    print(f"Private Key Path (from .env): {private_key_path}")
    print(f"Absolute Key Path: {abs_private_key_path}")
    
    if not abs_private_key_path or not os.path.exists(abs_private_key_path):
        print(f"ERROR: Private key file not found at {abs_private_key_path}")
        return

    try:
        import ee
        print(f"EE Version: {ee.__version__}")
        
        print("Step 1: Attempting to initialize with Service Account...")
        credentials = ee.ServiceAccountCredentials(service_account, abs_private_key_path)
        ee.Initialize(credentials, project=project_id)
        
        print("✓ SUCCESS: GEE Initialized!")
        
        # Try a simple connection test that doesn't depend on a specific image ID
        print("Step 2: Testing connection with simple operations...")
        
        # 1. Print current project
        # 2. Try to list a known public dataset (Sentinel-2 usually works better as a collection query)
        col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').limit(1)
        count = col.size().getInfo()
        
        if count > 0:
            print(f"✓ SUCCESS: Collection count: {count}")
            print("✓ FULL SUCCESS: Google Earth Engine is working!")
        else:
            print("⚠ WARNING: Collection size 0 or query failed.")
        
    except ImportError:
        print("ERROR: earthengine-api not installed")
    except Exception as e:
        print(f"FAILED: Initialization/Test error: {str(e)}")
        # Print stack trace if needed
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_gee_init()
