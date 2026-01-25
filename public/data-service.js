// Local Storage / API Implementation
const API_URL = '/api/db';
const STORAGE_KEYS = {
    ASSIGNMENTS: 'dashboard_assignments',
    TODOS: 'dashboard_todos'
};

export const DataService = {

    // --- READ OPERATIONS ---

    async getAllAssignments() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch DB");
            const data = await response.json();
            // Sync to local storage for backup
            localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments || []));
            return data.assignments || [];
        } catch (e) {
            console.warn("API unavailable, checking LocalStorage/Config:", e);

            // 1. Try LocalStorage
            const local = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
            if (local) return JSON.parse(local);

            // 2. Fallback to Config (window.STUDENT_DATA)
            if (typeof window.STUDENT_DATA !== 'undefined') {
                return window.STUDENT_DATA.assignments || [];
            }
            return [];
        }
    },

    async getTodos() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch DB");
            const data = await response.json();
            localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(data.todos || []));
            return data.todos || [];
        } catch (e) {
            console.warn("API unavailable for todos, checking LocalStorage:", e);
            const local = localStorage.getItem(STORAGE_KEYS.TODOS);
            return local ? JSON.parse(local) : [];
        }
    },

    // --- WRITE OPERATIONS ---
    // Helper to get full DB, modify, and save back (with Fallback)
    async _updateDb(modifierFn) {
        try {
            // OPTIMISTIC / API PATH
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                modifierFn(data); // Modify

                const postResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!postResponse.ok) throw new Error("Failed to save to API");

                // Update LocalStorage to match
                if (data.assignments) localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments));
                if (data.todos) localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(data.todos));

                return true;
            } else {
                throw new Error("API Read failed");
            }
        } catch (e) {
            console.warn("API Write failed, falling back to LocalStorage:", e);

            // FALLBACK PATH
            // 1. Load current state from LS or Config
            let assignments = [];
            const localAssign = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
            if (localAssign) {
                assignments = JSON.parse(localAssign);
            } else if (typeof window.STUDENT_DATA !== 'undefined') {
                assignments = JSON.parse(JSON.stringify(window.STUDENT_DATA.assignments || [])); // Deep copy
            }

            let todos = [];
            const localTodos = localStorage.getItem(STORAGE_KEYS.TODOS);
            if (localTodos) {
                todos = JSON.parse(localTodos);
            }

            // 2. Construct Mock DB object
            const data = { assignments, todos };

            // 3. Modify
            modifierFn(data);

            // 4. Save back to LocalStorage
            localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments));
            localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(data.todos));

            return true;
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
        if (typeof window.STUDENT_DATA !== 'undefined') return window.STUDENT_DATA.courses;
        return [];
    },

    async seedDatabase(data) {
        try {
            // Try API first
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                alert("Database seeded (API)!");
                return;
            }
        } catch (e) {
            console.error(e);
        }

        // Fallback seed to LS
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments));
        localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(data.todos || []));
        alert("Database seeded (LocalStorage)!");
    }
};
