// The rack's manual: what each module is for, what every knob and jack does,
// and a small patch to try. Shown by the guide panel (? on a module, or Guide).
// Plain data, keyed by the catalogue in modules.ts; a test checks it covers
// every knob and jack there.

import type { ModuleType } from './modules';

export interface ModuleGuide {
  /** what it is, in a sentence or two */
  what: string;
  /** param id → what turning it does */
  knobs: Record<string, string>;
  /** input id → what to patch in */
  ins: Record<string, string>;
  /** output id → what comes out */
  outs: Record<string, string>;
  /** a patch to try, step by step ('module.jack' names as on the panels) */
  tryIt: string[];
  /** a closing tip */
  tip?: string;
}

export const BASICS: { title: string; body: string }[] = [
  {
    title: 'Signals are voltages',
    body: 'Every cable carries a voltage that changes over time. Fast wiggles (hundreds of times a second) are audio you hear; slow changes are control voltage (CV) that move a knob for you. The same jack takes either — patch an LFO into a filter and it sweeps, patch an oscillator into it and it growls.',
  },
  {
    title: 'The usual ranges',
    body: 'Audio swings ±5 V. Pitch is 1 V per octave: 0 V is middle C, +1 V the C above, 1/12 V a semitone. Gates are 10 V while a key is held and 0 V otherwise. Envelopes rise from 0 to 10 V; LFOs swing ±5 V.',
  },
  {
    title: 'Patching',
    body: 'Outputs sit on dark plates; inputs are bare jacks. Drag from one to the other, or tap one then the other. An output can feed many inputs; an input takes one cable, so patching into a used input replaces its cable. Tap a patched input (or drag its plug away) to unplug it.',
  },
  {
    title: 'The voice chain',
    body: 'Most sounds are the same chain: MIDI gives pitch and a gate → a VCO makes a tone → a filter shapes its brightness → a VCA, opened by an envelope, makes it start and stop → OUT. INIT is that chain at its smallest. Everything else is modulation: something changing something else over time.',
  },
  {
    title: 'Polyphony',
    body: 'Cables carry up to 8 voices at once. The MIDI module’s Voices knob decides how many; every module downstream runs one copy per voice, so a chord keeps each note’s envelope and filter separate. Mono sources (an LFO, the clock) feed every voice the same.',
  },
  {
    title: 'Module colours',
    body: 'The stripe on top of each module says what kind it is: amber sources (oscillators), red drums, purple modulation, lime clocks and sequencers, teal filters, blue amps and mixers, pink effects, grey utilities and in/out.',
  },
  {
    title: 'Lights and knobs',
    body: 'The small light next to an output glows with the signal in it. Drag a knob up or right to turn it up, double-tap to reset it. Tap a module’s name to select it — with a MiniLab, its knobs and faders then turn that module’s knobs.',
  },
];

export const GUIDE: Record<ModuleType, ModuleGuide> = {
  midi: {
    what: 'Turns your playing into voltages: which note (V/Oct), whether a key is down (Gate), how hard (Vel), plus the mod and pitch strips. Nothing makes sound without it unless a clock and sequencer play the rack instead.',
    knobs: {
      voices: 'How many notes at once. 1 is mono, last note wins, and overlapping notes slide without restarting envelopes — the classic lead and bass feel. 2–8 make every cable polyphonic.',
      glide: 'Portamento: pitch slides to each new note over this time instead of jumping.',
      bend: 'How far the pitch strip bends, in semitones.',
    },
    ins: {},
    outs: {
      voct: 'Pitch of the key, 1 V/oct (middle C = 0 V), including glide and bend. Patch into a VCO’s V/Oct, and into a filter’s V/Oct so it brightens as you play higher.',
      gate: '10 V while a key is held. Patch into an envelope’s Gate.',
      vel: 'How hard you hit the key, 0–10 V. Patch into a VCA’s CV or a filter’s CV so harder notes are louder or brighter.',
      trig: 'A short 10 V blip at the start of each note — for retriggering envelopes or clocking a sample & hold.',
      mod: 'The mod strip, 0–10 V. Patch into an LFO’s Rate or a mixer level for hands-on vibrato and wah.',
      at: 'Pressure, 0–10 V, on keyboards that send aftertouch.',
    },
    tryIt: ['Load INIT, then set Voices to 1 and Glide to about 150 ms.', 'Play legato: overlapping notes slide into each other.'],
  },
  vco: {
    what: 'The voltage-controlled oscillator — the tone source. It plays four waveforms at once; pick one by which output you patch. Sine is pure, triangle soft, saw bright and buzzy, square hollow (like a clarinet).',
    knobs: {
      oct: 'Shifts the pitch in octaves.',
      tune: 'Fine pitch in semitones. Two VCOs a few hundredths apart beat against each other and sound thick.',
      fm: 'How much the FM input bends the pitch. Small amounts from an LFO are vibrato; audio-rate amounts make metallic, bell-like tones.',
      pw: 'Width of the square wave: 50% is hollow and square, narrow is thin and nasal.',
      pwm: 'How much the PWM input moves the width.',
    },
    ins: {
      voct: 'Pitch, 1 V/oct — usually MIDI V/Oct, a sequencer or a quantizer.',
      fm: 'Frequency modulation, scaled by the FM knob. An LFO here = vibrato; another VCO here = FM synthesis.',
      pwm: 'Moves the square’s width. A slow LFO here gives the classic shimmering, chorus-like PWM pad.',
      sync: 'Each rising edge restarts this oscillator’s cycle. Feed another VCO and tune this one up: hard-sync screams.',
    },
    outs: {
      sin: 'Sine: one pure partial. Great for sub-bass, FM, and folding.',
      tri: 'Triangle: soft, flute-like, a few odd harmonics.',
      saw: 'Saw: every harmonic — the brightest wave, home of strings and brass.',
      sqr: 'Square / pulse: odd harmonics, hollow. Narrow widths turn nasal.',
    },
    tryIt: ['Load INIT, select the VCO and add an LFO.', 'Patch LFO Tri → VCO FM and turn FM to about 0.05: vibrato.', 'Turn the LFO Rate up past 30 Hz and FM higher: the tone goes clangorous.'],
  },
  lfo: {
    what: 'A low-frequency oscillator: a wave too slow to hear, used to move other knobs over and over — vibrato, wah, tremolo, panning.',
    knobs: { rate: 'Speed in cycles per second (Hz). Below 1 Hz is a slow sweep; 5–7 Hz is vibrato speed.' },
    ins: {
      rate: 'Speeds the LFO up or down, 1 V/oct. Patch MIDI Mod here and the mod strip speeds the vibrato.',
      reset: 'A rising edge restarts the wave from the top — patch MIDI Gate so every note’s vibrato starts the same way.',
    },
    outs: { sin: 'Smooth and round.', tri: 'Even, straight up and down.', saw: 'Ramps up, then drops: a repeating swell.', sqr: 'Flips between two values: trills and on/off tremolo.' },
    tryIt: ['Load INIT and add an LFO and a VCF between VCO and VCA.', 'Patch LFO Sin → VCF CV with Rate around 0.5 Hz: an automatic wah.'],
  },
  adsr: {
    what: 'The envelope: a shape that plays once per note. It rises while the gate is high (Attack), falls to a holding level (Decay to Sustain), and falls away after you let go (Release). Into a VCA it shapes loudness; into a filter, brightness.',
    knobs: {
      a: 'Attack: time to rise to full. Short = percussive pluck; long = bowed swell.',
      d: 'Decay: time to fall from full to the sustain level.',
      s: 'Sustain: the level held while the key stays down. 0 makes a pluck that dies away even if you hold the key.',
      r: 'Release: time to fade to silence after the key is let go.',
    },
    ins: {
      gate: 'Starts the envelope while high — MIDI Gate, a sequencer gate or a clock.',
      retrig: 'Restarts the attack while the gate is still held (for trills on a mono voice).',
    },
    outs: { env: 'The envelope, 0–10 V.' },
    tryIt: ['Load INIT. Set Attack 5 ms, Decay 300 ms, Sustain 0: a pluck.', 'Now Attack 600 ms, Sustain 80%, Release 1.5 s: a pad.'],
    tip: 'Use two envelopes — one on the VCA, a snappier one on the filter — for sounds that start bright and mellow out.',
  },
  vcf: {
    what: 'A state-variable filter: removes part of the sound’s harmonics. Low-pass (LP) keeps the lows and darkens, high-pass (HP) thins, band-pass (BP) keeps a narrow band like a wah. All three come out at once.',
    knobs: {
      cutoff: 'Where the filter starts cutting. Low = dark and muffled, high = open and bright.',
      res: 'Resonance: boosts the frequencies right at the cutoff. High settings whistle and squelch.',
      cv: 'How much the CV input moves the cutoff, in octaves per volt; negative values move it the other way.',
    },
    ins: {
      in: 'Audio to filter.',
      cv: 'Moves the cutoff — patch an envelope for each-note brightness, or an LFO for a sweep.',
      voct: 'Moves the cutoff 1 V/oct, so patching MIDI V/Oct here keeps high notes as bright as low ones (key tracking).',
      res: 'Moves the resonance.',
    },
    outs: { lp: 'Low-pass: the warm, classic synth tone.', bp: 'Band-pass: nasal, vocal, wah-like.', hp: 'High-pass: thin and airy — good for hats from noise.' },
    tryIt: ['Load POLY PAD and select the VCF.', 'Turn Cutoff down and Res up while holding a chord.', 'Move the VCA’s input cable from LP to BP, then HP, and listen to each.'],
  },
  ladder: {
    what: 'A transistor-ladder low-pass (24 dB): steeper, fatter and more saturated than the VCF. It is the sound of most acid basslines and fat leads, and it self-oscillates into a pure tone near full resonance.',
    knobs: {
      cutoff: 'Where the filter starts cutting.',
      res: 'Resonance. Near full it rings at the cutoff; it also thins the low end, as on the real circuit.',
      cv: 'How much the CV input moves the cutoff, octaves per volt.',
      drive: 'Input gain: pushes the circuit into warm saturation.',
    },
    ins: { in: 'Audio to filter.', cv: 'Moves the cutoff — an envelope here is the acid squelch.', voct: 'Key tracking, 1 V/oct.' },
    outs: { out: 'Low-pass output.' },
    tryIt: ['Load MONO LEAD.', 'Turn the ladder’s Res to about 80% and play staccato in the bass: squelch.', 'Raise the filter envelope’s Decay to lengthen each “wow”.'],
  },
  vca: {
    what: 'The voltage-controlled amplifier: a volume knob that a voltage turns. With an envelope on CV, it is what makes a note start and stop. With nothing in CV it just passes the signal at Level.',
    knobs: { level: 'Overall gain.', resp: 'Lin follows the CV evenly; Exp is snappier — quiet tails fall away fast, good for plucks and drums.' },
    ins: { in: 'The signal to control (audio or CV — a VCA on an LFO fades vibrato in and out).', cv: 'The gain, 0–10 V → 0–100%.' },
    outs: { out: 'The signal, scaled.' },
    tryIt: ['In INIT, unplug ADSR Env → VCA CV: the oscillator drones.', 'Plug it back in: notes start and stop again.'],
  },
  mix: {
    what: 'Adds up to four signals, each with its own level. Use it to layer oscillators, or to combine control voltages (an envelope plus an LFO into one filter CV).',
    knobs: { l1: 'Level of input 1.', l2: 'Level of input 2.', l3: 'Level of input 3.', l4: 'Level of input 4.' },
    ins: { in1: 'Signal 1.', in2: 'Signal 2.', in3: 'Signal 3.', in4: 'Signal 4.' },
    outs: { out: 'The sum.' },
    tryIt: ['Patch two VCOs (one an octave down) into a MIX and the MIX into the filter: a fat layered tone.'],
    tip: 'Mixing pitch voltages adds them: a sequencer plus MIDI V/Oct transposes the sequence by the key you hold.',
  },
  noise: {
    what: 'White and pink noise, plus a sample & hold. Noise makes hats, snares, wind and breath. The S&H grabs a voltage each time it is clocked and holds it until the next — with nothing in In, a random one each time: the classic random bleeps.',
    knobs: { level: 'Noise level.' },
    ins: { clk: 'Each rising edge takes a new sample.', in: 'What to sample. Leave empty for random values.' },
    outs: { white: 'White noise: hiss, all frequencies equally.', pink: 'Pink noise: softer, more like rain or surf.', sh: 'The held sample: a stepped random voltage.' },
    tryIt: ['Load S&H BLEEPS — clock → S&H → quantizer → VCO.', 'Change the quantizer’s scale and root while it plays.'],
  },
  clock: {
    what: 'A metronome made of gates. It drives sequencers, sample & holds and envelopes in time. The four outputs are the same tempo at different speeds.',
    knobs: { bpm: 'Tempo in beats per minute.', run: 'Start and stop. Esc (or a long pitch-strip push down) stops every clock too.' },
    ins: {},
    outs: { q: 'Quarter notes.', e: 'Eighth notes.', s: 'Sixteenth notes.', bar: 'Once per bar of 4/4.' },
    tryIt: ['Load DORIAN SEQ and change the clock’s tempo.', 'Move the sequencer’s Clock cable from ♪ to 16th: double time.'],
  },
  seq: {
    what: 'An 8-step sequencer: each clock pulse moves to the next step, which sends its pitch and (if its light is on) a gate. Pitch is in semitones from the root.',
    knobs: {
      s0: 'Step pitches, in semitones (−12 to +12).',
      g0: 'Step gates: lit = the step plays, dark = a rest.',
      len: 'How many steps before it loops — 5 or 7 against a 4/4 clock makes shifting, polymetric lines.',
    },
    ins: { clk: 'Advances one step per rising edge — patch a clock.', reset: 'Jumps back to step 1 — patch the clock’s Bar output to keep it locked to the bar.' },
    outs: { voct: 'The current step’s pitch, 1 V/oct.', gate: 'A gate on each step whose light is on.' },
    tryIt: ['Load DORIAN SEQ. Change the step knobs: the quantizer keeps every note in D Dorian.', 'Turn off a few step lights for rests, and set Length to 7.'],
  },
  quant: {
    what: 'Snaps any voltage to the nearest note of a scale, so random or sweeping voltages play in key. Trig fires whenever the note changes.',
    knobs: { root: 'The scale’s root note.', scale: 'The scale: majors, minors, modes, pentatonics, blues, whole-tone, diminished, altered…' },
    ins: { in: 'Any pitch voltage: a sequencer, the sample & hold, an LFO.' },
    outs: { out: 'The voltage, snapped to the scale (1 V/oct).', trig: 'A short pulse each time the note changes — patch into an envelope so every new note plays.' },
    tryIt: ['Load S&H BLEEPS. Try Lydian on F, then Altered on G: the same randomness, different harmony.'],
    tip: 'Patch an LFO’s triangle into the quantizer and its Trig into the envelope: scales run up and down by themselves.',
  },
  delay: {
    what: 'Echoes: the input comes back after Time, again and again as Feedback feeds the echo back in. Tone darkens each repeat, like tape.',
    knobs: {
      time: 'Gap between echoes. Turning it while echoes ring bends their pitch, like tape.',
      fb: 'How much of each echo returns. High settings repeat for a long time.',
      mix: 'Balance between the dry sound and the echoes.',
      tone: 'Darkens the echoes so they sit behind the dry sound.',
    },
    ins: { in: 'Audio (all voices are summed in).', time: 'Moves the delay time — a slow LFO here gives a chorused, warbling echo.' },
    outs: { out: 'Dry plus echoes.' },
    tryIt: ['Load POLY PAD. Raise Feedback to 70% and play short chords.', 'Turn Time slowly while the echoes ring: tape-style pitch bends.'],
  },
  fold: {
    what: 'A wavefolder, the west-coast way to brighten a sound. Push a wave past the edge and it folds back on itself, adding overtones. Driven softly it barely changes; driven hard it gets glassy and metallic.',
    knobs: { fold: 'How hard the input is driven into the folds.', bias: 'Shifts the wave before folding: makes the folds lopsided and adds even harmonics.', cv: 'How much the CV input adds to Fold.' },
    ins: { in: 'Audio — a sine or triangle shows off the folding best.', cv: 'Adds to Fold: an envelope here makes notes start bright and soften, like a plucked string.' },
    outs: { out: 'The folded wave.' },
    tryIt: ['Load WEST COAST and select FOLD.', 'Turn Fold up slowly while holding a note, then sweep Bias.'],
  },
  util: {
    what: 'Two lanes of Out = In × Gain + Offset. Turns a signal down, flips it upside down (negative Gain), or shifts it. With nothing patched in, it is a steady voltage set by hand — a manual knob for any input.',
    knobs: {
      a1: 'Lane 1 gain: 1 = unchanged, 0 = off, negative = inverted.',
      o1: 'Lane 1 offset, added after the gain.',
      a2: 'Lane 2 gain.',
      o2: 'Lane 2 offset.',
    },
    ins: { in1: 'Lane 1 input.', in2: 'Lane 2 input.' },
    outs: { out1: 'Lane 1 result.', out2: 'Lane 2 result.' },
    tryIt: ['Add ATT/OFS with nothing in it and patch Out 1 → VCO V/Oct: Offset 1 now tunes the oscillator by hand (1 V = an octave).'],
    tip: 'Inverting an envelope (Gain −1) into a filter CV makes notes close the filter instead of opening it.',
  },
  // ------------------------------------------------------------ second shelf: sources
  wt: {
    what: 'A wavetable oscillator: eight single-cycle waves in a row — sine, triangle, saw, square, pulse, organ, vocal, glass — and Table slides smoothly between neighbours. Modulate Table and the timbre moves while the pitch stays put.',
    knobs: {
      oct: 'Shifts the pitch in octaves.',
      tune: 'Fine pitch in semitones.',
      table: 'Which wave, or how far between two: 2.5 is half saw, half square.',
      cv: 'How much the Table input moves the position; negative turns it the other way.',
      fm: 'How much the FM input bends the pitch (vibrato, or metallic at audio rate).',
    },
    ins: { voct: 'Pitch, 1 V/oct.', table: 'Moves through the tables — an LFO, an envelope, or FUNC looping for a slow evolving sweep.', fm: 'Pitch modulation, scaled by FM.' },
    outs: { out: 'The wave, ±5 V.' },
    tryIt: ['Load ARP LPG: a FUNC loops slowly and sweeps the WT’s Table while the arpeggio plays.', 'Select the WT and turn Table by hand to hear each wave.'],
    tip: 'Organ, vocal and glass are hard to get from a VCO and filter — they’re the reason to reach for a wavetable.',
  },
  fmop: {
    what: 'Two sine oscillators in one: the modulator wobbles the carrier’s phase, as in the DX7. At Index 0 you hear a pure sine; turn Index up and overtones bloom. Ratio decides which overtones — whole numbers sound harmonic, 3.5 sounds like a bell.',
    knobs: {
      oct: 'Shifts the pitch in octaves.',
      tune: 'Fine pitch in semitones.',
      ratio: 'The modulator’s frequency as a multiple of the carrier’s. ×1 is brass-like, ×2 hollow, ×3.5 and ×7 bell and metal.',
      index: 'Modulation depth: brightness. Changing it over a note is what makes FM sounds speak.',
      fb: 'Feeds the modulator back into itself, turning its sine toward a saw for grittier tones.',
      cv: 'How much the Index input adds to Index.',
    },
    ins: { voct: 'Pitch, 1 V/oct.', index: 'Adds to Index — patch an envelope for a bright attack that mellows, the classic FM piano and bell.', fm: 'Extra phase modulation from any audio source.' },
    outs: { out: 'The carrier: the FM sound.', mod: 'The modulator on its own — another sine, at Ratio × the pitch.' },
    tryIt: ['Load FM BELLS: an envelope on Index makes each note strike bright and fade to a pure tone.', 'Change Ratio while playing: ×1, ×2, ×3.5, ×7.'],
  },
  string: {
    what: 'A plucked string, physically modelled: each Pluck fills a tuned delay with a burst of noise that circulates, loses its brightness a little on every trip, and settles into a pitched tone — the Karplus–Strong algorithm. Sounds like harp, guitar, koto or clavinet.',
    knobs: {
      oct: 'Shifts the pitch in octaves.',
      decay: 'How long the string rings.',
      tone: 'How bright the ringing stays. Low = dull nylon, high = bright steel.',
      bright: 'How bright the pluck itself is: soft finger to sharp pick.',
    },
    ins: { voct: 'Pitch, 1 V/oct.', trig: 'Each rising edge plucks the string — MIDI Trig, a clock or a sequencer gate.', in: 'Excite the string with any audio instead of (or as well as) a pluck: bowed or blown strings, or a resonator for drums.' },
    outs: { out: 'The string.' },
    tryIt: ['Load HARP and play chords.', 'Turn Tone down and Decay short: a muted guitar.'],
  },
  kick: {
    what: 'A bass drum in the 808/909 tradition: a sine whose pitch drops quickly after each hit, then fades out.',
    knobs: {
      tune: 'The drum’s pitch once the drop has settled.',
      decay: 'How long it booms. Short for punchy techno, long for 808 bass.',
      punch: 'How far and fast the pitch drops — the click and thump of the attack.',
      drive: 'Saturation: rounder at 1, more aggressive above 3.',
    },
    ins: { trig: 'Each rising edge is a hit.', accent: 'Hit level, 0–10 V (patch MIDI Vel for touch sensitivity). Empty = full level.' },
    outs: { out: 'The drum.' },
    tryIt: ['Load DRUM MACHINE.', 'Turn the KICK’s Decay up to a second and Tune down: an 808 boom.'],
  },
  snare: {
    what: 'A snare: two tuned body tones for the drum heads plus a burst of filtered noise for the wires underneath.',
    knobs: {
      tune: 'Pitch of the drum heads.',
      decay: 'Length of the hit.',
      snappy: 'Balance of noise (the wires) against the body.',
      tone: 'Brightness of the noise.',
    },
    ins: { trig: 'Each rising edge is a hit.', accent: 'Hit level, 0–10 V. Empty = full level.' },
    outs: { out: 'The drum.' },
    tryIt: ['In DRUM MACHINE, turn Snappy down for a tom-like drum, up for a clap-like crack.'],
  },
  hats: {
    what: 'Hi-hats made the way the TR-808 made them: six square waves at clashing frequencies plus noise, high-passed into a metallic hiss. A closed hit chokes a ringing open one, like a real hi-hat pedal.',
    knobs: { decay: 'Length of a closed hat.', open: 'Length of an open hat.', tone: 'Pitch and brightness of the metal.' },
    ins: { trig: 'Closed hat.', open: 'Open hat.', accent: 'Hit level, 0–10 V. Empty = full level.' },
    outs: { out: 'The hats.' },
    tryIt: ['DRUM MACHINE sends 16ths through a COIN: most go to the closed input, a few to the open one.'],
  },
  // ------------------------------------------------------------ modulation
  func: {
    what: 'A function generator, after Make Noise’s Maths. On a trigger it rises to 10 V and falls back: an envelope. With Loop on it repeats: an LFO whose up and down slopes you set separately. Patch a signal into In instead and it follows it no faster than Rise and Fall allow: slew, portamento, smoothing.',
    knobs: {
      rise: 'Time to rise (or fastest climb when following In).',
      fall: 'Time to fall (or fastest drop when following In).',
      shape: 'Curve of the slopes: Log bulges up, Exp sags down, Lin is straight.',
      loop: 'Cycle forever: a rise-fall LFO. A short rise and long fall is a ramp; equal times a triangle.',
    },
    ins: { trig: 'Starts a rise-and-fall.', in: 'A voltage to follow, smoothed by Rise and Fall.' },
    outs: { out: 'The shape, 0–10 V (or the smoothed input).', end: 'A trigger when each fall finishes — patch it back into Trig, or chain several FUNCs.' },
    tryIt: ['Patch a sequencer’s V/Oct through FUNC In before the VCO: notes glide into each other.', 'Turn Loop on with Rise 2 s, Fall 4 s and patch Out into a filter CV: a slow breathing sweep.'],
  },
  rand: {
    what: 'Random voltages. Each tick — at Rate, or on every clock if one is patched — it picks a new value. Step jumps straight there; Smooth glides. On a poly cable each voice gets its own value, which makes chords drift apart in a lifelike way.',
    knobs: { rate: 'Ticks per second when no clock is patched.', amt: 'How far the values range, up to ±5 V.' },
    ins: { clk: 'Each rising edge is a tick (Rate is ignored).' },
    outs: { step: 'Stepped random: sample & hold.', smooth: 'The same values, joined by smooth curves.', trig: 'A short trigger on every tick.' },
    tryIt: ['Patch Smooth at Rate 0.3 Hz into a VCO’s FM with FM at 0.02: analogue-style pitch drift.', 'Patch Step through a QUANT into a VCO for random melodies.'],
  },
  // ------------------------------------------------------------ sequencing
  turing: {
    what: 'The Turing Machine: a loop of 16 bits that shifts one place on every clock. The bits make a voltage — a melody — and a gate. At Change 0 the loop repeats exactly; nudge Change up and bits flip now and then, so the tune slowly evolves. Find a phrase you like, turn Change to 0, and it’s locked.',
    knobs: {
      change: 'Chance a bit flips as it comes round. 0 = locked loop, a little = slow evolution, 50% = fully random.',
      length: 'Loop length in steps (2–16).',
      range: 'Voltage range of the melody: 1 V = one octave.',
    },
    ins: { clk: 'Moves the loop on one step.' },
    outs: { cv: 'The melody voltage — through a QUANT to stay in key.', gate: 'A gate on steps whose newest bit is 1: a rhythm that loops with the melody.' },
    tryIt: ['Load TURING BASS. Turn Change up until the line changes, then back to 0 to keep it.', 'Change Length to 5 or 7 against the 4/4 drums.'],
  },
  euclid: {
    what: 'Euclidean rhythm generator: spreads Hits as evenly as possible across Steps. Many of the world’s rhythms fall out of it — 3 in 8 is the Cuban tresillo, 5 in 8 the cinquillo, 7 in 12 a West African bell pattern, 5 in 16 a bossa nova.',
    knobs: { steps: 'Length of the pattern.', fills: 'How many hits to spread over it.', rotate: 'Turns the pattern so it starts on a different step.' },
    ins: { clk: 'Moves one step per pulse — usually a clock’s 16th output.', reset: 'Back to step 1 — patch the clock’s Bar output.' },
    outs: { gate: 'A gate on every hit.', off: 'A gate on every rest — the pattern’s mirror image.' },
    tryIt: ['DRUM MACHINE uses two: the kick on 3 in 16, the snare on 2 in 16 rotated by 4 (the backbeat).', 'Try the kick on 5 in 16, then rotate it.'],
  },
  div: {
    what: 'A clock divider and multiplier: from one clock it makes double time and every 2nd, 3rd, 4th, 6th and 8th pulse. Drive different parts from different outputs and they lock together in polyrhythm — 3 against 4, 3 against 2.',
    knobs: {},
    ins: { clk: 'The clock to divide.', reset: 'Restarts the count so every output lines up again.' },
    outs: {
      x2: 'Twice as fast (measured from the last two pulses).',
      d2: 'Every 2nd pulse.',
      d3: 'Every 3rd pulse: against ÷2 or ÷4, a 3-against-2 polyrhythm.',
      d4: 'Every 4th pulse.',
      d6: 'Every 6th pulse.',
      d8: 'Every 8th pulse.',
    },
    tryIt: ['Clock a SEQ from ÷3 and an EUCLID from ÷2 off the same clock: they meet every 6 pulses.'],
  },
  coin: {
    what: 'A Bernoulli gate: tosses a coin for every incoming gate and sends it out of A or B. Use it to vary a rhythm (most hats closed, some open), or to split one rhythm between two sounds.',
    knobs: { prob: 'Chance a gate goes to B. 0 = always A, 100% = always B.' },
    ins: { in: 'The gates to route.', prob: 'Adds to the chance: 10 V adds 100%.' },
    outs: { a: 'The gates that landed on A.', b: 'The gates that landed on B.' },
    tryIt: ['In DRUM MACHINE, turn the COIN’s chance up for more open hats.'],
  },
  switch: {
    what: 'A sequential switch: each clock moves the output to the next input, round and round. Switch between two sequences every bar, or between sounds note by note.',
    knobs: { steps: 'How many inputs it cycles through (2–4).' },
    ins: { clk: 'Moves to the next input.', reset: 'Back to input 1.', in1: 'Input 1.', in2: 'Input 2.', in3: 'Input 3.', in4: 'Input 4.' },
    outs: { out: 'Whichever input is selected.' },
    tryIt: ['Patch two ATT/OFS offsets (0 V and +5/12 V) into 1 and 2, the clock’s Bar output into Clock and Out into a sequencer’s pitch path through a MIX: the line moves up a 4th every other bar.'],
  },
  arp: {
    what: 'An arpeggiator: plays the notes you hold one after another, up, down, up and down, or at random, across one to four octaves. It needs several notes at once, so set the MIDI module to 2 or more voices.',
    knobs: {
      mode: 'Order: Up, Down, Up-down (without repeating the end notes) or random.',
      oct: 'How many octaves it climbs.',
      rate: 'Notes per second when no clock is patched.',
      len: 'Note length as a share of each step: short for staccato, full for legato.',
    },
    ins: { voct: 'MIDI V/Oct (poly).', gate: 'MIDI Gate (poly): which notes are held.', clk: 'Plays one note per pulse (Rate is ignored) — sync it to the drums.' },
    outs: { voct: 'The arpeggio’s pitch, 1 V/oct.', gate: 'A gate per arpeggio note.' },
    tryIt: ['Load ARP LPG and hold a chord. Try Up-down over 2 octaves.'],
  },
  // ------------------------------------------------------------ filters and shapers
  lpg: {
    what: 'A low-pass gate, Don Buchla’s instrument: a filter and a VCA opened together by a light shining on a photocell (a vactrol). Louder is brighter, as with real instruments, and a Ping strikes it open and lets it decay like a plucked or struck object.',
    knobs: {
      decay: 'How slowly it closes after a Ping.',
      mode: 'Both = filter and level (the classic); LP = filter only; VCA = level only.',
      level: 'How open it sits with nothing in CV.',
    },
    ins: { in: 'Audio.', cv: 'Opens it, 0–10 V — an envelope or LFO.', ping: 'Strikes it fully open, then it decays — a gate, trigger or clock. No envelope needed.' },
    outs: { out: 'The gated sound.' },
    tryIt: ['Load ARP LPG: every arpeggio gate pings the LPG, giving each note a natural, woody decay.'],
  },
  comb: {
    what: 'A comb filter: a very short delay fed back into itself. Its echoes are so close they become a pitch — metallic resonance, flanging, or with V/Oct patched a tuned resonator that rings at the note you play. Negative feedback sounds an octave lower and hollower.',
    knobs: { freq: 'The resonant pitch (1 ÷ the delay time).', fb: 'How strongly it rings; near ±1 it sustains. Negative = hollow, odd harmonics.', mix: 'Dry against filtered.' },
    ins: { in: 'Audio — noise or drums make it sing.', voct: 'Tunes the resonance, 1 V/oct: play it like an instrument.' },
    outs: { out: 'The filtered sound.' },
    tryIt: ['Patch NOISE White → COMB In and MIDI V/Oct → COMB V/Oct, Freq to 260 Hz, Feedback 0.95: a pitched, bowed noise.'],
  },
  vowel: {
    what: 'A formant filter: three resonant peaks placed where a singer’s mouth puts them for A, E, I, O and U. A saw through it sounds like a voice; sweeping the vowel is the talk box sound of Roger Troutman and Zapp.',
    knobs: {
      vowel: 'The vowel: A E I O U, gliding between them.',
      shift: 'Moves all formants up or down: a smaller or larger mouth.',
      res: 'How sharp and vocal the peaks are.',
      cv: 'How much the Vowel input moves the vowel.',
    },
    ins: { in: 'Audio — a bright saw or square works best.', cv: 'Moves through the vowels — an LFO, an envelope, or the mod strip (MIDI Mod).' },
    outs: { out: 'The vowel sound.' },
    tryIt: ['Load TALKBOX FUNK and play with the mod strip: it morphs the vowel.'],
  },
  ring: {
    what: 'A ring modulator: multiplies two signals. What comes out is the sum and difference of their frequencies — not the originals — so musical intervals turn clangorous and bell-like. With nothing in Carrier it uses its own sine at Freq.',
    knobs: { freq: 'The internal carrier’s frequency, used when Carrier is empty.', mix: 'Dry against ring-modulated.' },
    ins: { a: 'The sound to modulate.', b: 'The carrier: another oscillator (or an LFO, for tremolo that flips phase).' },
    outs: { out: 'The product.' },
    tryIt: ['Insert a RING between a VCO and the filter. Set Freq to 30 Hz for a robot voice, then 1.1 kHz for bells.'],
  },
  drive: {
    what: 'Overdrive: pushes the signal into saturation, adding harmonics. Soft is tape and tube warmth, Hard is clipping fuzz, Tube is lopsided (even harmonics, like a valve amp). Tone tames the fizz.',
    knobs: { drive: 'How hard it is pushed.', shape: 'Soft, Hard or Tube saturation.', tone: 'A low-pass after the drive, to smooth the top end.', mix: 'Dry against driven — parallel distortion keeps the attack.' },
    ins: { in: 'Audio.', cv: 'More drive, exponentially: an envelope here makes notes bite harder at the start.' },
    outs: { out: 'The driven sound.' },
    tryIt: ['Put DRIVE after the ladder filter in MONO LEAD, Drive ×8, Tone 3k.'],
  },
  crush: {
    what: 'A bitcrusher: fewer bits put stairs in the wave (grit and noise), a lower sample rate folds high frequencies back down as inharmonic, ringing tones. The sound of early samplers and game consoles.',
    knobs: { bits: 'Bit depth: 16 is clean, 4 is crunchy, 1 is a square wave.', rate: 'Sample rate: under 4 kHz rings and aliases.', mix: 'Dry against crushed.' },
    ins: { in: 'Audio.' },
    outs: { out: 'The crushed sound.' },
    tryIt: ['Put CRUSH on the drums in DRUM MACHINE: 6 bits at 12 kHz.'],
  },
  // ------------------------------------------------------------ effects
  verb: {
    what: 'A reverb: a network of eight echoes and four diffusers per side (the Freeverb design) — the sound of a room around the sound. Mono in, stereo out.',
    knobs: { size: 'Room size: how long the tail lasts.', damp: 'How quickly the tail loses its high end: soft rooms damp more.', mix: 'Dry against reverberant.' },
    ins: { in: 'Audio (all voices are summed in).' },
    outs: { l: 'Left.', r: 'Right.' },
    tryIt: ['Load HARP, select the VERB and turn Size to 90%.'],
    tip: 'The app has a gentle reverb on everything already (⚙). VERB is for when the rack wants its own big space.',
  },
  chorus: {
    what: 'Chorus: copies of the sound, slightly delayed and gently wobbling in pitch, one left and one right — the shimmer of a Juno or a Rhodes through a chorus pedal. With Feedback it becomes a flanger’s jet-plane sweep.',
    knobs: { rate: 'Wobble speed.', depth: 'Wobble amount.', fb: 'Feedback: above zero it flanges.', mix: 'Dry against chorused.' },
    ins: { in: 'Audio (all voices are summed in).' },
    outs: { l: 'Left.', r: 'Right.' },
    tryIt: ['Load DIATONIC 7THS: the chords go through a CHORUS into a VERB. Turn Feedback up to hear it flange.'],
  },
  phaser: {
    what: 'A phaser: six all-pass stages shift the sound’s phase so that, mixed with the dry signal, notches appear — and an LFO sweeps them up and down. The swirling 70s sound on Rhodes, clavinet and funk guitar.',
    knobs: { rate: 'Sweep speed.', depth: 'How far the notches travel.', fb: 'Feedback: deeper, more resonant notches.', mix: 'Dry against phased; 50% gives the deepest notches.' },
    ins: { in: 'Audio (all voices are summed in).' },
    outs: { out: 'The phased sound.' },
    tryIt: ['Put a PHASER on the DX7-style FM BELLS rack, Rate 0.3 Hz, Feedback 70%.'],
  },
  // ------------------------------------------------------------ utilities
  chord: {
    what: 'A chord generator: one note in, every tone of a chord out on a poly cable, so one VCO and one filter play the whole chord. Pick a quality — triads, 7ths, 9ths, 13ths, altered — or Key 3 / Key 7 for the diatonic triad or 7th chord of the key on whatever note you play: C in C gives Cmaj7, D gives Dm7, G gives G7. The panel names the chord.',
    knobs: {
      key: 'The key for Key 3 and Key 7. Ignored by the other qualities.',
      type: 'Chord quality. Key 3 and Key 7 harmonise in the key: play the scale and hear its chords.',
      inv: 'Inversion: how many times the bottom note moves up an octave.',
      voicing: 'Close (as stacked), Drop 2 (second-highest note down an octave — the jazz guitar and big-band sound) or Spread (every other note up).',
    },
    ins: { voct: 'The root, 1 V/oct (voice 1 of a poly cable).', type: 'Steps through the qualities: every ½ V is one more.', inv: 'Adds inversions: every volt is one more.' },
    outs: { voct: 'The chord: one voice per tone, 1 V/oct. Patch into a VCO.', bass: 'The root an octave down: patch into a second VCO for a bass line.' },
    tryIt: ['Load DIATONIC 7THS and play a C major scale: every note harmonises as its chord in C.', 'Change Key to F and play again; then try Drop 2.'],
    tip: 'Leave the MIDI module at 1 voice for this: CHORD makes the voices.',
  },
  logic: {
    what: 'Gate logic: compares two gates. AND is high only when both are, OR when either is, XOR when exactly one is, NOT A whenever A is low. Combine two simple rhythms into a new one.',
    knobs: {},
    ins: { a: 'Gate A (anything over 1 V counts as high).', b: 'Gate B.' },
    outs: { and: 'Both high.', or: 'Either high.', xor: 'One but not both.', nota: 'A, inverted.' },
    tryIt: ['Patch two EUCLIDs (3 in 8 and 5 in 8) into A and B, and XOR into the hats: a rhythm neither pattern has alone.'],
  },
  xfade: {
    what: 'A crossfader: blends from A to B. Slowly modulated, it morphs between two sounds; driven by an envelope, a note can start as one sound and end as another.',
    knobs: { fade: 'Position: 0 = all A, 100% = all B.' },
    ins: { a: 'Signal A.', b: 'Signal B.', cv: 'Adds to Fade: 10 V moves it all the way.' },
    outs: { out: 'The blend.' },
    tryIt: ['Patch a VCO’s saw into A and its square into B, an LFO into CV: the tone breathes between them.'],
  },
  pan: {
    what: 'A stereo panner: places a sound between left and right, with equal-power curves so it keeps its loudness in the middle. Spread fans the voices of a chord across the field.',
    knobs: { pan: 'Position, left to right.', spread: 'How far apart the voices of a poly cable are spread.' },
    ins: { in: 'Audio (mono or poly).', cv: 'Moves the position: ±5 V sweeps fully left and right.' },
    outs: { l: 'Left.', r: 'Right.' },
    tryIt: ['Load POLY PAD, put a PAN between the VCA and the delay, and patch its L and R to OUT L and R. Hold a chord: the notes spread out.'],
  },
  scope: {
    what: 'An oscilloscope: draws the voltage on its inputs over time, so you can see what you hear — wave shapes, envelopes rising and falling, LFOs, gates. It holds a repeating wave still by starting each picture where it crosses zero going up.',
    knobs: { time: 'How much time fits across the screen: a few ms for audio waves, a second or two for envelopes and LFOs.', scale: 'Vertical zoom.' },
    ins: { a: 'Trace A (yellow). Voice 1 of a poly cable.', b: 'Trace B (blue).' },
    outs: {},
    tryIt: ['Add a SCOPE to INIT and patch VCO Saw into A: a saw. Move the cable to Sqr, Tri, Sin.', 'Patch ADSR Env into B with Time at 1 s and play: the envelope draws itself.'],
    tip: 'Patch a filter’s input into A and its output into B to see what the filter takes away.',
  },
  spectrum: {
    what: 'A spectrum analyser: splits a sound into its partials and draws how loud each one is, bass on the left and treble on the right. The scale is logarithmic, so every octave is the same width, and the grid lines are the Cs. With Harm on it finds the fundamental, names it, and numbers where its harmonics fall: 2 is the octave, 3 the twelfth, 4 two octaves, 5 a major seventeenth, 6 another fifth, 7 a seventh about a third of a semitone flat, 8 three octaves.',
    knobs: {
      floor: 'The quietest level drawn. Lower it to see the faint upper partials and the noise floor; raise it to keep only the strong ones.',
      smooth: 'How slowly the curve falls back after a peak: up for a steady picture of a held note, down to catch attacks.',
      peaks: 'Leaves a thin line at the loudest each partial has been lately.',
      harm: 'Names the note heard on A and marks its harmonic series.',
    },
    ins: { a: 'Trace A (yellow, filled). Every voice of a poly cable is added together, so a chord shows all its partials.', b: 'Trace B (blue line), drawn over A to compare two points in a patch.' },
    outs: {},
    tryIt: [
      'Load HARMONICS and hold a low note: a saw has every harmonic, each quieter than the last (1/n). Trace B, after the filter, loses them from the top down as the LFO closes it.',
      'Move the A cable to the VCO’s Sqr: only the odd harmonics are left (1, 3, 5, 7…), the hollow, clarinet-like sound. Tri is odd harmonics too, falling much faster; Sin is a single line.',
    ],
    tip: 'Hold a fifth on a poly patch with SPECTRUM on the output: the third harmonic of the lower note and the second of the upper land on almost the same frequency. That shared partial is why a fifth sounds smooth, and a minor second, whose partials sit close but not together, rough.',
  },
  sono: {
    what: 'A spectrogram: the spectrum turned on its side and scrolled, newest on the right, pitch going up on a log scale and loudness as colour, dark to bright. The analyser shows one moment; this shows a phrase. A melody is a staircase of bright lines, a chord a stack of them, a filter sweep an edge moving through the harmonics, a reverb a fading smear.',
    knobs: { time: 'How much time fits across the screen.', floor: 'The quietest level that still shows any colour. Lower it to see reverb tails and noise.' },
    ins: { in: 'The signal (every voice of a poly cable added together).' },
    outs: {},
    tryIt: [
      'Load HARMONICS: the harmonics are evenly spaced in hertz, so on a log scale they crowd together going up, and the filter sweep breathes over them.',
      'Load S&H BLEEPS and patch the delay’s Out into a SONO: each note leaves a trail of quieter echoes behind it.',
    ],
    tip: 'Set Time to 2 s and play a major scale: the steps are visibly uneven, whole, whole, half, whole, whole, whole, half.',
  },
  xy: {
    what: 'An XY scope: X moves the beam left and right, Y up and down, so two signals draw one shape. Two tones in a simple frequency ratio trace a Lissajous figure (1:1 an ellipse, 2:1 a figure of eight, 3:2 a pretzel) that stands still only when the ratio is exact. The readout names the interval from X to Y and how many cents it sits from the pure ratio.',
    knobs: { time: 'How much of the signal each picture draws: longer is busier but steadier.', zoom: 'Size.' },
    ins: { x: 'Horizontal.', y: 'Vertical.' },
    outs: {},
    tryIt: [
      'Load LISSAJOUS, where X is an FM OP’s carrier and Y its modulator at ×1.5: a pure 3:2 fifth, so the figure stands still.',
      'Move the Y cable to the VCO’s Sin, tuned 7 equal-tempered semitones up: about 2 cents flat of 3:2, so the figure slowly rolls over. Turn the VCO’s Tune to +4.0: the tempered major third is 14 cents sharp of 5:4 and it spins.',
      'Set the FM OP’s Ratio to ×2, ×3 and ×5: an octave, a twelfth and a major seventeenth, the second, third and fifth harmonics.',
    ],
    tip: 'The speed the figure rolls is the beat rate between the two tones’ shared partials (for a fifth, X’s third harmonic against Y’s second): the further from pure, the faster it rolls and the faster it beats.',
  },
  tuner: {
    what: 'A tuner: listens to In and names the note it hears, with a needle for how many cents sharp or flat it is (100 cents to a semitone). Patch a V/Oct cable instead and it reads the voltage as a note, to check what a sequencer or quantizer is sending. It also works as a pitch tracker: the note it hears comes back out as V/Oct, with a gate while it is sure.',
    knobs: { ref: 'The A it tunes to: 440 Hz is modern concert pitch, 415 Baroque pitch (about a semitone lower), 442–443 what many orchestras use.' },
    ins: { in: 'Audio to listen to. One clear note at a time works best; a chord reads as its strongest common pitch, or nothing.', voct: 'A pitch voltage to read as a note (0 V = C4). It wins over In when both are patched.' },
    outs: { voct: 'The pitch heard on In as 1 V/oct. It holds the last note when the sound stops.', gate: '10 V while a clear pitch is heard.' },
    tryIt: [
      'Load HARP and patch the string’s Out into TUNER In: play, and read each note.',
      'Load DORIAN SEQ and patch the quantizer’s Out into V/Oct: the notes of D Dorian go by.',
      'Patch the TUNER’s V/Oct out into a second VCO: it follows whatever the first sound plays.',
    ],
    tip: 'Set A4 to 415 and play an A: it reads as B♭, which is why Baroque pitch is called “a semitone low”.',
  },
  keys: {
    what: 'A keyboard that lights the notes on a V/Oct cable (one key per voice of a poly cable) and names the chord they spell in any inversion, with a slash for the bass. Put it after a CHORD, ARP, quantizer or sequencer to see exactly which notes a patch is choosing.',
    knobs: {},
    ins: { voct: 'Pitches, 0 V = C4. A poly cable lights a key per voice.', gate: 'Only voices whose gate is open light up. With nothing patched, every voice shows all the time.' },
    outs: {},
    tryIt: [
      'Load CHORD VIEW and play up a C major scale: each key gives its diatonic seventh chord and KEYS names it, Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7♭5.',
      'Set the CHORD’s Voicing to Drop 2, then Spread: the same chords with their notes moved across the octaves; when the lowest note changes, the name gets a slash for it.',
    ],
    tip: 'Patch a poly MIDI module’s V/Oct and Gate into KEYS to check a voicing you are learning: it names what you are holding.',
  },
  roll: {
    what: 'A piano roll: writes down each note a V/Oct cable plays as a bar, pitch going up and time scrolling left, so a pattern you hear becomes one you can read. It fits its range to the notes it has seen, with the Cs marked.',
    knobs: { time: 'How much time fits across the screen.' },
    ins: { voct: 'Pitches. A poly cable draws every voice, so chords show as stacks and their voice leading as lines.', gate: 'Where each note starts and stops. Without one, a note starts whenever the pitch moves to another semitone.' },
    outs: {},
    tryIt: [
      'Load TURING BASS, add a ROLL, and patch the quantizer’s Out into V/Oct and the Turing machine’s Gate into Gate: the loop draws itself. Turn Change up and watch it mutate.',
      'Load CHORD VIEW and play a scale slowly: the roll shows how each voice of one diatonic seventh moves to the next.',
    ],
    tip: 'Set Time so one bar of a steady clock fills the screen: repeats line up and the odd note out stands out.',
  },
  volts: {
    what: 'A four-channel voltmeter. Each meter reads a cable in volts as a bar up or down from zero, a shaded band for how far it swung since the last look, and the number. The quickest answer to “what is this cable actually doing?”',
    knobs: { range: 'Full scale: ±1 V for small offsets and pitch steps (a semitone is 1/12 V), ±5 V for audio and LFOs, ±10 V for gates and envelopes.' },
    ins: { in1: 'Meter 1. On a poly cable it follows the voice that last jumped, so it reads the newest note.', in2: 'Meter 2.', in3: 'Meter 3.', in4: 'Meter 4.' },
    outs: {},
    tryIt: [
      'Load INIT, add a VOLTS, and patch MIDI V/Oct into 1 and Gate into 2: middle C reads 0 V, the C above +1 V, and the gate jumps to 10 V while a key is down.',
      'Patch an LFO’s Sin into 3 and an ADSR’s Env into 4: one swings ±5 V, the other climbs to 10 V and falls back.',
    ],
    tip: 'Set Range to ±1 V and play up a scale with V/Oct on meter 1: the whole and half steps show as big and small jumps.',
  },
  cosm: {
    what: 'A granular looper, modelled on Hologram’s Microcosm pedal. It keeps the last ten seconds it heard and plays them back as loops, grains, glitches and echoes, all in time with its tempo. Eleven effects in four families: Micro loop (Mosaic, Seq, Glide), Granules (Haze, Tunnel, Strum), Glitch (Blocks, Interrupt, Arp) and Multidelay (Pattern, Warp), each with four variations, A–D. Behind them sit a resonant low-pass, a reverb and a 60-second looper. The screen names the effect, counts the beat and runs the looper; its letters pick the variation.',
    knobs: {
      act: 'How busy the effect is, in its own terms: how many samplers loop at once (Mosaic), how much the steps get reshuffled, filtered or shifted (Seq, Blocks, Interrupt), how fast the pitch glides (Glide), how dense the grains are (Haze), how deep the drone’s changes go (Tunnel), how many notes the chain or arpeggio uses (Strum, Arp), how many delay taps sound (Pattern, Warp).',
      rep: 'How long a sound is kept before new sound replaces it: passes of each loop before it takes a new slice (Mosaic, Glide, Tunnel; fully up holds it), cycles before Seq reshuffles, how far back Haze reaches, how slowly Strum’s chains fade, blocks per burst (Blocks), how often Interrupt cuts in, how long each Arp note rings, and feedback (Pattern, Warp).',
      shape: 'The contour of every loop and grain: down is a sharp attack that dies away, the middle a flat gate, up a slow swell. In Glide it picks the glide pattern instead (rise, fall, rise and fall, wander); in Tunnel how slowly a new drone fades in over the old; in Pattern and Warp whether the taps fade out or build up.',
      filter: 'Low-pass on the effect only; the dry sound is untouched. Fully up is open.',
      mix: 'Dry against effect: both full at noon, effect only fully up (Interrupt needs that to cut the sound).',
      space: 'Reverb on everything, dry and effect: both full at noon, only reverb fully up.',
      time: 'The tempo, when nothing is patched into Clock.',
      loop: 'Looper playback level.',
      fx: 'Which effect. The screen names it and its family.',
      var: 'Variation A–D, the effect’s four flavours (listed under Effects below). The letters on the screen set it too.',
      div: 'The effect’s rhythmic unit against the beat: 1/4 is a beat, 1/8 half of one, 1/4T a triplet (three in two beats), 1/4. dotted (one and a half), 1/1 a bar.',
      res: 'Filter resonance: a peak at the cutoff that whistles near the top.',
      verb: 'Room size and decay, from a small room (0.6 s) to a huge wash (11 s).',
      mdep: 'Pitch wobble on the loops, grains and delay taps, up to a semitone: chorus-like at low rates, tape warble at slow ones.',
      mrate: 'How fast it wobbles.',
      lspd: 'Looper playback speed and direction: ½× is an octave down and half the tempo, minus plays it backwards. Overdub at 1× for clean layers.',
      fade: 'How long the loop takes to fade out after ■.',
      rev: 'Plays the effect backwards: loops and grains read in reverse, delay taps come back as reversed echoes.',
      freeze: 'Stops listening: the effect keeps working on the last bar it heard for as long as Freeze is on, while the dry sound passes on.',
      pre: 'Puts the looper before the effects, so the loop is fed through them and you can change effect over it. Off, it records exactly what you hear.',
    },
    ins: {
      l: 'Audio in (every voice of a poly cable added together).',
      r: 'Right audio in; empty, L feeds both sides.',
      clock: 'Tempo from any clock output: it is folded into 60–180 bpm, so quarters, sixteenths and bars all set the same tempo. With a clock in, the looper’s length also rounds to whole beats.',
      freeze: 'Freezes while the gate is high.',
      loop: 'Each trigger presses the looper’s ● button: record, play, overdub, play…',
      act: 'Added to Activity: ±5 V is half its range.',
    },
    outs: { l: 'Left out.', r: 'Right out.' },
    tryIt: [
      'Load MICRO LOOPS and play a short phrase: Mosaic D stacks loops of it from an octave below to two above. Turn Activity down to one sampler and back up to six.',
      'Set Effect to Haze, Repeats up, Shape up: a slow cloud of grains from the last few seconds. Turn Freeze on and play over the cloud.',
      'Load GLITCH SEQ: Blocks follows the clock in Clock. Try Interrupt with Mix fully up and Repeats at noon, then Arp.',
      'Looper: press ● to record, ● again to close the loop (it plays), ● again to overdub, ■ to stop, ✕ to erase.',
    ],
    tip: 'Effects: Mosaic (overlapping loops at other speeds) A + octave up, B + octave down, C all an octave up, D octave down to two up. Seq (steps reshuffled) A filtered, B half speed and pads, C layered sweeps, D crushed ratchets. Glide A ½→1×, B 2→½×, C 1→2×, D both ways. Haze A stretched, B scattered, C + octave up, D + octave down. Tunnel A breathing length, B sub-octave sweep, C resonant bands, D new length on each attack. Strum A last note, B phasing, C cascade, D cascade + octave. Blocks A note runs, B shifts, C fading filtered, D shifts + crush. Interrupt A cut-ups, B shifted, C swept echoes, D crushed and reversed. Arp A plain, B octaves, C filtered, D crushed. Pattern A even echoes, B dotted, C triplets, D accelerating. Warp A envelope filter, B band-passes, C pitched taps, D octave crossfades.',
  },
  out: {
    what: 'The speakers. Every voice reaching L and R is added up, gently limited, and sent out with the app’s reverb.',
    knobs: { level: 'Output level. The meter turns red when you are pushing into the limiter.' },
    ins: { l: 'Left (and right too, when R is empty).', r: 'Right — patch a second signal here for stereo.' },
    outs: {},
    tryIt: ['Patch one VCO into L and a slightly detuned one into R: a wide stereo tone.'],
  },
};
