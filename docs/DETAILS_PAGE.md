# Item Detail Pages

The `details.html` page is a generic template that renders content for *any* schedule item based on its ID.

## Query Parameter Routing
When you click an item in the calendar, you go to `details.html?id=some-id`.
-   `details.js` reads this ID.
-   It finds the corresponding object in `student-config.js`.
-   It injects the title, date, and specific content into the DOM.

## Productivity Modules
This page includes interactive tools to help students complete the task:
1.  **Checklist**: Add breakdown tasks (e.g., "Question 1", "Format Report"). Saved to `localStorage`.
2.  **Focus Timer**: A simple Pomodoro timer (25m default) to encourage deep work.
3.  **Grade Input**: Quick way to log the grade for this specific item once returned.

## Content Types
The `details` property in the config object determines what is shown:
-   `type: "pdf"`: Embeds a PDF viewer (great for assignment specs).
-   `type: "text"`: Renders simple HTML text/instructions.
-   `type: "link"`: Provides a button to an external site (e.g., OnQ, Gradescope).
