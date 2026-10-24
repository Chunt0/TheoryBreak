// The second shelf of modules: wavetable, FM and string voices, drums,
// function and random generators, rhythm and sequencing tools, the chord
// generator, more filters and effects, and utilities (panner, scope…).
// Same conventions as dsp.ts: ±5 V audio, 1 V/oct pitch, 10 V gates.

import { BLOCK, C4, Edges, HIGH, MAX_CH, Mod, TAU, ftanh, onePole, readDelay } from './base';
import { buildChord } from './chords';
import { FM_RATIOS, type ModuleType } from './modules';

const rnd = (): number => Math.random() * 2 - 1;
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

// ===================================================================== sources

// Wavetables: eight shapes, each built from harmonics and stored band-limited at
// several harmonic counts, so high notes don't alias.
const WT_SIZE = 512;
const WT_LEVELS = [64, 32, 16, 8, 4, 2, 1];
let WT_TABLES: Float32Array[][] | null = null;

/** sine and cosine amplitude of harmonic k for each shape */
function harmonic(shape: number, k: number): [number, number] {
  const odd = k % 2 === 1;
  switch (shape) {
    case 0: return [k === 1 ? 1 : 0, 0];
    case 1: return [odd ? (((k - 1) / 2) % 2 ? -1 : 1) / (k * k) : 0, 0];
    case 2: return [(k % 2 ? 1 : -1) / k, 0];
    case 3: return [odd ? 1 / k : 0, 0];
    case 4: return [0, Math.sin(Math.PI * k * 0.25) / k];
    case 5: {
      const bars: Record<number, number> = { 1: 1, 2: 0.8, 3: 0.6, 4: 0.5, 6: 0.35, 8: 0.3, 10: 0.15, 12: 0.12 };
      return [bars[k] ?? 0, 0];
    }
    case 6: return [(1 / k) * (1 + 4 * Math.exp(-((k - 6) ** 2) / 4) + 2 * Math.exp(-((k - 11) ** 2) / 6)), 0];
    default: {
      const primes = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
      return [primes.includes(k) ? 1 / Math.sqrt(k) : 0, 0];
    }
  }
}

function wavetables(): Float32Array[][] {
  if (WT_TABLES) return WT_TABLES;
  WT_TABLES = [];
  for (let shape = 0; shape < 8; shape++) {
    const levels: Float32Array[] = [];
    let norm = 0;
    for (const H of WT_LEVELS) {
      const t = new Float32Array(WT_SIZE + 1);
      for (let k = 1; k <= H; k++) {
        const [a, b] = harmonic(shape, k);
        if (!a && !b) continue;
        for (let i = 0; i < WT_SIZE; i++) {
          const x = (TAU * k * i) / WT_SIZE;
          t[i] += a * Math.sin(x) + b * Math.cos(x);
        }
      }
      // remove DC (the pulse has some), then scale every level like the full one
      const dc = t.reduce((s, v, i) => (i < WT_SIZE ? s + v : s), 0) / WT_SIZE;
      for (let i = 0; i < WT_SIZE; i++) t[i] -= dc;
      if (!norm) norm = Math.max(1e-9, ...t.map(Math.abs));
      for (let i = 0; i < WT_SIZE; i++) t[i] /= norm;
      t[WT_SIZE] = t[0];
      levels.push(t);
    }
    WT_TABLES.push(levels);
  }
  return WT_TABLES;
}

class WtMod extends Mod {
  private phase = new Float64Array(MAX_CH);
  private tables = wavetables();

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { voct, table, fm } = this.ins;
    const out = this.outs.out.buf;
    const base = Math.round(this.p.oct) + this.p.tune / 12;
    const nyq = this.sr * 0.45;
    for (let c = 0; c < ch; c++) {
      const vo = voct.off(c), to = table.off(c), fo = fm.off(c), o = c * BLOCK;
      let ph = this.phase[c];
      for (let i = 0; i < n; i++) {
        const f = clamp(C4 * Math.pow(2, base + voct.buf[vo + i] + fm.buf[fo + i] * this.p.fm), 0.01, nyq);
        // the highest level whose harmonics all fit under Nyquist
        let L = 0;
        while (L < WT_LEVELS.length - 1 && WT_LEVELS[L] * f > nyq) L++;
        const pos = clamp(this.p.table + table.buf[to + i] * this.p.cv * 0.7, 0, 7);
        const s0 = Math.floor(pos);
        const s1 = Math.min(7, s0 + 1);
        const mix = pos - s0;
        const x = ph * WT_SIZE;
        const xi = Math.floor(x);
        const xf = x - xi;
        const t0 = this.tables[s0][L];
        const t1 = this.tables[s1][L];
        const a = t0[xi] + (t0[xi + 1] - t0[xi]) * xf;
        const b = t1[xi] + (t1[xi + 1] - t1[xi]) * xf;
        out[o + i] = 5 * (a + (b - a) * mix);
        ph += f / this.sr;
        if (ph >= 1) ph -= 1;
      }
      this.phase[c] = ph;
    }
  }
}

class FmOpMod extends Mod {
  private pc = new Float64Array(MAX_CH);
  private pm = new Float64Array(MAX_CH);
  private last = new Float64Array(MAX_CH);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { voct, index, fm } = this.ins;
    const out = this.outs.out.buf;
    const mod = this.outs.mod.buf;
    const base = Math.round(this.p.oct) + this.p.tune / 12;
    const ratio = FM_RATIOS[Math.round(this.p.ratio)] ?? 1;
    const fb = this.p.fb * 1.5;
    const nyq = this.sr * 0.45;
    for (let c = 0; c < ch; c++) {
      const vo = voct.off(c), io = index.off(c), fo = fm.off(c), o = c * BLOCK;
      let pc = this.pc[c], pm = this.pm[c], last = this.last[c];
      for (let i = 0; i < n; i++) {
        const f = clamp(C4 * Math.pow(2, base + voct.buf[vo + i]), 0.01, nyq);
        const idx = Math.max(0, this.p.index + index.buf[io + i] * this.p.cv);
        const m = Math.sin(TAU * pm + fb * last);
        last = m;
        out[o + i] = 5 * Math.sin(TAU * pc + idx * m + fm.buf[fo + i] * 0.2);
        mod[o + i] = 5 * m;
        pc += f / this.sr;
        pm += (f * ratio) / this.sr;
        if (pc >= 1) pc -= 1;
        if (pm >= 1) pm -= Math.floor(pm);
      }
      this.pc[c] = pc;
      this.pm[c] = pm;
      this.last[c] = last;
    }
  }
}

class StringMod extends Mod {
  private lines: Float32Array[] = [];
  private w = new Int32Array(MAX_CH);
  private lp = new Float64Array(MAX_CH);
  private edges = new Edges();

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    // long enough for ~20 Hz
    const len = 1 << Math.ceil(Math.log2(sr / 18));
    for (let c = 0; c < MAX_CH; c++) this.lines.push(new Float32Array(len));
  }

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { voct, trig, in: exc } = this.ins;
    const out = this.outs.out.buf;
    const sr = this.sr;
    const k = 0.15 + 0.85 * this.p.tone; // loop low-pass: brighter tone = less damping each trip
    const filterDelay = (1 - k) / k;
    const pluckK = 0.05 + 0.95 * this.p.bright;
    for (let c = 0; c < ch; c++) {
      const line = this.lines[c];
      const L = line.length;
      const vo = voct.off(c), to = trig.off(c), eo = exc.off(c), o = c * BLOCK;
      let w = this.w[c];
      let lp = this.lp[c];
      for (let i = 0; i < n; i++) {
        const f = clamp(C4 * Math.pow(2, Math.round(this.p.oct) + voct.buf[vo + i]), 20, sr / 4);
        const period = sr / f;
        if (this.edges.rose(c, trig.buf[to + i])) {
          // pluck: fill one period behind the write head with filtered noise
          let s = 0;
          const P = Math.floor(period);
          for (let j = 0; j < P; j++) {
            s += (rnd() - s) * pluckK;
            const idx = (w - P + j + L) % L;
            line[idx] = line[idx] * 0.3 + s * 4;
          }
        }
        const y = readDelay(line, w, Math.max(2, period - filterDelay));
        lp += (y - lp) * k;
        const g = Math.pow(0.001, 1 / (f * this.p.decay));
        line[w] = lp * g + exc.buf[eo + i] * 0.2;
        w = (w + 1) % L;
        out[o + i] = lp * 1.2;
      }
      this.w[c] = w;
      this.lp[c] = Number.isFinite(lp) ? lp + 1e-18 : 0;
    }
  }
}

// ======================================================================= drums

/** Accent input: its voltage at the hit sets the level (0–10 V → 0–1); unpatched = full. */
const accentAt = (m: Mod, i: number): number => (m.ins.accent.on ? clamp(m.ins.accent.buf[m.ins.accent.off(0) + i] * 0.1, 0, 1) : 1);

class KickMod extends Mod {
  private edges = new Edges();
  private t = 1e9;
  private phase = 0;
  private level = 1;

  process(n: number): void {
    this.setCh(1);
    const { trig } = this.ins;
    const out = this.outs.out.buf;
    const sr = this.sr;
    const drive = this.p.drive;
    const norm = 1 / Math.tanh(drive);
    const kd = 4.6 / this.p.decay;
    for (let i = 0; i < n; i++) {
      if (this.edges.rose(0, trig.buf[trig.off(0) + i])) {
        this.t = 0;
        this.level = accentAt(this, i);
      }
      const t = this.t;
      const env = Math.exp(-t * kd);
      if (env < 1e-4) {
        out[i] = 0;
        continue;
      }
      const f = this.p.tune * (1 + this.p.punch * 7 * Math.exp(-t / 0.025));
      this.phase += f / sr;
      if (this.phase >= 1) this.phase -= 1;
      out[i] = 5 * this.level * ftanh(drive * Math.sin(TAU * this.phase) * env) * norm;
      this.t += 1 / sr;
    }
  }
}

class SnareMod extends Mod {
  private edges = new Edges();
  private t = 1e9;
  private p1 = 0;
  private p2 = 0;
  private hp = 0;
  private lp = 0;
  private level = 1;

  process(n: number): void {
    this.setCh(1);
    const { trig } = this.ins;
    const out = this.outs.out.buf;
    const sr = this.sr;
    const kBody = 4.6 / (this.p.decay * 0.6);
    const kNoise = 4.6 / this.p.decay;
    const kLp = onePole(this.p.tone, sr);
    const kHp = onePole(900, sr);
    const snappy = this.p.snappy;
    for (let i = 0; i < n; i++) {
      if (this.edges.rose(0, trig.buf[trig.off(0) + i])) {
        this.t = 0;
        this.p1 = this.p2 = 0;
        this.level = accentAt(this, i);
      }
      const t = this.t;
      if (t > this.p.decay * 3) {
        out[i] = 0;
        continue;
      }
      const f = this.p.tune * (1 + 0.5 * Math.exp(-t / 0.01));
      this.p1 = (this.p1 + f / sr) % 1;
      this.p2 = (this.p2 + (f * 1.73) / sr) % 1;
      const body = (Math.sin(TAU * this.p1) + 0.6 * Math.sin(TAU * this.p2)) * Math.exp(-t * kBody);
      const w = rnd();
      this.hp += (w - this.hp) * kHp;
      this.lp += (w - this.hp - this.lp) * kLp;
      const noise = this.lp * 2.2 * Math.exp(-t * kNoise);
      out[i] = 5 * this.level * ftanh(body * (1 - snappy * 0.6) * 0.7 + noise * snappy);
      this.t += 1 / sr;
    }
  }
}

const HAT_FREQS = [205.3, 304.4, 369.6, 522.7, 540, 800];

class HatsMod extends Mod {
  private closedEdges = new Edges();
  private openEdges = new Edges();
  private t = 1e9;
  private decay = 0.05;
  private phases = new Float64Array(6);
  private h1 = 0;
  private h2 = 0;
  private level = 1;

  process(n: number): void {
    this.setCh(1);
    const { trig, open } = this.ins;
    const out = this.outs.out.buf;
    const sr = this.sr;
    const scale = this.p.tone / 7000;
    const kHp = onePole(this.p.tone, sr);
    for (let i = 0; i < n; i++) {
      // a closed hit chokes a ringing open hat
      if (this.closedEdges.rose(0, trig.buf[trig.off(0) + i])) {
        this.t = 0;
        this.decay = this.p.decay;
        this.level = accentAt(this, i);
      }
      if (this.openEdges.rose(0, open.buf[open.off(0) + i])) {
        this.t = 0;
        this.decay = this.p.open;
        this.level = accentAt(this, i);
      }
      const t = this.t;
      if (t > this.decay * 4) {
        out[i] = 0;
        continue;
      }
      let metal = 0;
      for (let k = 0; k < 6; k++) {
        this.phases[k] = (this.phases[k] + (HAT_FREQS[k] * 4 * scale) / sr) % 1;
        metal += this.phases[k] < 0.5 ? 1 : -1;
      }
      const x = metal / 6 + rnd() * 0.4;
      // two high-pass stages
      this.h1 += (x - this.h1) * kHp;
      const y1 = x - this.h1;
      this.h2 += (y1 - this.h2) * kHp;
      const y = y1 - this.h2;
      out[i] = 5 * this.level * ftanh(y * 2.5 * Math.exp((-t * 4.6) / this.decay));
      this.t += 1 / sr;
    }
  }
}

// ================================================================== modulation

class FuncMod extends Mod {
  private v = new Float64Array(MAX_CH);
  private stage = new Uint8Array(MAX_CH); // 0 idle, 1 rising, 2 falling
  private end = new Int32Array(MAX_CH);
  private edges = new Edges();

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { trig, in: src } = this.ins;
    const { out, end } = this.outs;
    const up = 10 / (this.p.rise * this.sr);
    const down = 10 / (this.p.fall * this.sr);
    const loop = this.p.loop >= 0.5;
    const shape = Math.round(this.p.shape);
    const pulse = Math.round(this.sr * 0.002);
    for (let c = 0; c < ch; c++) {
      const to = trig.off(c), so = src.off(c), o = c * BLOCK;
      let v = this.v[c], st = this.stage[c], e = this.end[c];
      for (let i = 0; i < n; i++) {
        if (this.edges.rose(c, trig.buf[to + i])) st = 1;
        if (st === 0 && loop && !src.on) st = 1;
        if (st === 1) {
          v += up;
          if (v >= 10) {
            v = 10;
            st = 2;
          }
        } else if (st === 2) {
          const floor = src.on ? src.buf[so + i] : 0;
          v -= down;
          if (v <= floor) {
            v = floor;
            st = loop ? 1 : 0;
            e = pulse;
          }
        } else if (src.on) {
          // follow the input, no faster than Rise going up and Fall going down (slew / portamento)
          const target = src.buf[so + i];
          v += target > v ? Math.min(target - v, up) : -Math.min(v - target, down);
        } else v = 0;
        let y = v;
        if (!src.on && shape !== 1) {
          const x = clamp(v * 0.1, 0, 1);
          y = 10 * (shape === 0 ? 1 - Math.pow(1 - x, 2.5) : Math.pow(x, 2.5));
        }
        out.buf[o + i] = y;
        end.buf[o + i] = e > 0 ? 10 : 0;
        if (e > 0) e--;
      }
      this.v[c] = v;
      this.stage[c] = st;
      this.end[c] = e;
    }
  }
}

class RandMod extends Mod {
  private phase = new Float64Array(MAX_CH);
  private prev = new Float64Array(MAX_CH);
  private cur = new Float64Array(MAX_CH);
  private trig = new Int32Array(MAX_CH);
  private since = new Float64Array(MAX_CH);
  private period = new Float64Array(MAX_CH).fill(24000);
  private edges = new Edges();

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { clk } = this.ins;
    const { step, smooth, trig } = this.outs;
    const amt = this.p.amt * 5;
    const inc = this.p.rate / this.sr;
    const pulse = Math.round(this.sr * 0.002);
    for (let c = 0; c < ch; c++) {
      const co = clk.off(c), o = c * BLOCK;
      for (let i = 0; i < n; i++) {
        let tick = false;
        if (clk.on) {
          if (this.edges.rose(c, clk.buf[co + i])) {
            tick = true;
            this.period[c] = Math.max(1, this.since[c]);
            this.since[c] = 0;
          }
          this.since[c]++;
        } else {
          this.phase[c] += inc;
          if (this.phase[c] >= 1) {
            this.phase[c] -= 1;
            tick = true;
          }
        }
        if (tick) {
          this.prev[c] = this.cur[c];
          this.cur[c] = rnd();
          this.trig[c] = pulse;
        }
        const frac = clk.on ? Math.min(1, this.since[c] / this.period[c]) : this.phase[c];
        const s = 0.5 - 0.5 * Math.cos(Math.PI * frac);
        step.buf[o + i] = this.cur[c] * amt;
        smooth.buf[o + i] = (this.prev[c] + (this.cur[c] - this.prev[c]) * s) * amt;
        trig.buf[o + i] = this.trig[c] > 0 ? 10 : 0;
        if (this.trig[c] > 0) this.trig[c]--;
      }
    }
  }
}

// ================================================================== sequencing

class TuringMod extends Mod {
  private reg = Math.floor(Math.random() * 0xffff);
  private edges = new Edges();

  process(n: number): void {
    this.setCh(1);
    const { clk } = this.ins;
    const { cv, gate } = this.outs;
    const len = clamp(Math.round(this.p.length), 2, 16);
    const co = clk.off(0);
    for (let i = 0; i < n; i++) {
      const k = clk.buf[co + i];
      if (this.edges.rose(0, k)) {
        // the bit leaving the loop comes back in, sometimes flipped
        let bit = (this.reg >> (len - 1)) & 1;
        if (Math.random() < this.p.change) bit ^= 1;
        this.reg = ((this.reg << 1) | bit) & 0xffff;
      }
      cv.buf[i] = ((this.reg & 0xff) / 255) * this.p.range;
      gate.buf[i] = this.reg & 1 && k >= HIGH ? 10 : 0;
    }
  }

  /** the eight bits that make the voltage */
  override display(): number {
    return this.reg & 0xff;
  }
}

/** Euclidean pattern: `fills` hits spread over `steps`, turned by `rotate`. */
export function euclid(steps: number, fills: number, rotate: number): boolean[] {
  const s = clamp(Math.round(steps), 1, 16);
  const f = clamp(Math.round(fills), 0, s);
  const r = ((Math.round(rotate) % s) + s) % s;
  const hits = Array.from({ length: s }, (_, i) => (i * f) % s < f);
  return hits.map((_, i) => hits[(i - r + s) % s]);
}

class EuclidMod extends Mod {
  private step = -1;
  private clkEdge = new Edges();
  private resetEdge = new Edges();
  private key = '';
  private pattern: boolean[] = [];

  process(n: number): void {
    this.setCh(1);
    const { clk, reset } = this.ins;
    const { gate, off } = this.outs;
    const key = `${this.p.steps},${this.p.fills},${this.p.rotate}`;
    if (key !== this.key) {
      this.key = key;
      this.pattern = euclid(this.p.steps, this.p.fills, this.p.rotate);
    }
    const L = this.pattern.length;
    for (let i = 0; i < n; i++) {
      const k = clk.buf[clk.off(0) + i];
      if (this.resetEdge.rose(0, reset.buf[reset.off(0) + i])) this.step = -1;
      if (this.clkEdge.rose(0, k)) this.step = (this.step + 1) % L;
      const hit = this.step >= 0 && this.pattern[this.step % L];
      const high = this.step >= 0 && k >= HIGH;
      gate.buf[i] = high && hit ? 10 : 0;
      off.buf[i] = high && !hit ? 10 : 0;
    }
  }

  override display(): number {
    return this.step;
  }
}

const DIVS = [2, 3, 4, 6, 8];

class DivMod extends Mod {
  private count = 0;
  private since = 0;
  private period = 0;
  private clkEdge = new Edges();
  private resetEdge = new Edges();

  process(n: number): void {
    this.setCh(1);
    const { clk, reset } = this.ins;
    const o = this.outs;
    const outs = [o.d2, o.d3, o.d4, o.d6, o.d8];
    for (let i = 0; i < n; i++) {
      const k = clk.buf[clk.off(0) + i];
      if (this.resetEdge.rose(0, reset.buf[reset.off(0) + i])) this.count = 0;
      if (this.clkEdge.rose(0, k)) {
        this.count++;
        if (this.since > 0) this.period = this.since;
        this.since = 0;
      }
      this.since++;
      const high = k >= HIGH && this.count > 0;
      for (let d = 0; d < DIVS.length; d++) outs[d].buf[i] = high && (this.count - 1) % DIVS[d] === 0 ? 10 : 0;
      // double time: a second pulse half-way through each measured period
      const ph = this.period ? this.since / this.period : 1;
      o.x2.buf[i] = this.count > 0 && (ph < 0.25 || (ph >= 0.5 && ph < 0.75)) ? 10 : 0;
    }
  }
}

class CoinMod extends Mod {
  private toB = new Uint8Array(MAX_CH);
  private edges = new Edges();

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: g, prob } = this.ins;
    const { a, b } = this.outs;
    for (let c = 0; c < ch; c++) {
      const go = g.off(c), po = prob.off(c), o = c * BLOCK;
      for (let i = 0; i < n; i++) {
        const v = g.buf[go + i];
        if (this.edges.rose(c, v)) this.toB[c] = Math.random() < this.p.prob + prob.buf[po + i] * 0.1 ? 1 : 0;
        const high = v >= HIGH ? 10 : 0;
        a.buf[o + i] = this.toB[c] ? 0 : high;
        b.buf[o + i] = this.toB[c] ? high : 0;
      }
    }
  }
}

class SwitchMod extends Mod {
  private step = 0;
  private clkEdge = new Edges();
  private resetEdge = new Edges();

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { clk, reset, in1, in2, in3, in4 } = this.ins;
    const ins = [in1, in2, in3, in4];
    const out = this.outs.out.buf;
    const steps = clamp(Math.round(this.p.steps), 2, 4);
    const sel = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (this.resetEdge.rose(0, reset.buf[reset.off(0) + i])) this.step = 0;
      if (this.clkEdge.rose(0, clk.buf[clk.off(0) + i])) this.step = (this.step + 1) % steps;
      sel[i] = this.step % steps;
    }
    for (let c = 0; c < ch; c++) {
      const o = c * BLOCK;
      for (let i = 0; i < n; i++) {
        const inp = ins[sel[i]];
        out[o + i] = inp.buf[inp.off(c) + i];
      }
    }
  }

  override display(): number {
    return this.step;
  }
}

class ArpMod extends Mod {
  private index = 0;
  private dir = 1;
  private phase = 1;
  private since = 0;
  private period = 0;
  private gateLeft = 0;
  private note = 0;
  private clkEdge = new Edges();

  process(n: number): void {
    this.setCh(1);
    const { voct, gate, clk } = this.ins;
    const out = this.outs;
    const mode = Math.round(this.p.mode);
    const octs = clamp(Math.round(this.p.oct), 1, 4);
    for (let i = 0; i < n; i++) {
      let tick = false;
      if (clk.on) {
        if (this.clkEdge.rose(0, clk.buf[clk.off(0) + i])) {
          tick = true;
          if (this.since > 0) this.period = this.since;
          this.since = 0;
        }
        this.since++;
      } else {
        this.phase += this.p.rate / this.sr;
        if (this.phase >= 1) {
          this.phase -= 1;
          tick = true;
          this.period = this.sr / this.p.rate;
        }
      }
      if (tick) {
        // the notes held right now, low to high, over the octaves
        const held: number[] = [];
        const chs = gate.src ? gate.src.ch : 1;
        for (let c = 0; c < chs; c++) if (gate.buf[gate.off(c) + i] >= HIGH) held.push(voct.buf[voct.off(c) + i]);
        held.sort((a, b) => a - b);
        const seq: number[] = [];
        for (let o = 0; o < octs; o++) for (const v of held) seq.push(v + o);
        if (!seq.length) {
          this.index = 0;
          this.dir = 1;
          this.gateLeft = 0;
        } else {
          const L = seq.length;
          let k: number;
          if (mode === 3) k = Math.floor(Math.random() * L);
          else if (mode === 2 && L > 1) {
            // up-down without repeating the turning notes
            const cycle = 2 * L - 2;
            const p = this.index % cycle;
            k = p < L ? p : cycle - p;
            this.index++;
          } else {
            k = this.index % L;
            if (mode === 1) k = L - 1 - k;
            this.index++;
          }
          this.note = seq[k];
          this.gateLeft = Math.max(1, Math.round((this.period || this.sr / 6) * this.p.len));
        }
      }
      out.voct.buf[i] = this.note;
      out.gate.buf[i] = this.gateLeft > 0 ? 10 : 0;
      if (this.gateLeft > 0) this.gateLeft--;
    }
  }
}

class ChordMod extends Mod {
  private root = -1;
  private tones: number[] = [0, 4, 7];
  private key = '';

  process(n: number): void {
    const { voct, type, inv } = this.ins;
    const { voct: out, bass } = this.outs;
    // the chord is chosen once per block, from the input at its start
    const note = Math.round(voct.buf[voct.off(0)] * 12);
    const t = this.p.type + Math.round(type.buf[type.off(0)] * 2);
    const k = this.p.inv + Math.round(inv.buf[inv.off(0)]);
    const key = `${note},${t},${k},${this.p.key},${this.p.voicing}`;
    if (key !== this.key) {
      this.key = key;
      const chord = buildChord(note, t, Math.round(this.p.key), k, Math.round(this.p.voicing));
      this.tones = chord.tones;
      this.root = chord.root;
    }
    const tones = this.tones;
    this.ch = tones.length;
    out.ch = tones.length;
    bass.ch = 1;
    // inside a block the input may glide: keep the chord's shape, follow the fine pitch
    for (let c = 0; c < tones.length; c++) {
      const o = c * BLOCK;
      for (let i = 0; i < n; i++) out.buf[o + i] = (tones[c] - note) / 12 + voct.buf[voct.off(0) + i];
    }
    for (let i = 0; i < n; i++) bass.buf[i] = (this.root - note) / 12 + voct.buf[voct.off(0) + i] - 1;
  }

  /** MIDI note of the chord's root, for the panel to name it */
  override display(): number {
    return this.root + 60;
  }
}

// ===================================================================== filters

class LpgMod extends Mod {
  private vac = new Float64Array(MAX_CH);
  private strike = new Float64Array(MAX_CH);
  private s1 = new Float64Array(MAX_CH);
  private s2 = new Float64Array(MAX_CH);
  private edges = new Edges();

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: src, cv, ping } = this.ins;
    const out = this.outs.out.buf;
    const sr = this.sr;
    const mode = Math.round(this.p.mode);
    // a ping lights the lamp hard for ~10 ms: the cell opens almost fully, then fades over Decay
    const att = 1 - Math.exp(-1 / (0.0012 * sr));
    const rel = 1 - Math.exp(-1 / (this.p.decay * 0.25 * sr));
    const strikeFall = Math.exp(-1 / (0.012 * sr));
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), co = cv.off(c), po = ping.off(c), o = c * BLOCK;
      let vac = this.vac[c], st = this.strike[c], s1 = this.s1[c], s2 = this.s2[c];
      for (let i = 0; i < n; i++) {
        if (this.edges.rose(c, ping.buf[po + i])) st = 1;
        const target = Math.max(clamp(this.p.level + cv.buf[co + i] * 0.1, 0, 1), st);
        st *= strikeFall;
        // a vactrol: quick to light up, slow to go dark
        vac += (target - vac) * (target > vac ? att : rel);
        const x = src.buf[io + i];
        let y = x;
        if (mode !== 2) {
          const g = onePole(20 * Math.pow(2, vac * 10), sr);
          s1 += (x - s1) * g;
          s2 += (s1 - s2) * g;
          y = s2;
        }
        if (mode !== 1) y *= vac * Math.sqrt(vac);
        out[o + i] = y;
      }
      this.vac[c] = vac;
      this.strike[c] = st;
      this.s1[c] = s1 + 1e-18;
      this.s2[c] = s2 + 1e-18;
    }
  }
}

class CombMod extends Mod {
  private lines: Float32Array[] = [];
  private w = 0;

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    for (let c = 0; c < MAX_CH; c++) this.lines.push(new Float32Array(Math.ceil(sr / 18) + 4));
  }

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: src, voct } = this.ins;
    const out = this.outs.out.buf;
    const fb = this.p.fb;
    const mix = this.p.mix;
    let w = this.w;
    for (let c = 0; c < ch; c++) {
      const line = this.lines[c];
      const L = line.length;
      const io = src.off(c), vo = voct.off(c), o = c * BLOCK;
      w = this.w;
      for (let i = 0; i < n; i++) {
        const f = clamp(this.p.freq * Math.pow(2, voct.buf[vo + i]), 20, this.sr * 0.25);
        const y = readDelay(line, w, Math.min(L - 2, this.sr / f));
        const x = src.buf[io + i];
        line[w] = 5 * ftanh((x + fb * y) * 0.2);
        w = (w + 1) % L;
        out[o + i] = x * (1 - mix) + y * mix;
      }
    }
    this.w = w;
  }
}

// formants for a low voice: frequencies (Hz) and levels for A E I O U
const FORMANTS: [number, number, number][][] = [
  [[600, 1, 60], [1040, 0.45, 70], [2250, 0.35, 110]],
  [[400, 1, 40], [1620, 0.25, 80], [2400, 0.35, 100]],
  [[250, 1, 60], [1750, 0.03, 90], [2600, 0.16, 100]],
  [[400, 1, 40], [750, 0.28, 80], [2400, 0.09, 100]],
  [[350, 1, 40], [600, 0.1, 80], [2400, 0.03, 100]],
];

class VowelMod extends Mod {
  private st = new Float64Array(MAX_CH * 6);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: src, cv } = this.ins;
    const out = this.outs.out.buf;
    const sr = this.sr;
    const shift = Math.pow(2, this.p.shift);
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), co = cv.off(c), o = c * BLOCK, b = c * 6;
      // filter settings once per block, from the vowel at its start
      const pos = clamp(this.p.vowel + cv.buf[co] * this.p.cv * 0.4, 0, 4);
      const v0 = Math.floor(pos);
      const v1 = Math.min(4, v0 + 1);
      const fr = pos - v0;
      const g: number[] = [], k: number[] = [], amp: number[] = [];
      for (let f = 0; f < 3; f++) {
        const [fa, aa, ba] = FORMANTS[v0][f];
        const [fb, ab, bb] = FORMANTS[v1][f];
        const hz = clamp((fa + (fb - fa) * fr) * shift, 60, sr * 0.4);
        const bw = (ba + (bb - ba) * fr) * (8 / this.p.res);
        g.push(Math.tan((Math.PI * hz) / sr));
        k.push(clamp(bw / hz, 0.01, 2));
        amp.push(aa + (ab - aa) * fr);
      }
      for (let i = 0; i < n; i++) {
        const x = src.buf[io + i] * 0.2;
        let y = 0;
        for (let f = 0; f < 3; f++) {
          // state-variable band-pass
          let ic1 = this.st[b + f * 2], ic2 = this.st[b + f * 2 + 1];
          const a1 = 1 / (1 + g[f] * (g[f] + k[f]));
          const a2 = g[f] * a1;
          const v3 = x - ic2;
          const v1 = a1 * ic1 + a2 * v3;
          const v2 = ic2 + g[f] * v1;
          ic1 = 2 * v1 - ic1;
          ic2 = 2 * v2 - ic2;
          this.st[b + f * 2] = ic1;
          this.st[b + f * 2 + 1] = ic2;
          y += v1 * k[f] * amp[f];
        }
        out[o + i] = 5 * ftanh(y * 3);
      }
      for (let j = 0; j < 6; j++) if (!Number.isFinite(this.st[b + j])) this.st[b + j] = 0;
    }
  }
}

class RingMod extends Mod {
  private phase = 0;

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { a, b } = this.ins;
    const out = this.outs.out.buf;
    const mix = this.p.mix;
    // without a carrier patched, an internal sine
    const car = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      car[i] = Math.sin(TAU * this.phase);
      this.phase = (this.phase + this.p.freq / this.sr) % 1;
    }
    for (let c = 0; c < ch; c++) {
      const ao = a.off(c), bo = b.off(c), o = c * BLOCK;
      for (let i = 0; i < n; i++) {
        const x = a.buf[ao + i];
        const ring = b.on ? (x * b.buf[bo + i]) / 5 : x * car[i];
        out[o + i] = x * (1 - mix) + ring * mix;
      }
    }
  }
}

// ===================================================================== effects

class DriveMod extends Mod {
  private lp = new Float64Array(MAX_CH);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: src, cv } = this.ins;
    const out = this.outs.out.buf;
    const shape = Math.round(this.p.shape);
    const k = onePole(this.p.tone, this.sr);
    const mix = this.p.mix;
    const bias = ftanh(0.3);
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), co = cv.off(c), o = c * BLOCK;
      let lp = this.lp[c];
      for (let i = 0; i < n; i++) {
        const x = src.buf[io + i];
        const d = this.p.drive * Math.pow(2, cv.buf[co + i] * 0.3);
        const u = x * 0.2 * d;
        const y = shape === 1 ? clamp(u, -1, 1) : shape === 2 ? (ftanh(u + 0.3) - bias) * 1.1 : ftanh(u);
        lp += (y - lp) * k;
        out[o + i] = x * (1 - mix) + 5 * lp * mix;
      }
      this.lp[c] = lp + 1e-18;
    }
  }
}

class CrushMod extends Mod {
  private held = new Float64Array(MAX_CH);
  private phase = new Float64Array(MAX_CH);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const src = this.ins.in;
    const out = this.outs.out.buf;
    const steps = Math.pow(2, clamp(Math.round(this.p.bits), 1, 16) - 1);
    const inc = this.p.rate / this.sr;
    const mix = this.p.mix;
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), o = c * BLOCK;
      for (let i = 0; i < n; i++) {
        const x = src.buf[io + i];
        this.phase[c] += inc;
        if (this.phase[c] >= 1) {
          this.phase[c] -= Math.floor(this.phase[c]);
          this.held[c] = (Math.round(clamp(x * 0.2, -1, 1) * steps) / steps) * 5;
        }
        out[o + i] = x * (1 - mix) + this.held[c] * mix;
      }
    }
  }
}

// Freeverb tunings (samples at 44.1 kHz)
const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASSES = [556, 441, 341, 225];
const SPREAD = 23;

class VerbMod extends Mod {
  private combs: { buf: Float32Array; i: number; store: number }[][] = [];
  private aps: { buf: Float32Array; i: number }[][] = [];

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    const s = sr / 44100;
    for (let side = 0; side < 2; side++) {
      this.combs.push(COMBS.map((l) => ({ buf: new Float32Array(Math.round((l + side * SPREAD) * s)), i: 0, store: 0 })));
      this.aps.push(ALLPASSES.map((l) => ({ buf: new Float32Array(Math.round((l + side * SPREAD) * s)), i: 0 })));
    }
  }

  process(n: number): void {
    this.setCh(1);
    const src = this.ins.in;
    const { l, r } = this.outs;
    const fb = 0.7 + this.p.size * 0.28;
    const damp = this.p.damp * 0.4;
    const mix = this.p.mix;
    for (let i = 0; i < n; i++) {
      const x = this.sum(src, i);
      const input = x * 0.2 * 0.015;
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
        (side ? r : l).buf[i] = x * (1 - mix) + acc * 3 * 5 * mix;
      }
    }
  }
}

class ChorusMod extends Mod {
  private line: Float32Array;
  private w = 0;
  private phase = 0;

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    this.line = new Float32Array(Math.ceil(sr * 0.06));
  }

  process(n: number): void {
    this.setCh(1);
    const src = this.ins.in;
    const { l, r } = this.outs;
    const sr = this.sr;
    const base = 0.012 * sr;
    const depth = this.p.depth * 0.007 * sr;
    const mix = this.p.mix;
    const fb = this.p.fb;
    // with feedback it is a flanger: shorter delays
    const centre = fb > 0.05 ? base * 0.3 : base;
    for (let i = 0; i < n; i++) {
      const x = this.sum(src, i);
      this.phase = (this.phase + this.p.rate / sr) % 1;
      const dl = centre + depth * (0.5 + 0.5 * Math.sin(TAU * this.phase));
      const dr = centre + depth * (0.5 + 0.5 * Math.sin(TAU * (this.phase + 0.25)));
      const yl = readDelay(this.line, this.w, dl);
      const yr = readDelay(this.line, this.w, dr);
      this.line[this.w] = 5 * ftanh((x + yl * fb) * 0.2);
      this.w = (this.w + 1) % this.line.length;
      l.buf[i] = x * (1 - mix * 0.5) + yl * mix;
      r.buf[i] = x * (1 - mix * 0.5) + yr * mix;
    }
  }
}

class PhaserMod extends Mod {
  private st = new Float64Array(6);
  private phase = 0;
  private last = 0;

  process(n: number): void {
    this.setCh(1);
    const src = this.ins.in;
    const out = this.outs.out.buf;
    const sr = this.sr;
    // the sweep moves slowly: one all-pass coefficient per block
    this.phase = (this.phase + (this.p.rate * n) / sr) % 1;
    const lfo = 0.5 + 0.5 * Math.sin(TAU * this.phase);
    const f = 200 * Math.pow(20, lfo * this.p.depth);
    const t = Math.tan((Math.PI * Math.min(f, sr * 0.4)) / sr);
    const a = (t - 1) / (t + 1);
    const fb = this.p.fb;
    const mix = this.p.mix;
    for (let i = 0; i < n; i++) {
      const x = this.sum(src, i) * 0.2;
      let y = x + this.last * fb;
      for (let k = 0; k < 6; k++) {
        const z = a * y + this.st[k];
        this.st[k] = y - a * z;
        y = z;
      }
      this.last = ftanh(y);
      out[i] = 5 * (x * (1 - mix) + y * mix);
    }
    for (let k = 0; k < 6; k++) if (!Number.isFinite(this.st[k])) this.st[k] = 0;
    if (!Number.isFinite(this.last)) this.last = 0;
  }
}

// =================================================================== utilities

class LogicMod extends Mod {
  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { a, b } = this.ins;
    const o = this.outs;
    for (let c = 0; c < ch; c++) {
      const ao = a.off(c), bo = b.off(c), off = c * BLOCK;
      for (let i = 0; i < n; i++) {
        const x = a.buf[ao + i] >= HIGH;
        const y = b.buf[bo + i] >= HIGH;
        o.and.buf[off + i] = x && y ? 10 : 0;
        o.or.buf[off + i] = x || y ? 10 : 0;
        o.xor.buf[off + i] = x !== y ? 10 : 0;
        o.nota.buf[off + i] = x ? 0 : 10;
      }
    }
  }
}

class XfadeMod extends Mod {
  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { a, b, cv } = this.ins;
    const out = this.outs.out.buf;
    for (let c = 0; c < ch; c++) {
      const ao = a.off(c), bo = b.off(c), co = cv.off(c), o = c * BLOCK;
      for (let i = 0; i < n; i++) {
        const f = clamp(this.p.fade + cv.buf[co + i] * 0.1, 0, 1);
        out[o + i] = a.buf[ao + i] * (1 - f) + b.buf[bo + i] * f;
      }
    }
  }
}

class PanMod extends Mod {
  process(n: number): void {
    const src = this.ins.in;
    const cv = this.ins.cv;
    const { l, r } = this.outs;
    const ch = src.src ? src.src.ch : 1;
    this.ch = ch;
    l.ch = r.ch = 1;
    for (let i = 0; i < n; i++) l.buf[i] = r.buf[i] = 0;
    for (let c = 0; c < ch; c++) {
      // spread fans the voices out from the pan position
      const fan = ch > 1 ? ((c / (ch - 1)) * 2 - 1) * this.p.spread : 0;
      const io = src.off(c), co = cv.off(c);
      for (let i = 0; i < n; i++) {
        const p = clamp(this.p.pan + fan + cv.buf[co + i] * 0.2, -1, 1);
        const x = src.buf[io + i];
        const a = ((p + 1) * Math.PI) / 4;
        l.buf[i] += x * Math.cos(a) * Math.SQRT2;
        r.buf[i] += x * Math.sin(a) * Math.SQRT2;
      }
    }
  }
}

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

  override scope(): { a: number[]; b: number[] | null } {
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
        pts.push(Math.round(buf[idx] * this.p.scale * 100) / 100);
      }
      return pts;
    };
    return { a: this.ins.a.on ? pick(this.a) : [], b: this.ins.b.on ? pick(this.b) : null };
  }
}

export const MORE_CLASSES: Partial<Record<ModuleType, new (id: string, type: ModuleType, sr: number) => Mod>> = {
  wt: WtMod, fmop: FmOpMod, string: StringMod, kick: KickMod, snare: SnareMod, hats: HatsMod,
  func: FuncMod, rand: RandMod, turing: TuringMod, euclid: EuclidMod, div: DivMod, coin: CoinMod, switch: SwitchMod, arp: ArpMod, chord: ChordMod,
  lpg: LpgMod, comb: CombMod, vowel: VowelMod, ring: RingMod, drive: DriveMod, crush: CrushMod,
  verb: VerbMod, chorus: ChorusMod, phaser: PhaserMod, logic: LogicMod, xfade: XfadeMod, pan: PanMod, scope: ScopeMod,
};
