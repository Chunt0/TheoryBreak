import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { FOLDER, LPG_PING } from './demos';

export const westcoast: Lesson = {
  id: 'modular.westcoast',
  title: 'West coast: folding & low-pass gates',
  tags: ['modular'],
  level: 3,
  summary: 'Building brightness up instead of filtering it down: the wavefolder, the vactrol low-pass gate, and Don Buchla\'s different idea of what a synthesizer voice should be.',
  blocks: [
    p('In the 1960s, two pioneers built modular synthesizers on opposite sides of the United States, and they had very different ideas. On the east coast, Robert Moog built instruments around subtractive synthesis and a conventional keyboard. On the west coast, in California, Don Buchla built instruments that rejected the keyboard as the primary controller and approached sound from the opposite direction. The two schools are still called **east coast** and **west coast** synthesis, and the west coast tools — the wavefolder and the low-pass gate — produce sounds that subtractive synthesis cannot.'),

    h('Adding rather than subtracting'),
    p('East coast synthesis, everything in the previous lessons, is **subtractive**: start with a bright, harmonically rich wave and filter it down. West coast synthesis reverses the process. It starts from a simple wave, often close to a sine, and **adds** harmonics by bending its shape — through **wavefolding** and frequency modulation. Instead of a filter and a VCA, it shapes each note with a **low-pass gate**, a single circuit that darkens a sound as it gets quieter. The results tend to sound less like a classic synth and more like struck, plucked or blown objects: wood, metal, glass, rubber.'),

    h('The wavefolder'),
    p('A **wavefolder** amplifies a waveform, and wherever the amplified wave would go past a limit, it folds it back instead of flattening it off. Imagine a sine wave growing taller and taller: each time a peak reaches the ceiling, it bends back down; drive it harder and the folded part reaches the floor and folds back up again. Each fold adds a new kink to the wave\'s shape, and every kink means new harmonics.'),
    p('Driven gently, a folder barely changes a sine. Driven harder, it adds more and more harmonics, and the tone becomes glassy, metallic and complex. The real magic comes when you **move** the fold amount, with an envelope or an LFO: the harmonics shift and ripple in a way that sounds quite unlike a filter sweep — more like a sound changing its very material. A **bias** control, which offsets the wave before folding, makes the folds lopsided and adds even harmonics for further variety.'),
    { t: 'synth', demo: FOLDER },
    p('In the demo, a sine passes through the folder at increasing settings, then with bias added. Watch the waveform display grow folds and the spectrum fill in with harmonics as the fold amount rises.'),

    h('The low-pass gate'),
    p('The **low-pass gate** (LPG) combines a filter and a VCA in one circuit that opens and closes them together. Buchla\'s classic design used a **vactrol**: a small light — an LED or lamp — shining on a light-dependent resistor. The control voltage lights the lamp, and the brighter the light, the more the gate opens.'),
    p('What makes the vactrol special is that the photocell responds slowly and unevenly. Hit the gate with a short **ping** — a trigger — and it opens almost instantly, then closes with a natural, rounded decay that no ordinary envelope quite matches. And because the filter and the amplifier move together, the sound gets **darker as it gets quieter**. That is exactly how real objects behave: a struck marimba bar or a plucked string is brightest at the moment of impact and mellows as it fades. This is why LPG patches sound so "acoustic".'),
    { t: 'synth', demo: LPG_PING },
    p('In the demo, a folded triangle is struck by triggers into the LPG. With a 0.6-second decay it rings like a wooden bar; with a shorter decay it becomes a dry tap. In VCA-only mode the filtering is switched off, so the brightness no longer follows the level — listen to how much less natural the decay sounds.'),
    table(['Idea', 'East coast (Moog)', 'West coast (Buchla)'], [
      ['Timbre', 'subtract: filter a rich wave', 'add: fold or FM a simple one'],
      ['Shaping', 'ADSR → VCF and VCA', 'a pinged low-pass gate'],
      ['Controller', 'a keyboard', 'touch plates, sequencers, random sources'],
      ['Typical sound', 'fat bass, brass, leads', 'bongos, bells, plucked metal, evolving textures'],
    ]),

    h('A different idea of an instrument'),
    p('Buchla\'s instruments were designed less for playing familiar music on a keyboard and more for exploring sound and composing with it: touch-sensitive plates instead of keys, sequencers, random voltage sources and complex modulation. West coast patches often evolve on their own, driven by sequences and random changes, rather than being played note by note. You do not need to adopt that whole philosophy to use its tools — a folder and an LPG fit happily into any patch — but it is worth knowing that they come from a different way of thinking about what a synthesizer is for.'),
    example('A west coast bongo', [
      'Triangle VCO → Fold (around 3, a little bias) → LPG In; MIDI Trig → LPG Ping; LPG mode Both, decay about 0.3 s.',
      'Patch the LPG\'s output to OUT and play short notes: each one is a struck, woody tone that darkens as it fades.',
      'Patch velocity → Fold CV so harder hits fold more: brighter and louder together.',
    ]),
    tryIt('Patch a sine VCO into the folder and slowly turn up the fold amount while holding a note, watching the waveform. Then patch an LFO to the fold CV for a moving timbre. Finally, build the bongo above, and try changing the LPG decay and the oscillator pitch to find a marimba, a woodblock and a plucked string.'),
    recap([
      'East coast (Moog) subtracts harmonics with a filter; west coast (Buchla) adds them by folding or FM.',
      'A wavefolder folds a wave back at its limits; each fold adds harmonics; moving the fold amount reshapes the timbre.',
      'A low-pass gate opens a filter and VCA together; its vactrol gives a natural, rounded decay.',
      'Because an LPG gets darker as it gets quieter, pinged patches sound like struck or plucked objects.',
      'Buchla\'s instruments favoured touch plates, sequencers and random sources over the keyboard.',
    ]),
  ],
  drills: [],
};
