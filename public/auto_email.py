import smtplib
import json
import re
import datetime
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ==========================================
# CONFIGURATION
# ==========================================
# 1. Enable "Less Secure Apps" or (better) generate an "App Password" for your email.
#    For Gmail: Account Settings > Security > 2-Step Verification > App Passwords.
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
# --- CONFIGURATION ---
SENDER_EMAIL = "deadline.upcoming@gmail.com"
SENDER_PASSWORD = "wyqf nwmj ujsz yvxc"
RECEIVER_EMAIL = "23KKV9@queensu.ca"
NOTICE_DAYS = 3

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "serviceAccountKey.json")

# --- DATABASE LOADER (Firebase) ---
def get_database_data():
    try:
        # Initialize only if not already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)

        db = firestore.client()

        assignments = []
        todos = []

        # Fetch Assignments
        docs = db.collection('assignments').stream()
        for doc in docs:
            assignments.append(doc.to_dict())

        # Fetch Todos
        docs = db.collection('todos').stream()
        for doc in docs:
            todos.append(doc.to_dict())

        return assignments, todos

    except Exception as e:
        print(f"Firebase Error: {e}")
        # Log to file if possible
        with open(os.path.join(SCRIPT_DIR, "email_debug.log"), "a") as f:
            f.write(f"[FIREBASE ERROR] {e}\n")
        return [], []

def check_deadlines_and_email():
    # Setup logging
    log_file = os.path.join(SCRIPT_DIR, "email_debug.log")

    def log(message):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {message}\n")
        print(message)

    log(f"Starting check (Firebase Mode). Notice Days: {NOTICE_DAYS}")

    if not os.path.exists(CRED_PATH):
        log(f"❌ ERROR: Service Account Key not found at {CRED_PATH}")
        return

    assignments, todos = get_database_data()

    today = datetime.date.today()

    upcoming_assignments = []
    upcoming_todos = []

    # Check Assignments
    for assign in assignments:
        if assign.get('status') == 'DONE':
            continue

        try:
            # Handle potential missing date
            if not assign.get('date'): continue

            due_date = datetime.datetime.strptime(assign['date'], "%Y-%m-%d").date()
            delta = (due_date - today).days

            if 0 <= delta <= NOTICE_DAYS:
                upcoming_assignments.append(assign)
        except ValueError:
            continue # Skip invalid dates (TBD)

    # Check Todos
    # Include ALL pending todos
    for todo in todos:
        if todo.get('completed', False):
            continue
        upcoming_todos.append(todo)

    total_count = len(upcoming_assignments) + len(upcoming_todos)

    # Always log count
    log(f"Found {len(upcoming_assignments)} upcoming assignments and {len(upcoming_todos)} pending tasks.")

    # Prepare Email
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = f"Daily Update: {len(upcoming_assignments)} Assignments, {len(upcoming_todos)} To-Dos"

    body = "<h2>Daily Overview</h2>"

    # Assignments Section
    body += "<h3>Upcoming Deadlines (Next 3 Days)</h3>"
    if upcoming_assignments:
        body += "<ul>"
        for item in upcoming_assignments:
            d_str = item['date']
            # Highlight if TODAY
            if d_str == str(today):
                d_str = "<strong>TODAY</strong>"
            body += f"<li>{d_str}: <strong>{item['course']} - {item['title']}</strong> (Status: {item.get('status', 'PENDING')})</li>"
        body += "</ul>"
    else:
        body += "<p><em>No assignments due in the next 3 days.</em></p>"

    # To-Do Section (All Pending)
    body += "<h3>To-Do List</h3>"
    if upcoming_todos:
        body += "<ul>"
        for item in upcoming_todos:
            d_str = item.get('date', 'No Date')
            # Highlight if TODAY
            if d_str == str(today):
                d_str = "<strong>TODAY</strong>"
            body += f"<li>{d_str}: <strong>{item['title']}</strong> ({item.get('course', 'Personal')})</li>"
        body += "</ul>"
    else:
        body += "<p><em>No active items in To-Do list.</em></p>"

    body += "<p style='margin-top:20px; color:#555;'>Good luck! You got this.</p>"

    msg.attach(MIMEText(body, 'html'))

    # Send
    if "your_email" in SENDER_EMAIL:
        log("CONFIGURATION REQUIRED: SENDER_EMAIL not set inside auto_email.py")
        return

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, text)
        server.quit()
        log("✅ Email sent successfully!")
    except Exception as e:
        log(f"❌ Failed to send email: {e}")

if __name__ == "__main__":
    check_deadlines_and_email()
