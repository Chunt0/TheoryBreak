// Editor state for the DX7 page: current patch with undo/redo, selected
// operator, MIDI-learn target. Edits stream straight to the audio worklet and
// are persisted (debounced) into the main app store.

import { audio, PART } from '../audio/engine';
import { clonePatch, normalizePatch, type PartConfig, type Patch } from '../audio/dx7/patch';
import { createStore } from './createStore';
import { store } from './store';
import { TARGET_BY_ID } from '../midi/mapping';

export interface SynthState {
  patch: Patch;
  selectedOp: number;
  past: Patch[];
  future: Patch[];
  /** parameter id waiting for a MIDI CC (MIDI learn) */
  learn: string | null;
  config: PartConfig;
}

export const synth = createStore<SynthState>({
  patch: store.get().synth.current,
  selectedOp: 0,
  past: [],
  future: [],
  learn: null,
  config: store.get().synth.config,
});

let lastKey = '';
let lastTime = 0;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const { patch, config } = synth.get();
    store.update((d) => {
      d.synth.current = patch;
      d.synth.config = config;
    });
  }, 800);
}

/** Load from the app store (after server sync) and push to the engine. */
export function initSynthFromStore(): void {
  const d = store.get().synth;
  synth.set((s) => ({ ...s, patch: d.current, config: d.config }));
  audio.setPatch(PART.synth, d.current);
  audio.setConfig(PART.synth, d.config);
}

/**
 * Apply an edit. Rapid edits with the same `key` (a knob drag) coalesce into
 * one undo step.
 */
export function editPatch(fn: (p: Patch) => void, key = ''): void {
  const now = performance.now();
  synth.set((s) => {
    const next = clonePatch(s.patch);
    fn(next);
    const coalesce = key !== '' && key === lastKey && now - lastTime < 900;
    lastKey = key;
    lastTime = now;
    return { ...s, patch: next, past: coalesce ? s.past : [...s.past.slice(-60), s.patch], future: [] };
  });
  audio.setPatch(PART.synth, synth.get().patch);
  persist();
}

export function loadPatch(p: Patch): void {
  const patch = normalizePatch(p);
  synth.set((s) => ({ ...s, patch, past: [...s.past.slice(-60), s.patch], future: [] }));
  audio.setPatch(PART.synth, patch);
  persist();
}

export function undo(): void {
  const s = synth.get();
  const prev = s.past[s.past.length - 1];
  if (!prev) return;
  synth.set({ ...s, patch: prev, past: s.past.slice(0, -1), future: [s.patch, ...s.future] });
  audio.setPatch(PART.synth, prev);
  persist();
}

export function redo(): void {
  const s = synth.get();
  const next = s.future[0];
  if (!next) return;
  synth.set({ ...s, patch: next, past: [...s.past, s.patch], future: s.future.slice(1) });
  audio.setPatch(PART.synth, next);
  persist();
}

export function selectOp(i: number): void {
  synth.set((s) => ({ ...s, selectedOp: Math.max(0, Math.min(5, i)) }));
}

export function setSynthConfig(c: Partial<PartConfig>): void {
  synth.set((s) => ({ ...s, config: { ...s.config, ...c } }));
  audio.setConfig(PART.synth, c);
  persist();
}

// ---------------------------------------------------------------------------
// Parameter paths (shared by knobs, MIDI mapping and MIDI learn)

function resolve(path: string, selected: number): string[] {
  const parts = path.split('.');
  if (parts[0] === 'sel') return ['ops', String(selected), ...parts.slice(1)];
  return parts;
}

export function getParam(path: string): number {
  if (path === 'master') return Math.round(store.get().settings.masterVolume * 100);
  const s = synth.get();
  let cur: unknown = s.patch;
  for (const k of resolve(path, s.selectedOp)) cur = (cur as Record<string, unknown>)?.[k];
  return typeof cur === 'number' ? cur : typeof cur === 'boolean' ? Number(cur) : 0;
}

export function setParam(path: string, value: number): void {
  if (path === 'master') {
    const v = Math.max(0, Math.min(100, value)) / 100;
    audio.setMaster(v);
    store.update((d) => {
      d.settings.masterVolume = v;
    });
    return;
  }
  const t = TARGET_BY_ID[path];
  const v = t ? Math.max(t.min, Math.min(t.max, Math.round(value))) : Math.round(value);
  const sel = synth.get().selectedOp;
  editPatch((p) => {
    const keys = resolve(path, sel);
    let obj = p as unknown as Record<string, unknown>;
    for (const k of keys.slice(0, -1)) obj = obj[k] as Record<string, unknown>;
    obj[keys[keys.length - 1]] = v;
  }, path);
}

export function startLearn(path: string | null): void {
  synth.set((s) => ({ ...s, learn: s.learn === path ? null : path }));
}
