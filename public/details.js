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
        loadStatus();
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

function loadStatus() {
    const item = data.assignments.find(a => a.id === currentAssignmentId);
    if (!item) return;

    // Check localStorage first, then default to item.status
    const localStatus = localStorage.getItem(`status_${currentAssignmentId}`);
    const currentStatus = localStatus || item.status;

    const selector = document.getElementById('status-selector');
    if (selector) {
        selector.value = currentStatus;
    }
}

function updateStatus() {
    const selector = document.getElementById('status-selector');
    const newStatus = selector.value;

    // Save to localStorage
    localStorage.setItem(`status_${currentAssignmentId}`, newStatus);

    // Visual feedback (optional)
    // You could flash a border or show a toast here
}
