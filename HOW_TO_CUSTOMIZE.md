# How to Customize This Dashboard

Each term's data lives in its own file: `src/data/winter2026.js`, `summer2026.js`, `fall2026.js`. Edit the one for the term you want to change.

## Quick Start

1. **Open** the `src/data/{term}2026.js` file for the term.
2. **Edit** the default-exported object (see fields below).
3. **Add** any new PDFs to `public/pdfs/`, `public/textbooks/`, or `public/assignments/` and reference them by root-absolute path (e.g. `/pdfs/MYFILE.pdf`).
4. **Add** a course thumbnail to `public/course_images/` and reference it via `image` (e.g. `/course_images/mycourse.png`).

All local paths in this file are root-absolute (start with `/`) — they're rendered on pages nested at `/{term}2026/...`, so a plain relative path like `pdfs/x.pdf` would break.

## Data file fields

### `termRange`
```javascript
termRange: {
    start: "2026-01-01",
    end: "2026-04-30",
    classesStart: "2026-01-05",                          // optional
    readingWeek: { start: "2026-02-16", end: "2026-02-22" }  // optional
}
```
`start`/`end` are the term's date bounds, used to scope which assignments each
term's pages show.

`classesStart` anchors the "Week N" labels on `/{term}2026/assignments` — the
first day of classes, which is usually a few days after `start`. Falls back to
`start` when omitted.

`readingWeek` marks a mid-term break: dates inside it are labelled "Reading Week"
instead of a week number, and the weeks after it are numbered as if the break
never happened. **Omit the key entirely** for terms with no reading week (Summer
and Fall) — don't use a far-future placeholder date.

### `gradingSchemes`
Keyed by course code (e.g. `"MTHE 281"`), powers the grade calculator on `/{term}2026/grades`.
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
    assignments: "/winter2026/assignments?course=MTHE 281",
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

Assignments added/edited/deleted through the dashboard UI (Add button, delete icon) are written to Firebase Firestore via `public/js/data-service.js`, not back into this file — the config file is your seed data.

## Styles

Edit `public/css/style.css`. Colors live in the `:root` variables at the top of the file.

```css
:root {
    --bg-color: #09090b;
    --text-primary: #fafafa;
}
```
