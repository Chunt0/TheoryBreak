import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const pentatonic: Lesson = {
  id: 'funk.pentatonic',
  title: 'Pentatonics over a vamp',
  tags: ['funk', 'jazz'],
  level: 2,
  summary: 'One five-note shape, moved to different roots, brings out different colours of the same chord: the blues, the 9th and 11th, the Dorian 13th. How to superimpose pentatonics over minor and dominant vamps.',
  blocks: [
    p('The pentatonic scale is the melodic core of funk, blues and soul, and a favourite tool of modal jazz players. With only five notes and no half steps, it is almost impossible to make it sound wrong, and its shapes fall naturally into strong, singable riffs. But over a funk vamp that lasts several minutes, one pentatonic scale wears out quickly.'),
    p('The solution players use is **superimposition**: playing a pentatonic scale built on a different root from the chord. Each placement brings out a different set of chord tones and tensions, so you can change the colour of your lines dramatically — while still playing shapes and licks you already know.'),

    h('Two scales, one set of shapes'),
    p('The **minor pentatonic** has the formula 1 ♭3 4 5 ♭7; E minor pentatonic is E G A B D. The **major pentatonic** is 1 2 3 5 6; G major pentatonic is G A B D E. Those are the same five notes. Like a major key and its relative minor, every minor pentatonic is also a major pentatonic starting a minor 3rd higher, so one set of shapes serves both.'),
    p('The pentatonic sounds open and safe because it has **no half steps**. Most avoid notes and clashes come from half-step relationships — a note a half step above a chord tone — and the pentatonic simply leaves out the notes that cause them. (The **blues scale** adds one chromatic note, the ♭5, back in for grit.)'),

    h('Superimposing: same shape, new root'),
    p('Here is the key idea. A pentatonic scale is a set of five notes. Built on the chord\'s root, those notes are the root, ♭3, 4, 5 and ♭7 of the chord. Built on another root, the same shape lands on **different degrees** of the chord. Move the shape and you change which tensions you are emphasising — without having to think about a new scale.'),

    h('Over a minor vamp'),
    p('On a minor 7th vamp in Dorian — Em7, say — three minor pentatonics fit perfectly, and each has its own character.'),
    table(['Over Em7 (Dorian)', 'Notes', 'Against E'], [
      ['E minor pent.', 'E G A B D', 'R ♭3 11 5 ♭7: the blues, inside'],
      ['B minor pent.', 'B D E F♯ A', '5 ♭7 R 9 11: brighter, no 3rd'],
      ['F♯ minor pent.', 'F♯ A B C♯ E', '9 11 5 13 R: the Dorian 6th, modern'],
    ]),
    p('**On the root** (E minor pentatonic), the scale is the familiar blues-rock sound: grounded, earthy and very much inside the chord. **On the 5th** (B minor pentatonic), it drops the 3rd and adds the 9th, F♯, so lines sound more open and floating. **On the 9th** (F♯ minor pentatonic), it brings in both the 9th and the 13th, C♯ — the natural 6th that makes Dorian Dorian — and the result sounds bright, modern and much more sophisticated. Many jazz-funk solos lean heavily on this last one.'),
    listen([
      { label: 'E minor pent. over E', music: { voicings: [['E2', 'E4'], ['E2', 'G4'], ['E2', 'A4'], ['E2', 'B4'], ['E2', 'D5']], beat: 0.4 }, note: 'grounded, bluesy' },
      { label: 'B minor pent. over E', music: { voicings: [['E2', 'B3'], ['E2', 'D4'], ['E2', 'E4'], ['E2', 'F#4'], ['E2', 'A4']], beat: 0.4 }, note: 'open, with the 9th' },
      { label: 'F♯ minor pent. over E', music: { voicings: [['E2', 'F#4'], ['E2', 'A4'], ['E2', 'B4'], ['E2', 'C#5'], ['E2', 'E5']], beat: 0.4 }, note: 'bright, with the 9th and 13th' },
    ]),
    { t: 'prog', key: 'Em', tokens: ['Em7', 'A7', 'Em7', 'A7'], beats: 4, bpm: 98, style: 'funk', caption: 'An E Dorian vamp to try them on: E, B and F♯ minor pentatonic all fit.' },
    example('Choose a pentatonic for colour', [
      'Vamp: Em7 – A7 (E Dorian). You want the 9th and 13th to sing.',
      'Find the minor pentatonic that holds F♯ (9) and C♯ (13): F♯ minor pentatonic, F♯ A B C♯ E.',
      'Play licks you know in E minor pentatonic a whole step higher: instant modern Dorian.',
    ], { voicings: [['E2', 'F#4'], ['E2', 'A4'], ['E2', 'B4'], ['E2', 'C#5'], ['E2', 'B4'], ['E2', 'A4'], ['E2', 'F#4']], beat: 0.3 }),

    h('Over a dominant vamp'),
    p('On a dominant vamp like E7, the choices shift because the chord has a major 3rd.'),
    p('- **Minor pentatonic on the root** (E G A B D) gives the classic blues sound: its G is a ♭3 against the chord\'s G♯, the deliberate blue-note clash at the heart of funk.\n- **Minor pentatonic on the 5th** (B D E F♯ A) gives the 9th and 11th — an open, sus-like colour.\n- **Major pentatonic on the root** (E F♯ G♯ B C♯) gives the clean, sweet 9th and 13th with the major 3rd: a brighter, more soulful sound.'),
    p('Mixing the first and third — sliding between the minor-pentatonic blues sound and the major-pentatonic sweetness — is one of the most characteristic moves in soul and funk soloing, and in a lot of blues.'),
    table(['Over E7', 'Notes', 'Colour'], [
      ['E minor pent.', 'E G A B D', 'blues: ♭3 against the 3rd'],
      ['B minor pent.', 'B D E F♯ A', '9 and 11: open, sus-like'],
      ['E major pent.', 'E F♯ G♯ B C♯', '9 and 13: sweet and soulful'],
    ]),

    h('Using them musically'),
    p('Switching scales is not in itself interesting; what makes superimposition powerful is using it to **develop an idea**. Play a short riff in E minor pentatonic, then repeat its shape in B minor pentatonic, then in F♯ — the listener hears the same motif, but each time its relationship to the chord changes. That is a far more musical result than running through three scales.'),
    p('As always in funk, rhythm matters more than note choice. Pentatonic riffs work best as short, rhythmic phrases on the 16th-note grid, with space between them. End phrases on strong notes — the root, the 5th, or the colour note you are featuring — so the listener hears where the line has landed.'),

    h('The same idea elsewhere'),
    p('Superimposed pentatonics work on any chord. Over **Cmaj7**, E minor pentatonic (E G A B D) gives the 3rd, 5th, 13th, 7th and 9th — a lush, safe sound — while B minor pentatonic (B D E F♯ A) gives the 7th, 9th, 3rd, ♯11 and 13th, which is the Lydian colour. Jazz players use these placements constantly, because a five-note shape is far easier to handle at speed than a seven-note mode.'),
    ear('When a solo over a static chord suddenly sounds brighter or more modern without any change in the harmony, the soloist has probably moved their pentatonic up a step or a 5th. Listen for new colour notes — a 9th or a 13th — appearing in otherwise familiar shapes.'),
    tryIt('Over an Em7 drone, play the same short riff in E, B and F♯ minor pentatonic, and listen to how its colour changes. Then switch to E7 and alternate a phrase in E minor pentatonic with one in E major pentatonic. Keep every phrase rhythmic and short.'),
    recap([
      'Minor pentatonic (1 ♭3 4 5 ♭7) and major pentatonic (1 2 3 5 6) share shapes; neither has half steps, so neither clashes.',
      'Superimposing a pentatonic on another root brings out different tensions of the same chord.',
      'Over a Dorian m7: minor pentatonic on the root (bluesy), the 5th (adds the 9th) and the 9th (adds the 9th and 13th).',
      'Over a dominant: minor pentatonic on the root (blues), on the 5th (9 and 11), major pentatonic on the root (9 and 13).',
      'Use superimposition to develop motifs, keep phrases rhythmic, and land on strong notes.',
    ]),
    drill('ear.modes', 3),
  ],
  drills: ['ear.modes', 'jazz.chordscale'],
};
