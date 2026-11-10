import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const gospel: Lesson = {
  id: 'soul.gospel',
  title: 'Gospel harmony',
  tags: ['soul'],
  level: 2,
  summary: 'Passing diminished chords, bass walk-ups, the coloured "amen" cadence and chained 2–5–1s: the church keyboard vocabulary that soul and R&B grew out of.',
  blocks: [
    p('Much of soul and R&B grew out of the Black church. Singers like Sam Cooke, Ray Charles and Aretha Franklin carried gospel\'s voices, its call-and-response and its harmony into popular music, and gospel keyboard playing — on piano and Hammond organ — remains one of the richest harmonic traditions in any style. Its players think in scale-degree numbers ("a 2–5–1", "the 7–3–6"), and they rarely move straight from one chord to the next: there is almost always a passing chord, a walk-up or a chromatic approach on the way.'),
    p('This lesson introduces the core of that vocabulary. The next lessons in the path go further into gospel voicings and the famous 7–3–6.'),

    h('Passing chords'),
    p('The defining habit of gospel harmony is the **passing chord**: a chord inserted between two others to connect them smoothly, usually with the bass moving by step or half step. The main chords of a hymn might be just I, IV and V, but a gospel pianist will fill every gap with passing harmony, so that the music is in constant, flowing motion.'),
    p('The most important passing chord is the **diminished 7th**. Because a diminished chord is a rootless dominant 7♭9, it can lead into almost anything, and it fits neatly between two chords whose bass notes are a whole step apart. The classic example is the walk-up from IV to the tonic: **F – F♯°7 – C/G** in C. The bass climbs F, F♯, G, and the F♯°7 in the middle is really a D7♭9 without its root — the V of V — leading into C over its 5th.'),
    example('The ♯iv°7 walk-up, note by note', [
      'F – F♯ – G in the bass: IV, then ♯iv°7, then I over its 5th (C/G).',
      'F♯°7 is F♯ A C E♭. Add D underneath and you get D F♯ A C E♭ = D7♭9, the V of G.',
      'So the diminished chord is a secondary dominant in disguise, while the bass simply climbs by half steps.',
    ], { prog: ['F', 'F#dim7', 'C/G'], key: 'C', beats: 2 }),

    h('Walk-ups and walk-downs'),
    p('Gospel bass lines love to **walk**: to climb or descend by step into an important chord, with each bass note harmonised. A walk-up from I to IV might go C – C/E – F, the bass rising C, D, E, F with a passing chord on D (often G/D or Dm7). A walk-down from I to vi might go C – G/B – Am, the bass falling C, B, A. These stepwise lines give gospel harmony its sense of momentum and its feeling of everyone moving together.'),
    p('Combined with passing diminished chords, walk-ups produce some of the most recognisable sounds in the style: I – ♯I°7 – ii, ii – ♯ii°7 – iii, IV – ♯iv°7 – I/5, each one a bass line climbing by half steps under chords that pull upward.'),

    h('The coloured "amen"'),
    p('The **plagal cadence**, IV – I, is the "amen" at the end of a hymn, and gospel colours it richly. A typical version goes **I – I7 – IV – iv – I**. The I7 turns the tonic into a dominant pointing at IV (it is V7 of IV); the IV arrives; then the IV turns minor, borrowed from the parallel minor, and its ♭6 sighs down to the 5th as the tonic returns. In C: Cmaj7 – C7 – Fmaj7 – Fm6 – Cmaj7. Few progressions are as warm or as emotional.'),
    { t: 'prog', key: 'C', tokens: ['Imaj7', 'I7', 'IVmaj7', 'iv6', 'Imaj7'], style: 'ballad', beats: 4, caption: 'I – I7 – IV – iv – I: the coloured amen' },

    h('Chained 2–5–1s and chromatic approaches'),
    p('Gospel players treat almost any chord as a temporary target, preceding it with its own ii–V or V7. Going to IV? Play its 2–5 first (Gm7 – C7 → F). Going to vi? Approach it with its V7 (E7 → Am). Strung together, these produce long chains of 2–5–1s that pass through several keys in a few bars and land, at last, back home. The next lessons look at the most famous chain, the 7–3–6.'),
    p('Another common approach is the **tritone-sub approach**: any chord can be preceded by a dominant a half step above it. D♭7 into C, G♭7 into F, B♭7 into A minor — a quick chromatic slide into the target, often on the last beat before it.'),

    h('A gospel progression, chord by chord'),
    p('Put these ideas together and you get a progression like the one below — a simple I – IV – I – V – I hymn shape, filled in gospel style.'),
    { t: 'prog', key: 'C', tokens: ['I', 'IV', '#iv°7', 'C/G', 'VI7', 'ii7', 'V7', 'I'], style: 'block', beats: 2, bpm: 84, caption: 'I – IV – ♯iv°7 – I/5 – VI7 – ii7 – V7 – I' },
    table(['Chord', 'In C', 'What it does'], [
      ['I', 'C', 'home'],
      ['IV', 'F', 'the plagal move away'],
      ['♯iv°7', 'F♯°7', 'passing diminished: a rootless D7♭9, the bass climbing F → F♯ → G'],
      ['I/5', 'C/G', 'the tonic over its 5th, set up to move on'],
      ['VI7', 'A7', 'secondary dominant of ii'],
      ['ii7 – V7', 'Dm7 – G7', 'the 2–5 home'],
      ['I', 'C', 'arrival'],
    ]),
    example('Fill in a plain hymn cadence', [
      'Plain: C | F | C | G | C.',
      'Walk from F back to C with a passing diminished chord: F – F♯°7 – C/G (the bass climbs by half steps).',
      'Turn the G into a 2–5 with its own secondary dominant in front: C/G – A7 – Dm7 – G7 – C. Every bar now moves.',
    ], { prog: ['C', 'F', 'F#dim7', 'C/G', 'A7', 'Dm7', 'G7', 'C'], key: 'C', beats: 2 }),

    h('Sound and feel'),
    p('Gospel harmony is played big. Pianists use full voicings — octaves or 10ths in the left hand, rich triads and extended chords in the right — and the Hammond organ adds sustained, swelling chords underneath. Dynamics range from a whispered ballad to a full-church "shout", where the tempo is fast, the rhythm driving and the harmony cycles round short progressions while the congregation sings and claps. Slow gospel ballads are often in **12/8**, with a rolling triplet feel that the rhythm lessons explore.'),
    onRecord('The Edwin Hawkins Singers\' "Oh Happy Day" (1969), Aretha Franklin\'s live album *Amazing Grace* (1972) and Richard Smallwood\'s "Total Praise" show gospel harmony at its richest — passing chords, walk-ups and coloured plagal cadences on every page.'),
    ear('Listen to the bass. When it climbs or descends by half steps under chords that seem to lean towards the next one, you are hearing passing chords — very often diminished 7ths. When a major chord turns minor just before the tonic returns, that is the borrowed iv of the coloured amen.'),
    tryIt('Play F – F♯°7 – C/G slowly, then add a D under the F♯°7 to hear the hidden D7♭9. Then play Cmaj7 – C7 – Fmaj7 – Fm6 – Cmaj7 as a slow ballad, letting the A – A♭ – G line sing in the middle of the voicing. Finally, play the full gospel progression above and try adding your own passing chords between any two chords a whole step apart.'),
    recap([
      'Gospel harmony fills the gaps between chords with passing chords, walk-ups and chromatic approaches.',
      'Passing diminished chords are rootless secondary dominants: F – F♯°7 – C/G climbs by half steps into the tonic.',
      'The coloured amen: I – I7 – IV – iv – I, with the borrowed minor iv sighing home.',
      'Any chord can be approached by its own 2–5 or by a dominant a half step above.',
      'Play it big: full voicings, wide dynamics, and often a 12/8 feel for ballads.',
    ]),
    drill('soul.concepts', 3),
  ],
  drills: ['ear.prog.soul', 'soul.concepts', 'jazz.dim'],
};
