import { INTERVALS, mod, transpose, type Note } from './core';

export type ScaleFamily = 'major' | 'minor' | 'mode' | 'melodic' | 'symmetric' | 'bebop' | 'pentatonic' | 'blues' | 'exotic';

export interface ScaleDef {
  id: string;
  name: string;
  intervals: string[];
  formula: string;
  family: ScaleFamily;
  character: string;
  /** Where a guitarist or bassist will actually meet this sound. */
  usage: string;
}

export const SCALES: ScaleDef[] = [
  // modes of major
  { id: 'major', name: 'Ionian (major)', family: 'major', intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'], formula: '1 2 3 4 5 6 7',
    character: 'Imaj7. The 4 is an avoid note over maj7 (♭9 against the 3rd).', usage: 'Tonic major chords; Bach\'s major keys.' },
  { id: 'dorian', name: 'Dorian', family: 'mode', intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'm7'], formula: '1 2 ♭3 4 5 6 ♭7',
    character: 'm7 with a natural 13 — the funk minor.', usage: 'ii7, minor vamps ("So What", "Chameleon", "Superstition" territory).' },
  { id: 'phrygian', name: 'Phrygian', family: 'mode', intervals: ['P1', 'm2', 'm3', 'P4', 'P5', 'm6', 'm7'], formula: '1 ♭2 ♭3 4 5 ♭6 ♭7',
    character: 'Minor with ♭2: dark, Spanish.', usage: 'iii7 in major; sus♭9 chords; the Phrygian half cadence lives here.' },
  { id: 'lydian', name: 'Lydian', family: 'mode', intervals: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'M7'], formula: '1 2 3 ♯4 5 6 7',
    character: 'Major without the avoid note: ♯11 floats.', usage: 'IVmaj7, maj7♯11, modern tonic sound.' },
  { id: 'mixolydian', name: 'Mixolydian', family: 'mode', intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7'], formula: '1 2 3 4 5 6 ♭7',
    character: 'Unaltered dominant; the 4 is an avoid note unless sus.', usage: 'V7 resolving to major, funk dominant vamps, 7sus4.' },
  { id: 'minor', name: 'Aeolian (natural minor)', family: 'minor', intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'], formula: '1 2 ♭3 4 5 ♭6 ♭7',
    character: 'm7 with ♭13 — heavier than Dorian.', usage: 'vi7 in major; minor-key tonic in pop/rock.' },
  { id: 'locrian', name: 'Locrian', family: 'mode', intervals: ['P1', 'm2', 'm3', 'P4', 'd5', 'm6', 'm7'], formula: '1 ♭2 ♭3 4 ♭5 ♭6 ♭7',
    character: 'm7♭5 with ♭9.', usage: 'viiø7 / iiø7 (with ♭9 caution).' },
  // melodic minor family
  { id: 'melodic_minor', name: 'Melodic minor (jazz minor)', family: 'minor', intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'], formula: '1 2 ♭3 4 5 6 7',
    character: 'Minor tonic with major 6 and 7; no avoid notes.', usage: 'm(maj7), m6, m6/9 tonics.' },
  { id: 'dorian_b2', name: 'Dorian ♭2 (Phrygian ♮6)', family: 'melodic', intervals: ['P1', 'm2', 'm3', 'P4', 'P5', 'M6', 'm7'], formula: '1 ♭2 ♭3 4 5 6 ♭7',
    character: '2nd mode of melodic minor.', usage: 'sus♭9 chords (G7sus4♭9).' },
  { id: 'lydian_aug', name: 'Lydian augmented', family: 'melodic', intervals: ['P1', 'M2', 'M3', 'A4', 'A5', 'M6', 'M7'], formula: '1 2 3 ♯4 ♯5 6 7',
    character: '3rd mode of melodic minor.', usage: 'maj7♯5.' },
  { id: 'lydian_dom', name: 'Lydian dominant', family: 'melodic', intervals: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'm7'], formula: '1 2 3 ♯4 5 6 ♭7',
    character: '4th mode of melodic minor: Mixolydian ♯11.', usage: '7♯11, tritone subs (♭II7), IV7 in blues, non-resolving dominants.' },
  { id: 'mixolydian_b6', name: 'Mixolydian ♭6', family: 'melodic', intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'm6', 'm7'], formula: '1 2 3 4 5 ♭6 ♭7',
    character: '5th mode of melodic minor.', usage: '7♭13 dominants resolving to minor (V7/ii).' },
  { id: 'locrian_n2', name: 'Locrian ♮2', family: 'melodic', intervals: ['P1', 'M2', 'm3', 'P4', 'd5', 'm6', 'm7'], formula: '1 2 ♭3 4 ♭5 ♭6 ♭7',
    character: '6th mode of melodic minor.', usage: 'm7♭5 / m9♭5 — the smoother minor ii.' },
  { id: 'altered', name: 'Altered (super-Locrian)', family: 'melodic', intervals: ['P1', 'm2', 'A2', 'M3', 'A4', 'm6', 'm7'], formula: '1 ♭9 ♯9 3 ♯11 ♭13 ♭7',
    character: '7th mode of melodic minor: every tension altered.', usage: '7alt — V7 resolving strongly (G7alt = A♭ melodic minor).' },
  // harmonic minor family
  { id: 'harmonic_minor', name: 'Harmonic minor', family: 'minor', intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'], formula: '1 2 ♭3 4 5 ♭6 7',
    character: 'Raised 7th gives minor keys a leading tone; augmented 2nd ♭6–7.', usage: 'Bach\'s minor keys; i, iiø7, V7♭9, vii°7.' },
  { id: 'phrygian_dominant', name: 'Phrygian dominant', family: 'exotic', intervals: ['P1', 'm2', 'M3', 'P4', 'P5', 'm6', 'm7'], formula: '1 ♭2 3 4 5 ♭6 ♭7',
    character: '5th mode of harmonic minor.', usage: 'V7♭9♭13 in minor ii–V–i.' },
  // symmetric
  { id: 'dim_hw', name: 'Half-whole diminished', family: 'symmetric', intervals: ['P1', 'm2', 'A2', 'M3', 'A4', 'P5', 'M6', 'm7'], formula: '1 ♭9 ♯9 3 ♯11 5 13 ♭7',
    character: 'Octatonic; repeats every minor 3rd.', usage: '13♭9 and 7♭9 dominants (with natural 13).' },
  { id: 'dim_wh', name: 'Whole-half diminished', family: 'symmetric', intervals: ['P1', 'M2', 'm3', 'P4', 'd5', 'm6', 'M6', 'M7'], formula: '1 2 ♭3 4 ♭5 ♭6 6 7',
    character: 'Octatonic, starting with a whole step.', usage: 'Diminished 7th chords.' },
  { id: 'whole_tone', name: 'Whole tone', family: 'symmetric', intervals: ['P1', 'M2', 'M3', 'A4', 'A5', 'm7'], formula: '1 2 3 ♯4 ♯5 ♭7',
    character: 'Six whole steps; only two transpositions exist.', usage: '7♯5 / 9♯5 dominants.' },
  // bebop & pentatonic
  { id: 'bebop_dom', name: 'Bebop dominant', family: 'bebop', intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7', 'M7'], formula: '1 2 3 4 5 6 ♭7 7',
    character: 'Mixolydian + passing major 7: chord tones land on downbeats in running 8ths.', usage: 'Bebop lines over V7 (and the related ii7).' },
  { id: 'bebop_major', name: 'Bebop major', family: 'bebop', intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'A5', 'M6', 'M7'], formula: '1 2 3 4 5 ♯5 6 7',
    character: 'Major + passing ♯5.', usage: 'Lines over maj7/6 chords.' },
  { id: 'minor_pent', name: 'Minor pentatonic', family: 'pentatonic', intervals: ['P1', 'm3', 'P4', 'P5', 'm7'], formula: '1 ♭3 4 5 ♭7',
    character: 'Funk/blues vocabulary; quartal shapes.', usage: 'Over m7, m11; transposed for side-slipping and substitutions.' },
  { id: 'major_pent', name: 'Major pentatonic', family: 'pentatonic', intervals: ['P1', 'M2', 'M3', 'P5', 'M6'], formula: '1 2 3 5 6',
    character: 'No avoid notes, no half steps.', usage: 'Over maj7: from the root, from the 5th (G pent on Cmaj7 = 5 6 7 9 3), or from the 9th for Lydian (D pent = 9 3 ♯11 13 7).' },
  { id: 'blues', name: 'Blues scale', family: 'blues', intervals: ['P1', 'm3', 'P4', 'd5', 'P5', 'm7'], formula: '1 ♭3 4 ♭5 5 ♭7',
    character: 'Minor pentatonic + ♭5 blue note.', usage: 'Blues and funk; ♭3 against major 3 is the essential rub.' },
];

export const SCALE_BY_ID: Record<string, ScaleDef> = Object.fromEntries(SCALES.map((s) => [s.id, s]));

/** The seven diatonic modes in their order of derivation from the major scale. */
export const MODES = [
  { scale: 'major', mode: 'Ionian', degree: 1 },
  { scale: 'dorian', mode: 'Dorian', degree: 2 },
  { scale: 'phrygian', mode: 'Phrygian', degree: 3 },
  { scale: 'lydian', mode: 'Lydian', degree: 4 },
  { scale: 'mixolydian', mode: 'Mixolydian', degree: 5 },
  { scale: 'minor', mode: 'Aeolian', degree: 6 },
  { scale: 'locrian', mode: 'Locrian', degree: 7 },
] as const;

/** The seven modes of melodic minor. */
export const MELODIC_MODES = [
  { scale: 'melodic_minor', mode: 'Melodic minor', degree: 1, chord: 'mmaj7' },
  { scale: 'dorian_b2', mode: 'Dorian ♭2', degree: 2, chord: '7sus4' },
  { scale: 'lydian_aug', mode: 'Lydian augmented', degree: 3, chord: 'maj7s5' },
  { scale: 'lydian_dom', mode: 'Lydian dominant', degree: 4, chord: '7s11' },
  { scale: 'mixolydian_b6', mode: 'Mixolydian ♭6', degree: 5, chord: '7b13' },
  { scale: 'locrian_n2', mode: 'Locrian ♮2', degree: 6, chord: 'm9b5' },
  { scale: 'altered', mode: 'Altered', degree: 7, chord: '7alt' },
] as const;

export function getScale(id: string): ScaleDef {
  const s = SCALE_BY_ID[id];
  if (!s) throw new Error(`Unknown scale ${id}`);
  return s;
}

export function scaleNotes(root: Note, id: string): Note[] {
  return getScale(id).intervals.map((i) => transpose(root, i));
}

export function scalePcs(rootPc: number, id: string): number[] {
  return getScale(id).intervals.map((i) => mod(rootPc + INTERVALS[i].semis, 12));
}

export function scaleSemis(id: string): number[] {
  return getScale(id).intervals.map((i) => INTERVALS[i].semis);
}

/** MIDI notes for a one-octave ascending scale starting at `startMidi`, including the octave. */
export function scaleMidis(startMidi: number, id: string, octaves = 1): number[] {
  const semis = scaleSemis(id);
  const out: number[] = [];
  for (let o = 0; o < octaves; o++) for (const s of semis) out.push(startMidi + o * 12 + s);
  out.push(startMidi + octaves * 12);
  return out;
}

/** Degree label of a pitch class within a scale ("♭3"…) or null when outside. */
export function degreeInScale(rootPc: number, id: string, p: number): string | null {
  const semis = mod(p - rootPc, 12);
  const s = getScale(id);
  for (const i of s.intervals) if (INTERVALS[i].semis === semis) return INTERVALS[i].degree;
  return null;
}
