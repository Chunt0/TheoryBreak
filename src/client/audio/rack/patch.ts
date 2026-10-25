// A modular patch: modules left to right along the rack, and the cables
// between their jacks. Plus the factory racks.

import { MODULES, type ModuleType } from './modules';

export interface RackModule {
  id: string;
  type: ModuleType;
  params: Record<string, number>;
  /** which row of a two-row case (unset on every module = sorted by family) */
  row?: 1 | 2;
}

export interface Jack {
  mod: string;
  port: string;
}

export interface RackCable {
  id: string;
  from: Jack;
  to: Jack;
  /** index into the cable colours */
  color: number;
}

export interface RackPatch {
  name: string;
  modules: RackModule[];
  cables: RackCable[];
}

export const CABLE_COLORS = 7;

let counter = 0;
export const uid = (prefix: string): string => `${prefix}${Date.now().toString(36).slice(-4)}${(counter++).toString(36)}`;

export function newModule(type: ModuleType, id = uid(type)): RackModule {
  return { id, type, params: Object.fromEntries(MODULES[type].params.map((p) => [p.id, p.def])) };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Defensive copy of stored data: unknown modules, params and dangling cables are dropped. */
export function normalizeRack(raw: unknown): RackPatch | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<RackPatch>;
  if (!Array.isArray(r.modules)) return null;
  const modules: RackModule[] = [];
  const seen = new Set<string>();
  for (const m of r.modules) {
    if (!m || typeof m.id !== 'string' || seen.has(m.id) || !(m.type in MODULES)) continue;
    const base = newModule(m.type, m.id);
    for (const p of MODULES[m.type].params) {
      const v = m.params?.[p.id];
      if (typeof v === 'number' && Number.isFinite(v)) base.params[p.id] = clamp(v, p.min, p.max);
    }
    if (m.row === 1 || m.row === 2) base.row = m.row;
    modules.push(base);
    seen.add(m.id);
  }
  const byId = new Map(modules.map((m) => [m.id, m]));
  const taken = new Set<string>();
  const cables: RackCable[] = [];
  for (const c of Array.isArray(r.cables) ? r.cables : []) {
    const a = byId.get(c?.from?.mod);
    const b = byId.get(c?.to?.mod);
    if (!a || !b) continue;
    if (!MODULES[a.type].outs.some((o) => o.id === c.from.port) || !MODULES[b.type].ins.some((i) => i.id === c.to.port)) continue;
    const key = `${c.to.mod}.${c.to.port}`;
    if (taken.has(key)) continue; // one cable per input
    taken.add(key);
    cables.push({ id: typeof c.id === 'string' ? c.id : uid('c'), from: { ...c.from }, to: { ...c.to }, color: Math.abs(Math.round(c.color ?? 0)) % CABLE_COLORS });
  }
  return { name: typeof r.name === 'string' && r.name.trim() ? r.name.slice(0, 24) : 'RACK', modules, cables };
}

// ------------------------------------------------------------- factory racks

type Spec = [id: string, type: ModuleType, params?: Record<string, number>];

/** Build a rack from short specs: cables as 'mod.port' → 'mod.port'. */
function rack(name: string, mods: Spec[], wires: [string, string][]): RackPatch {
  const modules = mods.map(([id, type, params]) => {
    const m = newModule(type, id);
    Object.assign(m.params, params);
    return m;
  });
  const cables = wires.map(([a, b], i) => {
    const [fm, fp] = a.split('.');
    const [tm, tp] = b.split('.');
    return { id: `c${i}`, from: { mod: fm, port: fp }, to: { mod: tm, port: tp }, color: i % CABLE_COLORS };
  });
  return normalizeRack({ name, modules, cables })!;
}

export const RACK_PRESETS: { patch: RackPatch; notes: string }[] = [
  {
    notes: 'One oscillator, one envelope, one VCA: the smallest patch that plays. Start here and add.',
    patch: rack('INIT', [['midi', 'midi'], ['vco', 'vco'], ['env', 'adsr'], ['vca', 'vca'], ['out', 'out']], [
      ['midi.voct', 'vco.voct'], ['midi.gate', 'env.gate'], ['vco.saw', 'vca.in'], ['env.env', 'vca.cv'], ['vca.out', 'out.l'],
    ]),
  },
  {
    notes: 'Monophonic saw through a ladder filter with its own envelope, and a little glide: a bass and lead classic.',
    patch: rack('MONO LEAD', [
      ['midi', 'midi', { voices: 0, glide: 0.06 }], ['vco', 'vco', { oct: -1 }], ['vco2', 'vco', { oct: -1, tune: 0.12 }], ['mix', 'mix', { l1: 0.7, l2: 0.6 }],
      ['fenv', 'adsr', { a: 0.003, d: 0.35, s: 0.15, r: 0.25 }], ['flt', 'ladder', { cutoff: 260, res: 0.55, cv: 0.45, drive: 2 }],
      ['aenv', 'adsr', { a: 0.003, d: 0.4, s: 0.8, r: 0.2 }], ['vca', 'vca'], ['out', 'out', { level: 0.55 }],
    ], [
      ['midi.voct', 'vco.voct'], ['midi.voct', 'vco2.voct'], ['vco.saw', 'mix.in1'], ['vco2.sqr', 'mix.in2'], ['mix.out', 'flt.in'],
      ['midi.gate', 'fenv.gate'], ['fenv.env', 'flt.cv'], ['midi.voct', 'flt.voct'], ['flt.out', 'vca.in'],
      ['midi.gate', 'aenv.gate'], ['aenv.env', 'vca.cv'], ['vca.out', 'out.l'],
    ]),
  },
  {
    notes: 'Eight voices of detuned saws, a slow filter sweep and PWM shimmer from the LFO, into a long delay.',
    patch: rack('POLY PAD', [
      ['midi', 'midi', { voices: 4 }], ['lfo', 'lfo', { rate: 0.35 }], ['vco', 'vco', { pwm: 0.5 }], ['vco2', 'vco', { tune: 0.1 }], ['mix', 'mix', { l1: 0.5, l2: 0.6 }],
      ['flt', 'vcf', { cutoff: 700, res: 0.25, cv: 0.35 }], ['env', 'adsr', { a: 0.6, d: 1.2, s: 0.75, r: 1.6 }], ['vca', 'vca'],
      ['dly', 'delay', { time: 0.42, fb: 0.45, mix: 0.3, tone: 3000 }], ['out', 'out', { level: 0.45 }],
    ], [
      ['midi.voct', 'vco.voct'], ['midi.voct', 'vco2.voct'], ['lfo.tri', 'vco.pwm'], ['vco.sqr', 'mix.in1'], ['vco2.saw', 'mix.in2'],
      ['mix.out', 'flt.in'], ['env.env', 'flt.cv'], ['midi.gate', 'env.gate'], ['flt.lp', 'vca.in'], ['env.env', 'vca.cv'],
      ['vca.out', 'dly.in'], ['dly.out', 'out.l'],
    ]),
  },
  {
    notes: 'Clock → sequencer → quantizer in D Dorian. It plays itself; play a key to move the line to it (C4 leaves it home).',
    patch: rack('DORIAN SEQ', [
      ['clk', 'clock', { bpm: 112 }], ['seq', 'seq', { s0: 2, s1: 5, s2: 9, s3: 12, s4: 9, s5: 7, s6: 5, s7: 0, g3: 0, g6: 0 }],
      ['midi', 'midi', { voices: 0 }], ['add', 'mix', { l1: 1, l2: 1, l3: 0, l4: 0 }], ['q', 'quant', { root: 2, scale: 3 }],
      ['vco', 'vco', { oct: -1 }], ['flt', 'vcf', { cutoff: 500, res: 0.55, cv: 0.4 }], ['env', 'adsr', { a: 0.002, d: 0.22, s: 0, r: 0.15 }],
      ['vca', 'vca', { resp: 1 }], ['dly', 'delay', { time: 0.4, fb: 0.5, mix: 0.3 }], ['out', 'out', { level: 0.5 }],
    ], [
      ['clk.e', 'seq.clk'], ['seq.voct', 'add.in1'], ['midi.voct', 'add.in2'], ['add.out', 'q.in'], ['q.out', 'vco.voct'],
      ['vco.saw', 'flt.in'], ['seq.gate', 'env.gate'], ['env.env', 'flt.cv'], ['flt.lp', 'vca.in'], ['env.env', 'vca.cv'],
      ['vca.out', 'dly.in'], ['dly.out', 'out.l'],
    ]),
  },
  {
    notes: 'Random notes from sample & hold, snapped to C minor pentatonic: an endless, never-wrong arpeggio.',
    patch: rack('S&H BLEEPS', [
      ['clk', 'clock', { bpm: 128 }], ['rnd', 'noise'], ['scale', 'util', { a1: 0.35, o1: 0 }], ['q', 'quant', { root: 0, scale: 10 }],
      ['vco', 'vco', { oct: 1 }], ['flt', 'vcf', { cutoff: 1800, res: 0.45, cv: 0.3 }], ['env', 'adsr', { a: 0.001, d: 0.12, s: 0, r: 0.1 }],
      ['vca', 'vca', { resp: 1 }], ['dly', 'delay', { time: 0.351, fb: 0.55, mix: 0.4, tone: 2600 }], ['out', 'out', { level: 0.45 }],
    ], [
      ['clk.s', 'rnd.clk'], ['rnd.sh', 'scale.in1'], ['scale.out1', 'q.in'], ['q.out', 'vco.voct'], ['vco.sqr', 'flt.in'],
      ['clk.s', 'env.gate'], ['env.env', 'flt.cv'], ['flt.bp', 'vca.in'], ['env.env', 'vca.cv'], ['vca.out', 'dly.in'], ['dly.out', 'out.l'],
    ]),
  },
  {
    notes: 'Sine into a wavefolder, opened by the same envelope that opens the VCA, like a low-pass gate. LFO drifts the fold.',
    patch: rack('WEST COAST', [
      ['midi', 'midi', { voices: 3 }], ['vco', 'vco'], ['lfo', 'lfo', { rate: 0.25 }], ['fold', 'fold', { fold: 1.2, cv: 0.7 }],
      ['env', 'adsr', { a: 0.002, d: 0.9, s: 0.2, r: 0.7 }], ['mix', 'mix', { l1: 1, l2: 0.25 }], ['vca', 'vca', { resp: 1 }],
      ['dly', 'delay', { time: 0.28, fb: 0.35, mix: 0.25 }], ['out', 'out', { level: 0.5 }],
    ], [
      ['midi.voct', 'vco.voct'], ['vco.sin', 'fold.in'], ['env.env', 'mix.in1'], ['lfo.sin', 'mix.in2'], ['mix.out', 'fold.cv'],
      ['midi.gate', 'env.gate'], ['fold.out', 'vca.in'], ['env.env', 'vca.cv'], ['vca.out', 'dly.in'], ['dly.out', 'out.l'],
    ]),
  },
];


RACK_PRESETS.push(
  {
    notes: 'A self-playing drum machine: Euclidean kick (3 in 16) and backbeat snare, hats on every 16th with a coin toss for open ones.',
    patch: rack('DRUM MACHINE', [
      ['clk', 'clock', { bpm: 104 }], ['ek', 'euclid', { steps: 16, fills: 3, rotate: 0 }], ['es', 'euclid', { steps: 16, fills: 2, rotate: 4 }], ['coin', 'coin', { prob: 0.15 }],
      ['kick', 'kick', { tune: 50, decay: 0.45, punch: 0.55, drive: 2 }], ['snare', 'snare', { tune: 190, decay: 0.18, snappy: 0.65, tone: 6000 }], ['hats', 'hats', { decay: 0.04, open: 0.35, tone: 8000 }],
      ['mix', 'mix', { l1: 0.9, l2: 0.6, l3: 0.35, l4: 0 }], ['verb', 'verb', { size: 0.35, damp: 0.5, mix: 0.12 }], ['out', 'out', { level: 0.6 }],
    ], [
      ['clk.s', 'ek.clk'], ['clk.s', 'es.clk'], ['clk.bar', 'ek.reset'], ['clk.bar', 'es.reset'], ['clk.s', 'coin.in'],
      ['ek.gate', 'kick.trig'], ['es.gate', 'snare.trig'], ['coin.a', 'hats.trig'], ['coin.b', 'hats.open'],
      ['kick.out', 'mix.in1'], ['snare.out', 'mix.in2'], ['hats.out', 'mix.in3'], ['mix.out', 'verb.in'], ['verb.l', 'out.l'], ['verb.r', 'out.r'],
    ]),
  },
  {
    notes: 'A Turing machine writes a bass line in E minor pentatonic over a four-on-the-floor kick. Turn Change up to let it evolve, down to 0 to keep it.',
    patch: rack('TURING BASS', [
      ['clk', 'clock', { bpm: 116 }], ['tm', 'turing', { change: 0.08, length: 8, range: 1.5 }], ['q', 'quant', { root: 4, scale: 10 }], ['vco', 'vco', { oct: -2 }],
      ['flt', 'ladder', { cutoff: 300, res: 0.6, cv: 0.45, drive: 2 }], ['env', 'adsr', { a: 0.002, d: 0.2, s: 0, r: 0.12 }], ['vca', 'vca', { resp: 1 }],
      ['kick', 'kick', { decay: 0.35 }], ['mix', 'mix', { l1: 0.8, l2: 0.7, l3: 0, l4: 0 }], ['out', 'out', { level: 0.55 }],
    ], [
      ['clk.e', 'tm.clk'], ['tm.cv', 'q.in'], ['q.out', 'vco.voct'], ['vco.saw', 'flt.in'], ['tm.gate', 'env.gate'], ['env.env', 'flt.cv'],
      ['flt.out', 'vca.in'], ['env.env', 'vca.cv'], ['vca.out', 'mix.in1'], ['clk.q', 'kick.trig'], ['kick.out', 'mix.in2'], ['mix.out', 'out.l'],
    ]),
  },
  {
    notes: 'Every note you play becomes its diatonic 7th chord in C, in drop-2 voicing: play the scale to hear Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7♭5.',
    patch: rack('DIATONIC 7THS', [
      ['midi', 'midi', { voices: 0 }], ['ch', 'chord', { key: 0, type: 16, inv: 0, voicing: 1 }], ['vco', 'vco'], ['vco2', 'vco', { tune: 0.08, pw: 0.4 }],
      ['mix', 'mix', { l1: 0.5, l2: 0.4, l3: 0, l4: 0 }], ['flt', 'vcf', { cutoff: 1400, res: 0.2, cv: 0.3 }], ['env', 'adsr', { a: 0.01, d: 0.6, s: 0.6, r: 0.5 }],
      ['vca', 'vca'], ['cho', 'chorus', { rate: 0.5, depth: 0.5, mix: 0.5 }], ['out', 'out', { level: 0.45 }],
    ], [
      ['midi.voct', 'ch.voct'], ['ch.voct', 'vco.voct'], ['ch.voct', 'vco2.voct'], ['vco.saw', 'mix.in1'], ['vco2.sqr', 'mix.in2'], ['mix.out', 'flt.in'],
      ['midi.gate', 'env.gate'], ['env.env', 'flt.cv'], ['flt.lp', 'vca.in'], ['env.env', 'vca.cv'], ['vca.out', 'cho.in'], ['cho.l', 'out.l'], ['cho.r', 'out.r'],
    ]),
  },
  {
    notes: 'Hold a chord: an arpeggiator plays it up and down over two octaves, a wavetable slowly morphs, and a low-pass gate gives every note a woody pluck.',
    patch: rack('ARP LPG', [
      ['midi', 'midi', { voices: 3 }], ['clk', 'clock', { bpm: 120 }], ['arp', 'arp', { mode: 2, oct: 2, len: 0.5 }], ['fn', 'func', { rise: 2.5, fall: 4, loop: 1 }],
      ['wt', 'wt', { table: 2, cv: 0.5 }], ['lpg', 'lpg', { decay: 0.5, mode: 0 }], ['dly', 'delay', { time: 0.375, fb: 0.45, mix: 0.3 }], ['out', 'out', { level: 0.55 }],
    ], [
      ['midi.voct', 'arp.voct'], ['midi.gate', 'arp.gate'], ['clk.s', 'arp.clk'], ['arp.voct', 'wt.voct'], ['fn.out', 'wt.table'],
      ['wt.out', 'lpg.in'], ['arp.gate', 'lpg.ping'], ['lpg.out', 'dly.in'], ['dly.out', 'out.l'],
    ]),
  },
  {
    notes: 'A plucked-string model, six voices, in a big stereo reverb: harp and koto.',
    patch: rack('HARP', [
      ['midi', 'midi', { voices: 3 }], ['str', 'string', { decay: 4, tone: 0.55, bright: 0.75 }], ['verb', 'verb', { size: 0.75, damp: 0.35, mix: 0.3 }], ['out', 'out', { level: 0.6 }],
    ], [
      ['midi.voct', 'str.voct'], ['midi.trig', 'str.trig'], ['str.out', 'verb.in'], ['verb.l', 'out.l'], ['verb.r', 'out.r'],
    ]),
  },
  {
    notes: 'Two oscillators through a vowel filter, morphed by the mod strip and a slow LFO, then a tube drive: Zapp-style talk box.',
    patch: rack('TALKBOX FUNK', [
      ['midi', 'midi', { voices: 0, glide: 0.04 }], ['vco', 'vco', { oct: -1 }], ['vco2', 'vco', { oct: -1, tune: 0.1 }], ['mix', 'mix', { l1: 0.6, l2: 0.5, l3: 0, l4: 0 }],
      ['lfo', 'lfo', { rate: 0.4 }], ['vm', 'mix', { l1: 0.5, l2: 0.25, l3: 0, l4: 0 }], ['vow', 'vowel', { vowel: 1, res: 9, cv: 0.8 }],
      ['env', 'adsr', { a: 0.005, d: 0.3, s: 0.8, r: 0.15 }], ['vca', 'vca'], ['drv', 'drive', { drive: 3, shape: 2, tone: 6000, mix: 0.7 }], ['out', 'out', { level: 0.5 }],
    ], [
      ['midi.voct', 'vco.voct'], ['midi.voct', 'vco2.voct'], ['vco.saw', 'mix.in1'], ['vco2.sqr', 'mix.in2'], ['mix.out', 'vow.in'],
      ['midi.mod', 'vm.in1'], ['lfo.tri', 'vm.in2'], ['vm.out', 'vow.cv'], ['vow.out', 'vca.in'], ['midi.gate', 'env.gate'], ['env.env', 'vca.cv'],
      ['vca.out', 'drv.in'], ['drv.out', 'out.l'],
    ]),
  },
  {
    notes: 'Two-operator FM at a 3.5 ratio: an envelope on the index makes each note strike bright and decay to a pure bell tone.',
    patch: rack('FM BELLS', [
      ['midi', 'midi', { voices: 2 }], ['fm', 'fmop', { ratio: 5, index: 0.5, cv: 0.6 }], ['ienv', 'adsr', { a: 0.001, d: 1.2, s: 0.05, r: 1 }],
      ['aenv', 'adsr', { a: 0.002, d: 2.5, s: 0, r: 1.5 }], ['vca', 'vca'], ['verb', 'verb', { size: 0.7, mix: 0.3 }], ['out', 'out', { level: 0.5 }],
    ], [
      ['midi.voct', 'fm.voct'], ['midi.gate', 'ienv.gate'], ['ienv.env', 'fm.index'], ['midi.gate', 'aenv.gate'], ['fm.out', 'vca.in'],
      ['aenv.env', 'vca.cv'], ['vca.out', 'verb.in'], ['verb.l', 'out.l'], ['verb.r', 'out.r'],
    ]),
  },
  {
    notes: 'A saw through a ladder filter that a slow LFO opens and closes, watched three ways: the spectrum (the raw saw in yellow, after the filter in blue), the spectrogram and the tuner. Hold one low note.',
    patch: rack('HARMONICS', [
      ['midi', 'midi', { voices: 0 }], ['vco', 'vco', { oct: -1 }], ['lfo', 'lfo', { rate: 0.12 }], ['flt', 'ladder', { cutoff: 900, res: 0.35, cv: 0.5 }],
      ['env', 'adsr', { a: 0.01, d: 0.3, s: 0.9, r: 0.4 }], ['vca', 'vca'], ['out', 'out', { level: 0.5 }],
      ['sp', 'spectrum'], ['sono', 'sono'], ['tun', 'tuner'],
    ], [
      ['midi.voct', 'vco.voct'], ['vco.saw', 'flt.in'], ['lfo.tri', 'flt.cv'], ['flt.out', 'vca.in'], ['midi.gate', 'env.gate'], ['env.env', 'vca.cv'], ['vca.out', 'out.l'],
      ['vco.saw', 'sp.a'], ['flt.out', 'sp.b'], ['flt.out', 'sono.in'], ['vco.saw', 'tun.in'],
    ]),
  },
  {
    notes: 'A pure fifth, an FM OP’s carrier and its ×1.5 modulator, drawn on an XY scope: the 3:2 figure stands still. Move the Y cable to the VCO, seven tempered semitones up, and it slowly rolls.',
    patch: rack('LISSAJOUS', [
      ['midi', 'midi', { voices: 0 }], ['fm', 'fmop', { ratio: 2, index: 0 }], ['vco', 'vco', { tune: 7 }], ['mix', 'mix', { l1: 0.5, l2: 0.5, l3: 0, l4: 0 }],
      ['env', 'adsr', { a: 0.02, d: 0.3, s: 0.8, r: 0.5 }], ['vca', 'vca'], ['out', 'out', { level: 0.45 }], ['xy', 'xy'],
    ], [
      ['midi.voct', 'fm.voct'], ['midi.voct', 'vco.voct'], ['fm.out', 'mix.in1'], ['fm.mod', 'mix.in2'], ['mix.out', 'vca.in'],
      ['midi.gate', 'env.gate'], ['env.env', 'vca.cv'], ['vca.out', 'out.l'], ['fm.out', 'xy.x'], ['fm.mod', 'xy.y'],
    ]),
  },
  {
    notes: 'Each note you play becomes its diatonic seventh chord in C. KEYS lights and names it; ROLL writes down how its four voices move from chord to chord.',
    patch: rack('CHORD VIEW', [
      ['midi', 'midi', { voices: 0 }], ['ch', 'chord', { key: 0, type: 16, inv: 0, voicing: 0 }], ['keys', 'keys'], ['roll', 'roll', { time: 12 }],
      ['vco', 'vco', { pw: 0.4 }], ['flt', 'vcf', { cutoff: 1400, res: 0.2, cv: 0.3 }], ['env', 'adsr', { a: 0.01, d: 0.6, s: 0.6, r: 0.5 }], ['vca', 'vca'],
      ['cho', 'chorus', { rate: 0.5, depth: 0.5, mix: 0.5 }], ['out', 'out', { level: 0.45 }],
    ], [
      ['midi.voct', 'ch.voct'], ['ch.voct', 'keys.voct'], ['midi.gate', 'keys.gate'], ['ch.voct', 'roll.voct'], ['midi.gate', 'roll.gate'],
      ['ch.voct', 'vco.voct'], ['vco.saw', 'flt.in'], ['midi.gate', 'env.gate'], ['env.env', 'flt.cv'], ['flt.lp', 'vca.in'], ['env.env', 'vca.cv'],
      ['vca.out', 'cho.in'], ['cho.l', 'out.l'], ['cho.r', 'out.r'],
    ]),
  },
  {
    notes: 'Plucked chords into MICROCOSM’s Mosaic D: overlapping loops of what you just played, an octave below to two above, in a medium room. Play a few notes and listen to them stack; try the other effects with the Effect knob.',
    patch: rack('MICRO LOOPS', [
      ['midi', 'midi', { voices: 2 }], ['vco', 'vco', { pw: 0.35 }], ['flt', 'vcf', { cutoff: 1800, res: 0.25, cv: 0.4 }], ['env', 'adsr', { a: 0.002, d: 0.45, s: 0.1, r: 0.35 }],
      ['vca', 'vca'], ['mc', 'cosm', { fx: 0, var: 3, act: 0.6, rep: 0.45, shape: 0.45, mix: 0.5, space: 0.45, time: 90 }], ['out', 'out', { level: 0.5 }],
    ], [
      ['midi.voct', 'vco.voct'], ['vco.saw', 'flt.in'], ['midi.gate', 'env.gate'], ['env.env', 'flt.cv'], ['flt.lp', 'vca.in'], ['env.env', 'vca.cv'],
      ['vca.out', 'mc.l'], ['mc.l', 'out.l'], ['mc.r', 'out.r'],
    ]),
  },
  {
    notes: 'A clocked minor-pentatonic line into MICROCOSM’s Blocks B, sharing the clock: every note it hears sets off a burst of chopped, octave-shifted blocks in time. Turn Activity for more chaos, Repeats for longer bursts.',
    patch: rack('GLITCH SEQ', [
      ['clk', 'clock', { bpm: 104 }], ['seq', 'seq', { s0: 0, s1: 7, s2: 3, s3: 10, s4: 12, s5: 5, s6: 7, s7: 15, g2: 0, g5: 0 }], ['q', 'quant', { root: 9, scale: 10 }],
      ['vco', 'vco'], ['flt', 'vcf', { cutoff: 900, res: 0.4, cv: 0.45 }], ['env', 'adsr', { a: 0.002, d: 0.18, s: 0, r: 0.12 }], ['vca', 'vca', { resp: 1 }],
      ['mc', 'cosm', { fx: 6, var: 1, act: 0.55, rep: 0.4, mix: 0.55, space: 0.3, div: 3 }], ['out', 'out', { level: 0.5 }],
    ], [
      ['clk.e', 'seq.clk'], ['seq.voct', 'q.in'], ['q.out', 'vco.voct'], ['vco.saw', 'flt.in'], ['seq.gate', 'env.gate'], ['env.env', 'flt.cv'],
      ['flt.lp', 'vca.in'], ['env.env', 'vca.cv'], ['vca.out', 'mc.l'], ['clk.q', 'mc.clock'], ['mc.l', 'out.l'], ['mc.r', 'out.r'],
    ]),
  },
);

export const rackPresetByName = (name: string): RackPatch | undefined => RACK_PRESETS.find((p) => p.patch.name === name)?.patch;
export const defaultRack = (): RackPatch => structuredClone(RACK_PRESETS[2].patch);
