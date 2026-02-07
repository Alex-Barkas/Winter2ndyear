import json
import os

key_file = "public/secondsemdashb-firebase-adminsdk-fbsvc-574ee6bf41.json"

if os.path.exists(key_file):
    with open(key_file) as f:
        data = json.load(f)
        print(f"Key File Project ID: {data.get('project_id')}")
else:
    print("Project Key File Not Found")
