// Global app state: tiny observable store + persistence to localStorage and
// (when the Bun server is reachable) to the server's data volume, so progress
// follows you between the work PC and home.

import { useSyncExternalStore } from 'react';
import { defaultPartConfig, normalizePatch, type PartConfig, type Patch } from '../audio/dx7/patch';
import { presetByName } from '../audio/dx7/presets';
import type { Instrument } from '../audio/engine';
import { defaultRack, normalizeRack, type RackPatch } from '../audio/rack/patch';
import { CONTROLS_VERSION, defaultCommands, normalizeBindings, type Bindings } from '../midi/commands';
import { minilab3Defaults, type CcMapping } from '../midi/mapping';
import type { ProgressData } from '../learn/types';
import type { Tag } from '../learn/library/types';
import { emptyProgress } from '../learn/srs';

export interface Settings {
  sessionMinutes: number;
  /** library tags the planner draws from */
  focusTags: Tag[];
  lessonPatch: string;
  masterVolume: number;
  reverb: number;
  metronome: number;
  /** extra offset applied when scoring taps, ms (positive = you tap late) */
  tapOffsetMs: number;
  autoAdvance: boolean;
  padChannel: number;
  /** what exercises play back with: your current DX7 patch or the plain practice piano */
  practiceSound: 'patch' | 'piano';
  /** what the keys play: the DX7 or the modular rack */
  instrument: Instrument;
  /** controller buttons, encoders, pads and strips standing in for Space, Enter… */
  controls: Bindings;
  /** factory layout the controls were saved with (older ones are reset to the new defaults) */
  controlsVersion: number;
  /** show the on-screen keyboard (it can fold away when a controller does the playing) */
  showKeys: boolean;
  /** a theme key from app/themes.ts, or "auto" (Mono, light or dark with the system) */
  theme: string;
  /** what sits behind the exercise: the theme's own moving background, the dot grid, or nothing */
  backdrop: 'theme' | 'dots' | 'off';
}

export interface SongIdea {
  id: string;
  title: string;
  key: string;
  /** Roman numerals or chord symbols */
  tokens: string[];
  bpm: number;
  style: string;
  notes: string;
  createdAt: number;
}

export interface AppData {
  version: 1;
  updatedAt: number;
  progress: ProgressData;
  settings: Settings;
  synth: {
    current: Patch;
    userPatches: Patch[];
    config: PartConfig;
    mappings: CcMapping[];
  };
  /** the modular synth: the rack on the bench and the ones you saved */
  rack: {
    current: RackPatch;
    user: RackPatch[];
  };
  ideas: SongIdea[];
  /** practice-mode choices and records, keyed by name (see simple/common.tsx) */
  practice: Record<string, unknown>;
}

export const defaultSettings = (): Settings => ({
  sessionMinutes: 15,
  focusTags: ['core', 'jazz', 'funk', 'soul', 'bach'],
  lessonPatch: 'LESSON KEYS',
  masterVolume: 0.8,
  reverb: 0.18,
  metronome: 0.7,
  tapOffsetMs: 0,
  autoAdvance: true,
  padChannel: 10,
  practiceSound: 'patch',
  instrument: 'dx7',
  controls: defaultCommands(),
  controlsVersion: CONTROLS_VERSION,
  showKeys: true,
  theme: 'auto',
  backdrop: 'theme',
});

export function defaultData(): AppData {
  return {
    version: 1,
    updatedAt: 0,
    progress: emptyProgress(),
    settings: defaultSettings(),
    synth: { current: presetByName('TINE PIANO'), userPatches: [], config: defaultPartConfig(), mappings: minilab3Defaults() },
    rack: { current: defaultRack(), user: [] },
    ideas: [],
    practice: {},
  };
}

/** Merge stored (possibly older-version) data over defaults defensively. */
function hydrate(raw: unknown): AppData {
  const d = defaultData();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<AppData>;
  return {
    version: 1,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
    progress: { ...d.progress, ...(r.progress ?? {}) },
    settings: {
      ...d.settings,
      ...(r.settings ?? {}),
      controls: (r.settings?.controlsVersion ?? 0) >= CONTROLS_VERSION ? normalizeBindings(r.settings?.controls) : defaultCommands(),
      controlsVersion: CONTROLS_VERSION,
    },
    synth: {
      current: r.synth?.current ? normalizePatch(r.synth.current) : d.synth.current,
      userPatches: Array.isArray(r.synth?.userPatches) ? r.synth!.userPatches.map(normalizePatch) : [],
      config: { ...d.synth.config, ...(r.synth?.config ?? {}) },
      mappings: Array.isArray(r.synth?.mappings) ? r.synth!.mappings : d.synth.mappings,
    },
    rack: {
      current: normalizeRack(r.rack?.current) ?? d.rack.current,
      user: Array.isArray(r.rack?.user) ? r.rack!.user.map(normalizeRack).filter((x): x is RackPatch => x !== null) : [],
    },
    ideas: Array.isArray(r.ideas) ? r.ideas : [],
    practice: r.practice && typeof r.practice === 'object' && !Array.isArray(r.practice) ? r.practice : {},
  };
}

const LS_KEY = 'theory-break:data';

type Listener = () => void;

class Store {
  private data: AppData = defaultData();
  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  syncState: 'local' | 'synced' | 'syncing' | 'offline' = 'local';

  get(): AppData {
    return this.data;
  }

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  update(fn: (d: AppData) => AppData | void, persist = true): void {
    const draft = structuredClone(this.data);
    const out = fn(draft) ?? draft;
    if (persist) out.updatedAt = Date.now();
    this.data = out;
    this.listeners.forEach((l) => l());
    if (persist) this.scheduleSave();
  }

  /** Replace everything (import / server data). */
  replace(raw: unknown, persist = true): void {
    this.data = hydrate(raw);
    this.listeners.forEach((l) => l());
    if (persist) this.scheduleSave();
  }

  loadLocal(): void {
    try {
      const txt = localStorage.getItem(LS_KEY);
      if (txt) this.data = hydrate(JSON.parse(txt));
    } catch {
      /* private mode or corrupt data: start fresh */
    }
  }

  async syncFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { data?: unknown };
      const remote = body.data as Partial<AppData> | undefined;
      if (remote && typeof remote.updatedAt === 'number' && remote.updatedAt > this.data.updatedAt) {
        this.data = hydrate(remote);
        this.writeLocal();
        this.listeners.forEach((l) => l());
      } else if (this.data.updatedAt > (remote?.updatedAt ?? 0)) {
        void this.pushToServer();
      }
      this.syncState = 'synced';
    } catch {
      this.syncState = 'offline';
    }
    this.listeners.forEach((l) => l());
  }

  private writeLocal(): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.data));
    } catch {
      /* quota or disabled storage */
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.writeLocal(), 400);
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => void this.pushToServer(), 2500);
  }

  private async pushToServer(): Promise<void> {
    this.syncState = 'syncing';
    try {
      const res = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: this.data }),
      });
      this.syncState = res.ok ? 'synced' : 'offline';
    } catch {
      this.syncState = 'offline';
    }
  }

  flush(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.writeLocal();
    }
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      const body = JSON.stringify({ data: this.data });
      navigator.sendBeacon?.('/api/state', new Blob([body], { type: 'application/json' }));
    }
  }
}

export const store = new Store();

export function useStore<T>(select: (d: AppData) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(store.get()));
}

export function useSettings(): Settings {
  return useStore((d) => d.settings);
}

export function updateSettings(patch: Partial<Settings>): void {
  store.update((d) => {
    d.settings = { ...d.settings, ...patch };
  });
}
