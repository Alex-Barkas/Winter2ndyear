import json
import datetime
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, "db.json")

def cleanup_db():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    with open(DB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    assignments = data.get('assignments', [])
    today = datetime.date.today()
    
    updated_count = 0
    
    for assign in assignments:
        date_str = assign.get('date')
        status = assign.get('status', 'PENDING')
        
        if date_str and status != 'DONE':
            try:
                due_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
                if due_date < today:
                    assign['status'] = 'DONE'
                    updated_count += 1
                    print(f"Marked as DONE: {assign.get('course')} - {assign.get('title')} (Due: {date_str})")
            except ValueError:
                continue

    if updated_count > 0:
        with open(DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        print(f"\nSuccessfully marked {updated_count} past assignments as DONE.")
    else:
        print("\nNo past 'PENDING' assignments found.")

if __name__ == "__main__":
    cleanup_db()
