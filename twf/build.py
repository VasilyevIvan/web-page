#!/usr/bin/env python3
"""Build twf/data/weeks.json for the TWF library page.

Downloads John Baez's "This Week's Finds in Mathematical Physics"
(weeks 1-300, 1993-2010) from math.ucr.edu, caches the raw HTML in
twf/cache/, and tags every week with arXiv subject classes. A class's
score is its keyword density in the issue plus a bonus for every cited
arXiv paper in that class (old-style IDs like hep-th/9301028 carry it).

Usage:  python3 twf/build.py            # fetch what's missing, rebuild json
        python3 twf/build.py --offline  # only use the cache
Then run twf/encrypt.mjs: only the encrypted weeks.enc is committed.
Standard library only.
"""
import html, json, re, sys, time, urllib.request
from pathlib import Path

BASE = "https://math.ucr.edu/home/baez/"
HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache"
OUT = HERE / "data" / "weeks.json"
LAST_WEEK = 300

# arXiv subject class -> (name, keywords). Keywords are lowercase and
# matched as whole words / phrases. Codes follow https://arxiv.org/category_taxonomy
TAXONOMY = {
    # Mathematics
    "math.AG": ("Algebraic Geometry", ["algebraic geometry", "scheme", "schemes", "algebraic variety",
               "algebraic varieties", "motive", "motives", "moduli space", "moduli spaces", "elliptic curve",
               "elliptic curves", "riemann surface", "riemann surfaces", "grothendieck"]),
    "math.AT": ("Algebraic Topology", ["homotopy", "homology", "cohomology", "fibration", "loop space",
               "loop spaces", "k-theory", "cobordism", "simplicial", "postnikov", "stable homotopy",
               "elliptic cohomology", "homotopy hypothesis"]),
    "math.CO": ("Combinatorics", ["combinatorics", "combinatorial", "species", "generating function",
               "generating functions", "partitions", "catalan", "graph theory"]),
    "math.CT": ("Category Theory", ["category", "categories", "functor", "functors", "natural transformation",
               "monoidal", "adjoint", "adjunction", "topos", "topoi", "yoneda", "operad", "operads",
               "n-category", "n-categories", "2-category", "2-categories", "bicategory", "bicategories",
               "higher category", "higher categories", "categorification", "categorified", "2-group", "2-groups",
               "groupoid", "groupoids", "string diagram", "string diagrams", "frobenius algebra",
               "frobenius algebras", "2-vector space", "2-vector spaces", "higher-dimensional algebra",
               "cartesian closed", "tensor category", "tensor categories"]),
    "math.DG": ("Differential Geometry", ["differential geometry", "curvature", "holonomy", "fiber bundle",
               "fiber bundles", "principal bundle", "riemannian", "gerbe", "gerbes"]),
    "math.GR": ("Group Theory", ["finite group", "finite groups", "sporadic", "monster", "moonshine",
               "coxeter", "symmetry group", "symmetric group"]),
    "math.GT": ("Geometric Topology", ["knot", "knots", "link invariant", "jones polynomial", "braid", "braids",
               "3-manifold", "3-manifolds", "4-manifold", "4-manifolds", "vassiliev", "tangle", "tangles",
               "donaldson", "seiberg-witten"]),
    "math.HO": ("History and Overview", ["biography", "obituary", "history of mathematics", "history of physics",
               "chronology", "prehistory"]),
    "math.LO": ("Logic", ["logic", "type theory", "lambda calculus", "set theory", "godel", "gödel",
               "computability", "proof theory"]),
    "math.MG": ("Metric Geometry", ["polytope", "polytopes", "lattice", "lattices", "leech", "platonic",
               "icosahedron", "dodecahedron", "tiling", "tilings", "sphere packing", "kissing number",
               "projective geometry"]),
    "math.MP": ("Mathematical Physics", ["mathematical physics", "lagrangian", "hamiltonian",
               "classical mechanics", "statistical mechanics", "thermodynamics", "entropy",
               "electrical circuit", "electrical circuits", "bond graph", "bond graphs"]),
    "math.NT": ("Number Theory", ["number theory", "modular form", "modular forms", "zeta function",
               "riemann hypothesis", "prime number", "prime numbers", "galois", "langlands", "p-adic",
               "adele", "adeles", "fermat"]),
    "math.OA": ("Operator Algebras", ["von neumann", "c*-algebra", "c*-algebras", "operator algebra",
               "subfactor", "subfactors", "noncommutative geometry", "connes"]),
    "math.PR": ("Probability", ["probability", "stochastic", "markov", "random walk", "brownian"]),
    "math.QA": ("Quantum Algebra", ["quantum group", "quantum groups", "hopf algebra", "hopf algebras",
               "yang-baxter", "r-matrix", "quasitriangular", "vertex operator", "tqft", "tqfts",
               "topological quantum field theory"]),
    "math.RA": ("Rings and Algebras", ["octonion", "octonions", "quaternion", "quaternions", "division algebra",
               "division algebras", "jordan algebra", "jordan algebras", "clifford algebra", "clifford algebras",
               "nonassociative"]),
    "math.RT": ("Representation Theory", ["lie group", "lie groups", "lie algebra", "lie algebras", "e8", "e7",
               "e6", "g2", "f4", "dynkin", "root system", "weyl group", "kac-moody", "representation theory"]),
    "math.SG": ("Symplectic Geometry", ["symplectic", "poisson manifold", "moment map", "geometric quantization"]),
    # Physics and beyond
    "hep-th": ("High Energy Physics – Theory", ["string theory", "superstring", "superstrings", "m-theory",
              "d-brane", "d-branes", "ads/cft", "calabi-yau", "mirror symmetry", "supersymmetry",
              "supergravity", "conformal field theory", "chern-simons", "gauge theory", "yang-mills"]),
    "hep-ph": ("High Energy Physics – Phenomenology", ["standard model", "quark", "quarks", "neutrino",
              "neutrinos", "higgs", "grand unified", "lepton", "leptons", "particle physics"]),
    "gr-qc": ("General Relativity and Quantum Cosmology", ["general relativity", "black hole", "black holes",
             "quantum gravity", "loop quantum gravity", "spin network", "spin networks", "spin foam",
             "spin foams", "ashtekar", "barrett-crane", "ponzano-regge", "wheeler-dewitt", "spacetime",
             "gravitational wave", "gravitational waves"]),
    "cond-mat": ("Condensed Matter", ["condensed matter", "graphene", "crystal", "crystals", "quasicrystal",
                "quasicrystals", "superconductor", "superconductivity", "semiconductor", "phase transition",
                "phase transitions", "solid state", "anyons", "bose-einstein"]),
    "quant-ph": ("Quantum Physics", ["quantum mechanics", "quantum theory", "quantum computation",
                "quantum computer", "quantum computers", "entanglement", "hilbert space", "decoherence",
                "quantum information", "qubit", "qubits", "bell's inequality"]),
    "astro-ph": ("Astrophysics", ["astronomy", "cosmology", "big bang", "dark energy", "dark matter",
                "inflation", "telescope", "galaxy", "galaxies", "supernova", "pulsar", "pulsars",
                "hubble", "comet", "solar system", "lagrange point", "lagrange points", "orbit", "orbits",
                "mars", "jupiter", "saturn", "venus", "mercury", "neutron star", "neutron stars",
                "quark star", "asteroid", "asteroids"]),
    "q-bio": ("Quantitative Biology", ["biology", "ecology", "chemical reaction", "chemical reactions",
             "petri net", "petri nets", "biochemistry"]),
    "physics.ao-ph": ("Atmospheric and Oceanic Physics", ["climate", "global warming", "climate change"]),
}

# Pre-2007 arXiv archives that were later merged into a TAXONOMY class.
OLD_ARCHIVES = {"q-alg": "math.QA", "alg-geom": "math.AG", "dg-ga": "math.DG", "math-ph": "math.MP",
                "math.QG": "math.QA", "hep-lat": "hep-ph", "hep-ex": "hep-ph"}
ARXIV_ID = re.compile(r"(?<![\w.-])([a-z]+(?:-[a-z]+)?(?:\.[A-Z]{2})?)/\d{7}\b")
CITE_WEIGHT = 1.5     # score per cited arXiv paper of a class
TAG_THRESHOLD = 1.0   # min score for a class to count
MAX_TAGS = 4          # keep at most this many classes per week (strongest first)


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


def split_week(raw):
    """(header text, body text) of a week page."""
    head, _, body = raw.partition("END HEADER")
    return to_text(head), to_text(body.removeprefix(" -->"))


def summarize(body, limit=320):
    """Opening sentences of the issue, cut at a sentence end near `limit`."""
    if len(body) <= limit:
        return body
    cut = max(body.rfind(". ", 0, limit), body.rfind("? ", 0, limit), body.rfind("! ", 0, limit))
    return body[:cut + 1] if cut > limit // 3 else body[:limit].rsplit(" ", 1)[0] + "…"


DATE_RE = re.compile(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+"
                     r"(19\d\d|20[01]\d)\b")
MONTHS = {m: i + 1 for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}


def find_date(text):
    m = DATE_RE.search(text[:3000])
    return f"{m.group(3)}-{MONTHS[m.group(1)]:02d}-{int(m.group(2)):02d}" if m else None


def classify(text):
    """Score each class by keyword hits per 1000 words plus cited arXiv papers; return the top ones."""
    low = text.lower()
    per_k = 1000 / max(len(low.split()), 1)
    scores = {}
    for code, (_, words) in TAXONOMY.items():
        hits = sum(len(re.findall(r"(?<![\w-])" + re.escape(w) + r"(?![\w-])", low)) for w in words)
        scores[code] = hits * per_k
    for archive in ARXIV_ID.findall(text):
        code = OLD_ARCHIVES.get(archive, archive)
        if code in scores:
            scores[code] += CITE_WEIGHT
    ranked = sorted(((v, k) for k, v in scores.items() if v >= TAG_THRESHOLD), reverse=True)
    return [k for _, k in ranked[:MAX_TAGS]]


def main():
    offline = "--offline" in sys.argv
    weeks = []
    for n in range(1, LAST_WEEK + 1):
        try:
            raw = fetch(f"week{n}.html", offline)
        except Exception as e:
            print(f"week {n}: {e}", file=sys.stderr)
            continue
        if not raw:
            continue
        head, body = split_week(raw)
        weeks.append({
            "n": n,
            "date": find_date(head) or find_date(body),
            "summary": summarize(body),
            "topics": classify(body),
            "url": f"{BASE}week{n}.html",
            "words": len(body.split()),
        })
        print(f"week {n}: {', '.join(weeks[-1]['topics']) or '-'}")
    OUT.write_text(json.dumps({"generated": time.strftime("%Y-%m-%d"),
                               "topics": {code: name for code, (name, _) in TAXONOMY.items()},
                               "weeks": weeks},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(weeks)} weeks to {OUT}")


if __name__ == "__main__":
    main()
