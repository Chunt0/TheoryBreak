import { mod, pick, shuffle, spellPc } from '../../theory/core';
import { JAZZ_MAJOR_TONICS, JAZZ_MINOR_TONICS, type Key } from '../../theory/keys';
import type { Answer, ChoiceOption, GenContext, NoteEvent, Question, Tone, Visual } from '../types';

export interface ChoiceOpts {
  skill: string;
  item: string;
  prompt: string;
  sub?: string;
  options: ChoiceOption[];
  correct: string;
  explain: string;
  audio?: NoteEvent[];
  audioLabel?: string;
  show?: Visual;
  reveal?: Visual;
  after?: NoteEvent[];
  shuffle?: boolean;
  rnd?: () => number;
  columns?: number;
  noteToChoice?: (midi: number) => string | null;
}

export function choiceQ(o: ChoiceOpts): Question {
  const options = o.shuffle ? shuffle(o.options, o.rnd) : o.options;
  const correctLabel = o.options.find((x) => x.value === o.correct)?.label ?? o.correct;
  return {
    skill: o.skill,
    item: o.item,
    prompt: o.prompt,
    sub: o.sub,
    audio: o.audio,
    audioLabel: o.audioLabel,
    show: o.show,
    reveal: o.reveal,
    after: o.after,
    noteToChoice: o.noteToChoice,
    explain: o.explain,
    input: { kind: 'choice', options, columns: o.columns },
    check: (a: Answer) => {
      const correct = a.kind === 'choice' && a.value === o.correct;
      return { correct, message: correct ? undefined : `Answer: ${correctLabel}` };
    },
  };
}

/** Keep the correct option plus up to n-1 random distractors (original order kept). */
export function limitOptions<T extends { value: string }>(all: T[], correct: string, n: number, rnd: () => number): T[] {
  if (all.length <= n) return all;
  const others = shuffle(all.filter((o) => o.value !== correct), rnd).slice(0, n - 1);
  const keep = new Set([correct, ...others.map((o) => o.value)]);
  return all.filter((o) => keep.has(o.value));
}

/** Distractors biased toward neighbours in the list — confusable answers teach more. */
export function nearOptions<T extends { value: string }>(all: T[], correct: string, n: number, rnd: () => number): T[] {
  if (all.length <= n) return all;
  const idx = all.findIndex((o) => o.value === correct);
  const scored = all
    .map((o, i) => ({ o, d: Math.abs(i - idx) + rnd() * 2.5 }))
    .filter((x) => x.o.value !== correct)
    .sort((a, b) => a.d - b.d)
    .slice(0, n - 1);
  const keep = new Set([correct, ...scored.map((s) => s.o.value)]);
  return all.filter((o) => keep.has(o.value));
}

/** Unique options from candidate labels, always containing the correct one. */
export function textOptions(correct: string, candidates: string[], n: number, rnd: () => number): ChoiceOption[] {
  const uniq = [...new Set(candidates.filter((c) => c !== correct))];
  return shuffle([correct, ...shuffle(uniq, rnd).slice(0, n - 1)], rnd).map((x) => ({ value: x, label: x }));
}

export function randomMajorKey(ctx: GenContext): Key {
  return { tonic: pick(JAZZ_MAJOR_TONICS, ctx.rnd), mode: 'major' };
}

export function randomMinorKey(ctx: GenContext): Key {
  return { tonic: pick(JAZZ_MINOR_TONICS, ctx.rnd), mode: 'minor' };
}

/** A random root spelled the way jazz charts usually spell it. */
export function jazzRoot(ctx: GenContext) {
  return spellPc(Math.floor(ctx.rnd() * 12), 'auto');
}

/** Keyboard visual for notes with labels. */
export function keysVisual(notes: number[], labels?: (m: number) => string, tones?: (m: number) => Tone): Visual['keyboard'] {
  const lab: Record<number, string> = {};
  const ton: Record<number, Tone> = {};
  for (const n of notes) {
    if (labels) lab[n] = labels(n);
    if (tones) ton[n] = tones(n);
  }
  const lo = Math.min(...notes);
  const hi = Math.max(...notes);
  const start = Math.min(lo - mod(lo, 12), 48);
  const end = Math.max(start + 24, hi + (11 - mod(hi, 12)) + 1);
  return { notes, labels: lab, tones: ton, range: [start, end] };
}

export const ordinal = (n: number): string => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);

export const randInt = (rnd: () => number, lo: number, hi: number): number => lo + Math.floor(rnd() * (hi - lo + 1));

export const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'];
