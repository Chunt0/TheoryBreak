// The fm lessons' demos: patches rendered offline so a lesson can play
// "before" and "after" without touching the instrument you are working on.
import type { SynthDemo } from '../../../synth/demo';
import type { Operator } from '../../../../audio/dx7/patch';

type R4 = [number, number, number, number];
/** An operator: ratio, level, and an envelope as 4 rates / 4 levels (DX7 order). */
export const op = (coarse: number, outputLevel: number, rates: R4 = [99, 99, 99, 99], levels: R4 = [99, 99, 99, 0], more: Partial<Operator> = {}): Partial<Operator> =>
  ({ coarse, outputLevel, rates, levels, ...more });

// a carrier that holds while the key is down and lets go quickly
export const HOLD: [R4, R4] = [[99, 99, 99, 60], [99, 99, 99, 0]];

export const INDEX: SynthDemo = {
        name: 'INDEX', fm: { algorithm: 1, ops: { 1: op(1, 99, ...HOLD), 2: op(1, 0) } },
        caption: 'A 1:1 pair (algorithm 1, OP2 modulating OP1). Modulator level 0, 60, 75, 85 and 99: the spectrum fills upward as the index rises.',
        tries: [
          { label: 'Level 0', note: 'a sine' },
          { label: '60', set: { 'op2.outputLevel': 60 } },
          { label: '75', set: { 'op2.outputLevel': 75 } },
          { label: '85', set: { 'op2.outputLevel': 85 } },
          { label: '99', set: { 'op2.outputLevel': 99 } },
        ],
      };

export const RATIOS: SynthDemo = {
        name: 'RATIOS', fm: { algorithm: 1, ops: { 1: op(1, 99, ...HOLD), 2: op(1, 80) } },
        caption: 'Same index (modulator level 80), different modulator ratios: 1, 2, 3, 3.5 and 1.41. Watch the spectrum\'s peaks leave the harmonic ticks on the non-integer ratios.',
        tries: [
          { label: '1 : 1' },
          { label: '1 : 2', set: { 'op2.coarse': 2 } },
          { label: '1 : 3', set: { 'op2.coarse': 3 } },
          { label: '1 : 3.5', set: { 'op2.coarse': 3, 'op2.fine': 17 } },
          { label: '1 : 1.41', set: { 'op2.fine': 41 } },
        ],
      };

export const BELL: SynthDemo = {
        name: 'BELL', fm: { algorithm: 1, ops: { 1: op(1, 99, [99, 30, 25, 30], [99, 60, 0, 0]), 2: op(3, 78, [99, 35, 25, 30], [99, 50, 0, 0], { fine: 17 }) } },
        play: [['C4', 0, 2.5]], seconds: 4,
        caption: 'A bell: a 1:3.5 pair with both envelopes decaying (the modulator a little faster, so it starts bright and mellows). Then the same at 1:3 (a plucked, pitched tone) and 1:4.',
        tries: [{ label: '1 : 3.5', note: 'bell' }, { label: '1 : 3', set: { 'op2.fine': 0 } }, { label: '1 : 4', set: { 'op2.coarse': 4, 'op2.fine': 0 } }],
      };

export const FM_PLUCK: SynthDemo = {
        name: 'FM PLUCK', fm: { algorithm: 1, ops: { 1: op(1, 99, [99, 40, 30, 55], [99, 70, 0, 0]), 2: op(1, 86, [99, 62, 40, 55], [99, 30, 0, 0]) } },
        play: [['G3', 0, 0.8], ['C4', 1, 1.2]], view: 'spectrum', seconds: 3.4,
        caption: 'A 1:1 pluck: the modulator decays faster than the carrier, so each note starts bright and settles. Then with a constant modulator (static timbre) and with a slow modulator attack (brass-like swell).',
        tries: [
          { label: 'Pluck' },
          { label: 'Static modulator', set: { 'op2.rates.1': 99, 'op2.levels.1': 99, 'op2.levels.2': 99, 'op2.outputLevel': 74 } },
          { label: 'Slow modulator attack', set: { 'op2.rates.0': 45, 'op2.levels.1': 85, 'op2.levels.2': 80, 'op2.rates.2': 99 } },
        ],
      };

export const FM_BRASS: SynthDemo = {
        name: 'FM BRASS', fm: { algorithm: 1, ops: { 1: op(1, 99, [72, 50, 99, 60], [99, 92, 90, 0]), 2: op(1, 82, [55, 45, 99, 60], [99, 88, 84, 0]) } },
        play: [['F3', 0, 1], ['A3', 1.1, 0.5], ['C4', 1.7, 1.4]], view: 'spectrum',
        caption: 'Brass: carrier and modulator at 1:1, the modulator attacking a little slower than the carrier, settling to a high sustain. Then the modulator\'s attack as fast as the carrier\'s: it loses the swell.',
        tries: [{ label: 'Brass' }, { label: 'Same attack', set: { 'op2.rates.0': 72 } }],
      };

export const VELOCITY: SynthDemo = {
        name: 'VELOCITY', fm: { algorithm: 1, ops: { 1: op(1, 99, [96, 40, 30, 55], [99, 70, 0, 0], { velocitySens: 2 }), 2: op(1, 84, [99, 55, 35, 55], [99, 40, 0, 0], { velocitySens: 7 }) } },
        play: [['C3', 0, 0.6, 30], ['C3', 0.8, 0.6, 70], ['C3', 1.6, 0.6, 127]], seconds: 3.2, view: 'none',
        caption: 'Three notes at velocity 30, 70 and 127 with the modulator\'s velocity sensitivity at 7: louder and much brighter. Then with sensitivity 0 on the modulator: only louder.',
        tries: [{ label: 'Sens 7' }, { label: 'Sens 0', set: { 'op2.velocitySens': 0 } }],
      };

export const STACK: SynthDemo = {
        name: 'STACK', fm: { algorithm: 1, ops: { 3: op(1, 99, ...HOLD), 4: op(1, 78), 5: op(2, 70), 6: op(1, 0) } },
        caption: 'A stack (algorithm 1, the right column): OP4 modulates OP3, OP5 modulates OP4. A modulator that is itself modulated has a richer spectrum, so the carrier\'s sidebands multiply. Then OP5 turned off (a plain 2-op pair) and OP6 added on top.',
        tries: [{ label: '5 → 4 → 3' }, { label: '4 → 3 only', set: { 'op5.outputLevel': 0 } }, { label: '6 → 5 → 4 → 3', set: { 'op6.outputLevel': 72 } }],
      };

export const ADDITIVE: SynthDemo = {
        name: 'ADDITIVE', fm: { algorithm: 32, ops: { 1: op(1, 92, ...HOLD), 2: op(2, 84, ...HOLD), 3: op(3, 80, ...HOLD), 4: op(4, 0, ...HOLD), 5: op(6, 0, ...HOLD), 6: op(8, 0, ...HOLD) } },
        caption: 'Algorithm 32: six carriers, no modulation, so each operator is one sine harmonic: additive synthesis, like organ drawbars. Harmonics 1–3, then adding 4, 6 and 8.',
        tries: [{ label: '1 2 3' }, { label: '+4 +6 +8', set: { 'op4.outputLevel': 78, 'op5.outputLevel': 74, 'op6.outputLevel': 72 } }],
      };

export const FEEDBACK: SynthDemo = {
        name: 'FEEDBACK', fm: { algorithm: 32, feedback: 0, ops: { 6: op(1, 92, ...HOLD) } },
        caption: 'One carrier (OP6 in algorithm 32) feeding back on itself: feedback 0, 4, 6 and 7. A sine becomes a saw.',
        tries: [{ label: 'FB 0' }, { label: 'FB 4', set: { feedback: 4 } }, { label: 'FB 6', set: { feedback: 6 } }, { label: 'FB 7', set: { feedback: 7 } }],
      };

export const SCALING: SynthDemo = {
        name: 'SCALING', fm: { algorithm: 1, ops: { 1: op(1, 99, [99, 40, 30, 55], [99, 75, 0, 0]), 2: op(1, 84, [99, 50, 35, 55], [99, 45, 0, 0]) } },
        play: [['C2', 0, 0.9], ['C4', 1, 0.9], ['C6', 2, 0.9]], seconds: 3.8, view: 'none',
        caption: 'C2, C4 and C6 with no scaling (the top note is shrill and rings as long as the bottom), then with right depth on the modulator (darker high notes), then with rate scaling too (faster decays up top).',
        tries: [
          { label: 'No scaling' },
          { label: 'Level scaling', set: { 'op2.rightDepth': 60, 'op2.rightCurve': 1 } },
          { label: '+ rate scaling', set: { 'op2.rightDepth': 60, 'op2.rightCurve': 1, 'op1.rateScaling': 5, 'op2.rateScaling': 5 } },
        ],
      };

export const E_PIANO: SynthDemo = {
        name: 'E PIANO', fm: { algorithm: 5, ops: {
          1: op(1, 99, [96, 28, 25, 60], [99, 80, 0, 0], { velocitySens: 2 }),
          2: op(1, 74, [96, 40, 30, 60], [99, 60, 0, 0], { velocitySens: 6 }),
          3: op(1, 85, [98, 60, 40, 60], [99, 0, 0, 0], { velocitySens: 3 }),
          4: op(14, 72, [98, 70, 50, 70], [99, 0, 0, 0], { velocitySens: 6 }),
        } },
        play: [['E3', 0, 1.6, 90], ['G♯3', 0, 1.6, 90], ['B3', 0, 1.6, 90], ['D♯4', 0, 1.6, 90]], seconds: 3.2, view: 'spectrum', hz: 4000,
        caption: 'Electric piano (algorithm 5): a 1:1 pair for the warm body, and a carrier with a ×14 modulator for the metallic tine that dies in a moment. Then the tine pair alone, then the body alone.',
        tries: [{ label: 'E. piano' }, { label: 'Tine only', set: { 'op1.outputLevel': 0 } }, { label: 'Body only', set: { 'op3.outputLevel': 0 } }],
      };

export const FM_BASS: SynthDemo = {
        name: 'FM BASS', fm: { algorithm: 1, ops: {
          1: op(0, 99, [99, 50, 35, 70], [99, 85, 70, 0]),
          2: op(0, 82, [99, 60, 40, 70], [99, 55, 40, 0], { velocitySens: 4 }),
        } },
        play: [['C2', 0, 0.25], ['C2', 0.3, 0.25], ['E♭2', 0.6, 0.25], ['G2', 0.9, 0.25], ['B♭2', 1.2, 0.25], ['C3', 1.5, 0.6]], seconds: 2.8, view: 'spectrum',
        caption: 'FM bass: carrier and modulator both ×0.5 (an octave down) at 1:1, the modulator\'s brightness decaying quickly. Then with the modulator more prominent, and with the modulator at ×1 (a 1:2 hollow bass).',
        tries: [{ label: 'Bass' }, { label: 'Brighter', set: { 'op2.outputLevel': 90 } }, { label: '1 : 2', set: { 'op2.coarse': 1 } }],
      };

export const MARIMBA: SynthDemo = {
        name: 'MARIMBA', fm: { algorithm: 5, ops: {
          1: op(1, 99, [99, 48, 35, 60], [99, 0, 0, 0]),
          2: op(1, 66, [99, 70, 50, 60], [99, 0, 0, 0]),
          3: op(4, 76, [99, 70, 50, 60], [99, 0, 0, 0]),
          5: op(1, 82, [99, 72, 60, 80], [99, 0, 0, 0]),
          6: op(10, 86, [99, 78, 60, 80], [99, 0, 0, 0]),
        } },
        play: [['C4', 0, 0.4], ['E4', 0.35, 0.4], ['G4', 0.7, 0.4], ['C5', 1.05, 0.8]], seconds: 2.6, view: 'none',
        caption: 'Marimba: a fundamental pair, a ×4 carrier for the bar\'s strong 4th partial, and a ×10 modulator blip for the mallet. Then without the mallet click.',
        tries: [{ label: 'Marimba' }, { label: 'No mallet', set: { 'op6.outputLevel': 0, 'op5.outputLevel': 0 } }],
      };

export const DETUNE: SynthDemo = {
        name: 'DETUNE', fm: { algorithm: 5, ops: { 1: op(1, 92, ...HOLD), 2: op(1, 72), 3: op(1, 92, ...HOLD), 4: op(1, 72) } },
        play: [['A3', 0, 2.4]], view: 'none',
        caption: 'Two identical 1:1 pairs: in tune (they add up to one voice), then the second pair detuned (Detune 7 = centre; 4 and 10 here), then the modulator 1% off its whole ratio.',
        tries: [{ label: 'In tune' }, { label: 'Detuned', set: { 'op1.detune': 4, 'op3.detune': 10 } }, { label: 'Ratio ×1.01', set: { 'op2.fine': 1, 'op4.fine': 1 } }],
      };

export const LFO: SynthDemo = {
        name: 'LFO', fm: { algorithm: 1, pitchModSens: 3, lfo: { speed: 34, delay: 0, pmd: 0, amd: 0, wave: 4, sync: true }, ops: { 1: op(1, 99, ...HOLD, { ampModSens: 0 }), 2: op(1, 76, [99, 99, 99, 99], [99, 99, 99, 0], { ampModSens: 0 }) } },
        play: [['E4', 0, 2.8]], view: 'none',
        caption: 'The LFO on one pair: vibrato (PMD), delayed vibrato (it fades in), and AMD on the modulator only: the brightness wobbles while the loudness stays.',
        tries: [
          { label: 'Dry' },
          { label: 'Vibrato', set: { 'lfo.pmd': 12 } },
          { label: 'Delayed', set: { 'lfo.pmd': 12, 'lfo.delay': 70 } },
          { label: 'Timbre wobble', set: { 'lfo.amd': 60, 'op2.ampModSens': 3, 'lfo.speed': 28 } },
        ],
      };

export const FM_DRUM: SynthDemo = {
        name: 'FM DRUM', fm: { algorithm: 1, pitchEg: { rates: [99, 75, 99, 99], levels: [80, 50, 50, 50] }, ops: {
          1: op(1, 99, [99, 60, 40, 60], [99, 0, 0, 0]),
          2: op(1, 60, [99, 80, 60, 70], [99, 0, 0, 0]),
        } },
        play: [['C2', 0, 0.3], ['C2', 0.5, 0.3], ['G2', 1, 0.3]], seconds: 2.2, view: 'none',
        caption: 'The pitch envelope as a drum: each note starts high and drops in a few milliseconds onto a decaying FM tone (a tom). Then with no pitch drop, and the drop slower.',
        tries: [{ label: 'Tom' }, { label: 'No drop', set: { 'pitchEg.levels.0': 50 } }, { label: 'Slow drop', set: { 'pitchEg.rates.1': 50 } }],
      };
