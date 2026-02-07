import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "secondsemdashb-firebase-adminsdk-fbsvc-574ee6bf41.json")

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        print(f'Deleting doc {doc.id} => {doc.to_dict()}')
        doc.reference.delete()
        deleted += 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

def purge_data():
    if not os.path.exists(CRED_PATH):
        print(f"Error: Credentials not found at {CRED_PATH}")
        return

    if not firebase_admin._apps:
        cred = credentials.Certificate(CRED_PATH)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()

    print("⚠️  PURGING FIREBASE COLLECTIONS...")
    
    print("Purging 'todos'...")
    delete_collection(db.collection('todos'), 100)
    
    print("Purging 'assignments'...")
    delete_collection(db.collection('assignments'), 100)
    
    print("✅ Purge Complete.")

if __name__ == "__main__":
    confirm = input("Are you sure you want to DELETE ALL DATA in Firebase? (yes/no): ")
    if confirm.lower() == "yes":
        purge_data()
    else:
        print("Operation cancelled.")
