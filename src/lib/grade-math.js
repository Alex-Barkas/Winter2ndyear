// Framework-agnostic port of the score/exclusion/weight-redistribution logic
// that used to live in public/js/grading-renderer.js (_computeCourseTotals /
// _findAssignment). No DOM, no Firestore -- pure functions over plain data so
// they can be tested independently of the Svelte UI that consumes them.

// Locates the assignment (if any) linked to a given grading-scheme component
// row, by category + title heuristics against the course's assignment list.
export function findAssignment(assignments, course, componentName, index) {
    let targetCategory = "";
    const nameLower = componentName.toLowerCase();

    if (nameLower.includes("lab")) targetCategory = "LAB";
    else if (nameLower.includes("tutorial") || nameLower.includes("active learning")) targetCategory = "TUTORIAL";
    else if (nameLower.includes("quiz")) targetCategory = "QUIZ";
    else if (nameLower.includes("midterm") || nameLower.includes("test")) targetCategory = "MIDTERM";
    else if (nameLower.includes("homework") || nameLower.includes("assignment")) targetCategory = "ASSIGNMENT";

    let matches = assignments.filter(a => a.course === course);

    if (targetCategory) {
        const catMatches = matches.filter(a => a.category === targetCategory);
        if (catMatches.length > 0) {
            matches = catMatches;

            // Refine by title if possible (e.g. "Midterm 1" should specifically match "Midterm 1" title)
            // This helps when multiple components share a category but have specific names
            const refinedMatches = matches.filter(a => a.title.toLowerCase().includes(nameLower));
            if (refinedMatches.length > 0) {
                matches = refinedMatches;
            }
        } else {
            const titleMatches = matches.filter(a => a.title.toLowerCase().includes(nameLower.replace(/s$/, '')));
            if (titleMatches.length > 0) matches = titleMatches;
            else matches = []; // Strict: If no category AND no title match, return nothing.
        }
    } else {
        matches = matches.filter(a => a.title.toLowerCase().includes(nameLower));
    }

    matches.sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return a.title.localeCompare(b.title);
    });

    return matches[index];
}

// Reads a manual (non-Firestore-synced) row's saved score. Mirrors the old
// renderer's fallback chain: a gradeOverrides doc, then a legacy localStorage
// value for rows that predate gradeOverrides existing at all.
function readManualScore(uniqueId, overrides) {
    const overrideDoc = overrides.find(o => o.id === uniqueId);
    if (overrideDoc) {
        return {
            sourceDoc: overrideDoc,
            score: (overrideDoc.score !== null && overrideDoc.score !== undefined) ? parseFloat(overrideDoc.score) : null,
        };
    }
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(uniqueId) : null;
    const score = (saved !== null && saved !== "") ? parseFloat(saved) : null;
    return { sourceDoc: null, score };
}

// Computes per-row score/exclusion/weight data for a course, applying
// explicit `excluded` flags and auto-drop-lowest, without producing any HTML.
// Returns { rows, currentPoints, currentWeight, totalWeight }.
export function computeCourseTotals(course, scheme, assignments, overrides) {
    overrides = overrides || [];
    let totalWeight = 0;
    let currentPoints = 0;
    let currentWeight = 0;
    const rows = [];

    scheme.components.forEach((comp, compIdx) => {
        const count = comp.count || 1;
        const dropLowest = comp.dropLowest || 0;
        const compRows = [];

        for (let i = 0; i < count; i++) {
            const linkedAssignment = findAssignment(assignments, course, comp.name, i);
            let score = null;
            let isSynced = false;
            let uniqueId = `manual-${course.replace(/\s/g, '')}-${compIdx}-${i}`;
            let sourceDoc = null;

            if (linkedAssignment) {
                if (linkedAssignment.score !== null && linkedAssignment.score !== undefined) {
                    score = parseFloat(linkedAssignment.score);
                }
                isSynced = true;
                uniqueId = linkedAssignment.id;
                sourceDoc = linkedAssignment;
            } else {
                const manual = readManualScore(uniqueId, overrides);
                sourceDoc = manual.sourceDoc;
                score = manual.score;
            }

            if (score !== null && isNaN(score)) score = null;

            // Tri-state: explicit `excluded` field (true/false) always wins.
            // Absent entirely => decided later by auto-drop-lowest.
            let explicitExcluded; // undefined | true | false
            if (sourceDoc && typeof sourceDoc.excluded === 'boolean') {
                explicitExcluded = sourceDoc.excluded;
            }

            compRows.push({
                comp,
                compIdx,
                i,
                score,
                isSynced,
                uniqueId,
                linkedAssignment,
                explicitExcluded,
                isExcluded: explicitExcluded === true,
                autoReason: explicitExcluded === true ? 'explicit' : null
            });
        }

        // Auto-drop-lowest: only once ALL count rows in this component are scored.
        if (dropLowest > 0) {
            const allScored = compRows.every(r => r.score !== null);
            if (allScored) {
                const explicitlyExcludedCount = compRows.filter(r => r.explicitExcluded === true).length;
                const n = Math.max(0, dropLowest - explicitlyExcludedCount);
                if (n > 0) {
                    const eligible = compRows.filter(r => r.explicitExcluded === undefined);
                    eligible.sort((a, b) => a.score - b.score);
                    for (let k = 0; k < Math.min(n, eligible.length); k++) {
                        eligible[k].isExcluded = true;
                        eligible[k].autoReason = 'auto';
                    }
                }
            }
        }

        // effectiveUnitWeight: spread the component's weight across the rows that
        // will actually remain after dropping the lowest N. A manual drop beyond
        // dropLowest (e.g. a waived assignment) permanently removes a row from
        // consideration too, so it must widen the denominator the same way --
        // otherwise its weight share never gets redistributed and instead sits
        // stuck in totalWeight forever, showing up as un-droppable "unmarked" %.
        const explicitlyExcludedCount = compRows.filter(r => r.explicitExcluded === true).length;
        const denom = count - Math.max(dropLowest, explicitlyExcludedCount);

        let effectiveUnitWeight;
        let componentTotalWeight;
        if (denom <= 0) {
            // Every row in this component ends up dropped -- the whole component
            // drops out of the course rather than sitting in totalWeight as
            // permanently-ungraded weight.
            effectiveUnitWeight = 0;
            componentTotalWeight = 0;
        } else {
            effectiveUnitWeight = comp.weight / denom;
            componentTotalWeight = comp.weight;
        }
        totalWeight += componentTotalWeight;

        compRows.forEach(r => {
            r.effectiveUnitWeight = effectiveUnitWeight;
            if (!r.isExcluded && r.score !== null) {
                currentPoints += (r.score / 100) * effectiveUnitWeight;
                currentWeight += effectiveUnitWeight;
            }
        });

        rows.push(...compRows);
    });

    return { rows, currentPoints, currentWeight, totalWeight };
}

export function getGradeColor(grade) {
    if (grade >= 80) return '#4ade80';
    if (grade >= 70) return '#facc15';
    if (grade >= 60) return '#fb923c';
    return '#f87171';
}
