import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { INDEX } from './demos';

export const basics: Lesson = {
  id: 'fm.basics',
  title: 'Carriers, modulators & the index',
  tags: ['fm'],
  level: 1,
  summary: 'One sine wave bending another\'s phase: where FM\'s sidebands come from, why the modulator\'s level is the sound\'s brightness, and the Bessel functions that make FM timbres shimmer as they change.',
  blocks: [
    p('In 1967, the composer John Chowning, working at Stanford University, noticed something while experimenting with vibrato on a computer. As he made the vibrato faster and deeper, it stopped sounding like vibrato at all and turned into a new tone — rich, bright and complex — produced by nothing more than two simple sine waves. He had found **frequency modulation synthesis**. Stanford licensed the idea to Yamaha, and in 1983 Yamaha released the **DX7**, which became one of the best-selling synthesizers ever made. Its electric pianos, basses, bells and brass are on countless records of the 1980s.'),
    p('FM works very differently from the subtractive synthesis of the modular lessons. There are no filters. Instead, brightness is created by modulation itself. This lesson explains the core idea; the rest of the FM path builds on it.'),

    h('Carrier and modulator'),
    p('An FM sound starts with two sine-wave oscillators, called **operators** on the DX7. One, the **modulator**, is not heard directly. Instead it wobbles the other, the **carrier**, at audio rate. (Strictly, the DX7 uses **phase modulation**, a close relative that keeps the pitch stable, but the effect is the same and everyone calls it FM.) You hear only the carrier — but the carrier now contains new frequencies that neither sine wave had on its own.'),
    p('Those new frequencies are called **sidebands**, and they appear at the carrier frequency **plus and minus every multiple of the modulator frequency**: fc ± fm, fc ± 2fm, fc ± 3fm and so on. The modular lesson on audio-rate modulation introduced this idea; FM synthesis is built entirely on it. With two sines and the right settings, you can produce spectra as rich as any sawtooth wave, or strange inharmonic spectra no oscillator could produce.'),

    h('The index: brightness'),
    p('How strong the sidebands are depends on the **modulation index**: roughly, how deeply the modulator modulates the carrier relative to its own frequency. At an index of zero there is no modulation, and you hear a pure sine — the carrier alone. As the index rises, energy spreads out from the carrier into more and more sidebands, further and further from the carrier frequency. A low index gives a warm, slightly rounded tone; a high index gives a bright, buzzy, even harsh one.'),
    p('On the DX7, the index is set by the **modulator\'s output level** — and, crucially, by the modulator\'s envelope, which can change it over the course of a note. That is the central idea of FM sound design: **a modulator\'s level is the sound\'s brightness**. The carrier\'s level, by contrast, is simply its volume.'),
    { t: 'synth', demo: INDEX },
    p('In the demo, a carrier and a modulator at the same frequency (a 1:1 pair, algorithm 1, with OP2 modulating OP1) play with the modulator\'s level at 0, 60, 75, 85 and 99. Watch the spectrum fill upward as the index rises: a pure sine, then a warm tone, then bright and brassy, then very bright and harsh.'),
    table(['Modulator level', 'Index (radians)', 'Sound'], [
      ['0', '0', 'pure sine'],
      ['50', '≈ 0.2', 'a hint of the 2nd harmonic'],
      ['70', '≈ 1.0', 'warm, a few sidebands'],
      ['80', '≈ 2.4', 'bright, brassy'],
      ['90', '≈ 5.8', 'very bright'],
      ['99', '≈ 12.6', 'harsh, wide'],
    ]),
    p('Notice that the level scale is **logarithmic**: each step is about 0.75 dB, so every 8 steps doubles or halves the index. That explains a common surprise for newcomers. Levels below about 50 seem to do almost nothing, and levels above 95 make the spectrum very wide very quickly. The useful range for modulators is roughly 60 to 90.'),

    h('Why FM shimmers'),
    p('The mathematics behind FM is elegant. The strength of each pair of sidebands follows a family of curves called **Bessel functions**: the nth pair\'s amplitude is Jn of the index. You do not need the mathematics, but two consequences are easy to hear. First, sideband levels do not simply rise as the index increases; they **swell and dip**, and a particular sideband can vanish at one index and come back at a higher one. Second, the carrier itself fades and returns as the index changes.'),
    p('So when a modulator\'s envelope sweeps the index over the course of a note, the result is not just "getting brighter". The balance of harmonics shifts in a complex, shimmering way, and that internal motion is a large part of why FM sounds so alive — and so different from a filter sweep.'),
    example('Predict the spectrum of a 1:1 pair', [
      'Carrier and modulator both at C3 (131 Hz): fc = fm = 131 Hz.',
      'Sidebands at fc ± n·fm: 131 ± 131, ± 262, … = 0, 262, 393, 524 Hz above, and "negative" frequencies below, which fold back onto the positive harmonics.',
      'Every harmonic of 131 Hz appears: a 1:1 ratio gives a saw-like spectrum whose brightness the index controls.',
    ]),
    tryIt('Open the DX7 and start from INIT VOICE. Choose algorithm 1, turn up OP2\'s output level slowly from 0 while holding a note, and listen to the tone brighten. Then play with OP2\'s envelope: a fast decay on the modulator makes each note start bright and mellow, a sound you will meet again in the envelope lesson.'),
    recap([
      'FM (on the DX7, phase modulation) uses one sine, the modulator, to wobble another, the carrier, at audio rate.',
      'This creates sidebands at the carrier frequency ± multiples of the modulator frequency.',
      'The modulation index sets how far the energy spreads: on the DX7, the modulator\'s output level is brightness.',
      'The level scale is logarithmic; the useful modulator range is roughly 60–90.',
      'Sideband strengths follow Bessel functions, so sweeping the index makes the timbre shimmer, not just brighten.',
    ]),
  ],
  drills: [],
};
