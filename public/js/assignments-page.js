// Assignments list page.
//
// This file used to live inline, triplicated verbatim across
// winter2026/, summer2026/ and fall2026/assignments.html -- every change had to
// be made three times, and the three copies had already drifted from the
// dashboard's own copy of the same helpers. Extracted here following the
// precedent set when grades.html was un-triplicated.
//
// Each term page supplies window.TERM_PREFIX (e.g. "/winter2026") and its own
// student-config script; everything else is shared.

import { DataService } from '/js/data-service.js?v=13';
import {
    escapeHtml,
    formatDate,
    formatDayCell,
    formatRelative,
    urgencyStatus,
    daysUntil,
    dueBucket,
    makeWeekLabeller,
    makeTermScope,
    Prefs,
    toast
} from '/js/ui-utils.js?v=1';

const PREFS_KEY = 'ui_prefs_assignments';

const DEFAULT_PREFS = {
    sort: 'date',
    groupBy: 'week',
    density: 'comfortable',
    status: 'all',
    collapsed: []
};

// Mirrors the .category-* palette in style.css. Used for the card's accent
// stripe, which CSS alone can't pick since the category is data, not markup.
const CATEGORY_COLORS = {
    ASSIGNMENT: '#60a5fa',
    LAB: '#4ade80',
    QUIZ: '#facc15',
    MIDTERM: '#f87171',
    FINAL: '#ef4444',
    HOMEWORK: '#2dd4bf',
    REMINDER: '#c084fc',
    TUTORIAL: '#c084fc'
};

/* ------------------------------------------------------------------ state */

let allItems = [];              // term-scoped assignments, the render source of truth
let prefs = Prefs.get(PREFS_KEY, DEFAULT_PREFS);
let collapsedGroups = new Set(prefs.collapsed || []);
let selectedCourses = new Set(); // empty = all courses
let searchQuery = '';
let weekLabel = () => '';
let termName = '';

/* ------------------------------------------------------------------- init */

async function init() {
    const config = window.STUDENT_DATA || {};
    const termRange = config.termRange || {};
    const courses = config.courses || [];

    weekLabel = makeWeekLabeller(termRange);
    termName = document.body.dataset.termName || '';

    // ?course= is the entry point from every course card, so it stays in the URL
    // rather than in localStorage: the view stays linkable and the existing
    // buttons keep working untouched. Comma-separated for multi-select.
    const urlCourses = new URLSearchParams(window.location.search).get('course');
    if (urlCourses) {
        urlCourses.split(',').map(c => decodeURIComponent(c).trim()).filter(Boolean)
            .forEach(c => selectedCourses.add(c));
    }

    try {
        const fetched = await DataService.getAllAssignments();
        // getAllAssignments returns the entire global collection across all
        // terms -- only the dashboard scoped it before. Now that this page has a
        // real course filter, an unscoped list would leak other terms' items in.
        const inTerm = makeTermScope(termRange, courses.map(c => c.code));
        allItems = (fetched || []).filter(inTerm);
    } catch (err) {
        console.error('Failed to load assignments', err);
        document.getElementById('assignment-list').innerHTML =
            `<div class="list-empty"><div class="list-empty-icon">!</div>
             <div class="list-empty-title">Couldn't load assignments</div>
             <div class="list-empty-hint">Check your connection and refresh.</div></div>`;
        return;
    }

    buildControls();
    wireEvents();
    render();
}

/* --------------------------------------------------------------- helpers */

function savePrefs() {
    Prefs.set(PREFS_KEY, { ...prefs, collapsed: [...collapsedGroups] });
}

// Keeps ?course= in sync with the chips so the URL always describes the view.
function syncUrl() {
    const url = new URL(window.location.href);
    if (selectedCourses.size === 0) {
        url.searchParams.delete('course');
    } else {
        url.searchParams.set('course', [...selectedCourses].join(','));
    }
    history.replaceState(null, '', url);
}

function allCourseCodes() {
    return [...new Set(allItems.map(a => a.course).filter(Boolean))].sort();
}

// Layers OVERDUE/TODAY/TOMORROW over the raw PENDING/UPCOMING/DONE status,
// the same 3-state language the to-do list uses.
function effectiveStatus(item) {
    const raw = item.status || 'PENDING';
    if (raw === 'DONE') return { label: 'DONE', className: 'status-done', done: true };

    // A final's placeholder date is set by the exams office, so it should never
    // be flagged as overdue against a guessed date.
    if (item.category !== 'FINAL') {
        const urgent = urgencyStatus(item.date);
        if (urgent) return { ...urgent, done: false };
    }

    return {
        label: raw,
        className: raw === 'UPCOMING' ? 'status-upcoming' : 'status-pending',
        done: false
    };
}

function isOverdue(item) {
    return effectiveStatus(item).label === 'OVERDUE';
}

/* ---------------------------------------------------------------- filter */

function visibleItems() {
    const q = searchQuery.trim().toLowerCase();

    return allItems.filter(item => {
        if (selectedCourses.size > 0 && !selectedCourses.has(item.course)) return false;

        if (q) {
            const haystack = `${item.title || ''} ${item.course || ''} ${item.category || ''}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }

        const st = effectiveStatus(item);
        if (prefs.status === 'active' && st.done) return false;
        if (prefs.status === 'done' && !st.done) return false;
        if (prefs.status === 'overdue' && st.label !== 'OVERDUE') return false;

        return true;
    });
}

/* ------------------------------------------------------------------ sort */

const SORTERS = {
    // Undated / TBD items sort last rather than landing at a NaN-driven random
    // position, which is what `new Date("TBD")` used to produce.
    date: (a, b) => {
        const da = a.date && a.date !== 'TBD' ? a.date : '￿';
        const db = b.date && b.date !== 'TBD' ? b.date : '￿';
        if (da !== db) return da < db ? -1 : 1;
        return (a.time || '').localeCompare(b.time || '');
    },
    course: (a, b) => (a.course || '').localeCompare(b.course || '') || SORTERS.date(a, b),
    category: (a, b) => (a.category || '').localeCompare(b.category || '') || SORTERS.date(a, b),
    title: (a, b) => (a.title || '').localeCompare(b.title || '')
};

/* --------------------------------------------------------------- grouping */

// Returns [{ key, label, items }] in display order.
function groupItems(items) {
    if (prefs.groupBy === 'none') {
        return [{ key: 'all', label: '', items }];
    }

    const keyFor = {
        week: item => {
            const label = (!item.date || item.date === 'TBD') ? 'Unscheduled' : weekLabel(item.date);
            return { key: label, label };
        },
        course: item => ({ key: item.course || 'Unknown', label: item.course || 'Unknown Course' }),
        category: item => ({ key: item.category || 'ASSIGNMENT', label: item.category || 'ASSIGNMENT' }),
        due: item => {
            const b = dueBucket(item.date && item.date !== 'TBD' ? item.date : null);
            return { key: b.key, label: b.label };
        }
    }[prefs.groupBy];

    const map = new Map();
    items.forEach(item => {
        const { key, label } = keyFor(item);
        if (!map.has(key)) map.set(key, { key, label, items: [] });
        map.get(key).items.push(item);
    });

    const groups = [...map.values()];

    // Week and due-bucket groups follow the sorted item order (items are already
    // sorted by date), so the natural map insertion order is correct. The other
    // two are alphabetical, except "Unscheduled" which always sinks to the end.
    if (prefs.groupBy === 'course' || prefs.groupBy === 'category') {
        groups.sort((a, b) => a.label.localeCompare(b.label));
    }
    if (prefs.groupBy === 'due') {
        groups.sort((a, b) => a.key.localeCompare(b.key));
    }

    const unscheduled = groups.filter(g => g.key === 'Unscheduled');
    if (unscheduled.length) {
        return [...groups.filter(g => g.key !== 'Unscheduled'), ...unscheduled];
    }
    return groups;
}

/* --------------------------------------------------------------- controls */

function buildControls() {
    const host = document.getElementById('assignment-controls');
    if (!host) return;

    const courses = allCourseCodes();

    // With 0 or 1 courses in view there is nothing to filter between, so the
    // chip row is omitted entirely rather than rendered as a dead control.
    // (Fall 2026 has no courses configured yet; Summer has exactly one.)
    const chipsHtml = courses.length > 1 ? `
        <div class="list-chips" id="course-chips">
            ${courses.map(c => `
                <button class="list-chip ${selectedCourses.has(c) ? 'active' : ''}"
                        data-action="course" data-course="${escapeHtml(c)}">${escapeHtml(c)}</button>
            `).join('')}
        </div>` : '';

    const anyDone = allItems.some(a => (a.status || '') === 'DONE');
    const statusHtml = anyDone ? `
        <div class="list-segmented" data-control="status">
            ${[['all', 'All'], ['active', 'Active'], ['overdue', 'Overdue'], ['done', 'Done']]
            .map(([v, l]) => `<button data-action="status" data-value="${v}"
                     class="${prefs.status === v ? 'active' : ''}">${l}</button>`).join('')}
        </div>` : '';

    host.innerHTML = `
        <div class="list-search">
            <input type="search" id="assign-search" placeholder="Search assignments..."
                   value="${escapeHtml(searchQuery)}" aria-label="Search assignments">
            <button class="list-search-clear" data-action="clear-search" title="Clear" hidden>&times;</button>
        </div>

        ${statusHtml}

        <div class="list-select-group">
            <label for="assign-sort">Sort</label>
            <select id="assign-sort" class="list-select" data-action="sort">
                <option value="date" ${prefs.sort === 'date' ? 'selected' : ''}>Due date</option>
                <option value="course" ${prefs.sort === 'course' ? 'selected' : ''}>Course</option>
                <option value="category" ${prefs.sort === 'category' ? 'selected' : ''}>Category</option>
                <option value="title" ${prefs.sort === 'title' ? 'selected' : ''}>Title</option>
            </select>
        </div>

        <div class="list-select-group">
            <label for="assign-group">Group</label>
            <select id="assign-group" class="list-select" data-action="group">
                <option value="week" ${prefs.groupBy === 'week' ? 'selected' : ''}>Week</option>
                <option value="due" ${prefs.groupBy === 'due' ? 'selected' : ''}>Due</option>
                <option value="course" ${prefs.groupBy === 'course' ? 'selected' : ''}>Course</option>
                <option value="category" ${prefs.groupBy === 'category' ? 'selected' : ''}>Category</option>
                <option value="none" ${prefs.groupBy === 'none' ? 'selected' : ''}>None</option>
            </select>
        </div>

        <div class="list-segmented" data-control="density">
            <button data-action="density" data-value="comfortable"
                    class="${prefs.density === 'comfortable' ? 'active' : ''}">Comfy</button>
            <button data-action="density" data-value="compact"
                    class="${prefs.density === 'compact' ? 'active' : ''}">Compact</button>
        </div>

        ${chipsHtml}
    `;
}

function filtersActive() {
    return searchQuery.trim() !== '' || selectedCourses.size > 0 || prefs.status !== 'all';
}

function clearFilters() {
    searchQuery = '';
    selectedCourses.clear();
    prefs.status = 'all';
    savePrefs();
    syncUrl();
    buildControls();
    render();
}

/* ---------------------------------------------------------------- render */

function render() {
    document.body.className = `list-density-${prefs.density}`;
    renderTitle();

    const items = visibleItems().sort(SORTERS[prefs.sort] || SORTERS.date);
    renderSummary(items);

    const container = document.getElementById('assignment-list');

    if (items.length === 0) {
        container.innerHTML = filtersActive()
            ? `<div class="list-empty">
                   <div class="list-empty-icon">∅</div>
                   <div class="list-empty-title">No assignments match your filters</div>
                   <div class="list-empty-hint">Try a different course or status.</div>
                   <button class="list-clear-filters" data-action="clear-filters">Clear filters</button>
               </div>`
            : `<div class="list-empty">
                   <div class="list-empty-icon">◇</div>
                   <div class="list-empty-title">Nothing scheduled yet</div>
                   <div class="list-empty-hint">Assignments appear here once this term's courses are set up.</div>
               </div>`;
        return;
    }

    const groups = groupItems(items);

    container.innerHTML = groups.map(group => {
        if (!group.label) return group.items.map(card).join('');

        const done = group.items.filter(i => effectiveStatus(i).done).length;
        const total = group.items.length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        const isCollapsed = collapsedGroups.has(group.key);

        return `
            <div class="list-group">
                <div class="list-group-header" data-action="toggle-group" data-key="${escapeHtml(group.key)}">
                    <span class="list-group-chevron">${isCollapsed ? '▸' : '▾'}</span>
                    <span class="list-group-name">${escapeHtml(group.label)}</span>
                    <span class="list-group-subtotal">${done} / ${total} done</span>
                </div>
                <div class="list-progress-track">
                    <div class="list-progress-fill ${pct === 100 ? 'is-complete' : ''}" style="width:${pct}%"></div>
                </div>
                <div class="list-group-body ${isCollapsed ? 'collapsed' : ''}">
                    ${group.items.map(card).join('')}
                </div>
            </div>`;
    }).join('');
}

function renderTitle() {
    const title = document.getElementById('course-title');
    const subtitle = document.getElementById('course-subtitle');
    if (!title) return;

    if (selectedCourses.size === 1) {
        const code = [...selectedCourses][0];
        title.textContent = `${code} Assignments`;
        if (subtitle) subtitle.textContent = `Track deadlines for ${code}`;
    } else if (selectedCourses.size > 1) {
        title.textContent = `${selectedCourses.size} Courses`;
        if (subtitle) subtitle.textContent = [...selectedCourses].join(' · ');
    } else {
        title.textContent = 'All Assignments';
        if (subtitle) subtitle.textContent = termName
            ? `Every deliverable for ${termName}.`
            : 'Upcoming deliverables and deadlines.';
    }
}

function renderSummary(items) {
    const host = document.getElementById('assignment-summary');
    if (!host) return;

    if (items.length === 0) {
        host.innerHTML = '';
        return;
    }

    const done = items.filter(i => effectiveStatus(i).done).length;
    const overdue = items.filter(i => isOverdue(i)).length;

    const upcoming = items
        .filter(i => !effectiveStatus(i).done && daysUntil(i.date) !== null && daysUntil(i.date) >= 0)
        .sort(SORTERS.date)[0];

    const nextText = upcoming
        ? `${escapeHtml(upcoming.title)} — ${formatDate(upcoming.date)}`
        : 'Nothing left on the calendar';

    host.innerHTML = `
        <div class="list-summary">
            <div class="list-summary-main">
                <span class="list-summary-label">Next up</span>
                <span class="list-summary-value" style="font-size:1rem">${nextText}</span>
            </div>
            <div class="list-summary-stats">
                <div class="list-summary-stat is-success">
                    <span class="list-summary-stat-value">${done}/${items.length}</span>
                    <span class="list-summary-stat-label">Done</span>
                </div>
                <div class="list-summary-stat ${overdue > 0 ? 'is-danger' : ''}">
                    <span class="list-summary-stat-value">${overdue}</span>
                    <span class="list-summary-stat-label">Overdue</span>
                </div>
            </div>
        </div>`;
}

function card(item) {
    const status = effectiveStatus(item);
    const category = item.category || 'ASSIGNMENT';
    const accent = CATEGORY_COLORS[category.toUpperCase()] || 'transparent';
    const prefix = window.TERM_PREFIX || '';

    const undated = !item.date || item.date === 'TBD';
    const dayCell = undated ? 'TBD' : formatDayCell(item.date);

    // Suppressed when the list is already grouped by week -- no point repeating
    // "Week 4" on every card inside the "Week 4" group.
    const weekSub = (prefs.groupBy !== 'week' && !undated)
        ? `<div class="assign-week-sub">${escapeHtml(weekLabel(item.date))}</div>` : '';

    // PENDING/UPCOMING are the default states of most items; badging them adds
    // noise without information, so only exceptional states get a badge.
    const showBadge = !['PENDING', 'UPCOMING'].includes(status.label);
    const badge = showBadge
        ? `<span class="assign-status ${status.className}">${status.label}</span>` : '';

    const relative = (!undated && !status.done)
        ? `<span class="assign-relative">${formatRelative(item.date)}</span>` : '';

    return `
        <div class="assignment-item ${status.done ? 'is-done' : ''} ${status.label === 'OVERDUE' ? 'is-overdue' : ''}"
             style="border-left-color:${accent}" data-id="${escapeHtml(item.id)}">
            <a href="${prefix}/details.html?id=${encodeURIComponent(item.id)}" class="assign-link-wrapper">
                <div class="assign-left">
                    <span class="assign-date">
                        ${dayCell}
                        ${weekSub}
                    </span>
                    <div class="assign-details">
                        <div class="assign-meta">
                            <span class="assign-course">${escapeHtml(item.course || 'Unknown Course')}</span>
                            <span class="assign-category category-${escapeHtml(category.toLowerCase())}">${escapeHtml(category)}</span>
                        </div>
                        <span class="assign-title ${status.done ? 'done-text' : ''}">${escapeHtml(item.title || 'Untitled Assignment')}</span>
                        ${relative}
                    </div>
                </div>
            </a>
            <div class="assign-right">
                <span class="assign-time">${escapeHtml(item.time || '23:59')}</span>
                ${badge}
                <button class="status-toggle-btn ${status.done ? 'checked' : ''}"
                        data-action="toggle-done" data-id="${escapeHtml(item.id)}"
                        title="${status.done ? 'Mark as Pending' : 'Mark as Done'}">${status.done ? '✓' : ''}</button>
            </div>
        </div>`;
}

/* ---------------------------------------------------------------- events */

function wireEvents() {
    const controls = document.getElementById('assignment-controls');
    const list = document.getElementById('assignment-list');

    controls.addEventListener('click', onControlClick);
    controls.addEventListener('change', onControlChange);
    controls.addEventListener('input', onSearchInput);
    list.addEventListener('click', onListClick);

    document.addEventListener('keydown', e => {
        if (e.key === '/' && !/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) {
            e.preventDefault();
            document.getElementById('assign-search')?.focus();
        }
    });
}

function onSearchInput(e) {
    if (e.target.id !== 'assign-search') return;
    searchQuery = e.target.value;
    const clearBtn = e.target.parentElement.querySelector('.list-search-clear');
    if (clearBtn) clearBtn.hidden = searchQuery === '';
    render();
}

function onControlChange(e) {
    const action = e.target.dataset.action;
    if (action === 'sort') prefs.sort = e.target.value;
    else if (action === 'group') prefs.groupBy = e.target.value;
    else return;
    savePrefs();
    render();
}

function onControlClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'clear-search') {
        searchQuery = '';
        const input = document.getElementById('assign-search');
        if (input) input.value = '';
        btn.hidden = true;
        render();
        return;
    }

    if (action === 'status' || action === 'density') {
        const key = action === 'status' ? 'status' : 'density';
        prefs[key] = btn.dataset.value;
        savePrefs();
        // Only the segment buttons change; repaint them in place rather than
        // rebuilding the whole control bar (which would drop search focus).
        btn.parentElement.querySelectorAll('button')
            .forEach(b => b.classList.toggle('active', b === btn));
        render();
        return;
    }

    if (action === 'course') {
        const code = btn.dataset.course;
        if (selectedCourses.has(code)) selectedCourses.delete(code);
        else selectedCourses.add(code);
        btn.classList.toggle('active', selectedCourses.has(code));
        syncUrl();
        render();
    }
}

function onListClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    if (action === 'toggle-group') {
        const key = target.dataset.key;
        if (collapsedGroups.has(key)) collapsedGroups.delete(key);
        else collapsedGroups.add(key);
        savePrefs();
        render();
        return;
    }

    if (action === 'clear-filters') {
        clearFilters();
        return;
    }

    if (action === 'toggle-done') {
        e.preventDefault();
        toggleDone(target.dataset.id);
    }
}

// Previously this re-fetched the whole collection from Firestore and rebuilt the
// entire list on every checkbox click. Same local-cache re-render the grades
// page uses: flip the cached item, repaint, and let the write settle behind it.
async function toggleDone(id) {
    const item = allItems.find(a => a.id === id);
    if (!item) return;

    const previous = item.status || 'PENDING';
    const next = previous === 'DONE' ? 'PENDING' : 'DONE';
    item.status = next;
    render();

    const ok = await DataService.updateAssignmentStatus(id, next);
    if (ok === false) {
        item.status = previous;
        render();
        toast("Couldn't save that change", 'error');
    }
}

init();
