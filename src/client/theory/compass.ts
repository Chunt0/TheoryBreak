// The modal compass: the seven modes of the major scale in order of brightness,
// Lydian round to Locrian. Neighbours differ by one note, lowered a half step
// going darker. Past Locrian the root itself falls a half step and you are
// in Lydian again, a half step lower, so the compass can spin for ever. Mirror
// pairs are inversions of each other (Ionian and Phrygian upside down), with
// Dorian the axis. The idea follows Milton Mermikides' Modal Compass.
// Pure logic: no DOM, no audio.

import { INTERVALS, mod, noteName, pc, spellPc, transpose, type Note } from './core';
import { getScale } from './scales';

export interface CompassMode {
  /** scale id in theory/scales */
  id: string;
  name: string;
  /** the note that sets it apart from its neighbours' sound */
  char: string;
  /** the 7th chord on its tonic */
  chord: string;
  /** a few words on how it sounds */
  mood: string;
  /** semitones its tonic sits above the parent major scale's */
  offset: number;
}

/** Brightest first. Index 3, Dorian, is the axis of the mirror. */
export const COMPASS: CompassMode[] = [
  { id: 'lydian', name: 'Lydian', char: '♯4', chord: 'maj7♯11', mood: 'bright, floating, a little unreal', offset: 5 },
  { id: 'major', name: 'Ionian', char: '4', chord: 'maj7', mood: 'major, settled, home', offset: 0 },
  { id: 'mixolydian', name: 'Mixolydian', char: '♭7', chord: '7', mood: 'major with a bluesy, earthy ♭7', offset: 7 },
  { id: 'dorian', name: 'Dorian', char: '6', chord: 'm7 (m6)', mood: 'minor but warm: the bright 6th', offset: 2 },
  { id: 'minor', name: 'Aeolian', char: '♭6', chord: 'm7 (♭6)', mood: 'natural minor, sad and serious', offset: 9 },
  { id: 'phrygian', name: 'Phrygian', char: '♭2', chord: 'm7 (♭9)', mood: 'dark, Spanish, the ♭2 leaning on the root', offset: 4 },
  { id: 'locrian', name: 'Locrian', char: '♭5', chord: 'm7♭5', mood: 'darkest: no perfect 5th, the tonic never settles', offset: 11 },
];

export const AXIS = 3;
export type Hold = 'spin' | 'root' | 'notes';

/** Where you are on the compass: a mode (index into COMPASS) on a root pitch class. */
export interface Pos {
  root: number;
  k: number;
}

export const modeSemis = (k: number): number[] => getScale(COMPASS[mod(k, 7)].id).intervals.map((i) => INTERVALS[i].semis);
/** The mode's own degree name for a semitone above its root ("♯4", "♭5"…), or null when it holds no such note. */
export function modeDegree(k: number, semis: number): string | null {
  const s = mod(semis, 12);
  const i = getScale(COMPASS[mod(k, 7)].id).intervals.find((x) => INTERVALS[x].semis === s);
  return i ? INTERVALS[i].degree : null;
}
export const posPcs = (p: Pos): number[] => modeSemis(p.k).map((s) => mod(p.root + s, 12));
export const parentOf = (p: Pos): number => mod(p.root - COMPASS[mod(p.k, 7)].offset, 12);
/** The mirror image: Lydian and Locrian, Ionian and Phrygian, Mixolydian and Aeolian; Dorian is its own. */
export const mirror = (k: number): number => 6 - mod(k, 7);

/**
 * One step round the compass, darker (+1) or brighter (−1). `spin` changes one
 * note every step, the root too at the seam; `root` keeps the root (so the seam
 * jumps); `notes` keeps the parent scale's notes and moves the root in 5ths.
 */
export function step(p: Pos, dir: 1 | -1, hold: Hold): Pos {
  const k = mod(p.k + dir, 7);
  const seam = (dir === 1 && p.k === 6) || (dir === -1 && p.k === 0);
  if (hold === 'notes') return { root: mod(parentOf(p) + COMPASS[k].offset, 12), k };
  if (hold === 'spin' && seam) return { root: mod(p.root - dir, 12), k };
  return { root: p.root, k };
}
export function walk(p: Pos, n: number, hold: Hold): Pos {
  let q = p;
  for (let i = 0; i < Math.abs(n); i++) q = step(q, n > 0 ? 1 : -1, hold);
  return q;
}

/** The notes that leave and the notes that arrive going from a to b. */
export function change(a: Pos, b: Pos): { gone: number[]; came: number[] } {
  const pa = posPcs(a);
  const pb = posPcs(b);
  return { gone: pa.filter((x) => !pb.includes(x)), came: pb.filter((x) => !pa.includes(x)) };
}

/** The one tritone in the mode, as semitones above its root: [lower, upper]. */
export function tritone(k: number): [number, number] {
  const s = modeSemis(k);
  const a = s.find((x) => x < 6 && s.includes(x + 6))!;
  return [a, a + 6];
}

/** Modes (indices) on this root that hold every one of these pitch classes. */
export const modesHolding = (root: number, pcs: number[]): number[] =>
  COMPASS.map((_, k) => k).filter((k) => {
    const s = modeSemis(k);
    return pcs.every((p) => s.includes(mod(p - root, 12)));
  });

/** The root spelled so the mode reads most simply: C♯ Locrian, D♭ Lydian. */
export function modeTonic(root: number, k: number): Note {
  const plain = spellPc(root, 'auto');
  const weight = (t: Note) => modeNotesFrom(t, k).reduce((a, n) => a + Math.abs(n.acc) * (Math.abs(n.acc) > 1 ? 3 : 1), 0);
  if (plain.acc === 0) return plain;
  const other = spellPc(root, plain.acc > 0 ? 'flat' : 'sharp');
  return weight(other) < weight(plain) ? other : plain;
}
const modeNotesFrom = (t: Note, k: number): Note[] => getScale(COMPASS[mod(k, 7)].id).intervals.map((i) => transpose(t, i));
export const modeNotes = (p: Pos): Note[] => modeNotesFrom(modeTonic(p.root, p.k), p.k);
/** A pitch class named as the mode spells it (or by the nearer accidental when the mode does not hold it). */
export function spellIn(p: Pos, p0: number): string {
  const hit = modeNotes(p).find((n) => pc(n) === mod(p0, 12));
  if (hit) return noteName(hit);
  const t = modeTonic(p.root, p.k);
  return noteName(spellPc(p0, t.acc < 0 || COMPASS[p.k].offset === 5 ? 'flat' : 'sharp'));
}
export const posName = (p: Pos): string => `${noteName(modeTonic(p.root, p.k))} ${COMPASS[mod(p.k, 7)].name}`;

/**
 * In words, what one step does: "Ionian → Mixolydian: 7 (B) falls to ♭7 (B♭)".
 * At the seam the root itself moves and the new mode starts on it.
 */
export function describeStep(a: Pos, b: Pos): string {
  const { gone, came } = change(a, b);
  if (gone.length !== 1 || came.length !== 1) {
    const kept = posPcs(a).filter((x) => posPcs(b).includes(x)).length;
    return `${posName(a)} → ${posName(b)}: ${kept === 7 ? 'the same seven notes from a new root' : `${7 - kept} notes change`}`;
  }
  const [g] = gone;
  const [c] = came;
  const da = modeDegree(a.k, g - a.root);
  const db = modeDegree(b.k, c - b.root);
  const verb = mod(c - g, 12) === 11 ? 'falls' : 'rises';
  if (a.root !== b.root) return `${posName(a)} → ${posName(b)}: the root ${spellIn(a, g)} ${verb} to ${spellIn(b, c)}, the new root`;
  return `${posName(a)} → ${posName(b)}: ${da} (${spellIn(a, g)}) ${verb} to ${db} (${spellIn(b, c)})`;
}

/** Each step darker lowers one degree, in this order from Lydian: ♯4, 7, 3, 6, 2, 5, then the root. */
export const DARKER_DEGREE = ['♯4 → 4', '7 → ♭7', '3 → ♭3', '6 → ♭6', '2 → ♭2', '5 → ♭5', 'root → down a half step'];
