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
            textbook: "textbooks/MTHE281.pdf",
            assignments: "assignments/MTHE281"
        },
        {
            code: "ENPH 239",
            name: "Electromagnetism",
            notes: "pdfs/ENPH239.pdf",
            textbook: "textbooks/ENPH239.pdf",
            assignments: "assignments/ENPH239"
        },
        {
            code: "MTHE 212",
            name: "Linear Algebra II",
            notes: "pdfs/MTHE212.pdf",
            textbook: "textbooks/MTHE212.pdf",
            assignments: "assignments/MTHE212"
        },
        {
            code: "CMPE 212",
            name: "Intro Computing Science II",
            notes: "pdfs/CMPE212.pdf",
            textbook: "textbooks/CMPE212.pdf",
            assignments: "assignments/CMPE212"
        },
        {
            code: "ELEC 274",
            name: "Computer Architecture",
            notes: "pdfs/ELEC274.pdf",
            textbook: "textbooks/ELEC274.pdf",
            assignments: "assignments/ELEC274"
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

function renderCourses() {
    const container = document.getElementById('course-list');
    if (!container) return;
    container.innerHTML = data.courses.map(course => createCourseCard(course)).join('');
}

function createCourseCard(course) {
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
                <a href="${course.assignments}" class="action-btn secondary">
                    <span>Assignments</span>
                </a>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    renderPlanning();
    renderCourses();
});
