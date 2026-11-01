// Synth-lesson demos: a rack patch or a DX7 voice written compactly, rendered
// offline with the same DSP the instruments run, so a lesson can play "before"
// and "after" without touching the patch you are working on.

import { Part } from '../../audio/dx7/dsp';
import { initOperator, initPatch, type Operator, type Patch } from '../../audio/dx7/patch';
import { seedRand } from '../../audio/rack/base';
import { BLOCK, Rack } from '../../audio/rack/dsp';
import type { ModuleType } from '../../audio/rack/modules';
import { normalizeRack, type RackPatch } from '../../audio/rack/patch';
import { parsePitch } from '../music';

/** A rack written compactly: modules by id, cables as "from.port>to.port". */
export interface RackSpec {
  mods: Record<string, [ModuleType, Record<string, number>?]>;
  wires: string[];
}

type OpNum = 1 | 2 | 3 | 4 | 5 | 6;
/** A DX7 voice as changes from INIT VOICE (which has every operator but OP1 silent). */
export interface FmSpec {
  algorithm?: number;
  feedback?: number;
  ops?: Partial<Record<OpNum, Partial<Operator>>>;
  lfo?: Partial<Patch['lfo']>;
  pitchModSens?: number;
  pitchEg?: Patch['pitchEg'];
}

/** Changes for one variant: rack "mod.param", or DX7 "algorithm", "feedback", "op2.outputLevel", "op2.rates.3", "lfo.pmd". */
export type Tweak = Record<string, number>;

export interface SynthDemo {
  rack?: RackSpec;
  fm?: FmSpec;
  /** the patch's name when opened in the instrument */
  name: string;
  /** notes as [pitch, start s, length s, velocity 1–127]; left out, one held C3 (none for a rack without a MIDI module, which plays itself) */
  play?: [string, number, number, number?][];
  /** total length; default the last note's end plus 1.2 s */
  seconds?: number;
  /** each variant is a button: the base patch with `set` applied */
  tries: { label: string; set?: Tweak; note?: string }[];
  caption?: string;
  /** which pictures to draw of the sound; default both */
  view?: 'both' | 'wave' | 'spectrum' | 'none';
  /** the spectrum's top frequency; default 16 harmonics of the first note */
  hz?: number;
}

/** Build the rack patch, with a variant's changes. */
export function rackOf(spec: RackSpec, name: string, set: Tweak = {}): RackPatch {
  const modules = Object.entries(spec.mods).map(([id, [type, params]]) => ({ id, type, params: { ...params } }));
  for (const [k, v] of Object.entries(set)) {
    const [mod, param] = k.split('.');
    const m = modules.find((x) => x.id === mod);
    if (m) m.params[param] = v;
  }
  const cables = spec.wires.map((w, i) => {
    const [from, to] = w.split('>');
    const [fm, fp] = from.split('.');
    const [tm, tp] = to.split('.');
    return { id: `w${i}`, from: { mod: fm, port: fp }, to: { mod: tm, port: tp }, color: i % 7 };
  });
  return normalizeRack({ name, modules, cables })!;
}

/** Build the DX7 voice, with a variant's changes. */
export function fmOf(spec: FmSpec, name: string, set: Tweak = {}): Patch {
  const p = initPatch();
  p.name = name.slice(0, 10);
  // a lesson voice starts from silence: only the operators it names make sound
  p.ops = p.ops.map(() => ({ ...initOperator(), outputLevel: 0 }));
  if (spec.algorithm) p.algorithm = spec.algorithm;
  if (spec.feedback !== undefined) p.feedback = spec.feedback;
  if (spec.pitchModSens !== undefined) p.pitchModSens = spec.pitchModSens;
  if (spec.pitchEg) p.pitchEg = structuredClone(spec.pitchEg);
  p.lfo = { ...p.lfo, ...spec.lfo };
  for (const [n, op] of Object.entries(spec.ops ?? {})) p.ops[Number(n) - 1] = { ...p.ops[Number(n) - 1], ...structuredClone(op) };
  for (const [k, v] of Object.entries(set)) {
    const path = k.split('.');
    let at: Record<string, unknown> = p as unknown as Record<string, unknown>;
    if (/^op[1-6]$/.test(path[0])) {
      at = p.ops[Number(path[0][2]) - 1] as unknown as Record<string, unknown>;
      path.shift();
    }
    for (const seg of path.slice(0, -1)) at = at[seg] as Record<string, unknown>;
    at[path[path.length - 1]] = v;
  }
  return p;
}

const DEFAULT_PLAY: [string, number, number, number?][] = [['C3', 0, 1.6, 100]];

/** The notes a demo plays. */
export function demoNotes(d: SynthDemo): [string, number, number, number?][] {
  if (d.play) return d.play;
  return d.rack && !Object.values(d.rack.mods).some(([type]) => type === 'midi') ? [] : DEFAULT_PLAY;
}

export function demoLength(d: SynthDemo): number {
  if (d.seconds) return d.seconds;
  const notes = demoNotes(d);
  return notes.length ? Math.max(...notes.map(([, at, len]) => at + len)) + 1.2 : 4;
}

/** The first note's pitch, for windowing the pictures (a self-playing rack defaults to C3). */
export function demoRoot(d: SynthDemo): number {
  return parsePitch(demoNotes(d)[0]?.[0] ?? 'C3') ?? 48;
}

export interface Rendered {
  l: Float32Array;
  r: Float32Array;
  sampleRate: number;
}

/** A demo's random seed, from its name (FNV-1a). */
function seedOf(name: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * Render one variant to stereo samples. `gain` is shared by a demo's variants (from its first,
 * see demoGain) so they compare at the levels they really have.
 */
export function renderDemo(d: SynthDemo, set: Tweak | undefined, sampleRate: number, gain = 1): Rendered {
  const n = Math.ceil((demoLength(d) * sampleRate) / BLOCK) * BLOCK;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const events = demoNotes(d).flatMap(([pitch, at, len, vel = 100]) => {
    const note = parsePitch(pitch) ?? 60;
    return [{ t: at, note, vel }, { t: at + len, note, vel: 0 }];
  }).sort((a, b) => a.t - b.t || a.vel - b.vel);
  let k = 0;
  if (d.rack) {
    // the same dice for every variant and every play: a random demo always sounds as it was
    // tested, and Locked and Evolving start from the same phrase
    seedRand(seedOf(d.name));
    try {
      const rack = new Rack(sampleRate);
      rack.setPatch(rackOf(d.rack, d.name, set));
      for (let i = 0; i < n; i += BLOCK) {
        const t = (i + BLOCK) / sampleRate;
        for (; k < events.length && events[k].t < t; k++) {
          if (events[k].vel) rack.noteOn(events[k].note, events[k].vel);
          else rack.noteOff(events[k].note);
        }
        rack.render(l, r, i, BLOCK);
      }
    } finally {
      seedRand(null);
    }
  } else {
    const part = new Part(sampleRate, fmOf(d.fm ?? {}, d.name, set), 8);
    const TICK = 64;
    for (let i = 0; i < n; i += TICK) {
      const t = (i + TICK) / sampleRate;
      for (; k < events.length && events[k].t < t; k++) {
        if (events[k].vel) part.noteOn(events[k].note, events[k].vel);
        else part.noteOff(events[k].note);
      }
      part.render(l, i, Math.min(TICK, n - i));
    }
    for (let i = 0; i < n; i++) l[i] *= 0.6;
    r.set(l);
  }
  // the shared gain, then headroom, and a short fade so nothing clicks at the end
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  const g = peak * gain > 0.9 ? 0.9 / peak : gain;
  const fade = Math.min(n, Math.round(sampleRate * 0.05));
  for (let i = 0; i < n; i++) {
    const f = i >= n - fade ? (n - i) / fade : 1;
    l[i] *= g * f;
    r[i] *= g * f;
  }
  return { l, r, sampleRate };
}

/** The gain that brings a rendering to a comfortable listening level (RMS about −18 dBFS). */
export function levelGain(x: Rendered): number {
  let e = 0, c = 0;
  for (let i = 0; i < x.l.length; i++) if (Math.abs(x.l[i]) > 1e-4) (e += x.l[i] * x.l[i]), c++;
  const rms = Math.sqrt(e / Math.max(1, c));
  return rms > 1e-5 ? Math.min(12, Math.max(0.25, 0.125 / rms)) : 1;
}

/** A few cycles of the steady part of the sound, starting on a rising zero crossing. */
export function waveWindow(x: Rendered, root: number, cycles = 3, at = 0.35): Float32Array {
  const f0 = 440 * Math.pow(2, (root - 69) / 12);
  const len = Math.round((cycles * x.sampleRate) / f0);
  let s = Math.min(Math.round(at * x.sampleRate), Math.max(0, x.l.length - len * 2));
  const stop = Math.min(x.l.length - len, s + Math.round(x.sampleRate / f0) * 2);
  for (let i = s; i < stop; i++) if (x.l[i] <= 0 && x.l[i + 1] > 0) { s = i; break; }
  return x.l.slice(s, s + len);
}

/** Magnitude spectrum in dB (0 dB = the loudest bin) of a Hann-windowed slice, from 0 to `hz`. */
export function spectrum(x: Rendered, hz: number, at = 0.35, size = 8192): { db: Float32Array; binHz: number } {
  const start = Math.min(Math.round(at * x.sampleRate), Math.max(0, x.l.length - size));
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < size; i++) re[i] = (x.l[start + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
  fft(re, im);
  const binHz = x.sampleRate / size;
  const bins = Math.min(size / 2, Math.ceil(hz / binHz));
  const db = new Float32Array(bins);
  let top = 1e-12;
  for (let i = 0; i < bins; i++) top = Math.max(top, Math.hypot(re[i], im[i]));
  for (let i = 0; i < bins; i++) db[i] = 20 * Math.log10(Math.max(1e-12, Math.hypot(re[i], im[i]) / top));
  return { db, binHz };
}

/** In-place radix-2 FFT. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const a = i + j, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}
