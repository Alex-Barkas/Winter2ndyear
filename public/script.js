const data = {
    planning: [
        {
            name: "Weekly Schedule",
            link: "schedule/schedule.pdf",
            action: "PDF"
        },
        {
            name: "Upcoming Dates",
            link: "#",
            action: "VIEW"
        },
        {
            name: "Grade Dashboard",
            link: "grades.html",
            action: "VIEW"
        }
    ],
    gradingSchemes: {
        "MTHE 281": {
            type: "max_option", // Logic for max of two options
            options: [
                {
                    name: "Standard",
                    weights: { "HOMEWORK": 10, "MIDTERM": 50, "FINAL": 40 } // Simplified for aggregation
                },
                {
                    name: "Exam Bias",
                    weights: { "HOMEWORK": 10, "MIDTERM": 40, "FINAL": 50 } // Logic needed for split midterms
                }
            ],
            // For simple tracking MVP, we'll use a unified input and calculate dynamically
            components: [
                { name: "Homework", weight: 10, count: 10 },
                { name: "Midterm 1", weight: 25, count: 1 },
                { name: "Midterm 2", weight: 25, count: 1 },
                { name: "Final Exam", weight: 40, count: 1 }
            ]
        },
        "ENPH 239": {
            components: [
                { name: "Math Diagnostics", weight: 5, count: 1 },
                { name: "Weekly Quizzes", weight: 15, count: 12 },
                { name: "Assignments", weight: 40, count: 3 },
                { name: "Final Exam", weight: 40, count: 1 }
            ]
        },
        "MTHE 212": {
            components: [
                { name: "Quizzes", weight: 40, count: 5, dropLowest: 1 },
                { name: "Final Exam", weight: 60, count: 1 }
            ]
        },
        "CMPE 212": {
            components: [
                { name: "Lab 1", weight: 5 },
                { name: "Lab 2", weight: 5 },
                { name: "Lab 3", weight: 5 },
                { name: "Lab 4", weight: 5 },
                { name: "Lab 5", weight: 5 },
                { name: "Lab 6", weight: 5 },
                { name: "Lab 7", weight: 5 },
                { name: "Lab 8", weight: 5 },
                { name: "Test 1", weight: 15 },
                { name: "Test 2", weight: 15 },
                { name: "Final Exam", weight: 30 } // Adjusted to 30 to sum to 100 based on syllabus md
            ]
        },
        "ELEC 274": {
            components: [
                { name: "Laboratories", weight: 20, count: 5 }, // Assume 5 labs?
                { name: "Midterm Quiz", weight: 20, count: 1 },
                { name: "Final Exam", weight: 60, count: 1 }
            ]
        }
    },
    courses: [
        {
            code: "MTHE 281",
            name: "Introduction To Real Analysis",
            notes: "pdfs/MTHE281.pdf",
            textbook: "textbooks/MTHE281 Abbott - Understanding Analysis.pdf",
            solutions: "textbooks/MTHE 281 Understanding Analysis Solutions.pdf",
            assignments: "assignments.html?course=MTHE 281"
        },
        {
            code: "ENPH 239",
            name: "Electromagnetism",
            notes: "pdfs/ENPH239.pdf",
            textbook: "textbooks/ENPH 239 David J. Griffiths-Introduction to Electrodynamics-Addison-Wesley (2012).pdf",
            solutions: "textbooks/ENPH 239 solutions_manual.pdf",
            assignments: "assignments.html?course=ENPH 239"
        },
        {
            code: "MTHE 212",
            name: "Linear Algebra II",
            notes: "pdfs/MTHE212.pdf",
            textbook: "textbooks/MTHE 212 Textbook - [3rd ed.] LADR by Sheldon A.pdf",
            solutions: "textbooks/MTHE212-Textbook-Solutions.pdf",
            assignments: "assignments.html?course=MTHE 212"
        },
        {
            code: "CMPE 212",
            name: "Intro Computing Science II",
            notes: "pdfs/CMPE212.pdf",
            textbook: "textbooks/CMPE 212 Textbook - [5th ed.] Addison Wesley - Absolute Java.pdf",
            assignments: "assignments.html?course=CMPE 212"
        },
        {
            code: "ELEC 274",
            name: "Computer Architecture",
            notes: "pdfs/ELEC274.pdf",
            textbook: "textbooks/ELEC 274 Textbook - [6th ed.] Computer Organization and Embedded Systems by ya boi Manjikian himself.pdf",
            assignments: "assignments.html?course=ELEC 274"
        }
    ],
    assignments: [
        // --- CMPE 212 ---
        { id: "cmpe-l1", course: "CMPE 212", category: "LAB", title: "Lab 1", date: "2026-01-13", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 1" } },
        { id: "cmpe-l2", course: "CMPE 212", category: "LAB", title: "Lab 2", date: "2026-01-20", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 2" } },
        { id: "cmpe-l3", course: "CMPE 212", category: "LAB", title: "Lab 3", date: "2026-01-27", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 3" } },
        { id: "cmpe-t1", course: "CMPE 212", category: "MIDTERM", title: "Test 1", date: "2026-02-05", time: "09:30", status: "UPCOMING", details: { type: "text", content: "Midterm Test 1" } },
        { id: "cmpe-l4", course: "CMPE 212", category: "LAB", title: "Lab 4", date: "2026-02-10", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 4" } },
        // Reading Week Feb 13-22
        { id: "cmpe-l5", course: "CMPE 212", category: "LAB", title: "Lab 5", date: "2026-02-24", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 5" } },
        { id: "cmpe-l6", course: "CMPE 212", category: "LAB", title: "Lab 6", date: "2026-03-10", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 6" } },
        { id: "cmpe-t2", course: "CMPE 212", category: "MIDTERM", title: "Test 2", date: "2026-03-12", time: "09:30", status: "UPCOMING", details: { type: "text", content: "Midterm Test 2" } },
        { id: "cmpe-l7", course: "CMPE 212", category: "LAB", title: "Lab 7", date: "2026-03-17", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 7" } },
        { id: "cmpe-l8", course: "CMPE 212", category: "LAB", title: "Lab 8", date: "2026-03-31", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 8" } },
        { id: "cmpe-fin", course: "CMPE 212", category: "FINAL", title: "Final Exam", date: "2026-04-30", time: "00:00", status: "UPCOMING", details: { type: "text", content: "Date TBD" } },

        // --- OTHER COURSES (Retained) ---
        {
            id: "1",
            course: "MTHE 281",
            category: "ASSIGNMENT",
            title: "Assignment 1",
            date: "2026-01-23",
            time: "23:59",
            status: "PENDING",
            details: { type: "pdf", url: "pdfs/MTHE281.pdf" }
        },
        {
            id: "2",
            course: "ENPH 239",
            category: "LAB",
            title: "Lab 1",
            date: "2026-01-25",
            time: "16:00",
            status: "PENDING",
            details: { type: "text", content: "Complete the pre-lab questions before entering the lab." }
        },
        {
            id: "4",
            course: "MTHE 212",
            category: "QUIZ",
            title: "Quiz 1",
            date: "2026-01-30",
            time: "09:30",
            status: "UPCOMING",
            details: { type: "text", content: "Topics: Vector Spaces, Subspaces, Linear Independence." }
        },
        {
            id: "5",
            course: "ELEC 274",
            category: "MIDTERM",
            title: "Midterm Exam",
            date: "2026-02-05",
            time: "14:00",
            status: "UPCOMING",
            details: { type: "text", content: "Location: Walter Light Hall 205. Bring ID." }
        },
        {
            id: "6",
            course: "PERSONAL",
            category: "REMINDER",
            title: "Rent Payment",
            date: "2026-02-01",
            time: "09:00",
            status: "PENDING",
            details: { type: "text", content: "Pay $850 to Landlord via E-Transfer." }
        },
        {
            id: "7",
            course: "CAREER",
            category: "REMINDER",
            title: "RBC Internship Application",
            date: "2026-01-31",
            time: "23:59",
            status: "PENDING",
            details: { type: "link", url: "https://jobs.rbc.com", label: "Apply Here" }
        }
    ]
};

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

    // Reading Week Setup (Feb 13 - Feb 22, 2026)
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

        html += `<div class="${classes}" onclick="selectDate('${dateStr}')">${i}${dot}</div>`;
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

function createAssignmentCard(item) {
    const dateObj = new Date(item.date + 'T' + item.time);
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

    // Status Color Logic
    let status = item.status;
    const localStatus = localStorage.getItem(`status_${item.id}`);
    if (localStatus) status = localStatus;

    let statusClass = "status-pending";
    if (status === 'DONE') statusClass = "status-done";
    if (status === 'UPCOMING') statusClass = "status-upcoming";

    // Category Color Logic
    const categoryClass = `category-${item.category.toLowerCase()}`;

    return `
        <a href="details.html?id=${item.id}" class="assignment-item">
            <div class="assign-left">
                <span class="assign-date">${day}</span>
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
                <span class="assign-status ${statusClass}">${status}</span>
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
                <a href="${course.textbook}" target="_blank" class="action-btn secondary">
                    <span>Textbook</span>
                </a>
                ${solutionsButton}
                <a href="${course.assignments}" class="action-btn secondary">
                    <span>Assignments</span>
                </a>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    renderPlanning();
    renderGlobalSchedule();
    renderCourses();
});
