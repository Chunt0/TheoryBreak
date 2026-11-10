import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const alt: Lesson = {
  id: 'jazz.alt',
  title: 'The altered dominant',
  tags: ['jazz', 'core'],
  level: 3,
  summary: 'A dominant carrying every altered tension at once — ♭9, ♯9, ♯11 and ♭13 — and why that maximum tension makes the resolution stronger, not weaker. The altered scale, its voicings, and where each tension goes.',
  blocks: [
    p('The plain dominant 7th is already the most tense chord in tonal harmony. Jazz pushes it further. The **altered dominant** — written **7alt** — keeps the root, 3rd and ♭7 of a dominant but replaces every other note with an altered tension: the ♭9, ♯9, ♯11 and ♭13. It is a thick, dark, crunchy sound, and on its own it can seem almost chaotic. Yet in context it is one of the most satisfying sounds in jazz, because every one of those altered notes is poised a half step away from a note of the chord that follows.'),
    p('This lesson explains why the altered dominant works, introduces the scale that contains it, and shows how to voice it and resolve it.'),

    h('What stays and what changes'),
    p('Two notes make a dominant a dominant: the **3rd** and the **♭7**, the tritone that wants to resolve. The altered dominant keeps both. Everything else is fair game.'),
    p('Over G7, the natural tensions would be the 9th (A), 11th (C) and 13th (E), and the 5th (D) is part of the chord. The altered dominant replaces all of those with notes a half step away. The 9th splits into two: **A♭ (♭9)** and **A♯ (♯9)**, which is usually written B♭. The 5th and 11th region becomes **C♯ (♯11)**, which is the same note as D♭, the ♭5. And the 13th becomes **E♭ (♭13)**, which is the same note as D♯, the ♯5. So a G7alt can contain G, B and F plus any or all of A♭, B♭, D♭ and E♭.'),
    p('Notice that the natural 5th has disappeared. In an altered chord, the 5th is either lowered or raised — there is no plain D — and that instability is part of what makes the chord so tense.'),
    listen([
      { label: 'G7', music: { chord: 'G7' }, note: 'the plain dominant' },
      { label: 'G7♭9', music: { chord: 'G7b9' }, note: 'one altered tension: dark' },
      { label: 'G7♯9', music: { chord: 'G7#9' }, note: 'bluesy bite: minor 3rd against major' },
      { label: 'G7alt', music: { chord: 'G7alt' }, note: 'every tension altered' },
    ]),

    h('Why more tension resolves better'),
    p('It seems backwards that a chord full of dissonance should resolve more convincingly than a plain one. The reason is voice leading. Every altered tension sits a half step from a note of the tonic chord, so each one has somewhere obvious to go.'),
    table(['Tension on G7', 'Note', 'Resolves (in C)'], [
      ['♭9', 'A♭', 'down to G, the 5th'],
      ['♯9', 'A♯ (B♭)', 'up to B, the maj7, or down to A'],
      ['♯11 / ♭5', 'C♯ (D♭)', 'down to C, the root, or up to D'],
      ['♭13 / ♯5', 'E♭', 'up to E, the 3rd, or down to D'],
    ]),
    p('Combine those with the guide tones — the 3rd B rising to C or staying as the maj7, the ♭7 F falling to E — and every note of an altered chord moves to the tonic by a half step or less. A plain G9, by contrast, has notes like D and A that can move in several directions without any particular pull. The altered dominant is all pull.'),
    example('Resolve G7alt to Cmaj9 by half steps', [
      'Voice G7alt as F B E♭ A♭ (♭7, 3, ♭13, ♭9) over G.',
      'Move each note the shortest way: F → E, B stays, E♭ → D, A♭ → G.',
      'You land on E B D G over C: Cmaj9. Every tension found a home a half step away.',
    ], { voicings: [['G2', 'F3', 'B3', 'Eb4', 'Ab4'], ['C3', 'E3', 'B3', 'D4', 'G4']], beat: 1.4 }),
    p('Altered dominants work especially well before **minor** chords, because the ♭9 and ♭13 are notes of the minor key itself. In C minor, A♭ and E♭ belong to the key; an altered G7 is quietly announcing C minor before it arrives. They work before major chords too — the half-step pull is just as strong — and there the contrast between the dark dominant and the bright tonic is part of the effect.'),

    h('The altered scale'),
    p('The scale that contains all four alterations is called the **altered scale**. From G: **G A♭ B♭ B C♯ E♭ F**, which reads as root, ♭9, ♯9, 3rd, ♯11, ♭13 and ♭7. It is sometimes called the super-Locrian or diminished whole-tone scale, because its lower part resembles the diminished scale and its upper part the whole-tone scale.'),
    p('It is also the 7th mode of melodic minor. G altered has exactly the notes of **A♭ melodic minor** (A♭ B♭ C♭ D♭ E♭ F G), with C♭ as B and D♭ as C♯. That gives you the shortcut every jazz player uses: **over a 7alt chord, play the melodic minor scale a half step above the root.** G7alt: A♭ melodic minor. E7alt: F melodic minor. B♭7alt: B melodic minor.'),
    p('The same A♭ melodic minor scale also gives **D♭ Lydian dominant**, the scale of D♭7♯11 — the tritone substitute of G7. So G7alt and D♭7♯11 are really one sound seen from two roots. That is why a bass player can play D♭ under a pianist\'s G7alt voicing and everything still fits.'),
    listen([
      { label: 'G altered scale', music: { scale: 'altered', from: 'G3' }, note: 'R ♭9 ♯9 3 ♯11 ♭13 ♭7' },
      { label: 'A♭ melodic minor', music: { scale: 'melodic_minor', from: 'Ab3' }, note: 'the same notes from A♭' },
    ]),

    h('Voicing it'),
    p('A good altered voicing keeps the guide tones and puts one or two altered tensions on top. Pianists often start with the shell — the ♭7 and 3rd — and add tensions above it. A very common shape over G is **F – B – E♭ – A♭**: ♭7, 3rd, ♭13, ♭9. Another is **B – F – A♭ – D♯** or **F – B – D♯ – G♯**, depending on which tensions you want on top.'),
    {
      t: 'keys',
      notes: ['G2', 'F3', 'B3', 'Eb4', 'Ab4'],
      labels: ['R', '♭7', '3', '♭13', '♭9'],
      caption: 'G7(♭9 ♭13): the shell (♭7 and 3) with both flat tensions on top.',
    },
    p('Upper-structure triads are another route. A major triad built on the ♭6 of the dominant — E♭ major over G7 (E♭ G B♭) — gives you the ♭13, root and ♯9 in one easy shape; a triad on the ♭5 — D♭ major (D♭ F A♭) — gives the ♯11, ♭7 and ♭9. The lesson on upper-structure triads goes through these in detail.'),
    p('Chord charts are not consistent about altered dominants. A chart might say **G7♭9**, **G7♯9**, **G7♭13**, **G7♯5** or simply **G7alt**. "Alt" gives you permission to use any combination of altered tensions; a specific symbol suggests which ones the composer heard. In practice, many players treat any dominant that resolves to a minor chord, or any dominant at a strong cadence, as a candidate for altered colour.'),
    onRecord('Many lead sheets write the alterations in. "Stella by Starlight" opens Em7♭5 – A7♭9; "Blue Bossa" cadences into C minor through Dm7♭5 – G7♭9. On the records, the pianist will usually go further than the symbol and the soloist will reach for the altered scale on that bar — listen for the moment the line turns crunchy just before the minor chord, and for how cleanly it lands.'),
    ear('An altered dominant sounds dark, dense and urgent, with no clear 5th. If you can hear a note a half step above the root (♭9) or a bluesy clash between a minor and major 3rd (♯9 against 3), you are almost certainly hearing an altered chord.'),
    tryIt('Play G7 – Cmaj7, then G7alt (F B E♭ A♭ over G) – Cmaj9, and listen to each altered note slide into its target. Then practise the shortcut in several keys: name the melodic minor scale for E7alt, B♭7alt, D7alt and A7alt, and play it over the chord before resolving.'),
    recap([
      'The altered dominant keeps the 3rd and ♭7 and alters everything else: ♭9, ♯9, ♯11 (♭5) and ♭13 (♯5).',
      'Each altered tension sits a half step from a note of the tonic, so the resolution is stronger, not weaker.',
      'The altered scale (G A♭ B♭ B C♯ E♭ F) is melodic minor a half step above the root.',
      'G7alt and D♭7♯11 share the same notes: tritone substitution in another form.',
      'Voice it with the shell (♭7 and 3) plus altered tensions on top, or with an upper-structure triad.',
    ]),
    drill('ear.chord.alt', 3),
  ],
  drills: ['ear.chord.alt', 'jazz.mm', 'jazz.chordscale'],
};
