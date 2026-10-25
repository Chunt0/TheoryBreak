// A granular looper rack module, after Hologram Electronics' Microcosm and its manual:
// eleven effects in four families (micro loops, granules, glitches, multi-tap delays),
// four variations each, steered by the pedal's three macro knobs — Activity (more or
// less of what the effect does), Repeats (how long it goes on), Shape (the volume or
// filter contour of every loop and grain, in four zones) — and timed by a tempo knob,
// tap or clock in six subdivisions. After the effect, in the pedal's order: pitch
// modulation, reverb and echo (Space), then a resonant low-pass; Mix blends that with
// the dry sound. A Hold sampler loops one unit of what you last played into the
// effects, and a 60-second phrase looper (overdub, undo, speed, reverse, fades, Burst,
// Quantize) sits after the effects or before them.
//
// Everything but the delays plays out of a ring of the last ~20 s of input: loops,
// grains and steps are voices that read it at their own speed and direction. Once you
// stop playing the ring stops filling, so an effect can go on repeating what you last
// played for as long as Repeats lets it.

import { BLOCK, HIGH, Mod, TAU, ftanh, onePole, type RackView } from './base';
import { COSM_EXP_IDS, MODULES, SUB_BEATS, fromNorm, shapeZone, snapSpeed, toNorm, type ModuleType, type ParamDef } from './modules';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const pick = (xs: readonly number[]): number => xs[Math.floor(Math.random() * xs.length)];
const bipolar = (): number => Math.random() * 2 - 1;

/** Looper states, as the screen shows them. */
export const LOOP_EMPTY = 0, LOOP_REC = 1, LOOP_PLAY = 2, LOOP_DUB = 3, LOOP_STOP = 4, LOOP_FADE = 5;
/**
 * One-shot presses, sent as the hidden `lcmd` param (sequence × 8 + command): the left
 * footswitch (record, play, overdub), the right (stop; held, erase), undo (the left held),
 * a tap of the tempo, and a Burst press and release.
 */
export const CMD_REC = 1, CMD_STOP = 2, CMD_ERASE = 3, CMD_UNDO = 4, CMD_TAP = 5, CMD_DOWN = 6, CMD_UP = 7;

/** Input above this (volts) counts as playing. */
const LOUD = 0.01;
const DEFS: Record<string, ParamDef> = Object.fromEntries(MODULES.cosm.params.map((q) => [q.id, q]));

/** Shape's zones as a voice envelope: attack and release (fractions of the voice) and curve (0 smooth, 1 quadratic). */
const ZONE_ENV = [
  [0.02, 0.02, 0], // ⊓ square: on, then off
  [0.92, 0.06, 1], // ⩘ ramp up: swells, then cuts
  [0.5, 0.5, 0], // ∧ triangle: in and out
  [0.012, 0.97, 1], // ⊼ ramp down: struck, dying away
];
/** Tunnel overlaps its loops by half: a level per zone so the four sit together. */
const ZONE_OVERLAP = [0.5, 0.85, 0.8, 0.85];

// Mosaic: each sampler's pass (in units of the subdivision) and speeds per variation
const MOSAIC_LEN = [1, 1, 2, 0.5, 1.5, 3];
const MOSAIC_RATE = [
  [1, 2, 1, 2, 1, 2],
  [1, 0.5, 1, 0.5, 1, 0.5],
  [2, 2, 2, 2, 2, 2],
  [0.5, 1, 2, 4, 1, 2],
];
const MOSAIC_PAN = [0, -0.5, 0.5, -0.8, 0.8, 0];
/** Glide: the two speeds each variation glides between */
const GLIDE = [[0.5, 1], [2, 0.5], [1, 2], [0.5, 2]];
/** Tunnel C: band-pass centres, as multiples of 180 Hz */
const TUNNEL_BANDS = [1, 1.5, 2, 3, 4, 6];
const SHIFTS = [0.5, 0.75, 1.5, 2];
const WILD = [-1, -2, 0.25, 2, 3, -0.5];
const ARP_RATES = [1, 2, 1, 0.5, 2, 1, 0.5, 2];
/** Pattern: tap times (in units) per variation; Warp's taps */
const PATTERN_TAPS = [
  [1, 2, 3, 4, 5, 6, 7, 8],
  [0.75, 1, 1.75, 2, 2.75, 3, 3.5, 4],
  [2 / 3, 1, 5 / 3, 2, 8 / 3, 3, 11 / 3, 4],
  [0.25, 0.5, 1, 1.25, 2, 2.5, 3.25, 4],
];
const WARP_TAPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
/** Warp C: each tap's pitch (+12, −12, +7, +12, +24, −5, +7, −12 semitones) */
const WARP_RATES = [2, 0.5, 1.5, 2, 4, 0.75, 1.5, 0.5];
/** sin² over half a cycle: the two read heads of a pitch-shifted tap cross-fade by it */
const SIN2 = Float32Array.from({ length: 1025 }, (_, i) => Math.sin((Math.PI * i) / 1024) ** 2);

/** Linear read from a power-of-two ring at a fractional position. */
function rd(buf: Float32Array, M: number, at: number): number {
  const j = Math.floor(at);
  const a = buf[j & M];
  return a + (buf[(j + 1) & M] - a) * (at - j);
}

/** One loop or grain: reads the input ring at its own speed under a window. */
class Voice {
  on = false;
  /** samples to wait before it starts (may span blocks) */
  wait = 0;
  pos = 0;
  rate = 1;
  age = 0;
  len = 1;
  /** 1 / attack and 1 / release, in samples; curve 0 eases both ends, 1 squares them (the ramps) */
  ia = 1;
  ir = 1;
  curve = 0;
  gain = 1;
  gl = 1;
  gr = 1;
  /** rate follows a Glide stream (-1 = fixed) */
  stream = -1;
  /** gain follows a Tunnel drone layer (-1 = none) */
  layer = -1;
  /** 0 no filter, 1 low-pass, 2 band-pass; the cutoff sweeps f0 → f1 over its life (fsh 1: f0 → f1 → f0) */
  fmode = 0;
  f0 = 1000;
  f1 = 1000;
  fsh = 0;
  k = 1.4;
  s1l = 0;
  s2l = 0;
  s1r = 0;
  s2r = 0;
  /** bit-crush step in volts (0 = clean), held for `hold` samples */
  crush = 0;
  hold = 1;
  hc = 0;
  hl = 0;
  hr = 0;
}

// Space: a ping-pong echo into an 8-line feedback delay network behind four all-passes a side
const FDN_MS = [29.7, 35.3, 41.9, 47.3, 53.1, 59.9, 66.1, 72.7];
const AP_MS = [12.6, 10.0, 7.7, 5.1];
/** (A) Bright Room (B) Dark Medium (C) Large Hall (D) Ambient: size, decay (s), damping (Hz), echo (ms) and its feedback, line wobble (samples) */
const ROOMS = [
  { size: 0.42, t60: 0.9, damp: 12000, echo: [83, 117], efb: 0.2, wob: 2 },
  { size: 0.75, t60: 2.2, damp: 2600, echo: [167, 241], efb: 0.3, wob: 3 },
  { size: 1.1, t60: 4.8, damp: 6500, echo: [293, 419], efb: 0.35, wob: 4 },
  { size: 1.4, t60: 15, damp: 4200, echo: [461, 653], efb: 0.45, wob: 10 },
];

class Space {
  private lines: Float32Array[] = [];
  private len = new Int32Array(8);
  private at = new Int32Array(8);
  private g = new Float64Array(8);
  private z = new Float64Array(8);
  private y = new Float64Array(8);
  private damp = 0.5;
  private aps: Float32Array[] = [];
  private apAt = new Int32Array(8);
  private mode = -1;
  private eL: Float32Array;
  private eR: Float32Array;
  private ew = 0;
  private ed0 = 1;
  private ed1 = 1;
  private efb = 0;
  private wob = 0;
  private ph = 0;
  private mo = new Float64Array(8);
  l = 0;
  r = 0;

  constructor(private sr: number) {
    const max = Math.ceil((FDN_MS[7] * 1.4 * sr) / 1000) + 4;
    for (let i = 0; i < 8; i++) this.lines.push(new Float32Array(max));
    for (let side = 0; side < 2; side++) for (const ms of AP_MS) this.aps.push(new Float32Array(Math.round(((ms + side * 0.6) * sr) / 1000)));
    this.eL = new Float32Array(Math.ceil(0.7 * sr));
    this.eR = new Float32Array(this.eL.length);
  }

  setMode(m: number): void {
    if (m === this.mode) return;
    this.mode = m;
    const room = ROOMS[m];
    for (let i = 0; i < 8; i++) {
      const len = Math.round((FDN_MS[i] * room.size * this.sr) / 1000);
      this.len[i] = len;
      this.at[i] %= len;
      this.g[i] = Math.pow(10, (-3 * len) / (room.t60 * this.sr));
    }
    this.damp = onePole(room.damp, this.sr);
    this.ed0 = Math.round((room.echo[0] * this.sr) / 1000);
    this.ed1 = Math.round((room.echo[1] * this.sr) / 1000);
    this.efb = room.efb;
    this.wob = room.wob;
  }

  /** Once a block: each line's length wobbles slowly, which keeps long tails from ringing metallic. */
  block(n: number): void {
    this.ph += n / this.sr;
    for (let i = 0; i < 8; i++) this.mo[i] = this.wob * (1 + Math.sin(TAU * this.ph * (0.11 + 0.037 * i) + i));
  }

  run(xl: number, xr: number): void {
    // the echo: left repeats come back on the right and the other way, and feed the reverb too
    const { eL, eR } = this;
    const E = eL.length;
    const w = this.ew;
    const a = w - this.ed0, b = w - this.ed1;
    const el = eL[a < 0 ? a + E : a], er = eR[b < 0 ? b + E : b];
    eL[w] = xl + er * this.efb;
    eR[w] = xr + el * this.efb;
    this.ew = w + 1 === E ? 0 : w + 1;
    xl += el * 0.5;
    xr += er * 0.5;
    const { aps, apAt } = this;
    for (let k = 0; k < 8; k++) {
      const buf = aps[k];
      const j = apAt[k];
      const x = k < 4 ? xl : xr;
      const d = buf[j];
      const y = d - 0.6 * x;
      buf[j] = x + 0.6 * y;
      apAt[k] = j + 1 === buf.length ? 0 : j + 1;
      if (k < 4) xl = y;
      else xr = y;
    }
    const { lines, at, len, g, z, y, mo } = this;
    const damp = this.damp;
    for (let i = 0; i < 8; i++) {
      // read a little short of the full length, by the wobble
      const L = len[i];
      let q = at[i] + mo[i];
      if (q >= L) q -= L;
      const j = Math.floor(q);
      const line = lines[i];
      const v0 = line[j];
      const v = v0 + (line[j + 1 === L ? 0 : j + 1] - v0) * (q - j);
      y[i] = v;
      z[i] += (v - z[i]) * damp;
    }
    // Hadamard mix of the damped lines (orthonormal, so the network only loses energy through g)
    const a0 = z[0] * g[0], a1 = z[1] * g[1], a2 = z[2] * g[2], a3 = z[3] * g[3];
    const a4 = z[4] * g[4], a5 = z[5] * g[5], a6 = z[6] * g[6], a7 = z[7] * g[7];
    const b0 = a0 + a1, b1 = a0 - a1, b2 = a2 + a3, b3 = a2 - a3, b4 = a4 + a5, b5 = a4 - a5, b6 = a6 + a7, b7 = a6 - a7;
    const c0 = b0 + b2, c2 = b0 - b2, c1 = b1 + b3, c3 = b1 - b3, c4 = b4 + b6, c6 = b4 - b6, c5 = b5 + b7, c7 = b5 - b7;
    const s = 0.35355339;
    const il = xl * 0.5 + 1e-20, ir = xr * 0.5 + 1e-20;
    lines[0][at[0]] = (c0 + c4) * s + il;
    lines[1][at[1]] = (c1 + c5) * s + ir;
    lines[2][at[2]] = (c2 + c6) * s + il;
    lines[3][at[3]] = (c3 + c7) * s + ir;
    lines[4][at[4]] = (c0 - c4) * s + il;
    lines[5][at[5]] = (c1 - c5) * s + ir;
    lines[6][at[6]] = (c2 - c6) * s + il;
    lines[7][at[7]] = (c3 - c7) * s + ir;
    for (let i = 0; i < 8; i++) at[i] = at[i] + 1 >= len[i] ? 0 : at[i] + 1;
    this.l = (y[0] - y[2] + y[4] - y[6]) * 0.6 + el * 0.45;
    this.r = (y[1] - y[3] + y[5] - y[7]) * 0.6 + er * 0.45;
  }
}

class CosmMod extends Mod {
  // the input ring
  private readonly HL: number;
  private readonly HM: number;
  private hl: Float32Array;
  private hr: Float32Array;
  /** samples written so far (the ring's write position, unwrapped) */
  private now = 0;
  /** the ring's loudest sample per 256 */
  private pk: Float32Array;
  private frozen = false;
  /** frozen segment: start, length, and the play head that feeds the delays */
  private fs = 0;
  private fl = 1;
  private fp = 0;
  /** long quiet: the ring has stopped filling, so what was last played stays */
  private paused = false;
  /** ring position just after the last sound loud enough to count as playing */
  private lastLoud = 0;
  /** samples since then (not counting while held) */
  private quietN = 0;
  /** Repeats' fade: the level a new voice starts at, given how long it has been quiet */
  private tail = 1;

  // per block
  private dryL = new Float32Array(BLOCK);
  private dryR = new Float32Array(BLOCK);
  private liveL = new Float32Array(BLOCK);
  private liveR = new Float32Array(BLOCK);
  private wl = new Float32Array(BLOCK);
  private wr = new Float32Array(BLOCK);
  private act = 0.5;
  private rep = 0.5;
  private zone = 2;
  private atk = 0.5;
  private rel = 0.5;
  private curve = 0;
  private level = 0.8;
  private rev = false;
  private lonly = false;
  private fx = -1;
  private vr = -1;

  // tempo: beat length in samples, the transport in beats, the clock input
  private B: number;
  private divB = 1;
  private U: number;
  private tp = 0;
  private started = false;
  private clkLast = 0;
  private clkAge = 1e9;
  private pulse = 1;
  private loopHi = false;

  // onsets: fast and slow envelopes of the input, and the last 16 attacks
  private ef = 0;
  private es = 0;
  private refr = 0;
  private ons = new Float64Array(16);
  private onW = 0;
  private quiet = 0;
  private nbuf = new Float64Array(8);

  private pool = Array.from({ length: 32 }, () => new Voice());
  /** per grid: the last step that fired */
  private last = new Float64Array(8).fill(-Infinity);

  // effect state
  private sstart = new Float64Array(6);
  private slen = new Float64Array(6);
  private reps = new Float64Array(6);
  private step = 0;
  private pat = new Int32Array(8);
  private anchor = 0;
  private grs = 0;
  private grl = 0;
  private gsc = 0;
  private gcnt = 0;
  private gph = 0;
  private streamRate = new Float64Array(2);
  private hcnt = 0;
  private hsh = 0;
  private trs = new Float64Array(2);
  private trl = new Float64Array(2);
  private tcur = 0;
  private tlen = 0;
  private tL = 0;
  private tF = 1000;
  private tg = 0;
  private layerGain = new Float64Array(2);
  private chain = 0;
  private cidx = 0;
  private burst = 0;
  private bsrc = 0;
  private bg = 1;
  private bidx = 0;
  private inter = 0;
  private duck = 0;
  private duckT = 0;

  // multidelay
  private dl: Float32Array | null = null;
  private dr: Float32Array | null = null;
  private dw = 0;
  /** per tap: delay, gain, pan, speed, window, filter coefficients; read-head phase, filter state */
  private tD = new Float64Array(8);
  private tG = new Float64Array(8);
  private tPL = new Float64Array(8);
  private tPR = new Float64Array(8);
  private tR = new Float64Array(8);
  private tW = new Float64Array(8);
  private tC = new Float64Array(32);
  private tph = new Float64Array(8);
  private ty0 = 0;
  private ty1 = 0;
  private tst = new Float64Array(32);
  private dfl = 0;
  private dfr = 0;
  private efol = 0;

  // pitch modulation: a short swept delay on the effect
  private readonly MM: number;
  private mbL: Float32Array;
  private mbR: Float32Array;
  private mw = 0;
  private mA = 0;
  private mph = 0;

  // filter, space
  private f1l = 0;
  private f2l = 0;
  private f1r = 0;
  private f2r = 0;
  private space: Space;

  // looper: the first phrase, and the overdub layer on top (undo clears it)
  private readonly LL: number;
  private lbL: Float32Array | null = null;
  private lbR: Float32Array | null = null;
  private odL: Float32Array | null = null;
  private odR: Float32Array | null = null;
  private odOn = false;
  private lstate = LOOP_EMPTY;
  private llen = 0;
  private lpos = 0;
  private lrec = 0;
  private lquant = 0;
  private lnext = -1;
  /** fade level, and how far it moves a sample */
  private lg = 1;
  private lrate = 1;
  /** playback speed, negative in reverse */
  private lspeed = 1;
  private lo0 = 0;
  private lo1 = 0;
  private lastCmd = 0;

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    this.HL = 1 << Math.ceil(Math.log2(sr * 20));
    this.HM = this.HL - 1;
    this.hl = new Float32Array(this.HL);
    this.hr = new Float32Array(this.HL);
    this.pk = new Float32Array(this.HL >> 8);
    this.LL = Math.round(sr * 60);
    this.B = (60 * sr) / this.p.time;
    this.U = this.B;
    this.MM = (1 << Math.ceil(Math.log2(0.06 * sr))) - 1;
    this.mbL = new Float32Array(this.MM + 1);
    this.mbR = new Float32Array(this.MM + 1);
    this.space = new Space(sr);
    // looper buttons arrive here; not a knob, so never saved with the patch
    this.p.lcmd = 0;
  }

  /** A knob's value, plus the EXP jack if it is assigned there (10 V sweeps the knob's whole travel). */
  private knob(id: string, exp: string, cv: number): number {
    const v = this.p[id];
    return id === exp ? fromNorm(DEFS[id], toNorm(DEFS[id], v) + cv) : v;
  }

  process(n: number): void {
    this.setCh(1);
    const p = this.p;
    const sr = this.sr;
    const { l, r, clock, freeze, loop, act: expIn } = this.ins;
    if (p.lcmd !== this.lastCmd) {
      this.lastCmd = p.lcmd;
      this.command(Math.round(p.lcmd) & 7);
    }

    // knobs, once a block
    const exp = expIn.on ? COSM_EXP_IDS[clamp(Math.round(p.exp), 0, COSM_EXP_IDS.length - 1)] : '';
    const cv = expIn.on ? expIn.buf[expIn.off(0)] / 10 : 0;
    this.act = this.knob('act', exp, cv);
    this.rep = this.knob('rep', exp, cv);
    const zone = shapeZone(this.knob('shape', exp, cv));
    const env = ZONE_ENV[zone];
    this.zone = zone;
    this.atk = env[0];
    this.rel = env[1];
    this.curve = env[2];
    const filter = this.knob('filter', exp, cv), mix = this.knob('mix', exp, cv), space = this.knob('space', exp, cv);
    this.level = this.knob('loop', exp, cv);
    this.rev = p.rev >= 0.5;
    const fx = clamp(Math.round(p.fx), 0, 10);
    const vr = clamp(Math.round(p.var), 0, 3);
    const lonly = p.lonly >= 0.5;
    if ((fx !== this.fx || (lonly && !this.lonly)) && this.fx >= 0) this.releaseAll();
    this.lonly = lonly;
    if (fx !== this.fx) {
      this.fx = fx;
      this.vr = -1;
    }
    if (vr !== this.vr) {
      this.vr = vr;
      this.resetEffect();
    }
    // tempo: the Clock jack if patched, else the knob (taps set it), eased into as the pedal does
    if (!clock.on) {
      const want = (60 * sr) / clamp(p.time, 20, 400);
      this.B = this.started ? this.B + (want - this.B) * (1 - Math.exp(-n / (0.3 * sr))) : want;
      if (Math.abs(want - this.B) < 0.01) this.B = want;
    }
    this.started = true;
    this.divB = SUB_BEATS[clamp(Math.round(p.sub), 0, SUB_BEATS.length - 1)];
    this.U = this.B * this.divB;
    const frz = p.freeze >= 0.5 || (freeze.on && freeze.buf[freeze.off(0)] >= HIGH);
    if (frz !== this.frozen) this.setFrozen(frz);
    this.tail = this.tailGain();
    if (fx === 2) this.prepGlide(n);
    if (fx === 4) this.prepTunnel(n);
    const pre = p.pre >= 0.5, burst = p.burst >= 0.5;
    this.lspeed = snapSpeed(clamp(p.speed, 0.25, 4)) * (p.lrev >= 0.5 ? -1 : 1);

    // input: into the ring, onsets, clock, transport, and the effect's events
    const { hl, hr, HM, wl, wr, dryL, dryR, liveL, liveR } = this;
    const co = clock.off(0), lo = loop.off(0);
    for (let i = 0; i < n; i++) {
      wl[i] = wr[i] = 0;
      let xl = this.sum(l, i);
      let xr = r.on ? this.sum(r, i) : xl;
      if (pre) {
        this.loopTick(xl, xr);
        xl += this.lo0;
        xr += this.lo1;
      }
      dryL[i] = xl;
      dryR[i] = xr;
      if (clock.on) {
        const c = clock.buf[co + i];
        if (c >= HIGH && this.clkLast < HIGH) this.clockEdge();
        this.clkLast = c;
        this.clkAge++;
      }
      if (loop.on) {
        const hi = loop.buf[lo + i] >= HIGH;
        if (hi !== this.loopHi) {
          this.loopHi = hi;
          if (burst) this.command(hi ? CMD_DOWN : CMD_UP);
          else if (hi) this.command(CMD_REC);
        }
      }
      const a = Math.max(xl < 0 ? -xl : xl, xr < 0 ? -xr : xr);
      if (this.frozen) {
        this.quietN = 0;
        const j = this.fp & HM;
        liveL[i] = hl[j];
        liveR[i] = hr[j];
        if (++this.fp >= this.fs + this.fl) this.fp = this.fs;
      } else {
        if (a > LOUD) {
          // playing again after a pause: every loop takes in the new sound
          if (this.quietN > 0.25 * sr) this.reps.fill(0);
          this.quietN = 0;
          this.paused = false;
        } else if (++this.quietN > 2 * sr && !this.paused) this.pause();
        if (!this.paused) {
          const j = this.now & HM;
          hl[j] = xl;
          hr[j] = xr;
          if (!(j & 255)) this.pk[j >> 8] = a;
          else if (a > this.pk[j >> 8]) this.pk[j >> 8] = a;
          this.now++;
          if (a > LOUD) this.lastLoud = this.now;
        }
        liveL[i] = xl;
        liveR[i] = xr;
        this.detect((xl + xr) * 0.5);
      }
      this.tp += 1 / this.B;
      if (!lonly) this.tick(i);
    }

    if (lonly) {
      // Looper only: the effects are muted, and the dry sound goes on through modulation, reverb and filter
      for (let i = 0; i < n; i++) {
        wl[i] = dryL[i];
        wr[i] = dryR[i];
      }
    } else {
      this.renderVoices(n);
      if (fx >= 9) this.delays(n, fx === 10);
      if (fx === 7) {
        for (let i = 0; i < n; i++) {
          this.duck += (this.duckT - this.duck) * 0.01;
          const g = 1 - this.duck;
          wl[i] += liveL[i] * g;
          wr[i] += liveR[i] * g;
        }
      }
    }

    // the effect chain after the effect, as on the pedal: modulation, reverb, filter
    this.modulate(n);
    if (space > 0.001) {
      // Space: reverb and echo mixed in; fully up, all wet
      const sd = Math.min(1, 2 - 2 * space), sw = Math.min(1, 2 * space);
      const sp = this.space;
      sp.setMode(clamp(Math.round(p.verb), 0, 3));
      sp.block(n);
      for (let i = 0; i < n; i++) {
        sp.run(wl[i], wr[i]);
        wl[i] = wl[i] * sd + sp.l * sw;
        wr[i] = wr[i] * sd + sp.r * sw;
      }
    }
    if (filter < 19500) {
      // the resonant low-pass ends the chain: open fully up, closing to nothing fully down
      const kill = clamp((filter - 20) / 60, 0, 1);
      const gg = Math.tan((Math.PI * Math.min(filter, sr * 0.45)) / sr);
      const k = 2 - 1.88 * p.res;
      const a1 = 1 / (1 + gg * (gg + k)), a2 = gg * a1, a3 = gg * a2;
      let s1l = this.f1l, s2l = this.f2l, s1r = this.f1r, s2r = this.f2r;
      for (let i = 0; i < n; i++) {
        let v3 = wl[i] - s2l;
        let v1 = a1 * s1l + a2 * v3;
        let v2 = s2l + a2 * s1l + a3 * v3;
        s1l = 2 * v1 - s1l;
        s2l = 2 * v2 - s2l;
        wl[i] = v2 * kill;
        v3 = wr[i] - s2r;
        v1 = a1 * s1r + a2 * v3;
        v2 = s2r + a2 * s1r + a3 * v3;
        s1r = 2 * v1 - s1r;
        s2r = 2 * v2 - s2r;
        wr[i] = v2 * kill;
      }
      this.f1l = Number.isFinite(s1l) ? s1l : 0;
      this.f2l = Number.isFinite(s2l) ? s2l : 0;
      this.f1r = Number.isFinite(s1r) ? s1r : 0;
      this.f2r = Number.isFinite(s2r) ? s2r : 0;
    }

    // Mix: dry against the effect (at its own volume), then the looper after the effects, out
    const dg = Math.min(1, 2 - 2 * mix), eg = Math.min(1, 2 * mix) * p.vol;
    const oL = this.outs.l.buf, oR = this.outs.r.buf;
    for (let i = 0; i < n; i++) {
      let yl = dryL[i] * dg + wl[i] * eg;
      let yr = dryR[i] * dg + wr[i] * eg;
      if (!pre) {
        this.loopTick(yl, yr);
        yl += this.lo0;
        yr += this.lo1;
      }
      oL[i] = 6 * ftanh(yl / 6);
      oR[i] = 6 * ftanh(yr / 6);
    }
  }

  override view(): RackView {
    const st = this.lstate;
    return {
      k: 'cosm',
      bpm: Math.round((600 * this.sr) / this.B) / 10,
      beat: Math.floor(this.tp) & 3,
      loop: st,
      pos: st === LOOP_REC ? 1 : this.llen ? this.lpos / this.llen : 0,
      len: (st === LOOP_REC ? this.lrec : this.llen) / this.sr,
      frozen: this.frozen,
      dub: this.odOn,
      clk: this.ins.clock.on,
    };
  }

  // ------------------------------------------------------------- plumbing

  /** True once each time the transport moves into a new step of `beats` on grid k. */
  private crossed(k: number, beats: number): boolean {
    const s = Math.floor(this.tp / beats);
    const last = this.last[k];
    if (s > last) {
      this.last[k] = s;
      return true;
    }
    // a big jump back is a new grid (tempo or subdivision changed); a small one is the clock nudging
    if (s < last - 1) this.last[k] = s;
    return false;
  }

  /** Repeats while you play: passes of a slice before it takes in new sound (1 to 16). */
  private repeats(): number {
    return 1 + Math.floor(this.rep * this.rep * 15);
  }

  /**
   * Repeats once you stop: each new loop or grain starts quieter the longer it has been quiet,
   * from a fifth of a second to a quarter of a minute to fall 60 dB, and fully up not at all.
   */
  private tailGain(): number {
    if (this.frozen || this.fx === 5) return 1; // Hold sustains; Strum's chains fade by themselves
    const rep = this.fx === 7 ? 0.5 : this.rep; // Interrupt's Repeats is how often it cuts in instead
    if (rep >= 0.97) return 1;
    return Math.exp((-6.9 * this.quietN) / (0.2 * Math.pow(2, rep * 6.7) * this.sr));
  }

  /** Where the effects take sound from: the newest while you play, and once you stop, the end of what you played. */
  private head(): number {
    return Math.min(this.now, this.lastLoud);
  }

  /** Long quiet: stop filling the ring, so what was played last stays; silence what lies past the write head (the oldest sound). */
  private pause(): void {
    this.paused = true;
    const { hl, hr, pk, HL } = this;
    const Z = Math.min(Math.round(4 * this.sr), HL >> 2);
    const a = this.now & this.HM;
    const b = a + Z;
    hl.fill(0, a, Math.min(b, HL));
    hr.fill(0, a, Math.min(b, HL));
    if (b > HL) {
      hl.fill(0, 0, b - HL);
      hr.fill(0, 0, b - HL);
    }
    const M = pk.length - 1;
    for (let c = (this.now >> 8) + 1; c <= (this.now + Z) >> 8; c++) pk[c & M] = 0;
  }

  /** Would a span starting at `start` be overwritten within `ahead` samples? */
  private stale(start: number, ahead: number): boolean {
    return !this.frozen && this.now - start + ahead > this.HL - 2048;
  }

  /** Longest a voice from `pos` at `rate` (forward, or backward from its end if Reverse) can play before reading unwritten sound. */
  private room(pos: number, rate: number): number {
    if (this.frozen) return Infinity;
    const ahead = this.now - 8 - pos;
    if (this.rev || this.paused) return ahead / Math.abs(rate);
    return rate > 1 ? ahead / (rate - 1) : Infinity;
  }

  /** Where the loudest stretch between two ring positions starts (to the nearest 256 samples). */
  private loudest(from: number, to: number): number {
    const M = this.pk.length - 1;
    let best = to;
    let most = -1;
    for (let c = Math.max(0, Math.ceil(from / 256)); c * 256 <= to; c++) {
      if (this.pk[c & M] > most) {
        most = this.pk[c & M];
        best = c * 256;
      }
    }
    return best;
  }

  /** Is there sound in at least a quarter of the ring from `start` for `len` samples? (Not worth looping otherwise.) */
  private heard(start: number, len: number): boolean {
    const from = Math.floor(start) >> 8;
    const to = Math.floor(start + len) >> 8;
    const M = this.pk.length - 1;
    let loud = 0;
    for (let c = Math.max(0, from); c <= to && c << 8 < this.now; c++) if (this.pk[c & M] > 0.02) loud++;
    return loud * 4 >= to - from + 1;
  }

  private voice(at: number, pos: number, rate: number, len: number, atk: number, rel: number, gain: number, pan: number): Voice {
    let v = this.pool[0];
    let worst = -1;
    for (const x of this.pool) {
      if (!x.on) {
        v = x;
        break;
      }
      const done = x.age / x.len;
      if (done > worst) {
        worst = done;
        v = x;
      }
    }
    v.on = true;
    v.wait = Math.max(0, Math.round(at));
    v.pos = pos;
    v.rate = rate;
    v.age = 0;
    v.len = Math.max(16, len);
    // fades of at least 2 ms (or a quarter of a short voice), so no edge clicks
    const edge = Math.min(0.002 * this.sr, v.len * 0.25);
    v.ia = 1 / Math.max(edge, atk * v.len);
    v.ir = 1 / Math.max(edge, rel * v.len);
    v.curve = 0;
    v.gain = gain * this.tail;
    const a = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
    v.gl = Math.cos(a) * Math.SQRT2;
    v.gr = Math.sin(a) * Math.SQRT2;
    v.stream = -1;
    v.layer = -1;
    v.fmode = 0;
    v.fsh = 0;
    v.crush = 0;
    v.hc = 0;
    v.s1l = v.s2l = v.s1r = v.s2r = 0;
    return v;
  }

  /** A voice under Shape's contour. */
  private shaped(at: number, pos: number, rate: number, len: number, gain: number, pan: number): Voice {
    const v = this.voice(at, pos, rate, len, this.atk, this.rel, gain, pan);
    v.curve = this.curve;
    return v;
  }

  private lowpass(v: Voice, hz: number, k: number): void {
    v.fmode = 1;
    v.f0 = v.f1 = hz;
    v.k = k;
  }

  /** A low-pass swept over the voice's life along Shape's contour (opening, opening and closing, closing); on Square, up or down as `up` says. */
  private sweep(v: Voice, up: boolean, lo: number, hi: number, k: number): void {
    const z = this.zone;
    const rise = z === 0 ? up : z !== 3;
    v.fmode = 1;
    v.k = k;
    v.f0 = rise ? lo : hi;
    v.f1 = rise ? hi : lo;
    v.fsh = z === 2 ? 1 : 0;
  }

  private crushed(v: Voice, step: number, hold: number): void {
    v.crush = step;
    v.hold = hold;
  }

  /** Fade every voice out over 10 ms (on a change of effect). */
  private releaseAll(): void {
    const t = 0.01 * this.sr;
    for (const v of this.pool) {
      if (!v.on) continue;
      if (v.wait > 0) {
        v.on = false;
        continue;
      }
      if (v.len - v.age > t) v.len = v.age + t;
      v.ir = 1 / t;
    }
  }

  private resetEffect(): void {
    this.last.fill(-Infinity);
    this.reps.fill(0);
    this.step = 0;
    this.anchor = 0;
    this.grl = 0;
    this.gcnt = 0;
    this.hcnt = 0;
    this.hsh = this.head();
    this.trl.fill(0);
    this.tlen = 0;
    this.chain = 0;
    this.burst = 0;
    this.inter = 0;
    this.duckT = 0;
    this.layerGain.fill(0);
  }

  /** Hold: loop one unit of the subdivision of what was last played, and feed the effects that instead of the input. */
  private setFrozen(on: boolean): void {
    this.frozen = on;
    if (!on) return;
    const sr = this.sr;
    const end = this.head();
    const fl = Math.max(64, Math.min(clamp(this.U, 0.05 * sr, 4 * sr), this.HL * 0.2, end));
    this.fl = Math.floor(fl);
    this.fs = end - this.fl;
    this.fp = this.fs;
    // cross-fade the segment's end into what came just before its start, so the cycle has no seam
    const X = Math.min(1024, this.fl >> 2);
    if (this.fs >= X) {
      const { hl, hr, HM } = this;
      for (let k = 0; k < X; k++) {
        const t = k / X;
        const e = (end - X + k) & HM;
        const b = (this.fs - X + k) & HM;
        hl[e] = hl[e] * (1 - t) + hl[b] * t;
        hr[e] = hr[e] * (1 - t) + hr[b] * t;
      }
    }
  }

  private clockEdge(): void {
    const I = this.clkAge;
    this.clkAge = 0;
    const sr = this.sr;
    if (I < 0.02 * sr || I > 8 * sr) return;
    // any pulse rate counts: fold it into 60–180 bpm
    let b = I;
    while (b < sr / 3) b *= 2;
    while (b > sr) b /= 2;
    this.B = b;
    this.pulse = I / b;
    const snap = Math.round(this.tp / this.pulse) * this.pulse;
    if (Math.abs(snap - this.tp) < this.pulse / 2) this.tp = snap;
  }

  /** Attacks in the input: the fast envelope jumping well above the slow one. */
  private detect(x: number): void {
    const a = x < 0 ? -x : x;
    this.ef += (a - this.ef) * (a > this.ef ? 0.02 : 0.0007);
    this.es += (a - this.es) * 0.0001;
    if (this.refr > 0) {
      this.refr--;
      return;
    }
    if (this.ef > 0.08 && this.ef > this.es * 1.8 + 0.03) {
      this.refr = Math.round(0.08 * this.sr);
      this.ons[this.onW++ & 15] = this.now - Math.round(0.004 * this.sr);
      this.quiet = 0;
      this.onset();
    }
  }

  /** The `k` most recent attacks, newest first, into nbuf; the beats just played if none. */
  private recent(k: number): number {
    let c = 0;
    const count = Math.min(this.onW, 16);
    for (let j = 0; j < count && c < k; j++) {
      const at = this.ons[(this.onW - 1 - j) & 15];
      if (this.stale(at, 3 * this.sr)) break;
      this.nbuf[c++] = at;
    }
    if (c === 0) {
      const step = Math.min(this.U * 0.5, this.HL * 0.025);
      const head = this.head();
      for (; c < k; c++) this.nbuf[c] = head - (c + 1) * step;
    }
    return c;
  }

  // -------------------------------------------------------------- effects

  private tick(i: number): void {
    switch (this.fx) {
      case 0: this.mosaic(i); break;
      case 1: this.seq(i); break;
      case 2: this.glide(i); break;
      case 3: this.haze(i); break;
      case 4: this.tunnel(i); break;
      case 5: this.strum(i); break;
      case 6: this.blocks(i); break;
      case 7: this.interrupt(i); break;
      case 8: this.arp(i); break;
      default: break;
    }
  }

  private onset(): void {
    if (this.fx === 5) {
      this.chain = 1;
      this.cidx = 0;
    } else if (this.fx === 6) this.burstStart();
    else if (this.fx === 4 && this.vr === 3) {
      const L0 = clamp(this.U / 8, 0.025 * this.sr, 0.4 * this.sr);
      this.tlen = L0 * Math.pow(2, bipolar() * (0.5 + 1.5 * this.act));
      this.tunnelCapture(this.tlen);
      this.gcnt = Math.min(this.gcnt, 1);
    }
  }

  /** Mosaic: up to six samplers loop the latest slice at their own speeds, side by side. */
  private mosaic(i: number): void {
    const n = 1 + Math.round(this.act * 5);
    const head = this.head();
    for (let k = 0; k < n; k++) {
      const beats = MOSAIC_LEN[k] * this.divB;
      if (!this.crossed(k, beats)) continue;
      const rate = MOSAIC_RATE[this.vr][k];
      let pass = beats * this.B;
      let src = pass * rate;
      const cap = this.HL * 0.2;
      if (src > cap) {
        src = cap;
        pass = src / rate;
      }
      if (this.reps[k] <= 0 || Math.abs(this.slen[k] - src) > 1 || this.stale(this.sstart[k], pass) || !this.heard(this.sstart[k], src)) {
        this.sstart[k] = head - src - 64;
        this.slen[k] = src;
        this.reps[k] = this.repeats();
      }
      this.reps[k]--;
      const s = this.sstart[k];
      this.shaped(i, this.rev ? s + src : s, this.rev ? -rate : rate, pass, 0.9 / Math.sqrt(n), MOSAIC_PAN[k]);
    }
  }

  /** Seq: the last eight steps cut up and played back in a new order. */
  private seq(i: number): void {
    const stepB = this.divB / 2;
    if (!this.crossed(0, stepB)) return;
    const act = this.act, vr = this.vr;
    const S = Math.min(stepB * this.B, (this.HL * 0.25) / 9);
    const j = this.step++ & 7;
    this.anchor = this.head();
    // Repeats: how many times the order comes round before it is reshuffled
    if (j === 0 && --this.reps[0] <= 0) {
      this.reps[0] = this.repeats();
      for (let k = 0; k < 8; k++) this.pat[k] = 1 + Math.floor(Math.random() * 8);
    }
    // C stacks up to four layers; D interlocks up to three parts: the pattern, ratchets on the off-steps, a part every third step
    const layers = vr === 2 ? 1 + Math.round(act * 3) : vr === 3 ? 1 + Math.round(act * 2) : 1;
    for (let L = 0; L < layers; L++) {
      if (vr === 3 && ((L === 1 && !(j & 1)) || (L === 2 && j % 3 !== 0))) continue;
      const back = this.pat[(j + L * 3) & 7];
      const rate = vr === 1 && Math.random() < act * 0.8 ? 0.5 : 1;
      const pos = this.anchor - back * S;
      const len = vr === 3 && L === 1 ? S / 2 : S;
      const pan = (back & 1 ? 0.3 : -0.3) * (L + 1);
      const v = this.shaped(i, this.rev ? pos + len * rate : pos, this.rev ? -rate : rate, len, 0.9 / Math.sqrt(layers), pan);
      if (vr === 0 && Math.random() < 0.25 + 0.75 * act) this.lowpass(v, 250 * Math.pow(2, Math.random() * 5), 2 - 1.5 * act * Math.random());
      else if (vr === 2) this.sweep(v, ((L + j) & 1) === 1, 200, 7000, 1.2);
      else if (vr === 3) {
        this.crushed(v, 0.15 + 0.15 * L + 0.15 * Math.random(), 3 + 2 * L + Math.floor(Math.random() * 3));
        // the ratchet: the same slice again in the second half of the step
        if (L === 1) this.crushed(this.shaped(i + len, v.pos, v.rate, len, 0.8, -pan), v.crush, v.hold);
      }
    }
    if (vr === 1 && act > 0.9 && (j & 3) === 0) {
      // fully up: soft pads, a long half-speed swell under the pattern
      const pos = this.anchor - 4 * S;
      this.lowpass(this.voice(i, this.rev ? pos + 2 * S : pos, this.rev ? -0.5 : 0.5, 4 * S, 0.45, 0.45, 0.45, 0), 1800, 1.4);
    }
    if (vr === 3 && act > 0.9 && (j & 1) === 0) {
      // fully up: crushed samples an octave down
      const pos = this.anchor - this.pat[j] * S;
      this.crushed(this.shaped(i, this.rev ? pos + S / 2 : pos, this.rev ? -0.5 : 0.5, S, 0.5, 0), 0.4, 6);
    }
  }

  private prepGlide(n: number): void {
    // Activity: how fast the pitch glides, from eight units a sweep to four sweeps a unit
    const period = this.U * Math.pow(2, 3 - 5 * this.act);
    this.gph = (this.gph + n / period) % 1;
    const ph = this.gph;
    // Shape: the glide's pattern — jump, rise, rise and fall, fall
    const z = this.zone;
    const l = z === 0 ? (ph < 0.5 ? 0 : 1) : z === 1 ? ph : z === 2 ? 1 - Math.abs(2 * ph - 1) : 1 - ph;
    const [r0, r1] = GLIDE[this.vr];
    const sign = this.rev ? -1 : 1;
    this.streamRate[0] = sign * r0 * Math.pow(r1 / r0, l);
    this.streamRate[1] = sign * r0 * Math.pow(r1 / r0, 1 - l);
  }

  /** Glide: grains scan a short loop while their speed glides between two settings. */
  private glide(i: number): void {
    const sr = this.sr;
    if (this.crossed(0, this.divB) && (--this.reps[0] <= 0 || this.stale(this.grs, this.grl) || !this.heard(this.grs, this.grl))) {
      this.grl = Math.min(2 * this.U, this.HL * 0.15);
      this.grs = this.head() - this.grl - 8;
      this.reps[0] = this.repeats();
      this.gsc = this.grs;
    }
    if (this.grl <= 0) return;
    this.gsc += this.rev ? -1 : 1;
    if (this.gsc >= this.grs + this.grl) this.gsc -= this.grl;
    else if (this.gsc < this.grs) this.gsc += this.grl;
    if (--this.gcnt > 0) return;
    const G = clamp(this.U / 4, 0.04 * sr, 0.16 * sr);
    this.gcnt = G / 3;
    const [r0, r1] = GLIDE[this.vr];
    const span = G * Math.max(r0, r1) * 1.1;
    const streams = this.vr === 3 ? 2 : 1;
    const end = this.grs + this.grl;
    for (let s = 0; s < streams; s++) {
      const start = this.rev ? clamp(this.gsc, this.grs + span, end) : clamp(this.gsc, this.grs, end - span);
      const v = this.voice(i, start, this.streamRate[s], G, 0.5, 0.5, 0.65 / Math.sqrt(streams), streams > 1 ? (s ? 0.4 : -0.4) : 0);
      v.stream = s;
    }
  }

  /** Haze: a cloud of grains from what was just played. */
  private haze(i: number): void {
    const sr = this.sr, act = this.act, vr = this.vr;
    const head = this.head();
    // grain length follows the subdivision: long overlapping grains at ¼×, blips at 8×
    const G = clamp(this.U / 4, 0.025 * sr, 0.4 * sr);
    // Activity: density, and spread — how far back the cloud reaches and how wide it sits
    const W = Math.min((0.1 + act * 3.4) * sr, this.HL * 0.2);
    // A: a read head creeping through the past at a quarter speed, the sound stretched: while you play it
    // falls behind and jumps back to the newest; once you stop it reaches the end and starts over from the oldest
    this.hsh += 0.25;
    if (this.hsh > head - G * 1.1) this.hsh = head - W - G;
    else if (head - this.hsh > W + G) this.hsh = head - G * 1.1;
    if (--this.hcnt > 0) return;
    const d = Math.min(3 + act * act * 100, (28 * sr) / G);
    this.hcnt = Math.max(1, (-Math.log(1 - Math.random()) * sr) / d);
    const rate = vr === 2 ? (Math.random() < 0.5 ? 2 : 1) : vr === 3 ? (Math.random() < 0.5 ? 0.5 : 1) : 1;
    const span = G * rate;
    let pos = vr === 0 ? this.hsh + bipolar() * 0.02 * sr * (0.3 + act) : head - span - 8 - Math.random() * W;
    if (this.room(pos, rate) < G) pos = head - 8 - span;
    this.shaped(i, this.rev ? pos + span : pos, this.rev ? -rate : rate, G, 1.1 / Math.sqrt(Math.max(1, (d * G) / sr)), bipolar() * (0.2 + 0.8 * act));
  }

  private prepTunnel(n: number): void {
    const sr = this.sr, act = this.act;
    const L0 = clamp(this.U / 8, 0.025 * sr, 0.4 * sr);
    this.tL = this.vr === 3 && this.tlen ? this.tlen : this.vr === 0 ? L0 * Math.pow(2, act * 1.5 * Math.sin((TAU * this.tp) / (4 * this.divB))) : L0;
    this.tF = 250 * Math.pow(2, act * 5 * (0.5 + 0.5 * Math.sin((TAU * this.tp) / (8 * this.divB))));
    // a new drone swells in over the old one across half a unit
    const step = n / (0.5 * this.U + 0.02 * sr);
    for (let c = 0; c < 2; c++) {
      const to = c === this.tcur ? 1 : 0;
      const g = this.layerGain[c];
      this.layerGain[c] = g < to ? Math.min(to, g + step) : Math.max(to, g - step);
    }
  }

  private tunnelCapture(L: number): void {
    const L0 = clamp(this.U / 8, 0.025 * this.sr, 0.4 * this.sr);
    this.tcur ^= 1;
    // the loudest moment of the last unit, far enough back for the longest loop Variation A stretches to
    const latest = this.head() - Math.max(L * 1.05, L0 * 2.9) - 8;
    this.trs[this.tcur] = this.loudest(latest - this.U, latest);
    this.trl[this.tcur] = L;
    this.reps[0] = this.repeats();
  }

  /** Tunnel: a micro-loop repeated into a drone, refreshed every so often. */
  private tunnel(i: number): void {
    const act = this.act, vr = this.vr;
    const c0 = this.tcur;
    if (this.crossed(0, this.divB) && (--this.reps[0] <= 0 || this.stale(this.trs[c0], this.trl[c0] * 3) || !this.heard(this.trs[c0], this.trl[c0] * 2.9))) this.tunnelCapture(this.tL);
    if (--this.gcnt > 0) return;
    const L = this.tL;
    this.gcnt = Math.max(16, L / 2);
    const g = ZONE_OVERLAP[this.zone];
    for (let c = 0; c < 2; c++) {
      if (!this.trl[c] || (c !== this.tcur && this.layerGain[c] < 0.001)) continue;
      const s = this.trs[c];
      const pan = (this.tg & 1 ? 0.25 : -0.25) * act;
      const v = this.shaped(i, this.rev ? s + L : s, this.rev ? -1 : 1, L, g, pan);
      v.layer = c;
      if (vr === 1) {
        this.lowpass(v, this.tF, 1);
        if (this.tg & 1) {
          const sub = this.shaped(i, this.rev ? s + L / 2 : s, this.rev ? -0.5 : 0.5, L, g * 0.9, -pan);
          sub.layer = c;
          this.lowpass(sub, this.tF, 1);
        }
      } else if (vr === 2) {
        v.fmode = 2;
        v.f0 = v.f1 = 180 * TUNNEL_BANDS[this.tg % 6] * Math.pow(2, 0.3 * Math.sin(this.tp * 0.5));
        v.k = 1 / (2 + act * 10);
        v.gain *= 1 + act * 2.5;
      }
    }
    this.tg++;
  }

  /** Strum: rhythmic chains of the notes just played, fading as they go. */
  private strum(i: number): void {
    if (!this.crossed(0, this.divB / 4)) return;
    const act = this.act, vr = this.vr, sr = this.sr;
    const k = this.step++;
    if (this.chain < 0.02 || Math.random() > 0.15 + 0.85 * act) return;
    const c = this.recent(8);
    const N = Math.min(c, 3 + Math.round(act * 5));
    const at = vr < 2 ? this.nbuf[0] : this.nbuf[this.cidx++ % N];
    const rate = vr === 3 && k & 1 ? 2 : 1;
    const pos = at - 0.003 * sr;
    // each note rings for two steps, under Shape's contour
    const len = Math.min((this.divB / 2) * this.B, 1.5 * sr, this.room(pos, rate));
    if (len < 0.02 * sr) return;
    const pan = (k & 1 ? 1 : -1) * (0.25 + 0.6 * act);
    const start = this.rev ? pos + len * rate : pos;
    const r = this.rev ? -rate : rate;
    // B: copies of the note a few drifting milliseconds apart, phasing against each other
    const copies = vr === 1 ? 2 + Math.round(act * 3) : 1;
    for (let q = 0; q < copies; q++) {
      const d = q ? (0.003 + 0.008 * q * (0.6 + 0.4 * Math.sin(this.tp * 0.7 + q * 1.9))) * sr : 0;
      this.shaped(i + d, start, r, len, (0.9 * this.chain) / Math.sqrt(copies), q & 1 ? -pan : pan);
    }
    this.chain *= 0.5 + 0.5 * Math.sqrt(this.rep);
  }

  private burstStart(): void {
    this.burst = 1 + Math.round(this.rep * 11);
    this.bsrc = this.onW ? this.ons[(this.onW - 1) & 15] - 0.003 * this.sr : this.head() - this.U;
    this.bg = 1;
    this.bidx = 0;
    this.quiet = 0;
  }

  /** Blocks: each attack sets off a burst of chopped, repeated, shifted blocks. */
  private blocks(i: number): void {
    // a held sound with no attacks still glitches, once in a while
    if (this.crossed(1, 4)) {
      if (this.quiet >= 2 && this.es > 0.05 && this.act > 0.5) this.burstStart();
      this.quiet++;
    }
    const stepB = this.divB / 4;
    if (!this.crossed(0, stepB) || this.burst <= 0) return;
    this.burst--;
    const S = stepB * this.B, act = this.act, vr = this.vr;
    const head = this.head();
    let pos = this.bsrc;
    if (Math.random() < act) {
      if (vr === 0) {
        const c = this.recent(8);
        pos = this.nbuf[this.bidx++ % c];
      } else pos = head - S - Math.random() * 4 * this.B;
    }
    const rate = (vr === 1 || vr === 3) && Math.random() < act ? pick(SHIFTS) : 1;
    if (this.room(pos, rate) < S) pos = head - 8 - S * rate;
    const start = this.rev ? pos + S * rate : pos;
    const r = this.rev ? -rate : rate;
    const pan = bipolar() * 0.6 * act;
    // C: filtered blocks that overlap and fade out, a softer glitch
    const v = vr === 2 ? this.voice(i, start, r, S, 0.15, 0.7, 0.9 * this.bg, pan) : this.shaped(i, start, r, S, 0.9 * this.bg, pan);
    if (vr === 2) {
      this.lowpass(v, 300 + 7000 * this.bg, 1.2);
      v.f1 = v.f0 / 6;
      this.bg *= 0.8;
    } else if (vr === 3) this.crushed(v, 0.3, 3 + Math.floor(Math.random() * 6));
  }

  /** Interrupt: now and then the sound is cut and glitches play in its place. */
  private interrupt(i: number): void {
    const stepB = this.divB / 2;
    if (this.crossed(0, stepB)) {
      if (this.inter > 0) {
        if (--this.inter === 0) this.duckT = 0;
      } else if (Math.random() < this.rep * this.rep) {
        this.inter = 1 + Math.floor(Math.random() * (1 + this.act * 3));
        this.duckT = 1;
      }
    }
    if (!this.crossed(1, stepB / 2) || !this.duckT) return;
    const S = (stepB / 2) * this.B, act = this.act, vr = this.vr;
    let rate = 1;
    if (vr === 1 && Math.random() < 0.3 + 0.7 * act) rate = pick(SHIFTS);
    if (vr === 3 && Math.random() < 0.3 + 0.7 * act) rate = pick(WILD);
    const ar = Math.abs(rate);
    const len = Math.random() < act * 0.5 ? S / 2 : S;
    const pos = this.head() - len * ar - 8 - Math.random() * Math.min(8 * this.B, this.HL * 0.2);
    const back = rate < 0 !== this.rev;
    const start = back ? pos + len * ar : pos;
    const r = back ? -ar : ar;
    const pan = bipolar() * 0.5 * act;
    const v = this.shaped(i, start, r, len, 1, pan);
    if (vr === 2) {
      const up = Math.random() < 0.5;
      this.sweep(v, up, 300, 6000, 1.1);
      // and an echo of it, three quarters of a step on, swept the other way
      this.sweep(this.shaped(i + 0.75 * stepB * this.B, start, r, len, 0.45, -pan), !up, 300, 6000, 1.1);
    } else if (vr === 3) this.crushed(v, 0.25 + 0.25 * act, 2 + Math.floor(Math.random() * 8));
  }

  /** Arp: the notes just played, stepped through up and back down. */
  private arp(i: number): void {
    const stepB = this.divB / 2;
    if (!this.crossed(0, stepB)) return;
    const sr = this.sr, vr = this.vr;
    const N = 2 + Math.round(this.act * 6);
    const c = this.recent(N);
    const q = this.step++ % (2 * N - 2);
    const idx = q < N ? q : 2 * N - 2 - q;
    const at = this.nbuf[c - 1 - (idx % c)];
    const rate = vr === 1 ? ARP_RATES[q & 7] : 1;
    const pos = at - 0.003 * sr;
    const len = Math.min(stepB * this.B * (0.2 + this.rep * 1.8), 2 * sr, this.room(pos, rate));
    if (len < 0.01 * sr) return;
    const v = this.shaped(i, this.rev ? pos + len * rate : pos, this.rev ? -rate : rate, len, 0.9, (idx / Math.max(1, N - 1) - 0.5) * 1.2);
    if (vr === 2) this.lowpass(v, 300 * Math.pow(2, Math.random() * 4.3), 1.6 - Math.random());
    else if (vr === 3) this.crushed(v, 0.3, 4 + Math.floor(Math.random() * 4));
  }

  // --------------------------------------------------------------- voices

  private renderVoices(n: number): void {
    const { hl, hr, wl, wr, HM } = this;
    const frz = this.frozen, fs = this.fs, fl = this.fl;
    const sr = this.sr;
    for (const v of this.pool) {
      if (!v.on) continue;
      if (v.wait >= n) {
        v.wait -= n;
        continue;
      }
      if (v.stream >= 0) v.rate = this.streamRate[v.stream];
      const gain = v.gain * (v.layer >= 0 ? this.layerGain[v.layer] : 1);
      const fm = v.fmode;
      const k = v.k;
      let a1 = 0, a2 = 0, a3 = 0;
      if (fm) {
        const u = Math.min(1, v.age / v.len);
        const f = v.f0 === v.f1 ? v.f0 : v.f0 * Math.pow(v.f1 / v.f0, v.fsh ? 1 - Math.abs(2 * u - 1) : u);
        const g = Math.tan((Math.PI * Math.min(f, sr * 0.45)) / sr);
        a1 = 1 / (1 + g * (g + k));
        a2 = g * a1;
        a3 = g * a2;
      }
      let s1l = v.s1l, s2l = v.s2l, s1r = v.s1r, s2r = v.s2r;
      const r = v.rate;
      const len = v.len, ia = v.ia, ir = v.ir, cv = v.curve, gl = gain * v.gl, gr = gain * v.gr;
      let pos = v.pos, age = v.age;
      for (let i = v.wait; i < n; i++) {
        if (age >= len) {
          v.on = false;
          break;
        }
        let q = pos;
        if (frz) {
          q -= fs;
          q -= Math.floor(q / fl) * fl;
          q += fs;
        }
        const j = Math.floor(q);
        const f = q - j;
        const j0 = j & HM, j1 = (j + 1) & HM;
        let xl = hl[j0] + (hl[j1] - hl[j0]) * f;
        let xr = hr[j0] + (hr[j1] - hr[j0]) * f;
        if (fm) {
          let v3 = xl - s2l;
          let v1 = a1 * s1l + a2 * v3;
          let v2 = s2l + a2 * s1l + a3 * v3;
          s1l = 2 * v1 - s1l;
          s2l = 2 * v2 - s2l;
          xl = fm === 1 ? v2 : v1 * k;
          v3 = xr - s2r;
          v1 = a1 * s1r + a2 * v3;
          v2 = s2r + a2 * s1r + a3 * v3;
          s1r = 2 * v1 - s1r;
          s2r = 2 * v2 - s2r;
          xr = fm === 1 ? v2 : v1 * k;
        }
        if (v.crush) {
          if (--v.hc <= 0) {
            v.hc = v.hold;
            v.hl = Math.round(xl / v.crush) * v.crush;
            v.hr = Math.round(xr / v.crush) * v.crush;
          }
          xl = v.hl;
          xr = v.hr;
        }
        let e = age * ia;
        const e2 = (len - age) * ir;
        if (e2 < e) e = e2;
        if (e > 1) e = 1;
        e = cv ? e * e : e * e * (3 - 2 * e);
        wl[i] += xl * e * gl;
        wr[i] += xr * e * gr;
        pos += r;
        age++;
      }
      // while frozen, keep the read head inside the segment so it is still valid after
      if (frz) {
        pos -= fs;
        pos -= Math.floor(pos / fl) * fl;
        pos += fs;
      }
      v.pos = pos;
      v.age = age;
      v.wait = 0;
      v.s1l = Number.isFinite(s1l) ? s1l : 0;
      v.s2l = Number.isFinite(s2l) ? s2l : 0;
      v.s1r = Number.isFinite(s1r) ? s1r : 0;
      v.s2r = Number.isFinite(s2r) ? s2r : 0;
    }
  }

  // ----------------------------------------------------------- multidelay

  /** Pattern and Warp: up to eight taps on a delay line, the last fed back. */
  private delays(n: number, warp: boolean): void {
    const sr = this.sr;
    if (!this.dl) {
      this.dl = new Float32Array(this.HL >> 1);
      this.dr = new Float32Array(this.HL >> 1);
    }
    const dl = this.dl, dr = this.dr!, M = (this.HL >> 1) - 1;
    const vr = this.vr, act = this.act, z = this.zone;
    const times = warp ? WARP_TAPS : PATTERN_TAPS[vr];
    const nT = 1 + Math.round(act * 7);
    const fb = this.rep * 0.97;
    const W = 0.06 * sr;
    const maxD = M - 2.5 * W - 8;
    const { tD: D, tG: G, tPL: PL, tPR: PR, tR: R, tW: WS, tC: C } = this;
    for (let k = 0; k < nT; k++) {
      D[k] = Math.min(times[k] * this.U, maxD);
      // Shape: the taps' levels across the pattern — even, building, swelling in the middle, dying away
      const t = nT > 1 ? k / (nT - 1) : 0;
      const c = nT === 1 || z === 0 ? 1 : z === 1 ? 0.2 + 0.8 * t : z === 2 ? 0.2 + 0.8 * (1 - Math.abs(2 * t - 1)) : 1 - 0.8 * t;
      G[k] = c / Math.sqrt(nT);
      const pan = nT === 1 ? 0 : k & 1 ? 0.6 : -0.6;
      const a = ((pan + 1) * Math.PI) / 4;
      PL[k] = Math.cos(a) * Math.SQRT2;
      PR[k] = Math.sin(a) * Math.SQRT2;
      let rate = warp && vr === 2 ? WARP_RATES[k] : 1;
      if (this.rev) rate = -rate;
      R[k] = rate;
      // a reversed plain tap plays back chunks as long as itself (up to 0.4 s); pitch shifts use 60 ms
      WS[k] = rate === -1 ? Math.max(0.02 * sr, Math.min(D[k], 0.4 * sr)) : W;
      if (warp && (vr === 0 || vr === 1)) {
        // A: a low-pass opened by the input's loudness; B: a resonant band-pass per tap
        const f = vr === 0 ? 150 * Math.pow(2, clamp(this.efol / 3, 0, 1) * (4 + k * 0.5)) : 220 * Math.pow(2, k * 0.7);
        const kk = vr === 0 ? 1.2 : 1 / 6;
        const g = Math.tan((Math.PI * Math.min(f, sr * 0.45)) / sr);
        C[k * 4] = 1 / (1 + g * (g + kk));
        C[k * 4 + 1] = g * C[k * 4];
        C[k * 4 + 2] = g * C[k * 4 + 1];
        C[k * 4 + 3] = kk;
      }
    }
    const damp = onePole(5000, sr);
    const { wl, wr, liveL, liveR, tph, tst } = this;
    const filt = warp && (vr === 0 || vr === 1);
    const xf = warp && vr === 3;
    let dw = this.dw;
    for (let i = 0; i < n; i++) {
      const x = (liveL[i] + liveR[i]) * 0.5;
      this.efol += ((x < 0 ? -x : x) - this.efol) * (Math.abs(x) > this.efol ? 0.005 : 0.00015);
      let accL = 0, accR = 0, lastL = 0, lastR = 0;
      for (let k = 0; k < nT; k++) {
        const d = D[k];
        const rate = R[k];
        let yl: number, yr: number;
        if (rate === 1 && !xf) {
          yl = rd(dl, M, dw - d);
          yr = rd(dr, M, dw - d);
        } else {
          const rr = xf ? (this.rev ? -2 : 2) : rate;
          const ws = WS[k];
          const ph = tph[k];
          this.shifted(dl, dr, M, dw, d, rr, ph, ws);
          yl = this.ty0;
          yr = this.ty1;
          if (xf) {
            // D: each tap drifts between itself (reversed, if Reverse) and an octave-up copy
            const m = 0.5 + 0.5 * Math.sin(TAU * (this.tp / (2 * this.divB) + k / nT));
            let pl = rd(dl, M, dw - d), pr = rd(dr, M, dw - d);
            if (this.rev) {
              this.shifted(dl, dr, M, dw, d, -1, ph, ws);
              pl = this.ty0;
              pr = this.ty1;
            }
            yl = pl * (1 - m) + yl * m;
            yr = pr * (1 - m) + yr * m;
          }
          let nph = ph + 1 / ws;
          if (nph >= 1) nph -= 1;
          tph[k] = nph;
        }
        if (filt) {
          const o = k * 4;
          const c1 = C[o], c2 = C[o + 1], c3 = C[o + 2], kk = C[o + 3];
          let v3 = yl - tst[o + 1];
          let v1 = c1 * tst[o] + c2 * v3;
          let v2 = tst[o + 1] + c2 * tst[o] + c3 * v3;
          tst[o] = 2 * v1 - tst[o];
          tst[o + 1] = 2 * v2 - tst[o + 1];
          yl = vr === 0 ? v2 : v1 * kk * 2.5;
          v3 = yr - tst[o + 3];
          v1 = c1 * tst[o + 2] + c2 * v3;
          v2 = tst[o + 3] + c2 * tst[o + 2] + c3 * v3;
          tst[o + 2] = 2 * v1 - tst[o + 2];
          tst[o + 3] = 2 * v2 - tst[o + 3];
          yr = vr === 0 ? v2 : v1 * kk * 2.5;
        }
        if (k === nT - 1) {
          lastL = yl;
          lastR = yr;
        }
        accL += yl * G[k] * PL[k];
        accR += yr * G[k] * PR[k];
      }
      this.dfl += (lastL - this.dfl) * damp;
      this.dfr += (lastR - this.dfr) * damp;
      dl[dw & M] = 5 * ftanh((liveL[i] + this.dfl * fb) * 0.2);
      dr[dw & M] = 5 * ftanh((liveR[i] + this.dfr * fb) * 0.2);
      dw++;
      wl[i] += accL;
      wr[i] += accR;
    }
    this.dw = dw;
    for (let k = 0; k < 32; k++) if (!Number.isFinite(tst[k])) tst[k] = 0;
    if (!Number.isFinite(this.dfl)) this.dfl = 0;
    if (!Number.isFinite(this.dfr)) this.dfr = 0;
  }

  /**
   * A tap `d` samples back, played at `rate`: two read heads half a window apart slide
   * through the window at 1 − rate samples per sample and cross-fade (sin²), into ty0/ty1.
   */
  private shifted(dl: Float32Array, dr: Float32Array, M: number, dw: number, d: number, rate: number, ph: number, ws: number): void {
    const span = Math.abs(1 - rate) * ws;
    const p2 = ph + 0.5 >= 1 ? ph - 0.5 : ph + 0.5;
    const d1 = d + span * (rate > 1 ? 1 - ph : ph);
    const d2 = d + span * (rate > 1 ? 1 - p2 : p2);
    const w1 = SIN2[Math.floor(ph * 1024)];
    const w2 = 1 - w1;
    this.ty0 = rd(dl, M, dw - d1) * w1 + rd(dl, M, dw - d2) * w2;
    this.ty1 = rd(dr, M, dw - d1) * w1 + rd(dr, M, dw - d2) * w2;
  }

  // ----------------------------------------------------- pitch modulation

  /** Pitch modulation on the effect: a short delay swept by a sine (left and right a quarter cycle apart), from chorus to a detuned wobble. */
  private modulate(n: number): void {
    const p = this.p, sr = this.sr;
    const { wl, wr, mbL, mbR, MM } = this;
    // depth up to ±100 cents, as a sweep that size at this rate (slow rates cap at what the line holds)
    const cents = 100 * p.mdep * p.mdep;
    const f = p.mrate;
    const want = Math.min(((Math.pow(2, cents / 1200) - 1) * sr) / (TAU * f), MM * 0.45 - 4);
    const k = 1 - Math.exp(-1 / (0.05 * sr));
    const dph = f / sr;
    let A = this.mA, ph = this.mph, w = this.mw;
    for (let i = 0; i < n; i++) {
      A += (want - A) * k;
      mbL[w & MM] = wl[i];
      mbR[w & MM] = wr[i];
      const s = TAU * ph;
      wl[i] = rd(mbL, MM, w - 2 - A * (1 + Math.sin(s)));
      wr[i] = rd(mbR, MM, w - 2 - A * (1 + Math.cos(s)));
      w++;
      ph += dph;
      if (ph >= 1) ph -= 1;
    }
    this.mA = A;
    this.mph = ph;
    this.mw = w;
  }

  // --------------------------------------------------------------- looper

  private command(cmd: number): void {
    const st = this.lstate;
    const p = this.p, sr = this.sr;
    const fadeIn = Math.round(p.fades) !== 2, fadeOut = Math.round(p.fades) !== 1;
    switch (cmd) {
      case CMD_TAP:
        // the beat lands on the tap (the knob, set from the taps, eases the tempo in)
        if (!this.ins.clock.on) this.tp = Math.round(this.tp);
        return;
      case CMD_ERASE:
        this.lstate = LOOP_EMPTY;
        this.llen = this.lrec = 0;
        this.lnext = -1;
        this.odOn = false;
        return;
      case CMD_UNDO:
        // clear the overdub layer, back to the first phrase
        if (this.odOn) {
          this.odL!.fill(0, 0, this.llen);
          this.odR!.fill(0, 0, this.llen);
        }
        this.odOn = false;
        if (st === LOOP_DUB) this.lstate = LOOP_PLAY;
        return;
      case CMD_STOP:
        if (st === LOOP_REC) this.close(LOOP_STOP);
        else if (st === LOOP_PLAY || st === LOOP_DUB) {
          this.lrate = 1 / (sr * (fadeOut ? Math.max(0.005, p.fade) : 0.005));
          this.lstate = LOOP_FADE;
        } else if (st === LOOP_FADE) this.lstate = LOOP_STOP;
        return;
      case CMD_DOWN:
        // Burst: a press throws the loop away and records afresh
        this.startRec();
        return;
      case CMD_UP:
        if (st === LOOP_REC) this.close(LOOP_PLAY);
        return;
      case CMD_REC:
        if (st === LOOP_EMPTY) this.startRec();
        else if (st === LOOP_REC) this.close(p.order >= 0.5 ? LOOP_DUB : LOOP_PLAY);
        else if (st === LOOP_PLAY) this.lstate = LOOP_DUB;
        else if (st === LOOP_DUB) this.lstate = LOOP_PLAY;
        else {
          // stopped, or fading out: play (from the top if it had stopped)
          if (st === LOOP_STOP) {
            this.lpos = this.lspeed < 0 ? this.llen - 1 : 0;
            this.lg = 0;
          }
          this.lrate = 1 / (sr * (fadeIn ? Math.max(0.005, p.fade) : 0.005));
          this.lstate = LOOP_PLAY;
        }
        return;
      default:
        return;
    }
  }

  private startRec(): void {
    if (!this.lbL) {
      // the overdub layer too: untouched pages cost nothing until written
      this.lbL = new Float32Array(this.LL);
      this.lbR = new Float32Array(this.LL);
      this.odL = new Float32Array(this.LL);
      this.odR = new Float32Array(this.LL);
    }
    this.lrec = 0;
    this.lnext = -1;
    this.odOn = false;
    this.lstate = LOOP_REC;
    // Quantize: the effect starts its bar with the loop (a clock keeps its own beat)
    if (this.p.quant >= 0.5 && !this.ins.clock.on) {
      this.tp = 0;
      this.last.fill(-Infinity);
    }
  }

  /** End the first pass; with Quantize, round it to the nearest beat (recording on to it if it is still ahead). */
  private close(next: number): void {
    if (this.lnext >= 0) return;
    const lb = this.lbL!, rb = this.lbR!;
    let len = this.lrec;
    let at = 0;
    if (this.p.quant >= 0.5) {
      const q = Math.round(Math.max(1, Math.round(len / this.B)) * this.B);
      if (q > len && q <= this.LL) {
        this.lquant = q;
        this.lnext = next;
        return;
      }
      // played past the end: what came after it is the start of the second pass
      for (let j = q; j < len && j - q < q; j++) {
        lb[j - q] += lb[j];
        rb[j - q] += rb[j];
      }
      at = len - q;
      len = Math.min(q, len);
    }
    if (len < 0.05 * this.sr) {
      this.lstate = LOOP_EMPTY;
      this.llen = 0;
      return;
    }
    this.seal(len, next, at);
  }

  /** The loop is `len` long from here: soften its seam and move on to `next`, playing from `at`. */
  private seal(len: number, next: number, at: number): void {
    const lb = this.lbL!, rb = this.lbR!;
    const X = Math.min(64, len >> 3);
    for (let j = 0; j < X; j++) {
      const t = j / X;
      lb[j] *= t;
      rb[j] *= t;
      lb[len - 1 - j] *= t;
      rb[len - 1 - j] *= t;
    }
    this.llen = len;
    this.lg = 1;
    this.lstate = next;
    // reversed (even if Reverse went on while recording): from the end backwards
    this.lpos = this.lspeed < 0 ? len - 1 : next === LOOP_STOP ? 0 : at % len;
  }

  /** One sample through the looper: records `xl, xr` as its state says; playback lands in lo0/lo1. */
  private loopTick(xl: number, xr: number): void {
    const st = this.lstate;
    this.lo0 = this.lo1 = 0;
    if (st === LOOP_EMPTY || st === LOOP_STOP) return;
    const lb = this.lbL!, rb = this.lbR!, ol = this.odL!, or = this.odR!;
    if (st === LOOP_REC) {
      const j = this.lrec++;
      lb[j] = xl;
      rb[j] = xr;
      ol[j] = or[j] = 0;
      if (this.lnext >= 0 && this.lrec >= this.lquant) {
        // the first pass reached its rounded length
        const next = this.lnext;
        this.lnext = -1;
        this.seal(this.lrec, next, 0);
      } else if (this.lrec >= this.LL) this.close(LOOP_PLAY);
      return;
    }
    const L = this.llen;
    const pos = this.lpos;
    const j = Math.floor(pos);
    const f = pos - j;
    const j1 = j + 1 >= L ? 0 : j + 1;
    let a = lb[j] + (lb[j1] - lb[j]) * f;
    let b = rb[j] + (rb[j1] - rb[j]) * f;
    if (this.odOn) {
      a += ol[j] + (ol[j1] - ol[j]) * f;
      b += or[j] + (or[j1] - or[j]) * f;
    }
    // the fades: out toward a stop, in after starting
    if (st === LOOP_FADE) {
      this.lg -= this.lrate;
      if (this.lg <= 0) {
        this.lg = 0;
        this.lstate = LOOP_STOP;
      }
    } else if (this.lg < 1) this.lg = Math.min(1, this.lg + this.lrate);
    const g = this.level * this.lg;
    this.lo0 = a * g;
    this.lo1 = b * g;
    const step = this.lspeed;
    if (st === LOOP_DUB) {
      // overdub at the playback speed: each input sample covers |step| of the loop (averaged slower, held faster)
      this.odOn = true;
      const s = step < 0 ? -step : step;
      if (s <= 1) {
        ol[j] = clamp(ol[j] + xl * s, -10, 10);
        or[j] = clamp(or[j] + xr * s, -10, 10);
      } else {
        const d = step > 0 ? 1 : -1;
        const cover = Math.ceil(s), wt = s / cover;
        for (let c = 0, q = j; c < cover; c++, q += d) {
          const w = q < 0 ? q + L : q >= L ? q - L : q;
          ol[w] = clamp(ol[w] + xl * wt, -10, 10);
          or[w] = clamp(or[w] + xr * wt, -10, 10);
        }
      }
    }
    let next = pos + step;
    if (next >= L) next -= L;
    else if (next < 0) next += L;
    this.lpos = next;
  }
}

export const COSM_CLASSES: Partial<Record<ModuleType, new (id: string, type: ModuleType, sr: number) => Mod>> = {
  cosm: CosmMod,
};
