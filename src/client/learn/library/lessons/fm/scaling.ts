import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { SCALING } from './demos';

export const scaling: Lesson = {
  id: 'fm.scaling',
  title: 'Levels, scaling & keyboard tracking',
  tags: ['fm'],
  level: 2,
  summary: 'Why high notes need less modulation and shorter envelopes: the DX7\'s level scaling, rate scaling and breakpoint, how output levels behave, and how a voice is made to sound even from the bottom of the keyboard to the top.',
  blocks: [
    p('Build a lovely FM sound around middle C, then play it two octaves higher, and you will often find that it has turned shrill, thin or whistling. Play it two octaves lower and it may sound dull. This is not a fault in your patch; it is a basic property of FM, and also of real instruments, which change character across their range. The DX7 gives every operator a set of **keyboard scaling** controls to deal with it, and using them well is what makes a patch sound finished and playable across the whole keyboard.'),

    h('Why high notes get brighter'),
    p('With the same modulation index, a high note sounds brighter than a low one. Its sidebands are spaced further apart — they are multiples of a higher modulator frequency — so they climb quickly into the upper range where the ear is most sensitive. (On the original DX7 hardware they could also climb high enough to cause aliasing, a harsh digital artefact.) Real instruments behave in a related way: high notes on a piano or a marimba decay much faster than low ones, and are less rich in upper partials.'),
    p('So a patch that is perfectly balanced in the middle of the keyboard needs two corrections at the top: **less modulation**, so that it does not become shrill, and **faster envelopes**, so that high notes decay naturally. The DX7 handles both, per operator.'),

    h('Level scaling and the breakpoint'),
    p('**Level scaling** changes an operator\'s output level depending on which key is played. It is set around a **breakpoint** — a key, middle C by default — from which scaling starts in either direction. The **left depth** sets how much the level changes for keys below the breakpoint, and the **right depth** for keys above it. Each side has a **curve**: negative linear, negative exponential, positive exponential or positive linear, controlling whether the level falls or rises, and whether gradually or steeply.'),
    p('Applied to a **modulator**, level scaling controls brightness across the keyboard. The most common setting is a right depth with a negative curve on a modulator, so that its level — and therefore the index — drops as you play higher, keeping the top notes from becoming shrill. Applied to a **carrier**, level scaling controls loudness across the keyboard, useful for balancing a sound that gets too loud or too quiet in one register.'),

    h('Rate scaling'),
    p('**Rate scaling** (0 to 7) makes an operator\'s envelope run **faster on higher notes**. At 0, every note\'s envelope takes the same time; at higher settings, notes further up the keyboard decay more quickly. This imitates the behaviour of pianos, plucked strings, bells and mallet instruments, whose high notes naturally die away faster than their low ones, and it is essential for any realistic percussive patch.'),
    table(['Control', 'What it does', 'Typical use'], [
      ['Breakpoint', 'the key where scaling starts (middle C by default)', 'the middle of the instrument\'s range'],
      ['Left / right depth', 'how much the level changes away from the breakpoint', 'right depth on modulators: darker high notes'],
      ['Curves', '−lin, −exp, +exp, +lin', '−exp on the right: drops fast at the top'],
      ['Rate scaling (0–7)', 'envelopes run faster on higher notes', 'pianos, plucks, bells'],
    ]),
    { t: 'synth', demo: SCALING },
    p('In the demo, the same patch plays C2, C4 and C6. With no scaling, the top note is shrill and rings as long as the bottom one. With right depth on the modulator, the high notes become darker and better balanced. Adding rate scaling makes the top notes decay faster too, and the patch begins to behave like a real instrument across its range.'),

    h('Output levels'),
    p('Output level, like modulator level, is **logarithmic** for carriers as well: 99 is full volume, and every 8 steps or so is about 6 dB quieter. That gives two practical rules. Use **carrier levels to balance layers** — the body and the attack of an electric piano, say — and **modulator levels to shape brightness**. Keep modulators that are meant to be subtle between about 50 and 75. In algorithms with several carriers, keep the carriers around 85 to 99 rather than all at maximum, so that their sum does not overload the output.'),
    example('Keep a bell from shrieking at the top', [
      'Play a 1:3.5 bell from C2 to C6: above C5 it turns into a whistle.',
      'On the modulator, set the breakpoint at C4 and the right depth to 50 with the −exp curve: the index drops as you go up.',
      'Set rate scaling 4 on both operators: higher bells ring shorter, as small bells do.',
    ]),
    tryIt('Make a simple 1:1 pluck in the DX7 and play it across the whole keyboard, listening for where it becomes shrill. Add right depth to the modulator\'s level scaling until the top sounds balanced, then add rate scaling and listen to the high notes decay more naturally.'),
    recap([
      'The same index sounds brighter on high notes, and real instruments decay faster at the top.',
      'Level scaling changes an operator\'s level by key, around a breakpoint, with separate left and right depths and curves.',
      'Right depth with a negative curve on a modulator keeps high notes from turning shrill.',
      'Rate scaling makes envelopes faster on higher notes, for natural pianos, plucks and bells.',
      'Levels are logarithmic: balance layers with carrier levels, shape brightness with modulator levels, and keep multiple carriers below full.',
    ]),
  ],
  drills: [],
};
