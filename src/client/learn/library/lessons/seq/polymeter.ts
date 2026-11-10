import type { Lesson } from '../../types';
import { ear, example, h, p, recap, tryIt } from '../blocks';
import { D_3_AGAINST_4, POLYMETER } from './demos';

export const polymeter: Lesson = {
  id: 'seq.polymeter',
  title: 'Polymeter, polyrhythm & clock division',
  tags: ['seq', 'rhythm'],
  level: 2,
  summary: 'Loops of different lengths running against each other, three against four from a single clock, and slow phasing — simple techniques that make a handful of fixed patterns sound endlessly varied.',
  blocks: [
    p('One of the most powerful tricks in sequencing costs nothing: run loops of **different lengths** at the same time. The notes in each loop never change, yet the combination keeps shifting, because the loops keep meeting each other at different points. A few short patterns can produce music that takes many bars to repeat, with accents falling in new places all the time. The cross-rhythm lesson described polyrhythm and polymeter as ideas; a modular makes them very easy to hear and to use.'),

    h('Polymeter: different lengths, same pulse'),
    p('**Polymeter** means two or more loops with the **same step size** but **different lengths**. Suppose the drums loop every 16 steps — one bar of 16th notes — and a melodic sequence on the same clock loops every 7 steps. The sequence starts at the beginning of bar 1, but by bar 2 it has already been round twice and is two steps into its third pass; it begins each bar at a different point. Its notes are fixed, but they land on different beats every time, so the accents keep moving.'),
    p('The two loops only line up again after the lowest number of steps that both lengths divide into — here 7 × 16 = 112 steps, or 7 bars. Use lengths that share no factors with each other and the combined pattern takes a long time to repeat.'),
    { t: 'synth', demo: POLYMETER },
    p('In the demo, a sequence on 16ths plays against a four-on-the-floor kick. At length 8 it is locked to the beat, repeating twice per bar. At length 7 it starts to slide against the kick, a step earlier every time round. At length 5 it slides even faster. The notes never change; only their relationship to the beat does.'),

    h('Polyrhythm: different pulses, same span'),
    p('**Polyrhythm** is subtly different: two pulses of **different sizes** in the same span of time — three evenly spaced notes against four, or three against two. In a modular, the easiest way to make them is with a **clock divider**, a module that turns one clock into several slower ones: every 2nd pulse, every 3rd, every 4th, every 6th, every 8th, and often double time as well. Because all the outputs come from the same source clock, they stay perfectly locked together, however long the patch runs.'),
    p('Drive one voice from the ÷4 output of a 16th-note clock (quarter notes) and another from the ÷3 output (dotted 8ths), and you have three against four that never drifts. On drums, hats on every third 16th over a kick on every fourth produce a rolling "dotted 8th" pulse that crosses the bar line, lining up with the kick only every three beats.'),
    { t: 'synth', demo: D_3_AGAINST_4 },
    p('The demo does exactly that: a kick on every 4th pulse and hats on every 3rd, both from one 16th clock. Four hats fall in the time of three kicks, and because they align only every three beats, the pattern keeps rolling across the bar line.'),

    h('Phasing'),
    p('A third technique uses loops of the **same length** at very slightly **different tempos**. They start together, slowly drift apart, pass through every possible alignment, and eventually come back together. The composer Steve Reich built pieces from this process in the 1960s: in *Piano Phase* (1967), two pianists play the same twelve-note pattern, one gradually moving ahead of the other, so that a single simple figure generates a long sequence of changing interlocking patterns.'),
    ear('Steve Reich\'s *Piano Phase* puts two identical 12-note loops at slightly different tempos so they slide apart and back together. Two clocks at 120 and 121 BPM into two copies of a sequence do the same in the rack.'),
    p('This is the one case where you deliberately break the one-master-clock rule from the clocks lesson. Everywhere else, keep all your loops on one clock so that their relationship is controlled.'),
    example('A melody that never repeats the same way', [
      'Drums on a 16-step loop; a sequencer on the same 16ths with Length 7.',
      'Write only five notes in it, with two rests: the gaps fall in a new place every bar.',
      'Add a second sequencer at Length 5 for a counter-line: loops of 7 and 5 against 16 line up only every 35 bars.',
    ]),
    tryIt('Set up a drum loop on 16 steps, then a sequencer on the same clock with length 7, and listen to the melody slide against the beat. Try lengths 5, 6 and 9. Then use the clock divider to drive a hat from ÷3 and a kick from ÷4. Finally, try two copies of a short sequence on clocks at 120 and 121 BPM and listen to them phase.'),
    recap([
      'Polymeter: loops with the same step size but different lengths drift against each other, moving the accents.',
      'Loops of 7 and 16 steps realign only after 112 steps; lengths with no common factors take longest to repeat.',
      'Polyrhythm: different pulse sizes in the same span — 3 against 4 — made with a clock divider so nothing drifts.',
      'Phasing: identical loops at slightly different tempos slide apart and back together (Steve Reich\'s Piano Phase).',
      'A few fixed patterns can generate long, constantly varying music.',
    ]),
  ],
  drills: [],
};
