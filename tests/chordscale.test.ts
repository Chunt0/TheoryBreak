import { describe, expect, test } from 'bun:test';
import { INTERVALS, mod, N, noteName, pc } from '../src/client/theory/core';
import { chordSymbol, getChord } from '../src/client/theory/chords';
import { getScale, scalePcs } from '../src/client/theory/scales';
import { MAJOR_KEYS } from '../src/client/theory/keys';
import {
  answersFor, chordVoicing, CS_ITEMS, CS_LEVELS, csLabel, itemsFor, makeQ, melodicParent, overChord, spellsCleanly, stillFits,
} from '../src/client/simple/chordScaleLogic';

const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const labels = (root: string, type: string, scale: string) => overChord(N(root), type, scale).map((t) => t.label).join(' ');
const avoid = (root: string, type: string, scale: string) => overChord(N(root), type, scale).filter((t) => t.role === 'avoid').map((t) => noteName(t.note));

describe('Chord–scale: the question bank', () => {
  test('every scale named fits its chord: chord tones and written tensions are all in it', () => {
    for (const it of CS_ITEMS) {
      const chordPcs = getChord(it.type).intervals.map((i) => mod(INTERVALS[i].semis, 12));
      for (const s of it.scales) {
        const pcs = scalePcs(0, s);
        for (const p of chordPcs) expect({ item: it.id, scale: s, pc: p, fits: pcs.includes(p) }).toEqual({ item: it.id, scale: s, pc: p, fits: true });
      }
    }
  });

  test('accepted scales are offered as answers, at their own level and under Everything', () => {
    for (const it of CS_ITEMS) {
      for (const level of [it.level, 'mixed'] as const) expect(answersFor(it, level)).toContain(it.scales[0]);
      expect(answersFor(it, it.level).length).toBeLessThanOrEqual(8);
      expect(answersFor(it, 'mixed').length).toBeLessThanOrEqual(8);
      // alternatives can be played note for note against the same strip
      const n = getScale(it.scales[0]).intervals.length;
      for (const s of it.scales) expect(getScale(s).intervals.length).toBe(n);
    }
    for (const l of CS_LEVELS) expect(itemsFor(l.id).length).toBeGreaterThanOrEqual(6);
    expect(new Set(CS_ITEMS.map((i) => i.id)).size).toBe(CS_ITEMS.length);
    for (const it of CS_ITEMS) expect(csLabel(it.id)).not.toBe(it.id);
  });

  test('in a major key the scale is the key\'s notes over the chord tones (subV aside)', () => {
    for (const it of CS_ITEMS.filter((i) => (i.level === 'major' || i.level === 'secondary') && i.id !== 'sec.subV')) {
      for (const k of MAJOR_KEYS.filter((m) => Math.abs(m.sig) <= 5)) {
        const keyPcs = scalePcs(pc(k.tonic), 'major');
        const rootPc = mod(pc(k.tonic) + INTERVALS[it.from].semis, 12);
        const chord = getChord(it.type).intervals.map((i) => mod(rootPc + INTERVALS[i].semis, 12));
        for (const p of scalePcs(rootPc, it.scales[0])) expect(keyPcs.includes(p) || chord.includes(p)).toBe(true);
      }
    }
  });

  test('questions spell with single sharps and flats in every key they land in', () => {
    for (const it of CS_ITEMS) {
      const rnd = seeded(it.id.length * 97 + 3);
      for (let i = 0; i < 40; i++) expect(spellsCleanly(makeQ(it, rnd))).toBe(true);
    }
  });

  test('context: numerals land on the right chords and targets', () => {
    const at = (id: string, tonicIdx: number) => makeQ(CS_ITEMS.find((i) => i.id === id)!, () => tonicIdx);
    // rnd() = 0 picks the first tonic, C
    const iii = at('maj.iii', 0);
    expect(chordSymbol(iii.root, iii.item.type)).toBe('Em7');
    const sec = at('sec.ii', 0);
    expect(chordSymbol(sec.root, sec.item.type)).toBe('A7');
    expect(noteName(sec.target!.root)).toBe('D');
    expect(sec.target!.minor).toBe(true);
    const subV = at('sec.subV', 0);
    expect(noteName(subV.root)).toBe('D♭');
    const minV = at('min.V', 0); // A minor
    expect(chordSymbol(minV.root, minV.item.type)).toBe('E7♭9');
  });
});

describe('Chord–scale: the scale over the chord', () => {
  test('labels say what each note is over the chord', () => {
    expect(labels('D', 'min7', 'dorian')).toBe('R 9 ♭3 11 5 13 ♭7');
    expect(labels('A', 'dom7', 'mixolydian_b6')).toBe('R 9 3 11 5 ♭13 ♭7');
    expect(labels('G', '7alt', 'altered')).toBe('R ♭9 ♯9 3 ♯11 ♭13 ♭7');
    expect(labels('G', '13b9', 'dim_hw')).toBe('R ♭9 ♯9 3 ♯11 5 13 ♭7');
    expect(labels('G', '7sus4', 'mixolydian')).toBe('R 9 3 4 5 13 ♭7');
    expect(labels('B', 'm7b5', 'locrian')).toBe('R ♭9 ♭3 11 ♭5 ♭13 ♭7');
  });

  test('avoid notes: a half step above a chord tone; on dominants only the 11, on sus the 3', () => {
    expect(avoid('C', 'maj7', 'major')).toEqual(['F']);
    expect(avoid('D', 'min7', 'dorian')).toEqual([]);
    expect(avoid('E', 'min7', 'phrygian')).toEqual(['F', 'C']);
    expect(avoid('A', 'min7', 'minor')).toEqual(['F']);
    expect(avoid('F', 'maj7', 'lydian')).toEqual([]);
    expect(avoid('G', 'dom7', 'mixolydian')).toEqual(['C']);
    expect(avoid('G', '7sus4', 'mixolydian')).toEqual(['B']);
    expect(avoid('B', 'm7b5', 'locrian')).toEqual(['C']);
    expect(avoid('B', 'm7b5', 'locrian_n2')).toEqual([]);
    expect(avoid('G', '7b9', 'phrygian_dominant')).toEqual(['C']);
    expect(avoid('G', '7alt', 'altered')).toEqual([]);
    expect(avoid('C', 'min6', 'melodic_minor')).toEqual([]);
    expect(avoid('C', 'min6', 'dorian')).toEqual(['B♭']);
  });

  test('played notes narrow the accepted scales', () => {
    expect(stillFits(['locrian_n2', 'locrian'], [0])).toEqual(['locrian_n2', 'locrian']);
    expect(stillFits(['locrian_n2', 'locrian'], [0, 1])).toEqual(['locrian']);
    expect(stillFits(['locrian_n2', 'locrian'], [0, 2, 3])).toEqual(['locrian_n2']);
    expect(stillFits(['dorian'], [0, 2, 3, 5, 7, 9, 10, 12])).toEqual(['dorian']);
    expect(stillFits(['dorian'], [0, 2, 3, 5, 7, 9, 10, 0])).toEqual([]);
    expect(stillFits(['dorian'], [0, 2, 4])).toEqual([]);
  });

  test('the held chord has its root at the bottom', () => {
    for (const it of CS_ITEMS) {
      for (const r of [0, 5, 11]) {
        const v = chordVoicing(r, it.type);
        expect(v[0]).toBe(36 + r);
        expect(Math.min(...v.slice(1))).toBeGreaterThan(v[0]);
        expect(Math.max(...v)).toBeLessThanOrEqual(84);
      }
    }
  });

  test('melodic-minor modes name their parent', () => {
    const alt = melodicParent(N('G'), 'altered')!;
    expect([noteName(alt.tonic), alt.degree]).toEqual(['A♭', 7]);
    const ld = melodicParent(N('F'), 'lydian_dom')!;
    expect([noteName(ld.tonic), ld.degree]).toEqual(['C', 4]);
    expect(melodicParent(N('C'), 'dorian')).toBeNull();
  });
});
