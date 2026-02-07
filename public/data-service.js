// Firebase Implementation
import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const STORAGE_KEYS = {
    ASSIGNMENTS: 'dashboard_assignments',
    TODOS: 'dashboard_todos'
};

export const DataService = {

    // --- READ OPERATIONS ---

    async getAllAssignments() {
        try {
            const querySnapshot = await getDocs(collection(db, "assignments"));
            const assignments = [];
            querySnapshot.forEach((doc) => {
                assignments.push(doc.data());
            });

            // Sync to local storage for offline viewing/backup
            localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
            return assignments;
        } catch (e) {
            console.warn("Firestore unavailable, checking LocalStorage:", e);
            const local = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
            if (local) return JSON.parse(local);

            // Fallback to Config
            if (typeof window.STUDENT_DATA !== 'undefined') {
                return window.STUDENT_DATA.assignments || [];
            }
            return [];
        }
    },

    async getTodos() {
        try {
            const querySnapshot = await getDocs(collection(db, "todos"));
            const todos = [];
            querySnapshot.forEach((doc) => {
                todos.push(doc.data());
            });

            // CRITICAL: If cloud is empty but local has data, KEEP LOCAL (don't overwrite with empty)
            // This handles the case where we purged the cloud but user has local work.
            if (todos.length === 0) {
                const local = localStorage.getItem(STORAGE_KEYS.TODOS);
                const localTodos = local ? JSON.parse(local) : [];
                if (localTodos.length > 0) {
                    console.log("Cloud empty, preserving local data.");
                    return localTodos;
                }
            }

            localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
            return todos;
        } catch (e) {
            console.warn("Firestore unavailable for todos, checking LocalStorage:", e);
            const local = localStorage.getItem(STORAGE_KEYS.TODOS);
            return local ? JSON.parse(local) : [];
        }
    },

    // --- ASSIGNMENTS ---

    async addAssignment(assignment) {
        if (!assignment.id) assignment.id = 'assign_' + Date.now();
        try {
            await setDoc(doc(db, "assignments", assignment.id), assignment);
            return assignment;
        } catch (e) {
            console.error("Error adding assignment: ", e);
            return null;
        }
    },

    async updateAssignmentStatus(id, newStatus) {
        try {
            const ref = doc(db, "assignments", id);
            await updateDoc(ref, { status: newStatus });
        } catch (e) {
            console.error("Error updating status: ", e);
        }
    },

    async updateAssignmentGrade(id, newScore) {
        try {
            const ref = doc(db, "assignments", id);
            await updateDoc(ref, { score: newScore });
        } catch (e) {
            console.error("Error updating grade: ", e);
        }
    },

    async updateAssignmentDetails(id, newDetails) {
        try {
            const ref = doc(db, "assignments", id);
            await updateDoc(ref, newDetails);
            // Return updated (simulated)
            return { id, ...newDetails };
        } catch (e) {
            console.error("Error updating details: ", e);
            return null;
        }
    },

    async deleteAssignment(id) {
        try {
            await deleteDoc(doc(db, "assignments", id));
        } catch (e) {
            console.error("Error deleting assignment: ", e);
        }
    },

    // --- TODOS ---

    async saveTodoItem(todo) {
        try {
            await setDoc(doc(db, "todos", todo.id), todo);
        } catch (e) {
            console.error("Error saving todo: ", e);
        }
    },

    async deleteTodoItem(id) {
        try {
            await deleteDoc(doc(db, "todos", id));
        } catch (e) {
            console.error("Error deleting todo: ", e);
        }
    },

    // Legacy support / helpers
    async getAssignmentById(id) {
        const assignments = await this.getAllAssignments();
        return assignments.find(a => a.id === id) || null;
    },

    async getCourses() {
        if (typeof window.STUDENT_DATA !== 'undefined') return window.STUDENT_DATA.courses;
        return [];
    },

    // No longer needed but kept for compatibility logic if called
    async pushLocalTodosToServer() {
        try {
            const local = localStorage.getItem(STORAGE_KEYS.TODOS);
            if (!local) return { success: false, message: "No local todos found." };

            const todos = JSON.parse(local);
            if (!Array.isArray(todos) || todos.length === 0) {
                return { success: false, message: "Local list is empty." };
            }

            // Use the top-level writeBatch import
            const batch = writeBatch(db);
            const todosRef = collection(db, "todos");

            todos.forEach(todo => {
                // Use existing ID or generate one if missing (shouldn't happen)
                const docId = todo.id || Date.now().toString();
                const docRef = doc(todosRef, docId);
                batch.set(docRef, todo);
            });

            await batch.commit();
            return { success: true, count: todos.length };
        } catch (e) {
            console.error("Sync Error:", e);
            return { success: false, message: e.message };
        }
    }
};
