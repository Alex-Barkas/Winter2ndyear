// Data is now loaded via DataService (Firebase)
import { DataService } from "./data-service.js";

// Make seedDB available globally for the console migration
window.seedDB = () => DataService.seedDatabase(STUDENT_DATA);

// State for data
let appData = {
    assignments: [],
    courses: [],
};

// Global handlers for Add/Delete
window.openAddModal = function () {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('new-date').value = today;
    document.getElementById('new-time').value = "23:59";
    document.getElementById('add-modal').style.display = 'grid';
}

window.closeAddModal = function () {
    document.getElementById('add-modal').style.display = 'none';
    // Clear inputs
    document.getElementById('new-title').value = '';
    document.getElementById('new-course').value = '';
}

window.saveNewAssignment = async function () {
    const title = document.getElementById('new-title').value.trim();
    const course = document.getElementById('new-course').value.trim();
    const date = document.getElementById('new-date').value;
    const time = document.getElementById('new-time').value;
    const category = document.getElementById('new-category').value;

    if (!title || !course || !date) {
        alert("Please fill in at least Title, Course, and Date.");
        return;
    }

    const newItem = {
        id: 'manual_' + Date.now(),
        title,
        course,
        date,
        time,
        category,
        status: 'PENDING',
        details: { type: 'text', content: 'Manually added assignment.' },
        score: null
    };

    await DataService.addAssignment(newItem);
    window.closeAddModal();
    loadData(); // Reload to show new item
}

window.deleteAssignment = async function (id) {
    if (confirm("Are you sure you want to delete this assignment?")) {
        const success = await DataService.deleteAssignment(id);
        if (success) {
            loadData();
        } else {
            alert("Failed to delete item.");
        }
    }
}

async function loadData() {
    // Show loading state if needed
    try {
        const [assignments, courses] = await Promise.all([
            DataService.getAllAssignments(),
            DataService.getCourses()
        ]);

        appData.assignments = assignments;
        appData.courses = courses;

        renderGlobalSchedule();
        renderCourses();
    } catch (e) {
        console.error("Failed to load data", e);
    }
}


// Calendar State
let currentDate = new Date();
let selectedDate = null;

function renderGlobalSchedule() {
    const listContainer = document.getElementById('global-schedule');
    if (listContainer) {
        // Filter and Sort
        const active = appData.assignments.filter(a => a.status !== 'DONE');
        const done = appData.assignments.filter(a => a.status === 'DONE');

        const sortByDate = (a, b) => {
            // Handle TBD/Finals Logic
            if (a.date === '2026-04-30' && a.category === 'FINAL') return 1;
            if (b.date === '2026-04-30' && b.category === 'FINAL') return -1;
            return new Date(a.date) - new Date(b.date); // Chronological
        };

        active.sort(sortByDate);
        done.sort(sortByDate);

        const sorted = [...active, ...done];

        if (sorted.length === 0) {
            listContainer.innerHTML = '<p class="subtitle">No upcoming assignments.</p>';
            return;
        }

        const render = () => {
            const html = `
                <div class="list-grid">
                    ${sorted.map(item => createAssignmentCard(item)).join('')}
                </div>
            `;
            listContainer.innerHTML = html;
        };

        // Use View Transition API if available for smooth reordering
        if (document.startViewTransition) {
            document.startViewTransition(render);
        } else {
            render();
        }
    }
}

// Calendar Logic
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-days');
    const mothLabel = document.getElementById('current-month-year');

    if (!calendarGrid || !mothLabel) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update Header
    mothLabel.innerText = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Days calculation
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Reading Week Setup (Feb 13 - Feb 22, 2026) -- Highlighting range
    const rwStart = new Date('2026-02-13T00:00:00');
    const rwEnd = new Date('2026-02-22T23:59:59');

    let html = '';

    // Previous Month Days
    for (let i = firstDayIndex; i > 0; i--) {
        html += `<div class="day-cell other-month">${prevMonthDays - i + 1}</div>`;
    }

    // Current Month Days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const currentDayObj = new Date(year, month, i);
        const assignments = appData.assignments.filter(a => a.date === dateStr);

        // Reading Week Check
        const isReadingWeek = currentDayObj >= rwStart && currentDayObj <= rwEnd;

        let classes = 'day-cell';
        if (isReadingWeek) classes += ' reading-week';

        let dot = '';

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            classes += ' today';
        }

        // Check if any assignment is stored as DONE locally
        // NOTE: In the new DB version, status comes directly from 'item.status' in the DB
        let hasEvent = false;
        if (assignments.length > 0) {
            hasEvent = true;
            classes += ' has-event';
            dot = '<div class="event-dot"></div>';
        }

        if (selectedDate === dateStr) {
            classes += ' selected';
        }

        // Week Label Logic (Show on Mondays or the 1st of the month)
        let weekLabelHtml = '';
        if (currentDayObj.getDay() === 1 || i === 1) { // 1 is Monday
            const wLabel = getSemesterWeek(dateStr);
            // Only show "Week X", ignore "Pre-Term" or "Reading Week" to not clutter, 
            // OR show all? User want "week visual". Let's show abbreviated.
            let shortLabel = wLabel;
            if (wLabel.startsWith("Week ")) shortLabel = "W" + wLabel.split(' ')[1];
            if (wLabel === "Reading Week") shortLabel = "RW";
            if (wLabel === "Pre-Term") shortLabel = "";

            if (shortLabel) {
                weekLabelHtml = `<span class="cal-week-label">${shortLabel}</span>`;
            }
        }

        html += `<div class="${classes}" onclick="window.selectDate('${dateStr}')">${i}${dot}${weekLabelHtml}</div>`;
    }

    // Next Month Days (to fill grid)
    const renderDays = firstDayIndex + daysInMonth;
    const nextDays = 42 - renderDays; // 6 rows * 7 cols = 42 cells standard

    for (let i = 1; i <= nextDays; i++) {
        html += `<div class="day-cell other-month">${i}</div>`;
    }

    calendarGrid.innerHTML = html;
}

// Expose to window for HTML onclick
window.selectDate = function (dateStr) {
    selectedDate = dateStr;
    renderCalendar(); // Re-render to update selected style

    const detailsContainer = document.getElementById('selected-day-details');
    const tasks = appData.assignments.filter(a => a.date === dateStr);

    const dateObj = new Date(dateStr + 'T12:00:00'); // Midday to avoid boundary issues
    const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    console.log(`Selected: ${dateStr}, Tasks: ${tasks.length}`);

    if (tasks.length > 0) {
        let html = `<span class="selected-date-label">${displayDate}</span><div class="list-grid">`;
        html += tasks.map(item => createAssignmentCard(item)).join('');
        html += '</div>';
        detailsContainer.innerHTML = html;
        detailsContainer.classList.add('active');
    } else {
        detailsContainer.classList.remove('active');
        detailsContainer.innerHTML = '';
    }
}


function setupCalendarControls() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // View Switcher
    const listBtn = document.getElementById('view-list-btn');
    const calBtn = document.getElementById('view-calendar-btn');
    const listView = document.getElementById('global-schedule');
    const calView = document.getElementById('calendar-view');

    if (listBtn && calBtn) {
        listBtn.addEventListener('click', () => {
            listBtn.classList.add('active');
            calBtn.classList.remove('active');
            listView.classList.remove('hidden');
            calView.classList.add('hidden');
        });

        calBtn.addEventListener('click', () => {
            calBtn.classList.add('active');
            listBtn.classList.remove('active');
            calView.classList.remove('hidden');
            listView.classList.add('hidden');
            renderCalendar(); // Render when shown
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadData(); // Start loading data
    setupCalendarControls();
});

function renderAssignments(items) {
    const container = document.getElementById('assignment-list');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p class="subtitle" style="text-align:center; padding: 2rem;">No assignments found.</p>`;
        return;
    }

    container.innerHTML = items.map(item => createAssignmentCard(item)).join('');
}

function filterAssignments(courseCode) {
    // Decode if needed (e.g. %20 -> space)
    const code = decodeURIComponent(courseCode);

    // Update Header
    document.getElementById('course-title').innerText = `${code} Assignments`;
    document.getElementById('course-subtitle').innerText = `Track deadlines for ${code}`;

    // Filter
    const items = appData.assignments.filter(a => a.course === code);
    renderAssignments(items);
}

// Helper to determine Semester Week
function getSemesterWeek(dateString) {
    const d = new Date(dateString);
    // Week 1 starts Jan 5, 2026
    const startOfSem = new Date('2026-01-05');

    // Reading Week: Feb 16 - Feb 22
    const rwStart = new Date('2026-02-16');
    const rwEnd = new Date('2026-02-22');

    if (d >= rwStart && d <= rwEnd) return "Reading Week";

    const diffTime = d - startOfSem;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If before semester
    if (diffDays < 0) return "Pre-Term";

    let weekNum = Math.floor(diffDays / 7) + 1;

    if (d > rwEnd) {
        weekNum -= 1;
    }

    return `Week ${weekNum}`;
}

function createAssignmentCard(item) {
    const dateObj = new Date(item.date + 'T' + item.time);
    // User requested Month in front: "Jan 14 Wed"
    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const day = `${monthDay} ${weekday}`;
    const weekLabel = getSemesterWeek(item.date);

    // Status is now directly from DB
    let status = item.status || 'PENDING';

    // Date Logic
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const isToday = item.date === todayStr;

    // Overdue Check
    if (status !== 'DONE' && item.date < todayStr && item.date !== 'TBD' && item.category !== 'FINAL') {
        status = 'OVERDUE';
    }

    let statusClass = "status-pending";
    if (status === 'DONE') statusClass = "status-done";
    if (status === 'UPCOMING') statusClass = "status-upcoming";
    if (status === 'OVERDUE') statusClass = "status-overdue";

    // Category Color Logic
    const categoryClass = `category-${item.category.toLowerCase()}`;

    // Status Badge (only if not done/pending or if overdue)
    const showStatus = status === 'OVERDUE';
    const statusHtml = showStatus ? `<span class="assign-status ${statusClass}">${status}</span>` : '';

    const todayBanner = isToday && status !== 'DONE' ? `<div class="today-banner">TODAY</div>` : '';

    const isDone = status === 'DONE';

    return `
        <div class="assignment-item ${isToday ? 'highlight-today' : ''}" style="position: relative; view-transition-name: assign-${item.id.replace(/[^a-zA-Z0-9-_]/g, '')};">
            ${todayBanner}
            <a href="details.html?id=${item.id}" class="assign-link-wrapper">
                <div class="assign-left">
                    <span class="assign-date">
                        ${day}
                        <div style="font-size: 0.65rem; opacity: 0.6; margin-top: 2px;">${weekLabel}</div>
                    </span>
                    <div class="assign-details">
                        <div class="assign-meta">
                            <span class="assign-course">${item.course}</span>
                            <span class="assign-category ${categoryClass}">${item.category}</span>
                        </div>
                        <span class="assign-title ${isDone ? 'done-text' : ''}">${item.title}</span>
                    </div>
                </div>
            </a>
            
            <div class="assign-right">
                <span class="assign-time">${item.time}</span>
                ${statusHtml}
                
                <!-- Quick Status Toggle -->
                <button onclick="window.toggleStatus('${item.id}', '${status}')" class="status-toggle-btn ${isDone ? 'checked' : ''}" title="${isDone ? 'Mark as Pending' : 'Mark as Done'}">
                   ${isDone ? '✓' : ''}
                </button>

                <button onclick="window.deleteAssignment('${item.id}')" class="delete-btn" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

// Add global toggle function
window.toggleStatus = async function (id, currentStatus) {
    const newStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE';
    await DataService.updateAssignmentStatus(id, newStatus);
    loadData(); // Reload to reflect changes
}

function renderCourses() {
    const container = document.getElementById('course-list');
    if (!container) return;
    container.innerHTML = appData.courses.map(course => createCourseCard(course)).join('');
}

function createCourseCard(course) {
    const solutionsButton = course.solutions ? `
        <a href="${course.solutions}" target="_blank" class="action-btn secondary">
            <span>Solutions</span>
        </a>
    ` : '';

    // Construct Syllabus URL
    const cleanCode = course.code.toLowerCase().replace(/\s+/g, '');
    const syllabusUrl = `syllabus/${cleanCode}-grading.md`;

    // Icons
    const driveIcon = `<svg width="20" height="20" viewBox="0 0 87 78" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#3D8AFF"/>
        <path d="M43.65 25l-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00AC47"/>
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#EA4335"/>
        <path d="M43.65 25l13.75 23.8-13.75 23.8-13.75-23.8z" fill="#185ABC"/>
        <path d="M59.8 53.2l-16.15 27.95c1.4.05 2.8-.25 4.15-.95l24.6-14.2c1.35-.8 2.5-1.9 3.3-3.3l-13.75-23.8z" fill="#8DA6FA"/>
        <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27.95c1.55.05 3.1-.35 4.5-1.2l12.3-7.1c1.35-.8 2.5-1.9 3.3-3.3.4-.65.7-1.35.95-2.05.05-.3.05-.55.05-.85z" fill="#FFBA00"/>
    </svg>`;

    // Buttons
    const driveBtn = course.drive ? `
        <a href="${course.drive}" target="_blank" class="action-btn secondary" title="Google Drive">
            <span style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                ${driveIcon} Drive
            </span>
        </a>
    ` : '';

    const onqBtn = course.onq ? `
        <a href="${course.onq}" target="_blank" class="action-btn secondary">
            <span>OnQ</span>
        </a>
    ` : '';

    const notebookBtn = course.notebooklm ? `
        <a href="${course.notebooklm}" target="_blank" class="action-btn secondary">
            <span>NotebookLM</span>
        </a>
    ` : '';

    const textbookBtn = course.textbook ? `
        <a href="${course.textbook}" target="_blank" class="action-btn secondary">
            <span>Textbook</span>
        </a>
    ` : '';

    // Background Image Style
    const bgStyle = course.image ?
        `background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url('${course.image}'); background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);`
        : '';

    return `
        <div class="course-card" style="${bgStyle}">
            <div class="course-header">
                <span class="course-code" style="${course.image ? 'color: rgba(255,255,255,0.7); text-shadow: 0 1px 2px rgba(0,0,0,0.5);' : ''}">${course.code}</span>
                <span class="course-title" style="${course.image ? 'text-shadow: 0 2px 4px rgba(0,0,0,0.8);' : ''}">${course.name}</span>
            </div>
            <div class="course-actions">
                <a href="${course.notes}" target="_blank" class="action-btn secondary" style="${course.image ? 'background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border-color: rgba(255,255,255,0.15);' : ''}">
                    <span>Notes</span>
                </a>
                <a href="${course.assignments}" class="action-btn secondary" style="${course.image ? 'background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border-color: rgba(255,255,255,0.15);' : ''}">
                    <span>Assignments</span>
                </a>
                <a href="grades.html?course=${course.code}" class="action-btn secondary" style="${course.image ? 'background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border-color: rgba(255,255,255,0.15);' : ''}">
                    <span>Grades</span>
                </a>
                <a href="${syllabusUrl}" target="_blank" class="action-btn secondary" style="${course.image ? 'background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border-color: rgba(255,255,255,0.15);' : ''}">
                    <span>Syllabus</span>
                </a>
                
                ${course.textbook ? `<a href="${course.textbook}" target="_blank" class="action-btn secondary" style="${course.image ? 'background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border-color: rgba(255,255,255,0.15);' : ''}"><span>Textbook</span></a>` : ''}
                
                ${course.solutions ? `<a href="${course.solutions}" target="_blank" class="action-btn secondary" style="${course.image ? 'background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border-color: rgba(255,255,255,0.15);' : ''}"><span>Solutions</span></a>` : ''}

                ${onqBtn}
                ${notebookBtn}
                ${driveBtn}
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    renderGlobalSchedule();
    renderCourses();

    // View Switcher Logic
    const listBtn = document.getElementById('view-list-btn');
    const calBtn = document.getElementById('view-calendar-btn');
    const listView = document.getElementById('global-schedule');
    const calView = document.getElementById('calendar-view');

    if (listBtn && calBtn && listView && calView) {
        listBtn.addEventListener('click', () => {
            listBtn.classList.add('active');
            calBtn.classList.remove('active');
            listView.classList.remove('hidden');
            calView.classList.add('hidden');
        });

        calBtn.addEventListener('click', () => {
            calBtn.classList.add('active');
            listBtn.classList.remove('active');
            calView.classList.remove('hidden');
            listView.classList.add('hidden');
            renderCalendar(); // Render on show
        });
    }

    // Calendar Navigation
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
});
