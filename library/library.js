// Unlisted library page: Library → area → semester → post → entries.
// Text lives in Markdown files with TeX formulas:
//   areas/<area>/index.md          — what is going on in this area now (optional)
//   areas/<area>/<term>.md         — short text on the semester page (optional)
//   areas/<area>/<term>/<post>.md  — a post; "###" starts an entry inside it
// To add an area, a semester or a post, add it to AREAS below and create the .md file.
const AREAS = [
    {
        id: 'topology',
        title: 'Topology',
        terms: [
            {
                id: 'ws26-27',
                title: 'WS 26-27',
                subtitle: 'Topology I (teaching assistant)',
                posts: [
                    { id: 'sheet-0', title: 'Sheet 0', subtitle: 'Topological spaces' },
                    { id: 'sheet-1', title: 'Sheet 1' },
                    { id: 'sheet-2', title: 'Sheet 2' },
                    { id: 'sheet-3', title: 'Sheet 3' },
                    { id: 'sheet-4', title: 'Sheet 4' }
                ]
            }
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
const post = term && term.posts.find(p => p.id === params.get('post'));

const breadcrumb = document.querySelector('.library-breadcrumb');
const view = document.getElementById('library-view');
const results = document.getElementById('library-results');
const search = document.querySelector('.library-search');
const status = document.querySelector('.library-status');
const usedIds = new Set();

const postFile = (a, t, p) => `areas/${a.id}/${t.id}/${p.id}.md`;
const areaLink = a => `?area=${encodeURIComponent(a.id)}`;
const termLink = (a, t) => `${areaLink(a)}&term=${encodeURIComponent(t.id)}`;
const postLink = (a, t, p) => `${termLink(a, t)}&post=${encodeURIComponent(p.id)}`;

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

// Optional text block (area intro, semester intro): silently skipped if the file is missing.
async function appendIntro(file) {
    try {
        const intro = el('div', 'library-intro');
        intro.innerHTML = await fetchMarkdown(file);
        openExternalLinksInNewTab(intro);
        view.append(intro);
    } catch (error) {
        // No text for this page yet.
    }
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

// Wrap every "###" heading and the blocks after it (up to the next heading) into an entry.
// A paragraph starting with "Source:" or "Sources:" is styled as the source line and moved to the end.
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

    section.querySelectorAll('.library-entry').forEach(entryNode => {
        Array.from(entryNode.children)
            .filter(child => child.tagName === 'P' && /^Sources?:/.test(child.textContent.trim()))
            .forEach(sources => {
                sources.classList.add('entry-sources');
                entryNode.appendChild(sources);
            });
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
        parts.push(post ? link(termLink(area, term), term.title) : el('span', '', term.title));
    }
    if (post) {
        parts.push(el('span', '', post.title));
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

function renderList(items) {
    const list = el('ul', 'library-list');
    items.forEach(({ href, title, note }) => {
        const item = el('li');
        item.append(link(href, title));
        if (note) {
            item.append(' ', el('span', 'fine-print', note));
        }
        list.append(item);
    });
    view.append(list);
}

// Library home: one line per area.
function renderHome() {
    renderList(AREAS.map(a => {
        const count = a.terms.length;
        return {
            href: areaLink(a),
            title: a.title,
            note: count ? `(${count} ${count === 1 ? 'semester' : 'semesters'})` : '(nothing yet)'
        };
    }));
}

// Area page: free text from index.md, then the list of semesters.
async function renderArea() {
    view.append(el('h2', 'library-area-title', area.title));
    await appendIntro(`areas/${area.id}/index.md`);

    view.append(el('h3', 'library-subheading', 'Semesters'));
    if (!area.terms.length) {
        view.append(el('p', 'library-empty', 'Nothing here yet.'));
        return;
    }
    renderList(area.terms.map(t => ({ href: termLink(area, t), title: t.title, note: t.subtitle })));
}

// Semester page: optional text, then the list of posts.
async function renderTerm() {
    await appendIntro(`areas/${area.id}/${term.id}.md`);

    view.append(el('h3', 'library-subheading', 'Posts'));
    if (!term.posts.length) {
        view.append(el('p', 'library-empty', 'Nothing here yet.'));
        return;
    }
    renderList(term.posts.map(p => ({ href: postLink(area, term, p), title: p.title, note: p.subtitle })));
}

// Post page: the entries themselves; search filters them in place.
async function renderPost() {
    const section = el('section', 'library-section');
    view.append(section);
    try {
        section.innerHTML = await fetchMarkdown(postFile(area, term, post));
        if (!groupEntries(section, id => `#${id}`)) {
            section.append(el('p', 'library-empty', 'No entries yet.'));
        }
    } catch (error) {
        section.append(el('p', 'library-empty', `Could not load ${postFile(area, term, post)}.`));
    }
}

// On every page except a post, search runs over the entries of all posts below it.
async function loadSearchResults() {
    const scope = [];
    (area ? [area] : AREAS).forEach(a => {
        (term ? [term] : a.terms).forEach(t => {
            t.posts.forEach(p => scope.push([a, t, p]));
        });
    });

    for (const [a, t, p] of scope) {
        const section = el('section', 'library-section');
        const label = el('p', 'library-source');
        label.append(link(postLink(a, t, p), `${a.title} · ${t.title} · ${p.title}`));
        try {
            section.innerHTML = await fetchMarkdown(postFile(a, t, p));
            groupEntries(section, id => `${postLink(a, t, p)}#${id}`);
            section.prepend(label);
            results.append(section);
        } catch (error) {
            // Skip posts whose file is missing.
        }
    }
}

function applySearch() {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    const searchingBelow = !post;

    if (searchingBelow) {
        view.hidden = words.length > 0;
        results.hidden = words.length === 0;
    }

    const root = searchingBelow ? results : view;
    const entries = Array.from(root.querySelectorAll('.library-entry'));
    let visible = 0;

    entries.forEach(entry => {
        const match = words.every(word => entry.textContent.toLowerCase().includes(word));
        entry.hidden = !match;
        if (match) {
            visible++;
        }
    });

    // Hide topic headings and whole posts without matching entries.
    root.querySelectorAll('.library-section').forEach(section => {
        let heading = null;
        let headingHasMatch = false;
        let sectionHasMatch = false;
        const closeHeading = () => {
            if (heading) {
                heading.hidden = words.length > 0 && !headingHasMatch;
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
        section.hidden = words.length > 0 && !sectionHasMatch;
    });

    if (!words.length) {
        status.textContent = post ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : '';
    } else {
        status.textContent = `${visible} of ${entries.length} entries match`;
    }
}

(async () => {
    renderBreadcrumb();

    if (post) {
        document.title = `${post.title} · ${area.title} ${term.title} | Library`;
        await renderPost();
    } else if (term) {
        document.title = `${area.title} · ${term.title} | Library`;
        await renderTerm();
        await loadSearchResults();
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
