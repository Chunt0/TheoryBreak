// Overlay state shared across pages: the lesson drawer opened from a drill's
// ? panel and the keyboard-shortcut sheet. Drills ignore answers while either
// is up, so reading a lesson can't accidentally answer the question behind it.

import { createStore } from './createStore';

export const ui = createStore<{ lesson: string | null; sheet: boolean }>({ lesson: null, sheet: false });

export const openLesson = (id: string): void => ui.set((u) => ({ ...u, lesson: id }));
export const closeLesson = (): void => ui.set((u) => ({ ...u, lesson: null }));
export const setSheet = (open: boolean): void => ui.set((u) => ({ ...u, sheet: open }));

export function overlayOpen(): boolean {
  const u = ui.get();
  return u.lesson !== null || u.sheet;
}
