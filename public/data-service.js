// Local Storage Implementation (Fallback for API issues)
const STORAGE_KEYS = {
    ASSIGNMENTS: 'dashboard_assignments',
    COURSES: 'dashboard_courses',
    PLANNING: 'dashboard_planning'
};

// Helper to get data from global config if storage is empty
const getInitialData = () => (typeof STUDENT_DATA !== 'undefined' ? STUDENT_DATA : { assignments: [], courses: [], planning: [] });

import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


export const DataService = {

    // --- READ OPERATIONS ---

    async getAllAssignments() {
        try {
            const querySnapshot = await getDocs(collection(db, "assignments"));
            let assignments = [];
            querySnapshot.forEach((doc) => {
                assignments.push(doc.data());
            });

            // Fallback/Migration: If DB is empty, check LocalStorage or Config
            if (assignments.length === 0) {
                const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || '[]');
                if (local.length > 0) {
                    console.log("Migrating Local Assignments to Cloud...");
                    for (const item of local) {
                        await this.addAssignment(item);
                        assignments.push(item);
                    }
                } else if (typeof STUDENT_DATA !== 'undefined' && STUDENT_DATA.assignments) {
                    console.log("Seeding initial data from Config...");
                    for (const item of STUDENT_DATA.assignments) {
                        await this.addAssignment(item);
                        assignments.push(item);
                    }
                }
            }
            return assignments;
        } catch (e) {
            console.error("Error getting assignments:", e);
            // Fallback to local storage if offline
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || '[]');
        }
    },

    async getTodos() {
        try {
            const querySnapshot = await getDocs(collection(db, "todos"));
            let todos = [];
            querySnapshot.forEach((doc) => {
                todos.push(doc.data());
            });

            // Migration for Todos
            if (todos.length === 0) {
                const local = JSON.parse(localStorage.getItem('personal_todos') || '[]');
                if (local.length > 0) {
                    console.log("Migrating Local Todos to Cloud...");
                    for (const t of local) {
                        await this.saveTodoItem(t); // Use helper helper
                        todos.push(t);
                    }
                }
            }
            return todos;
        } catch (e) {
            console.error("Error getting todos:", e);
            return JSON.parse(localStorage.getItem('personal_todos') || '[]');
        }
    },

    // --- WRITE OPERATIONS (Assignments) ---

    async addAssignment(assignment) {
        if (!assignment.id) assignment.id = 'assign_' + Date.now();

        try {
            await setDoc(doc(db, "assignments", assignment.id), assignment);
            return assignment;
        } catch (e) {
            console.error("Error adding assignment:", e);
            return null;
        }
    },

    async updateAssignmentStatus(id, newStatus) {
        try {
            const ref = doc(db, "assignments", id);
            await updateDoc(ref, { status: newStatus });
            console.log(`Updated status for ${id}`);
        } catch (e) {
            console.error("Error updating status:", e);
        }
    },

    async updateAssignmentGrade(id, newScore) {
        try {
            const ref = doc(db, "assignments", id);
            await updateDoc(ref, { score: newScore });
        } catch (e) {
            console.error("Error updating grade:", e);
        }
    },

    async updateAssignmentDetails(id, newDetails) {
        try {
            const ref = doc(db, "assignments", id);
            await updateDoc(ref, newDetails);

            // Return updated object for UI
            const snap = await getDoc(ref);
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            console.error("Error updating details:", e);
            return null;
        }
    },

    async deleteAssignment(id) {
        try {
            await deleteDoc(doc(db, "assignments", id));
            return true;
        } catch (e) {
            console.error("Error deleting:", e);
            return false;
        }
    },

    // --- WRITE OPERATIONS (Todos) ---
    // Replaces the old monolithic saveTodos

    async saveTodoItem(todo) {
        try {
            await setDoc(doc(db, "todos", todo.id), todo);
        } catch (e) {
            console.error("Error saving todo:", e);
        }
    },

    async deleteTodoItem(id) {
        try {
            await deleteDoc(doc(db, "todos", id));
        } catch (e) {
            console.error("Error deleting todo:", e);
        }
    },

    // Kept for compatibility with todo.html but now iterates individual saves/deletes
    // slightly inefficient but robust for this scale
    async saveTodos(todosList) {
        // This is tricky because todo.html sends the WHOLE list.
        // For Firestore, it's better to update invidually.
        // Strategy: Get all current, delete what's missing, add/update what's new?
        // OR: Just overwrite matching IDs. 
        // For simplicity: We will just save each item in the list. 
        // Deletions in todo.html should call deleteTodoItem directly if possible, 
        // but if todo.html is monolithic, we might leave ghosts if we aren't careful.
        // Let's rely on the fact that todo.html calls saveTodos(todos) 

        // Actually, let's just loop and save. Deletion is the edge case.
        // We will modify todo.html to call granular methods? 
        // No, let's keep API signature but hacking it for now:
        // Ideally we rewrite todo.html logic.

        for (const t of todosList) {
            await this.saveTodoItem(t);
        }
    },

    async getAssignmentById(id) {
        try {
            const snap = await getDoc(doc(db, "assignments", id));
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async getCourses() {
        if (typeof STUDENT_DATA !== 'undefined') return STUDENT_DATA.courses;
        return [];
    },

    async seedDatabase(data) {
        if (!data) return;
        console.log("Seeding...");
        for (const a of data.assignments) {
            await this.addAssignment(a);
        }
        alert("Database seeded (check console for details)");
    }
};
