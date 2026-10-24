// Hearing in a key: scale degrees over a cadence, melodies and bass lines to
// play back, and cadences to name. Pure logic (no DOM, no audio) so it can be tested.

import { mod, pc, practical, rawInterval, transpose, type Note } from '../theory/core';
import { prefersFlats, type Key } from '../theory/keys';

export type EarKey = 'major' | 'minor' | 'chromatic';

/** Degree names by semitones above the tonic, as players say them. */
export const DEGREE_LABELS = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'] as const;
const DEGREE_NUM = [1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 7, 7];

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
/** Natural minor plus the leading tone that every minor-key V7 uses. */
const MINOR = [0, 2, 3, 5, 7, 8, 10, 11];
const CHROMATIC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** The degrees a drill can ask, in semitones above the tonic. */
export const degreeSet = (k: EarKey): number[] => (k === 'major' ? MAJOR : k === 'minor' ? MINOR : CHROMATIC);
export const degreeLabel = (semis: number): string => DEGREE_LABELS[mod(semis, 12)];
/** Major-key tonic for the major and chromatic drills, minor for the minor one. */
export const keyModeOf = (k: EarKey): Key['mode'] => (k === 'minor' ? 'minor' : 'major');

/** A degree spelled in its key: ♭3 in E♭ is G♭, ♯4 in F is B. */
export function spellDegree(key: Key, semis: number): Note {
  const s = mod(semis, 12);
  return practical(transpose(key.tonic, rawInterval(DEGREE_NUM[s], s)), prefersFlats(key) ? 'flat' : 'sharp');
}

/** The way back home from a degree: by step through the key to the nearest tonic. */
export function resolvePath(semis: number, mode: Key['mode']): number[] {
  const scale = mode === 'minor' ? [0, 2, 3, 5, 7, 8, 11] : MAJOR;
  const s = mod(semis, 12);
  if (s === 0) return [0];
  if (s <= 6) return [s, ...scale.filter((x) => x < s).reverse()];
  return [s, ...scale.filter((x) => x > s), 12];
}

// ---------------------------------------------------------------- echo

/**
 * A short line to play back, as semitones from the tonic (may dip below it or
 * pass the octave). Mostly steps with the odd third or fourth, the way tunes
 * move; it ends on a chord tone of I. Chromatic lines end with an enclosure
 * (scale step above, half step below, target).
 */
export function echoLine(length: number, k: EarKey, rnd: () => number = Math.random): number[] {
  const scale = k === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : MAJOR;
  const toSemis = (d: number) => Math.floor(d / 7) * 12 + scale[mod(d, 7)];
  const pickOf = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];
  const stable = [0, 2, 4, 7]; // 1 3 5 8 as scale indexes
  const body = k === 'chromatic' ? Math.max(1, length - 3) : length;
  const degs = [pickOf(stable)];
  while (degs.length < body) {
    const prev = degs[degs.length - 1];
    const r = rnd();
    const step = r < 0.62 ? pickOf([-1, 1]) : r < 0.9 ? pickOf([-2, 2]) : pickOf([-3, 3]);
    degs.push(Math.max(-3, Math.min(9, prev + step)));
  }
  if (k !== 'chromatic') {
    // land on a chord tone of I: nudge the last note by a step if it isn't one
    const last = degs[length - 1];
    if (!stable.includes(mod(last, 7)) && length > 1) degs[length - 1] = last + (mod(last, 7) === 6 || mod(last, 7) === 1 || mod(last, 7) === 3 ? 1 : -1);
    if (length > 1 && degs[length - 1] === degs[length - 2]) degs[length - 2] += degs[length - 2] > 2 ? -1 : 1;
    return degs.map(toSemis);
  }
  const target = toSemis(pickOf([0, 2, 4, 7]));
  const head = degs.slice(0, length - 3).map(toSemis);
  // the enclosure starts a step above the target (a whole or half step, as the key has it)
  const above = toSemis(scale.findIndex((x) => x === mod(target, 12)) + 1 + Math.floor(target / 12) * 7);
  return [...head, above, target - 1, target].slice(-length);
}

// ---------------------------------------------------------------- bass lines

export interface BassLine {
  /** reference key the chords are written in */
  key: 'C' | 'Am';
  chords: string[];
  name: string;
}

/** Real bass lines, written in C or A minor and moved to the question's key. */
export const BASS_LINES: Record<EarKey, BassLine[]> = {
  major: [
    { key: 'C', chords: ['C', 'F', 'G', 'C'], name: 'I – IV – V – I' },
    { key: 'C', chords: ['C', 'Am', 'F', 'G'], name: 'I – vi – IV – V' },
    { key: 'C', chords: ['C', 'Am', 'Dm', 'G'], name: 'I – vi – ii – V' },
    { key: 'C', chords: ['C', 'Em', 'F', 'G'], name: 'I – iii – IV – V' },
    { key: 'C', chords: ['C', 'G/B', 'Am', 'F'], name: 'stepping down to IV' },
    { key: 'C', chords: ['C/E', 'F', 'G', 'C'], name: 'I6 – IV – V – I' },
    { key: 'C', chords: ['F', 'G', 'Em', 'Am'], name: 'IV – V – iii – vi' },
    { key: 'C', chords: ['C', 'E7/B', 'Am', 'C/G', 'F'], name: 'scale down to IV' },
    { key: 'C', chords: ['Dm7', 'G7', 'Cmaj7', 'A7'], name: 'ii – V – I – VI' },
    { key: 'C', chords: ['C', 'F/A', 'G/B', 'C'], name: 'neighbour bass' },
    { key: 'C', chords: ['Am', 'F', 'C', 'G'], name: 'vi – IV – I – V' },
    { key: 'C', chords: ['F', 'C/E', 'Dm7', 'G7', 'C'], name: 'IV down to ii – V – I' },
  ],
  minor: [
    { key: 'Am', chords: ['Am', 'Dm', 'E7', 'Am'], name: 'i – iv – V – i' },
    { key: 'Am', chords: ['Am', 'F', 'G', 'Am'], name: 'i – ♭VI – ♭VII – i' },
    { key: 'Am', chords: ['Am', 'G', 'F', 'E'], name: 'Andalusian' },
    { key: 'Am', chords: ['Am', 'Dm/F', 'E', 'Am'], name: 'i – iv6 – V – i' },
    { key: 'Am', chords: ['Bm7b5', 'E7', 'Am'], name: 'minor ii – V – i' },
    { key: 'Am', chords: ['Am', 'F', 'Dm', 'E7'], name: 'i – ♭VI – iv – V' },
    { key: 'Am', chords: ['Am', 'C/G', 'F', 'E7'], name: 'lament' },
    { key: 'Am', chords: ['Am7', 'D7', 'Am7', 'D7'], name: 'Dorian vamp' },
    { key: 'Am', chords: ['Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am'], name: 'fifths down to i' },
  ],
  chromatic: [
    { key: 'Am', chords: ['Am', 'Am/G#', 'Am/G', 'Am/F#'], name: 'line cliché' },
    { key: 'C', chords: ['C', 'Cmaj7/B', 'C7/Bb', 'A7'], name: 'descending to VI' },
    { key: 'Am', chords: ['Am', 'C/G', 'D/F#', 'F', 'E7'], name: 'chromatic lament' },
    { key: 'C', chords: ['C', 'C#dim7', 'Dm7', 'D#dim7', 'C/E'], name: 'passing diminished' },
    { key: 'C', chords: ['Em7', 'Ebdim7', 'Dm7', 'Db7', 'Cmaj7'], name: 'chromatic down with a tritone sub' },
    { key: 'C', chords: ['C', 'E7/G#', 'Am', 'C7/G', 'F'], name: 'applied chords down' },
    { key: 'C', chords: ['Cmaj7', 'Bb7', 'Am7', 'Ab7', 'G7'], name: 'backdoor and tritone subs' },
    { key: 'C', chords: ['F', 'F#dim7', 'C/G', 'A7', 'Dm7', 'G7'], name: 'IV – ♯iv°7 – I/5' },
  ],
};

// ---------------------------------------------------------------- cadences

export type CadenceSet = 'core' | 'all';

export interface Cadence {
  id: string;
  name: string;
  /** reference key the chords are written in */
  key: 'C' | 'Am';
  /** a lead-in that sets the key, then the cadence */
  lead: string[];
  chords: string[];
  why: string;
}

export const CADENCES: Cadence[] = [
  { id: 'authentic', name: 'Authentic (V–I)', key: 'C', lead: ['C', 'Am'], chords: ['F', 'G7', 'C'], why: 'Dominant to tonic with the bass falling a 5th: the full stop.' },
  { id: 'plagal', name: 'Plagal (IV–I)', key: 'C', lead: ['C', 'Am'], chords: ['Dm', 'F', 'C'], why: 'Subdominant to tonic, the "amen": no leading tone, so it settles rather than resolves.' },
  { id: 'half', name: 'Half (→ V)', key: 'C', lead: ['C', 'Am'], chords: ['C', 'Dm/F', 'G'], why: 'The phrase stops on V: a comma, not a full stop.' },
  { id: 'deceptive', name: 'Deceptive (V–vi)', key: 'C', lead: ['C', 'Am'], chords: ['F', 'G7', 'Am'], why: 'V7 goes to vi: the bass steps up a tone instead of falling a 5th, and the melody still resolves.' },
  { id: 'phrygian', name: 'Phrygian half (iv6–V)', key: 'Am', lead: ['Am', 'C/G'], chords: ['Am', 'Dm/F', 'E'], why: 'Minor-key half cadence: the bass falls a half step ♭6–5 while the top rises to the leading tone. Bach ends slow movements on it.' },
  { id: 'picardy', name: 'Picardy (minor → major I)', key: 'Am', lead: ['Am', 'C/G'], chords: ['Dm', 'E7', 'A'], why: 'A minor key that ends on a major tonic chord: the raised 3rd brightens the last chord.' },
  { id: 'backdoor', name: 'Backdoor (iv7–♭VII7–I)', key: 'C', lead: ['C', 'Am'], chords: ['Fm7', 'Bb7', 'C'], why: '♭VII7 borrowed from minor stands in for V7: the ♭6 and 4 fall by step into 5 and 3.' },
  { id: 'tritone', name: 'Tritone sub (♭II7–I)', key: 'C', lead: ['C', 'Am'], chords: ['Dm7', 'Db7', 'Cmaj7'], why: '♭II7 shares V7\'s tritone, so the bass slides down a half step into the tonic.' },
];

export const CADENCE_SETS: Record<CadenceSet, string[]> = {
  core: ['authentic', 'plagal', 'half', 'deceptive'],
  all: CADENCES.map((c) => c.id),
};
export const CADENCE_BY_ID: Record<string, Cadence> = Object.fromEntries(CADENCES.map((c) => [c.id, c]));

/** True when `notes` (pitch classes) match the line's pitch classes in order. */
export const samePcs = (played: number[], line: number[]): boolean => played.length === line.length && played.every((m, i) => mod(m, 12) === mod(line[i], 12));

/** The tonic pitch class of a key, for comparing what was played. */
export const tonicPc = (k: Key): number => pc(k.tonic);
