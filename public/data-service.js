// Local Storage Implementation (Fallback for API issues)
const STORAGE_KEYS = {
    ASSIGNMENTS: 'dashboard_assignments',
    COURSES: 'dashboard_courses',
    PLANNING: 'dashboard_planning'
};

// Helper to get data from global config if storage is empty
const getInitialData = () => (typeof STUDENT_DATA !== 'undefined' ? STUDENT_DATA : { assignments: [], courses: [], planning: [] });

const API_URL = '/api/db';

export const DataService = {

    // --- READ OPERATIONS ---

    async _fetchDB() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("Failed to fetch DB");
            return await res.json();
        } catch (e) {
            console.error("API Error, falling back to LocalStorage (Read-Only mode)", e);
            // Fallback for offline viewing or if server not running
            const assignments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || '[]');
            // Try to seed from config if empty
            if (assignments.length === 0 && typeof STUDENT_DATA !== 'undefined') {
                return { assignments: STUDENT_DATA.assignments, todos: [] };
            }
            return { assignments, todos: [] };
        }
    },

    async _saveDB(data) {
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to save DB");

            // Also update LocalStorage as backup/cache
            if (data.assignments) localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments));

            return true;
        } catch (e) {
            console.error("API Error, save failed", e);
            alert("Connection to server failed. Changes may not be saved persistently.");
            return false;
        }
    },

    async getAllAssignments() {
        const db = await this._fetchDB();

        // Auto-seed if empty and we have static data
        if ((!db.assignments || db.assignments.length === 0) && typeof STUDENT_DATA !== 'undefined') {
            console.log("Auto-seeding assignments to Server");
            db.assignments = STUDENT_DATA.assignments;
            await this._saveDB(db);
        }

        return db.assignments || [];
    },

    async getTodos() {
        const db = await this._fetchDB();
        return db.todos || [];
    },

    async saveTodos(todos) {
        const db = await this._fetchDB();
        db.todos = todos;
        await this._saveDB(db);
    },

    async getCourses() {
        // Courses are static for now, usually coming from student-config.js via script.js
        // But let's return from config if available
        if (typeof STUDENT_DATA !== 'undefined') return STUDENT_DATA.courses;
        return [];
    },

    async getPlanning() {
        // Deprecated/Unused in new flow, return empty
        return [];
    },

    async getAssignmentById(id) {
        const assignments = await this.getAllAssignments();
        return assignments.find(a => a.id === id) || null;
    },

    async addAssignment(assignment) {
        const db = await this._fetchDB();
        if (!db.assignments) db.assignments = [];

        // Generate simple ID if not provided
        if (!assignment.id) {
            assignment.id = 'assign_' + Date.now();
        }
        db.assignments.push(assignment);
        await this._saveDB(db);
        console.log(`Added assignment ${assignment.id}`);
        return assignment;
    },

    async deleteAssignment(id) {
        const db = await this._fetchDB();
        if (!db.assignments) return false;

        const initialLength = db.assignments.length;
        db.assignments = db.assignments.filter(a => a.id !== id);

        if (db.assignments.length !== initialLength) {
            await this._saveDB(db);
            console.log(`Deleted assignment ${id}`);
            return true;
        }
        return false;
    },

    // --- WRITE OPERATIONS ---

    async updateAssignmentStatus(id, newStatus) {
        const db = await this._fetchDB();
        const index = db.assignments.findIndex(a => a.id === id);

        if (index !== -1) {
            db.assignments[index].status = newStatus;
            await this._saveDB(db);
            console.log(`Updated status for ${id} to ${newStatus}`);
        }
    },

    async updateAssignmentGrade(id, newScore) {
        const db = await this._fetchDB();
        const index = db.assignments.findIndex(a => a.id === id);

        if (index !== -1) {
            db.assignments[index].score = newScore;
            await this._saveDB(db);
            console.log(`Updated score for ${id} to ${newScore}`);
        }
    },

    async updateAssignmentDetails(id, newDetails) {
        const db = await this._fetchDB();
        const index = db.assignments.findIndex(a => a.id === id);

        if (index !== -1) {
            // Merge new details (spread only works if keys don't conflict logic)
            // Just update specific fields
            if (newDetails.title) db.assignments[index].title = newDetails.title;
            if (newDetails.course) db.assignments[index].course = newDetails.course;
            if (newDetails.date) db.assignments[index].date = newDetails.date;
            if (newDetails.time) db.assignments[index].time = newDetails.time;

            await this._saveDB(db);
            console.log(`Updated details for ${id}`, newDetails);
            return db.assignments[index];
        }
        return null;
    },

    // --- INTERNAL HELPERS ---
    // (Helpers removed as logic is now integrated)

    // --- MIGRATION UTILS ---

    async seedDatabase(data) {
        if (!data) return;
        const db = {
            assignments: data.assignments,
            todos: []
        };
        await this._saveDB(db);
        console.log("Server DB seeded successfully!");
        alert("Server DB Updated with Seed Data!");
    }
};
