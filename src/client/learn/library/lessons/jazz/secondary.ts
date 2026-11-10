import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const secondary: Lesson = {
  id: 'jazz.secondary',
  title: 'Secondary dominants & backcycling',
  tags: ['jazz', 'core'],
  level: 2,
  summary: 'Any major or minor chord in a key can borrow a dominant of its own and sound, for a moment, like home. How secondary dominants work, how to add their ii chords, and how to chain them backwards round the cycle.',
  blocks: [
    p('A major key contains exactly one dominant 7th chord, the V7. Yet open a jazz chart in C and you will often find A7, D7 or E7 in it — dominant chords that do not belong to the key. They are not mistakes and they do not mean the tune has changed key. They are **secondary dominants**: dominant chords borrowed for a moment and aimed at some chord other than the tonic.'),
    p('Secondary dominants are one of the main sources of colour and motion in the standard repertoire. Once you understand them, a whole class of "outside" chords suddenly makes sense, and you gain a simple tool for reharmonising any progression.'),

    h('Borrowing a dominant'),
    p('Any major or minor chord in a key could be the tonic of a key of its own. Dm is the tonic of D minor; G is the tonic of G major. Each of those keys has its own V7 — A7 for D minor, D7 for G major. Put that dominant in front of the chord and, for a moment, the ear hears the chord as a temporary home. This is called **tonicising** the chord, and the borrowed dominant is a secondary dominant.'),
    p('Secondary dominants are written with a slash: **V7/ii**, read "five of two", means the dominant of the ii chord. In C major, the five secondary dominants are:'),
    table(['Secondary dominant', 'In C', 'Resolves to', 'Foreign note(s)'], [
      ['V7/ii', 'A7', 'Dm7', 'C♯ — leading tone to D'],
      ['V7/iii', 'B7', 'Em7', 'D♯ and F♯'],
      ['V7/IV', 'C7', 'Fmaj7', 'B♭ — turns the tonic into a dominant'],
      ['V7/V', 'D7', 'G7', 'F♯ — leading tone to G'],
      ['V7/vi', 'E7', 'Am7', 'G♯ — leading tone to A'],
    ]),
    p('There is no V7/vii°, because a diminished chord cannot be a tonic — it is too unstable to sound like home.'),
    p('Each secondary dominant brings at least one note from outside the key, and that note is the giveaway. Usually it is a **temporary leading tone**: A7\'s C♯ pulls up to D, E7\'s G♯ pulls up to A. C7 is the odd one out — its foreign note is B♭, the ♭7 that turns the tonic chord itself into a dominant pointing at IV.'),
    { t: 'prog', key: 'C', tokens: ['Imaj7', 'V7/ii', 'ii7', 'V7'], style: 'swing', caption: 'C – A7 – Dm7 – G7: A7 tonicises Dm7' },

    h('Finding and spelling them'),
    p('To find the secondary dominant of any chord, go up a perfect 5th from its root and build a dominant 7th there. To recognise one in a chart, do the reverse: whenever you see a dominant 7th that is not the V7 of the key, look a 5th below its root — if that chord comes next, or soon after, you have found a secondary dominant and its target.'),
    example('V7/vi in E♭ major', [
      'vi in E♭ is Cm7, root C.',
      'Go up a perfect 5th from C: G. Make it a dominant 7th: **G7** (G B D F).',
      'Its 3rd, B♮, is foreign to E♭ major: the temporary leading tone into C. With the related ii added (Dm7♭5, since the target is minor) the bar reads Dm7♭5 – G7 – Cm7.',
    ], { prog: ['Ebmaj7', 'Dm7b5', 'G7b9', 'Cm7'], key: 'Eb', beats: 2 }),
    example('Spot them in a chart in C', [
      'The chart reads Cmaj7 – E7 – Am7 – D7 – Dm7 – G7 – Cmaj7.',
      'E7 is not V7 of C; a 5th below E is A, and Am7 follows: **V7/vi**.',
      'D7 is not V7 either; a 5th below D is G. Here D7 goes to Dm7 – G7 instead, a common move: the V7/V leads into the ii–V that contains its target.',
    ], { prog: ['Cmaj7', 'E7', 'Am7', 'D7', 'Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }),
    p('That last move is worth noticing. A secondary dominant does not always resolve directly to its target. V7/V, in particular, often moves to ii first, delaying the arrival on V. The II7 in bar 3 of "Take the A Train" does exactly this, and the delay is part of its charm.'),

    h('Adding the related ii'),
    p('Just as V7 in a key can be preceded by ii7, any secondary dominant can be preceded by its own ii chord, making a miniature ii–V that points at the target. Before A7 → Dm7 you can add **Em7**, so that Em7 – A7 forms a ii–V aimed at D; before D7 → G7 you can add **Am7**. When the target is minor, the related ii is usually half-diminished: Em7♭5 – A7 → Dm7.'),
    p('These secondary ii–Vs are everywhere in standards. Often a chart that looks like a jumble of unrelated chords turns out to be a series of ii–Vs, each pointing at the next diatonic chord. Finding them is the first step in analysing any tune.'),
    listen([
      { label: 'A7 → Dm7', music: { prog: ['Cmaj7', 'A7', 'Dm7', 'G7'], key: 'C', beats: 2, style: 'swing' }, note: 'the secondary dominant alone' },
      { label: 'Em7♭5 – A7 → Dm7', music: { prog: ['Cmaj7', 'Em7b5', 'A7b9', 'Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }, note: 'with its related ii' },
    ]),

    h('Backcycling: chains of dominants'),
    p('A secondary dominant can itself be preceded by a secondary dominant. G7 is the dominant of C; D7 is the dominant of G7; A7 is the dominant of D7; E7 is the dominant of A7. Chain them and you get **E7 – A7 – D7 – G7 – C**: a series of dominants falling round the circle of fifths, each one resolving to another dominant until the last one finally lands on the tonic. Dominants used this way are called **extended dominants**, and building such a chain by working backwards from a target is called **backcycling**.'),
    p('Extended dominants generate a wonderful sense of momentum, because every chord is a point of tension that resolves only into more tension. They drive the bridge of rhythm changes — D7, G7, C7, F7 in B♭, two bars each — and the long dominant chains of "Sweet Georgia Brown". Backcycling is also a powerful reharmonisation tool: take any target chord, put its dominant a 5th above in front of it, then that chord\'s dominant in front of that, as far back as you have room.'),
    { t: 'prog', key: 'Bb', tokens: ['III7', 'VI7', 'II7', 'V7'], beats: 4, style: 'swing', caption: 'Extended dominants: D7 – G7 – C7 – F7, the rhythm-changes bridge' },
    p('You can also backcycle with ii–Vs, putting the related ii before each dominant: Bm7 – E7 – Em7 – A7 – Am7 – D7 – Dm7 – G7 – C. The roots still fall in 5ths, but each dominant gets a predominant in front of it, and the result is the dense, constantly moving harmony of bebop.'),

    h('Choosing tensions'),
    p('The right tensions for a secondary dominant depend on its **target**. When it resolves to a **minor** chord — V7/ii, V7/iii, V7/vi — use the darker tensions, ♭9 and ♭13, because they are notes of the minor chord it is heading for (scales: Mixolydian ♭6, Phrygian dominant or altered). When it resolves to a **major** chord — V7/IV, V7/V — natural tensions sound right (Mixolydian). The lesson on chord–scales outside the key shows how to work these out by keeping the surrounding key\'s notes.'),
    onRecord('Listen for the bridge of rhythm-changes tunes like "Oleo" or "Anthropology": four dominants, each two bars long, falling round the circle. Soloists often play the darker tensions on the first two and brighter ones as the chain nears home.'),
    ear('A secondary dominant announces itself with a note from outside the key, usually a half step below the root of the next chord. When you hear a major chord with a ♭7 where you expected a minor one — A7 instead of Am7 — and it pulls hard into the next chord, you are hearing a secondary dominant.'),
    tryIt('In C, play each diatonic target preceded by its secondary dominant: A7 → Dm7, B7 → Em7, C7 → Fmaj7, D7 → G7, E7 → Am7. Then add the related ii before each one. Finally, play the chain E7 – A7 – D7 – G7 – Cmaj7 and improvise over it, landing on each chord\'s 3rd.'),
    recap([
      'A secondary dominant is the V7 of a chord other than I; it tonicises that chord for a moment.',
      'In C: A7 → Dm, B7 → Em, C7 → F, D7 → G, E7 → Am. Find one by going up a 5th from the target.',
      'Its foreign note is usually a temporary leading tone into the target.',
      'Add the related ii to make a secondary ii–V; use a half-diminished ii before a minor target.',
      'Backcycling chains dominants round the circle (E7 – A7 – D7 – G7 – C); choose ♭9/♭13 for minor targets, natural tensions for major ones.',
    ]),
    drill('gym.secondary'),
  ],
  drills: ['gym.secondary', 'jazz.relatedii', 'jazz.keycenter'],
};
