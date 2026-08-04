import { DataService } from './data-service.js';

export const GradingRenderer = {

    // --- Public: Render a single course's grade card into a container ---
    // If courseName is null, it renders ALL courses (for the global dashboard)
    async render(container, specificCourseName = null, assignments) {
        if (!assignments) {
            assignments = await DataService.getAllAssignments();
        }
        const overrides = await DataService.getGradeOverrides();

        // Cache the inputs to this render so pure-UI state changes (e.g. collapsing
        // a component group) can rebuild the DOM via _renderFromCache() without
        // re-hitting Firestore. See _handleToggleGroup.
        this._lastContainer = container;
        this._lastCourseName = specificCourseName;
        this._lastAssignments = assignments;
        this._lastOverrides = overrides;

        this._renderFromCache();

        // Attach global handlers if not already attached
        if (!window.handleGradeUpdate) {
            window.handleGradeUpdate = this._handleUpdate.bind(this);
        }
        if (!window.handleGradeExcludeToggle) {
            window.handleGradeExcludeToggle = this._handleToggleExclude.bind(this);
        }
        if (!window.handleGradeGroupToggle) {
            window.handleGradeGroupToggle = this._handleToggleGroup.bind(this);
        }
    },

    // Rebuilds the container's HTML from the last data render() was given.
    // Synchronous and Firestore-free -- safe to call from purely-local UI state
    // changes (collapse/expand) as well as from render() itself.
    _renderFromCache() {
        const container = this._lastContainer;
        const specificCourseName = this._lastCourseName;
        const assignments = this._lastAssignments;
        const overrides = this._lastOverrides;

        const schemes = window.STUDENT_DATA ? window.STUDENT_DATA.gradingSchemes : {};
        container.innerHTML = '';

        let coursesToRender = Object.keys(schemes);
        if (specificCourseName) {
            if (schemes[specificCourseName]) {
                coursesToRender = [specificCourseName];
            } else {
                container.innerHTML = `<p style="color:var(--text-muted); text-align:center;">No grading scheme found for ${specificCourseName}.</p>`;
                return;
            }
        }

        for (const course of coursesToRender) {
            const scheme = schemes[course];
            const cardHtml = this._generateCardHtml(course, scheme, assignments, overrides);
            container.innerHTML += cardHtml;
        }
    },

    // --- Internal Logic ---

    // Computes per-row score/exclusion/weight data for a course, applying
    // explicit excluded flags and auto-drop-lowest, without producing any HTML.
    _computeCourseTotals(course, scheme, assignments, overrides) {
        overrides = overrides || [];
        let totalWeight = 0;
        let currentPoints = 0;
        let currentWeight = 0;
        const rows = [];

        scheme.components.forEach((comp, compIdx) => {
            totalWeight += comp.weight;
            const count = comp.count || 1;
            const dropLowest = comp.dropLowest || 0;
            const compRows = [];

            for (let i = 0; i < count; i++) {
                const linkedAssignment = this._findAssignment(assignments, course, comp.name, i);
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
                    const overrideDoc = overrides.find(o => o.id === uniqueId);
                    if (overrideDoc) {
                        sourceDoc = overrideDoc;
                        if (overrideDoc.score !== null && overrideDoc.score !== undefined) {
                            score = parseFloat(overrideDoc.score);
                        }
                    } else {
                        // Legacy fallback: no gradeOverrides doc yet for this id, so read the
                        // raw score string from localStorage exactly like the old code did.
                        // This row migrates to Firestore naturally the next time it's edited.
                        const saved = localStorage.getItem(uniqueId);
                        if (saved !== null && saved !== "") score = parseFloat(saved);
                    }
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
            // will actually remain after dropping the lowest N.
            let effectiveUnitWeight;
            const denom = count - dropLowest;
            if (denom <= 0) {
                console.warn(`Grading config error: "${course}" component "${comp.name}" has dropLowest (${dropLowest}) >= count (${count}). Falling back to comp.weight / comp.count.`);
                effectiveUnitWeight = comp.weight / count;
            } else {
                effectiveUnitWeight = comp.weight / denom;
            }

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
    },

    _generateCardHtml(course, scheme, assignments, overrides) {
        const totals = this._computeCourseTotals(course, scheme, assignments, overrides);
        GradingRenderer._lastTotals = GradingRenderer._lastTotals || {};
        GradingRenderer._lastTotals[course] = totals;

        // Group the flat row list back up by component (compIdx) so multi-row
        // components (e.g. "Quiz 1..5") render as one collapsible cluster instead
        // of N loose rows.
        const rowsByComp = new Map();
        totals.rows.forEach(rowData => {
            if (!rowsByComp.has(rowData.compIdx)) rowsByComp.set(rowData.compIdx, []);
            rowsByComp.get(rowData.compIdx).push(rowData);
        });

        let rowsHtml = '';
        scheme.components.forEach((comp, compIdx) => {
            const compRows = rowsByComp.get(compIdx) || [];
            rowsHtml += this._generateComponentGroupHtml(comp, compIdx, compRows, course);
        });

        let averageDisplay = "--%";
        let avgClass = "pending";
        let avgColor = "";

        if (totals.currentWeight > 0) {
            const avg = (totals.currentPoints / totals.currentWeight) * 100;
            averageDisplay = avg.toFixed(1) + '%';
            avgClass = "";
            avgColor = this._getGradeColor(avg);
        }

        // Reuse avgColor (already derived from the same grade-quality average shown
        // in the header) so the progress bar's fill hue matches the header score --
        // it must NOT be recolored based on completion % itself.
        const progressBarHtml = this._generateProgressBarHtml(totals.currentWeight, totals.totalWeight, avgColor);

        // We add a unique ID to the score element so we can update it dynamically if needed (re-render handles it usually)
        return `
            <div class="grade-card">
                <div class="grade-header">
                    <span class="grade-course">${course}</span>
                    <span class="grade-score ${avgClass}" style="${avgColor ? 'color:' + avgColor : ''}">${averageDisplay}</span>
                </div>
                ${progressBarHtml}
                <div class="grade-table-header">
                    <span>Component</span>
                    <span>Weight</span>
                    <span>Grade</span>
                    <span>Contrib</span>
                </div>
                ${rowsHtml}
            </div>
        `;
    },

    // Renders a thin completion-progress bar: how much of the course's total
    // weight has actually been graded so far (currentWeight out of totalWeight).
    // `color` is the already-computed grade-quality color from the card header
    // (via _getGradeColor on the current average) -- reused as-is so the bar's
    // fill hue reflects grade quality, not completion %. Falls back to a neutral
    // muted color when nothing is graded yet (color will be "" in that case,
    // since the header only calls _getGradeColor when currentWeight > 0).
    _generateProgressBarHtml(currentWeight, totalWeight, color) {
        const pct = totalWeight > 0 ? Math.min(100, (currentWeight / totalWeight) * 100) : 0;
        const fillColor = color || 'var(--text-muted)';

        return `
            <div class="grade-progress-track">
                <div class="grade-progress-fill" style="width: ${pct.toFixed(2)}%; background-color: ${fillColor};"></div>
            </div>
            <div class="grade-progress-label">${currentWeight.toFixed(0)}% of ${totalWeight.toFixed(0)}% graded</div>
        `;
    },

    // Wraps a component's rows in a collapsible group (header + subtotal + chevron)
    // when the component has more than one row (e.g. "Quiz 1..5"). Components with
    // a single row (e.g. "Final Exam") just render as a plain row -- a collapsible
    // wrapper around one row would be pointless chrome.
    _generateComponentGroupHtml(comp, compIdx, courseRowsForThisComponent, course) {
        const count = comp.count || 1;

        if (count <= 1) {
            const rowData = courseRowsForThisComponent[0];
            if (!rowData) return '';
            return this._generateRowHtml(rowData, rowData.comp, rowData.compIdx, rowData.i, course);
        }

        // Subtotal: this component's current contribution to the course average
        // (sum of each non-excluded, scored row's contribution).
        let subtotal = 0;
        courseRowsForThisComponent.forEach(r => {
            if (!r.isExcluded && r.score !== null && !isNaN(r.score)) {
                subtotal += (r.score / 100) * r.effectiveUnitWeight;
            }
        });

        const key = `${course}-${compIdx}`;
        const isCollapsed = GradingRenderer._collapsedGroups.has(key);
        const rowsClass = isCollapsed ? "grade-group-rows collapsed" : "grade-group-rows";
        const chevron = isCollapsed ? '▸' : '▾'; // ▸ collapsed, ▾ expanded

        let innerRowsHtml = '';
        courseRowsForThisComponent.forEach(rowData => {
            innerRowsHtml += this._generateRowHtml(rowData, rowData.comp, rowData.compIdx, rowData.i, course);
        });

        return `
            <div class="grade-group">
                <div class="grade-group-header"
                    data-course="${course}"
                    data-comp-idx="${compIdx}"
                    onclick="window.handleGradeGroupToggle(this)">
                    <span class="grade-group-chevron">${chevron}</span>
                    <span class="grade-group-name">${comp.name}</span>
                    <span class="grade-group-subtotal">${subtotal.toFixed(2)}%</span>
                </div>
                <div class="${rowsClass}">
                    ${innerRowsHtml}
                </div>
            </div>
        `;
    },

    // Renders a single .grade-row, including the score input and the exclude toggle.
    _generateRowHtml(rowData, comp, compIdx, i, course) {
        const { score, isSynced, uniqueId, isExcluded, autoReason, effectiveUnitWeight, linkedAssignment } = rowData;
        const count = comp.count || 1;
        const displayName = count > 1 ? `${comp.name} ${i + 1}` : comp.name;

        let contributionStr = '-';
        if (isExcluded) {
            contributionStr = '0.00%';
        } else if (score !== null && !isNaN(score)) {
            const contrib = (score / 100) * effectiveUnitWeight;
            contributionStr = contrib.toFixed(2) + '%';
        }

        // Per-row grade color coding: only for rows that actually have a score and
        // aren't excluded (excluded rows already get their own strikethrough/opacity
        // treatment via .grade-row.excluded -- don't fight that with a bright color).
        let scoreColorStyle = '';
        if (!isExcluded && score !== null && !isNaN(score)) {
            scoreColorStyle = `color:${this._getGradeColor(score)};`;
        }

        const inputClass = isSynced ? "grade-input synced" : "grade-input";
        const inputValue = score !== null ? score : "";
        const rowClass = isExcluded ? "grade-row excluded" : "grade-row";
        const excludeBtnClass = isExcluded ? "grade-exclude-btn checked" : "grade-exclude-btn";

        // Synced-vs-manual source badge: the primary cue (the .grade-input.synced
        // left-border stays as a secondary cue). Coexists with the dropped badge --
        // both are small inline-block spans with their own left margin, so they sit
        // side by side without overlapping.
        const sourceBadgeClass = isSynced ? "grade-source-badge synced" : "grade-source-badge manual";
        const sourceBadgeText = isSynced ? "LINKED" : "MANUAL";
        const sourceBadgeHtml = ` <span class="${sourceBadgeClass}">${sourceBadgeText}</span>`;

        let badgeHtml = '';
        if (isExcluded) {
            const badgeClass = autoReason === 'auto' ? "grade-dropped-badge auto" : "grade-dropped-badge";
            const badgeText = autoReason === 'auto' ? "AUTO-DROPPED" : "DROPPED";
            badgeHtml = ` <span class="${badgeClass}">${badgeText}</span>`;
        }

        return `
            <div class="${rowClass}">
                <span title="${linkedAssignment ? linkedAssignment.title : 'Manual Entry'}">${displayName}${sourceBadgeHtml}${badgeHtml}</span>
                <span>${effectiveUnitWeight.toFixed(1)}%</span>
                <input type="number" class="${inputClass}"
                    id="input-${uniqueId}"
                    value="${inputValue}"
                    style="${scoreColorStyle}"
                    data-is-synced="${isSynced}"
                    data-id="${uniqueId}"
                    data-course="${course}"
                    data-comp-name="${comp.name}"
                    data-comp-idx="${compIdx}"
                    data-index="${i}"
                    onchange="window.handleGradeUpdate(this)"
                    placeholder="-">
                <span id="contrib-${uniqueId}" style="${scoreColorStyle}">${contributionStr}</span>
                <button type="button" class="${excludeBtnClass}"
                    data-id="${uniqueId}"
                    data-is-synced="${isSynced}"
                    data-course="${course}"
                    onclick="window.handleGradeExcludeToggle(this)"
                    title="${isExcluded ? 'Include in average' : 'Exclude from average'}">${isExcluded ? '−' : ''}</button>
            </div>
        `;
    },

    _findAssignment(assignments, course, componentName, index) {
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
    },

    async _handleUpdate(input) {
        const id = input.dataset.id;
        const isSynced = input.dataset.isSynced === "true";
        const val = input.value;
        const course = input.dataset.course;

        if (isSynced) {
            const newScore = val === "" ? null : parseFloat(val);
            await DataService.updateAssignmentGrade(id, newScore);
        } else {
            const newScore = val === "" ? null : parseFloat(val);
            const componentName = input.dataset.compName;
            const index = parseInt(input.dataset.index, 10);
            await DataService.setGradeOverride(id, { score: newScore, course, componentName, index });
        }

        // Re-render
        // We need to know context (container and scope).
        // For simplicity, we can reload the page OR trigger a custom event.
        // Actually, since we control the renderer, let's just re-render in place if we can find the container.
        // But the simplest valid logic used in grades.html was "assignments = await fetch...; renderDashboard()"

        // We'll dispatch an event so the parent page can decide to re-render.
        window.dispatchEvent(new CustomEvent('gradeUpdated', { detail: { course, id } }));
    },

    // Simple binary toggle: flips the row's current effective excluded state.
    // FUTURE EXTENSION POINT: a "reset to auto" affordance (clearing the explicit
    // flag back to tri-state "undecided") would use Firestore's deleteField() on
    // the `excluded` key instead of writing `false` here. Not built in v1.
    async _handleToggleExclude(btn) {
        const id = btn.dataset.id;
        const isSynced = btn.dataset.isSynced === "true";
        const course = btn.dataset.course;
        const currentlyExcluded = btn.classList.contains('checked');
        const newValue = !currentlyExcluded;

        if (isSynced) {
            await DataService.updateAssignmentDetails(id, { excluded: newValue });
        } else {
            await DataService.setGradeOverride(id, { excluded: newValue });
        }

        window.dispatchEvent(new CustomEvent('gradeUpdated', { detail: { course, id } }));
    },

    // Collapse/expand is pure UI state, not persisted data -- unlike score/exclude
    // edits, this never touches Firestore. Toggling the key in the module-level
    // _collapsedGroups Set and re-rendering from the cached last-fetched data
    // (via _renderFromCache) is enough, and it means the group stays collapsed
    // across the full re-renders that score/exclude edits trigger elsewhere on
    // the page (those rebuild container.innerHTML from scratch, which would wipe
    // any collapse state that only lived on the DOM node).
    _handleToggleGroup(headerEl) {
        const course = headerEl.dataset.course;
        const compIdx = headerEl.dataset.compIdx;
        const key = `${course}-${compIdx}`;

        if (GradingRenderer._collapsedGroups.has(key)) {
            GradingRenderer._collapsedGroups.delete(key);
        } else {
            GradingRenderer._collapsedGroups.add(key);
        }

        GradingRenderer._renderFromCache();
    },

    _getGradeColor(grade) {
        if (grade >= 80) return '#4ade80';
        if (grade >= 70) return '#facc15';
        if (grade >= 60) return '#fb923c';
        return '#f87171';
    }
};

// Module-level (not DOM-level) collapse state for component groups, keyed by
// `${course}-${compIdx}`. Kept outside the object literal so it survives every
// _renderFromCache() rebuild of container.innerHTML for the lifetime of this
// module instance (ES modules are singletons, so this persists across the whole
// page session, not just one render call).
GradingRenderer._collapsedGroups = GradingRenderer._collapsedGroups || new Set();
