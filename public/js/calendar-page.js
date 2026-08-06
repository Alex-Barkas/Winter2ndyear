// Unified cross-term calendar: every course's assignments + every to-do,
// across all three terms, in one Month/Agenda view with drag-to-reschedule.
//
// Cross-term data loading follows todo.html's pattern (load all three
// student-config-*.js files in sequence, stash each term's .courses before the
// next overwrites window.STUDENT_DATA) but additionally stashes each term's
// .termRange -- todo.html never needed that, this page does, for per-item
// reading-week/week-label context (see weekLabelFor below) and for building
// correct /{term}2026/details.html links via window.__courseTermMap (see
// calendar.html's inline bootstrap script).

import { DataService } from '/js/data-service.js?v=13';
import {
    escapeHtml,
    todayLocal,
    formatDate,
    formatRelative,
    urgencyStatus,
    makeWeekLabeller,
    Prefs,
    toast
} from '/js/ui-utils.js?v=1';

const PREFS_KEY = 'ui_prefs_calendar';
const DEFAULT_PREFS = { view: 'month', term: 'all' };

// Mirrors assignments-page.js's CATEGORY_COLORS / style.css's .category-*
// palette, so a category means the same color here as on the List/Agenda pages.
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
const TODO_COLOR = '#fb923c';

// No `color` field exists on course config objects, and adding one means
// hand-editing 3 config files per course -- instead, hash each course code
// deterministically into a fixed palette. To-dos have no category, so this is
// what colors their chips (assignments use CATEGORY_COLORS instead, above).
const COURSE_PALETTE = ['#60a5fa', '#4ade80', '#facc15', '#f87171', '#c084fc', '#2dd4bf', '#fb923c', '#818cf8', '#f472b6', '#a3e635'];
function hashCourseColor(code) {
    let h = 0;
    const str = String(code || '');
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return COURSE_PALETTE[h % COURSE_PALETTE.length];
}

function chipColor(item) {
    if (item.__type === 'assignment') return CATEGORY_COLORS[(item.category || '').toUpperCase()] || 'var(--text-muted)';
    return item.course && item.course !== 'Personal' ? hashCourseColor(item.course) : TODO_COLOR;
}

/* ------------------------------------------------------------------ state */

const TERM_LABELS = { winter2026: 'Winter 2026', summer2026: 'Summer 2026', fall2026: 'Fall 2026' };

const state = {
    assignments: [],   // one-shot fetch, no realtime channel exists for assignments
    todos: [],          // realtime via subscribeToTodos
    courseTermMap: window.__courseTermMap || {},
    termRanges: window.__termRanges || {},
    weekLabellers: {},   // term -> makeWeekLabeller(termRanges[term])

    prefs: Prefs.get(PREFS_KEY, DEFAULT_PREFS),
    cursor: (() => { const t = todayLocal(); return { year: t.getFullYear(), month: t.getMonth() }; })(),
    selectedDate: null,
    filters: { courses: new Set(), categories: new Set() },

    editingItem: null,   // {type, id} | null -- item the modal currently represents
    gesture: null,        // in-flight pointer gesture (see drag section)
    pendingTodoSnapshot: null
};

for (const term of Object.keys(state.termRanges)) {
    if (state.termRanges[term]) state.weekLabellers[term] = makeWeekLabeller(state.termRanges[term]);
}

function savePrefs() { Prefs.set(PREFS_KEY, state.prefs); }

/* ------------------------------------------------------------------- init */

// Agenda groups are sorted purely chronologically from the earliest scheduled
// item, which can be months in the past -- set whenever the view should
// scroll to today's group on its next render (an explicit switch into Agenda,
// or landing there by default), and cleared right after so later re-renders
// from filters/drags/snapshot updates don't yank the user's scroll position
// back while they're browsing.
let agendaNeedsScroll = false;

document.addEventListener('DOMContentLoaded', () => {
    // A phone-width viewport can't usefully show a chip-filled month grid --
    // default to Agenda there unless the user has already chosen explicitly.
    if (!Prefs.get(PREFS_KEY, null) && window.matchMedia('(max-width: 700px)').matches) {
        state.prefs.view = 'agenda';
    }
    if (state.prefs.view === 'agenda') agendaNeedsScroll = true;

    populateEventCourseSelect();
    wireControls();
    wireGrid();
    wireModal();

    DataService.getAllAssignments().then(list => {
        state.assignments = list;
        renderAll();
    });

    DataService.subscribeToTodos(snapshot => {
        if (state.gesture && state.gesture.dragging) {
            state.pendingTodoSnapshot = snapshot;
            return;
        }
        state.todos = snapshot;
        renderAll();
    });
});

/* --------------------------------------------------------------- helpers */

function weekLabelFor(item) {
    const term = state.courseTermMap[item.course];
    const labeller = term && state.weekLabellers[term];
    return labeller ? labeller(item.date) : '';
}

function termForDate(dateStr) {
    for (const [term, range] of Object.entries(state.termRanges)) {
        if (range && dateStr >= range.start && dateStr <= range.end) return term;
    }
    return null;
}

function isReadingWeek(dateStr) {
    const term = termForDate(dateStr);
    const rw = term && state.termRanges[term] && state.termRanges[term].readingWeek;
    return !!(rw && dateStr >= rw.start && dateStr <= rw.end);
}

function isDone(item) {
    return item.__type === 'assignment' ? item.status === 'DONE' : !!item.completed;
}

function isUnscheduled(item) {
    if (item.__type === 'todo') return !item.date;
    return !item.date || item.date === 'TBD';
}

function allItems() {
    return [
        ...state.assignments.map(a => ({ ...a, __type: 'assignment' })),
        ...state.todos.map(t => ({ ...t, __type: 'todo' }))
    ];
}

/* ----------------------------------------------------------------- filter */

function scopedItems() {
    const items = allItems();
    return items.filter(item => {
        if (state.prefs.term !== 'all') {
            const isPersonalTodo = item.__type === 'todo' && (!item.course || item.course === 'Personal');
            if (!isPersonalTodo && state.courseTermMap[item.course] !== state.prefs.term) return false;
        }
        if (state.filters.courses.size > 0 && !state.filters.courses.has(item.course || 'Personal')) return false;
        if (state.filters.categories.size > 0) {
            const key = item.__type === 'todo' ? 'TODO' : (item.category || '').toUpperCase();
            if (!state.filters.categories.has(key)) return false;
        }
        return true;
    });
}

function scheduledItems() { return scopedItems().filter(i => !isUnscheduled(i)); }
function unscheduledItems() { return scopedItems().filter(isUnscheduled); }

function allCourseCodes() {
    return [...new Set(allItems().map(i => i.course || 'Personal'))].sort();
}

function allCategories() {
    const cats = new Set(state.assignments.map(a => (a.category || '').toUpperCase()).filter(Boolean));
    return [...cats].sort();
}

/* --------------------------------------------------------------- controls */

function buildControls() {
    const host = document.getElementById('cal-controls');
    if (!host) return;

    const courses = allCourseCodes();
    const categories = allCategories();

    const chipsHtml = `
        <div class="list-chips">
            ${categories.map(c => `
                <button class="list-chip ${state.filters.categories.has(c) ? 'active' : ''}"
                        data-action="cat" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>
            `).join('')}
            <button class="list-chip ${state.filters.categories.has('TODO') ? 'active' : ''}"
                    data-action="cat" data-value="TODO">TO-DO</button>
        </div>
        <div class="list-chips">
            ${courses.map(c => `
                <button class="list-chip ${state.filters.courses.has(c) ? 'active' : ''}"
                        data-action="course" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>
            `).join('')}
        </div>`;

    const termOptions = [['all', 'All Terms'], ...Object.entries(TERM_LABELS)]
        .map(([v, l]) => `<option value="${v}" ${state.prefs.term === v ? 'selected' : ''}>${l}</option>`).join('');

    host.innerHTML = `
        <div class="list-segmented">
            <button data-action="view" data-value="month" class="${state.prefs.view === 'month' ? 'active' : ''}">Month</button>
            <button data-action="view" data-value="agenda" class="${state.prefs.view === 'agenda' ? 'active' : ''}">Agenda</button>
        </div>
        <div class="list-select-group">
            <label for="cal-term-select">Term</label>
            <select id="cal-term-select" class="list-select" data-action="term">${termOptions}</select>
        </div>
        ${filtersActive() ? '<button class="list-clear-filters" data-action="clear-filters">Clear filters</button>' : ''}
        ${chipsHtml}
    `;
}

function filtersActive() {
    return state.filters.courses.size > 0 || state.filters.categories.size > 0 || state.prefs.term !== 'all';
}

/* ------------------------------------------------------------- top render */

function renderAll() {
    buildControls();

    document.getElementById('cal-month-view').classList.toggle('hidden', state.prefs.view !== 'month');
    document.getElementById('cal-agenda-view').classList.toggle('hidden', state.prefs.view !== 'agenda');

    if (state.prefs.view === 'month') renderMonthGrid();
    else renderAgendaView();

    renderTray();
    renderSidePanel();
}

/* ------------------------------------------------------------- month grid */

function renderMonthGrid() {
    const { year, month } = state.cursor;
    document.getElementById('cal-month-label').textContent =
        new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const items = scheduledItems();
    const byDate = new Map();
    items.forEach(i => {
        if (!byDate.has(i.date)) byDate.set(i.date, []);
        byDate.get(i.date).push(i);
    });

    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0=Sun
    const gridStart = new Date(year, month, 1 - startOffset);
    const todayStr = toDateStr(todayLocal());

    let html = '';
    for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
        const dateStr = toDateStr(d);
        const inMonth = d.getMonth() === month;
        const dayItems = (byDate.get(dateStr) || []).sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
        html += renderCell(dateStr, d.getDate(), inMonth, dateStr === todayStr, dayItems);
    }
    document.getElementById('cal-grid').innerHTML = html;
}

function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderCell(dateStr, dayNum, inMonth, isToday, dayItems) {
    const visible = dayItems.slice(0, 3);
    const more = dayItems.length - visible.length;
    const classes = [
        'cal-cell',
        !inMonth && 'is-other-month',
        isToday && 'is-today',
        dateStr === state.selectedDate && 'is-selected',
        isReadingWeek(dateStr) && 'is-reading-week'
    ].filter(Boolean).join(' ');

    return `
        <div class="${classes}" data-date="${dateStr}">
            <span class="cal-day-num">${dayNum}</span>
            <div class="cal-chips">${visible.map(renderChip).join('')}</div>
            ${more > 0 ? `<button type="button" class="cal-day-more" data-action="more" data-date="${dateStr}">+${more} more</button>` : ''}
        </div>`;
}

function renderChip(item) {
    const color = chipColor(item);
    return `<div class="cal-chip ${isDone(item) ? 'is-done' : ''}"
                 style="border-left-color:${color};--chip-color:${color};"
                 data-drag-id="${escapeHtml(item.id)}" data-drag-type="${item.__type}"
                 title="${escapeHtml(item.title || 'Untitled')}">${escapeHtml(item.title || 'Untitled')}</div>`;
}

/* ------------------------------------------------------------------ agenda */

function renderAgendaView() {
    const items = scheduledItems().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const host = document.getElementById('cal-agenda-view');

    if (items.length === 0) {
        host.innerHTML = `<div class="list-empty"><div class="list-empty-icon">∅</div>
            <div class="list-empty-title">Nothing scheduled</div>
            <div class="list-empty-hint">Try a different term or clear your filters.</div></div>`;
        return;
    }

    const groups = [];
    let last = null;
    for (const item of items) {
        if (item.date !== last) { groups.push({ date: item.date, items: [] }); last = item.date; }
        groups[groups.length - 1].items.push(item);
    }

    host.innerHTML = groups.map(g => `
        <div class="list-group">
            <div class="list-group-header" data-date="${g.date}">
                <span class="list-group-name">${escapeHtml(formatDate(g.date))}</span>
                <span class="list-group-subtotal">${escapeHtml(formatRelative(g.date))}</span>
            </div>
            <div class="list-group-body">
                ${g.items.map(renderAgendaRow).join('')}
            </div>
        </div>
    `).join('');

    if (agendaNeedsScroll) {
        agendaNeedsScroll = false;
        requestAnimationFrame(scrollAgendaToToday);
    }
}

function scrollAgendaToToday() {
    const host = document.getElementById('cal-agenda-view');
    const todayStr = toDateStr(todayLocal());
    const headers = [...host.querySelectorAll('.list-group-header')];
    if (headers.length === 0) return;

    const upcoming = headers.find(h => h.dataset.date >= todayStr);
    const targetHeader = upcoming || headers[headers.length - 1];
    // Scroll the whole .list-group (header + its item rows), not just the
    // header -- aligning only the header to the bottom edge pushes its own
    // items off-screen below the fold.
    const targetGroup = targetHeader.closest('.list-group') || targetHeader;
    targetGroup.scrollIntoView({ block: upcoming ? 'start' : 'end' });
}

function renderAgendaRow(item) {
    const color = chipColor(item);
    const course = escapeHtml(item.course || 'Personal');
    const urgent = isDone(item) ? null : urgencyStatus(item.date);
    return `
        <div class="assignment-item" data-drag-id="${escapeHtml(item.id)}" data-drag-type="${item.__type}" style="border-left:3px solid ${color};">
            <div class="assign-left">
                <div class="assign-details">
                    <div class="assign-meta"><span class="assign-course">${course}</span></div>
                    <span class="assign-title ${isDone(item) ? 'done-text' : ''}">${escapeHtml(item.title || 'Untitled')}</span>
                </div>
            </div>
            <div class="assign-right">
                ${item.time ? `<span class="assign-time">${escapeHtml(item.time)}</span>` : ''}
                ${urgent ? `<span class="assign-status ${urgent.className}">${urgent.label}</span>` : ''}
            </div>
        </div>`;
}

/* ---------------------------------------------------------- unscheduled tray */

function renderTray() {
    const host = document.getElementById('cal-tray-list');
    const items = unscheduledItems();
    host.innerHTML = items.length
        ? items.map(renderTrayChip).join('')
        : '<div class="cal-tray-empty">Nothing unscheduled. Drag an item here to clear its date.</div>';
}

function renderTrayChip(item) {
    const color = chipColor(item);
    return `<div class="cal-tray-chip" style="border-left-color:${color};"
                 data-drag-id="${escapeHtml(item.id)}" data-drag-type="${item.__type}">
                 ${escapeHtml(item.title || 'Untitled')}
                 <span style="opacity:.6">— ${escapeHtml(item.course || 'Personal')}</span>
             </div>`;
}

/* ------------------------------------------------------------- side panel */

function renderSidePanel() {
    const host = document.getElementById('cal-day-detail');
    if (!state.selectedDate) { host.innerHTML = renderLegend(); return; }

    const dayItems = scheduledItems().filter(i => i.date === state.selectedDate);
    host.innerHTML = `
        <span class="cal-detail-date">${escapeHtml(formatDate(state.selectedDate))}</span>
        ${dayItems.length ? dayItems.map(renderDetailRow).join('') : '<div class="cal-detail-empty">Nothing due on this day.</div>'}
        <button type="button" class="cal-add-btn" style="width:100%;margin-top:0.85rem;"
                data-action="add-on-day" data-date="${state.selectedDate}">+ Add event on this day</button>
    `;
}

function renderDetailRow(item) {
    const color = chipColor(item);
    return `<div class="cal-tray-chip" style="border-left-color:${color};margin-bottom:0.4rem;cursor:pointer;"
                 data-action="edit-item" data-id="${escapeHtml(item.id)}" data-type="${item.__type}">
                 ${escapeHtml(item.title || 'Untitled')}
                 <span style="opacity:.6">— ${escapeHtml(item.course || 'Personal')}</span>
             </div>`;
}

function renderLegend() {
    const rows = Object.entries(CATEGORY_COLORS)
        .filter(([cat]) => cat !== 'TUTORIAL') // shares REMINDER's color, redundant in a legend
        .map(([cat, color]) => `<div class="cal-legend-row"><span class="cal-legend-dot" style="background:${color};"></span>${escapeHtml(cat)}</div>`)
        .join('');
    return `<h3 style="margin-top:0;">Legend</h3><div class="cal-legend">${rows}
        <div class="cal-legend-row"><span class="cal-legend-dot" style="background:${TODO_COLOR};"></span>TO-DO (personal)</div>
        <div class="cal-legend-row"><span class="cal-legend-dot" style="background:${COURSE_PALETTE[0]};"></span>TO-DO (by course)</div>
    </div>
    <p class="cal-detail-empty" style="padding:0.75rem 0 0;">Click a day to see what's due.</p>`;
}

/* ------------------------------------------------------------------ modal */

function buildCourseOptgroupsHtml(selectedCode) {
    const groups = [
        { label: 'Winter 2026', courses: window.__coursesWinter2026 || [] },
        { label: 'Summer 2026', courses: window.__coursesSummer2026 || [] },
        { label: 'Fall 2026', courses: window.__coursesFall2026 || [] }
    ];
    return groups.filter(g => g.courses.length > 0).map(g => {
        const opts = g.courses.map(c =>
            `<option value="${escapeHtml(c.code)}" ${c.code === selectedCode ? 'selected' : ''}>${escapeHtml(c.code)}</option>`
        ).join('');
        return `<optgroup label="${g.label}">${opts}</optgroup>`;
    }).join('');
}

function populateEventCourseSelect(selectedCode) {
    const select = document.getElementById('event-course');
    select.querySelectorAll('optgroup').forEach(el => el.remove());
    select.insertAdjacentHTML('beforeend', buildCourseOptgroupsHtml(selectedCode));
}

function setModalTypeVisibility(type) {
    document.getElementById('event-category-group').classList.toggle('hidden', type !== 'assignment');
    document.getElementById('event-urgency-group').classList.toggle('hidden', type !== 'todo');
    document.getElementById('event-time-group').classList.toggle('hidden', type !== 'assignment');
}

function openEventModal(existing, prefillDate) {
    state.editingItem = existing ? { type: existing.__type, id: existing.id } : null;

    document.getElementById('event-modal-title').textContent = existing ? 'Edit Event' : 'Add Event';
    document.getElementById('event-delete-btn').classList.toggle('hidden', !existing);

    const type = existing ? existing.__type : 'assignment';
    document.getElementById('event-type').value = type;
    document.getElementById('event-type').disabled = !!existing; // changing type on an existing item would orphan the old doc
    setModalTypeVisibility(type);

    document.getElementById('event-title').value = existing ? (existing.title || '') : '';
    populateEventCourseSelect(existing ? existing.course : 'Personal');
    document.getElementById('event-course').value = existing ? (existing.course || 'Personal') : 'Personal';
    document.getElementById('event-category').value = existing && existing.category ? existing.category : 'ASSIGNMENT';
    document.getElementById('event-urgency').value = existing && existing.urgency ? existing.urgency : '3';

    const dateVal = existing ? (existing.date === 'TBD' ? '' : existing.date || '') : (prefillDate || '');
    document.getElementById('event-date').value = dateVal;
    document.getElementById('event-time').value = existing ? (existing.time || '') : '';

    document.getElementById('event-modal').hidden = false;
}

function closeEventModal() {
    document.getElementById('event-modal').hidden = true;
    state.editingItem = null;
}

async function saveEventModal() {
    const type = document.getElementById('event-type').value;
    const title = document.getElementById('event-title').value.trim();
    if (!title) { toast('Give it a title first.', 'error'); return; }

    const course = document.getElementById('event-course').value;
    const date = document.getElementById('event-date').value;

    if (type === 'assignment') {
        const payload = {
            title, course,
            date: date || 'TBD',
            time: document.getElementById('event-time').value || '23:59',
            category: document.getElementById('event-category').value
        };
        if (state.editingItem) {
            const ok = await DataService.updateAssignmentDetails(state.editingItem.id, payload);
            if (!ok) { toast('Could not save that change.', 'error'); return; }
            state.assignments = state.assignments.map(a => a.id === state.editingItem.id ? { ...a, ...payload } : a);
        } else {
            const newItem = { id: 'manual_' + Date.now(), ...payload, status: 'PENDING', score: null, details: { type: 'text', content: 'Added from the calendar.' } };
            const saved = await DataService.addAssignment(newItem);
            if (!saved) { toast('Could not add that event.', 'error'); return; }
            state.assignments = [...state.assignments, newItem];
        }
    } else {
        const base = state.editingItem ? state.todos.find(t => t.id === state.editingItem.id) : null;
        const payload = {
            id: base ? base.id : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title, course,
            urgency: parseInt(document.getElementById('event-urgency').value, 10) || 3,
            date: date || '',
            completed: base ? !!base.completed : false,
            createdAt: base ? base.createdAt : new Date().toISOString()
        };
        const ok = await DataService.saveTodoItem(payload);
        if (!ok) { toast('Could not save that to-do.', 'error'); return; }
        state.todos = base ? state.todos.map(t => t.id === payload.id ? payload : t) : [...state.todos, payload];
    }

    toast('Saved.', 'success');
    closeEventModal();
    renderAll();
}

async function deleteEventModal() {
    if (!state.editingItem) return;
    if (!confirm('Delete this event? This cannot be undone.')) return;
    const { type, id } = state.editingItem;

    if (type === 'assignment') {
        await DataService.deleteAssignment(id);
        state.assignments = state.assignments.filter(a => a.id !== id);
    } else {
        const ok = await DataService.deleteTodoItem(id);
        if (ok === false) { toast('Could not delete that to-do.', 'error'); return; }
        state.todos = state.todos.filter(t => t.id !== id);
    }

    toast('Deleted.', 'success');
    closeEventModal();
    renderAll();
}

function findItemById(type, id) {
    const source = type === 'assignment' ? state.assignments : state.todos;
    const found = source.find(i => i.id === id);
    return found ? { ...found, __type: type } : null;
}

/* --------------------------------------------------------- drag and drop */
//
// Everything draggable carries data-drag-id/data-drag-type; every valid drop
// target carries data-date (month cells, agenda date-group headers, and the
// Unscheduled tray, which additionally carries data-tray="true" so the drop
// handler knows to write back the type-specific "no date" sentinel: '' for
// to-dos, 'TBD' for assignments -- they don't share one empty-date convention).
//
// Move/up tracking happens via *document*-level listeners added on pointerdown
// (not element-level pointerenter/pointerover on cells, which stop firing on
// the cells once something else has pointer capture) -- so hit-testing is done
// manually every move via elementFromPoint, and the ghost element must carry
// pointer-events:none or elementFromPoint would return the ghost itself.

const DRAG_PX_THRESHOLD = 6;
const LONG_PRESS_MS = 250;
const LONG_PRESS_TOLERANCE_PX = 10;

function wireGrid() {
    ['cal-grid', 'cal-agenda-view', 'cal-tray-list'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('pointerdown', onPointerDown);
    });

    document.getElementById('cal-grid').addEventListener('click', e => {
        if (state.gesture && state.gesture.suppressClick) return;
        const more = e.target.closest('.cal-day-more');
        if (more) { state.selectedDate = more.dataset.date; renderSidePanel(); renderMonthGrid(); return; }
        const chip = e.target.closest('[data-drag-id]');
        if (chip) return; // handled by pointerup below
        const cell = e.target.closest('.cal-cell');
        if (cell) { state.selectedDate = cell.dataset.date; renderSidePanel(); renderMonthGrid(); }
    });

    document.getElementById('cal-day-detail').addEventListener('click', e => {
        const addBtn = e.target.closest('[data-action="add-on-day"]');
        if (addBtn) { openEventModal(null, addBtn.dataset.date); return; }
        const row = e.target.closest('[data-action="edit-item"]');
        if (row) {
            const item = findItemById(row.dataset.type, row.dataset.id);
            if (item) openEventModal(item);
        }
    });

    document.getElementById('cal-prev-month').addEventListener('click', () => { shiftMonth(-1); });
    document.getElementById('cal-next-month').addEventListener('click', () => { shiftMonth(1); });
    document.getElementById('cal-add-btn').addEventListener('click', () => openEventModal(null, state.selectedDate));
}

function shiftMonth(delta) {
    let { year, month } = state.cursor;
    month += delta;
    if (month < 0) { month = 11; year -= 1; }
    if (month > 11) { month = 0; year += 1; }
    state.cursor = { year, month };
    renderMonthGrid();
}

function onPointerDown(e) {
    const chip = e.target.closest('[data-drag-id]');
    if (!chip) return; // bare-cell clicks are handled by the 'click' listener above

    const gesture = {
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startX: e.clientX,
        startY: e.clientY,
        chipEl: chip,
        dragId: chip.dataset.dragId,
        dragType: chip.dataset.dragType,
        dragging: false,
        suppressClick: false,
        ghostEl: null,
        lastTarget: null,
        longPressTimer: null
    };
    state.gesture = gesture;

    const move = ev => onPointerMove(ev, gesture);
    const up = ev => onPointerUp(ev, gesture);
    gesture.cleanup = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', cancel);
        if (gesture.longPressTimer) clearTimeout(gesture.longPressTimer);
    };
    const cancel = () => { endDrag(gesture, null); gesture.cleanup(); state.gesture = null; };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', cancel);

    if (e.pointerType === 'touch') {
        gesture.longPressTimer = setTimeout(() => {
            if (!gesture.dragging) startDrag(gesture, e.clientX, e.clientY);
        }, LONG_PRESS_MS);
    }
}

function onPointerMove(e, gesture) {
    if (gesture.pointerId !== e.pointerId) return;
    const dx = e.clientX - gesture.startX;
    const dy = e.clientY - gesture.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!gesture.dragging) {
        if (gesture.pointerType === 'touch') {
            // Excess movement before the long-press timer fires means the user
            // is scrolling, not dragging -- cancel the pending drag entirely.
            if (dist > LONG_PRESS_TOLERANCE_PX && gesture.longPressTimer) {
                clearTimeout(gesture.longPressTimer);
                gesture.longPressTimer = null;
            }
            return; // touch drags only start from the long-press timer, never from move
        }
        if (dist > DRAG_PX_THRESHOLD) startDrag(gesture, e.clientX, e.clientY);
        return;
    }

    e.preventDefault();
    gesture.ghostEl.style.left = e.clientX + 'px';
    gesture.ghostEl.style.top = e.clientY + 'px';

    gesture.ghostEl.style.display = 'none';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    gesture.ghostEl.style.display = '';

    const target = under && under.closest('[data-date]');
    if (target !== gesture.lastTarget) {
        if (gesture.lastTarget) gesture.lastTarget.classList.remove('is-drop-target');
        if (target) target.classList.add('is-drop-target');
        gesture.lastTarget = target || null;
    }
}

function startDrag(gesture, x, y) {
    gesture.dragging = true;
    gesture.suppressClick = true;
    gesture.chipEl.classList.add('cal-chip-dragging');

    const ghost = document.createElement('div');
    ghost.className = 'cal-chip-ghost';
    ghost.textContent = gesture.chipEl.textContent.trim();
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    document.body.appendChild(ghost);
    gesture.ghostEl = ghost;

    try { gesture.chipEl.setPointerCapture(gesture.pointerId); } catch (err) { /* not all pointer types support capture */ }
}

function onPointerUp(e, gesture) {
    if (gesture.pointerId !== e.pointerId) return;
    gesture.cleanup();

    if (!gesture.dragging) {
        // A plain tap/click on a chip: open it for editing.
        const item = findItemById(gesture.dragType, gesture.dragId);
        if (item) openEventModal(item);
        state.gesture = null;
        return;
    }

    const target = gesture.lastTarget;
    endDrag(gesture, target);
    state.gesture = null;

    // Swallow the synthetic 'click' the browser fires right after pointerup.
    setTimeout(() => { gesture.suppressClick = false; }, 0);
}

function endDrag(gesture, dropTarget) {
    if (gesture.ghostEl) gesture.ghostEl.remove();
    gesture.chipEl && gesture.chipEl.classList.remove('cal-chip-dragging');
    if (gesture.lastTarget) gesture.lastTarget.classList.remove('is-drop-target');

    if (!dropTarget) {
        if (state.pendingTodoSnapshot) { state.todos = state.pendingTodoSnapshot; state.pendingTodoSnapshot = null; }
        return;
    }

    const isTray = dropTarget.dataset.tray === 'true';
    const newDate = isTray ? (gesture.dragType === 'todo' ? '' : 'TBD') : dropTarget.dataset.date;
    commitDateChange(gesture.dragType, gesture.dragId, newDate);
}

async function commitDateChange(type, id, newDate) {
    const original = findItemById(type, id);
    if (!original || original.date === newDate) {
        if (state.pendingTodoSnapshot) { state.todos = state.pendingTodoSnapshot; state.pendingTodoSnapshot = null; }
        return;
    }

    // Optimistic update, then reconcile.
    if (type === 'assignment') {
        state.assignments = state.assignments.map(a => a.id === id ? { ...a, date: newDate } : a);
    } else {
        state.todos = state.todos.map(t => t.id === id ? { ...t, date: newDate } : t);
    }
    renderAll();

    let ok;
    if (type === 'assignment') {
        ok = await DataService.updateAssignmentDetails(id, { date: newDate });
    } else {
        const todo = state.todos.find(t => t.id === id);
        ok = await DataService.saveTodoItem(todo);
    }

    if (state.pendingTodoSnapshot) { state.todos = state.pendingTodoSnapshot; state.pendingTodoSnapshot = null; }

    if (!ok) {
        if (type === 'assignment') {
            state.assignments = state.assignments.map(a => a.id === id ? { ...a, date: original.date } : a);
        } else {
            state.todos = state.todos.map(t => t.id === id ? { ...t, date: original.date } : t);
        }
        renderAll();
        toast('Could not move that item — try again.', 'error');
        return;
    }

    renderAll();
    toast(newDate === 'TBD' || newDate === '' ? 'Moved to Unscheduled.' : `Moved to ${formatDate(newDate)}.`, 'success');
}

/* -------------------------------------------------------------- wireControls */

function wireControls() {
    const host = document.getElementById('cal-controls');
    host.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        if (btn.dataset.action === 'view') {
            state.prefs.view = btn.dataset.value;
            savePrefs();
            if (state.prefs.view === 'agenda') agendaNeedsScroll = true;
            renderAll();
        } else if (btn.dataset.action === 'cat') {
            const v = btn.dataset.value;
            state.filters.categories.has(v) ? state.filters.categories.delete(v) : state.filters.categories.add(v);
            renderAll();
        } else if (btn.dataset.action === 'course') {
            const v = btn.dataset.value;
            state.filters.courses.has(v) ? state.filters.courses.delete(v) : state.filters.courses.add(v);
            renderAll();
        } else if (btn.dataset.action === 'clear-filters') {
            state.filters.courses.clear();
            state.filters.categories.clear();
            state.prefs.term = 'all';
            savePrefs();
            renderAll();
        }
    });

    host.addEventListener('change', e => {
        if (e.target.dataset.action === 'term') {
            state.prefs.term = e.target.value;
            savePrefs();
            renderAll();
        }
    });
}

function wireModal() {
    document.getElementById('event-type').addEventListener('change', e => setModalTypeVisibility(e.target.value));
    document.getElementById('event-cancel-btn').addEventListener('click', closeEventModal);
    document.getElementById('event-save-btn').addEventListener('click', saveEventModal);
    document.getElementById('event-delete-btn').addEventListener('click', deleteEventModal);
    document.getElementById('event-modal').addEventListener('click', e => {
        if (e.target.id === 'event-modal') closeEventModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !document.getElementById('event-modal').hidden) closeEventModal();
    });
}
