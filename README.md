# Notes Portal

A minimalist, static archive for course materials.

## Overview
- **Zero Frameworks**: Pure HTML, CSS, and JS.
- **Automated**: GitHub Actions push PDFs to `public/pdfs/`.
- **Easy Updates**: Edit `script.js` to add new links.

## Directory Structure
```
site-notes-2026w/
├── index.html       <-- Main layout
├── style.css        <-- Matte Zinc theme
├── script.js        <-- Content data (Textbooks & Courses)
├── public/pdfs/     <-- Automated PDF drop zone
└── course_automation_templates/  <-- Templates for your other repos
```

## How to add a course
1.  Open `script.js`.
2.  Add an entry to the `courses` array:
    ```javascript
    {
        code: "NEW 101",
        name: "New Course Name",
        link: "pdfs/NEW101.pdf",
        action: "PDF"
    }
    ```
