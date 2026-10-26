import type { RackSpec } from '../synth/demo';
import type { Topic } from './types';

/** Sequencer step params: pitches in semitones, and which steps play ('x' plays, '.' rests). */
const steps = (pitches: number[], gates = 'xxxxxxxxxxxxxxxx'): Record<string, number> => {
  const p: Record<string, number> = { len: pitches.length };
  pitches.forEach((s, i) => (p[`s${i}`] = s));
  for (let i = 0; i < 16; i++) p[`g${i}`] = gates[i] === '.' ? 0 : 1;
  return p;
};

/** A clocked mono voice: whatever plays `pitch` and `gate` into a VCO → VCF → VCA with a plucky envelope. */
const pluck = (o: { oct?: number; port?: string; cutoff?: number; res?: number; decay?: number } = {}): RackSpec['mods'] => ({
  vco: ['vco', { oct: o.oct ?? -1 }],
  flt: ['vcf', { cutoff: o.cutoff ?? 500, res: o.res ?? 0.45, cv: 0.4 }],
  env: ['adsr', { a: 0.002, d: o.decay ?? 0.2, s: 0, r: 0.12 }],
  vca: ['vca', { resp: 1 }],
  out: ['out', { level: 0.55 }],
});
const PLUCK_WIRES = ['vco.saw>flt.in', 'env.env>flt.cv', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>out.l'];

// minor-pentatonic bass line, two bars of 8ths
const LINE = [0, 0, 12, 0, 10, 0, 7, 5, 0, 0, 12, 0, 15, 12, 10, 7];

export const SEQ_TOPICS: Topic[] = [
  {
    id: 'seq.clock', title: 'Clocks, gates & triggers', tags: ['seq'], minutes: 5, level: 1,
    summary: 'A metronome made of voltages: clock outputs at different speeds, gate length, and one clock running a whole rack.',
    blocks: [
      { t: 'p', md: 'In a modular, time is a voltage too. A **clock** sends a gate at a steady rate, and anything that listens to gates (an envelope, a sequencer, a drum, a sample & hold) moves when it arrives. The Clock module gives four speeds from one tempo: **quarters**, **8ths**, **16ths** and **bars**. Every gate is high for half its step.' },
      { t: 'table', head: ['Output', 'At 120 BPM', 'Use'], rows: [
        ['Quarter', '2 per second', 'kick, a pulse, slow sequences'],
        ['8th', '4 per second', 'bass lines, arpeggios'],
        ['16th', '8 per second', 'hats, fast sequences, sample & hold'],
        ['Bar', 'every 4 beats', 'resetting sequences, changing patterns'],
      ] },
      { t: 'synth', demo: {
        name: 'CLOCK BLEEP', view: 'none', seconds: 4,
        rack: { mods: { clk: ['clock', { bpm: 120 }], pick: ['mix', { l1: 1, l2: 0, l3: 0 }], ...pluck({ oct: 0, cutoff: 900, decay: 0.08 }) },
          wires: ['clk.q>pick.in1', 'clk.e>pick.in2', 'clk.s>pick.in3', 'pick.out>env.gate', ...PLUCK_WIRES] },
        caption: 'One note retriggered by the clock: from the quarter, 8th and 16th outputs.',
        tries: [{ label: 'Quarters' }, { label: '8ths', set: { 'pick.l1': 0, 'pick.l2': 1 } }, { label: '16ths', set: { 'pick.l1': 0, 'pick.l3': 1 } }],
      } },
      { t: 'p', md: 'A **gate** has a length; a **trigger** is only an instant. An ADSR needs the gate\'s length to know when to release: a short gate on a slow envelope cuts the note before it reaches full volume. Drums and AD envelopes only need the start. Because every clock output is high for half a step, an ADSR on 16ths at 120 BPM is held for 62 ms: give it a short decay and no sustain for a clean, separate note each time.' },
      { t: 'synth', demo: {
        name: 'ONE CLOCK', view: 'none', seconds: 4.2,
        rack: { mods: { clk: ['clock', { bpm: 112 }], kick: ['kick', { tune: 50, decay: 0.4, punch: 0.55 }], hats: ['hats', { decay: 0.04, tone: 8000 }], mix: ['mix', { l1: 0.9, l2: 0.35, l3: 0, l4: 0 }], out: ['out', { level: 0.6 }] },
          wires: ['clk.q>kick.trig', 'clk.e>hats.trig', 'kick.out>mix.in1', 'hats.out>mix.in2', 'mix.out>out.l'] },
        caption: 'A kick on the quarters and hats on the 8ths, both from one clock: they can never drift apart. Then the same rack at a faster tempo: everything follows.',
        tries: [{ label: 'Kick + 8th hats' }, { label: 'Faster tempo', set: { 'clk.bpm': 132 } }],
      } },
      { t: 'p', md: '**One master clock** is the rule: drive every sequencer and drum from the same clock (or from dividers of it) and everything stays locked. Change the tempo and the whole rack follows. Esc, or a long press down on the pitch strip, stops every clock at once.' },
      { t: 'example', title: 'A pulse with movement', steps: [
        'Clock 16ths → ADSR Gate; a VCO saw through a VCF into a VCA opened by that ADSR. Every 16th sounds the same note.',
        'Patch an LFO at a slow 0.25 Hz into the VCF CV: the repeated note now opens and closes over four bars.',
        'Clock Bar → a second ADSR with a long decay, into the VCA through a Mix with the first: an accent every bar.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'seq.step', title: 'The step sequencer', tags: ['seq'], minutes: 6, level: 1,
    summary: 'Sixteen steps of pitch and gates: writing a bass line, rests, length, and transposing a running sequence from the keyboard.',
    blocks: [
      { t: 'p', md: 'A **step sequencer** holds a row of voltages and moves one step for every clock pulse it receives, sending that step\'s **pitch** (in semitones, as V/Oct) and, if the step is lit, a **gate**. Dark steps are **rests**. **Length** sets how many steps before it loops. Here: 16 steps in two banks of eight, pitches from −12 to +12 semitones above the VCO\'s pitch.' },
      { t: 'synth', demo: {
        name: 'SEQ LINE', view: 'none', seconds: 4.4,
        rack: { mods: { clk: ['clock', { bpm: 110 }], seq: ['seq', steps(LINE)], ...pluck({ oct: -2, cutoff: 400, res: 0.5 }) },
          wires: ['clk.e>seq.clk', 'seq.voct>vco.voct', 'seq.gate>env.gate', ...PLUCK_WIRES] },
        caption: 'A two-bar minor-pentatonic bass line in 8ths. Then rests (gates off) to make it groove, then the length cut to 8 (the first bar loops).',
        tries: [
          { label: 'All steps' },
          { label: 'With rests', set: { 'seq.g1': 0, 'seq.g3': 0, 'seq.g9': 0, 'seq.g11': 0 } },
          { label: 'Length 8', set: { 'seq.len': 8 } },
        ],
      } },
      { t: 'p', md: 'Write sequences like a bass player: **root on the downbeat**, octave jumps for bounce, the ♭7 and 5th as passing notes, and rests so the line breathes. Accent and timbre move it further: patch the gate to a filter envelope and every note speaks; patch a slow LFO to the cutoff and the line evolves while the notes stay the same.' },
      { t: 'p', md: '**Transposing a sequence.** V/Oct voltages add: mix the sequencer\'s output with the MIDI module\'s V/Oct (two Mix inputs at full level) and the keyboard transposes the running line. Hold E and it plays in E. Run the sum through a **quantizer** and it stays in a scale even when the keyboard note is outside it. This is the factory **DORIAN SEQ** rack.' },
      { t: 'synth', demo: {
        name: 'TRANSPOSE', view: 'none', seconds: 4.6,
        rack: { mods: { clk: ['clock', { bpm: 112 }], seq: ['seq', steps([0, 7, 12, 7, 10, 7, 3, 5])], key: ['util', { a1: 0, o1: 0 }], add: ['mix', { l1: 1, l2: 1, l3: 0, l4: 0 }], ...pluck({ oct: -1, cutoff: 600 }) },
          wires: ['clk.e>seq.clk', 'seq.voct>add.in1', 'key.out1>add.in2', 'add.out>vco.voct', 'seq.gate>env.gate', ...PLUCK_WIRES] },
        caption: 'The same 8-step figure with a steady voltage added (standing in for a held key): +0, +5/12 V (up a 4th) and −2/12 V (down a tone).',
        tries: [{ label: 'In C' }, { label: 'Up a 4th', set: { 'key.o1': 5 / 12 } }, { label: 'Down a tone', set: { 'key.o1': -2 / 12 } }],
      } },
      { t: 'p', md: '**Reset.** A sequencer only counts pulses, so if it misses one, or you change the length, it drifts out of phase with the rest of the rack. Patch the clock\'s **Bar** output to Reset and step 1 always lands on beat 1.' },
      { t: 'example', title: 'Program a funk bass line', steps: [
        'Clock 16ths → Seq Clock, Length 16, VCO two octaves down through a ladder filter.',
        'Steps 1, 4, 7, 11 and 15 lit; the rest dark. Pitches: 0 on step 1, 12 on step 4 (octave pop), 10 on 7, 7 on 11, 5 on 15.',
        'A short filter envelope (decay 0.15 s) gives each note a snap. Add Bar → Reset so the One stays the One.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'seq.quant', title: 'Quantizers, scales & sample-and-hold', tags: ['seq', 'core'], minutes: 5, level: 2,
    summary: 'Snapping any voltage to a scale: random melodies that stay in key, and how the scale changes the mood of the same voltages.',
    blocks: [
      { t: 'p', md: 'A **quantizer** takes any voltage and moves it to the nearest note of a scale. Random voltages, LFOs and envelopes become melodies; a sequencer written in semitones is forced into a mode. Choose a scale and the same voltages take on its colour. The **Trig** output fires whenever the note changes: a free gate that follows the melody.' },
      { t: 'p', md: 'A **sample & hold** (S&H) reads its input when clocked and holds that voltage until the next clock. With noise in, every clock grabs a new random value: the classic random bleeps. Scale it first (a Util lane at gain 0.3 turns ±5 V into about ±1.5 octaves), then quantize.' },
      { t: 'synth', demo: {
        name: 'S&H SCALES', view: 'none', seconds: 4.6,
        rack: { mods: { clk: ['clock', { bpm: 120 }], rnd: ['noise'], range: ['util', { a1: 0.3 }], q: ['quant', { root: 0, scale: 9 }], ...pluck({ oct: 1, cutoff: 1800, decay: 0.12 }), dly: ['delay', { time: 0.375, fb: 0.45, mix: 0.3, tone: 3000 }] },
          wires: ['clk.s>rnd.clk', 'rnd.sh>range.in1', 'range.out1>q.in', 'q.out>vco.voct', 'clk.e>env.gate', 'vco.saw>flt.in', 'env.env>flt.cv', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>dly.in', 'dly.out>out.l'] },
        caption: 'Random voltages, sampled on 16ths, played on 8ths through a quantizer: major pentatonic, Dorian, whole tone, then no quantizing (chromatic).',
        tries: [{ label: 'Major pent.' }, { label: 'Dorian', set: { 'q.scale': 3 } }, { label: 'Whole tone', set: { 'q.scale': 12 } }, { label: 'Chromatic', set: { 'q.scale': 0 } }],
      } },
      { t: 'table', head: ['Scale', 'Feel over random notes'], rows: [
        ['Major / minor pentatonic', 'no half steps: nothing can clash, always "pretty"'],
        ['Dorian, Mixolydian', 'modal, funky: one bright note each'],
        ['Harmonic minor', 'exotic: the augmented 2nd'],
        ['Whole tone', 'floating, dreamlike: no tonic'],
        ['Chromatic', 'every semitone: atonal, sci-fi'],
      ] },
      { t: 'p', md: '**Quantize a sequence to a mode.** Program the sequencer in plain semitones and let the quantizer decide the mode: the same line in Dorian, Phrygian or Lydian. Changing the quantizer\'s **root** transposes; changing its **scale** reharmonises. With a sequencer driving the root as well, the rack plays its own chord changes.' },
      { t: 'synth', demo: {
        name: 'MODE SWAP', view: 'none', seconds: 4.4,
        rack: { mods: { clk: ['clock', { bpm: 116 }], seq: ['seq', steps([-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5])], q: ['quant', { root: 2, scale: 3 }], ...pluck({ oct: 0, cutoff: 900 }) },
          wires: ['clk.e>seq.clk', 'seq.voct>q.in', 'q.out>vco.voct', 'seq.gate>env.gate', ...PLUCK_WIRES] },
        caption: 'A chromatic climb from D, every semitone for 16 steps, quantized to D Dorian, D Phrygian and D Lydian. The same voltages: each mode keeps its own notes, and the steps in between snap to a neighbour.',
        tries: [{ label: 'D Dorian' }, { label: 'D Phrygian', set: { 'q.scale': 4 } }, { label: 'D Lydian', set: { 'q.scale': 5 } }],
      } },
      { t: 'example', title: 'Generative melody in a key', steps: [
        'Noise S&H (clocked by 16ths) → Util (gain 0.3) → Quant (root A, minor pentatonic) → VCO.',
        'Gate the envelope from 8ths, not 16ths: half the samples are never heard, so phrases feel less busy.',
        'Add a delay at a dotted 8th. Every bar is new, and every note is in A minor pentatonic.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'seq.drums', title: 'Drum synthesis & Euclidean rhythm', tags: ['seq', 'rhythm'], minutes: 6, level: 2,
    summary: 'How a synth makes a kick, snare and hats; spreading hits evenly with Euclid; probability for variation.',
    blocks: [
      { t: 'p', md: 'Analogue drum machines (the 808, the 909) synthesise every drum from a few parts. **Kick**: a sine whose pitch drops fast after the hit (the punch), then a decay. **Snare**: two tuned tones for the head plus filtered noise for the wires. **Hats**: six detuned square waves and noise, high-passed into a metallic hiss; a closed hit chokes an open one.' },
      { t: 'synth', demo: {
        name: 'KICK', view: 'none', seconds: 3.4,
        rack: { mods: { clk: ['clock', { bpm: 100 }], kick: ['kick', { tune: 50, decay: 0.5, punch: 0.5, drive: 1.5 }], out: ['out', { level: 0.6 }] },
          wires: ['clk.q>kick.trig', 'kick.out>out.l'] },
        caption: 'The kick: default, a long 808-style boom, a short punchy techno kick, and driven.',
        tries: [{ label: 'Kick' }, { label: '808 boom', set: { 'kick.decay': 1.4, 'kick.tune': 45, 'kick.punch': 0.3 } }, { label: 'Techno', set: { 'kick.decay': 0.2, 'kick.punch': 0.8 } }, { label: 'Driven', set: { 'kick.drive': 4.5 } }],
      } },
      { t: 'p', md: 'A **Euclidean rhythm** spreads a number of hits as evenly as possible across a number of steps (Bjorklund\'s algorithm, as Godfried Toussaint showed in 2005). Many traditional rhythms are exactly that: 3 in 8 is the Cuban **tresillo**, 5 in 8 the **cinquillo**, 7 in 12 a West African bell, 5 in 16 the bossa nova. **Rotate** starts the same pattern on a different step.' },
      { t: 'table', head: ['Hits / steps', 'Pattern', 'Name'], rows: [
        ['3 / 8', 'x . . x . . x .', 'tresillo'],
        ['5 / 8', 'x . x x . x x .', 'cinquillo'],
        ['4 / 16', 'x . . . x . . . x . . . x . . .', 'four on the floor'],
        ['5 / 16', 'x . . x . . x . . x . . x . . .', 'bossa nova'],
        ['7 / 16', 'x . . x . x . x . . x . x . x .', 'samba-like'],
      ] },
      { t: 'synth', demo: {
        name: 'EUCLID', view: 'none', seconds: 4.8,
        rack: { mods: { clk: ['clock', { bpm: 104 }], ek: ['euclid', { steps: 16, fills: 4 }], es: ['euclid', { steps: 16, fills: 2, rotate: 4 }], eh: ['euclid', { steps: 16, fills: 16 }], kick: ['kick', { tune: 50, decay: 0.4 }], snare: ['snare', { decay: 0.18 }], hats: ['hats', { decay: 0.035 }], mix: ['mix', { l1: 0.9, l2: 0.55, l3: 0.3, l4: 0 }], out: ['out', { level: 0.6 }] },
          wires: ['clk.s>ek.clk', 'clk.s>es.clk', 'clk.s>eh.clk', 'clk.bar>ek.reset', 'clk.bar>es.reset', 'clk.bar>eh.reset', 'ek.gate>kick.trig', 'es.gate>snare.trig', 'eh.gate>hats.trig', 'kick.out>mix.in1', 'snare.out>mix.in2', 'hats.out>mix.in3', 'mix.out>out.l'] },
        caption: 'Three Euclid modules on one clock: kick 4/16, snare 2/16 rotated onto the backbeat, hats 16/16. Then the kick at 6/16 (a tresillo twice a bar), at 5/16 (the bossa figure), and that with the hats thinned to 7/16.',
        tries: [{ label: 'Four on the floor' }, { label: 'Kick 6/16', set: { 'ek.fills': 6 } }, { label: 'Kick 5/16', set: { 'ek.fills': 5 } }, { label: 'Hats 7/16', set: { 'eh.fills': 7, 'ek.fills': 5 } }],
      } },
      { t: 'p', md: '**Probability** keeps a loop alive. A **Bernoulli gate** (the Coin module) tosses a coin for every gate and sends it to output A or B: send most hats to the closed input and a few to the open one, or let a percentage of snare ghost notes through. Small probabilities (10–20%) feel like a drummer\'s variations; 50% is chaos.' },
      { t: 'example', title: 'Build a beat from two numbers each', steps: [
        'Clock 16ths into three Euclids; Bar → every Reset.',
        'Kick 4/16 (four on the floor); snare 2/16 with Rotate 4 (beats 2 and 4); hats 16/16 through a Coin at 15% into Open.',
        'Change only the kick to 5/16 and then 7/16: new grooves without programming a single step.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'seq.polymeter', title: 'Polymeter, polyrhythm & clock division', tags: ['seq', 'rhythm'], minutes: 5, level: 2,
    summary: 'Loops of different lengths against each other, 3 against 4 from one clock, and slow phasing.',
    blocks: [
      { t: 'p', md: '**Polymeter**: two loops with the same step size but different lengths. A 7-step sequence over a 16-step drum loop starts one step earlier each bar, so the melody lands on a different beat every time and only lines up again after 7 × 16 = 112 steps (7 bars). The notes are fixed; the accents keep moving. **Polyrhythm**: two pulses of different sizes in the same span: 3 against 4, 3 against 2.' },
      { t: 'synth', demo: {
        name: 'POLYMETER', view: 'none', seconds: 6.2,
        rack: { mods: { clk: ['clock', { bpm: 116 }], seq: ['seq', steps([0, 7, 3, 10, 5, 12, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0])], kick: ['kick', { tune: 50, decay: 0.35 }], ...pluck({ oct: -1, cutoff: 800, decay: 0.15 }), mix: ['mix', { l1: 0.75, l2: 0.8, l3: 0, l4: 0 }] },
          wires: ['clk.s>seq.clk', 'seq.voct>vco.voct', 'seq.gate>env.gate', 'clk.q>kick.trig', 'vco.saw>flt.in', 'env.env>flt.cv', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>mix.in1', 'kick.out>mix.in2', 'mix.out>out.l'] },
        caption: 'A sequence on 16ths against a four-on-the-floor kick: length 8 (locked to the beat), 7, then 5: the figure slides against the kick.',
        tries: [{ label: 'Length 8' }, { label: 'Length 7', set: { 'seq.len': 7 } }, { label: 'Length 5', set: { 'seq.len': 5 } }],
      } },
      { t: 'p', md: 'A **clock divider** turns one clock into several slower ones that stay locked: every 2nd, 3rd, 4th, 6th and 8th pulse, plus double time. Drive one voice from ÷3 and another from ÷4 of the same 16ths and you get 3 against 4 that never drifts. Into drums, ÷3 hats over a ÷4 kick is the "dotted 8th" pulse that crosses the bar.' },
      { t: 'synth', demo: {
        name: '3 AGAINST 4', view: 'none', seconds: 4.4,
        rack: { mods: { clk: ['clock', { bpm: 100 }], div: ['div'], kick: ['kick', { tune: 48, decay: 0.3 }], hats: ['hats', { decay: 0.05, tone: 9000 }], mix: ['mix', { l1: 0.85, l2: 0.45, l3: 0, l4: 0 }], out: ['out', { level: 0.6 }] },
          wires: ['clk.s>div.clk', 'div.d4>kick.trig', 'div.d3>hats.trig', 'kick.out>mix.in1', 'hats.out>mix.in2', 'mix.out>out.l'] },
        caption: 'From one 16th clock: a kick on every 4th pulse (quarters), hats on every 3rd (dotted 8ths). Four hats in the time of three kicks; they line up every three beats, so the pattern rolls across the bar line.',
        tries: [{ label: '÷4 against ÷3' }],
      } },
      { t: 'note', kind: 'ear', md: 'Steve Reich\'s *Piano Phase* puts two identical 12-note loops at slightly different tempos so they slide apart and back together. Two clocks at 120 and 121 BPM into two copies of a sequence do the same in the rack.' },
      { t: 'example', title: 'A melody that never repeats the same way', steps: [
        'Drums on a 16-step loop; a sequencer on the same 16ths with Length 7.',
        'Write only five notes in it, with two rests: the gaps fall in a new place every bar.',
        'Add a second sequencer at Length 5 for a counter-line: 7 and 5 against 16 line up only every 35 bars.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'seq.generative', title: 'Generative sequencing: the Turing machine & chance', tags: ['seq'], minutes: 6, level: 3,
    summary: 'Loops that slowly mutate, random that you can lock, and patches that compose while you listen.',
    blocks: [
      { t: 'p', md: 'Generative patches set up rules and let the music happen. The trick is **controlled** randomness: loops that repeat long enough to be heard as phrases, but change slowly enough to stay interesting. Pure randomness is noise; a fixed loop is a loop; the interesting place is in between.' },
      { t: 'p', md: 'The **Turing Machine** (Tom Whitwell\'s design) is a ring of 16 bits that shifts one place on every clock. The bits make a voltage, a melody, and a gate. As each bit comes round, **Change** sets the chance it flips: at 0 the loop repeats exactly, at a little it evolves a note at a time, at 50% it is pure random. **Length** sets the loop size (2 to 16 steps); **Range** its pitch span. Find a phrase you like, turn Change to 0, and it is locked.' },
      { t: 'synth', demo: {
        name: 'TURING', view: 'none', seconds: 6.4,
        rack: { mods: { clk: ['clock', { bpm: 116 }], tm: ['turing', { change: 0, length: 8, range: 1.5 }], q: ['quant', { root: 4, scale: 10 }], ...pluck({ oct: -1, cutoff: 500, res: 0.55 }) },
          wires: ['clk.e>tm.clk', 'tm.cv>q.in', 'q.out>vco.voct', 'tm.gate>env.gate', ...PLUCK_WIRES] },
        caption: 'A Turing machine quantized to E minor pentatonic: locked (Change 0), slowly evolving (0.15), and fully random (0.5). Then locked at length 5.',
        tries: [{ label: 'Locked' }, { label: 'Evolving', set: { 'tm.change': 0.15 } }, { label: 'Random', set: { 'tm.change': 0.5 } }, { label: 'Length 5', set: { 'tm.length': 5 } }],
      } },
      { t: 'table', head: ['Source', 'What it gives', 'Tame it with'], rows: [
        ['Turing machine', 'a looping, mutating phrase', 'Change near 0, a quantizer'],
        ['Noise S&H', 'a new random voltage per clock', 'a Util for range, a quantizer'],
        ['Rand (smooth)', 'slow drifting curves', 'small amounts on cutoff, pan, pitch'],
        ['Coin (Bernoulli)', 'gates by chance', 'probability: 10–30% for variation'],
        ['Euclid', 'evenly spread hits', 'reset on the bar'],
      ] },
      { t: 'synth', demo: {
        name: 'GENERATIVE', view: 'none', seconds: 6.4,
        rack: { mods: { clk: ['clock', { bpm: 90 }], tm: ['turing', { change: 0.1, length: 11, range: 2 }], coin: ['coin', { prob: 0.3 }], drift: ['rand', { rate: 0.3, amt: 0.6 }], q: ['quant', { root: 2, scale: 3 }], vco: ['vco', { oct: 0 }], flt: ['vcf', { cutoff: 700, res: 0.5, cv: 0.35 }], env: ['adsr', { a: 0.005, d: 0.6, s: 0, r: 0.5 }], vca: ['vca', { resp: 1 }], dly: ['delay', { time: 0.5, fb: 0.55, mix: 0.4, tone: 2500 }], verb: ['verb', { size: 0.8, mix: 0.3 }], out: ['out', { level: 0.55 }] },
          wires: ['clk.e>tm.clk', 'tm.cv>q.in', 'q.out>vco.voct', 'clk.e>coin.in', 'coin.b>env.gate', 'drift.smooth>flt.cv', 'vco.tri>flt.in', 'env.env>vca.cv', 'flt.lp>vca.in', 'vca.out>dly.in', 'dly.out>verb.in', 'verb.l>out.l', 'verb.r>out.r'] },
        caption: 'An ambient patch: a slowly mutating Turing phrase in D Dorian, played only when a coin says so (30%), a drifting filter, long echoes and reverb. Then the coin at 70%.',
        tries: [{ label: 'Sparse' }, { label: 'Busier', set: { 'coin.prob': 0.7 } }],
      } },
      { t: 'example', title: 'Lock a phrase you like', steps: [
        'Turing Change at 0.3 into a quantizer: listen until a phrase catches your ear.',
        'Turn Change to 0 at once: that phrase now loops exactly.',
        'Shorten Length to make a riff of it, or turn Change up to 0.05 so it drifts a note every few bars.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'seq.arp', title: 'Arpeggiators & playing a rack live', tags: ['seq'], minutes: 5, level: 3,
    summary: 'Turning held chords into patterns: modes, octaves, gate length and clock sync, plus performance tricks.',
    blocks: [
      { t: 'p', md: 'An **arpeggiator** plays the notes you hold one at a time: up, down, up-and-down or at random, across one to four octaves. Held chords become moving lines, so harmony knowledge becomes rhythm: change chords and the pattern follows. It needs several notes at once, so set the MIDI module to 2 or more voices and feed the arp its V/Oct and Gate.' },
      { t: 'synth', demo: {
        name: 'ARP', view: 'none',
        rack: { mods: { midi: ['midi', { voices: 2 }], clk: ['clock', { bpm: 120 }], arp: ['arp', { mode: 0, oct: 2, len: 0.5 }], ...pluck({ oct: 0, cutoff: 1400, decay: 0.15 }), dly: ['delay', { time: 0.375, fb: 0.4, mix: 0.3, tone: 3500 }] },
          wires: ['midi.voct>arp.voct', 'midi.gate>arp.gate', 'clk.s>arp.clk', 'arp.voct>vco.voct', 'arp.gate>env.gate', 'vco.saw>flt.in', 'env.env>flt.cv', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>dly.in', 'dly.out>out.l'] },
        play: [['C3', 0, 2], ['E♭3', 0, 2], ['G3', 0, 2], ['B♭3', 0, 2], ['A♭2', 2, 2], ['C3', 2, 2], ['E♭3', 2, 2], ['G3', 2, 2]],
        caption: 'Cm7 then A♭maj7 held, arpeggiated in 16ths over two octaves: up, down, up-down, random.',
        tries: [{ label: 'Up' }, { label: 'Down', set: { 'arp.mode': 1 } }, { label: 'Up-down', set: { 'arp.mode': 2 } }, { label: 'Random', set: { 'arp.mode': 3 } }],
      } },
      { t: 'p', md: '**Gate length** (Len) is articulation: short is staccato and lets a pluck envelope ring through; full is legato and turns a pad patch into a shimmering wash. **Clock sync**: patch the clock to the arp and it locks to the rack\'s tempo (and its drums); without a clock its Rate knob sets the speed. **Octaves** stretch a small chord into a long, harp-like run.' },
      { t: 'table', head: ['Performance move', 'How'], rows: [
        ['Change chords on the beat', 'release and press just before the downbeat; the arp keeps time'],
        ['Open the filter by hand', 'a slow sweep with the mod strip or a knob is the trance build'],
        ['Delay synced to the arp', 'a dotted 8th echo doubles the pattern\'s density'],
        ['Inversions', 'play the same chord in a different inversion: the pattern\'s top note changes'],
        ['Mute and drop', 'stop the clock for a bar, start it on the One'],
      ] },
      { t: 'synth', demo: {
        name: 'ARP LEN', view: 'none',
        rack: { mods: { midi: ['midi', { voices: 2 }], clk: ['clock', { bpm: 120 }], arp: ['arp', { mode: 2, oct: 1, len: 0.15 }], vco: ['vco', { oct: 0 }], flt: ['vcf', { cutoff: 1800, res: 0.2, cv: 0 }], env: ['adsr', { a: 0.01, d: 0.3, s: 0.8, r: 0.25 }], vca: ['vca'], out: ['out', { level: 0.5 }] },
          wires: ['midi.voct>arp.voct', 'midi.gate>arp.gate', 'clk.e>arp.clk', 'arp.voct>vco.voct', 'arp.gate>env.gate', 'vco.sqr>flt.in', 'flt.lp>vca.in', 'env.env>vca.cv', 'vca.out>out.l'] },
        play: [['D3', 0, 3], ['F3', 0, 3], ['A3', 0, 3], ['C4', 0, 3]],
        caption: 'Dm7 held, up-down in 8ths: gate length 15%, 50% and 100% on a sustaining envelope.',
        tries: [{ label: '15%' }, { label: '50%', set: { 'arp.len': 0.5 } }, { label: '100%', set: { 'arp.len': 1 } }],
      } },
      { t: 'example', title: 'Make the factory ARP LPG rack yours', steps: [
        'Load ARP LPG: a wavetable voice through a low-pass gate, pinged by the arp\'s gates, the wavetable swept by a slow looping Func.',
        'Hold a four-note chord and change the arp to Up-down over two octaves; set the delay to a dotted 8th (0.375 s at 120 BPM).',
        'Change chords every bar following a progression you know (ii–V–I–VI): you are improvising with harmony, the arp handles the rhythm.',
      ] },
    ],
    drills: [],
  },
];
