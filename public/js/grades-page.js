import { GradingRenderer } from '/js/grading-renderer.js';
import { DataService } from '/js/data-service.js';

const FINAL_GRADE_COLORS = {
    'A+': '#4ade80', 'A': '#4ade80', 'A-': '#4ade80',
    'B+': '#facc15', 'B': '#facc15', 'B-': '#facc15',
    'C+': '#fb923c', 'C': '#fb923c', 'C-': '#fb923c',
    'D+': '#f87171', 'D': '#f87171', 'D-': '#f87171', 'F': '#f87171'
};

// Minimum numeric percentage (0-100 scale) required to earn each letter grade.
// Used by the what-if projection to figure out what average is still needed
// on the remaining (ungraded) weight of a course.
const FINAL_GRADE_THRESHOLDS = {
    'A+': 90, 'A': 85, 'A-': 80,
    'B+': 77, 'B': 73, 'B-': 70,
    'C+': 67, 'C': 63, 'C-': 60,
    'D+': 57, 'D': 53, 'D-': 50, 'F': 0
};

function updateFinalGradeColor(selectEl, grade) {
    const color = FINAL_GRADE_COLORS[grade] || 'var(--text-muted)';
    selectEl.style.color = color;
    selectEl.style.borderColor = color;
}

// Shared banner "extras" renderer: fills in the live computed average and,
// if a letter grade is selected in the dropdown, the what-if projection line.
// Reads GradingRenderer._lastTotals[courseCode], which is only populated as a
// side effect of GradingRenderer.render() completing -- callers must invoke
// this AFTER awaiting that render call.
function renderBannerExtras(courseCode) {
    const bannerAvg = document.getElementById('banner-computed-avg');
    const select = document.getElementById('final-grade-select');
    if (!bannerAvg || !courseCode) return;

    const totals = GradingRenderer._lastTotals && GradingRenderer._lastTotals[courseCode];
    if (!totals) {
        // Not populated yet (render hasn't run) -- skip rather than throw.
        return;
    }

    // --- Live computed average ---
    let avgText = '--%';
    let avgColor = 'var(--text-muted)';
    if (totals.currentWeight !== 0) {
        const avg = (totals.currentPoints / totals.currentWeight) * 100;
        avgText = avg.toFixed(1) + '%';
        avgColor = GradingRenderer._getGradeColor(avg);
    }

    // --- What-if projection, tied to the selected letter grade ---
    let projectionHtml = '';
    const letter = select ? select.value : '';
    if (letter && FINAL_GRADE_THRESHOLDS[letter] !== undefined) {
        const remainingWeight = totals.totalWeight - totals.currentWeight;
        const neededPoints = (FINAL_GRADE_THRESHOLDS[letter] / 100 * totals.totalWeight) - totals.currentPoints;
        const neededAvgOnRest = (neededPoints / remainingWeight) * 100;

        // Reuse GradingRenderer's own red/green thresholds instead of
        // duplicating the hex values here.
        const warnColor = GradingRenderer._getGradeColor(0);   // < 60 => red
        const positiveColor = GradingRenderer._getGradeColor(100); // >= 80 => green

        if (remainingWeight <= 0) {
            projectionHtml = `<span class="banner-projection-text">Course fully graded</span>`;
        } else if (neededAvgOnRest > 100) {
            projectionHtml = `<span class="banner-projection-text" style="color:${warnColor}">Not achievable — need ${neededAvgOnRest.toFixed(1)}% on remaining ${remainingWeight.toFixed(1)}%</span>`;
        } else if (neededAvgOnRest <= 0) {
            projectionHtml = `<span class="banner-projection-text" style="color:${positiveColor}">Already secured</span>`;
        } else {
            projectionHtml = `<span class="banner-projection-text">Need <strong>${neededAvgOnRest.toFixed(1)}%</strong> on remaining ${remainingWeight.toFixed(1)}% to reach ${letter}</span>`;
        }
    }

    bannerAvg.innerHTML = `<span class="banner-avg-value" style="color:${avgColor}">${avgText}</span>${projectionHtml}`;
}

async function initFinalGrade(courseCode) {
    const banner = document.getElementById('final-grade-banner');
    const select = document.getElementById('final-grade-select');
    if (!courseCode) return;

    banner.style.display = 'flex';
    banner.classList.add('single-course');
    const currentGrade = await DataService.getFinalGrade(courseCode);
    select.value = currentGrade || '';
    updateFinalGradeColor(select, currentGrade);

    select.addEventListener('change', async () => {
        await DataService.setFinalGrade(courseCode, select.value);
        updateFinalGradeColor(select, select.value);
        renderBannerExtras(courseCode);
    });
}

async function init() {
    try {
        const container = document.getElementById('grade-list');
        const urlParams = new URLSearchParams(window.location.search);
        const courseCode = urlParams.get('course') ? decodeURIComponent(urlParams.get('course')) : null;

        // Update Header
        if (courseCode) {
            document.querySelector('h1').innerText = `${courseCode} Grades`;
            document.querySelector('.subtitle').innerText = `Current grade breakdown for ${courseCode}.`;
            document.title = `${courseCode} Grades`;
        }

        await initFinalGrade(courseCode);

        const assignments = await DataService.getAllAssignments(); // Pre-fetch to pass explicitly

        await GradingRenderer.render(container, courseCode, assignments);
        renderBannerExtras(courseCode);

        // Re-render on update
        window.addEventListener('gradeUpdated', async () => {
            const freshAssignments = await DataService.getAllAssignments();
            await GradingRenderer.render(container, courseCode, freshAssignments);
            renderBannerExtras(courseCode);
        });

    } catch (err) {
        console.error("Error initializing dashboard:", err);
        document.getElementById('grade-list').innerHTML = `<p style="color:red">Error loading data.</p>`;
    }
}

init();
