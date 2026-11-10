import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { EUCLID, KICK } from './demos';

export const drums: Lesson = {
  id: 'seq.drums',
  title: 'Drum synthesis & Euclidean rhythm',
  tags: ['seq', 'rhythm'],
  level: 2,
  summary: 'How a synthesizer makes a kick, a snare and hi-hats from simple parts; spreading hits evenly across a bar with Euclidean rhythms; and probability for a beat that never quite repeats.',
  blocks: [
    p('The drum machines that shaped hip-hop, house and techno — above all Roland\'s TR-808 (1980) and TR-909 (1983) — did not play recordings of real drums. They **synthesised** their sounds from oscillators, noise and envelopes. (The 808 synthesises every sound; the 909 synthesises most of its kit but uses samples for its cymbals and hi-hats.) Those synthetic drums turned out to have a character of their own, and they became some of the most influential sounds in popular music. A modular can build them from scratch, and understanding how they work makes it easy to design your own.'),
    p('This lesson covers how the basic drums are made, a remarkably simple way to generate rhythms called Euclidean rhythm, and how a little randomness keeps a loop alive.'),

    h('The kick'),
    p('A synthesised **kick drum** is, at heart, a sine wave whose pitch drops very quickly after it is struck. The fast downward sweep at the start gives the **punch** — the click and thump you feel — and the low tone that remains, fading over a fraction of a second or longer, gives the body. The parameters are few: the starting pitch and how fast it falls (punch), the final pitch (tune), how long the tone rings (decay), and how much it is distorted (drive).'),
    p('Those few parameters cover an enormous range. A long decay and a low tune give the famous **808 boom**, a deep sub-bass that rings for a second or more and functions as a bass note in hip-hop and trap. A short decay and a strong punch give a tight **techno kick**. Driving the circuit adds harmonics and aggression.'),
    { t: 'synth', demo: KICK },

    h('Snares and hats'),
    p('A **snare** combines two elements, mirroring a real snare drum. One or two tuned tones imitate the drum\'s head; filtered **noise** imitates the rattling wires underneath. The balance between tone and noise, and how long each lasts, decides whether the snare is snappy, fat or crisp.'),
    p('**Hi-hats** are metallic, which means their spectrum is dense and inharmonic. The 808\'s hats used six square-wave oscillators at unrelated frequencies, mixed and high-pass filtered into a bright metallic hiss; noise works too. A **closed** hat has a very short decay; an **open** hat rings longer. And, as on a real kit, a closed hit **chokes** an open one — cuts it off — which is an important part of how hat patterns sound.'),

    h('Euclidean rhythms'),
    p('Here is a surprisingly powerful idea. Choose a number of hits and a number of steps — say, 3 hits in 8 steps — and spread the hits **as evenly as possible** across the steps. For 3 in 8 you cannot space them perfectly evenly, so the best you can do is gaps of 3, 3 and 2: **x . . x . . x .** That is the Cuban **tresillo**.'),
    p('In 2005 the computer scientist Godfried Toussaint showed that an algorithm for doing this — the same method Euclid used to find common divisors, as formalised in Bjorklund\'s algorithm — generates a striking number of traditional rhythms from around the world. Five hits in 8 steps gives the Cuban **cinquillo**; 7 in 12 gives a common West African bell pattern; 5 in 16 gives a bossa nova figure. Such patterns are now called **Euclidean rhythms**, and a Euclid module generates them from just two numbers. A third control, **rotate**, starts the same pattern from a different step, which can transform its feel completely.'),
    table(['Hits / steps', 'Pattern', 'Name'], [
      ['3 / 8', 'x . . x . . x .', 'tresillo'],
      ['5 / 8', 'x . x x . x x .', 'cinquillo'],
      ['4 / 16', 'x . . . x . . . x . . . x . . .', 'four on the floor'],
      ['5 / 16', 'x . . x . . x . . x . . x . . .', 'bossa nova'],
      ['7 / 16', 'x . . x . x . x . . x . x . x .', 'samba-like'],
    ]),
    { t: 'synth', demo: EUCLID },
    p('In the demo, three Euclid modules run from one clock: a kick at 4 hits in 16 steps (four on the floor), a snare at 2 in 16 rotated onto the backbeat, and hats on all 16. Then the kick changes to 6 in 16 (a tresillo twice per bar), then 5 in 16 (the bossa figure), and finally the hats thin out to 7 in 16. Each change is one number, and each produces a completely new groove.'),

    h('Probability'),
    p('A loop that repeats exactly can become tiring. Real drummers vary their playing constantly — a ghost note here, an open hat there. Modular patches imitate this with **probability**. A **Bernoulli gate** — the rack\'s **Coin** module — tosses a weighted coin for every incoming gate and sends it to one of two outputs. Send most hi-hat hits to the closed hat and a few to the open hat; let a small percentage of snare ghost notes through. Small probabilities, around 10 to 20 percent, feel like a drummer\'s natural variations; at 50 percent the pattern dissolves into chaos.'),
    example('Build a beat from two numbers each', [
      'Clock 16ths into three Euclids; Bar → every Reset.',
      'Kick 4/16 (four on the floor); snare 2/16 with Rotate 4 (beats 2 and 4); hats 16/16 through a Coin at 15% into Open.',
      'Change only the kick to 5/16 and then 7/16: new grooves without programming a single step.',
    ]),
    tryIt('Build the beat above, then explore the kick: change its hit count and rotation and listen for familiar rhythms. Try the kick module\'s settings for an 808 boom and a techno thump. Then add a Coin to the snare and let a few ghost notes through.'),
    recap([
      'Classic drum machines synthesised their sounds: the 808 all of them, the 909 all but its cymbals and hats.',
      'A kick is a sine with a fast pitch drop (punch) and a decay; snares mix tones and noise; hats are dense metallic tones, and closed hats choke open ones.',
      'Euclidean rhythms spread a number of hits as evenly as possible over a number of steps.',
      'Many traditional rhythms are Euclidean: tresillo (3/8), cinquillo (5/8), bossa (5/16); rotate changes the feel.',
      'Probability (a Coin module) adds the small variations that keep a loop alive.',
    ]),
  ],
  drills: [],
};
