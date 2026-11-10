import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { LFO_DEST, MOD_WHEEL } from './demos';

export const mod: Lesson = {
  id: 'modular.mod',
  title: 'Modulation: LFOs, depth & destination',
  tags: ['modular'],
  level: 2,
  summary: 'Vibrato, tremolo, wah and PWM from one LFO; how depth is set with attenuators and VCAs; bipolar and unipolar sources; and envelopes, randomness and velocity as modulators.',
  blocks: [
    p('A sound that never changes quickly becomes lifeless. Real instruments are full of movement — a singer\'s vibrato, a violinist\'s swelling bow, a guitarist\'s tremolo — and synthesizers recreate that movement with **modulation**: using one signal to move a setting automatically, over and over, so your hands do not have to. Modulation is where a patch stops being a static tone and starts to breathe.'),

    h('Source, destination, depth'),
    p('Every modulation routing has three parts. The **source** is the signal doing the moving: an LFO, an envelope, a random generator, the velocity of your playing, the mod wheel. The **destination** is the setting being moved: pitch, filter cutoff, volume, pulse width, pan. And the **depth** is how far it moves. Learning to think in these three terms makes any patch easier to understand: for every cable going into a control input, ask what the source is, what it moves, and by how much.'),
    p('The workhorse source is the **LFO** — low-frequency oscillator. It is simply an oscillator running too slowly to hear, typically somewhere between once every few seconds and a dozen or so times a second. Instead of making a sound, it moves a knob back and forth in a steady cycle, and its waveform determines the character of the movement: a sine sweeps smoothly, a triangle evenly, a square jumps between two values, a saw rises and drops.'),

    h('One LFO, many effects'),
    p('The same LFO produces completely different effects depending on where you patch it.'),
    table(['LFO into', 'Effect', 'Typical rate'], [
      ['VCO FM (pitch)', 'vibrato', '5–7 Hz, small depth'],
      ['VCA CV (level)', 'tremolo', '4–8 Hz'],
      ['VCF CV (cutoff)', 'wah, filter sweep', '0.1–4 Hz'],
      ['VCO PWM', 'chorus-like shimmer', '0.2–2 Hz'],
      ['Pan CV', 'auto-pan', '0.1–1 Hz'],
    ]),
    p('Into the oscillator\'s pitch, a gentle LFO gives **vibrato**: around 5 to 7 cycles a second with a small depth sounds like a singer; faster and deeper sounds like a siren. Into the VCA, it gives **tremolo**, a pulsing in volume. Into the filter cutoff, it gives a rhythmic **wah** or a slow, evolving sweep. Into pulse width, it gives the shimmering PWM sound from the oscillator lesson.'),
    { t: 'synth', demo: LFO_DEST },
    p('In the demo, one LFO is patched to both the oscillator\'s pitch and the filter\'s cutoff, and each version turns up a different depth knob: first vibrato alone, then a slower wah on the filter, then a fast, deep pitch wobble.'),

    h('Depth is an attenuator'),
    p('How do you set the depth? Many destinations have their own CV knob next to the input — the VCO\'s FM knob, the VCF\'s CV knob — and that knob **is** the depth: it scales the incoming voltage before it moves the setting. Where there is no such knob, put the source through an **attenuator** first: a **Util** lane does the job, its gain setting acting as the depth (and a negative gain inverting the modulation, so a rising LFO pushes the setting down).'),
    p('Or put the source through a **VCA**. Because a VCA\'s level is itself controlled by a voltage, the depth of the modulation can now be modulated too. That is exactly how the **mod wheel** usually works: the LFO goes into a VCA, the VCA\'s output goes to the oscillator\'s pitch, and the mod wheel\'s voltage opens the VCA. Wheel down, no vibrato; wheel up, as much as you like.'),
    { t: 'synth', demo: MOD_WHEEL },
    p('In the demo, a Util stands in for the mod wheel at three positions — down, halfway and full — opening the VCA that lets the LFO through to the oscillator.'),

    h('Bipolar and unipolar'),
    p('Modulation sources come in two kinds. **Bipolar** sources, like LFOs (±5 V here), swing both above and below zero, so they move a setting both ways around where its knob is set — vibrato goes both sharp and flat. **Unipolar** sources, like envelopes (0 to 10 V), only push one way — an envelope on the filter can only open it further from the knob\'s position. A Util\'s **offset** control converts one into the other, by adding a fixed voltage. Knowing which kind of source you have explains a lot of puzzling results: if a filter sweep seems to go only half as far as you expected, the source may be bipolar, spending half its time pushing the cutoff down.'),

    h('Other modulators'),
    p('**Envelopes are modulators too**, and one of the most musical uses is a **delayed vibrato**: an envelope with a slow attack controlling the depth VCA, so that each long note starts straight and the vibrato blooms after a moment — exactly as singers and string players do it. Short notes stay clean; long ones come alive.'),
    p('**Random** sources — the **Rand** and **S&H** (sample-and-hold) modules — produce unpredictable voltages: slow drift that makes a patch feel organic, or stepped random values for the classic "computer bleeps" sound. And **velocity**, how hard each note is played, is a per-note modulator: patched to brightness and loudness, it makes a patch respond to your touch the way an acoustic instrument does.'),
    example('Patch a delayed vibrato', [
      'LFO Sine → VCA In; VCA Out → VCO FM; set the VCO FM knob small (about 0.01).',
      'Add a second ADSR with attack 0.8 s and sustain full, gated by MIDI Gate, and patch it to that VCA\'s CV.',
      'Short notes stay straight; long notes start straight and the vibrato fades in over the first second.',
    ]),
    tryIt('Patch one LFO into the VCO\'s FM input and set a gentle vibrato, then move the same cable to the VCF\'s CV and to the VCA\'s CV, and listen to how the effect changes. Try different LFO waveforms on the filter. Then build the delayed vibrato above and play long and short notes.'),
    recap([
      'Modulation = a source moving a destination by a depth; the LFO is the main source.',
      'The same LFO gives vibrato (pitch), tremolo (level), wah (cutoff) or shimmer (pulse width).',
      'Depth is set by the destination\'s CV knob, an attenuator (Util), or a VCA — which lets the mod wheel control it.',
      'Bipolar sources swing both ways around the knob; unipolar ones push one way; an offset converts between them.',
      'Envelopes (delayed vibrato), random sources and velocity are modulators too.',
    ]),
  ],
  drills: [],
};
