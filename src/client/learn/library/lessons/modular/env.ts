import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { ADSR, FILTER_ENV, VCA_RESP } from './demos';

export const env: Lesson = {
  id: 'modular.env',
  title: 'Envelopes & VCAs',
  tags: ['modular'],
  level: 1,
  summary: 'Attack, decay, sustain and release; gates versus triggers; one envelope on loudness and brightness at once; and why the shape of a VCA\'s response changes how natural a note sounds.',
  blocks: [
    p('Play a note on a piano and it starts with a sharp strike and slowly fades. Play the same note on an organ and it starts instantly, holds steadily and stops the moment you let go. A violin can swell in gradually. These differences in how a sound changes over time are as important to its identity as its timbre — often more so. Played backwards, a piano note is barely recognisable.'),
    p('On a synthesizer, the module that shapes a sound over time is the **envelope generator**, and the module it usually controls is the **VCA**. Together they turn a continuous tone into notes with character.'),

    h('Attack, decay, sustain, release'),
    p('The most common envelope is the **ADSR**, named after its four stages. When a gate arrives — when you press a key — it begins.'),
    p('- **Attack** is the time it takes to rise from silence to full level. A short attack gives a sharp, percussive start; a long one gives a gradual swell.\n- **Decay** is the time it takes to fall from the peak to the sustain level.\n- **Sustain** is the level held for as long as the key stays down. Note that sustain is a **level**, not a time: the other three stages are durations.\n- **Release** is the time it takes to fade to silence after the key is released.'),
    p('Patched into a VCA, the envelope\'s shape becomes the note\'s **loudness** over time. Patched into a filter\'s control input, it becomes the note\'s **brightness** over time. Most acoustic instruments get louder and brighter together — a plucked string is brightest at the moment of the pluck and mellows as it fades — so one envelope often drives both.'),
    table(['Sound', 'A', 'D', 'S', 'R'], [
      ['Organ', '0', '0', 'full', 'short'],
      ['Pluck, piano', 'instant', 'long', '0', 'short to medium'],
      ['Brass', 'medium (50–100 ms)', 'short', 'high', 'short'],
      ['Pad, strings', 'slow (0.5–2 s)', '—', 'full', 'slow'],
      ['Percussion', 'instant', 'short', '0', '= decay'],
    ]),
    { t: 'synth', demo: ADSR },
    p('The demo plays the same tone through four envelopes. Listen especially to the beginning and end of each note: the organ starts and stops instantly; the pluck dies away even while the key is held, because its sustain is zero; the brass swells in slightly and holds; the pad fades in slowly and lingers after release.'),

    h('The filter envelope'),
    p('Patching an envelope into the filter is the most expressive single cable in subtractive synthesis. The filter\'s CV knob sets how far the envelope opens the cutoff — in this rack, 0.5 means five octaves at the envelope\'s 10 V peak. Start with a low base cutoff, so that the filter is mostly closed, and let the envelope open it with each note.'),
    p('With a fast attack and a quick decay, each note starts bright and immediately darkens — the "pew" or "wow" of a classic synth bass. With a slower attack, the filter opens more gradually than the volume does, and the note blares open a moment after it starts — the swell of synth brass. The relationship between the filter envelope and the amplitude envelope is one of the main things that gives a patch its personality.'),
    { t: 'synth', demo: FILTER_ENV },
    p('In the demo, one ADSR drives both the VCA and the cutoff. A smaller envelope amount makes the effect subtler; a slow attack turns the same patch into brass.'),

    h('Gates, triggers and retriggering'),
    p('A **gate** lasts as long as the key is held, which is what tells an ADSR when to move into its release stage. A **trigger**, by contrast, is a brief spike with no length. Envelopes started by triggers — usually simple **AD** (attack–decay) shapes — run to completion on their own, regardless of how long anything is held. That suits drums and plucks, and the **Func** module in one-shot mode works this way.'),
    p('What happens when a new note arrives while the envelope is still active? In **multi-trigger** mode, the envelope restarts its attack for each new note, so every note gets a fresh start. In **single-trigger** (legato) mode, overlapping notes do not restart it; the envelope simply continues. The MIDI module\'s mono mode uses this to slide smoothly between overlapping notes without re-articulating each one — the classic legato lead sound.'),

    h('VCA response'),
    p('A VCA can respond to its control voltage in two ways. A **linear** VCA turns the voltage into volume evenly: half the voltage, half the amplitude. An **exponential** VCA stays quieter for longer at low voltages and rises steeply near the top.'),
    p('This matters because human hearing perceives loudness roughly logarithmically. Through an exponential VCA, an envelope\'s decay sounds natural and even, and plucks sound short and dry. Through a linear VCA, the same decay seems to hang on longer and the sound feels fuller and more sustained. Neither is better; they are different colours. The VCA\'s **Resp** knob switches between them.'),
    { t: 'synth', demo: VCA_RESP },
    example('Design a pluck', [
      'Attack 0, decay 0.5 s, sustain 0, release 0.3 s: the note dies even if you hold the key.',
      'Patch the envelope to the filter too, with a low base cutoff (200 Hz) and an amount of 0.4: each note starts bright and darkens as it dies, like a string.',
      'Use an exponential VCA for a dry, short tail, and patch MIDI Vel → filter CV (through a Mix) so that harder notes start brighter.',
    ]),
    tryIt('Patch the basic voice and play the same phrase with the four envelope shapes in the table. Then add a second cable from the ADSR to the filter\'s CV input, lower the base cutoff, and raise the CV amount until each note "wows". Try switching the VCA\'s response between linear and exponential on a pluck.'),
    recap([
      'An ADSR envelope has attack, decay and release times and a sustain level; a gate starts it.',
      'Into a VCA it shapes loudness; into a filter, brightness. One envelope often drives both.',
      'A filter envelope with a low base cutoff gives synth basses their "wow" and brass its swell.',
      'Triggers start envelopes that run on their own; multi- and single-trigger modes decide what overlapping notes do.',
      'Exponential VCAs make decays sound natural and short; linear VCAs sound fuller and longer.',
    ]),
  ],
  drills: [],
};
