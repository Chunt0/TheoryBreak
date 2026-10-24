// The display modules: oscilloscope, spectrum analyser, spectrogram, XY scope,
// tuner, keyboard, piano roll and voltmeter. They listen to their inputs and
// hand the panel what to draw through view(); the heavy lifting (FFTs, pitch
// detection) happens there, so it only runs while the rack is on screen (and the
// rack spreads it over several audio blocks). The tuner is the exception: it also
// tracks pitch as a CV, so it listens all the time.

import { BLOCK, C4, HIGH, MAX_CH, Mod, type Input, type RackView } from './base';
import type { ModuleType } from './modules';

// ------------------------------------------------------------------ analysis

interface Plan {
  rev: Uint32Array;
  cos: Float64Array;
  sin: Float64Array;
}
const plans = new Map<number, Plan>();

function plan(n: number): Plan {
  let p = plans.get(n);
  if (!p) {
    const bits = Math.log2(n);
    const rev = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
      rev[i] = r;
    }
    const cos = new Float64Array(n / 2);
    const sin = new Float64Array(n / 2);
    for (let k = 0; k < n / 2; k++) {
      cos[k] = Math.cos((2 * Math.PI * k) / n);
      sin[k] = Math.sin((2 * Math.PI * k) / n);
    }
    plans.set(n, (p = { rev, cos, sin }));
  }
  return p;
}

/** In-place radix-2 FFT of (re, im); the length is a power of two. The inverse is unscaled. */
export function fft(re: Float64Array, im: Float64Array, inverse = false): void {
  const n = re.length;
  const { rev, cos, sin } = plan(n);
  for (let i = 0; i < n; i++) {
    const j = rev[i];
    if (j > i) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  const sign = inverse ? 1 : -1;
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let i = 0; i < n; i += size) {
      for (let j = 0, k = 0; j < half; j++, k += step) {
        const wr = cos[k];
        const wi = sign * sin[k];
        const a = i + j;
        const b = a + half;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
}

/** Scratch arrays by size, reused between calls (the worklet runs one call at a time). */
const scratch = new Map<string, Float64Array>();
const tmp = (name: string, n: number): Float64Array => {
  const key = `${name}${n}`;
  let a = scratch.get(key);
  if (!a) scratch.set(key, (a = new Float64Array(n)));
  return a;
};

const hanns = new Map<number, Float64Array>();
function hann(n: number): Float64Array {
  let w = hanns.get(n);
  if (!w) {
    w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    hanns.set(n, w);
  }
  return w;
}

/** Hann-windowed magnitude spectrum of x, bins 0..n/2, scaled so a ±5 V sine peaks at 1. */
export function magnitudes(x: Float64Array): Float64Array {
  const n = x.length;
  const re = tmp('mre', n);
  const im = tmp('mim', n);
  const w = hann(n);
  for (let i = 0; i < n; i++) {
    re[i] = x[i] * w[i];
    im[i] = 0;
  }
  fft(re, im);
  const mag = tmp('mag', n / 2 + 1);
  const ref = 4 / (5 * n);
  for (let k = 0; k <= n / 2; k++) mag[k] = Math.hypot(re[k], im[k]) * ref;
  return mag;
}

export const toDb = (m: number): number => (m > 1e-6 ? 20 * Math.log10(m) : -120);

/** The spectrum's level at frequency f, between bins or the loudest bin in [lo, hi] Hz. */
function levelAt(mag: Float64Array, df: number, lo: number, hi: number): number {
  const a = lo / df;
  const b = hi / df;
  const top = mag.length - 1;
  if (a >= top) return 0;
  if (b - a < 1) {
    const x = Math.min(top, ((a + b) / 2));
    const i = Math.floor(x);
    const f = x - i;
    return mag[i] * (1 - f) + mag[Math.min(top, i + 1)] * f;
  }
  let m = 0;
  for (let k = Math.ceil(a); k <= Math.min(top, Math.floor(b)); k++) if (mag[k] > m) m = mag[k];
  return m;
}

/**
 * The fundamental of x in Hz (YIN, with the autocorrelation done by FFT), or 0 when
 * there is no clear pitch: silence, noise, or a mixture with no common period.
 */
export function detectPitch(x: Float64Array, sr: number, fmin = 30, fmax = 2500): number {
  const n = x.length;
  const half = n >> 1;
  let energy = 0;
  for (let i = 0; i < n; i++) energy += x[i] * x[i];
  if (energy / n < 1e-4) return 0;
  const tauMax = Math.min(half - 1, Math.floor(sr / fmin));
  const tauMin = Math.max(2, Math.floor(sr / fmax));
  // r(τ) = Σ x[j]·x[j+τ] over the first half: correlate it with the whole window
  const m = n * 2;
  const ar = tmp('ar', m), ai = tmp('ai', m), br = tmp('br', m), bi = tmp('bi', m);
  ar.fill(0); ai.fill(0); br.fill(0); bi.fill(0);
  for (let i = 0; i < n; i++) {
    br[i] = x[i];
    if (i < half) ar[i] = x[i];
  }
  fft(ar, ai);
  fft(br, bi);
  for (let k = 0; k < m; k++) {
    const re = ar[k] * br[k] + ai[k] * bi[k];
    const im = ar[k] * bi[k] - ai[k] * br[k];
    ar[k] = re;
    ai[k] = im;
  }
  fft(ar, ai, true);
  // squared-difference function from r and running energies, then YIN's normalisation
  const sq = tmp('sq', n + 1);
  sq[0] = 0;
  for (let i = 0; i < n; i++) sq[i + 1] = sq[i] + x[i] * x[i];
  const e0 = sq[half];
  const d = tmp('d', tauMax + 2);
  d[0] = 1;
  let run = 0;
  for (let t = 1; t <= tauMax + 1 && t + half <= n; t++) {
    const diff = e0 + (sq[t + half] - sq[t]) - (2 * ar[t]) / m;
    run += diff;
    d[t] = run > 0 ? (diff * t) / run : 1;
  }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (d[t] < 0.15) {
      while (t + 1 <= tauMax && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    let best = tauMin;
    for (let t = tauMin; t <= tauMax; t++) if (d[t] < d[best]) best = t;
    if (d[best] > 0.3) return 0;
    tau = best;
  }
  // parabola through the dip and its neighbours, for a pitch between whole samples
  const y0 = d[tau - 1], y1 = d[tau], y2 = tau + 1 <= tauMax ? d[tau + 1] : d[tau];
  const den = y0 - 2 * y1 + y2;
  const shift = den > 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (y0 - y2)) / den)) : 0;
  return sr / (tau + shift);
}

/** A power-of-two ring of samples. */
class Ring {
  readonly buf: Float32Array;
  private mask: number;
  /** samples written so far */
  n = 0;
  constructor(size: number) {
    this.buf = new Float32Array(size);
    this.mask = size - 1;
  }
  push(x: number): void {
    this.buf[this.n & this.mask] = x;
    this.n++;
  }
  at(i: number): number {
    return this.buf[i & this.mask];
  }
  /** The `len` samples (each the mean of `step`) ending at sample `end`. */
  read(len: number, step = 1, end = this.n, name = 'read'): Float64Array {
    const out = tmp(name, len);
    let s = end - len * step;
    for (let i = 0; i < len; i++) {
      let v = 0;
      for (let k = 0; k < step; k++) v += this.at(s++);
      out[i] = v / step;
    }
    return out;
  }
  clear(): void {
    this.buf.fill(0);
  }
}

/** Pitch of the last ~85 ms in a ring (at half rate: plenty for anything under 2.5 kHz). */
const ringPitch = (r: Ring, sr: number): number => detectPitch(r.read(2048, 2, r.n, 'pitch'), sr / 2);

const round = (v: number, k: number): number => Math.round(v * k) / k;
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** The sum of every voice of an input (an analyser hears the whole chord). */
function mono(inp: Input, i: number): number {
  const s = inp.src;
  if (!s) return 0;
  let x = 0;
  for (let c = 0; c < s.ch; c++) x += s.buf[c * BLOCK + i];
  return x;
}

// -------------------------------------------------------------- oscilloscope

const SCOPE_POINTS = 120;

class ScopeMod extends Mod {
  private a: Float32Array;
  private b: Float32Array;
  private w = 0;

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    this.a = new Float32Array(Math.ceil(sr * 4.2));
    this.b = new Float32Array(this.a.length);
  }

  process(n: number): void {
    const { a, b } = this.ins;
    const L = this.a.length;
    for (let i = 0; i < n; i++) {
      this.a[this.w] = a.buf[a.off(0) + i];
      this.b[this.w] = b.buf[b.off(0) + i];
      this.w = (this.w + 1) % L;
    }
  }

  override view(): RackView {
    const L = this.a.length;
    const W = Math.max(SCOPE_POINTS, Math.round(this.p.time * this.sr));
    // end the window on a rising zero crossing of A, so a steady wave stands still
    let end = this.w;
    for (let k = 1; k < Math.min(W, L - W - 2); k++) {
      const i = (this.w - k + L) % L;
      const j = (i - 1 + L) % L;
      if (this.a[j] < 0 && this.a[i] >= 0) {
        end = i;
        break;
      }
    }
    const pick = (buf: Float32Array) => {
      const pts: number[] = [];
      for (let p = 0; p < SCOPE_POINTS; p++) {
        const idx = (end - W + Math.floor((p * W) / SCOPE_POINTS) + L * 2) % L;
        pts.push(round(buf[idx] * this.p.scale, 100));
      }
      return pts;
    };
    return { k: 'scope', a: this.ins.a.on ? pick(this.a) : [], b: this.ins.b.on ? pick(this.b) : null };
  }
}

// --------------------------------------------------------- spectrum analyser

export const SPECTRUM_POINTS = 160;
export const SPECTRUM_LO = 20;
export const SPECTRUM_HI = 20000;
/** Frequency of display point i (log spaced). */
export const spectrumHz = (i: number): number => SPECTRUM_LO * Math.pow(SPECTRUM_HI / SPECTRUM_LO, i / (SPECTRUM_POINTS - 1));

const SPEC_N = 8192;

class SpectrumMod extends Mod {
  private ra = new Ring(SPEC_N);
  private rb = new Ring(SPEC_N);
  private sa = new Float64Array(SPECTRUM_POINTS).fill(-120);
  private sb = new Float64Array(SPECTRUM_POINTS).fill(-120);
  private hold = new Float64Array(SPECTRUM_POINTS).fill(-120);

  process(n: number): void {
    const { a, b } = this.ins;
    for (let i = 0; i < n; i++) {
      this.ra.push(mono(a, i));
      this.rb.push(mono(b, i));
    }
  }

  /** Smoothed display points (dB) for one input; also the loudest partial in Hz. */
  private trace(r: Ring, state: Float64Array): number {
    const mag = magnitudes(r.read(SPEC_N));
    const df = this.sr / SPEC_N;
    const ratio = Math.pow(SPECTRUM_HI / SPECTRUM_LO, 0.5 / (SPECTRUM_POINTS - 1));
    const keep = clamp(this.p.smooth, 0, 0.98);
    for (let i = 0; i < SPECTRUM_POINTS; i++) {
      const f = spectrumHz(i);
      const db = f >= this.sr / 2 ? -120 : toDb(levelAt(mag, df, f / ratio, f * ratio));
      // rise at once, fall back slowly (the Smooth knob)
      state[i] = db >= state[i] ? db : state[i] * keep + db * (1 - keep);
    }
    let k = Math.max(1, Math.ceil(SPECTRUM_LO / df));
    for (let j = k + 1; j < mag.length - 1; j++) if (mag[j] > mag[k]) k = j;
    if (mag[k] < 1e-3) return 0;
    // parabola through the log-magnitudes either side of the peak
    const a = Math.log(mag[k - 1] + 1e-12), b = Math.log(mag[k] + 1e-12), c = Math.log(mag[k + 1] + 1e-12);
    const den = a - 2 * b + c;
    return (k + (den < 0 ? (0.5 * (a - c)) / den : 0)) * df;
  }

  override view(): RackView {
    const { a, b } = this.ins;
    const out = (s: Float64Array) => Array.from(s, (v) => round(Math.max(-120, v), 10));
    let peak = 0;
    let f0 = 0;
    if (a.on) {
      peak = this.trace(this.ra, this.sa);
      if (this.p.harm >= 0.5) f0 = ringPitch(this.ra, this.sr);
      if (this.p.peaks >= 0.5) for (let i = 0; i < SPECTRUM_POINTS; i++) this.hold[i] = Math.max(this.hold[i] - 0.3, this.sa[i]);
    } else this.sa.fill(-120);
    if (b.on) this.trace(this.rb, this.sb);
    else this.sb.fill(-120);
    if (this.p.peaks < 0.5) this.hold.fill(-120);
    return {
      k: 'spectrum',
      a: a.on ? out(this.sa) : null,
      b: b.on ? out(this.sb) : null,
      peaks: a.on && this.p.peaks >= 0.5 ? out(this.hold) : null,
      f0: round(f0, 100),
      peak: round(peak, 10),
    };
  }
}

// ---------------------------------------------------------------- spectrogram

export const SONO_COLS = 160;
export const SONO_ROWS = 80;
export const SONO_LO = 30;
export const SONO_HI = 16000;
const SONO_N = 4096;
/** Most columns one view hands over; after a longer gap the screen skips ahead. */
const SONO_BURST = 24;

const SONO_RING = 16384;

class SonoMod extends Mod {
  private r = new Ring(SONO_RING);
  private next = SONO_N;

  process(n: number): void {
    const inp = this.ins.in;
    for (let i = 0; i < n; i++) this.r.push(mono(inp, i));
  }

  private column(end: number): number[] {
    const mag = magnitudes(this.r.read(SONO_N, 1, end));
    const df = this.sr / SONO_N;
    const hi = Math.min(SONO_HI, this.sr * 0.48);
    const ratio = Math.pow(hi / SONO_LO, 0.5 / (SONO_ROWS - 1));
    const floor = this.p.floor;
    const col: number[] = [];
    for (let y = 0; y < SONO_ROWS; y++) {
      const f = SONO_LO * Math.pow(hi / SONO_LO, y / (SONO_ROWS - 1));
      const db = toDb(levelAt(mag, df, f / ratio, f * ratio));
      col.push(Math.round(clamp((db - floor) / -floor, 0, 1) * 255));
    }
    return col;
  }

  override view(): RackView {
    const hop = Math.max(64, Math.round((this.p.time * this.sr) / SONO_COLS));
    const now = this.r.n;
    if (now - this.next > hop * SONO_BURST) this.next = now - hop * (SONO_BURST - 1);
    // a window that has left the ring is gone
    this.next = Math.max(this.next, now - (SONO_RING - SONO_N));
    const cols: number[][] = [];
    for (; this.next <= now; this.next += hop) cols.push(this.ins.in.on ? this.column(this.next) : new Array(SONO_ROWS).fill(0));
    return { k: 'sono', cols };
  }
}

// -------------------------------------------------------------------- XY scope

const XY_POINTS = 400;

class XyMod extends Mod {
  private rx = new Ring(16384);
  private ry = new Ring(16384);

  process(n: number): void {
    const { x, y } = this.ins;
    for (let i = 0; i < n; i++) {
      this.rx.push(mono(x, i));
      this.ry.push(mono(y, i));
    }
  }

  override view(): RackView {
    const W = clamp(Math.round(this.p.time * this.sr), 16, 16000);
    const pts = Math.min(XY_POINTS, W);
    const z = this.p.zoom;
    const x: number[] = [];
    const y: number[] = [];
    const end = this.rx.n;
    for (let p = 0; p < pts; p++) {
      const i = end - W + Math.floor((p * W) / pts);
      x.push(round(this.rx.at(i) * z, 100));
      y.push(round(this.ry.at(i) * z, 100));
    }
    const fx = this.ins.x.on ? ringPitch(this.rx, this.sr) : 0;
    const fy = this.ins.y.on ? ringPitch(this.ry, this.sr) : 0;
    return { k: 'xy', x, y, fx: round(fx, 100), fy: round(fy, 100) };
  }
}

// ---------------------------------------------------------------------- tuner

/** How often the tuner listens again (input samples). */
const TUNER_HOP = 2048;

class TunerMod extends Mod {
  private r = new Ring(4096);
  private acc = 0;
  private odd = false;
  private since = 0;
  private hz = 0;
  private cv = 0;
  /** the V/Oct input's voltage, NaN with nothing patched */
  private voctNow = NaN;

  process(n: number): void {
    const { in: inp, voct } = this.ins;
    const { voct: out, gate } = this.outs;
    this.setCh(1);
    if (inp.on) {
      for (let i = 0; i < n; i++) {
        // half rate is plenty for pitch
        const x = mono(inp, i);
        if (this.odd) this.r.push((this.acc + x) / 2);
        else this.acc = x;
        this.odd = !this.odd;
      }
      this.since += n;
      if (this.since >= TUNER_HOP) {
        this.since = 0;
        this.hz = detectPitch(this.r.read(2048, 1, this.r.n, 'tuner'), this.sr / 2);
        if (this.hz > 0) this.cv = Math.log2(this.hz / C4);
      }
    } else this.hz = 0;
    const g = this.hz > 0 ? 10 : 0;
    for (let i = 0; i < n; i++) {
      out.buf[i] = this.cv;
      gate.buf[i] = g;
    }
    this.voctNow = voct.on ? voct.buf[voct.off(0) + n - 1] : NaN;
  }

  override view(): RackView {
    const ref = this.p.ref;
    const note = (hz: number) => round(69 + 12 * Math.log2(hz / ref), 1000);
    if (!Number.isNaN(this.voctNow)) {
      const hz = C4 * Math.pow(2, this.voctNow);
      return { k: 'tuner', note: note(hz), hz: round(hz, 100), from: 'cv' };
    }
    if (this.hz > 0) return { k: 'tuner', note: note(this.hz), hz: round(this.hz, 100), from: 'audio' };
    return { k: 'tuner', note: -1, hz: 0, from: '' };
  }
}

// --------------------------------------------------------- keyboard and roll

/** Per voice: the note on a V/Oct cable, and whether its gate is open (no gate cable = always). */
function voices(voct: Input, gate: Input, each: (c: number, note: number, on: boolean) => void, i = 0): void {
  if (!voct.on) return;
  const ch = Math.max(voct.src!.ch, gate.src?.ch ?? 1);
  for (let c = 0; c < Math.min(ch, MAX_CH); c++) {
    const v = voct.buf[voct.off(c) + i];
    const on = gate.on ? gate.buf[gate.off(c) + i] >= HIGH : true;
    each(c, 60 + 12 * v, on);
  }
}

class KeysMod extends Mod {
  /** notes heard since the last view, so a short gate between two views still shows */
  private seen = new Set<number>();

  process(n: number): void {
    const { voct, gate } = this.ins;
    for (let i = 0; i < n; i += 8) voices(voct, gate, (_c, note, on) => on && this.seen.add(Math.round(note)), i);
  }

  override view(): RackView {
    const notes = [...this.seen].filter((n) => n >= 0 && n <= 127).sort((a, b) => a - b);
    this.seen.clear();
    return { k: 'keys', notes };
  }
}

/** Notes kept for the roll, at most. */
const ROLL_KEEP = 160;

class RollMod extends Mod {
  private t = 0;
  private note = new Float64Array(MAX_CH).fill(-1);
  private start = new Float64Array(MAX_CH);
  /** finished notes: [note, start, end] in samples */
  private done: number[] = [];

  process(n: number): void {
    const { voct, gate } = this.ins;
    const seen = new Uint8Array(MAX_CH);
    voices(voct, gate, (c, p, on) => {
      seen[c] = 1;
      const cur = this.note[c];
      // a new note when the gate opens, or the pitch moves well past a semitone's edge
      if (on && (cur < 0 || Math.abs(p - cur) > 0.6)) {
        if (cur >= 0) this.end(c);
        this.note[c] = Math.round(p);
        this.start[c] = this.t;
      } else if (!on && cur >= 0) this.end(c);
    });
    for (let c = 0; c < MAX_CH; c++) if (!seen[c] && this.note[c] >= 0) this.end(c);
    this.t += n;
  }

  private end(c: number): void {
    this.done.push(this.note[c], this.start[c], this.t);
    if (this.done.length > ROLL_KEEP * 3) this.done.splice(0, this.done.length - ROLL_KEEP * 3);
    this.note[c] = -1;
  }

  override view(): RackView {
    const span = this.p.time;
    const ago = (s: number) => round((this.t - s) / this.sr, 1000);
    const notes: number[] = [];
    for (let i = 0; i < this.done.length; i += 3) if (ago(this.done[i + 2]) < span) notes.push(this.done[i], Math.min(span, ago(this.done[i + 1])), ago(this.done[i + 2]));
    for (let c = 0; c < MAX_CH; c++) if (this.note[c] >= 0) notes.push(this.note[c], Math.min(span, ago(this.start[c])), 0);
    return { k: 'roll', span, notes };
  }
}

// ------------------------------------------------------------------ voltmeter

class VoltsMod extends Mod {
  private last = [0, 0, 0, 0];
  private lo = [0, 0, 0, 0];
  private hi = [0, 0, 0, 0];
  private fresh = true;
  /** on a poly cable, the voice each meter reads: the one that last jumped (the newest note) */
  private follow = [0, 0, 0, 0];
  private prev = new Float64Array(4 * MAX_CH);

  process(n: number): void {
    const ins = [this.ins.in1, this.ins.in2, this.ins.in3, this.ins.in4];
    for (let k = 0; k < 4; k++) {
      const inp = ins[k];
      if (!inp.on) continue;
      const ch = inp.src!.ch;
      if (ch > 1) {
        let jump = 0.02;
        for (let c = 0; c < ch; c++) {
          const v = inp.buf[c * BLOCK + n - 1];
          const d = Math.abs(v - this.prev[k * MAX_CH + c]);
          this.prev[k * MAX_CH + c] = v;
          if (d > jump) {
            jump = d;
            this.follow[k] = c;
          }
        }
      }
      const o = inp.off(this.follow[k] % ch);
      let lo = this.fresh ? Infinity : this.lo[k];
      let hi = this.fresh ? -Infinity : this.hi[k];
      for (let i = 0; i < n; i++) {
        const v = inp.buf[o + i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      this.lo[k] = lo;
      this.hi[k] = hi;
      this.last[k] = inp.buf[o + n - 1];
    }
    this.fresh = false;
  }

  override view(): RackView {
    const on = [this.ins.in1.on, this.ins.in2.on, this.ins.in3.on, this.ins.in4.on];
    const r = (a: number[]) => a.map((v, k) => (on[k] && Number.isFinite(v) ? round(v, 100) : 0));
    const out: RackView = { k: 'volts', v: r(this.last), lo: r(this.lo), hi: r(this.hi), on };
    this.fresh = true;
    return out;
  }
}

export const VIEW_CLASSES: Partial<Record<ModuleType, new (id: string, type: ModuleType, sr: number) => Mod>> = {
  scope: ScopeMod, spectrum: SpectrumMod, sono: SonoMod, xy: XyMod, tuner: TunerMod, keys: KeysMod, roll: RollMod, volts: VoltsMod,
};
