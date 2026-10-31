import { describe, expect, test } from 'bun:test';
import { mod, noteName } from '../src/client/theory/core';
import {
  degreeLabel, diatonicOnDegrees, droneNotes, FIFTHS, numeralOf, shapeOf, shapeText, slotOf, spellSemis, tonicFor, walkSemis,
} from '../src/client/simple/circleLogic';

const names = (tonicPc: number, scale: string) => {
  const t = tonicFor(tonicPc, scale);
  return FIFTHS.map((s) => noteName(spellSemis(t, s, scale)));
};

describe('Circle: degrees round the wheel', () => {
  test('a slot holds the degree a fifth-count away, and back', () => {
    for (let s = 0; s < 12; s++) expect(FIFTHS[slotOf(s)] as number).toBe(s);
    expect(slotOf(7)).toBe(1);
    expect(slotOf(5)).toBe(11);
    expect(slotOf(6)).toBe(6);
  });

  test('degree names follow the scale: ♯4 in major and Lydian, ♭5 in Locrian, blues and minor', () => {
    expect(degreeLabel(6, 'major')).toBe('♯4');
    expect(degreeLabel(6, 'lydian')).toBe('♯4');
    expect(degreeLabel(6, 'locrian')).toBe('♭5');
    expect(degreeLabel(6, 'blues')).toBe('♭5');
    expect(degreeLabel(6, 'minor')).toBe('♭5');
    expect(FIFTHS.map((s) => degreeLabel(s, 'major'))).toEqual(['1', '5', '2', '6', '3', '7', '♯4', '♭2', '♭6', '♭3', '♭7', '4']);
  });

  test('tonics spelled the simpler way for the scale', () => {
    expect(noteName(tonicFor(1, 'major'))).toBe('D♭');
    expect(noteName(tonicFor(1, 'minor'))).toBe('C♯');
    expect(noteName(tonicFor(8, 'major'))).toBe('A♭');
    expect(noteName(tonicFor(8, 'minor'))).toBe('G♯');
    expect(noteName(tonicFor(1, 'dorian'))).toBe('C♯');
    expect(noteName(tonicFor(6, 'major'))).toBe('F♯');
  });

  test('notes spelled by their degree, doubles made plain', () => {
    expect(names(0, 'major')).toEqual(['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F']);
    const fs = names(6, 'major');
    expect(fs[5]).toBe('E♯'); // the 7 of F♯ major
    expect(fs[6]).toBe('B♯'); // its ♯4, as F♯ Lydian spells it
    expect(names(2, 'dorian')).toContain('C'); // D Dorian: no sharps
    expect(names(1, 'minor').slice(0, 7)).toEqual(['C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯', 'G']); // the leading tone stays B♯
    expect(names(1, 'major')[8]).toBe('A'); // ♭6 of D♭ would be B𝄫
    expect(names(1, 'major')[10]).toBe('C♭'); // ♭7 of D♭, as D♭ Mixolydian spells it
  });
});

describe('Circle: chords and shapes', () => {
  test('diatonic chords on each degree', () => {
    expect(diatonicOnDegrees('major', false).map((c) => c.numeral)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    const dorian = diatonicOnDegrees('dorian', true).map((c) => c.numeral);
    expect(dorian).toContain('♭IIImaj7');
    expect(dorian).toContain('IV7');
    const harm = diatonicOnDegrees('harmonic_minor', true).map((c) => c.numeral);
    expect(harm).toContain('V7');
    expect(harm).toContain('vii°7');
    expect(diatonicOnDegrees('major_pent', false)).toEqual([]);
  });

  test('a played chord named from the key', () => {
    expect(numeralOf(10, 'dom7', 'major')).toBe('♭VII7');
    expect(numeralOf(2, 'min7', 'major')).toBe('ii7');
    expect(numeralOf(8, 'maj7', 'minor')).toBe('♭VImaj7');
  });

  test('modes are one arc, brighter the more of it is clockwise of the tonic', () => {
    const sides = ['lydian', 'major', 'mixolydian', 'dorian', 'minor', 'phrygian', 'locrian'].map((m) => shapeOf(m)!);
    expect(sides.every((s) => s.arc)).toBe(true);
    expect(sides.map((s) => s.sharp)).toEqual([6, 5, 4, 3, 2, 1, 0]);
    expect(shapeOf('major_pent')).toEqual({ arc: true, sharp: 4, flat: 0 });
    expect(shapeOf('minor_pent')).toEqual({ arc: true, sharp: 1, flat: 3 });
    expect(shapeOf('harmonic_minor')!.arc).toBe(false);
    expect(shapeOf('melodic_minor')!.arc).toBe(false);
    expect(shapeText('dorian')).toContain('Symmetric');
    expect(shapeText('blues')).toContain('♭5');
  });

  test('walks visit every root once and come home', () => {
    const w = walkSemis('fourths');
    expect(w).toHaveLength(13);
    expect(w.slice(0, 4)).toEqual([0, 5, 10, 3]);
    expect(new Set(w.slice(0, 12)).size).toBe(12);
    expect(w[12]).toBe(0);
    expect(walkSemis('fifths').slice(0, 3)).toEqual([0, 7, 2]);
  });

  test('the drone sits low on the tonic', () => {
    expect(droneNotes(0, 'root')).toEqual([36, 48]);
    expect(droneNotes(7, 'fifth')).toEqual([43, 55, 62]);
    for (let p = 0; p < 12; p++) expect(mod(droneNotes(p, 'fifth')[1], 12)).toBe(p);
  });
});
