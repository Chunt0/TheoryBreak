// The seq lessons' demos: patches rendered offline so a lesson can play
// "before" and "after" without touching the instrument you are working on.
import type { RackSpec, SynthDemo } from '../../../synth/demo';

/** Sequencer step params: pitches in semitones, and which steps play ('x' plays, '.' rests). */
export const steps = (pitches: number[], gates = 'xxxxxxxxxxxxxxxx'): Record<string, number> => {
  const p: Record<string, number> = { len: pitches.length };
  pitches.forEach((s, i) => (p[`s${i}`] = s));
  for (let i = 0; i < 16; i++) p[`g${i}`] = gates[i] === '.' ? 0 : 1;
  return p;
};

/** A clocked mono voice: whatever plays `pitch` and `gate` into a VCO → VCF → VCA with a plucky envelope. */
export const pluck = (o: { oct?: number; port?: string; cutoff?: number; res?: number; decay?: number } = {}): RackSpec['mods'] => ({
  vco: ['vco', { oct: o.oct ?? -1 }],
  flt: ['vcf', { cutoff: o.cutoff ?? 500, res: o.res ?? 0.45, cv: 0.4 }],
  env: ['adsr', { a: 0.002, d: o.decay ?? 0.2, s: 0, r: 0.12 }],
  vca: ['vca', { resp: 1 }],
  out: ['out', { level: 0.55 }],
});
export const PLUCK_WIRES = ['vco.saw>flt.in', 'env.env>flt.cv', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>out.l'];

// minor-pentatonic bass line, two bars of 8ths
export const LINE = [0, 0, 12, 0, 10, 0, 7, 5, 0, 0, 12, 0, 3, 5, 7, 10];

export const CLOCK_BLEEP: SynthDemo = {
        name: 'CLOCK BLEEP', view: 'none', seconds: 4,
        rack: { mods: { clk: ['clock', { bpm: 120 }], pick: ['mix', { l1: 1, l2: 0, l3: 0 }], ...pluck({ oct: 0, cutoff: 900, decay: 0.08 }) },
          wires: ['clk.q>pick.in1', 'clk.e>pick.in2', 'clk.s>pick.in3', 'pick.out>env.gate', ...PLUCK_WIRES] },
        caption: 'One note retriggered by the clock: from the quarter, 8th and 16th outputs.',
        tries: [{ label: 'Quarters' }, { label: '8ths', set: { 'pick.l1': 0, 'pick.l2': 1 } }, { label: '16ths', set: { 'pick.l1': 0, 'pick.l3': 1 } }],
      };

export const ONE_CLOCK: SynthDemo = {
        name: 'ONE CLOCK', view: 'none', seconds: 4.2,
        rack: { mods: { clk: ['clock', { bpm: 112 }], kick: ['kick', { tune: 50, decay: 0.4, punch: 0.55 }], hats: ['hats', { decay: 0.04, tone: 8000 }], mix: ['mix', { l1: 0.9, l2: 0.35, l3: 0, l4: 0 }], out: ['out', { level: 0.6 }] },
          wires: ['clk.q>kick.trig', 'clk.e>hats.trig', 'kick.out>mix.in1', 'hats.out>mix.in2', 'mix.out>out.l'] },
        caption: 'A kick on the quarters and hats on the 8ths, both from one clock: they can never drift apart. Then the same rack at a faster tempo: everything follows.',
        tries: [{ label: 'Kick + 8th hats' }, { label: 'Faster tempo', set: { 'clk.bpm': 132 } }],
      };

export const SEQ_LINE: SynthDemo = {
        name: 'SEQ LINE', view: 'none', seconds: 4.4,
        rack: { mods: { clk: ['clock', { bpm: 110 }], seq: ['seq', steps(LINE)], ...pluck({ oct: -2, cutoff: 400, res: 0.5 }) },
          wires: ['clk.e>seq.clk', 'seq.voct>vco.voct', 'seq.gate>env.gate', ...PLUCK_WIRES] },
        caption: 'A two-bar minor-pentatonic bass line in 8ths. Then rests (gates off) to make it groove, then the length cut to 8 (the first bar loops).',
        tries: [
          { label: 'All steps' },
          { label: 'With rests', set: { 'seq.g1': 0, 'seq.g3': 0, 'seq.g9': 0, 'seq.g11': 0 } },
          { label: 'Length 8', set: { 'seq.len': 8 } },
        ],
      };

export const TRANSPOSE: SynthDemo = {
        name: 'TRANSPOSE', view: 'none', seconds: 4.6,
        rack: { mods: { clk: ['clock', { bpm: 112 }], seq: ['seq', steps([0, 7, 12, 7, 10, 7, 3, 5])], key: ['util', { a1: 0, o1: 0 }], add: ['mix', { l1: 1, l2: 1, l3: 0, l4: 0 }], ...pluck({ oct: -1, cutoff: 600 }) },
          wires: ['clk.e>seq.clk', 'seq.voct>add.in1', 'key.out1>add.in2', 'add.out>vco.voct', 'seq.gate>env.gate', ...PLUCK_WIRES] },
        caption: 'The same 8-step figure with a steady voltage added (standing in for a held key): +0, +5/12 V (up a 4th) and −2/12 V (down a tone).',
        tries: [{ label: 'In C' }, { label: 'Up a 4th', set: { 'key.o1': 5 / 12 } }, { label: 'Down a tone', set: { 'key.o1': -2 / 12 } }],
      };

export const S_H_SCALES: SynthDemo = {
        name: 'S&H SCALES', view: 'none', seconds: 4.6,
        rack: { mods: { clk: ['clock', { bpm: 120 }], rnd: ['noise'], range: ['util', { a1: 0.3 }], q: ['quant', { root: 0, scale: 9 }], ...pluck({ oct: 1, cutoff: 1800, decay: 0.12 }), dly: ['delay', { time: 0.375, fb: 0.45, mix: 0.3, tone: 3000 }] },
          wires: ['clk.s>rnd.clk', 'rnd.sh>range.in1', 'range.out1>q.in', 'q.out>vco.voct', 'clk.e>env.gate', 'vco.saw>flt.in', 'env.env>flt.cv', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>dly.in', 'dly.out>out.l'] },
        caption: 'Random voltages, sampled on 16ths, played on 8ths through a quantizer: major pentatonic, Dorian, whole tone, then no quantizing (chromatic).',
        tries: [{ label: 'Major pent.' }, { label: 'Dorian', set: { 'q.scale': 3 } }, { label: 'Whole tone', set: { 'q.scale': 12 } }, { label: 'Chromatic', set: { 'q.scale': 0 } }],
      };

export const MODE_SWAP: SynthDemo = {
        name: 'MODE SWAP', view: 'none', seconds: 4.4,
        rack: { mods: { clk: ['clock', { bpm: 116 }], seq: ['seq', steps([-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5])], q: ['quant', { root: 2, scale: 3 }], ...pluck({ oct: 0, cutoff: 900 }) },
          wires: ['clk.e>seq.clk', 'seq.voct>q.in', 'q.out>vco.voct', 'seq.gate>env.gate', ...PLUCK_WIRES] },
        caption: 'A chromatic climb from D, every semitone for 16 steps, quantized to D Dorian, D Phrygian and D Lydian. The same voltages: each mode keeps its own notes, and the steps in between snap to a neighbour.',
        tries: [{ label: 'D Dorian' }, { label: 'D Phrygian', set: { 'q.scale': 4 } }, { label: 'D Lydian', set: { 'q.scale': 5 } }],
      };

export const KICK: SynthDemo = {
        name: 'KICK', view: 'none', seconds: 3.4,
        rack: { mods: { clk: ['clock', { bpm: 100 }], kick: ['kick', { tune: 50, decay: 0.5, punch: 0.5, drive: 1.5 }], out: ['out', { level: 0.6 }] },
          wires: ['clk.q>kick.trig', 'kick.out>out.l'] },
        caption: 'The kick: default, a long 808-style boom, a short punchy techno kick, and driven.',
        tries: [{ label: 'Kick' }, { label: '808 boom', set: { 'kick.decay': 1.4, 'kick.tune': 45, 'kick.punch': 0.3 } }, { label: 'Techno', set: { 'kick.decay': 0.2, 'kick.punch': 0.8 } }, { label: 'Driven', set: { 'kick.drive': 4.5 } }],
      };

export const EUCLID: SynthDemo = {
        name: 'EUCLID', view: 'none', seconds: 4.8,
        rack: { mods: { clk: ['clock', { bpm: 104 }], ek: ['euclid', { steps: 16, fills: 4 }], es: ['euclid', { steps: 16, fills: 2, rotate: 4 }], eh: ['euclid', { steps: 16, fills: 16 }], kick: ['kick', { tune: 50, decay: 0.4 }], snare: ['snare', { decay: 0.18 }], hats: ['hats', { decay: 0.035 }], mix: ['mix', { l1: 0.9, l2: 0.55, l3: 0.3, l4: 0 }], out: ['out', { level: 0.6 }] },
          wires: ['clk.s>ek.clk', 'clk.s>es.clk', 'clk.s>eh.clk', 'clk.bar>ek.reset', 'clk.bar>es.reset', 'clk.bar>eh.reset', 'ek.gate>kick.trig', 'es.gate>snare.trig', 'eh.gate>hats.trig', 'kick.out>mix.in1', 'snare.out>mix.in2', 'hats.out>mix.in3', 'mix.out>out.l'] },
        caption: 'Three Euclid modules on one clock: kick 4/16, snare 2/16 rotated onto the backbeat, hats 16/16. Then the kick at 6/16 (a tresillo twice a bar), at 5/16 (the bossa figure), and that with the hats thinned to 7/16.',
        tries: [{ label: 'Four on the floor' }, { label: 'Kick 6/16', set: { 'ek.fills': 6 } }, { label: 'Kick 5/16', set: { 'ek.fills': 5 } }, { label: 'Hats 7/16', set: { 'eh.fills': 7, 'ek.fills': 5 } }],
      };

export const POLYMETER: SynthDemo = {
        name: 'POLYMETER', view: 'none', seconds: 6.2,
        rack: { mods: { clk: ['clock', { bpm: 116 }], seq: ['seq', steps([0, 7, 3, 10, 5, 12, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0])], kick: ['kick', { tune: 50, decay: 0.35 }], ...pluck({ oct: -1, cutoff: 800, decay: 0.15 }), mix: ['mix', { l1: 0.75, l2: 0.8, l3: 0, l4: 0 }] },
          wires: ['clk.s>seq.clk', 'seq.voct>vco.voct', 'seq.gate>env.gate', 'clk.q>kick.trig', 'vco.saw>flt.in', 'env.env>flt.cv', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>mix.in1', 'kick.out>mix.in2', 'mix.out>out.l'] },
        caption: 'A sequence on 16ths against a four-on-the-floor kick: length 8 (locked to the beat), 7, then 5: the figure slides against the kick.',
        tries: [{ label: 'Length 8' }, { label: 'Length 7', set: { 'seq.len': 7 } }, { label: 'Length 5', set: { 'seq.len': 5 } }],
      };

export const D_3_AGAINST_4: SynthDemo = {
        name: '3 AGAINST 4', view: 'none', seconds: 4.4,
        rack: { mods: { clk: ['clock', { bpm: 100 }], div: ['div'], kick: ['kick', { tune: 48, decay: 0.3 }], hats: ['hats', { decay: 0.05, tone: 9000 }], mix: ['mix', { l1: 0.85, l2: 0.45, l3: 0, l4: 0 }], out: ['out', { level: 0.6 }] },
          wires: ['clk.s>div.clk', 'div.d4>kick.trig', 'div.d3>hats.trig', 'kick.out>mix.in1', 'hats.out>mix.in2', 'mix.out>out.l'] },
        caption: 'From one 16th clock: a kick on every 4th pulse (quarters), hats on every 3rd (dotted 8ths). Four hats in the time of three kicks; they line up every three beats, so the pattern rolls across the bar line.',
        tries: [{ label: '÷4 against ÷3' }],
      };

export const TURING: SynthDemo = {
        name: 'TURING', view: 'none', seconds: 6.4,
        rack: { mods: { clk: ['clock', { bpm: 116 }], tm: ['turing', { change: 0, length: 8, range: 1.5 }], q: ['quant', { root: 4, scale: 10 }], ...pluck({ oct: -1, cutoff: 500, res: 0.55 }) },
          wires: ['clk.e>tm.clk', 'tm.cv>q.in', 'q.out>vco.voct', 'tm.gate>env.gate', ...PLUCK_WIRES] },
        caption: 'A Turing machine quantized to E minor pentatonic: locked (Change 0), slowly evolving (0.15), and fully random (0.5). Then locked at length 5.',
        tries: [{ label: 'Locked' }, { label: 'Evolving', set: { 'tm.change': 0.15 } }, { label: 'Random', set: { 'tm.change': 0.5 } }, { label: 'Length 5', set: { 'tm.length': 5 } }],
      };

export const GENERATIVE: SynthDemo = {
        name: 'GENERATIVE', view: 'none', seconds: 6.4,
        rack: { mods: { clk: ['clock', { bpm: 90 }], tm: ['turing', { change: 0.1, length: 11, range: 2 }], coin: ['coin', { prob: 0.3 }], drift: ['rand', { rate: 0.3, amt: 0.6 }], q: ['quant', { root: 2, scale: 3 }], vco: ['vco', { oct: 0 }], flt: ['vcf', { cutoff: 700, res: 0.5, cv: 0.35 }], env: ['adsr', { a: 0.005, d: 0.6, s: 0, r: 0.5 }], vca: ['vca', { resp: 1 }], dly: ['delay', { time: 0.5, fb: 0.55, mix: 0.4, tone: 2500 }], verb: ['verb', { size: 0.8, mix: 0.3 }], out: ['out', { level: 0.55 }] },
          wires: ['clk.e>tm.clk', 'tm.cv>q.in', 'q.out>vco.voct', 'clk.e>coin.in', 'coin.b>env.gate', 'drift.smooth>flt.cv', 'vco.tri>flt.in', 'env.env>vca.cv', 'flt.lp>vca.in', 'vca.out>dly.in', 'dly.out>verb.in', 'verb.l>out.l', 'verb.r>out.r'] },
        caption: 'An ambient patch: a slowly mutating Turing phrase in D Dorian, played only when a coin says so (30%), a drifting filter, long echoes and reverb. Then the coin at 70%.',
        tries: [{ label: 'Sparse' }, { label: 'Busier', set: { 'coin.prob': 0.7 } }],
      };

export const ARP: SynthDemo = {
        name: 'ARP', view: 'none',
        rack: { mods: { midi: ['midi', { voices: 2 }], clk: ['clock', { bpm: 120 }], arp: ['arp', { mode: 0, oct: 2, len: 0.5 }], ...pluck({ oct: 0, cutoff: 1400, decay: 0.15 }), dly: ['delay', { time: 0.375, fb: 0.4, mix: 0.3, tone: 3500 }] },
          wires: ['midi.voct>arp.voct', 'midi.gate>arp.gate', 'clk.s>arp.clk', 'arp.voct>vco.voct', 'arp.gate>env.gate', 'vco.saw>flt.in', 'env.env>flt.cv', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>dly.in', 'dly.out>out.l'] },
        play: [['C3', 0, 2], ['E♭3', 0, 2], ['G3', 0, 2], ['B♭3', 0, 2], ['A♭2', 2, 2], ['C3', 2, 2], ['E♭3', 2, 2], ['G3', 2, 2]],
        caption: 'Cm7 then A♭maj7 held, arpeggiated in 16ths over two octaves: up, down, up-down, random.',
        tries: [{ label: 'Up' }, { label: 'Down', set: { 'arp.mode': 1 } }, { label: 'Up-down', set: { 'arp.mode': 2 } }, { label: 'Random', set: { 'arp.mode': 3 } }],
      };

export const ARP_LEN: SynthDemo = {
        name: 'ARP LEN', view: 'none',
        rack: { mods: { midi: ['midi', { voices: 2 }], clk: ['clock', { bpm: 120 }], arp: ['arp', { mode: 2, oct: 1, len: 0.15 }], vco: ['vco', { oct: 0 }], flt: ['vcf', { cutoff: 1800, res: 0.2, cv: 0 }], env: ['adsr', { a: 0.01, d: 0.3, s: 0.8, r: 0.25 }], vca: ['vca'], out: ['out', { level: 0.5 }] },
          wires: ['midi.voct>arp.voct', 'midi.gate>arp.gate', 'clk.e>arp.clk', 'arp.voct>vco.voct', 'arp.gate>env.gate', 'vco.sqr>flt.in', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>out.l'] },
        play: [['D3', 0, 3], ['F3', 0, 3], ['A3', 0, 3], ['C4', 0, 3]],
        caption: 'Dm7 held, up-down in 8ths: gate length 15%, 50% and 100% on a sustaining envelope.',
        tries: [{ label: '15%' }, { label: '50%', set: { 'arp.len': 0.5 } }, { label: '100%', set: { 'arp.len': 1 } }],
      };
