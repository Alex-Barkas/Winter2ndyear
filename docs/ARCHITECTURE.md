# Architecture Overview

An [Astro](https://astro.build) static site deployed to Vercel (`vercel.json`, Root Directory = repo root, Framework Preset = Astro). Assignment/course/todo data is persisted in Firebase Firestore via `public/js/data-service.js`, with `localStorage` used as an offline fallback/cache and merged back in on load (see "Local/cloud merge" below).

## Core Design Principles
1. **Static-first, framework where it earns its keep**: pages are built by Astro (`output: 'static'`); the interactive dashboard chrome (`script.js`, `details.js`, `assignments-page.js`, `todo-page.js`, `calendar-page.js`) was carried over byte-identical as plain `<script>` tags from `public/js/`, unrewritten. The one page rebuilt as a framework component is the grade calculator, a Svelte island (`src/components/GradeDashboard.svelte`) — see `GRADEBOOK.md`.
2. **Config-driven**: course/assignment/grading data per term lives in `src/data/{term}2026.js` (e.g. `winter2026.js`).
3. **One template per page type, shared across terms**: `src/pages/[term]/*.astro` is a dynamic route built once per term via `getStaticPaths()`, so a template change applies to every term (winter2026/summer2026/fall2026) at once — no more triplicated per-term HTML.
4. **Firestore-backed**: assignments, courses, and todos are read/written through `DataService` (`public/js/data-service.js`), so edits made via the dashboard UI persist across devices.

## Directory Structure
- `src/pages/`: Astro routes.
  - `index.astro`: landing page / term picker (`/`).
  - `todo.astro`: cross-term to-do list (`/todo`).
  - `calendar.astro`: cross-term calendar with drag-and-drop (`/calendar`).
  - `[term]/`: dynamic route, one build per term (`winter2026`, `summer2026`, `fall2026`).
    - `index.astro`: term dashboard — courses + upcoming items (`/{term}`). Sets `window.TERM_PREFIX` so `script.js` can build the right sub-page links.
    - `assignments.astro`: assignment list, filtered by `?course=` (`/{term}/assignments`). Thin markup — loads the shared `public/js/assignments-page.js`.
    - `details.astro`: generic detail view for a single assignment/exam, routed by `?id=` (`/{term}/details`).
    - `grades.astro`: grade calculator for the term (`/{term}/grades`), renders the `GradeDashboard.svelte` island.
- `src/layouts/BaseLayout.astro`: shared `<head>` (fonts, favicon, `style.css`).
- `src/components/`:
  - `SignatureNav.astro`: shared side-nav.
  - `AddAssignmentModal.astro`: shared add-assignment modal markup.
  - `GradeDashboard.svelte`: the reactive grade calculator island.
- `src/lib/grade-math.js`: pure score/weight-redistribution logic used by `GradeDashboard.svelte` (see `GRADEBOOK.md`).
- `src/data/`:
  - `{term}2026.js`: the term's course list, grading schemes, and assignment seed data — the main file you edit per term (see `HOW_TO_CUSTOMIZE.md`).
  - `term-meta.js`: per-term display labels (nav heading, course-code placeholder).
  - `terms.js`: merges all three terms' data for the todo/calendar pages.
- `public/`: passthrough static assets, unchanged, served as-is.
  - `css/`: stylesheets (`style.css` + one per page type).
  - `js/`:
    - `script.js`: dashboard rendering (schedule list, course cards, add/delete UI).
    - `details.js`: details-page logic (content rendering, status toggle, edit modal).
    - `data-service.js`: Firestore read/write layer (assignments, courses, todos, grades), plus the local/cloud merge described below.
    - `firebase-config.js`: Firebase project config, imported by `data-service.js`.
    - `assignments-page.js`, `todo-page.js`, `calendar-page.js`, `ui-utils.js`: list/calendar page logic, shared helpers.
  - `assets/`: favicons.
  - `course_images/`: course card thumbnails.
  - `pdfs/`, `textbooks/`, `assignments/`, `syllabus/`: course PDFs referenced from `src/data/` files.
- `config/firestore.rules`: Firestore security rules.
- `vercel.json`: deployment config (clean URLs, no trailing slash).
- `scripts/`: standalone Python automation (daily email, Firestore seeding, image processing).
- `server.py` / `run_website.bat`: the old stdlib-Python dev server, superseded by `npm run dev`. Left in the repo but unused — see `README.md`'s Migration notes.
- `docs/`: documentation for developers (you are here).

### Local/cloud merge (`data-service.js`)
`getAllAssignments()` and `getGradeOverrides()` don't just overwrite `localStorage` with whatever Firestore returns — writes via `addAssignment()`/`setGradeOverride()` are fire-and-forget (`setDoc` doesn't block navigation), so a load can race an in-flight write. Both methods merge cloud results with any `localStorage` entries Firestore doesn't have yet (cloud wins per id), so navigating away right after adding an item or typing a score can't silently drop it.

### Stylesheets
`css/style.css` is global (design tokens + page chrome, loaded everywhere).
`css/list-ui.css` holds the shared list-page chrome — control bar, collapsible
groups, progress meters, summary banner, empty states, toasts — used by both the
to-do and assignments pages. `css/todo.css`, `css/assignments.css`, `css/grades.css`,
and `css/calendar.css` each hold only what is specific to their page. `css/modal.css`
holds the shared add/edit modal styles used across term dashboards and the calendar.

Cache-busting is manual: stylesheets and scripts are referenced with a `?v=` query
string in the `.astro` templates, so bumping `style.css` means updating the version
string wherever it's linked.

See `HOW_TO_CUSTOMIZE.md` for the per-term data file schema.
