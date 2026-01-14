// details.js - Logic for Detail Page Modules
import { DataService } from "./data-service.js";

// Make functions global for HTML onclick handlers
window.toggleChecklistItem = toggleChecklistItem;
window.addChecklistItem = addChecklistItem;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.saveAssignmentGrade = saveAssignmentGrade;
window.updateStatus = updateStatus;

let currentAssignmentId = null;
let timerInterval = null;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isTimerRunning = false;
let currentItemData = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    currentAssignmentId = params.get('id');

    if (currentAssignmentId) {
        currentItemData = await DataService.getAssignmentById(currentAssignmentId);

        if (currentItemData) {
            renderDetails(currentItemData);
            loadChecklist(); // Still local or could be migrated to DB
            loadGrade(currentItemData);
            loadStatus(currentItemData);
        } else {
            console.error("Assignment not found in DB");
            document.getElementById('loading').innerText = "Item not found in Database.";
        }
    }
});

function renderDetails(item) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('detail-view').style.display = 'block';

    // Populate Metadata
    document.getElementById('detail-course').innerText = item.course;
    document.getElementById('detail-title').innerText = item.title;
    const dateObj = new Date(item.date + 'T' + item.time);
    document.getElementById('detail-date').innerText = dateObj.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Category Styling
    const catElem = document.getElementById('detail-category');
    catElem.innerText = item.category;
    catElem.classList.add(`category-${item.category.toLowerCase()}`);

    // Render Content based on Type
    const contentArea = document.getElementById('content-area');
    const d = item.details;

    if (d.type === 'text') {
        contentArea.innerHTML = `<p style="font-size: 1.1rem; line-height: 1.7;">${d.content}</p>`;
    }
    else if (d.type === 'pdf') {
        contentArea.innerHTML = `<embed src="${d.url}" type="application/pdf" class="pdf-viewer" />`;
    }
    else if (d.type === 'video') {
        contentArea.innerHTML = `
            <div class="video-container">
                <iframe src="${d.url}" allowfullscreen></iframe>
            </div>
        `;
    }
    else if (d.type === 'link') {
        contentArea.innerHTML = `
            <p class="subtitle">External Resource</p>
            <a href="${d.url}" target="_blank" class="btn-link">${d.label || 'Open Link'} ↗</a>
        `;
    }

    // Render Attached Images (if any)
    if (d.images && Array.isArray(d.images) && d.images.length > 0) {
        let imgHtml = '<div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem;">';
        imgHtml += '<h3 style="font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Attachments</h3>';
        d.images.forEach(url => {
            imgHtml += `<img src="${url}" style="max-width: 100%; border-radius: 0.5rem; border: 1px solid var(--border-color);" loading="lazy" alt="Attachment">`;
        });
        imgHtml += '</div>';

        // Append to existing content
        contentArea.innerHTML += imgHtml;
    }
}

// --- CHECKLIST MODULE ---
// Note: For now, keeping checklist local to avoid complex DB structure changes immediately, 
// or could migrate to DB. Let's keep local for v1 of Firebase migration to reduce risk.
function loadChecklist() {
    const list = document.getElementById('checklist-items');
    // Still using LocalStorage for checklist for now
    const saved = JSON.parse(localStorage.getItem(`checklist_${currentAssignmentId}`)) || [];

    list.innerHTML = '';
    saved.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = item.done ? 'checklist-item checked' : 'checklist-item';
        li.innerHTML = `
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="window.toggleChecklistItem(${index})">
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
function loadGrade(item) {
    // Value from DB
    if (item.score !== null && item.score !== undefined) {
        document.getElementById('assignment-grade').value = item.score;
    }
}

async function saveAssignmentGrade() {
    const val = document.getElementById('assignment-grade').value;
    await DataService.updateAssignmentGrade(currentAssignmentId, val);
}

function loadStatus(item) {
    const selector = document.getElementById('status-selector');
    if (selector) {
        selector.value = item.status || 'PENDING';
    }
}

async function updateStatus() {
    const selector = document.getElementById('status-selector');
    const newStatus = selector.value;
    await DataService.updateAssignmentStatus(currentAssignmentId, newStatus);
}
