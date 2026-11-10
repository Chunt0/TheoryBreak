import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const tensions: Lesson = {
  id: 'core.tensions',
  title: 'Extensions, tensions & avoid notes',
  tags: ['core', 'jazz'],
  level: 2,
  summary: 'The 9ths, 11ths and 13ths that colour jazz and soul chords: which ones each chord takes, why some notes clash, and what altered tensions do on a dominant.',
  blocks: [
    p('In jazz, R&B and gospel, chords rarely stop at the 7th. Above the 7th sit the **tensions** — 9ths, 11ths and 13ths, and altered versions of them — which add colour and richness without changing what the chord does. A Dm9 is still a ii chord; a G13 is still a V. But choosing the right tensions is the difference between a voicing that glows and one that sounds faintly wrong, and this lesson is about how to choose them.'),

    h('Carrying on the stack'),
    p('A seventh chord is four notes stacked in 3rds. Keep stacking and you reach the 9th, the 11th and the 13th. Stack one more 3rd and you arrive back at the root two octaves up, because by then you have used all seven notes of the scale. So a 13th chord, in theory, contains the whole scale.'),
    p('The tensions are given compound names — 9 rather than 2, 11 rather than 4, 13 rather than 6 — because they sit above the 7th of the chord, stacked on top rather than crowding the root. In C, the 9th is D, the 11th is F and the 13th is A. In a real voicing these notes can be placed anywhere, but the name tells you their role: colour on top of a complete 7th chord.'),
    p('Chord symbols use this naming consistently, and it is worth being precise about it. **C9** means a dominant 7th with a 9th added: C E G B♭ D — the 7th is implied by the number. **Cmaj9** and **Cm9** work the same way for major 7th and minor 7th chords. **C13** usually means the 7th and 9th are present too, though the 11th is left out. By contrast, **Cadd9** means a plain triad with a 9th and no 7th at all, and **C6/9** means a triad with the 6th and 9th.'),

    h('Natural and altered tensions'),
    p('The **natural** tensions are the ones that come straight from the chord\'s scale: the 9th, 11th and 13th. The **altered** tensions are raised or lowered versions — ♭9, ♯9, ♯11 and ♭13. Altered tensions belong mainly to dominant chords, which can take almost any of them, while major and minor chords mostly stick to the natural ones. The one alteration that also appears on major 7th chords is the ♯11, for reasons that will become clear in a moment.'),

    h('The avoid-note rule'),
    p('Not every scale note makes a good tension. The guiding principle is simple and worth memorising: **a tension sounds good when it sits at least a whole step above a chord tone. A note only a half step above a chord tone — a minor 9th above it — clashes.** Such a note is called an **avoid note**.'),
    p('The classic example is the 11th on a major 7th chord. Over Cmaj7 (C E G B), the 11th is F, which sits just a half step above E, the 3rd. Sustain them together and the F does not sound like a colour; it sounds like a suspension that wants to fall to E, or like a wrong note. Raise it to F♯ and the problem disappears: F♯ sits a whole step above E and floats above the chord. That is why the ♯11 — the Lydian sound — is the preferred "11th" on major 7th chords.'),
    p('"Avoid" does not mean "never play". An avoid note is perfectly fine as a passing note in a melody, and many great melodies lean on one before resolving. The rule is about notes you **sustain** in a chord voicing or land on for a long time. And there is one big exception: on dominant chords, a ♭9 above the root is not avoided at all. Its bite is the point, as the section on dominants explains.'),
    listen([
      { label: 'Cmaj7 + 11', music: { notes: ['C3', 'E4', 'F4', 'B4'], mode: 'chord' }, note: 'the F rubs against the E: a clash' },
      { label: 'Cmaj7♯11', music: { chord: 'Cmaj7#11' }, note: 'F♯ floats a whole step above E' },
    ]),

    h('Chord by chord'),
    p('Apply the rule to each chord in its usual scale and a clear picture emerges.'),
    p('**Major 7th** (Ionian or Lydian): the 9th and 13th are always available. The natural 11th clashes with the 3rd, so it is replaced by ♯11.'),
    p('**Minor 7th as ii** (Dorian): every tension works. Over Dm7, the 9th (E), 11th (G) and 13th (B) each sit a whole step above a chord tone. That is why Dm9, Dm11 and Dm13 all sound so natural, and why Dorian is the favourite minor sound in jazz.'),
    p('**Minor 7th as vi or iii**: here the scale changes and so do the tensions. As vi (Aeolian), the ♭13 sits a half step above the 5th, so it is avoided, but the 9th and 11th are fine. As iii (Phrygian), the ♭9 sits a half step above the root and the ♭13 a half step above the 5th; only the 11th is really safe.'),
    p('**Dominant 7th**: almost everything works — 9, ♭9, ♯9, ♯11, 13 and ♭13. The one note that clashes is the natural 11th, which sits a half step above the 3rd. The exception is the **sus** chord, where the 3rd is left out entirely and the 4th takes its place, so there is nothing for it to clash with.'),
    p('**Half-diminished (m7♭5)**: the 11th and ♭13 are available. The 9th depends on the scale: plain Locrian has a ♭9, which clashes with the root, while Locrian ♮2 (from melodic minor) has a natural 9th that works beautifully. **Diminished 7th**: any note a whole step above a chord tone works, which is exactly what the whole–half diminished scale supplies.'),
    table(['Chord', 'Available', 'Avoid'], [
      ['maj7 (I)', '9 · ♯11 · 13', '11 (a ♭9 above the 3rd)'],
      ['m7 (ii, Dorian)', '9 · 11 · 13', '—'],
      ['m7 (iii / vi)', '11 (iii) · 9, 11 (vi)', '♭9, ♭13 (iii) · ♭13 (vi)'],
      ['7 (dominant)', '9 · ♭9 · ♯9 · ♯11 · 13 · ♭13', '11 (unless sus)'],
      ['m7♭5', '9 (Locrian ♮2) · 11 · ♭13', '♭9 (plain Locrian)'],
      ['°7', 'a whole step above any chord tone', '—'],
    ]),
    example('Which tensions fit Dm7 as ii in C?', [
      'Dm7 is ii, so its scale is C major from D — D Dorian: D E F G A B C.',
      'The tensions are the notes that are not chord tones: E (9), G (11) and B (13). Check each against the chord tone a half step below it: none sits a ♭9 above a chord tone.',
      'So 9, 11 and 13 are all available — which is why Dm11 and Dm13 sound so natural. Over Cmaj7, the same F (the 11th) sits a half step above E, so there it is avoided.',
    ], { chord: 'Dm11' }),

    h('Tensions on the dominant'),
    p('Dominant chords are where tensions do their most important work, and the choice between natural and altered tensions changes the whole feel of a cadence.'),
    p('**Natural tensions** — 9, 13, and the ♯11 of Lydian dominant — sound open, bright and floating. A G13 resolving to C feels smooth and sophisticated, more like a gentle landing than a strong pull.'),
    p('**Altered tensions** — ♭9, ♯9 and ♭13 — sound darker and more tense, and they intensify the pull to the next chord. There is a neat reason they work so well before a **minor** chord. Take G7 resolving to C minor: the ♭9 of G7 is A♭ and its ♭13 is E♭, and both of those are notes of C minor. The altered tensions are quietly announcing the key the chord is about to resolve to. That is why a minor ii–V–i almost always uses an altered dominant: G7♭9 or G7♭13 rather than a plain G9.'),
    example('Which tensions fit G7 resolving to C minor?', [
      'The target is C minor, so the dominant takes its notes from C harmonic minor, played from G: G A♭ B C D E♭ F (Phrygian dominant).',
      'The tensions are A♭ (♭9), C (11) and E♭ (♭13). The 11th clashes with the 3rd (B), so leave it out.',
      'Result: G7♭9, G7♭13, or both — G7♭9♭13. Both tensions belong to C minor and resolve down by step: A♭ to G, E♭ to D or straight onto the C minor chord.',
    ], { prog: ['G7b9b13', 'Cm'], key: 'Cm', beats: 2 }),
    listen([
      { label: 'G13', music: { chord: 'G13' }, note: 'natural tensions: open and bright' },
      { label: 'G7alt', music: { chord: 'G7alt' }, note: 'altered tensions: dark and urgent' },
      { label: 'G13 → C', music: { prog: ['G13', 'Cmaj7'], key: 'C', beats: 2 }, note: 'a smooth landing' },
      { label: 'G7♭9 → Cm', music: { prog: ['G7b9', 'Cm'], key: 'Cm', beats: 2 }, note: 'the ♭9 foreshadows the minor key' },
    ]),
    p('In practice, voicings with tensions leave notes out. The 5th is usually the first to go, since it adds little colour, and the root is often dropped when a bass player is covering it. The 3rd and 7th stay, because they define the chord, and the tensions are added on top. The voicings lessons turn this into concrete shapes.'),
    ear('When a chord sounds "expensive" but you cannot name it, listen for the top note against the bass. A note that floats is probably a natural tension (9 or 13); a note that bites is probably an altered one (♭9 or ♯9); a note that sounds like it wants to fall a half step is probably an avoid note.'),
    tryIt('Hold Cmaj7 and add D, then F, then F♯, one at a time, and listen to each against the E. Then hold G7 and compare A (9) with A♭ (♭9), resolving each to C major and then to C minor. You will hear which tension belongs to which target.'),
    recap([
      'Tensions are the 9th, 11th and 13th stacked above a 7th chord; they add colour without changing function.',
      'A tension works when it sits a whole step or more above a chord tone; a note a half step above a chord tone is an avoid note.',
      'maj7 avoids the 11 (use ♯11); m7 as ii takes everything; dominants take everything except the natural 11 unless sus.',
      'On dominants, natural tensions (9, 13, ♯11) float; altered ones (♭9, ♯9, ♭13) push harder.',
      'Altered tensions suit minor targets because they are notes of the minor key the chord resolves to.',
    ]),
    drill('gym.spell.ext'),
  ],
  drills: ['gym.spell.ext', 'ear.chord.ext', 'ear.chord.alt'],
};
