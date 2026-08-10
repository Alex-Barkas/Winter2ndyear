# Calendar & Schedule

There are two places deadlines show up:

1. **`src/pages/calendar.astro`** (route: `/calendar`) — the unified calendar. A single, cross-term Month/Agenda view of every course's assignments *and* every to-do, across all three terms, with drag-and-drop rescheduling. This is the main way to see "what's due."
2. **Each term dashboard's SCHEDULE section** (`src/pages/[term]/index.astro`, route `/{term}`) — a simple chronological list of that term's own deadlines only, rendered by `renderGlobalSchedule()` in `js/script.js`. It links out to the unified calendar via a "Full Calendar →" button rather than embedding its own grid (an earlier version had a small month-grid widget here too; it was removed in favor of one unified page once the schedule became easy enough to miss that it needed its own page).

## Data Source

Both assignments and to-dos are read/written through `DataService` (`js/data-service.js`), backed by Firebase Firestore. Assignments are a single global collection across all terms; to-dos likewise. Per-term pages scope assignments to their own term client-side (by date range, via `js/ui-utils.js`'s `makeTermScope`); the unified calendar does not scope at all by default (it shows everything, with an optional term filter).

**Assignment fields**: `id`, `course`, `category` (`LAB`, `TUTORIAL`, `MIDTERM`, `QUIZ`, `ASSIGNMENT`, `HOMEWORK`, `FINAL`, `REMINDER`), `title`, `date` (`YYYY-MM-DD` or `"TBD"` for unscheduled), `time` (`HH:MM`, 24hr), `status` (`PENDING`, `DONE`, `UPCOMING`), `score`, `details: {type, url|content}`.

**To-do fields**: `id`, `title`, `course` (a course code, or `"Personal"`), `urgency` (1–5), `date` (`YYYY-MM-DD` or `""` for unscheduled — to-dos have no `"TBD"` sentinel, no `time` field), `completed`, `createdAt`.

## Unified Calendar (`calendar.astro` / `js/calendar-page.js`)

- **Cross-term loading**: `calendar.astro` imports all three `src/data/{term}2026.js` files server-side via `src/data/terms.js` (same merge `todo.astro` does), and additionally stashes each term's `termRange` (not just its `courses`) into `window.__termRanges`, plus a `window.__courseTermMap` (course code → term) built while merging — needed so an item can be linked back to the right term's `details` route and reading-week context.
- **Views**: Month grid (real title chips, not just dots — clicking a day expands it in the side panel) and an Agenda/List view grouped by date, toggled via the same `.list-segmented` control used on `todo.astro`/`assignments.astro`.
- **Filters**: term, course, and category, using the shared `.list-chips` chrome from `css/list-ui.css`.
- **Unscheduled tray**: a sidebar list of undated to-dos (`date: ""`) and TBD assignments (`date: "TBD"`) — drag one onto a day to schedule it, or drag a scheduled item back onto the tray to clear its date.
- **Drag-and-drop**: hand-built with Pointer Events (no library), supporting both mouse and touch (long-press to start on touch). Dragging an assignment calls `DataService.updateAssignmentDetails(id, {date})`; dragging a to-do resends the full object via `DataService.saveTodoItem` (to-dos have no partial-update method). Both roll back and show an error toast if the write fails.
- **Course colors**: no `color` field exists on course config objects, so `calendar-page.js` derives one deterministically by hashing the course code into a fixed palette (`hashCourseColor` in `js/calendar-page.js`). Assignment chips are colored by category instead (matching `assignments-page.js`'s `CATEGORY_COLORS`), since category is more informative than course for coursework.
- **Reading week**: read from each term's own `termRange.readingWeek` via `js/ui-utils.js`'s `makeWeekLabeller` — never hardcoded (the old per-term calendar had reading-week dates hardcoded in two different places that disagreed with the config; this doesn't repeat that).
- **Add/Edit/Delete**: a shared modal (`css/modal.css`, also linked from the term dashboards — see below) handles both assignments and to-dos, branching on a Type selector.

## Term Dashboard List View

- **Render logic**: `js/script.js` → `renderGlobalSchedule()`, using `createAssignmentCard`/`createTodoScheduleCard` and `getSemesterWeek()` for week labels (this function still has hardcoded reading-week dates — out of scope to fix here since only the unified calendar reads `termRange.readingWeek` properly).
- **Grouping**: active items first (sorted by date), then done items.

## Shared Modal (`css/modal.css`)

`.modal-overlay`/`.modal-content`/`.input-group`/`.modal-actions` used to live only in `details.astro`'s inline `<style>` block, which meant the dashboard's own "Add Assignment" modal (`AddAssignmentModal.astro`, rendered on `src/pages/[term]/index.astro`) rendered completely unstyled — it used those class names but never loaded any CSS defining them. Extracting this into one shared file, linked from both the term dashboards and `calendar.astro`, fixed that as a side effect of building the calendar's own add/edit modal.

## How to Add an Item

Preferred: use the unified calendar's "+ Add Event" button, or a term dashboard's "Add Assignment" modal — both write straight to Firestore via `DataService`.

To seed one directly in config instead, add an object to the `assignments` array in the relevant `src/data/{term}2026.js`:
```javascript
{
    id: "unique-id",
    course: "CODE",
    category: "TYPE",
    title: "Title",
    date: "2026-01-01",
    time: "23:59",
    status: "PENDING",
    score: null,
    details: { type: "text", content: "Details..." }
}
```
