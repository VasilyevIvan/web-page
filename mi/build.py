#!/usr/bin/env python3
"""Build mi/data/items.json for the Mathematical Intelligencer library page.

Downloads the journal's metadata from Crossref (titles, authors, volume,
issue, DOI; the journal's full texts are on Springer), detects each item's
type (article, column, review, ...) from its title, and attaches the topic
labels, which were assigned by hand from the titles.

Labels come from mi/labels.txt (one line per item: "<doi> <codes>"), or, for
items missing there, from a previous mi/data/items.json. Codes:
  H P C F A L R E S   topic rubrics (see RUBRICS)
  NT, GT, AG, ...     arXiv math classes; they imply "M" (Mathematics itself)
  =rev, =int, ...     correct the detected type (see TYPES)
  @tour, @stamp       put the item in a column (see COLUMN_CODES)

Usage:  python3 mi/build.py            # fetch what's missing, rebuild json
        python3 mi/build.py --offline  # only use the cache
Then run mi/crypt.mjs: only the encrypted items.enc is committed.
Standard library only.
"""
import html, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache" / "crossref.json"
LABELS = HERE / "labels.txt"
OUT = HERE / "data" / "items.json"
ISSN = "0343-6993"

RUBRICS = {
    "H": "History of mathematics", "P": "People", "C": "Community & profession",
    "F": "Philosophy & foundations", "A": "Mathematics & art", "L": "Mathematics in culture",
    "R": "Puzzles & recreations", "E": "Education & popularization", "S": "Mathematics & the sciences",
    "M": "Mathematics itself",
}
MATH = {
    "AC": "Commutative Algebra", "AG": "Algebraic Geometry", "AP": "Analysis of PDEs", "AT": "Algebraic Topology",
    "CA": "Classical Analysis and ODEs", "CO": "Combinatorics", "CT": "Category Theory", "CV": "Complex Variables",
    "DG": "Differential Geometry", "DS": "Dynamical Systems", "FA": "Functional Analysis", "GN": "General Topology",
    "GR": "Group Theory", "GT": "Geometric Topology", "IT": "Information Theory", "LO": "Logic",
    "MG": "Metric Geometry", "MP": "Mathematical Physics", "NA": "Numerical Analysis", "NT": "Number Theory",
    "OA": "Operator Algebras", "OC": "Optimization and Control", "PR": "Probability", "RA": "Rings and Algebras",
    "RT": "Representation Theory", "SG": "Symplectic Geometry", "SP": "Spectral Theory", "ST": "Statistics",
}
TYPES = {
    "art": "Article", "col": "Column", "rev": "Book review", "int": "Interview", "opi": "Opinion",
    "let": "Letter", "obi": "Obituary", "poe": "Poetry", "fic": "Stories & humor", "edi": "Editorial",
    "new": "News & notices",
}
COLUMNS = [  # (regex on the lowercased title, column name)
    (r"^(the )?mathematical tourist", "The Mathematical Tourist"),
    (r"^(50 (&|and) 100 )?years ago", "Years Ago"),
    (r"^mathematical entertai", "Mathematical Entertainments"),
    (r"^(the )?stamp corner", "Stamp Corner"),
    (r"^mathematical communities", "Mathematical Communities"),
    (r"^mathematically bent", "Mathematically Bent"),
    (r"^problem( corner)?$", "Problem Corner"),
    (r"^mathematical gems and curiosities", "Mathematical Gems and Curiosities"),
    (r"^old intelligencer", "Old Intelligencer"),
    (r"^the evidence", "The Evidence"),
    (r"^new and noteworthy", "New and Noteworthy"),
    (r"^the philamath", "The Philamath's Alphabet"),
    (r"^tales of forgotten genius", "Tales of Forgotten Genius"),
]
# Column pieces since the 2000s carry their own titles, so labels name the column.
COLUMN_CODES = {"tour": "The Mathematical Tourist", "stamp": "Stamp Corner"}
# Topic for items whose title says nothing beyond the column or genre name.
DEFAULT_TOPIC = {
    "Years Ago": ["H"], "Mathematical Entertainments": ["R"], "Problem Corner": ["R"],
    "The Mathematical Tourist": ["L"], "Stamp Corner": ["L"], "The Philamath's Alphabet": ["L"],
    "Mathematical Communities": ["C"], "Old Intelligencer": ["H"], "Tales of Forgotten Genius": ["H", "P"],
    "Mathematically Bent": ["L"], "let": ["C"], "opi": ["C"], "edi": ["C"], "obi": ["P"], "int": ["P"],
}
BOOKINFO = re.compile(r"\b(ISBN|PP\.|pp\.|US\$|£|€|EUR|hardcover|paperback|press|verlag|springer|publish)", re.I)


def clean(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


def fetch(offline):
    if CACHE.exists():
        return json.loads(CACHE.read_text(encoding="utf-8"))
    if offline:
        sys.exit("no cached Crossref data; run without --offline")
    items, cursor = [], "*"
    while True:
        q = urllib.parse.urlencode({"rows": 1000, "cursor": cursor})
        with urllib.request.urlopen(f"https://api.crossref.org/journals/{ISSN}/works?{q}", timeout=120) as r:
            m = json.load(r)["message"]
        items += m["items"]
        print(f"crossref: {len(items)} / {m['total-results']}")
        if not m["items"] or len(items) >= m["total-results"]:
            break
        cursor = m["next-cursor"]
        time.sleep(1)
    CACHE.parent.mkdir(exist_ok=True)
    CACHE.write_text(json.dumps(items), encoding="utf-8")
    return items


def detect_type(title, sub):
    """(type code, column name or None) from the title alone."""
    lt = title.lower()
    if re.match(r"^(letters?|letters to the editors?|letter to the editors?)\b", lt):
        return "let", None
    if re.match(r"^(reviews?|book reviews?|about books|books? received)$", lt):
        return "rev", None
    if sub and BOOKINFO.search(sub) or re.search(
            r" (?:by|edited by) (?:[A-Z][\w\-’']*\.? ){1,4}[A-Z][\w\-’']+(?:,| and |$)", title):
        return "rev", None
    for rx, name in COLUMNS:
        if re.match(rx, lt):
            return "col", name
    if re.search(r"mathematical touris[mt]", lt):
        return "col", "The Mathematical Tourist"
    if re.search(r"\bstamps?\b|philately", lt):
        return "col", "Stamp Corner"
    if re.match(r"^(opinion|viewpoint)\b", lt):
        return "opi", None
    if re.match(r"^editorial", lt) or lt in ("dedication", "introduction", "preface"):
        return "edi", None
    if re.search(r"\b(obituary|in memoriam)\b", lt):
        return "obi", None
    if re.search(r"\b(interview|conversation with|in conversation|talks? with)\b", lt):
        return "int", None
    if re.search(r"\b(poems?|poetry|sonnet|verses?|haiku|limerick|villanelle|ode to)\b", lt):
        return "poe", None
    if re.match(r"^(news|announcements?|erratum|errata|correction|report|notes?)$", lt):
        return "new", None
    return "art", None


def load_labels():
    labels = {}
    if OUT.exists():  # earlier build: keeps labels when labels.txt is absent
        for x in json.loads(OUT.read_text(encoding="utf-8"))["items"]:
            col = [f"@{k}" for k, v in COLUMN_CODES.items() if v == x["column"]]
            labels[x["doi"].lower()] = x["topics"] + ["=" + x["type"]] + col if x.get("labelled") else None
    if LABELS.exists():
        for line in LABELS.read_text(encoding="utf-8").splitlines():
            doi, *codes = line.split()
            labels[doi.lower()] = codes
    return {k: v for k, v in labels.items() if v is not None}


def main():
    raw = [x for x in fetch("--offline" in sys.argv) if x.get("type") == "journal-article"]
    labels = load_labels()
    items, unlabelled = [], 0
    for x in sorted(raw, key=lambda x: (x["issued"]["date-parts"][0] + [0, 0])[:3]):
        title = clean((x.get("title") or [""])[0])
        sub = clean((x.get("subtitle") or [""])[0])
        kind, column = detect_type(title, sub)
        codes = labels.get(x["DOI"].lower())
        topics = []
        if codes:
            for c in codes:
                if c.startswith("@"):
                    kind, column = "col", COLUMN_CODES[c[1:]]
                elif c.startswith("="):
                    kind = c[1:] if not column else kind
                elif c in RUBRICS or c in MATH:
                    topics.append(c)
        else:
            unlabelled += 1
            topics = list(DEFAULT_TOPIC.get(column or kind, []))
        authors = [clean(" ".join(filter(None, [a.get("given"), a.get("family")]))) or clean(a.get("name"))
                   for a in x.get("author", [])]
        if not column and kind in ("fic", "poe") and ("Colin Adams" in authors or "Colin C. Adams" in authors
                                                     or sub.startswith("Edited by Colin Adams")):
            column = "Mathematically Bent"  # Colin Adams's humor column
        if any(c in MATH for c in topics) and "M" not in topics:
            topics.append("M")
        items.append({
            "doi": x["DOI"], "title": title, "sub": "" if BOOKINFO.search(sub) else sub,
            "authors": authors,
            "year": x["issued"]["date-parts"][0][0], "vol": x.get("volume", ""), "issue": x.get("issue", ""),
            "page": x.get("page", ""), "type": kind, "column": column, "topics": topics, "labelled": bool(codes),
        })
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps({"generated": time.strftime("%Y-%m-%d"), "rubrics": RUBRICS, "math": MATH,
                               "types": TYPES, "items": items}, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(items)} items to {OUT} ({unlabelled} without hand labels)")


if __name__ == "__main__":
    main()
