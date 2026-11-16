// Unlisted library page: renders Markdown files with TeX formulas.
// To add a new course, create its .md file next to this script and list it here.
const SECTIONS = [
    'topology-1.md'
];

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));

const content = document.getElementById('library-content');
const search = document.querySelector('.library-search');
const status = document.querySelector('.library-status');
const usedIds = new Set();

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

// Wrap every "###" heading and the blocks after it (up to the next heading) into an entry card.
function groupEntries(section) {
    const nodes = Array.from(section.childNodes);
    let entry = null;

    nodes.forEach(node => {
        const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName : '';
        if (tag === 'H1' || tag === 'H2') {
            entry = null;
            return;
        }
        if (tag === 'H3') {
            entry = document.createElement('article');
            entry.className = 'library-entry';
            entry.id = slugify(node.textContent);
            section.insertBefore(entry, node);
            entry.appendChild(node);

            const anchor = document.createElement('a');
            anchor.className = 'entry-anchor';
            anchor.href = `#${entry.id}`;
            anchor.textContent = '#';
            anchor.title = 'Link to this entry';
            node.appendChild(anchor);
            return;
        }
        if (entry) {
            entry.appendChild(node);
        }
    });

    section.querySelectorAll('.library-entry a[href^="http"]').forEach(link => {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    });

    if (!section.querySelector('.library-entry')) {
        const empty = document.createElement('p');
        empty.className = 'library-empty';
        empty.textContent = 'No entries yet.';
        section.appendChild(empty);
    }
}

async function loadSection(file) {
    const section = document.createElement('section');
    section.className = 'library-section';
    content.appendChild(section);

    try {
        const response = await fetch(file, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(response.status);
        }
        section.innerHTML = marked.parse(await response.text());
        groupEntries(section);
    } catch (error) {
        section.innerHTML = `<p class="library-empty">Could not load ${file}.</p>`;
    }
}

function applySearch() {
    const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    const entries = Array.from(document.querySelectorAll('.library-entry'));
    let visible = 0;

    entries.forEach(entry => {
        const text = entry.textContent.toLowerCase();
        const match = terms.every(term => text.includes(term));
        entry.hidden = !match;
        if (match) {
            visible++;
        }
    });

    // Hide topic headings (and whole sections) that have no matching entries.
    document.querySelectorAll('.library-section').forEach(section => {
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

    status.textContent = terms.length
        ? `${visible} of ${entries.length} entries match`
        : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
}

(async () => {
    for (const file of SECTIONS) {
        await loadSection(file);
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
