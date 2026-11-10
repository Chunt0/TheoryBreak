import type { RackSpec } from '../synth/demo';
import type { Topic } from './types';
import { CLOCK_BLEEP, ONE_CLOCK, SEQ_LINE, TRANSPOSE, S_H_SCALES, MODE_SWAP, KICK, EUCLID, POLYMETER, D_3_AGAINST_4, TURING, GENERATIVE, ARP, ARP_LEN } from './lessons/seq/demos';

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
      { t: 'synth', demo: CLOCK_BLEEP },
      { t: 'p', md: 'A **gate** has a length; a **trigger** is only an instant. An ADSR needs the gate\'s length to know when to release: a short gate on a slow envelope cuts the note before it reaches full volume. Drums and AD envelopes only need the start. Because every clock output is high for half a step, an ADSR on 16ths at 120 BPM is held for 62 ms: give it a short decay and no sustain for a clean, separate note each time.' },
      { t: 'synth', demo: ONE_CLOCK },
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
      { t: 'synth', demo: SEQ_LINE },
      { t: 'p', md: 'Write sequences like a bass player: **root on the downbeat**, octave jumps for bounce, the ♭7 and 5th as passing notes, and rests so the line breathes. Accent and timbre move it further: patch the gate to a filter envelope and every note speaks; patch a slow LFO to the cutoff and the line evolves while the notes stay the same.' },
      { t: 'p', md: '**Transposing a sequence.** V/Oct voltages add: mix the sequencer\'s output with the MIDI module\'s V/Oct (two Mix inputs at full level) and the keyboard transposes the running line. Hold E and it plays in E. Run the sum through a **quantizer** and it stays in a scale even when the keyboard note is outside it. This is the factory **DORIAN SEQ** rack.' },
      { t: 'synth', demo: TRANSPOSE },
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
      { t: 'synth', demo: S_H_SCALES },
      { t: 'table', head: ['Scale', 'Feel over random notes'], rows: [
        ['Major / minor pentatonic', 'no half steps: nothing can clash, always "pretty"'],
        ['Dorian, Mixolydian', 'modal, funky: one bright note each'],
        ['Harmonic minor', 'exotic: the augmented 2nd'],
        ['Whole tone', 'floating, dreamlike: no tonic'],
        ['Chromatic', 'every semitone: atonal, sci-fi'],
      ] },
      { t: 'p', md: '**Quantize a sequence to a mode.** Program the sequencer in plain semitones and let the quantizer decide the mode: the same line in Dorian, Phrygian or Lydian. Changing the quantizer\'s **root** transposes; changing its **scale** reharmonises. With a sequencer driving the root as well, the rack plays its own chord changes.' },
      { t: 'synth', demo: MODE_SWAP },
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
      { t: 'synth', demo: KICK },
      { t: 'p', md: 'A **Euclidean rhythm** spreads a number of hits as evenly as possible across a number of steps (Bjorklund\'s algorithm, as Godfried Toussaint showed in 2005). Many traditional rhythms are exactly that: 3 in 8 is the Cuban **tresillo**, 5 in 8 the **cinquillo**, 7 in 12 a West African bell, 5 in 16 the bossa nova. **Rotate** starts the same pattern on a different step.' },
      { t: 'table', head: ['Hits / steps', 'Pattern', 'Name'], rows: [
        ['3 / 8', 'x . . x . . x .', 'tresillo'],
        ['5 / 8', 'x . x x . x x .', 'cinquillo'],
        ['4 / 16', 'x . . . x . . . x . . . x . . .', 'four on the floor'],
        ['5 / 16', 'x . . x . . x . . x . . x . . .', 'bossa nova'],
        ['7 / 16', 'x . . x . x . x . . x . x . x .', 'samba-like'],
      ] },
      { t: 'synth', demo: EUCLID },
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
      { t: 'synth', demo: POLYMETER },
      { t: 'p', md: 'A **clock divider** turns one clock into several slower ones that stay locked: every 2nd, 3rd, 4th, 6th and 8th pulse, plus double time. Drive one voice from ÷3 and another from ÷4 of the same 16ths and you get 3 against 4 that never drifts. Into drums, ÷3 hats over a ÷4 kick is the "dotted 8th" pulse that crosses the bar.' },
      { t: 'synth', demo: D_3_AGAINST_4 },
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
      { t: 'synth', demo: TURING },
      { t: 'table', head: ['Source', 'What it gives', 'Tame it with'], rows: [
        ['Turing machine', 'a looping, mutating phrase', 'Change near 0, a quantizer'],
        ['Noise S&H', 'a new random voltage per clock', 'a Util for range, a quantizer'],
        ['Rand (smooth)', 'slow drifting curves', 'small amounts on cutoff, pan, pitch'],
        ['Coin (Bernoulli)', 'gates by chance', 'probability: 10–30% for variation'],
        ['Euclid', 'evenly spread hits', 'reset on the bar'],
      ] },
      { t: 'synth', demo: GENERATIVE },
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
      { t: 'synth', demo: ARP },
      { t: 'p', md: '**Gate length** (Len) is articulation: short is staccato and lets a pluck envelope ring through; full is legato and turns a pad patch into a shimmering wash. **Clock sync**: patch the clock to the arp and it locks to the rack\'s tempo (and its drums); without a clock its Rate knob sets the speed. **Octaves** stretch a small chord into a long, harp-like run.' },
      { t: 'table', head: ['Performance move', 'How'], rows: [
        ['Change chords on the beat', 'release and press just before the downbeat; the arp keeps time'],
        ['Open the filter by hand', 'a slow sweep with the mod strip or a knob is the trance build'],
        ['Delay synced to the arp', 'a dotted 8th echo doubles the pattern\'s density'],
        ['Inversions', 'play the same chord in a different inversion: the pattern\'s top note changes'],
        ['Mute and drop', 'stop the clock for a bar, start it on the One'],
      ] },
      { t: 'synth', demo: ARP_LEN },
      { t: 'example', title: 'Make the factory ARP LPG rack yours', steps: [
        'Load ARP LPG: a wavetable voice through a low-pass gate, pinged by the arp\'s gates, the wavetable swept by a slow looping Func.',
        'Hold a four-note chord and change the arp to Up-down over two octaves; set the delay to a dotted 8th (0.375 s at 120 BPM).',
        'Change chords every bar following a progression you know (ii–V–I–VI): you are improvising with harmony, the arp handles the rhythm.',
      ] },
    ],
    drills: [],
  },
];
