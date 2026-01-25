// Local Storage / API Implementation
const API_URL = '/api/db';

export const DataService = {

    // --- READ OPERATIONS ---

    async getAllAssignments() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch DB");
            const data = await response.json();
            return data.assignments || [];
        } catch (e) {
            console.warn("API unavailable, falling back to empty/config:", e);
            // If offline/file-protocol, maybe return STUDENT_DATA as fallback or empty
            if (typeof STUDENT_DATA !== 'undefined') return STUDENT_DATA.assignments || [];
            return [];
        }
    },

    async getTodos() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch DB");
            const data = await response.json();
            return data.todos || [];
        } catch (e) {
            console.warn("API unavailable for todos:", e);
            return [];
        }
    },

    // --- WRITE OPERATIONS ---
    // Helper to get full DB, modify, and save back
    async _updateDb(modifierFn) {
        try {
            // 1. Fetch current DB
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch DB for update");
            const data = await response.json();

            // 2. Modify
            modifierFn(data);

            // 3. Save back
            const postResponse = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!postResponse.ok) throw new Error("Failed to save DB");
            return true;
        } catch (e) {
            console.error("Error updating DB:", e);
            return false;
        }
    },

    // --- ASSIGNMENTS ---

    async addAssignment(assignment) {
        if (!assignment.id) assignment.id = 'assign_' + Date.now();
        const success = await this._updateDb((data) => {
            if (!data.assignments) data.assignments = [];
            data.assignments.push(assignment);
        });
        return success ? assignment : null;
    },

    async updateAssignmentStatus(id, newStatus) {
        await this._updateDb((data) => {
            const item = data.assignments.find(a => a.id === id);
            if (item) item.status = newStatus;
        });
    },

    async updateAssignmentGrade(id, newScore) {
        await this._updateDb((data) => {
            const item = data.assignments.find(a => a.id === id);
            if (item) item.score = newScore;
        });
    },

    async updateAssignmentDetails(id, newDetails) {
        await this._updateDb((data) => {
            let item = data.assignments.find(a => a.id === id);
            if (item) {
                // Merge details
                Object.assign(item, newDetails);
            }
        });
        // Return updated item (simulated)
        const assignments = await this.getAllAssignments();
        return assignments.find(a => a.id === id) || null;
    },

    async deleteAssignment(id) {
        return await this._updateDb((data) => {
            if (data.assignments) {
                data.assignments = data.assignments.filter(a => a.id !== id);
            }
        });
    },

    // --- TODOS ---

    async saveTodoItem(todo) {
        await this._updateDb((data) => {
            if (!data.todos) data.todos = [];
            const index = data.todos.findIndex(t => t.id === todo.id);
            if (index >= 0) {
                data.todos[index] = todo;
            } else {
                data.todos.push(todo);
            }
        });
    },

    async deleteTodoItem(id) {
        await this._updateDb((data) => {
            if (data.todos) {
                data.todos = data.todos.filter(t => t.id !== id);
            }
        });
    },

    async saveTodos(todosList) {
        // Full replace of todos list
        await this._updateDb((data) => {
            data.todos = todosList;
        });
    },

    async getAssignmentById(id) {
        const assignments = await this.getAllAssignments();
        return assignments.find(a => a.id === id) || null;
    },

    async getCourses() {
        if (typeof STUDENT_DATA !== 'undefined') return STUDENT_DATA.courses;
        return [];
    },

    async seedDatabase(data) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) alert("Database seeded!");
        } catch (e) {
            console.error(e);
        }
    }
};
