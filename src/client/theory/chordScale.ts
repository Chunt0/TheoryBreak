// Chord–scale relationships, upper-structure triads and guide tones.

import { INTERVALS, mod } from './core';
import { getChord } from './chords';

export interface ScaleChoice {
  scale: string;
  when: string;
}

/** Scales that fit each chord type, most common first. */
export const CHORD_SCALES: Record<string, ScaleChoice[]> = {
  maj7: [{ scale: 'major', when: 'Imaj7 (treat the 4 as a passing note)' }, { scale: 'lydian', when: 'IVmaj7, or a brighter tonic' }],
  maj9: [{ scale: 'major', when: 'tonic' }, { scale: 'lydian', when: 'IV / modern tonic' }],
  maj6: [{ scale: 'major', when: 'tonic' }, { scale: 'major_pent', when: 'no avoid notes' }],
  '69': [{ scale: 'major_pent', when: 'the chord IS the pentatonic' }, { scale: 'major', when: 'tonic' }],
  maj7s11: [{ scale: 'lydian', when: 'always' }],
  maj9s11: [{ scale: 'lydian', when: 'always' }],
  maj13: [{ scale: 'lydian', when: '♯11 keeps the 13 bright' }, { scale: 'major', when: 'tonic' }],
  maj7s5: [{ scale: 'lydian_aug', when: '3rd mode of melodic minor' }],
  min7: [{ scale: 'dorian', when: 'ii7, minor vamps' }, { scale: 'minor', when: 'vi7 / minor-key i7' }, { scale: 'phrygian', when: 'iii7' }],
  min9: [{ scale: 'dorian', when: 'ii9 / funk minor' }, { scale: 'minor', when: 'vi9' }],
  min11: [{ scale: 'dorian', when: 'modal / quartal' }],
  min13: [{ scale: 'dorian', when: 'natural 13 = Dorian' }],
  m69: [{ scale: 'dorian', when: 'minor tonic colour' }, { scale: 'melodic_minor', when: 'jazz minor tonic' }],
  min6: [{ scale: 'melodic_minor', when: 'minor tonic (i6)' }, { scale: 'dorian', when: 'minor iv6 or ii6' }],
  mmaj7: [{ scale: 'melodic_minor', when: 'minor tonic' }, { scale: 'harmonic_minor', when: 'classical minor tonic' }],
  mmaj9: [{ scale: 'melodic_minor', when: 'minor tonic' }],
  m7b5: [{ scale: 'locrian_n2', when: 'iiø7 with a natural 9' }, { scale: 'locrian', when: 'viiø7 in major' }],
  m9b5: [{ scale: 'locrian_n2', when: 'always' }],
  dim7: [{ scale: 'dim_wh', when: 'whole-half from the root' }],
  dom7: [{ scale: 'mixolydian', when: 'V7 → major' }, { scale: 'bebop_dom', when: 'running 8th-note lines' }],
  dom9: [{ scale: 'mixolydian', when: 'funk / unaltered V' }],
  dom13: [{ scale: 'mixolydian', when: 'unaltered V' }],
  '7s11': [{ scale: 'lydian_dom', when: 'subV7, non-resolving dominants, IV7 in blues' }],
  '13s11': [{ scale: 'lydian_dom', when: 'always' }],
  '7b13': [{ scale: 'mixolydian_b6', when: 'V7 → minor (e.g. VI7♭13 → ii)' }],
  '7b9': [{ scale: 'dim_hw', when: 'with natural 13' }, { scale: 'phrygian_dominant', when: 'resolving to minor (♭13)' }],
  '13b9': [{ scale: 'dim_hw', when: 'always' }],
  '7b9b13': [{ scale: 'phrygian_dominant', when: 'V of minor' }, { scale: 'altered', when: 'add ♯9/♯11 for more tension' }],
  '7s9': [{ scale: 'altered', when: 'with ♭13' }, { scale: 'dim_hw', when: 'with natural 13' }, { scale: 'blues', when: 'funk/blues context' }],
  '7alt': [{ scale: 'altered', when: 'always (= melodic minor a half step up)' }],
  aug7: [{ scale: 'whole_tone', when: '9 and ♯11 natural, ♯5' }, { scale: 'altered', when: 'with ♭9/♯9' }],
  '7b5': [{ scale: 'whole_tone', when: 'with ♯5' }, { scale: 'lydian_dom', when: '♭5 = ♯11' }],
  '7sus4': [{ scale: 'mixolydian', when: 'sus dominant' }, { scale: 'dorian', when: 'sus as "ii over V"' }],
  '9sus4': [{ scale: 'mixolydian', when: 'IV/V gospel dominant' }],
  '13sus4': [{ scale: 'mixolydian', when: 'Maiden Voyage colour' }],
};

export interface UpperStructure {
  /** semitones from the dominant root to the triad root */
  semis: number;
  numeral: string;
  quality: 'maj' | 'min';
  tensions: string;
  scale: string;
}

/** Major triads over a dominant 7th (shell 3–♭7 in the left hand). */
export const DOMINANT_USTS: UpperStructure[] = [
  { semis: 2, numeral: 'II', quality: 'maj', tensions: '9 · ♯11 · 13', scale: 'lydian_dom' },
  { semis: 3, numeral: '♭III', quality: 'maj', tensions: '♯9 · 5 · ♭7', scale: 'dim_hw' },
  { semis: 6, numeral: '♭V', quality: 'maj', tensions: '♯11 · ♭7 · ♭9', scale: 'dim_hw' },
  { semis: 8, numeral: '♭VI', quality: 'maj', tensions: '♭13 · R · ♯9', scale: 'altered' },
  { semis: 9, numeral: 'VI', quality: 'maj', tensions: '13 · ♭9 · 3', scale: 'dim_hw' },
  { semis: 10, numeral: '♭VII', quality: 'maj', tensions: '♭7 · 9 · 11 (sus)', scale: 'mixolydian' },
  { semis: 1, numeral: '♭II', quality: 'maj', tensions: '♭9 · 11 · ♭13 (sus♭9)', scale: 'phrygian' },
  { semis: 3, numeral: '♭iii', quality: 'min', tensions: '♯9 · ♯11 · ♭7', scale: 'altered' },
];

/** Tension label for a pitch over a chord root (dominant context). */
export function tensionLabel(rootPc: number, p: number): string {
  const labels = ['R', '♭9', '9', '♯9', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'];
  return labels[mod(p - rootPc, 12)];
}

/** The two guide tones (3rd and 7th — or their sus/6 stand-ins) of a chord. */
export function guideTones(rootPc: number, typeId: string): [number, number] {
  const ivs = getChord(typeId).intervals;
  const third = ivs.find((i) => i === 'M3' || i === 'm3') ?? ivs.find((i) => i === 'P4' || i === 'M2') ?? 'P5';
  const seventh = ivs.find((i) => i === 'm7' || i === 'M7' || i === 'd7') ?? ivs.find((i) => i === 'M6') ?? 'P5';
  return [mod(rootPc + INTERVALS[third].semis, 12), mod(rootPc + INTERVALS[seventh].semis, 12)];
}
