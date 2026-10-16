// Controller → synth parameter mapping with MiniLab 3 defaults, MIDI learn and
// automatic detection of relative (endless-encoder) knob modes.

export interface ParamTarget {
  id: string;
  label: string;
  min: number;
  max: number;
}

/** Parameters a knob/fader can drive. "sel" = the operator selected in the editor. */
export const MAPPABLE: ParamTarget[] = [
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ id: `ops.${n - 1}.outputLevel`, label: `OP${n} level`, min: 0, max: 99 })),
  { id: 'feedback', label: 'Feedback', min: 0, max: 7 },
  { id: 'algorithm', label: 'Algorithm', min: 1, max: 32 },
  { id: 'sel.coarse', label: 'Sel. OP coarse', min: 0, max: 31 },
  { id: 'sel.fine', label: 'Sel. OP fine', min: 0, max: 99 },
  { id: 'sel.detune', label: 'Sel. OP detune', min: 0, max: 14 },
  { id: 'sel.outputLevel', label: 'Sel. OP level', min: 0, max: 99 },
  { id: 'sel.rates.0', label: 'Sel. OP rate 1 (attack)', min: 0, max: 99 },
  { id: 'sel.rates.1', label: 'Sel. OP rate 2 (decay)', min: 0, max: 99 },
  { id: 'sel.levels.2', label: 'Sel. OP level 3 (sustain)', min: 0, max: 99 },
  { id: 'sel.rates.3', label: 'Sel. OP rate 4 (release)', min: 0, max: 99 },
  { id: 'sel.velocitySens', label: 'Sel. OP velocity', min: 0, max: 7 },
  { id: 'lfo.speed', label: 'LFO speed', min: 0, max: 99 },
  { id: 'lfo.pmd', label: 'LFO pitch depth', min: 0, max: 99 },
  { id: 'lfo.amd', label: 'LFO amp depth', min: 0, max: 99 },
  { id: 'transpose', label: 'Transpose', min: 0, max: 48 },
  { id: 'master', label: 'Master volume', min: 0, max: 100 },
];

export const TARGET_BY_ID: Record<string, ParamTarget> = Object.fromEntries(MAPPABLE.map((t) => [t.id, t]));

export type KnobMode = 'absolute' | 'rel64' | 'rel2c';

export interface CcMapping {
  cc: number;
  target: string;
  /** hardware control name shown in the UI */
  control: string;
  mode: KnobMode;
}

/** Arturia MiniLab 3 factory CC numbers (knobs 1-8, faders 1-4). */
export function minilab3Defaults(): CcMapping[] {
  const knobs = [74, 71, 76, 77, 93, 18, 19, 16];
  const faders = [82, 83, 85, 17];
  const knobTargets = ['ops.0.outputLevel', 'ops.1.outputLevel', 'ops.2.outputLevel', 'ops.3.outputLevel', 'ops.4.outputLevel', 'ops.5.outputLevel', 'feedback', 'algorithm'];
  const faderTargets = ['sel.coarse', 'sel.fine', 'sel.rates.0', 'sel.rates.3'];
  return [
    ...knobs.map((cc, i) => ({ cc, target: knobTargets[i], control: `Knob ${i + 1}`, mode: 'absolute' as KnobMode })),
    ...faders.map((cc, i) => ({ cc, target: faderTargets[i], control: `Fader ${i + 1}`, mode: 'absolute' as KnobMode })),
  ];
}

/**
 * Tracks recent values per CC. Absolute knobs never send the same value twice
 * in a row while turning; endless encoders in relative mode do (e.g. 65, 65, 65).
 */
export class RelativeDetector {
  private history = new Map<number, number[]>();

  observe(cc: number, value: number): KnobMode | null {
    const h = this.history.get(cc) ?? [];
    h.push(value);
    if (h.length > 4) h.shift();
    this.history.set(cc, h);
    if (h.length < 3) return null;
    const last3 = h.slice(-3);
    if (last3[0] !== last3[1] || last3[1] !== last3[2]) return null;
    const v = last3[0];
    if (v >= 57 && v <= 71 && v !== 64) return 'rel64';
    if ((v >= 1 && v <= 8) || (v >= 120 && v <= 127)) return 'rel2c';
    return null;
  }
}

/** Apply an incoming CC value to a parameter's current value. */
export function applyCc(mode: KnobMode, value: number, current: number, t: ParamTarget): number {
  if (mode === 'absolute') return Math.round(t.min + (value / 127) * (t.max - t.min));
  // endless encoders: one detent = one parameter step
  const delta = mode === 'rel64' ? value - 64 : value < 64 ? value : value - 128;
  return Math.min(t.max, Math.max(t.min, Math.round(current + delta)));
}
