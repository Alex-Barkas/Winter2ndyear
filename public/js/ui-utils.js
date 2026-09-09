// Shared helpers for the list pages (to-do + assignments).
//
// Before this file existed, each page carried its own copy of "is this date
// overdue / today / tomorrow" and its own month-name array, and the copies had
// already drifted apart (todo.html's getStatusBanner vs script.js's overdue
// check disagreed on rounding). One implementation, imported everywhere.

/* ---------------------------------------------------------------- escaping */

// Titles and course codes are interpolated into innerHTML on both list pages.
// A title containing "<" used to render as markup and break the row.
export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ------------------------------------------------------------------- dates */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// "YYYY-MM-DD" -> local Date at midnight. Deliberately splits the string
// instead of `new Date(str)`, which some browsers parse as UTC and which then
// shifts the day backwards for anyone west of Greenwich.
export function parseLocalDate(dateStr) {
    if (!dateStr || dateStr === 'TBD') return null;
    const [y, m, d] = String(dateStr).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

export function todayLocal() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Whole days from today. Negative = past. null for undated/TBD.
export function daysUntil(dateStr) {
    const due = parseLocalDate(dateStr);
    if (!due) return null;
    return Math.round((due - todayLocal()) / MS_PER_DAY);
}

// The single source of truth for the OVERDUE / TODAY / TOMORROW language used
// by both list pages. Returns null when the date needs no special badge.
export function urgencyStatus(dateStr) {
    const diff = daysUntil(dateStr);
    if (diff === null) return null;
    if (diff < 0) return { label: 'OVERDUE', className: 'status-overdue' };
    if (diff === 0) return { label: 'TODAY', className: 'status-today' };
    if (diff === 1) return { label: 'TOMORROW', className: 'status-tomorrow' };
    return null;
}

// "Sat, Mar 14"
export function formatDate(dateStr) {
    const d = parseLocalDate(dateStr);
    if (!d) return '';
    return `${DAYS_SHORT[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

// Weekday over "Mon DD" -- the two-line date column on assignment cards.
// A bare weekday + day number ("Sun 20") is ambiguous once a term's
// assignments span several months, so the month rides along on its own line.
export function formatDayCell(dateStr) {
    const d = parseLocalDate(dateStr);
    if (!d) return 'TBD';
    return `<span class="assign-day-name">${DAYS_SHORT[d.getDay()]}</span>`
        + `<span class="assign-day-num">${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}</span>`;
}

// "in 3 days" / "yesterday" / "today". Pairs with formatDate.
export function formatRelative(dateStr) {
    const diff = daysUntil(dateStr);
    if (diff === null) return '';
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    if (diff === -1) return 'yesterday';
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    if (diff < 7) return `in ${diff} days`;
    if (diff < 14) return 'next week';
    return `in ${Math.round(diff / 7)} weeks`;
}

// Coarse buckets used by the "Group by: Due" option on both pages.
export function dueBucket(dateStr) {
    const diff = daysUntil(dateStr);
    if (diff === null) return { key: 'zzz-none', label: 'No Due Date' };
    if (diff < 0) return { key: 'a-overdue', label: 'Overdue' };
    if (diff === 0) return { key: 'b-today', label: 'Today' };
    if (diff === 1) return { key: 'c-tomorrow', label: 'Tomorrow' };
    if (diff <= 7) return { key: 'd-week', label: 'This Week' };
    if (diff <= 30) return { key: 'e-month', label: 'This Month' };
    return { key: 'f-later', label: 'Later' };
}

/* --------------------------------------------------------- semester weeks */

// Week labels derived from the term config rather than hardcoded per page.
// `termRange.classesStart` anchors week 1; `termRange.readingWeek` is optional.
export function makeWeekLabeller(termRange) {
    const range = termRange || {};
    const anchor = parseLocalDate(range.classesStart || range.start);
    const rwStart = range.readingWeek ? parseLocalDate(range.readingWeek.start) : null;
    const rwEnd = range.readingWeek ? parseLocalDate(range.readingWeek.end) : null;

    return function weekLabel(dateStr) {
        const d = parseLocalDate(dateStr);
        if (!d) return 'Unscheduled';
        if (!anchor) return '';

        if (rwStart && rwEnd && d >= rwStart && d <= rwEnd) return 'Reading Week';

        const diffDays = Math.round((d - anchor) / MS_PER_DAY);
        if (diffDays < 0) return 'Pre-Term';

        let weekNum = Math.floor(diffDays / 7) + 1;
        if (rwEnd && d > rwEnd) weekNum -= 1;
        return `Week ${weekNum}`;
    };
}

/* ------------------------------------------------------------ preferences */

// View preferences live here, NOT on the Firestore documents. saveTodoItem is a
// full-document setDoc with no {merge:true}, and three separate consumers read
// that shape (this page, the dashboard schedule/calendar, and the Python daily
// email job) -- stashing UI state in there would leak it to all of them.
//
// Namespaced away from the existing `dashboard_*` keys, which are the offline
// mirror of the Firestore collections.
export const Prefs = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return fallback;
            const parsed = JSON.parse(raw);
            // Merge over the fallback so a pref added in a later release still
            // gets its default for users with an older object already stored.
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return { ...fallback, ...parsed };
            }
            return parsed;
        } catch (e) {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            // Private-browsing / quota. Preferences are a nicety, never block on them.
            console.warn('Could not persist preferences', e);
        }
    }
};

/* ----------------------------------------------------------------- toasts */

// Firestore writes on these pages previously failed silently -- the errors were
// swallowed into console.error, so a failed save looked exactly like a
// successful one. Deliberately minimal; this is not a component library.
let toastHost = null;

export function toast(message, kind = 'info') {
    if (!toastHost) {
        toastHost = document.createElement('div');
        toastHost.className = 'toast-host';
        document.body.appendChild(toastHost);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.textContent = message;
    toastHost.appendChild(el);

    setTimeout(() => {
        el.classList.add('toast-out');
        setTimeout(() => el.remove(), 250);
    }, 3200);
}

/* -------------------------------------------------------------- term scope */

// The assignments collection in Firestore is global across all terms, but each
// term page should only show its own. Undated and "TBD" items are deliberately
// whitelisted: a raw string compare drops them ("TBD" > "2026-01-01" is true but
// "TBD" <= "2026-04-30" is false), which would silently delete exactly the items
// that most need attention.
export function makeTermScope(termRange, knownCourseCodes) {
    const range = termRange || {};
    const known = new Set(knownCourseCodes || []);

    return function inTerm(item) {
        if (!item) return false;

        // The config's course list is the authority on membership. A course
        // listed for this term always belongs, whatever its date -- so an
        // undated/TBD item stays visible, and a deferred final scheduled past
        // termRange.end still shows up rather than silently vanishing.
        if (known.size > 0) return known.has(item.course);

        // No course list configured for this term. There is no membership
        // evidence left, so the date window is the only signal -- and an
        // undated item has to be excluded here, otherwise another term's
        // "TBD" final would surface on an otherwise-empty term page.
        if (!range.start || !range.end) return true;
        const d = item.date;
        if (!d || d === 'TBD') return false;
        return d >= range.start && d <= range.end;
    };
}

/* --------------------------------------------------------------- theming */

// These palettes are inlined into element style="" attributes at render time
// (course-group headers, calendar chips/dots), so they can't just be CSS
// custom properties the way the rest of the app's colors are -- the browser
// only re-resolves var() on repaint, not on re-render from a JS string
// template. Reading the <html data-theme> attribute at render time and
// picking the light-safe twin is the JS equivalent of style.css's
// :root[data-theme="light"] override block, and it stays correct because the
// theme toggle does a full page reload (see theme-toggle.js) rather than
// flipping the attribute live.
export function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
}

/* ------------------------------------------------------------- course color */

// No `color` field exists on course config objects, and adding one means
// hand-editing 3 config files per course -- instead, hash each course code
// deterministically into a fixed palette. Shared so a course's color is the
// same wherever it shows up (calendar chips, assignment-list course groups).
// The light array is index-aligned with the dark one -- same hash, same slot,
// just a darker twin of the same hue so text set in that color stays legible
// on a light page.
export const COURSE_PALETTE = ['#60a5fa', '#4ade80', '#facc15', '#f87171', '#c084fc', '#2dd4bf', '#fb923c', '#818cf8', '#f472b6', '#a3e635'];
export const COURSE_PALETTE_LIGHT = ['#1d4ed8', '#15803d', '#a16207', '#b91c1c', '#7e22ce', '#0f766e', '#c2410c', '#4338ca', '#be185d', '#4d7c0f'];

export function hashCourseColor(code) {
    let h = 0;
    const str = String(code || '');
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    const palette = isLightTheme() ? COURSE_PALETTE_LIGHT : COURSE_PALETTE;
    return palette[h % palette.length];
}

/* ----------------------------------------------------------- category color */

// Single source of truth for assignment-category colors -- previously
// duplicated (and already drifting into a "keep these two lists in sync by
// hand" comment) between assignments-page.js and calendar-page.js.
const CATEGORY_COLORS = {
    ASSIGNMENT: '#60a5fa', LAB: '#4ade80', QUIZ: '#facc15', MIDTERM: '#f87171',
    FINAL: '#ef4444', HOMEWORK: '#2dd4bf', REMINDER: '#c084fc', TUTORIAL: '#c084fc',
};
const CATEGORY_COLORS_LIGHT = {
    ASSIGNMENT: '#1d4ed8', LAB: '#15803d', QUIZ: '#a16207', MIDTERM: '#b91c1c',
    FINAL: '#b91c1c', HOMEWORK: '#0f766e', REMINDER: '#7e22ce', TUTORIAL: '#7e22ce',
};

export function categoryColor(category, fallback = 'transparent') {
    const map = isLightTheme() ? CATEGORY_COLORS_LIGHT : CATEGORY_COLORS;
    return map[String(category || '').toUpperCase()] || fallback;
}

export function categoryEntries() {
    return Object.entries(isLightTheme() ? CATEGORY_COLORS_LIGHT : CATEGORY_COLORS);
}

const TODO_COLOR = '#fb923c';
const TODO_COLOR_LIGHT = '#c2410c';

export function todoColor() {
    return isLightTheme() ? TODO_COLOR_LIGHT : TODO_COLOR;
}
