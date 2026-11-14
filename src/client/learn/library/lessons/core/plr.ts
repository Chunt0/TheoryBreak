import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt, writing } from '../blocks';

export const plr: Lesson = {
  id: 'core.plr',
  title: 'P, L and R: chords that move by one note',
  tags: ['core', 'jazz'],
  level: 3,
  summary: 'Three moves turn any triad into its neighbours by shifting one note a step. Combine them and you get chromatic mediants, the minor iv, hexatonic and octatonic cycles, and the smooth chromatic harmony of film scores.',
  blocks: [
    p('Functional harmony explains chords by what they do in a key: the dominant wants the tonic, the subdominant leads to the dominant. That explains most of Bach and most of a jazz standard, but it has little to say about C major moving to A♭ major, or E major to C minor — changes that sound wonderful and lead nowhere in particular. **Neo-Riemannian theory** explains them another way: by how little the notes move. Two triads that share two notes, with the third note moving by a step, sound close no matter what key they belong to.'),
    p('The theory takes its name from Hugo Riemann, whose nineteenth-century writings named some of these relations, but its modern form comes from David Lewin\'s *Generalized Musical Intervals and Transformations* (1987) and Richard Cohn\'s work in the 1990s, gathered in *Audacious Euphony* (2012). Its tools are three moves, called **P**, **L** and **R**, and the lattice they live on, the Tonnetz. The previous lesson covered the lattice; this one is about the moves.'),

    h('The three moves'),
    p('Each move keeps two notes of a triad and moves the third by the smallest step that makes another major or minor triad. Each one flips major to minor or minor to major, and each one undoes itself: do it twice and you are back where you started. On the Tonnetz each move flips a triangle across one of its edges.'),
    p('**P — Parallel.** Keep the root and 5th, move the 3rd a half step: C major (C E G) becomes C minor (C E♭ G), and A minor becomes A major. It is the major–minor switch, the move behind every Picardy third and every borrowed minor tonic.'),
    p('**R — Relative.** Keep the root and 3rd of a major chord and raise the 5th a whole step: C major becomes A minor (G moves to A). From a minor chord it runs the other way, the root dropping a whole step: A minor becomes C major. R connects a chord to its relative.'),
    p('**L — Leading-tone exchange.** Keep the 3rd and 5th of a major chord and lower the root a half step: C major becomes E minor (C moves to B, the leading tone). From minor, the 5th rises a half step: E minor becomes C major. L is the move from I to iii, or from vi to IV.'),
    table(['Move', 'Keeps', 'From C major', 'From A minor', 'One voice'], [
      ['P', 'root and 5th', 'C minor', 'A major', 'the 3rd, a half step'],
      ['R', 'the major 3rd (C–E)', 'A minor', 'C major', 'a whole step'],
      ['L', 'the minor 3rd (E–G)', 'E minor', 'F major', 'a half step'],
    ]),
    listen([
      { label: 'P: C → Cm', music: { voicings: [['C4', 'E4', 'G4'], ['C4', 'Eb4', 'G4']], beat: 1.3 }, note: 'E falls to E♭' },
      { label: 'R: C → Am', music: { voicings: [['C4', 'E4', 'G4'], ['C4', 'E4', 'A4']], beat: 1.3 }, note: 'G rises to A' },
      { label: 'L: C → Em', music: { voicings: [['C4', 'E4', 'G4'], ['B3', 'E4', 'G4']], beat: 1.3 }, note: 'C falls to B' },
    ]),
    p('Notice what is not on the list: C major to G major, the strongest move in tonal music. C and G share only one note, so it takes two moves (L then R: C → Em → G). P, L and R are not about function at all; they are about distance measured in voice leading. That is what makes them useful exactly where function stops working.'),

    h('Two moves: the chromatic mediants'),
    p('Chain two moves and you reach the triads two triangles away. Four of them are the **chromatic mediants** — major chords a 3rd away from C major, sharing one note with it:'),
    table(['Moves', 'From C', 'Kept note', 'Sound'], [
      ['P then L', 'A♭ major', 'C', 'warm, sinking: ♭VI'],
      ['L then P', 'E major', 'E', 'bright, lifted: III'],
      ['P then R', 'E♭ major', 'G', 'dark, heroic: ♭III'],
      ['R then P', 'A major', 'E', 'open, sunny: VI'],
    ]),
    p('Each one sounds like a change of light rather than a change of key. That is why film composers love them: a cue can turn from C major to A♭ major for a moment of awe, or to E major for a lift, without any cadence pulling it into a new key. Gospel and soul arrangers reach for the same moves — I to ♭VI for a big open moment is the PL move.'),
    example('C to A♭ in two flips', [
      'Start on C major: C E G.',
      'P: E falls to E♭. Now C minor: C E♭ G.',
      'L from a minor chord raises the 5th a half step: G rises to A♭. Now A♭ major: A♭ C E♭.',
      'Only C held throughout, and every other voice moved by a half step. Played straight from C to A♭, the two flips happen at once and sound like one smooth slide.',
    ], { voicings: [['C4', 'E4', 'G4'], ['C4', 'Eb4', 'G4'], ['C4', 'Eb4', 'Ab4'], ['C4', 'E4', 'G4'], ['C4', 'Eb4', 'Ab4']], beat: 1.1 }),

    h('Three moves: N, S and H'),
    p('Three of the three-move combinations have names of their own, because each lands somewhere musically important.'),
    p('**N (Nebenverwandt, "next-related") = R, L, P.** C major goes to F minor; C minor goes to G major. In a major key that is I to the minor iv, the bittersweet chord of the minor plagal cadence (Fm → C), and in a minor key it is i to the major V. Only one note is common (C, or G), but the other two move by half steps, which is why iv–I sounds so smooth.'),
    p('**S (Slide) = L, P, R.** C major goes to C♯ minor. The 3rd, E, stays put, while the root and 5th slide up a half step together. It is a strange, gliding move between chords that have almost nothing in common on paper.'),
    p('**H (Hexatonic pole) = P, L, P.** C major goes to A♭ minor (G♯ minor). No note is common, yet every voice moves by just a half step: C to C♭, E to E♭, G to A♭. Cohn called these chords **hexatonic poles** and showed how often nineteenth-century composers used them for the uncanny — the eerie, the otherworldly, death and transfiguration. Film composers still do.'),
    listen([
      { label: 'N: C → Fm', music: { voicings: [['C4', 'E4', 'G4'], ['C4', 'F4', 'Ab4'], ['C4', 'E4', 'G4']], beat: 1.3 }, note: 'the minor plagal sound' },
      { label: 'S: C → C♯m', music: { voicings: [['C4', 'E4', 'G4'], ['C#4', 'E4', 'G#4']], beat: 1.3 }, note: 'E holds, the rest slide up' },
      { label: 'H: C → A♭m', music: { voicings: [['C4', 'E4', 'G4'], ['B3', 'Eb4', 'Ab4']], beat: 1.3 }, note: 'every voice a half step' },
    ]),

    h('Cycles'),
    p('Alternate two moves for long enough and you come back where you began. These **cycles** are where neo-Riemannian theory meets the symmetric scales.'),
    p('**P and L in turn**: C, Cm, A♭, A♭m, E, Em, and home to C. Six triads, two on each root of an augmented triad (C, A♭, E). Every note in the cycle belongs to one six-note scale, the **hexatonic** scale C E♭ E G A♭ B — alternating minor 3rds and half steps. On the Tonnetz the cycle runs straight down one column. The three roots a major 3rd apart are the same axis as Coltrane changes, which is one reason "Giant Steps" moves so smoothly despite its distant keys.'),
    p('**P and R in turn**: C, Cm, E♭, E♭m, G♭, G♭m, A, Am, and home. Eight triads on the four roots of a diminished 7th chord, every note within one **octatonic** (half-whole diminished) scale. On the lattice the cycle runs down a diagonal.'),
    p('**R and L in turn**: C, Am, F, Dm, B♭, Gm, E♭, Cm, A♭… falling 3rds that walk down the circle of fifths, alternating major and minor, through all twenty-four triads before coming home. **L and R** runs the other way: C, Em, G, Bm, D… rising. Richard Cohn points to a famous passage in the scherzo of Beethoven\'s Ninth Symphony that runs a long chain of these falling 3rds, one note changing at a time.'),
    example('Walk the hexatonic cycle with one hand', [
      'Hold C E G. P: move E to E♭ (C minor).',
      'L: move G up to A♭ (A♭ major: A♭ C E♭).',
      'P: move C down to C♭, which is B (A♭ minor: A♭ B E♭).',
      'L: from a minor chord the 5th rises a half step, so E♭ rises to E. Now E major: E G♯ B — the A♭ and C♭ you were holding are G♯ and B, renamed because the cycle has crossed from the flat side of the lattice to the sharp side.',
      'P: G♯ down to G (E minor). L: B up to C (C major). Home, with every move a single half step.',
    ], { voicings: [['C4', 'E4', 'G4'], ['C4', 'Eb4', 'G4'], ['C4', 'Eb4', 'Ab4'], ['B3', 'Eb4', 'Ab4'], ['B3', 'E4', 'G#4'], ['B3', 'E4', 'G4'], ['C4', 'E4', 'G4']], beat: 1.0 }),
    p('Spelled strictly by the moves, the hexatonic cycle comes home not as C but as D𝄫 — the walk has gone all the way round the torus. That is the seam where the flat side of the lattice meets the sharp side, and why the Tonnetz drill can name its notes by place, all sharps or all flats.'),

    h('Using the moves'),
    p('The moves are tools for finding chords, not rules for choosing them. A few ways to put them to work:'),
    p('- **Reharmonise a held note.** Any note belongs to six triads, the six triangles around it on the Tonnetz. Under a melody note C you can put C, Am, F, Fm, A♭ or Cm, and P, L and R walk you round them.\n- **Make a chromatic passage smooth.** Moving between distant triads by a chain of single moves keeps every voice stepwise, even when the roots leap.\n- **Find a darker or brighter version.** P on any chord gives its parallel; PL and LP give the chromatic mediants below and above.\n- **Write a cycle as a sequence.** An RL chain is a ready-made descending sequence; a PL cycle a ready-made modulation through three keys a major 3rd apart.'),
    onRecord('Listen for chromatic mediants in film scores and in late-Romantic music — Liszt, Wagner, Bruckner — where a chord a 3rd away suddenly appears with one note held across the change. In soul and gospel, the I → ♭VI lift and the minor iv before the final chord are the same moves in a different style.'),
    writing('To voice a move well, keep the common tones in the same voices and let the moving note step. If a P, L or R move ever makes a voice leap, re-voice the chord: done right, a single move should never move more than one finger.'),
    ear('Listen for the single moving voice. A middle voice dipping a half step is P from major; a top voice rising a whole step is R; a bass dropping a half step is L. When two or three voices all creep by half steps and nothing holds, you are hearing a hexatonic pole.'),
    tryIt('In the Tonnetz drill, choose Move and P L R, and play each answer by holding the two notes that stay and moving one finger. Then try the P L cycle under Cycle: six chords and home, one finger at a time.'),
    recap([
      'P keeps root and 5th (C ↔ Cm); R keeps root and 3rd of the major chord (C ↔ Am); L keeps 3rd and 5th (C ↔ Em).',
      'Each moves one note by a step and undoes itself; on the Tonnetz each flips a triangle across an edge.',
      'Two moves reach the chromatic mediants: PL → ♭VI, LP → III, PR → ♭III, RP → VI.',
      'N = RLP (C → Fm), S = LPR (C → C♯m), H = PLP (C → A♭m, the hexatonic pole).',
      'PL cycles stay in a hexatonic scale, PR cycles in an octatonic one; RL and LR walk all 24 triads in 5ths.',
    ]),
    drill('gym.plr'),
  ],
  drills: ['gym.plr'],
};
