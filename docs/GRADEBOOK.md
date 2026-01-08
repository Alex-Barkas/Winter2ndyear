# Gradebook System

The gradebook (`grades.html`) allows students to input grades for individual components and see their potential final mark.

## How it Works
1.  **Configuration**: Defined in `student-config.js` under `gradingSchemes`.
    -   Supports `weight` (percent of total course).
    -   Supports `count` (e.g., 4 Labs -> expands to Lab 1, Lab 2, Lab 3, Lab 4).
2.  **Persistence**:
    -   Input grades are saved to `localStorage` with a key like `grade-MTHE281-0-1` (Course + Component Index + Sub-index).
    -   On load, these values are retrieved to populate the inputs.
3.  **Calculation**:
    -   Dynamic updates happen via `calculateCourseGrade` in `script.js`.
    -   Currently supports standard weighted sum: `Sum(Grade * Weight)`.
    -   Future: Support "Max Option" logic (e.g., Best of Method A vs Method B).

## Use Case
Students use this to:
-   Log quiz/lab marks as they get them.
-   Estimate what they need on the final exam to pass or get an A.
