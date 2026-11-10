import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, tryIt } from '../blocks';

export const coltrane: Lesson = {
  id: 'jazz.coltrane',
  title: 'Coltrane changes',
  tags: ['jazz'],
  level: 3,
  summary: 'Three keys a major 3rd apart, each reached by its own dominant: the symmetrical harmony of "Giant Steps", why it breaks the pull of a single tonic, and how the same cycle can be dropped into any ii–V–I.',
  blocks: [
    p('In 1959 John Coltrane recorded "Giant Steps", and its chord progression became one of the landmarks of jazz harmony — and one of its most famous tests for improvisers. Most tunes have one home key and make excursions from it. "Giant Steps" does something different: it moves rapidly and symmetrically between **three keys a major 3rd apart**, so that no single key is ever home for long. The underlying pattern, known as **Coltrane changes**, became a general technique that Coltrane and many others applied to other tunes.'),

    h('Dividing the octave by major 3rds'),
    p('Most harmonic movement in tonal music follows the circle of fifths, where each step changes one note of the key and every key has close neighbours and distant ones. Coltrane changes use a different map. Start on B and go down a major 3rd to G, then another to E♭, then another — and you are back on B. Three major 3rds make exactly one octave. The three keys form an augmented triad of key centres, perfectly evenly spaced.'),
    p('That symmetry is the point. In a normal tune, the tonic is the centre of gravity and every other key is defined by its distance from it. Here, B, G and E♭ are all exactly as far from each other as they can be in this cycle, and none of them has priority. The ear never settles; each new tonic is replaced almost immediately by the next. The result sounds bright, restless and exhilarating.'),
    p('Coltrane did not invent the idea from nothing. The bridge of Rodgers and Hart\'s "Have You Met Miss Jones" (1937) already moves through keys a major 3rd apart — B♭, G♭ and D — and Coltrane knew the tune well. What he did was make the cycle the whole substance of a piece, and speed it up enormously.'),

    h('How "Giant Steps" works'),
    p('Every chord in "Giant Steps" is either a **tonic** major 7th chord in one of the three keys, or a **dominant** (sometimes with its ii) leading to the next tonic. That is all. Look at the first four bars:'),
    p('**Bmaj7 – D7 | Gmaj7 – B♭7 | E♭maj7 | Am7 – D7**'),
    p('Bmaj7 is a tonic. D7 is the V7 of G, and Gmaj7 arrives. B♭7 is the V7 of E♭, and E♭maj7 arrives. Am7 – D7 is a ii–V back to G. The tonics fall by major 3rds — B, G, E♭ — and each is announced by its own dominant. The next four bars do it again in a different order, ending with a ii–V (Fm7 – B♭7) to E♭ that leads into the second half.'),
    { t: 'prog', key: 'B', tokens: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'Ebmaj7', 'Am7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7', 'Bmaj7', 'Fm7', 'Bb7'], style: 'swing', bpm: 132, caption: '"Giant Steps", bars 1–8' },
    example('Find the key centres in bars 1–4', [
      'Bmaj7 – D7 | Gmaj7 – B♭7 | E♭maj7 | Am7 – D7.',
      'The maj7 chords are the tonics: B, G, E♭ — each a major 3rd below the last.',
      'Every dominant is the V7 of the next tonic (D7 → G, B♭7 → E♭), and Am7 – D7 is a ii–V back to G.',
    ], { prog: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'Ebmaj7', 'Am7', 'D7'], key: 'B', beats: 2, style: 'swing' }),
    p('The second half of the tune changes the pattern: after a bar of E♭maj7, each key gets a complete ii–V–I over two bars — Am7 – D7 to G, C♯m7 – F♯7 to B, Fm7 – B♭7 to E♭ — and a final C♯m7 – F♯7 turns the form back to B. The same three tonics and the same logic, now approached through ii–Vs. On the original recording all of this flies past at around 280 beats per minute.'),

    h('The Coltrane substitution'),
    p('Coltrane realised that the cycle could be dropped into an ordinary ii–V–I. The trick is to keep the starting chord and the destination, and fill the space between them with a tour of the major-3rd cycle that ends where the original progression would have ended.'),
    p('Take Dm7 – G7 – Cmaj7. The destination is C; the other two keys in its major-3rd cycle are A♭ and E. So: start on Dm7 as usual, then go to the dominant of A♭ (E♭7) and A♭maj7; then the dominant of E (B7) and Emaj7; then the dominant of C (G7) and Cmaj7. The result is **Dm7 – E♭7 | A♭maj7 – B7 | Emaj7 – G7 | Cmaj7**: the same start and finish as a two-bar ii–V–I, with a whirlwind journey through three keys in between.'),
    { t: 'prog', key: 'C', tokens: ['Dm7', 'Eb7', 'Abmaj7', 'B7', 'Emaj7', 'G7', 'Cmaj7', 'Cmaj7'], style: 'swing', caption: 'The Coltrane substitution for ii–V–I in C' },
    p('Coltrane used this to rewrite standards. His "Countdown" is built on the changes of Miles Davis\'s "Tune Up" with every ii–V–I replaced by a Coltrane cycle; "26-2" does the same to Charlie Parker\'s "Confirmation", and "Satellite" to "How High the Moon". Played against the original tune, the substitution sounds like the harmony suddenly lifting off and landing again exactly on time.'),
    listen([
      { label: 'ii – V – I', music: { prog: ['Dm7', 'G7', 'Cmaj7'], key: 'C', beats: [4, 4, 8], style: 'swing' }, note: 'the original, over four bars' },
      { label: 'Coltrane sub', music: { prog: ['Dm7', 'Eb7', 'Abmaj7', 'B7', 'Emaj7', 'G7', 'Cmaj7'], key: 'C', beats: [2, 2, 2, 2, 2, 2, 4], style: 'swing' }, note: 'the same four bars, three keys' },
    ]),

    h('Improvising on Coltrane changes'),
    p('Coltrane changes are hard to improvise on because the key changes every two beats and there is no time to think in scales. Players develop a few strategies. One is to use short, compact **patterns** that outline each chord clearly — Coltrane himself often used four-note figures such as 1–2–3–5 of each tonic and dominant, moving them with the harmony. Another is to follow the **guide tones**, which, as always, move smoothly even when the roots leap. A third is to hear the whole cycle as a single sound: the three tonics form an augmented triad (B, D♯ and G), and some players build lines from the symmetrical scales related to it.'),
    p('The most important practice is simply slow repetition. Learn the progression as harmony first, at the keyboard, until you can hear where each chord is going. Then the speed can come.'),
    onRecord('Listen to "Giant Steps" for the cycle in its purest form, then to "Countdown" for the substitution applied to a standard. Afterwards, listen to "Tune Up" and "Countdown" one after the other: the same overall journey, one in plain ii–V–Is and one in Coltrane cycles.'),
    ear('Coltrane changes give themselves away by their restless, bright key changes: major 7th chords appearing in quick succession on roots a major 3rd apart, each one preceded by its own dominant. The bass alternates big leaps — down a major 3rd, then up a 4th into the next tonic\'s dominant.'),
    tryIt('Play only the three tonics — Bmaj7, Gmaj7, E♭maj7 — slowly, until the sound of the cycle is familiar. Then add each dominant before its tonic. Finally, play the Coltrane substitution in C, Dm7 – E♭7 | A♭maj7 – B7 | Emaj7 – G7 | Cmaj7, and play a simple 1–2–3–5 pattern on every chord.'),
    recap([
      'Coltrane changes move between three keys a major 3rd apart — B, G, E♭ in "Giant Steps" — which divide the octave evenly.',
      'With no single tonic, the harmony stays restless and bright.',
      'Every chord is either a tonic maj7 or a dominant (sometimes with its ii) leading to the next tonic.',
      'The Coltrane substitution fills a ii–V–I with the cycle: Dm7 – E♭7 | A♭maj7 – B7 | Emaj7 – G7 | Cmaj7.',
      'Improvise with compact patterns, guide tones and slow practice.',
    ]),
    drill('ear.motion', 3),
  ],
  drills: ['ear.prog.subs', 'ear.motion'],
};
