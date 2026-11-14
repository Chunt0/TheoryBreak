// DX7 voice DSP. The envelope, scaling, LFO and feedback maths follow the
// measurements published in Dexed / music-synthesizer-for-android (Raph Levien),
// translated to floating point. Levels live in "DX units": 256 units = 1 octave
// of amplitude (6.02 dB); amplitude = 2^(L/256 - 14), so L = 3840 gives 2.0.

import { compileAlgorithm, type CompiledAlgorithm } from './algorithms';
import type { ModRouting, ModSlot, Operator, Patch, PartConfig } from './patch';
import { defaultPartConfig } from './patch';

// ---------------------------------------------------------------------------
// Lookup tables

const LEVEL_LUT = [0, 5, 9, 13, 17, 20, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 42, 43, 45, 46];
export const scaleOutLevel = (l: number): number => (l >= 20 ? 28 + l : LEVEL_LUT[Math.max(0, l)]);

const VELOCITY_DATA = [
  0, 70, 86, 97, 106, 114, 121, 126, 132, 138, 142, 148, 152, 156, 160, 163, 166, 170, 173, 174, 178, 181, 184, 186, 189,
  190, 194, 196, 198, 200, 202, 205, 206, 209, 211, 214, 216, 218, 220, 222, 224, 225, 227, 229, 230, 232, 233, 235, 237,
  238, 240, 241, 242, 243, 244, 246, 246, 248, 249, 250, 251, 252, 253, 254,
];
export function scaleVelocity(velocity: number, sens: number): number {
  const v = VELOCITY_DATA[Math.max(0, Math.min(127, velocity)) >> 1] - 239;
  return ((sens * v + 7) >> 3) << 4;
}

const EXP_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 14, 16, 19, 23, 27, 33, 39, 47, 56, 66, 80, 94, 110, 126, 142, 158, 174, 190, 206, 222, 238, 250];
function scaleCurve(group: number, depth: number, curve: number): number {
  let scale: number;
  if (curve === 0 || curve === 3) scale = (group * depth * 329) >> 12;
  else scale = (EXP_SCALE[Math.min(group, EXP_SCALE.length - 1)] * depth * 329) >> 15;
  return curve < 2 ? -scale : scale;
}
export function scaleLevel(midinote: number, op: Operator): number {
  const offset = midinote - op.breakPoint - 17;
  if (offset >= 0) return scaleCurve(Math.floor((offset + 1) / 3), op.rightDepth, op.rightCurve);
  return scaleCurve(Math.floor(-(offset - 1) / 3), op.leftDepth, op.leftCurve);
}
export function scaleRate(midinote: number, sens: number): number {
  const x = Math.min(31, Math.max(0, Math.floor(midinote / 3) - 7));
  return (sens * x) >> 3;
}

const PITCH_RATE = [
  1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 16, 16, 17, 18, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 33, 34, 36, 37, 38, 39, 41, 42, 44, 46, 47, 49, 51, 53, 54, 56, 58, 60, 62, 64,
  66, 68, 70, 72, 74, 76, 79, 82, 85, 88, 91, 94, 98, 102, 106, 110, 115, 120, 125, 130, 135, 141, 147, 153, 159, 165,
  171, 178, 185, 193, 202, 211, 232, 243, 254, 255,
];
const PITCH_LEVEL = [
  -128, -116, -104, -95, -85, -76, -68, -61, -56, -52, -49, -46, -43, -41, -39, -37, -35, -33, -32, -31, -30, -29, -28,
  -27, -26, -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3,
  -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35, 38, 40, 43, 46, 49, 53, 58, 65, 73, 82, 92, 103, 115, 127,
];
/** Pitch EG level (0-99) → octaves. */
export const pitchEgOctaves = (level: number): number => PITCH_LEVEL[level] / 32;

const PMS_TABLE = [0, 10, 20, 33, 55, 92, 153, 255];
const AMS_TABLE = [0, 0.2588, 0.4274, 1];

export function lfoHz(speed: number): number {
  let sr = speed === 0 ? 1 : (165 * speed) >> 6;
  sr *= sr < 160 ? 11 : 11 + ((sr - 160) >> 4);
  return (sr * 25190424) / 4294967296;
}

// ---------------------------------------------------------------------------
// Sine table (phase in cycles)

const SIN_BITS = 12;
const SIN_SIZE = 1 << SIN_BITS;
const SIN_MASK = SIN_SIZE - 1;
const SIN = new Float32Array(SIN_SIZE + 1);
for (let i = 0; i <= SIN_SIZE; i++) SIN[i] = Math.sin((2 * Math.PI * i) / SIN_SIZE);

function sinCycles(phase: number): number {
  const x = phase * SIN_SIZE;
  const i = Math.floor(x);
  const f = x - i;
  const j = i & SIN_MASK;
  return SIN[j] + f * (SIN[j + 1] - SIN[j]);
}

// Extra oscillator shapes (OpShape 1-4), all derived from the same sine table
// so they stay cheap and phase-continuous with feedback. Shape 0 (sine) uses
// sinCycles directly and is untouched by any of this.
function halfSineCycles(phase: number): number {
  const p = phase - Math.floor(phase);
  return p < 0.5 ? sinCycles(phase) : 0;
}
function fullSineCycles(phase: number): number {
  return Math.abs(sinCycles(phase));
}
function squareCycles(phase: number): number {
  return Math.tanh(sinCycles(phase) * 4);
}
function triangleWarpCycles(phase: number): number {
  const s = Math.max(-1, Math.min(1, sinCycles(phase)));
  return (2 / Math.PI) * Math.asin(s);
}
const SHAPE_FNS: ((phase: number) => number)[] = [sinCycles, halfSineCycles, fullSineCycles, squareCycles, triangleWarpCycles];

// ---------------------------------------------------------------------------
// Operator envelope

const ENV_JUMP = 1716;

export class Env {
  rates = [99, 99, 99, 99];
  levels = [99, 99, 99, 0];
  outlevel = 0;
  rateScaling = 0;
  level = 0;
  target = 0;
  inc = 0;
  rising = false;
  ix = 0;
  down = true;
  constructor(private srMul: number) {}

  init(rates: number[], levels: number[], outlevel: number, rateScaling: number): void {
    this.setParams(rates, levels, outlevel, rateScaling);
    this.level = 0;
    this.down = true;
    this.advance(0);
  }

  /** Retrigger from the current level (DX7 voices don't snap to zero). */
  retrigger(rates: number[], levels: number[], outlevel: number, rateScaling: number): void {
    this.setParams(rates, levels, outlevel, rateScaling);
    this.down = true;
    this.advance(0);
  }

  setParams(rates: number[], levels: number[], outlevel: number, rateScaling: number): void {
    for (let i = 0; i < 4; i++) {
      this.rates[i] = rates[i];
      this.levels[i] = levels[i];
    }
    this.outlevel = outlevel;
    this.rateScaling = rateScaling;
  }

  /** Apply edited parameters to a sounding note without restarting it. */
  refresh(rates: number[], levels: number[], outlevel: number, rateScaling: number): void {
    this.setParams(rates, levels, outlevel, rateScaling);
    if (this.ix < 4) this.advance(this.ix);
  }

  keyDown(d: boolean): void {
    if (this.down !== d) {
      this.down = d;
      this.advance(d ? 0 : 3);
    }
  }

  private advance(ix: number): void {
    this.ix = ix;
    if (ix < 4) {
      let actual = (scaleOutLevel(this.levels[ix]) >> 1) << 6;
      actual += this.outlevel - 4256;
      this.target = actual < 16 ? 16 : actual;
      this.rising = this.target > this.level;
      let q = (this.rates[ix] * 41) >> 6;
      q = Math.min(63, q + this.rateScaling);
      this.inc = (4 + (q & 3)) * Math.pow(2, (q >> 2) - 14) * this.srMul;
    }
  }

  step(n: number): number {
    if (this.ix < 3 || (this.ix < 4 && !this.down)) {
      if (this.rising) {
        if (this.level < ENV_JUMP) this.level = ENV_JUMP;
        this.level += Math.max(1, Math.floor(17 - this.level / 256)) * this.inc * n;
        if (this.level >= this.target) {
          this.level = this.target;
          this.advance(this.ix + 1);
        }
      } else {
        this.level -= this.inc * n;
        if (this.level <= this.target) {
          this.level = this.target;
          this.advance(this.ix + 1);
        }
      }
    }
    return this.level;
  }
}

class PitchEnv {
  rates = [99, 99, 99, 99];
  levels = [50, 50, 50, 50];
  level = 0;
  target = 0;
  inc = 0;
  rising = false;
  ix = 0;
  down = true;
  constructor(private sr: number) {}

  init(rates: number[], levels: number[]): void {
    this.set(rates, levels);
    this.level = pitchEgOctaves(this.levels[3]);
    this.down = true;
    this.advance(0);
  }
  set(rates: number[], levels: number[]): void {
    for (let i = 0; i < 4; i++) {
      this.rates[i] = rates[i];
      this.levels[i] = levels[i];
    }
  }
  refresh(rates: number[], levels: number[]): void {
    this.set(rates, levels);
    if (this.ix < 4) this.advance(this.ix);
  }
  keyDown(d: boolean): void {
    if (this.down !== d) {
      this.down = d;
      this.advance(d ? 0 : 3);
    }
  }
  private advance(ix: number): void {
    this.ix = ix;
    if (ix < 4) {
      this.target = pitchEgOctaves(this.levels[ix]);
      this.rising = this.target > this.level;
      this.inc = PITCH_RATE[this.rates[ix]] / 21.3 / this.sr;
    }
  }
  step(n: number): number {
    if (this.ix < 3 || (this.ix < 4 && !this.down)) {
      if (this.rising) {
        this.level += this.inc * n;
        if (this.level >= this.target) {
          this.level = this.target;
          this.advance(this.ix + 1);
        }
      } else {
        this.level -= this.inc * n;
        if (this.level <= this.target) {
          this.level = this.target;
          this.advance(this.ix + 1);
        }
      }
    }
    return this.level;
  }
}

class Lfo {
  phase = 0;
  delta = 0;
  delayState = 0;
  delayInc1 = 0;
  delayInc2 = 0;
  wave = 0;
  sync = true;
  sh = 0.5;
  private rnd = 0x2a;
  constructor(private sr: number) {}

  configure(p: Patch['lfo']): void {
    this.delta = lfoHz(p.speed) / this.sr;
    const a = 99 - p.delay;
    if (a === 99) {
      this.delayInc1 = this.delayInc2 = Infinity;
    } else {
      const a1 = (16 + (a & 15)) << (1 + (a >> 4));
      const unit = 25190424 / this.sr / 4294967296;
      this.delayInc1 = unit * a1;
      this.delayInc2 = unit * Math.max(0x80, a1 & 0xff80);
    }
    this.wave = p.wave;
    this.sync = p.sync;
  }

  keyDown(): void {
    if (this.sync) this.phase = 0.5;
    this.delayState = 0;
  }

  /** Advance n samples; returns [value 0..1, delay ramp 0..1]. */
  step(n: number, out: Float64Array): void {
    const prev = this.phase;
    this.phase += this.delta * n;
    if (this.phase >= 1) {
      this.phase -= Math.floor(this.phase);
      this.rnd = (this.rnd * 179 + 17) & 0xff;
      this.sh = ((this.rnd ^ 0x80) + 1) / 256;
    } else if (prev > this.phase) {
      this.phase = 0;
    }
    const p = this.phase;
    let v: number;
    switch (this.wave) {
      case 0: v = p < 0.5 ? 2 * p : 2 - 2 * p; break;
      case 1: v = (1.5 - p) % 1; break;
      case 2: v = (p + 0.5) % 1; break;
      case 3: v = p < 0.5 ? 1 : 0; break;
      case 4: v = 0.5 + 0.5 * Math.sin(2 * Math.PI * p); break;
      default: v = this.sh;
    }
    let d: number;
    if (this.delayState >= 1) d = 1;
    else {
      this.delayState += (this.delayState < 0.5 ? this.delayInc1 : this.delayInc2) * n;
      d = this.delayState >= 1 ? 1 : this.delayState < 0.5 ? 0 : (this.delayState - 0.5) * 2;
    }
    out[0] = v;
    out[1] = d;
  }
}

// ---------------------------------------------------------------------------
// Voice

export interface Controllers {
  bendOctaves: number;
  /** wheel/aftertouch pitch depth 0..~1 */
  pitchMod: number;
  /** wheel/aftertouch amp depth 0..1 */
  ampMod: number;
  /** EG bias 0..1 (1 = no attenuation) */
  egBias: number;
  lfo: number;
  lfoDelay: number;
}

export interface CompiledPatch {
  patch: Patch;
  algo: CompiledAlgorithm;
  fbScale: number;
  pms: number; // 0..1
  pmd: number; // 0..1
  amd: number; // 0..1
}

export function compilePatch(patch: Patch): CompiledPatch {
  return {
    patch,
    algo: compileAlgorithm(patch.algorithm),
    // feedback 1..7 → avg(y0,y1) * 2^(fb-8) cycles (fb 0 = off)
    fbScale: patch.feedback === 0 ? 0 : Math.pow(2, patch.feedback - 8),
    pms: PMS_TABLE[patch.pitchModSens] / 255,
    pmd: ((patch.lfo.pmd * 165) >> 6) / 255,
    amd: ((patch.lfo.amd * 165) >> 6) / 256,
  };
}

const OUT_SCALE = 0.0625; // one full-level carrier peaks at 0.125, as on the hardware

export class Voice {
  note = -1;
  /** note currently sounding (differs from `note` while gliding in mono mode) */
  velocity = 0;
  active = false;
  keyIsDown = false;
  sustained = false;
  startedAt = 0;
  envs: Env[];
  pitchEnv: PitchEnv;
  phase = new Float64Array(6);
  phaseInc = new Float64Array(6);
  gain = new Float64Array(6);
  gainInc = new Float64Array(6);
  out = new Float64Array(6);
  baseLog = new Float64Array(6);
  fb0 = 0;
  fb1 = 0;
  glide = 0; // semitones offset remaining
  glideStep = 0; // semitones per sample
  ampLevel = new Float64Array(6); // last computed amplitudes (for UI meters)

  // --- modern extensions, all no-ops at their defaults ---
  /** stereo pan tag for renderStereo, -1..1; unused by the mono render() path */
  pan = 0;
  /** unison spread, added to every operator's pitch in opPitch */
  detuneCents = 0;
  /** unison gain compensation, applied to the final mix */
  levelScale = 1;
  /** mod-matrix nudges, written by Part before each render() / renderStereo() call */
  modLevel = new Float64Array(6).fill(1);
  modPitchOct = new Float64Array(6);
  modFeedback = 0;
  modPan = 0;
  private shapeFn: ((phase: number) => number)[] = new Array(6).fill(sinCycles);

  constructor(private sr: number) {
    const mul = 44100 / sr;
    this.envs = Array.from({ length: 6 }, () => new Env(mul));
    this.pitchEnv = new PitchEnv(sr);
  }

  private opPitch(cp: CompiledPatch, midinote: number, i: number): number {
    const op = cp.patch.ops[i];
    let logf: number;
    if (op.oscMode === 1) {
      logf = Math.log2(10) * ((op.coarse & 3) + op.fine / 100);
      if (op.detune > 7) logf += (13457 * (op.detune - 7)) / 16777216;
    } else {
      logf = Math.log2(440) + (midinote - 69) / 12;
      const detuneRatio = (0.0209 * Math.exp(-0.396 * logf)) / 7;
      logf += detuneRatio * logf * (op.detune - 7);
      logf += op.coarse === 0 ? -1 : Math.log2(op.coarse);
      if (op.fine) logf += Math.log2(1 + 0.01 * op.fine);
    }
    if (this.detuneCents !== 0) logf += this.detuneCents / 1200;
    return logf;
  }

  private outLevelFor(op: Operator, midinote: number, velocity: number): number {
    let ol = scaleOutLevel(op.outputLevel) + scaleLevel(midinote, op);
    ol = Math.min(127, ol) << 5;
    ol += scaleVelocity(velocity, op.velocitySens);
    return Math.max(0, ol);
  }

  start(cp: CompiledPatch, note: number, velocity: number, now: number, glideFrom: number | null, glideTime: number): void {
    const p = cp.patch;
    const midinote = note + p.transpose - 24;
    const wasActive = this.active;
    this.note = note;
    this.velocity = velocity;
    this.active = true;
    this.keyIsDown = true;
    this.sustained = false;
    this.startedAt = now;
    for (let i = 0; i < 6; i++) {
      const op = p.ops[i];
      const ol = this.outLevelFor(op, midinote, velocity);
      const rs = scaleRate(midinote, op.rateScaling);
      if (wasActive) this.envs[i].retrigger(op.rates, op.levels, ol, rs);
      else {
        this.envs[i].init(op.rates, op.levels, ol, rs);
        this.gain[i] = 0;
      }
      this.baseLog[i] = this.opPitch(cp, midinote, i);
      if (p.oscSync || !wasActive) this.phase[i] = 0;
      this.out[i] = 0;
    }
    if (p.oscSync || !wasActive) {
      this.fb0 = 0;
      this.fb1 = 0;
    }
    if (!wasActive) this.glide = 0;
    this.pitchEnv.init(p.pitchEg.rates, p.pitchEg.levels);
    this.setGlide(glideFrom, note, glideTime);
  }

  /** Mono legato: change pitch without retriggering envelopes. */
  legato(cp: CompiledPatch, note: number, glideFrom: number | null, glideTime: number): void {
    const midinote = note + cp.patch.transpose - 24;
    this.note = note;
    for (let i = 0; i < 6; i++) this.baseLog[i] = this.opPitch(cp, midinote, i);
    this.setGlide(glideFrom, note, glideTime);
  }

  private setGlide(from: number | null, to: number, time: number): void {
    if (from === null || time <= 0) {
      this.glide = 0;
      this.glideStep = 0;
      return;
    }
    this.glide = from - to + this.glide;
    this.glideStep = Math.abs(this.glide) / Math.max(1, time * this.sr);
  }

  release(): void {
    this.keyIsDown = false;
    for (const e of this.envs) e.keyDown(false);
    this.pitchEnv.keyDown(false);
  }

  /** Re-derive per-note values after a patch edit so held notes follow the editor. */
  refresh(cp: CompiledPatch): void {
    if (!this.active) return;
    const p = cp.patch;
    const midinote = this.note + p.transpose - 24;
    for (let i = 0; i < 6; i++) {
      const op = p.ops[i];
      this.envs[i].refresh(op.rates, op.levels, this.outLevelFor(op, midinote, this.velocity), scaleRate(midinote, op.rateScaling));
      this.baseLog[i] = this.opPitch(cp, midinote, i);
    }
    this.pitchEnv.refresh(p.pitchEg.rates, p.pitchEg.levels);
  }

  /** Render n samples (additively) into buf starting at offset. Returns false when the voice became silent. */
  render(cp: CompiledPatch, ctl: Controllers, buf: Float32Array, offset: number, n: number): boolean {
    const p = cp.patch;
    const algo = cp.algo;

    // ---- pitch
    const pegOct = this.pitchEnv.step(n);
    const sens = cp.pms * (ctl.lfo - 0.5);
    const pm1 = Math.abs(cp.pmd * ctl.lfoDelay * sens * 2 * 0.992);
    const pm2 = Math.abs(ctl.pitchMod * sens * 2 * 0.992);
    const lfoOct = Math.max(pm1, pm2) * (sens < 0 ? -1 : 1);
    if (this.glide !== 0) {
      const d = this.glideStep * n;
      this.glide = Math.abs(this.glide) <= d ? 0 : this.glide - Math.sign(this.glide) * d;
    }
    const pitchOct = pegOct + lfoOct + ctl.bendOctaves + this.glide / 12;

    // ---- amplitude modulation
    const lfoInv = 1 - ctl.lfo;
    let ampMod = Math.max(cp.amd * ctl.lfoDelay * lfoInv, ctl.ampMod * lfoInv);
    ampMod = Math.max(1 - ctl.egBias, ampMod);

    let anyCarrier = false;
    const shapeFn = this.shapeFn;
    for (let i = 0; i < 6; i++) {
      const op = p.ops[i];
      shapeFn[i] = SHAPE_FNS[op.shape] ?? sinCycles;
      let logf = this.baseLog[i] + (op.oscMode === 1 ? ctl.bendOctaves : pitchOct);
      if (this.modPitchOct[i] !== 0) logf += this.modPitchOct[i];
      this.phaseInc[i] = Math.pow(2, logf) / this.sr;
      let level = this.envs[i].step(n);
      if (op.ampModSens > 0) {
        const s = ampMod * AMS_TABLE[op.ampModSens];
        level -= level * (Math.exp(4.48 * s) - 1) * 0.011849;
        if (level < 0) level = 0;
      }
      let amp = level <= 16 ? 0 : Math.pow(2, level / 256 - 14);
      if (!op.enabled) amp = 0;
      if (this.modLevel[i] !== 1) amp *= this.modLevel[i];
      this.ampLevel[i] = amp;
      this.gainInc[i] = (amp - this.gain[i]) / n;
      if (algo.isCarrier[i] && amp > 0.00005) anyCarrier = true;
    }
    if (!anyCarrier && !this.keyIsDown && !this.sustained) {
      this.active = false;
      return false;
    }

    // ---- render
    const ms = algo.modSources;
    const isC = algo.isCarrier;
    const fbFrom = algo.fbFrom;
    const fbTo = algo.fbTo;
    const fbScale = this.modFeedback !== 0 ? cp.fbScale * 0.5 * (1 + this.modFeedback) : cp.fbScale * 0.5;
    const outScale = this.levelScale !== 1 ? OUT_SCALE * this.levelScale : OUT_SCALE;
    const ph = this.phase;
    const inc = this.phaseInc;
    const g = this.gain;
    const gi = this.gainInc;
    const out = this.out;
    let fb0 = this.fb0;
    let fb1 = this.fb1;
    for (let s = 0; s < n; s++) {
      let sum = 0;
      for (let i = 5; i >= 0; i--) {
        let mod = 0;
        const src = ms[i];
        for (let k = 0; k < src.length; k++) mod += out[src[k]];
        if (i === fbTo && fbScale !== 0) mod += (fb0 + fb1) * fbScale;
        g[i] += gi[i];
        const y = g[i] * shapeFn[i](ph[i] + mod);
        out[i] = y;
        if (i === fbFrom) {
          fb0 = fb1;
          fb1 = y;
        }
        if (isC[i]) sum += y;
        let np = ph[i] + inc[i];
        if (np >= 1) np -= 1;
        ph[i] = np;
      }
      buf[offset + s] += sum * outScale;
    }
    this.fb0 = fb0;
    this.fb1 = fb1;
    return true;
  }
}

// ---------------------------------------------------------------------------
// Modulation matrix: a handful of assignable nudges layered on top of the
// hardware-accurate wheel/aftertouch routing above. Pure function so it's
// easy to test in isolation; an empty slot list leaves every output neutral.

export interface ModSources {
  wheel: number; // 0..1
  aftertouch: number; // 0..1
  velocity: number; // 0..1
  keyFollow: number; // -1..1
  lfo2: number; // -1..1
  macros: readonly [number, number, number, number]; // 0..1 each
}

/** Evaluates `slots` against `src`, writing per-op nudges into `outLevel`/`outPitchOct`
 * (level is a multiplier around 1, pitch is additive octaves) and returning [feedback, pan]
 * nudges. Leaves everything neutral (level=1, pitch/feedback/pan=0) when `slots` is empty. */
export function evalModMatrix(slots: ModSlot[], src: ModSources, outLevel: Float64Array, outPitchOct: Float64Array): [number, number] {
  outLevel.fill(1);
  outPitchOct.fill(0);
  let feedback = 0;
  let pan = 0;
  for (let k = 0; k < slots.length; k++) {
    const slot = slots[k];
    if (!slot.on || slot.depth === 0) continue;
    let srcVal: number;
    switch (slot.source) {
      case 'wheel': srcVal = src.wheel; break;
      case 'aftertouch': srcVal = src.aftertouch; break;
      case 'velocity': srcVal = src.velocity; break;
      case 'keyFollow': srcVal = src.keyFollow; break;
      case 'lfo2': srcVal = src.lfo2; break;
      case 'macro1': srcVal = src.macros[0]; break;
      case 'macro2': srcVal = src.macros[1]; break;
      case 'macro3': srcVal = src.macros[2]; break;
      case 'macro4': srcVal = src.macros[3]; break;
      default: srcVal = 0;
    }
    const amt = srcVal * (slot.depth / 99);
    switch (slot.dest) {
      case 'op1Level': outLevel[0] *= 1 + amt; break;
      case 'op2Level': outLevel[1] *= 1 + amt; break;
      case 'op3Level': outLevel[2] *= 1 + amt; break;
      case 'op4Level': outLevel[3] *= 1 + amt; break;
      case 'op5Level': outLevel[4] *= 1 + amt; break;
      case 'op6Level': outLevel[5] *= 1 + amt; break;
      case 'op1Pitch': outPitchOct[0] += amt / 6; break;
      case 'op2Pitch': outPitchOct[1] += amt / 6; break;
      case 'op3Pitch': outPitchOct[2] += amt / 6; break;
      case 'op4Pitch': outPitchOct[3] += amt / 6; break;
      case 'op5Pitch': outPitchOct[4] += amt / 6; break;
      case 'op6Pitch': outPitchOct[5] += amt / 6; break;
      case 'feedback': feedback += amt; break;
      case 'pan': pan += amt; break;
    }
  }
  return [feedback, pan];
}

// ---------------------------------------------------------------------------
// Part: voice allocation, LFO, controllers. One per instrument slot.

export interface PartStatus {
  activeVoices: number;
  /** amplitude 0..1 per operator for the most recent voice */
  opLevels: number[];
  notes: number[];
}

export class Part {
  cp: CompiledPatch;
  config: PartConfig = defaultPartConfig();
  voices: Voice[];
  lfo: Lfo;
  bend = 0; // -1..1
  wheel = 0; // 0..1
  aftertouch = 0;
  sustain = false;
  private held: number[] = [];
  private lastNote: number | null = null;
  private clock = 0;
  private lfoOut = new Float64Array(2);
  private ctl: Controllers = { bendOctaves: 0, pitchMod: 0, ampMod: 0, egBias: 1, lfo: 0.5, lfoDelay: 0 };
  private lfo2Phase = 0;
  private readonly lfo2Rate = 4.3; // Hz; free-running mod source, independent of the hardware LFO
  private scratchBuf = new Float32Array(128);

  constructor(private sr: number, patch: Patch, maxVoices = 16) {
    this.cp = compilePatch(patch);
    this.voices = Array.from({ length: maxVoices }, () => new Voice(sr));
    this.lfo = new Lfo(sr);
    this.lfo.configure(patch.lfo);
  }

  setPatch(patch: Patch): void {
    this.cp = compilePatch(patch);
    this.lfo.configure(patch.lfo);
    for (const v of this.voices) v.refresh(this.cp);
  }

  setConfig(c: Partial<PartConfig>): void {
    this.config = { ...this.config, ...c };
    if (c.mono !== undefined) this.allNotesOff();
  }

  private glideTime(): number {
    const t = this.config.portaTime / 99;
    return t * t * 1.5;
  }

  /** How many unison voices to stack per note-on, clamped to what this part actually has. */
  private unisonCount(): number {
    return Math.max(1, Math.min(this.voices.length, this.cp.patch.unison.voices));
  }

  /** Sets pan/detune/gain-compensation for unison member `k` of `count`; (k=0, count<=1) resets to plain-voice defaults. */
  private tagUnison(v: Voice, k: number, count: number): void {
    if (count <= 1) {
      v.pan = 0;
      v.detuneCents = 0;
      v.levelScale = 1;
      return;
    }
    const u = this.cp.patch.unison;
    const centered = (k / (count - 1)) * 2 - 1; // -1..1, one voice lands on 0 for odd counts
    v.detuneCents = centered * (u.detune / 99) * 25;
    v.pan = centered * (u.spread / 99);
    v.levelScale = 1 / Math.sqrt(count);
  }

  /** Picks `count` voices from `pool` for a new unison group: reuse same-note voices first, then free voices, then steal. */
  private allocateUnisonGroup(pool: Voice[], note: number, count: number): Voice[] {
    const chosen = pool.filter((x) => x.active && x.note === note).slice(0, count);
    const used = new Set(chosen);
    while (chosen.length < count) {
      let v = pool.find((x) => !x.active && !used.has(x));
      if (!v) {
        const candidates = pool.filter((x) => !used.has(x));
        if (!candidates.length) break;
        const released = candidates.filter((x) => !x.keyIsDown && !x.sustained);
        const cands = released.length ? released : candidates;
        v = cands.reduce((a, b) => (a.startedAt <= b.startedAt ? a : b));
      }
      used.add(v);
      chosen.push(v);
    }
    return chosen;
  }

  noteOn(note: number, velocity: number): void {
    if (velocity <= 0) return this.noteOff(note);
    this.clock++;
    this.lfo.keyDown();
    const glideFrom = this.config.portaTime > 0 ? this.lastNote : null;
    if (this.config.mono) {
      this.held = this.held.filter((n) => n !== note);
      this.held.push(note);
      const count = this.unisonCount();
      const members = this.voices.slice(0, count);
      for (let k = 0; k < members.length; k++) {
        const v = members[k];
        this.tagUnison(v, k, members.length);
        if (v.active && (v.keyIsDown || v.sustained)) v.legato(this.cp, note, glideFrom, this.glideTime());
        else v.start(this.cp, note, velocity, this.clock, glideFrom, this.glideTime());
        v.keyIsDown = true;
        v.sustained = false;
      }
      this.lastNote = note;
      return;
    }
    const limit = Math.min(this.voices.length, Math.max(1, this.config.polyphony));
    const pool = this.voices.slice(0, limit);
    const count = this.unisonCount();
    if (count <= 1) {
      let v = pool.find((x) => x.active && x.note === note);
      if (!v) v = pool.find((x) => !x.active);
      if (!v) {
        // steal: oldest released voice, else oldest overall
        const released = pool.filter((x) => !x.keyIsDown && !x.sustained);
        const cands = released.length ? released : pool;
        v = cands.reduce((a, b) => (a.startedAt <= b.startedAt ? a : b));
      }
      this.tagUnison(v, 0, 1);
      v.start(this.cp, note, velocity, this.clock, glideFrom, this.glideTime());
      this.lastNote = note;
      return;
    }
    const members = this.allocateUnisonGroup(pool, note, count);
    for (let k = 0; k < members.length; k++) {
      this.tagUnison(members[k], k, members.length);
      members[k].start(this.cp, note, velocity, this.clock, glideFrom, this.glideTime());
    }
    this.lastNote = note;
  }

  noteOff(note: number): void {
    if (this.config.mono) {
      const wasTop = this.held[this.held.length - 1] === note;
      this.held = this.held.filter((n) => n !== note);
      const count = this.unisonCount();
      const members = this.voices.slice(0, count);
      if (!members[0]?.active) return;
      if (this.held.length && wasTop) {
        const back = this.held[this.held.length - 1];
        for (const v of members) v.legato(this.cp, back, this.config.portaTime > 0 ? note : null, this.glideTime());
        this.lastNote = back;
      } else if (!this.held.length) {
        for (const v of members) {
          if (this.sustain) v.sustained = true;
          else v.release();
          v.keyIsDown = false;
        }
      }
      return;
    }
    for (const v of this.voices) {
      if (v.active && v.keyIsDown && v.note === note) {
        v.keyIsDown = false;
        if (this.sustain) v.sustained = true;
        else v.release();
      }
    }
  }

  setSustain(on: boolean): void {
    this.sustain = on;
    if (!on) {
      for (const v of this.voices) {
        if (v.active && v.sustained) {
          v.sustained = false;
          v.release();
        }
      }
    }
  }

  allNotesOff(): void {
    this.held = [];
    for (const v of this.voices) {
      if (v.active) {
        v.keyIsDown = false;
        v.sustained = false;
        v.release();
      }
    }
  }

  panic(): void {
    this.held = [];
    for (const v of this.voices) v.active = false;
  }

  private routed(r: ModRouting, value: number, kind: 'pitch' | 'amp' | 'eg'): number {
    return r[kind] ? value * (r.range / 99) : 0;
  }

  /** Shared controller setup for render()/renderStereo(): hardware wheel/aftertouch routing plus the free LFO2 clock. */
  private updateControllers(n: number): void {
    this.lfo.step(n, this.lfoOut);
    const c = this.ctl;
    const cfg = this.config;
    c.lfo = this.lfoOut[0];
    c.lfoDelay = this.lfoOut[1];
    c.bendOctaves = (this.bend * cfg.pbRange) / 12;
    c.pitchMod = Math.max(this.routed(cfg.wheel, this.wheel, 'pitch'), this.routed(cfg.aftertouch, this.aftertouch, 'pitch'));
    c.ampMod = Math.max(this.routed(cfg.wheel, this.wheel, 'amp'), this.routed(cfg.aftertouch, this.aftertouch, 'amp'));
    const egAssigned = cfg.wheel.eg || cfg.aftertouch.eg;
    c.egBias = egAssigned
      ? Math.max(this.routed(cfg.wheel, this.wheel, 'eg'), this.routed(cfg.aftertouch, this.aftertouch, 'eg'))
      : 1;
    this.lfo2Phase = (this.lfo2Phase + (this.lfo2Rate / this.sr) * n) % 1;
  }

  /** Evaluates the patch's mod matrix for voice `v`, writing its per-voice nudges. No-op (all neutral) when the matrix is empty. */
  private applyMod(v: Voice): void {
    const macros = this.cp.patch.macros;
    const src: ModSources = {
      wheel: this.wheel,
      aftertouch: this.aftertouch,
      velocity: v.velocity / 127,
      keyFollow: Math.max(-1, Math.min(1, (v.note - 60) / 48)),
      lfo2: Math.sin(2 * Math.PI * this.lfo2Phase),
      macros: [macros[0] / 99, macros[1] / 99, macros[2] / 99, macros[3] / 99],
    };
    const [feedback, pan] = evalModMatrix(this.cp.patch.modMatrix, src, v.modLevel, v.modPitchOct);
    v.modFeedback = feedback;
    v.modPan = pan;
  }

  private ensureScratch(n: number): Float32Array {
    if (this.scratchBuf.length < n) this.scratchBuf = new Float32Array(n);
    return this.scratchBuf;
  }

  render(buf: Float32Array, offset: number, n: number): void {
    this.updateControllers(n);
    for (const v of this.voices) {
      if (!v.active) continue;
      this.applyMod(v);
      v.render(this.cp, this.ctl, buf, offset, n);
    }
  }

  /** Stereo counterpart of render(): renders each voice via the same Voice.render into a scratch
   * mono buffer, then pan-mixes it into left/right with an equal-power law. Used by the live
   * instrument only — render() stays the byte-identical path lessons/tests depend on. */
  renderStereo(left: Float32Array, right: Float32Array, offset: number, n: number): void {
    this.updateControllers(n);
    const scratch = this.ensureScratch(n);
    for (const v of this.voices) {
      if (!v.active) continue;
      this.applyMod(v);
      scratch.fill(0, 0, n);
      v.render(this.cp, this.ctl, scratch, 0, n);
      const pan = Math.max(-1, Math.min(1, v.pan + v.modPan));
      const angle = (pan + 1) * 0.25 * Math.PI;
      const lg = Math.cos(angle);
      const rg = Math.sin(angle);
      for (let s = 0; s < n; s++) {
        const y = scratch[s];
        left[offset + s] += y * lg;
        right[offset + s] += y * rg;
      }
    }
  }

  status(): PartStatus {
    let latest: Voice | null = null;
    let count = 0;
    const notes: number[] = [];
    for (const v of this.voices) {
      if (!v.active) continue;
      count++;
      if (v.keyIsDown || v.sustained) notes.push(v.note);
      if (!latest || v.startedAt > latest.startedAt) latest = v;
    }
    const opLevels = [0, 0, 0, 0, 0, 0];
    if (latest) for (let i = 0; i < 6; i++) opLevels[i] = Math.min(1, latest.ampLevel[i] / 2);
    return { activeVoices: count, opLevels, notes };
  }
}
