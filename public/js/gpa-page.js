// GPA calculator page. Renders the transcript data once. Edits commit on
// the "change" event (blur for the units input, selection for the grade
// select) rather than "input" -- each commit needs a confirm() gate, and
// gating every keystroke would pop a dialog per character typed. Term
// collapse/expand rebuilds the term list too (pure UI state, cheap to
// re-render from TRANSCRIPT + overrides), which is safe here precisely
// because "change" only fires once editing is already done.
import { Prefs, escapeHtml } from './ui-utils.js';

const TRANSCRIPT = window.__TRANSCRIPT || [];
const GRADE_POINTS = window.__GRADE_POINTS || {};
const GRADE_POINTS_4 = window.__GRADE_POINTS_4 || {};
const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

const OVERRIDES_KEY = 'gpa_overrides';
// { [courseCode]: { units: number|null, grade: string|null } }
let overrides = Prefs.get(OVERRIDES_KEY, {});

// Collapsed-by-default for completed terms (the ones you're unlikely to be
// actively editing) so the page opens as a scannable summary; in-progress
// and upcoming terms start expanded since those are what you're filling in.
// Not persisted -- purely this page-load's UI state.
let collapsedTerms = new Set(TRANSCRIPT.filter((t) => t.status === 'complete').map((t) => t.term));

function saveOverrides() {
    Prefs.set(OVERRIDES_KEY, overrides);
}

function findCourseAndTerm(code) {
    for (const term of TRANSCRIPT) {
        const course = term.courses.find((c) => c.code === code);
        if (course) return { course, term };
    }
    return {};
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
// to neither the numerator nor the denominator (it is not a zero). Tracks
// both the native 4.3-scale points and the 4.0-scale (A+ capped) points in
// the same pass, since they share the same units/attempted totals.
function sumTerm(term) {
    let units = 0;
    let points = 0;
    let points4 = 0;
    let attemptedUnits = 0;
    term.courses.forEach((course) => {
        const { units: u, grade } = effective(course);
        const unitsNum = u === null || u === undefined || u === '' ? null : parseFloat(u);
        if (unitsNum && unitsNum > 0) attemptedUnits += unitsNum;
        if (grade && GRADE_POINTS[grade] !== undefined && unitsNum && unitsNum > 0) {
            units += unitsNum;
            points += unitsNum * GRADE_POINTS[grade];
            points4 += unitsNum * GRADE_POINTS_4[grade];
        }
    });
    return { units, points, points4, attemptedUnits };
}

function renderTerm(term) {
    const isLocked = term.status === 'complete';
    const rows = term.courses.map((course) => {
        const { units, grade } = effective(course);
        const isOverridden = isLocked && overrides[course.code] !== undefined;

        const unitsCell = `<input type="number" class="gpa-units-input" data-code="${escapeHtml(course.code)}" value="${units === null || units === undefined ? '' : units}" step="0.05" min="0" placeholder="units">`;
        const gradeCell = `<select class="gpa-grade-select" data-code="${escapeHtml(course.code)}">
                    <option value="">—</option>
                    ${GRADE_OPTIONS.map((g) => `<option value="${g}" ${g === grade ? 'selected' : ''}>${g}</option>`).join('')}
               </select>`;

        return `
            <div class="gpa-row${isOverridden ? ' overridden' : ''}" data-code="${escapeHtml(course.code)}">
                <div class="gpa-course">
                    <span class="gpa-course-code">${escapeHtml(course.code)}</span>
                    <span class="gpa-course-name">${escapeHtml(course.name)}</span>
                    ${isOverridden ? '<span class="gpa-override-badge" title="Changed from your official transcript">OVERRIDDEN</span>' : ''}
                </div>
                <div class="gpa-units">${unitsCell}</div>
                <div class="gpa-grade">${gradeCell}</div>
                <div class="gpa-points" data-points-for="${escapeHtml(course.code)}">${pointsLabel(course)}</div>
            </div>`;
    }).join('');

    const statusLabel = term.status === 'complete' ? 'Completed' : term.status === 'in-progress' ? 'In Progress' : 'Upcoming';
    const isCollapsed = collapsedTerms.has(term.term);

    return `
        <section class="gpa-term" data-term="${term.term}">
            <div class="gpa-term-header" data-term-toggle="${term.term}">
                <span class="gpa-term-chevron">${isCollapsed ? '▸' : '▾'}</span>
                <h2>${escapeHtml(term.label)}</h2>
                <span class="gpa-term-status status-${term.status}">${statusLabel}</span>
            </div>
            <div class="gpa-term-body${isCollapsed ? ' collapsed' : ''}">
                <div class="gpa-row gpa-row-head">
                    <div class="gpa-course">Course</div>
                    <div class="gpa-units">Units</div>
                    <div class="gpa-grade">Grade</div>
                    <div class="gpa-points">Points</div>
                </div>
                ${rows}
            </div>
            <div class="gpa-term-footer">
                <span class="gpa-term-gpa-label">Term GPA</span>
                <span class="gpa-term-gpa-value" data-term-gpa="${term.term}">—</span>
                <span class="gpa-term-gpa4" data-term-gpa4="${term.term}"></span>
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
    let cumPoints4 = 0;
    let cumAttempted = 0;
    let termsWithGrades = 0;

    TRANSCRIPT.forEach((term) => {
        const { units, points, points4, attemptedUnits } = sumTerm(term);
        cumUnits += units;
        cumPoints += points;
        cumPoints4 += points4;
        cumAttempted += attemptedUnits;
        if (units > 0) termsWithGrades += 1;

        const gpaEl = document.querySelector(`[data-term-gpa="${term.term}"]`);
        if (gpaEl) gpaEl.textContent = fmtGpa(points, units);
        const gpa4El = document.querySelector(`[data-term-gpa4="${term.term}"]`);
        if (gpa4El) gpa4El.textContent = units > 0 ? `${fmtGpa(points4, units)} / 4.0` : '';
        const unitsEl = document.querySelector(`[data-term-units="${term.term}"]`);
        if (unitsEl) unitsEl.textContent = units > 0 ? `${units.toFixed(2)} GPA units · ${points.toFixed(1)} pts` : '';

        term.courses.forEach((course) => {
            const el = document.querySelector(`[data-points-for="${CSS.escape(course.code)}"]`);
            if (el) el.textContent = pointsLabel(course);
        });
    });

    const cumGpaEl = document.getElementById('cumulative-gpa-value');
    if (cumGpaEl) cumGpaEl.textContent = fmtGpa(cumPoints, cumUnits);
    const cumGpa4El = document.getElementById('cumulative-gpa4-value');
    if (cumGpa4El) cumGpa4El.textContent = fmtGpa(cumPoints4, cumUnits);
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
                <span class="list-summary-stat-value" id="cumulative-gpa4-value">—</span>
                <span class="list-summary-stat-label">4.0 Scale</span>
            </div>
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

function renderTerms() {
    document.getElementById('gpa-terms').innerHTML = TRANSCRIPT.map(renderTerm).join('');
}

function attachListeners() {
    const container = document.getElementById('gpa-terms');

    container.addEventListener('click', (e) => {
        const header = e.target.closest('[data-term-toggle]');
        if (!header) return;
        const termKey = header.dataset.termToggle;
        if (collapsedTerms.has(termKey)) collapsedTerms.delete(termKey);
        else collapsedTerms.add(termKey);
        renderTerms();
        recompute();
    });

    container.addEventListener('change', (e) => {
        const target = e.target;
        const code = target.dataset.code;
        if (!code) return;

        const isUnits = target.classList.contains('gpa-units-input');
        const isGrade = target.classList.contains('gpa-grade-select');
        if (!isUnits && !isGrade) return;

        const { course, term } = findCourseAndTerm(code);
        const { units: prevUnits, grade: prevGrade } = effective(course);
        const prevValue = isUnits
            ? (prevUnits === null || prevUnits === undefined ? '' : String(prevUnits))
            : (prevGrade || '');
        const newValue = target.value;

        // Guard against misclicks/accidental edits -- and make clear that
        // touching a completed term overrides its official transcript value,
        // not just a working estimate.
        if (newValue !== prevValue) {
            const message = term && term.status === 'complete'
                ? 'This overrides your official transcript grade. Are you sure you want to change it?'
                : 'Are you sure you want to change this grade?';
            if (!window.confirm(message)) {
                target.value = prevValue;
                return;
            }
        }

        if (!overrides[code]) overrides[code] = {};

        if (isUnits) {
            overrides[code].units = newValue === '' ? null : parseFloat(newValue);
        } else {
            overrides[code].grade = newValue === '' ? null : newValue;
        }

        saveOverrides();

        // Re-render so a completed-term row's OVERRIDDEN badge (re)appears --
        // safe here (unlike on every keystroke) because "change" only fires
        // once editing has already committed.
        renderTerms();
        recompute();
    });
}

function init() {
    renderSummary();
    renderTerms();
    attachListeners();
    recompute();
}

init();
