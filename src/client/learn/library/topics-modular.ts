import type { RackSpec } from '../synth/demo';
import type { Topic } from './types';
import { BASIC_VOICE, NO_ENV, WAVES, PULSE, DETUNE, CUTOFF, LP_BP_HP, RESONANCE, LADDER, ADSR, FILTER_ENV, VCA_RESP, LFO_DEST, MOD_WHEEL, SYNTH_BASS, BRASS, PAD, STEREO_PAD, ECHOES, FOLDER, LPG_PING, AUDIO_FM, RING_MOD, HARD_SYNC } from './lessons/modular/demos';

// The rack voice every early lesson builds on: MIDI → VCO → VCF → VCA → OUT, an ADSR on the VCA.
const voice = (o: { osc?: Record<string, number>; port?: string; filt?: Record<string, number>; env?: Record<string, number>; fenv?: number; voices?: number } = {}): RackSpec => ({
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

const PHRASE: [string, number, number, number?][] = [['C3', 0, 0.45], ['E♭3', 0.5, 0.45], ['G3', 1, 0.45], ['B♭3', 1.5, 1.2]];

export const MODULAR_TOPICS: Topic[] = [
  {
    id: 'modular.voltage', title: 'Voltage, cables & the basic voice', tags: ['modular'], minutes: 5, level: 1,
    summary: 'What a modular synth is: modules joined by cables carrying audio and control voltage, and the five-module chain under nearly every patch.',
    blocks: [
      { t: 'p', md: 'A modular synthesizer is a set of single-purpose circuits (**modules**) with nothing connected inside: you decide what controls what by **patching** cables. Every cable carries a voltage. Some voltages change thousands of times a second and you hear them: **audio**. Others change slowly and turn knobs for you: **control voltage (CV)**. A jack does not care which it gets, which is the point: patch an LFO into a filter and it sweeps; patch an oscillator into the same jack and it growls.' },
      { t: 'table', head: ['Signal', 'Range here', 'Means'], rows: [
        ['Audio', '±5 V', 'the sound itself'],
        ['Pitch (V/Oct)', '1 V per octave, 0 V = middle C', '+1/12 V is a semitone up; add voltages to transpose'],
        ['Gate', '10 V while a key is held, else 0', 'note on / note off'],
        ['Trigger', 'a 2 ms spike', '"now": start a drum or an envelope'],
        ['Envelope, LFO', '0 to 10 V, ±5 V', 'shapes over time; repeating wobbles'],
      ] },
      { t: 'p', md: 'The **basic voice** (subtractive synthesis) is five modules:\n- **MIDI** turns your playing into V/Oct and Gate.\n- **VCO** (voltage-controlled oscillator) makes a bright, harmonically rich tone at the pitch V/Oct asks for.\n- **VCF** (filter) removes harmonics: the tone colour.\n- **VCA** (amplifier) is a volume control that a voltage turns: closed, it is silent.\n- **ADSR** (envelope) is a shape started by each gate; into the VCA it opens and closes the sound with each note.\n\nThe audio path is VCO → VCF → VCA → OUT. The control path is MIDI → VCO (pitch), MIDI → ADSR (gate) and ADSR → VCA (loudness). Everything else in synthesis is more of the same: something changing something else over time.' },
      { t: 'synth', demo: BASIC_VOICE },
      { t: 'synth', demo: NO_ENV },
      { t: 'note', kind: 'keys', md: 'Open the rack\'s **INIT** patch and look: these are the cables. Tap any module\'s **?** for its manual. Outputs sit on dark plates, inputs are bare jacks; an output can feed many inputs, an input takes one cable.' },
      { t: 'example', title: 'Patch the basic voice from nothing', steps: [
        'Add MIDI, VCO, VCF, ADSR, VCA and OUT.',
        'Audio: VCO Saw → VCF In, VCF LP → VCA In, VCA Out → OUT L and R.',
        'Control: MIDI V/Oct → VCO V/Oct, MIDI Gate → ADSR Gate, ADSR Env → VCA CV. Play: each key starts the envelope, which opens the VCA, which lets the filtered saw through.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'modular.osc', title: 'Oscillators, waveforms & harmonics', tags: ['modular'], minutes: 6, level: 1,
    summary: 'Why a saw is bright and a sine is pure: the harmonic series, what each waveform contains, pulse width, and detuning.',
    blocks: [
      { t: 'p', md: 'Any steady pitched sound is a sum of sine waves at whole-number multiples of its fundamental: the **harmonic series** (f, 2f, 3f, 4f…). How loud each harmonic is gives the **timbre**. The classic oscillator waveforms are recipes of harmonics, and subtractive synthesis starts from a rich recipe and filters it down.' },
      { t: 'table', head: ['Wave', 'Harmonics', 'Level of the nth', 'Sound'], rows: [
        ['Sine', 'the fundamental only', '—', 'pure, flute-like, sub bass'],
        ['Triangle', 'odd only (1, 3, 5…)', '1/n² (falls fast)', 'soft, hollow, ocarina'],
        ['Square', 'odd only', '1/n', 'hollow, woody: clarinet'],
        ['Saw', 'all', '1/n', 'bright, buzzy: strings, brass'],
        ['Narrow pulse', 'all, with gaps', 'depends on width', 'thin, nasal, reedy'],
      ] },
      { t: 'synth', demo: WAVES },
      { t: 'p', md: 'A **pulse** wave\'s width (duty cycle) changes its recipe: at 50% it is a square (no even harmonics); as it narrows, even harmonics come in and every harmonic that is a multiple of 1/width drops out (at 25% width, the 4th, 8th, 12th…). Moving the width with an LFO (**PWM**) makes the harmonics shift continuously: the chorused, string-ensemble sound of the 1980s.' },
      { t: 'synth', demo: PULSE },
      { t: 'p', md: 'Two oscillators a few cents apart **beat**: their sum swells and fades at the difference frequency, which reads as movement and width. A few cents is chorus, a few tenths of a semitone is a honky-tonk detune, an octave or a 5th apart is a thicker single voice (the classic lead stack).' },
      { t: 'synth', demo: DETUNE },
      { t: 'note', kind: 'ear', md: 'Add the **Spectrum** module after the VCO and play: the bars are the harmonics. Switch outputs and watch odd harmonics appear and vanish. It is the fastest way to learn what a waveform "contains".' },
      { t: 'example', title: 'Why a square sounds like a clarinet', steps: [
        'A clarinet is a cylindrical tube closed at one end: it resonates mostly at odd multiples of its fundamental.',
        'A square wave has odd harmonics only, at 1/n: 1, 1/3, 1/5…',
        'Filter it gently (cut above the 5th harmonic or so) and add a slow attack: the recipe is close enough for the ear to say "woodwind".',
      ] },
    ],
    drills: [],
  },
  {
    id: 'modular.filter', title: 'Filters: cutoff, slope & resonance', tags: ['modular'], minutes: 6, level: 1,
    summary: 'Low-, band- and high-pass, what a 12 vs 24 dB slope does, resonance and self-oscillation, and key tracking.',
    blocks: [
      { t: 'p', md: 'A filter removes part of the spectrum. **Low-pass** keeps everything below the **cutoff** and darkens; **high-pass** keeps what is above and thins; **band-pass** keeps a band around the cutoff, like a wah or a telephone. The **slope** says how fast the filter cuts past the cutoff: a 12 dB/octave filter (2-pole, the VCF here, Oberheim and Roland style) is gentle and open; a 24 dB/octave ladder (4-pole, the Moog circuit) is steep, round and fat.' },
      { t: 'synth', demo: CUTOFF },
      { t: 'synth', demo: LP_BP_HP },
      { t: 'p', md: '**Resonance** feeds the filter\'s output back into itself, boosting a narrow band right at the cutoff. A little gives a vocal edge; a lot makes the filter whistle and, near the top of its range, **self-oscillate**: it rings on its own as a sine at the cutoff frequency, a sound source with no input at all. On a ladder filter more resonance also thins the bass, as on the real circuit.' },
      { t: 'synth', demo: RESONANCE },
      { t: 'synth', demo: LADDER },
      { t: 'table', head: ['Filter', 'Slope', 'Character', 'Classic use'], rows: [
        ['VCF (state-variable)', '12 dB/oct', 'open, airy; LP, BP and HP at once', 'pads, brass, wah, Oberheim/SEM'],
        ['Ladder', '24 dB/oct', 'round, saturated, bass-heavy', 'Moog bass and leads, acid'],
        ['Low-pass gate', 'gentle, tied to level', 'plucked, organic', 'Buchla, west coast'],
        ['Comb', 'a row of peaks', 'metallic, pitched', 'flanging, Karplus–Strong strings'],
      ] },
      { t: 'p', md: '**Key tracking**: patch the MIDI V/Oct into the VCF\'s V/Oct input and the cutoff follows the keyboard, an octave per octave. Without it, high notes come out dull and low notes buzzy, because the same cutoff removes more of a high note\'s few harmonics. With full tracking at high resonance, the self-oscillating filter plays in tune: a sine voice from a filter.' },
      { t: 'example', title: 'Dial in a bass that stays even across the keyboard', steps: [
        'Ladder filter, cutoff around 400 Hz, resonance 0.3, drive 2: round and warm.',
        'Play C1 and C3: the high note is too dark. Patch MIDI V/Oct → filter V/Oct (key tracking).',
        'Now the filter opens an octave for every octave you go up, and each note keeps the same harmonics: the same tone, in every register.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'modular.env', title: 'Envelopes & VCAs', tags: ['modular'], minutes: 6, level: 1,
    summary: 'Attack, decay, sustain, release; gates vs triggers; envelopes on loudness and brightness at once; linear vs exponential.',
    blocks: [
      { t: 'p', md: 'An **envelope generator** draws a shape each time a gate arrives. **Attack**: time to rise to full. **Decay**: time to fall to the sustain level. **Sustain**: the level held while the key stays down (a level, not a time). **Release**: time to fade out after the key comes up. Into a VCA the shape is loudness; into a filter\'s CV it is brightness. Most acoustic instruments get louder and brighter together, so one envelope often drives both.' },
      { t: 'table', head: ['Sound', 'A', 'D', 'S', 'R'], rows: [
        ['Organ', '0', '0', 'full', 'short'],
        ['Pluck, piano', 'instant', 'long', '0', 'short to medium'],
        ['Brass', 'medium (50–100 ms)', 'short', 'high', 'short'],
        ['Pad, strings', 'slow (0.5–2 s)', '—', 'full', 'slow'],
        ['Percussion', 'instant', 'short', '0', '= decay'],
      ] },
      { t: 'synth', demo: ADSR },
      { t: 'p', md: 'A **filter envelope** is the most expressive single cable in subtractive synthesis. Patch the same ADSR into the filter\'s CV: the CV knob sets how many octaves the envelope opens the cutoff (0.5 here = 5 octaves at the envelope\'s 10 V peak). A low base cutoff with a big, fast-decaying envelope gives the "pew" of a synth bass; a slow attack gives the swell of synth brass.' },
      { t: 'synth', demo: FILTER_ENV },
      { t: 'p', md: '**Gate or trigger?** A gate lasts as long as the key; it lets an ADSR know when to release. A trigger is a spike with no length; envelopes it starts (AD, attack–decay) run to the end on their own: drums, plucks, and the **Func** module in one-shot mode. **Retrigger**: a new gate while the envelope is still high restarts its attack (multi-trigger) or carries on from where it is (single-trigger, legato): the MIDI module\'s mono mode slides between overlapping notes without restarting the envelope.' },
      { t: 'p', md: '**VCA response.** A linear VCA follows the CV evenly; an exponential one stays quieter for longer at low CV and snaps up near the top. Ears hear loudness logarithmically, so an exponential VCA makes decays sound natural and plucks short and dry; linear sounds fuller and sustains longer. The VCA\'s **Resp** knob switches between them.' },
      { t: 'synth', demo: VCA_RESP },
      { t: 'example', title: 'Design a pluck', steps: [
        'Attack 0, decay 0.5 s, sustain 0, release 0.3 s: the note dies even if you hold the key.',
        'Patch the envelope to the filter too, base cutoff low (200 Hz), amount 0.4: each note starts bright and darkens as it dies, like a string.',
        'Exponential VCA for a dry, short tail; patch MIDI Vel → filter CV (through a Mix) so harder notes start brighter.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'modular.mod', title: 'Modulation: LFOs, depth & destination', tags: ['modular'], minutes: 6, level: 2,
    summary: 'Vibrato, tremolo, wah and PWM from one LFO; how depth and offset are set; bipolar vs unipolar; the mod wheel as a VCA.',
    blocks: [
      { t: 'p', md: 'A **modulation** routing has three parts: a **source** (LFO, envelope, random, velocity, the mod wheel), a **destination** (pitch, cutoff, level, pulse width, pan…) and a **depth** (how far it moves). The LFO is the workhorse: a wave too slow to hear, used to move a knob over and over.' },
      { t: 'table', head: ['LFO into', 'Effect', 'Typical rate'], rows: [
        ['VCO FM (pitch)', 'vibrato', '5–7 Hz, small depth'],
        ['VCA CV (level)', 'tremolo', '4–8 Hz'],
        ['VCF CV (cutoff)', 'wah, filter sweep', '0.1–4 Hz'],
        ['VCO PWM', 'chorus-like shimmer', '0.2–2 Hz'],
        ['Pan CV', 'auto-pan', '0.1–1 Hz'],
      ] },
      { t: 'synth', demo: LFO_DEST },
      { t: 'p', md: '**Depth is an attenuator.** On a destination with its own CV knob (VCO FM, VCF CV) that knob is the depth. Where there is none, put the source through a **Util** lane (gain = depth, negative to invert) or a **VCA** (whose CV can itself be modulated, which is how the **mod wheel** adds vibrato: MIDI Mod → VCA CV, LFO → VCA In, VCA Out → VCO FM). **Bipolar** sources (LFOs, ±5 V) swing both ways around the knob\'s setting; **unipolar** ones (envelopes, 0–10 V) only push one way. Util\'s offset turns one into the other.' },
      { t: 'synth', demo: MOD_WHEEL },
      { t: 'p', md: '**Envelopes are modulators too**, and a delayed vibrato is the most musical: a slow-attack envelope into the depth VCA so each long note starts straight and blooms, as singers and string players do. Random sources (the **Rand** and **S&H**) give drift and bleeps; **velocity** is a per-note modulator, perfect for brightness and loudness.' },
      { t: 'example', title: 'Delayed vibrato', steps: [
        'LFO Sine → VCA In; VCA Out → VCO FM; VCO FM knob small (about 0.01).',
        'A second ADSR with attack 0.8 s, sustain full, gated by MIDI Gate → that VCA\'s CV.',
        'Short notes stay straight; long notes start straight and the vibrato fades in over the first second.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'modular.classic', title: 'Classic patches: bass, lead, brass, pad', tags: ['modular'], minutes: 6, level: 2,
    summary: 'Four patches every synthesist knows, built step by step: why each knob sits where it does.',
    blocks: [
      { t: 'p', md: 'Most famous synth sounds are a handful of recipes. Learn them as starting points, then change one thing at a time.' },
      { t: 'synth', demo: SYNTH_BASS },
      { t: 'p', md: '**Bass**: mono (one voice), two oscillators an octave apart for weight, a 24 dB ladder for roundness, a filter envelope that snaps shut (short decay, low sustain) so each note "speaks". Separate amp and filter envelopes let the note sustain while the brightness dies.' },
      { t: 'synth', demo: BRASS },
      { t: 'p', md: '**Brass**: the "blat" is the filter opening a little after the note begins (filter attack 60–120 ms) then settling. Real brass gets brighter as it gets louder, so velocity → cutoff helps too.' },
      { t: 'synth', demo: PAD },
      { t: 'p', md: '**Lead**: mono with glide, two oscillators a 5th or octave apart, a brighter filter with some resonance, a delayed vibrato on the mod wheel, and a delay for space. Leads sit in the midrange, so cut lows the bass already owns (a high-pass or simply less sub).' },
      { t: 'example', title: 'From bass to lead in four moves', steps: [
        'Start from the bass. Raise both oscillators two octaves and set the second a 5th up (Tune +7).',
        'Open the filter (cutoff 900 Hz), resonance 0.4, lower the envelope amount: less pluck, more sustain.',
        'Glide 0.08 s in mono; patch the mod wheel to a vibrato VCA. Add a delay at a dotted 8th. Same modules, a different instrument.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'modular.poly', title: 'Polyphony, stereo & space', tags: ['modular'], minutes: 5, level: 2,
    summary: 'Voices on a poly cable, per-voice randomness, chorus, delay and reverb, and where effects go in the chain.',
    blocks: [
      { t: 'p', md: 'A hardware modular is usually **monophonic**: one oscillator, one note. Here the MIDI module\'s **Voices** knob makes every cable downstream carry up to eight voices at once: each module runs one copy per voice, so in a chord each note keeps its own envelope and filter. Mono sources (an LFO, a clock) feed every voice the same; per-voice sources (velocity, the Rand module) differ voice to voice.' },
      { t: 'table', head: ['Setting', 'Behaviour', 'Use'], rows: [
        ['1 voice', 'last note wins; overlaps slide (legato)', 'bass, leads'],
        ['2–4 voices', 'chords, oldest note stolen', 'comping, brass sections'],
        ['6–8 voices', 'long releases overlap', 'pads, strings'],
      ] },
      { t: 'p', md: '**Effects order.** Classic signal flow: source → filter → amp (the voice) → modulation effects (chorus, phaser) → delay → reverb → out. Distortion before the filter is warm and tamed; after it, raw. Delay before reverb keeps echoes distinct; the reverb last puts everything in one room. **Chorus** is a short, modulated delay mixed with the dry signal: the pitch wobble of its copy imitates several players slightly out of tune, and its two outputs differ, which widens the sound into stereo.' },
      { t: 'synth', demo: STEREO_PAD },
      { t: 'p', md: '**Delay** repeats the sound after a time, and **feedback** sends each echo back in. Sync it to the tempo: a quarter note at 120 BPM is 0.5 s, a dotted 8th 0.375 s (the U2 guitar trick: echoes fall between the notes). Darken the repeats (Tone) so they sit behind the dry sound. **Reverb** is thousands of tiny echoes; size sets the tail, damping how fast the highs fade, as soft surfaces do.' },
      { t: 'synth', demo: ECHOES },
      { t: 'example', title: 'Make a chord breathe', steps: [
        'Four voices; Rand Smooth at a slow rate and a tiny amount → VCO FM: each voice drifts a few cents on its own, like an ensemble.',
        'Chorus after the VCA for width; reverb last, mix around 30%.',
        'Long release so chords overlap as you change them: the voices need to be free, so use 6 or 8.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'modular.westcoast', title: 'West coast: folding & low-pass gates', tags: ['modular'], minutes: 6, level: 3,
    summary: 'Building brightness up instead of filtering it down: wavefolders, the vactrol low-pass gate, and Buchla\'s idea of a voice.',
    blocks: [
      { t: 'p', md: '"East coast" synthesis (Moog) is **subtractive**: start bright, filter down. "West coast" (Don Buchla) is the reverse: start from a near-sine and **add** harmonics by bending the wave: wavefolding and FM. A **low-pass gate** replaces filter and VCA with one circuit that darkens as it quiets, the way struck and plucked objects do.' },
      { t: 'p', md: 'A **wavefolder** amplifies a wave and, wherever it would pass the limit, folds it back instead of clipping. Each fold adds a new kink, and kinks are harmonics. Gently driven it barely changes the sine; driven hard it gets glassy and metallic; moving the fold amount gives a timbral sweep no filter can make. **Bias** (an offset before folding) makes the folds lopsided and adds even harmonics.' },
      { t: 'synth', demo: FOLDER },
      { t: 'p', md: 'The **low-pass gate** uses a vactrol (an LED shining on a light-dependent resistor) to open a filter and a VCA together. The photocell responds slowly and unevenly, so a short **ping** opens it fast and lets it close with a natural, rounded decay: wood, marimba, a plucked rubber band. Louder is brighter, quieter is darker, which is how real objects behave and why LPG patches sound "acoustic".' },
      { t: 'synth', demo: LPG_PING },
      { t: 'table', head: ['Idea', 'East coast (Moog)', 'West coast (Buchla)'], rows: [
        ['Timbre', 'subtract: filter a rich wave', 'add: fold or FM a simple one'],
        ['Shaping', 'ADSR → VCF and VCA', 'pinged low-pass gate'],
        ['Controller', 'a keyboard', 'touch plates, sequencers, random sources'],
        ['Typical sound', 'fat bass, brass, leads', 'bongos, bells, plucked metal, evolving textures'],
      ] },
      { t: 'example', title: 'A west coast bongo', steps: [
        'Triangle VCO → Fold (around 3, a little bias) → LPG In; MIDI Trig → LPG Ping; LPG mode Both, decay about 0.3 s.',
        'Patch the LPG\'s output to OUT and play short notes: each is a struck, woody tone that darkens as it fades.',
        'Patch velocity → Fold CV so harder hits fold more: brighter and louder together.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'modular.audiorate', title: 'Audio-rate modulation: FM, ring mod & sync', tags: ['modular', 'fm'], minutes: 6, level: 3,
    summary: 'Speed an LFO up into the audio range and modulation becomes timbre: sidebands, ring modulation, hard sync.',
    blocks: [
      { t: 'p', md: 'Vibrato at 6 Hz is a pitch wobble. Speed the modulator up past about 30 Hz and you stop hearing a wobble: you hear new frequencies, **sidebands**, at the carrier ± multiples of the modulator. That is the bridge from modular to FM synthesis, and it works on any destination: pitch (FM), level (AM and ring modulation), the waveform\'s phase (sync).' },
      { t: 'synth', demo: AUDIO_FM },
      { t: 'p', md: 'Analogue VCO FM is usually **exponential**: the modulator moves pitch in octaves, so a symmetric wobble raises the average pitch and the note drifts sharp as the depth grows. **Linear** FM (and the phase modulation the DX7 uses) keeps the average pitch put, so deep FM stays in tune and can be played. The rack\'s FM Op module and the whole DX7 are built that way: see the FM synthesis lessons.' },
      { t: 'p', md: '**Ring modulation** multiplies two signals. The output has neither original frequency, only their sum and difference: a 440 Hz sine ringed with a 100 Hz sine gives 340 and 540 Hz. Harmonic ratios give hollow, bell-like tones; arbitrary ones give the clangorous metal of Daleks and sci-fi. **AM** (tremolo at audio rate) is the same with the carrier kept.' },
      { t: 'synth', demo: RING_MOD },
      { t: 'p', md: '**Hard sync**: the slave oscillator restarts its cycle every time the master starts one. The slave is forced to the master\'s pitch, but its own tuning now sets the waveform: tune it up and more of its cycles squeeze into each master cycle, so the timbre changes while the pitch stays. Sweeping the slave\'s pitch with an envelope is the classic "sync lead" scream.' },
      { t: 'synth', demo: HARD_SYNC },
      { t: 'example', title: 'Find a ring-mod bell', steps: [
        'Sine VCO → Ring In A; Ring Freq at about 2.76 times the note you will play (an inharmonic ratio, like a bell\'s partials).',
        'A pluck envelope on the VCA: instant attack, 1.5 s decay, no sustain.',
        'Sum and difference tones that are not harmonics of each other sound like struck metal; a little reverb finishes the bell.',
      ] },
    ],
    drills: [],
  },
];
