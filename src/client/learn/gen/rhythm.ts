import { shuffle } from '../../theory/core';
import { CLAVES, RHYTHM_LEVEL_NAMES, countLabels, patternKey, randomRhythm, type RhythmLevel, type RhythmPattern } from '../../theory/rhythm';
import type { Answer, GenContext, Question, Tone } from '../types';
import { choiceQ, randInt } from './helpers';

/** "1 · · · | 2 e & a | (3) · & · | 4 · · ·" — hit syllables, unplayed beats in brackets. */
export function countString(p: RhythmPattern): string {
  const per = p.steps / p.beatsPerBar;
  const labels = countLabels(p);
  return Array.from({ length: p.beatsPerBar }, (_, b) =>
    labels.slice(b * per, b * per + per).map((l, j) => (p.onsets.includes(b * per + j) ? l : j === 0 ? `(${l})` : '·')).join(' '),
  ).join(' | ');
}

export function stepSeconds(p: RhythmPattern, bpm: number): number {
  return (60 / bpm) * (p.beatsPerBar / p.steps);
}

/** Score taps (seconds from bar start) against a pattern. */
export function scoreTaps(p: RhythmPattern, bpm: number, taps: number[]) {
  const step = stepSeconds(p, bpm);
  const tol = Math.min(0.11, step * 0.9);
  const expected = p.onsets.map((o) => o * step);
  const used = new Set<number>();
  const marks: Record<number, Tone> = {};
  const errors: number[] = [];
  let hits = 0;
  expected.forEach((t, i) => {
    let best = -1;
    let bestErr = Infinity;
    taps.forEach((tap, j) => {
      if (used.has(j)) return;
      const e = Math.abs(tap - t);
      if (e < bestErr) {
        bestErr = e;
        best = j;
      }
    });
    if (best >= 0 && bestErr <= tol) {
      used.add(best);
      hits++;
      errors.push(taps[best] - t);
      marks[p.onsets[i]] = 'ok';
    } else marks[p.onsets[i]] = 'target';
  });
  const extras = taps.length - used.size;
  const score = hits / (expected.length + extras);
  const meanErr = errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
  const spread = errors.length ? Math.sqrt(errors.reduce((s, e) => s + (e - meanErr) ** 2, 0) / errors.length) : 0;
  return { hits, extras, total: expected.length, score, meanErrMs: Math.round(meanErr * 1000), spreadMs: Math.round(spread * 1000), marks };
}

export function rhythmTap(skill: string, level: RhythmLevel) {
  return (ctx: GenContext): Question => {
    const pattern = randomRhythm(level, ctx.rnd);
    const bpm = level === 5 ? randInt(ctx.rnd, 84, 100) : level === 4 ? randInt(ctx.rnd, 88, 112) : randInt(ctx.rnd, 72, 92);
    return {
      skill, item: `L${level}`,
      prompt: 'Tap the rhythm',
      sub: `${RHYTHM_LEVEL_NAMES[level]} · ${bpm} BPM · Space (or a pad) starts a 4-click count-in, then tap the bar.`,
      input: { kind: 'rhythm', pattern, bpm },
      hint: `Count it out loud: ${countString(pattern)}. Keep the whole grid going in your head and tap only the hits; Space starts the count-in.`,
      check: (a: Answer) => {
        if (a.kind !== 'taps') return { correct: false };
        const r = scoreTaps(pattern, bpm, a.offsets);
        const feel = r.hits
          ? ` Mean ${Math.abs(r.meanErrMs)} ms ${r.meanErrMs > 8 ? 'behind' : r.meanErrMs < -8 ? 'ahead' : '(centred)'}, spread ±${r.spreadMs} ms.`
          : '';
        return {
          correct: r.score >= 0.8 && r.extras <= 1,
          score: r.score,
          message: `${r.hits}/${r.total}${r.extras ? `, ${r.extras} extra` : ''}.${feel}`,
          reveal: { rhythm: { pattern, marks: r.marks } },
        };
      },
      explain: `Count: ${countString(pattern)} (hits shown, rests as ·). Feel the subdivision continuously; the off-beat hits only lock in when the grid never stops.`,
    };
  };
}

export function rhythmEar(skill: string, level: RhythmLevel) {
  return (ctx: GenContext): Question => {
    const pattern = randomRhythm(level, ctx.rnd);
    const others: RhythmPattern[] = [];
    let guard = 0;
    while (others.length < 3 && guard++ < 60) {
      const o = randomRhythm(level, ctx.rnd);
      if (patternKey(o) !== patternKey(pattern) && !others.some((x) => patternKey(x) === patternKey(o))) others.push(o);
    }
    const opts = shuffle([pattern, ...others], ctx.rnd).map((p, i) => ({ value: patternKey(p), label: `Option ${i + 1}`, rhythm: p }));
    const q = choiceQ({
      skill, item: `L${level}`, columns: 2,
      prompt: 'Which rhythm?',
      sub: `One bar after a count-in (${RHYTHM_LEVEL_NAMES[level]}).`,
      hint: 'Count "1 e & a" with the clicks. Beat by beat: is the hit on the beat, on "&" (halfway), on "e" (just after) or on "a" (just before the next beat)? Compare only the beats where the options differ.',
      options: opts, correct: patternKey(pattern),
      explain: 'Locate each hit against the clicks: on the beat, on "&", or on "e"/"a".',
    });
    return { ...q, audioLabel: 'Play rhythm', rhythmAudio: { pattern, bpm: level === 5 ? 90 : 84 } };
  };
}

export function claveEar(skill: string) {
  return (ctx: GenContext): Question => {
    const id = ctx.pickItem(CLAVES.map((c) => c.id));
    const c = CLAVES.find((x) => x.id === id)!;
    const q = choiceQ({
      skill, item: id, columns: 1,
      prompt: 'Which timeline?',
      sub: 'Clave patterns underpin funk, Latin jazz and R&B syncopation.',
      hint: 'Does the bar open with three strokes (3-2) or two (2-3)? Son vs rumba: rumba delays the third stroke; bossa delays the last one. Tresillo is 3+3+2 twice.',
      options: shuffle(CLAVES.map((x) => ({ value: x.id, label: x.name })), ctx.rnd), correct: id,
      explain: `${c.name}: ${c.note}`,
      reveal: { rhythm: { pattern: c.pattern } },
    });
    return { ...q, audioLabel: 'Play timeline', rhythmAudio: { pattern: c.pattern, bpm: 96 } };
  };
}
