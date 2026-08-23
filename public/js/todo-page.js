// Cross-term to-do list.
//
// Extracted out of todo.html's inline <script>, which had grown to ~330 lines.
//
// IMPORTANT: this page is deliberately cross-term. Do NOT apply the termRange
// scoping that assignments-page.js uses -- todo.html loads all three term
// configs, so window.STUDENT_DATA ends up being whichever loaded last (Fall,
// whose range is Sept-Dec). Filtering by it would hide almost every task.

import { DataService } from '/js/data-service.js?v=13';
import {
    escapeHtml,
    formatDate,
    formatRelative,
    urgencyStatus,
    daysUntil,
    dueBucket,
    Prefs,
    toast
} from '/js/ui-utils.js?v=1';

const PREFS_KEY = 'ui_prefs_todo';

const DEFAULT_PREFS = {
    sort: 'date',
    groupBy: 'status',
    density: 'comfortable',
    status: 'all',
    collapsed: ['Completed']   // finished work starts folded away
};

const URGENCY_LABELS = {
    1: '1 - Trivial',
    2: '2 - Low',
    3: '3 - Normal',
    4: '4 - High',
    5: '5 - Critical'
};

/* ------------------------------------------------------------------ state */

let currentTodos = [];          // last snapshot from the real-time listener
let prefs = Prefs.get(PREFS_KEY, DEFAULT_PREFS);
let collapsedGroups = new Set(prefs.collapsed || []);
let selectedCourses = new Set();
let searchQuery = '';
// Mobile "Sort & filter" disclosure state -- module-level so it survives the
// control-bar rebuilds that filter changes and snapshot updates trigger.
let filtersOpen = false;
let editingId = null;           // row currently showing its inline edit form
let deleteConfirmId = null;     // row whose delete button is armed
let glowId = null;              // row that just got completed, for the one-shot glow

/* ------------------------------------------------------------------- init */

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    wireEvents();
    DataService.subscribeToTodos(snapshot => {
        currentTodos = snapshot;
        buildControls();
        render();
    });
});

function savePrefs() {
    Prefs.set(PREFS_KEY, { ...prefs, collapsed: [...collapsedGroups] });
}

/* ---------------------------------------------------------------- courses */

// Grouped by term so past/current/future courses aren't dumped into one flat
// list. Shared by the add form and every inline edit form.
function buildCourseOptgroupsHtml(selectedCode) {
    const groups = [
        { label: 'Winter 2026', courses: window.__coursesWinter2026 || [] },
        { label: 'Summer 2026', courses: window.__coursesSummer2026 || [] },
        { label: 'Fall 2026', courses: window.__coursesFall2026 || [] }
    ];
    return groups
        .filter(g => g.courses.length > 0)
        .map(g => {
            const opts = g.courses.map(c =>
                `<option value="${escapeHtml(c.code)}" ${c.code === selectedCode ? 'selected' : ''}>${escapeHtml(c.code)}</option>`
            ).join('');
            return `<optgroup label="${g.label}">${opts}</optgroup>`;
        }).join('');
}

function urgencyOptionsHtml(level) {
    return Object.entries(URGENCY_LABELS)
        .map(([v, label]) => `<option value="${v}" ${Number(v) === level ? 'selected' : ''}>${label}</option>`)
        .join('');
}

function loadCourses() {
    const select = document.getElementById('task-course');
    if (select) select.insertAdjacentHTML('beforeend', buildCourseOptgroupsHtml());
}

/* ------------------------------------------------------------------ model */

function statusOf(todo) {
    if (todo.completed) return { label: 'DONE', className: 'status-done', done: true };
    const urgent = urgencyStatus(todo.date);
    if (urgent) return { ...urgent, done: false };
    return { label: 'PENDING', className: 'status-pending', done: false };
}

function allCourseCodes() {
    return [...new Set(currentTodos.map(t => t.course).filter(Boolean))].sort();
}

/* ----------------------------------------------------------------- filter */

function visibleTodos() {
    const q = searchQuery.trim().toLowerCase();

    return currentTodos.filter(t => {
        if (selectedCourses.size > 0 && !selectedCourses.has(t.course)) return false;

        if (q && !`${t.title || ''} ${t.course || ''}`.toLowerCase().includes(q)) return false;

        const st = statusOf(t);
        if (prefs.status === 'active' && st.done) return false;
        if (prefs.status === 'done' && !st.done) return false;
        if (prefs.status === 'overdue' && st.label !== 'OVERDUE') return false;

        return true;
    });
}

/* ------------------------------------------------------------------- sort */

const SORTERS = {
    // Dated items first, soonest first, higher urgency breaking ties.
    date: (a, b) => {
        const hasA = !!a.date, hasB = !!b.date;
        if (hasA !== hasB) return hasA ? -1 : 1;
        if (hasA && a.date !== b.date) return a.date < b.date ? -1 : 1;
        return (b.urgency || 3) - (a.urgency || 3);
    },
    urgency: (a, b) => (b.urgency || 3) - (a.urgency || 3) || SORTERS.date(a, b),
    course: (a, b) => (a.course || '').localeCompare(b.course || '') || SORTERS.date(a, b),
    created: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
    title: (a, b) => (a.title || '').localeCompare(b.title || '')
};

/* --------------------------------------------------------------- grouping */

function groupTodos(todos) {
    if (prefs.groupBy === 'none') {
        return [{ key: 'all', label: '', items: todos }];
    }

    // The original two-section layout (Pending / Completed), kept as the default
    // so the page opens the way it always has.
    if (prefs.groupBy === 'status') {
        const pending = todos.filter(t => !t.completed);
        const completed = todos.filter(t => t.completed);
        const out = [];
        if (pending.length) out.push({ key: 'Pending', label: 'Pending Tasks', items: pending });
        if (completed.length) out.push({ key: 'Completed', label: 'Completed', items: completed });
        return out;
    }

    const keyFor = {
        course: t => ({ key: t.course || 'Personal', label: t.course || 'Personal' }),
        urgency: t => {
            const lvl = t.urgency || 3;
            // Prefixed so the map keys sort 5 -> 1 without a custom comparator.
            return { key: `${6 - lvl}-u${lvl}`, label: URGENCY_LABELS[lvl] || `Level ${lvl}` };
        },
        due: t => {
            const b = dueBucket(t.date || null);
            return { key: b.key, label: b.label };
        }
    }[prefs.groupBy];

    const map = new Map();
    todos.forEach(t => {
        const { key, label } = keyFor(t);
        if (!map.has(key)) map.set(key, { key, label, items: [] });
        map.get(key).items.push(t);
    });

    const groups = [...map.values()];
    if (prefs.groupBy === 'course') groups.sort((a, b) => a.label.localeCompare(b.label));
    else groups.sort((a, b) => a.key.localeCompare(b.key));
    return groups;
}

/* --------------------------------------------------------------- controls */

function buildControls() {
    const host = document.getElementById('todo-controls');
    if (!host) return;

    // Rebuilding the bar would steal focus mid-typing, so skip it while the
    // search box is active -- the snapshot listener can fire at any moment.
    if (document.activeElement && document.activeElement.id === 'todo-search') return;

    const courses = allCourseCodes();
    const chipsHtml = courses.length > 1 ? `
        <div class="list-chips">
            ${courses.map(c => `
                <button class="list-chip ${selectedCourses.has(c) ? 'active' : ''}"
                        data-action="course" data-course="${escapeHtml(c)}">${escapeHtml(c)}</button>
            `).join('')}
        </div>` : '';

    const anyDone = currentTodos.some(t => t.completed);
    const statusHtml = anyDone ? `
        <div class="list-segmented">
            ${[['all', 'All'], ['active', 'Active'], ['overdue', 'Overdue'], ['done', 'Done']]
            .map(([v, l]) => `<button data-action="status" data-value="${v}"
                     class="${prefs.status === v ? 'active' : ''}">${l}</button>`).join('')}
        </div>` : '';

    host.innerHTML = `
        <div class="list-search">
            <input type="search" id="todo-search" placeholder="Search tasks...  ( / )"
                   value="${escapeHtml(searchQuery)}" aria-label="Search tasks">
            <button class="list-search-clear" data-action="clear-search" title="Clear"
                    ${searchQuery ? '' : 'hidden'}>&times;</button>
        </div>

        ${statusHtml}

        <button type="button" class="list-filters-toggle ${filtersOpen ? 'is-open' : ''}"
                data-action="toggle-filters" aria-expanded="${filtersOpen}">
            <span class="list-filters-toggle-chevron">${filtersOpen ? '▾' : '▸'}</span>
            Sort &amp; filter${countSecondaryFilters() ? ` <span class="list-filters-count">${countSecondaryFilters()}</span>` : ''}
        </button>

        <div class="list-more ${filtersOpen ? 'is-open' : ''}">
            <div class="list-select-group">
                <label for="todo-sort">Sort</label>
                <select id="todo-sort" class="list-select" data-action="sort">
                    <option value="date" ${prefs.sort === 'date' ? 'selected' : ''}>Due date</option>
                    <option value="urgency" ${prefs.sort === 'urgency' ? 'selected' : ''}>Urgency</option>
                    <option value="course" ${prefs.sort === 'course' ? 'selected' : ''}>Course</option>
                    <option value="created" ${prefs.sort === 'created' ? 'selected' : ''}>Recently added</option>
                    <option value="title" ${prefs.sort === 'title' ? 'selected' : ''}>Title</option>
                </select>
            </div>

            <div class="list-select-group">
                <label for="todo-group">Group</label>
                <select id="todo-group" class="list-select" data-action="group">
                    <option value="status" ${prefs.groupBy === 'status' ? 'selected' : ''}>Status</option>
                    <option value="due" ${prefs.groupBy === 'due' ? 'selected' : ''}>Due</option>
                    <option value="course" ${prefs.groupBy === 'course' ? 'selected' : ''}>Course</option>
                    <option value="urgency" ${prefs.groupBy === 'urgency' ? 'selected' : ''}>Urgency</option>
                    <option value="none" ${prefs.groupBy === 'none' ? 'selected' : ''}>None</option>
                </select>
            </div>

            <div class="list-segmented">
                <button data-action="density" data-value="comfortable"
                        class="${prefs.density === 'comfortable' ? 'active' : ''}">Comfy</button>
                <button data-action="density" data-value="compact"
                        class="${prefs.density === 'compact' ? 'active' : ''}">Compact</button>
            </div>

            ${chipsHtml}
        </div>
    `;
}

// See assignments-page.js: badge on the collapsed toggle so an active course
// filter or non-default sort/grouping stays visible while the panel is shut.
function countSecondaryFilters() {
    let n = selectedCourses.size;
    if (prefs.sort !== DEFAULT_PREFS.sort) n += 1;
    if (prefs.groupBy !== DEFAULT_PREFS.groupBy) n += 1;
    return n;
}

function filtersActive() {
    return searchQuery.trim() !== '' || selectedCourses.size > 0 || prefs.status !== 'all';
}

function clearFilters() {
    searchQuery = '';
    selectedCourses.clear();
    prefs.status = 'all';
    savePrefs();
    buildControls();
    render();
}

/* ---------------------------------------------------------------- render */

function render() {
    document.body.className = `list-density-${prefs.density}`;

    const todos = visibleTodos().slice().sort(SORTERS[prefs.sort] || SORTERS.date);
    renderSummary();

    const container = document.getElementById('todo-container');

    if (todos.length === 0) {
        container.innerHTML = filtersActive()
            ? `<div class="list-empty">
                   <div class="list-empty-icon">∅</div>
                   <div class="list-empty-title">No tasks match your filters</div>
                   <div class="list-empty-hint">Try a different course, status, or search term.</div>
                   <button class="list-clear-filters" data-action="clear-filters">Clear filters</button>
               </div>`
            : `<div class="list-empty">
                   <div class="list-empty-icon">✓</div>
                   <div class="list-empty-title">Nothing on your plate</div>
                   <div class="list-empty-hint">Add your first task using the form above.</div>
               </div>`;
        return;
    }

    container.innerHTML = groupTodos(todos).map(group => {
        if (!group.label) return group.items.map(renderItem).join('');

        const done = group.items.filter(t => t.completed).length;
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
                    ${group.items.map(renderItem).join('')}
                </div>
            </div>`;
    }).join('');

    // The completion glow is a one-shot: paint it, then clear the flag so the
    // next render (the listener fires moments later) drops it again.
    if (glowId) {
        const row = container.querySelector(`.todo-item[data-id="${CSS.escape(glowId)}"]`);
        if (row) {
            row.classList.add('glow-success');
            setTimeout(() => row.classList.remove('glow-success'), 900);
        }
        glowId = null;
    }
}

function renderSummary() {
    const host = document.getElementById('todo-summary');
    if (!host) return;

    const active = currentTodos.filter(t => !t.completed);
    if (currentTodos.length === 0) {
        host.innerHTML = '';
        return;
    }

    const overdue = active.filter(t => statusOf(t).label === 'OVERDUE').length;
    const thisWeek = active.filter(t => {
        const d = daysUntil(t.date);
        return d !== null && d >= 0 && d <= 7;
    }).length;
    const done = currentTodos.filter(t => t.completed).length;

    host.innerHTML = `
        <div class="list-summary">
            <div class="list-summary-main">
                <span class="list-summary-label">Open tasks</span>
                <span class="list-summary-value">${active.length}</span>
            </div>
            <div class="list-summary-stats">
                <div class="list-summary-stat ${overdue > 0 ? 'is-danger' : ''}">
                    <span class="list-summary-stat-value">${overdue}</span>
                    <span class="list-summary-stat-label">Overdue</span>
                </div>
                <div class="list-summary-stat ${thisWeek > 0 ? 'is-warning' : ''}">
                    <span class="list-summary-stat-value">${thisWeek}</span>
                    <span class="list-summary-stat-label">This week</span>
                </div>
                <div class="list-summary-stat is-success">
                    <span class="list-summary-stat-value">${done}</span>
                    <span class="list-summary-stat-label">Done</span>
                </div>
            </div>
        </div>`;
}

function renderItem(t) {
    if (t.id === editingId) return renderEditForm(t);

    const level = t.urgency || 3;
    const status = statusOf(t);

    const urgencyBadge = level >= 4
        ? `<span class="todo-urgency-badge level-${level}">${level === 5 ? 'Critical' : 'High'}</span>` : '';

    const statusBadge = (!t.completed && status.label !== 'PENDING')
        ? `<span class="assign-status ${status.className}">${status.label}</span>` : '';

    const due = t.date
        ? `<span class="todo-due">${formatDate(t.date)}${t.completed ? '' : ` · ${formatRelative(t.date)}`}</span>`
        : `<span class="todo-due">Flexible</span>`;

    const confirming = deleteConfirmId === t.id;
    const deleteBtn = confirming
        ? `<button class="todo-delete-btn confirming" data-action="delete" data-id="${escapeHtml(t.id)}">Confirm</button>`
        : `<button class="todo-delete-btn" data-action="delete" data-id="${escapeHtml(t.id)}" title="Delete">×</button>`;

    const isPersonal = (t.course || 'Personal') === 'Personal';

    return `
        <div class="todo-item urgency-${level} ${t.completed ? 'is-done' : ''} ${status.label === 'OVERDUE' ? 'is-overdue' : ''}"
             data-id="${escapeHtml(t.id)}">
            <div class="todo-check ${t.completed ? 'checked' : ''}" data-action="toggle" data-id="${escapeHtml(t.id)}"
                 role="checkbox" aria-checked="${t.completed}" tabindex="0"></div>
            <div class="todo-content">
                <span class="todo-title">
                    ${urgencyBadge}
                    ${escapeHtml(t.title)}
                    ${statusBadge}
                </span>
                <div class="todo-meta">
                    <span class="todo-tag ${isPersonal ? 'is-personal' : ''}">${escapeHtml(t.course || 'Personal')}</span>
                    ${due}
                </div>
            </div>
            <div class="todo-actions">
                <button class="todo-edit-btn" data-action="edit" data-id="${escapeHtml(t.id)}" title="Edit">✎</button>
                ${deleteBtn}
            </div>
        </div>`;
}

function renderEditForm(t) {
    const level = t.urgency || 3;
    const id = escapeHtml(t.id);
    return `
        <div class="todo-item urgency-${level}" data-id="${id}">
            <div class="todo-edit-form">
                <input type="text" id="edit-title-${id}" class="input-field" value="${escapeHtml(t.title)}">
                <select id="edit-course-${id}" class="input-field">
                    <option value="Personal" ${t.course === 'Personal' ? 'selected' : ''}>Personal</option>
                    ${buildCourseOptgroupsHtml(t.course)}
                </select>
                <select id="edit-urgency-${id}" class="input-field">${urgencyOptionsHtml(level)}</select>
                <input type="date" id="edit-date-${id}" class="input-field" value="${escapeHtml(t.date || '')}">
                <button class="todo-edit-save" data-action="save-edit" data-id="${id}">Save</button>
                <button class="todo-edit-cancel" data-action="cancel-edit">Cancel</button>
            </div>
        </div>`;
}

/* ---------------------------------------------------------------- actions */

async function addTodo() {
    const titleInput = document.getElementById('task-title');
    const title = titleInput.value.trim();
    if (!title) {
        titleInput.focus();
        return;
    }

    const newTodo = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        course: document.getElementById('task-course').value,
        urgency: parseInt(document.getElementById('task-urgency').value, 10) || 3,
        date: document.getElementById('task-date').value || '',
        completed: false,
        createdAt: new Date().toISOString()
    };

    titleInput.value = '';
    titleInput.focus();

    const ok = await DataService.saveTodoItem(newTodo);
    if (ok === false) toast("Couldn't save that task", 'error');
}

async function toggleTodo(id) {
    const todo = currentTodos.find(t => t.id === id);
    if (!todo) return;

    const wasCompleted = !!todo.completed;
    const updated = { ...todo, completed: !wasCompleted };

    if (updated.completed) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        glowId = id;
    }

    // Optimistic: repaint from the local copy, then let the snapshot listener
    // confirm. Waiting on the round trip made the checkbox feel laggy.
    currentTodos = currentTodos.map(t => t.id === id ? updated : t);
    render();

    const ok = await DataService.saveTodoItem(updated);
    if (ok === false) {
        currentTodos = currentTodos.map(t => t.id === id ? todo : t);
        render();
        toast("Couldn't save that change", 'error');
    }
}

// First click arms a 3s "Confirm" state on that button; a second click within
// the window deletes. Auto-reverts so a misclick doesn't leave the row stuck.
function handleDeleteClick(id) {
    if (deleteConfirmId === id) {
        deleteConfirmId = null;
        deleteTodo(id);
        return;
    }
    deleteConfirmId = id;
    render();
    setTimeout(() => {
        if (deleteConfirmId === id) {
            deleteConfirmId = null;
            render();
        }
    }, 3000);
}

async function deleteTodo(id) {
    const ok = await DataService.deleteTodoItem(id);
    if (ok === false) toast("Couldn't delete that task", 'error');
}

async function saveEdit(id) {
    const todo = currentTodos.find(t => t.id === id);
    if (!todo) return;

    const title = document.getElementById(`edit-title-${id}`).value.trim();
    if (!title) return;

    const updated = {
        ...todo,
        title,
        course: document.getElementById(`edit-course-${id}`).value,
        urgency: parseInt(document.getElementById(`edit-urgency-${id}`).value, 10) || 3,
        date: document.getElementById(`edit-date-${id}`).value || ''
    };

    editingId = null;
    currentTodos = currentTodos.map(t => t.id === id ? updated : t);
    render();

    const ok = await DataService.saveTodoItem(updated);
    if (ok === false) toast("Couldn't save your changes", 'error');
}

/* ----------------------------------------------------------------- events */

function wireEvents() {
    document.getElementById('add-btn').addEventListener('click', addTodo);

    // The add form previously had no submit path at all -- Enter did nothing.
    document.querySelector('.todo-input-container').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTodo();
        }
    });

    const controls = document.getElementById('todo-controls');
    controls.addEventListener('click', onControlClick);
    controls.addEventListener('change', onControlChange);
    controls.addEventListener('input', onSearchInput);

    document.getElementById('todo-container').addEventListener('click', onListClick);
    document.getElementById('todo-container').addEventListener('keydown', e => {
        // The check circle is a div, so it needs its own keyboard activation.
        if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.action === 'toggle') {
            e.preventDefault();
            toggleTodo(e.target.dataset.id);
        }
        if (e.key === 'Enter' && e.target.closest('.todo-edit-form')) {
            const row = e.target.closest('.todo-item');
            if (row) saveEdit(row.dataset.id);
        }
    });

    document.addEventListener('keydown', e => {
        const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
        if (e.key === '/' && !typing) {
            e.preventDefault();
            document.getElementById('todo-search')?.focus();
        }
        if (e.key === 'Escape' && editingId) {
            editingId = null;
            render();
        }
    });
}

function onSearchInput(e) {
    if (e.target.id !== 'todo-search') return;
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
        const input = document.getElementById('todo-search');
        if (input) input.value = '';
        btn.hidden = true;
        render();
        return;
    }

    if (action === 'toggle-filters') {
        filtersOpen = !filtersOpen;
        // Toggle in place; a rebuild here would drop search focus.
        btn.classList.toggle('is-open', filtersOpen);
        btn.setAttribute('aria-expanded', String(filtersOpen));
        const chevron = btn.querySelector('.list-filters-toggle-chevron');
        if (chevron) chevron.textContent = filtersOpen ? '▾' : '▸';
        const panel = document.querySelector('#todo-controls .list-more');
        if (panel) panel.classList.toggle('is-open', filtersOpen);
        return;
    }

    if (action === 'status' || action === 'density') {
        prefs[action] = btn.dataset.value;
        savePrefs();
        // Repaint just this segment group; rebuilding the bar would drop focus.
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
        render();
    }
}

function onListClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const { action, id } = target.dataset;

    if (action === 'toggle') toggleTodo(id);
    else if (action === 'edit') { editingId = id; render(); }
    else if (action === 'cancel-edit') { editingId = null; render(); }
    else if (action === 'save-edit') saveEdit(id);
    else if (action === 'delete') handleDeleteClick(id);
    else if (action === 'clear-filters') clearFilters();
    else if (action === 'toggle-group') {
        const key = target.dataset.key;
        if (collapsedGroups.has(key)) collapsedGroups.delete(key);
        else collapsedGroups.add(key);
        savePrefs();
        render();
    }
}
