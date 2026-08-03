# Architecture Overview

A static, zero-build dashboard deployed to Vercel (`config/vercel.json`). Assignment/course/todo data is persisted in Firebase Firestore via `js/data-service.js`, with `localStorage` used only as a fallback/cache and for a few client-only values (per-component grade inputs).

## Core Design Principles
1. **Static-First**: HTML/CSS/vanilla JS only, no build step or framework.
2. **Config-Driven**: Course/assignment/grading data per term lives in `public/js/student-config-{term}2026.js`.
3. **Firestore-Backed**: Assignments, courses, and todos are read/written through `DataService` (`js/data-service.js`), so edits made via the dashboard UI persist across devices.

## Directory Structure
- `public/`: the web root.
  - `index.html`: landing page / term picker.
  - `{term}2026/index.html`: term dashboard (courses + upcoming items). Sets `window.TERM_PREFIX` so `script.js` can build the right sub-page links.
  - `{term}2026/assignments.html`: full assignment list for a course.
  - `{term}2026/details.html`: generic detail view for a single assignment/exam, routed by `?id=`.
  - `{term}2026/grades.html`: grade calculator for the term.
  - `todo.html`: cross-term to-do list.
  - `js/script.js`: dashboard rendering (calendar, schedule list, course cards, add/delete UI).
  - `js/details.js`: details-page logic (content rendering, status toggle, edit modal).
  - `js/grading-renderer.js`: grade calculator rendering + per-component score inputs.
  - `js/data-service.js`: Firestore read/write layer (assignments, courses, todos, grades).
  - `js/firebase-config.js`: Firebase project config, imported by `data-service.js`.
  - `js/student-config-{term}2026.js`: the term's course list, grading schemes, and assignment seed data — the main file you edit per term.
- `config/`: `vercel.json` (deployment) and `firestore.rules` (Firestore security rules).
- `scripts/`: standalone Python automation (daily email, Firestore seeding, image processing).
- `docs/`: documentation for developers (you are here).

See `HOW_TO_CUSTOMIZE.md` for the `STUDENT_DATA` schema.
