import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const melodic: Lesson = {
  id: 'core.melodic',
  title: 'Melodic-minor harmony',
  tags: ['core', 'jazz'],
  level: 3,
  summary: 'One scale, seven homes: the modes of melodic minor supply the altered dominant, Lydian dominant, Locrian ♮2 and the other colours that define modern jazz harmony.',
  blocks: [
    p('The lesson on the three minor scales introduced melodic minor as a fix: raise the 6th and 7th of natural minor and the melody climbs smoothly to the tonic. In jazz, that scale turned out to be far more than a fix. Its seven modes produce most of the sounds that make post-bop harmony sound "modern" — the altered dominant, the Lydian dominant, the half-diminished chord with a natural 9th, the sus♭9 chord. Learn this one scale thoroughly and you get seven essential colours for the price of one.'),

    h('The scale itself'),
    p('Melodic minor is **1 2 ♭3 4 5 6 7**: a major scale with a lowered 3rd. In C that is C D E♭ F G A B. Jazz musicians use this form going both up and down, which is why it is sometimes called **jazz minor**.'),
    p('It has an unusual property: **no avoid notes on its tonic chord**. Build Cm(maj7) (C E♭ G B) and look at the other notes. D sits a whole step above C, F a whole step above E♭, A a whole step above G. Not one of them sits a half step above a chord tone, so every note of the scale can be sustained over the chord without a clash. Major has its troublesome 4th; melodic minor has nothing of the kind. That makes the scale unusually smooth to improvise with, and it is one reason its modes work so well over the chords they belong to.'),
    p('Its sound is a mixture: a minor 3rd at the bottom, a major 6th and major 7th at the top. The result is bittersweet — darker than major, brighter and more poised than natural minor — and it is the sound of a minor tonic chord like Cm6 or Cm(maj7) at the end of a tune.'),

    h('Seven modes, seven chords'),
    p('Just as the modes of the major scale give the chords of a major key, the modes of melodic minor give a set of chords — but these are chords that a major key does not contain. Each one is a familiar chord type with a particular, often altered, set of tensions.'),
    p('**1. Melodic minor** (from C): the minor tonic, Cm(maj7) or Cm6.'),
    p('**2. Dorian ♭2** (from D: D E♭ F G A B C): a Dorian scale with a ♭2. Its chord is a **sus♭9** — D7sus4 with a ♭9 — a dark, suspended dominant sound beloved of modal jazz.'),
    p('**3. Lydian augmented** (from E♭: E♭ F G A B C D): Lydian with a raised 5th. Its chord is **E♭maj7♯5**, bright and unstable, the ♭III+ of a minor key.'),
    p('**4. Lydian dominant** (from F: F G A B C D E♭): Mixolydian with a ♯4, or Lydian with a ♭7. Its chord is **F7♯11**, a dominant that sounds bright and floating rather than urgent. It is the usual scale for tritone substitutes, for dominant chords that do not resolve down a 5th, and for the IV7 in a blues.'),
    p('**5. Mixolydian ♭6** (from G: G A B C D E♭ F): Mixolydian with a ♭13. Its chord is **G7♭13** with a natural 9 — a dominant heading for a minor chord, as the previous lesson showed with secondary dominants.'),
    p('**6. Locrian ♮2** (from A: A B C D E♭ F G): Locrian with a natural 9th. Its chord is **Am9♭5**, a half-diminished chord with a usable 9th, and it is the preferred scale for the ii of a minor key.'),
    p('**7. Altered** (from B: B C D E♭ F G A): every tension of a dominant chord altered. Read against B, C is the ♭9, D the ♯9, E♭ (= D♯) the 3rd, F the ♯11 or ♭5, G the ♭13 and A the ♭7. Its chord is **B7alt**: maximum tension, maximum pull to the next chord.'),
    table(['Mode', 'From C melodic minor', 'Chord', 'Typical use'], [
      ['1 Melodic minor', 'C', 'Cm(maj7), Cm6', 'minor tonic'],
      ['2 Dorian ♭2', 'D', 'D7sus4♭9', 'sus♭9 dominant'],
      ['3 Lydian augmented', 'E♭', 'E♭maj7♯5', 'bright, unstable major'],
      ['4 Lydian dominant', 'F', 'F7♯11', 'subV7, IV7 in a blues'],
      ['5 Mixolydian ♭6', 'G', 'G7♭13', 'V7/ii, V7/vi'],
      ['6 Locrian ♮2', 'A', 'Am9♭5', 'the minor ii'],
      ['7 Altered', 'B', 'B7alt', 'a V7 resolving hard'],
    ]),
    listen([
      { label: 'C melodic minor', music: { scale: 'melodic_minor', from: 'C4', drone: true }, note: 'bittersweet minor tonic' },
      { label: 'D Dorian ♭2', music: { scale: 'dorian_b2', from: 'D3', drone: true }, note: 'the sus♭9 sound' },
      { label: 'F Lydian dominant', music: { scale: 'lydian_dom', from: 'F3', drone: true }, note: 'bright dominant, ♯11' },
      { label: 'G altered', music: { scale: 'altered', from: 'G3', drone: true }, note: 'every tension altered' },
      { label: 'A Locrian ♮2', music: { scale: 'locrian_n2', from: 'A3', drone: true }, note: 'half-diminished with a 9th' },
    ]),

    h('Shortcuts that make it usable'),
    p('Thinking "the 7th mode of A♭ melodic minor" in the middle of a solo is too slow. Instead, players memorise where the parent scale sits relative to the chord\'s root, and then simply play that melodic minor scale. The two shortcuts you will use most:'),
    p('- **Altered = melodic minor a half step above the root.** For G7alt, play A♭ melodic minor.\n- **Lydian dominant = melodic minor a 5th above the root.** For D♭7♯11, play A♭ melodic minor.\n\nAnd for the minor ii: **Locrian ♮2 = melodic minor a minor 3rd above the root.** For Dm7♭5, play F melodic minor.'),
    p('Look at the first two again: G7alt and D♭7♯11 both use A♭ melodic minor. They are the same seven notes. G and D♭ are a tritone apart, and these two chords are tritone substitutes for each other, so this is **tritone substitution in scale form**: the altered scale on a dominant is the Lydian dominant scale of its tritone sub. It is one of the most useful facts in jazz harmony, because it means you can think of a single familiar scale for either chord.'),
    example('Find the scale for G7alt', [
      'Altered = melodic minor a half step above the root: G → **A♭ melodic minor** (A♭ B♭ C♭ D♭ E♭ F G).',
      'Read it against G: A♭ = ♭9, B♭ = ♯9, C♭ = 3 (B), D♭ = ♯11 or ♭5, E♭ = ♭13, F = ♭7.',
      'Every tension is altered while the 3rd and ♭7 stay intact, giving maximum pull into C. D♭7♯11 uses exactly the same notes.',
    ], { scale: 'altered', from: 'G3', drone: true }),
    example('A minor ii–V–i built from melodic minor', [
      'Dm7♭5 → Locrian ♮2 → F melodic minor (D E F G A♭ B♭ C from D).',
      'G7alt → altered → A♭ melodic minor.',
      'Cm(maj7) or Cm6 → C melodic minor. Three melodic minor scales in a row — F, A♭, C — a minor 3rd apart, and the whole cadence is covered.',
    ], { prog: ['Dm7b5', 'G7alt', 'CmMaj7'], key: 'Cm', beats: 2 }),

    h('Hearing and using these colours'),
    p('Each mode has a recognisable character once you know what to listen for. The **altered** dominant sounds dark and crunchy, with tension in every note above the 3rd and 7th; it resolves with great force. The **Lydian dominant** is the opposite — bright and open, a dominant that seems to hover rather than pull. **Locrian ♮2** softens the half-diminished chord with a smooth 9th. **Dorian ♭2** gives a suspended chord a shadowy ♭9.'),
    p('In practice these sounds turn up most on dominant chords and minor ii–V–is. A plain ii–V–I in major might use Dorian, Mixolydian and Ionian; swap the V for an altered dominant and the cadence instantly sounds more modern and more tense. In a minor key, melodic minor modes are close to the default: Locrian ♮2 on the ii, altered on the V and melodic minor on the tonic.'),
    ear('Over a dominant chord, listen to the 9th. If it is natural and the chord sounds bright with a raised 11th, think Lydian dominant. If the 9th is flat or sharp and the 5th is unstable, think altered. The 9th usually gives the mode away.'),
    tryIt('Play C melodic minor slowly over each of its seven bass notes — C, D, E♭, F, G, A, B — holding the bass under the scale. You will hear seven different chords emerge from one set of notes. Then practise the shortcuts: name the melodic minor scale for G7alt, D♭7♯11, Dm7♭5 and Cm6 as fast as you can.'),
    recap([
      'Melodic minor is 1 2 ♭3 4 5 6 7 — major with a ♭3 — and has no avoid notes on its tonic chord.',
      'Its modes give jazz\'s key colours: Dorian ♭2 (sus♭9), Lydian augmented (maj7♯5), Lydian dominant (7♯11), Mixolydian ♭6 (7♭13), Locrian ♮2 (m9♭5), altered (7alt).',
      'Altered = melodic minor a half step above the root; Lydian dominant = a 5th above; Locrian ♮2 = a minor 3rd above.',
      'G7alt and D♭7♯11 share A♭ melodic minor: tritone substitution in scale form.',
      'A minor ii–V–i can be played entirely with melodic minor modes.',
    ]),
    drill('jazz.mm'),
  ],
  drills: ['jazz.mm', 'gym.keys7.mel', 'ear.scales.jazz'],
};
