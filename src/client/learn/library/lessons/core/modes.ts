import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const modes: Lesson = {
  id: 'core.modes',
  title: 'The modes of major',
  tags: ['core', 'jazz'],
  level: 2,
  summary: 'Seven scales from one set of notes, each with a single characteristic note that gives it away — and the right way to think about them.',
  blocks: [
    p('Play the white keys from C to C and you hear a major scale. Play the same white keys from D to D and you hear something different — still the same seven notes, but with a different note as home, and a different mood. Do that from each of the seven notes and you get the seven **modes** of the major scale.'),
    p('Modes are central to jazz improvisation, to funk and soul vamps, and to film and game music, and they are also one of the most commonly misunderstood topics in theory. This lesson explains what a mode really is, introduces each one by the note that makes it distinctive, and shows the most useful way to keep them straight.'),

    h('Same notes, different home'),
    p('The usual first explanation is that D Dorian is "C major starting on D". That is true as far as the notes go, and it is how the modes were derived, but it is not how they sound. If you play D to D over a C bass, you just hear C major. A mode only becomes itself when its own first note is established as the tonic — with a drone, a bass note, or a vamp that keeps returning to it. Then the same set of notes takes on a completely different character, because every note now has a different relationship to home.'),
    p('So the practical way to think about a mode is as **a scale on a fixed root**, compared with the two scales you already know well: major and natural minor. Each mode turns out to be one of those with a single note changed. That one note is the **characteristic note**, and it is the whole point of the mode — it is what you listen for and what you lean on when you play it.'),

    h('The seven modes, by their characteristic note'),
    p('**Ionian** is the major scale itself: 1 2 3 4 5 6 7. It is the reference point for the major-sounding modes.'),
    p('**Lydian** is major with a raised 4th: 1 2 3 ♯4 5 6 7. That ♯4 removes the one note in major that clashes with the tonic chord, and it gives Lydian a bright, floating, slightly dreamy quality. It is the sound of a maj7♯11 chord.'),
    p('**Mixolydian** is major with a lowered 7th: 1 2 3 4 5 6 ♭7. The ♭7 turns the tonic chord into a dominant 7th, so Mixolydian sounds major but bluesy and earthy. It is the home of dominant-chord vamps in funk and the scale for an unaltered V7 in jazz.'),
    p('**Aeolian** is natural minor: 1 2 ♭3 4 5 ♭6 ♭7. It is the reference point for the minor-sounding modes.'),
    p('**Dorian** is natural minor with a raised 6th: 1 2 ♭3 4 5 6 ♭7. That natural 6th lifts the darkness of minor; Dorian sounds cool, soulful and a little hopeful. It is the default minor sound in jazz (for m7 chords, especially ii7), in funk and in modal tunes like "So What".'),
    p('**Phrygian** is natural minor with a lowered 2nd: 1 ♭2 ♭3 4 5 ♭6 ♭7. The ♭2, a half step above the tonic, gives it a dark, tense, Spanish flavour. It is the sound of sus♭9 chords.'),
    p('**Locrian** is natural minor with a lowered 2nd and a lowered 5th: 1 ♭2 ♭3 4 ♭5 ♭6 ♭7. The diminished 5th makes its tonic chord unstable — a half-diminished chord — so Locrian is rarely used as a home key. Its real job is as the scale for m7♭5 chords.'),
    table(['Mode', 'Formula', 'Compare with', 'Characteristic note', 'Chord'], [
      ['Lydian', '1 2 3 ♯4 5 6 7', 'major', '♯4', 'maj7♯11'],
      ['Ionian', '1 2 3 4 5 6 7', '—', '4 (avoid over maj7)', 'maj7, 6'],
      ['Mixolydian', '1 2 3 4 5 6 ♭7', 'major', '♭7', '7, 7sus4'],
      ['Dorian', '1 2 ♭3 4 5 6 ♭7', 'minor', '♮6', 'm7, m6, m13'],
      ['Aeolian', '1 2 ♭3 4 5 ♭6 ♭7', '—', '♭6', 'm7 (vi), minor-key i'],
      ['Phrygian', '1 ♭2 ♭3 4 5 ♭6 ♭7', 'minor', '♭2', 'sus♭9, m7 (iii)'],
      ['Locrian', '1 ♭2 ♭3 4 ♭5 ♭6 ♭7', 'minor', '♭2 and ♭5', 'm7♭5'],
    ]),
    p('The table is arranged from **brightest to darkest**, and the order is not arbitrary. Each step down lowers exactly one note. Lydian\'s ♯4 drops to 4 and you have Ionian; lower the 7th and you have Mixolydian; lower the 3rd and you are in Dorian; lower the 6th for Aeolian; the 2nd for Phrygian; and finally the 5th for Locrian. If you ever forget a mode\'s formula, you can rebuild it from that chain.'),

    h('Hearing the modes'),
    p('You do not need to hear all seven notes to identify a mode. Over a drone, ask two questions. First: is the 3rd major or minor? That puts you on the bright side (Lydian, Ionian, Mixolydian) or the dark side (Dorian, Aeolian, Phrygian, Locrian). Second: listen for the one characteristic note. A raised 4th means Lydian, a ♭7 means Mixolydian, a bright 6th in a minor scale means Dorian, a ♭2 means Phrygian.'),
    listen([
      { label: 'D Dorian', music: { scale: 'dorian', from: 'D3', drone: true }, note: 'listen for the B♮' },
      { label: 'D Mixolydian', music: { scale: 'mixolydian', from: 'D3', drone: true }, note: 'C♮ against F♯' },
      { label: 'D Lydian', music: { scale: 'lydian', from: 'D3', drone: true }, note: 'the G♯' },
      { label: 'D Phrygian', music: { scale: 'phrygian', from: 'D3', drone: true }, note: 'the E♭' },
      { label: 'D Aeolian', music: { scale: 'minor', from: 'D3', drone: true }, note: 'the B♭' },
      { label: 'D Locrian', music: { scale: 'locrian', from: 'D3', drone: true }, note: 'E♭ and A♭: even the 5th is unstable' },
    ]),
    example('E Phrygian vs E Aeolian', [
      'E Aeolian (the relative minor of G major): E F♯ G A B C D.',
      'E Phrygian (the white keys from E): E **F** G A B C D.',
      'One note differs — F against F♯. That half step above the root is Phrygian\'s fingerprint: dark, tense, Spanish, the sound of sus♭9 chords.',
    ], { scale: 'phrygian', from: 'E3', drone: true }),

    h('Finding a mode on any root'),
    p('There are two ways to work out the notes of, say, B♭ Mixolydian, and it is worth being fluent in both.'),
    p('The **parent-scale method** asks which major scale this mode comes from. Mixolydian is the 5th mode, so B♭ is the 5th degree of the parent; the major scale with B♭ as its 5th is E♭ major. So B♭ Mixolydian has the notes of E♭ major: B♭ C D E♭ F G A♭. This is quick when you know your keys, and it tells you which key signature the mode uses.'),
    p('The **alteration method** starts from the root\'s own major or minor scale and changes the characteristic note. B♭ major is B♭ C D E♭ F G A; Mixolydian lowers the 7th, so A becomes A♭. Same answer. This method is better for hearing and improvising, because it keeps your attention on the note that gives the mode its character.'),
    example('Spell F♯ Dorian two ways', [
      'Parent scale: Dorian is the 2nd mode, so F♯ is the 2nd degree of the parent major scale — E major (four sharps). F♯ Dorian: F♯ G♯ A B C♯ D♯ E.',
      'Alteration: F♯ natural minor is F♯ G♯ A B C♯ D E. Dorian raises the 6th: D becomes **D♯**.',
      'Both give F♯ G♯ A B C♯ D♯ E. The D♯ is the note to lean on — it is what makes it Dorian rather than plain minor.',
    ], { scale: 'dorian', from: 'F#3', drone: true }),

    h('Where the modes live'),
    p('In jazz, modes are mostly a way of choosing notes for a chord: Dorian over ii7, Mixolydian over V7, Ionian or Lydian over Imaj7. That idea — chord–scale theory — gets its own lesson. In **modal** music, by contrast, the mode is the whole tonal world. Miles Davis\'s "So What" sits on D Dorian for long stretches before moving up to E♭ Dorian; a funk vamp may stay on one Mixolydian or Dorian chord for an entire song. Here there is no ii–V–I pulling the music along; the colour of the mode itself, and especially its characteristic note, is what the music is about.'),
    onRecord('**Dorian:** "So What" and Coltrane\'s "Impressions"; the Am7–D7 vamp of "Oye Como Va". **Mixolydian:** the melody of "Norwegian Wood"; almost every one-chord James Brown vamp. **Lydian:** the theme from *The Simpsons*, which leans hard on its ♯4. **Aeolian:** the i–♭VII–♭VI of "All Along the Watchtower". **Phrygian:** flamenco, and the Spanish-tinged section of Miles Davis\'s "Flamenco Sketches".'),
    ear('Over a drone, decide major or minor 3rd first, then listen only for the characteristic note. You never need to hear all seven notes to name the mode.'),
    tryIt('Hold a low D and improvise slowly in each mode, leaning on its characteristic note: G♯ in Lydian, C in Mixolydian, B in Dorian, E♭ in Phrygian. Then try the same thing on a different root. The goal is to feel the colour of each mode, not to run the scale up and down.'),
    recap([
      'A mode is a scale on a fixed root; it only sounds like itself when that root is established as home.',
      'Each mode is major or natural minor with one characteristic note changed: Lydian ♯4, Mixolydian ♭7, Dorian ♮6, Phrygian ♭2, Locrian ♭2 and ♭5.',
      'From brightest to darkest — Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian — each step lowers one note.',
      'Find a mode by its parent major scale, or by altering the root\'s own major or minor scale.',
      'To hear one: major or minor 3rd first, then listen for the characteristic note.',
    ]),
    drill('ear.modes'),
  ],
  drills: ['ear.modes', 'gym.scales.play', 'jazz.chordscale'],
};
