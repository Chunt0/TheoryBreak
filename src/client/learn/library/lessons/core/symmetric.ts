import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const symmetric: Lesson = {
  id: 'core.symmetric',
  title: 'Diminished & whole-tone systems',
  tags: ['core', 'jazz', 'bach'],
  level: 3,
  summary: 'Scales and chords that divide the octave into equal parts have no single home — which is exactly why one diminished chord can lead to four keys, and why these sounds fit dominant chords so well.',
  blocks: [
    p('Most scales have a clear centre: one note everything else leans towards. A major scale is lopsided — two half steps in particular places — and that unevenness is what gives it a tonic and a leading tone. **Symmetric** scales and chords are different. They are built from one interval repeated, so they divide the octave into equal parts and look the same from several starting points.'),
    p('That symmetry has two consequences. A symmetric sound has no single home, so it can feel floating, ambiguous or unstable. And because it looks the same from several roots, a single symmetric chord or scale can belong to several keys at once. Composers from Bach to Coltrane have used that ambiguity as a way of travelling. This lesson covers the two symmetric systems you will meet constantly: diminished, built on minor 3rds, and whole-tone, built on whole steps.'),

    h('The diminished 7th chord'),
    p('Stack minor 3rds from C: C, E♭, G♭, B𝄫 (which sounds as A). One more minor 3rd above A brings you back to C. Four minor 3rds make exactly one octave, so the **diminished 7th** chord divides the octave into four equal parts.'),
    p('Because every gap is identical, any of the four notes could be the root. C°7, E♭°7, F♯°7 (or G♭°7) and A°7 are the same four pitches, just spelled from different starting points. Move the chord up a semitone and you get a new one, C♯°7; up another and you get D°7; up a third time and you get E♭°7, which is C°7 again. So there are only **three different diminished 7th chords** in all of music. Every diminished 7th you will ever see is one of those three, spelled one way or another.'),

    h('Why diminished chords lead to dominants'),
    p('Here is the connection that makes the diminished 7th so useful. Take G7♭9: G B D F A♭. Remove the root and what is left — B D F A♭ — is a diminished 7th chord. **A diminished 7th is a dominant 7♭9 without its root.** That is why vii°7 behaves like V in a minor key: B°7 in C minor is simply a rootless G7♭9.'),
    p('Now combine that fact with the symmetry. B°7 contains four notes, and any of them can be heard as the 3rd of a 7♭9 chord. Put a root a major 3rd below each note in turn — G under B, B♭ under D, D♭ under F, E under A♭ — and the same diminished chord becomes rootless G7♭9, B♭7♭9, D♭7♭9 or E7♭9. Each of those dominants resolves to a different tonic: C, E♭, G♭ or A. One chord, four possible destinations, a minor 3rd apart.'),
    example('One dim7, four dominants', [
      'B°7 = B D F A♭ — every note a minor 3rd from the next.',
      'Put a root a major 3rd below any note: G (under B), B♭ (under D), D♭ (under F), E (under A♭).',
      'So B°7 is a rootless G7♭9, B♭7♭9, D♭7♭9 or E7♭9 — and it can lead to C, E♭, G♭ or A.',
    ], { voicings: [['G2', 'B3', 'D4', 'F4', 'Ab4'], ['C3', 'C4', 'E4', 'G4']], beat: 1.3 }),
    table(['dim7', 'Same notes as', 'Rootless 7♭9 of'], [
      ['C°7', 'E♭°7 · F♯°7 · A°7', 'B7 · D7 · F7 · A♭7'],
      ['C♯°7', 'E°7 · G°7 · B♭°7', 'C7 · E♭7 · G♭7 · A7'],
      ['D°7', 'F°7 · A♭°7 · B°7', 'D♭7 · E7 · G7 · B♭7'],
    ]),
    p('Bach exploits this constantly. A diminished 7th is the most dramatic chord in his vocabulary, and because it can be respelled as the vii°7 of four different keys, it is his favourite hinge for a sudden modulation: the music arrives on a diminished chord heard as belonging to one key, and leaves it as if it belonged to another. On paper the spelling changes with the destination: heading for C, the chord is B D F A♭ (vii°7 of C); heading for E♭, the same keys are written D F A♭ C♭ (vii°7 of E♭), with B respelled as C♭ so that every note shows how it resolves.'),
    listen([
      { label: 'B°7 → C, then → E♭', music: { voicings: [['B3', 'D4', 'F4', 'Ab4'], ['C4', 'E4', 'G4', 'C5'], ['B3', 'D4', 'F4', 'Ab4'], ['Bb3', 'Eb4', 'G4', 'Bb4']], beat: 1 }, note: 'the same chord resolving two ways' },
    ]),

    h('Diminished passing chords'),
    p('Jazz and gospel use diminished chords most often as **passing chords** that connect two chords a whole step apart. Between Cmaj7 and Dm7, a C♯°7 fills the gap: the bass moves up chromatically, C – C♯ – D, and C♯°7 is really a rootless A7♭9, the dominant of D minor. Continue the idea and you get a whole walk-up: I – ♯I°7 – ii – ♯II°7 – iii, each diminished chord acting as a secondary dominant to the chord above it.'),
    { t: 'prog', key: 'C', tokens: ['Cmaj7', 'C#dim7', 'Dm7', 'D#dim7', 'Em7'], beats: 2, style: 'ballad', caption: 'A chromatic walk-up: each diminished chord leads to the chord a half step above' },

    h('The diminished scale'),
    p('Fill in the gaps of a diminished 7th chord and you get an eight-note scale that alternates whole and half steps. Like the chord, it repeats every minor 3rd, and there are only **three** diminished scales in total. It comes in two orderings, depending on which note you treat as the root.'),
    p('Starting with a whole step gives the **whole–half** scale, which fits the diminished 7th chord itself: each extra note sits a whole step above a chord tone, so nothing clashes. Starting with a half step gives the **half–whole** scale, which fits a **dominant** chord. From G it runs G A♭ B♭ B C♯ D E F. Read against G7, that is a ♭9 and a ♯9, the 3rd, a ♯11, the 5th, a natural 13th and the ♭7 — a very particular mix of altered and natural tensions, written as **13♭9**.'),
    p('The symmetry shows up in the way players use it. Any pattern that fits G half–whole also fits it moved up a minor 3rd, so a short figure can be repeated on B♭, D♭ and E and still sit inside the same scale. Those climbing or falling sequences in minor 3rds are one of the most recognisable sounds in post-bop improvisation.'),
    listen([
      { label: 'G half-whole', music: { scale: 'dim_hw', from: 'G3', drone: true }, note: '♭9, ♯9 and a natural 13' },
      { label: 'G13♭9', music: { chord: 'G13b9' }, note: 'the chord the scale describes' },
    ]),

    h('The whole-tone scale'),
    p('The second symmetric system uses only whole steps: C D E F♯ G♯ A♯. Six notes divide the octave into six equal parts, so there are only **two** whole-tone scales — one on C and one on C♯ — and between them they contain all twelve notes.'),
    p('With no half steps at all, the whole-tone scale has no leading tone, no perfect 5th and nothing that pulls towards a tonic. Everything floats. That is why it became the classic sound of dreams and suspended time, from Debussy\'s piano music to film scores, and why Thelonious Monk\'s cascading whole-tone runs sound so unmistakable.'),
    p('In jazz harmony it is a dominant scale. From G it gives G A B C♯ D♯ F: the root, 9th, 3rd, ♯11, ♯5 (or ♭13) and ♭7. That fits dominant chords with a raised or lowered 5th — **7♯5, 9♯5 and 7♭5**. Augmented triads live inside it too: G B D♯ and A C♯ F are both in G whole-tone.'),
    listen([
      { label: 'G whole tone', music: { scale: 'whole_tone', from: 'G3', drone: true }, note: 'no half steps: floating' },
      { label: 'G9♯5 → C', music: { prog: ['G9#5', 'Cmaj7'], key: 'C', beats: 2 }, note: 'the augmented dominant resolving' },
    ]),
    example('Choose a symmetric scale for the chord', [
      'G13♭9: a ♭9 together with a natural 13 — only the half–whole diminished scale has both. **G half–whole.**',
      'G7♯5: a raised 5th with a natural 9 — **G whole tone**.',
      'B°7 as a chord in its own right: **B whole–half**, which adds a note a whole step above each chord tone.',
    ]),
    ear('Symmetric sounds give themselves away by refusing to settle. A diminished chord sounds tense but directionless until it resolves; a whole-tone passage sounds weightless, as if gravity has been switched off. If a dominant has both a ♭9 and a bright 13th, it is almost certainly diminished.'),
    tryIt('Play B°7 and resolve it to C major. Then keep the same chord, put B♭ in the bass and resolve to E♭; then D♭ and resolve to G♭; then E and resolve to A. One chord, four keys. Afterwards, play the walk-up Cmaj7 – C♯°7 – Dm7 – D♯°7 – Em7 and notice how each diminished chord pulls up into the next.'),
    recap([
      'Symmetric chords and scales repeat one interval, so they divide the octave evenly and have no single home.',
      'There are only three diminished 7th chords; each is a rootless 7♭9 of four dominants a minor 3rd apart, so it can lead to four keys.',
      'Diminished passing chords connect chords a step apart (I – ♯I°7 – ii) and act as secondary dominants.',
      'Half–whole diminished fits 13♭9 dominants; whole–half fits the diminished 7th chord.',
      'There are only two whole-tone scales; they fit 7♯5, 9♯5 and 7♭5 chords and sound weightless.',
    ]),
    drill('jazz.dim', 3),
  ],
  drills: ['jazz.dim', 'ear.chord.alt', 'ear.scales.jazz'],
};
