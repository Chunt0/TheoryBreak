// A two-channel micro-looper rack module, after Chase Bliss Audio's MOOD MKII and its
// manual. One channel, the Wet Channel, is a suite of real-time spatial effects: Reverb
// (a cluster of echoes that Modify smears into a wash), Delay (a clean, looping echo)
// and Slip (an auto-sampler that plays back what you just played at another speed, or
// backwards). The other, the Micro-Looper, is always listening: bypassed, it keeps
// recording the last moments it heard; turned on, it loops them, in Env (your playing
// stutters the loop), Tape (octave speeds, both ways) or Stretch (time-stretching by
// slices). The two feed each other: the Wet Channel processes the input, the loop or
// both, and the listening looper records the Wet Channel.
//
// Both run at the sample rate the Clock knob sets, in harmonized steps from 64 kHz down
// to 2 kHz: an octave down, everything in the buffers plays an octave lower and twice as
// long, and new sound comes in grittier. The dry sound passes as it came.

import { HIGH, Mod, TAU, ftanh, onePole, type RackView } from './base';
import { MOOD_KNOB_IDS, moodRate, type ModuleType } from './modules';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/**
 * Footswitch presses, sent as the hidden `cmd` param (sequence × 8 + command): a tap on
 * the left switch (Wet Channel on and off), holding it and letting go (Freeze), and the
 * same on the right (Micro-Looper on and off; held, overdub).
 */
export const M_WET = 1, M_WET_HOLD = 2, M_WET_LET = 3, M_LOOP = 4, M_LOOP_HOLD = 5, M_LOOP_LET = 6;

/** The Micro-Looper's ring, in samples at the Clock's rate: 1 s at 64 kHz, 32 s at 2 kHz (Half: half that). */
export const MOOD_RING = 1 << 16;
const DB = 1 << 16, DM = DB - 1; // the delay's lines
const RB = 1 << 15, RM = RB - 1; // the reverb's lines
const SB = 1 << 16, SM = SB - 1; // Slip's ring
/** Delay times and Slip's sampling size, in samples at the Clock's rate. */
const D_MIN = 256, D_MAX = 64000, W_MIN = 256, W_MAX = 20000;
/** samples a delay-time change cross-fades over (MKII: no pitch bends) */
const XF = 1024;
/** samples a loop jump cross-fades over */
const XJ = 64;
/** Without Trails, the Wet Channel dies away over this many samples once it is switched off. */
const CUT = 256;
const TRAIL_MAX = 1 << 21;

/** Tape's Modify: eight zones, reverse 4× to ½× then forward ½× to 4×. */
const TAPE_SPEEDS = [-4, -2, -1, -0.5, 0.5, 1, 2, 4];
/** Sync, Wet to loop: the Wet Channel's time as these fractions of the loop. */
export const SYNC_DIV = [1 / 16, 1 / 12, 1 / 8, 1 / 6, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1];
// Reverb: taps along each line (fractions of its length), their levels, and with Spread where each sits
const TAPS = [0.11, 0.23, 0.31, 0.44, 0.57, 0.68, 0.83, 1];
const TAP_G = [0.9, -0.75, 0.8, -0.6, 0.7, -0.5, 0.55, -0.45];
const TAP_PAN = [-0.9, 0.6, -0.3, 0.95, -0.7, 0.2, 0.8, -0.5];
/** all-passes in the loop (Modify smears through them) and before it, in samples */
const AP_LOOP = [347, 113, 241, 577];
const AP_IN = [142, 379];
const AP_SUM = AP_LOOP.reduce((a, b) => a + b, 0);
const RV_OUT = 0.42;

/** sin² over half a cycle: overlapping heads cross-fade by it */
const SIN2 = Float32Array.from({ length: 1025 }, (_, i) => Math.sin((Math.PI * i) / 1024) ** 2);
const sin2 = (t: number): number => SIN2[Math.round(clamp(t, 0, 1) * 1024)];
/** Soft ceiling for feedback that may pile up (Delay's Modify fully up): untouched up to 6 V, then easing into 10 V. */
function sat(x: number): number {
  const a = x < 0 ? -x : x;
  if (a <= 6) return x;
  const y = 6 + 4 * ftanh((a - 6) / 4);
  return x < 0 ? -y : y;
}

/** Linear read from a power-of-two ring at a fractional position. */
function rd(buf: Float32Array, M: number, at: number): number {
  const j = Math.floor(at);
  const a = buf[j & M];
  return a + (buf[(j + 1) & M] - a) * (at - j);
}

/** Slip's playback speed for its Modify: reverse 2× to 1× left of noon, neutral at noon, forward 1× to 2× right, in semitones. */
export function slipSpeed(v: number): number {
  if (v > 0.53) return 2 ** (Math.round(((v - 0.53) / 0.47) * 12) / 12);
  if (v < 0.47) return -(2 ** (Math.round(((0.47 - v) / 0.47) * 12) / 12));
  return 1;
}
export const tapeSpeed = (v: number): number => TAPE_SPEEDS[clamp(Math.floor(v * 8), 0, 7)];
/** The delay time for Time, in samples at the Clock's rate. */
export const delayTime = (t: number): number => Math.round(D_MIN * (D_MAX / D_MIN) ** t);

class MoodMod extends Mod {
  // the channels, and the footswitches' holds
  private wetOn = true;
  private loopOn = false;
  private frz = false;
  private dubbing = false;
  private frzG = false;
  private dubG = false;
  private frozen = false;
  private wg = 0;
  private lg = 0;
  private wetFade = 1;
  private offN = 0;
  private lastCmd = 0;
  private wasOn = true;

  // the clock: the knob's (smoothed) position, the rate, the phase of the next sample at that rate
  private clk = -1;
  private R = 32000;
  private ph = 0;
  private aal = 0;
  private aar = 0;
  private o0l = 0;
  private o0r = 0;
  private o1l = 0;
  private o1r = 0;
  private osl = 0;
  private osr = 0;
  /** one sample at the clock's rate comes out here */
  private tl = 0;
  private tr = 0;

  // knobs after ramping and EXP, once a block
  private k: Record<string, number> = { mix: 0.5, time: 0.5, len: 1, wmod: 0.5, clock: 0.8, lmod: 0.7 };
  private rph = 0;
  private r0 = 0;
  private r1 = Math.random();
  private rOnce = 1;
  private rmLast = 0;
  private wmode = 0;
  private route = 1;
  private classic = false;
  private trails = false;
  private wSpread = false;
  private lSpread = false;
  private width = 0.75;
  private tone = 1;
  private hiss = 0;

  // the Wet Channel's output, and its Tone filter
  private wl = 0;
  private wr = 0;
  private tzl = 0;
  private tzr = 0;

  // reverb: two lines, their damping, all-passes, and the size Time glides to
  private rvL = new Float32Array(RB);
  private rvR = new Float32Array(RB);
  private rvW = 0;
  private rvLen = 4000;
  private rvLenT = 4000;
  private rvG = 0.5;
  private rvDamp = 0.65;
  private rz = new Float64Array(2);
  private rvPh = 0;
  private smear = 0.5;
  private aps: Float32Array[] = [];
  private apAt = new Int32Array(12);
  private tapL = new Float64Array(8);
  private tapR = new Float64Array(8);

  // delay: the time read, and the one it cross-fades to
  private dlL = new Float32Array(DB);
  private dlR = new Float32Array(DB);
  private dw = 0;
  private dT = 4000;
  private dCur = 4000;
  private dNext = 4000;
  private dX = -1;
  private fb = 0.5;

  // slip: a ring, two read heads half a window apart
  private slL = new Float32Array(SB);
  private slR = new Float32Array(SB);
  private sw = 0;
  private sAnchor = 0;
  private sW = 2000;
  private sSpd = 1;
  private sPh = Float64Array.from([0, 0.5]);
  private sAge = new Float64Array(2);
  private sP0 = new Float64Array(2);
  private sPan = 0;

  // micro-looper: the ring, the write head while listening, the loop's newest end, the region played
  private mlL = new Float32Array(MOOD_RING);
  private mlR = new Float32Array(MOOD_RING);
  private NL = MOOD_RING;
  private hp = 0;
  /** samples heard so far (up to the ring): until the ring is full, the loop is only what it heard */
  private heard = 0;
  private seam = 0;
  private LB = MOOD_RING;
  private rs = 0;
  private lmode = 1;
  /** play position from the region's start, and the head fading out after a jump */
  private pp = 0;
  private q = 0;
  private xq = 0;
  private qStep = 1;
  private lastW = -1;
  private pl = 0;
  private pr = 0;
  // Env
  private envF = 0;
  private envRel = 0.999;
  private thr = 0.1;
  private S = 4096;
  private detOn = false;
  private slice = 0;
  private panAmt = 0;
  private lPan = 0;
  // Tape
  private spd = 1;
  private eff = MOOD_RING;
  private chopP = MOOD_RING;
  private chop = 1;
  // Stretch: progress position and speed, grain size, two grains
  private sp = 0;
  private stC = 0.4;
  private G = 4096;
  private gS = new Float64Array(2);
  private gA = new Float64Array(2);
  private gD = Float64Array.from([1, 1]);

  constructor(id: string, type: ModuleType, sr: number) {
    super(id, type, sr);
    for (let c = 0; c < 2; c++) {
      for (const d of AP_LOOP) this.aps.push(new Float32Array(d + 12 * c));
      for (const d of AP_IN) this.aps.push(new Float32Array(d + 7 * c));
    }
    // footswitch presses arrive here; not a knob, so never saved with the patch
    this.p.cmd = 0;
  }

  process(n: number): void {
    this.setCh(1);
    const p = this.p, sr = this.sr;
    if (p.cmd !== this.lastCmd) {
      this.lastCmd = p.cmd;
      this.command(Math.round(p.cmd) & 7);
    }
    const { l, r, wet, loop, frz, dub } = this.ins;
    this.knobs(n);
    const k = this.k;

    // the clock: harmonized steps, or with Smooth a glide
    const smooth = p.smooth >= 0.5;
    if (this.clk < 0 || !smooth) this.clk = k.clock;
    else this.clk += (k.clock - this.clk) * (1 - Math.exp(-n / (0.08 * sr)));
    const R = moodRate(this.clk, smooth);
    this.R = R;
    const inc = R / sr;
    const aa = onePole(0.5 * R, sr);
    this.setup();

    const dg = p.dry >= 0.5 ? 0 : Math.min(1, 2 - 2 * k.mix), eg = Math.min(1, 2 * k.mix);
    const oL = this.outs.l.buf, oR = this.outs.r.buf;
    const wo = wet.off(0), lo = loop.off(0), fo = frz.off(0), uo = dub.off(0);
    for (let i = 0; i < n; i++) {
      const xl = this.sum(l, i);
      const xr = r.on ? this.sum(r, i) : xl;
      // the jacks: triggers switch a channel, gates hold Freeze and overdub
      if (wet.on) {
        const v = wet.buf[wo + i];
        if (v >= HIGH && this.wg < HIGH) this.setWet(!this.wetOn);
        this.wg = v;
      }
      if (loop.on) {
        const v = loop.buf[lo + i];
        if (v >= HIGH && this.lg < HIGH) this.setLoop(!this.loopOn);
        this.lg = v;
      }
      const fg = frz.on && frz.buf[fo + i] >= HIGH;
      if (fg && !this.frzG && !this.wetOn) this.setWet(true);
      this.frzG = fg;
      const ug = dub.on && dub.buf[uo + i] >= HIGH;
      if (ug && !this.dubG && !this.loopOn) this.setLoop(true);
      this.dubG = ug;
      this.frozen = this.wetOn && (this.frz || this.frzG);

      // into the clock's rate (a gentle filter, so the low settings still alias), a sample at a time, and back
      this.aal += (xl - this.aal) * aa;
      this.aar += (xr - this.aar) * aa;
      this.ph += inc;
      while (this.ph >= 1) {
        this.ph -= 1;
        this.o0l = this.o1l;
        this.o0r = this.o1r;
        this.tick(this.aal, this.aar);
        this.o1l = this.tl;
        this.o1r = this.tr;
      }
      this.osl += (this.o0l + (this.o1l - this.o0l) * this.ph - this.osl) * aa;
      this.osr += (this.o0r + (this.o1r - this.o0r) * this.ph - this.osr) * aa;
      oL[i] = 6 * ftanh((xl * dg + this.osl * eg) / 6);
      oR[i] = 6 * ftanh((xr * dg + this.osr * eg) / 6);
    }
    if (!Number.isFinite(this.osl + this.osr)) this.reset();
  }

  override view(): RackView {
    const LB = this.LB;
    const at = this.loopOn ? (this.lmode === 2 ? this.sp : this.pp) : this.hp;
    return {
      k: 'mood',
      wet: this.wetOn,
      loop: this.loopOn,
      frz: this.frozen,
      dub: this.loopOn && (this.dubbing || this.dubG),
      rate: this.R,
      len: LB / this.R,
      pos: (((at % LB) + LB) % LB) / LB,
      det: this.loopOn && this.lmode === 0 && this.detOn,
    };
  }

  // ------------------------------------------------------------- controls

  /** The six knobs as positions 0–1, moved by ramping and the EXP jack. */
  private knobs(n: number): void {
    const p = this.p, k = this.k, sr = this.sr;
    k.mix = p.mix;
    k.time = p.time;
    k.len = p.len;
    k.wmod = p.wmod;
    k.clock = p.clock;
    k.lmod = p.lmod;
    const on = this.wetOn || this.loopOn;
    const rm = Math.round(p.ramp);
    if (rm) {
      const id = MOOD_KNOB_IDS[clamp(Math.round(p.rknob), 0, 4)];
      const top = p.sweep >= 0.5;
      const v = k[id];
      if (rm === 1) {
        // Bounce: back and forth between the knob and one end, for good
        this.rph += (n * p.rspeed) / sr;
        if (this.rph >= 1) {
          this.rph -= Math.floor(this.rph);
          this.r0 = this.r1;
          this.r1 = Math.random();
        }
        const w = this.wave(this.rph, p.rwave);
        k[id] = top ? v + (1 - v) * w : v * w;
      } else {
        // Ramp: once, when the pedal comes on (or ramping is set to it), from the far end to the knob
        if (rm !== this.rmLast || (on && !this.wasOn)) this.rOnce = 0;
        this.rOnce = Math.min(1, this.rOnce + (n * p.rspeed) / sr);
        k[id] = top ? 1 - (1 - v) * this.rOnce : v * this.rOnce;
      }
    }
    this.rmLast = rm;
    this.wasOn = on;
    const exp = this.ins.exp;
    if (exp.on) {
      const id = ['mix', ...MOOD_KNOB_IDS][clamp(Math.round(p.exp), 0, 5)];
      k[id] = clamp(k[id] + exp.buf[exp.off(0)] / 10, 0, 1);
    }
  }

  /** The ramp's shape at phase t, warping smoothly from each shape to the next: triangle, square, sine, random, smooth random. */
  private wave(t: number, morph: number): number {
    const shape = (s: number): number => {
      switch (s) {
        case 0: return t < 0.5 ? 2 * t : 2 - 2 * t;
        case 1: return t < 0.5 ? 0 : 1;
        case 2: return 0.5 - 0.5 * Math.cos(TAU * t);
        case 3: return this.r1;
        default: return this.r0 + (this.r1 - this.r0) * (0.5 - 0.5 * Math.cos(Math.PI * t));
      }
    };
    const x = clamp(morph, 0, 1) * 4;
    const i = Math.min(3, Math.floor(x));
    return shape(i) + (shape(i + 1) - shape(i)) * (x - i);
  }

  /** Everything the knobs decide, once a block, at the clock's rate. */
  private setup(): void {
    const p = this.p, k = this.k, R = this.R;
    const NL = p.half >= 0.5 ? MOOD_RING >> 1 : MOOD_RING;
    if (NL !== this.NL) {
      this.NL = NL;
      this.hp &= NL - 1;
      this.seam &= NL - 1;
      this.heard = Math.min(this.heard, NL);
    }
    this.wmode = clamp(Math.round(p.wet), 0, 2);
    this.route = clamp(Math.round(p.route), 0, 2);
    this.classic = p.classic >= 0.5;
    this.trails = p.trails >= 0.5;
    const solo = Math.round(p.solo);
    this.wSpread = p.spread >= 0.5 && solo !== 2;
    this.lSpread = p.spread >= 0.5 && solo !== 1;
    this.width = p.width;
    this.tone = p.tone >= 0.99 ? 1 : onePole(600 * (20000 / 600) ** p.tone, R);
    this.hiss = this.classic ? 0.03 * (1 - this.clk) ** 2 : 0;

    // the Wet Channel's time (Sync: Wet to loop steps it in fractions of the loop), and the loop's length (Loop to wet: a run of it)
    const sync = Math.round(p.sync);
    const t = k.time;
    let period: number;
    if (sync === 2) period = NL * SYNC_DIV[Math.min(SYNC_DIV.length - 1, Math.floor(t * SYNC_DIV.length))];
    else period = this.wmode === 1 ? delayTime(t) : this.wmode === 0 ? 400 * 60 ** t + AP_SUM : W_MIN * (W_MAX / W_MIN) ** t;
    this.dT = clamp(Math.round(period), D_MIN, D_MAX);
    this.rvLenT = clamp(period - AP_SUM, 400, 24000);
    this.sW = clamp(Math.round(period), W_MIN, W_MAX);
    let LB = NL;
    if (sync === 0) {
      LB = Math.max(64, Math.round(period));
      while (LB * 2 <= NL) LB *= 2;
      LB = Math.min(LB, NL);
    }
    this.LB = Math.min(LB, Math.max(256, this.heard));
    LB = this.LB;
    this.rs = (this.seam - LB) & (NL - 1);

    // Reverb: Time sets the size and the decay together (0.4 s to 12 s at 32 kHz); Modify, the smear
    const t60 = 12800 * 30 ** t;
    this.rvG = 10 ** ((-3 * (this.rvLenT + AP_SUM)) / t60);
    this.rvDamp = this.classic ? 0.92 : 0.65;
    this.smear = k.wmod;
    this.fb = k.wmod;
    this.sSpd = slipSpeed(k.wmod);

    // the Micro-Looper
    this.lmode = clamp(Math.round(p.lmode), 0, 2);
    const len = k.len, lm = k.lmod;
    this.S = Math.max(32, Math.round((LB * 2 ** (-9 * (1 - len))) / 2));
    this.thr = 3 * 0.001 ** lm;
    this.envRel = Math.exp(-1 / (0.03 * R));
    this.spd = tapeSpeed(lm);
    const short = Math.max(256, Math.round(LB * 2 ** (-7 * (1 - len))));
    this.eff = this.classic ? LB : Math.min(LB, short);
    this.chopP = Math.min(LB, short);
    this.stC = (lm - 0.5) * 2;
    this.G = Math.round(64 * 2 ** (len * Math.log2(LB / 256)));
  }

  private command(cmd: number): void {
    const latch = this.p.latch >= 0.5;
    switch (cmd) {
      case M_WET:
        this.setWet(!this.wetOn);
        return;
      case M_WET_HOLD:
        // holding the left switch freezes (latching, it stays frozen until held again)
        this.frz = latch ? !this.frz : true;
        if (!this.wetOn) this.setWet(true);
        return;
      case M_WET_LET:
        if (!latch) this.frz = false;
        return;
      case M_LOOP:
        this.setLoop(!this.loopOn);
        return;
      case M_LOOP_HOLD:
        this.dubbing = latch ? !this.dubbing : true;
        if (!this.loopOn) this.setLoop(true);
        return;
      case M_LOOP_LET:
        if (!latch) this.dubbing = false;
        return;
      default:
        return;
    }
  }

  private setWet(on: boolean): void {
    if (on === this.wetOn) return;
    this.wetOn = on;
    this.offN = 0;
    if (on) this.wetFade = 1;
    else this.frz = false;
  }

  /** On: loop what it heard last. Off (bypassed): record again from where the loop was, over it. */
  private setLoop(on: boolean): void {
    if (on === this.loopOn) return;
    this.loopOn = on;
    const M = this.NL - 1;
    if (on) {
      this.seam = this.hp;
      this.rs = (this.seam - this.LB) & M;
      this.pp = 0;
      this.xq = 0;
      this.sp = 0;
      this.gA[0] = 0;
      this.gA[1] = this.G >> 1;
      this.gS[0] = 0;
      this.gS[1] = -(this.G >> 1);
      this.gD.fill(1);
      this.detOn = false;
      this.chop = 1;
      // soften the seam between the newest and the oldest sound
      const X = Math.min(XJ, this.LB >> 3);
      for (let j = 0; j < X; j++) {
        const g = j / X;
        const a = (this.rs + j) & M, b = (this.rs + this.LB - 1 - j) & M;
        this.mlL[a] *= g;
        this.mlR[a] *= g;
        this.mlL[b] *= g;
        this.mlR[b] *= g;
      }
    } else {
      const at = this.lmode === 2 ? this.sp : this.pp;
      this.hp = (this.rs + Math.floor(((at % this.LB) + this.LB) % this.LB)) & M;
      this.dubbing = false;
    }
  }

  private reset(): void {
    for (const b of [this.rvL, this.rvR, this.dlL, this.dlR, this.slL, this.slR, this.mlL, this.mlR, ...this.aps]) b.fill(0);
    this.rz.fill(0);
    this.aal = this.aar = this.o0l = this.o0r = this.o1l = this.o1r = this.osl = this.osr = this.tzl = this.tzr = 0;
  }

  private clearWet(): void {
    for (const b of [this.rvL, this.rvR, this.dlL, this.dlR, this.slL, this.slR, ...this.aps]) b.fill(0);
    this.rz.fill(0);
    this.tzl = this.tzr = 0;
  }

  // ----------------------------------------------------------- one sample

  /** One sample at the clock's rate: the loop plays, the Wet Channel takes what the routing sends it, the listening looper records. */
  private tick(xl: number, xr: number): void {
    const loopOn = this.loopOn;
    let ml = 0, mr = 0;
    if (loopOn) {
      this.playLoop(xl, xr);
      ml = this.pl;
      mr = this.pr;
    }

    // the Wet Channel: the routing only matters with both channels on
    let wl = 0, wr = 0;
    const run = this.wetOn || (this.trails ? this.offN < TRAIL_MAX : this.wetFade > 0);
    if (run) {
      let il = 0, ir = 0;
      if (this.wetOn && !this.frozen) {
        if (!loopOn || this.route === 0) {
          il = xl;
          ir = xr;
        } else if (this.route === 1) {
          il = xl + ml;
          ir = xr + mr;
        } else {
          il = ml;
          ir = mr;
        }
      }
      if (this.wmode === 0) this.reverb(il, ir);
      else if (this.wmode === 1) this.delay(il, ir);
      else this.slip(il, ir);
      if (this.tone < 1) {
        this.tzl += (this.wl - this.tzl) * this.tone;
        this.tzr += (this.wr - this.tzr) * this.tone;
        wl = this.tzl;
        wr = this.tzr;
      } else {
        wl = this.wl;
        wr = this.wr;
      }
      if (!this.wetOn) {
        if (this.trails) {
          if (++this.offN >= TRAIL_MAX) this.clearWet();
        } else {
          this.wetFade = Math.max(0, this.wetFade - 1 / CUT);
          if (this.wetFade === 0) this.clearWet();
        }
      }
      wl *= this.wetFade;
      wr *= this.wetFade;
    }

    // listening: the looper records what you hear of the input and the Wet Channel
    if (!loopOn) {
      const j = this.hp;
      this.mlL[j] = xl + (this.wetOn ? wl : 0);
      this.mlR[j] = xr + (this.wetOn ? wr : 0);
      this.hp = (j + 1) & (this.NL - 1);
      if (this.heard < this.NL) this.heard++;
    }

    // out: a loop sent through the Wet Channel is heard through it alone, unless Direct blends it back
    const bal = this.p.bal;
    const wgain = bal > 0 ? 1 - bal : 1, lgain = (bal < 0 ? 1 + bal : 1) * (this.wetOn && loopOn && this.route > 0 ? this.p.direct : 1);
    let ol = wl * wgain + ml * lgain, or = wr * wgain + mr * lgain;
    if (this.hiss > 0) {
      ol += (Math.random() * 2 - 1) * this.hiss;
      or += (Math.random() * 2 - 1) * this.hiss;
    }
    this.tl = ol;
    this.tr = or;
  }

  // ------------------------------------------------------------- wet channel

  private ap(k: number, x: number, a: number): number {
    const buf = this.aps[k];
    const j = this.apAt[k];
    const d = buf[j];
    const y = d - a * x;
    buf[j] = x + a * y;
    this.apAt[k] = j + 1 === buf.length ? 0 : j + 1;
    return y;
  }

  /**
   * Reverb: each side a line whose end comes back round through four all-passes. Modify
   * down, they pass the sound untouched and the line's taps are a cluster of distinct
   * echoes; up, they smear each pass more, into a wash. Frozen, the loop keeps all it has.
   */
  private reverb(il: number, ir: number): void {
    const frozen = this.frozen;
    // Time glides the size, bending what is already in the lines
    this.rvLen += (this.rvLenT - this.rvLen) * 0.0005;
    const L = frozen ? Math.round(this.rvLen) : this.rvLen;
    const a = 0.72 * this.smear, ai = 0.6 * this.smear;
    const g = frozen ? 1 : this.rvG;
    const damp = frozen ? 1 : this.rvDamp;
    this.rvPh += 1 / 80000;
    if (this.rvPh >= 1) this.rvPh -= 1;
    // a slow wobble of the loop's length, the two sides in opposite directions (still when frozen)
    const wob = frozen ? 0 : (2 + 6 * this.smear) * Math.sin(TAU * this.rvPh);
    const m0 = frozen ? 0 : 2 + 6 * this.smear;
    const w = this.rvW;
    for (let c = 0; c < 2; c++) {
      const line = c ? this.rvR : this.rvL;
      let x = c ? ir : il;
      x = this.ap(c * 6 + 4, x, ai);
      x = this.ap(c * 6 + 5, x, ai);
      const v = rd(line, RM, w - L - m0 - (c ? wob : -wob));
      const z = this.rz[c] + (v - this.rz[c]) * damp;
      this.rz[c] = z;
      let y = x + z * g;
      // Classic: a short ring inside the loop, like mild feedback
      if (this.classic && !frozen) y += 0.35 * line[(w - 211 - 17 * c) & RM];
      for (let k = 0; k < 4; k++) y = this.ap(c * 6 + k, y, a);
      line[w] = y;
      const taps = c ? this.tapR : this.tapL;
      for (let k = 0; k < 8; k++) taps[k] = rd(line, RM, w - TAPS[k] * L) * TAP_G[k] * (c && k % 3 === 0 ? -1 : 1);
    }
    this.rvW = (w + 1) & RM;
    let ol = 0, or = 0;
    if (this.wSpread) {
      // Spread: every tap somewhere else across the field
      for (let k = 0; k < 8; k++) {
        const m = (this.tapL[k] + this.tapR[k]) * 0.5;
        const pan = TAP_PAN[k] * this.width;
        ol += m * (1 - pan);
        or += m * (1 + pan);
      }
    } else {
      for (let k = 0; k < 8; k++) {
        ol += this.tapL[k];
        or += this.tapR[k];
      }
    }
    this.wl = ol * RV_OUT;
    this.wr = or * RV_OUT;
  }

  /** Delay: Modify the feedback (fully up, repeats pile up like a looper); a new Time cross-fades in, or in Classic bends there. */
  private delay(il: number, ir: number): void {
    const w = this.dw;
    const { dlL, dlR } = this;
    let dl: number, dr: number;
    if (this.classic) {
      this.dCur += (this.dT - this.dCur) * 0.0004;
      dl = rd(dlL, DM, w - this.dCur);
      dr = rd(dlR, DM, w - this.dCur);
    } else {
      const d = Math.round(this.dCur);
      if (this.dX < 0 && this.dT !== d) {
        this.dNext = this.dT;
        this.dX = 0;
      }
      dl = dlL[(w - d) & DM];
      dr = dlR[(w - d) & DM];
      if (this.dX >= 0) {
        const t = 0.5 - 0.5 * Math.cos(Math.PI * this.dX);
        dl += (dlL[(w - this.dNext) & DM] - dl) * t;
        dr += (dlR[(w - this.dNext) & DM] - dr) * t;
        this.dX += 1 / XF;
        if (this.dX >= 1) {
          this.dCur = this.dNext;
          this.dX = -1;
        }
      }
    }
    const fb = this.frozen ? 1 : this.fb;
    let inL = il, inR = ir;
    if (this.wSpread) {
      // Spread: a ping-pong, the echoes trading sides, a mono sound starting Width toward the left
      const m = (il + ir) * 0.5, s = (il - ir) * 0.5;
      const th = (Math.PI / 4) * (1 - this.width);
      inL = m * Math.cos(th) * Math.SQRT2 + s;
      inR = m * Math.sin(th) * Math.SQRT2 - s;
      dlL[w] = sat(inL + fb * dr);
      dlR[w] = sat(inR + fb * dl);
    } else {
      dlL[w] = sat(inL + fb * dl);
      dlR[w] = sat(inR + fb * dr);
    }
    this.dw = (w + 1) & DM;
    this.wl = dl;
    this.wr = dr;
  }

  /**
   * Slip: samples the input all the time and plays it back at its own speed and direction.
   * Two heads, half a window apart, each start again from the newest sound every window;
   * small windows shift pitch, long ones play phrases that follow you. Frozen, the ring
   * stops filling, so the heads keep playing the same moment: a repeating tone.
   */
  private slip(il: number, ir: number): void {
    if (!this.frozen) {
      this.slL[this.sw] = il;
      this.slR[this.sw] = ir;
      this.sw = (this.sw + 1) & SM;
      this.sAnchor = this.sw;
    }
    const W = this.sW, s = this.sSpd, now = this.sAnchor;
    const classic = this.classic;
    let ol = 0, or = 0;
    for (let h = 0; h < (classic ? 1 : 2); h++) {
      let ph = this.sPh[h] + 1 / W;
      if (ph >= 1) {
        ph -= 1;
        this.sAge[h] = 0;
        // start where the head can play its whole window without passing what is being written
        this.sP0[h] = s > 0 ? (this.frozen ? now - s * W - 4 : now - Math.max(0, s - 1) * W - 4) : now - 4;
      }
      this.sPh[h] = ph;
      const pos = this.sP0[h] + s * this.sAge[h]++;
      // Classic: one head with short edges, read without interpolation: aliased and uneven
      const g = classic ? Math.min(1, ph * 24, (1 - ph) * 24) : sin2(ph);
      if (classic) {
        const j = Math.round(pos) & SM;
        ol += this.slL[j] * g;
        or += this.slR[j] * g;
      } else {
        ol += rd(this.slL, SM, pos) * g;
        or += rd(this.slR, SM, pos) * g;
      }
    }
    if (this.wSpread) {
      // Spread: a smooth pan, at a rate set by Time (and Clock)
      this.sPan += 1 / (8 * W);
      if (this.sPan >= 1) this.sPan -= 1;
      const pan = Math.sin(TAU * this.sPan) * this.width;
      const m = (ol + or) * 0.5;
      ol = m * (1 - pan);
      or = m * (1 + pan);
    }
    this.wl = ol;
    this.wr = or;
  }

  // ------------------------------------------------------------ micro-looper

  /** The loop at `pos` from the start of the region it plays (wrapping inside it). */
  private at(buf: Float32Array, pos: number): number {
    const LB = this.LB;
    let q = pos % LB;
    if (q < 0) q += LB;
    const j = Math.floor(q);
    const j1 = j + 1 >= LB ? 0 : j + 1;
    const M = this.NL - 1, rs = this.rs;
    const a = buf[(rs + j) & M];
    return a + (buf[(rs + j1) & M] - a) * (q - j);
  }

  /** Move the play head, the old one fading out as it carries on. */
  private jump(to: number, step: number): void {
    this.q = this.pp;
    this.qStep = step;
    this.xq = XJ;
    this.pp = to;
  }

  /** One sample of the loop into pl/pr, by mode; overdubs (or Classic's wear) go in where it plays. */
  private playLoop(xl: number, xr: number): void {
    const { mlL, mlR, LB } = this;
    const M = this.NL - 1;
    const mode = this.lmode;
    let l: number, r: number;
    let wpos: number, step: number;
    if (mode === 2) {
      // Stretch: grains of the loop at their own speed, while the place they come from moves at Modify's
      const c = this.stC;
      const pr = c < 0 ? -c * c : c * c;
      const G = this.G;
      l = r = 0;
      for (let h = 0; h < 2; h++) {
        let age = this.gA[h];
        if (age >= G) {
          age = age - G < G ? age - G : 0;
          this.gD[h] = pr < 0 ? -1 : 1;
          this.gS[h] = this.sp - this.gD[h] * age;
        }
        const g = sin2(age / G);
        const pos = this.gS[h] + this.gD[h] * age;
        l += this.at(mlL, pos) * g;
        r += this.at(mlR, pos) * g;
        this.gA[h] = age + 1;
      }
      wpos = this.sp;
      step = pr;
      this.sp += pr;
      if (this.sp >= LB) this.sp -= LB;
      else if (this.sp < 0) this.sp += LB;
      if (this.lSpread) {
        // Spread: a slow pan, faster the further Modify is from noon
        this.lPan += (0.05 + 0.45 * Math.abs(c)) / 32000;
        if (this.lPan >= 1) this.lPan -= 1;
        const pan = Math.sin(TAU * this.lPan);
        const m = (l + r) * 0.5;
        l = m * (1 - pan);
        r = m * (1 + pan);
      }
    } else {
      const p = this.pp;
      if (mode === 0) {
        // Env: while the input is louder than the sensitivity's threshold, the slice it came in on repeats
        const a = Math.max(xl < 0 ? -xl : xl, xr < 0 ? -xr : xr);
        this.envF = a > this.envF ? a : this.envF * this.envRel;
        const det = this.envF > this.thr;
        if (det && !this.detOn) this.slice = Math.floor(p / this.S);
        this.detOn = det;
        step = 1;
      } else step = this.spd;
      const eff = mode === 1 ? this.eff : LB;
      l = this.at(mlL, p);
      // Tape with Spread: the left side plays a copy backwards
      r = this.at(mlR, p);
      if (mode === 1 && this.lSpread) l = this.at(mlL, eff - 1 - p);
      if (this.xq > 0) {
        const g = sin2((this.xq / XJ) * 0.5);
        l += (this.at(mlL, this.q) - l) * g;
        r += (this.at(mlR, this.q) - r) * g;
        this.q += this.qStep;
        this.xq--;
      }
      wpos = p;
      const np = p + step;
      if (mode === 0) {
        const S = this.S;
        const end = Math.min(LB, (this.slice + 1) * S);
        if (this.detOn && np >= end) this.jump(this.slice * S + (np - end), step);
        else if (np >= LB) this.jump(np - LB, step);
        else this.pp = np;
        if (this.lSpread) {
          // Spread: still while quiet, panning side to side while it hears you, at a rate set by Length
          this.panAmt += ((this.detOn ? 1 : 0) - this.panAmt) * 0.002;
          this.lPan += 1 / (4 * S);
          if (this.lPan >= 1) this.lPan -= 1;
          const pan = Math.sin(TAU * this.lPan);
          const m = (l + r) * 0.5;
          l += (m * (1 - pan) - l) * this.panAmt;
          r += (m * (1 + pan) - r) * this.panAmt;
        }
      } else {
        if (np >= eff) this.jump(np % eff, step);
        else if (np < 0) this.jump(eff + (np % eff), step);
        else this.pp = np;
        if (this.classic) {
          // Classic: Length chops the loop on and off instead of shortening it
          const on = p % this.chopP < this.chopP * 0.5 ? 1 : 0;
          this.chop += (on - this.chop) * 0.02;
          l *= this.chop;
          r *= this.chop;
        }
      }
    }

    // overdub: clean input only, onto what plays, faded by Fade (No dub: replaced)
    const dub = this.dubbing || this.dubG;
    const j = (this.rs + Math.floor(((wpos % LB) + LB) % LB)) & M;
    if (dub) {
      const fb = this.p.nodub >= 0.5 ? 0 : 0.3 + 0.7 * this.p.fade;
      const s = Math.min(1, Math.abs(step));
      const cover = Math.max(1, Math.ceil(Math.abs(step)));
      const d = step < 0 ? -1 : 1;
      for (let c = 0; c < cover; c++) {
        const jj = (j + c * d) & M;
        if (jj !== this.lastW || c > 0) {
          mlL[jj] = mlL[jj] * fb + xl * s;
          mlR[jj] = mlR[jj] * fb + xr * s;
        } else {
          mlL[jj] += xl * s;
          mlR[jj] += xr * s;
        }
      }
      if (this.classic && this.p.nodub >= 0.5) l = r = 0;
    } else if (this.classic && mode !== 2 && j !== this.lastW) {
      // Classic: each pass wears the loop a little, duller and more driven
      const pj = (j - (step < 0 ? -1 : 1)) & M;
      const a = mlL[j] * 0.97 + mlL[pj] * 0.03, b = mlR[j] * 0.97 + mlR[pj] * 0.03;
      mlL[j] = a / (1 + 0.0015 * a * a);
      mlR[j] = b / (1 + 0.0015 * b * b);
    }
    this.lastW = j;
    this.pl = l;
    this.pr = r;
  }
}

export const MOOD_CLASSES: Partial<Record<ModuleType, new (id: string, type: ModuleType, sr: number) => Mod>> = {
  mood: MoodMod,
};
