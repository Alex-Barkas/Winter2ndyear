// details.js - Logic for Detail Page Modules
import { DataService } from "./data-service.js";

// Make functions global for HTML onclick handlers
window.saveAssignmentGrade = saveAssignmentGrade;
window.updateStatus = updateStatus;

let currentAssignmentId = null;
let currentItemData = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    currentAssignmentId = params.get('id');

    if (currentAssignmentId) {
        currentItemData = await DataService.getAssignmentById(currentAssignmentId);

        if (currentItemData) {
            renderDetails(currentItemData);
            renderDetails(currentItemData);
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

// --- EDIT DETAILS MODULE ---
window.openEditModal = function () {
    if (!currentItemData) return;

    document.getElementById('edit-title').value = currentItemData.title || '';
    document.getElementById('edit-course').value = currentItemData.course || '';
    document.getElementById('edit-date').value = currentItemData.date || '';
    document.getElementById('edit-time').value = currentItemData.time || '';

    document.getElementById('edit-modal').style.display = 'grid';
}

window.closeEditModal = function () {
    document.getElementById('edit-modal').style.display = 'none';
}

window.saveEditDetails = async function () {
    const newTitle = document.getElementById('edit-title').value;
    const newCourse = document.getElementById('edit-course').value;
    const newDate = document.getElementById('edit-date').value;
    const newTime = document.getElementById('edit-time').value;

    if (!newTitle || !newCourse || !newDate) {
        alert("Please fill in Title, Course, and Date");
        return;
    }

    const updates = {
        title: newTitle,
        course: newCourse,
        date: newDate,
        time: newTime
    };

    const updatedItem = await DataService.updateAssignmentDetails(currentAssignmentId, updates);
    if (updatedItem) {
        currentItemData = updatedItem;
        renderDetails(updatedItem); // Re-render page
        window.closeEditModal();
        // Also update local checklist key if ID changed? ID shouldn't change.
    } else {
        alert("Failed to update details.");
    }
}
