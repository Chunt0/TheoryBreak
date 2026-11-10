import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { BRASS, PAD, SYNTH_BASS } from './demos';

export const classic: Lesson = {
  id: 'modular.classic',
  title: 'Classic patches: bass, lead, brass, pad',
  tags: ['modular'],
  level: 2,
  summary: 'Four recipes every synthesist knows, built from the basic voice — and why each knob sits where it does. Learn them as starting points, then change one thing at a time.',
  blocks: [
    p('Most famous synthesizer sounds turn out to be variations on a handful of recipes. A fat bass, a singing lead, blaring brass and a lush pad can all be built from the modules you already know — oscillators, a filter, envelopes, a VCA and a little modulation. What distinguishes them is a set of choices: how many voices, which waveforms, how the filter and envelopes are set, and how much movement is added.'),
    p('This lesson builds the four classics, explaining the reasoning behind each choice. Once you understand why a bass is set up the way it is, you can design your own variations deliberately rather than by accident.'),

    h('Bass'),
    p('The classic synth bass descends from the Minimoog of the early 1970s, and its recipe is simple. It is **monophonic** — one note at a time — so lines stay clean. It uses **two oscillators an octave apart**, usually a saw with a square or saw an octave below, for weight and depth. It runs through a **24 dB ladder filter** for a round, fat tone. And its **filter envelope snaps shut**: a fast attack, a short decay and a low sustain, so that each note begins bright and immediately darkens. That quick "pew" is what makes each note speak clearly, even in a dense mix.'),
    p('Using separate envelopes for the amplifier and the filter is important. The amp envelope can sustain while the key is held, keeping the note\'s body, while the filter envelope closes quickly, so the brightness dies away and the bass sits underneath everything else.'),
    { t: 'synth', demo: SYNTH_BASS },
    p('Listen to the three versions. The basic bass is round and punchy. Adding resonance and more filter envelope gives a more vocal, squelchy character — the direction of acid bass lines. Adding **glide** (portamento) makes the pitch slide smoothly between notes, a classic expressive touch on mono synths.'),

    h('Brass'),
    p('Synth brass imitates the "blat" of a brass section: a note that starts a little dull and then opens up brightly. The trick is that the **filter envelope\'s attack is slower than the amplifier\'s** — typically 60 to 120 milliseconds — so the note sounds at once but its brightness arrives a moment later, then settles to a sustained level. Two slightly **detuned saws** give the width of several players.'),
    p('Real brass instruments get brighter as they get louder, so patching **velocity** to the filter cutoff adds a lot of realism: harder notes blare, softer ones stay mellow.'),
    { t: 'synth', demo: BRASS },
    p('Compare the brass patch with the version that has a fast filter attack: without the delayed opening, it loses its characteristic swell and sounds more like a plain bright pad.'),

    h('Pad'),
    p('A pad is a sustained, enveloping background sound. It is **polyphonic** — several voices, so you can hold chords — with **slow attack and release** times, so chords fade in gently and linger after you let go. Its oscillators are chosen for movement and width: a **PWM** square and a **detuned saw** together produce a constantly shifting, chorused texture. The filter is usually fairly soft, taking off the harshest highs, and a delay or reverb adds space.'),
    { t: 'synth', demo: PAD },
    p('Switch off the PWM and the detune in the demo and listen to what is lost: the same notes become static and flat. Pads depend almost entirely on movement.'),

    h('Lead'),
    p('A lead is a solo voice, designed to sing out over everything else. Like the bass it is **mono with glide**, but it lives higher. Two oscillators are often tuned **a 5th or an octave apart** for a thick, cutting tone. The filter is set **brighter**, with some resonance for edge, and with less envelope pluck so notes sustain. A **delayed vibrato** on the mod wheel adds expression, and a **delay** set to a rhythmic value gives space and size. Leads sit in the midrange, so they should not compete with the bass: cut the low end the bass already owns.'),
    example('From bass to lead in four moves', [
      'Start from the bass. Raise both oscillators two octaves and set the second a 5th up (Tune +7).',
      'Open the filter (cutoff 900 Hz), set resonance 0.4, and lower the envelope amount: less pluck, more sustain.',
      'Set glide to 0.08 s in mono, and patch the mod wheel to a vibrato VCA.',
      'Add a delay at a dotted 8th. Same modules, a different instrument.',
    ]),
    table(['Patch', 'Voices', 'Oscillators', 'Filter', 'Envelopes', 'Extras'], [
      ['Bass', 'mono', 'saw + octave below', '24 dB ladder, low cutoff', 'filter snaps shut; amp sustains', 'glide, resonance for squelch'],
      ['Brass', 'poly', 'two detuned saws', '12 or 24 dB, moderate', 'filter attack slower than amp', 'velocity → cutoff'],
      ['Pad', 'poly', 'PWM square + detuned saw', 'soft low-pass', 'slow attack and release', 'delay or reverb'],
      ['Lead', 'mono', 'two oscillators a 5th or octave apart', 'brighter, some resonance', 'less pluck, more sustain', 'glide, delayed vibrato, delay'],
    ]),

    h('Working from recipes'),
    p('The value of these recipes is not that you should always use them, but that they give you a reliable starting point. When you hear a synth sound you like, ask which recipe it is closest to, start there, and change **one thing at a time** — a different waveform, a slower filter attack, more resonance — listening to what each change does. That habit, more than any single patch, is what makes a good sound designer.'),
    tryIt('Load the bass demo into the rack and change one knob at a time: the filter decay, the resonance, the glide, the second oscillator\'s octave. Then turn it into a lead using the four moves above. Finally, build a pad from scratch with four voices, a PWM square and a detuned saw, and compare it with the demo.'),
    recap([
      'Bass: mono, two oscillators an octave apart, a 24 dB ladder, a filter envelope that snaps shut.',
      'Brass: detuned saws, and a filter attack slower than the amp attack for the "blat"; velocity to cutoff.',
      'Pad: poly, PWM and detune for movement, slow attack and release, soft filter, space.',
      'Lead: mono with glide, oscillators a 5th or octave apart, a brighter filter, delayed vibrato and delay.',
      'Use recipes as starting points and change one thing at a time.',
    ]),
  ],
  drills: [],
};
