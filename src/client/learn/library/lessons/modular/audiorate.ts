import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { AUDIO_FM, HARD_SYNC, RING_MOD } from './demos';

export const audiorate: Lesson = {
  id: 'modular.audiorate',
  title: 'Audio-rate modulation: FM, ring mod & sync',
  tags: ['modular', 'fm'],
  level: 3,
  summary: 'Speed an LFO up into the audio range and modulation stops being movement and becomes timbre: sidebands, frequency modulation, ring modulation and hard sync.',
  blocks: [
    p('Patch an LFO into an oscillator\'s pitch at 6 Hz and you hear vibrato: the pitch wobbling up and down. Now turn the LFO faster — 10 Hz, 20 Hz, 50 Hz. Somewhere above about 20 or 30 Hz, something strange happens. You stop hearing a wobble at all. Instead you hear a **new tone**, rougher or brighter or more metallic, as if the oscillator had changed its waveform. Modulation at audio rate does not move the sound; it **changes what the sound is made of**.'),
    p('This is one of the most powerful ideas in synthesis, and it works on any destination — pitch, level, even the phase of an oscillator\'s cycle. It is also the bridge between modular synthesis and the FM synthesis of the DX7, which the FM lessons explore in depth.'),

    h('Sidebands'),
    p('When one signal modulates another at audio rate, the result contains new frequencies called **sidebands**, positioned at the **carrier** frequency (the signal being modulated) plus and minus multiples of the **modulator** frequency. A 440 Hz carrier modulated by a 110 Hz modulator gains sidebands at 330 and 550 Hz, then 220 and 660 Hz, and so on. The deeper the modulation, the more sidebands appear and the further they spread.'),
    p('Whether the result sounds musical depends on the relationship between the two frequencies. If the modulator is a simple ratio of the carrier — the same frequency, double, triple — the sidebands fall on harmonics of a common fundamental, and the result sounds pitched and harmonic. If the ratio is irrational or complicated, the sidebands land between harmonics, and the result sounds clangorous, metallic or noisy, like a bell or a gong.'),

    h('Frequency modulation'),
    p('**FM** modulates an oscillator\'s pitch with another oscillator. In the demo, a sine wave modulates another sine at the same pitch, and the FM depth rises from 0 to 0.4: with each step, more sidebands appear and the tone grows from a pure sine to something bright and brassy.'),
    { t: 'synth', demo: AUDIO_FM },
    p('You may also notice that the pitch **drifts** as the depth increases, and the partials slide away from the harmonic positions. That happens because analogue oscillator FM is usually **exponential**: the modulator moves the pitch in octaves, so a symmetrical wobble raises the average pitch, and the note goes sharp as the depth grows. **Linear** FM — and the phase modulation the DX7 actually uses — keeps the average pitch fixed, so even very deep FM stays in tune and can be played melodically. The rack\'s FM Op module and the DX7 are built that way; the FM synthesis lessons pick up from here.'),

    h('Ring modulation'),
    p('**Ring modulation** multiplies two signals together. The result contains neither of the original frequencies — only their **sum and difference**. A 440 Hz sine ring-modulated by a 100 Hz sine produces 340 Hz and 540 Hz, and nothing else. When the two frequencies are in a simple ratio, the sum and difference are harmonically related and the result sounds hollow and bell-like. When they are not, the result is clangorous and metallic — the sound of countless science-fiction robots and effects. **Amplitude modulation** (AM) is closely related: it is tremolo at audio rate, and it keeps the original carrier in the output along with the sidebands.'),
    { t: 'synth', demo: RING_MOD },
    p('In the demo, a 220 Hz sine is ring-modulated at three frequencies. At 440 Hz the sidebands are 220 and 660 Hz, harmonically related, so the result is hollow but pitched. At 311 Hz they are 89 and 531 Hz, unrelated, so it clangs. At 30 Hz the modulator is barely in the audio range, and you hear a rough, buzzy tremolo.'),

    h('Hard sync'),
    p('**Hard sync** links two oscillators in a different way. One, the **master**, sets the pitch; the other, the **slave**, is forced to restart its cycle every time the master starts a new one. The slave is therefore locked to the master\'s pitch — but its own tuning now controls its **waveform**. Tune the slave higher and more of its cycles squeeze into each master cycle before being cut off and restarted, so the shape of the combined wave, and its harmonics, change dramatically while the pitch stays the same.'),
    p('Sweeping the slave\'s tuning with an envelope produces the classic **sync lead**: a tearing, vocal, screaming sweep through the harmonics at a fixed pitch, heard on many synth-pop and rock records of the late 1970s and 1980s.'),
    { t: 'synth', demo: HARD_SYNC },
    p('In the demo, the slave is tuned up 0, 5, 10 and 17 semitones while the pitch stays on C. At exact octaves the slave fits whole cycles into the master\'s, so sync adds nothing new there; the most interesting sounds lie between them, which is why sync sweeps sound best when they glide continuously.'),
    table(['Technique', 'What is modulated', 'Result'], [
      ['FM', 'pitch, by another oscillator', 'sidebands at carrier ± n × modulator: bright, brassy, bell-like'],
      ['Ring modulation', 'level, by multiplication', 'only the sum and difference: hollow or clangorous'],
      ['AM', 'level, at audio rate', 'the carrier plus sidebands'],
      ['Hard sync', 'the slave\'s cycle restarts with the master', 'fixed pitch, changing waveform: the sync lead'],
    ]),
    example('Find a ring-mod bell', [
      'Sine VCO → Ring In A; set Ring Freq to about 2.76 times the note you will play (an inharmonic ratio, like a bell\'s partials).',
      'A pluck envelope on the VCA: instant attack, 1.5 s decay, no sustain.',
      'Sum and difference tones that are not harmonics of each other sound like struck metal; a little reverb finishes the bell.',
    ]),
    tryIt('Patch an LFO into a VCO\'s FM input and slowly raise its rate from a few hertz into the audio range, listening for the moment the wobble turns into a new tone. Then try ring modulation with harmonic and inharmonic ratios. Finally, set up hard sync and sweep the slave\'s tuning with an envelope for a sync lead.'),
    recap([
      'Above roughly 20–30 Hz, modulation stops sounding like movement and becomes timbre.',
      'Audio-rate modulation creates sidebands at the carrier ± multiples of the modulator; simple ratios sound harmonic, complex ones metallic.',
      'Analogue exponential FM drifts sharp as depth grows; linear FM and phase modulation (the DX7) stay in tune.',
      'Ring modulation outputs only the sum and difference of its inputs; AM keeps the carrier too.',
      'Hard sync locks the slave to the master\'s pitch while its tuning reshapes the waveform — the sync lead.',
    ]),
  ],
  drills: [],
};
