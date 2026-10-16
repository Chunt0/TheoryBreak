// DX7 voice data model. Parameter ranges mirror the original hardware so
// patches round-trip through standard .syx files.

export type Curve = 0 | 1 | 2 | 3; // -LIN, -EXP, +EXP, +LIN
export type LfoWave = 0 | 1 | 2 | 3 | 4 | 5; // tri, saw down, saw up, square, sine, S&H

export interface Operator {
  rates: [number, number, number, number]; // 0-99
  levels: [number, number, number, number]; // 0-99
  breakPoint: number; // 0-99, 39 = C3 (MIDI 60)
  leftDepth: number; // 0-99
  rightDepth: number; // 0-99
  leftCurve: Curve;
  rightCurve: Curve;
  rateScaling: number; // 0-7
  ampModSens: number; // 0-3
  velocitySens: number; // 0-7
  outputLevel: number; // 0-99
  oscMode: 0 | 1; // 0 = ratio, 1 = fixed
  coarse: number; // 0-31
  fine: number; // 0-99
  detune: number; // 0-14, 7 = centre
  enabled: boolean; // editor-only operator switch
}

export interface Patch {
  name: string; // max 10 chars
  /** index 0 = OP1 … 5 = OP6 */
  ops: Operator[];
  pitchEg: { rates: [number, number, number, number]; levels: [number, number, number, number] };
  algorithm: number; // 1-32
  feedback: number; // 0-7
  oscSync: boolean;
  lfo: { speed: number; delay: number; pmd: number; amd: number; sync: boolean; wave: LfoWave };
  pitchModSens: number; // 0-7
  transpose: number; // 0-48, 24 = no transpose
}

/** Performance settings that live outside the voice (like the DX7 "function" section). */
export interface PartConfig {
  polyphony: number;
  mono: boolean;
  pbRange: number; // semitones 0-12
  portaTime: number; // 0-99
  volume: number; // 0-1
  wheel: ModRouting;
  aftertouch: ModRouting;
}

export interface ModRouting {
  range: number; // 0-99
  pitch: boolean;
  amp: boolean;
  eg: boolean;
}

export const defaultPartConfig = (): PartConfig => ({
  polyphony: 16,
  mono: false,
  pbRange: 2,
  portaTime: 0,
  volume: 0.8,
  wheel: { range: 50, pitch: true, amp: false, eg: false },
  aftertouch: { range: 0, pitch: false, amp: false, eg: false },
});

export function initOperator(carrier = false): Operator {
  return {
    rates: [99, 99, 99, 99],
    levels: [99, 99, 99, 0],
    breakPoint: 39,
    leftDepth: 0,
    rightDepth: 0,
    leftCurve: 0,
    rightCurve: 0,
    rateScaling: 0,
    ampModSens: 0,
    velocitySens: 0,
    outputLevel: carrier ? 99 : 0,
    oscMode: 0,
    coarse: 1,
    fine: 0,
    detune: 7,
    enabled: true,
  };
}

/** The DX7 "INIT VOICE": one sine carrier, everything else off. */
export function initPatch(): Patch {
  return {
    name: 'INIT VOICE',
    ops: [initOperator(true), initOperator(), initOperator(), initOperator(), initOperator(), initOperator()],
    pitchEg: { rates: [99, 99, 99, 99], levels: [50, 50, 50, 50] },
    algorithm: 1,
    feedback: 0,
    oscSync: true,
    lfo: { speed: 35, delay: 0, pmd: 0, amd: 0, sync: true, wave: 0 },
    pitchModSens: 3,
    transpose: 24,
  };
}

export const clonePatch = (p: Patch): Patch => structuredClone(p);

const clampInt = (v: unknown, lo: number, hi: number, dflt: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : dflt;
  return Math.min(hi, Math.max(lo, n));
};

/** Sanitise untrusted patch data (files, storage) into a valid Patch. */
export function normalizePatch(raw: unknown): Patch {
  const src = (raw ?? {}) as Partial<Patch>;
  const base = initPatch();
  const ops = Array.from({ length: 6 }, (_, i) => {
    const o = (src.ops?.[i] ?? {}) as Partial<Operator>;
    const d = base.ops[i];
    return {
      rates: [0, 1, 2, 3].map((k) => clampInt(o.rates?.[k], 0, 99, d.rates[k])) as Operator['rates'],
      levels: [0, 1, 2, 3].map((k) => clampInt(o.levels?.[k], 0, 99, d.levels[k])) as Operator['levels'],
      breakPoint: clampInt(o.breakPoint, 0, 99, d.breakPoint),
      leftDepth: clampInt(o.leftDepth, 0, 99, d.leftDepth),
      rightDepth: clampInt(o.rightDepth, 0, 99, d.rightDepth),
      leftCurve: clampInt(o.leftCurve, 0, 3, d.leftCurve) as Curve,
      rightCurve: clampInt(o.rightCurve, 0, 3, d.rightCurve) as Curve,
      rateScaling: clampInt(o.rateScaling, 0, 7, d.rateScaling),
      ampModSens: clampInt(o.ampModSens, 0, 3, d.ampModSens),
      velocitySens: clampInt(o.velocitySens, 0, 7, d.velocitySens),
      outputLevel: clampInt(o.outputLevel, 0, 99, d.outputLevel),
      oscMode: clampInt(o.oscMode, 0, 1, d.oscMode) as 0 | 1,
      coarse: clampInt(o.coarse, 0, 31, d.coarse),
      fine: clampInt(o.fine, 0, 99, d.fine),
      detune: clampInt(o.detune, 0, 14, d.detune),
      enabled: o.enabled !== false,
    };
  });
  const peg = src.pitchEg ?? base.pitchEg;
  const lfo = (src.lfo ?? {}) as Partial<Patch['lfo']>;
  return {
    name: String(src.name ?? base.name).slice(0, 10),
    ops,
    pitchEg: {
      rates: [0, 1, 2, 3].map((k) => clampInt(peg.rates?.[k], 0, 99, 99)) as Patch['pitchEg']['rates'],
      levels: [0, 1, 2, 3].map((k) => clampInt(peg.levels?.[k], 0, 99, 50)) as Patch['pitchEg']['levels'],
    },
    algorithm: clampInt(src.algorithm, 1, 32, 1),
    feedback: clampInt(src.feedback, 0, 7, 0),
    oscSync: src.oscSync !== false,
    lfo: {
      speed: clampInt(lfo.speed, 0, 99, 35),
      delay: clampInt(lfo.delay, 0, 99, 0),
      pmd: clampInt(lfo.pmd, 0, 99, 0),
      amd: clampInt(lfo.amd, 0, 99, 0),
      sync: lfo.sync !== false,
      wave: clampInt(lfo.wave, 0, 5, 0) as LfoWave,
    },
    pitchModSens: clampInt(src.pitchModSens, 0, 7, 3),
    transpose: clampInt(src.transpose, 0, 48, 24),
  };
}

// ---------------------------------------------------------------------------
// Display helpers

export const CURVE_NAMES = ['-LIN', '-EXP', '+EXP', '+LIN'] as const;
export const LFO_WAVE_NAMES = ['Triangle', 'Saw down', 'Saw up', 'Square', 'Sine', 'Sample & hold'] as const;

/** Frequency ratio for ratio-mode operators (coarse 0 = 0.5). */
export function opRatio(op: Operator): number {
  return (op.coarse === 0 ? 0.5 : op.coarse) * (1 + op.fine / 100);
}

export function opFixedHz(op: Operator): number {
  return Math.pow(10, (op.coarse & 3) + op.fine / 100);
}

export function opFreqText(op: Operator): string {
  if (op.oscMode === 1) {
    const hz = opFixedHz(op);
    return hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${hz < 10 ? hz.toFixed(3) : hz < 100 ? hz.toFixed(2) : hz.toFixed(1)} Hz`;
  }
  return `× ${opRatio(op).toFixed(2)}`;
}

/** DX7 breakpoint value → note name (0 = A-1, 39 = C3 in Yamaha octave naming). */
export function breakPointName(bp: number): string {
  const midi = bp + 21;
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 2}`;
}

export const detuneText = (d: number): string => (d === 7 ? '0' : d > 7 ? `+${d - 7}` : `${d - 7}`);

/** Approximate peak modulation index (radians) produced by a modulator at a given output level. */
export function modIndex(outputLevel: number): number {
  const lvl = outputLevel >= 20 ? 28 + outputLevel : [0, 5, 9, 13, 17, 20, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 42, 43, 45, 46][outputLevel];
  // full EG level (99) + output level, as in the voice code
  const actual = (63 << 6) + (Math.min(127, lvl) << 5) - 4256;
  if (actual <= 16) return 0;
  return 2 * Math.PI * Math.pow(2, actual / 256 - 14);
}
