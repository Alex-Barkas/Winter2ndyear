import smtplib
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

# Notify ONLY on the day it is due? (0 days)
NOTICE_DAYS = 0
# ==========================================

def parse_assignments(file_path):
    """
    Parses student-config.js to find assignment objects.
    Extracts { id:..., date:..., title:..., course:... } content using regex.
    """
    assignments = []
    
    # Regex to capture content inside braces { ... } for lines in assignments array
    # Looking for lines like: { id: "...", ... date: "YYYY-MM-DD", ... }
    # We'll just parse line by line for simplicity as the file format is consistent.
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_assignments = False
    
    for line in lines:
        line = line.strip()
        if "assignments: [" in line:
            in_assignments = True
            continue
        if in_assignments and "]" in line and line.endswith(","): # End of array potentially
             # Use caution, brackets might appear elsewhere. 
             # But usually student-config ends array with ]
             pass
        
        if in_assignments and line.startswith("{") and "id:" in line:
            # Parse this line
            try:
                # Extract fields using simple string search or regex
                # id: "..."
                id_match = re.search(r'id:\s*"([^"]+)"', line)
                date_match = re.search(r'date:\s*"([^"]+)"', line)
                title_match = re.search(r'title:\s*"([^"]+)"', line)
                course_match = re.search(r'course:\s*"([^"]+)"', line)
                status_match = re.search(r'status:\s*"([^"]+)"', line)
                
                if date_match and title_match and status_match:
                    assignments.append({
                        "id": id_match.group(1) if id_match else "unknown",
                        "date": date_match.group(1),
                        "title": title_match.group(1),
                        "course": course_match.group(1) if course_match else "General",
                        "status": status_match.group(1)
                    })
            except Exception as e:
                print(f"Skipping line due to parse error: {line[:50]}... {e}")

    return assignments

def check_deadlines_and_email():
    print(f"Checking for assignments due TODAY ({datetime.date.today()})...")
    
    assignments = parse_assignments("student-config.js")
    today = datetime.date.today()
    
    upcoming = []
    
    for assign in assignments:
        if assign['status'] == 'DONE':
            continue
            
        try:
            due_date = datetime.datetime.strptime(assign['date'], "%Y-%m-%d").date()
            delta = (due_date - today).days
            
            if 0 <= delta <= NOTICE_DAYS:
                upcoming.append(assign)
        except ValueError:
            continue # Skip invalid dates (TBD)

    if not upcoming:
        print("No upcoming deadlines found.")
        return

    print(f"Found {len(upcoming)} upcoming assignments.")
    
    # Prepare Email
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = f"🚨 Assignments Due TODAY ({len(upcoming)} Tasks)"

    body = "<h2>Assignments Due Today</h2><ul>"
    for item in upcoming:
        body += f"<li><strong>{item['course']} - {item['title']}</strong><br>Status: {item['status']}</li><br>"
    body += "</ul><p>Good luck! Submit them by 23:59!</p>"

    msg.attach(MIMEText(body, 'html'))

    # Send
    if "your_email" in SENDER_EMAIL:
        print("---------------------------------------------------")
        print("CONFIGURATION REQUIRED: Please edit auto_email.py")
        print("Fill in SENDER_EMAIL and SENDER_PASSWORD.")
        print("---------------------------------------------------")
        print("Mock Email Body:")
        print(body.replace("<br>", "\n").replace("<ul>", "").replace("</ul>", "").replace("<li>", "- ").replace("</li>", "").replace("<h2>", "").replace("</h2>", "").replace("<strong>", "").replace("</strong>", ""))
        return

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, text)
        server.quit()
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

if __name__ == "__main__":
    check_deadlines_and_email()
