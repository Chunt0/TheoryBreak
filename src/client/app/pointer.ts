// Picking answers without pads: a strip or fader (the MicroLab's mod strip)
// points at one of the answers on screen, and Enter (its Hold button) picks it.
// The answer set on screen registers itself; only one is up at a time.

import { createStore } from './createStore';

export interface AnswerSet {
  count: () => number;
  pick: (i: number) => void;
  /** still waiting for an answer */
  open: () => boolean;
}

/** Index of the answer pointed at, or null. */
export const pointer = createStore<{ index: number | null }>({ index: null });

let current: AnswerSet | null = null;

export function registerAnswers(set: AnswerSet): () => void {
  current = set;
  pointer.set({ index: null });
  return () => {
    if (current === set) {
      current = null;
      pointer.set({ index: null });
    }
  };
}

/** Point at the answer under a strip position 0..1 (bottom = first answer). */
export function pointAt(pos: number): void {
  if (!current || !current.open()) return;
  const n = current.count();
  if (n <= 0) return;
  const index = Math.min(n - 1, Math.max(0, Math.floor(pos * n)));
  if (pointer.get().index !== index) pointer.set({ index });
}

export function clearPointer(): void {
  if (pointer.get().index !== null) pointer.set({ index: null });
}

/** Pick the answer pointed at; false when nothing is pointed at (so Enter does its usual job). */
export function pickPointed(): boolean {
  const i = pointer.get().index;
  if (!current || i === null || !current.open() || i >= current.count()) return false;
  pointer.set({ index: null });
  current.pick(i);
  return true;
}
