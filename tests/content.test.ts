// Content correctness: the drills must never mark a right answer wrong.
import { describe, expect, test } from 'bun:test';
import { N, intervalBetween, mod, pc } from '../src/client/theory/core';
import { chordPcs } from '../src/client/theory/chords';
import { parseRoman } from '../src/client/theory/keys';
import { scalePcs } from '../src/client/theory/scales';
import { INTERCHANGE } from '../src/client/learn/gen/jazz';
import { VL_BANK, type VlError } from '../src/client/learn/gen/bach';
import { CONCEPTS } from '../src/client/learn/gen/concepts';
import { countString } from '../src/client/learn/gen/rhythm';
import { patternFromCells } from '../src/client/theory/rhythm';
import { parseChordSymbol, progressionInKey, resolveChord, parsePitch } from '../src/client/learn/music';
import { PROGRESSION_BY_ID } from '../src/client/theory/progressions';
import { SKILL_BY_ID } from '../src/client/learn/skills';
import { weightedPick } from '../src/client/learn/srs';
import type { GenContext, Question } from '../src/client/learn/types';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const ctxFor = (seed: number): GenContext => {
  const rnd = seeded(seed);
  return { rnd, pickItem: (items) => weightedPick(items, undefined, rnd) };
};

describe('modal interchange', () => {
  const MODES: Record<string, string> = { Dorian: 'dorian', Phrygian: 'phrygian', Lydian: 'lydian', Mixolydian: 'mixolydian', Aeolian: 'minor', Locrian: 'locrian' };
  test('the listed source modes are exactly the church modes that contain the chord', () => {
    const C = { tonic: N('C'), mode: 'major' as const };
    for (const it of INTERCHANGE) {
      const ch = parseRoman(it.num, C)!;
      const pcs = chordPcs(pc(ch.root), ch.typeId);
      const containing = Object.entries(MODES).filter(([, id]) => pcs.every((p) => scalePcs(0, id).includes(p))).map(([name]) => name);
      expect([it.mode, ...(it.also ?? [])].sort()).toEqual(containing.sort());
    }
  });
});

// ---------------------------------------------------------------------------
// A small SATB checker: enough to verify that each example shows exactly its error.

type Satb = number[]; // bass, tenor, alto, soprano (MIDI)

function vlProblems(a: Satb, b: Satb, labels: [string, string], tonicPc: number): Set<VlError> {
  const out = new Set<VlError>();
  const rel = (m: number) => mod(m - tonicPc, 12);
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const before = mod(a[j] - a[i], 12);
      const after = mod(b[j] - b[i], 12);
      const bothMove = a[i] !== b[i] && a[j] !== b[j];
      if (bothMove && before === after && before === 7) out.add('par5');
      if (bothMove && before === after && before === 0) out.add('par8');
    }
  }
  // direct octaves in the outer voices: similar motion into an octave, soprano leaps
  const sDir = Math.sign(b[3] - a[3]);
  if (mod(b[3] - b[0], 12) === 0 && mod(a[3] - a[0], 12) !== 0 && sDir !== 0 && sDir === Math.sign(b[0] - a[0]) && Math.abs(b[3] - a[3]) > 2) out.add('direct');
  for (const ch of [a, b]) {
    if (ch[3] - ch[2] > 12 || ch[2] - ch[1] > 12) out.add('space');
  }
  // doubled leading tone in a dominant chord
  for (const [ch, lab] of [[a, labels[0]], [b, labels[1]]] as const) {
    if (/^(V|vii)/.test(lab) && ch.filter((m) => rel(m) === 11).length > 1) out.add('dbllt');
  }
  if (/^V/.test(labels[0]) && labels[1] === 'I') {
    // soprano leading tone must rise to the tonic (inner voices may drop)
    if (rel(a[3]) === 11 && rel(b[3]) !== 0) out.add('lt');
    // the chordal 7th (scale degree 4) resolves down by step
    a.forEach((m, v) => {
      if (labels[0] === 'V7' && rel(m) === 5 && !(b[v] < m && m - b[v] <= 2)) out.add('sev');
    });
  }
  return out;
}

describe('voice-leading bank', () => {
  test('every example shows exactly its labelled problem, in every key it is transposed to', () => {
    for (const ex of VL_BANK) {
      const want = ex.error === 'ok' ? [] : [ex.error];
      const a = ex.a.map((v) => parsePitch(v)!);
      const b = ex.b.map((v) => parsePitch(v)!);
      for (const t of [-4, -3, -2, 0, 2, 3, 4, 5, -5]) {
        expect([...vlProblems(a.map((m) => m + t), b.map((m) => m + t), ex.labels, mod(t, 12))]).toEqual(want);
      }
    }
  });

  test('questions are transposed and spelled, explanations follow the key', () => {
    const q = SKILL_BY_ID['bach.vl'];
    const keys = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const x = q.gen(ctxFor(i * 31 + 7));
      keys.add(x.sub ?? '');
      expect(x.explain).not.toMatch(/\[|\]/);
      for (const c of x.show!.staff!.chords) {
        expect(c.names!.length).toBe(4);
        expect(c.notes[0]).toBeGreaterThanOrEqual(38);
        expect(c.notes[3]).toBeGreaterThanOrEqual(60);
        expect(c.notes[3]).toBeLessThanOrEqual(81);
      }
    }
    expect(keys.size).toBeGreaterThan(4);
  });
});

describe('concept checks', () => {
  test('four distinct options and a real explanation each', () => {
    for (const c of CONCEPTS) {
      expect(c.options.length).toBe(4);
      expect(new Set(c.options).size).toBe(4);
      expect(c.a).toBe(0);
      expect(c.why.length).toBeGreaterThan(20);
    }
  });
});

describe('chord drills', () => {
  const playQ = (typeId: string, seed: number): Question => {
    for (let i = 0; i < 400; i++) {
      const q = SKILL_BY_ID['gym.play.ext'].gen(ctxFor(seed + i * 101));
      if (q.item === typeId) return q;
    }
    throw new Error(`no ${typeId} question generated`);
  };

  test('7alt accepts any altered voicing, rejects natural tensions and thin ones', () => {
    const q = playQ('7alt', 3);
    const root = /Play ([A-G][♯♭]?)/.exec(q.prompt)![1].replace('♯', '#').replace('♭', 'b');
    const r = pc(N(root)) + 48;
    const notes = (...semis: number[]) => ({ kind: 'notes' as const, notes: semis.map((s) => r + s) });
    expect(q.check(notes(4, 10, 15, 20)).correct).toBe(true); // 3 ♭7 ♯9 ♭13
    expect(q.check(notes(10, 16, 13, 18)).correct).toBe(true); // ♭7 3 ♭9 ♯11
    expect(q.check(notes(0, 4, 10, 13, 15, 20)).correct).toBe(true); // with root, four alterations
    expect(q.check(notes(4, 10, 14, 20)).correct).toBe(false); // natural 9
    expect(q.check(notes(4, 10, 15)).correct).toBe(false); // only one alteration
    expect(q.check(notes(10, 15, 20)).correct).toBe(false); // no 3rd
  });

  test('spelling decoys are plausible: no double accidentals unless the chord itself needs them', () => {
    const q = SKILL_BY_ID['gym.spell.7'];
    for (let i = 0; i < 200; i++) {
      const x = q.gen(ctxFor(i * 13 + 1));
      if (x.input.kind !== 'choice') throw new Error('choice expected');
      const right = x.input.options.find((o) => x.check({ kind: 'choice', value: o.value }).correct)!.value;
      if (!/𝄪|𝄫/.test(right)) for (const o of x.input.options) expect(o.value).not.toMatch(/𝄪|𝄫/);
      expect(x.input.options.length).toBe(4);
    }
  });

  test('borrowed numerals are written the way charts write them', () => {
    const Bb = { tonic: N('Bb'), mode: 'major' as const };
    expect(resolveChord('bII7', Bb)!.symbol).toBe('B7');
    expect(resolveChord('bVI7', Bb)!.symbol).toBe('G♭7');
    expect(resolveChord('bII7', { tonic: N('C'), mode: 'major' })!.symbol).toBe('D♭7');
    expect(resolveChord('#iv°7', { tonic: N('F#'), mode: 'major' })!.symbol).toBe('C°7');
  });
});

describe('jazz spelling', () => {
  const rightOf = (q: Question) => {
    if (q.input.kind !== 'choice') throw new Error('choice expected');
    return q.input.options.find((o) => q.check({ kind: 'choice', value: o.value }).correct)!.value;
  };

  test('ii–Vs are spelled from their target key (C♯m7♭5 – F♯7♭9 → Bm6, never D♭m7♭5 – G♭7♭9)', () => {
    let checked = 0;
    for (let i = 0; i < 300; i++) {
      const q = SKILL_BY_ID['jazz.relatedii'].gen(ctxFor(i * 17 + 3));
      const into = /into (.+)\?$/.exec(q.prompt);
      const [ii, v] = rightOf(q).split(' – ').map((x) => parseChordSymbol(x)!);
      if (into) {
        const t = parseChordSymbol(into[1])!;
        expect(intervalBetween(t.root, ii.root)!.id).toBe('M2');
        expect(intervalBetween(t.root, v.root)!.id).toBe('P5');
        checked++;
      } else {
        const dom = parseChordSymbol(/of (.+)\?$/.exec(q.prompt)![1])!;
        expect(mod(pc(ii.root) - pc(dom.root), 12)).toBe(7);
        expect(Math.abs(ii.root.acc)).toBeLessThanOrEqual(1);
      }
    }
    expect(checked).toBeGreaterThan(50);
  });

  test('upper-structure triads are spelled from the dominant root', () => {
    for (let i = 0; i < 200; i++) {
      const q = SKILL_BY_ID['jazz.ust'].gen(ctxFor(i * 29 + 5));
      const m = /^([A-G][♯♭]?m?) triad over ([A-G][♯♭]?7)/.exec(q.prompt) ?? /^Which triad over ([A-G][♯♭]?7)/.exec(q.prompt);
      expect(m).not.toBeNull();
      const right = rightOf(q);
      for (const sym of [right, q.prompt]) expect(sym).not.toMatch(/[CF]♭|[EB]♯|𝄪|𝄫/);
    }
  });

  test('tritone-sub cadences spell the ii from the key', () => {
    for (let i = 0; i < 200; i++) {
      const q = SKILL_BY_ID['jazz.tritone'].gen(ctxFor(i * 7 + 11));
      const m = /^(\S+) – \? – (\S+)$/.exec(q.prompt);
      if (!m) continue;
      const ii = parseChordSymbol(m[1])!;
      const target = parseChordSymbol(m[2])!;
      expect(intervalBetween(target.root, ii.root)!.id).toBe('M2');
      expect(mod(pc(parseChordSymbol(rightOf(q))!.root) - pc(target.root), 12)).toBe(1);
    }
  });
});

describe('transposed progressions keep their spelling', () => {
  test('chromatic chords are spelled by function, not by a blanket sharp/flat choice', () => {
    const C = { tonic: N('C'), mode: 'major' as const };
    const coltrane = PROGRESSION_BY_ID.coltrane;
    expect(progressionInKey(coltrane.chords, coltrane.key, C)).toEqual(['Cmaj7', 'E♭7', 'A♭maj7', 'B7', 'Emaj7', 'G7', 'Cmaj7', 'Cmaj7']);
    const gospel = PROGRESSION_BY_ID['gospel-walkup'];
    expect(progressionInKey(gospel.chords, gospel.key, { tonic: N('Eb'), mode: 'major' })[2]).toBe('A°7');
    const lady = PROGRESSION_BY_ID.ladybird;
    expect(progressionInKey(lady.chords, lady.key, { tonic: N('Bb'), mode: 'major' })).toEqual(['B♭maj7', 'D♭7', 'G♭maj7', 'B7']);
    const bridge = PROGRESSION_BY_ID['rhythm-bridge'];
    expect(progressionInKey(bridge.chords, bridge.key, { tonic: N('B'), mode: 'major' })).toEqual(['D♯7', 'G♯7', 'C♯7', 'F♯7']);
  });
});

describe('rhythm explanations', () => {
  test('count string marks hits and keeps beat numbers readable', () => {
    expect(countString(patternFromCells(['1000', '1111', '0010', '1000'], 4))).toBe('1 · · · | 2 e & a | (3) · & · | 4 · · ·');
  });
});
