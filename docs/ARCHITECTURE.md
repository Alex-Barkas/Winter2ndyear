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
  - `{term}2026/assignments.html`: assignment list, filtered by `?course=`. Thin markup only — sets `window.TERM_PREFIX` and loads the shared `js/assignments-page.js`.
  - `{term}2026/details.html`: generic detail view for a single assignment/exam, routed by `?id=`.
  - `{term}2026/grades.html`: grade calculator for the term.
  - `todo.html`: cross-term to-do list. Thin markup only; logic lives in `js/todo-page.js`. Loads all three term configs so its course dropdown spans every term — this page is deliberately **not** scoped by `termRange`.
  - `js/script.js`: dashboard rendering (calendar, schedule list, course cards, add/delete UI).
  - `js/details.js`: details-page logic (content rendering, status toggle, edit modal).
  - `js/grading-renderer.js`: grade calculator rendering + per-component score inputs.
  - `js/assignments-page.js`: assignments list — filtering, sorting, grouping, and the status toggle. Shared by all three term pages.
  - `js/todo-page.js`: to-do list — add/edit/delete, filtering, sorting, grouping.
  - `js/ui-utils.js`: shared helpers for both list pages — HTML escaping, date formatting, the OVERDUE/TODAY/TOMORROW status language, semester-week labelling, term scoping, the `Prefs` localStorage layer, and toasts.
  - `js/data-service.js`: Firestore read/write layer (assignments, courses, todos, grades).
  - `js/firebase-config.js`: Firebase project config, imported by `data-service.js`.
  - `js/student-config-{term}2026.js`: the term's course list, grading schemes, and assignment seed data — the main file you edit per term.
- `config/`: `vercel.json` (deployment) and `firestore.rules` (Firestore security rules).
- `scripts/`: standalone Python automation (daily email, Firestore seeding, image processing).
- `docs/`: documentation for developers (you are here).

### Stylesheets
`css/style.css` is global (design tokens + page chrome, loaded everywhere).
`css/list-ui.css` holds the shared list-page chrome — control bar, collapsible
groups, progress meters, summary banner, empty states, toasts — used by both the
to-do and assignments pages. `css/todo.css`, `css/assignments.css` and
`css/grades.css` each hold only what is specific to their page.

Cache-busting is manual: every stylesheet and script is referenced with a `?v=`
query string, so bumping `style.css` means updating all 14 HTML files.

See `HOW_TO_CUSTOMIZE.md` for the `STUDENT_DATA` schema.
