// The running break workout lives outside the page component, so looking
// something up in the Library mid-session doesn't throw the session away.
// Mirrored to sessionStorage so a reload resumes it too.

import { planSession, type SessionPlan } from '../learn/session';
import type { BlockLog } from '../learn/types';
import { createStore } from './createStore';
import { store } from './store';

export interface BlockStats {
  attempts: number;
  correct: number;
}

export interface ActiveWorkout {
  plan: SessionPlan;
  idx: number;
  /** Date.now() at the start of the session / current block */
  sessionStart: number;
  blockStart: number;
  logs: BlockLog[];
  /** graded reps in the current block so far */
  current: BlockStats;
  blockDone: boolean;
  finished: boolean;
  saved: boolean;
}

const SS_KEY = 'theory-break:workout';

function load(): ActiveWorkout | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    const w = raw ? (JSON.parse(raw) as ActiveWorkout) : null;
    // a session left for hours is stale — start fresh
    return w && Date.now() - w.blockStart < 3 * 3_600_000 ? w : null;
  } catch {
    return null;
  }
}

export const workout = createStore<ActiveWorkout | null>(typeof sessionStorage === 'undefined' ? null : load());

workout.subscribe(() => {
  try {
    const w = workout.get();
    if (w) sessionStorage.setItem(SS_KEY, JSON.stringify(w));
    else sessionStorage.removeItem(SS_KEY);
  } catch {
    /* storage disabled */
  }
});

export function startWorkout(): ActiveWorkout {
  const d = store.get();
  const now = Date.now();
  const w: ActiveWorkout = {
    plan: planSession(d.progress, d.settings.sessionMinutes, d.settings.focusTags),
    idx: 0, sessionStart: now, blockStart: now, logs: [], current: { attempts: 0, correct: 0 },
    blockDone: false, finished: false, saved: false,
  };
  workout.set(w);
  return w;
}

/** A workout that is under way (not yet finished). */
export const inProgress = (w: ActiveWorkout | null): w is ActiveWorkout => !!w && !w.finished;

export function recordWorkoutAnswer(correct: boolean): void {
  workout.set((w) => (w ? { ...w, current: { attempts: w.current.attempts + 1, correct: w.current.correct + (correct ? 1 : 0) } } : w));
}

function closeBlock(w: ActiveWorkout): BlockLog[] {
  const b = w.plan.blocks[w.idx];
  if (!b) return w.logs;
  const seconds = Math.round((Date.now() - w.blockStart) / 1000);
  return [...w.logs, { kind: b.kind, title: b.title, attempts: w.current.attempts, correct: w.current.correct, seconds }];
}

export function nextBlock(): void {
  workout.set((w) => {
    if (!w) return w;
    const logs = closeBlock(w);
    if (w.idx + 1 >= w.plan.blocks.length) return { ...w, logs, finished: true };
    return { ...w, logs, idx: w.idx + 1, blockStart: Date.now(), current: { attempts: 0, correct: 0 }, blockDone: false };
  });
}

export function endWorkout(): void {
  workout.set((w) => (w ? { ...w, logs: closeBlock(w), finished: true } : w));
}

export function clearWorkout(): void {
  workout.set(null);
}
