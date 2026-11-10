import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const colours: Lesson = {
  id: 'soul.colours',
  title: 'R&B chord colours',
  tags: ['soul'],
  level: 1,
  summary: 'add9, maj9, m9, 6/9, 9sus4 and m11: the everyday chords of R&B and soul, what each one sounds like, and how to voice them with the soft whole-step rub that defines the style.',
  blocks: [
    p('Listen closely to the keyboard part on almost any R&B or soul record and you will rarely hear a plain triad. The chords are softer, warmer and more open than the bare major and minor shapes of rock or folk, and the reason is usually a single extra note — most often the 9th — added to each chord. This palette of colours, rooted in gospel and jazz and refined on the Fender Rhodes electric pianos of 1970s soul, is the everyday language of R&B, from Motown and Stax to neo-soul and contemporary R&B.'),
    p('This lesson introduces the six chords you will use most and shows how to voice them so that they sound like the records.'),

    h('One extra note'),
    p('The 9th is the same pitch class as the 2nd — D over a C chord — but placed above the chord rather than crowded against the root. Added to a chord, it softens and widens the sound without adding real tension. It does not want to resolve, the way a 7th or a 4th does; it simply adds a shimmer. That is exactly what R&B wants from harmony: warmth and colour rather than pull.'),
    p('There is an important distinction in the chord names. **add9** means a triad with the 9th added and **no 7th**: Cadd9 is C E G D. Chords with **9** in the name and no "add" — maj9, m9, plain 9 — include the 7th as well: Cmaj9 is C E G B D. The difference is audible. add9 sounds sweet, simple and pop-gospel; maj9 and m9 sound lusher and jazzier.'),

    h('The palette'),
    p('**add9** — sweetness without sophistication. Pop ballads, gospel and worship music use it constantly, because it adds colour while keeping the triad\'s plainness.'),
    p('**maj9** — lush and glowing. The major 7th and 9th together give the dreamy, expensive sound of a neo-soul tonic or IV chord.'),
    p('**m9** — dark but warm. The 9th takes the edge off the minor chord, and m9 is the default minor chord in R&B: ii, iii and vi chords are almost always voiced this way.'),
    p('**6/9** — stable and final. A major triad with the 6th and 9th, and no 7th at all. With no leading tone it sounds completely settled, which makes it a favourite final chord. Its five notes — C D E G A — are the whole major pentatonic scale.'),
    p('**9sus4** — a dominant without its 3rd. C9sus4 is C F G B♭ D: root, 4th, 5th, ♭7, 9th. It has the dominant\'s root and ♭7 but no tritone, so it pulls gently. It is the classic gospel and R&B V chord, usually played as a triad over a bass — B♭/C.'),
    p('**m11** — open and modern. A minor 7th with the 9th and 11th: C E♭ G B♭ D F. It contains several stacked 4ths, and voiced in 4ths it gives the airy, floating sound associated with the Rhodes and with modal grooves.'),
    table(['Chord', 'On C', 'Sound'], [
      ['add9', 'C E G D', 'pop and gospel sweetness, no 7th'],
      ['maj9', 'C E G B D', 'lush: the neo-soul I or IV'],
      ['m9', 'C E♭ G B♭ D', 'dark but warm, the default minor'],
      ['6/9', 'C E G A D', 'stable and final, no leading tone'],
      ['9sus4', 'C F G B♭ D', 'a dominant without the 3rd: the gospel V'],
      ['m11', 'C E♭ G B♭ D F', 'open 4ths, very Rhodes'],
    ]),
    listen([
      { label: 'Cadd9', music: { chord: 'Cadd9' }, note: 'sweet, simple' },
      { label: 'Cmaj9', music: { chord: 'Cmaj9' }, note: 'lush, glowing' },
      { label: 'Cm9', music: { chord: 'Cm9' }, note: 'dark but warm' },
      { label: 'C6/9', music: { chord: 'C69' }, note: 'settled, final' },
      { label: 'C9sus4', music: { chord: 'C9sus4' }, note: 'a soft dominant' },
      { label: 'Cm11', music: { chord: 'Cm11' }, note: 'open and airy' },
    ]),

    h('Voicing: the whole-step rub'),
    p('The way these chords are voiced matters as much as which notes they contain. The signature R&B sound comes from placing the **9th right next to the 3rd**, a whole step below it, so that the two notes rub gently inside the voicing. In Cmaj9 that means D and E side by side — not a harsh clash like a half step, but a soft friction that makes the chord shimmer.'),
    p('A typical keyboard layout puts the **root and 5th** low in the left hand, giving a solid, open foundation, and a **compact cluster** of colour notes in the right: the 9th, 3rd, 5th and 7th close together. Keep the low register clear — 3rds and 2nds down there turn to mud — and let the colour live in the middle of the keyboard.'),
    {
      t: 'keys',
      notes: ['C3', 'G3', 'D4', 'E4', 'G4', 'B4'],
      labels: ['R', '5', '9', '3', '5', '7'],
      caption: 'Cmaj9 with the 9th tucked a whole step under the 3rd.',
    },

    h('One top note, many colours'),
    p('A favourite R&B trick is to keep the **same note on top** while the chords change underneath. Because the extended chords contain so many notes, a single melody note can belong to every chord in a progression, playing a different role in each. The top line stays still and singable while the harmony moves beneath it.'),
    example('Turn C – Am – F – G into R&B', [
      'Add the 9th to each chord: Cmaj9, Am9, Fmaj9.',
      'Swap the plain V for G9sus4 (= F/G), so that no leading tone makes it sound like a hymn.',
      'Keep G on top through all four: it is the 5th of Cmaj9, the ♭7 of Am9, the 9th of Fmaj9 and the root of G9sus4. One note, four colours.',
    ], { voicings: [['C2', 'G2', 'B3', 'D4', 'E4', 'G4'], ['A1', 'E2', 'B3', 'C4', 'E4', 'G4'], ['F1', 'C2', 'A3', 'C4', 'E4', 'G4'], ['G1', 'D2', 'A3', 'C4', 'F4', 'G4'], ['C2', 'G2', 'B3', 'D4', 'E4', 'G4']], beat: 1.8 }),
    listen([
      { label: 'Plain triads', music: { prog: ['C', 'Am', 'F', 'G'], key: 'C', beats: 2, style: 'ballad' }, note: 'the bare progression' },
      { label: 'R&B colours', music: { prog: ['Cmaj9', 'Am9', 'Fmaj9', 'G9sus4'], key: 'C', beats: 2, style: 'ballad' }, note: 'the same progression, recoloured' },
      { label: 'R&B colours, G on top', music: { voicings: [['C2', 'G2', 'B3', 'D4', 'E4', 'G4'], ['A1', 'E2', 'B3', 'C4', 'E4', 'G4'], ['F1', 'C2', 'A3', 'C4', 'E4', 'G4'], ['G1', 'D2', 'A3', 'C4', 'F4', 'G4']], beat: 1.8 }, note: 'one held top note, four different roles' },
    ]),
    onRecord('The electric piano parts on 1970s soul records by Stevie Wonder, Donny Hathaway and others are full of these voicings: m9 and maj9 chords with the 9th rubbing against the 3rd, and 9sus4 chords leading home. Listen especially to the top note of the keyboard part, which often stays put while the chords change.'),
    ear('To hear a 9th in a chord, listen for a soft shimmer at the top or in the middle of the voicing — a note that does not clash, does not want to resolve, but makes the chord sound wider. If the chord sounds settled and has no 7th, it is probably add9 or 6/9; if it sounds lush, it is probably maj9 or m9.'),
    tryIt('Play C, then Cadd9, Cmaj9 and C6/9, keeping the root and 5th in the left hand and moving the colour notes in the right. Then play Am, Am9 and Am11. Finally, play C – Am – F – G as plain triads and then as Cmaj9 – Am9 – Fmaj9 – G9sus4 with G on top, and listen to the transformation.'),
    recap([
      'R&B chords usually add one colour note — most often the 9th — to soften and widen the sound.',
      'add9 has no 7th; maj9, m9 and 9 include it. 6/9 is stable and final; 9sus4 is the soft gospel V; m11 is open and airy.',
      'Voice the 9th a whole step below the 3rd for the characteristic gentle rub.',
      'Root and 5th low, a compact colour cluster in the middle; keep the low register clear.',
      'Keeping one note on top while the chords change underneath is a classic R&B sound.',
    ]),
    drill('ear.chord.ext', 3),
  ],
  drills: ['ear.chord.ext', 'gym.spell.ext', 'soul.concepts'],
};
