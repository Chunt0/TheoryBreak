// Spelled-note and interval primitives. Everything theory-related builds on these.
// Notes carry a letter + accidental so scales and chords are spelled correctly
// (F♯ in D major, never G♭), which matters when teaching theory.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11] as const;

export interface Note {
  /** 0..6 → C D E F G A B */
  letter: number;
  /** accidental in semitones, -2..+2 */
  acc: number;
}

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export function note(letter: number, acc = 0): Note {
  return { letter: mod(letter, 7), acc };
}

/** Pitch class 0..11 (C = 0). */
export function pc(n: Note): number {
  return mod(LETTER_PCS[n.letter] + n.acc, 12);
}

const ACC_UNICODE: Record<string, string> = { '-2': '𝄫', '-1': '♭', '0': '', '1': '♯', '2': '𝄪' };
const ACC_ASCII: Record<string, string> = { '-2': 'bb', '-1': 'b', '0': '', '1': '#', '2': 'x' };

export function accStr(acc: number, ascii = false): string {
  const table = ascii ? ACC_ASCII : ACC_UNICODE;
  const hit = table[String(acc)];
  if (hit !== undefined) return hit;
  return (acc > 0 ? table['1'] : table['-1']).repeat(Math.abs(acc));
}

/** Display name with ♯/♭ symbols. Single-argument so it is safe to pass to Array.map. */
export function noteName(n: Note): string {
  return LETTERS[n.letter] + accStr(n.acc);
}

export function noteNameAscii(n: Note): string {
  return LETTERS[n.letter] + accStr(n.acc, true);
}

export function parseNote(s: string): Note | null {
  const m = /^\s*([A-Ga-g])\s*(𝄪|𝄫|##|bb|x|#|♯|b|♭)?\s*$/u.exec(s);
  if (!m) return null;
  const letter = LETTERS.indexOf(m[1].toUpperCase() as (typeof LETTERS)[number]);
  const a = m[2] ?? '';
  const acc = a === '' ? 0 : a === '#' || a === '♯' ? 1 : a === 'b' || a === '♭' ? -1 : a === '##' || a === 'x' || a === '𝄪' ? 2 : -2;
  return { letter, acc };
}

/** Parse a note name, throwing on bad input (for static data tables). */
export function N(s: string): Note {
  const n = parseNote(s);
  if (!n) throw new Error(`Bad note name: ${s}`);
  return n;
}

export const sameNote = (a: Note, b: Note): boolean => a.letter === b.letter && a.acc === b.acc;

export type Spelling = 'sharp' | 'flat' | 'auto';

const SHARP_SPELL = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(N);
const FLAT_SPELL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].map(N);
/** The spelling most musicians reach for first without a key context. */
const AUTO_SPELL = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(N);

export function spellPc(p: number, spelling: Spelling = 'auto'): Note {
  const t = spelling === 'sharp' ? SHARP_SPELL : spelling === 'flat' ? FLAT_SPELL : AUTO_SPELL;
  return { ...t[mod(p, 12)] };
}

/** Lead-sheet spelling: C♭ F♭ E♯ B♯ and double accidentals become their plain enharmonic. */
export function practical(n: Note, spelling: Spelling = 'auto'): Note {
  const awkward = Math.abs(n.acc) > 1 || (n.acc === -1 && (n.letter === 0 || n.letter === 3)) || (n.acc === 1 && (n.letter === 2 || n.letter === 6));
  return awkward ? spellPc(pc(n), spelling) : n;
}

export function pcName(p: number, spelling: Spelling = 'auto'): string {
  return noteName(spellPc(p, spelling));
}

/** "C♯/D♭" for black keys, plain letter for white keys. */
export function pcNameBoth(p: number): string {
  const s = noteName(SHARP_SPELL[mod(p, 12)]);
  const f = noteName(FLAT_SPELL[mod(p, 12)]);
  return s === f ? s : `${s}/${f}`;
}

export const isBlackKey = (midi: number): boolean => [1, 3, 6, 8, 10].includes(mod(midi, 12));

export const midiToFreq = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
export const octaveOf = (midi: number): number => Math.floor(midi / 12) - 1;

/** Scientific pitch name, MIDI 60 = C4. */
export function midiName(midi: number, spelling: Spelling = 'auto'): string {
  return pcName(mod(midi, 12), spelling) + octaveOf(midi);
}

/** Name a sounding MIDI pitch with a given spelling (B♯3 = MIDI 60). */
export function spelledMidiName(n: Note, midi: number): string {
  return noteName(n) + octaveOf(midi - n.acc);
}

export function noteToMidi(n: Note, octave: number): number {
  return (octave + 1) * 12 + LETTER_PCS[n.letter] + n.acc;
}

/** Lowest MIDI number with pitch class p that is >= min. */
export function midiAtOrAbove(p: number, min: number): number {
  return min + mod(p - min, 12);
}

// ---------------------------------------------------------------------------
// Intervals

export type Quality = 'P' | 'M' | 'm' | 'A' | 'd';

export interface Interval {
  id: string;
  name: string;
  /** generic size: 1 = unison, 3 = third, 8 = octave … */
  num: number;
  semis: number;
  quality: Quality;
  /** label relative to a root, e.g. "♭3" */
  degree: string;
}

const iv = (id: string, name: string, num: number, semis: number, quality: Quality, degree: string): Interval => ({
  id, name, num, semis, quality, degree,
});

export const INTERVALS: Record<string, Interval> = {
  P1: iv('P1', 'Unison', 1, 0, 'P', '1'),
  m2: iv('m2', 'Minor 2nd', 2, 1, 'm', '♭2'),
  M2: iv('M2', 'Major 2nd', 2, 2, 'M', '2'),
  A2: iv('A2', 'Augmented 2nd', 2, 3, 'A', '♯2'),
  m3: iv('m3', 'Minor 3rd', 3, 3, 'm', '♭3'),
  M3: iv('M3', 'Major 3rd', 3, 4, 'M', '3'),
  P4: iv('P4', 'Perfect 4th', 4, 5, 'P', '4'),
  A4: iv('A4', 'Augmented 4th', 4, 6, 'A', '♯4'),
  TT: iv('TT', 'Tritone', 4, 6, 'A', '♭5'),
  d5: iv('d5', 'Diminished 5th', 5, 6, 'd', '♭5'),
  P5: iv('P5', 'Perfect 5th', 5, 7, 'P', '5'),
  A5: iv('A5', 'Augmented 5th', 5, 8, 'A', '♯5'),
  m6: iv('m6', 'Minor 6th', 6, 8, 'm', '♭6'),
  M6: iv('M6', 'Major 6th', 6, 9, 'M', '6'),
  d7: iv('d7', 'Diminished 7th', 7, 9, 'd', '𝄫7'),
  m7: iv('m7', 'Minor 7th', 7, 10, 'm', '♭7'),
  M7: iv('M7', 'Major 7th', 7, 11, 'M', '7'),
  P8: iv('P8', 'Octave', 8, 12, 'P', '8'),
  m9: iv('m9', 'Minor 9th', 9, 13, 'm', '♭9'),
  M9: iv('M9', 'Major 9th', 9, 14, 'M', '9'),
  A9: iv('A9', 'Augmented 9th', 9, 15, 'A', '♯9'),
  m10: iv('m10', 'Minor 10th', 10, 15, 'm', '♭10'),
  M10: iv('M10', 'Major 10th', 10, 16, 'M', '10'),
  P11: iv('P11', 'Perfect 11th', 11, 17, 'P', '11'),
  A11: iv('A11', 'Augmented 11th', 11, 18, 'A', '♯11'),
  P12: iv('P12', 'Perfect 12th', 12, 19, 'P', '12'),
  m13: iv('m13', 'Minor 13th', 13, 20, 'm', '♭13'),
  M13: iv('M13', 'Major 13th', 13, 21, 'M', '13'),
};

/** The 13 simple intervals by semitone count (index = semitones). */
export const SIMPLE_INTERVAL_IDS = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'] as const;
export type SimpleIntervalId = (typeof SIMPLE_INTERVAL_IDS)[number];

export function intervalForSemis(semis: number): Interval {
  const s = Math.abs(semis);
  if (s <= 12) return INTERVALS[SIMPLE_INTERVAL_IDS[s]];
  return INTERVALS[SIMPLE_INTERVAL_IDS[s % 12]];
}

/** Degree label for a semitone distance above a root ("♭3", "5"…). */
export const DEGREE_BY_SEMIS = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'] as const;

export function getInterval(id: string): Interval {
  const i = INTERVALS[id];
  if (!i) throw new Error(`Unknown interval ${id}`);
  return i;
}

/** Transpose a spelled note by an interval, keeping correct letter spelling. */
export function transpose(n: Note, ivl: Interval | string, dir: 1 | -1 = 1): Note {
  const i = typeof ivl === 'string' ? getInterval(ivl) : ivl;
  const letter = mod(n.letter + (i.num - 1) * dir, 7);
  const target = pc(n) + i.semis * dir;
  let acc = mod(target - LETTER_PCS[letter], 12);
  if (acc > 6) acc -= 12;
  return { letter, acc };
}

/** Build an ad-hoc interval from a generic number and semitone size. */
export function rawInterval(num: number, semis: number): Interval {
  for (const i of Object.values(INTERVALS)) if (i.num === num && i.semis === semis && i.id !== 'TT') return i;
  return { id: `${num}:${semis}`, name: `${num}/${semis}`, num, semis, quality: 'P', degree: '?' };
}

/** Spelled simple interval from a up to b (null for exotic spellings). */
export function intervalBetween(a: Note, b: Note): Interval | null {
  const num = mod(b.letter - a.letter, 7) + 1;
  const semis = mod(pc(b) - pc(a), 12);
  for (const i of Object.values(INTERVALS)) {
    if (i.id !== 'TT' && i.num === num && i.semis === semis) return i;
  }
  return null;
}

/** Inversion of a simple interval (M3 ↔ m6, P4 ↔ P5 …). */
export function invertInterval(id: string): Interval {
  const i = getInterval(id);
  if (i.id === 'TT') return i;
  const num = 9 - i.num;
  const semis = 12 - i.semis;
  return rawInterval(num, semis);
}

// ---------------------------------------------------------------------------
// Small helpers shared by generators

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(arr: readonly T[], rnd: () => number = Math.random): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function uniqueBy<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter((t) => {
    const k = key(t);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const pcSet = (midis: number[]): number[] => [...new Set(midis.map((m) => mod(m, 12)))].sort((a, b) => a - b);
