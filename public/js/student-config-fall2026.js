const STUDENT_DATA = {
    termRange: { start: "2026-09-01", end: "2026-12-31" },
    gradingSchemes: {},
    courses: [],
    assignments: []
};

// Expose globally for modules
window.STUDENT_DATA = STUDENT_DATA;
window.data = STUDENT_DATA; // Backwards compatibility if needed
