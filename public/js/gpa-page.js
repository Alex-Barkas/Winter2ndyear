// GPA calculator page. Renders the transcript data once, then recomputes
// every displayed number in place on input change -- never rebuilds the DOM
// mid-edit, so a select/input never loses focus while typing.
import { Prefs, escapeHtml } from './ui-utils.js';

const TRANSCRIPT = window.__TRANSCRIPT || [];
const GRADE_POINTS = window.__GRADE_POINTS || {};
const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

const OVERRIDES_KEY = 'gpa_overrides';
// { [courseCode]: { units: number|null, grade: string|null } }
let overrides = Prefs.get(OVERRIDES_KEY, {});

function saveOverrides() {
    Prefs.set(OVERRIDES_KEY, overrides);
}

// Effective units/grade for a course: an override always wins over the
// transcript default, including an explicit override back to null (clearing
// a field the user had filled in).
function effective(course) {
    const o = overrides[course.code];
    const units = o && Object.prototype.hasOwnProperty.call(o, 'units') ? o.units : course.units;
    const grade = o && Object.prototype.hasOwnProperty.call(o, 'grade') ? o.grade : course.grade;
    return { units, grade };
}

function fmtGpa(points, units) {
    if (!units || units <= 0) return '—';
    return (points / units).toFixed(2);
}

// Sums only rows that are actually graded -- an ungraded course contributes
// to neither the numerator nor the denominator (it is not a zero).
function sumTerm(term) {
    let units = 0;
    let points = 0;
    let attemptedUnits = 0;
    term.courses.forEach((course) => {
        const { units: u, grade } = effective(course);
        const unitsNum = u === null || u === undefined || u === '' ? null : parseFloat(u);
        if (unitsNum && unitsNum > 0) attemptedUnits += unitsNum;
        if (grade && GRADE_POINTS[grade] !== undefined && unitsNum && unitsNum > 0) {
            units += unitsNum;
            points += unitsNum * GRADE_POINTS[grade];
        }
    });
    return { units, points, attemptedUnits };
}

function renderTerm(term) {
    const rows = term.courses.map((course) => {
        const { units, grade } = effective(course);
        const editable = term.status !== 'complete';
        const unitsCell = editable
            ? `<input type="number" class="gpa-units-input" data-code="${escapeHtml(course.code)}" value="${units === null || units === undefined ? '' : units}" step="0.05" min="0" placeholder="units">`
            : `<span>${units.toFixed(2)}</span>`;
        const gradeCell = editable
            ? `<select class="gpa-grade-select" data-code="${escapeHtml(course.code)}">
                    <option value="">—</option>
                    ${GRADE_OPTIONS.map((g) => `<option value="${g}" ${g === grade ? 'selected' : ''}>${g}</option>`).join('')}
               </select>`
            : `<span class="gpa-grade-badge">${escapeHtml(grade || '—')}</span>`;

        return `
            <div class="gpa-row" data-code="${escapeHtml(course.code)}">
                <div class="gpa-course">
                    <span class="gpa-course-code">${escapeHtml(course.code)}</span>
                    <span class="gpa-course-name">${escapeHtml(course.name)}</span>
                </div>
                <div class="gpa-units">${unitsCell}</div>
                <div class="gpa-grade">${gradeCell}</div>
                <div class="gpa-points" data-points-for="${escapeHtml(course.code)}">${pointsLabel(course)}</div>
            </div>`;
    }).join('');

    const statusLabel = term.status === 'complete' ? 'Completed' : term.status === 'in-progress' ? 'In Progress' : 'Upcoming';

    return `
        <section class="gpa-term" data-term="${term.term}">
            <div class="gpa-term-header">
                <h2>${escapeHtml(term.label)}</h2>
                <span class="gpa-term-status status-${term.status}">${statusLabel}</span>
            </div>
            <div class="gpa-row gpa-row-head">
                <div class="gpa-course">Course</div>
                <div class="gpa-units">Units</div>
                <div class="gpa-grade">Grade</div>
                <div class="gpa-points">Points</div>
            </div>
            ${rows}
            <div class="gpa-term-footer">
                <span class="gpa-term-gpa-label">Term GPA</span>
                <span class="gpa-term-gpa-value" data-term-gpa="${term.term}">—</span>
                <span class="gpa-term-units" data-term-units="${term.term}"></span>
            </div>
        </section>`;
}

function pointsLabel(course) {
    const { units, grade } = effective(course);
    const unitsNum = units === null || units === undefined || units === '' ? null : parseFloat(units);
    if (!grade || !unitsNum || !(GRADE_POINTS[grade] !== undefined)) return '—';
    return (unitsNum * GRADE_POINTS[grade]).toFixed(1);
}

function recompute() {
    let cumUnits = 0;
    let cumPoints = 0;
    let cumAttempted = 0;
    let termsWithGrades = 0;

    TRANSCRIPT.forEach((term) => {
        const { units, points, attemptedUnits } = sumTerm(term);
        cumUnits += units;
        cumPoints += points;
        cumAttempted += attemptedUnits;
        if (units > 0) termsWithGrades += 1;

        const gpaEl = document.querySelector(`[data-term-gpa="${term.term}"]`);
        if (gpaEl) gpaEl.textContent = fmtGpa(points, units);
        const unitsEl = document.querySelector(`[data-term-units="${term.term}"]`);
        if (unitsEl) unitsEl.textContent = units > 0 ? `${units.toFixed(2)} GPA units · ${points.toFixed(1)} pts` : '';

        term.courses.forEach((course) => {
            const el = document.querySelector(`[data-points-for="${CSS.escape(course.code)}"]`);
            if (el) el.textContent = pointsLabel(course);
        });
    });

    const cumGpaEl = document.getElementById('cumulative-gpa-value');
    if (cumGpaEl) cumGpaEl.textContent = fmtGpa(cumPoints, cumUnits);
    const cumUnitsEl = document.getElementById('cumulative-units-value');
    if (cumUnitsEl) cumUnitsEl.textContent = cumUnits.toFixed(2);
    const cumPointsEl = document.getElementById('cumulative-points-value');
    if (cumPointsEl) cumPointsEl.textContent = cumPoints.toFixed(1);
    const cumAttemptedEl = document.getElementById('cumulative-attempted-value');
    if (cumAttemptedEl) cumAttemptedEl.textContent = cumAttempted.toFixed(2);
}

function renderSummary() {
    const el = document.getElementById('gpa-summary');
    el.innerHTML = `
        <div class="list-summary-main">
            <span class="list-summary-value" id="cumulative-gpa-value">—</span>
            <span class="list-summary-label">Cumulative GPA</span>
        </div>
        <div class="list-summary-stats">
            <div class="list-summary-stat">
                <span class="list-summary-stat-value" id="cumulative-units-value">0.00</span>
                <span class="list-summary-stat-label">GPA Units</span>
            </div>
            <div class="list-summary-stat">
                <span class="list-summary-stat-value" id="cumulative-points-value">0.0</span>
                <span class="list-summary-stat-label">Grade Points</span>
            </div>
            <div class="list-summary-stat">
                <span class="list-summary-stat-value" id="cumulative-attempted-value">0.00</span>
                <span class="list-summary-stat-label">Units Attempted</span>
            </div>
        </div>`;
}

function attachListeners() {
    document.getElementById('gpa-terms').addEventListener('input', (e) => {
        const target = e.target;
        const code = target.dataset.code;
        if (!code) return;

        if (!overrides[code]) overrides[code] = {};

        if (target.classList.contains('gpa-units-input')) {
            overrides[code].units = target.value === '' ? null : parseFloat(target.value);
        } else if (target.classList.contains('gpa-grade-select')) {
            overrides[code].grade = target.value === '' ? null : target.value;
        } else {
            return;
        }

        saveOverrides();
        recompute();
    });
}

function init() {
    renderSummary();
    document.getElementById('gpa-terms').innerHTML = TRANSCRIPT.map(renderTerm).join('');
    attachListeners();
    recompute();
}

init();
