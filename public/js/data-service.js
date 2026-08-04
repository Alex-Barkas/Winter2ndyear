// Firebase Implementation
import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    writeBatch,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const STORAGE_KEYS = {
    ASSIGNMENTS: 'dashboard_assignments',
    TODOS: 'dashboard_todos',
    GRADE_OVERRIDES: 'dashboard_grade_overrides'
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

    subscribeToTodos(callback) {
        const q = query(collection(db, "todos"));
        return onSnapshot(q, (snapshot) => {
            const todos = [];
            snapshot.forEach((doc) => {
                todos.push(doc.data());
            });
            // Update local storage for backup (optional but good)
            localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
            callback(todos);
        }, (error) => {
            console.error("Error subscribing to todos:", error);
        });
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

    // --- FINAL GRADES (manually-entered letter grade per course) ---

    async getFinalGrade(courseCode) {
        const storageKey = `finalGrade_${courseCode}`;
        try {
            const snap = await getDoc(doc(db, "finalGrades", courseCode));
            if (snap.exists()) {
                const grade = snap.data().grade || "";
                localStorage.setItem(storageKey, grade);
                return grade;
            }
            return localStorage.getItem(storageKey) || "";
        } catch (e) {
            console.warn("Firestore unavailable for final grade, checking LocalStorage:", e);
            return localStorage.getItem(storageKey) || "";
        }
    },

    async setFinalGrade(courseCode, grade) {
        const storageKey = `finalGrade_${courseCode}`;
        localStorage.setItem(storageKey, grade);
        try {
            await setDoc(doc(db, "finalGrades", courseCode), { course: courseCode, grade });
        } catch (e) {
            console.error("Error saving final grade (kept in localStorage):", e);
        }
    },

    // --- GRADE OVERRIDES (manual-entry scores + exclude/drop flags, cloud-synced) ---
    // Doc id matches the existing manual-entry key format: `manual-${course}-${compIdx}-${i}`
    // Doc shape: { id, course, componentName, index, score: number|null, excluded: true|false }
    // NOTE: `excluded` being absent is a meaningful tri-state (see grading-renderer.js) —
    // never default it to false when writing.

    async getGradeOverrides() {
        try {
            const querySnapshot = await getDocs(collection(db, "gradeOverrides"));
            const overrides = [];
            querySnapshot.forEach((doc) => {
                overrides.push(doc.data());
            });

            // Sync to local storage for offline viewing/backup
            localStorage.setItem(STORAGE_KEYS.GRADE_OVERRIDES, JSON.stringify(overrides));
            return overrides;
        } catch (e) {
            console.warn("Firestore unavailable, checking LocalStorage:", e);
            const local = localStorage.getItem(STORAGE_KEYS.GRADE_OVERRIDES);
            if (local) return JSON.parse(local);

            // Fallback to Config
            if (typeof window.STUDENT_DATA !== 'undefined') {
                return window.STUDENT_DATA.gradeOverrides || [];
            }
            return [];
        }
    },

    async setGradeOverride(id, partial) {
        // Mirror to localStorage, merging with any existing cached override for this id
        try {
            const local = localStorage.getItem(STORAGE_KEYS.GRADE_OVERRIDES);
            const overrides = local ? JSON.parse(local) : [];
            const idx = overrides.findIndex(o => o.id === id);
            if (idx >= 0) {
                overrides[idx] = { ...overrides[idx], ...partial, id };
            } else {
                overrides.push({ id, ...partial });
            }
            localStorage.setItem(STORAGE_KEYS.GRADE_OVERRIDES, JSON.stringify(overrides));
        } catch (e) {
            console.warn("Error mirroring grade override to LocalStorage:", e);
        }

        try {
            // merge:true is mandatory: score and excluded are written independently
            // (typing a score vs. clicking the exclude toggle) and must not clobber each other.
            await setDoc(doc(db, "gradeOverrides", id), { id, ...partial }, { merge: true });
        } catch (e) {
            console.error("Error saving grade override (kept in localStorage):", e);
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
    }

};
