import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const triads: Lesson = {
  id: 'core.triads',
  title: 'Triads & inversions',
  tags: ['core'],
  level: 1,
  summary: 'Four qualities built from two stacked 3rds, three ways to stand them up, and why the bass note changes everything.',
  blocks: [
    p('A **triad** is three notes stacked in 3rds: a root, a 3rd above it and a 5th above that. It is the oldest chord in Western harmony and still the most common. Even in jazz, where chords carry 9ths, 11ths and altered 13ths, there is usually a triad underneath doing the structural work — and some of the richest jazz and gospel voicings turn out to be one triad stacked on top of another chord.'),
    p('This lesson covers the four triad qualities, how to tell them apart by eye and by ear, and inversions: what happens when a note other than the root goes in the bass.'),

    h('Two 3rds, four qualities'),
    p('To build a triad, take a note and stack every other letter on top of it: C E G, D F A, B D F. Each of the two gaps is a 3rd, and each 3rd can be major (four semitones) or minor (three). Two gaps with two choices each gives exactly four combinations, and those are the four triad qualities.'),
    p('A **major** triad puts a major 3rd on the bottom and a minor 3rd on top: C–E–G. A **minor** triad flips that order — minor 3rd below, major above: C–E♭–G. In both cases the outer notes are a perfect 5th apart, and that perfect 5th is why major and minor triads feel stable. The 5th makes a solid frame; the 3rd inside it decides the colour, bright or dark.'),
    p('Stack two minor 3rds and the 5th shrinks to a diminished 5th — a tritone. That is the **diminished** triad, C–E♭–G♭: tense and restless, because the tritone inside it wants to resolve. Stack two major 3rds and the 5th grows to an augmented 5th: the **augmented** triad, C–E–G♯. It splits the octave into three equal parts, which gives it a floating, unresolved quality. That symmetry also means C augmented, E augmented and G♯ augmented contain exactly the same notes, so by ear an augmented triad has no single obvious root.'),
    table(['Quality', 'Stack', 'On C', 'Where it lives'], [
      ['Major', 'M3 + m3', 'C E G', 'I, IV and V of a major key'],
      ['Minor', 'm3 + M3', 'C E♭ G', 'ii, iii and vi of a major key'],
      ['Diminished', 'm3 + m3', 'C E♭ G♭', 'vii° in major, ii° in minor'],
      ['Augmented', 'M3 + M3', 'C E G♯', 'III+ of harmonic minor; passing chords'],
    ]),
    listen([
      { label: 'Major', music: { chord: 'C', arp: true }, note: 'bright, settled' },
      { label: 'Minor', music: { chord: 'Cm', arp: true }, note: 'darker, still settled' },
      { label: 'Diminished', music: { chord: 'Cdim', arp: true }, note: 'tight and restless' },
      { label: 'Augmented', music: { chord: 'Caug', arp: true }, note: 'floating, unresolved' },
    ]),
    p('Within a major key, three triads are major (I, IV, V), three are minor (ii, iii, vi) and one is diminished (vii°). The augmented triad never appears in the major scale at all, which is exactly why it is so useful as a colour: it usually turns up as a **passing chord**, where one note of a major triad slides up chromatically. In C – C+ – F, the G of the C chord rises to G♯ and then to A, the 3rd of F. You hear a little lift of tension that carries the music into the next chord.'),
    listen([
      { label: 'C – C+ – F', music: { prog: ['C', 'Caug', 'F'], key: 'C', beats: 2 }, note: 'the 5th rising G → G♯ → A' },
    ]),
    p('There are also two triad-like chords with no 3rd at all. **Sus4** replaces the 3rd with a 4th (C–F–G) and **sus2** replaces it with a 2nd (C–D–G). Without a 3rd they are neither major nor minor: they sound open and suspended, as if waiting to settle, and in jazz and soul they are often left unresolved on purpose.'),

    h('Inversions: what is in the bass'),
    p('The notes of a triad do not have to be stacked with the root at the bottom. An **inversion** puts a different chord tone in the bass. With the root in the bass the chord is in **root position**; with the 3rd in the bass it is in **first inversion**; with the 5th in the bass it is in **second inversion**.'),
    p('Only the bass note decides the inversion. Above the bass, the other notes can be arranged in any order and spread over any range — close together or wide apart — and the chord is still in the same inversion. C–G–E with the C at the bottom is root position; E–C–G with E at the bottom is first inversion, however the upper notes are arranged.'),
    {
      t: 'staff',
      chords: [
        { notes: ['C4', 'E4', 'G4'], label: 'root' },
        { notes: ['E4', 'G4', 'C5'], label: '6' },
        { notes: ['G4', 'C5', 'E5'], label: '6/4' },
      ],
      caption: 'C major in root position, first inversion and second inversion.',
    },
    p('There are three ways of writing inversions, and you will meet all of them. **Lead sheets** use slash chords: C/E means a C chord with E in the bass, C/G one with G in the bass. **Roman numeral analysis** adds figures from figured bass: I6 for first inversion and I6/4 for second. Those figures are the intervals above the bass — in E–G–C, G is a 3rd above E and C is a 6th, so the full figure is 6/3, shortened to 6; in G–C–E the upper notes are a 4th and a 6th above G, hence 6/4.'),
    example('Name E–G–C from the bass up', [
      'Rearrange the notes in 3rds to find the root: C E G. It is a C major triad.',
      'The bass is E, the 3rd of the chord, so this is **first inversion**, figured 6.',
      'On a lead sheet it is C/E; as a Roman numeral in C major it is I6.',
    ], { notes: ['E3', 'G3', 'C4'], mode: 'chord' }),
    example('Name A♭–C–F from the bass up', [
      'Stack in 3rds: F A♭ C. F to A♭ is a minor 3rd and A♭ to C a major 3rd, so it is **F minor**.',
      'The bass is A♭, the 3rd, so it is first inversion.',
      'Lead sheet: Fm/A♭. In C minor, where F minor is the iv chord, it is iv6.',
    ], { notes: ['Ab3', 'C4', 'F4'], mode: 'chord' }),

    h('How inversions sound, and what they are for'),
    p('Inversions change the sound more than you might expect. **Root position** is the most grounded and final: the bass carries the root, and the root\'s natural overtones reinforce the rest of the chord. Pieces end on root-position chords for that reason. **First inversion** is lighter and more mobile. It sounds less final and more like it is on the way somewhere, which makes it ideal for bass lines that move by step. The descending bass under C – G/B – Am (C, B, A) is a sound you will hear in Bach, in hymns and in soul ballads alike.'),
    p('**Second inversion** is the least stable. With the 5th in the bass, the root sits a 4th above it, and on its own that 4th sounds like it wants to move. Classical harmony uses the 6/4 chord only in a few specific ways — most famously the cadential 6/4, where a I6/4 just before V is heard as a decorated dominant rather than a tonic. Gospel and R&B love a related sound: an F/C moving to C over a held C in the bass, the "amen" sound of a plagal cadence.'),
    listen([
      { label: 'Root · 1st · 2nd', music: { voicings: [['C3', 'E3', 'G3'], ['E3', 'G3', 'C4'], ['G3', 'C4', 'E4']], beat: 1.4 }, note: 'grounded, lighter, waiting' },
      { label: 'C – G/B – Am', music: { prog: ['C', 'G/B', 'Am'], key: 'C', beats: 2 }, note: 'first inversion lets the bass step down' },
      { label: 'F/C – C', music: { prog: ['F/C', 'C'], key: 'C', beats: 2 }, note: 'a 6/4 over a tonic bass: the amen sound' },
    ]),
    p('There is a second, practical reason inversions matter: they let chords connect smoothly. Moving from C major (C E G) to F major in root position (F A C) means every note jumps. Move instead to the second inversion of F (C F A) and you can keep the C where it is, nudge E up to F and G up to A — the smallest possible motion. Good keyboard voicing, and good four-part writing in the Bach lessons, starts from exactly this habit.'),

    ear('Hear the quality first: bright or dark tells you major or minor, and a tight or floating sound tells you diminished or augmented. Then listen only to the lowest note and ask whether it sounds like home (root), like it is on its way somewhere (3rd), or like it is waiting for something (5th).'),
    tryIt('Play a C major triad in all three positions, then move to F, G and A minor, each time choosing the inversion that keeps your hand as still as possible. You will find you rarely need to move more than a step in any voice.'),
    recap([
      'A triad is two stacked 3rds: major (M3 + m3), minor (m3 + M3), diminished (m3 + m3) and augmented (M3 + M3).',
      'Major and minor have a perfect 5th and sound stable; diminished and augmented do not, and want to move.',
      'The bass alone decides the inversion: root (root position), 3rd (first, "6"), 5th (second, "6/4").',
      'Root position sounds final, first inversion mobile, second inversion unstable unless it is used carefully.',
      'Inversions let chords connect with the smallest movement in each voice.',
    ]),
    drill('ear.chord.inv', 3),
  ],
  drills: ['ear.chord.inv', 'gym.name'],
};
