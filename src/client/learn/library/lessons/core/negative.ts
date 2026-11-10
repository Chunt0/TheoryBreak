import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const negative: Lesson = {
  id: 'core.negative',
  title: 'Negative harmony',
  tags: ['core', 'jazz'],
  level: 3,
  summary: 'Mirror a key around the axis between its tonic and dominant: major turns minor, V7 becomes iv6 or ♭VII9, and a whole family of dark cadences appears that still resolve home.',
  blocks: [
    p('**Negative harmony** is a way of making a mirror image of a key. Reflect every note across a fixed axis and major chords become minor, the dominant becomes a minor subdominant, and familiar progressions acquire a darker twin. The idea comes from the theorist Ernst Levy, whose *A Theory of Harmony* (1985) developed older ideas about major and minor as reflections of each other. It reached a wide audience much later, around 2017, when Jacob Collier explained it in a series of interviews.'),
    p('It is worth being clear about what negative harmony is and is not. It is not a hidden law that explains all music. It is a **generator**: a systematic way to find chords that are related to a progression by reflection. Many of the chords it produces are ones musicians already used — borrowed chords from the parallel minor, the minor plagal cadence, the backdoor dominant — and negative harmony gives a neat explanation of why those chords feel like dominants even though they contain no leading tone.'),

    h('The axis'),
    p('In C major, the axis sits **halfway between E♭ and E** — equivalently, halfway between C and G. Every note is reflected to the note the same distance on the other side of that line. That produces six pairs:'),
    p('**C ↔ G · D ↔ F · E ↔ E♭ · B ↔ A♭ · A ↔ B♭ · F♯ ↔ C♯**'),
    p('The choice of axis is what makes the system musical. It swaps the tonic and the dominant (C and G), so the frame of the tonic chord maps onto itself. It swaps the major 3rd and the minor 3rd (E and E♭), so major turns into minor. And it swaps the leading tone, B, with A♭ — a note a half step *above* the dominant. In C major, B rises a half step to C; in the mirror, A♭ falls a half step to G. The tendency is preserved, just pointed the other way.'),
    p('For any other key, move the axis with it: it always sits between the minor and major 3rd of the tonic. In G major, for example, it falls between B♭ and B.'),

    h('What happens to chords'),
    p('Reflect each note of a chord and you get its negative. The results are surprisingly familiar.'),
    p('The tonic **C major** (C E G) becomes G E♭ C — **C minor**. The tonic stays on the same root but changes mode. A **Dm7** (D F A C) becomes F D B♭ G — **Gm7**, the minor v. **Fmaj7** (F A C E) becomes D B♭ G E♭ — **E♭maj7**, the ♭III. And the crucial one, **G7** (G B D F), becomes C A♭ F D, which is **Fm6** — or, read from D, **Dm7♭5**. Add the 9th and G9 (G B D F A) becomes C A♭ F D B♭: a **B♭9**, the backdoor dominant.'),
    table(['Chord in C', 'Notes', 'Mirrored', 'Becomes'], [
      ['C', 'C E G', 'G E♭ C', 'Cm'],
      ['G7', 'G B D F', 'C A♭ F D', 'Fm6 (= Dm7♭5)'],
      ['G9', 'G B D F A', 'C A♭ F D B♭', 'B♭9, the backdoor dominant'],
      ['Dm7', 'D F A C', 'F D B♭ G', 'Gm7'],
      ['Fmaj7', 'F A C E', 'D B♭ G E♭', 'E♭maj7'],
      ['Cmaj7', 'C E G B', 'G E♭ C A♭', 'A♭maj7'],
    ]),
    example('Mirror G7, note by note', [
      'G7 is G B D F. Reflect each note across the E♭–E axis: G → C, B → A♭, D → F, F → D.',
      'The result is C A♭ F D. Stacked in 3rds from F: F A♭ C D — **Fm6**. From D: D F A♭ C — **Dm7♭5**.',
      'Compare the tritones: G7 has B–F; the mirror has A♭–D. B wanted to rise to C; A♭ wants to fall to G.',
    ], { prog: ['G7', 'C', 'Fm6', 'C'], key: 'C', beats: 2 }),

    h('Mirrored cadences'),
    p('In a pure mirror, G7 → C becomes Fm6 → Cm: the whole cadence turns minor. That is interesting, but the more practical discovery is what happens when you keep the original destination. Borrow the mirrored dominant and resolve it to the **major** tonic: Fm6 → C, or B♭9 → C.'),
    p('Both of those cadences already existed long before anyone talked about negative harmony. Fm6 → C (iv6 – I) is the **minor plagal cadence**, the bittersweet ending of countless ballads. B♭9 → C (♭VII9 – I) is the **backdoor** cadence, heard all over jazz standards and soul. Negative harmony explains why they work so well: they are the reflection of V – I. Where G7 has the leading tone B rising a half step to C, the mirrored chord has A♭ falling a half step to G. The pull into the tonic chord is just as strong; it simply comes from above instead of below.'),
    listen([
      { label: 'G7 → C', music: { prog: ['G7', 'C'], key: 'C', beats: 2 }, note: 'the ordinary cadence' },
      { label: 'Fm6 → C', music: { prog: ['Fm6', 'C'], key: 'C', beats: 2 }, note: 'its mirror: the minor plagal cadence' },
      { label: 'B♭9 → C', music: { prog: ['Bb9', 'C'], key: 'C', beats: 2 }, note: 'the mirrored V9: the backdoor' },
    ]),
    { t: 'prog', key: 'C', tokens: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7', 'Gm7', 'Fm6', 'Cmaj7', 'Cmaj7'], beats: 4, style: 'ballad', caption: 'ii–V–I, then its mirror (v–iv) resolving to the same major tonic.' },

    h('Mirroring a whole progression'),
    p('You can reflect an entire progression, chord by chord. A ii–V–I in C (Dm7 – G7 – Cmaj7) becomes Gm7 – Fm6 – A♭maj7 in pure form, or Gm7 – Fm6 – Cmaj7 if you keep the original tonic as the destination. The first is a strange, dark cousin of the original; the second is a ready-made reharmonisation that a ballad singer would recognise.'),
    example('Find the negative of a turnaround', [
      'Start with I – vi – ii – V in C: C – Am – Dm – G7.',
      'Reflect each chord: C → Cm, Am (A C E) → B♭ G E♭ = E♭, Dm (D F A) → F D B♭ = B♭, G7 → Fm6.',
      'The mirror: Cm – E♭ – B♭ – Fm6. Keep the first chord major if you want to stay in C, and you have a turnaround full of borrowed minor-key colour.',
    ], { prog: ['C', 'Eb', 'Bb', 'Fm6', 'C'], key: 'C', beats: 2 }),
    p('Melodies can be mirrored too. Reflect each note of a line across the axis and the contour turns upside down while the line stays in a related key. Composers have used melodic inversion for centuries — Bach\'s fugues invert their subjects constantly — but mirroring around this particular axis keeps the tonal relationships intact, which is what makes the result sound like it belongs.'),

    h('Using it well'),
    p('Most chords produced by negative harmony are chords from the **parallel minor**: Cm, Fm, B♭, E♭, A♭. That is why negative harmony and **modal interchange** — borrowing chords from the parallel minor — overlap so heavily, and why many musicians treat negative harmony as a systematic map of borrowed chords rather than a separate theory. The jazz lesson on backdoor dominants and modal interchange covers the same chords from that angle.'),
    p('As with any generator, judge the results by ear. Some mirrors sound wonderful; others are merely correct. The most useful habit is the simplest one: when a V7 – I feels too predictable, try its mirror — iv6 – I or ♭VII9 – I — and see whether the darker colour suits the moment.'),
    ear('Listen for a cadence with no leading tone that still sounds like an arrival. If the note just above the 5th (A♭ in C) falls to the 5th as the music lands, you are hearing a mirrored dominant — a minor plagal or backdoor cadence.'),
    tryIt('Write out the mirror pairs for C (C↔G, D↔F, E↔E♭, B↔A♭, A↔B♭, F♯↔C♯), then reflect the chords of a short progression you know. Play the original and the mirror back to back, and then try mixing them — the original chords with one mirrored chord before the final tonic.'),
    recap([
      'Negative harmony reflects every note across the axis between the tonic\'s minor and major 3rd (E♭–E in C).',
      'Pairs in C: C↔G, D↔F, E↔E♭, B↔A♭, A↔B♭, F♯↔C♯. Major becomes minor; tonic and dominant swap.',
      'G7 mirrors to Fm6 (= Dm7♭5) and G9 to B♭9: the minor plagal and backdoor cadences.',
      'The mirrored dominant resolves with the same voice leading in reverse: A♭ falls to G as B rose to C.',
      'Most negative chords come from the parallel minor; treat the system as a generator and judge by ear.',
    ]),
    drill('gym.interchange', 3),
  ],
  drills: ['gym.interchange', 'jazz.concepts'],
};
