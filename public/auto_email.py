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
SENDER_EMAIL = "deadline.upcoming@gmail.com"
SENDER_PASSWORD = "wyqf nwmj ujsz yvxc"  # NOT your login password
RECEIVER_EMAIL = "23KKV9@queensu.ca"

# Determine absolute path to db.json (same directory as this script)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "db.json")
# 3 Days in advance
NOTICE_DAYS = 3

def load_database(file_path):
    """
    Loads assignments and todos from db.json
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except Exception as e:
        print(f"Error loading database: {e}")
        return {"assignments": [], "todos": []}

def check_deadlines_and_email():
    # Setup logging
    log_file = os.path.join(SCRIPT_DIR, "email_debug.log")
    
    def log(message):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {message}\n")
        print(message)

    log(f"Starting check. Notice Days: {NOTICE_DAYS}")
    log(f"DB File Path: {DB_FILE}")
    
    if not os.path.exists(DB_FILE):
        log(f"❌ ERROR: Database file not found at {DB_FILE}")
        return

    db = load_database(DB_FILE)
    assignments = db.get('assignments', [])
    todos = db.get('todos', [])
    
    today = datetime.date.today()
    
    upcoming_assignments = []
    upcoming_todos = []
    
    # Check Assignments
    for assign in assignments:
        if assign.get('status') == 'DONE':
            continue
            
        try:
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
    log(f"Found {len(upcoming_assignments)} assignments and {len(upcoming_todos)} tasks.")
    
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
        log("CONFIGURATION REQUIRED: SENDER_EMAIL not set.")
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
