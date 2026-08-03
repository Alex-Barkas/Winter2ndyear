# Item Detail Pages

`{term}2026/details.html` is a generic template that renders content for any schedule item based on its ID, fetched from Firestore.

## Query Parameter Routing
When you click an item on the dashboard, you go to `{term}2026/details.html?id=some-id`.
- `js/details.js` reads the `id` query param.
- It fetches the matching item via `DataService.getAssignmentById(id)`.
- It injects the title, date, category, and content into the DOM (`renderDetails()`).

## Page Features
1. **Status Toggle**: "Mark as Done" / "Mark as Pending" button, persisted via `DataService.updateAssignmentStatus`.
2. **Edit Modal**: edit title/course/date/time in place, saved via `DataService.updateAssignmentDetails`.

## Content Types
The `details` property on the assignment object determines what's shown in the content area:
- `type: "text"` — renders `content` as plain text/HTML.
- `type: "pdf"` — embeds `url` in a PDF viewer (`<embed>`).
- `type: "video"` — embeds `url` in an iframe.
- `type: "link"` — shows a button linking out to `url` (e.g. OnQ, Gradescope), with optional `label`.

An optional `images` array (list of URLs) renders as an "Attachments" section below the main content.
