import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "secondsemdashb-firebase-adminsdk-fbsvc-574ee6bf41.json")

def list_collections():
    if not os.path.exists(CRED_PATH):
        print(f"Error: Credentials not found at {CRED_PATH}")
        return

    if not firebase_admin._apps:
        cred = credentials.Certificate(CRED_PATH)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    collections = db.collections()
    
    print("\n--- FIRESTORE COLLECTIONS ---")
    found = False
    for coll in collections:
        found = True
        docs = [d for d in coll.limit(5).stream()]
        print(f"📂 Collection: {coll.id} ({len(docs)} sample docs)")
        for d in docs:
            print(f"   - Doc ID: {d.id} | Data keys: {list(d.to_dict().keys())}")
            if coll.id == 'todos':
                print(f"     Title: {d.to_dict().get('title')}")
    
    if not found:
        print("No collections found.")
    print("-----------------------------\n")

if __name__ == "__main__":
    list_collections()
