// Module catalogue for the modular synth: names, knobs, jacks and panel width.
// Shared by the rack UI and the audio worklet, so it stays plain data.
//
// Voltages follow Eurorack habits: audio ±5 V, pitch 1 V/oct with 0 V = C4,
// gates and envelopes 0–10 V, LFOs ±5 V.

import { CHORD_TYPES, NOTE_NAMES, VOICINGS } from './chords';

export type ModuleType =
  | 'midi' | 'vco' | 'lfo' | 'adsr' | 'vcf' | 'ladder' | 'vca' | 'mix'
  | 'noise' | 'clock' | 'seq' | 'quant' | 'delay' | 'fold' | 'util' | 'out'
  | 'wt' | 'fmop' | 'string' | 'kick' | 'snare' | 'hats'
  | 'func' | 'rand' | 'turing' | 'euclid' | 'div' | 'coin' | 'logic' | 'switch' | 'arp' | 'chord'
  | 'lpg' | 'comb' | 'vowel' | 'ring' | 'drive' | 'crush'
  | 'verb' | 'chorus' | 'phaser' | 'pan' | 'scope' | 'xfade';

export type Curve = 'lin' | 'exp' | 'int';
export type Unit = 'hz' | 's' | 'st' | 'v' | 'bpm' | 'pct' | 'x' | 'oct' | 'table' | 'vowel';

export interface ParamDef {
  id: string;
  label: string;
  min: number;
  max: number;
  def: number;
  /** knob response: linear, exponential (frequencies, times) or whole steps */
  curve?: Curve;
  kind?: 'knob' | 'toggle' | 'choice';
  /** labels for a choice; its value is the index */
  options?: string[];
  unit?: Unit;
}

export interface PortDef {
  id: string;
  label: string;
}

export type Family = 'io' | 'src' | 'drum' | 'mod' | 'seq' | 'filter' | 'amp' | 'fx' | 'util';

export interface ModuleDef {
  type: ModuleType;
  name: string;
  title: string;
  blurb: string;
  family: Family;
  /** panel width in columns (one knob or jack each) */
  cols: number;
  params: ParamDef[];
  ins: PortDef[];
  outs: PortDef[];
}

export { NOTE_NAMES };
export const VOICE_COUNTS = [1, 2, 4, 6, 8];
export const WT_NAMES = ['Sine', 'Tri', 'Saw', 'Square', 'Pulse', 'Organ', 'Vocal', 'Glass'];
export const FM_RATIOS = [0.5, 1, 1.5, 2, 3, 3.5, 4, 5, 7];
export const VOWELS = ['A', 'E', 'I', 'O', 'U'];

/** Scales for the quantizer, as semitones above the root. */
export const QUANT_SCALES: { name: string; semis: number[] }[] = [
  { name: 'Chromatic', semis: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { name: 'Major', semis: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural minor', semis: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Dorian', semis: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', semis: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian', semis: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian', semis: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Harmonic minor', semis: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Melodic minor', semis: [0, 2, 3, 5, 7, 9, 11] },
  { name: 'Major pent.', semis: [0, 2, 4, 7, 9] },
  { name: 'Minor pent.', semis: [0, 3, 5, 7, 10] },
  { name: 'Blues', semis: [0, 3, 5, 6, 7, 10] },
  { name: 'Whole tone', semis: [0, 2, 4, 6, 8, 10] },
  { name: 'Diminished', semis: [0, 1, 3, 4, 6, 7, 9, 10] },
  { name: 'Altered', semis: [0, 1, 3, 4, 6, 8, 10] },
  { name: 'Lydian ♭7', semis: [0, 2, 4, 6, 7, 9, 10] },
];

const knob = (id: string, label: string, min: number, max: number, def: number, curve: Curve = 'lin', unit?: Unit): ParamDef => ({ id, label, min, max, def, curve, unit });
const toggle = (id: string, label: string, def = 0): ParamDef => ({ id, label, min: 0, max: 1, def, kind: 'toggle', curve: 'int' });
const choice = (id: string, label: string, options: string[], def = 0): ParamDef => ({ id, label, min: 0, max: options.length - 1, def, kind: 'choice', curve: 'int', options });
const ports = (...spec: [string, string][]): PortDef[] => spec.map(([id, label]) => ({ id, label }));

const LIST: ModuleDef[] = [
  {
    type: 'midi', name: 'MIDI', title: 'MIDI to CV', family: 'io', cols: 3,
    blurb: 'Your keys as voltages: pitch, gate, velocity and the MiniLab strips. Voices > 1 makes every cable polyphonic.',
    params: [choice('voices', 'Voices', VOICE_COUNTS.map(String), 4), knob('glide', 'Glide', 0, 1.5, 0, 'lin', 's'), knob('bend', 'Bend', 0, 12, 2, 'int', 'st')],
    ins: [],
    outs: ports(['voct', 'V/Oct'], ['gate', 'Gate'], ['vel', 'Vel'], ['trig', 'Trig'], ['mod', 'Mod'], ['at', 'Press']),
  },
  {
    type: 'vco', name: 'VCO', title: 'Oscillator', family: 'src', cols: 4,
    blurb: 'Four waves at once. V/Oct sets pitch, FM bends it exponentially, PWM moves the square’s width, Sync restarts the cycle.',
    params: [knob('oct', 'Octave', -3, 3, 0, 'int', 'oct'), knob('tune', 'Tune', -12, 12, 0, 'lin', 'st'), knob('fm', 'FM', 0, 1, 0), knob('pw', 'Width', 0.05, 0.95, 0.5, 'lin', 'pct'), knob('pwm', 'PWM', 0, 1, 0)],
    ins: ports(['voct', 'V/Oct'], ['fm', 'FM'], ['pwm', 'PWM'], ['sync', 'Sync']),
    outs: ports(['sin', 'Sin'], ['tri', 'Tri'], ['saw', 'Saw'], ['sqr', 'Sqr']),
  },
  {
    type: 'lfo', name: 'LFO', title: 'Low-frequency oscillator', family: 'mod', cols: 2,
    blurb: 'Slow waves for movement: vibrato into FM, wah into a filter, tremolo into a VCA. Rate input is V/Oct.',
    params: [knob('rate', 'Rate', 0.02, 40, 2, 'exp', 'hz')],
    ins: ports(['rate', 'Rate'], ['reset', 'Reset']),
    outs: ports(['sin', 'Sin'], ['tri', 'Tri'], ['saw', 'Saw'], ['sqr', 'Sqr']),
  },
  {
    type: 'adsr', name: 'ADSR', title: 'Envelope', family: 'mod', cols: 2,
    blurb: 'Rises while the gate is high, falls when it ends: 0–10 V. Patch it into a VCA for loudness, into a filter for brightness.',
    params: [knob('a', 'Attack', 0.001, 8, 0.005, 'exp', 's'), knob('d', 'Decay', 0.005, 8, 0.3, 'exp', 's'), knob('s', 'Sustain', 0, 1, 0.6, 'lin', 'pct'), knob('r', 'Release', 0.005, 10, 0.4, 'exp', 's')],
    ins: ports(['gate', 'Gate'], ['retrig', 'Retrig']),
    outs: ports(['env', 'Env']),
  },
  {
    type: 'vcf', name: 'VCF', title: 'State-variable filter', family: 'filter', cols: 3,
    blurb: '12 dB filter with low, band and high outputs. CV is scaled by the CV knob (in octaves per volt); V/Oct tracks the keys.',
    params: [knob('cutoff', 'Cutoff', 20, 18000, 1200, 'exp', 'hz'), knob('res', 'Res', 0, 1, 0.2), knob('cv', 'CV amt', -1, 1, 0.5)],
    ins: ports(['in', 'In'], ['cv', 'CV'], ['voct', 'V/Oct'], ['res', 'Res']),
    outs: ports(['lp', 'LP'], ['bp', 'BP'], ['hp', 'HP']),
  },
  {
    type: 'ladder', name: 'LADDER', title: 'Ladder filter', family: 'filter', cols: 3,
    blurb: 'A 24 dB transistor-ladder low-pass: thick, squelchy, and it sings on its own near full resonance.',
    params: [knob('cutoff', 'Cutoff', 20, 16000, 800, 'exp', 'hz'), knob('res', 'Res', 0, 1, 0.3), knob('cv', 'CV amt', -1, 1, 0.5), knob('drive', 'Drive', 1, 6, 1.5, 'exp', 'x')],
    ins: ports(['in', 'In'], ['cv', 'CV'], ['voct', 'V/Oct']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'vca', name: 'VCA', title: 'Amplifier', family: 'amp', cols: 2,
    blurb: 'Gain set by CV (0–10 V) times Level. Nothing in CV = Level alone. Exp response is snappier on percussive sounds.',
    params: [knob('level', 'Level', 0, 1, 1, 'lin', 'pct'), choice('resp', 'Curve', ['Lin', 'Exp'], 0)],
    ins: ports(['in', 'In'], ['cv', 'CV']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'mix', name: 'MIX', title: 'Mixer', family: 'amp', cols: 4,
    blurb: 'Adds four signals, each with its own level: audio or control voltages.',
    params: [knob('l1', '1', 0, 1, 0.8), knob('l2', '2', 0, 1, 0.8), knob('l3', '3', 0, 1, 0.8), knob('l4', '4', 0, 1, 0.8)],
    ins: ports(['in1', '1'], ['in2', '2'], ['in3', '3'], ['in4', '4']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'noise', name: 'NOISE', title: 'Noise and sample & hold', family: 'src', cols: 2,
    blurb: 'White and pink noise, plus a sample & hold: each clock grabs the In voltage (or a random one) and holds it.',
    params: [knob('level', 'Level', 0, 1, 1, 'lin', 'pct')],
    ins: ports(['clk', 'Clock'], ['in', 'In']),
    outs: ports(['white', 'White'], ['pink', 'Pink'], ['sh', 'S&H']),
  },
  {
    type: 'clock', name: 'CLOCK', title: 'Clock', family: 'seq', cols: 2,
    blurb: 'Steady gates for sequencers and envelopes: quarters, eighths, sixteenths and one per bar.',
    params: [knob('bpm', 'Tempo', 30, 300, 110, 'int', 'bpm'), toggle('run', 'Run', 1)],
    ins: [],
    outs: ports(['q', '♩'], ['e', '♪'], ['s', '16th'], ['bar', 'Bar']),
  },
  {
    type: 'seq', name: 'SEQ', title: 'Step sequencer', family: 'seq', cols: 8,
    blurb: 'Eight steps of pitch (in semitones) and on/off gates, one step per clock. Feed V/Oct into a quantizer to keep it in key.',
    params: [
      ...Array.from({ length: 8 }, (_, i) => knob(`s${i}`, String(i + 1), -12, 12, [0, 3, 7, 10, 12, 7, 5, 3][i], 'int', 'st')),
      ...Array.from({ length: 8 }, (_, i) => toggle(`g${i}`, String(i + 1), 1)),
      knob('len', 'Length', 1, 8, 8, 'int'),
    ],
    ins: ports(['clk', 'Clock'], ['reset', 'Reset']),
    outs: ports(['voct', 'V/Oct'], ['gate', 'Gate']),
  },
  {
    type: 'quant', name: 'QUANT', title: 'Quantizer', family: 'util', cols: 2,
    blurb: 'Snaps any voltage to the nearest note of a scale. Trig fires whenever the note changes.',
    params: [choice('root', 'Root', NOTE_NAMES, 0), choice('scale', 'Scale', QUANT_SCALES.map((s) => s.name), 3)],
    ins: ports(['in', 'In']),
    outs: ports(['out', 'Out'], ['trig', 'Trig']),
  },
  {
    type: 'delay', name: 'DELAY', title: 'Delay', family: 'fx', cols: 3,
    blurb: 'Echoes with feedback; Tone darkens each repeat. Turning Time while it rings bends the pitch like tape.',
    params: [knob('time', 'Time', 0.01, 2, 0.36, 'exp', 's'), knob('fb', 'Feedback', 0, 0.95, 0.4, 'lin', 'pct'), knob('mix', 'Mix', 0, 1, 0.35, 'lin', 'pct'), knob('tone', 'Tone', 400, 14000, 4000, 'exp', 'hz')],
    ins: ports(['in', 'In'], ['time', 'Time']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'fold', name: 'FOLD', title: 'Wavefolder', family: 'fx', cols: 2,
    blurb: 'West-coast timbre: the louder it is driven, the more the wave folds back on itself into bright overtones.',
    params: [knob('fold', 'Fold', 0.5, 8, 2, 'exp', 'x'), knob('bias', 'Bias', -5, 5, 0, 'lin', 'v'), knob('cv', 'CV amt', 0, 1, 0.5)],
    ins: ports(['in', 'In'], ['cv', 'CV']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'util', name: 'ATT/OFS', title: 'Attenuverter and offset', family: 'util', cols: 2,
    blurb: 'Two lanes of Out = In × Gain + Offset. Nothing patched in = a steady voltage you set by hand.',
    params: [knob('a1', 'Gain 1', -1, 1, 1), knob('o1', 'Offset 1', -5, 5, 0, 'lin', 'v'), knob('a2', 'Gain 2', -1, 1, 1), knob('o2', 'Offset 2', -5, 5, 0, 'lin', 'v')],
    ins: ports(['in1', 'In 1'], ['in2', 'In 2']),
    outs: ports(['out1', 'Out 1'], ['out2', 'Out 2']),
  },
  {
    type: 'out', name: 'OUT', title: 'Audio out', family: 'io', cols: 2,
    blurb: 'To your speakers. All voices are summed; with nothing in R, L plays on both sides.',
    params: [knob('level', 'Level', 0, 1, 0.6, 'lin', 'pct')],
    ins: ports(['l', 'L'], ['r', 'R']),
    outs: [],
  },
  // ---------------------------------------------------------------- more sources
  {
    type: 'wt', name: 'WT', title: 'Wavetable oscillator', family: 'src', cols: 3,
    blurb: 'Sweeps smoothly through eight single-cycle waves, sine to organ to vocal to glass. A CV on Table morphs the timbre as you play.',
    params: [knob('oct', 'Octave', -3, 3, 0, 'int', 'oct'), knob('tune', 'Tune', -12, 12, 0, 'lin', 'st'), knob('table', 'Table', 0, 7, 2, 'lin', 'table'), knob('cv', 'CV amt', -1, 1, 0.5), knob('fm', 'FM', 0, 1, 0)],
    ins: ports(['voct', 'V/Oct'], ['table', 'Table'], ['fm', 'FM']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'fmop', name: 'FM OP', title: 'FM oscillator pair', family: 'src', cols: 3,
    blurb: 'A carrier and a modulator in one, the DX7 way: the modulator wobbles the carrier’s phase. Ratio picks the overtone family, Index the brightness.',
    params: [knob('oct', 'Octave', -3, 3, 0, 'int', 'oct'), knob('tune', 'Tune', -12, 12, 0, 'lin', 'st'), choice('ratio', 'Ratio', FM_RATIOS.map((r) => `×${r}`), 1), knob('index', 'Index', 0, 10, 2), knob('fb', 'Feedback', 0, 1, 0, 'lin', 'pct'), knob('cv', 'CV amt', 0, 1, 0.5)],
    ins: ports(['voct', 'V/Oct'], ['index', 'Index'], ['fm', 'FM']),
    outs: ports(['out', 'Out'], ['mod', 'Mod']),
  },
  {
    type: 'string', name: 'STRING', title: 'Plucked string', family: 'src', cols: 3,
    blurb: 'A physical model (Karplus–Strong): a burst of noise circling a tuned delay, losing brightness each trip. Harp, guitar, koto, clavinet.',
    params: [knob('oct', 'Octave', -3, 3, 0, 'int', 'oct'), knob('decay', 'Decay', 0.1, 12, 2, 'exp', 's'), knob('tone', 'Tone', 0, 1, 0.6, 'lin', 'pct'), knob('bright', 'Pluck', 0, 1, 0.7, 'lin', 'pct')],
    ins: ports(['voct', 'V/Oct'], ['trig', 'Pluck'], ['in', 'Exciter']),
    outs: ports(['out', 'Out']),
  },
  // ---------------------------------------------------------------- drums
  {
    type: 'kick', name: 'KICK', title: 'Bass drum', family: 'drum', cols: 2,
    blurb: 'An analogue-style kick: a sine whose pitch drops fast after each trigger, then fades. Punch sets the drop, Drive the grit.',
    params: [knob('tune', 'Tune', 30, 150, 52, 'exp', 'hz'), knob('decay', 'Decay', 0.05, 2, 0.5, 'exp', 's'), knob('punch', 'Punch', 0, 1, 0.5, 'lin', 'pct'), knob('drive', 'Drive', 1, 6, 1.5, 'exp', 'x')],
    ins: ports(['trig', 'Trig'], ['accent', 'Accent']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'snare', name: 'SNARE', title: 'Snare drum', family: 'drum', cols: 2,
    blurb: 'Two tuned drum heads plus a burst of filtered noise for the wires. Snappy balances the two.',
    params: [knob('tune', 'Tune', 100, 400, 180, 'exp', 'hz'), knob('decay', 'Decay', 0.05, 1, 0.2, 'exp', 's'), knob('snappy', 'Snappy', 0, 1, 0.6, 'lin', 'pct'), knob('tone', 'Tone', 1000, 12000, 5000, 'exp', 'hz')],
    ins: ports(['trig', 'Trig'], ['accent', 'Accent']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'hats', name: 'HATS', title: 'Hi-hats', family: 'drum', cols: 3,
    blurb: 'Six detuned square waves plus noise, high-passed: the 808 recipe for metal. Closed chokes an open hat, as on a real kit.',
    params: [knob('decay', 'Closed', 0.01, 0.4, 0.05, 'exp', 's'), knob('open', 'Open', 0.1, 2, 0.5, 'exp', 's'), knob('tone', 'Tone', 2000, 12000, 7000, 'exp', 'hz')],
    ins: ports(['trig', 'Closed'], ['open', 'Open'], ['accent', 'Accent']),
    outs: ports(['out', 'Out']),
  },
  // ---------------------------------------------------------------- more modulation
  {
    type: 'func', name: 'FUNC', title: 'Function generator', family: 'mod', cols: 2,
    blurb: 'A rise-and-fall shape, the Swiss-army knife of modular: envelope on a trigger, LFO when looping, slew (portamento) on a signal.',
    params: [knob('rise', 'Rise', 0.001, 10, 0.05, 'exp', 's'), knob('fall', 'Fall', 0.001, 10, 0.3, 'exp', 's'), choice('shape', 'Curve', ['Log', 'Lin', 'Exp'], 1), toggle('loop', 'Loop')],
    ins: ports(['trig', 'Trig'], ['in', 'In']),
    outs: ports(['out', 'Out'], ['end', 'End']),
  },
  {
    type: 'rand', name: 'RAND', title: 'Random voltages', family: 'mod', cols: 2,
    blurb: 'A new random voltage at every tick: stepped, or smoothly gliding between values. Each voice gets its own, for gentle detune and drift.',
    params: [knob('rate', 'Rate', 0.05, 40, 2, 'exp', 'hz'), knob('amt', 'Amount', 0, 1, 1, 'lin', 'pct')],
    ins: ports(['clk', 'Clock']),
    outs: ports(['step', 'Step'], ['smooth', 'Smooth'], ['trig', 'Trig']),
  },
  // ---------------------------------------------------------------- clocks and sequencing
  {
    type: 'turing', name: 'TURING', title: 'Turing machine', family: 'seq', cols: 3,
    blurb: 'A looping random melody: a shift register of bits that sometimes flip. At 0 change it repeats forever; turn it up to let the tune evolve.',
    params: [knob('change', 'Change', 0, 1, 0.1, 'lin', 'pct'), knob('length', 'Length', 2, 16, 8, 'int'), knob('range', 'Range', 0, 5, 2, 'lin', 'v')],
    ins: ports(['clk', 'Clock']),
    outs: ports(['cv', 'CV'], ['gate', 'Gate']),
  },
  {
    type: 'euclid', name: 'EUCLID', title: 'Euclidean rhythms', family: 'seq', cols: 3,
    blurb: 'Spreads a number of hits as evenly as possible over a number of steps. 3 in 8 is the tresillo, 5 in 8 the cinquillo, 7 in 16 a samba.',
    params: [knob('steps', 'Steps', 1, 16, 16, 'int'), knob('fills', 'Hits', 0, 16, 5, 'int'), knob('rotate', 'Rotate', 0, 15, 0, 'int')],
    ins: ports(['clk', 'Clock'], ['reset', 'Reset']),
    outs: ports(['gate', 'Hit'], ['off', 'Rest']),
  },
  {
    type: 'div', name: 'DIV', title: 'Clock divider', family: 'seq', cols: 3,
    blurb: 'One clock in, faster and slower clocks out: double time, and every 2nd, 3rd, 4th, 6th and 8th pulse. Polyrhythms in one module.',
    params: [],
    ins: ports(['clk', 'Clock'], ['reset', 'Reset']),
    outs: ports(['x2', '×2'], ['d2', '÷2'], ['d3', '÷3'], ['d4', '÷4'], ['d6', '÷6'], ['d8', '÷8']),
  },
  {
    type: 'coin', name: 'COIN', title: 'Bernoulli gate', family: 'seq', cols: 2,
    blurb: 'Flips a coin for each gate: it goes out of A or B. A cheap, musical way to add variation to a rhythm.',
    params: [knob('prob', 'Chance B', 0, 1, 0.5, 'lin', 'pct')],
    ins: ports(['in', 'Gate'], ['prob', 'Chance']),
    outs: ports(['a', 'A'], ['b', 'B']),
  },
  {
    type: 'switch', name: 'SWITCH', title: 'Sequential switch', family: 'seq', cols: 3,
    blurb: 'Steps through up to four inputs, one per clock. Switch between sequences, or between sounds, every bar.',
    params: [knob('steps', 'Steps', 2, 4, 4, 'int')],
    ins: ports(['clk', 'Clock'], ['reset', 'Reset'], ['in1', '1'], ['in2', '2'], ['in3', '3'], ['in4', '4']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'arp', name: 'ARP', title: 'Arpeggiator', family: 'seq', cols: 3,
    blurb: 'Plays the notes you hold one at a time, up, down or at random, over one to four octaves. Needs the MIDI module set to 2+ voices.',
    params: [choice('mode', 'Mode', ['Up', 'Down', 'Up-dn', 'Rand'], 0), knob('oct', 'Octaves', 1, 4, 1, 'int'), knob('rate', 'Rate', 0.5, 20, 6, 'exp', 'hz'), knob('len', 'Length', 0.05, 1, 0.5, 'lin', 'pct')],
    ins: ports(['voct', 'V/Oct'], ['gate', 'Gate'], ['clk', 'Clock']),
    outs: ports(['voct', 'V/Oct'], ['gate', 'Gate']),
  },
  // ---------------------------------------------------------------- filters and shapers
  {
    type: 'lpg', name: 'LPG', title: 'Low-pass gate', family: 'filter', cols: 2,
    blurb: 'Buchla’s filter and amplifier in one, opened by a light and a photocell: louder is brighter, and a ping decays like a struck object.',
    params: [knob('decay', 'Decay', 0.05, 4, 0.6, 'exp', 's'), choice('mode', 'Mode', ['Both', 'LP', 'VCA'], 0), knob('level', 'Open', 0, 1, 0, 'lin', 'pct')],
    ins: ports(['in', 'In'], ['cv', 'CV'], ['ping', 'Ping']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'comb', name: 'COMB', title: 'Comb filter', family: 'filter', cols: 3,
    blurb: 'A very short delay fed back on itself: metallic resonance, flanging, or — with V/Oct patched — a tuned resonator that rings at the note you play.',
    params: [knob('freq', 'Freq', 20, 4000, 220, 'exp', 'hz'), knob('fb', 'Feedback', -0.98, 0.98, 0.85), knob('mix', 'Mix', 0, 1, 0.5, 'lin', 'pct')],
    ins: ports(['in', 'In'], ['voct', 'V/Oct']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'vowel', name: 'VOWEL', title: 'Formant filter', family: 'filter', cols: 2,
    blurb: 'Three resonant peaks placed like a singer’s mouth: A, E, I, O, U. Sweep it with an LFO or the mod strip for talk-box funk.',
    params: [knob('vowel', 'Vowel', 0, 4, 0, 'lin', 'vowel'), knob('shift', 'Shift', -1, 1, 0), knob('res', 'Res', 1, 20, 8, 'exp', 'x'), knob('cv', 'CV amt', -1, 1, 0.5)],
    ins: ports(['in', 'In'], ['cv', 'Vowel']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'ring', name: 'RING', title: 'Ring modulator', family: 'filter', cols: 2,
    blurb: 'Multiplies two signals: the sum and difference of their frequencies replace the originals. Bells, robots, Dalek voices.',
    params: [knob('freq', 'Freq', 1, 4000, 440, 'exp', 'hz'), knob('mix', 'Mix', 0, 1, 1, 'lin', 'pct')],
    ins: ports(['a', 'In'], ['b', 'Carrier']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'drive', name: 'DRIVE', title: 'Overdrive', family: 'fx', cols: 2,
    blurb: 'Saturation, from warm tape to hard clipping. Tone tames the fizz the overtones add.',
    params: [knob('drive', 'Drive', 1, 30, 4, 'exp', 'x'), choice('shape', 'Curve', ['Soft', 'Hard', 'Tube'], 0), knob('tone', 'Tone', 500, 18000, 8000, 'exp', 'hz'), knob('mix', 'Mix', 0, 1, 1, 'lin', 'pct')],
    ins: ports(['in', 'In'], ['cv', 'Drive']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'crush', name: 'CRUSH', title: 'Bitcrusher', family: 'fx', cols: 2,
    blurb: 'Lo-fi: fewer bits make steps in the wave, a lower sample rate makes aliased, ringing overtones. Early samplers and video games.',
    params: [knob('bits', 'Bits', 1, 16, 8, 'int'), knob('rate', 'Rate', 200, 48000, 8000, 'exp', 'hz'), knob('mix', 'Mix', 0, 1, 1, 'lin', 'pct')],
    ins: ports(['in', 'In']),
    outs: ports(['out', 'Out']),
  },
  // ---------------------------------------------------------------- more effects
  {
    type: 'verb', name: 'VERB', title: 'Reverb', family: 'fx', cols: 3,
    blurb: 'A room around the sound (a Freeverb-style network of echoes). Mono in, stereo out.',
    params: [knob('size', 'Size', 0, 1, 0.6, 'lin', 'pct'), knob('damp', 'Damp', 0, 1, 0.4, 'lin', 'pct'), knob('mix', 'Mix', 0, 1, 0.35, 'lin', 'pct')],
    ins: ports(['in', 'In']),
    outs: ports(['l', 'L'], ['r', 'R']),
  },
  {
    type: 'chorus', name: 'CHORUS', title: 'Chorus and flanger', family: 'fx', cols: 2,
    blurb: 'Copies of the sound, each slightly delayed and wobbling in pitch, spread across left and right. Feedback turns it into a flanger.',
    params: [knob('rate', 'Rate', 0.05, 8, 0.6, 'exp', 'hz'), knob('depth', 'Depth', 0, 1, 0.5, 'lin', 'pct'), knob('fb', 'Feedback', 0, 0.9, 0, 'lin', 'pct'), knob('mix', 'Mix', 0, 1, 0.5, 'lin', 'pct')],
    ins: ports(['in', 'In']),
    outs: ports(['l', 'L'], ['r', 'R']),
  },
  {
    type: 'phaser', name: 'PHASER', title: 'Phaser', family: 'fx', cols: 2,
    blurb: 'Six all-pass stages swept by an LFO: moving notches that swoosh through the sound. A 70s funk and Rhodes staple.',
    params: [knob('rate', 'Rate', 0.05, 8, 0.4, 'exp', 'hz'), knob('depth', 'Depth', 0, 1, 0.7, 'lin', 'pct'), knob('fb', 'Feedback', 0, 0.95, 0.5, 'lin', 'pct'), knob('mix', 'Mix', 0, 1, 0.5, 'lin', 'pct')],
    ins: ports(['in', 'In']),
    outs: ports(['out', 'Out']),
  },
  // ---------------------------------------------------------------- more utilities
  {
    type: 'chord', name: 'CHORD', title: 'Chord generator', family: 'util', cols: 4,
    blurb: 'One note in, a whole chord out on a poly cable — any quality, inversion and voicing, or the diatonic chord of a key on whatever note you play.',
    params: [choice('key', 'Key', NOTE_NAMES, 0), choice('type', 'Chord', CHORD_TYPES.map((t) => t.label), 3), knob('inv', 'Inversion', 0, 3, 0, 'int'), choice('voicing', 'Voicing', VOICINGS, 0)],
    ins: ports(['voct', 'V/Oct'], ['type', 'Chord'], ['inv', 'Inv']),
    outs: ports(['voct', 'Chord'], ['bass', 'Bass']),
  },
  {
    type: 'logic', name: 'LOGIC', title: 'Gate logic', family: 'util', cols: 2,
    blurb: 'Combines two gates: AND (both high), OR (either), XOR (one but not both), and NOT A (inverted). Builds new rhythms from old ones.',
    params: [],
    ins: ports(['a', 'A'], ['b', 'B']),
    outs: ports(['and', 'And'], ['or', 'Or'], ['xor', 'Xor'], ['nota', 'Not A']),
  },
  {
    type: 'xfade', name: 'XFADE', title: 'Crossfader', family: 'util', cols: 2,
    blurb: 'Blends from A to B. With an LFO on CV it morphs between two sounds; with an envelope, a sound can turn into another as it plays.',
    params: [knob('fade', 'Fade', 0, 1, 0.5, 'lin', 'pct')],
    ins: ports(['a', 'A'], ['b', 'B'], ['cv', 'CV']),
    outs: ports(['out', 'Out']),
  },
  {
    type: 'pan', name: 'PAN', title: 'Stereo panner', family: 'util', cols: 2,
    blurb: 'Places a sound left to right. Spread fans the voices of a chord across the stereo field.',
    params: [knob('pan', 'Pan', -1, 1, 0), knob('spread', 'Spread', 0, 1, 0.5, 'lin', 'pct')],
    ins: ports(['in', 'In'], ['cv', 'Pan']),
    outs: ports(['l', 'L'], ['r', 'R']),
  },
  {
    type: 'scope', name: 'SCOPE', title: 'Oscilloscope', family: 'util', cols: 4,
    blurb: 'Draws the voltage on its inputs over time: see the wave shapes, envelopes and LFOs you are hearing. Patch any output into it.',
    params: [knob('time', 'Time', 0.002, 2, 0.02, 'exp', 's'), knob('scale', 'Zoom', 0.25, 8, 1, 'exp', 'x')],
    ins: ports(['a', 'A'], ['b', 'B']),
    outs: [],
  },
];

export const MODULES = Object.fromEntries(LIST.map((m) => [m.type, m])) as Record<ModuleType, ModuleDef>;
export const MODULE_LIST = LIST;

/** Knob position 0..1 for a value. */
export function toNorm(p: ParamDef, v: number): number {
  if (p.max === p.min) return 0;
  if (p.curve === 'exp' && p.min > 0) return Math.log(v / p.min) / Math.log(p.max / p.min);
  return (v - p.min) / (p.max - p.min);
}

/** Value for a knob position 0..1. */
export function fromNorm(p: ParamDef, t: number): number {
  const u = Math.min(1, Math.max(0, t));
  const v = p.curve === 'exp' && p.min > 0 ? p.min * Math.pow(p.max / p.min, u) : p.min + u * (p.max - p.min);
  return p.curve === 'int' ? Math.round(v) : v;
}

const num = (v: number, digits: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(digits));

/** Value as shown under a knob. */
export function formatParam(p: ParamDef, v: number): string {
  if (p.options) return p.options[Math.round(v)] ?? '';
  switch (p.unit) {
    case 'hz': return v >= 1000 ? `${num(v / 1000, 1)}k` : v < 10 ? v.toFixed(2) : num(v, 0);
    case 's': return v < 1 ? `${Math.round(v * 1000)}ms` : `${v.toFixed(2)}s`;
    case 'st': return `${v > 0 ? '+' : ''}${p.curve === 'int' ? v : v.toFixed(1)}`;
    case 'oct': return `${v > 0 ? '+' : ''}${v}`;
    case 'v': return `${v > 0 ? '+' : ''}${v.toFixed(1)}V`;
    case 'bpm': return String(Math.round(v));
    case 'pct': return `${Math.round(v * 100)}%`;
    case 'x': return `×${v.toFixed(1)}`;
    case 'table': return WT_NAMES[Math.round(v)] ?? '';
    case 'vowel': return VOWELS[Math.round(v)] ?? '';
    default: return p.curve === 'int' ? String(v) : v.toFixed(2);
  }
}
