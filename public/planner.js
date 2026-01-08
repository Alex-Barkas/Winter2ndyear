document.addEventListener('DOMContentLoaded', () => {
    populateCourseDropdown();
    renderBlocks();
    renderIdeas();
});

// --- HELPER: GET DATA POOLS ---
function getBlocks() {
    // 1. Permanent File Data (Filtered by deletions)
    const deletedFileIds = JSON.parse(localStorage.getItem('deleted_file_blocks')) || [];
    const fileBlocks = (TRACKER_DATA.blocks || []).filter(b => !deletedFileIds.includes(b.id));

    // 2. Local Storage Data
    const localBlocks = JSON.parse(localStorage.getItem('planner_blocks')) || [];

    // Merge
    return [...fileBlocks, ...localBlocks];
}

function getIdeas() {
    const deletedIdeas = JSON.parse(localStorage.getItem('deleted_file_ideas')) || [];
    const fileIdeas = (TRACKER_DATA.ideas || []).filter(i => !deletedIdeas.includes(i));
    const local = JSON.parse(localStorage.getItem('planner_ideas')) || [];
    return [...fileIdeas, ...local];
}

// --- COURSE DROPDOWN ---
function populateCourseDropdown() {
    const select = document.getElementById('new-block-course');
    if (!select) return;

    STUDENT_DATA.courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.innerText = c.name;
        select.appendChild(opt);
    });
}


// --- BLOCkS RENDER & CRUD ---
function renderBlocks() {
    const container = document.getElementById('blocks-container');
    if (!container) return;

    const blocks = getBlocks();

    if (blocks.length === 0) {
        container.innerHTML = `<div class="subtitle" style="text-align:center; padding: 3rem;">No active blocks. Add one above!</div>`;
        return;
    }

    container.innerHTML = blocks.map(block => createBlockCard(block)).join('');
}

function createBlockCard(block) {
    const courseConfig = STUDENT_DATA.courses.find(c => c.code === block.course);
    let resourceButtons = '';

    if (courseConfig) {
        resourceButtons = `
            <a href="${courseConfig.notes}" target="_blank" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">Notes</a>
        `;
    }

    // Link Management
    // If link exists, show Drive button + small edit icon (?) or just 'Edit Link' context
    // User asked for "ability to add a drive link to session blocks whenever"

    let linkActions = '';
    if (block.link) {
        linkActions += `<a href="${block.link}" target="_blank" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">Drive ↗</a>`;
        linkActions += `<button onclick="updateBlockLink('${block.id}')" class="delete-btn" style="color:var(--text-muted); margin-left:0.5rem;" title="Edit Link">✎</button>`;
    } else {
        linkActions += `<button onclick="updateBlockLink('${block.id}')" class="delete-btn" style="color:var(--accent-color); margin-left:0.5rem;">+ Link</button>`;
    }

    const viewItemBtn = `
        <a href="details.html?id=${block.id}" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">View Item</a>
    `;

    // Delete is always visible now
    const deleteBtn = `
        <button onclick="deleteBlock('${block.id}')" class="delete-btn">Delete</button>
    `;

    return `
        <div class="block-card" id="block-${block.id}">
            <div class="block-header">
                <div>
                    <span class="block-course">${block.course}</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span class="block-duration">⏱ ${block.duration}m</span>
                    ${deleteBtn}
                </div>
            </div>
            
            <h3 class="block-title">${block.title}</h3>
            
            <div class="block-actions">
                ${viewItemBtn}
                ${resourceButtons}
                ${linkActions}
                <button onclick="toggleFocusMode('${block.id}')" class="action-btn primary" style="font-size:0.75rem; height: 2.25rem; margin-left: auto;">
                    Focus
                </button>
            </div>
        </div>
    `;
}

function updateBlockLink(id) {
    const newLink = prompt("Enter Drive/Resource URL:");
    if (newLink === null) return; // Cancelled

    // Update Local Storage
    let localBlocks = JSON.parse(localStorage.getItem('planner_blocks')) || [];
    const blockIndex = localBlocks.findIndex(b => b.id === id);

    if (blockIndex !== -1) {
        localBlocks[blockIndex].link = newLink;
        localStorage.setItem('planner_blocks', JSON.stringify(localBlocks));
        renderBlocks();
        return;
    }

    // Fallback: If it's a file block, we can't edit it in place easily because getBlocks merges them.
    // For now, assuming user mostly edits local blocks as per "make a new thing" workflow.
    // If they try to add a link to a file block, we currently can't persist that unless we shadow it in local storage.
    alert("Note: Use the 'New Session Block' form for full editability. Links on permanent file items cannot be updated from the UI yet.");
}

function addNewBlock() {
    const title = document.getElementById('new-block-title').value;
    const course = document.getElementById('new-block-course').value;
    const duration = document.getElementById('new-block-duration').value;
    const link = document.getElementById('new-block-link').value;

    if (!title) {
        alert("Please enter a title.");
        return;
    }

    const newBlock = {
        id: `local-${Date.now()}`,
        title: title,
        course: course,
        duration: duration,
        link: link,
        category: "SESSION",
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        details: { type: "text", content: "Active Planning Session" },
        status: "TODO"
    };

    const localBlocks = JSON.parse(localStorage.getItem('planner_blocks')) || [];
    localBlocks.push(newBlock);
    localStorage.setItem('planner_blocks', JSON.stringify(localBlocks));

    document.getElementById('new-block-title').value = '';
    renderBlocks();
}

function deleteBlock(id) {
    if (!confirm("Delete this block?")) return;

    if (id.startsWith('local-')) {
        let localBlocks = JSON.parse(localStorage.getItem('planner_blocks')) || [];
        localBlocks = localBlocks.filter(b => b.id !== id);
        localStorage.setItem('planner_blocks', JSON.stringify(localBlocks));
    } else {
        // Soft delete file item
        const deletedIds = JSON.parse(localStorage.getItem('deleted_file_blocks')) || [];
        deletedIds.push(id);
        localStorage.setItem('deleted_file_blocks', JSON.stringify(deletedIds));
    }
    renderBlocks();
}

function toggleFocusMode(blockId) {
    const card = document.getElementById(`block-${blockId}`);
    document.querySelectorAll('.block-card').forEach(c => {
        if (c.id !== `block-${blockId}`) c.style.opacity = '0.4';
    });

    if (card.style.opacity === '1' || card.style.opacity === '') {
        card.style.border = '1px solid var(--accent-color)';
    } else {
        document.querySelectorAll('.block-card').forEach(c => c.style.opacity = '1');
        card.style.border = '1px solid var(--border-color)';
    }
}


// --- IDEAS LOGIC ---

function renderIdeas() {
    const list = document.getElementById('ideas-list');
    const ideas = getIdeas();

    if (ideas.length === 0) {
        list.innerHTML = `<div style="font-size: 0.8rem; opacity: 0.5; padding: 1rem 0;">Empty mind, clean slate.</div>`;
        return;
    }

    list.innerHTML = ideas.map((idea, index) => `
        <div class="idea-item" style="display:flex; justify-content:space-between;">
            <span>• ${idea}</span>
            <button onclick="deleteIdea(${index})" class="delete-btn" style="color:var(--text-muted);">x</button>
        </div>
    `).join('');
}

function handleIdeaInput(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('quick-idea');
        const text = input.value.trim();
        if (!text) return;

        const local = JSON.parse(localStorage.getItem('planner_ideas')) || [];
        local.push(text);
        localStorage.setItem('planner_ideas', JSON.stringify(local));

        input.value = '';
        renderIdeas();
    }
}

function deleteIdea(index) {
    const ideas = getIdeas();
    const targetIdea = ideas[index];

    // Check if local
    let local = JSON.parse(localStorage.getItem('planner_ideas')) || [];
    const localIndex = local.indexOf(targetIdea);

    if (localIndex !== -1) {
        local.splice(localIndex, 1);
        localStorage.setItem('planner_ideas', JSON.stringify(local));
    } else {
        // Soft delete file idea
        const deletedFileIdeas = JSON.parse(localStorage.getItem('deleted_file_ideas')) || [];
        deletedFileIdeas.push(targetIdea);
        localStorage.setItem('deleted_file_ideas', JSON.stringify(deletedFileIdeas));
    }

    renderIdeas();
}
