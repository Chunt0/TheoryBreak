import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { FM_BRASS, FM_PLUCK, VELOCITY } from './demos';

export const envelopes: Lesson = {
  id: 'fm.envelopes',
  title: 'How FM speaks: envelopes on the modulator',
  tags: ['fm'],
  level: 2,
  summary: 'In FM, the modulator\'s envelope does the job of a filter envelope: plucks, brass and electric pianos come from shaping brightness over time — and velocity on the modulator gives FM its expressive touch.',
  blocks: [
    p('A static FM tone — fixed ratio, fixed modulator level — can sound rich, but it does not sound like an instrument. Instruments change as they play: a plucked string is brightest at the moment of the pluck, a trumpet note blares open after it starts, a piano note mellows as it decays. In subtractive synthesis, that change in brightness comes from a filter envelope. FM has no filter, so where does it come from?'),
    p('The answer is the key to FM sound design: **the modulator\'s envelope is FM\'s filter envelope**. This lesson explains how, introduces the DX7\'s distinctive envelope design, and shows how velocity on the modulator makes FM sounds respond to touch.'),

    h('Two envelopes, two jobs'),
    p('Every DX7 operator has its own envelope. On a **carrier**, the envelope shapes **loudness**, just like an amplifier envelope. On a **modulator**, it shapes the modulator\'s level — and the modulator\'s level is the index, which is **brightness**. As the modulator\'s envelope rises, the sound brightens; as it falls, the sound darkens towards a pure sine.'),
    p('So a simple two-operator pair already has the two-envelope design of every classic synth voice: one envelope for loudness, one for brightness. Giving them different shapes is how FM sounds come alive.'),

    h('The DX7 envelope'),
    p('A DX7 envelope is not an ADSR. It has **four rates and four levels**. When you press a key, it moves at Rate 1 towards Level 1, then at Rate 2 towards Level 2, then at Rate 3 towards Level 3, and it **holds at Level 3** for as long as the key is down. When you release the key, it moves at Rate 4 towards Level 4. Rates run from 0 to 99, where 99 is fastest; levels run from 0 to 99.'),
    p('This design is more flexible than an ADSR. With Level 3 at zero, the note decays to silence even while held, like a piano. With Level 1 above Level 2, the envelope overshoots and settles, like a sforzando. With Level 4 above zero and a low Level 1, you can make sounds that swell after release, or that start from a level other than silence. It takes a little getting used to, but thinking "rate to level, rate to level" quickly becomes natural.'),

    h('Envelope recipes'),
    p('Different instrument types come from different combinations of carrier and modulator envelopes.'),
    table(['Recipe', 'Carrier EG', 'Modulator EG'], [
      ['Pluck / piano', 'fast attack, slow decay to 0', 'fast attack, faster decay: bright start, mellow tail'],
      ['Brass', 'medium attack, high sustain', 'slower attack: the brightness arrives after the note (the "blat")'],
      ['Organ', 'instant, full sustain', 'constant: a fixed timbre'],
      ['Bowed', 'slow attack', 'slow attack, with a small overshoot'],
    ]),
    p('The **pluck** is the clearest example. If the modulator decays faster than the carrier, each note starts bright and mellows as it fades — exactly the behaviour of a plucked string or a struck piano note. Make the modulator constant instead and the timbre freezes; give it a slow attack and the note swells into brightness instead.'),
    { t: 'synth', demo: FM_PLUCK },
    p('In the demo, a 1:1 pair plays first as a pluck — the modulator decaying faster than the carrier — then with a constant modulator (a static, organ-like timbre), then with a slow modulator attack (a brass-like swell). The ratio and the carrier never change; only the modulator\'s envelope does.'),
    p('**Brass** relies on the modulator\'s attack being slightly **slower** than the carrier\'s, so that the note sounds a moment before its brightness arrives and then settles to a high, bright sustain. That brief delay is the "blat" of a brass instrument — the same trick as the delayed filter attack in the modular brass patch.'),
    { t: 'synth', demo: FM_BRASS },

    h('Velocity on the modulator'),
    p('FM\'s secret weapon for expressive playing is **velocity sensitivity on the modulator**. Set a modulator\'s Velocity Sensitivity high, and playing harder raises its level — and so the index. Loud notes become **brighter** as well as louder, which is exactly how real instruments respond: a piano struck hard is not just louder but harder and more brilliant in tone. The DX7\'s electric pianos get their characteristic "bark" on hard notes this way. Velocity on the carrier, by contrast, only changes loudness.'),
    { t: 'synth', demo: VELOCITY },
    p('In the demo, three notes are played at velocities 30, 70 and 127 with the modulator\'s velocity sensitivity at 7: each is louder and much brighter than the last. Then, with sensitivity 0 on the modulator, the same notes only get louder — and sound far less alive.'),
    example('Turn an organ into a piano', [
      'Start with a 1:1 pair, both envelopes at full sustain: a static, organ-like tone.',
      'Carrier: Rate 2 at 40 to Level 2 at 70, then Rate 3 at 30 to Level 3 at 0. The note now dies away while held.',
      'Modulator: the same shape but faster (Rate 2 at 60, Level 2 at 30), with Velocity Sensitivity 6. The attack is bright, the tail mellow, and your touch decides how bright.',
    ]),
    tryIt('In the DX7, set up a 1:1 pair and give the modulator a fast decay while the carrier sustains: listen to each note start bright and mellow. Then slow the modulator\'s attack for a brass swell. Finally, raise the modulator\'s velocity sensitivity and play soft and hard notes.'),
    recap([
      'In FM, the carrier\'s envelope is loudness and the modulator\'s envelope is brightness.',
      'DX7 envelopes have four rates and four levels; they hold at Level 3 while the key is down and go to Level 4 on release.',
      'A modulator decaying faster than the carrier gives a pluck; a slower modulator attack gives brass.',
      'A constant modulator gives a static, organ-like timbre.',
      'Velocity sensitivity on the modulator makes harder notes brighter as well as louder — FM\'s expressive touch.',
    ]),
  ],
  drills: [],
};
