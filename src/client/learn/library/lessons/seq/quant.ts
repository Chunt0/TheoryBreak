import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { MODE_SWAP, S_H_SCALES } from './demos';

export const quant: Lesson = {
  id: 'seq.quant',
  title: 'Quantizers, scales & sample-and-hold',
  tags: ['seq', 'core'],
  level: 2,
  summary: 'Snapping any voltage to the notes of a scale: random melodies that stay in key, how the choice of scale changes the mood of the very same voltages, and the sample-and-hold that turns noise into notes.',
  blocks: [
    p('Voltages in a modular are continuous: an LFO glides smoothly through every value between its lowest and highest point, and a noise source jumps randomly anywhere in its range. Patch either of those straight into an oscillator\'s pitch and you get sirens and random chromatic bleeps, not melodies. To turn continuous voltages into music, you need a module that knows about scales. That module is the **quantizer**, and with it — and its frequent partner, the **sample-and-hold** — a modular can generate endless melodies that always stay in key.'),
    p('Quantizers are also a wonderful way to hear modes. Feed the same voltages through different scales and the music changes character completely, while the "shape" of the melody stays the same.'),

    h('The quantizer'),
    p('A **quantizer** takes any input voltage and moves it to the nearest note of a chosen scale. A voltage halfway between C and C♯ becomes one or the other; in a C major pentatonic scale, a voltage near F snaps to E or G, because F is not in the scale. The output is always a note of the scale, however wild the input.'),
    p('That means anything can become a melody: random voltages, LFOs, envelopes, even audio played very slowly. And a sequencer programmed in plain semitones can be forced into a mode, so you can write a line once and hear it in Dorian, Phrygian or Lydian at the turn of a knob. The quantizer\'s **Trig** output fires whenever the output note changes — a free gate signal that follows the melody, perfect for triggering an envelope on each new note.'),

    h('Sample-and-hold'),
    p('A **sample-and-hold** (S&H) does exactly what its name says. Each time it receives a clock pulse, it reads — samples — the voltage at its input, and holds that value at its output until the next pulse. Feed it a smoothly moving LFO and you get a staircase that follows the LFO\'s shape in steps. Feed it **noise**, which is a constantly random voltage, and every clock pulse grabs a new random value. That is the classic sound of random bleeps in vintage science-fiction soundtracks and in countless synth patches since.'),
    p('To make those random values into a usable melody, scale them first — a Util lane at a gain of about 0.3 turns the noise\'s ±5 V into roughly a 1.5-octave range either way — and then quantize them. The result is a stream of random notes, all within a chosen range and scale.'),
    { t: 'synth', demo: S_H_SCALES },
    p('In the demo, random voltages are sampled on 16ths and played on 8ths through a quantizer set to four scales in turn. Major pentatonic sounds sweet and untroubled; Dorian sounds modal and cool; whole tone floats without a home; and with no quantizing at all, the chromatic result sounds atonal and alien.'),
    table(['Scale', 'Feel over random notes'], [
      ['Major / minor pentatonic', 'no half steps: nothing can clash, always "pretty"'],
      ['Dorian, Mixolydian', 'modal, funky: one bright note each'],
      ['Harmonic minor', 'exotic: the augmented 2nd'],
      ['Whole tone', 'floating, dreamlike: no tonic'],
      ['Chromatic', 'every semitone: atonal, sci-fi'],
    ]),
    p('The table explains why pentatonic scales are so popular for generative patches: with no half steps, no two notes can clash, so random melodies always sound pleasant. Richer scales bring more character and more risk.'),

    h('One line, many modes'),
    p('A quantizer has two main controls: its **root**, which sets the tonic, and its **scale**, which sets which notes are allowed. Changing the root transposes the music. Changing the scale **reharmonises** it — the melody keeps its contour, but each note snaps to a different set of pitches, so the mood changes. With a second sequencer driving the root, the rack can even play its own chord changes, moving the whole quantized melody from key to key.'),
    { t: 'synth', demo: MODE_SWAP },
    p('In the demo, a chromatic climb from D — every semitone for 16 steps — is quantized to D Dorian, D Phrygian and D Lydian. The input voltages never change. Each mode keeps its own notes, and the steps in between snap to a neighbour, so you hear three different scales emerge from the same rising line. It is a vivid way to hear the characteristic notes from the modes lesson: the bright 6th of Dorian, the dark ♭2 of Phrygian, the raised 4th of Lydian.'),
    example('A generative melody in a key', [
      'Noise → S&H (clocked by 16ths) → Util (gain 0.3) → Quant (root A, minor pentatonic) → VCO.',
      'Gate the envelope from 8ths, not 16ths: half the samples are never heard, so phrases feel less busy.',
      'Add a delay at a dotted 8th. Every bar is new, and every note is in A minor pentatonic.',
    ]),
    tryIt('Build the generative melody above, then change the quantizer\'s scale while it runs and listen to the mood shift. Try changing the root too. Then patch a slow triangle LFO into the S&H instead of noise and hear the random notes turn into rising and falling scale runs.'),
    recap([
      'A quantizer snaps any voltage to the nearest note of a chosen scale; its Trig output fires on each new note.',
      'A sample-and-hold grabs its input on each clock and holds it; with noise in, it makes random values.',
      'Scale random voltages to a sensible range, then quantize them for random melodies that stay in key.',
      'Pentatonic scales never clash; modes add character; chromatic sounds atonal.',
      'The quantizer\'s root transposes; its scale reharmonises the same voltages.',
    ]),
  ],
  drills: [],
};
