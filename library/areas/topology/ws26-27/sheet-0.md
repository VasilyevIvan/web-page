# Sheet 0

<!--
How to add an entry: copy the block below, fill it in, delete what you don't need.
"###" starts an entry (one problem or one notion). Put "Sources:" as the last paragraph.
Formulas: inline $\pi_1(S^1)\cong\mathbb{Z}$, display $$ ... $$ (on its own lines).

### Entry title

Your text with $formulas$.

Sources: [MathOverflow: question title](https://mathoverflow.net/q/...) · Tags: tag one, tag two
-->

[Solutions to Sheet 0 (PDF)](areas/topology/ws26-27/sheet-0-solutions.pdf)

### Exercise 5: $D^n/S^{n-1}\cong S^n$

**Exercise 5.** Show that $D^n/S^{n-1}$ and $S^n$ are homeomorphic.

**Second proof (one-point compactification).**

**Lemma.** *Let $K, K'$ be compact Hausdorff spaces, $p\in K$, $p'\in K'$, and $h\colon K\setminus\{p\}\to K'\setminus\{p'\}$ a homeomorphism. Then $h$ extends by $p\mapsto p'$ to a homeomorphism $H\colon K\to K'$.*

That is, $K$ is the one-point compactification of $K\setminus\{p\}$, which is unique up to homeomorphism.

*Proof.* Both $S^n$ and $D^n/S^{n-1}$ are compact Hausdorff. Stereographic projection and $x\mapsto \frac{x}{1-|x|}$ give

$$S^n\setminus\{*\}\cong\mathbb{R}^n\cong\operatorname{int}(D^n)\cong\left(D^n/S^{n-1}\right)\setminus\{*\},$$

so the lemma applies. $\square$

*Comments to follow.*

Sources: [Sheet 0 solutions (PDF)](areas/topology/ws26-27/sheet-0-solutions.pdf) · Tags: one-point compactification, quotient spaces, spheres, stereographic projection

### What concept does an open set axiomatise?

*Draft, to be continued.*

The question of one of the students about the nature of topological axioms again brought me to thinking about it.

There is a popular entry in StackExchange on this regard, [What concept does an open set axiomatise?](https://math.stackexchange.com/questions/31859/what-concept-does-an-open-set-axiomatise), with an excellent answer from the renowned SE and MO user [Qiaochu Yuan](https://math.stackexchange.com/users/232/qiaochu-yuan).

However, probably due to the personal taste I was not really satisfied with it, as it explains the axioms from a logical or rather theoretical computer science point of view.

I won't cite his answer here but try to think on my own, based on the physical intuition (also mentioned in one of the answers).

So, what can we (truly) understand about the World? About the nature? Assuming there is the Nature.

From now on I will be citing some lines from the book *Smooth Manifolds and Observables* written by the cousin of N. Bourbaki, Jet Nestruev.

Jet suggests the following (rather physical or, let's say, naturalistic) point of view on spaces:

The space is given as a set of states of a certain physical system. We can't understand this space, but what we can do is to do some measurements.

Then, functions become some gadgets which allow us to do these measurements, while their values are precisely results of the measurements; see the table for the continuation of this analogy.

| Physics | | Mathematics |
|---|:---:|---|
| Physics lab | $\longrightarrow$ | Commutative unital $\mathbb{R}$-algebra $A$ |
| Measuring device | $\longrightarrow$ | Element of the algebra $A$ |
| State of the observed physical system | $\longrightarrow$ | Homomorphism of unital $\mathbb{R}$-algebras $h\colon A\to\mathbb{R}$ |
| Output of the measuring device | $\longrightarrow$ | Value of this function $h(a)$, $a\in A$ |

Open sets in this point of view are properties …

From these points of view, axioms of topology …

Sources: [Math.SE: What concept does an open set axiomatise?](https://math.stackexchange.com/questions/31859/what-concept-does-an-open-set-axiomatise) · Jet Nestruev, *Smooth Manifolds and Observables* · Tags: open sets, axioms of topology, observables
