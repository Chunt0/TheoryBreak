import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { BELL, RATIOS } from './demos';

export const ratios: Lesson = {
  id: 'fm.ratios',
  title: 'Ratios: harmonic & inharmonic',
  tags: ['fm'],
  level: 1,
  summary: 'The ratio between carrier and modulator decides which frequencies appear: 1:1 saw-like, 1:2 square-like, non-integer ratios for bells and metal — and fixed frequencies for formants and drums.',
  blocks: [
    p('The previous lesson showed that the modulator\'s level controls how bright an FM sound is. This lesson covers the other half of the story: the **frequency ratio** between the carrier and the modulator, which decides **which** frequencies appear. Change the ratio and you change the fundamental character of the sound — from a brassy saw-like tone to a hollow clarinet, a bell, or a clanging piece of metal. Ratio and level together are the core of every FM patch.'),

    h('Ratios on the DX7'),
    p('Every operator on the DX7 has a frequency setting expressed as a **ratio to the note you play**. The **Coarse** setting chooses 0.5, 1, 2, 3 and so on up to 31; the **Fine** setting adds up to 99 percent more. An operator at ratio 1 sounds at the pitch of the key; at ratio 2 it sounds an octave higher; at ratio 3, an octave and a 5th higher.'),
    p('The **carrier\'s** ratio determines the pitch you hear: at ×1 it is the note you play, at ×2 an octave up. The **ratio between carrier and modulator** determines the recipe of sidebands. Here is the key rule: **whole-number ratios give harmonic spectra** — sidebands that fall on the harmonic series, producing clearly pitched tones — while **non-integer ratios give inharmonic spectra**, with partials that do not belong to any harmonic series, producing bells, metal and clangs.'),

    h('The common ratios'),
    table(['C : M', 'Sidebands of C3', 'Character'], [
      ['1 : 1', 'every harmonic', 'saw-like: brass, strings'],
      ['1 : 2', 'odd harmonics only', 'square-like: hollow, clarinet'],
      ['1 : 3', 'harmonics 1, 2, 4, 5, 7… (no multiples of 3)', 'nasal, reedy'],
      ['2 : 1', 'carrier an octave up, every harmonic', 'bright, hollow'],
      ['1 : 14', 'sidebands far above', 'a high metallic "tine" (electric piano)'],
      ['1 : 3.5', 'partials not in the harmonic series', 'bell'],
      ['1 : 1.41', '√2: no common pattern at all', 'clangorous metal, gong'],
    ]),
    p('Why is **1:2** square-like? With the modulator at twice the carrier frequency, the sidebands fall at fc ± 2fc, fc ± 4fc and so on: that is, at 3fc and 5fc above, and at −fc and −3fc below. Negative frequencies "fold back" and sound as positive ones, so they land on fc and 3fc. The result contains only **odd** multiples of the carrier — exactly the recipe of a square wave. In general, a ratio of 1:N produces a spectrum that skips every Nth harmonic, and the folded-back negative sidebands either reinforce or partly cancel the positive ones, which is part of FM\'s distinctive character.'),
    { t: 'synth', demo: RATIOS },
    p('In the demo, the modulator stays at the same level while its ratio changes: 1, 2, 3, 3.5 and 1.41. Watch the spectrum display: for the whole-number ratios the peaks sit on the harmonic ticks, but for 3.5 and 1.41 they move off them, and the sound turns from pitched to metallic.'),

    h('Bells and metal'),
    p('Real bells and metal bars do not have harmonic spectra; their partials are spread out at irregular intervals, which is why they sound clangorous. FM imitates them beautifully with non-integer ratios. A ratio of around **1:3.5** or **1:1.4**, with both operators given long decaying envelopes — the modulator decaying a little faster than the carrier, so the sound starts bright and mellows as it rings — produces a convincing bell. The DX7\'s famous tubular bells and its many metallic patches are built this way.'),
    { t: 'synth', demo: BELL },
    p('In the demo, the 1:3.5 bell is followed by the same envelopes at 1:3, which turns it into a plucked, pitched tone, and at 1:4. Only the ratio changes, but the difference between a bell and a pluck is entirely a matter of whether the partials line up.'),

    h('Fixed frequency'),
    p('An operator can also ignore the keyboard entirely. In **fixed frequency** mode it sits at 1, 10, 100 or 1000 Hz times a fine factor, whatever note you play. A **fixed modulator** produces a group of sidebands — a **formant** — that stays in the same place as the pitch changes, which is how real resonant bodies behave: the resonances of a voice or an instrument body do not move up and down with each note. A **fixed carrier** produces drums and noises at a constant pitch, useful for percussion patches.'),
    example('Find a harmonic ratio by ear', [
      'Start from a 1:1 pair with the modulator at level 80. Step the modulator\'s Coarse through 1, 2, 3 and 4, and listen for the hollow (2), nasal (3) and bright (4) colours.',
      'Now try Fine: anything off a whole number moves the sidebands away from the harmonic series. A few percent gives a slow beating; 41 percent clangs.',
      'For a bell, use 3.5 (Coarse 3, Fine 17) or 1.4, and give both operators a long decay.',
    ]),
    tryIt('In the DX7, set up a two-operator pair (algorithm 1, OP2 modulating OP1), then step OP2\'s Coarse ratio from 1 to 8 while holding a note, followed by small Fine changes. Then make a bell: ratio 3.5, both envelopes decaying slowly, the modulator slightly faster.'),
    recap([
      'Each operator\'s frequency is a ratio to the played note (Coarse 0.5–31, plus Fine); the carrier\'s ratio is the pitch you hear.',
      'The carrier:modulator ratio decides which sidebands appear: whole numbers give harmonic spectra, others inharmonic ones.',
      '1:1 is saw-like, 1:2 square-like (odd harmonics), 1:3 nasal; 1:14 gives a high metallic tine.',
      'Non-integer ratios such as 1:3.5 or 1:1.41 give bells and metal, especially with long decaying envelopes.',
      'Fixed-frequency operators give formants that stay put (fixed modulator) or constant-pitch drums (fixed carrier).',
    ]),
  ],
  drills: [],
};
