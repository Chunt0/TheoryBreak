import { INTERVALS, mod, N, noteName, pc, rawInterval, sameNote, transpose, type Note } from './core';
import { chordPcs, chordSymbol, getChord } from './chords';
import { getScale } from './scales';

export type KeyMode = 'major' | 'minor';

export interface Key {
  tonic: Note;
  mode: KeyMode;
}

export function keyName(k: Key): string {
  return `${noteName(k.tonic)} ${k.mode}`;
}

export function keyShort(k: Key): string {
  return noteName(k.tonic) + (k.mode === 'minor' ? 'm' : '');
}

/** All 15 major key spellings with their signature (+ = sharps, − = flats). */
export const MAJOR_KEYS: { tonic: Note; sig: number }[] = [
  ['C', 0], ['G', 1], ['D', 2], ['A', 3], ['E', 4], ['B', 5], ['F#', 6], ['C#', 7],
  ['F', -1], ['Bb', -2], ['Eb', -3], ['Ab', -4], ['Db', -5], ['Gb', -6], ['Cb', -7],
].map(([t, s]) => ({ tonic: N(t as string), sig: s as number }));

/** Practical key choices (jazz musicians live in flat keys). */
export const JAZZ_MAJOR_TONICS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'G', 'D', 'A', 'E', 'Gb', 'B'].map(N);
export const JAZZ_MINOR_TONICS = ['C', 'D', 'G', 'F', 'A', 'E', 'Bb', 'B', 'F#', 'Eb'].map(N);

export function relativeMinor(majorTonic: Note): Note {
  return transpose(majorTonic, 'M6');
}

export function relativeMajor(minorTonic: Note): Note {
  return transpose(minorTonic, 'm3');
}

/** Signature count: positive = sharps, negative = flats. */
export function keySignature(k: Key): number {
  const majorTonic = k.mode === 'major' ? k.tonic : relativeMajor(k.tonic);
  const hit = MAJOR_KEYS.find((m) => sameNote(m.tonic, majorTonic));
  if (hit) return hit.sig;
  const fifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5].indexOf(pc(majorTonic));
  return fifths <= 6 ? fifths : fifths - 12;
}

/** True when a key is conventionally written with flats. */
export function prefersFlats(k: Key): boolean {
  return keySignature(k) < 0;
}

export function keyScaleNotes(k: Key, minorVariant: 'natural' | 'harmonic' | 'melodic' = 'natural'): Note[] {
  const id = k.mode === 'major' ? 'major' : minorVariant === 'natural' ? 'minor' : minorVariant === 'harmonic' ? 'harmonic_minor' : 'melodic_minor';
  return getScale(id).intervals.map((i) => transpose(k.tonic, i));
}

// ---------------------------------------------------------------------------
// Roman numerals — jazz convention: numerals are measured from the MAJOR scale
// on the tonic, so in A minor the chords are i, iiø7, ♭III, iv, V, ♭VI, ♭VII.

export type ChordFunction = 'T' | 'PD' | 'D';

export const FUNCTION_NAMES: Record<ChordFunction, string> = {
  T: 'Tonic',
  PD: 'Predominant',
  D: 'Dominant',
};

export interface KeyChord {
  degree: number;
  numeral: string;
  root: Note;
  typeId: string;
  symbol: string;
  fn: ChordFunction;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const MAJOR_SEMIS = [0, 2, 4, 5, 7, 9, 11];

const LOWER_TYPES = new Set(['min', 'dim', 'min7', 'm7b5', 'dim7', 'mmaj7', 'min6', 'madd9', 'min9', 'min11', 'min13', 'mmaj9', 'm69', 'm9b5']);

/** Suffix shown after the numeral for each chord type (case carries major/minor). */
const SUFFIX: Record<string, string> = {
  maj: '', min: '', dim: '°', aug: '+', sus2: 'sus2', sus4: 'sus4', pow: '5',
  maj7: 'maj7', dom7: '7', min7: '7', m7b5: 'ø7', dim7: '°7', mmaj7: '(maj7)', maj7s5: 'maj7♯5', '7sus4': '7sus4', aug7: '7♯5', '7b5': '7♭5',
  maj6: '6', min6: '6', '69': '6/9', m69: '6/9', add9: 'add9', madd9: 'add9', maj9: 'maj9', dom9: '9', min9: '9', mmaj9: '(maj9)', '9sus4': '9sus4', m9b5: 'ø9',
  min11: '11', dom11: '11', maj7s11: 'maj7♯11', maj9s11: 'maj9♯11', '7s11': '7♯11', dom13: '13', '13sus4': '13sus4', maj13: 'maj13', min13: '13',
  '13b9': '13♭9', '13s11': '13♯11', '7b9': '7♭9', '7s9': '7♯9', '7b13': '7♭13', '7b9b13': '7♭9♭13', '7alt': '7alt',
};

export function numeralFor(degree: number, typeId: string, accidental = ''): string {
  const base = ROMAN[degree - 1];
  return accidental + (LOWER_TYPES.has(typeId) ? base.toLowerCase() : base) + (SUFFIX[typeId] ?? getChord(typeId).symbol);
}

const MAJOR_TRIADS = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
const MAJOR_SEVENTHS = ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'm7b5'];
const NAT_MINOR_TRIADS = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];
const NAT_MINOR_SEVENTHS = ['min7', 'm7b5', 'maj7', 'min7', 'min7', 'maj7', 'dom7'];
const HARM_MINOR_TRIADS = ['min', 'dim', 'aug', 'min', 'maj', 'maj', 'dim'];
const HARM_MINOR_SEVENTHS = ['mmaj7', 'm7b5', 'maj7s5', 'min7', 'dom7', 'maj7', 'dim7'];
const MEL_MINOR_SEVENTHS = ['mmaj7', 'min7', 'maj7s5', 'dom7', 'dom7', 'm7b5', 'm7b5'];
const MAJOR_FN: ChordFunction[] = ['T', 'PD', 'T', 'PD', 'D', 'T', 'D'];
const MINOR_FN: ChordFunction[] = ['T', 'PD', 'T', 'PD', 'D', 'PD', 'D'];

export function diatonicChords(k: Key, sevenths = false, minorVariant: 'natural' | 'harmonic' | 'melodic' = 'natural'): KeyChord[] {
  const notes = keyScaleNotes(k, minorVariant);
  const types =
    k.mode === 'major'
      ? sevenths ? MAJOR_SEVENTHS : MAJOR_TRIADS
      : minorVariant === 'natural'
        ? sevenths ? NAT_MINOR_SEVENTHS : NAT_MINOR_TRIADS
        : minorVariant === 'harmonic'
          ? sevenths ? HARM_MINOR_SEVENTHS : HARM_MINOR_TRIADS
          : MEL_MINOR_SEVENTHS;
  const fns = k.mode === 'major' ? MAJOR_FN : MINOR_FN;
  return notes.map((root, i) => {
    const semis = mod(pc(root) - pc(k.tonic), 12);
    const acc = semis < MAJOR_SEMIS[i] ? '♭' : semis > MAJOR_SEMIS[i] ? '♯' : '';
    return { degree: i + 1, numeral: numeralFor(i + 1, types[i], acc), root, typeId: types[i], symbol: chordSymbol(root, types[i]), fn: fns[i] };
  });
}

const NUMERAL_RE = /^(♭|♯|b|#)?(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/;

const SUFFIX_MAP: Record<string, [string, string]> = {
  // suffix: [uppercase type, lowercase type]
  '': ['maj', 'min'],
  '7': ['dom7', 'min7'],
  maj7: ['maj7', 'mmaj7'], M7: ['maj7', 'mmaj7'], 'Δ7': ['maj7', 'mmaj7'], 'Δ': ['maj7', 'mmaj7'], '(maj7)': ['mmaj7', 'mmaj7'],
  '°': ['dim', 'dim'], o: ['dim', 'dim'], dim: ['dim', 'dim'],
  '°7': ['dim7', 'dim7'], o7: ['dim7', 'dim7'], dim7: ['dim7', 'dim7'],
  ø: ['m7b5', 'm7b5'], 'ø7': ['m7b5', 'm7b5'], m7b5: ['m7b5', 'm7b5'], 'ø9': ['m9b5', 'm9b5'],
  '+': ['aug', 'aug'], aug: ['aug', 'aug'], '+7': ['aug7', 'aug7'], '7♯5': ['aug7', 'aug7'], '7#5': ['aug7', 'aug7'], '7♭5': ['7b5', '7b5'], '7b5': ['7b5', '7b5'],
  'maj7♯5': ['maj7s5', 'maj7s5'], 'maj7#5': ['maj7s5', 'maj7s5'],
  sus2: ['sus2', 'sus2'], sus4: ['sus4', 'sus4'], sus: ['sus4', 'sus4'],
  '7sus4': ['7sus4', '7sus4'], '7sus': ['7sus4', '7sus4'], '9sus4': ['9sus4', '9sus4'], '9sus': ['9sus4', '9sus4'], '13sus4': ['13sus4', '13sus4'], '13sus': ['13sus4', '13sus4'],
  '5': ['pow', 'pow'],
  '6': ['maj6', 'min6'], '6/9': ['69', 'm69'], '69': ['69', 'm69'],
  add9: ['add9', 'madd9'], maj9: ['maj9', 'mmaj9'], '(maj9)': ['mmaj9', 'mmaj9'],
  '9': ['dom9', 'min9'], '11': ['dom11', 'min11'], '13': ['dom13', 'min13'], maj13: ['maj13', 'maj13'],
  'maj7♯11': ['maj7s11', 'maj7s11'], 'maj7#11': ['maj7s11', 'maj7s11'], 'maj9♯11': ['maj9s11', 'maj9s11'], 'maj9#11': ['maj9s11', 'maj9s11'],
  '7♯11': ['7s11', '7s11'], '7#11': ['7s11', '7s11'], '13♯11': ['13s11', '13s11'], '13#11': ['13s11', '13s11'],
  '7♭9': ['7b9', '7b9'], '7b9': ['7b9', '7b9'], '7♯9': ['7s9', '7s9'], '7#9': ['7s9', '7s9'],
  '7♭13': ['7b13', '7b13'], '7b13': ['7b13', '7b13'], '7♭9♭13': ['7b9b13', '7b9b13'], '7b9b13': ['7b9b13', '7b9b13'],
  '13♭9': ['13b9', '13b9'], '13b9': ['13b9', '13b9'], '7alt': ['7alt', '7alt'], alt: ['7alt', '7alt'],
};

export interface ParsedChord {
  root: Note;
  typeId: string;
  symbol: string;
  numeral: string;
}

export function parseRoman(input: string, k: Key): ParsedChord | null {
  const text = input.trim();
  const slash = text.indexOf('/');
  if (slash > 0) {
    // secondary function: V7/ii, vii°7/V, ii7/IV …
    const target = parseRoman(text.slice(slash + 1), k);
    if (!target) return null;
    const inner = parseRoman(text.slice(0, slash), { tonic: target.root, mode: 'major' });
    if (!inner) return null;
    return { ...inner, numeral: text };
  }
  const m = NUMERAL_RE.exec(text);
  if (!m) return null;
  const accidental = m[1] === '♭' || m[1] === 'b' ? -1 : m[1] === '♯' || m[1] === '#' ? 1 : 0;
  const roman = m[2];
  const degree = ROMAN.indexOf(roman.toUpperCase()) + 1;
  const upper = roman === roman.toUpperCase();
  const hit = SUFFIX_MAP[(m[3] ?? '').replace(/\s+/g, '')];
  if (!hit || degree <= 0) return null;
  const typeId = upper ? hit[0] : hit[1];
  const base = INTERVALS[getScale('major').intervals[degree - 1]];
  const root = transpose(k.tonic, rawInterval(base.num, base.semis + accidental));
  return { root, typeId, symbol: chordSymbol(root, typeId), numeral: text };
}

const SEMIS_TO_DEGREE: [string, number][] = [
  ['', 1], ['♭', 2], ['', 2], ['♭', 3], ['', 3], ['', 4], ['♭', 5], ['', 5], ['♭', 6], ['', 6], ['♭', 7], ['', 7],
];

/** Roman numeral for any chord relative to a key (jazz convention). */
export function romanFor(k: Key, rootPc: number, typeId: string): string {
  const semis = mod(rootPc - pc(k.tonic), 12);
  let [acc, degree] = SEMIS_TO_DEGREE[semis];
  if (semis === 6 && (typeId === 'dim7' || typeId === 'dim' || typeId === 'm7b5' || typeId === 'm9b5')) [acc, degree] = ['♯', 4];
  return numeralFor(degree, typeId, acc);
}

/** "V7/ii"-style label when a dominant-quality chord resolves to a diatonic target a 5th below. */
export function secondaryLabel(k: Key, rootPc: number, typeId: string): string | null {
  if (!['maj', 'dom7', 'dom9', 'dom13', '7b9', '7s9', '7b13', '7alt', '7b9b13', '13b9'].includes(typeId)) return null;
  const targetPc = mod(rootPc + 5, 12);
  const diatonic = diatonicChords(k);
  if (diatonic.some((c) => pc(c.root) === rootPc && (c.typeId === 'maj' && typeId === 'maj'))) return null;
  if (mod(rootPc - pc(k.tonic), 12) === 7) return null; // that's just V
  const target = diatonic.find((c) => pc(c.root) === targetPc && c.typeId !== 'dim');
  if (!target) return null;
  const v = typeId === 'maj' ? 'V' : `V${SUFFIX[typeId] ?? '7'}`;
  return `${v}/${target.numeral.replace(/[°ø7]/g, '')}`;
}

export function chordFunctionOf(k: Key, rootPc: number): ChordFunction | null {
  const d = diatonicChords(k).find((c) => pc(c.root) === rootPc);
  return d?.fn ?? null;
}

export function keyChordPcs(k: Key, numeral: string): number[] | null {
  const p = parseRoman(numeral, k);
  return p ? chordPcs(pc(p.root), p.typeId) : null;
}

export function keyFromName(name: string): Key {
  const minor = /m$/.test(name) && !/maj$/.test(name);
  const tonic = N(minor ? name.slice(0, -1) : name);
  return { tonic, mode: minor ? 'minor' : 'major' };
}

/** Tritone substitute root (same tritone 3–♭7). */
export const tritoneSub = (rootPc: number): number => mod(rootPc + 6, 12);
