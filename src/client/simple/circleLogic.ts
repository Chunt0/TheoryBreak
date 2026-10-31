// The circle of fifths from a tonic: which degree sits where, how the key's
// notes are spelled, the diatonic chord on each root, and what shape a scale
// makes on the circle. Pure logic (no DOM, no audio) so it can be tested.

import { getInterval, INTERVALS, mod, noteName, pc, spellPc, transpose, type Note } from '../theory/core';
import { numeralFor } from '../theory/keys';
import { getScale, scaleNotes } from '../theory/scales';

/** Semitones above the tonic at each step clockwise: 1 5 2 6 3 7 ♯4 ♭2 ♭6 ♭3 ♭7 4. */
export const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5] as const;
/** The step round the circle (clockwise from the tonic) that holds a degree. 7 × 7 = 49 ≡ 1, so a fifth is its own inverse. */
export const slotOf = (semis: number): number => mod(semis * 7, 12);

/** 'all' = no scale: every degree is shown, none counted as in the key. */
export const NO_SCALE = 'all';

export const CIRCLE_SCALES: { title: string; ids: string[] }[] = [
  { title: 'Major & its modes', ids: ['lydian', 'major', 'mixolydian', 'dorian', 'minor', 'phrygian', 'locrian'] },
  { title: 'Minor family', ids: ['harmonic_minor', 'melodic_minor'] },
  { title: 'Pentatonic & blues', ids: ['major_pent', 'minor_pent', 'blues'] },
  { title: 'No scale', ids: [NO_SCALE] },
];

/** Interval ids a degree is called by when the scale does not hold it. */
const OUTSIDE = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7'];

/** The scale's semitones above the tonic, in scale order. */
export const scaleSemis = (scaleId: string): number[] =>
  scaleId === NO_SCALE ? [] : getScale(scaleId).intervals.map((i) => INTERVALS[i].semis);

/** Minor-third scales call the tritone ♭5 (the blue note); the rest ♯4. */
const minorish = (scaleId: string): boolean => {
  const s = scaleSemis(scaleId);
  return s.includes(3) && !s.includes(4);
};

/** What a degree is called in this scale: its own interval if the scale has it, else the usual name. */
export function degreeInterval(semis: number, scaleId: string): string {
  const s = mod(semis, 12);
  if (scaleId !== NO_SCALE) {
    const own = getScale(scaleId).intervals.find((i) => INTERVALS[i].semis === s);
    if (own) return own;
  }
  return s === 6 && minorish(scaleId) ? 'd5' : OUTSIDE[s];
}

export const degreeLabel = (semis: number, scaleId: string): string => getInterval(degreeInterval(semis, scaleId)).degree;

/** "minor 6th" for the readout. */
export const intervalWords = (semis: number, scaleId: string): string => {
  const i = getInterval(degreeInterval(semis, scaleId));
  return i.semis === 0 ? 'the tonic' : i.name.toLowerCase();
};

/** Total accidentals of a scale spelled from `tonic` (double sharps and flats count twice). */
const weight = (tonic: Note, scaleId: string): number =>
  scaleId === NO_SCALE ? Math.abs(tonic.acc) : scaleNotes(tonic, scaleId).reduce((a, n) => a + Math.abs(n.acc), 0);

/** The tonic spelled so the scale reads most simply: C♯ minor but D♭ major, G♯ minor but A♭ major. */
export function tonicFor(p: number, scaleId: string): Note {
  const plain = spellPc(p, 'auto');
  if (plain.acc === 0) return plain;
  const other = spellPc(p, plain.acc > 0 ? 'flat' : 'sharp');
  return weight(other, scaleId) < weight(plain, scaleId) ? other : plain;
}

/** A degree spelled from the tonic by its name: E♯ in F♯ major, B♯ as C♯ minor's leading tone; only doubles (B𝄫) become plain. */
export function spellSemis(tonic: Note, semis: number, scaleId: string): Note {
  const n = transpose(tonic, getInterval(degreeInterval(semis, scaleId)));
  return Math.abs(n.acc) > 1 ? spellPc(pc(n), n.acc < 0 ? 'flat' : 'sharp') : n;
}

/** Spell a pitch class (0–11) in the key of `tonic`. */
export const spellPcIn = (tonic: Note, p: number, scaleId: string): Note => spellSemis(tonic, p - pc(tonic), scaleId);

const TRIAD: Record<string, string> = { '4,7': 'maj', '3,7': 'min', '3,6': 'dim', '4,8': 'aug' };
const SEVENTH: Record<string, string> = {
  '4,7,11': 'maj7', '4,7,10': 'dom7', '3,7,10': 'min7', '3,6,10': 'm7b5', '3,6,9': 'dim7',
  '3,7,11': 'mmaj7', '4,8,11': 'maj7s5', '4,8,10': 'aug7', '4,6,10': '7b5',
};

export interface SlotChord {
  /** semitones of the root above the tonic */
  semis: number;
  typeId: string;
  /** "♭VIImaj7", "ii7" */
  numeral: string;
}

/** The chord stacked in thirds on each degree of a seven-note scale (empty for other scales). */
export function diatonicOnDegrees(scaleId: string, sevenths: boolean): SlotChord[] {
  const s = scaleSemis(scaleId);
  if (s.length !== 7) return [];
  return s.flatMap((root, d) => {
    const up = (k: number) => mod(s[(d + k) % 7] - root, 12);
    const typeId = sevenths ? SEVENTH[`${up(2)},${up(4)},${up(6)}`] : TRIAD[`${up(2)},${up(4)}`];
    if (!typeId) return [];
    const deg = getInterval(degreeInterval(root, scaleId));
    const acc = deg.degree.startsWith('♭') ? '♭' : deg.degree.startsWith('♯') ? '♯' : '';
    return [{ semis: root, typeId, numeral: numeralFor(deg.num, typeId, acc) }];
  });
}

/** A chord's numeral from its root's degree in the key: "♭VI7", "ii". */
export function numeralOf(rootSemis: number, typeId: string, scaleId: string): string {
  const deg = getInterval(degreeInterval(rootSemis, scaleId));
  const acc = deg.degree.startsWith('♭') ? '♭' : deg.degree.startsWith('♯') ? '♯' : '';
  try {
    return numeralFor(deg.num, typeId, acc);
  } catch {
    return deg.degree;
  }
}

export interface Shape {
  /** the scale's notes form one unbroken arc of neighbours */
  arc: boolean;
  /** notes clockwise (sharp side) and counter-clockwise (flat side) of the tonic, along the arc */
  sharp: number;
  flat: number;
}

/** Where the scale sits on the circle, seen from its tonic. */
export function shapeOf(scaleId: string): Shape | null {
  const s = scaleSemis(scaleId);
  if (!s.length) return null;
  const on = new Set(s.map(slotOf));
  let sharp = 0;
  while (sharp < 11 && on.has(sharp + 1)) sharp++;
  let flat = 0;
  while (flat < 11 && on.has(mod(-flat - 1, 12))) flat++;
  return { arc: sharp + flat + 1 === s.length, sharp, flat };
}

/** Scales that break the arc, and what breaks it. */
const BROKEN: Record<string, string> = {
  harmonic_minor: "Natural minor's arc with ♭7 swapped for 7 from across the circle: the leading tone's pull.",
  melodic_minor: "Major's arc with 3 swapped for ♭3 from across the circle: a minor tonic on major's upper half.",
  blues: "Minor pentatonic's arc plus ♭5, straight across the circle from the tonic: the blue note.",
};

/** One line about the scale's shape on the circle. */
export function shapeText(scaleId: string): string {
  const shape = shapeOf(scaleId);
  if (!shape) return 'No scale: every degree is named from the tonic, the key only sets the spelling.';
  if (!shape.arc) return BROKEN[scaleId] ?? 'Not one arc: some notes sit across the circle from the rest.';
  const n = scaleSemis(scaleId).length;
  const lean = shape.sharp === shape.flat ? 'Symmetric round the tonic.' : 'More clockwise = brighter.';
  return `One arc of ${n} neighbours: ${shape.sharp} clockwise of the tonic (sharp side), ${shape.flat} counter-clockwise. ${lean}`;
}

/** Name of a scale for headings: "C♯ Dorian", "B♭ harmonic minor". */
export function scaleTitle(scaleId: string): string {
  if (scaleId === NO_SCALE) return '';
  const TITLE: Record<string, string> = { major: 'major', minor: 'minor', harmonic_minor: 'harmonic minor', melodic_minor: 'melodic minor', major_pent: 'major pentatonic', minor_pent: 'minor pentatonic', blues: 'blues' };
  return TITLE[scaleId] ?? getScale(scaleId).name.replace(/ \(.*\)$/, '');
}

/** Round the circle from the tonic: 12 roots and home again, in 4ths (counter-clockwise, the ii–V way) or 5ths. */
export const walkSemis = (dir: 'fourths' | 'fifths'): number[] =>
  Array.from({ length: 13 }, (_, i) => mod(i * (dir === 'fourths' ? 5 : 7), 12));

export const keyText = (tonic: Note, scaleId: string): string => `${noteName(tonic)} ${scaleTitle(scaleId)}`.trim();

/** Drone notes for a tonic pitch class: low tonic plus tonic (and the 5th), around C3. */
export function droneNotes(tonicPc: number, kind: 'root' | 'fifth'): number[] {
  const t = 48 + mod(tonicPc, 12);
  return kind === 'fifth' ? [t - 12, t, t + 7] : [t - 12, t];
}
