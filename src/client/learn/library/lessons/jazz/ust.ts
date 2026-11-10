import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const ust: Lesson = {
  id: 'jazz.ust',
  title: 'Upper-structure triads',
  tags: ['jazz'],
  level: 3,
  summary: 'Put a simple triad on top of a dominant\'s 3rd and ♭7 and you get a precise set of tensions in one easy shape. Six triads, the colours they make, and how to choose between them.',
  blocks: [
    p('A chord symbol like **C13♯11** or **C7♯9♭13** asks for a specific set of tensions, and working those out note by note — the 9th is D, the ♯11 is F♯, the 13th is A — is slow, especially in the middle of a tune. Jazz pianists found a shortcut. Play the dominant\'s guide tones in the left hand, and an ordinary **triad** in the right hand. The triad\'s three notes become three tensions at once. These **upper-structure triads** are one of the most practical ideas in jazz harmony: quick to find, easy to hear, and very rich in sound.'),

    h('A chord on top of a chord'),
    p('Start with the shell of C7: its 3rd and ♭7, **E and B♭**, played in the left hand (with the root low in the bass, or left to the bass player). Those two notes define the chord as a dominant. Now play a **D major triad** — D, F♯, A — above them in the right hand. Against the root C, D is the 9th, F♯ the ♯11 and A the 13th. One familiar shape has given you a C13♯11, the Lydian dominant sound.'),
    p('This works so well for a reason beyond convenience. A triad is consonant in itself, so even when its notes are tensions against the root, the ear hears them as a clear, coherent layer — a bright chord ringing on top of a darker one — rather than a cluster of dissonances. That clarity is why upper-structure voicings sound so open and polished. They are often written as **polychords**, a triad over a chord: D/C7, read "D triad over C7".'),
    example('D over C7', [
      'Spell the triad: D F♯ A.',
      'Name each note against C: D = 9, F♯ = ♯11, A = 13.',
      'With the shell (E and B♭) underneath: C13♯11 — the Lydian dominant sound, bright and floating.',
    ], { notes: ['C2', 'E3', 'Bb3', 'D4', 'F#4', 'A4'], mode: 'chord' }),
    example('A♭ over C7', [
      'Spell the triad: A♭ C E♭.',
      'Name it against C: A♭ = ♭13, C = root, E♭ = ♯9.',
      'With the 3–♭7 shell (E and B♭) underneath: C7♯9♭13 — the altered sound, from one easy triad.',
    ], { notes: ['C2', 'E3', 'Bb3', 'Ab4', 'C5', 'Eb5'], mode: 'chord' }),

    h('Six useful triads'),
    p('Not every triad works over a dominant: some contain the natural 11th, which clashes with the 3rd, or a major 7th, which clashes with the ♭7. Six major triads give clear, usable colours. Named by their root\'s distance from the dominant\'s root, over C7 they are:'),
    table(['Triad over C7', 'Tensions', 'Scale'], [
      ['D (II)', '9 · ♯11 · 13', 'Lydian dominant'],
      ['E♭ (♭III)', '♯9 · 5 · ♭7', 'half-whole / blues'],
      ['F♯ (♭V)', '♯11 · ♭7 · ♭9', 'half-whole diminished'],
      ['A♭ (♭VI)', '♭13 · R · ♯9', 'altered'],
      ['A (VI)', '13 · ♭9 · 3', 'half-whole diminished'],
      ['B♭ (♭VII)', '♭7 · 9 · 11', 'sus (Mixolydian)'],
    ]),
    p('They fall naturally into groups. **D (II)** gives only natural tensions and a ♯11: a bright, open dominant that suits tritone substitutes and dominants that do not resolve down a 5th. **B♭ (♭VII)** puts the 11th on top, which clashes with the 3rd unless you leave the 3rd out — so it is really a **sus** voicing, the modal dominant. **A♭ (♭VI)** and **E♭ (♭III)** give the altered, bluesy colours: A♭ is the classic altered sound with ♭13 and ♯9, while E♭ adds the ♯9 alone over a natural 5th, the gritty sound of a 7♯9. **F♯ (♭V)** and **A (VI)** both come from the half–whole diminished scale and combine a ♭9 with brighter notes — ♯11 for F♯, 13 for A — which is the sound of a 13♭9 chord.'),
    listen([
      { label: 'D/C7', music: { notes: ['C2', 'E3', 'Bb3', 'D4', 'F#4', 'A4'], mode: 'chord' }, note: 'bright: 9, ♯11, 13' },
      { label: 'A♭/C7', music: { notes: ['C2', 'E3', 'Bb3', 'Ab4', 'C5', 'Eb5'], mode: 'chord' }, note: 'altered: ♭13, ♯9' },
      { label: 'A/C7', music: { notes: ['C2', 'E3', 'Bb3', 'A4', 'C#5', 'E5'], mode: 'chord' }, note: 'diminished: 13, ♭9' },
      { label: 'F♯/C7', music: { notes: ['C2', 'E3', 'Bb3', 'F#4', 'A#4', 'C#5'], mode: 'chord' }, note: 'diminished: ♯11, ♭9' },
      { label: 'E♭/C7', music: { notes: ['C2', 'E3', 'Bb3', 'Eb4', 'G4', 'Bb4'], mode: 'chord' }, note: 'gritty: the ♯9 against the 3rd' },
      { label: 'B♭/C', music: { notes: ['C2', 'G3', 'Bb3', 'D4', 'F4', 'Bb4'], mode: 'chord' }, note: 'sus: 3rd left out, ♭7–9–11 on top' },
    ]),

    h('Choosing a triad'),
    p('The choice follows the same logic as choosing tensions in general.'),
    p('**Where is the chord going?** A dominant resolving to a minor chord suits the altered and diminished triads — A♭, E♭, F♯ or A — because their ♭9 and ♭13 belong to the minor key ahead. A dominant resolving to a major chord can take any of them, but D and A sound especially natural. A dominant that does not resolve down a 5th — a tritone sub, a II7, a blues IV7 — usually wants D (Lydian dominant).'),
    p('**What is the melody?** The top note of the triad is the note listeners hear as the melody, so when you are harmonising a tune, choose the triad whose notes include the melody note and put that note on top. A melody note A♭ over C7 suggests the A♭ triad; a melody note F♯ suggests D or F♯.'),
    p('**How does it connect?** Upper-structure triads lead smoothly into the next chord when each note moves by step. A♭ major over C7 (A♭ C E♭) resolves beautifully into an A minor triad over F (A C E), which is Fmaj7 without its root: A♭ rises to A, C stays, E♭ rises to E.'),
    example('Resolve A♭/C7 to Fmaj7', [
      'Over C7 (shell E and B♭), play an A♭ triad: A♭ C E♭.',
      'Move to F: the shell becomes E and A (or A and E), and the triad becomes A C E — an A minor triad, the 3rd, 5th and 7th of Fmaj7.',
      'In the right hand, A♭ → A and E♭ → E rise by half steps, C holds: the altered tensions open out into the major 7th chord.',
    ], { voicings: [['C2', 'E3', 'Bb3', 'Ab4', 'C5', 'Eb5'], ['F2', 'E3', 'A3', 'A4', 'C5', 'E5']], beat: 1.4 }),

    h('Beyond dominants'),
    p('The same idea works on other chord types. Over **Cmaj7**, a G major triad (G B D) gives the 5th, 7th and 9th — a clean Cmaj9 — and a D major triad gives 9, ♯11 and 13, the Lydian sound. Over **Cm7**, a B♭ major triad (B♭ D F) gives ♭7, 9 and 11 — a Cm11 — and an E♭ major triad gives a plain Cm7 colour with the ♭3 on the bottom. Over a **half-diminished** chord, a major triad on the ♭7 — B♭ over Cm7♭5 — gives the ♭7, 9 and 11, the Locrian ♮2 sound. Once you think of chords in layers — a foundation and a triad on top — a great many rich voicings become easy to find.'),
    ear('An upper-structure voicing has a distinctive two-layer sound: a clear, ringing triad floating above the darker foundation of the shell. Try to hear the top triad on its own — major and bright — and then ask how it relates to the bass.'),
    tryIt('Hold E and B♭ in the left hand with C in the bass, and play each of the six triads in turn in the right: D, E♭, F♯, A♭, A, B♭. Name the three tensions out loud each time. Then resolve each voicing to an F chord, moving every voice as little as possible, and notice which triads lead most smoothly to F major and which to F minor.'),
    recap([
      'An upper-structure triad is a triad played over a dominant\'s 3rd and ♭7, turning three tensions into one easy shape.',
      'The triad sounds clear because it is consonant in itself — a bright chord layered on a darker one.',
      'Over C7: D (9 ♯11 13), E♭ (♯9), F♯ (♯11 ♭9), A♭ (♭13 ♯9), A (13 ♭9), B♭ (sus).',
      'Choose by where the chord resolves, by the melody note on top, and by how smoothly the triad leads on.',
      'The idea extends to maj7, m7 and half-diminished chords.',
    ]),
    drill('jazz.ust'),
  ],
  drills: ['jazz.ust', 'ear.chord.alt'],
};
