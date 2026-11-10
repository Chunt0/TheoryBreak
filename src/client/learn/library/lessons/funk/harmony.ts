import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const funkHarmony: Lesson = {
  id: 'funk.harmony',
  title: 'Funk harmony',
  tags: ['funk'],
  level: 2,
  summary: 'Harmony as colour over a groove: dominant vamps, Dorian minor vamps, two-chord moves with half-step voice leading, side-slips, pentatonic riffs, and how funk tunes use sections instead of chord changes.',
  blocks: [
    p('Funk harmony can look almost too simple on paper. A tune might use one chord for its whole verse, or alternate between two chords for five minutes. That simplicity is deliberate. In funk, harmony is **colour over a groove**: the chords set a mood and then stay out of the way, so that the rhythm, the interlocking parts and the dynamics can carry the music. When something does change harmonically, it changes at the level of whole sections rather than bar by bar.'),
    p('Within that simplicity, though, there are clear types of vamp, characteristic voicings and some neat voice-leading habits. This lesson surveys them.'),

    h('Dominant vamps'),
    p('The most typical funk harmony is a **dominant vamp**: a single dominant chord used as a tonic — I9, I13 or I7♯9 — inherited from the blues. The previous lesson covered these colours. Many grooves extend the idea to two chords, alternating the I7 with the IV7, both dominants, as in a blues that never gets past bar 6: **E9 – A13**, for instance.'),
    p('Inside a two-chord vamp like this, the guide tones do something lovely: they move by half step. E9\'s 3rd and ♭7 are G♯ and D; A13\'s are C♯ and G. So when the chord changes, G♯ slides down to G and D slides down to C♯ — two half steps — and back again on the return. A keyboard or guitar player comping on just those two notes, plus one colour note on top, has everything the vamp needs. Even better, a colour note can often stay put: F♯ is the 9th of E9 and the 13th of A13, a common tone that ties the two chords together.'),
    { t: 'prog', key: 'E', tokens: ['I9', 'IV13', 'I9', 'IV13'], style: 'funk', beats: 4, bpm: 100, caption: 'Dominant vamp: E9 – A13' },
    example('Comp an E9 – A13 vamp with two moving notes', [
      'E9: 3rd G♯, ♭7 D. A13: 3rd C♯, ♭7 G.',
      'Move each guide tone to the nearest note of the next chord: G♯ → G and D → C♯, both a half step.',
      'Add one colour on top — F♯, the 9th of E and the 13th of A, a common tone — and play the voicing as short off-beat 16th stabs.',
    ], { voicings: [['E2', 'D4', 'G#4', 'F#5'], ['A2', 'C#4', 'G4', 'F#5']], beat: 1 }),

    h('Minor vamps: the Dorian sound'),
    p('The other great family of funk harmony is the **minor vamp**, and its mode is almost always **Dorian**. A minor 7th, 9th or 11th chord serves as the tonic, often alternating with the IV7 or IV9 chord — **i7 – IV7**. In B♭ minor that is B♭m7 – E♭9, the vamp at the heart of Herbie Hancock\'s "Chameleon".'),
    p('The IV7 is what makes the vamp Dorian. In B♭ Dorian (B♭ C D♭ E♭ F G A♭), the chord on the 4th degree is E♭ G B♭ D♭ — a dominant 7th — and its 3rd, G, is the raised 6th that distinguishes Dorian from natural minor. Every time the vamp moves to IV7, it announces the Dorian colour; every time it returns to i7, it reinforces the minor tonic. And because the IV7 never resolves to the major key it would normally point to (E♭7 would be V7 of A♭), the music stays firmly centred on B♭ minor.'),
    p('Minor funk chords are often voiced as **m9** or **m11**, or in stacked 4ths, which suit the open, modal sound. A m11 voiced in 4ths over the root — the "So What" voicing from the modal jazz lesson — is right at home on a funk minor vamp.'),
    { t: 'prog', key: 'Bbm', tokens: ['i7', 'IV9', 'i7', 'IV9'], style: 'funk', beats: 4, bpm: 96, caption: 'Dorian vamp: B♭m7 – E♭9' },

    h('Other common vamps'),
    p('A handful of other two-chord moves turn up again and again, each with its own modal flavour.'),
    table(['Vamp', 'In E or E minor', 'Mode', 'Character'], [
      ['I7 (one chord)', 'E9 or E7♯9', 'Mixolydian / blues', 'the classic funk tonic'],
      ['I7 – IV7', 'E9 – A13', 'blues', 'call and answer'],
      ['i7 – IV7', 'Em9 – A9', 'Dorian', 'cool, soulful minor'],
      ['I – ♭VII', 'E – D/E', 'Mixolydian', 'rock-funk drive'],
      ['i7 – ♭VII', 'Em7 – D', 'Aeolian / Dorian', 'darker, rolling'],
    ]),
    p('Notice that none of these contains a V–I. Funk avoids the strong functional cadence because it would pull the music towards resolution and an ending, and the whole point of a vamp is that it can go on indefinitely.'),

    h('Side-slips and chromatic approaches'),
    p('One way funk adds tension to a static harmony is by **side-slipping**: approaching the vamp chord from a half step above or below. An F9 slides down to E9 on the downbeat; an E♭9 slides up into it. The slipped chord lasts only an instant — often a single 16th note before the One — but it gives the arrival a satisfying snap. A longer version moves an entire riff or chord up a half step for a bar and then drops it back, creating a moment of deliberate "wrongness" that makes the return feel even more grounded. The side-slipping lesson explores this as an improvising technique.'),

    h('Riffs and pentatonics'),
    p('Much of the melodic material in funk comes from **pentatonic riffs**, and they interact with the harmony in interesting ways. Over E7, an E minor pentatonic riff (E G A B D) puts G — the ♯9 — against the chord\'s G♯, along with the ♭7 and the 11th. That is the bluesy clash funk loves. Over Em7, the same riff simply spells out an Em11 sound. The pentatonics lesson goes into how to choose and shift them.'),

    h('Form without chord changes'),
    p('If the harmony stays still within a section, structure comes from the arrangement. A funk tune typically has a main groove, then a contrasting section — often called the bridge — on a different chord or vamp (frequently the IV), then a return. Along the way there are **breakdowns** where instruments drop out, **stops** and **hits** where the whole band punctuates together, and builds where parts are added one by one. James Brown directed these changes live, calling out to the band to "take it to the bridge". The harmonic plan is simple; the energy plan is detailed.'),
    onRecord('Herbie Hancock\'s "Chameleon" is the textbook Dorian vamp, and The Meters\' recordings show how much a single dominant chord can do. Listen for the moment a funk tune finally changes chord for its bridge: after minutes on one vamp, even a move to IV sounds enormous.'),
    ear('In a funk vamp, listen for whether the tonic chord is major-and-bluesy (a dominant: Mixolydian or blues) or minor (usually Dorian). Then listen for the second chord: a IV7 in a minor vamp is the sign of Dorian, and the half-step movement of the inner voices is what makes the two chords feel joined.'),
    tryIt('Comp an E9 – A13 vamp using only the guide tones and the F♯ on top, in short 16th-note stabs. Then play a B♭m7 – E♭9 vamp and listen for the G in the E♭9 — the Dorian 6th. Finally, add a side-slip: F9 for the last 16th of the bar before each return to E9.'),
    recap([
      'Funk uses harmony as colour over a groove: one or two chords per section.',
      'Dominant vamps (I9, I13, I7♯9, or I7 – IV7) come from the blues; their guide tones move by half step.',
      'Minor vamps are usually Dorian: i7 – IV7, where the IV7\'s 3rd is the mode\'s raised 6th.',
      'Vamps avoid V–I so that they can repeat indefinitely; side-slips add a moment of tension.',
      'Structure comes from sections, breakdowns, stops and builds rather than from chord changes.',
    ]),
    drill('soul.concepts', 3),
  ],
  drills: ['soul.analysis', 'soul.concepts', 'ear.chord.ext'],
};
