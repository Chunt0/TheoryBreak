import type { Lesson } from '../../types';
import { drill, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const chordscale: Lesson = {
  id: 'core.chordscale',
  title: 'Chord–scale theory',
  tags: ['core', 'jazz'],
  level: 2,
  summary: 'Every chord implies a scale: its chord tones, the tensions that suit it, and passing notes in between. How to pick the right one from the chord\'s quality and, above all, its context.',
  blocks: [
    p('When you improvise over a chord progression or write a melody over one, you face the same question again and again: which notes belong here? **Chord–scale theory** answers it by pairing each chord with a scale. The scale contains the chord\'s own notes, the tensions that suit it, and passing notes to fill the gaps. It is the system most jazz education has used since the 1970s, and it is the vocabulary behind phrases like "play Dorian over the ii".'),
    p('It is a tool rather than a law. Great improvisers think as much about chord tones, melodic shape and voice leading as about scales. But knowing the right scale for a chord tells you which notes are safe to land on, which are colour, and which to pass through — and that makes it the natural place to start.'),

    h('A chord is a scale in disguise'),
    p('The tensions lesson showed that a 7th chord can be extended by stacking more 3rds: 9, 11, 13. Do that all the way and you have used seven different notes — a complete scale. Dm7 with its 9th, 11th and 13th is D F A C E G B; put those notes in order and you get D E F G A B C, which is D Dorian.'),
    p('So "which tensions fit this chord?" and "which scale fits this chord?" are really the same question. The scale is just the chord with its gaps filled in. Its odd-numbered notes (1, 3, 5, 7) are the chord tones, the stable notes; the even-numbered ones (2, 4, 6 — the 9th, 11th and 13th) are the tensions and passing notes.'),

    h('Choose by context, not by root'),
    p('The most important idea in chord–scale theory is that you cannot choose a scale from the chord symbol alone. You need to know what the chord is doing — which key it belongs to and which function it has.'),
    p('Start with the simplest case: chords that belong to the key. The rule there is to **use the notes of the key**. In C major, every chord simply borrows the white keys, starting from its own root. And that turns out to produce the seven modes: Cmaj7 gets C Ionian, Dm7 gets D Dorian, Em7 gets E Phrygian, Fmaj7 gets F Lydian, G7 gets G Mixolydian, Am7 gets A Aeolian and Bm7♭5 gets B Locrian. The modes of the major scale are, quite literally, the scales of the chords of a major key.'),
    p('Notice what that means for chords of the same quality. Dm7, Em7 and Am7 are all minor 7th chords, but in C major they get three different scales, because their surroundings are different. And the same chord in a different key gets a different scale again.'),
    example('Em7 in C major vs Em7 in D major', [
      'In C, Em7 is iii. C major\'s notes from E give E Phrygian: E F G A B C D.',
      'Its F (♭9) and C (♭13) each sit a half step above a chord tone, so they work as passing notes but not as notes to land on.',
      'In D, the same Em7 is ii. D major from E gives E Dorian: E F♯ G A B C♯ D, with no clashes at all. Same chord, different context, different scale.',
    ], { scale: 'phrygian', from: 'E3', drone: true }),
    listen([
      { label: 'E Phrygian', music: { scale: 'phrygian', from: 'E3', drone: true }, note: 'Em7 as iii in C' },
      { label: 'E Dorian', music: { scale: 'dorian', from: 'E3', drone: true }, note: 'Em7 as ii in D' },
    ]),

    h('Chords from outside the key'),
    p('When a chord does not belong to the key, the same principle extends naturally: **keep the key\'s notes, and change only what the chord itself changes**. Take the chord\'s own tones, then fill the gaps with notes from the surrounding key wherever they do not clash.'),
    example('A scale for D7 in C major', [
      'D7 (D F♯ A C) is not in C major — it is the dominant of G, the V of V. Its only foreign note is F♯.',
      'Keep everything else from C major: D E F♯ G A B C.',
      'That is **D Mixolydian**. The scale differs from the key by one note, exactly the note the chord changed, so a line can move through the chord without sounding like it has jumped into another key.',
    ], { scale: 'mixolydian', from: 'D3', drone: true }),
    example('A scale for E7 resolving to Am', [
      'E7 (E G♯ B D) is the dominant of A minor. Its foreign note is G♯.',
      'Fill in from C major: E F G♯ A B C D.',
      'That is **E Phrygian dominant** — the 5th mode of A harmonic minor. It arrives with a ♭9 (F) and ♭13 (C) built in, which is exactly what a dominant heading for a minor chord wants.',
    ], { scale: 'phrygian_dominant', from: 'E3', drone: true }),
    p('This approach also explains a habit of good improvisers: they tend to think of a passage as one key with a few altered notes, rather than a new scale on every chord. The line stays melodic, and the altered notes stand out because everything around them stays the same.'),

    h('Dominant chords: the most choices'),
    p('Dominant 7th chords can take more tensions than any other chord, so they have more scale options. The choice depends on two things: the tensions written in the chord symbol, and where the chord is going.'),
    p('- **Mixolydian** (natural 9 and 13) is the plain choice for a V7 going to a major chord. The **bebop dominant** scale adds a passing major 7th so that chord tones fall on the beats in eighth-note lines.\n- **Phrygian dominant** (♭9, ♭13) suits a V7 going to a minor chord, as in the E7 example.\n- The **altered** scale (♭9, ♯9, ♯11, ♭13) gives maximum tension — every tension altered — and suits a "7alt" symbol or any strong resolution.\n- **Lydian dominant** (9, ♯11, 13) sounds bright and floating; it suits tritone substitutes and dominant chords that do not resolve down a 5th, like the II7 in "Take the A Train".\n- The **half-whole diminished** scale (♭9, ♯9, ♯11, 13) fits a 13♭9 chord, and the **whole-tone** scale (9, ♯11, ♭13) fits a 7♯5.'),
    listen([
      { label: 'G Mixolydian', music: { scale: 'mixolydian', from: 'G3', drone: true }, note: 'inside: natural tensions' },
      { label: 'G altered', music: { scale: 'altered', from: 'G3', drone: true }, note: 'every tension altered' },
      { label: 'G Lydian dominant', music: { scale: 'lydian_dom', from: 'G3', drone: true }, note: 'bright, with a ♯11' },
    ]),

    h('Minor and half-diminished chords'),
    p('Minor chords have three main options. **Dorian** is the default for m7, especially as ii, because all its tensions work. **Aeolian** and **Phrygian** belong to vi and iii in a major key, as above. And when the minor chord is a tonic with a major 7th or a 6th — Cm(maj7) or Cm6 — the scale is **melodic minor**, which contains both.'),
    p('The half-diminished chord as the ii of a minor key (Dm7♭5 in C minor) is a case where the key\'s own notes are not the best choice. C minor from D gives D Locrian, whose ♭9 (E♭) clashes with the root. Most players prefer **Locrian ♮2**, the 6th mode of melodic minor, which replaces E♭ with E natural and gives the chord a lovely, usable 9th.'),
    table(['Chord (context)', 'Scale'], [
      ['Imaj7', 'Ionian (Lydian for a brighter tonic)'],
      ['IVmaj7', 'Lydian'],
      ['ii7 · iii7 · vi7', 'Dorian · Phrygian · Aeolian'],
      ['V7 → major', 'Mixolydian / bebop dominant'],
      ['V7 → minor', 'Phrygian dominant or altered'],
      ['subV7, non-resolving 7', 'Lydian dominant'],
      ['iiø7 (minor ii)', 'Locrian ♮2'],
      ['13♭9', 'half-whole diminished'],
      ['7♯5', 'whole tone'],
      ['m(maj7), m6', 'melodic minor'],
    ]),
    example('Scales through a major ii–V–I: Dm7 – G7 – Cmaj7', [
      'All three chords belong to C major, so all three take C major\'s notes: **D Dorian**, **G Mixolydian**, **C Ionian**.',
      'That is one set of seven notes the whole way through. What changes is which of them are chord tones: over Dm7 the strong notes are D F A C, over G7 they are G B D F, over Cmaj7 C E G B.',
      'So the skill is not switching scales but **re-aiming** — F is a chord tone over Dm7 and G7, then becomes the avoid note over Cmaj7, where it should fall to E. B is the 13th of Dm7, the 3rd of G7, the 7th of Cmaj7.',
      'Swap G7 for G7alt (A♭ melodic minor from G) and four notes change for one bar. That contrast — the key, then a burst of altered colour, then the key again — is the sound of a modern ii–V–I.',
    ], { prog: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }),

    h('Using a scale musically'),
    p('A scale is a set of notes, not a melody. Running it up and down from the root over each chord is the quickest way to sound like an exercise. The scale is better treated as a map with three kinds of note on it.'),
    p('The **chord tones** — 1, 3, 5, 7 — are the strong notes. Put them on strong beats and on the ends of phrases and your line will outline the harmony clearly. The **tensions** are colour: land on a 9th or 13th deliberately and it sounds rich and intentional. The **avoid notes** are passing notes: they sound fine moving by step between two chord tones, but sustaining one sounds like a mistake. Most of the craft of improvising over changes is aiming for chord tones and tensions at the right moments and using the rest of the scale to get there.'),
    tryIt('Hold a chord in your left hand and play its scale slowly with your right, stopping on each note. The chord tones will sound settled, the tensions rich, and the avoid notes will rub — let them, so you hear why they are avoided. The Scales drill has a Chord → scale task for naming the scale and an Over the chord task for playing it against the held chord.'),
    recap([
      'Every chord implies a scale: chord tones on 1, 3, 5, 7; tensions and passing notes in between.',
      'Pick by context, not by root: the same m7 is Dorian as ii, Phrygian as iii, Aeolian as vi.',
      'For chords in the key, use the key\'s notes — which gives the modes. For chords outside it, keep the key and change only what the chord changes.',
      'Dominants have the most options: Mixolydian, Phrygian dominant, altered, Lydian dominant, diminished, whole tone.',
      'Land on chord tones and tensions; pass through avoid notes.',
    ]),
    drill('jazz.chordscale'),
  ],
  drills: ['jazz.chordscale', 'ear.modes', 'gym.scales.play'],
};
