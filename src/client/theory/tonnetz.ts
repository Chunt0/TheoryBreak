// The Tonnetz: pitch classes on a triangular lattice. Right is up a 5th, up-right
// a major 3rd, down-right a minor 3rd, so every triangle is a triad (pointing up:
// major, down: minor) and neighbouring triangles share two notes. The moves
// between them are P, L and R. Pure logic (no DOM, no audio) so it can be tested.
//
// Notes are spelled by where they sit, not by key: a node's place on the line of
// fifths is (steps right) + 4 × (rows up), so the sharps grow up and to the right
// and the flats down and to the left. G♯ and A♭ are different nodes three rows
// apart: the lattice only closes up (into a torus) once you let enharmonics meet.

import { mod, noteName, pc, spellPc, type Note } from './core';

// ---------------------------------------------------------------- spelling on the line of fifths

const FIFTHS_OF_LETTER = [0, 2, 4, -1, 1, 3, 5]; // C D E F G A B
const LETTER_ON_LINE = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B

/** A note's place on the line of fifths: C 0, G 1, F −1, F♯ 6, B♭ −2. */
export const fifthsOf = (n: Note): number => FIFTHS_OF_LETTER[n.letter] + 7 * n.acc;

/** The note at a place on the line of fifths: 6 → F♯, −4 → A♭, 12 → B♯. */
export function noteAtFifths(f: number): Note {
  const k = f + 1;
  return { letter: LETTER_ON_LINE[mod(k, 7)], acc: Math.floor(k / 7) };
}

export const pcOfFifths = (f: number): number => mod(f * 7, 12);

/** How nodes are named: by place (the default), or every black key one way. */
export type Names = 'degrees' | 'spelled' | 'sharps' | 'flats';

/** The note at a place on the line of fifths, as the names ask; doubles become plain. */
export function spellFifths(f: number, names: Names): Note {
  const p = pcOfFifths(f);
  if (names === 'sharps') return spellPc(p, 'sharp');
  if (names === 'flats') return spellPc(p, 'flat');
  const n = noteAtFifths(f);
  return Math.abs(n.acc) > 1 ? spellPc(p, n.acc > 0 ? 'sharp' : 'flat') : n;
}

/** "G♯ = A♭" for a black key; a white key is only itself. */
export function enharmonic(p: number): string {
  const s = noteName(spellPc(p, 'sharp'));
  const f = noteName(spellPc(p, 'flat'));
  return s === f ? s : `${s} = ${f}`;
}

// ---------------------------------------------------------------- the lattice

export interface Node {
  /** steps right (each a 5th) */
  i: number;
  /** rows up (each a major 3rd) */
  j: number;
}
/** A triangle: pointing up (major) on the nodes (i,j) (i+1,j) (i,j+1); pointing down (minor) on (i+1,j) (i,j+1) (i+1,j+1). */
export interface Tri {
  i: number;
  j: number;
  up: boolean;
}

/** A node's distance along the line of fifths from the centre: a 5th is 1, a major 3rd 4. */
export const nodeFifths = (n: Node): number => n.i + 4 * n.j;
/** Pitch class of a node, with `centrePc` in the middle. */
export const nodePc = (n: Node, centrePc: number): number => mod(centrePc + 7 * n.i + 4 * n.j, 12);
/** Where a node is drawn, in triangle sides: x right, y up (rows are √3/2 apart on screen). */
export const nodeX = (n: Node): number => n.i + n.j / 2;

export const triNodes = (t: Tri): [Node, Node, Node] =>
  t.up
    ? [{ i: t.i, j: t.j }, { i: t.i + 1, j: t.j }, { i: t.i, j: t.j + 1 }]
    : [{ i: t.i + 1, j: t.j }, { i: t.i, j: t.j + 1 }, { i: t.i + 1, j: t.j + 1 }];

/** The triangle's root, 3rd and 5th. */
export function triRoles(t: Tri): { root: Node; third: Node; fifth: Node } {
  return t.up
    ? { root: { i: t.i, j: t.j }, third: { i: t.i, j: t.j + 1 }, fifth: { i: t.i + 1, j: t.j } }
    : { root: { i: t.i, j: t.j + 1 }, third: { i: t.i + 1, j: t.j }, fifth: { i: t.i + 1, j: t.j + 1 } };
}

/** The middle of a triangle, in the same units as nodeX / j. */
export const triCentre = (t: Tri): { x: number; y: number } =>
  t.up ? { x: t.i + t.j / 2 + 0.5, y: t.j + 1 / 3 } : { x: t.i + t.j / 2 + 1, y: t.j + 2 / 3 };

export const triKey = (t: Tri): string => `${t.i},${t.j},${t.up ? 'u' : 'd'}`;
export const sameTri = (a: Tri, b: Tri): boolean => a.i === b.i && a.j === b.j && a.up === b.up;

export const triPcs = (t: Tri, centrePc: number): number[] => triNodes(t).map((n) => nodePc(n, centrePc));

// ---------------------------------------------------------------- triads

/** A major or minor triad, its root placed on the line of fifths (so it is spelled). */
export interface Triad {
  root: number;
  minor: boolean;
}

/** The triad a triangle holds, spelled from a centre note. */
export const triTriad = (t: Tri, centreFifths: number): Triad => ({ root: centreFifths + nodeFifths(triRoles(t).root), minor: !t.up });

/** Root, 3rd, 5th on the line of fifths: a major 3rd is 4 fifths up, a minor 3rd 3 down. */
export const triadFifths = (t: Triad): [number, number, number] => [t.root, t.root + (t.minor ? -3 : 4), t.root + 1];
export const triadPcs = (t: Triad): number[] => triadFifths(t).map(pcOfFifths);
export const samePcs = (a: number[], b: number[]): boolean => a.length === b.length && a.every((x) => b.includes(x));

/** "C", "Am", "F♯m" (or with every black key one way). */
export function triadName(t: Triad, names: Names = 'spelled'): string {
  return noteName(spellFifths(t.root, names === 'degrees' ? 'spelled' : names)) + (t.minor ? 'm' : '');
}
/** "C major", "A minor". */
export const triadWords = (t: Triad, names: Names = 'spelled'): string => `${triadName(t, names).replace(/m$/, '')} ${t.minor ? 'minor' : 'major'}`;

/** The major and minor triads in a set of pitch classes: 'C E G B' holds C and Em. */
export function triadsIn(pcs: Iterable<number>): { rootPc: number; minor: boolean }[] {
  const s = new Set([...pcs].map((p) => mod(p, 12)));
  const out: { rootPc: number; minor: boolean }[] = [];
  for (const r of s) {
    if (!s.has(mod(r + 7, 12))) continue;
    if (s.has(mod(r + 4, 12))) out.push({ rootPc: r, minor: false });
    if (s.has(mod(r + 3, 12))) out.push({ rootPc: r, minor: true });
  }
  return out;
}

// ---------------------------------------------------------------- the moves

export type Letter = 'P' | 'L' | 'R';

/**
 * One move: two notes stay, one moves by a step.
 * P (parallel) flips the 3rd: C ↔ Cm. R (relative) moves the 5th of a major
 * chord up a whole step: C ↔ Am. L (leading tone) moves the root of a major
 * chord down a half step: C ↔ Em. Each undoes itself.
 */
export function moveTriad(t: Triad, m: Letter): Triad {
  if (m === 'P') return { root: t.root, minor: !t.minor };
  const d = m === 'R' ? 3 : 4;
  return t.minor ? { root: t.root - d, minor: false } : { root: t.root + d, minor: true };
}

/** The same move on the lattice: the triangle across the edge of the two notes that stay. */
export function moveTri(t: Tri, m: Letter): Tri {
  if (t.up) {
    if (m === 'P') return { i: t.i, j: t.j - 1, up: false };
    if (m === 'R') return { i: t.i - 1, j: t.j, up: false };
    return { i: t.i, j: t.j, up: false };
  }
  if (m === 'P') return { i: t.i, j: t.j + 1, up: true };
  if (m === 'R') return { i: t.i + 1, j: t.j, up: true };
  return { i: t.i, j: t.j, up: true };
}

/** The named compound moves, as letters applied left to right. */
export const NAMED: Record<string, string> = {
  N: 'RLP', // Nebenverwandt: C → Fm, the minor iv; Cm → G, the major V
  S: 'LPR', // Slide: C → C♯m, the 3rd stays and root and 5th slide a half step
  H: 'PLP', // Hexatonic pole: C → A♭m, no common tone, every note a half step away
};

/** A move name ("R", "PL", "N") as its letters. */
export const lettersOf = (move: string): Letter[] => [...(NAMED[move] ?? move)] as Letter[];

export const applyTriad = (t: Triad, move: string): Triad => lettersOf(move).reduce(moveTriad, t);
export const applyTri = (t: Tri, move: string): Tri => lettersOf(move).reduce(moveTri, t);

export const MOVE_INFO: Record<string, { name: string; what: string }> = {
  P: { name: 'Parallel', what: 'the 3rd moves a half step: major ↔ minor on the same root' },
  L: { name: 'Leading tone', what: 'major: the root drops a half step; minor: the 5th rises a half step' },
  R: { name: 'Relative', what: 'major: the 5th rises a whole step; minor: the root drops a whole step' },
  N: { name: 'Nebenverwandt (R L P)', what: 'major → its minor iv, minor → its major V' },
  S: { name: 'Slide (L P R)', what: 'the 3rd stays; root and 5th slide a half step together' },
  H: { name: 'Hexatonic pole (P L P)', what: 'every note moves a half step: the far side of the hexatonic cycle' },
};
const TWO = ['PL', 'LP', 'PR', 'RP', 'LR', 'RL'];
for (const w of TWO) MOVE_INFO[w] = { name: `${w[0]} then ${w[1]}`, what: `${MOVE_INFO[w[0]].name}, then ${MOVE_INFO[w[1]].name.toLowerCase()}` };

export const MOVE_SETS: { id: string; label: string; moves: string[] }[] = [
  { id: 'plr', label: 'P L R', moves: ['P', 'L', 'R'] },
  { id: 'two', label: 'Two moves', moves: TWO },
  { id: 'nsh', label: 'N S H', moves: ['N', 'S', 'H'] },
  { id: 'all', label: 'All moves', moves: ['P', 'L', 'R', ...TWO, 'N', 'S', 'H'] },
];

/** Every move word to try when naming a change, shortest first; the named ones stand in for their letters. */
const SEARCH: string[] = (() => {
  const words = ['P', 'L', 'R'];
  for (const a of 'PLR') for (const b of 'PLR') if (a !== b) words.push(a + b);
  const named = Object.entries(NAMED);
  words.push(...named.map(([n]) => n));
  for (const a of 'PLR') for (const b of 'PLR') for (const c of 'PLR') {
    const w = a + b + c;
    if (a !== b && b !== c && !named.some(([, l]) => l === w)) words.push(w);
  }
  return words;
})();

/** The shortest move from one triad to another (pitch classes only), or null if it takes more than three. */
export function moveBetween(a: Triad, b: Triad): string | null {
  const target = triadPcs(b);
  if (samePcs(triadPcs(a), target)) return '';
  return SEARCH.find((w) => samePcs(triadPcs(applyTriad(a, w)), target)) ?? null;
}

// ---------------------------------------------------------------- what is on screen

/** The part of the lattice drawn: rows −rows…rows, and nodes whose x is within ±xHalf. */
export interface Win {
  xHalf: number;
  rows: number;
}

export const nodeIn = (n: Node, w: Win): boolean => Math.abs(n.j) <= w.rows && Math.abs(nodeX(n)) <= w.xHalf + 1e-9;
export const triIn = (t: Tri, w: Win): boolean => triNodes(t).every((n) => nodeIn(n, w));

export function nodesIn(w: Win): Node[] {
  const out: Node[] = [];
  for (let j = -w.rows; j <= w.rows; j++) {
    for (let i = Math.ceil(-w.xHalf - j / 2 - 1e-9); i + j / 2 <= w.xHalf + 1e-9; i++) out.push({ i, j });
  }
  return out;
}

export function trisIn(w: Win): Tri[] {
  const out: Tri[] = [];
  for (const n of nodesIn(w)) for (const up of [true, false]) {
    const t = { i: n.i, j: n.j, up };
    if (triIn(t, w)) out.push(t);
  }
  return out;
}

/**
 * The same pitch class repeats every (4, −1) — four 5ths up and a major 3rd down
 * land on the same note, spelled the same — and every (0, 3): three major 3rds
 * up is the same key but a different name (C → B♯). The lattice is a torus.
 */
export const REPEATS: Node[] = [{ i: 4, j: -1 }, { i: 0, j: 3 }];

/** The copy of a triangle that is on screen and nearest `near` (the centre by default), or null. */
export function placeNear(t: Tri, w: Win, near = { x: 0, y: 0 }): Tri | null {
  let best: Tri | null = null;
  let dist = Infinity;
  for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) {
    const c = { i: t.i + 4 * a, j: t.j - a + 3 * b, up: t.up };
    if (!triIn(c, w)) continue;
    const m = triCentre(c);
    const d = Math.hypot(m.x - near.x, m.y - near.y);
    if (d < dist - 1e-9) {
      dist = d;
      best = c;
    }
  }
  return best;
}

/** The on-screen triangle holding a triad, nearest `near`. */
export function findTri(rootPc: number, minor: boolean, centrePc: number, w: Win, near = { x: 0, y: 0 }): Tri | null {
  // a root node for the pitch class: some i with 7i ≡ rootPc − centre (7 is its own inverse mod 12)
  const i = mod((rootPc - centrePc) * 7, 12);
  const t: Tri = minor ? { i, j: -1, up: false } : { i, j: 0, up: true }; // a minor triangle's root is its upper-left node
  return placeNear(t, w, near);
}

// ---------------------------------------------------------------- cycles

export const CYCLES: { id: string; label: string; word: string; about: string }[] = [
  { id: 'PL', label: 'P L · hexatonic', word: 'PL', about: 'P and L in turn: six triads a major 3rd apart in pairs, every note in one hexatonic scale.' },
  { id: 'PR', label: 'P R · octatonic', word: 'PR', about: 'P and R in turn: eight triads a minor 3rd apart in pairs, every note in one diminished scale.' },
  { id: 'RL', label: 'R L · falling 5ths', word: 'RL', about: 'R and L in turn: C Am F Dm B♭ …, down the circle of fifths through all 24 triads.' },
  { id: 'LR', label: 'L R · rising 5ths', word: 'LR', about: 'L and R in turn: C Em G Bm D …, up the circle of fifths through all 24 triads.' },
];

/**
 * A cycle's triangles from `start`, its letters in turn, until the triad comes
 * home (the last step is the start again). Each step stays next to the last one
 * when it can; when the walk leaves the screen it jumps to a copy on screen.
 */
export function cycleTris(start: Tri, word: string, w: Win, centrePc: number): Tri[] {
  const letters = lettersOf(word);
  const home = triPcs(start, centrePc);
  const out = [start];
  let t = start;
  for (let k = 0; k < 30; k++) {
    let next = moveTri(t, letters[k % letters.length]);
    if (!triIn(next, w)) next = placeNear(next, w, triCentre(t)) ?? placeNear(next, w)!;
    out.push(next);
    t = next;
    if (samePcs(triPcs(t, centrePc), home)) break;
  }
  out[out.length - 1] = start;
  return out;
}

/** The triads of a cycle on pitch classes alone, from a starting triad (spelled by the moves). */
export function cycleTriads(start: Triad, word: string): Triad[] {
  const letters = lettersOf(word);
  const out = [start];
  let t = start;
  for (let k = 0; k < 30; k++) {
    t = moveTriad(t, letters[k % letters.length]);
    out.push(t);
    if (samePcs(triadPcs(t), triadPcs(start))) break;
  }
  return out;
}

// ---------------------------------------------------------------- sound

/** A triad in close position, its root from E3 to D♯4. */
export function closeVoicing(rootPc: number, minor: boolean): number[] {
  const r = 52 + mod(rootPc - 4, 12);
  return [r, r + (minor ? 3 : 4), r + 7];
}

/**
 * Voice a chord from the last one by the shortest moves: notes both share stay
 * put, and each new note takes the place of the nearest note that left.
 */
export function voiceLead(prev: number[], pcs: number[]): number[] {
  const want = [...new Set(pcs.map((p) => mod(p, 12)))];
  const kept = prev.filter((m) => want.includes(mod(m, 12)));
  const keptPcs = new Set(kept.map((m) => mod(m, 12)));
  const left = prev.filter((m) => !want.includes(mod(m, 12)));
  const out = [...kept];
  for (const p of want.filter((x) => !keptPcs.has(x))) {
    const from = left.length ? left : prev.length ? prev : [60];
    let best = 0;
    let bestD = Infinity;
    let bestK = 0;
    from.forEach((m, k) => {
      const c = m + (mod(p - m + 6, 12) - 6);
      if (Math.abs(c - m) < bestD) {
        bestD = Math.abs(c - m);
        best = c;
        bestK = k;
      }
    });
    if (left.length) left.splice(bestK, 1);
    out.push(best);
  }
  return out.sort((a, b) => a - b);
}

/** Which notes stay and which move between two triangles, spelled where they sit: "C E stay · G → A". */
export function describeMove(a: Tri, b: Tri, centreFifths: number, names: Names): { stay: string[]; moves: string[] } {
  const fa = triNodes(a).map((n) => centreFifths + nodeFifths(n));
  const fb = triNodes(b).map((n) => centreFifths + nodeFifths(n));
  const nm = (f: number) => noteName(spellFifths(f, names === 'degrees' ? 'spelled' : names));
  const pa = fa.map(pcOfFifths);
  const pb = fb.map(pcOfFifths);
  const stay = fa.filter((_, k) => pb.includes(pa[k])).map(nm);
  const gone = fa.filter((_, k) => !pb.includes(pa[k]));
  const come = fb.filter((_, k) => !pa.includes(pb[k]));
  const moves = gone.map((f) => {
    // pair each note that leaves with the nearest new one
    let k = 0;
    let d = Infinity;
    come.forEach((g, n) => {
      const s = Math.abs(mod(pcOfFifths(g) - pcOfFifths(f) + 6, 12) - 6);
      if (s < d) {
        d = s;
        k = n;
      }
    });
    const [g] = come.splice(k, 1);
    const step = mod(pcOfFifths(g) - pcOfFifths(f) + 6, 12) - 6;
    const how = step === 1 ? '↑ ½' : step === -1 ? '↓ ½' : step === 2 ? '↑ 1' : step === -2 ? '↓ 1' : step > 0 ? `↑ ${step}` : `↓ ${-step}`;
    return `${nm(f)} → ${nm(g)} (${how})`;
  });
  return { stay, moves };
}

/** Pitch-class sets of the notes a Note list names, for tests and lessons. */
export const pcsOf = (notes: Note[]): number[] => notes.map(pc);
