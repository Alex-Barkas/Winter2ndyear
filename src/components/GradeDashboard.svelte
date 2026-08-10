<script>
    import { onMount } from 'svelte';
    import { computeCourseTotals, getGradeColor } from '../lib/grade-math.js';

    // data-service.js lives in public/js/ (not src/), since the untouched
    // legacy pages load it natively via <script type="module" src="/js/...">
    // outside Vite's bundle. This component runs through Vite/Rolldown, which
    // statically resolves any `import()` it can see in the source -- even
    // with a @vite-ignore comment -- and fails the build since public/ paths
    // aren't part of its module graph. Building the import call from a string
    // via `new Function` hides it from that static analysis entirely; at
    // runtime the browser's native dynamic import resolves the URL exactly
    // like the legacy pages' <script src="/js/data-service.js"> already does,
    // so this stays the single source of truth instead of a duplicated copy.
    const importDataService = new Function('specifier', 'return import(specifier)');
    let DataService;

    let { schemes } = $props();

    const FINAL_GRADE_COLORS = {
        'A+': '#4ade80', 'A': '#4ade80', 'A-': '#4ade80',
        'B+': '#facc15', 'B': '#facc15', 'B-': '#facc15',
        'C+': '#fb923c', 'C': '#fb923c', 'C-': '#fb923c',
        'D+': '#f87171', 'D': '#f87171', 'D-': '#f87171', 'F': '#f87171'
    };

    // Minimum numeric percentage (0-100 scale) required to earn each letter grade.
    // Used by the what-if projection to figure out what average is still needed
    // on the remaining (ungraded) weight of a course.
    const FINAL_GRADE_THRESHOLDS = {
        'A+': 90, 'A': 85, 'A-': 80,
        'B+': 77, 'B': 73, 'B-': 70,
        'C+': 67, 'C': 63, 'C-': 60,
        'D+': 57, 'D': 53, 'D-': 50, 'F': 0
    };

    let courseCode = $state(null);
    let assignments = $state([]);
    let overrides = $state([]);
    let finalGrade = $state('');
    let loaded = $state(false);
    let loadError = $state(null);
    let collapsedGroups = $state(new Set());

    onMount(async () => {
        try {
            ({ DataService } = await importDataService('/js/data-service.js'));

            const params = new URLSearchParams(window.location.search);
            courseCode = params.get('course') ? decodeURIComponent(params.get('course')) : null;
            if (courseCode) document.title = `${courseCode} Grades`;

            assignments = await DataService.getAllAssignments();
            overrides = await DataService.getGradeOverrides();
            if (courseCode) {
                finalGrade = (await DataService.getFinalGrade(courseCode)) || '';
            }
            loaded = true;
        } catch (err) {
            console.error('Error initializing grade dashboard:', err);
            loadError = 'Error loading data.';
        }
    });

    const coursesToRender = $derived(
        courseCode ? (schemes[courseCode] ? [courseCode] : []) : Object.keys(schemes)
    );

    const totalsByCourse = $derived.by(() => {
        const map = {};
        for (const course of coursesToRender) {
            const scheme = schemes[course];
            if (scheme) map[course] = computeCourseTotals(course, scheme, assignments, overrides);
        }
        return map;
    });

    const bannerAvg = $derived.by(() => {
        if (!courseCode) return null;
        const totals = totalsByCourse[courseCode];
        if (!totals || totals.currentWeight === 0) return { text: '--%', color: 'var(--text-muted)' };
        const avg = (totals.currentPoints / totals.currentWeight) * 100;
        return { text: avg.toFixed(1) + '%', color: getGradeColor(avg) };
    });

    const projection = $derived.by(() => {
        if (!courseCode || !finalGrade || FINAL_GRADE_THRESHOLDS[finalGrade] === undefined) return null;
        const totals = totalsByCourse[courseCode];
        if (!totals) return null;

        const remainingWeight = totals.totalWeight - totals.currentWeight;
        const neededPoints = (FINAL_GRADE_THRESHOLDS[finalGrade] / 100 * totals.totalWeight) - totals.currentPoints;
        const neededAvgOnRest = (neededPoints / remainingWeight) * 100;

        const warnColor = getGradeColor(0);
        const positiveColor = getGradeColor(100);

        if (remainingWeight <= 0) return { text: 'Course fully graded', color: null };
        if (neededAvgOnRest > 100) return { text: `Not achievable — need ${neededAvgOnRest.toFixed(1)}% on remaining ${remainingWeight.toFixed(1)}%`, color: warnColor };
        if (neededAvgOnRest <= 0) return { text: 'Already secured', color: positiveColor };
        return { text: `Need ${neededAvgOnRest.toFixed(1)}% on remaining ${remainingWeight.toFixed(1)}% to reach ${finalGrade}`, color: null };
    });

    function finalGradeColor() {
        return FINAL_GRADE_COLORS[finalGrade] || 'var(--text-muted)';
    }

    async function handleFinalGradeChange(e) {
        const value = e.target.value;
        finalGrade = value;
        await DataService.setFinalGrade(courseCode, value);
    }

    async function handleScoreChange(row, course, value) {
        const newScore = value === '' ? null : parseFloat(value);

        if (row.isSynced) {
            await DataService.updateAssignmentGrade(row.uniqueId, newScore);
            assignments = assignments.map(a => a.id === row.uniqueId ? { ...a, score: newScore } : a);
        } else {
            await DataService.setGradeOverride(row.uniqueId, {
                score: newScore,
                course,
                componentName: row.comp.name,
                index: row.i,
            });
            const exists = overrides.some(o => o.id === row.uniqueId);
            overrides = exists
                ? overrides.map(o => o.id === row.uniqueId ? { ...o, score: newScore } : o)
                : [...overrides, { id: row.uniqueId, score: newScore }];
        }
    }

    async function handleExcludeToggle(row, course) {
        const newValue = !row.isExcluded;

        if (row.isSynced) {
            await DataService.updateAssignmentDetails(row.uniqueId, { excluded: newValue });
            assignments = assignments.map(a => a.id === row.uniqueId ? { ...a, excluded: newValue } : a);
        } else {
            await DataService.setGradeOverride(row.uniqueId, { excluded: newValue });
            const exists = overrides.some(o => o.id === row.uniqueId);
            overrides = exists
                ? overrides.map(o => o.id === row.uniqueId ? { ...o, excluded: newValue } : o)
                : [...overrides, { id: row.uniqueId, excluded: newValue }];
        }
    }

    function toggleGroup(course, compIdx) {
        const key = `${course}-${compIdx}`;
        const next = new Set(collapsedGroups);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        collapsedGroups = next;
    }

    function rowsByComponent(course) {
        const totals = totalsByCourse[course];
        if (!totals) return new Map();
        const map = new Map();
        for (const row of totals.rows) {
            if (!map.has(row.compIdx)) map.set(row.compIdx, []);
            map.get(row.compIdx).push(row);
        }
        return map;
    }

    function componentSubtotal(rows) {
        let subtotal = 0;
        for (const r of rows) {
            if (!r.isExcluded && r.score !== null && !isNaN(r.score)) {
                subtotal += (r.score / 100) * r.effectiveUnitWeight;
            }
        }
        return subtotal;
    }
</script>

{#if courseCode}
    <div class="final-grade-banner single-course" style="display: flex;">
        <span class="final-grade-label">Final Grade</span>
        <select class="final-grade-select" style={`color:${finalGradeColor()}; border-color:${finalGradeColor()};`}
            value={finalGrade} onchange={handleFinalGradeChange}>
            <option value="">— Not set —</option>
            {#each ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'] as letter}
                <option value={letter}>{letter}</option>
            {/each}
        </select>
        <span class="banner-computed-avg">
            {#if bannerAvg}
                <span class="banner-avg-value" style={`color:${bannerAvg.color}`}>{bannerAvg.text}</span>
            {/if}
            {#if projection}
                <span class="banner-projection-text" style={projection.color ? `color:${projection.color}` : ''}>
                    {projection.text}
                </span>
            {/if}
        </span>
    </div>
{/if}

{#if loadError}
    <p style="color:red">{loadError}</p>
{:else if !loaded}
    <p class="loading-text">Loading grades...</p>
{:else if coursesToRender.length === 0}
    <p style="color:var(--text-muted); text-align:center;">No grading scheme found{courseCode ? ` for ${courseCode}` : ''}.</p>
{:else}
    {#each coursesToRender as course (course)}
        {@const totals = totalsByCourse[course]}
        {#if totals}
            {@const avg = totals.currentWeight > 0 ? (totals.currentPoints / totals.currentWeight) * 100 : null}
            {@const avgColor = avg !== null ? getGradeColor(avg) : ''}
            {@const pct = totals.totalWeight > 0 ? Math.min(100, (totals.currentWeight / totals.totalWeight) * 100) : 0}
            <div class="grade-card">
                <div class="grade-header">
                    <span class="grade-course">{course}</span>
                    <span class="grade-score" class:pending={avg === null} style={avgColor ? `color:${avgColor}` : ''}>
                        {avg !== null ? avg.toFixed(1) + '%' : '--%'}
                    </span>
                </div>
                <div class="grade-progress-track">
                    <div class="grade-progress-fill" style={`width: ${pct.toFixed(2)}%; background-color: ${avgColor || 'var(--text-muted)'};`}></div>
                </div>
                <div class="grade-progress-label">{totals.currentWeight.toFixed(0)}% of {totals.totalWeight.toFixed(0)}% graded</div>

                <div class="grade-table-header">
                    <span>Component</span>
                    <span>Weight</span>
                    <span>Grade</span>
                    <span>Contrib</span>
                </div>

                {#each schemes[course].components as comp, compIdx (compIdx)}
                    {@const compRows = rowsByComponent(course).get(compIdx) || []}
                    {@const count = comp.count || 1}
                    {#if count <= 1}
                        {#if compRows[0]}
                            {@const row = compRows[0]}
                            {@const contribStr = row.isExcluded ? '0.00%' : (row.score !== null && !isNaN(row.score) ? ((row.score / 100) * row.effectiveUnitWeight).toFixed(2) + '%' : '-')}
                            {@const scoreColor = (!row.isExcluded && row.score !== null && !isNaN(row.score)) ? getGradeColor(row.score) : ''}
                            <div class={`grade-row ${row.isExcluded ? 'excluded' : ''}`}>
                                <span title={row.linkedAssignment ? row.linkedAssignment.title : 'Manual Entry'}>
                                    {comp.name}
                                    <span class={`grade-source-badge ${row.isSynced ? 'synced' : 'manual'}`}>{row.isSynced ? 'LINKED' : 'MANUAL'}</span>
                                    {#if row.isExcluded}
                                        <span class={`grade-dropped-badge ${row.autoReason === 'auto' ? 'auto' : ''}`}>{row.autoReason === 'auto' ? 'AUTO-DROPPED' : 'DROPPED'}</span>
                                    {/if}
                                </span>
                                <span>{row.effectiveUnitWeight.toFixed(1)}%</span>
                                <input type="number" class={`grade-input ${row.isSynced ? 'synced' : ''}`}
                                    value={row.score !== null ? row.score : ''}
                                    style={scoreColor ? `color:${scoreColor}` : ''}
                                    placeholder="-"
                                    onchange={(e) => handleScoreChange(row, course, e.target.value)}>
                                <span style={scoreColor ? `color:${scoreColor}` : ''}>{contribStr}</span>
                                <button type="button" class={`grade-exclude-btn ${row.isExcluded ? 'checked' : ''}`}
                                    title={row.isExcluded ? 'Include in average' : 'Exclude from average'}
                                    onclick={() => handleExcludeToggle(row, course)}>{row.isExcluded ? '−' : ''}</button>
                            </div>
                        {/if}
                    {:else}
                        {@const key = `${course}-${compIdx}`}
                        {@const isCollapsed = collapsedGroups.has(key)}
                        {@const subtotal = componentSubtotal(compRows)}
                        <div class="grade-group">
                            <div class="grade-group-header" onclick={() => toggleGroup(course, compIdx)}>
                                <span class="grade-group-chevron">{isCollapsed ? '▸' : '▾'}</span>
                                <span class="grade-group-name">{comp.name}</span>
                                <span class="grade-group-subtotal">{subtotal.toFixed(2)}%</span>
                            </div>
                            <div class={`grade-group-rows ${isCollapsed ? 'collapsed' : ''}`}>
                                {#each compRows as row (row.uniqueId)}
                                    {@const displayName = `${comp.name} ${row.i + 1}`}
                                    {@const contribStr = row.isExcluded ? '0.00%' : (row.score !== null && !isNaN(row.score) ? ((row.score / 100) * row.effectiveUnitWeight).toFixed(2) + '%' : '-')}
                                    {@const scoreColor = (!row.isExcluded && row.score !== null && !isNaN(row.score)) ? getGradeColor(row.score) : ''}
                                    <div class={`grade-row ${row.isExcluded ? 'excluded' : ''}`}>
                                        <span title={row.linkedAssignment ? row.linkedAssignment.title : 'Manual Entry'}>
                                            {displayName}
                                            <span class={`grade-source-badge ${row.isSynced ? 'synced' : 'manual'}`}>{row.isSynced ? 'LINKED' : 'MANUAL'}</span>
                                            {#if row.isExcluded}
                                                <span class={`grade-dropped-badge ${row.autoReason === 'auto' ? 'auto' : ''}`}>{row.autoReason === 'auto' ? 'AUTO-DROPPED' : 'DROPPED'}</span>
                                            {/if}
                                        </span>
                                        <span>{row.effectiveUnitWeight.toFixed(1)}%</span>
                                        <input type="number" class={`grade-input ${row.isSynced ? 'synced' : ''}`}
                                            value={row.score !== null ? row.score : ''}
                                            style={scoreColor ? `color:${scoreColor}` : ''}
                                            placeholder="-"
                                            onchange={(e) => handleScoreChange(row, course, e.target.value)}>
                                        <span style={scoreColor ? `color:${scoreColor}` : ''}>{contribStr}</span>
                                        <button type="button" class={`grade-exclude-btn ${row.isExcluded ? 'checked' : ''}`}
                                            title={row.isExcluded ? 'Include in average' : 'Exclude from average'}
                                            onclick={() => handleExcludeToggle(row, course)}>{row.isExcluded ? '−' : ''}</button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    {/each}
{/if}
