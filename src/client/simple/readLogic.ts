// Read: notes, key signatures and chords on the staff. Pure logic (no DOM, no
// audio) so it can be tested.

import { MAJOR_KEYS } from '../theory/keys';
import { chordNotes } from '../theory/chords';
import { mod, noteName, noteToMidi, pc, transpose, type Note } from '../theory/core';
import type { Clef } from '../ui/Staff';

export type Range = 'staff' | 'ledger' | 'accidentals';

export interface StaffNote {
  midi: number;
  note: Note;
  /** the staff it sits on */
  clef: 'treble' | 'bass';
}

const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11];
/** Staff step (letter + 7 × octave) → note. */
const fromStep = (step: number, acc = 0): StaffNote['note'] => ({ letter: mod(step, 7), acc });
const midiOf = (step: number, acc = 0) => (Math.floor(step / 7) + 1) * 12 + LETTER_PCS[mod(step, 7)] + acc;
const step = (letter: number, octave: number) => letter + 7 * octave;

/** Lowest and highest staff steps a clef asks at each range. */
const SPAN: Record<'treble' | 'bass', Record<'staff' | 'ledger', [number, number]>> = {
  treble: { staff: [step(2, 4), step(3, 5)], ledger: [step(5, 3), step(0, 6)] }, // E4–F5, A3–C6
  bass: { staff: [step(4, 2), step(5, 3)], ledger: [step(0, 2), step(2, 4)] }, // G2–A3, C2–E4
};

/** Every note a clef and range can ask, as "F♯4"-style ids. */
export function notePool(clef: Clef, range: Range): StaffNote[] {
  const clefs: ('treble' | 'bass')[] = clef === 'grand' ? ['treble', 'bass'] : [clef];
  const out: StaffNote[] = [];
  for (const c of clefs) {
    const [lo, hi] = SPAN[c][range === 'staff' ? 'staff' : 'ledger'];
    for (let s = lo; s <= hi; s++) {
      // on the grand staff, middle C and its neighbours belong to whichever staff reads them more easily
      if (clef === 'grand' && c === 'bass' && s >= step(0, 4)) continue;
      for (const acc of range === 'accidentals' ? [-1, 0, 1] : [0]) out.push({ midi: midiOf(s, acc), note: fromStep(s, acc), clef: c });
    }
  }
  return out;
}

export const noteId = (n: StaffNote): string => `${noteName(n.note)}${Math.floor((n.midi - n.note.acc) / 12) - 1}`;
export const noteKey = (n: StaffNote): string => `${n.clef}:${noteId(n)}`;
export const noteKeyLabel = (k: string): string => {
  const [clef, id] = k.split(':');
  return `${id} · ${clef === 'treble' ? '𝄞' : '𝄢'}`;
};

// ---------------------------------------------------------------- key signatures

export const SIGS = Array.from({ length: 15 }, (_, i) => i - 7);

export function sigTonic(sig: number, mode: 'major' | 'minor'): Note {
  const major = MAJOR_KEYS.find((k) => k.sig === sig)!.tonic;
  return mode === 'major' ? major : transpose(major, 'M6');
}
export const sigKeyName = (sig: number, mode: 'major' | 'minor'): string => noteName(sigTonic(sig, mode)) + (mode === 'minor' ? 'm' : '');

// ---------------------------------------------------------------- chords

export type ChordSet = 'triads' | 'sevenths' | 'triads-inv' | 'sevenths-inv';
export const CHORD_TYPES_FOR: Record<'triads' | 'sevenths', string[]> = {
  triads: ['maj', 'min', 'dim', 'aug'],
  sevenths: ['maj7', 'dom7', 'min7', 'm7b5', 'dim7'],
};
/** Roots spelled the way charts write them; each chord's own notes stay within single sharps/flats. */
export const READ_ROOTS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

export interface StaffChordQ {
  root: Note;
  typeId: string;
  inv: number;
  /** low to high */
  midis: number[];
  names: string[];
}

/** A chord stacked on the staff: root position or an inversion, around middle C. */
export function stackChord(root: Note, typeId: string, inv: number): StaffChordQ {
  const notes = chordNotes(root, typeId);
  const order = [...notes.slice(inv), ...notes.slice(0, inv)];
  // start low enough that a seventh chord stays on the grand staff
  let m = noteToMidi(order[0], 3);
  if (m < 50) m += 12;
  const midis: number[] = [m];
  for (const n of order.slice(1)) {
    let x = midis[midis.length - 1] + 1;
    while (mod(x, 12) !== pc(n)) x++;
    midis.push(x);
  }
  return { root, typeId, inv, midis, names: order.map(noteName) };
}

/** True when the held keys are exactly the chord's notes (any octave, any voicing). */
export function sameChord(held: number[], midis: number[]): boolean {
  const a = new Set(held.map((m) => mod(m, 12)));
  const b = new Set(midis.map((m) => mod(m, 12)));
  return a.size === b.size && [...a].every((x) => b.has(x));
}
