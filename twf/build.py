#!/usr/bin/env python3
"""Build twf/data/weeks.json for the TWF library page.

Downloads John Baez's "This Week's Finds in Mathematical Physics"
(weeks 1-300, 1993-2010) from math.ucr.edu, caches the raw HTML in
twf/cache/, and tags every week with topics from TAXONOMY by keyword
counts over its full text.

Usage:  python3 twf/build.py            # fetch what's missing, rebuild json
        python3 twf/build.py --offline  # only use the cache
Standard library only.
"""
import html, json, re, sys, time, urllib.request
from pathlib import Path

BASE = "https://math.ucr.edu/home/baez/"
HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache"
OUT = HERE / "data" / "weeks.json"
LAST_WEEK = 300

# topic -> keywords (lowercase; matched as whole words / phrases)
TAXONOMY = {
    "Category theory": ["category", "categories", "functor", "functors", "natural transformation",
                        "monoidal", "adjoint", "topos", "topoi", "yoneda", "operad", "operads"],
    "Higher categories": ["n-category", "n-categories", "2-category", "2-categories", "bicategory",
                          "bicategories", "omega-category", "infinity-category", "higher category",
                          "higher categories", "homotopy hypothesis", "categorification", "categorified",
                          "2-group", "2-groups", "stabilization hypothesis"],
    "Homotopy & algebraic topology": ["homotopy", "homology", "cohomology", "spectra", "spectrum",
                                      "fibration", "loop space", "k-theory", "cobordism", "simplicial",
                                      "eilenberg", "postnikov", "stable homotopy", "elliptic cohomology"],
    "Knots & low-dim topology": ["knot", "knots", "link invariant", "jones polynomial", "braid", "braids",
                                 "3-manifold", "3-manifolds", "4-manifold", "4-manifolds", "vassiliev",
                                 "tangle", "tangles", "donaldson", "seiberg-witten"],
    "Quantum groups & Hopf algebras": ["quantum group", "quantum groups", "hopf algebra", "hopf algebras",
                                       "yang-baxter", "r-matrix", "quasitriangular"],
    "TQFT": ["tqft", "tqfts", "topological quantum field theory", "chern-simons", "turaev-viro",
             "state sum", "spin foam", "spin foams", "extended tqft"],
    "Quantum gravity": ["quantum gravity", "loop quantum gravity", "spin network", "spin networks",
                        "ashtekar", "barrett-crane", "ponzano-regge", "wheeler-dewitt"],
    "String theory": ["string theory", "superstring", "superstrings", "m-theory", "d-brane", "d-branes",
                      "ads/cft", "calabi-yau", "mirror symmetry", "duality"],
    "General relativity & cosmology": ["general relativity", "black hole", "black holes", "cosmology",
                                       "big bang", "gravitational wave", "gravitational waves",
                                       "dark energy", "dark matter", "inflation", "spacetime"],
    "Particle physics": ["standard model", "quark", "quarks", "neutrino", "neutrinos", "higgs",
                         "gauge theory", "grand unified", "gut", "supersymmetry", "lepton", "leptons"],
    "Quantum theory": ["quantum mechanics", "quantum theory", "quantum computation", "quantum computer",
                       "entanglement", "hilbert space", "decoherence", "quantum information"],
    "Lie theory & exceptional structures": ["lie group", "lie groups", "lie algebra", "lie algebras",
                                            "e8", "e7", "e6", "g2", "f4", "dynkin", "root system",
                                            "exceptional", "coxeter", "weyl group", "kac-moody"],
    "Octonions & division algebras": ["octonion", "octonions", "quaternion", "quaternions",
                                      "division algebra", "division algebras", "jordan algebra",
                                      "triality", "clifford algebra", "clifford algebras", "spinor", "spinors"],
    "Number theory": ["number theory", "modular form", "modular forms", "zeta function", "riemann hypothesis",
                      "prime", "primes", "galois", "elliptic curve", "elliptic curves", "langlands",
                      "p-adic", "adele", "adeles", "fermat"],
    "Geometry & symmetry": ["polytope", "polytopes", "lattice", "lattices", "leech", "platonic",
                            "icosahedron", "dodecahedron", "tiling", "tilings", "symmetry group",
                            "projective geometry", "klein", "moonshine", "monster"],
    "Algebraic geometry": ["algebraic geometry", "scheme", "schemes", "sheaf", "sheaves", "motive",
                           "motives", "grothendieck", "moduli space", "riemann surface", "riemann surfaces"],
    "Noncommutative geometry & operator algebras": ["noncommutative geometry", "von neumann", "c*-algebra",
                                                    "connes", "operator algebra", "subfactor", "subfactors"],
    "Combinatorics & species": ["combinatorics", "species", "generating function", "generating functions",
                                "partition", "partitions", "catalan"],
    "Logic & foundations": ["logic", "type theory", "lambda calculus", "set theory", "godel", "gödel",
                            "computability", "proof theory", "foundations"],
    "Networks, biology & environment": ["petri net", "petri nets", "network theory", "chemical reaction",
                                        "biology", "climate", "ecology", "evolution", "stochastic", "markov",
                                        "population"],
    "History & mathematicians": ["history", "historical", "biography", "obituary", "erlangen"],
    "Astronomy": ["astronomy", "telescope", "galaxy", "galaxies", "supernova", "pulsar", "pulsars",
                  "planet", "planets", "hubble", "cassini", "comet"],
}
TAG_THRESHOLD = 3   # min keyword hits for a topic to count
MAX_TAGS = 4        # keep at most this many topics per week (strongest first)


def fetch(name, offline):
    path = CACHE / name
    if path.exists():
        return path.read_text(encoding="utf-8", errors="replace")
    if offline:
        return None
    CACHE.mkdir(exist_ok=True)
    req = urllib.request.Request(BASE + name, headers={"User-Agent": "twf-library/1.0 (personal index)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        text = r.read().decode(r.headers.get_content_charset() or "latin-1", errors="replace")
    path.write_text(text, encoding="utf-8")
    time.sleep(0.5)  # be polite to math.ucr.edu
    return text


def to_text(raw):
    raw = re.sub(r"(?is)<(script|style).*?</\1>", " ", raw)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"(?s)<[^>]+>", " ", raw))).strip()


def parse_contents(raw):
    """week number -> one-line description, taken from twfcontents.html."""
    entries = {}
    links = list(re.finditer(r'(?i)<a[^>]+href="?(?:[^">]*/)?week(\d+)\.html"?[^>]*>', raw))
    for i, m in enumerate(links):
        end = links[i + 1].start() if i + 1 < len(links) else len(raw)
        n = int(m.group(1))
        desc = to_text(raw[m.end():end])
        desc = re.sub(r"^(?:week\s*\d+\s*[-:,.]*\s*)", "", desc, flags=re.I)
        if n not in entries or len(desc) > len(entries[n]):
            entries[n] = desc[:600]
    return entries


DATE_RE = re.compile(r"\b(January|February|March|April|May|June|July|August|September|October|"
                     r"November|December)\s+(\d{1,2}),?\s+(19\d\d|20[01]\d)\b")
MONTHS = {m: i + 1 for i, m in enumerate(["January", "February", "March", "April", "May", "June", "July",
                                          "August", "September", "October", "November", "December"])}


def find_date(text):
    m = DATE_RE.search(text[:2000])
    return f"{m.group(3)}-{MONTHS[m.group(1)]:02d}-{int(m.group(2)):02d}" if m else None


def classify(text):
    low = text.lower()
    scores = {}
    for topic, words in TAXONOMY.items():
        hits = sum(len(re.findall(r"(?<![\w-])" + re.escape(w) + r"(?![\w-])", low)) for w in words)
        if hits >= TAG_THRESHOLD:
            scores[topic] = hits
    return [t for t, _ in sorted(scores.items(), key=lambda kv: -kv[1])[:MAX_TAGS]]


def main():
    offline = "--offline" in sys.argv
    contents = parse_contents(fetch("twfcontents.html", offline) or "")
    weeks = []
    for n in range(1, LAST_WEEK + 1):
        try:
            raw = fetch(f"week{n}.html", offline)
        except Exception as e:
            print(f"week {n}: {e}", file=sys.stderr)
            raw = None
        text = to_text(raw) if raw else ""
        summary = contents.get(n, "")
        if not text and not summary:
            continue
        weeks.append({
            "n": n,
            "date": find_date(text) or find_date(summary),
            "summary": summary,
            "topics": classify(text or summary),
            "url": f"{BASE}week{n}.html",
            "words": len(text.split()),
        })
        print(f"week {n}: {', '.join(weeks[-1]['topics']) or '-'}")
    OUT.write_text(json.dumps({"generated": time.strftime("%Y-%m-%d"),
                               "topics": list(TAXONOMY), "weeks": weeks},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(weeks)} weeks to {OUT}")


if __name__ == "__main__":
    main()
