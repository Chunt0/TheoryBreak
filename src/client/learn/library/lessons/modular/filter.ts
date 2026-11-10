import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { CUTOFF, LADDER, LP_BP_HP, RESONANCE } from './demos';

export const filter: Lesson = {
  id: 'modular.filter',
  title: 'Filters: cutoff, slope & resonance',
  tags: ['modular'],
  level: 1,
  summary: 'Low-, band- and high-pass filters, what a 12 versus 24 dB slope does to the sound, resonance and self-oscillation, and why key tracking keeps a patch even across the keyboard.',
  blocks: [
    p('If the oscillator provides the raw material, the **filter** is the sculptor. It removes part of the spectrum — some of the harmonics — and in doing so shapes the colour of the sound more than any other module. Sweeping a filter is the signature gesture of subtractive synthesis: the "wow" of a synth bass, the slow opening of a pad, the squelch of acid house. Understanding a few of its properties — type, cutoff, slope and resonance — lets you get almost any tone you want from a single oscillator.'),

    h('Types and cutoff'),
    p('Every filter has a **cutoff frequency**: the point where it starts to act. What it does at that point depends on its type.'),
    p('A **low-pass** filter keeps everything below the cutoff and removes what is above. Lowering the cutoff removes more of the upper harmonics, so the sound gets darker and more muffled; raising it lets the brightness back in. Low-pass is by far the most common type, because darkening a bright wave is the essence of subtractive synthesis.'),
    p('A **high-pass** filter does the opposite: it keeps what is above the cutoff and removes the low end, thinning the sound. A **band-pass** filter keeps a band of frequencies around the cutoff and removes both extremes — a nasal, focused, telephone-like sound, and the basis of the wah effect.'),
    { t: 'synth', demo: CUTOFF },
    p('In the first demo, a saw wave passes through a low-pass filter at three settings. At 300 Hz only the lowest harmonics survive and the sound is dark and round; at 1.2 kHz it opens up; at 5 kHz most of the brightness is back. Watch the spectrum: the low harmonics are always there, and the top is what changes.'),
    { t: 'synth', demo: LP_BP_HP },
    p('The second demo plays one saw through one filter at 900 Hz, listening to each of its three outputs in turn. The filter in this rack is a **state-variable** design, which produces low-pass, band-pass and high-pass versions of the same signal at once.'),

    h('Slope'),
    p('A filter does not remove frequencies above its cutoff instantly; it fades them out progressively. The **slope** describes how quickly: how much quieter the signal gets for every octave past the cutoff, measured in decibels per octave. A **12 dB/octave** filter (called 2-pole) cuts gently, so some brightness leaks through above the cutoff and the sound stays open and airy; filters in Oberheim and many Roland synths work this way. A **24 dB/octave** filter (4-pole) cuts steeply, removing the upper harmonics much more decisively, for a rounder, fatter, darker sound. The most famous 24 dB filter is Robert Moog\'s **ladder** design, named after the ladder-like arrangement of transistors in its circuit.'),
    { t: 'synth', demo: LADDER },
    p('Compare the ladder filter in this demo with the 12 dB filter above at a similar cutoff: the upper harmonics fall away much faster. The ladder also has a **drive** control that pushes the signal harder into the circuit, adding warmth and saturation, which is a large part of its famous character.'),

    h('Resonance'),
    p('**Resonance** feeds some of the filter\'s output back into its input, boosting a narrow band of frequencies right at the cutoff. A little resonance gives the sound an edge, a vocal or nasal quality, and makes filter sweeps much more obvious — you can hear the peak moving through the harmonics. More resonance makes the filter whistle and ring.'),
    p('Turn it up far enough and the filter **self-oscillates**: the feedback sustains itself, and the filter produces a pure sine wave at its cutoff frequency, even with no input at all. A self-oscillating filter is a sound source in its own right. On a ladder filter, more resonance also thins out the bass, just as it does on the original analogue circuit.'),
    { t: 'synth', demo: RESONANCE },
    p('In the demo, the cutoff stays at 700 Hz while the resonance rises from 0 to 0.6 to 0.92. Watch the spectrum: a peak grows at the cutoff, and at the highest setting it starts to ring on its own.'),
    table(['Filter', 'Slope', 'Character', 'Classic use'], [
      ['VCF (state-variable)', '12 dB/oct', 'open, airy; LP, BP and HP at once', 'pads, brass, wah, Oberheim/SEM'],
      ['Ladder', '24 dB/oct', 'round, saturated, bass-heavy', 'Moog bass and leads, acid'],
      ['Low-pass gate', 'gentle, tied to level', 'plucked, organic', 'Buchla, west coast'],
      ['Comb', 'a row of peaks', 'metallic, pitched', 'flanging, Karplus–Strong strings'],
    ]),

    h('Key tracking'),
    p('Here is a subtle problem. A low note has many harmonics below any given cutoff; a high note has only a few. So with a fixed cutoff, the same filter setting sounds full and buzzy on low notes and dull on high ones — the tone changes as you move up the keyboard.'),
    p('The solution is **key tracking**: patch the MIDI V/Oct signal into the filter\'s V/Oct input as well as the oscillator\'s. Now the cutoff follows the keyboard, rising an octave for every octave you play, and every note keeps the same balance of harmonics. With full tracking and high resonance, a self-oscillating filter even plays in tune — a sine voice made entirely from a filter.'),
    example('Dial in a bass that stays even across the keyboard', [
      'Ladder filter, cutoff around 400 Hz, resonance 0.3, drive 2: round and warm.',
      'Play C1 and C3: the high note is too dark. Patch MIDI V/Oct → filter V/Oct (key tracking).',
      'Now the filter opens an octave for every octave you go up, and each note keeps the same harmonics: the same tone in every register.',
    ]),
    tryIt('Patch a saw into the VCF and play a held note while you sweep the cutoff slowly from bottom to top; then add resonance and sweep again. Switch between the LP, BP and HP outputs. Then swap in the ladder filter and compare. Finally, turn the resonance right up with no input and play the filter as an instrument, with key tracking patched.'),
    recap([
      'A filter removes part of the spectrum: low-pass darkens, high-pass thins, band-pass focuses.',
      'The cutoff sets where it acts; the slope sets how steeply — 12 dB/oct open and airy, 24 dB/oct round and fat.',
      'Resonance boosts the cutoff frequency; at high settings the filter rings and self-oscillates as a sine.',
      'The Moog ladder is the classic 24 dB filter; drive adds saturation.',
      'Key tracking moves the cutoff with the keyboard so every note keeps the same tone.',
    ]),
  ],
  drills: [],
};
