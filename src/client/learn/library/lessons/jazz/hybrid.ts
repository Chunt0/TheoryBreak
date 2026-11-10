import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const hybrid: Lesson = {
  id: 'jazz.hybrid',
  title: 'Slash chords & hybrid voicings',
  tags: ['jazz', 'soul'],
  level: 3,
  summary: 'A triad over a bass note it does not contain: how B♭/C, D/C, D♭/C and E/C spell out sus, Lydian, Phrygian and augmented sounds, and why F/G is the everyday dominant of gospel and R&B.',
  blocks: [
    p('Modern charts are full of chords with a slash in them: C/E, F/G, D/C, B♭/C. The notation is simple — a chord to the left of the slash, a bass note to the right — but it covers two quite different things. Sometimes the bass note belongs to the chord, and the slash just tells you which inversion to play. Sometimes it does not, and then the result is a new sound altogether, called a **hybrid** chord. Hybrids are one of the most useful voicing ideas in jazz, gospel and R&B: one easy triad and one bass note give a precise, modern colour.'),

    h('Inversions and hybrids'),
    p('When the bass note is one of the chord\'s own notes, a slash chord is an **inversion**. C/E is a C major triad with its 3rd in the bass; C/G has the 5th in the bass. The chord is still C major; only the bass line has changed.'),
    p('When the bass note is **not** in the chord, something more interesting happens. The ear hears the bass as the root of a new chord, and the triad above it becomes that chord\'s upper notes — its 7th, 9th, 11th or 13th. B♭/C is not a kind of B♭ chord; it is a kind of C chord, with B♭, D and F sitting above C as its ♭7, 9th and 11th. That is a **hybrid**: a chord whose identity comes from the relationship between a triad and a foreign bass.'),
    p('Hybrids usually have no 3rd above the bass. That is what distinguishes them from upper-structure triads, where the left hand plays the 3rd and 7th under the triad. Without a 3rd, a hybrid is neither clearly major nor minor, and it has an open, suspended, modern quality.'),

    h('Four essential hybrids'),
    p('Over a C bass, four triads produce four distinct and very useful sounds.'),
    p('**B♭/C** — a major triad a whole step below the bass. B♭, D and F are C\'s ♭7, 9th and 11th: a **C9sus4**, the soft dominant. It has the root and ♭7 of a dominant but no tritone, so it pulls gently rather than urgently.'),
    p('**D/C** — a major triad a whole step above the bass. D, F♯ and A are C\'s 9th, ♯11 and 13th: a bright, floating **Lydian** sound. (The same four notes also make a D7 in third inversion, and in a classical context it would resolve that way, to G/B. Context decides which you hear.)'),
    p('**D♭/C** — a major triad a half step above the bass. D♭, F and A♭ are C\'s ♭9, 11th and ♭13: the dark **Phrygian** or **sus♭9** sound, much loved in modal jazz.'),
    p('**E/C** — a major triad a major 3rd above the bass. E, G♯ and B are C\'s 3rd, ♯5 and major 7th: a **maj7♯5**, the Lydian augmented colour, bright and strange.'),
    table(['Hybrid', 'Triad', 'Against the bass', 'Sound'], [
      ['B♭/C', 'B♭ D F', '♭7 9 11', 'C9sus4: the soft dominant'],
      ['D/C', 'D F♯ A', '9 ♯11 13', 'C Lydian'],
      ['D♭/C', 'D♭ F A♭', '♭9 11 ♭13', 'C Phrygian, sus♭9'],
      ['E/C', 'E G♯ B', '3 ♯5 7', 'Cmaj7♯5, Lydian augmented'],
    ]),
    listen([
      { label: 'B♭/C', music: { voicings: [['C3', 'Bb3', 'D4', 'F4']], beat: 1.6 }, note: 'soft dominant: 9sus4' },
      { label: 'D/C', music: { voicings: [['C3', 'D4', 'F#4', 'A4']], beat: 1.6 }, note: 'bright Lydian' },
      { label: 'D♭/C', music: { voicings: [['C3', 'Db4', 'F4', 'Ab4']], beat: 1.6 }, note: 'dark sus♭9' },
      { label: 'E/C', music: { voicings: [['C3', 'E4', 'G#4', 'B4']], beat: 1.6 }, note: 'strange maj7♯5' },
    ]),
    p('Because these relationships are fixed, you can find any of them in any key by interval rather than by spelling. A major triad a **whole step below** the bass always gives a 9sus4; a **whole step above**, Lydian; a **half step above**, sus♭9; a **major 3rd above**, maj7♯5. Learn the four distances and you can play these colours anywhere.'),

    h('IV over V: the gospel dominant'),
    p('The first of those relationships deserves special attention, because it is everywhere. In C major, **F/G** — the IV triad over the V bass — is a G9sus4, the "whole step below" hybrid on G. Gospel, R&B and soul use it constantly in place of a plain G7. It still leads home to C, but with a softer, warmer, more open sound, and it voices beautifully: a simple F triad in the right hand, G in the left.'),
    p('F/G belongs to the same family as the sus chords of modal jazz. Dm7/G — the ii chord over the V bass — adds a D (the 5th of G) and is essentially the same sound. That "ii over V" idea is why sus chords feel like a dominant and a predominant at once.'),
    { t: 'prog', key: 'C', tokens: ['Cmaj7', 'Bb/C', 'Fmaj7', 'F/G', 'Cmaj7'], beats: 4, style: 'ballad', caption: 'Hybrids as dominants: B♭/C (C9sus) leads to F, F/G (G9sus) back to C.' },
    example('Why F/G works as V in C', [
      'F/G is F A C over G. Against G: F = ♭7, A = 9, C = 11. A G9sus4.',
      'It has G\'s root and ♭7, so it behaves as a dominant, but no 3rd and so no tritone: the pull is gentle.',
      'Resolve it to C: F falls to E, A falls to G, C stays. Smooth, warm and unhurried — the sound of a gospel cadence.',
    ], { voicings: [['G2', 'F3', 'A3', 'C4'], ['C3', 'E3', 'G3', 'C4']], beat: 1.4 }),
    example('Spell D♭/C and resolve it', [
      'Triad D♭ F A♭ over a C bass.',
      'Against C: D♭ = ♭9, F = 11 (the sus 4th), A♭ = ♭13. No 3rd, so it is a Phrygian or sus♭9 sound.',
      'Treat it as a dominant (C is V of F): D♭ falls to C, A♭ rises to A and F stays. C7sus♭9 → F.',
    ], { voicings: [['C3', 'Db4', 'F4', 'Ab4'], ['F2', 'C4', 'F4', 'A4']], beat: 1.4 }),

    h('Minor triads and other hybrids'),
    p('Minor triads over a foreign bass work the same way. **Gm/C** (G B♭ D over C) gives the 5th, ♭7 and 9th — another 9sus sound, slightly darker than B♭/C. **Dm/G** is the same thing on G. As you meet more slash chords on charts, the method is always the same: spell the triad, name each of its notes against the bass, and the chord\'s identity — and its likely function — falls out.'),
    p('Chord charts are inconsistent here. One chart might write C9sus4, another B♭/C, another Gm7/C; all three point to nearly the same sound. Reading the slash version is often easier, because it tells you exactly what to play: a triad you know, over a bass note you can find.'),
    onRecord('Herbie Hancock\'s "Maiden Voyage" is built from sus hybrids, each held for several bars. In gospel and R&B, listen for the IV/V chord at the end of almost every phrase — the gentle, open dominant just before the music comes home.'),
    ear('Hybrids sound open and suspended because there is no 3rd above the bass. Listen for the relationship between the bass and the bright triad above it: a whole step below sounds soft and dominant, a whole step above bright and floating, a half step above dark and Spanish.'),
    tryIt('Keep C in the left hand and play B♭, D, D♭ and E triads in the right, naming each sound. Then move the bass to G and play the same four relationships: F/G, A/G, A♭/G and B/G. Finally, play Cmaj7 – B♭/C – Fmaj7 – F/G – Cmaj7 as a slow ballad progression.'),
    recap([
      'A slash chord is a chord over a bass note: an inversion if the bass is a chord tone, a hybrid if it is not.',
      'In a hybrid the triad becomes the upper notes of a chord on the bass, usually with no 3rd.',
      'Over C: B♭/C = 9sus4, D/C = Lydian, D♭/C = sus♭9, E/C = maj7♯5 — fixed distances that work in any key.',
      'IV/V (F/G in C) is the everyday soft dominant of gospel and R&B.',
      'To read any slash chord, name the triad\'s notes against the bass.',
    ]),
    drill('jazz.ust', 3),
  ],
  drills: ['jazz.ust', 'ear.chord.ext'],
};
