import { DataService } from './data-service.js';

export const GradingRenderer = {

    // --- Public: Render a single course's grade card into a container ---
    // If courseName is null, it renders ALL courses (for the global dashboard)
    async render(container, specificCourseName = null, assignments) {
        if (!assignments) {
            assignments = await DataService.getAllAssignments();
        }

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
            const cardHtml = this._generateCardHtml(course, scheme, assignments);
            container.innerHTML += cardHtml;
        }

        // Attach global handler if not already attached
        if (!window.handleGradeUpdate) {
            window.handleGradeUpdate = this._handleUpdate.bind(this);
        }
    },

    // --- Internal Logic ---

    _generateCardHtml(course, scheme, assignments) {
        let rowsHtml = '';
        let totalWeight = 0;
        let currentPoints = 0;
        let currentWeight = 0;

        scheme.components.forEach((comp, compIdx) => {
            const count = comp.count || 1;
            const unitWeight = comp.weight / count;

            for (let i = 0; i < count; i++) {
                const linkedAssignment = this._findAssignment(assignments, course, comp.name, i);
                let score = null;
                let isSynced = false;
                let uniqueId = `manual-${course.replace(/\s/g, '')}-${compIdx}-${i}`;

                if (linkedAssignment) {
                    if (linkedAssignment.score !== null && linkedAssignment.score !== undefined) {
                        score = parseFloat(linkedAssignment.score);
                    }
                    isSynced = true;
                    uniqueId = linkedAssignment.id;
                } else {
                    const saved = localStorage.getItem(uniqueId);
                    if (saved !== null && saved !== "") score = parseFloat(saved);
                }

                const displayName = count > 1 ? `${comp.name} ${i + 1}` : comp.name;

                let contributionStr = "0.00%";
                if (score !== null && !isNaN(score)) {
                    const contrib = (score / 100) * unitWeight;
                    contributionStr = contrib.toFixed(2) + '%';
                    currentPoints += contrib;
                    currentWeight += unitWeight;
                } else {
                    contributionStr = '-';
                }

                const inputClass = isSynced ? "grade-input synced" : "grade-input";
                const inputValue = score !== null ? score : "";

                rowsHtml += `
                    <div class="grade-row">
                        <span title="${linkedAssignment ? linkedAssignment.title : 'Manual Entry'}">${displayName}</span>
                        <span>${unitWeight.toFixed(1)}%</span>
                        <input type="number" class="${inputClass}" 
                            id="input-${uniqueId}" 
                            value="${inputValue}" 
                            data-is-synced="${isSynced}"
                            data-id="${uniqueId}"
                            data-course="${course}"
                            onchange="window.handleGradeUpdate(this)"
                            placeholder="-">
                        <span id="contrib-${uniqueId}">${contributionStr}</span>
                    </div>
                `;
            }
        });

        let averageDisplay = "--%";
        let avgClass = "pending";
        let avgColor = "";

        if (currentWeight > 0) {
            const avg = (currentPoints / currentWeight) * 100;
            averageDisplay = avg.toFixed(1) + '%';
            avgClass = "";
            avgColor = this._getGradeColor(avg);
        }

        // We add a unique ID to the score element so we can update it dynamically if needed (re-render handles it usually)
        return `
            <div class="grade-card">
                <div class="grade-header">
                    <span class="grade-course">${course}</span>
                    <span class="grade-score ${avgClass}" style="${avgColor ? 'color:' + avgColor : ''}">${averageDisplay}</span>
                </div>
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

    _findAssignment(assignments, course, componentName, index) {
        let targetCategory = "";
        const nameLower = componentName.toLowerCase();

        if (nameLower.includes("homework") || nameLower.includes("assignment")) targetCategory = "ASSIGNMENT";
        else if (nameLower.includes("quiz")) targetCategory = "QUIZ";
        else if (nameLower.includes("midterm") || nameLower.includes("test")) targetCategory = "MIDTERM";
        else if (nameLower.includes("lab")) targetCategory = "LAB";
        else if (nameLower.includes("tutorial") || nameLower.includes("active learning")) targetCategory = "TUTORIAL";

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
            if (val === "") localStorage.removeItem(id);
            else localStorage.setItem(id, val);
        }

        // Re-render
        // We need to know context (container and scope). 
        // For simplicity, we can reload the page OR trigger a custom event.
        // Actually, since we control the renderer, let's just re-render in place if we can find the container.
        // But the simplest valid logic used in grades.html was "assignments = await fetch...; renderDashboard()"

        // We'll dispatch an event so the parent page can decide to re-render.
        window.dispatchEvent(new CustomEvent('gradeUpdated', { detail: { course, id } }));
    },

    _getGradeColor(grade) {
        if (grade >= 80) return '#4ade80';
        if (grade >= 70) return '#facc15';
        if (grade >= 60) return '#fb923c';
        return '#f87171';
    }
};
