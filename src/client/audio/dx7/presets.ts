// Original factory sounds for the DX7 Lab (not copies of Yamaha ROM data).
// Each is a teaching example of a classic FM recipe; notes explain the trick.

import { initOperator, initPatch, type Operator, type Patch } from './patch';

type R4 = [number, number, number, number];

function O(coarse: number, outputLevel: number, rates: R4, levels: R4, extra: Partial<Operator> = {}): Operator {
  return { ...initOperator(), coarse, outputLevel, rates, levels, ...extra };
}
const OFF = (): Operator => ({ ...initOperator(), outputLevel: 0 });

function P(name: string, algorithm: number, feedback: number, ops: Operator[], extra: Partial<Patch> = {}): Patch {
  return { ...initPatch(), name, algorithm, feedback, ops, ...extra };
}

export interface Preset {
  patch: Patch;
  category: 'Keys' | 'Bass' | 'Brass & Lead' | 'Mallet & Bell' | 'Pad & Organ' | 'Utility';
  notes: string;
}

export const PRESETS: Preset[] = [
  {
    category: 'Keys',
    notes: 'Algorithm 5: three carrier/modulator pairs. OP4 at ratio 14 adds the metallic "tine" that dies away quickly; velocity opens up OP2 and OP4 so harder playing barks.',
    patch: P('TINE PIANO', 5, 6, [
      O(1, 99, [96, 25, 25, 67], [99, 75, 0, 0], { rateScaling: 3, velocitySens: 2 }),
      O(1, 72, [95, 50, 35, 78], [99, 75, 0, 0], { rateScaling: 3, velocitySens: 6 }),
      O(1, 94, [95, 20, 20, 50], [99, 85, 0, 0], { detune: 10, rateScaling: 3, velocitySens: 2 }),
      O(14, 62, [95, 68, 40, 80], [99, 0, 0, 0], { rateScaling: 4, velocitySens: 7 }),
      O(1, 82, [95, 29, 20, 50], [99, 95, 0, 0], { detune: 4, velocitySens: 2 }),
      O(1, 68, [95, 29, 20, 50], [99, 95, 0, 0], { velocitySens: 4 }),
    ]),
  },
  {
    category: 'Keys',
    notes: 'A clear, sustaining tone designed for ear training: mostly pure harmonics with a gentle velocity-sensitive bloom so intervals and chord qualities are easy to hear.',
    patch: P('LESSON KEYS', 5, 0, [
      O(1, 99, [95, 40, 30, 60], [99, 94, 90, 0], { velocitySens: 2, rateScaling: 2 }),
      O(1, 70, [95, 50, 40, 60], [99, 80, 70, 0], { velocitySens: 4, rateScaling: 2 }),
      O(2, 75, [95, 50, 30, 60], [99, 80, 70, 0], { velocitySens: 2 }),
      O(2, 55, [95, 50, 40, 60], [99, 80, 70, 0], { velocitySens: 3 }),
      O(1, 80, [95, 40, 30, 60], [99, 92, 88, 0], { detune: 9, velocitySens: 2 }),
      O(1, 60, [95, 70, 50, 60], [99, 60, 50, 0], { velocitySens: 5 }),
    ]),
  },
  {
    category: 'Keys',
    notes: 'Algorithm 3: two 3-operator stacks. A 3:1 modulator on top of the stack makes the nasal clavinet bite; fast release mimics the damper.',
    patch: P('CLAVINET', 3, 6, [
      O(1, 99, [99, 55, 40, 85], [99, 70, 0, 0], { velocitySens: 3, rateScaling: 2 }),
      O(1, 78, [99, 60, 40, 85], [99, 60, 0, 0], { velocitySens: 5 }),
      O(3, 70, [99, 70, 45, 85], [99, 50, 0, 0], { velocitySens: 5 }),
      O(2, 85, [99, 55, 40, 85], [99, 70, 0, 0], { velocitySens: 3 }),
      O(1, 72, [99, 60, 40, 85], [99, 60, 0, 0], { velocitySens: 4 }),
      O(1, 60, [99, 60, 40, 85], [99, 60, 0, 0]),
    ]),
  },
  {
    category: 'Keys',
    notes: 'Bright 1:1 and 1:3 pairs with quick decays — FM\'s take on a plucked keyboard string.',
    patch: P('HARPSICHRD', 5, 5, [
      O(1, 99, [99, 52, 40, 70], [99, 75, 0, 0], { rateScaling: 3, velocitySens: 1 }),
      O(1, 84, [99, 60, 40, 70], [99, 70, 0, 0], { rateScaling: 3, velocitySens: 2 }),
      O(2, 85, [99, 52, 40, 70], [99, 75, 0, 0], { rateScaling: 3 }),
      O(3, 75, [99, 60, 40, 70], [99, 70, 0, 0], { rateScaling: 3 }),
      O(4, 70, [99, 55, 40, 70], [99, 70, 0, 0], { rateScaling: 3 }),
      O(1, 74, [99, 60, 40, 70], [99, 70, 0, 0], { rateScaling: 3 }),
    ]),
  },
  {
    category: 'Bass',
    notes: 'Algorithm 1. OP1/OP2 at ratio 0.5 (an octave down) give a saw-like body; the OP3←OP4←OP5 stack adds a percussive "thunk" that fades fast.',
    patch: P('SOLID BASS', 1, 5, [
      O(0, 99, [99, 45, 30, 70], [99, 88, 0, 0], { rateScaling: 2, velocitySens: 2 }),
      O(0, 80, [99, 55, 35, 75], [99, 70, 0, 0], { velocitySens: 5 }),
      O(1, 70, [99, 70, 35, 70], [99, 50, 0, 0], { velocitySens: 3 }),
      O(1, 75, [99, 75, 40, 75], [99, 30, 0, 0], { velocitySens: 6 }),
      O(3, 60, [99, 80, 50, 80], [99, 0, 0, 0], { velocitySens: 4 }),
      O(1, 50, [99, 80, 50, 80], [99, 0, 0, 0]),
    ]),
  },
  {
    category: 'Bass',
    notes: 'Round electric-bass tone used under progressions: a 1:1 pair for the body and a 2:1 pair for the attack.',
    patch: P('ROUND BASS', 5, 0, [
      O(1, 99, [99, 45, 35, 72], [99, 88, 0, 0], { velocitySens: 3, rateScaling: 2 }),
      O(1, 76, [99, 55, 40, 72], [99, 60, 40, 0], { velocitySens: 5 }),
      O(1, 80, [99, 50, 35, 72], [99, 80, 0, 0], { detune: 8, velocitySens: 2 }),
      O(2, 66, [99, 65, 40, 72], [99, 30, 0, 0], { velocitySens: 5 }),
      OFF(),
      OFF(),
    ]),
  },
  {
    category: 'Brass & Lead',
    notes: 'Algorithm 22: one feedback modulator (OP6) drives three carriers. Modulators attack slower than carriers so brightness swells in — the essence of FM brass. Slight pitch scoop from the pitch EG.',
    patch: P('FM BRASS', 22, 6, [
      O(1, 98, [65, 60, 50, 65], [99, 92, 90, 0], { velocitySens: 2 }),
      O(1, 84, [55, 55, 45, 60], [99, 85, 80, 0], { velocitySens: 4 }),
      O(1, 90, [65, 60, 50, 65], [99, 92, 90, 0], { detune: 8 }),
      O(1, 88, [65, 60, 50, 65], [99, 92, 90, 0], { detune: 6 }),
      O(1, 80, [65, 60, 50, 65], [99, 92, 90, 0], { detune: 9 }),
      O(1, 78, [55, 50, 45, 60], [99, 85, 80, 0], { velocitySens: 3 }),
    ], {
      pitchEg: { rates: [99, 50, 99, 50], levels: [48, 50, 50, 50] },
      lfo: { speed: 34, delay: 33, pmd: 4, amd: 0, sync: false, wave: 4 },
      pitchModSens: 3,
    }),
  },
  {
    category: 'Brass & Lead',
    notes: 'Algorithm 1 with maximum feedback on OP6 turns the 4-op stack into a sawtooth-like lead. Push the mod wheel for vibrato; try Mono + portamento.',
    patch: P('SAW LEAD', 1, 7, [
      O(1, 99, [99, 60, 50, 70], [99, 95, 92, 0], { velocitySens: 1 }),
      O(1, 82, [99, 40, 30, 70], [99, 90, 85, 0], { velocitySens: 3 }),
      O(1, 85, [99, 60, 50, 70], [99, 95, 92, 0], { detune: 10 }),
      O(1, 80, [99, 50, 40, 70], [99, 92, 90, 0]),
      O(1, 72, [99, 50, 40, 70], [99, 92, 90, 0]),
      O(1, 70, [99, 50, 40, 70], [99, 92, 90, 0]),
    ], { lfo: { speed: 40, delay: 40, pmd: 0, amd: 0, sync: false, wave: 0 }, pitchModSens: 3 }),
  },
  {
    category: 'Brass & Lead',
    notes: 'Delayed vibrato from the LFO and a feedback operator at low level for breath noise.',
    patch: P('SOFT FLUTE', 5, 7, [
      O(1, 99, [62, 50, 50, 65], [99, 96, 94, 0], { velocitySens: 2 }),
      O(1, 62, [70, 50, 50, 65], [99, 80, 70, 0], { velocitySens: 3 }),
      O(2, 60, [62, 50, 50, 65], [99, 90, 88, 0]),
      OFF(),
      O(4, 50, [70, 50, 50, 65], [99, 80, 70, 0]),
      O(9, 85, [70, 50, 50, 65], [99, 90, 85, 0]),
    ], { lfo: { speed: 32, delay: 55, pmd: 6, amd: 0, sync: false, wave: 4 }, pitchModSens: 3 }),
  },
  {
    category: 'Mallet & Bell',
    notes: 'A non-integer ratio (4.50: coarse 3, fine 50) creates inharmonic sidebands — that is what makes FM bells sound like metal. Long, exponential-looking decays.',
    patch: P('TUBE BELLS', 5, 0, [
      O(1, 95, [99, 30, 20, 30], [99, 0, 0, 0], { velocitySens: 2 }),
      O(3, 75, [99, 35, 20, 30], [99, 0, 0, 0], { fine: 50, velocitySens: 4 }),
      O(1, 90, [99, 30, 20, 30], [99, 0, 0, 0], { detune: 12, velocitySens: 2 }),
      O(3, 72, [99, 35, 20, 30], [99, 0, 0, 0], { fine: 50, detune: 9, velocitySens: 4 }),
      O(2, 78, [99, 40, 20, 35], [99, 0, 0, 0], { velocitySens: 2 }),
      O(5, 65, [99, 50, 30, 40], [99, 0, 0, 0], { velocitySens: 4 }),
    ]),
  },
  {
    category: 'Mallet & Bell',
    notes: 'A 4:1 carrier imitates the tuned bar\'s strong 4th partial; a ratio-10 blip on OP5 is the mallet hit.',
    patch: P('MARIMBA', 5, 0, [
      O(1, 99, [99, 52, 35, 50], [99, 0, 0, 0], { rateScaling: 3, velocitySens: 2 }),
      O(4, 70, [99, 65, 40, 60], [99, 0, 0, 0], { velocitySens: 5 }),
      O(4, 75, [99, 65, 40, 60], [99, 0, 0, 0], { rateScaling: 3, velocitySens: 3 }),
      O(1, 40, [99, 65, 40, 60], [99, 0, 0, 0]),
      O(10, 55, [99, 80, 50, 70], [99, 0, 0, 0], { velocitySens: 5 }),
      OFF(),
    ]),
  },
  {
    category: 'Mallet & Bell',
    notes: 'High-ratio modulator (×7) with a very short envelope gives the "ping" of a thumb piano.',
    patch: P('KALIMBA', 5, 0, [
      O(1, 99, [99, 55, 40, 60], [99, 0, 0, 0], { rateScaling: 3, velocitySens: 2 }),
      O(7, 60, [99, 75, 50, 60], [99, 0, 0, 0], { velocitySens: 5 }),
      O(3, 70, [99, 70, 50, 60], [99, 0, 0, 0], { rateScaling: 3 }),
      O(1, 50, [99, 70, 50, 60], [99, 0, 0, 0]),
      OFF(),
      OFF(),
    ]),
  },
  {
    category: 'Pad & Organ',
    notes: 'Algorithm 32 = six sine carriers = additive synthesis. Ratios 0.5/1/1.5/2/3/4 are Hammond drawbars 16′ 8′ 5⅓′ 4′ 2⅔′ 2′.',
    patch: P('DRAWBARS', 32, 3, [
      O(0, 90, [99, 99, 99, 85], [99, 99, 99, 0]),
      O(1, 99, [99, 99, 99, 85], [99, 99, 99, 0]),
      O(1, 80, [99, 99, 99, 85], [99, 99, 99, 0], { fine: 50 }),
      O(2, 88, [99, 99, 99, 85], [99, 99, 99, 0]),
      O(3, 82, [99, 99, 99, 85], [99, 99, 99, 0]),
      O(4, 80, [99, 99, 99, 85], [99, 99, 99, 0]),
    ], { lfo: { speed: 50, delay: 0, pmd: 3, amd: 0, sync: false, wave: 4 }, pitchModSens: 2 }),
  },
  {
    category: 'Pad & Organ',
    notes: 'Three detuned 1:1 pairs with slow attacks: detune creates the chorus-like movement of a string section.',
    patch: P('STRING PAD', 5, 4, [
      O(1, 92, [42, 30, 50, 40], [99, 90, 90, 0]),
      O(1, 74, [40, 30, 50, 40], [99, 85, 85, 0]),
      O(1, 90, [42, 30, 50, 40], [99, 90, 90, 0], { detune: 10 }),
      O(1, 72, [40, 30, 50, 40], [99, 85, 85, 0]),
      O(1, 88, [42, 30, 50, 40], [99, 90, 90, 0], { detune: 4 }),
      O(1, 70, [40, 30, 50, 40], [99, 85, 85, 0]),
    ], { lfo: { speed: 30, delay: 60, pmd: 6, amd: 0, sync: false, wave: 4 }, pitchModSens: 3 }),
  },
  {
    category: 'Pad & Organ',
    notes: 'Mostly carriers (algorithm 31) at harmonic ratios, slightly detuned, with a ×7 modulator for a glassy edge.',
    patch: P('GLASS PAD', 31, 2, [
      O(1, 90, [35, 30, 40, 35], [99, 95, 90, 0]),
      O(2, 80, [35, 30, 40, 35], [99, 95, 90, 0], { detune: 9 }),
      O(3, 70, [35, 30, 40, 35], [99, 95, 90, 0], { fine: 1 }),
      O(4, 65, [35, 30, 40, 35], [99, 95, 90, 0], { detune: 5 }),
      O(1, 85, [35, 30, 40, 35], [99, 95, 90, 0], { detune: 4 }),
      O(7, 60, [35, 30, 40, 35], [99, 95, 90, 0]),
    ], { lfo: { speed: 20, delay: 0, pmd: 4, amd: 0, sync: false, wave: 4 }, pitchModSens: 2 }),
  },
  {
    category: 'Mallet & Bell',
    notes: 'Jazz vibes: a 4:1 carrier for the bar\'s strong 4th partial, a short ×10 mallet click, and the LFO driving amplitude (AMD + AMS 3) as the motor tremolo.',
    patch: P('VIBRAPHONE', 5, 0, [
      O(1, 99, [99, 35, 25, 45], [99, 80, 0, 0], { rateScaling: 2, velocitySens: 3, ampModSens: 3 }),
      O(4, 58, [99, 60, 35, 50], [99, 0, 0, 0], { velocitySens: 5 }),
      O(4, 70, [99, 55, 40, 50], [99, 0, 0, 0], { rateScaling: 2, ampModSens: 3 }),
      O(1, 40, [99, 60, 40, 50], [99, 0, 0, 0]),
      O(1, 80, [99, 35, 25, 45], [99, 80, 0, 0], { detune: 9, rateScaling: 2, ampModSens: 3 }),
      O(10, 45, [99, 80, 60, 70], [99, 0, 0, 0], { velocitySens: 4 }),
    ], { lfo: { speed: 30, delay: 0, pmd: 0, amd: 55, sync: false, wave: 4 }, pitchModSens: 0 }),
  },
  {
    category: 'Utility',
    notes: 'The blank canvas: one sine-wave carrier. Start here to learn FM one operator at a time.',
    patch: initPatch(),
  },
];

export function presetByName(name: string): Patch {
  const p = PRESETS.find((x) => x.patch.name === name);
  return structuredClone((p ?? PRESETS[0]).patch);
}

export const LESSON_PATCH_NAMES = ['LESSON KEYS', 'TINE PIANO', 'VIBRAPHONE', 'DRAWBARS', 'STRING PAD', 'CLAVINET'];
