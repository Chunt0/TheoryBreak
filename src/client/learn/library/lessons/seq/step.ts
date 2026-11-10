import type { Lesson } from '../../types';
import { example, h, p, recap, tryIt } from '../blocks';
import { SEQ_LINE, TRANSPOSE } from './demos';

export const step: Lesson = {
  id: 'seq.step',
  title: 'The step sequencer',
  tags: ['seq'],
  level: 1,
  summary: 'Sixteen steps of pitch and gates: how a step sequencer works, how to write a bass line that grooves, and how to transpose a running sequence from the keyboard.',
  blocks: [
    p('The **step sequencer** is one of the oldest ideas in electronic music. Early analogue sequencers had a row of knobs, one per step, and a light that moved along them in time with a clock; each knob set the pitch of its step. The sound of a repeating sequenced bass line — from 1970s electronic music through Giorgio Moroder\'s disco productions to techno and acid house — is one of the defining sounds of the synthesizer. This lesson explains how a step sequencer works and how to write sequences that sound musical rather than mechanical.'),

    h('How it works'),
    p('A step sequencer holds a row of values and moves forward **one step for every clock pulse** it receives. At each step it sends out two signals: a **pitch** voltage (V/Oct), telling an oscillator which note to play, and — if that step is switched on — a **gate**, telling an envelope to play it. Steps that are switched off are **rests**: the sequencer still moves through them in time, but no note sounds.'),
    p('The rack\'s sequencer has 16 steps in two banks of eight. Each step\'s pitch is set in semitones, from 12 below to 12 above the oscillator\'s own pitch. The **length** control sets how many steps it plays before looping back to the first, so the same sequencer can play a one-bar, two-bar or odd-length pattern.'),
    { t: 'synth', demo: SEQ_LINE },
    p('In the demo, a two-bar bass line in the minor pentatonic plays in 8th notes, first with every step sounding. Then some steps are switched to rests, and the line immediately starts to groove — the silences give it shape. Finally the length is cut to 8, so only the first bar loops.'),

    h('Writing sequences that groove'),
    p('A sequencer will play anything you give it with perfect regularity, which is both its strength and its danger: a line with a note on every step at the same volume quickly sounds robotic. The cure is to write like a bass player. The funk bass lesson\'s principles apply directly:'),
    p('- Put the **root on the downbeat**, so the line is anchored.\n- Use **octave jumps** for bounce.\n- Use the **♭7 and the 5th** as passing notes.\n- Use **rests**, so the line breathes and the notes that remain have impact.'),
    p('**Accent** and **timbre** take it further. Patch the sequencer\'s gate to a filter envelope as well as the amplifier, and every note gets its own little "speak". Patch a slow LFO to the filter cutoff, and the line evolves over many bars while the notes stay exactly the same. A great deal of electronic music consists of a simple sequence whose timbre is constantly being changed by hand or by modulation.'),
    example('Program a funk bass line', [
      'Clock 16ths → Seq Clock, Length 16; VCO two octaves down through a ladder filter.',
      'Light steps 1, 4, 7, 11 and 15; leave the rest dark. Pitches: 0 on step 1, 12 on step 4 (an octave pop), 10 on step 7, 7 on step 11, 5 on step 15.',
      'A short filter envelope (decay 0.15 s) gives each note a snap. Add Bar → Reset so that the One stays the One.',
    ]),

    h('Transposing a running sequence'),
    p('Remember that pitch voltages **add**. Mix the sequencer\'s pitch output with the MIDI module\'s V/Oct output — two inputs of a Mix module at full level — and send the sum to the oscillator. Now the sequence keeps running, and the keyboard transposes it: hold E and the whole line plays from E; hold A and it moves to A. This is how a sequenced part can follow a chord progression while you play only the roots.'),
    p('Run the sum through a **quantizer** before the oscillator and the line will stay within a chosen scale, even when the keyboard note would otherwise push some steps outside it. The factory **DORIAN SEQ** rack is built exactly this way.'),
    { t: 'synth', demo: TRANSPOSE },
    p('In the demo, a steady voltage stands in for a held key. The same 8-step figure plays in C, then up a 4th (5/12 of a volt added), then down a whole tone (2/12 subtracted). The pattern is unchanged; only its starting pitch moves.'),

    h('Reset'),
    p('A sequencer does not know where the bar line is; it simply counts pulses. If it misses one — or if you change its length while it runs — it drifts out of phase with the rest of the rack, and step 1 no longer lands on beat 1. The fix is to patch the clock\'s **Bar** output into the sequencer\'s **Reset** input. At the start of every bar it jumps back to step 1, so the first note of the pattern always falls on the downbeat.'),
    tryIt('Open the factory DORIAN SEQ rack and play different keys to transpose it. Then build your own: clock 8ths into a sequencer, a two-bar line using only the root, octave, ♭7 and 5th, with a few rests. Add a filter envelope for snap and a slow LFO on the cutoff, and patch Bar → Reset.'),
    recap([
      'A step sequencer advances one step per clock pulse, sending each step\'s pitch and, if lit, a gate.',
      'Dark steps are rests; length sets how many steps loop.',
      'Write like a bass player: root on the downbeat, octaves, ♭7 and 5th, and rests.',
      'Filter envelopes and slow modulation give a fixed sequence accent and evolution.',
      'Add the keyboard\'s V/Oct to transpose a running line; quantize to stay in a scale; patch Bar → Reset to keep step 1 on beat 1.',
    ]),
  ],
  drills: [],
};
