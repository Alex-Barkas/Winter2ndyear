# Calendar & Schedule

The scheduling system consolidates deadlines from all of a term's courses into a single view on `{term}2026/index.html`.

## Data Source
Events are seeded from the `assignments` array in `public/js/student-config-{term}2026.js`, then read/written through `DataService` (`js/data-service.js`), which is backed by Firebase Firestore.
- **Properties**:
  - `id`: unique identifier (used for routing to `{term}2026/details.html?id=...`).
  - `date` / `time`: `YYYY-MM-DD` / 24-hour `HH:MM`.
  - `category`: determines color/icon (`LAB`, `MIDTERM`, `QUIZ`, `ASSIGNMENT`, `REMINDER`, etc.).
  - `status`: `PENDING`, `DONE`, `UPCOMING`.

## Calendar View
- **Render Logic**: `js/script.js` → `renderCalendar()`.
- **Visuals**: dots indicate a deadline exists on that day.

## List View
- **Render Logic**: `js/script.js` → `renderGlobalSchedule()` and `renderAssignments()`.
- **Grouping**: grouped for easy scanning by course/date.

## How to Add an Item
Add an object to the `assignments` array in the relevant `student-config-{term}2026.js`:
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
Items can also be added directly from the dashboard UI (Add button); those are written straight to Firestore via `DataService.addAssignment`, not into the config file.
