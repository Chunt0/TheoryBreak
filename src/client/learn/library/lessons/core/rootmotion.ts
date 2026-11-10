import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const rootmotion: Lesson = {
  id: 'core.rootmotion',
  title: 'Root motion',
  tags: ['core', 'jazz', 'bach'],
  level: 2,
  summary: 'Why some chord changes sound inevitable and others gentle or slippery: the distance between the roots predicts the feel, before you know a single chord quality.',
  blocks: [
    p('Harmony moves by its roots. Long before you can tell a m7 from a m7♭5 by ear, you can hear how far the roots of two chords are apart — and that distance, more than anything else, decides how the change feels. Some moves sound inevitable, some gentle, some smooth and linear, some slippery and chromatic. Arrangers, composers and improvisers all think this way, and it is the first thing to listen for when you hear a progression.'),

    h('Why distance matters: common tones'),
    p('The simplest explanation for why root motion matters is **common tones** — the notes two chords share. The more notes they share, the less changes when you move between them, and the gentler the move sounds.'),
    p('Two triads whose roots are a **3rd** apart share two notes. C major (C E G) and A minor (A C E) have C and E in common; moving between them changes only one note, so it feels like a shift of light rather than a journey. Two triads whose roots are a **5th** apart share one note: C major and G major share G. And two triads whose roots are a **step** apart share nothing at all — C major and D minor have no notes in common, so every voice has to move.'),
    p('Common tones explain the smoothness of a change, but not its sense of direction. For that you need the special case of the falling 5th.'),

    h('Down a 5th: the strongest move'),
    p('When the root falls a 5th — G to C, D to G, A to D — each chord sounds like the dominant of the next. The root of the first chord is the 5th of the second, so the ear hears the motion of V to I: tension, then arrival. This is the strongest, most goal-directed root motion in tonal music. (Falling a 5th and rising a 4th land on the same note, so they count as the same motion.)'),
    p('Chain several falling 5ths together and you get a **circle progression**, where each chord resolves to the next and the music seems to roll downhill under its own weight. ii–V–I is two steps of it. A turnaround like vi–ii–V–I is three. Long chains of it drive "Autumn Leaves", the bridge of "I Got Rhythm" and an enormous number of Baroque sequences.'),
    { t: 'prog', key: 'C', tokens: ['Am7', 'Dm7', 'G7', 'Cmaj7'], style: 'swing', caption: 'Falling 5ths: A → D → G → C' },
    p('The opposite move — the root **rising a 5th**, as in I to V or IV to I — shares the same common tone but runs the other way. It sounds open and less conclusive, more like stepping out than coming home. It is not weak in a bad sense: IV–I is the plagal "amen" cadence, and I–V–I–V is the backbone of a lot of folk, gospel and rock.'),

    h('By 3rds: gentle shifts'),
    p('Roots falling a 3rd — C to A, A to F, F to D — give a soft, descending sequence of colours with two common tones at every step. The very common I–vi–IV–V progression begins with two of these moves (C → A → F) before stepping up to G for the push home. Falling 3rds are the sound of ballads and of slow, gentle harmony.'),
    p('Roots rising a 3rd are less common in tonal music and feel a little like stepping back: I to iii, for instance, can sound like the music has hesitated. A special case is the **major-3rd cycle** — roots moving by major 3rds, which divide the octave into three equal parts (C, E, A♭). Because each key is far from the next, this motion sounds bright but disorienting. It is the engine of John Coltrane\'s "Giant Steps".'),
    { t: 'prog', key: 'C', tokens: ['Cmaj7', 'Am7', 'Fmaj7', 'Dm7'], style: 'ballad', caption: 'Falling 3rds: two common tones every move' },

    h('By step: linear motion'),
    p('Roots moving by step share no notes, so every voice has to move. That makes stepwise root motion sound linear and driving rather than resolving. IV to V is the classic example: it is the push that sets up a cadence. V to vi is the deceptive cadence. In rock, soul and gospel, ♭VI – ♭VII – I climbs by whole steps to the tonic, a triumphant alternative to V–I that never uses the leading tone at all.'),
    p('When the root **falls a half step**, the move sounds slippery and chromatic. The best-known example is the tritone substitution, where D♭7 replaces G7 and resolves down a half step to C. It works because D♭7 and G7 share the same tritone (F and C♭, which is B respelled). R&B and gospel use chromatic half-step root motion constantly, sliding whole chord shapes down into their targets.'),
    { t: 'prog', key: 'C', tokens: ['Dm7', 'Db7', 'Cmaj7', 'Cmaj7'], style: 'swing', caption: 'Half-step root motion: the tritone sub' },
    p('A root moving by a **tritone** — G7 to D♭7, for instance — is the most distant move of all on the circle of fifths, yet between two dominant chords it sounds like a colour flip rather than a jump, because the two chords share their tritone.'),
    table(['Root motion', 'Feel', 'Typical', 'Common tones'], [
      ['down a 5th / up a 4th', 'strongest, goal-directed', 'ii → V → I, the cycle of 5ths', 'one (two with 7ths)'],
      ['up a 5th / down a 4th', 'open, "backwards"', 'I → V, IV → I (plagal)', 'one'],
      ['down a 3rd', 'gentle', 'I → vi → IV', 'two'],
      ['major-3rd cycles', 'bright, disorienting', 'Coltrane changes', 'one'],
      ['up or down a step', 'smooth, linear', 'IV → V, V → vi, ♭VII → I', 'none'],
      ['down a half step', 'slippery, chromatic', '♭II7 → I (tritone sub)', 'the tritone, respelled'],
      ['tritone', 'colour flip', 'V7 ↔ ♭II7', 'the tritone'],
    ]),

    h('Reading progressions by their roots'),
    example('ii–V–I in B♭, then with a tritone sub', [
      'Roots C → F → B♭: up a 4th, up a 4th — two falling-5th moves in a row. That is why ii–V–I sounds inevitable.',
      'Now swap F7 for its tritone substitute B7: the roots become C → B → B♭.',
      'The function is the same, but the root motion has changed from two strong leaps to a chromatic slide down by half steps.',
    ], { prog: ['Cm7', 'B7', 'Bbmaj7'], key: 'Bb', beats: 2 }),
    example('I – vi – IV – V in C', [
      'Roots C → A → F → G.',
      'Two falling 3rds (C → A, A → F): gentle shifts, two common tones each.',
      'Then a step up (F → G): no common tones, a push towards the cadence. The progression relaxes, then gathers itself.',
    ], { prog: ['C', 'Am', 'F', 'G'], key: 'C', beats: 2 }),
    p('In real music the bass does not always play the root. Inversions let a bass line move smoothly by step while the chords above follow a stronger root motion — Bach does this constantly. But the harmonic root motion still governs how the progression feels, which is why it is worth training your ear to hear it underneath.'),
    listen([
      { label: 'Down a 5th', music: { prog: ['G7', 'Cmaj7'], key: 'C', beats: 2 }, note: 'arrival' },
      { label: 'Down a 3rd', music: { prog: ['Cmaj7', 'Am7'], key: 'C', beats: 2 }, note: 'a shift of light' },
      { label: 'Up a step', music: { prog: ['Fmaj7', 'G7'], key: 'C', beats: 2 }, note: 'a push' },
      { label: 'Down a half step', music: { prog: ['Db7', 'Cmaj7'], key: 'C', beats: 2 }, note: 'a slide' },
    ]),
    ear('To hear root motion, hum only the lowest note of each chord and ignore the colours until the bass line is clear. Then ask: did it leap down a 5th (arrival), drift by a 3rd (shift), step (push) or slide by a half step (slip)?'),
    tryIt('Play only roots, one per bar, in the left hand: C → F, C → A, C → D, C → B. Then add the chords on top. You will find the feel of each change is already there in the bare roots.'),
    recap([
      'The distance between roots predicts how a change feels, before the chord qualities are known.',
      'Down a 5th is the strongest move — each chord sounds like V of the next; chains of it make circle progressions.',
      'Roots a 3rd apart share two notes and shift gently; roots a step apart share none and push.',
      'A half step down is slippery and chromatic — the tritone substitution.',
      'Hum the lowest note of each chord to hear root motion clearly.',
    ]),
    drill('ear.motion'),
  ],
  drills: ['ear.motion', 'ear.prog.jazz', 'jazz.analysis'],
};
