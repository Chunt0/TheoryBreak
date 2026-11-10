import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { ECHOES, STEREO_PAD } from './demos';

export const poly: Lesson = {
  id: 'modular.poly',
  title: 'Polyphony, stereo & space',
  tags: ['modular'],
  level: 2,
  summary: 'Voices on a poly cable and what each voice gets of its own, per-voice drift, chorus for width, delay and reverb for space — and where each effect belongs in the chain.',
  blocks: [
    p('A single oscillator through a filter and VCA plays one note at a time. That is how most hardware modular systems work, and it is perfect for bass lines and leads. But chords, pads and string sounds need several notes at once, and almost every finished synth sound also needs **space** — the width, echoes and ambience that place it in a room rather than leaving it dry and close. This lesson covers both: how the rack plays several voices, and how chorus, delay and reverb turn a voice into a finished sound.'),

    h('Voices'),
    p('A sound that can play several notes at once is **polyphonic**, and each simultaneous note is a **voice**. In this rack, the MIDI module\'s **Voices** knob sets how many: every cable downstream of it can carry up to eight voices at once, and each module runs one copy of itself per voice. In a chord, every note therefore has its own oscillator, its own envelope and its own filter, behaving independently — a note you play harder can be brighter, a note you release first fades first.'),
    p('Some sources are shared and some are per-voice. A single LFO or a clock feeds every voice the same signal, so a filter wobble moves all the notes of a chord together. Per-voice sources — velocity, or the **Rand** module — give each voice its own value, so each note can behave slightly differently.'),
    table(['Setting', 'Behaviour', 'Use'], [
      ['1 voice', 'last note wins; overlapping notes slide (legato)', 'bass, leads'],
      ['2–4 voices', 'chords; the oldest note is stolen when you run out', 'comping, brass sections'],
      ['6–8 voices', 'long releases can overlap', 'pads, strings'],
    ]),
    p('When every voice is in use and you play another note, one has to be taken away — usually the oldest. This is called **voice stealing**. Pads with long release times need more voices than you might expect, because each chord is still fading while you play the next.'),

    h('The order of the chain'),
    p('Effects come after the voice, and their order matters. The classic signal flow is: **source → filter → amplifier** (together, the voice), then **modulation effects** such as chorus and phaser, then **delay**, then **reverb**, then the output. The logic is to go from the sound itself, to its colour and width, to its echoes, to the room it sits in.'),
    p('There are good reasons for the conventions. **Distortion** before the filter is warm and tamed, because the filter smooths away its harshest harmonics; after the filter it is raw and aggressive. **Delay** before reverb keeps each echo distinct and lets the reverb blend them into the same space; reverb before delay would produce echoes of a whole reverberant room, which smears quickly. **Reverb** last puts everything — the sound and its echoes — in one room.'),

    h('Chorus: width'),
    p('**Chorus** imitates the effect of several players performing the same part, never perfectly in tune or in time with each other. It works by mixing the dry signal with a copy that is delayed by a few milliseconds, where the delay time is slowly modulated by an LFO. The changing delay makes the copy\'s pitch wobble slightly, and the interplay between the copy and the original produces a rich, shimmering thickening. Stereo chorus sends differently modulated copies to the left and right outputs, which spreads the sound out across the stereo field.'),
    { t: 'synth', demo: STEREO_PAD },
    p('In the demo, a four-voice saw chord is heard dry, then with chorus, then with chorus and reverb. Listen on headphones to hear the width grow.'),

    h('Delay: echoes in time'),
    p('A **delay** repeats the sound after a set time; **feedback** sends each echo back into the delay, so that it repeats again, quieter each time. A delay set to a rhythmic value of the song\'s tempo adds movement without clutter. At 120 BPM a quarter note is 0.5 seconds; a **dotted 8th** is 0.375 seconds, which places the echoes between the notes of a steady 8th-note part — the rhythmic delay technique made famous by U2\'s guitarist, the Edge. Darkening the repeats with the delay\'s tone control helps them sit behind the dry sound rather than competing with it.'),
    { t: 'synth', demo: ECHOES },
    p('In the demo, plucks a quarter note apart at 120 BPM pass through a dotted-8th delay: the echoes land between the notes and fill out the rhythm. Then the delay switches to a quarter note, landing on the beats, and then the feedback is raised high, so the echoes pile up.'),

    h('Reverb: the room'),
    p('**Reverb** simulates the thousands of reflections that a sound produces in a real space, blending into a smooth tail. Its **size** sets how long the tail lasts — a small room, a hall, a cathedral — and its **damping** sets how quickly the high frequencies fade, as they do in a room with soft surfaces. A little reverb makes a dry synth sound like it is in a real place; a lot pushes it into the distance. Reverb is usually mixed in with the dry signal rather than replacing it.'),
    example('Make a chord breathe', [
      'Four voices; Rand Smooth at a slow rate and a tiny amount → VCO FM: each voice drifts a few cents on its own, like an ensemble.',
      'Chorus after the VCA for width; reverb last, with the mix around 30%.',
      'A long release so that chords overlap as you change them — the voices need to be free, so use 6 or 8.',
    ]),
    tryIt('Set the MIDI module to 4 voices and play chords through the basic voice. Then add a chorus after the VCA, a delay at a dotted 8th, and a reverb last. Try swapping the order of the delay and reverb and listen to the difference. Finally, add per-voice drift with the Rand module.'),
    recap([
      'The MIDI module\'s Voices knob makes every cable carry up to eight voices; each note gets its own modules.',
      'Shared sources (LFOs) move all voices together; per-voice sources (velocity, Rand) differ by note.',
      'Classic chain: source → filter → amp → chorus/phaser → delay → reverb → out.',
      'Chorus thickens and widens; delay repeats in time (sync it to the tempo); reverb places the sound in a room.',
      'Pads need more voices than you think, because long releases overlap.',
    ]),
  ],
  drills: [],
};
