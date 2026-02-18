import smtplib
import json
import re
import datetime
import os
import sys
import threading
import socket
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Set global socket timeout to prevent indefinite hangs
# This needs to be high enough for SSL handshakes but low enough to catch hangs
socket.setdefaulttimeout(60)

# Fix for potential gRPC hangs in GitHub Actions
os.environ["GRPC_DNS_RESOLVER"] = "native"

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "deadline.upcoming@gmail.com"
SENDER_PASSWORD = os.environ.get("EMAIL_PASSWORD", "wyqf nwmj ujsz yvxc") # Use env var if available
RECEIVER_EMAIL = os.environ.get("RECEIVER_EMAIL", "alex.barkas@queensu.ca")
NOTICE_DAYS = 3

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def log(msg):
    """Log to console (seen in GitHub Actions) and local file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")
    sys.stdout.flush() # Force output to appear immediately in GitHub Actions
    try:
        with open(os.path.join(SCRIPT_DIR, "email_debug.log"), "a", encoding='utf-8') as f:
            f.write(f"[{timestamp}] {msg}\n")
    except Exception as e:
        print(f"Log Error: {e}")

def get_with_timeout(query_ref, timeout_sec=30):
    """Wraps a Firestore query.get() call in a thread to enforce strict timeout."""
    result_container = {}
    
    def target():
        try:
            result_container['data'] = query_ref.get()
        except Exception as e:
            result_container['error'] = e

    t = threading.Thread(target=target)
    t.daemon = True
    t.start()
    t.join(timeout_sec)

    if t.is_alive():
        raise TimeoutError(f"Operation timed out after {timeout_sec} seconds (Force Stop)")
    
    if 'error' in result_container:
        raise result_container['error']
        
    return result_container.get('data', [])

def get_database_data():
    """Fetch assignments and todos from Firestore with timeouts."""
    assignments = []
    todos = []
    
    try:
        log("Connecting to Firebase...")
        
        # Initialize with default credentials
        if not firebase_admin._apps:
            try:
                firebase_admin.initialize_app()
                log("Firebase initialized (using default credentials/env var).")
            except Exception as e:
                log(f"CRITICAL ERROR initializing Firebase: {e}")
                # We can't proceed without DB access
                raise e
        
        db = firestore.client()
        log("Firestore client initialized.")
        
        # Fetch Assignments
        try:
            log("Fetching assignments (with 30s timeout)...")
            assignments_ref = db.collection('assignments')
            
            # Use threaded timeout wrapper
            docs = get_with_timeout(assignments_ref, timeout_sec=30)
            
            assignments = [doc.to_dict() for doc in docs]
            log(f"Fetched {len(assignments)} assignments.")
        except Exception as e:
            log(f"Error fetching assignments: {e}")
        
        # Fetch Todos
        try:
            log("Fetching todos (with 30s timeout)...")
            todos_ref = db.collection('todos')
            
            # Use threaded timeout wrapper
            docs = get_with_timeout(todos_ref, timeout_sec=30)
            
            todos = [doc.to_dict() for doc in docs]
            log(f"Fetched {len(todos)} todos.")
            
            # DEBUG: Print todos summary
            log("--- RAW TODOS DUMP ---")
            for t in todos:
                title = t.get('title', 'Unknown')
                tid = t.get('id', 'No ID')
                log(f"ID: {tid} | Title: {title} | Completed: {t.get('completed', 'N/A')}")
            log("----------------------")
        except Exception as e:
            log(f"Error fetching todos: {e}")
             
        return assignments, todos

    except Exception as e:
        log(f"[FIREBASE CRITICAL ERROR] {e}")
        return [], []

def format_date_display(date_str):
    if not date_str: return "N/A"
    try:
        d = datetime.datetime.strptime(date_str, "%Y-%m-%d")
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
        status = assign.get('status', 'PENDING')
        if status == 'DONE':
            continue
            
        try:
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

    # 2. Process Todos
    for todo in todos:
        if not todo.get('completed', False):
             upcoming_todos.append(todo)

    count_overdue = len(overdue_assignments)
    count_upcoming = len(upcoming_assignments)
    count_todos = len(upcoming_todos)

    log(f"Filtered: {count_overdue} overdue, {count_upcoming} upcoming, and {count_todos} pending tasks.")

    if count_overdue == 0 and count_upcoming == 0 and count_todos == 0:
        log("No tasks found. Sending 'All caught up' email.")
        # Proceed to send the email anyway for verification

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

    print(f"Attempting to send email from {SENDER_EMAIL} to {RECEIVER_EMAIL}...")
    
    try: 
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30)
        server.set_debuglevel(1) # Enable SMTP debug logging
        server.starttls()
        print("SMTP connection established. Logging in...")
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        print("Logged in. Sending message...")
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, text)
        server.quit()
        print("SUCCESS: Email sent to server.")
        log("Email sent successfully!")
    except Exception as e:
        log(f"Failed to send email: {e}")
        raise e 

if __name__ == "__main__":
    check_deadlines_and_email()
