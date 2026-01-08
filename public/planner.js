document.addEventListener('DOMContentLoaded', () => {
    renderBlocks();
    renderIdeas();
});

// --- BLOCKS LOGIC ---
function renderBlocks() {
    const container = document.getElementById('blocks-container');
    if (!container) return;

    // We read from TRACKER_DATA (from tracker.js)
    // In a real app, this might merge with local edits, but for now we follow the file.
    const blocks = TRACKER_DATA.blocks;

    if (blocks.length === 0) {
        container.innerHTML = `<div class="subtitle" style="text-align:center; padding: 3rem;">No active blocks configured in tracker.js</div>`;
        return;
    }

    container.innerHTML = blocks.map(block => createBlockCard(block)).join('');
}

function createBlockCard(block) {
    // Attempt to find linked resources from student-config.js based on course code
    const courseConfig = STUDENT_DATA.courses.find(c => c.code === block.course);
    let resourceButtons = '';

    if (courseConfig) {
        // Create standard resource buttons
        resourceButtons = `
            <a href="${courseConfig.notes}" target="_blank" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">Notes</a>
            <a href="${courseConfig.assignments}" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">Assignments</a>
        `;

        // Add specific textbook link if valid
        if (courseConfig.textbook) {
            resourceButtons += `<a href="${courseConfig.textbook}" target="_blank" class="action-btn secondary" style="font-size:0.75rem; height: 2.25rem;">Textbook</a>`;
        }
    }

    return `
        <div class="block-card" id="block-${block.id}">
            <div class="block-header">
                <span class="block-course">${block.course}</span>
                <span class="block-duration">⏱ ${block.duration}m</span>
            </div>
            <h3 class="block-title">${block.title}</h3>
            <div class="block-notes">
                ${block.notes}
            </div>
            <div class="block-actions">
                ${resourceButtons}
                <button onclick="toggleFocusMode('${block.id}')" class="action-btn primary" style="font-size:0.75rem; height: 2.25rem; margin-left: auto;">
                    Start Focus
                </button>
            </div>
        </div>
    `;
}

function toggleFocusMode(blockId) {
    // Visual toggle for now
    const card = document.getElementById(`block-${blockId}`);
    // Reset others
    document.querySelectorAll('.block-card').forEach(c => {
        if (c.id !== `block-${blockId}`) c.style.opacity = '0.4';
    });

    if (card.style.opacity === '1' || card.style.opacity === '') {
        card.style.border = '1px solid var(--accent-color)';
        // Maybe start a timer?
        alert("Focus Mode Started: Distractions dimmed.");
    } else {
        // Restore
        document.querySelectorAll('.block-card').forEach(c => c.style.opacity = '1');
        card.style.border = '1px solid var(--border-color)';
    }
}


// --- IDEAS / SCRATCHPAD LOGIC ---

// Merges file-based ideas with local-storage ideas
function getIdeas() {
    // File Ideas
    const fileIdeas = TRACKER_DATA.ideas || [];

    // Local Ideas
    const local = JSON.parse(localStorage.getItem('planner_ideas')) || [];

    return [...fileIdeas, ...local];
}

function renderIdeas() {
    const list = document.getElementById('ideas-list');
    const ideas = getIdeas();

    if (ideas.length === 0) {
        list.innerHTML = `<div style="font-size: 0.8rem; opacity: 0.5; padding: 1rem 0;">Empty mind, clean slate.</div>`;
        return;
    }

    list.innerHTML = ideas.map(idea => `
        <div class="idea-item">
            • ${idea}
        </div>
    `).join('');
}

function handleIdeaInput(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('quick-idea');
        const text = input.value.trim();
        if (!text) return;

        // Save to LocalStorage
        const local = JSON.parse(localStorage.getItem('planner_ideas')) || [];
        local.push(text);
        localStorage.setItem('planner_ideas', JSON.stringify(local));

        input.value = '';
        renderIdeas();
    }
}
