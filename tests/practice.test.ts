import { describe, expect, test } from 'bun:test';
import { pianoWindow } from '../src/client/midi/input';
import { degreeLine, NUMERAL_SETS, randomProgression } from '../src/client/simple/logic';
import { pianoRange } from '../src/client/simple/Piano';
import { progressionEvents, transposeSymbol } from '../src/client/learn/music';
import { mod, N, pc } from '../src/client/theory/core';
import { JAZZ_MAJOR_TONICS, JAZZ_MINOR_TONICS, keyFromName, prefersFlats, type Key } from '../src/client/theory/keys';
import { PROGRESSIONS } from '../src/client/theory/progressions';
import { readdirSync, readFileSync } from 'node:fs';
import { weightedPick } from '../src/client/learn/srs';
import { TOPIC_BY_ID } from '../src/client/learn/library';

describe('computer keys laid out like a piano', () => {
  test('from C: middle row is white, top row has the black keys where a piano has them', () => {
    const { notes } = pianoWindow(60);
    expect(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'].map((c) => notes.get(c))).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU', 'KeyO', 'KeyP'].map((c) => notes.get(c))).toEqual([61, 63, 66, 68, 70, 73, 75]);
    // no black key between E–F or B–C, and none below C
    expect(notes.has('KeyR')).toBe(false);
    expect(notes.has('KeyI')).toBe(false);
    expect(notes.has('KeyQ')).toBe(false);
  });

  test('from G: the black keys move with the window', () => {
    const { notes } = pianoWindow(67);
    expect(notes.get('KeyA')).toBe(67);
    expect(notes.get('KeyQ')).toBe(66); // F♯ just left of G
    expect(notes.get('KeyW')).toBe(68); // G♯
    expect(notes.has('KeyR')).toBe(false); // B–C
    expect(notes.get('KeyK')).toBe(79); // G an octave up
  });

  test('every white start covers an octave of its root plus the black key above it', () => {
    for (const start of [60, 62, 64, 65, 67, 69, 71]) {
      const { labels } = pianoWindow(start);
      for (let m = start; m <= start + 12; m++) expect(labels[m]).toBeDefined();
    }
    // black roots sit on W, one above the white key on A
    for (const root of [61, 63, 66, 68, 70]) {
      const { labels } = pianoWindow(root - 1);
      for (let m = root; m <= root + 12; m++) expect(labels[m]).toBeDefined();
    }
  });
});

describe('scale patterns', () => {
  test('straight up and down an octave', () => {
    expect(degreeLine(7, 1, 'straight', 'up')).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(degreeLine(7, 1, 'straight', 'updown')).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0]);
    expect(degreeLine(5, 2, 'straight', 'down')).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
  });

  test('in 3rds: C-E D-F … B-D, then C', () => {
    expect(degreeLine(7, 1, 'thirds', 'up')).toEqual([0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7]);
  });

  test('diatonic triads arpeggiate every degree and land on the octave', () => {
    const line = degreeLine(7, 1, 'triads', 'up');
    expect(line.slice(0, 6)).toEqual([0, 2, 4, 1, 3, 5]);
    expect(line.length).toBe(7 * 3 + 1);
    expect(line[line.length - 1]).toBe(7);
  });

  test('descending mirrors ascending', () => {
    const up = degreeLine(7, 1, 'fours', 'up');
    expect(degreeLine(7, 1, 'fours', 'down')).toEqual(up.map((d) => 7 - d));
  });
});

describe('progression ear training', () => {
  test('random progressions start on the tonic and never repeat a chord back to back', () => {
    for (const set of Object.values(NUMERAL_SETS)) {
      for (let i = 0; i < 50; i++) {
        const p = randomProgression(set);
        expect(p[0]).toBe(set[0]);
        for (let j = 1; j < p.length; j++) expect(p[j]).not.toBe(p[j - 1]);
      }
    }
  });

  test('every numeral in every level resolves to a chord', () => {
    for (const [level, set] of Object.entries(NUMERAL_SETS)) {
      const key: Key = { tonic: N('Eb'), mode: level === 'minor' ? 'minor' : 'major' };
      const prog = progressionEvents(key, set, {});
      expect(prog.chords.every((c) => c !== null)).toBe(true);
    }
  });

  test('every library progression resolves in every practical key', () => {
    for (const def of PROGRESSIONS) {
      const ref = keyFromName(def.key);
      for (const tonic of ref.mode === 'major' ? JAZZ_MAJOR_TONICS : JAZZ_MINOR_TONICS) {
        const key: Key = { tonic, mode: ref.mode };
        const shift = mod(pc(tonic) - pc(ref.tonic), 12);
        const symbols = def.chords.map((c) => transposeSymbol(c, shift, prefersFlats(key)));
        const prog = progressionEvents(key, symbols, {});
        expect({ id: def.id, ok: prog.chords.every((c) => c !== null) }).toEqual({ id: def.id, ok: true });
        // the first chord's root moved by the same amount as the key
        expect(mod(prog.chords[0]!.rootPc - pc(tonic), 12)).toBe(mod(progressionEvents(ref, def.chords, {}).chords[0]!.rootPc - pc(ref.tonic), 12));
      }
    }
  });
});

describe('keyboard range', () => {
  test('octaves from C3 plus the top C when everything fits', () => {
    expect(pianoRange([], 4)).toEqual([48, 96]);
    expect(pianoRange([60, 72], 3)).toEqual([48, 84]);
  });

  test('moves by octaves to show what is marked, keeping the low end when both cannot fit', () => {
    expect(pianoRange([71, 95], 3)).toEqual([60, 96]);
    expect(pianoRange([40, 60], 4)).toEqual([36, 84]);
    expect(pianoRange([60, 100], 3)).toEqual([60, 96]);
  });

  test('the computer keys are always on screen', () => {
    for (let start = 36; start <= 96; start++) {
      if ([1, 3, 6, 8, 10].includes(start % 12)) continue;
      const notes = Object.keys(pianoWindow(start).labels).map(Number);
      for (const octaves of [2, 3, 4]) {
        const [lo, hi] = pianoRange(notes, octaves);
        expect(Math.min(...notes)).toBeGreaterThanOrEqual(lo);
        expect(Math.max(...notes)).toBeLessThanOrEqual(hi);
      }
    }
  });
});

describe('weak spots', () => {
  const stats = {
    weak: { n: 6, ema: 0.25, last: Date.now() },
    known: { n: 6, ema: 0.95, last: Date.now() },
    solid: { n: 6, ema: 0.9, last: Date.now() },
  };
  const share = (focus: boolean, items: string[], want: string) => {
    let hits = 0;
    for (let i = 0; i < 4000; i++) if (weightedPick(items, stats, Math.random, Date.now(), focus) === want) hits++;
    return hits / 4000;
  };

  test('missed items come up more often, and far more often with Weak spots on', () => {
    const items = ['weak', 'known', 'solid'];
    const normal = share(false, items, 'weak');
    const focus = share(true, items, 'weak');
    expect(normal).toBeGreaterThan(0.45);
    expect(focus).toBeGreaterThan(0.85);
  });

  test('new items lead normally but wait behind a weak one with Weak spots on', () => {
    expect(share(false, ['new', 'known'], 'new')).toBeGreaterThan(0.6);
    expect(share(true, ['new', 'weak'], 'weak')).toBeGreaterThan(0.8);
  });

  test('progressions take their chords from the picker', () => {
    const p = randomProgression(NUMERAL_SETS.diatonic, 4, Math.random, (choices) => choices[choices.length - 1]);
    expect(p).toEqual(['I', 'vii°', 'vi', 'vii°']);
  });
});

describe('lessons behind the ? buttons', () => {
  test('every topic a drill names exists', () => {
    const dir = `${import.meta.dir}/../src/client/simple`;
    const named = new Set<string>();
    for (const f of readdirSync(dir).filter((f) => f.endsWith('Mode.tsx'))) {
      const src = readFileSync(`${dir}/${f}`, 'utf8');
      for (const m of src.matchAll(/topics: \[([^\]]*)\]|'((?:core|jazz|funk|soul|bach|rhythm)\.[a-z]+)'/g)) {
        for (const id of (m[1] ?? `'${m[2]}'`).matchAll(/'([a-z]+\.[a-z]+)'/g)) named.add(id[1]);
      }
    }
    expect(named.size).toBeGreaterThan(20);
    for (const id of named) expect(TOPIC_BY_ID[id]).toBeDefined();
  });
});
