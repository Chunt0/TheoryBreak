import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const fn: Lesson = {
  id: 'core.function',
  title: 'Harmonic function: tonic, predominant, dominant',
  tags: ['core', 'jazz', 'bach'],
  level: 2,
  summary: 'Why chords group into three jobs, why chords that share notes can stand in for each other, and how cadences use the three jobs to end a phrase — or pretend to.',
  blocks: [
    p('Why does one chord sequence feel like it is going somewhere while another just wanders? The answer is **harmonic function**: the idea that each chord in a key does one of three jobs, and that progressions feel purposeful when they move through those jobs in a particular order. Function is what lets a jazz pianist swap one chord for another without the tune falling apart, what lets you follow a song you have never heard, and what Bach relied on to make every phrase feel inevitable.'),
    p('The lesson on the chords of a key introduced the three functions. This one looks at what actually defines them, why chords group the way they do, and how cadences use them.'),

    h('What makes each function'),
    p('The clearest way to understand the functions is through two notes of the scale: degree **4** and degree **7**. Degree 7, the leading tone, pulls up to the tonic. Degree 4 leans down to 3. Together they form the tritone that gives a dominant chord its tension.'),
    p('- A **tonic** chord contains neither of them in a way that disturbs it. It holds degree 1 or 3 and sounds settled: this is home.\n- A **predominant** chord contains degree 4 but not degree 7. It has clearly left home — the 4th degree is the note that says "we are no longer on the tonic" — but it has not yet built up the full tension that demands a return.\n- A **dominant** chord contains both 4 and 7: the tritone. It is the point of greatest tension, and it wants to resolve to the tonic.'),
    p('In C major, that makes C, Am and Em tonic chords; F and Dm predominant; G7 and B° dominant. The rule of thumb is not perfect — music is not a formula — but it explains almost every case, and it gives you something concrete to listen for.'),

    h('Families of chords'),
    p('Chords that share most of their notes sound related, and they can usually do the same job. This is why each function has several members.'),
    p('Am shares two of its three notes with C major (C and E); it is essentially C major with the 5th replaced by a 6th, a darker version of home. Em shares E and G with C, but it also contains B, the leading tone, so it is a weak, slightly ambiguous tonic that can lean towards dominant. Dm7 (D F A C) contains the whole of an F major triad, which is why ii and IV are so interchangeable. And B° (B D F) is simply G7 without its root, so vii° acts as a dominant.'),
    table(['Function', 'Chords (major key)', 'Why they belong together', 'Feel'], [
      ['Tonic', 'I, vi, iii', 'vi is I with 6 instead of 5; iii is I with 7 instead of 1', 'home, or home in shadow'],
      ['Predominant', 'IV, ii', 'ii7 contains all of IV', 'lift, motion away'],
      ['Dominant', 'V, vii°', 'vii° is V7 without its root', 'leading tone + tritone'],
    ]),
    example('Why Dm7 can replace Fmaj7', [
      'Compare the notes: Fmaj7 is F A C E, Dm7 is D F A C. They share F, A and C.',
      'Both contain degree 4 (F) and neither contains the leading tone, so both are predominant.',
      'Swapping one for the other keeps the progression moving in the same direction. That is the principle behind I – vi – ii – V as a variation on I – vi – IV – V.',
    ], { prog: ['Cmaj7', 'Am7', 'Fmaj7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'G7'], key: 'C', beats: 2 }),
    p('Minor keys have the same three families with different members. The tonic is i, with ♭VI as a darker substitute (A♭maj7 shares three notes with Cm7). The predominants are iv and iiø7. The dominants are V7 and vii°7, both borrowed from harmonic minor so that they carry the leading tone.'),

    h('The shape of a phrase'),
    p('With the three functions in place, the basic shape of tonal harmony is easy to describe: **tonic → predominant → dominant → tonic**. You leave home, build tension, and return. I–IV–V–I tells the whole story in four chords. ii–V–I tells the last part of it, which is why it is everywhere in jazz. I–vi–ii–V loops it, with vi standing in for the tonic and ii for the predominant, and that loop is the basis of countless turnarounds.'),
    p('The order matters. Predominant to dominant feels like natural motion; dominant back to predominant — V to IV — tends to sound like a step backwards, and classical harmony avoids it. It is not forbidden in every style, though. The 12-bar blues goes V – IV – I in its last line, and that "backwards" move is a large part of the blues\' relaxed, unhurried character.'),

    h('Cadences: how phrases end'),
    p('A **cadence** is the harmonic punctuation at the end of a phrase, and each kind is defined by functions.'),
    p('- An **authentic cadence** goes dominant to tonic, V–I. It is a full stop: the tritone resolves, the leading tone rises to the tonic, the bass falls a 5th to the root.\n- A **half cadence** ends on the dominant. It is a comma or a question mark — the phrase pauses on the point of greatest tension and leaves you waiting for the answer.\n- A **plagal cadence** goes IV–I. It has no leading tone and no tritone, so it is gentle and warm rather than decisive: the "amen" at the end of a hymn, and a sound gospel music uses constantly.\n- A **deceptive cadence** goes V–vi. Everything is set up for V–I, and the leading tone still rises to the tonic, but the bass steps up to the 6th instead of falling to the root. You get a tonic-family chord, but a darker one than expected, and the phrase has to keep going.'),
    listen([
      { label: 'V – I', music: { prog: ['G7', 'C'], key: 'C', beats: 2 }, note: 'authentic: a full stop' },
      { label: 'I – IV – V', music: { prog: ['C', 'F', 'G'], key: 'C', beats: 2 }, note: 'half cadence: a question' },
      { label: 'IV – I', music: { prog: ['F', 'C'], key: 'C', beats: 2 }, note: 'plagal: the amen' },
      { label: 'V – vi', music: { prog: ['G7', 'Am'], key: 'C', beats: 2 }, note: 'deceptive: the surprise' },
    ]),
    p('The deceptive cadence is a favourite way to extend a phrase. Composers set up an ending, swerve to vi, and then make the journey through predominant and dominant again so that the real ending, when it comes, feels earned. Listen for it in the progression below.'),
    { t: 'prog', key: 'C', tokens: ['Cmaj7', 'Am7', 'Fmaj7', 'Dm7', 'G7', 'Am7', 'Dm7', 'G7', 'Cmaj7'], beats: 2, style: 'ballad', caption: 'T T PD PD D, a deceptive vi, then PD D T for real.' },

    h('Function beyond the key'),
    p('The idea of function extends to chords from outside the key. A **secondary dominant** borrows dominant function for a moment and aims it at a chord other than the tonic: A7 in C major contains C♯, a leading tone to D, so it acts as the dominant of Dm7. Jazz substitutions work the same way — the tritone substitute, the backdoor dominant, the diminished passing chord — each one works because it keeps the function of the chord it replaces. Later lessons take these one at a time.'),
    example('Label a line of changes by function', [
      'Em7 – A7 – Dm7 – G7 – Cmaj7 in C.',
      'Em7 is iii (tonic family). A7 is V7 of ii — a dominant aimed at Dm7, not at the tonic. Dm7 is ii (predominant). G7 is V (dominant). Cmaj7 is I.',
      'Read as functions: T – (D) – PD – D – T. The secondary dominant adds a little extra push on the way to the predominant.',
    ], { prog: ['Em7', 'A7', 'Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }),
    ear('To hear function, listen to the bass and for the leading tone. A bass falling a 5th onto a chord sounds like arrival; a chord with the leading tone in it sounds like it wants to move. Ask of each chord: home, away, or tension?'),
    tryIt('Play I – IV – V – I in C, then start swapping chords for others of the same function: vi for I at the start, ii for IV, vii° for V. The progression changes colour but keeps its direction. Then try one swap that breaks the rule — iii in place of IV, say — and notice how the sense of direction weakens.'),
    recap([
      'Each chord in a key is tonic (home), predominant (away) or dominant (tension).',
      'Degree 4 marks predominant; degree 4 plus degree 7 — the tritone — marks dominant.',
      'Chords that share notes share a function: vi and iii for I, ii for IV, vii° for V.',
      'The basic phrase is tonic → predominant → dominant → tonic.',
      'Cadences: authentic (V–I) ends, half (on V) pauses, plagal (IV–I) softens, deceptive (V–vi) swerves.',
    ]),
    drill('ear.cadence', 3),
  ],
  drills: ['ear.cadence', 'jazz.analysis'],
};
