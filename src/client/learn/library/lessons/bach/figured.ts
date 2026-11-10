import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const figured: Lesson = {
  id: 'bach.figured',
  title: 'Figured bass',
  tags: ['bach'],
  level: 1,
  summary: 'The Baroque keyboard player\'s chord chart: numbers under a bass line that say which intervals to play above it. How to read the figures, what the abbreviations mean, and why they survive in every Roman numeral today.',
  blocks: [
    p('In the Baroque era, roughly 1600 to 1750, almost every ensemble piece had a **basso continuo**: a bass line played by a cello or bassoon, with a harpsichord or organ filling in the harmony above it. The keyboard player was not given the chords written out. Instead, the composer wrote the bass line with small numbers beneath it — a **figured bass** — and the player improvised the upper parts from those numbers, a skill called **realisation**.'),
    p('If that sounds familiar, it should. A continuo player reading figures is doing almost exactly what a jazz pianist does when comping from chord symbols: turning a compact shorthand into living, voiced harmony on the spot. Bach was a celebrated continuo player and taught figured bass to his students. Today the figures survive in the inversion symbols of Roman numeral analysis — every I6 and V6/5 is a figured-bass figure — so understanding them is worthwhile even if you never play a harpsichord.'),

    h('Intervals above the bass'),
    p('The key idea is that figures are **intervals above the bass note**, not above the root of the chord. A 6 means "play a 6th above the bass"; a 4 means "a 4th above the bass". The intervals are counted within the key signature unless an accidental says otherwise, and octaves do not matter: a 3rd can be played as a 10th, and notes can be doubled freely. The figures tell you which pitch classes to play; how you voice them is up to you.'),
    p('When there is **no figure** at all, the default is 5/3 — a 5th and a 3rd above the bass. That is a root-position triad, the most common chord, so it is left unmarked to save writing.'),

    h('Triads: 5/3, 6 and 6/4'),
    p('A root-position triad has a 3rd and a 5th above its bass: **5/3**, usually left blank. A first-inversion triad, with its 3rd in the bass, has a 3rd and a 6th above the bass — E–G–C over E is a 3rd and a 6th — so its full figure is 6/3, shortened to **6**. A second-inversion triad, with its 5th in the bass, has a 4th and a 6th above — G–C–E over G — written **6/4**.'),
    p('The shortening follows a simple logic: write only what distinguishes the chord. A 3rd is assumed unless something else is shown, so 6/3 becomes 6. The 6/4 has to show both numbers, because a 4 is unusual.'),

    h('Seventh chords: 7, 6/5, 4/3, 4/2'),
    p('Seventh chords have four notes and therefore three inversions, and their figures follow the same logic. In root position, a 7th, 5th and 3rd sit above the bass: **7** (short for 7/5/3). In first inversion — G7 with B in the bass — the notes above B are D (a 3rd), F (a 5th) and G (a 6th), and the figure keeps the two that define this inversion: **6/5**. Second inversion, with D in the bass, gives **4/3** (from 6/4/3). Third inversion, with the 7th in the bass, gives **4/2** (from 6/4/2), often shortened to just **2**.'),
    p('A useful observation: in each abbreviation, the figure keeps the numbers that include the **dissonance** — the 2nd between the chord\'s 7th and its root. In 6/5 the 5th and 6th above the bass are a step apart; in 4/3 the 3rd and 4th; in 4/2 the bass itself and the 2nd. That clash is what makes each inversion recognisable.'),
    table(['Figure', 'Meaning', 'G / G7 in C'], [
      ['5/3 (none)', 'triad, root position', 'G'],
      ['6', 'triad, 1st inversion', 'G/B'],
      ['6/4', 'triad, 2nd inversion', 'G/D'],
      ['7', '7th chord, root position', 'G7'],
      ['6/5', '7th chord, 1st inversion', 'G7/B'],
      ['4/3', '7th chord, 2nd inversion', 'G7/D'],
      ['4/2 (2)', '7th chord, 3rd inversion', 'G7/F'],
    ]),
    example('G7 with B in the bass', [
      'B is the 3rd of G7, so this is first inversion.',
      'Above B: D (a 3rd), F (a 5th), G (a 6th). The figure keeps the intervals that define the inversion: 6/5.',
      'So G7/B = V6/5 — the leading tone in the bass, rising to C.',
    ], { voicings: [['B2', 'D4', 'F4', 'G4'], ['C3', 'C4', 'E4', 'G4']], beat: 1.3 }),

    h('Accidentals'),
    p('An accidental placed next to a number alters that interval above the bass: ♯6 means a raised 6th, ♭7 a lowered 7th. An accidental **on its own**, with no number, applies to the **3rd** above the bass. A slash through a number, or a small cross, also means "raise this interval". These alterations are especially common in minor keys, where the leading tone is not in the key signature.'),
    example('Read a lone ♯ over E in A minor', [
      'No number means 5/3: a 3rd and a 5th above E — G and B, from the key signature.',
      'The lone ♯ applies to the 3rd: G becomes G♯.',
      'So the chord is E G♯ B, E major: the V chord of A minor, with its raised leading tone.',
    ], { prog: ['Am', 'E', 'Am'], key: 'Am', beats: 2 }),
    p('A lone ♯ (or ♮) over the final bass note of a minor-key piece calls for a major tonic chord — the **Picardy third**, the bright major ending that so many Baroque minor-key works close with.'),

    h('Realising a bass'),
    p('To realise a figured bass, work through it note by note: find the intervals the figures ask for, build the chord above the bass, and then connect each chord to the next with the voice-leading habits from the previous lesson — common tones held, other voices moving by step, no parallel 5ths or octaves.'),
    example('Realise a short figured bass in C', [
      'Bass and figures: C (blank) – D (6) – E (6) – F (blank) – G (7) – C (blank).',
      'Translate: C = C E G. D with 6 = D F B (vii°6). E with 6 = E G C (I6). F = F A C. G with 7 = G B D F (V7). C = C E G.',
      'In Roman numerals: I – vii°6 – I6 – IV – V7 – I. The bass climbs by step while the harmony moves from tonic, through dominant colour, to the predominant, the dominant and home.',
    ], { prog: ['C', 'Bdim/D', 'C/E', 'F', 'G7', 'C'], key: 'C', beats: 2 }),
    p('Bach\'s Prelude in C major from Book I of *The Well-Tempered Clavier* is figured-bass thinking made visible. Each bar is one chord, broken into a repeating pattern. In block form, the first four bars are a perfect little progression over a bass that holds C for two bars and then steps down to B before returning: I – ii4/2 – V6/5 – I.'),
    {
      t: 'staff',
      chords: [
        { notes: ['C3', 'E3', 'G3', 'C4', 'E4'], label: 'I' },
        { notes: ['C3', 'D3', 'A3', 'D4', 'F4'], label: 'ii4/2' },
        { notes: ['B2', 'D3', 'G3', 'D4', 'F4'], label: 'V6/5' },
        { notes: ['C3', 'E3', 'G3', 'C4', 'E4'], label: 'I' },
      ],
      caption: 'The Well-Tempered Clavier, Book I, Prelude in C, bars 1–4 (block form).',
    },
    listen([
      { label: 'Prelude in C, bars 1–4', music: { voicings: [['C3', 'E3', 'G3', 'C4', 'E4'], ['C3', 'D3', 'A3', 'D4', 'F4'], ['B2', 'D3', 'G3', 'D4', 'F4'], ['C3', 'E3', 'G3', 'C4', 'E4']], beat: 1.3 }, note: 'one chord per bar, in block form' },
    ]),
    onRecord('Listen to a Bach cantata or sonata and focus on the continuo — the harpsichord or organ under the melody instruments. What you hear is someone\'s improvised realisation of a figured bass, and no two performances realise it in quite the same way.'),
    ear('When you hear a bass line, ask what intervals sit above it rather than what the chord\'s root is. A bass note with a 6th above it (and no 5th) is the 3rd of a chord in first inversion; a bass note that sounds like it wants to fall by step, with a 2nd rubbing above it, is probably the 7th of a chord in third inversion — a 4/2.'),
    tryIt('Take the figured bass C – D(6) – E(6) – F – G(7) – C and play it, building each chord from the intervals above the bass. Then voice it in four parts, checking the voice leading. Afterwards, write the same progression as slash chords — C, B°/D, C/E, F, G7, C — and notice that a lead sheet says exactly the same thing in different notation.'),
    recap([
      'Figured bass is a bass line with numbers showing the intervals to play above it; players improvised the upper parts.',
      'Figures are intervals above the bass, within the key signature; octaves and doublings are free. No figure means 5/3.',
      'Triads: blank (root position), 6 (first inversion), 6/4 (second). Sevenths: 7, 6/5, 4/3, 4/2.',
      'An accidental beside a number alters that interval; on its own it alters the 3rd.',
      'Roman-numeral inversions (I6, V6/5) and slash chords (G7/B) carry the same information today.',
    ]),
    drill('bach.figured'),
  ],
  drills: ['bach.figured', 'bach.analysis'],
};
