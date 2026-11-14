import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt, writing } from '../blocks';

const seq = (notes: string[]) => ({ notes, mode: 'seq' as const, beat: 0.32 });

export const compass: Lesson = {
  id: 'core.compass',
  title: 'The modal compass: from bright to dark',
  tags: ['core', 'jazz'],
  level: 2,
  summary: 'Put the seven modes of major in order of brightness and each one is a single note away from the next. The ring that makes shows the chain of lowered notes, the mirror pairs, each mode\'s tritone, and a spin that never ends.',
  blocks: [
    p('The lesson on modes described each one by its characteristic note: Lydian\'s ♯4, Mixolydian\'s ♭7, Dorian\'s bright 6th. That is the best way to hear a mode, but it leaves seven separate facts to remember. There is a single picture that holds all seven, and shows how they connect: the **modal compass**. The guitarist, composer and researcher Milton Mermikides drew it as a ring of seven dials, one for each mode, running from the brightest to the darkest. First published on his blog in 2015 (with a design by Skye Løfvander), it has been refined several times since, most recently for his 2024 Gresham College lecture on the colour spectrum of scales and modes. This lesson explains how to read it; the Compass tab in the Keys section is a playable version to explore.'),
    p('The idea behind it is old and simple. Take all seven modes on the same root, say C, and sort them by how bright they sound. The brightest has the most raised notes, the darkest the most lowered. Sorted that way, each mode differs from its neighbour by exactly one note, moved by exactly one half step. No other order does that.'),

    h('One note at a time'),
    p('Start at the bright end with **C Lydian**: C D E F♯ G A B. Lower the ♯4 to 4 and you have **C Ionian**, the major scale. Lower the 7th and you have **Mixolydian**. Lower the 3rd: **Dorian**. Lower the 6th: **Aeolian**, the natural minor. Lower the 2nd: **Phrygian**. Lower the 5th: **Locrian**, the darkest of all, where every note but the root has been lowered. Six steps, six notes, each lowered once, always in the same order: ♯4, 7, 3, 6, 2, 5.'),
    table(['Step darker', 'Note lowered', 'From', 'To', 'Formula after'], [
      ['1', '♯4 → 4', 'Lydian', 'Ionian', '1 2 3 4 5 6 7'],
      ['2', '7 → ♭7', 'Ionian', 'Mixolydian', '1 2 3 4 5 6 ♭7'],
      ['3', '3 → ♭3', 'Mixolydian', 'Dorian', '1 2 ♭3 4 5 6 ♭7'],
      ['4', '6 → ♭6', 'Dorian', 'Aeolian', '1 2 ♭3 4 5 ♭6 ♭7'],
      ['5', '2 → ♭2', 'Aeolian', 'Phrygian', '1 ♭2 ♭3 4 5 ♭6 ♭7'],
      ['6', '5 → ♭5', 'Phrygian', 'Locrian', '1 ♭2 ♭3 4 ♭5 ♭6 ♭7'],
      ['7', 'root → down a half step', 'Locrian', 'Lydian, a half step lower', 'B C♯ D♯ E♯ F♯ G♯ A♯'],
    ]),
    p('The order of lowered notes is no accident. Read it as notes rather than degrees, from C Lydian: F♯, B, E, A, D, G, C. That is a chain of falling 5ths. Each step darker lowers the note that sits furthest up the sharp side of the circle of fifths, which is why the circle and the compass tell the same story from two angles.'),
    listen([
      { label: 'C Lydian', music: seq(['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5']), note: 'all raised: brightest' },
      { label: 'C Ionian', music: seq(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']), note: 'F♯ falls to F' },
      { label: 'C Mixolydian', music: seq(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5']), note: 'B falls to B♭' },
      { label: 'C Dorian', music: seq(['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5']), note: 'E falls to E♭' },
      { label: 'C Aeolian', music: seq(['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5']), note: 'A falls to A♭' },
      { label: 'C Phrygian', music: seq(['C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5']), note: 'D falls to D♭' },
      { label: 'C Locrian', music: seq(['C4', 'Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'C5']), note: 'G falls to G♭: darkest' },
    ]),

    h('The compass never stops'),
    p('What happens if you go one step darker than Locrian? Only one note is left to lower: the root. Drop C to B and look at what you are holding: B, D♭, E♭, F, G♭, A♭, B♭. Spell it from B — B C♯ D♯ E♯ F♯ G♯ A♯ — and it is **B Lydian**, the brightest mode again, a half step lower. That is why the modes make a ring rather than a line. Keep turning darker and every seven steps you come round to the same mode a half step down; after eighty-four steps you have played every mode in every key and arrived back at C Lydian. Going brighter runs the same ring backwards, raising one note each step, with the root rising a half step as you pass from Lydian to Locrian.'),
    example('Spin past the seam', [
      'Hold C Phrygian: C D♭ E♭ F G A♭ B♭. One step darker lowers the 5th, G to G♭: C Locrian.',
      'One more step darker. Every note but the root is already lowered, so the root itself falls: C to B.',
      'Now the notes are B D♭ E♭ F G♭ A♭ B♭. Respell them from B: B C♯ D♯ E♯ F♯ G♯ A♯. A major scale on B with its 4th raised: B Lydian.',
      'One more step darker lowers B Lydian\'s ♯4, E♯ to E: B Ionian. The chain has started again, a half step lower.',
    ], { notes: ['C4', 'Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'C5', 'B3', 'C#4', 'D#4', 'F4', 'F#4', 'G#4', 'A#4', 'B4'], mode: 'seq', beat: 0.3 }),

    h('Mirrors and tritones'),
    p('Draw a line through Dorian at the top of the compass and the modes facing each other across it are **mirror images**. Turn Ionian\'s steps upside down — W W H W W W H read backwards is H W W W H W W — and you get Phrygian. Mixolydian and Aeolian are a pair in the same way, and so are Lydian and Locrian. Dorian, W H W W W H W, reads the same both ways, so it is its own mirror, the axis of the whole ring. Every interval above the root in one mode is the same interval below the root in its partner: Lydian\'s major 3rd up is Locrian\'s major 3rd down.'),
    p('Each mode also contains exactly one **tritone**, and where it sits says a lot about the mode\'s colour. In Ionian it is 4 and 7, the two notes of the dominant chord that pull home. In Mixolydian it is 3 and ♭7, which is why the tonic chord is itself a dominant 7th. In Dorian it lies between ♭3 and 6, inside a warm minor 6th chord. At both ends of the compass the tritone reaches the root: 1 to ♯4 in Lydian, which floats, and 1 to ♭5 in Locrian, which has no perfect 5th and never settles.'),
    table(['Mode', 'Its mirror', 'Tritone', 'Chord on the root'], [
      ['Lydian', 'Locrian', '1 – ♯4', 'maj7♯11'],
      ['Ionian', 'Phrygian', '4 – 7', 'maj7'],
      ['Mixolydian', 'Aeolian', '3 – ♭7', '7'],
      ['Dorian', 'Dorian', '♭3 – 6', 'm7, m6'],
      ['Aeolian', 'Mixolydian', '2 – ♭6', 'm7'],
      ['Phrygian', 'Ionian', '♭2 – 5', 'm7, sus♭9'],
      ['Locrian', 'Lydian', '1 – ♭5', 'm7♭5'],
    ]),

    h('The same notes, a different root'),
    p('So far each turn kept the root and changed a note. Turn the other way round, keeping the notes and moving the root, and the compass shows the relative modes. The white keys give F Lydian, C Ionian, G Mixolydian, D Dorian, A Aeolian, E Phrygian and B Locrian: in compass order the roots rise in 5ths, F C G D A E B. The brighter a mode, the further round the flat side its root sits for the same set of notes. So if a tune in D Dorian needs a brighter colour, D Mixolydian is one step round, one note different (F becomes F♯); if it needs a darker one, D Aeolian is one step the other way (B becomes B♭).'),
    writing('Use the compass to choose how far to move. Borrowing from the neighbouring mode changes one note, a subtle shift of light; jumping three or four dials changes three or four notes and sounds like a new world. Modal interchange works the same way: ♭VII and iv in a major key come from Mixolydian and Aeolian, one and three steps darker than Ionian.'),
    onRecord('Film and game composers move round the compass constantly: a theme in Lydian for wonder, the same melody in Phrygian for menace. In jazz, a modal tune like "So What" holds Dorian, at the balanced centre of the ring, while the Lydian sound of a maj7♯11 chord sits at the bright end.'),
    ear('Over a drone, place the mode on the ring by ear. A major 3rd puts you on the bright side, a minor 3rd on the dark. Then listen for the one note that separates it from its neighbour: hear the ♯4 and you are as bright as the modes go; hear the ♭2 and you are near the bottom of the ring.'),
    tryIt('In the Compass tab, choose Explore and Spin, start on Lydian, and press Enter seven times: hear the one note fall each time, then watch the root drop as you pass Locrian. Turn on Info to see the mirror line and each mode\'s tritone, then try Step and Hear.'),
    recap([
      'Bright to dark: Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian.',
      'Each step darker lowers one note a half step, in the order ♯4, 7, 3, 6, 2, 5; brighter raises them in reverse.',
      'One step darker than Locrian lowers the root and lands on Lydian a half step lower, so the compass spins for ever.',
      'Mirror pairs face each other across Dorian: Ionian–Phrygian, Mixolydian–Aeolian, Lydian–Locrian.',
      'Every mode holds one tritone; the relative modes of one scale have roots rising in 5ths from bright to dark.',
    ]),
    drill('gym.compass'),
  ],
  drills: ['gym.compass', 'ear.modes'],
};
