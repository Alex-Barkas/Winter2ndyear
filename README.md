# Second Year, Second Sem — Course Dashboard

A static, zero-framework dashboard for tracking coursework across a school year split into three terms (winter, summer, fall). Each term has its own dashboard, assignment list, details page, and grade calculator, backed by Firebase Firestore.

## Structure

```
public/                          <-- deployed web root (Vercel)
├── index.html                   <-- landing page / term picker
├── todo.html                    <-- cross-term to-do list
├── {term}2026/                   <-- one folder per term
│   ├── index.html                 <-- term dashboard (courses + upcoming items)
│   ├── assignments.html            <-- full assignment list for a course
│   ├── details.html                <-- single assignment/exam detail view
│   └── grades.html                 <-- grade calculator for the term
├── css/style.css                 <-- single shared stylesheet
├── js/
│   ├── script.js                 <-- dashboard rendering, add/delete UI
│   ├── details.js                <-- details page logic
│   ├── grading-renderer.js       <-- grade calculator logic
│   ├── data-service.js           <-- Firestore read/write layer
│   ├── firebase-config.js        <-- Firebase project config
│   └── student-config-{term}2026.js  <-- per-term data: courses, grading schemes, assignments
├── assets/                       <-- favicons
├── course_images/                <-- course card thumbnails
├── pdfs/, textbooks/, assignments/, syllabus/  <-- course PDFs referenced from student-config files
└── course-links/                 <-- personal Drive/NotebookLM/OnQ links per course

config/
├── vercel.json                   <-- deployment config (clean URLs, no trailing slash)
└── firestore.rules               <-- Firestore security rules

scripts/                          <-- standalone Python automation
├── auto_email_rest.py            <-- sends the daily agenda email (via Firebase REST API)
├── seed_assignments.py           <-- bulk-load assignments into Firestore
├── process_img.py                <-- image processing helper
└── add_ab_to_leaf.py

.github/workflows/daily_email.yml <-- cron job that runs auto_email_rest.py daily at 8/9am ET

server.py                         <-- local dev server (stdlib http.server, serves public/)
run_website.bat                   <-- `python server.py` shortcut for local dev
```

`{term}` is one of `winter`, `summer`, `fall` — each term folder (`winter2026/`, `summer2026/`, `fall2026/`) is a fully independent set of 4 pages driven by its own `js/student-config-{term}2026.js` file. All internal links, and every asset path used in the `student-config-*.js` files, are root-absolute (e.g. `/css/style.css`, `/winter2026/grades.html`) so pages work the same regardless of folder depth.

## Running locally

```
python server.py
```
or double-click `run_website.bat`. Serves `public/` at `http://localhost:8080`.

## Data flow

- `student-config-{term}2026.js` defines the courses, grading schemes, and assignments for that term (hand-edited).
- `data-service.js` reads/writes assignment state (scores, completion, manually-added items) to Firebase Firestore, so changes persist across devices.
- The daily email automation (`scripts/auto_email_rest.py`, run via GitHub Actions) reads Firestore directly and emails an agenda summary each morning.

See `HOW_TO_CUSTOMIZE.md` for how to edit course/assignment data, and `docs/` for page-specific notes.
