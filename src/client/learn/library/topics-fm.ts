import type { Operator } from '../../audio/dx7/patch';
import type { Topic } from './types';
import { INDEX, RATIOS, BELL, FM_PLUCK, FM_BRASS, VELOCITY, STACK, ADDITIVE, FEEDBACK, SCALING, E_PIANO, FM_BASS, MARIMBA, DETUNE, LFO, FM_DRUM } from './lessons/fm/demos';

type R4 = [number, number, number, number];
/** An operator: ratio, level, and an envelope as 4 rates / 4 levels (DX7 order). */
const op = (coarse: number, outputLevel: number, rates: R4 = [99, 99, 99, 99], levels: R4 = [99, 99, 99, 0], more: Partial<Operator> = {}): Partial<Operator> =>
  ({ coarse, outputLevel, rates, levels, ...more });

// a carrier that holds while the key is down and lets go quickly
const HOLD: [R4, R4] = [[99, 99, 99, 60], [99, 99, 99, 0]];

export const FM_TOPICS: Topic[] = [
  {
    id: 'fm.basics', title: 'Carriers, modulators & the index', tags: ['fm'], minutes: 6, level: 1,
    summary: 'One sine bending another\'s phase: sidebands, why the modulator\'s level is brightness, and the Bessel functions behind the sound.',
    blocks: [
      { t: 'p', md: 'In **FM** (frequency modulation; strictly, on the DX7, phase modulation) one sine wave, the **modulator**, wobbles the phase of another, the **carrier**, at audio rate. You hear only the carrier, but it now contains new frequencies: **sidebands** at the carrier frequency plus and minus every multiple of the modulator frequency: fc ± fm, fc ± 2fm, fc ± 3fm… John Chowning found this at Stanford in 1967; Yamaha licensed it for the DX7 (1983).' },
      { t: 'p', md: 'How strong the sidebands are depends on the **modulation index** (the modulator\'s depth relative to its frequency): at index 0 only the carrier sounds; as it grows, energy spreads into more and more sidebands; at high index the sound is bright and buzzy. On the DX7 the index is set by the **modulator\'s output level** (and its envelope). The carrier\'s level is simply its volume.' },
      { t: 'synth', demo: INDEX },
      { t: 'table', head: ['Modulator level', 'Index (radians)', 'Sound'], rows: [
        ['0', '0', 'pure sine'],
        ['50', '≈ 0.2', 'a hint of the 2nd harmonic'],
        ['70', '≈ 1.0', 'warm, a few sidebands'],
        ['80', '≈ 2.4', 'bright, brassy'],
        ['90', '≈ 5.8', 'very bright'],
        ['99', '≈ 12.6', 'harsh, wide'],
      ] },
      { t: 'p', md: 'The level scale is **logarithmic**: about 0.75 dB per step, so every 8 steps doubles (or halves) the index. That is why the useful range for modulators is roughly 60–90: below 50 there is almost no effect, above 95 the spectrum gets very wide.' },
      { t: 'p', md: 'The amplitude of the nth sideband pair follows the **Bessel function** Jn(index). Two consequences you can hear: sideband levels do not rise smoothly with the index but swell and dip (a sideband can vanish at one index and return at a higher one), and the carrier itself fades and comes back. Sweeping the index with an envelope therefore gives a rich, shifting timbre, not just "brighter".' },
      { t: 'example', title: 'Predict the spectrum of a 1:1 pair', steps: [
        'Carrier and modulator both at C3 (131 Hz): fc = fm = 131 Hz.',
        'Sidebands at fc ± n·fm: 131 ± 131, ± 262, … = 0, 262, 393, 524 Hz above and "negative" frequencies below, which fold back onto the positive harmonics.',
        'Every harmonic of 131 Hz appears: a 1:1 ratio gives a saw-like spectrum whose brightness the index controls.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'fm.ratios', title: 'Ratios: harmonic & inharmonic', tags: ['fm'], minutes: 6, level: 1,
    summary: 'The carrier:modulator ratio decides which frequencies appear: 1:1 saw-like, 1:2 square-like, non-integer ratios bells and metal.',
    blocks: [
      { t: 'p', md: 'Every operator has a **frequency ratio** to the note played (Coarse 0.5, 1, 2… 31, Fine adding up to 99% more). The carrier\'s ratio is the pitch you hear (×1 = the note, ×2 an octave up); the **ratio between carrier and modulator** decides the recipe. Whole-number ratios give harmonic spectra (pitched tones); non-integer ratios give inharmonic ones (bells, metal, clangs).' },
      { t: 'table', head: ['C : M', 'Sidebands of C3', 'Character'], rows: [
        ['1 : 1', 'every harmonic', 'saw-like: brass, strings'],
        ['1 : 2', 'odd harmonics only', 'square-like: hollow, clarinet'],
        ['1 : 3', 'harmonics 1, 2, 4, 5, 7… (no multiples of 3)', 'nasal, reedy'],
        ['2 : 1', 'carrier an octave up, every harmonic', 'bright, hollow'],
        ['1 : 14', 'sidebands far above', 'a high metallic "tine" (electric piano)'],
        ['1 : 3.5', 'partials not in the harmonic series', 'bell'],
        ['1 : 1.41', '√2: no common pattern at all', 'clangorous metal, gong'],
      ] },
      { t: 'synth', demo: RATIOS },
      { t: 'p', md: 'Why 1:2 is square-like: with fm = 2fc, the sidebands fall at fc ± 2fc, ± 4fc… = 3fc, 5fc (and −fc, −3fc folding back onto fc, 3fc): only odd multiples of the carrier. In general a C:M ratio of 1:N gives harmonics that skip every Nth one, and the reflected negative sidebands either reinforce or cancel the positive ones, which is part of FM\'s character.' },
      { t: 'synth', demo: BELL },
      { t: 'p', md: '**Fixed frequency** mode ignores the keyboard: the operator sits at 1, 10, 100 or 1000 Hz times a fine factor whatever you play. A fixed modulator gives a formant that stays put as the pitch changes (voices, resonant bodies); a fixed carrier gives drums and noises at a constant pitch.' },
      { t: 'example', title: 'Find a harmonic ratio by ear', steps: [
        'Start from a 1:1 pair at level 80. Step the modulator\'s Coarse 1, 2, 3, 4 and listen for the hollow (2), nasal (3) and bright (4) colours.',
        'Now Fine: anything off a whole number detunes the sidebands from the harmonic series. A few percent gives a slow beating; 41% clangs.',
        'For a bell, use 3.5 (Coarse 3, Fine 17) or 1.4 and give both operators a long decay.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'fm.envelopes', title: 'How FM speaks: envelopes on the modulator', tags: ['fm'], minutes: 6, level: 2,
    summary: 'The modulator\'s envelope is FM\'s filter envelope: plucks, brass, electric piano, and velocity on the modulator for touch.',
    blocks: [
      { t: 'p', md: 'In subtractive synthesis brightness comes from the filter envelope. In FM it comes from the **modulator\'s envelope**: as the modulator\'s level rises the index rises, and the sound brightens; as it falls the sound darkens toward a sine. Give the carrier one shape (loudness) and the modulator another (brightness) and you have the two-envelope voice of every classic synth.' },
      { t: 'p', md: 'A DX7 envelope is not an ADSR: it has **four rates and four levels**. On key down it moves at Rate 1 to Level 1, then Rate 2 to Level 2, then Rate 3 to Level 3, and **holds at Level 3** while the key is down. On key up it moves at Rate 4 to Level 4. Rates run 0–99 (99 fastest); levels 0–99. Set Level 4 above 0 and Level 1 low and you get sounds that swell after release, or start from a level other than silence.' },
      { t: 'table', head: ['Recipe', 'Carrier EG', 'Modulator EG'], rows: [
        ['Pluck / piano', 'fast attack, slow decay to 0', 'fast attack, faster decay: bright start, mellow tail'],
        ['Brass', 'medium attack, high sustain', 'slower attack: brightness arrives after the note (the "blat")'],
        ['Organ', 'instant, full sustain', 'constant: a fixed timbre'],
        ['Bowed', 'slow attack', 'slow attack, small overshoot'],
      ] },
      { t: 'synth', demo: FM_PLUCK },
      { t: 'synth', demo: FM_BRASS },
      { t: 'p', md: '**Velocity on the modulator** is FM\'s secret weapon: set the modulator\'s Velocity Sensitivity high and harder playing raises the index, so loud notes are brighter as well as louder, the way real instruments respond. The DX7\'s electric pianos get their "bark" this way. Velocity on the carrier only changes loudness.' },
      { t: 'synth', demo: VELOCITY },
      { t: 'example', title: 'Turn an organ into a piano', steps: [
        'Start with a 1:1 pair, both envelopes at full sustain: a static, organ-like tone.',
        'Carrier: Rate 2 at 40 to Level 2 at 70, Rate 3 at 30 to Level 3 at 0: the note dies away while held.',
        'Modulator: the same shape but faster (Rate 2 at 60, Level 2 at 30), and Velocity Sensitivity 6: the attack is bright, the tail mellow, and the touch decides how bright.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'fm.algorithms', title: 'The DX7: six operators, 32 algorithms', tags: ['fm'], minutes: 6, level: 2,
    summary: 'Stacks, parallel pairs and additive carriers; feedback; reading an algorithm chart.',
    blocks: [
      { t: 'p', md: 'The DX7 has six **operators** (a sine oscillator with its own envelope, level and ratio). An **algorithm** is a fixed wiring of the six: which operators modulate which, and which are **carriers** (on the bottom row of the chart, the ones you hear). There are 32. Three shapes cover most of them.' },
      { t: 'table', head: ['Shape', 'Example', 'Use'], rows: [
        ['Stacks', 'Alg. 1: 2→1 and 6→5→4→3', 'complex timbres from few carriers: a modulator modulating a modulator'],
        ['Parallel pairs', 'Alg. 5: 2→1, 4→3, 6→5', 'three independent 2-op voices layered: body, tine, noise'],
        ['Many carriers', 'Alg. 32: six carriers, no modulation', 'additive synthesis: drawbar organs, layered sines'],
        ['One into many', 'Alg. 22: 6→3, 6→4, 6→5', 'one modulator brightening several carriers: brass sections'],
      ] },
      { t: 'synth', demo: STACK },
      { t: 'synth', demo: ADDITIVE },
      { t: 'p', md: '**Feedback** routes one operator\'s output back into its own phase (the little loop on the chart). Low amounts add a few harmonics to its sine; at 6 or 7 it becomes saw-like, and in a carrier at full feedback, near noise. In a stack, a feedback operator on top acts as a richer modulator. Only the operator the algorithm marks can feed back.' },
      { t: 'synth', demo: FEEDBACK },
      { t: 'p', md: '**Reading a chart**: find the bottom row (carriers: they set loudness and pitch); everything above is timbre. Count carriers: one carrier is a single complex voice; three are three layers you can balance and detune. A modulator\'s envelope shapes the brightness of the carrier below it; a carrier\'s envelope shapes its own loudness.' },
      { t: 'example', title: 'Choose an algorithm for an electric piano', steps: [
        'You want two layers: a warm body that sustains, and a bright metallic attack that dies fast. That is two independent pairs.',
        'Algorithm 5 gives three pairs. Pair 1–2 at 1:1 (body, modulator level around 75, fairly slow decay); pair 3–4 with OP4 at ×14 (tine, a very fast decay).',
        'Velocity sensitivity on OP2 and OP4 so harder notes bark. This is the factory TINE PIANO.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'fm.scaling', title: 'Levels, scaling & keyboard tracking', tags: ['fm'], minutes: 5, level: 2,
    summary: 'Why high notes need less modulation: level scaling, rate scaling and the breakpoint, and how DX7 voices stay even across the keyboard.',
    blocks: [
      { t: 'p', md: 'The same index sounds brighter on a high note: its sidebands are spaced further apart and climb into the range where the ear is most sensitive (and, on a real DX7, toward aliasing). Real instruments also decay faster as they go up. The DX7 handles both per operator with **keyboard scaling**.' },
      { t: 'table', head: ['Control', 'What it does', 'Typical use'], rows: [
        ['Breakpoint', 'the key where scaling starts (middle C by default)', 'the middle of the instrument\'s range'],
        ['Left / right depth', 'how much the level changes away from the breakpoint', 'right depth on modulators: darker high notes'],
        ['Curves', '−lin, −exp, +exp, +lin', '−exp on the right: drops fast at the top'],
        ['Rate scaling (0–7)', 'envelopes run faster on higher notes', 'pianos, plucks, bells'],
      ] },
      { t: 'synth', demo: SCALING },
      { t: 'p', md: '**Output level** is logarithmic for carriers too: 99 is full volume, every 8 steps about 6 dB quieter. Balance layers with carrier levels; shape brightness with modulator levels. Keep modulators that are meant to be subtle between about 50 and 75; keep carriers in algorithms with several of them around 85–99 so the sum does not overload.' },
      { t: 'example', title: 'Keep a bell from shrieking at the top', steps: [
        'Play a 1:3.5 bell from C2 to C6: above C5 it turns into a whistle.',
        'On the modulator, breakpoint at C4, right depth 50 with the −exp curve: the index drops as you go up.',
        'Rate scaling 4 on both operators: higher bells ring shorter, as small bells do.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'fm.recipes', title: 'Classic FM recipes', tags: ['fm'], minutes: 6, level: 3,
    summary: 'Electric piano, bass, marimba, brass and organ, taken apart operator by operator.',
    blocks: [
      { t: 'p', md: 'The DX7\'s famous sounds are a few recipes. Each pairs a carrier\'s envelope (loudness) with a modulator\'s envelope and ratio (brightness and character), then adds a second layer for the attack.' },
      { t: 'synth', demo: E_PIANO },
      { t: 'table', head: ['Sound', 'Algorithm', 'Key operators'], rows: [
        ['Electric piano', '5', '1:1 body pair; ×14 tine pair with a very fast decay; velocity on the modulators'],
        ['Bass', '1 or 5', 'carrier ×0.5 or ×1; 1:1 modulator, fast decay; feedback for grit'],
        ['Marimba / mallet', '5', 'carrier ×1 and ×4 (the bar\'s strong 4th partial); a ×10 click with a tiny envelope'],
        ['Brass', '22', 'one feedback modulator into three detuned carriers; slower modulator attack'],
        ['Organ', '32', 'carriers at drawbar ratios 0.5, 1, 1.5 (×3/2 = the 5th), 2, 3, 4, all at full sustain'],
      ] },
      { t: 'synth', demo: FM_BASS },
      { t: 'synth', demo: MARIMBA },
      { t: 'example', title: 'Build a marimba from nothing', steps: [
        'Algorithm 5. Pair 1–2: carrier ×1, modulator ×1 at a low level (about 65), both decaying to 0 in under a second.',
        'Pair 3–4: OP3 a carrier at ×4, quieter than OP1, decaying faster: a tuned bar\'s 4th partial, which a marimba\'s maker tunes on purpose.',
        'Pair 5–6: OP6 at ×10 modulating OP5, both with a decay of a few milliseconds: the mallet. Rate scaling 3 so high notes are shorter.',
      ] },
    ],
    drills: [],
  },
  {
    id: 'fm.motion', title: 'Detune, LFO & pitch envelope: FM in motion', tags: ['fm'], minutes: 5, level: 3,
    summary: 'Chorus from detuned carriers, vibrato and tremolo from the LFO, fixed-frequency noise and the pitch envelope.',
    blocks: [
      { t: 'p', md: 'A static FM tone sounds cold. Life comes from small differences: **detune** two carriers a little and they beat like a chorus; give a modulator a slightly off-whole ratio (Fine 1–2%) and the timbre shimmers; add a delayed **LFO** vibrato; let the **pitch envelope** bend each note\'s start.' },
      { t: 'synth', demo: DETUNE },
      { t: 'table', head: ['Control', 'Range', 'Does'], rows: [
        ['LFO speed / delay', '0–99', 'rate; delay fades the LFO in after each key'],
        ['PMD + pitch mod sens', '0–99, 0–7', 'vibrato depth (all operators)'],
        ['AMD + amp mod sens', '0–99, 0–3 per operator', 'tremolo on carriers, or a timbre wobble on modulators'],
        ['Pitch EG', '4 rates, 4 levels (50 = no change)', 'a scoop, a fall, a drum\'s pitch drop'],
        ['Mod wheel, aftertouch', 'assignable', 'add PMD / AMD by hand'],
      ] },
      { t: 'synth', demo: LFO },
      { t: 'synth', demo: FM_DRUM },
      { t: 'example', title: 'Make a breathy flute', steps: [
        'A 1:1 pair, modulator low (level 55): a soft, almost pure tone; a medium attack on the carrier.',
        'Add a fixed-frequency operator at about 3 kHz with feedback 7, at a low level, as a carrier: breath noise.',
        'LFO sine at speed 34, delay 60, PMD 8: vibrato that blooms on long notes. This is roughly the factory SOFT FLUTE.',
      ] },
    ],
    drills: [],
  },
];
