# PDF & Resource Management

The site is designed to host course materials locally to avoid broken links and dependency on external LMS (like OnQ).

## Storage
-   **`public/pdfs/`**: Store course syllabi, assignment specifications, and lecture notes here.
-   **`public/textbooks/`**: Store PDF textbooks or solution manuals here.

## linking
In `student-config.js`, you reference these files relative to the `public` root:
```javascript
courses: [
    {
        code: "MTHE 281",
        notes: "pdfs/MTHE281.pdf", // Link to notes
        textbook: "textbooks/Understanding_Analysis.pdf" // Link to book
    }
]
```

## Best Practices
-   **Naming**: Keep filenames simple and consistent (e.g., `COURSECODE_Type.pdf`).
-   **Updates**: If a professor releases a new version, just overwrite the file in the folder. The link remains the same.
