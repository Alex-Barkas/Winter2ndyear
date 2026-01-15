// Local Storage Implementation (Fallback for API issues)
const STORAGE_KEYS = {
    ASSIGNMENTS: 'dashboard_assignments',
    COURSES: 'dashboard_courses',
    PLANNING: 'dashboard_planning'
};

// Helper to get data from global config if storage is empty
const getInitialData = () => (typeof STUDENT_DATA !== 'undefined' ? STUDENT_DATA : { assignments: [], courses: [], planning: [] });

export const DataService = {

    // --- READ OPERATIONS ---

    async getAllAssignments() {
        const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
        if (stored) return JSON.parse(stored);

        // Auto-seed if empty
        const initial = getInitialData().assignments;
        if (initial.length > 0) {
            console.log("Auto-seeding assignments to Local Storage");
            localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(initial));
        }
        return initial;
    },

    async getCourses() {
        const stored = localStorage.getItem(STORAGE_KEYS.COURSES);
        if (stored) return JSON.parse(stored);

        const initial = getInitialData().courses;
        if (initial.length > 0) {
            localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(initial));
        }
        return initial;
    },

    async getPlanning() {
        const stored = localStorage.getItem(STORAGE_KEYS.PLANNING);
        if (stored) return JSON.parse(stored);

        const initial = getInitialData().planning;
        if (initial.length > 0) {
            localStorage.setItem(STORAGE_KEYS.PLANNING, JSON.stringify(initial));
        }
        return initial;
    },

    async getAssignmentById(id) {
        const assignments = await this.getAllAssignments();
        return assignments.find(a => a.id === id) || null;
    },

    // --- WRITE OPERATIONS ---

    async updateAssignmentStatus(id, newStatus) {
        const assignments = await this.getAllAssignments();
        const index = assignments.findIndex(a => a.id === id);

        if (index !== -1) {
            assignments[index].status = newStatus;
            this._saveAssignments(assignments);
            console.log(`Updated status for ${id} to ${newStatus} (Local Storage)`);
        }
    },

    async updateAssignmentGrade(id, newScore) {
        const assignments = await this.getAllAssignments();
        const index = assignments.findIndex(a => a.id === id);

        if (index !== -1) {
            assignments[index].score = newScore;
            this._saveAssignments(assignments);
            console.log(`Updated score for ${id} to ${newScore} (Local Storage)`);
        }
    },

    async updateChecklist(id, checklist) {
        const assignments = await this.getAllAssignments();
        const index = assignments.findIndex(a => a.id === id);

        if (index !== -1) {
            assignments[index].personalChecklist = checklist;
            this._saveAssignments(assignments);
        }
    },

    async updateAssignmentDetails(id, newDetails) {
        const assignments = await this.getAllAssignments();
        const index = assignments.findIndex(a => a.id === id);

        if (index !== -1) {
            // Merge new details
            assignments[index] = { ...assignments[index], ...newDetails };
            this._saveAssignments(assignments);
            console.log(`Updated details for ${id}`, newDetails);
            return assignments[index];
        }
        return null;
    },

    // --- INTERNAL HELPERS ---

    _saveAssignments(assignments) {
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    },

    // --- MIGRATION UTILS ---

    async seedDatabase(data) {
        if (!data) return;

        console.log("Seeding Local Storage...", data);

        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments));
        localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(data.courses));
        localStorage.setItem(STORAGE_KEYS.PLANNING, JSON.stringify(data.planning));

        console.log("Local Storage seeded successfully!");
        alert("Local Storage Updated! (Cloud API bypassed)");
    }
};
