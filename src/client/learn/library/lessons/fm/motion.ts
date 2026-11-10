import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { DETUNE, FM_DRUM, LFO } from './demos';

export const motion: Lesson = {
  id: 'fm.motion',
  title: 'Detune, LFO & pitch envelope: FM in motion',
  tags: ['fm'],
  level: 3,
  summary: 'Bringing a cold FM tone to life: chorus from detuned carriers, shimmer from slightly off-whole ratios, vibrato, tremolo and timbre wobble from the LFO, and the pitch envelope for scoops, falls and drums.',
  blocks: [
    p('A perfectly static FM tone — exact ratios, perfectly in tune, no modulation — can sound cold and clinical, and it was a common criticism of early digital synthesizers. But FM sounds can be every bit as warm and alive as analogue ones. The life comes from small differences and slow movements: operators slightly out of tune, ratios slightly off whole numbers, vibrato that blooms on long notes, pitch that bends at the start of a note. This final FM lesson covers the tools for adding that motion.'),

    h('Detune and shimmer'),
    p('Every DX7 operator has a **Detune** control, a fine pitch offset of a few cents either way (7 is centred). Detune two carriers slightly against each other — in an algorithm with two parallel pairs playing the same sound — and they beat gently, exactly like two detuned oscillators in subtractive synthesis: a chorus-like width and movement.'),
    p('A second, more FM-specific trick is to set a **modulator** slightly off its whole-number ratio — a Fine setting of 1 or 2 percent. The sidebands then sit slightly away from the harmonic series and drift against it, so the timbre itself **shimmers** slowly, rather than the whole sound beating. It is subtle, but it takes the edge of artificial perfection off many patches.'),
    { t: 'synth', demo: DETUNE },
    p('In the demo, two identical 1:1 pairs first play in tune, adding up to a single voice. Then the second pair is detuned, giving width and movement. Then the modulators are set 1 percent off their whole ratios, and the timbre starts to shimmer.'),

    h('The LFO'),
    p('The DX7 has a single **LFO**, shared by the whole voice, with controls for its **speed** and its **delay** — the delay fades the LFO in after each key is pressed, so that vibrato can bloom on long notes rather than starting immediately, just as a singer or string player would do it. The LFO can modulate pitch and amplitude.'),
    p('**Pitch modulation depth** (PMD), together with the voice\'s pitch modulation sensitivity, gives **vibrato** across all operators. **Amplitude modulation depth** (AMD) works per operator, according to each operator\'s amplitude modulation sensitivity — and that gives two quite different effects. On a **carrier**, amplitude modulation is **tremolo**, a pulsing in volume. On a **modulator**, it changes the index, so the sound\'s **brightness** wobbles while its loudness stays steady — a kind of rhythmic timbre movement with no equivalent in a single analogue oscillator.'),
    table(['Control', 'Range', 'Does'], [
      ['LFO speed / delay', '0–99', 'rate; delay fades the LFO in after each key'],
      ['PMD + pitch mod sens', '0–99, 0–7', 'vibrato depth (all operators)'],
      ['AMD + amp mod sens', '0–99, 0–3 per operator', 'tremolo on carriers, or a timbre wobble on modulators'],
      ['Pitch EG', '4 rates, 4 levels (50 = no change)', 'a scoop, a fall, a drum\'s pitch drop'],
      ['Mod wheel, aftertouch', 'assignable', 'add PMD / AMD by hand'],
    ]),
    { t: 'synth', demo: LFO },
    p('In the demo, a single pair plays dry, then with vibrato, then with delayed vibrato that fades in, and finally with amplitude modulation on the modulator only: the brightness wobbles while the volume stays constant.'),

    h('The pitch envelope'),
    p('The DX7 also has a **pitch envelope**, which bends the pitch of the whole voice over time. Like the operator envelopes, it has four rates and four levels — but here a level of **50 means no change**, levels above 50 bend the pitch up and levels below bend it down. Used subtly, it adds a small scoop up into each note, like a singer or a brass player, or a fall at the end. Used dramatically, it turns a tone into a **drum**: a pitch that starts high and drops within a few milliseconds is exactly how synthesised toms and kicks work.'),
    { t: 'synth', demo: FM_DRUM },
    p('In the demo, each note starts high and drops in a few milliseconds onto a decaying FM tone — a synthetic tom. Without the pitch drop it is just a short tone; with a slower drop it becomes a laser-like zap.'),
    p('Finally, the **mod wheel** and **aftertouch** can be assigned to add vibrato or amplitude modulation by hand, so that the player controls the motion in real time — the FM equivalent of the mod-wheel vibrato in the modular lessons.'),
    example('Make a breathy flute', [
      'Algorithm 5. Pair 1–2 at 1:1 with the modulator low (level about 60) and a medium attack on the carrier: a soft, almost pure tone.',
      'For breath, use the third pair. In algorithm 5, OP6 is the operator with feedback: set feedback 7 and give OP6 a high ratio (×9) at a high level, modulating OP5 (×4) kept quiet as a carrier. The result is a hiss of sidebands high above the note — breath noise that follows the pitch.',
      'LFO sine at speed about 32, delay 55, PMD 6, with pitch mod sensitivity 3: vibrato that blooms on long notes. This is the factory SOFT FLUTE, which also adds an octave layer on OP3.',
    ]),
    tryIt('Take any static FM patch and add motion one step at a time: detune a second carrier, set a modulator 1 percent off its ratio, add a delayed vibrato, and finally a small scoop with the pitch envelope. Listen after each step. Then turn the pitch envelope into a fast drop and play a few low notes as drums.'),
    recap([
      'Static FM sounds cold; small differences and slow movements bring them to life.',
      'Detuned carriers beat like a chorus; modulators slightly off whole ratios make the timbre shimmer.',
      'The DX7\'s LFO gives vibrato (PMD) and amplitude modulation (AMD); its delay lets vibrato bloom on long notes.',
      'AMD on a carrier is tremolo; on a modulator it wobbles the brightness while loudness stays.',
      'The pitch envelope (50 = no change) adds scoops and falls, and fast drops turn tones into drums.',
    ]),
  ],
  drills: [],
};
