import type { Lesson } from '../../types';
import { drill, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const keys: Lesson = {
  id: 'core.keys',
  title: 'Key signatures & the circle of fifths',
  tags: ['core'],
  level: 1,
  summary: 'Why every key has its own set of sharps or flats, why they always arrive in the same order, and how the circle of fifths maps which keys are close and which are far apart.',
  blocks: [
    p('A **key** is a home base: one note that feels like the resting point (the **tonic**) and a family of seven notes arranged around it. The **key signature** at the start of each line of music is shorthand for that family — it lists which notes are sharpened or flattened throughout, so they do not have to be marked every time.'),
    p('Key signatures can look like arbitrary rules to memorise. They are not. Every one of them follows from a single scale pattern, they grow one accidental at a time in a fixed order, and laid out in a circle they form a map of how keys relate. The same map turns out to describe how chords move, which is why it keeps coming back throughout this library.'),

    h('Why keys need sharps and flats'),
    p('A major scale has a fixed pattern of whole steps (W) and half steps (H): W W H W W W H. Starting on C, the white keys happen to fit that pattern exactly — C D E F G A B C — so C major needs no sharps or flats.'),
    p('Start the same pattern anywhere else and some notes have to be adjusted to keep it. Build a major scale on G: G A B C D E… and then the pattern needs a whole step from E to the 7th note and a half step from there up to G. F is a half step above E, which is wrong, so it has to become **F♯**. That single sharp is the signature of G major. Every key signature exists for the same reason: it is the set of adjustments that makes the major-scale pattern fit on that tonic.'),

    h('One accidental at a time'),
    p('Something neat happens when you move from one key to the key a perfect 5th higher: you keep six of the seven notes and change exactly one. C major to G major changes F to F♯. G major to D major keeps the F♯ and changes C to C♯. D major to A major adds G♯, and so on. Each step up a 5th adds one sharp, and each new sharp is itself a 5th above the previous one.'),
    p('The reason is that the 4th degree of the old key has to be raised to become the leading tone of the new one. In C major, F is the 4th; in G major, the note a half step below the tonic must be F♯. So the sharps arrive in the order **F♯ C♯ G♯ D♯ A♯ E♯ B♯**.'),
    p('Moving down a 5th works the other way round. From C to F, the old 7th (B) is lowered to B♭ to become the new 4th. From F to B♭, E is lowered to E♭, and so on. The flats arrive in the order **B♭ E♭ A♭ D♭ G♭ C♭ F♭** — which is simply the order of sharps read backwards. Many players remember the flats as "BEAD" followed by G, C, F.'),

    h('Reading a signature at a glance'),
    p('Two quick rules name any major key from its signature.'),
    p('- **Sharp keys:** the last sharp is the leading tone, so the tonic is a half step above it. F♯ C♯ G♯ → the last sharp is G♯ → **A major**.\n- **Flat keys:** the last flat is the 4th degree, so the tonic is the next-to-last flat. B♭ E♭ A♭ D♭ → the next-to-last is A♭ → **A♭ major**. The one exception is F major, with a single flat, which you simply learn.'),
    p('Every signature also belongs to a minor key. The **relative minor** uses exactly the same notes but treats a different one as home: its tonic is the 6th degree of the major scale, a minor 3rd below the major tonic. C major and A minor share no sharps or flats; E♭ major and C minor share three flats. Do not confuse this with the **parallel minor**, which shares the tonic but not the notes: C major and C minor are parallel keys, and C minor has three flats.'),
    table(['Signature', 'Major', 'Minor'], [
      ['none', 'C', 'A'],
      ['1♯', 'G', 'E'], ['2♯', 'D', 'B'], ['3♯', 'A', 'F♯'], ['4♯', 'E', 'C♯'], ['5♯', 'B', 'G♯'],
      ['1♭', 'F', 'D'], ['2♭', 'B♭', 'G'], ['3♭', 'E♭', 'C'], ['4♭', 'A♭', 'F'], ['5♭', 'D♭', 'B♭'],
      ['6♭ / 6♯', 'G♭ / F♯', 'E♭ / D♯'],
    ]),
    example('Name the key with four flats', [
      'The flats in order: B♭ E♭ A♭ D♭.',
      'The next-to-last is A♭, so the major key is **A♭ major**; its relative minor, a minor 3rd down, is **F minor**.',
      'To decide which, look in the music for E♮ — the raised 7th of F minor. Minor keys almost always give themselves away with an accidental on the leading tone.',
    ], { scale: 'major', from: 'Ab3', dir: 'up' }),
    example('Name the key with three sharps', [
      'The sharps in order: F♯ C♯ G♯. The last is G♯, so the tonic is a half step above: **A major**.',
      'Its relative minor is a minor 3rd below A: **F♯ minor**.',
      'If the music keeps writing E♯ — the leading tone of F♯ minor — and the bass ends on F♯, the piece is in F♯ minor.',
    ], { scale: 'major', from: 'A3', dir: 'up' }),

    h('The circle of fifths'),
    p('Lay the keys out in order of 5ths and something tidy happens: C, G, D, A, E, B, F♯… each one a 5th above the last, each one with one more sharp. Keep going and the sharps pile up until you reach keys that are easier to write in flats. F♯ major (six sharps) and G♭ major (six flats) are the same keys on the keyboard — **enharmonic** spellings of one key — and from G♭ the circle carries on through D♭, A♭, E♭, B♭ and F, shedding a flat each time, back to C. Twelve steps of a 5th visit all twelve keys and return home. That loop is the **circle of fifths**.'),
    p('The circle is a map of closeness. Neighbouring keys share six of their seven notes, so a piece can move between them smoothly; each step further round changes one more note, so a move feels more distant. From C, the closest keys are G and F (one accidental away) together with the three relative minors, A minor, E minor and D minor. These are called the **closely related keys**, and they are where pieces usually go when they modulate — a Bach invention in C major will typically visit G major and A minor before coming home. The key directly opposite C, F♯, is as far away as it is possible to go.'),

    h('The circle in motion'),
    p('The circle does not only describe keys; it describes how chords move. A root falling a 5th — going anticlockwise round the circle, C to F to B♭ — is the motion of V to I, the strongest and most goal-directed progression there is. A ii–V–I is two steps of it in a row: D to G to C.'),
    p('String several of those steps together and you get one of the most satisfying sounds in tonal music: a chain of chords each falling a 5th onto the next. Inside a single key the chain has to adjust one 5th to a tritone so that it stays in the key (F down to B), but it still sounds like an unbroken cycle. This is the harmonic engine of "Autumn Leaves", of countless Baroque sequences and of many turnarounds.'),
    {
      t: 'prog', key: 'C', tokens: ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am7'], beats: 4, bpm: 120, style: 'swing',
      caption: 'Round the circle inside one key: every root falls a diatonic 5th (the "Autumn Leaves" cycle).',
    },
    listen([
      { label: 'V → I', music: { prog: ['G7', 'C'], key: 'C', beats: 2 }, note: 'one step anticlockwise' },
      { label: 'ii – V – I', music: { prog: ['Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 2 }, note: 'two steps in a row' },
      { label: 'I → V', music: { prog: ['C', 'G'], key: 'C', beats: 2 }, note: 'clockwise: open, less final' },
    ]),
    p('Moving clockwise — up a 5th, C to G — is weaker and more open-ended; it sounds like leaving rather than arriving. That asymmetry, strong anticlockwise and gentle clockwise, is worth keeping in mind. The lesson on root motion picks it up in detail.'),

    tryIt('Open the Circle drill under Keys and walk round the wheel in 5ths with a drone on. At each stop, name the signature before you look: how many sharps or flats, and which ones. Then walk the other way, in 4ths, and notice how each step anticlockwise sounds like a little V–I.'),
    recap([
      'A key signature is the set of accidentals that makes the major-scale pattern (W W H W W W H) fit a given tonic.',
      'Each key a 5th up adds a sharp (F C G D A E B); each key a 5th down adds a flat (B E A D G C F).',
      'Sharp keys: tonic a half step above the last sharp. Flat keys: tonic = the next-to-last flat. F major has one flat.',
      'The relative minor shares the signature, its tonic a minor 3rd below; look for a raised leading tone to tell them apart.',
      'Neighbours on the circle share six notes; roots falling a 5th (anticlockwise) give the strongest progressions.',
    ]),
    drill('gym.keys7', 3),
  ],
  drills: ['gym.keys7'],
};
