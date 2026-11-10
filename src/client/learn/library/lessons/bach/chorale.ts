import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt, writing } from '../blocks';

export const chorale: Lesson = {
  id: 'bach.chorale',
  title: 'Harmonising a chorale melody',
  tags: ['bach'],
  level: 2,
  summary: 'Given a hymn tune, add alto, tenor and bass beneath it. Work from the outside in — cadences first, then the bass, then the chords, then the inner voices — the order Bach\'s students learned in.',
  blocks: [
    p('A chorale harmonisation starts with a melody — a Lutheran hymn tune, sung by the congregation — and adds three voices beneath it: alto, tenor and bass. Bach wrote hundreds of these, often harmonising the same tune several times in different works, each time differently, to suit the words and the moment. That alone tells you something important: there is no single correct harmonisation. There are many good ones, and the craft lies in choosing.'),
    p('Harmonising a chorale draws together everything in the previous lessons: cadences, root motion, voice leading, doubling and counterpoint between the outer voices. The process below breaks it into manageable steps, working **from the outside in**.'),

    h('Step 1: plan the cadences'),
    p('Chorale melodies come in short phrases, each ending with a **fermata** — a pause sign that marks a cadence. Start by deciding what kind of cadence each fermata gets, because the cadences are the structural pillars of the harmonisation. The last note or two of each phrase usually suggests the answer.'),
    p('If the melody ends **2 – 1** or **7 – 1**, the natural choice is an **authentic cadence**, V – I. If it ends on **2**, **7** or **5** with a feeling of pause, a **half cadence** on V is likely. If you want to keep the music moving where an authentic cadence could go, a **deceptive cadence**, V – vi, works whenever the melody\'s last note fits the vi chord. The final phrase almost always ends with a strong authentic cadence; the middle phrases vary, often visiting closely related keys.'),

    h('Step 2: write the bass'),
    p('With the cadences fixed, write a bass line against the whole melody. The soprano and bass are the outer voices, the most audible pair, and they should make a good two-part counterpoint on their own: mostly **contrary motion**, plenty of 3rds, 6ths and 10ths between them, and no parallel 5ths or octaves.'),
    p('At cadences the bass usually moves by strong root motion — 5 to 1 for an authentic cadence. In the middle of phrases it can move more smoothly by step, using inversions — first-inversion chords are a bass line\'s best friend, letting it walk while the harmony stays strong.'),

    h('Step 3: choose the chords'),
    p('Each soprano note and the bass note beneath it imply a chord. When the two notes are a 5th or an octave apart, the chord is usually clear. When they are a 3rd or 6th apart, there is a choice. A soprano E over a bass C could be C major (E as the 3rd) or A minor in first inversion (A C E with C in the bass).'),
    writing('One soprano note can be harmonised in several ways: E is the 3rd of C, the 5th of Am, the root of Em. Choose by where the phrase is going: tonic chords early, a predominant just before the cadence, the dominant at it.'),
    p('Think in terms of function and **harmonic rhythm**. Chorales usually change chord on every beat, but the chords should still tell the tonic → predominant → dominant → tonic story across each phrase. Avoid moving backwards from V to IV within a phrase, and save the dominant for the approach to each cadence.'),

    h('Step 4: fill in the inner voices'),
    p('Only now add the alto and tenor. They complete each chord and should move as smoothly as possible: **hold common tones**, move the other notes by **step**, keep the upper three voices within an octave of each other, and double the root in root-position chords. Inner voices are rarely memorable melodies, but they should be singable and smooth.'),

    h('Step 5: check'),
    p('Finally, check the whole harmonisation systematically: every leading tone rises (at least in the outer voices), every chordal 7th falls, no leading tone is doubled, and no pair of voices moves in parallel 5ths or octaves. Checking pair by pair — soprano and alto, soprano and tenor, and so on — is tedious but catches nearly everything.'),
    table(['Step', 'What to do'], [
      ['1. Cadences', 'each fermata gets a cadence: authentic (V–I), half (→ V) or deceptive (V–vi)'],
      ['2. Bass', 'write it against the melody in mostly contrary motion; check the outer voices for 5ths and octaves'],
      ['3. Chords', 'name the chord each soprano–bass pair implies; a 3rd or 6th apart leaves a choice'],
      ['4. Inner voices', 'hold common tones, move the rest by step, upper voices within an octave of each other'],
      ['5. Check', 'leading tone up, 7ths down, no parallels, no doubled leading tone'],
    ]),
    {
      t: 'staff',
      chords: [
        { notes: ['C3', 'C4', 'E4', 'G4'], label: 'I' },
        { notes: ['F2', 'C4', 'F4', 'A4'], label: 'IV' },
        { notes: ['G2', 'B3', 'D4', 'G4'], label: 'V' },
        { notes: ['C3', 'C4', 'E4', 'G4'], label: 'I' },
      ],
      caption: 'I – IV – V – I in four parts: the tenor\'s B rises to C, and the bass moves against the soprano.',
    },
    example('Harmonise the melody G – A – G – G', [
      'The last two notes sit at the fermata, so plan V – I there: G is the root of V and the 5th of I.',
      'The A before them is the 3rd of IV: I – IV – V – I, a textbook phrase.',
      'The bass C – F – G – C moves against the melody (the bass falls to F as the soprano rises to A). The tenor holds C from I to IV, steps down to B — the leading tone — and rises back to C at the cadence.',
    ], { voicings: [['C3', 'C4', 'E4', 'G4'], ['F2', 'C4', 'F4', 'A4'], ['G2', 'B3', 'D4', 'G4'], ['C3', 'C4', 'E4', 'G4']], beat: 1.2 }),
    example('Harmonise E – D – C – D ending on a half cadence', [
      'The phrase ends on D with a fermata: D is the 5th of G, so plan a half cadence on V.',
      'Write a bass that falls by step against the melody: C – B – A – G. The soprano and bass move in 10ths, then open out by contrary motion at the cadence.',
      'Read the chords from each pair: E over C = I; D over B = V6 (G/B); C over A = vi (Am); D over G = V. I – V6 – vi – V: a phrase that pauses on a question.',
    ], { prog: ['C', 'G/B', 'Am', 'G'], key: 'C', beats: 2 }),

    h('How Bach makes it come alive'),
    p('A correct harmonisation and a Bach harmonisation are not the same thing, and the difference is in the details. Bach keeps the inner voices and bass moving with **passing tones** in eighth notes, so the texture flows rather than plodding from chord to chord. He places **suspensions** at cadences for a moment of expressive friction. He uses **secondary dominants** to point at the chords of a cadence — a V of V before a half cadence, for instance — and he modulates briefly to related keys at middle fermatas, coming home for the last phrase. And he chooses harmonies that respond to the words: darker chords, more chromatic lines, for texts about suffering; bright, open ones for praise.'),
    onRecord('The "Passion Chorale" melody appears several times in Bach\'s *St Matthew Passion*, harmonised differently each time to suit its place in the story. Listening to two of those settings side by side is the clearest possible demonstration that a melody does not dictate its harmony.'),
    ear('When you listen to a chorale, follow the bass line through a phrase, then listen to how it arrives at the fermata. Can you hear whether each cadence is authentic, half or deceptive? Then listen to the inner voices moving in eighth notes between the chords — Bach\'s passing tones.'),
    tryIt('Harmonise the melody E – D – C – D – E – D – C (in C major) with one chord per note. Plan the cadence first (the last two notes suggest V – I), write a bass in mostly contrary motion, choose the chords, add alto and tenor, then check every pair of voices for parallels. Then try a second, different harmonisation of the same melody.'),
    recap([
      'Harmonise from the outside in: cadences, then the bass, then the chords, then the inner voices, then check.',
      'Each fermata gets a cadence; the melody\'s last notes suggest which kind.',
      'The soprano and bass should form a good two-part counterpoint, mostly in contrary motion.',
      'A soprano note a 3rd or 6th above the bass leaves a choice of chord; choose by function and direction.',
      'Bach adds passing tones, suspensions, secondary dominants and brief modulations, and responds to the words.',
    ]),
    drill('bach.vl'),
  ],
  drills: ['bach.vl', 'bach.figured', 'bach.analysis'],
};
