import { describe, expect, test } from 'bun:test';
import { noteName, N, mod, pc } from '../src/client/theory/core';
import { keyFromName, type Key } from '../src/client/theory/keys';
import { progressionInKey, resolveChord } from '../src/client/learn/music';
import { BASS_LINES, CADENCES, degreeSet, echoLine, resolvePath, spellDegree } from '../src/client/simple/earLogic';
import { chordTones, FORMS, guideTones, judge, nearestGuide, roundsFor, slotOf, type Slot } from '../src/client/simple/changesLogic';
import { cellLabel, cellResults, cellsOf, repeatBar, scoreTaps } from '../src/client/simple/rhythmLogic';
import { notePool, noteId, sameChord, sigKeyName, stackChord } from '../src/client/simple/readLogic';
import { NUMERAL_SETS, randomProgression, RESOLVES } from '../src/client/simple/logic';
import { readiness } from '../src/client/simple/stats';
import { patternFromCells } from '../src/client/theory/rhythm';

const key = (name: string): Key => keyFromName(name);

describe('Ear: hearing in a key', () => {
  test('degrees are spelled in their key', () => {
    expect(noteName(spellDegree(key('Eb'), 3))).toBe('G♭');
    expect(noteName(spellDegree(key('F'), 6))).toBe('B');
    expect(noteName(spellDegree(key('D'), 10))).toBe('C');
    expect(noteName(spellDegree(key('A'), 1))).toBe('B♭');
    expect(noteName(spellDegree(key('Cm'), 8))).toBe('A♭');
  });
  test('minor degrees include the leading tone; chromatic has all twelve', () => {
    expect(degreeSet('minor')).toContain(11);
    expect(degreeSet('chromatic')).toHaveLength(12);
  });
  test('a degree walks home by step', () => {
    expect(resolvePath(4, 'major')).toEqual([4, 2, 0]);
    expect(resolvePath(11, 'major')).toEqual([11, 12]);
    expect(resolvePath(9, 'major')).toEqual([9, 11, 12]);
  });
  test('echo lines: the right length, mostly steps, ending on a chord tone (or an enclosure)', () => {
    let rnd = 1;
    const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) {
      const len = 3 + (i % 4);
      const major = echoLine(len, 'major', r);
      expect(major).toHaveLength(len);
      expect([0, 4, 7]).toContain(mod(major[len - 1], 12));
      for (let j = 1; j < len; j++) expect(Math.abs(major[j] - major[j - 1])).toBeLessThanOrEqual(7);
      const chrom = echoLine(len, 'chromatic', r);
      expect(chrom).toHaveLength(len);
      const [a, b, c] = chrom.slice(-3);
      expect(c - b).toBe(1);
      expect([1, 2]).toContain(a - c);
    }
  });
  test('every bass line and cadence parses in every key', () => {
    for (const k of ['C', 'Eb', 'F#', 'Bb', 'Am', 'C#m', 'Ebm']) {
      for (const lines of Object.values(BASS_LINES)) for (const b of lines) {
        const target = key(k).mode === key(b.key).mode ? key(k) : { tonic: key(k).tonic, mode: key(b.key).mode };
        for (const sym of progressionInKey(b.chords, b.key, target)) expect(resolveChord(sym, target)).not.toBeNull();
      }
      for (const c of CADENCES) {
        const target = { tonic: key(k).tonic, mode: key(c.key).mode };
        for (const sym of progressionInKey([...c.lead, ...c.chords], c.key, target)) expect(resolveChord(sym, target)).not.toBeNull();
      }
    }
  });
});

describe('Changes: playing over a loop', () => {
  test('guide tones are the 3rd and 7th', () => {
    expect(guideTones(2, 'min7')).toEqual([5, 0]); // Dm7: F C
    expect(guideTones(7, 'dom7')).toEqual([11, 5]); // G7: B F
    expect(guideTones(0, 'maj7')).toEqual([4, 11]); // Cmaj7: E B
    expect(guideTones(11, 'm7b5')).toEqual([2, 9]); // Bm7♭5: D A
    expect(guideTones(0, 'maj6')).toEqual([4, 9]); // C6: E A
    expect(chordTones(7, 'dom7').sort((a, b) => a - b)).toEqual([2, 5, 7, 11]);
  });
  test('every form resolves in every key', () => {
    for (const f of FORMS) {
      expect(f.beats).toHaveLength(f.chords.length);
      expect(roundsFor(f)).toBeGreaterThanOrEqual(1);
      for (const k of ['C', 'Db', 'F#', 'Gm', 'Ebm']) {
        const target = { tonic: key(k).tonic, mode: key(f.key).mode };
        for (const sym of progressionInKey(f.chords, f.key, target)) expect(resolveChord(sym, target)).not.toBeNull();
      }
    }
  });
  // ii–V–I in C at one second per beat, four beats each
  const slots: Slot[] = [
    { start: 0, end: 4, rootPc: 2, typeId: 'min7', pos: 0 },
    { start: 4, end: 8, rootPc: 7, typeId: 'dom7', pos: 1 },
    { start: 8, end: 12, rootPc: 0, typeId: 'maj7', pos: 2 },
  ];
  test('a note just before a change counts for the next chord', () => {
    expect(slotOf(slots, 3.9, 0.15)).toBe(1);
    expect(slotOf(slots, 3.5, 0.15)).toBe(0);
    expect(slotOf(slots, -0.1, 0.15)).toBe(0);
    expect(slotOf(slots, 13, 0.15)).toBe(-1);
  });
  test('guide tones: any 3rd or 7th while the chord sounds', () => {
    const r = judge('guide', slots, [{ t: 1, note: 62 }, { t: 2, note: 65 }, { t: 5, note: 67 }, { t: 9, note: 71 }], 1);
    expect(r.map((x) => x.ok)).toEqual([true, false, true]);
    expect(r[1].why).toBe('no 3rd or 7th');
  });
  test('beat 1: the note nearest the change must be a chord tone', () => {
    const r = judge('downbeat', slots, [{ t: 0.05, note: 62 }, { t: 4.02, note: 61 }, { t: 9.5, note: 64 }], 1);
    expect(r.map((x) => x.ok)).toEqual([true, false, false]);
    expect(r[2].why).toBe('nothing on beat 1');
  });
  test('guide-tone line: C–B–B moves by step, a leap breaks it', () => {
    expect(judge('line', slots, [{ t: 0.1, note: 72 }, { t: 4.1, note: 71 }, { t: 8.1, note: 71 }], 1).every((x) => x.ok)).toBe(true);
    const leap = judge('line', slots, [{ t: 0.1, note: 72 }, { t: 4.1, note: 77 }, { t: 8.1, note: 76 }], 1);
    expect(leap.map((x) => x.ok)).toEqual([true, false, true]);
    expect(nearestGuide(72, 7, 'dom7')).toBe(71);
  });
});

describe('Rhythm', () => {
  const bar = patternFromCells(['1000', '1010', '0110', '1011'], 4);
  test('cells and how they are counted', () => {
    expect(cellsOf(bar)).toEqual(['1000', '1010', '0110', '1011']);
    expect(cellLabel('1011')).toBe('1 · & a');
    expect(cellLabel('0110')).toBe('· e & ·');
    expect(cellLabel('011')).toBe('· trip let');
    expect(cellLabel('0000')).toBe('(rest)');
  });
  test('perfect taps over two bars score every note, no extras', () => {
    const long = repeatBar(bar, 2);
    const step = 60 / 90 / 4;
    const taps = long.onsets.map((o) => o * step + 0.01);
    const s = scoreTaps(long, 90, taps);
    expect(s.hits).toBe(long.onsets.length);
    expect(s.extras).toBe(0);
    expect(s.lean).toBe(10);
    expect(cellResults(bar, long, 90, taps, s).every((c) => c.ok)).toBe(true);
  });
  test('a missed note and an extra tap mark their beats wrong', () => {
    const long = repeatBar(bar, 2);
    const step = 60 / 90 / 4;
    // drop the "e" of beat 3 in the second bar, add a tap on the "e" of beat 1
    const taps = long.onsets.filter((o) => o !== 16 + 9).map((o) => o * step);
    taps.push(1 * step);
    const s = scoreTaps(long, 90, taps.sort((a, b) => a - b));
    expect(s.hits).toBe(long.onsets.length - 1);
    expect(s.extras).toBe(1);
    expect(cellResults(bar, long, 90, taps, s).map((c) => c.ok)).toEqual([false, true, false, true]);
  });
});

describe('Read', () => {
  test('note pools follow the clef and range', () => {
    expect(notePool('treble', 'staff').map(noteId)).toEqual(['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']);
    expect(notePool('bass', 'staff').map(noteId)).toEqual(['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3']);
    const ledger = notePool('treble', 'ledger').map(noteId);
    expect(ledger[0]).toBe('A3');
    expect(ledger[ledger.length - 1]).toBe('C6');
    expect(notePool('treble', 'accidentals')).toHaveLength(3 * ledger.length);
    expect(notePool('treble', 'accidentals').find((n) => noteId(n) === 'C♭4')!.midi).toBe(59);
  });
  test('chords stack in spelling order, inversions move the bass', () => {
    const c = stackChord(N('E♭'), 'dom7', 0);
    expect(c.names).toEqual(['E♭', 'G', 'B♭', 'D♭']);
    expect(c.midis.every((m, i) => i === 0 || m > c.midis[i - 1])).toBe(true);
    const inv = stackChord(N('A'), 'min', 2);
    expect(inv.names).toEqual(['E', 'A', 'C']);
    expect(sameChord([52, 57, 60], inv.midis)).toBe(true);
    expect(sameChord([57, 60, 64, 67], inv.midis)).toBe(false);
  });
  test('signatures name their keys', () => {
    expect(sigKeyName(-3, 'major')).toBe('E♭');
    expect(sigKeyName(-3, 'minor')).toBe('Cm');
    expect(sigKeyName(6, 'major')).toBe('F♯');
    expect(sigKeyName(0, 'minor')).toBe('Am');
  });
});

describe('out-of-key progressions', () => {
  test('secondary dominants and subs always resolve, and never end the line', () => {
    for (const level of ['secondary', 'subs', 'borrowed'] as const) {
      const set = NUMERAL_SETS[level];
      for (let i = 0; i < 300; i++) {
        const p = randomProgression(set, 4);
        expect(p[0]).toBe(set[0]);
        for (let j = 0; j < p.length; j++) {
          const to = RESOLVES[p[j]];
          if (to && set.includes(to)) {
            expect(j).toBeLessThan(p.length - 1);
            expect(p[j + 1]).toBe(to);
          }
          if (j) expect(p[j]).not.toBe(p[j - 1]);
        }
      }
    }
  });
  test('every numeral in the new sets resolves to a chord in any key', () => {
    for (const level of ['secondary', 'subs', 'borrowed'] as const) for (const n of NUMERAL_SETS[level]) for (const k of ['C', 'Eb', 'B']) expect(resolveChord(n, key(k))).not.toBeNull();
    expect(resolveChord('V7/ii', key('Eb'))!.symbol).toBe('C7');
    expect(resolveChord('♭II7', key('C'))!.symbol).toBe('D♭7');
  });
});

describe('level up', () => {
  const st = (ema: number, n = 6) => ({ n, ema, last: 0 });
  test('ready when nearly everything is asked and right', () => {
    const pool = ['a', 'b', 'c', 'd', 'e'];
    expect(readiness({ a: st(0.95), b: st(0.9), c: st(0.92), d: st(0.88) }, pool).ready).toBe(true);
    expect(readiness({ a: st(0.95), b: st(0.9), c: st(0.92) }, pool).ready).toBe(false); // too few asked
    expect(readiness({ a: st(0.95), b: st(0.9), c: st(0.92), d: st(0.5) }, pool).ready).toBe(false); // one weak spot
    expect(readiness({ a: st(0.3, 4), b: st(0.4, 4), c: st(0.2, 4) }, pool).struggling).toBe(true);
    expect(readiness(undefined, pool)).toEqual({ ready: false, struggling: false });
  });
});

test('pitch classes of a stacked chord match its spelling', () => {
  const c = stackChord(N('F♯'), 'm7b5', 1);
  expect(c.midis.map((m) => mod(m, 12))).toEqual(c.names.map((n) => pc(N(n))));
});
