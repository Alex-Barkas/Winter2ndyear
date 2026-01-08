document.addEventListener('DOMContentLoaded', () => {
    populateCourseDropdown();
    renderBlocks();
    renderIdeas();
});

// --- HELPER: GET DATA POOLS ---
function getBlocks() {
    // 1. Permanent File Data
    const fileBlocks = TRACKER_DATA.blocks || [];

    // 2. Local Storage Data
    const localBlocks = JSON.parse(localStorage.getItem('planner_blocks')) || [];

    // Merge
    return [...fileBlocks, ...localBlocks];
}

function getIdeas() {
    const fileIdeas = TRACKER_DATA.ideas || [];
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
        opt.innerText = c.name; // e.g. "Linear Algebra"
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
    // Attempt to find linked resources from student-config.js
    const courseConfig = STUDENT_DATA.courses.find(c => c.code === block.course);
    let resourceButtons = '';

    if (courseConfig) {
        resourceButtons = `
            <a href="${courseConfig.notes}" target="_blank" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">Notes</a>
        `;
    }

    // Explicit Drive/External Link from User
    if (block.link) {
        resourceButtons += `<a href="${block.link}" target="_blank" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">Drive ↗</a>`;
    }

    // "View Item" Link -> Goes to details.html?id=...
    // details.html now knows how to look up local blocks.
    const viewItemBtn = `
        <a href="details.html?id=${block.id}" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">View Item</a>
    `;

    // Delete Button (Only for LocalStorage items typically, but we'll try to support all)
    // Note: We can't actually delete from tracker.js via JS. So we'll only show delete for local ones or fake it.
    // Logic: If ID starts with 'local-', it's deletable. 
    const isLocal = block.id.startsWith('local-');
    const deleteBtn = isLocal ? `
        <button onclick="deleteBlock('${block.id}')" class="delete-btn">Delete</button>
    ` : '';

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
                <button onclick="toggleFocusMode('${block.id}')" class="action-btn primary" style="font-size:0.75rem; height: 2.25rem; margin-left: auto;">
                    Focus
                </button>
            </div>
        </div>
    `;
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
        id: `local-${Date.now()}`, // Unique ID for local items
        title: title,
        course: course,
        duration: duration,
        link: link,
        category: "SESSION", // for details page defaults
        date: new Date().toISOString().split('T')[0], // Today
        time: "09:00",
        details: { type: "text", content: "Active Planning Session" }, // Standard details structure
        status: "TODO"
    };

    const localBlocks = JSON.parse(localStorage.getItem('planner_blocks')) || [];
    localBlocks.push(newBlock);
    localStorage.setItem('planner_blocks', JSON.stringify(localBlocks));

    // Clear and Reload
    document.getElementById('new-block-title').value = '';
    renderBlocks();
}

function deleteBlock(id) {
    if (!confirm("Delete this block?")) return;

    let localBlocks = JSON.parse(localStorage.getItem('planner_blocks')) || [];
    localBlocks = localBlocks.filter(b => b.id !== id);
    localStorage.setItem('planner_blocks', JSON.stringify(localBlocks));
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

    // We distinguish local vs file by... index? Or string content? 
    // For now, simple string matching.
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
    // This is tricky because indices mix file/local. 
    // We will only allow deleting LOCAL ideas for now to be safe, or we need a better ID system.
    // Simplification: We only support deleting from the LocalStorage array.

    // 1. Get stats
    const fileCount = (TRACKER_DATA.ideas || []).length;

    if (index < fileCount) {
        alert("Cannot delete permanent file ideas from UI. Edit tracker.js.");
        return;
    }

    // Adjust index for local array
    const localIndex = index - fileCount;
    let local = JSON.parse(localStorage.getItem('planner_ideas')) || [];
    local.splice(localIndex, 1);
    localStorage.setItem('planner_ideas', JSON.stringify(local));

    renderIdeas();
}
