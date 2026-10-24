// Rhythm: read and tap a bar, hear which bar was played, name a clave. Pure
// logic (no DOM, no audio) so it can be tested.

import { randomRhythm, type RhythmLevel, type RhythmPattern } from '../theory/rhythm';

/** The bar as one cell per beat: "1011" = 1 · & a. */
export function cellsOf(p: RhythmPattern): string[] {
  const per = p.steps / p.beatsPerBar;
  return Array.from({ length: p.beatsPerBar }, (_, b) => Array.from({ length: per }, (_, j) => (p.onsets.includes(b * per + j) ? '1' : '0')).join(''));
}

/** How a beat cell is counted: "1011" → "1 · & a", "011" → "· trip let", "0000" → "(rest)". */
export function cellLabel(cell: string): string {
  if (!cell.includes('1')) return '(rest)';
  const syl = cell.length === 4 ? ['1', 'e', '&', 'a'] : cell.length === 3 ? ['1', 'trip', 'let'] : cell.length === 2 ? ['1', '&'] : ['1'];
  return [...cell].map((c, i) => (c === '1' ? syl[i] : '·')).join(' ');
}

/** A fresh bar for a level; never a bar of only rests or the same bar twice running. */
export function freshBar(level: RhythmLevel, prev: RhythmPattern | null, rnd: () => number = Math.random): RhythmPattern {
  for (let i = 0; i < 20; i++) {
    const p = randomRhythm(level, rnd);
    if (p.onsets.length > 1 && (!prev || p.onsets.join() !== prev.onsets.join() || p.steps !== prev.steps)) return p;
  }
  return randomRhythm(level, rnd);
}

/** The same bar played `n` times in a row, as one long pattern. */
export function repeatBar(p: RhythmPattern, n: number): RhythmPattern {
  return { steps: p.steps * n, beatsPerBar: p.beatsPerBar * n, onsets: Array.from({ length: n }, (_, k) => p.onsets.map((o) => o + k * p.steps)).flat() };
}

export interface TapScore {
  /** per expected onset of the long pattern: hit in time */
  hit: boolean[];
  /** per tap: matched to an onset */
  used: boolean[];
  /** ms, + = late, one per hit */
  errors: number[];
  hits: number;
  total: number;
  extras: number;
  /** mean error and spread, ms */
  lean: number;
  spread: number;
}

/**
 * Match taps (seconds from the first downbeat) to the pattern's onsets, each
 * onset to the nearest unused tap within a window that shrinks with the grid.
 */
export function scoreTaps(p: RhythmPattern, bpm: number, taps: number[]): TapScore {
  const step = (60 / bpm) * (p.beatsPerBar / p.steps);
  const tol = Math.min(0.11, step * 0.9);
  const used = taps.map(() => false);
  const errors: number[] = [];
  const hit = p.onsets.map((o) => {
    const t = o * step;
    let best = -1;
    let bestErr = Infinity;
    taps.forEach((tap, j) => {
      if (!used[j] && Math.abs(tap - t) < bestErr) {
        bestErr = Math.abs(tap - t);
        best = j;
      }
    });
    if (best < 0 || bestErr > tol) return false;
    used[best] = true;
    errors.push((taps[best] - t) * 1000);
    return true;
  });
  const hits = hit.filter(Boolean).length;
  const lean = errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
  const spread = errors.length ? Math.sqrt(errors.reduce((s, e) => s + (e - lean) ** 2, 0) / errors.length) : 0;
  return { hit, used, errors, hits, total: p.onsets.length, extras: used.filter((u) => !u).length, lean: Math.round(lean), spread: Math.round(spread) };
}

/**
 * Per beat of the written bar: right only if every pass through it hit all its
 * notes and added none. `long` is `bar` repeated; `taps` as given to scoreTaps.
 */
export function cellResults(bar: RhythmPattern, long: RhythmPattern, bpm: number, taps: number[], s: TapScore): { cell: string; ok: boolean }[] {
  const per = bar.steps / bar.beatsPerBar;
  const beat = 60 / bpm;
  const cells = cellsOf(bar);
  const bad = cells.map(() => false);
  long.onsets.forEach((o, i) => {
    if (!s.hit[i]) bad[Math.floor(o / per) % bar.beatsPerBar] = true;
  });
  taps.forEach((t, j) => {
    if (s.used[j]) return;
    // an extra tap counts against the beat it falls in (a little early belongs to the next)
    const b = Math.floor(t / beat + 0.12);
    if (b >= 0 && b < long.beatsPerBar) bad[b % bar.beatsPerBar] = true;
  });
  return cells.map((cell, i) => ({ cell, ok: !bad[i] }));
}

/** Steps on the written bar that were hit on every pass ('ok') or missed at least once ('target'). */
export function gridMarks(bar: RhythmPattern, long: RhythmPattern, s: TapScore): Record<number, 'ok' | 'target'> {
  const marks: Record<number, 'ok' | 'target'> = {};
  long.onsets.forEach((o, i) => {
    const at = o % bar.steps;
    if (!s.hit[i]) marks[at] = 'target';
    else marks[at] ??= 'ok';
  });
  return marks;
}

/** Three other bars of the same level that differ from `p` (for Hear it). */
export function decoys(level: RhythmLevel, p: RhythmPattern, rnd: () => number = Math.random): RhythmPattern[] {
  const out: RhythmPattern[] = [];
  const key = (x: RhythmPattern) => `${x.steps}:${x.onsets.join(',')}`;
  for (let guard = 0; out.length < 3 && guard < 200; guard++) {
    const o = freshBar(level, null, rnd);
    if (key(o) !== key(p) && !out.some((x) => key(x) === key(o))) out.push(o);
  }
  return out;
}
