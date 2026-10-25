// Editor state for the modular synth: the rack with undo/redo and the selected
// module (whose knobs the MiniLab's knobs and faders turn). Structural edits
// send the whole patch to the worklet; knob turns send just the value.

import { audio } from '../audio/engine';
import { MODULES, fromNorm, toNorm, type ModuleType } from '../audio/rack/modules';
import { CABLE_COLORS, newModule, normalizeRack, uid, type Jack, type RackModule, type RackPatch } from '../audio/rack/patch';
import { createStore } from './createStore';
import { store, updateSettings } from './store';

export interface RackState {
  patch: RackPatch;
  selected: string | null;
  past: RackPatch[];
  future: RackPatch[];
}

export const rack = createStore<RackState>({ patch: store.get().rack.current, selected: null, past: [], future: [] });

let lastKey = '';
let lastTime = 0;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const { patch } = rack.get();
    store.update((d) => {
      d.rack.current = patch;
    });
  }, 800);
}

/** Load from the app store (after server sync) and push to the engine. */
export function initRackFromStore(): void {
  const p = store.get().rack.current;
  rack.set((s) => ({ ...s, patch: p, selected: p.modules.some((m) => m.id === s.selected) ? s.selected : null }));
  audio.setRack(p);
}

/** Make the rack (or the DX7) what the keys play. */
export function setInstrument(i: 'dx7' | 'rack'): void {
  audio.setInstrument(i);
  updateSettings({ instrument: i });
}

function commit(next: RackPatch, key: string, structural: boolean): void {
  const now = performance.now();
  const coalesce = key !== '' && key === lastKey && now - lastTime < 900;
  lastKey = key;
  lastTime = now;
  rack.set((s) => ({ ...s, patch: next, past: coalesce ? s.past : [...s.past.slice(-60), s.patch], future: [] }));
  if (structural) audio.setRack(next);
  persist();
}

/** Change the rack's modules or cables. */
export function editRack(fn: (p: RackPatch) => void, key = ''): void {
  const next = structuredClone(rack.get().patch);
  fn(next);
  commit(next, key, true);
}

/** Turn one knob. Rapid turns of the same knob coalesce into one undo step. */
export function setRackParam(mod: string, key: string, value: number): void {
  const cur = rack.get().patch;
  const m = cur.modules.find((x) => x.id === mod);
  if (!m || m.params[key] === value) return;
  const next: RackPatch = { ...cur, modules: cur.modules.map((x) => (x.id === mod ? { ...x, params: { ...x.params, [key]: value } } : x)) };
  commit(next, `${mod}.${key}`, false);
  audio.setRackParam(next, mod, key, value);
}

let commandSeq = 0;
/** Press a module's button (the looper's): sent as a changing hidden param, so it is neither saved nor undone. */
export function rackCommand(mod: string, key: string, cmd: number): void {
  commandSeq++;
  audio.rackCommand(mod, key, commandSeq * 8 + cmd);
}

export function loadRack(p: RackPatch): void {
  const patch = normalizeRack(structuredClone(p));
  if (!patch) return;
  rack.set((s) => ({ ...s, patch, selected: null, past: [...s.past.slice(-60), s.patch], future: [] }));
  audio.setRack(patch);
  persist();
}

export function undoRack(): void {
  const s = rack.get();
  const prev = s.past[s.past.length - 1];
  if (!prev) return;
  rack.set({ ...s, patch: prev, past: s.past.slice(0, -1), future: [s.patch, ...s.future] });
  audio.setRack(prev);
  persist();
}

export function redoRack(): void {
  const s = rack.get();
  const next = s.future[0];
  if (!next) return;
  rack.set({ ...s, patch: next, past: [...s.past, s.patch], future: s.future.slice(1) });
  audio.setRack(next);
  persist();
}

export function selectModule(id: string | null): void {
  rack.set((s) => ({ ...s, selected: id }));
}

/** Step the selection along the rack (the MiniLab encoder on the Synth tab). */
export function selectStep(d: number): void {
  const { patch, selected } = rack.get();
  if (!patch.modules.length) return;
  const i = patch.modules.findIndex((m) => m.id === selected);
  const n = patch.modules.length;
  selectModule(patch.modules[i < 0 ? (d > 0 ? 0 : n - 1) : (i + d + n) % n].id);
}

/** Add a module next to the selected one (or at the end) and select it. */
export function addModule(type: ModuleType): void {
  const m = newModule(type, uid(type));
  editRack((p) => {
    const i = p.modules.findIndex((x) => x.id === rack.get().selected);
    p.modules.splice(i < 0 ? p.modules.length : i + 1, 0, m);
  });
  selectModule(m.id);
}

export function removeModule(id: string): void {
  editRack((p) => {
    p.modules = p.modules.filter((m) => m.id !== id);
    p.cables = p.cables.filter((c) => c.from.mod !== id && c.to.mod !== id);
  });
  if (rack.get().selected === id) selectModule(null);
}

export function moveModule(id: string, d: -1 | 1): void {
  editRack((p) => {
    const i = p.modules.findIndex((m) => m.id === id);
    const j = i + d;
    if (i < 0 || j < 0 || j >= p.modules.length) return;
    [p.modules[i], p.modules[j]] = [p.modules[j], p.modules[i]];
  });
}

/**
 * Move a module to the other row of a two-row case. The first move fixes every
 * module's row where the family sort had put it, so nothing else jumps.
 */
export function setModuleRow(id: string, row: 1 | 2, auto: (m: RackModule) => 1 | 2): void {
  editRack((p) => {
    for (const m of p.modules) m.row ??= auto(m);
    const m = p.modules.find((x) => x.id === id);
    if (m) m.row = row;
  });
}

/** Patch an output into an input. An input takes one cable, so whatever was there is unplugged. */
export function connect(from: Jack, to: Jack, color?: number): void {
  editRack((p) => {
    p.cables = p.cables.filter((c) => !(c.to.mod === to.mod && c.to.port === to.port));
    const used = new Set(p.cables.map((c) => c.color));
    let next = color ?? p.cables.length % CABLE_COLORS;
    for (let k = 0; color === undefined && k < CABLE_COLORS && used.has(next); k++) next = (next + 1) % CABLE_COLORS;
    p.cables.push({ id: uid('c'), from: { ...from }, to: { ...to }, color: next });
  });
}

export function disconnect(cableId: string): void {
  editRack((p) => {
    p.cables = p.cables.filter((c) => c.id !== cableId);
  });
}

/** Silence a self-playing rack: stop every clock (part of Esc / panic). */
export function stopClocks(): void {
  for (const m of rack.get().patch.modules) if (m.type === 'clock' && m.params.run >= 0.5) setRackParam(m.id, 'run', 0);
}

export function saveRack(name: string): void {
  const patch = { ...rack.get().patch, name: name.trim().slice(0, 24).toUpperCase() || 'MY RACK' };
  rack.set((s) => ({ ...s, patch }));
  store.update((d) => {
    d.rack.current = patch;
    d.rack.user = [...d.rack.user.filter((p) => p.name !== patch.name), structuredClone(patch)].slice(-48);
  });
}

export function deleteSavedRack(name: string): void {
  store.update((d) => {
    d.rack.user = d.rack.user.filter((p) => p.name !== name);
  });
}

/** Knob `index` of the selected module (0-7 knobs, 8-11 faders), set from a controller CC. */
export function controllerKnob(index: number, apply: (current127: number) => number): boolean {
  const { patch, selected } = rack.get();
  const m = patch.modules.find((x) => x.id === selected);
  if (!m) return false;
  const p = MODULES[m.type].params.filter((q) => q.kind !== 'toggle')[index];
  if (!p) return true;
  const cur = Math.round(toNorm(p, m.params[p.id]) * 127);
  const v = fromNorm(p, apply(cur) / 127);
  setRackParam(m.id, p.id, v);
  return true;
}
