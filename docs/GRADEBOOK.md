# Gradebook System

The grade calculator (`{term}2026-grades.html`, and course cards on the dashboard) lets you input grades per component and see the resulting weighted mark, rendered by `js/grading-renderer.js` (`GradingRenderer`).

## How it Works
1. **Configuration**: defined per term in `student-config-{term}2026.js` under `gradingSchemes`.
   - `weight`: percent of the course grade.
   - `count`: e.g. 4 Labs → expands to Lab 1, Lab 2, Lab 3, Lab 4 input rows.
   - `dropLowest` (optional): drop the N lowest scores of that component.
2. **Persistence**:
   - If a component row is linked to a real assignment (matched by course + component name), its score is stored on that assignment via `DataService` (Firestore).
   - Manually-entered component scores that aren't tied to a specific assignment fall back to `localStorage`, keyed per course/component/index.
3. **Calculation**: `GradingRenderer` computes each course's weighted total from the entered component scores as they're typed.

## Use Case
- Log quiz/lab/assignment marks as they come back.
- See a running estimate of the current grade, and what's still needed on remaining components.
