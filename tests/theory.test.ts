import { describe, expect, test } from 'bun:test';
import { N, noteNameAscii, transpose, intervalBetween, invertInterval, pc } from '../src/client/theory/core';
import { scaleNotes } from '../src/client/theory/scales';
import { chordNotes, detectChord } from '../src/client/theory/chords';
import { diatonicChords, keySignature, parseRoman, romanFor, secondaryLabel, type Key } from '../src/client/theory/keys';
import { voiceChord } from '../src/client/theory/voicing';
import { randomRhythm } from '../src/client/theory/rhythm';

const names = (ns: { letter: number; acc: number }[]) => ns.map((n) => noteNameAscii(n)).join(' ');
const C: Key = { tonic: N('C'), mode: 'major' };
const Am: Key = { tonic: N('A'), mode: 'minor' };

describe('spelled transposition', () => {
  test('keeps letters correct', () => {
    expect(noteNameAscii(transpose(N('D'), 'M3'))).toBe('F#');
    expect(noteNameAscii(transpose(N('Bb'), 'P5'))).toBe('F');
    expect(noteNameAscii(transpose(N('E'), 'm6'))).toBe('C');
    expect(noteNameAscii(transpose(N('B'), 'A4'))).toBe('E#');
    expect(noteNameAscii(transpose(N('C'), 'm3', -1))).toBe('A');
  });
  test('interval naming + inversion', () => {
    expect(intervalBetween(N('C'), N('E'))!.id).toBe('M3');
    expect(intervalBetween(N('E'), N('C'))!.id).toBe('m6');
    expect(intervalBetween(N('F'), N('B'))!.id).toBe('A4');
    expect(invertInterval('M3').id).toBe('m6');
    expect(invertInterval('P4').id).toBe('P5');
  });
});

describe('scales', () => {
  test('major keys are spelled with one of each letter', () => {
    expect(names(scaleNotes(N('D'), 'major'))).toBe('D E F# G A B C#');
    expect(names(scaleNotes(N('F'), 'major'))).toBe('F G A Bb C D E');
    expect(names(scaleNotes(N('Eb'), 'minor'))).toBe('Eb F Gb Ab Bb Cb Db');
    expect(names(scaleNotes(N('A'), 'minor_pent'))).toBe('A C D E G');
    expect(names(scaleNotes(N('E'), 'phrygian'))).toBe('E F G A B C D');
  });
});

describe('chords', () => {
  test('spelling', () => {
    expect(names(chordNotes(N('B'), 'm7b5'))).toBe('B D F A');
    expect(names(chordNotes(N('Bb'), 'maj7'))).toBe('Bb D F A');
    expect(names(chordNotes(N('E'), '7s9'))).toBe('E G# B D Fx');
  });
  test('detection of voicings and inversions', () => {
    expect(detectChord([60, 64, 67])!.name).toBe('C');
    expect(detectChord([64, 67, 72])!.name).toBe('C/E');
    expect(detectChord([57, 60, 64, 67])!.name).toBe('Am7');
    expect(detectChord([60, 64, 67, 69])!.name).toBe('C6');
    expect(detectChord([43, 59, 62, 65])!.name).toBe('G7');
    expect(detectChord([40, 47, 52, 56, 59, 64])!.name).toBe('E');
    expect(detectChord([45, 52, 57, 60, 64])!.name).toBe('Am');
    expect(detectChord([48, 55, 60])!.name).toBe('C5');
    expect(detectChord([62, 67, 69])!.name).toBe('Dsus4');
  });
});

describe('keys & numerals', () => {
  test('signatures', () => {
    expect(keySignature({ tonic: N('E'), mode: 'major' })).toBe(4);
    expect(keySignature({ tonic: N('Eb'), mode: 'major' })).toBe(-3);
    expect(keySignature({ tonic: N('F#'), mode: 'minor' })).toBe(3);
    expect(keySignature({ tonic: N('D'), mode: 'minor' })).toBe(-1);
  });
  test('diatonic chords', () => {
    const g = diatonicChords({ tonic: N('G'), mode: 'major' });
    expect(g.map((c) => c.symbol).join(' ')).toBe('G Am Bm C D Em F♯°');
    expect(g.map((c) => c.numeral).join(' ')).toBe('I ii iii IV V vi vii°');
    const a7 = diatonicChords(Am, true);
    expect(a7.map((c) => c.symbol).join(' ')).toBe('Am7 Bm7♭5 Cmaj7 Dm7 Em7 Fmaj7 G7');
    expect(a7.map((c) => c.numeral).join(' ')).toBe('i7 iiø7 ♭IIImaj7 iv7 v7 ♭VImaj7 ♭VII7');
    const ah = diatonicChords(Am, true, 'harmonic');
    expect(ah.map((c) => c.symbol).join(' ')).toBe('Am(maj7) Bm7♭5 Cmaj7♯5 Dm7 E7 Fmaj7 G♯°7');
  });
  test('roman numeral parsing', () => {
    const sym = (s: string, k: Key = C) => parseRoman(s, k)!.symbol;
    expect(sym('bVII')).toBe('B♭');
    expect(sym('V/V')).toBe('D');
    expect(sym('V7/vi')).toBe('E7');
    expect(sym('iv')).toBe('Fm');
    expect(sym('viiø7')).toBe('Bm7♭5');
    expect(sym('Imaj7')).toBe('Cmaj7');
    expect(sym('bVI')).toBe('A♭');
    expect(sym('V', Am)).toBe('E');
    expect(sym('bVI', Am)).toBe('F');
    expect(sym('bIII', Am)).toBe('C');
    expect(sym('IV', Am)).toBe('D');
    expect(sym('iiø7', Am)).toBe('Bm7♭5');
    expect(sym('V7b9', Am)).toBe('E7♭9');
    expect(sym('bII7')).toBe('D♭7');
    expect(sym('#iv°7')).toBe('F♯°7');
    expect(sym('ii9')).toBe('Dm9');
    expect(sym('V13')).toBe('G13');
    expect(parseRoman('nonsense', C)).toBeNull();
  });
  test('roman numeral naming', () => {
    expect(romanFor(C, 10, 'maj')).toBe('♭VII');
    expect(romanFor(C, 7, 'dom7')).toBe('V7');
    expect(romanFor(C, 5, 'min')).toBe('iv');
    expect(romanFor(Am, 4, 'maj')).toBe('V');
    expect(romanFor(Am, 5, 'maj')).toBe('♭VI');
    expect(romanFor(C, 11, 'm7b5')).toBe('viiø7');
    expect(romanFor(C, 1, 'dom7')).toBe('♭II7');
    expect(romanFor(C, 6, 'dim7')).toBe('♯iv°7');
    expect(secondaryLabel(C, 2, 'maj')).toBe('V/V');
    expect(secondaryLabel(C, 4, 'dom7')).toBe('V7/vi');
    expect(secondaryLabel(C, 7, 'maj')).toBeNull();
  });
});

describe('voice leading + rhythm', () => {
  test('voiceChord keeps notes close', () => {
    const c = voiceChord(0, 'maj', null);
    const f = voiceChord(5, 'maj', c.upper);
    const moved = f.upper.reduce((s, n) => s + Math.min(...c.upper.map((p) => Math.abs(p - n))), 0);
    expect(moved).toBeLessThanOrEqual(4);
    expect(c.bass % 12).toBe(0);
  });
  test('rhythms always start on beat 1', () => {
    for (let i = 0; i < 50; i++) for (const lvl of [2, 3, 4, 5] as const) expect(randomRhythm(lvl).onsets[0]).toBe(0);
  });
});
