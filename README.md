# Second Year, Second Sem — Course Dashboard

An [Astro](https://astro.build) dashboard for tracking coursework across a school year split into three terms (winter, summer, fall). Each term has its own dashboard, assignment list, details page, and grade calculator, backed by Firebase Firestore.

Most pages are plain HTML/CSS/vanilla JS (deliberately kept that way — see "Migration notes" below). The grade calculator is the one reactive piece, built as a Svelte island.

## Structure

```
src/
├── pages/
│   ├── index.astro                <-- landing page / term picker
│   ├── todo.astro                 <-- cross-term to-do list
│   ├── calendar.astro             <-- cross-term calendar with drag-and-drop
│   └── [term]/                    <-- dynamic route, built once per term (winter2026/summer2026/fall2026)
│       ├── index.astro              <-- term dashboard (courses + upcoming items)
│       ├── assignments.astro        <-- full assignment list for a course
│       ├── details.astro            <-- single assignment/exam detail view
│       └── grades.astro             <-- grade calculator for the term
├── layouts/BaseLayout.astro       <-- shared <head> (fonts, favicon, css)
├── components/
│   ├── SignatureNav.astro         <-- shared side-nav
│   ├── AddAssignmentModal.astro   <-- shared add-assignment modal markup
│   └── GradeDashboard.svelte      <-- the reactive grade calculator island
├── lib/grade-math.js              <-- pure score/weight-redistribution logic (used by GradeDashboard)
└── data/
    ├── {term}2026.js              <-- per-term data: courses, grading schemes, assignments (hand-edited)
    └── terms.js                   <-- merges all three terms for todo/calendar pages

public/                            <-- passthrough static assets (unchanged, served as-is)
├── css/                            <-- stylesheets (style.css + one per page type)
├── js/
│   ├── script.js                    <-- dashboard rendering, add/delete UI
│   ├── details.js                   <-- details page logic
│   ├── data-service.js              <-- Firestore read/write layer
│   ├── firebase-config.js           <-- Firebase project config
│   ├── assignments-page.js, todo-page.js, calendar-page.js, ui-utils.js
├── assets/                         <-- favicons
├── course_images/                  <-- course card thumbnails
├── pdfs/, textbooks/, assignments/, syllabus/  <-- course PDFs referenced from data files
└── course-links/                   <-- personal Drive/NotebookLM/OnQ links per course

config/firestore.rules             <-- Firestore security rules
vercel.json                        <-- deployment config (clean URLs, no trailing slash)

scripts/                           <-- standalone Python automation
├── auto_email_rest.py               <-- sends the daily agenda email (via Firebase REST API)
├── seed_assignments.py              <-- bulk-load assignments into Firestore
├── process_img.py                   <-- image processing helper
└── add_ab_to_leaf.py

.github/workflows/daily_email.yml  <-- cron job that runs auto_email_rest.py daily at 8/9am ET
```

`{term}` is one of `winter2026`, `summer2026`, `fall2026`. Each term's data lives in its own `src/data/{term}2026.js` file; the four `src/pages/[term]/*.astro` templates are shared across all three terms via Astro's `getStaticPaths()`, so a change to a template applies to every term at once. All internal links and asset paths are root-absolute (e.g. `/css/style.css`, `/winter2026/grades`) so pages work the same regardless of folder depth.

## Running locally

```
npm install
npm run dev
```
Serves the site at `http://localhost:4321` with clean URLs (no `.html` needed). `npm run build` produces a static build in `dist/`; `npm run preview` serves that build locally.

`server.py` / `run_website.bat` (the old stdlib-Python dev server) are superseded by `npm run dev` and no longer needed for local dev. They're left in the repo rather than deleted, but can be removed once the Astro workflow is confirmed working.

## Data flow

- `src/data/{term}2026.js` defines the courses, grading schemes, and assignments for that term (hand-edited).
- `public/js/data-service.js` reads/writes assignment state (scores, completion, manually-added items) to Firebase Firestore, so changes persist across devices.
- The daily email automation (`scripts/auto_email_rest.py`, run via GitHub Actions) reads Firestore directly and emails an agenda summary each morning — unaffected by the frontend framework.

See `HOW_TO_CUSTOMIZE.md` for how to edit course/assignment data, and `docs/` for page-specific notes.

## Migration notes

This project was migrated from a zero-framework static site to Astro to eliminate the triplicated per-term HTML pages and the runtime `window`-global data-merging hack `todo.html`/`calendar.html` used to rely on. Per an explicit scope decision, most of the interactive JS (`script.js`, `details.js`, `assignments-page.js`, `todo-page.js`, `calendar-page.js`) was carried over **byte-identical** rather than rewritten — it's still loaded as plain `<script>` tags from `public/js/`, untouched. The one exception is the grade calculator, which was rewritten as a reactive Svelte component (`src/components/GradeDashboard.svelte`) backed by pure logic in `src/lib/grade-math.js`.

**Deployment**: Vercel's Root Directory must be changed from `public/` to the repo root, with Framework Preset set to Astro, before this branch can deploy — see the PR/handoff notes for details.
