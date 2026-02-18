
import smtplib
import json
import datetime
import os
import sys
import requests
import google.auth
from google.oauth2 import service_account
from google.auth.transport.requests import Request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "deadline.upcoming@gmail.com"
SENDER_PASSWORD = os.environ.get("EMAIL_PASSWORD", "wyqf nwmj ujsz yvxc") 
RECEIVER_EMAIL = "alex.barkas@queensu.ca"
NOTICE_DAYS = 3
PROJECT_ID = "secondsemdashb" 
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def log(msg):
    """Log to console (seen in GitHub Actions) and local file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")
    sys.stdout.flush()
    try:
        with open(os.path.join(SCRIPT_DIR, "email_debug_rest.log"), "a", encoding='utf-8') as f:
            f.write(f"[{timestamp}] {msg}\n")
    except Exception:
        pass

def get_access_token():
    """Get OAuth2 access token by manually loading service account JSON."""
    try:
        creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if not creds_path or not os.path.exists(creds_path):
             # Try to find it in the script directory if env var is missing (local dev convenience)
             local_key = os.path.join(SCRIPT_DIR, "secondsemdashb-firebase-adminsdk-fbsvc-574ee6bf41.json")
             if os.path.exists(local_key):
                 creds_path = local_key
             else:
                 raise Exception("GOOGLE_APPLICATION_CREDENTIALS not set or file not found.")

        log(f"Loading credentials from {creds_path}")
        
        with open(creds_path, 'r') as f:
            info = json.load(f)
        
        # FIX: Ensure private key newlines are correct
        # This fixes "Invalid JWT Signature" if newlines are escaped as \\n
        if 'private_key' in info:
            info['private_key'] = info['private_key'].replace('\\n', '\n')

        creds = service_account.Credentials.from_service_account_info(
            info,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        
        creds.refresh(Request())
        return creds.token
    except Exception as e:
        log(f"Auth Error: {e}")
        raise e

def parse_firestore_doc(doc):
    """Convert Firestore REST JSON format to simple dict."""
    data = {}
    fields = doc.get('fields', {})
    
    for key, val_dict in fields.items():
        if 'stringValue' in val_dict:
            data[key] = val_dict['stringValue']
        elif 'booleanValue' in val_dict:
             data[key] = val_dict['booleanValue']
        elif 'integerValue' in val_dict:
             data[key] = int(val_dict['integerValue'])
        elif 'timestampValue' in val_dict:
             data[key] = val_dict['timestampValue']
        
    return data

def fetch_collection(collection_name, token):
    """Fetch all documents from a Firestore collection via REST."""
    url = f"{FIRESTORE_URL}/{collection_name}"
    headers = {"Authorization": f"Bearer {token}"}
    
    log(f"Fetching {collection_name} via REST API...")
    resp = requests.get(url, headers=headers, timeout=30)
    
    if resp.status_code != 200:
        log(f"Error fetching {collection_name}: {resp.status_code} {resp.text}")
        return []
        
    json_data = resp.json()
    documents = json_data.get('documents', [])
    
    parsed = [parse_firestore_doc(d) for d in documents]
    log(f"Fetched {len(parsed)} items from {collection_name}.")
    return parsed

def format_date_display(date_str):
    if not date_str: return "N/A"
    try:
        d = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        return d.strftime("%a, %b %d")
    except:
        return date_str

def check_deadlines_and_email():
    log(f"Starting check (REST API Mode). Notice Days: {NOTICE_DAYS}")
    
    try:
        token = get_access_token()
        assignments = fetch_collection('assignments', token)
        todos = fetch_collection('todos', token)
    except Exception as e:
        log(f"CRITICAL ERROR (Data Fetch): {e}")
        return # Cannot proceed

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
