# How to Customize This Dashboard

Each term's data lives in its own file: `public/js/student-config-winter2026.js`, `student-config-summer2026.js`, `student-config-fall2026.js`. Edit the one for the term you want to change.

## Quick Start

1. **Open** the `student-config-{term}2026.js` file for the term.
2. **Edit** the `STUDENT_DATA` object (see fields below).
3. **Add** any new PDFs to `public/pdfs/`, `public/textbooks/`, or `public/assignments/` and reference them by root-absolute path (e.g. `/pdfs/MYFILE.pdf`).
4. **Add** a course thumbnail to `public/course_images/` and reference it via `image` (e.g. `/course_images/mycourse.png`).

All local paths in this file are root-absolute (start with `/`) — they're rendered on pages nested inside `public/{term}2026/`, so a plain relative path like `pdfs/x.pdf` would break.

## `STUDENT_DATA` fields

### `termRange`
```javascript
termRange: { start: "2026-01-01", end: "2026-04-30" }
```
The term's date bounds (used for filtering/display).

### `gradingSchemes`
Keyed by course code (e.g. `"MTHE 281"`), powers the grade calculator on `{term}2026/grades.html`.
```javascript
"COURSE CODE": {
    components: [
        { name: "Assignments", weight: 40, count: 5, score: null },
        { name: "Final Exam", weight: 60, count: 1, score: null }
    ]
}
```
- **weight**: percentage of the final grade.
- **count**: how many of this item exist — the calculator auto-generates "Assignment 1", "Assignment 2", etc.
- **dropLowest** (optional): drop the N lowest scores of this component.

### `courses`
Populates the course cards on the term dashboard.
```javascript
{
    code: "MTHE 281",
    name: "Introduction To Real Analysis",
    notes: "https://drive.google.com/...",       // link to lecture notes (URL or local path)
    textbook: "/textbooks/MTHE 281 ....pdf",      // optional, root-absolute local path or URL
    solutions: "/textbooks/MTHE 281 ... Solutions.pdf", // optional
    assignments: "/winter2026/assignments.html?course=MTHE 281",
    image: "/course_images/mthe281.png"
}
```

### `assignments`
The master schedule — powers the calendar, assignment lists, and details pages.
```javascript
{
    id: "mthe281-h1",
    course: "MTHE 281",
    category: "ASSIGNMENT",   // ASSIGNMENT | QUIZ | MIDTERM | LAB | REMINDER, etc. (color-coded)
    title: "Homework 1",
    date: "2026-01-16",       // YYYY-MM-DD
    time: "23:59",            // 24-hour
    status: "PENDING",        // PENDING | UPCOMING
    score: null,
    details: { type: "pdf", url: "/assignments/MTHE281Homework1.pdf" }
    // or: details: { type: "text", content: "No calculators allowed." }
}
```

Assignments added/edited/deleted through the dashboard UI (Add button, delete icon) are written to Firebase Firestore via `js/data-service.js`, not back into this file — the config file is your seed data.

## Styles

Edit `public/css/style.css`. Colors live in the `:root` variables at the top of the file.

```css
:root {
    --bg-color: #09090b;
    --text-primary: #fafafa;
}
```
