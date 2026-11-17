# Sheet 1

<!--
How to add an entry: copy the block below, fill it in, delete what you don't need.
"###" starts an entry (one problem or one notion). Put "Sources:" as the last paragraph.
Formulas: inline $\pi_1(S^1)\cong\mathbb{Z}$, display $$ ... $$ (on its own lines).

### Entry title

Your text with $formulas$.

Sources: [MathOverflow: question title](https://mathoverflow.net/q/...) · Tags: tag one, tag two
-->

### Exercise 3: posets as categories and their adjoints

*Draft outline, to be written.*

**Exercise 3.** Let $P$ and $Q$ be two posets.

- (a) How can you turn a poset into a category?
- (b) What are isomorphisms in a poset?
- (c) What is a functor $P\to Q$?
- (d) When does a functor $f\colon P\to Q$ admit a left respectively right adjoint and how is this then given?

**1. Posets as categories.** Objects are the elements of $P$, with exactly one morphism $x\to y$ if $x\le y$ and none otherwise. Functors $P\to Q$ are monotone maps; isomorphisms are only identities, by antisymmetry.

**2. Adjoints between posets.** $f\dashv g$ means $f(p)\le q \iff p\le g(q)$. Then $g(q)=\max\{p : f(p)\le q\}$, and unit and counit are just the inequalities $p\le gf(p)$ and $fg(q)\le q$. Between complete lattices: $f$ has a right adjoint iff it preserves all joins, and a left adjoint iff it preserves all meets.

**3. Adjunctions you already know.**

- Image ⊣ preimage ⊣ $\forall_f$ for a map $f\colon X\to Y$: $f(A)\subseteq B \iff A\subseteq f^{-1}(B)$.
- Interior is right adjoint to $\mathcal{O}(X)\hookrightarrow\mathcal{P}(X)$: $U\subseteq A \iff U\subseteq \operatorname{int}A$ for $U$ open.
- Closure is left adjoint to the inclusion of closed sets: $\overline{A}\subseteq C \iff A\subseteq C$ for $C$ closed.
- For $f$ continuous, $f^{-1}\colon\mathcal{O}(Y)\to\mathcal{O}(X)$ preserves arbitrary unions, hence has a right adjoint.

**4. Back to Sheet 0.** The frame of opens as the logic of observable properties.

Sources: Topology I, Sheet 1, Exercise 3 · Tags: posets, Galois connections, adjoint functors, interior, closure
