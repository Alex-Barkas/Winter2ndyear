
import smtplib
import json
import datetime
import html
import os
import sys
import zlib
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "deadline.upcoming@gmail.com"
SENDER_PASSWORD = os.environ.get("EMAIL_PASSWORD")
RECEIVER_EMAIL = "alex.barkas@queensu.ca"
NOTICE_DAYS = 3        # "Due soon" window
LOOKAHEAD_DAYS = 10    # "Coming up" window
EXAM_DAYS = 14         # Exam countdown window
EXAM_CATEGORIES = {"MIDTERM", "FINAL"}
DASHBOARD_URL = "https://winter2ndyear.vercel.app"
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
    documents = []
    params = {"pageSize": 300}
    while True:
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        if resp.status_code != 200:
            log(f"Error fetching {collection_name}: {resp.status_code} {resp.text}")
            return []
        json_data = resp.json()
        documents += json_data.get('documents', [])
        # Firestore pages its results; without this only the first page was read.
        if not json_data.get('nextPageToken'):
            break
        params["pageToken"] = json_data['nextPageToken']

    parsed = [parse_firestore_doc(d) for d in documents]
    log(f"Fetched {len(parsed)} items from {collection_name}.")
    return parsed

# --- FORMATTING HELPERS ---

# Dark palette, matches the dashboard (zinc).
BG, CARD, BORDER = "#09090b", "#18181b", "#27272a"
TEXT, MUTED, DIM = "#fafafa", "#a1a1aa", "#71717a"
RED, AMBER, VIOLET, BLUE, GREEN = "#f87171", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399"
# No violet here: violet is reserved for exams.
COURSE_COLORS = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#e879f9", "#22d3ee", "#fb923c", "#a3e635"]
FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

CATEGORY_LABELS = {
    "ASSIGNMENT": "Assignment", "LAB": "Lab", "QUIZ": "Quiz", "TUTORIAL": "Tutorial",
    "MIDTERM": "Midterm", "FINAL": "Final exam",
}

def esc(s):
    return html.escape(str(s or ""))

_course_palette = {}

def assign_course_colors(assignments, today):
    """Give each course in the current term its own color (stable for the whole term)."""
    window = datetime.timedelta(days=120)
    current = sorted({a.get('course') for a in assignments
                      if a.get('course') and (d := parse_date(a.get('date'))) and abs(d - today) <= window})
    _course_palette.clear()
    _course_palette.update({c: COURSE_COLORS[i % len(COURSE_COLORS)] for i, c in enumerate(current)})

def course_color(course):
    if course in _course_palette:
        return _course_palette[course]
    return COURSE_COLORS[zlib.crc32((course or "").encode()) % len(COURSE_COLORS)]

def parse_date(date_str):
    try:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None

def format_time(time_str):
    """'23:59' -> '11:59 PM'."""
    try:
        t = datetime.datetime.strptime(time_str, "%H:%M")
    except (TypeError, ValueError):
        return ""
    return t.strftime("%I:%M %p").lstrip("0")

def short_date(d):
    return f"{d.strftime('%a, %b')} {d.day}"

def relative_label(days):
    if days < -1: return f"{-days} days late"
    if days == -1: return "1 day late"
    if days == 0: return "Today"
    if days == 1: return "Tomorrow"
    return f"In {days} days"

def plural(n, word):
    return f"{n} {word}{'' if n == 1 else 's'}"

def item_name(item):
    return f"{item.get('course', '')} {item.get('title', 'Untitled')}".strip()

# --- EMAIL BUILDING ---

def bucket_items(assignments, todos, today):
    """Sort assignments into overdue / due soon / exams / coming up."""
    buckets = {"overdue": [], "soon": [], "exams": [], "later": []}
    next_up = None

    for a in assignments:
        if a.get('status') == 'DONE':
            continue
        d = parse_date(a.get('date'))
        if not d:
            continue
        days = (d - today).days
        entry = (days, a.get('time') or "", a, d)
        is_exam = a.get('category') in EXAM_CATEGORIES

        if days >= 0 and (next_up is None or entry[:2] < next_up[:2]):
            next_up = entry

        if is_exam:
            if 0 <= days <= EXAM_DAYS:
                buckets["exams"].append(entry)
        elif days < 0:
            buckets["overdue"].append(entry)
        elif days <= NOTICE_DAYS:
            buckets["soon"].append(entry)
        elif days <= LOOKAHEAD_DAYS:
            buckets["later"].append(entry)

    for k in buckets:
        buckets[k].sort(key=lambda e: (e[0], e[1]))

    open_todos = [t for t in todos if not t.get('completed', False)]
    # Highest urgency first, then dated before undated, soonest first.
    open_todos.sort(key=lambda t: (-(t.get('urgency') or 3), t.get('date') or "9999"))
    buckets["todos"] = open_todos
    buckets["next_up"] = next_up
    return buckets

def summary_line(b, today):
    overdue, soon, exams = b["overdue"], b["soon"], b["exams"]
    due_today = [e for e in soon if e[0] == 0]
    parts = []
    if overdue:
        parts.append(f"{plural(len(overdue), 'item')} overdue.")
    if due_today:
        parts.append(f"{len(due_today)} due today.")
    elif soon:
        parts.append(f"{len(soon)} due in the next {NOTICE_DAYS} days.")
    nxt = b["next_up"]
    if not overdue and not soon:
        if nxt:
            parts.append(f"Clear until {nxt[3].strftime('%A')}.")
        else:
            parts.append("Nothing on the calendar.")
    if nxt and not due_today:
        parts.append(f"Next up: {item_name(nxt[2])}, {relative_label(nxt[0]).lower()}.")
    if exams:
        days, _, ex, _ = exams[0]
        when = "today" if days == 0 else "tomorrow" if days == 1 else f"in {days} days"
        parts.append(f"{ex.get('course', '')} {ex.get('title', 'exam')} {when}.")
    return " ".join(parts)

def subject_line(b, today):
    parts = [short_date(today)]
    if b["overdue"]:
        parts.append(f"{len(b['overdue'])} overdue")
    if b["soon"]:
        parts.append(f"{len(b['soon'])} due soon")
    if b["exams"]:
        days, _, ex, _ = b["exams"][0]
        when = "today" if days == 0 else "tomorrow" if days == 1 else f"in {days}d"
        parts.append(f"{ex.get('course', '')} {CATEGORY_LABELS.get(ex.get('category'), 'exam').lower()} {when}")
    if len(parts) == 1:
        nxt = b["next_up"]
        parts.append(f"Clear until {nxt[3].strftime('%a')}" if nxt else "All clear")
    if b["todos"]:
        parts.append(plural(len(b["todos"]), "to-do"))
    return " · ".join(parts)

def st(size, weight=400, color=TEXT, lh=1.4, extra=""):
    """Inline font style. Longhand on purpose: Outlook (mobile + web) drops the `font:` shorthand."""
    return f"font-family:{FONT};font-size:{size}px;font-weight:{weight};line-height:{lh};color:{color};{extra}"

def day_header(label, sub, color=TEXT):
    sub_html = f'<span style="color:{DIM};font-weight:400;">&nbsp;&middot;&nbsp;{sub}</span>' if sub else ""
    return f"""<tr><td style="padding:28px 0 8px;border-bottom:1px solid {BORDER};{st(13, 700, color, 1.2, 'letter-spacing:.8px;text-transform:uppercase;')}">{label}{sub_html}</td></tr>"""

def bar_row(bar_color, inner):
    """One item: thin colored bar on the left, content to the right."""
    return f"""<tr><td style="padding:10px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="3" bgcolor="{bar_color}" style="background:{bar_color};width:3px;border-radius:2px;">&nbsp;</td>
        <td style="padding:2px 0 2px 12px;">{inner}</td>
      </tr></table>
    </td></tr>"""

def item_row(entry, overdue=False):
    days, time, item, d = entry
    course = item.get('course', '')
    is_exam = item.get('category') in EXAM_CATEGORIES
    color = VIOLET if is_exam else course_color(course)
    meta = [f'<span style="color:{color};font-weight:700;">{esc(course)}</span>']
    if overdue:
        meta.append(f'<span style="color:{RED};font-weight:600;">{relative_label(days).lower()}</span>')
    else:
        meta.append(esc(format_time(time)))
    if is_exam:
        meta.append(f'<span style="color:{VIOLET};font-weight:700;">EXAM</span>')
    inner = (f'<div style="{st(16, 600, TEXT, 1.35)}">{esc(item.get("title", "Untitled"))}</div>'
             f'<div style="{st(13, 400, MUTED, 1.4, "padding-top:2px;")}">{" &middot; ".join(x for x in meta if x)}</div>')
    return bar_row(RED if overdue else color, inner)

def todo_item(todo, today):
    level = todo.get('urgency') or 3
    color = RED if level == 5 else AMBER if level == 4 else "#3f3f46"
    flag = f' <span style="color:{color};font-weight:700;font-size:12px;">{"CRITICAL" if level == 5 else "HIGH"}</span>' if level >= 4 else ""
    return bar_row(color, f'<div style="{st(15, 500, TEXT, 1.4)}">{esc(todo.get("title", "Untitled"))}{flag}</div>')

def build_text(b, today, summary):
    lines = [f"Daily Agenda - {today.strftime('%A, %B')} {today.day}", "", summary, ""]
    def block(title, entries):
        if entries:
            lines.append(title.upper())
            for days, time, item, d in entries:
                t = format_time(time)
                lines.append(f"  - {item_name(item)} | {short_date(d)}{' ' + t if t else ''} | {relative_label(days)}")
            lines.append("")
    block("Overdue", b["overdue"])
    block("Due soon", b["soon"])
    block("Exams", b["exams"])
    block("Coming up", b["later"])
    if b["todos"]:
        lines.append("TO-DO")
        lines += [f"  - {t.get('title', 'Untitled')} ({t.get('course') or 'Personal'})" for t in b["todos"]]
        lines.append("")
    lines.append(DASHBOARD_URL)
    return "\n".join(lines)

def build_email(assignments, todos, today):
    """Return (subject, html_body, text_body). Pure: no network, safe to preview."""
    assign_course_colors(assignments, today)
    b = bucket_items(assignments, todos, today)
    summary = summary_line(b, today)
    subject = subject_line(b, today)
    counts = subject.split(" · ", 1)[1] if " · " in subject else ""

    rows = []
    if b["overdue"]:
        rows.append(day_header("Overdue", "", RED))
        rows += [item_row(e, overdue=True) for e in b["overdue"]]

    # Timeline: one group per day, exams mixed in on their day.
    days = {}
    for e in sorted(b["soon"] + b["exams"] + b["later"], key=lambda e: (e[0], e[1])):
        days.setdefault(e[3], []).append(e)
    for d, entries in days.items():
        n = entries[0][0]
        color = AMBER if n <= 1 else TEXT
        rows.append(day_header(short_date(d), relative_label(n).lower(), color))
        rows += [item_row(e) for e in entries]

    if b["todos"]:
        rows.append(day_header("To-do", "", GREEN))
        rows += [todo_item(t, today) for t in b["todos"]]

    if not rows:
        rows.append(f"""<tr><td style="padding:28px 0;{st(15, 400, MUTED)}">Nothing due in the next {LOOKAHEAD_DAYS} days.</td></tr>""")

    html_body = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>Daily Agenda</title>
<style>
  /* Stop iOS Mail turning dates and times into blue links */
  a[x-apple-data-detectors] {{ color: inherit !important; text-decoration: none !important; font: inherit !important; }}
</style></head>
<body style="margin:0;padding:0;background:{BG};" bgcolor="{BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{esc(summary)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{BG}" style="background:{BG};">
<tr><td align="center" style="padding:24px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="{st(24, 800, TEXT, 1.2)}">{today.strftime('%A, %B')} {today.day}</td></tr>
    <tr><td style="padding-top:6px;{st(14, 400, MUTED, 1.4)}">{esc(counts)}</td></tr>
    {''.join(rows)}
    <tr><td style="padding:32px 0 0;{st(14, 600, MUTED, 1.2)}"><a href="{DASHBOARD_URL}" style="color:{MUTED};text-decoration:underline;">Open dashboard &rarr;</a></td></tr>
  </table>
</td></tr>
</table>
</body></html>"""

    return subject, html_body, build_text(b, today, summary)

def check_deadlines_and_email(preview_path=None):
    log(f"Starting check (REST API Mode). Notice Days: {NOTICE_DAYS}")

    try:
        token = get_access_token()
        assignments = fetch_collection('assignments', token)
        todos = fetch_collection('todos', token)
    except Exception as e:
        log(f"CRITICAL ERROR (Data Fetch): {e}")
        return # Cannot proceed

    subject, html_body, text_body = build_email(assignments, todos, datetime.date.today())
    log(f"Subject: {subject}")

    if preview_path:
        with open(preview_path, "w", encoding="utf-8") as f:
            f.write(html_body)
        log(f"Preview written to {preview_path} (not sent).")
        return

    if not SENDER_PASSWORD:
        raise SystemExit("EMAIL_PASSWORD is not set.")

    msg = MIMEMultipart('alternative')
    msg['From'] = f"Deadlines <{SENDER_EMAIL}>"
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = subject
    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    print(f"Attempting to send email from {SENDER_EMAIL} to {RECEIVER_EMAIL}...")

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30)
        server.starttls()
        print("SMTP connection established. Logging in...")
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        print("Logged in. Sending message...")
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
        server.quit()
        print("SUCCESS: Email sent to server.")
        log("Email sent successfully!")
    except Exception as e:
        log(f"Failed to send email: {e}")
        raise e

if __name__ == "__main__":
    # python scripts/auto_email_rest.py --preview out.html  -> render with live data, don't send
    if len(sys.argv) == 3 and sys.argv[1] == "--preview":
        check_deadlines_and_email(preview_path=sys.argv[2])
    else:
        check_deadlines_and_email()
