import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { E_PIANO, FM_BASS, MARIMBA } from './demos';

export const recipes: Lesson = {
  id: 'fm.recipes',
  title: 'Classic FM recipes',
  tags: ['fm'],
  level: 3,
  summary: 'The electric piano, bass, marimba, brass and organ that made the DX7 famous, taken apart operator by operator: what each layer does and why each setting is there.',
  blocks: [
    p('The DX7\'s factory sounds were heard on an enormous number of records in the 1980s — its electric piano in particular became one of the defining sounds of the decade, from pop ballads to soul and jazz-fusion. Like the classic subtractive patches, those famous sounds turn out to be a handful of recipes. Each one pairs a carrier\'s envelope (loudness) with a modulator\'s ratio and envelope (character and brightness), and often adds a second layer for the attack.'),
    p('This lesson takes the classic recipes apart, using everything from the previous FM lessons: ratios, modulator envelopes, velocity, algorithms and scaling.'),

    h('Electric piano'),
    p('The DX7 electric piano imitates the sound of an electromechanical piano, whose hammers strike metal tines. It has two clearly separate elements, and so it is built from **two independent pairs** in algorithm 5. The **body** is a 1:1 pair: warm, sustaining and gently decaying, with the modulator at a moderate level. The **tine** is a carrier with a modulator at a very high ratio — around ×14 — producing sidebands far above the fundamental, a bright metallic "ping" that dies away within a moment.'),
    p('**Velocity** on both modulators completes the recipe: play softly and the sound is round and mellow; play hard and both the body and the tine brighten, giving the piano its characteristic bark. This is a vivid example of FM\'s greatest strength — responsiveness to touch.'),
    { t: 'synth', demo: E_PIANO },
    p('In the demo, the full electric piano is followed by the tine pair alone — a brief metallic click with a pitch — and then by the body alone, which sounds soft and somewhat plain. Neither layer is convincing on its own; together they become the famous sound.'),

    h('Bass'),
    p('A classic FM bass uses a 1:1 pair, often with both operators at ×0.5 so the sound sits an octave lower, and gives the **modulator a fast decay**: each note starts bright and punchy and quickly settles to a rounder tone. **Feedback** on the modulator adds grit. Changing the ratio to 1:2 gives a hollow, square-like bass, and a brighter modulator gives a more aggressive slap. FM basses tend to be tighter and more percussive than analogue ones, with a distinctive "pluck" on each note.'),
    { t: 'synth', demo: FM_BASS },
    p('In the demo, the bass is followed by a brighter version, with the modulator more prominent, and then a 1:2 version with its hollow, woody character.'),

    h('Marimba and mallets'),
    p('A marimba bar is carefully tuned by its maker so that its strongest overtone falls exactly two octaves above the fundamental — at four times the frequency. An FM marimba imitates this directly. In algorithm 5, one pair provides the **fundamental**; a second carrier at **×4** provides that tuned 4th partial, quieter and decaying faster; and a third pair, with a modulator at around **×10** and a very short envelope, provides the **click of the mallet** — a tiny burst of brightness at the start of each note. Rate scaling makes higher notes shorter, as on a real instrument.'),
    { t: 'synth', demo: MARIMBA },
    p('Listen to the difference the mallet click makes in the demo: without it, the same tuned partials sound like a soft, synthetic tone; with it, they sound struck.'),
    example('Build a marimba from nothing', [
      'Algorithm 5. Pair 1–2: carrier ×1, modulator ×1 at a low level (about 65), both decaying to 0 in under a second.',
      'Pair 3–4: OP3 a carrier at ×4, quieter than OP1 and decaying faster — the bar\'s tuned 4th partial.',
      'Pair 5–6: OP6 at ×10 modulating OP5, both with a decay of a few milliseconds — the mallet. Set rate scaling 3 so high notes are shorter.',
    ]),

    h('Brass and organ'),
    p('**Brass** benefits from algorithms where one modulator feeds several carriers, such as algorithm 22. A single feedback modulator — rich and saw-like — brightens three slightly detuned carriers together, giving the width of a section. The modulator\'s attack is slower than the carriers\', for the characteristic swell, and velocity on the modulator makes louder notes blare.'),
    p('An **organ** is the simplest recipe of all: algorithm 32, with all six operators as carriers at **drawbar ratios** — 0.5, 1, 1.5 (a 5th above), 2, 3 and 4 — all at full sustain. Each operator is one pure sine, so setting their levels is exactly like pulling out the drawbars of a tonewheel organ. A touch of feedback on one operator adds some grit, and a delayed vibrato from the LFO adds life.'),
    table(['Sound', 'Algorithm', 'Key operators'], [
      ['Electric piano', '5', '1:1 body pair; ×14 tine pair with a very fast decay; velocity on the modulators'],
      ['Bass', '1 or 5', 'carrier ×0.5 or ×1; 1:1 modulator with a fast decay; feedback for grit'],
      ['Marimba / mallet', '5', 'carriers ×1 and ×4 (the bar\'s strong 4th partial); a ×10 click with a tiny envelope'],
      ['Brass', '22', 'one feedback modulator into three detuned carriers; slower modulator attack'],
      ['Organ', '32', 'carriers at drawbar ratios 0.5, 1, 1.5, 2, 3, 4, all at full sustain'],
    ]),
    p('The same approach works for designing your own sounds. Listen to the instrument you want to imitate and ask: how many separate components does it have — a body, an attack, a noise? What happens to its brightness over the course of a note? How does it respond to playing harder? Each answer translates into a pair of operators, an envelope or a velocity setting.'),
    tryIt('Load the electric piano demo into the DX7, then turn each pair off in turn to hear its contribution. Change the tine\'s ratio from 14 to 10 and 18. Then build the marimba from nothing using the example, and finally an organ in algorithm 32 with your own drawbar settings.'),
    recap([
      'Classic FM sounds pair carrier envelopes (loudness) with modulator ratios and envelopes (character, brightness), often with a separate attack layer.',
      'Electric piano: a 1:1 body pair plus a ×14 tine pair with a very fast decay, with velocity on the modulators.',
      'Bass: a 1:1 pair (often ×0.5) with a fast modulator decay and some feedback.',
      'Marimba: a fundamental pair, a ×4 carrier for the tuned partial, and a ×10 mallet click.',
      'Brass: one feedback modulator into detuned carriers; organ: six carriers at drawbar ratios.',
    ]),
  ],
  drills: [],
};
