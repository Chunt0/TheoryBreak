import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { GENERATIVE, TURING } from './demos';

export const generative: Lesson = {
  id: 'seq.generative',
  title: 'Generative sequencing: the Turing machine & chance',
  tags: ['seq'],
  level: 3,
  summary: 'Patches that compose while you listen: loops that slowly mutate, randomness you can lock, and the art of keeping chance in the musical middle ground between noise and repetition.',
  blocks: [
    p('A conventional sequencer plays exactly what you programme. A **generative** patch works differently: you set up rules — a scale, a rhythm, a degree of randomness, a way for things to change — and let the music unfold by itself. Brian Eno, who coined the term "generative music" in the 1990s, compared it to gardening rather than architecture: you plant the seeds and tend the conditions, and the result grows in ways you did not specify note by note. Modular synthesizers are natural generative instruments, and this lesson covers the main tools and the key principle behind using them well.'),

    h('Controlled randomness'),
    p('The secret of good generative music is **controlled** randomness. Pure randomness — a new random note on every step — sounds like noise; the ear cannot find any pattern to hold on to. A fixed loop, on the other hand, is predictable and eventually tiresome. The interesting place is in between: material that **repeats long enough to be heard as a phrase**, but **changes slowly enough** to stay fresh. Nearly every generative technique is a way of setting that balance.'),

    h('The Turing Machine'),
    p('One of the most celebrated generative modules is the **Turing Machine**, designed by Tom Whitwell for his Music Thing Modular project. Its core is a ring of 16 bits — binary ones and zeros — that shifts one place on every clock pulse, like a loop of tape with holes punched in it. The bits are read as a number, which becomes a voltage (and so a melody) and a gate (and so a rhythm).'),
    p('The clever part is what happens as each bit comes back round. A control called **Change** sets the probability that the bit flips. At 0, nothing ever flips, so the loop repeats exactly — a fixed sequence. Turn it up a little and occasionally a bit flips, so the phrase **evolves** a note at a time while staying mostly recognisable. At 50 percent, every bit is effectively random, and the result is pure chance. Beyond that the knob mirrors itself: at 100 percent every bit flips on every pass, so the loop locks again, alternating with its own inverted image — a fixed pattern twice as long. (Whitwell\'s hardware puts "locked" at both ends of the knob and "random" in the middle for exactly this reason.) **Length** sets the loop size, from 2 to 16 steps, and **Range** sets the pitch span.'),
    p('That single Change control sweeps through the whole spectrum from repetition to randomness. And because the loop can be frozen at any moment, the Turing Machine becomes a tool for discovering phrases: let it wander until something catches your ear, then turn Change to zero, and it is locked.'),
    { t: 'synth', demo: TURING },
    p('In the demo, a Turing machine is quantized to E minor pentatonic. Locked, it repeats one phrase. At 0.15 it slowly evolves, changing a note here and there. At 0.5 it is fully random. Finally it is locked again with a length of 5, making a short riff.'),
    example('Lock a phrase you like', [
      'Turing Change at 0.3 into a quantizer: listen until a phrase catches your ear.',
      'Turn Change to 0 at once: that phrase now loops exactly.',
      'Shorten Length to make a riff of it, or turn Change up to 0.05 so it drifts a note every few bars.',
    ]),

    h('The generative toolkit'),
    p('The Turing Machine is one tool among several, and generative patches usually combine a few. Each has its own kind of randomness, and each needs taming in a particular way.'),
    table(['Source', 'What it gives', 'Tame it with'], [
      ['Turing machine', 'a looping, mutating phrase', 'Change near 0, a quantizer'],
      ['Noise S&H', 'a new random voltage per clock', 'a Util for range, a quantizer'],
      ['Rand (smooth)', 'slow drifting curves', 'small amounts on cutoff, pan, pitch'],
      ['Coin (Bernoulli)', 'gates by chance', 'probability: 10–30% for variation'],
      ['Euclid', 'evenly spread hits', 'reset on the bar'],
    ]),
    p('The pattern is consistent: generate freely, then constrain. A **quantizer** keeps random pitches in a scale. A **Util** keeps random voltages within a sensible range. Low **probabilities** let only occasional changes through. **Slow** modulation makes drift feel organic rather than erratic. And **space** — echoes and reverb — helps sparse, unpredictable notes feel like part of a whole.'),

    h('An ambient patch'),
    { t: 'synth', demo: GENERATIVE },
    p('The demo combines several of these ideas into a small ambient piece: a slowly mutating Turing phrase in D Dorian, played only when a coin toss says so (30 percent of the time), through a filter that drifts slowly, with long echoes and reverb. The sparse version leaves plenty of silence; raising the coin to 70 percent makes it busier. Neither version is ever quite the same twice, yet both sound coherent, because the scale, the slow evolution and the space hold everything together.'),
    tryIt('Patch a Turing machine through a quantizer into the basic voice, clocked by 8ths. Sweep Change from 0 to 0.5 and back, and lock a phrase you like. Then add a Coin on the gates at 30 percent, a slow Rand on the filter cutoff, and a long delay and reverb, and let it play for a few minutes.'),
    recap([
      'Generative patches set up rules and let the music unfold; the art is controlled randomness.',
      'Pure randomness is noise and fixed loops are predictable; aim for phrases that repeat but slowly change.',
      'The Turing Machine shifts a ring of bits; Change sets the chance each bit flips — 0 locks, small values evolve, 50% is random.',
      'Combine sources (Turing, noise S&H, Rand, Coin, Euclid) and constrain them with quantizers, ranges, low probabilities and slow rates.',
      'Space — echoes and reverb — makes sparse, unpredictable notes feel like one piece.',
    ]),
  ],
  drills: [],
};
