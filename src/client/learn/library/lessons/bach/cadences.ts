import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const cadences: Lesson = {
  id: 'bach.cadences',
  title: 'Cadences: Bach vs. jazz',
  tags: ['bach', 'jazz', 'soul'],
  level: 1,
  summary: 'The same harmonic punctuation in three dialects: how Bach, jazz and soul end their phrases — authentic, half, Phrygian, plagal, deceptive and Picardy cadences — and the cadential 6/4 that looks like a tonic but acts as a dominant.',
  blocks: [
    p('Every style of tonal music needs ways to end a phrase: a full stop, a comma, a question, a surprise. Those harmonic punctuation marks are called **cadences**, and the lesson on harmonic function introduced the main types. What is fascinating is how differently styles dress the same punctuation. Bach\'s authentic cadence, a bebop ending and a gospel "amen" are recognisably the same gestures in different accents.'),
    p('This lesson goes through each cadence as Bach writes it, then shows its equivalents in jazz and soul — and looks closely at one Baroque cadence formula, the cadential 6/4, that turns up everywhere.'),

    h('Authentic cadences'),
    p('The **authentic cadence**, V – I, is the full stop of tonal music. Bach\'s chorales end nearly every phrase with one, marked in the score with a fermata (a pause). Theory distinguishes the strongest form, the **perfect authentic cadence** — both chords in root position, with the soprano arriving on the tonic — from weaker **imperfect** versions, where the soprano ends on the 3rd or 5th, or one of the chords is inverted. In a chorale, the perfect version usually ends the whole piece, while imperfect ones close intermediate phrases.'),
    p('The melodic shape of Bach\'s authentic cadences is very consistent. The bass leaps from 5 to 1. The soprano typically falls 2 – 1 or rises 7 – 1. The leading tone rises, and the 7th of V7, if present, falls.'),
    p('Jazz keeps the function but changes the colour. An authentic cadence in a standard is more likely to be **V7alt – Imaj7**, with all the altered tensions resolving by half step, or the tritone sub **♭II7 – I**, with the bass sliding down a half step. Soul and gospel often prefer the soft dominant, **IV/V – I**. The underlying motion — dominant to tonic, guide tones resolving — is the same.'),

    h('The cadential 6/4'),
    p('One Baroque formula is so common that it deserves special attention. Just before the final V – I, Bach very often writes what looks like a tonic chord in second inversion — I6/4, C/G in C major — and then V, then I. It looks as if the tonic arrives early. But it does not sound that way, and the reason is the bass.'),
    p('Over the bass G, the 6/4 chord has C and E — a 4th and a 6th above the bass. Those notes behave like **suspensions**: they fall to B and D, the 3rd and 5th of the G chord. The bass never moves. So what sounds is a dominant chord with two decorations that resolve into it: **V with suspensions**, not a real tonic. This is called the **cadential 6/4**, and it is the reason the 6/4 chord appears so often just before cadences in Classical and Baroque music.'),
    example('The cadential 6/4 in C', [
      'Bass G under C and E: it looks like C/G (I6/4).',
      'Over the G, C falls to B (4 → 3) and E falls to D (6 → 5): now it is G — V.',
      'So I6/4 – V – I is really V (with two suspensions) – I.',
    ], { voicings: [['G2', 'C4', 'E4', 'G4'], ['G2', 'B3', 'D4', 'G4'], ['C3', 'C4', 'E4', 'G4']], beat: 1.2 }),
    p('Jazz has a close relative: the **sus chord** resolving to the dominant. G7sus4 to G7 has the same 4 → 3 motion over a held dominant bass, which is why the two sound so related.'),

    h('Half cadences and the Phrygian cadence'),
    p('A **half cadence** ends a phrase on V: a comma or a question mark. Bach uses half cadences constantly in the middle of chorales, pausing on the dominant before the music continues.'),
    p('In minor keys, there is a special and very beautiful version: the **Phrygian half cadence**, iv6 – V. In A minor that is Dm/F to E. The bass falls a half step, F to E, while an upper voice rises a whole step, D to E, so the two outer voices open out from a 6th to an octave. The half-step fall in the bass — the ♭2 to 1 of E Phrygian, if you hear it from E — gives the cadence its name and its solemn, archaic sound. It is a Baroque signature: slow movements often end on a Phrygian cadence, leaving the music hanging before the next movement begins. The middle movement of Bach\'s Brandenburg Concerto No. 3 consists of little more than one.'),
    example('A Phrygian half cadence in A minor', [
      'iv6: D minor with F in the bass (F A D). V: E major (E G♯ B).',
      'The bass falls a half step, F → E. An upper voice rises D → E. Another falls A → G♯, the leading tone.',
      'The outer voices open from a 6th to an octave by contrary motion: the solemn, suspended Phrygian sound.',
    ], { prog: ['Am', 'Dm/F', 'E'], key: 'Am', beats: 2 }),
    p('Jazz and soul have their own half-cadence habits: ending a section on a **V7sus** chord that hangs unresolved, or vamping between **♭VI and V7** in minor, which uses the same half-step bass descent as the Phrygian cadence.'),

    h('Plagal, deceptive and Picardy'),
    p('The **plagal cadence**, IV – I, has no leading tone and no tritone; it is gentle and warm. Bach most often uses it as an extension after the real ending — an authentic cadence followed by a short plagal coda, often over a held tonic in the bass. Gospel turns it into the coloured "amen", **IV – iv – I**, with the borrowed ♭6 sighing down to the 5th.'),
    p('The **deceptive cadence**, V – vi, sets up an ending and swerves. Bach uses it to extend a phrase that might otherwise have ended too soon: the music arrives on vi, regroups and cadences properly a few beats later. Jazz has many deceptive moves of its own — V7 resolving to ♭VImaj7, or a dominant leading to a IV/V that delays the arrival again.'),
    p('A **Picardy third** ends a minor-key piece on a major tonic chord: the final chord\'s 3rd is raised, and the music closes in sudden light. Baroque composers did this so often that a minor-key piece ending on a minor chord was almost the exception. Jazz and soul tunes in minor sometimes end the same way, landing on a major chord with added colour.'),
    table(['Cadence', 'Common practice', 'Jazz / soul'], [
      ['Authentic', 'V7 – I', 'V7alt – Imaj7 · subV7 – I · IV/V – I'],
      ['Plagal', 'IV – I', 'IV – iv – I · the gospel "amen"'],
      ['Half', '… – V', 'ending on V7sus'],
      ['Phrygian half', 'iv6 – V (minor)', '♭VI – V7 vamps'],
      ['Deceptive', 'V – vi', 'V7 – ♭VImaj7 · V7 – IV/V'],
      ['Picardy', 'minor → major I', 'a minor tune ending on a major chord'],
    ]),
    listen([
      { label: 'Phrygian half', music: { prog: ['Am', 'Dm/F', 'E'], key: 'Am', beats: 2 }, note: 'the bass falls a half step to V' },
      { label: 'Deceptive', music: { prog: ['F', 'G7', 'Am'], key: 'C', beats: 2 }, note: 'V swerves to vi' },
      { label: 'Minor plagal', music: { prog: ['Cmaj7', 'Fm6', 'Cmaj7'], key: 'C', beats: 2 }, note: 'the gospel amen' },
      { label: 'Picardy', music: { prog: ['Dm', 'E7', 'A'], key: 'Am', beats: 2 }, note: 'a minor key ending in major' },
    ]),
    onRecord('In a Bach chorale, every fermata marks a cadence. Listen to a chorale and name each one as it arrives — authentic, half, Phrygian, deceptive — and notice how the strongest cadence is saved for the end. Then listen to a jazz ballad\'s last bars and find the same punctuation in its own accent.'),
    ear('To identify a cadence, listen to its last two chords and the bass beneath them. A bass leaping 5 → 1 means authentic; a phrase stopping on V means half; a bass falling a half step onto V in minor means Phrygian; V followed by a minor chord instead of the tonic means deceptive; and a minor piece ending suddenly bright means Picardy.'),
    tryIt('Play each cadence in the listening row, then play the cadential 6/4 slowly, holding the bass G while C and E fall to B and D. Finally, take a Bach-style cadence (ii6 – I6/4 – V7 – I in C) and rewrite it in jazz dress (Dm9 – G7sus4 – G7alt – Cmaj9): the same journey in another dialect.'),
    recap([
      'Cadences are harmonic punctuation; Bach, jazz and soul use the same ones in different dress.',
      'Authentic (V – I): perfect when both chords are in root position and the soprano lands on the tonic.',
      'The cadential 6/4 looks like I but is V with two suspensions (6–5 and 4–3) over the dominant bass.',
      'The Phrygian half cadence (iv6 – V in minor) has the bass falling a half step to V — a Baroque signature.',
      'Plagal, deceptive and Picardy cadences soften, extend and brighten endings.',
    ]),
    drill('ear.cadence', 3),
  ],
  drills: ['ear.cadence', 'ear.prog.bach'],
};
