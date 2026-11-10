import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { ADDITIVE, FEEDBACK, STACK } from './demos';

export const algorithms: Lesson = {
  id: 'fm.algorithms',
  title: 'The DX7: six operators, 32 algorithms',
  tags: ['fm'],
  level: 2,
  summary: 'How the DX7\'s six operators are wired together: stacks, parallel pairs, many carriers and one-into-many, plus feedback — and how to read an algorithm chart to see what a patch can do.',
  blocks: [
    p('A two-operator pair can make a surprising range of sounds, but the DX7 has **six** operators, and the ways they can be connected multiply the possibilities enormously. Each operator is a sine-wave oscillator with its own frequency ratio, output level and envelope. An **algorithm** is a fixed wiring of the six: which operators modulate which, and which are **carriers** whose output you actually hear. The DX7 offers 32 algorithms, shown as small diagrams on the instrument\'s panel.'),
    p('Thirty-two diagrams can look intimidating, but nearly all of them are combinations of a few basic shapes. Once you can recognise those shapes and read a chart, choosing an algorithm for a sound becomes straightforward.'),

    h('Reading a chart'),
    p('In an algorithm chart, operators are numbered boxes connected by lines. The operators on the **bottom row** are the **carriers**: their outputs are mixed together and heard. Everything above them is a **modulator**, feeding into the operator directly beneath it. So the bottom row determines the pitch and loudness of the sound; everything above determines its timbre.'),
    p('The first thing to do with any chart is **count the carriers**. One carrier means a single complex voice. Three carriers mean three independent layers you can balance, detune and shape separately. Six carriers mean no modulation at all. Then look at what is stacked above each carrier: the deeper the stack, the more complex that layer\'s timbre can be.'),

    h('The basic shapes'),
    table(['Shape', 'Example', 'Use'], [
      ['Stacks', 'Alg. 1: 2→1 and 6→5→4→3', 'complex timbres from few carriers: a modulator modulating a modulator'],
      ['Parallel pairs', 'Alg. 5: 2→1, 4→3, 6→5', 'three independent 2-op voices layered: body, tine, noise'],
      ['Many carriers', 'Alg. 32: six carriers, no modulation', 'additive synthesis: drawbar organs, layered sines'],
      ['One into many', 'Alg. 22: 6→3, 6→4, 6→5', 'one modulator brightening several carriers: brass sections'],
    ]),
    p('**Stacks** chain modulators on top of each other: OP6 modulates OP5, which modulates OP4, which modulates OP3. A modulator that is itself being modulated has a richer spectrum than a plain sine, so the sidebands it produces in the carrier below multiply. Stacks produce dense, complex timbres from a single carrier.'),
    { t: 'synth', demo: STACK },
    p('In the demo, the right-hand column of algorithm 1 plays as a three-operator stack (5 → 4 → 3), then with OP5 turned off (a plain two-operator pair, noticeably simpler), then with OP6 added on top for a four-operator stack (richer still).'),
    p('**Parallel pairs** provide several independent two-operator voices, layered together. Algorithm 5 gives three pairs, so one pair can be a warm body, another a bright attack transient, and the third something else entirely — each with its own envelopes. Many of the DX7\'s most famous sounds, including its electric pianos, are built from layered pairs.'),
    p('**Many carriers** with no modulation turn the DX7 into an **additive** synthesizer: each operator contributes one pure sine at its own ratio, like the drawbars of a Hammond organ. Algorithm 32 has all six operators as carriers.'),
    { t: 'synth', demo: ADDITIVE },
    p('In the demo, algorithm 32 plays harmonics 1, 2 and 3, then adds harmonics 4, 6 and 8: an organ-like tone built one sine at a time.'),
    p('**One into many** uses a single modulator feeding several carriers at once, so one envelope brightens several layers together — useful for ensemble sounds like brass sections.'),

    h('Feedback'),
    p('One operator in each algorithm can **feed back** into itself: its output is routed back into its own phase input, shown as a small loop on the chart. A little feedback adds a few harmonics to the operator\'s sine wave. At higher settings, 6 or 7, the sine turns into something close to a **sawtooth**; at maximum, in a carrier, it approaches noise. In a stack, a feedback operator at the top acts as a richer modulator, adding complexity to everything below it. Only the operator the algorithm marks can use feedback.'),
    { t: 'synth', demo: FEEDBACK },
    p('In the demo, a single carrier feeds back on itself at 0, 4, 6 and 7: a sine gradually becomes a buzzy, saw-like wave.'),

    h('Choosing an algorithm'),
    p('The best way to choose an algorithm is to start from the sound you want and ask how many independent layers it needs, and how complex each layer should be. A single complex, evolving tone suggests a stack. A sound with clearly separate parts — a body and an attack, or several detuned voices — suggests parallel pairs. An organ suggests many carriers.'),
    example('Choose an algorithm for an electric piano', [
      'You want two layers: a warm body that sustains, and a bright metallic attack that dies fast. That is two independent pairs.',
      'Algorithm 5 gives three pairs. Set pair 1–2 at 1:1 for the body (modulator level around 75, a fairly slow decay) and pair 3–4 with OP4 at ×14 for the tine (a very fast decay).',
      'Add velocity sensitivity on OP2 and OP4 so that harder notes bark. This is the factory TINE PIANO.',
    ]),
    tryIt('In the DX7, step through a few algorithms and count the carriers in each. Then build a two-pair sound in algorithm 5: one pair warm and sustained, the other bright and short. Finally, try algorithm 32 as an organ, setting each operator to a different harmonic ratio.'),
    recap([
      'The DX7 has six operators; an algorithm wires them, with carriers on the bottom row and modulators above.',
      'Count the carriers: one means a single complex voice, several mean independent layers.',
      'Stacks give complex timbres; parallel pairs give layers; many carriers give additive synthesis; one-into-many brightens several carriers together.',
      'Feedback turns an operator\'s sine towards a saw (and noise at maximum); only the marked operator can use it.',
      'Choose an algorithm by how many layers the sound needs and how complex each should be.',
    ]),
  ],
  drills: [],
};
