
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
COURSE_COLORS = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#22d3ee", "#fb923c", "#a3e635"]
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

def stat_cell(value, label, color):
    num_color = color if value else "#52525b"
    return f"""<td width="25%" align="center" bgcolor="{CARD}" style="background:{CARD};border:1px solid {BORDER};border-radius:10px;padding:14px 4px;">
      <div style="font:700 26px/1 {FONT};color:{num_color};">{value}</div>
      <div style="font:600 10px/1.2 {FONT};color:{MUTED};letter-spacing:1px;text-transform:uppercase;padding-top:6px;">{label}</div>
    </td>"""

def section_title(text, color):
    return f"""<tr><td style="padding:26px 0 10px;font:700 11px/1 {FONT};color:{color};letter-spacing:1.5px;text-transform:uppercase;">{text}</td></tr>"""

def deadline_row(entry, accent):
    days, time, item, d = entry
    course = item.get('course', '')
    category = CATEGORY_LABELS.get(item.get('category'), "")
    rel = relative_label(days)
    rel_color = RED if days < 0 else AMBER if days <= 1 else TEXT
    time_txt = format_time(time)
    meta = " · ".join(x for x in [category, time_txt] if x)
    return f"""<tr><td style="padding:0 0 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{CARD}" style="background:{CARD};border:1px solid {BORDER};border-left:3px solid {accent};border-radius:10px;">
        <tr>
          <td width="54" align="center" valign="middle" style="padding:12px 0 12px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="44" bgcolor="{BORDER}" style="background:{BORDER};border-radius:8px;">
              <tr><td align="center" style="padding:6px 0 0;font:700 10px/1 {FONT};color:{MUTED};letter-spacing:1px;">{d.strftime('%a').upper()}</td></tr>
              <tr><td align="center" style="padding:3px 0 6px;font:700 18px/1 {FONT};color:{TEXT};">{d.day}</td></tr>
            </table>
          </td>
          <td valign="middle" style="padding:12px 12px;">
            <div style="font:700 11px/1.2 {FONT};color:{course_color(course)};letter-spacing:.5px;">{esc(course)}</div>
            <div style="font:600 15px/1.35 {FONT};color:{TEXT};padding-top:3px;">{esc(item.get('title', 'Untitled'))}</div>
            <div style="font:400 12px/1.3 {FONT};color:{DIM};padding-top:3px;">{esc(meta)}</div>
          </td>
          <td align="right" valign="middle" style="padding:12px 14px 12px 0;white-space:nowrap;font:700 13px/1 {FONT};color:{rel_color};">{rel}</td>
        </tr>
      </table>
    </td></tr>"""

def exam_row(entry):
    days, time, item, d = entry
    course = item.get('course', '')
    when = " · ".join(x for x in [short_date(d), format_time(time)] if x)
    big, small = ("Today", "") if days == 0 else (str(days), "day" if days == 1 else "days")
    return f"""<tr><td style="padding:0 0 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1c1730" style="background:#1c1730;border:1px solid #3b2f63;border-radius:10px;">
        <tr>
          <td valign="middle" style="padding:16px;">
            <div style="font:700 11px/1.2 {FONT};color:{VIOLET};letter-spacing:.5px;">{esc(course)} · {esc(CATEGORY_LABELS.get(item.get('category'), ''))}</div>
            <div style="font:700 17px/1.3 {FONT};color:{TEXT};padding-top:3px;">{esc(item.get('title', 'Exam'))}</div>
            <div style="font:400 13px/1.3 {FONT};color:{MUTED};padding-top:3px;">{esc(when)}</div>
          </td>
          <td width="76" align="center" valign="middle" style="padding:16px 16px 16px 0;">
            <div style="font:800 30px/1 {FONT};color:{VIOLET};">{big}</div>
            <div style="font:600 10px/1.2 {FONT};color:{MUTED};letter-spacing:1px;text-transform:uppercase;padding-top:4px;">{small}</div>
          </td>
        </tr>
      </table>
    </td></tr>"""

def later_row(entry):
    days, time, item, d = entry
    course = item.get('course', '')
    return f"""<tr>
      <td width="74" valign="top" style="padding:9px 0;border-bottom:1px solid {BORDER};font:600 12px/1.4 {FONT};color:{MUTED};white-space:nowrap;">{short_date(d)}</td>
      <td valign="top" style="padding:9px 8px;border-bottom:1px solid {BORDER};font:400 14px/1.4 {FONT};color:{TEXT};">
        <span style="font-weight:700;color:{course_color(course)};">{esc(course)}</span>&nbsp; {esc(item.get('title', 'Untitled'))}
      </td>
      <td align="right" valign="top" style="padding:9px 0;border-bottom:1px solid {BORDER};font:400 12px/1.4 {FONT};color:{DIM};white-space:nowrap;">{relative_label(days).lower()}</td>
    </tr>"""

def todo_row(todo, today):
    level = todo.get('urgency') or 3
    badge = ""
    if level >= 4:
        color = RED if level == 5 else AMBER
        badge = f"""<span style="font:700 10px/1 {FONT};color:{color};border:1px solid {color};border-radius:4px;padding:2px 5px;letter-spacing:.5px;">{'CRITICAL' if level == 5 else 'HIGH'}</span>&nbsp; """
    d = parse_date(todo.get('date'))
    due = f" · {short_date(d)} ({relative_label((d - today).days).lower()})" if d else ""
    return f"""<tr><td style="padding:0 0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{CARD}" style="background:{CARD};border:1px solid {BORDER};border-radius:10px;">
        <tr>
          <td width="22" valign="top" style="padding:12px 0 12px 14px;font:400 15px/1.3 {FONT};color:{GREEN};">&#9675;</td>
          <td style="padding:12px 14px 12px 8px;">
            <div style="font:600 14px/1.35 {FONT};color:{TEXT};">{badge}{esc(todo.get('title', 'Untitled'))}</div>
            <div style="font:400 12px/1.3 {FONT};color:{DIM};padding-top:2px;">{esc(todo.get('course') or 'Personal')}{esc(due)}</div>
          </td>
        </tr>
      </table>
    </td></tr>"""

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

    rows = []
    if b["overdue"]:
        rows.append(section_title("Overdue", RED))
        rows += [deadline_row(e, RED) for e in b["overdue"]]
    if b["soon"]:
        rows.append(section_title(f"Due in the next {NOTICE_DAYS} days", AMBER))
        rows += [deadline_row(e, AMBER) for e in b["soon"]]
    if b["exams"]:
        rows.append(section_title("Exams", VIOLET))
        rows += [exam_row(e) for e in b["exams"]]
    if b["later"]:
        rows.append(section_title("Coming up", BLUE))
        rows.append(f"""<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">{''.join(later_row(e) for e in b["later"])}</table></td></tr>""")
    if b["todos"]:
        rows.append(section_title("To-do", GREEN))
        rows += [todo_row(t, today) for t in b["todos"]]
    if not any(b[k] for k in ("overdue", "soon", "exams", "later", "todos")):
        rows.append(f"""<tr><td align="center" style="padding:36px 0;font:600 16px/1.4 {FONT};color:{GREEN};">&#10024; All caught up</td></tr>""")

    html_body = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>Daily Agenda</title></head>
<body style="margin:0;padding:0;background:{BG};" bgcolor="{BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{esc(summary)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{BG}" style="background:{BG};">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
    <tr><td style="padding:0 6px 18px;">
      <div style="font:700 11px/1 {FONT};color:{DIM};letter-spacing:2px;text-transform:uppercase;">Daily Agenda</div>
      <div style="font:800 28px/1.2 {FONT};color:{TEXT};padding-top:8px;">{today.strftime('%A, %B')} {today.day}</div>
      <div style="font:400 15px/1.5 {FONT};color:{MUTED};padding-top:8px;">{esc(summary)}</div>
    </td></tr>
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="6" border="0">
        <tr>
          {stat_cell(len(b['overdue']), "Overdue", RED)}
          {stat_cell(len(b['soon']), "Due soon", AMBER)}
          {stat_cell(len(b['exams']), "Exams", VIOLET)}
          {stat_cell(len(b['todos']), "To-dos", GREEN)}
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        {''.join(rows)}
      </table>
    </td></tr>
    <tr><td align="center" style="padding:28px 0 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td bgcolor="{TEXT}" style="background:{TEXT};border-radius:8px;">
          <a href="{DASHBOARD_URL}" style="display:inline-block;padding:12px 26px;font:700 14px/1 {FONT};color:{BG};text-decoration:none;">Open dashboard &rarr;</a>
        </td>
      </tr></table>
    </td></tr>
    <tr><td align="center" style="padding:14px 0 0;font:400 11px/1.5 {FONT};color:#52525b;">Sent every morning at 7:00 &middot; Stay focused.</td></tr>
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
