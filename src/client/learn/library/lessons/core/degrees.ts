import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const degrees: Lesson = {
  id: 'core.degrees',
  title: 'Scale degrees: hearing function',
  tags: ['core'],
  level: 1,
  summary: 'Hear notes as positions in a key — 1 at rest, 7 pulling up, 4 leaning down — instead of as letter names. It is the skill behind playing by ear and transcribing.',
  blocks: [
    p('Very few musicians have perfect pitch, yet good players learn melodies by ear, follow a bass line on a record and hear where a solo is going. They do it by hearing **relationships**. Once a piece has made clear which note is home, every other note has a position relative to that home and a feeling that comes with the position. Hearing those positions is called hearing **scale degrees**, and it is probably the most useful single skill in ear training.'),
    p('This lesson explains the numbering, why some degrees feel stable and others restless, and a reliable way to identify any degree by ear.'),

    h('Numbers instead of letters'),
    p('Scale degrees number the notes of a key from its tonic: in C major, C is 1, D is 2, E is 3 and so on up to B, which is 7. In E♭ major the same numbers belong to E♭, F, G, A♭, B♭, C and D. The point of the numbers is that they stay the same when the key changes. A melody that goes 3–2–1 is the same melody in any key, and if you hear it as 3–2–1 you can play it in any key.'),
    p('Each degree also has a traditional name, worth knowing because Bach-style theory uses them constantly: 1 is the **tonic**, 2 the **supertonic**, 3 the **mediant**, 4 the **subdominant**, 5 the **dominant**, 6 the **submediant**, and 7 the **leading tone** (or the **subtonic** when it is lowered a half step, as in natural minor). Roman numerals for chords use the same numbering: a V chord is the chord built on degree 5.'),

    h('Stable notes and restless ones'),
    p('The degrees are not equal. Three of them — **1, 3 and 5**, the notes of the tonic triad — sound stable. A melody can stop on any of them and feel like it has landed. The other four — **2, 4, 6 and 7** — sound unstable. They lean towards a stable neighbour, and the ear expects them to move.'),
    p('The strength of the lean depends on the distance. Two of the leans are only a half step: **7 pulls up to 1** and **4 leans down to 3**. These are the strongest tendencies in the key — 7 is called the leading tone because it leads so insistently home. The others are a whole step: 6 tends to fall to 5, and 2 can go either way, down to 1 or up to 3.'),
    p('Here is something that ties several lessons together. The two strongest tendency tones, 7 and 4, are a tritone apart, and they are exactly the 3rd and 7th of the V7 chord. In G7 in C major, B is degree 7 and F is degree 4. When G7 moves to C, B rises to C and F falls to E — both tendencies resolving at once. That is why V7–I sounds like the most decisive arrival in tonal music.'),
    table(['Degree', 'Name', 'Tendency', 'Feels'], [
      ['1', 'tonic', 'none — home', 'at rest'],
      ['2', 'supertonic', 'down to 1 or up to 3', 'passing, mildly open'],
      ['3', 'mediant', 'stable', 'the colour of the key: major or minor'],
      ['4', 'subdominant', 'down to 3 (half step)', 'leaning, suspended'],
      ['5', 'dominant', 'stable; can return to 1', 'firm, open'],
      ['6', 'submediant', 'down to 5', 'warm, unresolved'],
      ['7', 'leading tone', 'up to 1 (half step)', 'the strongest pull in the key'],
    ]),
    listen([
      { label: 'Cadence in C', music: { prog: ['C', 'F', 'G7', 'C'], key: 'C', beats: 1.5, bpm: 120 }, note: 'fixes the key first' },
      { label: '7 → 1', music: { notes: ['B4', 'C5'], beat: 0.6 }, note: 'the leading tone resolving up' },
      { label: '4 → 3', music: { notes: ['F4', 'E4'], beat: 0.6 }, note: 'a half-step lean down' },
      { label: '6 → 5', music: { notes: ['A4', 'G4'], beat: 0.6 }, note: 'a gentler whole-step fall' },
    ]),

    h('How to hear a degree'),
    p('With practice you will recognise degrees directly, the way you recognise a friend\'s voice. Until then, a three-step method works every time.'),
    p('1. **Fix the key.** Listen to the cadence and keep the tonic in your head — humming it quietly helps.\n2. **Feel the note.** Is it stable, or does it lean? If it leans, which way, and how hard? A strong upward pull suggests 7; a gentle sag suggests 6 or 4.\n3. **Walk it home.** Sing from the note to the nearest tonic by step, counting as you go. The number of steps tells you the degree.'),
    example('Hear degree 6 in F major', [
      'The cadence ends on F: keep that F in your ear.',
      'The test note sounds unresolved but not tense. It is not 7 (too little upward pull) and not 4 (it does not sag by a half step).',
      'Sing up to F: D – E – F, two steps, so the note is **6** (D).',
    ], { notes: ['F4', 'D5', 'E5', 'F5'], beat: 0.5 }),
    example('Hear degree 4 in D major', [
      'Tonic D. The test note sounds suspended, as if something is hanging in the air.',
      'Sing down: G – F♯, and the tension melts on F♯, which is degree 3. A half-step resolution downward is the signature of 4.',
      'So the note is **4** (G). Notice the difference from 6, whose fall to 5 is a whole step and feels softer.',
    ], { notes: ['D4', 'G4', 'F#4', 'D4'], beat: 0.5 }),

    h('Chromatic degrees'),
    p('Not every note in a melody belongs to the key. Notes from outside — **chromatic degrees** — are written with a sharp or flat in front of the number, and each one has its own character because it borrows a colour from somewhere else. As a rule, a chromatic note leans by a half step towards the nearest note of the key.'),
    p('- **♭3 and ♭7** are the **blue notes**. In blues, soul and funk they are not mistakes or passing tones but part of the language, sung and played over major chords for their grit.\n- **♭6** is borrowed from the minor key. Falling to 5, it has a bittersweet, melancholy sound — the colour of the minor iv chord in a major key.\n- **♯4** leans up to 5. It is the bright note of the Lydian mode, and the leading tone of the dominant key, which is why it appears in V-of-V chords.\n- **♭2** sinks down to 1. It is the dark note of the Phrygian mode and of the tritone substitution.'),
    listen([
      { label: '♭6 → 5', music: { notes: ['Ab4', 'G4'], beat: 0.6 }, note: 'bittersweet, borrowed from minor' },
      { label: '♯4 → 5', music: { notes: ['F#4', 'G4'], beat: 0.6 }, note: 'bright, pulling up' },
      { label: '♭7 over C', music: { voicings: [['C3', 'E3', 'G3', 'Bb4']], beat: 1.6 }, note: 'a blue note: grit, not error' },
    ]),
    p('In minor keys, the degrees are usually numbered from the minor tonic with flats where the scale differs from major: 1 2 ♭3 4 5 ♭6 ♭7. When a minor-key piece uses a V chord, it raises ♭7 back to 7 so that there is a leading tone — that raised note is the fingerprint of harmonic minor, which has a lesson of its own.'),

    h('From single notes to melodies'),
    p('Melodic dictation — writing down or playing back a tune you hear — is the same skill applied to a sequence. Place the first note as a degree. Then hear each move as either a step (to the next degree up or down) or a leap, and if it is a leap, whether it lands on a stable note. Melodies leap to stable notes much more often than to unstable ones, which narrows the choices. And whenever you lose your place, stop and sing back to 1: the tonic is always there to re-orient you.'),
    ear('Do not try to hear the letter name. Ask "how does this note feel against home?" — resting, leaning, pulling — and let the feeling suggest the number. Then confirm by walking it home.'),
    tryIt('Put a drone on the tonic (the Circle drill under Keys has one), play random notes from the key and name each degree and its tendency before you look. Then play the note and resolve it the way it wants to go: 7 up to 1, 4 down to 3, 6 down to 5. Resolving each note trains the feeling, not just the label.'),
    recap([
      'Scale degrees name notes by position in the key (1–7), so a melody keeps its numbers in every key.',
      '1, 3 and 5 are stable; 2, 4, 6 and 7 lean towards a stable neighbour.',
      '7 → 1 and 4 → 3 are half-step tendencies, the strongest in the key — and together they are the tritone of V7.',
      'To identify a degree: fix the key, feel the tendency, then sing it home counting the steps.',
      'Chromatic degrees borrow colours: ♭3 and ♭7 bluesy, ♭6 bittersweet, ♯4 bright, ♭2 dark.',
    ]),
    drill('ear.degree'),
  ],
  drills: ['ear.degree', 'ear.degree.chrom', 'ear.degree.minor', 'ear.melody'],
};
