# Architecture Overview

This project is a static student dashboard designed to be hosted on GitHub Pages or any static file server. It requires no backend database; all persistence is handled via `localStorage` in the user's browser.

## Core Design Principles
1.  **Static-First**: HTML/CSS/JS only. No build steps required (unless you want to optimize).
2.  **Config-Driven**: All student-specific data (courses, schedule, grading) is in `public/student-config.js`.
3.  **Local Persistence**: Grades and checklist statuses are saved in the browser's `localStorage`.

## Directory Structure
-   `public/`: The web root.
    -   `index.html`: Main dashboard (Calendar, Planning, Courses).
    -   `grades.html`: Grade tracker.
    -   `details.html`: Generic detail view for any schedule item.
    -   `script.js`: Core logic for global schedule and calendar.
    -   `details.js`: Logic specific to the detail page (Timer, Checklist).
    -   `student-config.js`: The **only** file a student needs to edit.
-   `docs/`: Documentation for developers (You are here).
