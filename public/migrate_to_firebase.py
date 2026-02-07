import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import time

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "secondsemdashb-firebase-adminsdk-fbsvc-574ee6bf41.json")
DB_PATH = os.path.join(SCRIPT_DIR, "db.json")

def upload_data():
    if not os.path.exists(CRED_PATH):
        print(f"Error: Credentials not found at {CRED_PATH}")
        return

    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    # Initialize Firebase
    if not firebase_admin._apps:
        cred = credentials.Certificate(CRED_PATH)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()

    # Read Local Data
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    assignments = data.get('assignments', [])
    todos = data.get('todos', [])

    print(f"Found {len(assignments)} assignments and {len(todos)} todos to upload.")

    # Upload Assignments
    batch = db.batch()
    count = 0
    BATCH_LIMIT = 400 

    print("Uploading Assignments...")
    for item in assignments:
        doc_ref = db.collection('assignments').document(item['id'])
        batch.set(doc_ref, item)
        count += 1
        
        if count >= BATCH_LIMIT:
            batch.commit()
            batch = db.batch()
            count = 0
            print("  Batch committed.")

    if count > 0:
        batch.commit()
    print("Assignments uploaded.")

    # Upload Todos
    print("Uploading Todos...")
    batch = db.batch()
    count = 0
    for item in todos:
        doc_id = item.get('id', str(int(time.time()*1000)))
        doc_ref = db.collection('todos').document(doc_id)
        batch.set(doc_ref, item)
        count += 1
        
        if count >= BATCH_LIMIT:
            batch.commit()
            batch = db.batch()
            count = 0
    
    if count > 0:
        batch.commit()
    print("Todos uploaded.")
    
    print("\n✅ Migration Complete!")

if __name__ == "__main__":
    upload_data()
