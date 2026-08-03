# PDF & Resource Management

The site hosts course materials locally to avoid broken links and dependency on external LMS platforms (like OnQ).

## Storage
- **`public/pdfs/`**: lecture notes, assignment specs, misc course PDFs.
- **`public/textbooks/`**: textbook and solutions-manual PDFs.
- **`public/assignments/`**: per-assignment PDFs referenced from an assignment's `details.url`.
- **`public/syllabus/`**: grading breakdowns and syllabus PDFs per course.
- **`public/course_images/`**: course card thumbnails, referenced via a course's `image` field.
- **`public/course-links/`**: personal reference lists (Google Drive, NotebookLM, OnQ links per course) — not rendered by any page, just quick-reference `.md` files for you.

## Linking
In `student-config-{term}2026.js`, reference these files with a root-absolute path (leading `/`) — term pages live one level deep in `public/{term}2026/`, so a plain relative path would resolve to the wrong folder:
```javascript
courses: [
    {
        code: "MTHE 281",
        notes: "https://drive.google.com/...",              // can be a local path or external URL
        textbook: "/textbooks/MTHE 281 Abbott - Understanding Analysis.pdf",
        solutions: "/textbooks/MTHE 281 Understanding Analysis Solutions.pdf",
        image: "/course_images/mthe281.png"
    }
]
```
Assignment PDFs are referenced the same way via `details: { type: "pdf", url: "/assignments/..." }` or `"/pdfs/..."`.

## Best Practices
- **Naming**: keep filenames simple and consistent (e.g. `COURSECODE_Type.pdf`).
- **Updates**: if a professor releases a new version, just overwrite the file in place — the link stays the same.
- **Once a term ends**: if a course's materials are no longer referenced by any `student-config-*.js`, remove the PDFs/images/links rather than leaving them as dead weight in the repo.
