import smtplib
import json
import re
import datetime
import os
from email.mime.text import MIMEText
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "deadline.upcoming@gmail.com"
SENDER_PASSWORD = os.environ.get("EMAIL_PASSWORD", "wyqf nwmj ujsz yvxc") # Use env var if available
RECEIVER_EMAIL = "Alexander.Barkas@queensu.ca"
NOTICE_DAYS = 3

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "secondsemdashb-firebase-adminsdk-fbsvc-574ee6bf41.json")

def log(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # PRINT TO CONSOLE for GitHub Actions visibility
    print(f"[{timestamp}] {msg}")
    try:
        with open(os.path.join(SCRIPT_DIR, "email_debug.log"), "a") as f:
            f.write(f"[{timestamp}] {msg}\n")
    except Exception as e:
        print(f"Log Error: {e}")

def get_database_data():
    try:
        log("Connecting to Firebase...")
        
        # Check if credential file exists and has content
        if os.path.exists(CRED_PATH):
            size = os.path.getsize(CRED_PATH)
            log(f"Credential file found at {CRED_PATH}. Size: {size} bytes.")
            if size == 0:
                log("ERROR: Credential file is empty!")
        else:
            log(f"WARNING: Credential file NOT found at {CRED_PATH}")

        if not firebase_admin._apps:
            if os.path.exists(CRED_PATH):
                 try:
                    cred = credentials.Certificate(CRED_PATH)
                    firebase_admin.initialize_app(cred)
                    log("Firebase initialized with Certificate.")
                 except Exception as e:
                    log(f"CRITICAL ERROR initializing Firebase Certificate: {e}")
                    raise e
            else:
                # If running in GitHub Actions, secrets might be handling this differently 
                # or we expect the file to be created by the workflow
                log(f"WARNING: No credential file. Attempting default initialization (Workload Identity/Env Vars)...")
                firebase_admin.initialize_app()
        
        db = firestore.client()
        log("Firestore client initialized.")
        
        # Fetch Assignments (Collection)
        try:
            assignments_ref = db.collection('assignments')
            assignments = [doc.to_dict() for doc in assignments_ref.stream()]
            log(f"Fetched {len(assignments)} assignments.")
        except Exception as e:
            log(f"Error fetching assignments: {e}")
            assignments = []
        
        # Fetch Todos (Collection)
        try:
            todos_ref = db.collection('todos')
            todos = [doc.to_dict() for doc in todos_ref.stream()]
            log(f"Fetched {len(todos)} todos.")
            
            # DEBUG: Print all todos to see what we have
            log("--- RAW TODOS DUMP ---")
            for t in todos:
                title = t.get('title', 'Unknown')
                tid = t.get('id', 'No ID')
                log(f"ID: {tid} | Title: {title} | Completed: {t.get('completed', 'N/A')}")
            log("----------------------")
        except Exception as e:
             log(f"Error fetching todos: {e}")
             todos = []
             
        return assignments, todos

    except Exception as e:
        log(f"[FIREBASE CRITICAL ERROR] {e}")
        # Return empty lists on failure to prevent crash, but log heavily
        return [], []

def format_date_display(date_str):
    if not date_str: return "N/A"
    try:
        d = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        # Format: "Mon, Jan 01"
        return d.strftime("%a, %b %d")
    except:
        return date_str

def check_deadlines_and_email():
    log(f"Starting check (Firebase Mode). Notice Days: {NOTICE_DAYS}")
    
    assignments, todos = get_database_data()
    
    today = datetime.date.today()
    upcoming_assignments = []
    overdue_assignments = []
    upcoming_todos = []

    # 1. Process Assignments
    for assign in assignments:
        # Robust status check
        status = assign.get('status', 'PENDING')
        if status == 'DONE':
            continue
            
        try:
            # Handle potential missing date
            date_str = assign.get('date')
            if not date_str: continue
            
            due_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
            delta = (due_date - today).days
            
            if delta < 0:
                overdue_assignments.append(assign)
            elif 0 <= delta <= NOTICE_DAYS:
                upcoming_assignments.append(assign)
        except ValueError:
            continue

    # 2. Process Todos (Simple filter)
    for todo in todos:
        if not todo.get('completed', False):
             upcoming_todos.append(todo)

    count_overdue = len(overdue_assignments)
    count_upcoming = len(upcoming_assignments)
    count_todos = len(upcoming_todos)

    log(f"Filtered: {count_overdue} overdue, {count_upcoming} upcoming, and {count_todos} pending tasks.")

    if count_overdue == 0 and count_upcoming == 0 and count_todos == 0:
        log("Nothing to report. No email sent.")
        return

    # --- COMPOSE EMAIL ---
    msg = MIMEMultipart()
    msg['From'] = f"Deadlines <{SENDER_EMAIL}>"
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = f"Daily Update: {count_overdue} Overdue, {count_upcoming} Upcoming, {count_todos} To-Dos"

    # HTML Body Construction
    body = """
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212; color: #e0e0e0; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1e1e1e; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            .header { background-color: #1e1e1e; padding: 30px; text-align: center; border-bottom: 1px solid #333; }
            .header h1 { margin: 0; font-size: 24px; color: #ffffff; }
            .header p { margin: 5px 0 0; color: #aaaaaa; font-size: 14px; }
            .content { padding: 20px; }
            .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #bbbbbb; margin: 25px 0 10px; border-left: 3px solid #bbbbbb; padding-left: 10px; }
            .section-title.overdue { color: #ff5252; border-left-color: #ff5252; }
            .section-title.upcoming { color: #64b5f6; border-left-color: #64b5f6; }
            .section-title.todo { color: #69f0ae; border-left-color: #69f0ae; }
            
            .card { background-color: #252525; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid transparent; }
            .card.overdue { border-left-color: #d32f2f; background-color: #2b1d1d; }
            .card.upcoming { border-left-color: #1976d2; }
            .card.todo { border-left-color: #00c853; }
            
            .card-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; display: flex; justify-content: space-between; }
            .card-meta { font-size: 12px; color: #888888; }
            
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-right: 5px; }
            .badge-overdue { background-color: #d32f2f; color: white; }
            
            .footer { text-align: center; padding: 20px; color: #666666; font-size: 11px; border-top: 1px solid #333; }
            .empty-state { font-style: italic; color: #666; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Daily Agenda</h1>
                <p>""" + datetime.date.today().strftime("%A, %B %d") + """</p>
            </div>
            <div class="content">
    """

    # Overdue Section
    if overdue_assignments:
        body += '<div class="section-title overdue">🚨 Overdue Assignments</div>'
        for item in overdue_assignments:
            d_str = item.get('date', 'N/A')
            display_date = format_date_display(d_str)
            course = item.get('course', 'General')
            title = item.get('title', 'Untitled')
            
            body += f"""
            <div class="card overdue">
                <div class="card-title">
                    <span><span class="badge badge-overdue">LATE</span> {course} - {title}</span>
                    <span style="font-weight:normal; color:#ff8a80; font-size:12px;">{display_date}</span>
                </div>
            </div>
            """

    # Upcoming Section
    if upcoming_assignments:
        body += '<div class="section-title upcoming">🗓 Upcoming Deadlines</div>'
        for item in upcoming_assignments:
            d_str = item.get('date', 'N/A')
            display_date = format_date_display(d_str)
            course = item.get('course', 'General')
            title = item.get('title', 'Untitled')
            
            body += f"""
            <div class="card upcoming">
                <div class="card-title">
                    <span>{course} - {title}</span>
                    <span style="font-weight:normal; font-size:12px;">{display_date}</span>
                </div>
            </div>
            """
    
    if not upcoming_assignments and not overdue_assignments:
         body += '<div class="empty-state">No upcoming assignments for the next 3 days.</div>'

    # Todo Section
    if upcoming_todos:
        body += '<div class="section-title todo">✅ To-Do List</div>'
        for item in upcoming_todos:
            title = item.get('title', 'Untitled')
            course = item.get('course', 'Personal')
            body += f"""
            <div class="card todo">
                <div class="card-title">{title}</div>
                <div class="card-meta">{course}</div>
            </div>
            """
    elif not upcoming_assignments and not overdue_assignments:
        body += '<div class="card todo" style="border-left-color:#444;"><div class="card-title">✨ All caught up!</div></div>'

    body += """
            <div class="footer">
                <p>Stay focused.</p>
            </div>
        </div>
    </body>
    </html>
    """

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
        log("Email sent successfully!")
    except Exception as e:
        log(f"Failed to send email: {e}")

if __name__ == "__main__":
    check_deadlines_and_email()
