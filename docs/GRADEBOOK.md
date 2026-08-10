# Gradebook System

The grade calculator (`src/pages/[term]/grades.astro`, route `/{term}/grades`, and course cards on the dashboard) lets you input grades per component and see the resulting weighted mark. It's the one part of the site rebuilt as a reactive component rather than carried over as plain JS — `src/components/GradeDashboard.svelte`, backed by pure functions in `src/lib/grade-math.js`.

## How it Works
1. **Configuration**: defined per term in `src/data/{term}2026.js` under `gradingSchemes`.
   - `weight`: percent of the course grade.
   - `count`: e.g. 4 Labs → expands to Lab 1, Lab 2, Lab 3, Lab 4 input rows.
   - `dropLowest` (optional): drop the N lowest scores of that component.
2. **Persistence**:
   - If a component row is linked to a real assignment (matched by course + component name via `findAssignment()` in `grade-math.js`), its score is stored on that assignment via `DataService` (Firestore).
   - Manually-entered component scores that aren't tied to a specific assignment are stored as grade-override docs (also Firestore-backed, with a `localStorage` fallback for entries older than the override system).
3. **Calculation**: `computeCourseTotals()` in `grade-math.js` computes each course's weighted total from the entered component scores, including drop-lowest exclusion and weight redistribution across the remaining rows. `GradeDashboard.svelte` re-derives this reactively (Svelte `$derived`) as scores change — no manual re-render calls.
4. **What-if projection**: given a target final letter grade, the banner shows the average still needed on the ungraded remainder of the course to hit it.

## `src/lib/grade-math.js`
Framework-agnostic port of the score/exclusion/weight-redistribution logic that used to live in `public/js/grading-renderer.js`. No DOM, no Firestore access — pure functions over plain data (`assignments`, `overrides`, a grading `scheme`) so the math can be reasoned about (and tested) independently of the Svelte UI that consumes it.

## Use Case
- Log quiz/lab/assignment marks as they come back.
- See a running estimate of the current grade, and what's still needed on remaining components to hit a target letter grade.
