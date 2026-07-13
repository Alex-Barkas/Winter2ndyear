"""
Push a term's assignments (from public/js/student-config-<term>.js) into the live
Firestore 'assignments' collection, so they actually show up on the site.

Why this exists: the site reads assignment data from Firestore first (student-config-*.js
is only an offline/error fallback - see data-service.js getAllAssignments()). Editing the
config file alone does NOT make new assignments appear until they're written to Firestore.

Safety: by default only creates documents that don't already exist - never overwrites an
existing doc, so it can't clobber scores/status you've already entered through the UI.

To correct a field on assignments that already exist in Firestore (e.g. a due date the
professor moved), pass --update-fields with a comma list of field names; only those exact
fields get overwritten from the config file, everything else on the existing doc (score,
status, ...) is left untouched.

Usage:
    python scripts/seed_assignments.py winter2026
    python scripts/seed_assignments.py summer2026
    python scripts/seed_assignments.py fall2026
    python scripts/seed_assignments.py summer2026 --update-fields date,time
"""
import json
import os
import subprocess
import sys

import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
PROJECT_ID = "secondsemdashb"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
CREDS_PATH = os.path.join(SCRIPT_DIR, "secondsemdashb-firebase-adminsdk-fbsvc-574ee6bf41.json")


def get_access_token():
    with open(CREDS_PATH, 'r') as f:
        info = json.load(f)
    if 'private_key' in info:
        info['private_key'] = info['private_key'].replace('\\n', '\n')
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    creds.refresh(Request())
    return creds.token


def load_assignments_from_config(term):
    config_path = os.path.join(REPO_ROOT, "public", "js", f"student-config-{term}.js")
    if not os.path.exists(config_path):
        raise SystemExit(f"No config file found at {config_path}")

    # Evaluate the config file in a minimal sandbox via Node so we read the exact
    # same data the site uses, instead of re-parsing/duplicating it in Python.
    node_script = f"""
        const window = {{}};
        const fs = require('fs');
        eval(fs.readFileSync({json.dumps(config_path)}, 'utf8'));
        process.stdout.write(JSON.stringify(window.STUDENT_DATA.assignments || []));
    """
    result = subprocess.run(["node", "-e", node_script], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def to_firestore_value(v):
    if v is None:
        return {"nullValue": None}
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, int):
        return {"integerValue": str(v)}
    if isinstance(v, float):
        return {"doubleValue": v}
    if isinstance(v, str):
        return {"stringValue": v}
    if isinstance(v, list):
        return {"arrayValue": {"values": [to_firestore_value(x) for x in v]}}
    if isinstance(v, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(val) for k, val in v.items()}}}
    raise ValueError(f"Unsupported type for Firestore conversion: {type(v)}")


def doc_exists(doc_id, headers):
    resp = requests.get(f"{FIRESTORE_URL}/assignments/{doc_id}", headers=headers, timeout=30)
    return resp.status_code == 200


def create_doc(item, headers):
    doc_id = item["id"]
    fields = {k: to_firestore_value(v) for k, v in item.items()}
    resp = requests.patch(
        f"{FIRESTORE_URL}/assignments/{doc_id}",
        headers={**headers, "Content-Type": "application/json"},
        json={"fields": fields},
        timeout=30,
    )
    resp.raise_for_status()


def update_doc_fields(item, field_names, headers):
    doc_id = item["id"]
    fields = {k: to_firestore_value(item[k]) for k in field_names if k in item}
    mask = "&".join(f"updateMask.fieldPaths={name}" for name in field_names if name in item)
    resp = requests.patch(
        f"{FIRESTORE_URL}/assignments/{doc_id}?{mask}",
        headers={**headers, "Content-Type": "application/json"},
        json={"fields": fields},
        timeout=30,
    )
    resp.raise_for_status()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        raise SystemExit("Usage: python scripts/seed_assignments.py <term> [--update-fields a,b,c]")
    term = args[0]

    update_fields = None
    for a in sys.argv[1:]:
        if a.startswith("--update-fields="):
            update_fields = a.split("=", 1)[1].split(",")

    assignments = load_assignments_from_config(term)
    print(f"Loaded {len(assignments)} assignments from student-config-{term}.js")

    token = get_access_token()
    headers = {"Authorization": f"Bearer {token}"}

    created, updated, skipped = 0, 0, 0
    for item in assignments:
        if doc_exists(item["id"], headers):
            if update_fields:
                update_doc_fields(item, update_fields, headers)
                updated += 1
                print(f"  updated {update_fields} on: {item['id']} ({item['course']} - {item['title']})")
            else:
                skipped += 1
            continue
        create_doc(item, headers)
        created += 1
        print(f"  created: {item['id']} ({item['course']} - {item['title']})")

    print(f"Done. Created {created} new docs, updated {updated}, skipped {skipped} unchanged existing docs.")


if __name__ == "__main__":
    main()
