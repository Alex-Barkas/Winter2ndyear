// details.js - Logic for Detail Page Modules

let currentAssignmentId = null;
let timerInterval = null;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isTimerRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    currentAssignmentId = params.get('id');

    if (currentAssignmentId) {
        loadChecklist();
        loadGrade();
    }
});

// --- CHECKLIST MODULE ---
function loadChecklist() {
    const list = document.getElementById('checklist-items');
    const saved = JSON.parse(localStorage.getItem(`checklist_${currentAssignmentId}`)) || [];

    list.innerHTML = '';
    saved.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = item.done ? 'checklist-item checked' : 'checklist-item';
        li.innerHTML = `
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem(${index})">
            <span>${item.text}</span>
        `;
        list.appendChild(li);
    });
}

function addChecklistItem() {
    const input = document.getElementById('new-item-input');
    const text = input.value.trim();
    if (!text) return;

    const saved = JSON.parse(localStorage.getItem(`checklist_${currentAssignmentId}`)) || [];
    saved.push({ text: text, done: false });
    localStorage.setItem(`checklist_${currentAssignmentId}`, JSON.stringify(saved));

    input.value = '';
    loadChecklist();
}

function toggleChecklistItem(index) {
    const saved = JSON.parse(localStorage.getItem(`checklist_${currentAssignmentId}`)) || [];
    if (saved[index]) {
        saved[index].done = !saved[index].done;
        localStorage.setItem(`checklist_${currentAssignmentId}`, JSON.stringify(saved));
        loadChecklist();
    }
}

// --- TIMER MODULE ---
function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.innerText = "Start";
    } else {
        isTimerRunning = true;
        btn.innerText = "Pause";
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                alert("Focus session complete!");
                btn.innerText = "Start";
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 25 * 60;
    document.getElementById('timer-btn').innerText = "Start";
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer-display').innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- GRADE & SUBMISSION MODULE ---
function loadGrade() {
    // Attempt to match this assignment to a grade component
    // This is tricky because assignments in the schedule map to general components
    // For MVP, we just save a simple "status" and "grade" for this specific ID

    const savedGrade = localStorage.getItem(`grade_val_${currentAssignmentId}`);
    if (savedGrade) {
        document.getElementById('assignment-grade').value = savedGrade;
    }
}

function saveAssignmentGrade() {
    const val = document.getElementById('assignment-grade').value;
    localStorage.setItem(`grade_val_${currentAssignmentId}`, val);
}

function markAsDone() {
    // Update the main assignment status in script.js (persisted via local storage overlay)
    // Note: Since script.js data is hardcoded, we need a "status overlay" system.
    // simpler approach: Save to localStorage `status_${id}` = 'DONE'

    localStorage.setItem(`status_${currentAssignmentId}`, 'DONE');

    const btn = document.querySelector('.submit-btn');
    btn.innerText = "Completed! 🎉";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    // Confetti effect could go here
}
