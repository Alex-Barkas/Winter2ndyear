# Calendar & Schedule

The scheduling system is the heart of the dashboard. It consolidates deadlines from all courses into a single view.

## Data Source
All events are defined in the `assignments` array in `student-config.js`.
-   **Properties**:
    -   `id`: Unique identifier (used for routing to `details.html`).
    -   `date`: YYYY-MM-DD.
    -   `category`: Determines color/icon (`LAB`, `MIDTERM`, `QUIZ`, etc.).
    -   `status`: `PENDING`, `DONE`, `UPCOMING`.

## Calendar View
-   **Render Logic**: `script.js` -> `renderCalendar()`.
-   **Visuals**:
    -   **Dots**: Indicate a deadline exists on that day.
    -   **Week Labels**: `W1`, `W2`, `RW` (Reading Week) shown on Mondays.
    -   **Reading Week**: Visual highlight for the break period.

## List View
-   **Render Logic**: `script.js` -> `renderGlobalSchedule()`.
-   **Grouping**: Grouped by Month for easy scanning.

## How to Add an Item
Add an object to the `assignments` array in `student-config.js`:
```javascript
{ 
    id: "unique-id", 
    course: "CODE", 
    category: "TYPE", 
    title: "Title", 
    date: "2026-01-01", 
    time: "23:59", 
    status: "PENDING", 
    details: { type: "text", content: "Details..." } 
}
```
