import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const tritone: Lesson = {
  id: 'jazz.tritone',
  title: 'Tritone substitution',
  tags: ['jazz', 'core'],
  level: 2,
  summary: 'Replace a dominant 7th with the one a tritone away: D♭7 for G7. Why the swap works, what it does to the bass line and the colour, and how far you can take it.',
  blocks: [
    p('The **tritone substitution** is probably the most famous trick in jazz harmony. Take any dominant 7th chord and replace it with the dominant 7th whose root is a tritone away — **D♭7 instead of G7**. On paper the two chords look unrelated; their roots are as far apart as two notes can be. In practice the substitute does the same job as the original, resolves to the same chord, and adds a slippery chromatic bass line and a darker, more sophisticated colour.'),
    p('Understanding why it works teaches you a lot about what a dominant chord really is.'),

    h('Why it works: the shared tritone'),
    p('The engine of a dominant 7th chord is the tritone between its 3rd and its 7th. In G7, that is B and F. Those two notes are what want to resolve — B up to C, F down to E — and they are what make G7 sound like it is leading to C.'),
    p('Now look at D♭7: D♭, F, A♭, C♭. Its 3rd is F and its 7th is C♭ — which is B, spelled differently. **D♭7 contains exactly the same tritone as G7**, with the roles swapped: G7\'s 3rd is D♭7\'s 7th, and G7\'s 7th is D♭7\'s 3rd. Because the tritone is symmetrical — it divides the octave exactly in half — this is true of any two dominants a tritone apart. They share their engine, so they can do each other\'s job.'),
    table(['Dominant', 'Sub', 'Shared tritone'], [
      ['G7', 'D♭7', 'B / F'],
      ['C7', 'G♭7', 'E / B♭'],
      ['D7', 'A♭7', 'F♯ / C'],
      ['A7', 'E♭7', 'C♯ / G'],
      ['E7', 'B♭7', 'G♯ / D'],
    ]),

    h('What changes: the bass and the colour'),
    p('If the tritone stays the same, what is different? Two things.'),
    p('**The bass line.** In Dm7 – G7 – Cmaj7 the roots move D → G → C, two strong leaps of a 4th. In Dm7 – D♭7 – Cmaj7 they move D → D♭ → C, sliding down by half steps. The function is identical, but the root motion has gone from strong leaps to a smooth chromatic slide. That descending half step into the tonic is the signature sound of the tritone sub.'),
    p('**The colour.** Look at the other notes of D♭7 from G\'s point of view. D♭ is G\'s ♭5 (or ♯11); A♭ is G\'s ♭9. So a D♭7 chord, heard against the original harmony, is really a **G7 with altered tensions** — a ♭9 and a ♯11 — plus a chromatic bass note. That is why the tritone sub sounds darker and more sophisticated than the plain V7, and why the altered scale on G and the Lydian dominant scale on D♭ contain the same notes: it is all one sound, seen from two roots.'),
    { t: 'prog', key: 'C', tokens: ['ii7', 'V7', 'Imaj7', 'Imaj7'], style: 'swing', caption: 'Original: Dm7 – G7 – Cmaj7' },
    { t: 'prog', key: 'C', tokens: ['ii7', 'bII7', 'Imaj7', 'Imaj7'], style: 'swing', caption: 'Tritone sub: Dm7 – D♭7 – Cmaj7' },

    h('Finding the substitute'),
    p('A tritone is three whole steps, or six semitones. To find the sub for any dominant, count three whole steps up (or down — it is the same note) from its root and build a dominant 7th there. With practice you will simply know the pairs: G and D♭, C and G♭, D and A♭, A and E♭, E and B♭, B and F.'),
    p('A useful check is the shared tritone: the 3rd of one chord should be the 7th of the other, and vice versa. If that works, you have the right pair.'),
    example('The tritone sub of E♭7', [
      'Three whole steps from E♭: F, G, A → **A7**.',
      'Check the tritone: E♭7 has G (3rd) and D♭ (♭7); A7 has C♯ (3rd) and G (♭7). D♭ and C♯ are the same note, so the pair is the same, roles swapped.',
      'In a cadence to A♭: B♭m7 – E♭7 – A♭maj7 becomes B♭m7 – A7 – A♭maj7, and the bass slides B♭ → A → A♭.',
    ], { prog: ['Bbm7', 'A7', 'Abmaj7'], key: 'Ab', beats: 2, style: 'swing' }),
    listen([
      { label: 'G7 → C', music: { prog: ['Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }, note: 'roots leap in 4ths' },
      { label: 'D♭7 → C', music: { prog: ['Dm7', 'Db7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }, note: 'roots slide by half steps' },
    ]),

    h('Going further'),
    p('Once you have the basic idea, it extends in several directions.'),
    p('**Substitute the ii as well.** The tritone sub can bring its own related ii chord: D♭7\'s ii is A♭m7, so Dm7 – G7 – C can become **A♭m7 – D♭7 – Cmaj7**. Now the whole ii–V has moved a tritone away, and the effect is bolder — the A♭m7 sounds genuinely distant before the D♭7 slides home. A popular intermediate step keeps the original ii and only subs the V, or plays the original ii–V and then the sub: Dm7 – A♭m7 – D♭7 – Cmaj7.'),
    p('**Substitute secondary dominants.** Any dominant in a progression can be swapped, not just the V. In a turnaround, A7 (V7/ii) becomes E♭7, so Cmaj7 – A7 – Dm7 – G7 becomes Cmaj7 – E♭7 – Dm7 – D♭7, with the bass descending E♭, D, D♭, C. Swap the dominants in a chain of extended dominants and the bass line becomes a chromatic slide: E7 – A7 – D7 – G7 can become E7 – E♭7 – D7 – D♭7.'),
    p('**Choose the right scale.** The tritone sub is a dominant that does not resolve down a 5th, and the scale that suits it is **Lydian dominant** — Mixolydian with a ♯11. Over D♭7, D♭ Lydian dominant is D♭ E♭ F G A♭ B♭ C♭, and its G (the ♯11) is the root of the original G7 that the chord replaced. It is the same collection of notes as G altered.'),
    example('Mix original and substitute dominants in a chain', [
      'Start: Em7 – A7 – Dm7 – G7 – Cmaj7, roots falling in 5ths.',
      'Sub only the dominants: A7 → E♭7, G7 → D♭7.',
      'Result: Em7 – E♭7 – Dm7 – D♭7 – Cmaj7. Minor chords on the beat, dominants sliding between them: a bass line that walks straight down from E to C.',
    ], { prog: ['Em7', 'Eb7', 'Dm7', 'Db7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }),

    h('When to use it'),
    p('The tritone sub is a colour, not an improvement. It suits moments where you want smoothness and sophistication: the last bars of a ballad, a turnaround in a solo, a reharmonisation of a familiar tune. It can clash with a melody that sits on the original dominant\'s natural 9th or 5th — over G7, a melody note D is a calm 5th, but over D♭7 it becomes a ♭9 sitting a half step above the root, which can sound harsh on a long note — so check the melody before substituting under the head.'),
    p('In a band, bass players and pianists often use tritone subs spontaneously, and they can do so precisely because the shared tritone keeps everything compatible. If the pianist plays G7 and the bassist plays D♭, the result is a G7 with a ♭5 in the bass — an altered dominant — and it still resolves to C.'),
    onRecord('Two famous ones written into the tune itself: "The Girl from Ipanema" opens Fmaj7 – G7 – Gm7 – G♭7 – Fmaj7, where G♭7 stands in for C7 and lets the bass slide G → G♭ → F. And the A section of Ellington\'s "Satin Doll" climbs through ii–Vs before Am7 – D7 gives way to A♭m7 – D♭7, a whole ii–V moved a tritone, sliding into C. Beyond the written changes, listen to almost any walking bassist at the end of a phrase: the half-step slide into the tonic is the sound.'),
    ear('Listen to the bass at the cadence. If it leaps up a 4th into the tonic, the dominant is the original V7; if it slides down a half step into the tonic, it is the tritone sub.'),
    tryIt('Play Dm7 – G7 – Cmaj7 and Dm7 – D♭7 – Cmaj7 back to back, holding the guide tones F and B (C♭) in the same place for both dominants. Only the bass changes. Then try A♭m7 – D♭7 – Cmaj7, and the full chromatic turnaround Em7 – E♭7 – Dm7 – D♭7.'),
    recap([
      'The tritone sub replaces a dominant with the dominant a tritone away: D♭7 for G7.',
      'Both chords share the same tritone (B/F), with the 3rd and 7th swapping roles.',
      'The sub turns the bass into a chromatic slide (D → D♭ → C) and sounds like an altered V7 (♭9, ♯11).',
      'Sub the ii too (A♭m7 – D♭7), or sub secondary dominants for chromatic bass lines.',
      'The usual scale is Lydian dominant — the same notes as the original dominant\'s altered scale.',
    ]),
    drill('jazz.tritone'),
  ],
  drills: ['jazz.tritone', 'ear.motion', 'ear.prog.subs'],
};
