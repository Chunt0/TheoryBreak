import { INTERVALS, mod, noteName, pc, pcName, shuffle, spellPc, transpose, uniqueBy } from '../../theory/core';
import type { GenContext, Question } from '../types';
import { ev, intervalEvents } from '../music';
import { choiceQ, keysVisual, nearOptions, randInt } from './helpers';

/** How each interval functions harmonically — more useful than nursery-rhyme mnemonics. */
export const INTERVAL_ROLE: Record<string, string> = {
  m2: 'the ♭9 rub; leading tone to tonic',
  M2: 'the 9th; whole-step neighbour',
  m3: 'minor colour; also the ♯9 of a dominant',
  M3: 'major 3rd — half of the dominant tritone',
  P4: 'quartal building block (So What voicing)',
  TT: 'the dominant engine: 3 and ♭7 of V7',
  P5: 'root–5th frame; root motion of V→I',
  m6: 'the ♭13 tension; inverts to a M3',
  M6: 'the 13th; 6th of a 6/9 chord',
  m7: 'the ♭7 of dominant and minor 7th chords',
  M7: 'the major 7th: tension against the root',
  P8: 'octave',
  m9: '♭9 — the most dissonant tension, wants the dominant context',
  M9: 'the 9th: the first extension',
  m10: 'minor 10th (♯9 when over a major 3rd)',
  M10: 'the 10th — how pianists voice root + 3rd',
  P11: '11th: sus sound, avoid over major',
  A11: '♯11: Lydian colour',
  P12: 'the 12th: root–5th an octave apart',
  m13: '♭13: altered dominant colour',
  M13: '13th: the top of the chord',
};

function intervalOptions(set: readonly string[]) {
  return [...set]
    .sort((a, b) => INTERVALS[a].semis - INTERVALS[b].semis)
    .map((id) => ({ value: id, label: INTERVALS[id].name, sub: id }));
}

export type IntervalDir = 'asc' | 'desc' | 'harm';

export function intervalEar(skill: string, set: readonly string[], dirs: IntervalDir[]) {
  const items = set.flatMap((id) => dirs.map((d) => `${id}:${d}`));
  return (ctx: GenContext): Question => {
    const item = ctx.pickItem(items);
    const [id, dir] = item.split(':') as [string, IntervalDir];
    const iv = INTERVALS[id];
    const low = randInt(ctx.rnd, iv.semis > 12 ? 45 : 50, iv.semis > 12 ? 55 : 64);
    const high = low + iv.semis;
    const opts = nearOptions(intervalOptions(set), id, 8, ctx.rnd);
    const dirWord = dir === 'asc' ? 'Ascending' : dir === 'desc' ? 'Descending' : 'Harmonic';
    const compound = iv.semis > 12;
    // the listening aid: bottom note held, top note on its own — or, for compounds, folded into one octave
    const top = compound ? high - 12 : high;
    const hintAudio = {
      label: compound ? 'Top note an octave lower' : 'Bottom note held, top note alone',
      events: [ev(low, 0, 2.4, 78), ev(top, 1.1, 1.3, 96)],
    };
    const hint = compound
      ? `Bottom note ${pcName(low)}. Fold the top note down an octave (the hint plays it) and name that simple interval, then add 7 to the number.`
      : `${dir === 'desc' ? 'Top' : 'Bottom'} note ${pcName(dir === 'desc' ? high : low)}. Hum both notes: a step, a chord skip, an open 4th/5th, or a wide 6th/7th? Then major or minor.`;
    return choiceQ({
      skill, item,
      prompt: 'Name the interval',
      sub: `${dirWord}. Pads 1–${opts.length}${dir === 'asc' ? ', or play the top note' : ''}.`,
      options: opts, correct: id,
      audio: intervalEvents(low, high, dir),
      optionAudio: (v) => intervalEvents(low, low + INTERVALS[v].semis, dir),
      hint, hintAudio,
      explain: `${iv.name} (${iv.semis} semitones) — ${INTERVAL_ROLE[id] ?? ''}.`,
      reveal: { keyboard: keysVisual([low, high], (m) => (m === low ? pcName(low) : `${pcName(high)}`)) },
      noteToChoice:
        dir !== 'asc'
          ? undefined
          : (m) => {
              const hit = opts.find((o) => mod(INTERVALS[o.value].semis, 12) === mod(m - low, 12));
              return hit?.value ?? null;
            },
    });
  };
}

const ROOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function intervalSpell(skill: string, set: readonly string[]) {
  return (ctx: GenContext): Question => {
    const id = ctx.pickItem(set);
    const iv = INTERVALS[id];
    const root = spellPc(ROOTS[randInt(ctx.rnd, 0, 11)], 'auto');
    const correct = transpose(root, id === 'TT' ? 'A4' : id);
    const enhLetter = { letter: (correct.letter + 1) % 7, acc: 0 };
    let acc = mod(pc(correct) - pc(enhLetter), 12);
    if (acc > 6) acc -= 12;
    const enh = { letter: enhLetter.letter, acc };
    const cands = uniqueBy(
      [correct, enh, transpose(correct, 'm2'), transpose(correct, 'm2', -1), { letter: correct.letter, acc: correct.acc === 0 ? -1 : 0 }],
      (n) => noteName(n),
    ).filter((n) => Math.abs(n.acc) <= 2);
    const opts = shuffle(cands.slice(0, 4), ctx.rnd).map((n) => ({ value: noteName(n), label: noteName(n) }));
    if (!opts.some((o) => o.value === noteName(correct))) opts[0] = { value: noteName(correct), label: noteName(correct) };
    return choiceQ({
      skill, item: id,
      prompt: `${iv.name} above ${noteName(root)}?`,
      sub: 'Spelled correctly (letter distance matters).',
      hint: `Count ${iv.num} letter names up from ${noteName(root)}, counting ${noteName(root).charAt(0)} as 1. Then set the accidental so the distance is ${iv.semis} semitones.`,
      options: opts, correct: noteName(correct),
      explain: `${noteName(root)} + ${iv.name.toLowerCase()} (${iv.num} letters, ${iv.semis} semitones) = ${noteName(correct)}.`,
    });
  };
}
