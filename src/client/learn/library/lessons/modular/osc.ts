import type { Lesson } from '../../types';
import { ear, example, h, p, recap, table, tryIt } from '../blocks';
import { DETUNE, PULSE, WAVES } from './demos';

export const osc: Lesson = {
  id: 'modular.osc',
  title: 'Oscillators, waveforms & harmonics',
  tags: ['modular'],
  level: 1,
  summary: 'Why a saw is bright and a sine is pure: the harmonic series, what each classic waveform contains, how pulse width changes the recipe, and why two detuned oscillators sound bigger than one.',
  blocks: [
    p('The oscillator is where every subtractive sound begins, and the waveform you choose decides what raw material you have to work with. Choosing well depends on understanding one idea from acoustics — the harmonic series — which also explains why instruments sound different from each other, why filters do what they do, and much of what follows in these lessons.'),

    h('The harmonic series'),
    p('Any steady, pitched sound — a sung note, a violin, a synth — can be described as a sum of simple **sine waves**. One of them, the **fundamental**, is at the pitch you hear. The others, called **harmonics** or partials, are at whole-number multiples of it: twice the frequency, three times, four times, and so on. If the fundamental is 110 Hz (an A), the harmonics are at 220, 330, 440, 550 Hz and upwards. This set of frequencies is the **harmonic series**, and it is the same for every pitched sound.'),
    p('What differs from sound to sound is **how loud each harmonic is**. That balance — the recipe — is what we hear as **timbre**, the quality that makes a flute and a trumpet sound different even on the same note. A sound with strong high harmonics sounds bright; one with mostly low harmonics sounds dark and mellow. Change the recipe and you change the character of the sound.'),

    h('The classic waveforms'),
    p('An oscillator\'s classic waveforms are, in effect, standard recipes of harmonics.'),
    p('- A **sine** wave is a single harmonic — the fundamental alone. It sounds pure, round and flute-like, and it is the basis of sub-bass.\n- A **triangle** wave contains only the **odd** harmonics (1st, 3rd, 5th…), and they fade away very quickly — the nth harmonic is only 1/n² as loud as the fundamental. It sounds soft and hollow.\n- A **square** wave also contains only the odd harmonics, but they fade much more slowly (1/n). It sounds hollow and woody — the clarinet-like sound of many classic synths.\n- A **sawtooth** (saw) wave contains **every** harmonic, falling off at 1/n. It is the brightest and buzziest of the four — the raw material of synth strings and brass, and of most subtractive patches.'),
    table(['Wave', 'Harmonics', 'Level of the nth', 'Sound'], [
      ['Sine', 'the fundamental only', '—', 'pure, flute-like, sub bass'],
      ['Triangle', 'odd only (1, 3, 5…)', '1/n² (falls fast)', 'soft, hollow, ocarina'],
      ['Square', 'odd only', '1/n', 'hollow, woody: clarinet'],
      ['Saw', 'all', '1/n', 'bright, buzzy: strings, brass'],
      ['Narrow pulse', 'all, with gaps', 'depends on width', 'thin, nasal, reedy'],
    ]),
    { t: 'synth', demo: WAVES },
    p('In the demo, a single oscillator\'s four outputs are picked one at a time. Watch the spectrum display as well as listening: the saw fills every harmonic slot, the square and triangle only the odd ones (the triangle\'s fading away almost at once), and the sine shows just the fundamental. This is why subtractive synthesis usually starts from a saw or a square: a filter can only remove harmonics that are there to begin with.'),
    example('Why a square sounds like a clarinet', [
      'A clarinet is a cylindrical tube closed at one end, so it resonates mostly at odd multiples of its fundamental.',
      'A square wave has odd harmonics only, at 1/n: 1, 1/3, 1/5…',
      'Filter it gently (cut above the 5th harmonic or so) and add a slow attack: the recipe is close enough for the ear to say "woodwind".',
    ]),

    h('Pulse width'),
    p('A square wave spends exactly half of each cycle high and half low. A **pulse** wave changes that proportion, called the **pulse width** or duty cycle. Narrowing the pulse changes the recipe: at 50% it is a square, with no even harmonics; as the width narrows, even harmonics appear, and certain harmonics drop out entirely — at 25% width, every 4th harmonic (the 4th, 8th, 12th…) disappears. The sound becomes thinner, more nasal and reedy as the pulse gets narrower.'),
    { t: 'synth', demo: PULSE },
    p('Things get really interesting when the pulse width moves. Patch a slow LFO into the oscillator\'s pulse-width input — **pulse-width modulation**, or **PWM** — and the harmonics shift continuously, giving a rich, shimmering, chorused sound. It is the classic sound of 1980s synth strings and pads, and one of the easiest ways to bring a static oscillator to life.'),

    h('Detuning'),
    p('Two oscillators playing the same note, but slightly out of tune with each other, interfere: their combined sound swells and fades at a rate equal to the difference in their frequencies. This is called **beating**. A difference of a few **cents** (hundredths of a semitone) produces a slow, gentle movement that the ear hears as width and richness — the basic principle of chorus. Detune further, to a fifth of a semitone or so, and the beating becomes fast and sour, a honky-tonk effect.'),
    p('Oscillators can also be tuned to different notes entirely. An octave or a 5th apart, they fuse into a single, thicker voice — the classic stacked lead sound — rather than sounding like two notes.'),
    { t: 'synth', demo: DETUNE },
    p('In the demo, two saws start in unison, then move 8 cents apart (warm, moving, wider), then 20 cents apart (obviously detuned, wobbling), then an octave apart (a single, fuller voice). Most rich synth sounds use at least two oscillators, detuned slightly, for exactly this reason.'),
    ear('Add the **Spectrum** module after the VCO and play: the bars are the harmonics. Switch outputs and watch odd harmonics appear and vanish. It is the fastest way to learn what a waveform "contains".'),
    tryIt('Patch a VCO\'s saw output to the mixer, play a low note and look at the spectrum; then switch to square, triangle and sine. Then patch a slow LFO into the pulse-width input and listen to PWM. Finally, add a second VCO, tune it a few cents sharp and mix the two together.'),
    recap([
      'Pitched sounds are sums of harmonics at whole-number multiples of the fundamental; their balance is timbre.',
      'Sine: fundamental only. Triangle: odd harmonics, fading fast. Square: odd harmonics at 1/n. Saw: all harmonics at 1/n.',
      'Narrowing a pulse adds even harmonics and drops every nth; PWM moves the width for a shimmering sound.',
      'Two oscillators a few cents apart beat slowly, adding width; an octave or 5th apart they fuse into one thick voice.',
      'Subtractive synthesis starts from a rich wave, because a filter can only remove what is there.',
    ]),
  ],
  drills: [],
};
