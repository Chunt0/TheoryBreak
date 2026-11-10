// The modular lessons' demos: patches rendered offline so a lesson can play
// "before" and "after" without touching the instrument you are working on.
import type { RackSpec, SynthDemo } from '../../../synth/demo';

// The rack voice every early lesson builds on: MIDI → VCO → VCF → VCA → OUT, an ADSR on the VCA.
export const voice = (o: { osc?: Record<string, number>; port?: string; filt?: Record<string, number>; env?: Record<string, number>; fenv?: number; voices?: number } = {}): RackSpec => ({
  mods: {
    midi: ['midi', { voices: o.voices ?? 0 }],
    osc: ['vco', o.osc],
    f: ['vcf', { cutoff: 18000, res: 0, cv: o.fenv ?? 0, ...o.filt }],
    env: ['adsr', { a: 0.005, d: 0.3, s: 0.8, r: 0.3, ...o.env }],
    amp: ['vca'],
    out: ['out', { level: 0.6 }],
  },
  wires: [
    'midi.voct>osc.voct', `osc.${o.port ?? 'saw'}>f.in`, 'f.lp>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv',
    ...(o.fenv ? ['env.env>f.cv'] : []), 'amp.out>out.l', 'amp.out>out.r',
  ],
});

export const PHRASE: [string, number, number, number?][] = [['C3', 0, 0.45], ['E♭3', 0.5, 0.45], ['G3', 1, 0.45], ['B♭3', 1.5, 1.2]];

export const BASIC_VOICE: SynthDemo = {
        name: 'BASIC VOICE', rack: voice(), play: PHRASE,
        caption: 'The basic voice playing four notes: a filtered saw, opened and closed by its envelope.',
        tries: [{ label: 'Basic voice' }, { label: 'Filter closed down', set: { 'f.cutoff': 500 } }, { label: 'Slow envelope', set: { 'env.a': 0.25, 'env.r': 0.6 } }],
      };

export const NO_ENV: SynthDemo = {
        name: 'NO ENV', view: 'none', rack: { ...voice(), wires: voice().wires.filter((w) => w !== 'env.env>amp.cv') }, play: PHRASE, seconds: 3,
        caption: 'With the ADSR cable gone, the VCA has nothing on its CV input and simply passes the oscillator: one endless tone that only changes pitch. That is why the envelope → VCA cable is the first one every patch needs.',
        tries: [{ label: 'No envelope on the VCA' }],
      };

export const WAVES: SynthDemo = {
        name: 'WAVES',
        rack: { mods: { midi: ['midi', { voices: 0 }], osc: ['vco'], pick: ['mix', { l1: 0.8, l2: 0, l3: 0, l4: 0 }], env: ['adsr', { a: 0.005, s: 0.9, r: 0.3 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'osc.sin>pick.in1', 'osc.tri>pick.in2', 'osc.sqr>pick.in3', 'osc.saw>pick.in4', 'pick.out>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        caption: 'One VCO\'s four outputs, picked one at a time on a mixer. The ticks under the spectrum mark the harmonics: the saw fills every one, square and triangle only the odd ones (the triangle\'s fading much faster), the sine just the first.',
        tries: [
          { label: 'Sine' },
          { label: 'Triangle', set: { 'pick.l1': 0, 'pick.l2': 0.8 } },
          { label: 'Square', set: { 'pick.l1': 0, 'pick.l3': 0.55 } },
          { label: 'Saw', set: { 'pick.l1': 0, 'pick.l4': 0.7 } },
        ],
      };

export const PULSE: SynthDemo = {
        name: 'PULSE', rack: voice({ port: 'sqr', osc: { pw: 0.5 } }),
        caption: 'Pulse width 50%, 25% and 10%: thinner and more nasal as it narrows.',
        tries: [{ label: '50%', note: 'square' }, { label: '25%', set: { 'osc.pw': 0.25 } }, { label: '10%', set: { 'osc.pw': 0.1 } }],
      };

export const DETUNE: SynthDemo = {
        name: 'DETUNE',
        rack: { mods: { midi: ['midi', { voices: 0 }], a: ['vco'], b: ['vco', { tune: 0 }], mix: ['mix', { l1: 0.6, l2: 0.6 }], env: ['adsr', { a: 0.01, s: 0.9, r: 0.4 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>a.voct', 'midi.voct>b.voct', 'a.saw>mix.in1', 'b.saw>mix.in2', 'mix.out>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['C3', 0, 2.6]], view: 'spectrum',
        caption: 'Two saws: in tune, 8 cents apart, 20 cents apart, and an octave up.',
        tries: [{ label: 'Unison' }, { label: '+8 cents', set: { 'b.tune': 0.08 } }, { label: '+20 cents', set: { 'b.tune': 0.2 } }, { label: 'Octave', set: { 'b.oct': 1 } }],
      };

export const CUTOFF: SynthDemo = {
        name: 'CUTOFF', hz: 5500, rack: voice({ filt: { cutoff: 300, res: 0.1 } }), play: [['C2', 0, 1.8]],
        caption: 'A saw through the low-pass at 300 Hz, 1.2 kHz and 5 kHz: the spectrum keeps its low harmonics and loses the top.',
        tries: [{ label: '300 Hz' }, { label: '1.2 kHz', set: { 'f.cutoff': 1200 } }, { label: '5 kHz', set: { 'f.cutoff': 5000 } }],
      };

export const LP_BP_HP: SynthDemo = {
        name: 'LP BP HP', hz: 4000,
        rack: { mods: { midi: ['midi', { voices: 0 }], osc: ['vco'], f: ['vcf', { cutoff: 900, res: 0.3 }], pick: ['mix', { l1: 0.8, l2: 0, l3: 0 }], env: ['adsr', { a: 0.005, s: 0.9, r: 0.3 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'osc.saw>f.in', 'f.lp>pick.in1', 'f.bp>pick.in2', 'f.hp>pick.in3', 'pick.out>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['C2', 0, 1.8]],
        caption: 'One saw through one VCF at 900 Hz, heard from each of its three outputs.',
        tries: [{ label: 'Low-pass' }, { label: 'Band-pass', set: { 'pick.l1': 0, 'pick.l2': 0.9 } }, { label: 'High-pass', set: { 'pick.l1': 0, 'pick.l3': 0.8 } }],
      };

export const RESONANCE: SynthDemo = {
        name: 'RESONANCE', hz: 2500, rack: voice({ filt: { cutoff: 700, res: 0 } }), play: [['C2', 0, 1.8]],
        caption: 'Cutoff 700 Hz with resonance at 0, 0.6 and 0.92: a peak grows at the cutoff (see it in the spectrum) and starts to ring.',
        tries: [{ label: 'Res 0' }, { label: 'Res 0.6', set: { 'f.res': 0.6 } }, { label: 'Res 0.92', set: { 'f.res': 0.92 } }],
      };

export const LADDER: SynthDemo = {
        name: 'LADDER', hz: 2500,
        rack: { mods: { midi: ['midi', { voices: 0 }], osc: ['vco'], f: ['ladder', { cutoff: 700, res: 0.3, drive: 1.5 }], env: ['adsr', { a: 0.005, s: 0.8 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'osc.saw>f.in', 'f.out>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['C2', 0, 1.8]],
        caption: 'The 24 dB ladder at the same 700 Hz: the upper harmonics fall away much faster. Then more drive, then resonance near the top.',
        tries: [{ label: 'Ladder' }, { label: 'Drive 4', set: { 'f.drive': 4 } }, { label: 'Res 0.85', set: { 'f.res': 0.85 } }],
      };

export const ADSR: SynthDemo = {
        name: 'ADSR', rack: voice({ filt: { cutoff: 2500 } }), play: [['C3', 0, 1.2], ['G3', 1.6, 1.2]], view: 'none',
        caption: 'Four envelopes on the same tone: organ, pluck, brass and pad. Listen to the start and end of each note.',
        tries: [
          { label: 'Organ', set: { 'env.a': 0.002, 'env.d': 0.01, 'env.s': 1, 'env.r': 0.03 } },
          { label: 'Pluck', set: { 'env.a': 0.001, 'env.d': 0.5, 'env.s': 0, 'env.r': 0.3 } },
          { label: 'Brass', set: { 'env.a': 0.08, 'env.d': 0.2, 'env.s': 0.75, 'env.r': 0.15 } },
          { label: 'Pad', set: { 'env.a': 0.9, 'env.d': 0.3, 'env.s': 1, 'env.r': 1.2 } },
        ],
      };

export const FILTER_ENV: SynthDemo = {
        name: 'FILTER ENV', rack: voice({ filt: { cutoff: 120, res: 0.45 }, fenv: 0.45, env: { a: 0.002, d: 0.25, s: 0.2, r: 0.2 } }), play: [['C2', 0, 0.35], ['C2', 0.5, 0.35], ['E♭2', 1, 0.35], ['G2', 1.5, 0.9]],
        caption: 'One ADSR on both the VCA and the cutoff. Then a smaller amount, then a slow attack (brass).',
        tries: [{ label: 'Amount 0.45' }, { label: 'Amount 0.2', set: { 'f.cv': 0.2 } }, { label: 'Slow attack', set: { 'env.a': 0.12, 'env.d': 0.4, 'env.s': 0.6, 'f.cv': 0.35 } }],
      };

export const VCA_RESP: SynthDemo = {
        name: 'VCA RESP', rack: voice({ env: { a: 0.001, d: 0.9, s: 0, r: 0.6 } }), play: [['G3', 0, 0.2], ['C4', 0.9, 0.2]], view: 'none',
        caption: 'The same pluck envelope through a linear and an exponential VCA.',
        tries: [{ label: 'Linear' }, { label: 'Exponential', set: { 'amp.resp': 1 } }],
      };

export const LFO_DEST: SynthDemo = {
        name: 'LFO DEST',
        rack: { mods: { midi: ['midi', { voices: 0 }], lfo: ['lfo', { rate: 5.5 }], osc: ['vco', { fm: 0 }], f: ['vcf', { cutoff: 900, res: 0.35, cv: 0 }], env: ['adsr', { a: 0.05, s: 0.9, r: 0.4 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'lfo.sin>osc.fm', 'lfo.tri>f.cv', 'osc.saw>f.in', 'f.lp>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['C3', 0, 2.8]], view: 'none',
        caption: 'One LFO patched to pitch and to cutoff; each variant turns up a different depth knob.',
        tries: [
          { label: 'Dry' },
          { label: 'Vibrato', set: { 'osc.fm': 0.004 }, note: 'pitch' },
          { label: 'Wah', set: { 'f.cv': 0.35, 'lfo.rate': 2 }, note: 'cutoff' },
          { label: 'Fast + deep', set: { 'osc.fm': 0.04, 'lfo.rate': 9 }, note: 'too much' },
        ],
      };

export const MOD_WHEEL: SynthDemo = {
        name: 'MOD WHEEL',
        rack: { mods: { midi: ['midi', { voices: 0 }], lfo: ['lfo', { rate: 5.8 }], depth: ['vca', { level: 1 }], hand: ['util', { a1: 0, o1: 0 }], osc: ['vco', { fm: 0.01 }], env: ['adsr', { a: 0.02, s: 0.9 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'lfo.sin>depth.in', 'hand.out1>depth.cv', 'depth.out>osc.fm', 'osc.tri>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['A3', 0, 2.6]], view: 'none',
        caption: 'A VCA as a depth control: the LFO goes through it to the VCO. Here a Util stands in for the mod wheel at 0, half and full.',
        tries: [{ label: 'Wheel down' }, { label: 'Halfway', set: { 'hand.o1': 2.5 } }, { label: 'Full', set: { 'hand.o1': 5 } }],
      };

export const SYNTH_BASS: SynthDemo = {
        name: 'SYNTH BASS',
        rack: { mods: { midi: ['midi', { voices: 0, glide: 0 }], a: ['vco', { oct: -1 }], b: ['vco', { oct: -2 }], mix: ['mix', { l1: 0.7, l2: 0.5 }], fe: ['adsr', { a: 0.001, d: 0.22, s: 0.1, r: 0.1 }], f: ['ladder', { cutoff: 140, res: 0.35, cv: 0.45, drive: 2.2 }], ae: ['adsr', { a: 0.002, d: 0.3, s: 0.7, r: 0.08 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>a.voct', 'midi.voct>b.voct', 'a.saw>mix.in1', 'b.sqr>mix.in2', 'mix.out>f.in', 'midi.gate>fe.gate', 'fe.env>f.cv', 'f.out>amp.in', 'midi.gate>ae.gate', 'ae.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['C2', 0, 0.2], ['C2', 0.3, 0.2], ['E♭2', 0.6, 0.2], ['C2', 0.9, 0.2], ['G2', 1.2, 0.2], ['F2', 1.5, 0.2], ['E♭2', 1.8, 0.5]],
        caption: 'Saw plus a square an octave below, a ladder filter with a snappy envelope: the Minimoog bass. Then more resonance, then glide.',
        tries: [{ label: 'Bass' }, { label: 'Resonant', set: { 'f.res': 0.7, 'f.cv': 0.5 }, note: 'acid' }, { label: 'Glide', set: { 'midi.glide': 0.06 } }],
      };

export const BRASS: SynthDemo = {
        name: 'BRASS',
        rack: { mods: { midi: ['midi', { voices: 2 }], a: ['vco'], b: ['vco', { tune: 0.1 }], mix: ['mix', { l1: 0.6, l2: 0.6 }], fe: ['adsr', { a: 0.09, d: 0.35, s: 0.55, r: 0.2 }], f: ['vcf', { cutoff: 260, res: 0.15, cv: 0.38 }], ae: ['adsr', { a: 0.05, d: 0.2, s: 0.85, r: 0.2 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>a.voct', 'midi.voct>b.voct', 'a.saw>mix.in1', 'b.saw>mix.in2', 'mix.out>f.in', 'midi.gate>fe.gate', 'fe.env>f.cv', 'f.lp>amp.in', 'midi.gate>ae.gate', 'ae.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['F3', 0, 0.9], ['A3', 0, 0.9], ['G3', 1, 0.4], ['B♭3', 1, 0.4], ['A3', 1.5, 1.2], ['C4', 1.5, 1.2]],
        caption: 'Synth brass: two slightly detuned saws, and a filter envelope whose attack is slower than the amp\'s, so each note blares open a moment after it starts.',
        tries: [{ label: 'Brass' }, { label: 'Fast filter attack', set: { 'fe.a': 0.005 }, note: 'loses the blare' }],
      };

export const PAD: SynthDemo = {
        name: 'PAD',
        rack: { mods: { midi: ['midi', { voices: 4 }], lfo: ['lfo', { rate: 0.3 }], a: ['vco', { pwm: 0.35 }], b: ['vco', { tune: -0.12 }], mix: ['mix', { l1: 0.55, l2: 0.55 }], f: ['vcf', { cutoff: 1400, res: 0.1, cv: 0 }], ae: ['adsr', { a: 0.8, d: 0.4, s: 0.9, r: 1.5 }], amp: ['vca'], dl: ['delay', { time: 0.38, fb: 0.35, mix: 0.25, tone: 3000 }], out: ['out'] },
          wires: ['midi.voct>a.voct', 'midi.voct>b.voct', 'lfo.tri>a.pwm', 'a.sqr>mix.in1', 'b.saw>mix.in2', 'mix.out>f.in', 'f.lp>amp.in', 'midi.gate>ae.gate', 'ae.env>amp.cv', 'amp.out>dl.in', 'dl.out>out.l', 'dl.out>out.r'] },
        play: [['C3', 0, 2.2], ['E♭3', 0, 2.2], ['G3', 0, 2.2], ['B♭3', 0, 2.2]], view: 'spectrum',
        caption: 'Pad: four voices, a PWM square and a detuned saw, slow attack and release, a soft filter and echoes.',
        tries: [{ label: 'Pad' }, { label: 'No PWM, no detune', set: { 'a.pwm': 0, 'b.tune': 0 }, note: 'static' }],
      };

export const STEREO_PAD: SynthDemo = {
        name: 'STEREO PAD',
        rack: { mods: { midi: ['midi', { voices: 4 }], drift: ['rand', { rate: 0.4, amt: 0.05 }], osc: ['vco', { fm: 0.04 }], f: ['vcf', { cutoff: 1800, res: 0.1, cv: 0 }], env: ['adsr', { a: 0.4, d: 0.4, s: 0.85, r: 1.2 }], amp: ['vca'], ch: ['chorus', { rate: 0.5, depth: 0.6, mix: 0 }], rv: ['verb', { size: 0.75, damp: 0.4, mix: 0 }], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'drift.smooth>osc.fm', 'osc.saw>f.in', 'f.lp>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>ch.in', 'ch.l>rv.in', 'rv.l>out.l', 'rv.r>out.r'] },
        play: [['D3', 0, 2], ['F3', 0, 2], ['A3', 0, 2], ['C4', 0, 2]], view: 'none',
        caption: 'A four-voice saw chord: dry, then chorus, then chorus and reverb. (Headphones show the width.)',
        tries: [{ label: 'Dry' }, { label: '+ chorus', set: { 'ch.mix': 0.5 } }, { label: '+ reverb', set: { 'ch.mix': 0.5, 'rv.mix': 0.35 } }],
      };

export const ECHOES: SynthDemo = {
        name: 'ECHOES',
        rack: { mods: { midi: ['midi', { voices: 0 }], osc: ['vco'], f: ['vcf', { cutoff: 2200, res: 0.2, cv: 0 }], env: ['adsr', { a: 0.001, d: 0.25, s: 0, r: 0.2 }], amp: ['vca'], dl: ['delay', { time: 0.375, fb: 0.45, mix: 0.4, tone: 3500 }], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'osc.sqr>f.in', 'f.lp>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>dl.in', 'dl.out>out.l', 'dl.out>out.r'] },
        play: [['E4', 0, 0.1], ['G4', 0.5, 0.1], ['B4', 1, 0.1], ['D5', 1.5, 0.1]], seconds: 4.5, view: 'none',
        caption: 'Plucks a quarter note apart at 120 BPM, with a dotted-8th delay: the echoes land between the notes. Then a quarter-note delay, then high feedback.',
        tries: [{ label: 'Dotted 8th' }, { label: 'Quarter', set: { 'dl.time': 0.5 } }, { label: 'Feedback 0.8', set: { 'dl.fb': 0.8 } }],
      };

export const FOLDER: SynthDemo = {
        name: 'FOLDER',
        rack: { mods: { midi: ['midi', { voices: 0 }], osc: ['vco'], wf: ['fold', { fold: 0.6, bias: 0, cv: 0 }], env: ['adsr', { a: 0.01, s: 0.9, r: 0.3 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'osc.sin>wf.in', 'wf.out>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['C3', 0, 1.6]],
        caption: 'A sine into the folder at fold 0.6, 2, 4 and 7, then 4 with bias. Watch the wave grow folds and the spectrum fill in.',
        tries: [{ label: 'Fold 0.6' }, { label: 'Fold 2', set: { 'wf.fold': 2 } }, { label: 'Fold 4', set: { 'wf.fold': 4 } }, { label: 'Fold 7', set: { 'wf.fold': 7 } }, { label: 'Fold 4, bias', set: { 'wf.fold': 4, 'wf.bias': 1.5 } }],
      };

export const LPG_PING: SynthDemo = {
        name: 'LPG PING',
        rack: { mods: { midi: ['midi', { voices: 0 }], osc: ['vco'], wf: ['fold', { fold: 2.5, bias: 0.5, cv: 0 }], g: ['lpg', { decay: 0.6, mode: 0, level: 0 }], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'osc.tri>wf.in', 'wf.out>g.in', 'midi.trig>g.ping', 'g.out>out.l', 'g.out>out.r'] },
        play: [['C3', 0, 0.1], ['G3', 0.35, 0.1], ['E♭4', 0.7, 0.1], ['D4', 1.05, 0.1], ['B♭3', 1.4, 0.1], ['C4', 1.75, 0.4]], view: 'none',
        caption: 'A folded triangle struck by triggers into the LPG: decay 0.6 s, then 0.2, then VCA mode only (no filtering: the brightness no longer follows the level).',
        tries: [{ label: 'LPG' }, { label: 'Short decay', set: { 'g.decay': 0.2 } }, { label: 'VCA mode', set: { 'g.mode': 2 } }],
      };

export const AUDIO_FM: SynthDemo = {
        name: 'AUDIO FM',
        rack: { mods: { midi: ['midi', { voices: 0 }], mod: ['vco', { oct: 0 }], car: ['vco', { fm: 0 }], env: ['adsr', { a: 0.005, s: 0.9, r: 0.3 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>mod.voct', 'midi.voct>car.voct', 'mod.sin>car.fm', 'car.sin>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['C3', 0, 1.6]],
        caption: 'A sine VCO frequency-modulating another at the same pitch: FM depth 0, 0.05, 0.15 and 0.4. Sidebands spread out with depth, and (exponential FM) the pitch drifts and the partials slide off the harmonics.',
        tries: [{ label: 'Depth 0' }, { label: '0.05', set: { 'car.fm': 0.05 } }, { label: '0.15', set: { 'car.fm': 0.15 } }, { label: '0.4', set: { 'car.fm': 0.4 } }],
      };

export const RING_MOD: SynthDemo = {
        name: 'RING MOD',
        rack: { mods: { midi: ['midi', { voices: 0 }], osc: ['vco'], rm: ['ring', { freq: 440, mix: 1 }], env: ['adsr', { a: 0.005, d: 0.8, s: 0.4, r: 0.4 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>osc.voct', 'osc.sin>rm.a', 'rm.out>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['A3', 0, 1.6]], hz: 1400,
        caption: 'A 220 Hz sine ringed with the module\'s own carrier: at 440 Hz (sidebands 220 and 660: harmonic), 311 Hz (91 and 531: clangorous), and 30 Hz (a rough, buzzy tremolo).',
        tries: [{ label: '× 440 Hz' }, { label: '× 311 Hz', set: { 'rm.freq': 311 } }, { label: '× 30 Hz', set: { 'rm.freq': 30 } }],
      };

export const HARD_SYNC: SynthDemo = {
        name: 'HARD SYNC',
        rack: { mods: { midi: ['midi', { voices: 0 }], master: ['vco'], slave: ['vco', { tune: 0 }], env: ['adsr', { a: 0.005, s: 0.9, r: 0.3 }], amp: ['vca'], out: ['out'] },
          wires: ['midi.voct>master.voct', 'midi.voct>slave.voct', 'master.saw>slave.sync', 'slave.saw>amp.in', 'midi.gate>env.gate', 'env.env>amp.cv', 'amp.out>out.l', 'amp.out>out.r'] },
        play: [['C3', 0, 1.6]],
        caption: 'The slave synced to the master and tuned up 0, 5, 10 and 17 semitones: the pitch stays C, the waveform and its harmonics change. (At exact octaves the slave fits whole cycles into the master\'s, so sync does nothing new there: sweeps sound best between them.)',
        tries: [{ label: '+0' }, { label: '+5', set: { 'slave.tune': 5 } }, { label: '+10', set: { 'slave.tune': 10 } }, { label: '+17', set: { 'slave.oct': 1, 'slave.tune': 5 } }],
      };
