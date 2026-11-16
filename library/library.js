// Unlisted library page: Library → area → semester → entries.
// Text lives in Markdown files with TeX formulas:
//   areas/<area>/index.md   — what is going on in this area now (optional)
//   areas/<area>/<term>.md  — entries for one semester
// To add an area or a semester, add it to AREAS below and create the .md file.
const AREAS = [
    {
        id: 'topology',
        title: 'Topology',
        terms: [
            { id: 'ws26-27', title: 'WS 26-27', subtitle: 'Topology I (teaching assistant)' }
        ]
    },
    {
        id: 'differential-geometry',
        title: 'Differential Geometry',
        terms: []
    },
    {
        id: 'algebra',
        title: 'Algebra',
        terms: []
    }
];

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));

const params = new URLSearchParams(location.search);
const area = AREAS.find(a => a.id === params.get('area'));
const term = area && area.terms.find(t => t.id === params.get('term'));

const breadcrumb = document.querySelector('.library-breadcrumb');
const view = document.getElementById('library-view');
const results = document.getElementById('library-results');
const search = document.querySelector('.library-search');
const status = document.querySelector('.library-status');
const usedIds = new Set();

const termFile = (a, t) => `areas/${a.id}/${t.id}.md`;
const areaLink = a => `?area=${encodeURIComponent(a.id)}`;
const termLink = (a, t) => `${areaLink(a)}&term=${encodeURIComponent(t.id)}`;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

function link(href, text) {
    const a = el('a', '', text);
    a.href = href;
    return a;
}

async function fetchMarkdown(file) {
    const response = await fetch(file, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`${file}: ${response.status}`);
    }
    return marked.parse(await response.text());
}

function slugify(text) {
    const base = text.toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'entry';
    let slug = base;
    for (let i = 2; usedIds.has(slug); i++) {
        slug = `${base}-${i}`;
    }
    usedIds.add(slug);
    return slug;
}

function openExternalLinksInNewTab(root) {
    root.querySelectorAll('a[href^="http"]').forEach(a => {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
    });
}

// Wrap every "###" heading and the blocks after it (up to the next heading) into an entry card.
function groupEntries(section, entryHref) {
    let entry = null;

    Array.from(section.childNodes).forEach(node => {
        const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName : '';
        if (tag === 'H1' || tag === 'H2') {
            entry = null;
            return;
        }
        if (tag === 'H3') {
            entry = el('article', 'library-entry');
            entry.id = slugify(node.textContent);
            section.insertBefore(entry, node);
            entry.appendChild(node);

            const anchor = link(entryHref(entry.id), '#');
            anchor.className = 'entry-anchor';
            anchor.title = 'Link to this entry';
            node.appendChild(anchor);
            return;
        }
        if (entry) {
            entry.appendChild(node);
        }
    });

    openExternalLinksInNewTab(section);
    return section.querySelectorAll('.library-entry').length;
}

function renderBreadcrumb() {
    const parts = [link('./', 'Library')];
    if (area) {
        parts.push(term ? link(areaLink(area), area.title) : el('span', '', area.title));
    }
    if (term) {
        parts.push(el('span', '', term.title));
    }
    if (parts.length === 1) {
        breadcrumb.hidden = true;
        return;
    }
    parts.forEach((part, i) => {
        if (i > 0) {
            breadcrumb.append(' / ');
        }
        breadcrumb.append(part);
    });
}

// Library home: one line per area.
function renderHome() {
    const list = el('ul', 'library-list');
    AREAS.forEach(a => {
        const item = el('li');
        item.append(link(areaLink(a), a.title));
        const count = a.terms.length;
        item.append(' ', el('span', 'fine-print', count ? `(${count} ${count === 1 ? 'semester' : 'semesters'})` : '(nothing yet)'));
        list.append(item);
    });
    view.append(list);
}

// Area page: free text from index.md, then the list of semesters.
async function renderArea() {
    view.append(el('h2', 'library-area-title', area.title));

    try {
        const intro = el('div', 'library-intro');
        intro.innerHTML = await fetchMarkdown(`areas/${area.id}/index.md`);
        openExternalLinksInNewTab(intro);
        view.append(intro);
    } catch (error) {
        // No intro text for this area yet.
    }

    view.append(el('h3', 'library-subheading', 'Semesters'));
    if (!area.terms.length) {
        view.append(el('p', 'library-empty', 'Nothing here yet.'));
        return;
    }
    const list = el('ul', 'library-list');
    area.terms.forEach(t => {
        const item = el('li');
        item.append(link(termLink(area, t), t.title));
        if (t.subtitle) {
            item.append(' ', el('span', 'fine-print', t.subtitle));
        }
        list.append(item);
    });
    view.append(list);
}

// Semester page: the entries themselves; search filters them in place.
async function renderTerm() {
    const section = el('section', 'library-section');
    view.append(section);
    try {
        section.innerHTML = await fetchMarkdown(termFile(area, term));
        if (!groupEntries(section, id => `#${id}`)) {
            section.append(el('p', 'library-empty', 'No entries yet.'));
        }
    } catch (error) {
        section.append(el('p', 'library-empty', `Could not load ${termFile(area, term)}.`));
    }
}

// On the home and area pages, search runs over the entries of all (or this area's) semesters.
async function loadSearchResults() {
    const scope = area ? [area] : AREAS;
    for (const a of scope) {
        for (const t of a.terms) {
            const section = el('section', 'library-section');
            const label = el('p', 'library-source');
            label.append(link(termLink(a, t), `${a.title} · ${t.title}`));
            try {
                section.innerHTML = await fetchMarkdown(termFile(a, t));
                groupEntries(section, id => `${termLink(a, t)}#${id}`);
                section.prepend(label);
                results.append(section);
            } catch (error) {
                // Skip semesters whose file is missing.
            }
        }
    }
}

function applySearch() {
    const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    const searchingElsewhere = !term;

    if (searchingElsewhere) {
        view.hidden = terms.length > 0;
        results.hidden = terms.length === 0;
    }

    const root = searchingElsewhere ? results : view;
    const entries = Array.from(root.querySelectorAll('.library-entry'));
    let visible = 0;

    entries.forEach(entry => {
        const match = terms.every(word => entry.textContent.toLowerCase().includes(word));
        entry.hidden = !match;
        if (match) {
            visible++;
        }
    });

    // Hide topic headings and whole semesters without matching entries.
    root.querySelectorAll('.library-section').forEach(section => {
        let heading = null;
        let headingHasMatch = false;
        let sectionHasMatch = false;
        const closeHeading = () => {
            if (heading) {
                heading.hidden = terms.length > 0 && !headingHasMatch;
            }
        };
        Array.from(section.children).forEach(child => {
            if (child.tagName === 'H2') {
                closeHeading();
                heading = child;
                headingHasMatch = false;
            } else if (child.classList.contains('library-entry') && !child.hidden) {
                headingHasMatch = true;
                sectionHasMatch = true;
            }
        });
        closeHeading();
        section.hidden = terms.length > 0 && !sectionHasMatch;
    });

    if (!terms.length) {
        status.textContent = term ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : '';
    } else {
        status.textContent = `${visible} of ${entries.length} entries match`;
    }
}

(async () => {
    renderBreadcrumb();

    if (term) {
        document.title = `${area.title} · ${term.title} | Library`;
        await renderTerm();
    } else if (area) {
        document.title = `${area.title} | Library`;
        await renderArea();
        await loadSearchResults();
    } else {
        renderHome();
        await loadSearchResults();
    }

    applySearch();
    search.addEventListener('input', applySearch);

    if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) {
            target.scrollIntoView();
        }
    }
})();
