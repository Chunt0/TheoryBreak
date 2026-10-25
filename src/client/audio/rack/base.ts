// Building blocks for the modular synth's modules: jacks (ports and inputs),
// the module base class, and small DSP helpers. Every module file builds on these.

import { MODULES, type ModuleType } from './modules';

export const BLOCK = 32;
export const MAX_CH = 8;
export const C4 = 261.6256;
export const TAU = Math.PI * 2;
const ZERO = new Float32Array(MAX_CH * BLOCK);
export const HIGH = 1; // gate/trigger threshold, volts

/**
 * A display module's screen, sent to its panel with the meters (~20× a second).
 * Pitches are MIDI numbers (60 = C4 = 0 V), levels dB (0 = a ±5 V sine), times seconds.
 */
export type RackView =
  | { k: 'scope'; a: number[]; b: number[] | null }
  /** log-spaced points from 20 Hz to 20 kHz; f0 = the fundamental heard on A, peak = its loudest partial (Hz, 0 = none) */
  | { k: 'spectrum'; a: number[] | null; b: number[] | null; peaks: number[] | null; f0: number; peak: number }
  /** new columns since the last view, low to high, 0–255 */
  | { k: 'sono'; cols: number[][] }
  /** fx, fy: the pitch on each axis (Hz, 0 = none) */
  | { k: 'xy'; x: number[]; y: number[]; fx: number; fy: number }
  /** note -1 = nothing to read */
  | { k: 'tuner'; note: number; hz: number; from: 'cv' | 'audio' | '' }
  /** every note sounding since the last view */
  | { k: 'keys'; notes: number[] }
  /** notes in the last `span` seconds, as flat [note, began, ended] triples (seconds ago; 0 = still sounding) */
  | { k: 'roll'; span: number; notes: number[] }
  /** per input: the latest voltage and the lowest and highest since the last view */
  | { k: 'volts'; v: number[]; lo: number[]; hi: number[]; on: boolean[] }
  /** the granular looper: tempo, beat of the bar, looper state (see LOOP_* in cosm.ts), play position 0–1, loop length s */
  | { k: 'cosm'; bpm: number; beat: number; loop: number; pos: number; len: number; frozen: boolean };

export class Port {
  readonly buf = new Float32Array(MAX_CH * BLOCK);
  ch = 1;
  /** at least one cable leaves this jack (lets modules skip unheard outputs) */
  used = false;
  /** loudest |V| since the meters were last read */
  peak = 0;
}

/** What is patched into an input jack. */
export class Input {
  src: Port | null = null;
  get on(): boolean {
    return this.src !== null;
  }
  get buf(): Float32Array {
    return this.src ? this.src.buf : ZERO;
  }
  /** buffer offset of voice c: a mono cable feeds every voice */
  off(c: number): number {
    const s = this.src;
    return s && s.ch > 1 ? (c % s.ch) * BLOCK : 0;
  }
}

/** Cheap tanh: exact enough for saturation, much faster than Math.tanh. */
export const ftanh = (x: number): number => (x <= -3 ? -1 : x >= 3 ? 1 : (x * (27 + x * x)) / (27 + 9 * x * x));

export function blep(t: number, dt: number): number {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

export abstract class Mod {
  readonly ins: Record<string, Input> = {};
  readonly outs: Record<string, Port> = {};
  readonly p: Record<string, number> = {};
  readonly inList: Input[] = [];
  readonly outList: Port[] = [];
  /** voices this module ran last block */
  ch = 1;

  constructor(readonly id: string, readonly type: ModuleType, protected sr: number) {
    const def = MODULES[type];
    for (const i of def.ins) this.inList.push((this.ins[i.id] = new Input()));
    for (const o of def.outs) this.outList.push((this.outs[o.id] = new Port()));
    for (const q of def.params) this.p[q.id] = q.def;
  }

  /** The widest cable patched in decides how many voices run. */
  protected widest(): number {
    let ch = 1;
    for (const i of this.inList) if (i.src && i.src.ch > ch) ch = i.src.ch;
    return ch;
  }

  protected setCh(ch: number): void {
    this.ch = ch;
    for (const o of this.outList) o.ch = ch;
  }

  abstract process(n: number): void;

  /** A number the panel shows (sequencer step, clock beat); -1 = nothing. */
  display(): number {
    return -1;
  }

  /** What a display module's screen draws (see RackView), or null. */
  view(): RackView | null {
    return null;
  }

  /** Sum of every voice of an input at sample i (for mono effects fed a poly cable). */
  protected sum(inp: Input, i: number): number {
    const s = inp.src;
    if (!s) return 0;
    let x = 0;
    for (let c = 0; c < s.ch; c++) x += s.buf[c * BLOCK + i];
    return x;
  }
}

/** Per-voice rising-edge detector for gate and trigger inputs. */
export class Edges {
  private last = new Float32Array(MAX_CH);
  /** True when voice c crossed the gate threshold upward at this sample. */
  rose(c: number, v: number): boolean {
    const r = v >= HIGH && this.last[c] < HIGH;
    this.last[c] = v;
    return r;
  }
}

/** Linear read from a circular buffer, `d` samples (fractional) behind write position `w`. */
export function readDelay(buf: Float32Array, w: number, d: number): number {
  const L = buf.length;
  let r = w - d;
  while (r < 0) r += L;
  const i = Math.floor(r);
  const f = r - i;
  const a = buf[i % L];
  const b = buf[(i + 1) % L];
  return a + (b - a) * f;
}

/** One-pole low-pass coefficient for a cutoff in Hz. */
export const onePole = (hz: number, sr: number): number => 1 - Math.exp((-TAU * Math.min(hz, sr * 0.45)) / sr);
