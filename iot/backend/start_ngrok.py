
import subprocess
import time
import re
import os

def start_ngrok():
    print("Starting ngrok...")
    # Start ngrok in a subprocess
    # Note: Use -log=stdout to capture the output
    # Since we want to update .env, we'll keep it running if possible, but 
    # we'll just extract the URL first
    
    # We'll use the ngrok log file mentioned in the previous steps
    # Or just capture output here
    try:
        # Start ngrok and capture output
        # Use -log=stdout and -log-format=term for easier parsing or just let it write to a file
        process = subprocess.Popen(['ngrok', 'http', '8000', '--log=stdout'],
                                 stdout=subprocess.PIPE,
                                 stderr=subprocess.STDOUT,
                                 text=True)
        
        # Wait for the URL to appear
        url = None
        start_time = time.time()
        while time.time() - start_time < 30: # 30s timeout
            line = process.stdout.readline()
            if not line:
                break
            print(f"ngrok: {line.strip()}")
            # Look for msg="started tunnel" and extract url
            match = re.search(r'url=(https://[a-zA-Z0-9.-]+\.ngrok-free\.app)', line)
            if match:
                url = match.group(1)
                print(f"✓ Found ngrok URL: {url}")
                # We can't exit the process if we want the tunnel to stay alive
                # But we can't block here forever either
                # On Windows, we'll let it handle the process in the background
                break
        
        return url, process
    except Exception as e:
        print(f"Error starting ngrok: {e}")
        return None, None

if __name__ == "__main__":
    url, proc = start_ngrok()
    if url:
        # Update .env file
        env_path = r'd:\iot\iot-day2\iot\iot\backend\.env'
        with open(env_path, 'r') as f:
            lines = f.readlines()
        
        with open(env_path, 'w') as f:
            for line in lines:
                if line.startswith('BASE_URL='):
                    f.write(f'BASE_URL={url}\n')
                else:
                    f.write(line)
        print(f"✓ Updated .env BASE_URL to {url}")
        
        # Keep process running for a bit to ensure it stays alive or just let it be a child (it might die)
        # Better: run ngrok as a separate task in the background
    else:
        print("✗ Could not find ngrok URL.")
