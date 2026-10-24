// Modular synth DSP. Modules process blocks of up to BLOCK samples; a cable is
// simply the source module's output buffer, read by whatever is patched to it.
// Every cable carries 1–8 voices (poly cables, as in VCV Rack): the MIDI module
// sets the voice count and everything downstream follows. A mono cable feeds
// every voice. Feedback loops work, delayed by one block.

import { BLOCK, C4, HIGH, Input, MAX_CH, Mod, Port, TAU, blep, ftanh } from './base';
import { MORE_CLASSES } from './more';
import { QUANT_SCALES, VOICE_COUNTS, type ModuleType } from './modules';
import type { RackPatch } from './patch';

export { BLOCK, MAX_CH, Mod, ftanh };

// ------------------------------------------------------------------ MIDI → CV

export class MidiMod extends Mod {
  private notes = new Int16Array(MAX_CH).fill(-1);
  private gates = new Uint8Array(MAX_CH);
  private held = new Uint8Array(MAX_CH); // released while the pedal is down
  private gap = new Uint8Array(MAX_CH); // gate held low one block so envelopes restart
  private vel = new Float32Array(MAX_CH);
  private pitch = new Float64Array(MAX_CH);
  private target = new Float64Array(MAX_CH);
  private trig = new Int32Array(MAX_CH);
  private age = new Float64Array(MAX_CH);
  private clock = 0;
  private stack: number[] = [];
  private lastVoices = -1;
  bend = 0;
  wheel = 0;
  pressure = 0;
  sustain = false;

  get voices(): number {
    return VOICE_COUNTS[Math.round(this.p.voices)] ?? 1;
  }

  /** A new voice count starts from silence (notes may arrive before the first block). */
  private syncVoices(): number {
    const V = this.voices;
    if (V !== this.lastVoices) {
      if (this.lastVoices >= 0) this.allOff();
      this.lastVoices = V;
    }
    return V;
  }

  private start(v: number, note: number, vel: number, gap: boolean): void {
    if (this.notes[v] < 0) this.pitch[v] = (note - 60) / 12;
    this.notes[v] = note;
    this.target[v] = (note - 60) / 12;
    this.gates[v] = 1;
    this.held[v] = 0;
    this.gap[v] = gap ? 1 : 0;
    this.vel[v] = vel;
    this.trig[v] = Math.round(this.sr * 0.002);
    this.age[v] = ++this.clock;
  }

  noteOn(note: number, velocity: number): void {
    const vel = velocity / 127;
    const V = this.syncVoices();
    if (V === 1) {
      // mono, last note wins; overlapping notes slide (legato) without restarting envelopes
      this.stack = this.stack.filter((x) => x !== note);
      this.stack.push(note);
      this.start(0, note, vel, false);
      return;
    }
    let v = -1;
    for (let i = 0; i < V; i++) if (this.notes[i] === note) v = i;
    if (v < 0) {
      let best = Infinity;
      for (let i = 0; i < V; i++) if (!this.gates[i] && this.age[i] < best) (best = this.age[i]), (v = i);
    }
    if (v < 0) {
      let best = Infinity;
      for (let i = 0; i < V; i++) if (this.age[i] < best) (best = this.age[i]), (v = i);
    }
    this.start(v, note, vel, this.gates[v] === 1);
  }

  noteOff(note: number): void {
    if (this.syncVoices() === 1) {
      this.stack = this.stack.filter((x) => x !== note);
      if (this.notes[0] !== note) return;
      const prev = this.stack[this.stack.length - 1];
      if (prev !== undefined) {
        this.notes[0] = prev;
        this.target[0] = (prev - 60) / 12;
        return;
      }
      this.release(0);
      return;
    }
    for (let i = 0; i < this.voices; i++) if (this.notes[i] === note && this.gates[i]) this.release(i);
  }

  private release(v: number): void {
    if (this.sustain) this.held[v] = 1;
    else this.gates[v] = 0;
  }

  setSustain(on: boolean): void {
    this.sustain = on;
    if (on) return;
    for (let v = 0; v < MAX_CH; v++) {
      if (this.held[v]) {
        this.held[v] = 0;
        this.gates[v] = 0;
      }
    }
  }

  allOff(): void {
    this.gates.fill(0);
    this.held.fill(0);
    this.stack = [];
  }

  process(n: number): void {
    const V = this.syncVoices();
    this.setCh(V);
    const glide = this.p.glide;
    const k = glide > 0.001 ? 1 - Math.exp(-1 / (glide * 0.4 * this.sr)) : 1;
    const bendV = (this.bend * this.p.bend) / 12;
    const { voct, gate, vel, trig, mod, at } = this.outs;
    const w = this.wheel * 10;
    const a = this.pressure * 10;
    for (let c = 0; c < V; c++) {
      const o = c * BLOCK;
      let p = this.pitch[c];
      const t = this.target[c];
      const g = this.gap[c] ? 0 : this.gates[c] * 10;
      this.gap[c] = 0;
      const vv = this.vel[c] * 10;
      let tr = this.trig[c];
      for (let i = 0; i < n; i++) {
        p += (t - p) * k;
        voct.buf[o + i] = p + bendV;
        gate.buf[o + i] = g;
        vel.buf[o + i] = vv;
        trig.buf[o + i] = tr > 0 ? 10 : 0;
        if (tr > 0) tr--;
        mod.buf[o + i] = w;
        at.buf[o + i] = a;
      }
      this.pitch[c] = p;
      this.trig[c] = tr;
    }
  }
}

// ---------------------------------------------------------------- oscillators

class VcoMod extends Mod {
  private phase = new Float64Array(MAX_CH);
  private lastSync = new Float32Array(MAX_CH);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { voct, fm, pwm, sync } = this.ins;
    const { sin, tri, saw, sqr } = this.outs;
    const base = Math.round(this.p.oct) + this.p.tune / 12;
    const fmAmt = this.p.fm;
    const pwmAmt = this.p.pwm * 0.09;
    const nyq = this.sr * 0.45;
    const inv = 1 / this.sr;
    const vb = voct.buf, fb = fm.buf, pb = pwm.buf, sb = sync.buf;
    const synced = sync.on;
    for (let c = 0; c < ch; c++) {
      const vo = voct.off(c), fo = fm.off(c), po = pwm.off(c), so = sync.off(c), o = c * BLOCK;
      let ph = this.phase[c];
      let last = this.lastSync[c];
      for (let i = 0; i < n; i++) {
        let f = C4 * Math.pow(2, base + vb[vo + i] + fb[fo + i] * fmAmt);
        if (f > nyq) f = nyq;
        else if (f < 0.01) f = 0.01;
        const dt = f * inv;
        if (synced) {
          const s = sb[so + i];
          if (s >= HIGH && last < HIGH) ph = 0;
          last = s;
        }
        if (sin.used) sin.buf[o + i] = 5 * Math.sin(TAU * ph);
        if (tri.used) tri.buf[o + i] = 5 * (1 - 4 * Math.abs(ph - 0.5));
        if (saw.used) saw.buf[o + i] = 5 * (2 * ph - 1 - blep(ph, dt));
        if (sqr.used) {
          let pw = this.p.pw + pb[po + i] * pwmAmt;
          pw = pw < 0.03 ? 0.03 : pw > 0.97 ? 0.97 : pw;
          let t2 = ph - pw;
          if (t2 < 0) t2 += 1;
          sqr.buf[o + i] = 5 * ((ph < pw ? 1 : -1) + blep(ph, dt) - blep(t2, dt));
        }
        ph += dt;
        if (ph >= 1) ph -= 1;
      }
      this.phase[c] = ph;
      this.lastSync[c] = last;
    }
  }
}

class LfoMod extends Mod {
  private phase = new Float64Array(MAX_CH);
  private lastReset = new Float32Array(MAX_CH);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { rate, reset } = this.ins;
    const { sin, tri, saw, sqr } = this.outs;
    const inv = 1 / this.sr;
    for (let c = 0; c < ch; c++) {
      const ro = rate.off(c), so = reset.off(c), o = c * BLOCK;
      let ph = this.phase[c];
      let last = this.lastReset[c];
      for (let i = 0; i < n; i++) {
        const r = reset.buf[so + i];
        if (r >= HIGH && last < HIGH) ph = 0;
        last = r;
        sin.buf[o + i] = 5 * Math.sin(TAU * ph);
        tri.buf[o + i] = 5 * (1 - 4 * Math.abs(ph - 0.5));
        saw.buf[o + i] = 5 * (2 * ph - 1);
        sqr.buf[o + i] = ph < 0.5 ? 5 : -5;
        ph += this.p.rate * (rate.on ? Math.pow(2, rate.buf[ro + i]) : 1) * inv;
        if (ph >= 1) ph -= Math.floor(ph);
      }
      this.phase[c] = ph;
      this.lastReset[c] = last;
    }
  }
}

class NoiseMod extends Mod {
  private b = new Float64Array(MAX_CH * 3);
  private held = new Float32Array(MAX_CH);
  private lastClk = new Float32Array(MAX_CH);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { clk, in: src } = this.ins;
    const { white, pink, sh } = this.outs;
    const lv = this.p.level * 5;
    for (let c = 0; c < ch; c++) {
      const co = clk.off(c), io = src.off(c), o = c * BLOCK, b = c * 3;
      let b0 = this.b[b], b1 = this.b[b + 1], b2 = this.b[b + 2];
      let held = this.held[c];
      let last = this.lastClk[c];
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        white.buf[o + i] = w * lv;
        // Paul Kellet's economy pink filter
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        pink.buf[o + i] = (b0 + b1 + b2 + w * 0.1848) * 0.22 * lv;
        const k = clk.buf[co + i];
        if (k >= HIGH && last < HIGH) held = src.on ? src.buf[io + i] : w * 5;
        last = k;
        sh.buf[o + i] = held;
      }
      this.b[b] = b0;
      this.b[b + 1] = b1;
      this.b[b + 2] = b2;
      this.held[c] = held;
      this.lastClk[c] = last;
    }
  }
}

// ----------------------------------------------------------------- modulation

class AdsrMod extends Mod {
  private stage = new Uint8Array(MAX_CH); // 0 idle, 1 attack, 2 decay/sustain, 3 release
  private level = new Float64Array(MAX_CH);
  private lastGate = new Float32Array(MAX_CH);
  private lastRetrig = new Float32Array(MAX_CH);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { gate, retrig } = this.ins;
    const env = this.outs.env.buf;
    const sr = this.sr;
    // attack heads for 1.3 and stops at 1 (an RC curve, like analogue envelopes); decay and release fall ~99% in their time
    const ka = 1 - Math.exp(-1.466 / (this.p.a * sr));
    const kd = 1 - Math.exp(-4.6 / (this.p.d * sr));
    const kr = 1 - Math.exp(-4.6 / (this.p.r * sr));
    const sus = this.p.s;
    for (let c = 0; c < ch; c++) {
      const go = gate.off(c), ro = retrig.off(c), o = c * BLOCK;
      let st = this.stage[c];
      let lv = this.level[c];
      let lg = this.lastGate[c];
      let lr = this.lastRetrig[c];
      for (let i = 0; i < n; i++) {
        const g = gate.buf[go + i];
        const r = retrig.buf[ro + i];
        if ((g >= HIGH && lg < HIGH) || (g >= HIGH && r >= HIGH && lr < HIGH)) st = 1;
        else if (g < HIGH && lg >= HIGH) st = 3;
        lg = g;
        lr = r;
        if (st === 1) {
          lv += (1.3 - lv) * ka;
          if (lv >= 1) {
            lv = 1;
            st = 2;
          }
        } else if (st === 2) lv += (sus - lv) * kd;
        else if (st === 3) {
          lv -= lv * kr;
          if (lv < 1e-5) {
            lv = 0;
            st = 0;
          }
        }
        env[o + i] = lv * 10;
      }
      this.stage[c] = st;
      this.level[c] = lv;
      this.lastGate[c] = lg;
      this.lastRetrig[c] = lr;
    }
  }
}

class ClockMod extends Mod {
  private beat = 0;
  private wasRunning = 0;

  process(n: number): void {
    this.setCh(1);
    const run = this.p.run >= 0.5;
    if (run && !this.wasRunning) this.beat = 0;
    this.wasRunning = run ? 1 : 0;
    const { q, e, s, bar } = this.outs;
    const step = this.p.bpm / 60 / this.sr;
    let b = this.beat;
    for (let i = 0; i < n; i++) {
      if (!run) {
        q.buf[i] = e.buf[i] = s.buf[i] = bar.buf[i] = 0;
        continue;
      }
      q.buf[i] = b % 1 < 0.5 ? 10 : 0;
      e.buf[i] = (b * 2) % 1 < 0.5 ? 10 : 0;
      s.buf[i] = (b * 4) % 1 < 0.5 ? 10 : 0;
      bar.buf[i] = b % 4 < 0.5 ? 10 : 0;
      b += step;
    }
    this.beat = b % 64;
  }

  override display(): number {
    return this.p.run >= 0.5 ? Math.floor(this.beat) % 4 : -1;
  }
}

class SeqMod extends Mod {
  private step = -1;
  private lastClk = 0;
  private lastReset = 0;

  process(n: number): void {
    this.setCh(1);
    const { clk, reset } = this.ins;
    const { voct, gate } = this.outs;
    const len = Math.max(1, Math.min(8, Math.round(this.p.len)));
    const p = this.p;
    const pitch = [p.s0, p.s1, p.s2, p.s3, p.s4, p.s5, p.s6, p.s7];
    const on = [p.g0, p.g1, p.g2, p.g3, p.g4, p.g5, p.g6, p.g7];
    const co = clk.off(0), ro = reset.off(0);
    for (let i = 0; i < n; i++) {
      const k = clk.buf[co + i];
      const r = reset.buf[ro + i];
      if (r >= HIGH && this.lastReset < HIGH) this.step = -1;
      if (k >= HIGH && this.lastClk < HIGH) this.step = (this.step + 1) % len;
      this.lastClk = k;
      this.lastReset = r;
      const s = this.step < 0 ? 0 : this.step % len;
      voct.buf[i] = Math.round(pitch[s]) / 12;
      gate.buf[i] = this.step >= 0 && k >= HIGH && on[s] >= 0.5 ? 10 : 0;
    }
  }

  override display(): number {
    return this.step;
  }
}

// -------------------------------------------------------------------- filters

class VcfMod extends Mod {
  private s1 = new Float64Array(MAX_CH);
  private s2 = new Float64Array(MAX_CH);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: src, cv, voct, res } = this.ins;
    const { lp, bp, hp } = this.outs;
    const sr = this.sr;
    const fMax = sr * 0.45;
    const amt = this.p.cv;
    const moving = cv.on || voct.on;
    const coef = (f: number) => Math.tan((Math.PI * (f < 10 ? 10 : f > fMax ? fMax : f)) / sr);
    const damp = (r: number) => 2 - 1.96 * (r < 0 ? 0 : r > 1 ? 1 : r);
    let g = coef(this.p.cutoff);
    let k = damp(this.p.res);
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), co = cv.off(c), vo = voct.off(c), ro = res.off(c), o = c * BLOCK;
      let ic1 = this.s1[c], ic2 = this.s2[c];
      for (let i = 0; i < n; i++) {
        if (moving) g = coef(this.p.cutoff * Math.pow(2, cv.buf[co + i] * amt + voct.buf[vo + i]));
        if (res.on) k = damp(this.p.res + res.buf[ro + i] * 0.1);
        const a1 = 1 / (1 + g * (g + k));
        const a2 = g * a1;
        const a3 = g * a2;
        const x = src.buf[io + i] * 0.2 + 1e-18; // the offset keeps decaying states out of slow denormals
        const v3 = x - ic2;
        const v1 = a1 * ic1 + a2 * v3;
        const v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2 * v1 - ic1;
        ic2 = 2 * v2 - ic2;
        lp.buf[o + i] = 5 * v2;
        bp.buf[o + i] = 5 * v1;
        hp.buf[o + i] = 5 * (x - k * v1 - v2);
      }
      // a resonant filter fed garbage must not stay broken
      this.s1[c] = Number.isFinite(ic1) ? ic1 : 0;
      this.s2[c] = Number.isFinite(ic2) ? ic2 : 0;
    }
  }
}

class LadderMod extends Mod {
  private s = new Float64Array(MAX_CH * 4);

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: src, cv, voct } = this.ins;
    const out = this.outs.out.buf;
    const sr = this.sr;
    const fMax = sr * 0.3;
    const amt = this.p.cv;
    const res = this.p.res;
    const fbk = res * 4.1;
    const drive = this.p.drive;
    const makeup = 5 * (1 + res * 1.2) / Math.sqrt(drive);
    const moving = cv.on || voct.on;
    const coef = (f: number) => {
      const w = (TAU * (f < 10 ? 10 : f > fMax ? fMax : f)) / sr;
      return w / (1 + w);
    };
    let g = coef(this.p.cutoff);
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), co = cv.off(c), vo = voct.off(c), o = c * BLOCK, b = c * 4;
      let s1 = this.s[b], s2 = this.s[b + 1], s3 = this.s[b + 2], s4 = this.s[b + 3];
      for (let i = 0; i < n; i++) {
        if (moving) g = coef(this.p.cutoff * Math.pow(2, cv.buf[co + i] * amt + voct.buf[vo + i]));
        const u = ftanh(src.buf[io + i] * 0.2 * drive - fbk * s4 + 1e-18);
        const t1 = ftanh(s1), t2 = ftanh(s2), t3 = ftanh(s3);
        s1 += g * (u - t1);
        s2 += g * (t1 - t2);
        s3 += g * (t2 - t3);
        s4 += g * (t3 - ftanh(s4));
        out[o + i] = s4 * makeup;
      }
      const ok = Number.isFinite(s4);
      this.s[b] = ok ? s1 : 0;
      this.s[b + 1] = ok ? s2 : 0;
      this.s[b + 2] = ok ? s3 : 0;
      this.s[b + 3] = ok ? s4 : 0;
    }
  }
}

// --------------------------------------------------------------- amp and mix

class VcaMod extends Mod {
  private lv = 1;

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: src, cv } = this.ins;
    const out = this.outs.out.buf;
    const exp = this.p.resp >= 0.5;
    const from = this.lv;
    const to = this.p.level;
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), co = cv.off(c), o = c * BLOCK;
      for (let i = 0; i < n; i++) {
        let g = 1;
        if (cv.on) {
          g = cv.buf[co + i] * 0.1;
          g = g < 0 ? 0 : g > 1 ? 1 : g;
          if (exp) g = g * g * g;
        }
        out[o + i] = src.buf[io + i] * g * (from + ((to - from) * (i + 1)) / n);
      }
    }
    this.lv = to;
  }
}

class MixMod extends Mod {
  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const ins = this.inList;
    const lv = [this.p.l1, this.p.l2, this.p.l3, this.p.l4];
    const out = this.outs.out.buf;
    for (let c = 0; c < ch; c++) {
      const o = c * BLOCK;
      for (let i = 0; i < n; i++) out[o + i] = 0;
      for (let k = 0; k < 4; k++) {
        const inp = ins[k];
        if (!inp.on || lv[k] === 0) continue;
        const b = inp.buf, io = inp.off(c), l = lv[k];
        for (let i = 0; i < n; i++) out[o + i] += b[io + i] * l;
      }
    }
  }
}

class UtilMod extends Mod {
  process(n: number): void {
    const { in1, in2 } = this.ins;
    const { out1, out2 } = this.outs;
    // each lane runs as many voices as its own input
    const lane = (inp: Input, out: Port, a: number, ofs: number) => {
      const ch = inp.src ? inp.src.ch : 1;
      out.ch = ch;
      for (let c = 0; c < ch; c++) {
        const io = inp.off(c), o = c * BLOCK;
        for (let i = 0; i < n; i++) out.buf[o + i] = (inp.on ? inp.buf[io + i] * a : 0) + ofs;
      }
    };
    lane(in1, out1, this.p.a1, this.p.o1);
    lane(in2, out2, this.p.a2, this.p.o2);
    this.ch = Math.max(out1.ch, out2.ch);
  }
}

class QuantMod extends Mod {
  private mask = new Uint8Array(12);
  private maskFor = -1;
  private last = new Float32Array(MAX_CH).fill(NaN);
  private trig = new Int32Array(MAX_CH);
  private shown = -1;

  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const scale = Math.round(this.p.scale);
    if (scale !== this.maskFor) {
      this.mask.fill(0);
      for (const s of (QUANT_SCALES[scale] ?? QUANT_SCALES[0]).semis) this.mask[s] = 1;
      this.maskFor = scale;
    }
    const root = Math.round(this.p.root);
    const src = this.ins.in;
    const { out, trig } = this.outs;
    const pulse = Math.round(this.sr * 0.002);
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), o = c * BLOCK;
      let tr = this.trig[c];
      let last = this.last[c];
      for (let i = 0; i < n; i++) {
        const semi = src.buf[io + i] * 12;
        const r = Math.round(semi);
        // nearest note of the scale, searching outward from the nearest semitone
        let q = r;
        for (let d = 0; d <= 6; d++) {
          if (this.mask[(((r + d - root) % 12) + 12) % 12]) {
            q = r + d;
            if (d > 0 && this.mask[(((r - d - root) % 12) + 12) % 12] && semi - (r - d) < q - semi) q = r - d;
            break;
          }
          if (this.mask[(((r - d - root) % 12) + 12) % 12]) {
            q = r - d;
            break;
          }
        }
        if (q !== last) {
          if (last === last) tr = pulse; // not on the very first sample
          last = q;
        }
        out.buf[o + i] = q / 12;
        trig.buf[o + i] = tr > 0 ? 10 : 0;
        if (tr > 0) tr--;
      }
      this.trig[c] = tr;
      this.last[c] = last;
    }
    this.shown = this.last[0] === this.last[0] ? this.last[0] : -1;
  }

  /** MIDI note of voice 1's current output (for the panel). */
  override display(): number {
    return this.shown < -60 ? -1 : this.shown + 60;
  }
}

// -------------------------------------------------------------------- effects

class DelayMod extends Mod {
  private line: Float32Array;
  private w = 0;
  private t: number;
  private lp = 0;

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    this.line = new Float32Array(Math.ceil(sr * 2.2) + 4);
    this.t = this.p.time;
  }

  process(n: number): void {
    this.setCh(1);
    const { in: src, time } = this.ins;
    const out = this.outs.out.buf;
    const line = this.line;
    const L = line.length;
    const sr = this.sr;
    const fb = this.p.fb;
    const mix = this.p.mix;
    const kt = 1 - Math.exp((-TAU * this.p.tone) / sr);
    const sch = src.src ? src.src.ch : 1;
    const to = time.off(0);
    let t = this.t;
    let lp = this.lp;
    let w = this.w;
    for (let i = 0; i < n; i++) {
      let x = 0;
      for (let c = 0; c < sch; c++) x += src.buf[c * BLOCK + i];
      let target = this.p.time * (time.on ? Math.pow(2, time.buf[to + i] * 0.2) : 1);
      target = target < 0.001 ? 0.001 : target > 2.1 ? 2.1 : target;
      t += (target - t) * 0.0004; // glide the delay time: changing it bends pitch like tape
      let r = w - t * sr;
      if (r < 0) r += L;
      const ri = Math.floor(r);
      const fr = r - ri;
      const a = line[ri];
      const b = line[ri + 1 === L ? 0 : ri + 1];
      const wet = a + (b - a) * fr;
      lp += (wet - lp) * kt;
      line[w] = 5 * ftanh((x + lp * fb) * 0.2);
      w = w + 1 === L ? 0 : w + 1;
      out[i] = x * (1 - mix) + wet * mix;
    }
    this.t = t;
    this.lp = Number.isFinite(lp) ? lp : 0;
    this.w = w;
  }
}

class FoldMod extends Mod {
  process(n: number): void {
    const ch = this.widest();
    this.setCh(ch);
    const { in: src, cv } = this.ins;
    const out = this.outs.out.buf;
    const bias = this.p.bias * 0.2;
    const amt = this.p.cv * 0.8;
    for (let c = 0; c < ch; c++) {
      const io = src.off(c), co = cv.off(c), o = c * BLOCK;
      for (let i = 0; i < n; i++) {
        let f = this.p.fold + (cv.on ? cv.buf[co + i] * amt : 0);
        if (f < 0) f = 0;
        out[o + i] = 5 * Math.sin((src.buf[io + i] * 0.2 * f + bias) * (Math.PI / 2));
      }
    }
  }
}

export class OutMod extends Mod {
  readonly L = new Float32Array(BLOCK);
  readonly R = new Float32Array(BLOCK);
  private lv: number;
  peak = 0;

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    this.lv = this.p.level;
  }

  process(n: number): void {
    const { l, r } = this.ins;
    this.ch = Math.max(l.src?.ch ?? 1, r.src?.ch ?? 1);
    const from = this.lv;
    const to = this.p.level;
    const sum = (inp: Input, i: number) => {
      if (!inp.src) return 0;
      let x = 0;
      for (let c = 0; c < inp.src.ch; c++) x += inp.src.buf[c * BLOCK + i];
      return x;
    };
    let peak = this.peak;
    for (let i = 0; i < n; i++) {
      const g = (from + ((to - from) * (i + 1)) / n) * 0.2;
      const a = sum(l, i);
      const left = ftanh(a * g * 0.8) * 1.25;
      const right = r.on ? ftanh(sum(r, i) * g * 0.8) * 1.25 : left;
      this.L[i] = left;
      this.R[i] = right;
      const m = Math.abs(left) > Math.abs(right) ? Math.abs(left) : Math.abs(right);
      if (m > peak) peak = m;
    }
    this.peak = peak;
    this.lv = to;
  }
}

const CLASSES = {
  midi: MidiMod, vco: VcoMod, lfo: LfoMod, adsr: AdsrMod, vcf: VcfMod, ladder: LadderMod, vca: VcaMod, mix: MixMod,
  noise: NoiseMod, clock: ClockMod, seq: SeqMod, quant: QuantMod, delay: DelayMod, fold: FoldMod, util: UtilMod, out: OutMod,
  ...MORE_CLASSES,
} as Record<ModuleType, new (id: string, type: ModuleType, sr: number) => Mod>;

// ----------------------------------------------------------------------- rack

export interface RackStatus {
  /** peak |V| per "module.port" since the last status */
  meters: Record<string, number>;
  /** module id → panel number (sequencer step, clock beat, quantized note) */
  display: Record<string, number>;
  /** output level 0..1+ per OUT module */
  out: Record<string, number>;
  /** waveform points (volts) per SCOPE module */
  scopes: Record<string, { a: number[]; b: number[] | null }>;
}

export class Rack {
  private mods = new Map<string, Mod>();
  private order: Mod[] = [];
  private outs: OutMod[] = [];
  private midis: MidiMod[] = [];
  private bend = 0;
  private wheel = 0;
  private pressure = 0;
  private sustain = false;
  metering = false;

  constructor(private sr: number) {}

  /** Rebuild from a patch. Modules that survive keep their state, so re-patching never clicks the envelopes. */
  setPatch(patch: RackPatch): void {
    const next = new Map<string, Mod>();
    for (const m of patch.modules) {
      let inst = this.mods.get(m.id);
      if (!inst || inst.type !== m.type) inst = new CLASSES[m.type](m.id, m.type, this.sr);
      for (const [k, v] of Object.entries(m.params)) if (k in inst.p && Number.isFinite(v)) inst.p[k] = v;
      next.set(m.id, inst);
    }
    for (const inst of next.values()) {
      for (const i of inst.inList) i.src = null;
      for (const o of inst.outList) o.used = false;
    }
    const deps = new Map<Mod, Mod[]>();
    for (const c of patch.cables) {
      const a = next.get(c.from.mod);
      const b = next.get(c.to.mod);
      const out = a?.outs[c.from.port];
      const inp = b?.ins[c.to.port];
      if (!a || !b || !out || !inp) continue;
      inp.src = out;
      out.used = true;
      deps.set(b, [...(deps.get(b) ?? []), a]);
    }
    // sources before the modules that read them; a loop is cut where it is found (one block of delay)
    const order: Mod[] = [];
    const state = new Map<Mod, 1 | 2>();
    const visit = (m: Mod) => {
      if (state.has(m)) return;
      state.set(m, 1);
      for (const d of deps.get(m) ?? []) visit(d);
      state.set(m, 2);
      order.push(m);
    };
    for (const m of next.values()) visit(m);
    this.mods = next;
    this.order = order;
    this.outs = order.filter((m): m is OutMod => m instanceof OutMod);
    this.midis = order.filter((m): m is MidiMod => m instanceof MidiMod);
    for (const m of this.midis) {
      m.bend = this.bend;
      m.wheel = this.wheel;
      m.pressure = this.pressure;
      m.sustain = this.sustain;
    }
  }

  setParam(id: string, key: string, value: number): void {
    const m = this.mods.get(id);
    if (m && key in m.p && Number.isFinite(value)) m.p[key] = value;
  }

  noteOn(note: number, vel: number): void {
    for (const m of this.midis) m.noteOn(note, vel);
  }
  noteOff(note: number): void {
    for (const m of this.midis) m.noteOff(note);
  }
  setBend(v: number): void {
    this.bend = v;
    for (const m of this.midis) m.bend = v;
  }
  setWheel(v: number): void {
    this.wheel = v;
    for (const m of this.midis) m.wheel = v;
  }
  setPressure(v: number): void {
    this.pressure = v;
    for (const m of this.midis) m.pressure = v;
  }
  setSustain(on: boolean): void {
    this.sustain = on;
    for (const m of this.midis) m.setSustain(on);
  }
  allOff(): void {
    for (const m of this.midis) m.allOff();
  }

  /** Render n ≤ BLOCK samples into L/R at offset `off`. */
  render(L: Float32Array, R: Float32Array, off: number, n: number): void {
    for (const m of this.order) {
      m.process(n);
      if (this.metering) {
        for (const p of m.outList) {
          if (!p.used) continue;
          let pk = p.peak;
          for (let c = 0; c < p.ch; c++) {
            const o = c * BLOCK;
            for (let i = 0; i < n; i++) {
              const v = p.buf[o + i];
              if (v > pk) pk = v;
              else if (-v > pk) pk = -v;
            }
          }
          p.peak = pk;
        }
      }
    }
    for (let i = 0; i < n; i++) L[off + i] = R[off + i] = 0;
    for (const o of this.outs) {
      for (let i = 0; i < n; i++) {
        L[off + i] += o.L[i];
        R[off + i] += o.R[i];
      }
    }
  }

  /** Meter peaks and panel numbers since the last call (resets the peaks). */
  status(): RackStatus {
    const s: RackStatus = { meters: {}, display: {}, out: {}, scopes: {} };
    for (const m of this.order) {
      for (const [id, p] of Object.entries(m.outs)) {
        if (!p.used) continue;
        s.meters[`${m.id}.${id}`] = Math.round(p.peak * 100) / 100;
        p.peak = 0;
      }
      const d = m.display();
      if (d >= 0) s.display[m.id] = d;
      const sc = m.scope();
      if (sc) s.scopes[m.id] = sc;
      if (m instanceof OutMod) {
        s.out[m.id] = Math.round(m.peak * 100) / 100;
        m.peak = 0;
      }
    }
    return s;
  }
}
