// Data is now loaded from student-config.js
const data = STUDENT_DATA;

function renderPlanning() {
    const container = document.getElementById('planning-list');
    if (!container) return;
    container.innerHTML = data.planning.map(item => `
        <a href="${item.link}" target="${item.action === 'PDF' ? '_blank' : '_self'}" class="link-item planning-item">
            <span class="item-name">${item.name}</span>
            <span class="item-action">${item.action}</span>
        </a>
    `).join('');
}

// Calendar State
let currentDate = new Date();
let selectedDate = null;

function renderGlobalSchedule() {
    const listContainer = document.getElementById('global-schedule');
    if (listContainer) {
        // Render List View
        const sorted = [...data.assignments].sort((a, b) => {
            // Handle TBD dates for sorting: place them at the end
            if (a.date === '2026-04-30' && a.category === 'FINAL') return 1;
            if (b.date === '2026-04-30' && b.category === 'FINAL') return -1;
            return new Date(a.date) - new Date(b.date);
        });
        const grouped = sorted.reduce((acc, curr) => {
            // Handle TBD dates for grouping
            if (curr.date === '2026-04-30' && curr.category === 'FINAL') {
                if (!acc['To Be Scheduled']) acc['To Be Scheduled'] = [];
                acc['To Be Scheduled'].push(curr);
                return acc;
            }

            const date = new Date(curr.date + 'T' + curr.time);
            const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!acc[month]) acc[month] = [];
            acc[month].push(curr);
            return acc;
        }, {});

        let html = '';
        for (const [month, items] of Object.entries(grouped)) {
            html += `
                <div class="month-group">
                    <h3 class="month-label">${month}</h3>
                    <div class="list-grid">
                        ${items.map(item => createAssignmentCard(item)).join('')}
                    </div>
                </div>
            `;
        }

        if (Object.keys(grouped).length === 0) {
            html = '<p class="subtitle">No upcoming assignments.</p>';
        }

        listContainer.innerHTML = html;
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
        const assignments = data.assignments.filter(a => a.date === dateStr);

        // Reading Week Check
        const isReadingWeek = currentDayObj >= rwStart && currentDayObj <= rwEnd;

        let classes = 'day-cell';
        if (isReadingWeek) classes += ' reading-week';

        let dot = '';

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            classes += ' today';
        }

        // Check if any assignment is stored as DONE locally
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

        html += `<div class="${classes}" onclick="selectDate('${dateStr}')">${i}${dot}${weekLabelHtml}</div>`;
    }

    // Next Month Days (to fill grid)
    const renderDays = firstDayIndex + daysInMonth;
    const nextDays = 42 - renderDays; // 6 rows * 7 cols = 42 cells standard

    for (let i = 1; i <= nextDays; i++) {
        html += `<div class="day-cell other-month">${i}</div>`;
    }

    calendarGrid.innerHTML = html;
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    renderCalendar(); // Re-render to update selected style

    const detailsContainer = document.getElementById('selected-day-details');
    const tasks = data.assignments.filter(a => a.date === dateStr);

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
    renderPlanning();
    renderGlobalSchedule();
    renderCourses();
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
    const items = data.assignments.filter(a => a.course === code);
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

    // Adjust for Reading Week gap (which is essentially a skipped week number in terms of "Instructional Weeks" usually,
    // but user said "Feb 23 would start week 7".
    // Week 1: Jan 5
    // Week 2: Jan 12
    // Week 3: Jan 19
    // Week 4: Jan 26
    // Week 5: Feb 2
    // Week 6: Feb 9
    // RW: Feb 16 (Week 7 calendar-wise, but is RW)
    // Week 7 Instruction: Feb 23 (Week 8 calendar-wise)
    // So if date is after RW, we subtract 1 from the raw week count effectively?
    // Wait, Jan 5 (W1), Jan 12 (W2)... Feb 9 (W6).
    // Feb 16 is starts RW.
    // Feb 23 starts W7.
    // My calculation:
    // Feb 23 is 49 days after Jan 5. 49/7 = 7. floor(7)+1 = 8.
    // So raw calculation gives Week 8. User wants Week 7.
    // So yes, subtract 1 if > Feb 22.

    if (d > rwEnd) {
        weekNum -= 1;
    }

    return `Week ${weekNum}`;
}

function createAssignmentCard(item) {
    const dateObj = new Date(item.date + 'T' + item.time);
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    const weekLabel = getSemesterWeek(item.date);

    // Status Color Logic
    let status = item.status;
    const localStatus = localStorage.getItem(`status_${item.id}`);
    if (localStatus) status = localStatus;

    let statusClass = "status-pending";
    if (status === 'DONE') statusClass = "status-done";
    if (status === 'UPCOMING') statusClass = "status-upcoming";

    // Category Color Logic
    const categoryClass = `category-${item.category.toLowerCase()}`;

    // Only show status if it's NOT Pending/Upcoming (e.g. show DONE)
    const showStatus = status !== 'PENDING' && status !== 'UPCOMING';
    const statusHtml = showStatus ? `<span class="assign-status ${statusClass}">${status}</span>` : '';

    return `
        <a href="details.html?id=${item.id}" class="assignment-item">
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
                    <span class="assign-title">${item.title}</span>
                </div>
            </div>
            <div class="assign-right">
                <span class="assign-time">${item.time}</span>
                ${statusHtml}
            </div>
        </a>
    `;
}

function renderCourses() {
    const container = document.getElementById('course-list');
    if (!container) return;
    container.innerHTML = data.courses.map(course => createCourseCard(course)).join('');
}

function createCourseCard(course) {
    const solutionsButton = course.solutions ? `
        <a href="${course.solutions}" target="_blank" class="action-btn secondary">
            <span>Solutions</span>
        </a>
    ` : '';

    // Construct Syllabus URL (assuming pattern matches file existence: syllabus/code-grading.md)
    const cleanCode = course.code.toLowerCase().replace(/\s+/g, '');
    const syllabusUrl = `syllabus/${cleanCode}-grading.md`;

    // New Buttons
    // Drive SVG Icon (Simplified)
    const driveIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.01 1.5c-0.615 0-1.192 0.32-1.503 0.844L2.348 16.32c-0.315 0.53-0.318 1.173-0.007 1.706C2.65 18.56 3.23 18.88 3.845 18.88h16.307c0.615 0 1.193-0.32 1.505-0.846l-0.007-0.012 0.006 0.012c0.31-0.533 0.307-1.176-0.007-1.708L13.513 2.344C13.202 1.82 12.625 1.5 12.01 1.5zm0 2.25L19.14 16.63H4.88L12.01 3.75z" fill="gray"/><path d="M7.76 17.5h8.48l2.91 5H4.85l2.91-5z" fill="currentColor" opacity="0.6"/><path d="M16.24 17.5l-4.24-7.35-4.24 7.35H4.85l7.15-12.39 7.15 12.39h-2.91z" opacity="0.4"/></svg>`;
    // Actually, let's use a simpler text/icon combo for Drive or just the Google Drive Official triangle if possible.
    // Using a simple unicode or text fallback if SVG is too messy, but let's try a clean triangular SVG path.
    const driveSvg = `<svg width="15" height="13" viewBox="0 0 87 78" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#3D8AFF"/>
        <path d="M43.65 25l-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00AC47"/>
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#EA4335"/>
        <path d="M43.65 25l13.75 23.8-13.75 23.8-13.75-23.8z" fill="#185ABC"/>
        <path d="M59.8 53.2l-16.15 27.95c1.4.05 2.8-.25 4.15-.95l24.6-14.2c1.35-.8 2.5-1.9 3.3-3.3l-13.75-23.8z" fill="#8DA6FA"/>
        <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27.95c1.55.05 3.1-.35 4.5-1.2l12.3-7.1c1.35-.8 2.5-1.9 3.3-3.3.4-.65.7-1.35.95-2.05.05-.3.05-.55.05-.85z" fill="#FFBA00"/>
    </svg>`;

    const driveBtn = course.drive ? `
        <a href="${course.drive}" target="_blank" class="action-btn secondary" title="Google Drive">
            <span style="display: flex; align-items: center; justify-content: center;">${driveSvg}</span>
        </a>
    ` : '';

    // OnQ and NotebookLM
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

    return `
        <div class="course-card">
            <div class="course-header">
                <span class="course-code">${course.code}</span>
                <span class="course-title">${course.name}</span>
            </div>
            <div class="course-actions">
                <a href="${course.notes}" target="_blank" class="action-btn primary">
                    <span>Notes</span>
                </a>
                <a href="${syllabusUrl}" target="_blank" class="action-btn secondary">
                    <span>Syllabus</span>
                </a>
                
                <a href="${course.textbook}" target="_blank" class="action-btn secondary">
                    <span>Textbook</span>
                </a>
                ${solutionsButton}
                
                <a href="${course.assignments}" class="action-btn secondary">
                    <span>Assignments</span>
                </a>
                <a href="${course.assignments}&type=homework" class="action-btn secondary">
                    <span>Homework</span>
                </a>

                <!-- New Buttons -->
                ${onqBtn}
                ${notebookBtn}
                ${driveBtn}
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    renderPlanning();
    renderGlobalSchedule();
    renderCourses();
});
