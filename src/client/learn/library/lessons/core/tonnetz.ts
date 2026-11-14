import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt, writing } from '../blocks';

export const tonnetz: Lesson = {
  id: 'core.tonnetz',
  title: 'The Tonnetz: a map of triads',
  tags: ['core'],
  level: 2,
  summary: 'Lay the twelve notes out in 5ths one way and 3rds the other and every triad becomes a triangle, every key a strip, and every smooth chord change a step to the next triangle.',
  blocks: [
    p('The circle of fifths puts the twelve notes in a ring, one 5th apart. It is the best map there is of keys and key signatures, but it hides something: the 3rds. A triad is two 3rds stacked up, and on the circle the notes of C major (C, E, G) sit four slots apart with nothing joining them. The **Tonnetz** — German for "tone network" — fixes that by giving the 3rds a direction of their own. Lay the notes out in 5ths left to right, and in major 3rds up the page, and the minor 3rds appear for free on the other diagonal. Suddenly every triad is a small triangle, and chords that sound close are drawn close.'),
    p('The idea is old. Leonhard Euler, the mathematician, drew a lattice of 5ths and 3rds in 1739 to explain why some chords sound smoother than others. Nineteenth-century German theorists, Arthur von Oettingen and Hugo Riemann among them, built it into a full theory of harmony and gave it its name. It fell out of fashion for most of the twentieth century, then came back in the 1980s and 90s when David Lewin and Richard Cohn used it to explain the chromatic harmony of Wagner, Liszt and Brahms — the harmony that the circle of fifths cannot make sense of. Today it turns up in film-music analysis, in composition software and on the wall of many a jazz practice room.'),

    h('Three directions'),
    p('Every note on the lattice has six neighbours, in three directions and their opposites. **Right** is up a perfect 5th: C, G, D, A, E, B. **Up and to the right** is up a major 3rd: C, E, G♯. **Down and to the right** is up a minor 3rd: C, E♭, G♭. Go the other way along any of the three and you get the inversion: left is down a 5th (up a 4th), and so on. Those are the three intervals that build triads and 7th chords, and the only three you need.'),
    table(['Direction', 'Interval', 'From C', 'On the line of fifths'], [
      ['→ right', 'up a perfect 5th', 'G', '+1 (one sharp more)'],
      ['↗ up-right', 'up a major 3rd', 'E', '+4 (four sharps more)'],
      ['↘ down-right', 'up a minor 3rd', 'E♭', '−3 (three flats more)'],
      ['← left', 'up a perfect 4th', 'F', '−1 (one flat more)'],
    ]),
    p('Because every direction is a fixed interval, every shape on the lattice is a fixed chord type in any key. Learn where a major triad sits from C and you know where it sits from F♯ — the same shape, moved along. That is the first thing the Tonnetz gives you: chord qualities as shapes, independent of key.'),

    h('Triangles are triads'),
    p('Take any note, the note a 5th above it, and the note a major 3rd above it: C, G and E. On the lattice they are the three corners of a small triangle pointing **up**. That is a major triad. Now take a note, its 5th and its minor 3rd: A, E and C. Those three make a triangle pointing **down** — a minor triad. Every up-triangle on the lattice is a major chord, every down-triangle a minor chord, and every major and minor triad in every key appears.'),
    p('Two triangles that share an edge share two notes. C major and A minor share the edge C–E. C major and E minor share E–G. C major and C minor share C–G. Those three neighbours are exactly the chords that sound closest to C major: each is reached by moving a single note, and only by a step. The lesson on P, L and R gives these three moves their names; for now, notice that "close on the page" has become "close to the ear".'),
    p('Bigger chords are bigger shapes. A **major 7th** chord is two triangles joined along an edge: Cmaj7 is C major plus E minor, a diamond. A **minor 7th** is the same diamond the other way up: Am7 is A minor plus C major. A **dominant 7th** is a triangle with a tail — C7 is the C major triangle plus B♭, which hangs off the E–G edge on the minor-3rd diagonal, because E, G and B♭ make a diminished triad, and a diminished triad is a straight line of minor 3rds. An **augmented** triad is a straight line too, up the major-3rd diagonal: C, E, G♯. The two symmetrical triads are the two chords with no triangle at all.'),
    table(['Chord', 'Shape on the lattice', 'Example'], [
      ['major triad', 'triangle pointing up', 'C E G'],
      ['minor triad', 'triangle pointing down', 'A C E'],
      ['major 7th', 'diamond: major + minor sharing the 3rd–5th edge', 'Cmaj7 = C + Em'],
      ['minor 7th', 'diamond: minor + major sharing an edge', 'Am7 = Am + C'],
      ['dominant 7th', 'major triangle + a tail of minor 3rds', 'C7 = C + E G B♭'],
      ['diminished triad', 'straight line of minor 3rds', 'B D F'],
      ['augmented triad', 'straight line of major 3rds', 'C E G♯'],
    ]),
    example('Find Am7 on the lattice', [
      'Start on A. A 5th to the right is E; a minor 3rd down-right of A is C. A, C, E is a triangle pointing down: A minor.',
      'Am7 adds G, the minor 7th. G is a 5th to the right of C and a minor 3rd above E — the corner that turns the C–E edge into a second triangle, C E G, pointing up.',
      'So Am7 is a diamond: A minor and C major sharing the edge C–E. That is why Am7 and C6 (C E G A) are the same four notes — the same diamond, read from a different corner.',
    ], { voicings: [['A3', 'C4', 'E4'], ['A3', 'C4', 'E4', 'G4'], ['C4', 'E4', 'G4', 'A4']], beat: 1.4 }),

    h('Keys are strips'),
    p('The seven notes of C major are F C G D A E B — seven neighbours in 5ths. On the lattice they do not lie in one long row; they fold into two rows. F C G D sit along one row, and A E B sit along the row above, each a major 3rd over the note below-left. Between those two rows lies a strip of six triangles: **Dm, F, Am, C, Em, G**. Those are the six major and minor chords of the key, and they sit side by side, each sharing an edge with the next. (The seventh diatonic chord, B diminished, is the line B–D–F, which is why it falls off the strip.)'),
    p('Every major key is the same strip moved along, and its relative minor is the same strip again — A minor shares all six triangles with C major. To move to the key of G, slide the strip one step right: the F row-end drops off, F♯ joins at the other end, and four of the six triangles stay. Closely related keys overlap a lot; distant keys share nothing. That is the circle of fifths again, but now you can see which chords two keys have in common.'),
    p('Modes and minor scales change the shape a little. Harmonic minor adds the leading tone, which on the lattice is a single note sticking out of the strip — G♯ above E in A minor — and with it the E major triangle. Melodic minor, Dorian and Mixolydian each swap one corner. Turn on a scale in the Tonnetz drill and the key\'s triangles tint, so you can watch the strip bend as you change mode.'),

    h('Sharps, flats and the torus'),
    p('Spell each note by where it sits and something surprising happens. Moving right goes one step sharper along the line of fifths (C G D A E B F♯ C♯), moving left one step flatter (C F B♭ E♭ A♭). Moving up a row is four steps along the line of fifths, so the rows grow sharper as you go up and flatter as you go down. Three major 3rds up from C is not C but **B♯**: C, E, G♯, B♯. Three major 3rds down is **D𝄫**. The spelled lattice never repeats a name — it goes on for ever, with the sharps up and to the right and the flats down and to the left.'),
    p('On the piano, of course, B♯ is C and G♯ is A♭. If you treat enharmonic notes as the same note, the lattice starts to repeat: every three rows the same keys come round again, and every four steps right and one row down you land on the same note with the same name. Glue the repeating edges together and the flat sheet curls into a tube, then the tube into a ring — a **torus**, the shape of a doughnut. The twelve notes and the twenty-four major and minor triads all live on its surface, each triangle once.'),
    p('Both views are useful, and the drill shows both. *Spelled* names keep the music\'s logic: in E major the 3rd of the V chord is D♯, not E♭, and the lattice says so because D♯ is where you get to by going up from B. *Sharps* or *Flats* name every black key one way, which is what you need when reading a lead sheet in a hurry or matching the keys under your fingers. Watching G♯ and A♭ light up together, three rows apart, is the quickest way to see that the torus is real.'),
    example('Go up three major 3rds from C', [
      'C up a major 3rd is E — one row up, half a step right.',
      'E up a major 3rd is G♯ — another row up. G♯ is spelled with a sharp because it lies on the sharp side of the lattice.',
      'G♯ up a major 3rd is B♯. On the spelled lattice that is a new note, three rows above C; on the piano it is C again. The augmented triad C E G♯ has come home by a different name.',
    ], { notes: ['C4', 'E4', 'G#4', 'C5'], mode: 'seq', beat: 0.6 }),

    h('Reading progressions as paths'),
    p('Play a progression and trace it on the lattice, and its character shows up as a path. Chords a 3rd apart are neighbouring triangles, so a progression like C – Am – F – Dm walks along the strip one triangle at a time, always holding two notes. Chords a 5th apart share one note, so they are two triangles apart, meeting at a corner. Chromatic mediants, like C to A♭ or C to E, are two steps away but off the strip — outside the key, yet still close, which is exactly how they sound.'),
    listen([
      { label: 'C → Am → F → Dm', music: { voicings: [['C4', 'E4', 'G4'], ['C4', 'E4', 'A4'], ['C4', 'F4', 'A4'], ['D4', 'F4', 'A4']] }, note: 'one triangle at a time, along the strip' },
      { label: 'C → G', music: { voicings: [['C4', 'E4', 'G4'], ['B3', 'D4', 'G4']] }, note: 'two triangles apart, meeting at G' },
      { label: 'C → A♭', music: { voicings: [['C4', 'E4', 'G4'], ['C4', 'Eb4', 'Ab4']] }, note: 'off the strip, but only two flips away' },
    ]),
    writing('Any note sits at the corner of six triangles: three major and three minor chords that all contain it. Around C they are C, Am, F, Fm, A♭ and Cm. Those six are the plain triads you can put under a held melody note C, and the hexagon round the note shows them all at once — a quick way to find reharmonisations.'),
    ear('Close moves sound smooth because only one voice moves. When a change sounds like a gentle shift of light with no clear push, listen for the two notes that stay and the one that slides: you are hearing one triangle flip into its neighbour.'),
    tryIt('In the Tonnetz drill, play C major, then A minor, then F, then D minor, and watch the path walk along the strip. Then turn on Info and press P, L and R to see where each flip goes. Change the key: the shapes and moves stay the same.'),
    recap([
      'The Tonnetz lays notes out in 5ths (right), major 3rds (up-right) and minor 3rds (down-right).',
      'Up-triangles are major triads, down-triangles minor; triangles that share an edge share two notes.',
      '7th chords are two triangles (maj7, m7) or a triangle with a tail (dom7); diminished and augmented triads are straight lines.',
      'A key\'s six major and minor chords form a strip; related keys overlap, distant keys do not.',
      'Spelled by place, sharps grow up and right and flats down and left; with enharmonics equal, the lattice wraps into a torus.',
    ]),
    drill('gym.plr'),
  ],
  drills: ['gym.plr', 'ear.motion'],
};
