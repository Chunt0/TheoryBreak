// The modal compass: modes in order of brightness, one note changing per step.
// Four kinds of question: where a few steps lead, which note a step changes,
// a mode's mirror image, and which mode a parent scale gives on a root.

import { mod, noteName, shuffle } from '../../theory/core';
import { COMPASS, DARKER_DEGREE, mirror, modeSemis, modeTonic, posName, walk, type Pos } from '../../theory/compass';
import type { GenContext, NoteEvent, Question } from '../types';
import { choiceQ, randInt } from './helpers';

const KINDS = ['step', 'change', 'mirror', 'rotate'] as const;

const line = (p: Pos, at = 0): NoteEvent[] => {
  const base = 55 + mod(p.root - 7, 12);
  return [...modeSemis(p.k), 12].map((s, i) => ({ note: base + s, start: at + i * 0.2, dur: 0.32 }));
};
const pick4 = <T,>(correct: T, others: T[], rnd: () => number): T[] => [correct, ...shuffle(others, rnd).slice(0, 3)];

export function compassQ(skill: string) {
  return (ctx: GenContext): Question => {
    const kind = ctx.pickItem([...KINDS]);
    const root = randInt(ctx.rnd, 0, 11);
    const k = randInt(ctx.rnd, 0, 6);
    const from: Pos = { root, k };
    const base = { skill, item: kind, shuffle: true, rnd: ctx.rnd, lesson: 'core.compass' };

    if (kind === 'step') {
      const n = (ctx.rnd() < 0.5 ? 1 : -1) * randInt(ctx.rnd, 1, 3);
      const to = walk(from, n, 'spin');
      const seen = new Set([posName(to)]);
      const others: string[] = [];
      for (const m of [-3, -2, -1, 1, 2, 3]) {
        const t = posName(walk(from, m, 'spin'));
        if (!seen.has(t)) {
          seen.add(t);
          others.push(t);
        }
      }
      const way = n > 0 ? 'darker' : 'brighter';
      const steps = Math.abs(n);
      return choiceQ({
        ...base,
        prompt: `${posName(from)}, ${steps} ${steps === 1 ? 'step' : 'steps'} ${way} → ?`,
        sub: 'Bright to dark: Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian — then Lydian a half step lower.',
        options: pick4(posName(to), others, ctx.rnd).map((v) => ({ value: v, label: v })),
        correct: posName(to),
        hint: `Each step ${way} ${n > 0 ? 'lowers' : 'raises'} one note. Count ${steps} along the ring; past ${n > 0 ? 'Locrian the root falls' : 'Lydian the root rises'} a half step.`,
        explain: `${posName(from)} → ${posName(to)}: ${steps} ${steps === 1 ? 'step' : 'steps'} ${way}, one note ${n > 0 ? 'lowered' : 'raised'} each time.`,
        audio: line(from),
        audioLabel: `Hear ${posName(from)}`,
        after: [...line(from), ...line(to, 1.8)],
      });
    }

    if (kind === 'change') {
      // a step between neighbours (not across the seam): which degree moves?
      const e = randInt(ctx.rnd, 0, 5);
      const dark = ctx.rnd() < 0.5;
      const flip = (s: string) => s.split(' → ').reverse().join(' → ');
      const labels = DARKER_DEGREE.slice(0, 6).map((s) => (dark ? s : flip(s)));
      const [a, b] = dark ? [e, e + 1] : [e + 1, e];
      const correct = labels[e];
      return choiceQ({
        ...base,
        prompt: `${COMPASS[a].name} → ${COMPASS[b].name}`,
        sub: `One step ${dark ? 'darker' : 'brighter'} on the same root. Which note moves?`,
        options: pick4(correct, labels.filter((l) => l !== correct), ctx.rnd).map((v) => ({ value: v, label: v })),
        correct,
        hint: 'Darker from Lydian the notes fall in this order: ♯4, 7, 3, 6, 2, 5.',
        explain: `${COMPASS[a].name} to ${COMPASS[b].name} moves ${correct.replace(' → ', ' to ')}; the other six notes stay.`,
        audio: line({ root, k: a }),
        audioLabel: `Hear ${COMPASS[a].name}`,
        after: [...line({ root, k: a }), ...line({ root, k: b }, 1.8)],
      });
    }

    if (kind === 'mirror') {
      const m = mirror(k);
      const names = COMPASS.map((c) => c.name);
      return choiceQ({
        ...base,
        prompt: `${COMPASS[k].name}, upside down`,
        sub: 'Turn its steps upside down (every interval above the root becomes the same interval below). Which mode is that?',
        options: pick4(names[m], names.filter((n) => n !== names[m]), ctx.rnd).map((v) => ({ value: v, label: v })),
        correct: names[m],
        hint: 'Mirror pairs face each other across the top of the compass: count the same number of steps from the top, the other way round.',
        explain: m === k
          ? 'Dorian is the axis: its steps read the same up and down (W H W W W H W).'
          : `${COMPASS[k].name} and ${names[m]} are ${Math.abs(k - 3)} ${Math.abs(k - 3) === 1 ? 'step' : 'steps'} either side of Dorian: each is the other turned upside down.`,
      });
    }

    // rotate: a parent major key, a new root from its notes — which mode?
    const parent = randInt(ctx.rnd, 0, 11);
    const at: Pos = { root: mod(parent + COMPASS[k].offset, 12), k };
    const tonic = noteName(modeTonic(at.root, k));
    const options = COMPASS.map((c, j) => ({ value: c.name, label: `${tonic} ${c.name}`, j }));
    return choiceQ({
      ...base,
      prompt: `${noteName(modeTonic(parent, 1))} major, starting on ${tonic}`,
      sub: 'The same seven notes, a new root. Which mode?',
      options: pick4(options[k], options.filter((o) => o.j !== k), ctx.rnd).map(({ value, label }) => ({ value, label })),
      correct: COMPASS[k].name,
      hint: 'Count up the major scale to the new root: 1 Ionian, 2 Dorian, 3 Phrygian, 4 Lydian, 5 Mixolydian, 6 Aeolian, 7 Locrian.',
      explain: `${tonic} is degree ${[4, 1, 5, 2, 6, 3, 7][k]} of ${noteName(modeTonic(parent, 1))} major, so its notes from ${tonic} make ${tonic} ${COMPASS[k].name}.`,
      audio: line(at),
      audioLabel: `Hear it from ${tonic}`,
    });
  };
}
