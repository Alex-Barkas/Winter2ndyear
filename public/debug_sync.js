
import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, writeBatch, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function runDiagnostics() {
    console.log("🚀 Starting Diagnostics...");

    // 1. Check LocalStorage
    console.log("1. Inspecting Local Storage...");
    const localRaw = localStorage.getItem('dashboard_todos');
    console.log("   Raw LocalStorage:", localRaw);

    if (!localRaw) {
        console.error("❌ No local data found in 'dashboard_todos'!");
    } else {
        const todos = JSON.parse(localRaw);
        console.log(`   ✅ Found ${todos.length} local items.`);
        todos.forEach(t => console.log(`      - ${t.title} (${t.id})`));

        // 2. Try force push
        console.log("2. Attempting FORCE PUSH of local items...");
        try {
            const batch = writeBatch(db);
            let count = 0;
            todos.forEach(todo => {
                // Ensure ID
                const docId = todo.id || "manual_" + Date.now() + "_" + count;
                const docRef = doc(collection(db, "todos"), docId);
                // Ensure data is clean object
                batch.set(docRef, { ...todo, id: docId });
                count++;
            });
            await batch.commit();
            console.log(`   ✅ Force Push Committed ${count} items.`);
        } catch (e) {
            console.error("   ❌ Force Push Failed:", e);
        }
    }

    // 3. Read back Cloud
    console.log("3. Reading Cloud Data...");
    const snap = await getDocs(collection(db, "todos"));
    console.log(`   ☁️ Cloud has ${snap.size} items:`);
    snap.forEach(d => console.log(`      - ${d.data().title}`));
}

window.runDiagnostics = runDiagnostics;
console.log("Diagnostic script loaded. Type 'runDiagnostics()' to start.");
