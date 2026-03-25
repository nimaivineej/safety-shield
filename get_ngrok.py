import requests
import os

try:
    response = requests.get('http://localhost:4040/api/tunnels')
    data = response.json()
    url = data['tunnels'][0]['public_url']
    print(f"NGROK_URL={url}")
except Exception as e:
    print(f"ERROR: {str(e)}")
