import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# --- CONFIGURATION (Matches auto_email.py) ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "deadline.upcoming@gmail.com"
# Try env var first, fallback to the hardcoded one found in auto_email.py
SENDER_PASSWORD = os.environ.get("EMAIL_PASSWORD", "wyqf nwmj ujsz yvxc") 
RECEIVER_EMAIL = "Alexander.Barkas@queensu.ca"

def test_email():
    print("--- EMAIL TEST START ---")
    print(f"Sender: {SENDER_EMAIL}")
    print(f"Receiver: {RECEIVER_EMAIL}")
    print(f"SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
    
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = "Test Email - Debugging Creds"
    
    body = "If you receive this, the email credentials are VALID."
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        print("Connecting to SMTP server...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30)
        server.set_debuglevel(1) # Show full SMTP negotiation
        
        print("Starting TLS...")
        server.starttls()
        
        print("Logging in...")
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        print("Login SUCCESS.")
        
        print("Sending mail...")
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
        print("Send mail SUCCESS.")
        
        server.quit()
        print("--- EMAIL TEST PASSED ---")
        
    except Exception as e:
        print(f"\n!!! EMAIL TEST FAILED !!!")
        print(f"Error: {e}")
        print("-------------------------")

if __name__ == "__main__":
    test_email()
