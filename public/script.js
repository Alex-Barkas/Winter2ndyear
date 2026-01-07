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
        }
    ],
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
        { course: "MTHE 281", title: "Assignment 1", date: "2026-01-23", time: "23:59", status: "PENDING" },
        { course: "ENPH 239", title: "Problem Set 1", date: "2026-01-25", time: "16:00", status: "PENDING" },
        { course: "CMPE 212", title: "Lab 1 Submission", date: "2026-01-27", time: "12:00", status: "PENDING" },
        { course: "MTHE 212", title: "Quiz 1", date: "2026-01-30", time: "09:30", status: "UPCOMING" },
        { course: "ELEC 274", title: "Midterm Prep", date: "2026-02-05", time: "14:00", status: "UPCOMING" }
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

function renderGlobalSchedule() {
    const container = document.getElementById('global-schedule');
    if (!container) return; // Only runs on index.html

    // Sort by date
    const sorted = [...data.assignments].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by Month
    const grouped = sorted.reduce((acc, curr) => {
        const month = new Date(curr.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
    container.innerHTML = html;
}

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
    let statusClass = "status-pending";
    if (item.status === 'DONE') statusClass = "status-done";
    if (item.status === 'UPCOMING') statusClass = "status-upcoming";

    return `
        <div class="assignment-item">
            <div class="assign-left">
                <span class="assign-date">${day}</span>
                <div class="assign-details">
                    <span class="assign-course">${item.course}</span>
                    <span class="assign-title">${item.title}</span>
                </div>
            </div>
            <div class="assign-right">
                <span class="assign-time">${item.time}</span>
                <span class="assign-status ${statusClass}">${item.status}</span>
            </div>
        </div>
    `;
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
