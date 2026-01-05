const data = {
    textbooks: [
        {
            name: "Textbooks",
            link: "#",
            action: "Folder",
            isFolder: true
        }
    ],
    courses: [
        {
            code: "MTHE 281",
            name: "Introduction To Real Analysis",
            link: "pdfs/MTHE281.pdf",
            action: "PDF"
        },
        {
            code: "ENPH 239",
            name: "Electromagnetism",
            link: "pdfs/ENPH239.pdf",
            action: "PDF"
        },
        {
            code: "MTHE 212",
            name: "Linear Algebra II",
            link: "pdfs/MTHE212.pdf",
            action: "PDF"
        },
        {
            code: "CMPE 212",
            name: "Intro Computing Science II",
            link: "pdfs/CMPE212.pdf",
            action: "PDF"
        },
        {
            code: "ELEC 274",
            name: "Computer Architecture",
            link: "pdfs/ELEC274.pdf",
            action: "PDF"
        }
    ]
};

function renderTextbooks() {
    const container = document.getElementById('textbook-list');
    container.innerHTML = data.textbooks.map(item => createLinkItem(item)).join('');
}

function renderCourses() {
    const container = document.getElementById('course-list');
    container.innerHTML = data.courses.map(item => createLinkItem(item)).join('');
}

function createLinkItem(item) {
    // Determine target attribute
    const target = item.action === "PDF" ? "_blank" : "_self";

    // Conditional styling class
    const nameClass = item.isFolder ? "item-name is-folder" : "item-name";

    // Conditional code span (only if code exists)
    const codeSpan = item.code
        ? `<span class="item-code">${item.code}</span>`
        : '';

    return `
        <a href="${item.link}" target="${target}" class="link-item">
            ${codeSpan}
            <div class="item-content">
                <span class="${nameClass}">${item.name}</span>
                <span class="item-action">${item.action}</span>
            </div>
        </a>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    renderTextbooks();
    renderCourses();
});
