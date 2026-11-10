import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { CLOCK_BLEEP, ONE_CLOCK } from './demos';

export const clock: Lesson = {
  id: 'seq.clock',
  title: 'Clocks, gates & triggers',
  tags: ['seq'],
  level: 1,
  summary: 'A metronome made of voltages: clock outputs at different speeds, why gate length matters, and the rule that one clock should run the whole rack.',
  blocks: [
    p('When you play a modular synth from a keyboard, your hands decide when each note happens. But a modular can also play itself — running sequences, drum patterns and evolving textures — and for that it needs a sense of time. In a modular, time is a voltage too. A **clock** is simply a module that sends out regular pulses, and everything that should happen in time listens to those pulses. This lesson introduces clocks, the gates and triggers they send, and the habits that keep a whole rack in time.'),

    h('The clock'),
    p('A clock sends a **gate** — a voltage that switches on and then off — at a steady rate set by its tempo. Anything that responds to gates moves forward when one arrives: an envelope fires, a sequencer advances a step, a drum module strikes, a sample-and-hold grabs a new value. Patch a clock into an envelope and you get a note on every pulse; patch it into a sequencer and the sequence plays in time.'),
    p('The rack\'s Clock module gives four speeds from a single tempo: **quarter notes**, **8ths**, **16ths** and **bars**. They are all derived from the same timing, so they stay perfectly aligned: every bar pulse coincides with a quarter, every quarter with an 8th and a 16th.'),
    table(['Output', 'At 120 BPM', 'Use'], [
      ['Quarter', '2 per second', 'kick, a pulse, slow sequences'],
      ['8th', '4 per second', 'bass lines, arpeggios'],
      ['16th', '8 per second', 'hats, fast sequences, sample & hold'],
      ['Bar', 'every 4 beats', 'resetting sequences, changing patterns'],
    ]),
    { t: 'synth', demo: CLOCK_BLEEP },
    p('In the demo, one note is retriggered from each of the clock\'s outputs in turn: quarters, 8ths, then 16ths. Same patch, same tempo — only the rate of the pulses changes.'),

    h('Gates and triggers'),
    p('Not all timing signals are the same. A **gate** has a length: it goes high, stays high for a while, and goes low again. A **trigger** is only an instant — a brief spike that says "now" and nothing else. The difference matters because different modules need different information.'),
    p('An **ADSR** envelope needs the gate\'s length: it rises and decays while the gate is high, holds at its sustain level, and only starts its release when the gate goes low. So a short gate on an envelope with a slow attack can cut the note off before it ever reaches full volume. **Drums** and simple **AD envelopes**, by contrast, only need to know when to start; they run to the end on their own however long the gate lasts.'),
    p('Every output of the rack\'s clock stays high for half of its step. At 120 BPM, that means a 16th-note gate is high for about 62 milliseconds. An ADSR driven by 16ths should therefore have a short decay and no sustain, so that each note sounds clean and separate rather than being cut off mid-swell.'),

    h('One clock for everything'),
    p('The most important habit in clocked patching is simple: **drive everything from one master clock**. If every sequencer, drum and clocked modulator takes its timing from the same clock — or from dividers and multipliers of it — they will always stay locked together. Change the tempo, and the whole rack follows. If instead you run two independent clocks at "the same" tempo, they will slowly drift apart, and the parts will fall out of sync.'),
    { t: 'synth', demo: ONE_CLOCK },
    p('In the demo, a kick plays on the quarters and hats on the 8ths, both from the same clock. They cannot drift. Then the tempo rises, and everything follows together. To stop everything at once, press Esc, or press and hold down on the pitch strip — every clock stops.'),
    example('A pulse with movement', [
      'Clock 16ths → ADSR Gate; a VCO saw through a VCF into a VCA opened by that ADSR. Every 16th sounds the same note.',
      'Patch an LFO at a slow 0.25 Hz into the VCF CV: the repeated note now opens and closes over four bars.',
      'Clock Bar → a second ADSR with a long decay, into the VCA through a Mix with the first: an accent at the start of every bar.',
    ]),
    p('That last example shows something important about clocked music: even a single repeated note becomes musical once it has **movement** (the slow filter sweep) and **accent** (the emphasis at the start of each bar). Rhythm, timbre and dynamics can carry a patch even before any melody is added.'),
    tryIt('Add a Clock module to the basic voice and patch its 16th output into the ADSR\'s gate. Change the tempo, then try the quarter and 8th outputs. Shorten the ADSR\'s decay and set its sustain to zero, and listen to how the notes separate. Then add the slow LFO and the bar accent from the example.'),
    recap([
      'A clock sends gates at a steady tempo; anything that listens to gates moves when one arrives.',
      'The Clock module gives quarters, 8ths, 16ths and bars from one tempo, always aligned.',
      'Gates have length (ADSRs need it); triggers are instants (drums and AD envelopes only need the start).',
      'Clock gates are high for half a step — 62 ms for 16ths at 120 BPM — so use short decays.',
      'Run the whole rack from one master clock so nothing drifts and tempo changes reach everything.',
    ]),
  ],
  drills: [],
};
