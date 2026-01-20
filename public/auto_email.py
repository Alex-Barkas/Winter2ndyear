import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
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
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "deadline.upcoming@gmail.com")
SENDER_PASSWORD = os.environ.get("SENDER_PASSWORD", "wyqf nwmj ujsz yvxc")
RECEIVER_EMAIL = os.environ.get("RECEIVER_EMAIL", "23KKV9@queensu.ca")
NOTICE_DAYS = 3

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(SCRIPT_DIR, "serviceAccountKey.json")

# --- DATABASE LOADER (Firebase) ---
def get_database_data():
    try:
        print("DEBUG: Entering get_database_data")
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
            d = doc.to_dict()
            print(f"DEBUG TODO: {d}")
            todos.append(d)

        print(f"Total Todos Fetched: {len(todos)}")
        return assignments, todos

    except Exception as e:
        print(f"Firebase Error: {e}")
        # Log to file if possible
        with open(os.path.join(SCRIPT_DIR, "email_debug.log"), "a") as f:
            f.write(f"[FIREBASE ERROR] {e}\n")
        raise e

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
        log(f"ERROR: Service Account Key not found at {CRED_PATH}")
        return

    assignments, todos = get_database_data()

    today = datetime.date.today()
    
    upcoming_assignments = []
    upcoming_todos = []
    
    # Check Assignments
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
            
            if 0 <= delta <= NOTICE_DAYS:
                upcoming_assignments.append(assign)
        except ValueError:
            continue
            
    # Check Todos
    for todo in todos:
        # Explicit boolean check
        is_completed = todo.get('completed')
        if is_completed is True or str(is_completed).lower() == 'true':
            continue
        upcoming_todos.append(todo)

    total_count = len(upcoming_assignments) + len(upcoming_todos)
    
    # Always log count
    log(f"Filtered: {len(upcoming_assignments)} upcoming assignments and {len(upcoming_todos)} pending tasks.")
    
    # Prepare Email
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = f"Daily Update: {len(upcoming_assignments)} Assignments, {len(upcoming_todos)} To-Dos"

    # Sort lists by date
    upcoming_assignments.sort(key=lambda x: x.get('date', '9999-99-99'))
    upcoming_todos.sort(key=lambda x: x.get('date', '9999-99-99'))

    # --- HTML TEMPLATE GENERATION ---
    body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212; color: #e0e0e0; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #1e1e1e; padding: 15px; border-radius: 8px; }}
            .header {{ text-align: center; padding-bottom: 10px; border-bottom: 1px solid #333; margin-bottom: 15px; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; }}
            .header p {{ color: #aaaaaa; margin: 2px 0 0; font-size: 13px; }}
            .section-title {{ color: #4fc3f7; font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-left: 3px solid #4fc3f7; padding-left: 8px; }}
            .card {{ background-color: #2c2c2c; padding: 10px; border-radius: 4px; margin-bottom: 6px; border-left: 3px solid #555; }}
            .card.today {{ border-left-color: #ff5252; background-color: #382424; }}
            .card-title {{ font-weight: bold; font-size: 14px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; }}
            .card-meta {{ color: #bbbbbb; font-size: 12px; margin-top: 2px; }}
            .badge {{ display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; margin-right: 5px; }}
            .badge-today {{ background-color: #ff5252; color: white; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 11px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Daily Agenda</h1>
                <p>{datetime.date.today().strftime('%A, %B %d')}</p>
            </div>
    """

    def format_date_display(date_string):
        if not date_string: return "No Date"
        try:
            dt = datetime.datetime.strptime(date_string, "%Y-%m-%d")
            return dt.strftime("%a, %b %d") # Mon, Jan 01
        except:
            return date_string

    # --- ASSIGNMENTS ---
    body += '<div class="section-title">📅 Upcoming Deadlines</div>'
    if upcoming_assignments:
        for item in upcoming_assignments:
            d_str = item.get('date', 'N/A')
            display_date = format_date_display(d_str)
            
            course = item.get('course', 'General')
            title = item.get('title', 'Untitled')
            
            is_today = (d_str == str(today))
            card_class = "card today" if is_today else "card"
            
            badge_html = '<span class="badge badge-today">TODAY</span>' if is_today else ''
            
            # Compact Layout: Title on left, Date on right
            body += f"""
            <div class="{card_class}">
                <div class="card-title">
                    <span>{badge_html} {course} - {title}</span>
                    <span style="font-weight:normal; color:#aaa; font-size:12px;">{display_date}</span>
                </div>
            </div>
            """
    else:
        body += '<div class="card" style="border-left-color: #4caf50; color: #a5d6a7; padding:8px;">🎉 No upcoming deadlines!</div>'

    # --- TO-DOS ---
    body += '<div class="section-title">✅ To-Do List</div>'
    if upcoming_todos:
        for item in upcoming_todos:
            d_str = item.get('date', '')
            display_date = format_date_display(d_str) if d_str else "No Date"
            
            course = item.get('course', 'Personal')
            title = item.get('title', 'Untitled')
            
            is_today = (d_str == str(today))
            card_class = "card today" if is_today else "card"
            badge_html = '<span class="badge badge-today">NOW</span>' if is_today else ''
            
            body += f"""
            <div class="{card_class}" style="border-left-color: #ab47bc;">
                 <div class="card-title">
                    <span>{badge_html} {title}</span>
                    <span style="font-weight:normal; color:#aaa; font-size:12px;">{display_date}</span>
                </div>
                <div class="card-meta">
                    {course}
                </div>
            </div>
            """
    else:
        body += '<div class="card" style="border-left-color: #4caf50; color: #a5d6a7; padding:8px;">✨ All caught up!</div>'

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
