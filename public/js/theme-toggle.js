// Site-wide light/dark toggle. The <html data-theme> attribute itself is set
// synchronously in BaseLayout.astro's blocking head script (before first
// paint); this module only wires up the click behavior.
//
// Toggling reloads the page rather than flipping the attribute live. Several
// pages (assignments, calendar, gpa) bake category/course colors into inline
// style="" strings computed by JS at render time (see ui-utils.js's
// categoryColor()/hashCourseColor()) -- a live attribute flip wouldn't
// re-render those without a parallel "re-render everything on theme change"
// event wired through every list page. A reload re-runs that render logic
// once, against the now-correct attribute, for free.

function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function wire(btn) {
    btn.addEventListener('click', () => {
        const next = currentTheme() === 'light' ? 'dark' : 'light';
        try {
            localStorage.setItem('theme', next);
        } catch (e) {
            // Private browsing / storage disabled -- the click still applies
            // for this load via the attribute below, it just won't persist.
        }
        document.documentElement.setAttribute('data-theme', next);
        location.reload();
    });
}

document.querySelectorAll('.theme-toggle').forEach(wire);
