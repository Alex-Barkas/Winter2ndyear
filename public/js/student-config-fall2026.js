// See student-config-winter2026.js for why this is a direct window assignment
// and not a top-level `const`.
window.STUDENT_DATA = {
    termRange: {
        start: "2026-09-01",
        end: "2026-12-31",
        classesStart: "2026-09-08"
    },
    gradingSchemes: {},
    courses: [],
    assignments: []
};

window.data = window.STUDENT_DATA; // Backwards compatibility if needed
