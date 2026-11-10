import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const modal: Lesson = {
  id: 'jazz.modal',
  title: 'Modal jazz & quartal harmony',
  tags: ['jazz', 'funk'],
  level: 2,
  summary: 'Long stretches of one mode instead of fast-moving changes: how modal jazz keeps a static harmony alive with characteristic notes, chords built in 4ths, sus chords and modal vamps.',
  blocks: [
    p('By the late 1950s, bebop harmony had become extremely dense — chords changing every two beats, soloists racing to outline each one. Some musicians wanted the opposite: space. On Miles Davis\'s *Kind of Blue* (1959), tunes like "So What" sit on a single chord for eight or sixteen bars at a time. Instead of a harmony that drives forward from cadence to cadence, the music offers a field of colour to explore. This approach became known as **modal jazz**, and its influence spread far beyond jazz into funk, soul, fusion and film music.'),
    p('Modal music raises an obvious question: with no chord changes to follow, what keeps it interesting? The answers — the colour of the mode, chords built in 4ths, the suspended dominant and the modal vamp — are the subject of this lesson.'),

    h('From changes to modes'),
    p('"So What" is the classic example. It is a 32-bar AABA form, but its A sections are simply **D Dorian** for eight bars each, and its bridge is the same thing a half step higher, **E♭ Dorian**. John Coltrane\'s "Impressions" uses exactly the same plan. Over a static harmony like this, an improviser is not tracking chords; they are shaping melodies within a mode, building intensity, developing motifs, using rhythm and register, and sometimes deliberately stepping outside the mode and back in.'),
    p('This changes the role of every note. In functional harmony, notes matter mainly in relation to the chord of the moment. In modal music, notes matter in relation to the mode as a whole — and particularly to the one note that gives the mode its identity.'),

    h('Keeping the mode alive'),
    p('A mode is the same seven notes as some major scale, with a different note as home. D Dorian uses the notes of C major. The risk in modal playing is that the music drifts into sounding like the parent major key — that your D Dorian solo starts to sound like C major with a D in the bass. The cure is to lean on what makes the mode distinctive.'),
    p('In **D Dorian** that is the **B**, the natural 6th, which is the difference between Dorian and ordinary minor. Stress D, emphasise B, and avoid letting the B and F (the tritone that belongs to C major\'s G7) resolve the way they would in C. In Mixolydian the characteristic note is the ♭7; in Lydian the ♯4; in Phrygian the ♭2. Each mode has one, and modal melodies and voicings keep returning to it.'),
    table(['Mode', 'Characteristic note', 'Typical chord'], [
      ['Dorian', '♮6', 'm7, m11, m6'],
      ['Mixolydian (sus)', '4 as a colour', '7sus4, 13sus4'],
      ['Lydian', '♯4', 'maj7♯11'],
      ['Phrygian', '♭2', 'sus♭9'],
    ]),

    h('Quartal harmony: chords in 4ths'),
    p('Chords built in 3rds come with expectations. A major or minor triad announces its quality, a dominant 7th wants to resolve, and stacking 3rds on different notes of a scale produces a familiar sequence of functional chords. **Quartal** chords — built from stacked perfect 4ths — avoid all of that. A stack like E–A–D–G is open and ambiguous: it does not say major or minor, it has no tritone, and it does not point anywhere. That is exactly what a static modal harmony needs.'),
    p('The most famous quartal shape is the **"So What" voicing**, played by Bill Evans on the original record: three perfect 4ths with a major 3rd on top. Over a D bass, E–A–D–G–B gives the 9th, 5th, root, 11th and 13th of D Dorian — a rich minor sound with no 3rd in it at all. For the bridge, the whole shape simply slides up a half step to E♭m11. There is no voice leading in the classical sense and no function; it is pure colour, moved as a block.'),
    {
      t: 'staff',
      chords: [
        { notes: ['D2', 'E3', 'A3', 'D4', 'G4', 'B4'], label: 'Dm11' },
        { notes: ['Eb2', 'F3', 'Bb3', 'Eb4', 'Ab4', 'C5'], label: 'E♭m11' },
      ],
      caption: 'The "So What" voicing: three 4ths plus a major 3rd, slid up a half step.',
    },
    listen([
      { label: 'So What voicings', music: { voicings: [['D2', 'E3', 'A3', 'D4', 'G4', 'B4'], ['Eb2', 'F3', 'Bb3', 'Eb4', 'Ab4', 'C5'], ['D2', 'E3', 'A3', 'D4', 'G4', 'B4']], beat: 1.4 }, note: 'the same shape a half step apart' },
    ]),
    example('Voice Dm11 in 4ths (the "So What" voicing)', [
      'Over D in the bass, stack 4ths from E: E A D G.',
      'Add a major 3rd on top: B. Against D that is 9, 5, root, 11 and 13 — the colour of D Dorian, with no 3rd needed.',
      'Slide the whole shape up a half step for E♭m11. No voice leading, no function: modal colour.',
    ], { voicings: [['D2', 'E3', 'A3', 'D4', 'G4', 'B4'], ['Eb2', 'F3', 'Bb3', 'Eb4', 'Ab4', 'C5']], beat: 1.4 }),
    p('Quartal voicings can also move **within** the mode. Stack three notes in 4ths on each degree of D Dorian and move the stack up and down the scale over a D pedal: D–G–C, E–A–D, F–B–E, G–C–F and so on. Most of the stacks are perfect 4ths; one or two include the augmented 4th F–B, which adds a flicker of tension. This kind of parallel movement, called **planing**, is the sound of McCoy Tyner\'s piano behind John Coltrane, and it can make a single chord feel alive for minutes at a time.'),

    h('Sus chords: the modal dominant'),
    p('Modal jazz has its own favourite dominant chord: the **sus chord**. G7sus4 is G C D F — a G7 with C replacing the 3rd. Look at it another way and it is a Dm7 chord over a G bass, Dm7/G: the ii and the V of a ii–V sounding at the same moment. That fusion gives the sus chord its special quality. It has the root of a dominant but none of the tension, because there is no 3rd to form a tritone with the 7th. It can resolve to C, but it does not have to; in modal tunes the 4th never needs to fall to the 3rd, and the chord simply hangs in the air.'),
    p('Herbie Hancock\'s "Maiden Voyage" is built almost entirely from sus chords, each sustained for several bars and moving to another sus chord a step or a 3rd away. The result floats in a way no ii–V–I can.'),
    listen([
      { label: 'G7sus4', music: { chord: 'G7sus4' }, note: 'Dm7 over G: ii and V at once' },
      { label: 'G13sus4', music: { chord: 'G13sus4' }, note: 'the full modal-dominant sound' },
    ]),

    h('Modal vamps'),
    p('Modal music does not have to stay on one chord. A **modal vamp** alternates two chords that both belong to the mode, chosen so that the characteristic note is always present and no V–I ever happens. The classic Dorian vamp is **i7 – IV7**: Dm7 to G7 in D Dorian. The G7 contains B, the natural 6th of D, so it keeps announcing Dorian; and because it moves back to Dm7 rather than resolving to C, the C major parent never takes over. The same idea gives Mixolydian its **I – ♭VII** vamp (D to C) and Lydian its **I – II** vamp (C to D over a C bass).'),
    { t: 'prog', key: 'Dm', tokens: ['Dm7', 'G7', 'Dm7', 'G7'], beats: 4, style: 'funk', caption: 'A Dorian vamp: i7 – IV7, with the natural 6th (B) in the IV chord' },
    p('This is where modal jazz meets funk and Latin music. Santana\'s version of "Oye Como Va" sits on an A Dorian vamp (Am7 – D7), and countless funk grooves hold one Dorian or Mixolydian chord for an entire song. The funk lessons pick up the thread.'),
    onRecord('"So What" and "Impressions" (D Dorian, then E♭ Dorian for the bridge), "Maiden Voyage" (sus chords), and the long one-chord vamps of 1970s jazz-funk are the essential listening. Notice how much the rhythm section does to keep a static harmony moving: changing voicings, shifting the bass, building and releasing intensity.'),
    ear('Modal music sounds spacious and unhurried, with a bass that stays put or circles one note. Listen for the characteristic note — the bright 6th of Dorian above all — and for the open, ambiguous sound of chords built in 4ths, which have no clear major or minor quality.'),
    tryIt('Hold a low D and play quartal voicings from D Dorian, moving them up and down the scale; then improvise a melody that keeps returning to D and B. Next, play the "So What" voicing on D and slide it to E♭ and back. Finally, play G7sus4 and G7 one after the other and notice how the sus chord floats while the plain dominant pulls.'),
    recap([
      'Modal jazz replaces fast chord changes with long stretches of one mode ("So What": D Dorian, then E♭ Dorian).',
      'Keep the mode alive by leaning on its characteristic note (Dorian ♮6, Mixolydian ♭7, Lydian ♯4, Phrygian ♭2).',
      'Quartal voicings — stacked 4ths — are open and ambiguous, ideal for static harmony; the "So What" voicing is the classic shape.',
      'Sus chords (G7sus4 = Dm7/G) are ii and V at once: dominant root, no tension, free to hang.',
      'Modal vamps alternate chords within the mode (Dorian i7 – IV7) and lead straight into funk.',
    ]),
    drill('ear.modes', 3),
  ],
  drills: ['ear.modes', 'jazz.bebop'],
};
