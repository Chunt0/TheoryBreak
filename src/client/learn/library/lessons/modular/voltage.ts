import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { BASIC_VOICE, NO_ENV } from './demos';

export const voltage: Lesson = {
  id: 'modular.voltage',
  title: 'Voltage, cables & the basic voice',
  tags: ['modular'],
  level: 1,
  summary: 'What a modular synth is: single-purpose modules joined by cables that carry audio and control voltage — and the five-module chain under nearly every patch.',
  blocks: [
    p('A **modular synthesizer** is a collection of separate, single-purpose circuits — an oscillator, a filter, an amplifier, an envelope, and so on — with nothing connected inside. You decide what controls what by **patching** cables between them. The idea goes back to the 1960s, to the systems Robert Moog and Don Buchla built; Moog\'s modular was the instrument on Wendy Carlos\'s *Switched-On Bach* (1968), the record that introduced synthesizers to millions of listeners. Since the late 1990s the modular format has had a huge revival, and the rack in this app is a software modular built on the same principles.'),
    p('Learning modular is learning synthesis from the inside. A keyboard synth hides its wiring; a modular makes you build it. This lesson covers the one idea everything rests on — voltage — and the basic chain of modules that nearly every patch starts from.'),

    h('Everything is voltage'),
    p('Every cable in a modular carries a **voltage**, a signal that rises and falls over time. Some voltages change thousands of times a second; feed one of those to a speaker and you hear it as sound. That is **audio**. Other voltages change slowly — over a fraction of a second, or several seconds — and you do not hear them directly. Instead, they move a setting for you, the way your hand would turn a knob. That is **control voltage**, or **CV**.'),
    p('Here is the crucial point: the jacks do not care which kind they get. A filter\'s cutoff input will respond to a slow LFO by sweeping gently up and down, and to an audio-rate oscillator by growling and buzzing. Any output can be patched into any input. That freedom is what makes modular synthesis so open-ended — and why a handful of simple modules can produce an almost unlimited range of sounds.'),

    h('The signals'),
    p('Although every signal is just a voltage, certain kinds of voltage have conventional jobs.'),
    table(['Signal', 'Range here', 'Means'], [
      ['Audio', '±5 V', 'the sound itself'],
      ['Pitch (V/Oct)', '1 V per octave, 0 V = middle C', '+1/12 V is a semitone up; add voltages to transpose'],
      ['Gate', '10 V while a key is held, else 0', 'note on / note off'],
      ['Trigger', 'a 2 ms spike', '"now": start a drum or an envelope'],
      ['Envelope, LFO', '0 to 10 V, ±5 V', 'shapes over time; repeating wobbles'],
    ]),
    p('**Pitch** uses a standard called **volt per octave**: every additional volt raises the pitch by an octave, so a twelfth of a volt is a semitone. A useful consequence is that voltages **add**: plug a keyboard and a sequencer into the same oscillator through a mixer, and the sequence plays transposed by whatever key you hold. **Gates** are on–off signals that stay high while a key is held — they tell modules when a note starts and how long it lasts. **Triggers** are brief spikes that simply say "now", ideal for starting drums and envelopes.'),

    h('The basic voice'),
    p('The classic way to make a sound on a modular is **subtractive synthesis**: start with a bright, harmonically rich tone and carve it into shape. It takes five modules plus an output.'),
    p('- **MIDI** turns your playing into voltages: a V/Oct pitch for each note, and a gate for as long as you hold the key.\n- The **VCO** (voltage-controlled oscillator) makes a bright, buzzy tone at the pitch the V/Oct voltage asks for.\n- The **VCF** (voltage-controlled filter) removes harmonics, darkening the tone. It shapes the colour of the sound.\n- The **VCA** (voltage-controlled amplifier) is a volume control turned by a voltage: no voltage, no sound.\n- The **ADSR** (envelope) produces a shape each time a gate arrives — rising, falling, holding, then fading when the key is released. Patched into the VCA, it opens and closes the sound with every note.'),
    p('It helps to see the patch as two separate paths. The **audio path** carries the sound: VCO → VCF → VCA → output. The **control path** carries the instructions: MIDI → VCO (which pitch), MIDI → ADSR (when the note starts and stops), ADSR → VCA (how loud, moment by moment). Everything else in synthesis is more of the same: one signal changing another over time.'),
    { t: 'synth', demo: BASIC_VOICE },
    p('Listen to the three versions above. The basic voice is a filtered saw wave, opened and closed by its envelope. Closing the filter down to 500 Hz removes most of the upper harmonics, and the same notes turn dark and muffled. Slowing the envelope makes each note swell in and fade out instead of starting and stopping crisply. Two knobs, two completely different characters.'),

    h('Why the envelope matters'),
    p('It is easy to forget how much work the envelope does. Take away the cable from the ADSR to the VCA, and the VCA has nothing telling it when to open and close. In this rack, a VCA with nothing on its control input simply passes the signal through — so the result is one endless tone that never starts or stops, only changes pitch as you play.'),
    { t: 'synth', demo: NO_ENV },
    p('That is why the envelope-to-VCA cable is the first one every patch needs. An oscillator makes a continuous tone; it is the envelope and the VCA, working together, that turn it into separate notes with a beginning, a middle and an end.'),
    example('Patch the basic voice from nothing', [
      'Add MIDI, VCO, VCF, ADSR, VCA and OUT.',
      'Audio: VCO Saw → VCF In, VCF LP → VCA In, VCA Out → OUT L and R.',
      'Control: MIDI V/Oct → VCO V/Oct, MIDI Gate → ADSR Gate, ADSR Env → VCA CV. Play: each key starts the envelope, which opens the VCA, which lets the filtered saw through.',
    ]),

    h('Reading a patch'),
    p('A modular patch can look like a tangle, but it reads logically once you know the conventions. **Outputs** send signals out; **inputs** receive them. One output can feed many inputs — the same envelope can open both the VCA and the filter — but each input takes only one cable. When you look at an unfamiliar patch, find the output module first and trace the audio path backwards to the oscillator; then look at what is plugged into the control inputs along the way. That tells you what makes the sound and what makes it move.'),
    tryIt('Open the rack\'s **INIT** patch and look: these are the cables of the basic voice. Tap any module\'s **?** for its manual. Outputs sit on dark plates, inputs are bare jacks. Try pulling the envelope cable out of the VCA and plugging it back in, and try moving the filter cutoff while you play.'),
    recap([
      'A modular synth is separate modules connected by patch cables; every cable carries a voltage.',
      'Fast-changing voltages are audio; slow ones are control voltage (CV); any output can feed any input.',
      'Pitch is 1 V per octave; gates say how long a note lasts; triggers say "now".',
      'The basic voice: MIDI → VCO → VCF → VCA → out, with an ADSR opening the VCA for each note.',
      'Audio path makes the sound; control path tells it what to do.',
    ]),
  ],
  drills: [],
};
