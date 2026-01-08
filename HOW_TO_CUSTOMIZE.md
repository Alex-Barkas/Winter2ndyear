# How to Customize This Dashboard

This dashboard is designed to be easily adaptable for any student schedule. All your specific data—courses, schedule, grades, and links—is stored in **one file**.

## Quick Start

1.  **Open** `public/student-config.js`.
2.  **Edit** the `STUDENT_DATA` object to match your semester.
3.  **Replace** the PDF files in `public/pdfs/` and `public/textbooks/` with your own.

## Configuration Details

### 1. `gradingSchemes`
Define how each course is graded. This powers the Grade Dashboard.
*   **weight**: Percentage of final grade (e.g., `40` for 40%).
*   **count**: How many of this item exist.
    *   *Example*: If you have 4 Labs worth 20% total, set `weight: 20` and `count: 4`. The system will automatically create "Lab 1", "Lab 2" etc., each worth 5%.

```javascript
"COURSE CODE": {
    components: [
        { name: "Assignments", weight: 40, count: 5 },
        { name: "Final Exam", weight: 60, count: 1 }
    ]
}
```

### 2. `courses`
List the courses you are taking. This populates the "Courses" section on the home page.
*   **code**: The course code (e.g., "CMPE 212").
*   **name**: Full course title.
*   **notes**: Path to your lecture notes PDF.
*   **textbook**: Path to your textbook PDF.
*   **assignments**: Link to assignment page (usually `assignments.html?course=CODE`).

### 3. `assignments`
This is your master schedule. It populates the Calendar and Assignment Lists.
*   **id**: Unique ID for the item.
*   **date**: YYYY-MM-DD format.
*   **time**: 24-hour format (e.g., "14:30").
*   **category**: Used for color coding (`LAB`, `MIDTERM`, `FINAL`, `ASSIGNMENT`, `QUIZ`, `REMINDER`).

### 4. Styles (Optional)
To change colors (e.g., if you hate the dark mode), edit `public/style.css`.
*   Check the `:root` variables at the top of the file to change the main colors globally.

```css
:root {
    --bg-color: #09090b; /* Change background */
    --text-primary: #fafafa; /* Change text color */
}
```
