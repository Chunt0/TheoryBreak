// Per-patch stereo effects chain for the live DX7 instrument: Chorus -> Delay
// -> Drive -> Reverb2. Plain Float32Array block processors (not the modular
// rack's CV-patchable Mod abstraction, which would be overkill for a fixed
// 4-slot chain); each effect fast-bypasses to a no-op when switched off. This
// chain runs per part, upstream of the engine's existing global convolution
// reverb/compressor.

import type { ChorusFx, DelayFx, DriveFx, FxConfig, ReverbFx } from './patch';

const TAU = Math.PI * 2;

function readDelay(buf: Float32Array, w: number, d: number): number {
  const L = buf.length;
  let r = w - d;
  if (r < 0) r += L;
  const ri = Math.floor(r);
  const fr = r - ri;
  const a = buf[ri];
  const b = buf[ri + 1 === L ? 0 : ri + 1];
  return a + (b - a) * fr;
}

class Chorus {
  private lineL: Float32Array;
  private lineR: Float32Array;
  private w = 0;
  private phase = 0;
  cfg: ChorusFx = { on: false, rate: 40, depth: 30, mix: 35 };

  constructor(private sr: number) {
    this.lineL = new Float32Array(Math.ceil(sr * 0.05));
    this.lineR = new Float32Array(Math.ceil(sr * 0.05));
  }

  process(left: Float32Array, right: Float32Array, offset: number, n: number): void {
    if (!this.cfg.on) return;
    const sr = this.sr;
    const rateHz = 0.15 + (this.cfg.rate / 99) * 4.85;
    const depthSamp = (this.cfg.depth / 99) * 0.006 * sr;
    const baseSamp = 0.008 * sr;
    const mix = this.cfg.mix / 99;
    const lineL = this.lineL;
    const lineR = this.lineR;
    const L = lineL.length;
    let w = this.w;
    let phase = this.phase;
    for (let s = 0; s < n; s++) {
      const i = offset + s;
      phase = (phase + rateHz / sr) % 1;
      const dl = baseSamp + depthSamp * (0.5 + 0.5 * Math.sin(TAU * phase));
      const dr = baseSamp + depthSamp * (0.5 + 0.5 * Math.sin(TAU * (phase + 0.25)));
      const yl = readDelay(lineL, w, dl);
      const yr = readDelay(lineR, w, dr);
      const xl = left[i];
      const xr = right[i];
      lineL[w] = xl;
      lineR[w] = xr;
      w = w + 1 === L ? 0 : w + 1;
      left[i] = xl * (1 - mix) + yl * mix;
      right[i] = xr * (1 - mix) + yr * mix;
    }
    this.w = w;
    this.phase = phase;
  }
}

// Fixed note-feel ratios against a 0.5s reference beat, used when "sync" is on
// (there's no external transport here, so this just quantizes the time knob
// to musically-even steps rather than a continuous sweep).
const SYNC_RATIOS = [1 / 8, 1 / 6, 1 / 4, 1 / 3, 3 / 8, 1 / 2, 2 / 3, 3 / 4, 1, 1.5, 2];

class Delay {
  private lineL: Float32Array;
  private lineR: Float32Array;
  private w = 0;
  cfg: DelayFx = { on: false, time: 30, feedback: 35, mix: 25, sync: false };

  constructor(private sr: number) {
    this.lineL = new Float32Array(Math.ceil(sr * 1.3) + 4);
    this.lineR = new Float32Array(Math.ceil(sr * 1.3) + 4);
  }

  process(left: Float32Array, right: Float32Array, offset: number, n: number): void {
    if (!this.cfg.on) return;
    const sr = this.sr;
    const timeSec = this.cfg.sync
      ? SYNC_RATIOS[Math.min(SYNC_RATIOS.length - 1, Math.floor((this.cfg.time / 100) * SYNC_RATIOS.length))] * 0.5
      : 0.02 + (this.cfg.time / 99) * 1.08;
    const d = Math.min(this.lineL.length - 2, timeSec * sr);
    const fb = Math.min(0.92, (this.cfg.feedback / 99) * 0.92);
    const mix = this.cfg.mix / 99;
    const lineL = this.lineL;
    const lineR = this.lineR;
    const L = lineL.length;
    let w = this.w;
    for (let s = 0; s < n; s++) {
      const i = offset + s;
      const yl = readDelay(lineL, w, d);
      const yr = readDelay(lineR, w, d);
      const xl = left[i];
      const xr = right[i];
      lineL[w] = Math.tanh((xl + yl * fb) * 0.8);
      lineR[w] = Math.tanh((xr + yr * fb) * 0.8);
      w = w + 1 === L ? 0 : w + 1;
      left[i] = xl * (1 - mix) + yl * mix;
      right[i] = xr * (1 - mix) + yr * mix;
    }
    this.w = w;
  }
}

class Drive {
  private lpL = 0;
  private lpR = 0;
  cfg: DriveFx = { on: false, amount: 20, tone: 50, mix: 100 };

  constructor(private sr: number) {}

  process(left: Float32Array, right: Float32Array, offset: number, n: number): void {
    if (!this.cfg.on) return;
    const amt = 1 + (this.cfg.amount / 99) * 9;
    const cutoff = 200 + (this.cfg.tone / 99) * 6000;
    const k = 1 - Math.exp((-TAU * cutoff) / this.sr);
    const mix = this.cfg.mix / 99;
    let lpL = this.lpL;
    let lpR = this.lpR;
    for (let s = 0; s < n; s++) {
      const i = offset + s;
      const xl = left[i];
      const xr = right[i];
      const yl = Math.tanh(xl * amt);
      const yr = Math.tanh(xr * amt);
      lpL += (yl - lpL) * k;
      lpR += (yr - lpR) * k;
      left[i] = xl * (1 - mix) + lpL * mix;
      right[i] = xr * (1 - mix) + lpR * mix;
    }
    this.lpL = lpL + 1e-18;
    this.lpR = lpR + 1e-18;
  }
}

// Freeverb-style comb/allpass tunings (samples at 44.1kHz), reused from the
// modular rack's VerbMod.
const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASSES = [556, 441, 341, 225];
const SPREAD = 23;

class Reverb2 {
  private combs: { buf: Float32Array; i: number; store: number }[][] = [];
  private aps: { buf: Float32Array; i: number }[][] = [];
  cfg: ReverbFx = { on: false, size: 50, damp: 40, mix: 25 };

  constructor(sr: number) {
    const s = sr / 44100;
    for (let side = 0; side < 2; side++) {
      this.combs.push(COMBS.map((l) => ({ buf: new Float32Array(Math.round((l + side * SPREAD) * s)), i: 0, store: 0 })));
      this.aps.push(ALLPASSES.map((l) => ({ buf: new Float32Array(Math.round((l + side * SPREAD) * s)), i: 0 })));
    }
  }

  process(left: Float32Array, right: Float32Array, offset: number, n: number): void {
    if (!this.cfg.on) return;
    const fb = 0.7 + (this.cfg.size / 99) * 0.28;
    const damp = (this.cfg.damp / 99) * 0.4;
    const mix = this.cfg.mix / 99;
    for (let s = 0; s < n; s++) {
      const i = offset + s;
      const x = (left[i] + right[i]) * 0.5;
      const input = x * 0.015;
      let outL = 0;
      let outR = 0;
      for (let side = 0; side < 2; side++) {
        let acc = 0;
        for (const cb of this.combs[side]) {
          const y = cb.buf[cb.i];
          cb.store = y * (1 - damp) + cb.store * damp + 1e-20;
          cb.buf[cb.i] = input + cb.store * fb;
          cb.i = cb.i + 1 === cb.buf.length ? 0 : cb.i + 1;
          acc += y;
        }
        for (const ap of this.aps[side]) {
          const y = ap.buf[ap.i];
          ap.buf[ap.i] = acc + y * 0.5;
          acc = y - acc;
          ap.i = ap.i + 1 === ap.buf.length ? 0 : ap.i + 1;
        }
        if (side === 0) outL = acc;
        else outR = acc;
      }
      left[i] = left[i] * (1 - mix) + outL * 3 * mix;
      right[i] = right[i] * (1 - mix) + outR * 3 * mix;
    }
  }
}

/** Chorus -> Delay -> Drive -> Reverb2, configured from a Patch's `fx` block. */
export class PartFx {
  private chorus: Chorus;
  private delay: Delay;
  private drive: Drive;
  private reverb: Reverb2;

  constructor(sr: number) {
    this.chorus = new Chorus(sr);
    this.delay = new Delay(sr);
    this.drive = new Drive(sr);
    this.reverb = new Reverb2(sr);
  }

  setPatch(fx: FxConfig): void {
    this.chorus.cfg = fx.chorus;
    this.delay.cfg = fx.delay;
    this.drive.cfg = fx.drive;
    this.reverb.cfg = fx.reverb;
  }

  processBlock(left: Float32Array, right: Float32Array, offset: number, n: number): void {
    this.chorus.process(left, right, offset, n);
    this.delay.process(left, right, offset, n);
    this.drive.process(left, right, offset, n);
    this.reverb.process(left, right, offset, n);
  }
}
