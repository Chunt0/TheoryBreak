import type { Lesson } from '../../types';
import { drill, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const cskey: Lesson = {
  id: 'core.cskey',
  title: 'Chord–scale outside the key',
  tags: ['core', 'jazz'],
  level: 2,
  summary: 'For a chord the key does not own — a secondary dominant, a borrowed chord — keep the chord\'s own tones and fill the gaps from the key around it. One method, and the right scale falls out.',
  blocks: [
    p('Inside a key, choosing a scale for a chord is easy: use the key\'s notes, starting from the chord\'s root. But real tunes do not stay inside the key. A chart in C major might contain A7, E7, Fm6 or B♭7 — chords with notes the key does not have. You could memorise a scale name for every possible case, but there is a better way: a single method that produces the right scale almost every time, and shows you why it is right.'),
    p('The idea is that a chord from outside the key is a **local event**. The key is still sounding around it; only the notes the chord actually changes are different. So the best scale keeps as much of the key as it can and changes only what the chord demands.'),

    h('The method'),
    p('A scale for a 7th chord has seven notes: the four chord tones (root, 3rd, 5th, 7th) and three notes in between them. Those in-between notes sit in three **slots**: the 9th between the root and the 3rd, the 11th between the 3rd and the 5th, and the 13th between the 5th and the 7th.'),
    p('1. **Write the chord tones.** These are fixed by the chord symbol.\n2. **Fill each slot from the key.** For the 9th, the 11th and the 13th, use whichever version the surrounding key contains — ♭9 or 9, 11 or ♯11, ♭13 or 13.\n3. **Check for avoid notes.** Any scale note a half step above a chord tone is a passing note, not a note to sustain.'),
    p('What falls out sounds "inside" — it agrees with everything around it — while the chord itself still provides the surprise. You can name the scale afterwards if you like, but the name matters less than the notes.'),

    h('Secondary dominants'),
    p('The most common chords from outside the key are **secondary dominants**: dominant 7th chords aimed at a chord other than the tonic. In C major there are five of them, one for each major or minor chord in the key. Run the method on each and a clear pattern appears.'),
    example('D7 → G7 in C major', [
      'Chord tones: D F♯ A C. The F♯ is the only note outside the key.',
      'Slots from C major: 9th = E, 11th = G, 13th = B.',
      'D E F♯ G A B C = **D Mixolydian**. Every tension is natural, because D7 is heading for a major chord.',
    ], { scale: 'mixolydian', from: 'D3', drone: true }),
    example('A7 → Dm7 in C major', [
      'Chord tones: A C♯ E G.',
      'Slots from C major: 9th = B (natural 9), 11th = D, 13th = F (♭13).',
      'A B C♯ D E F G = **A Mixolydian ♭6**, the 5th mode of D melodic minor. D is the avoid note (a half step above C♯); F, the ♭13, is the colour that points at D minor.',
    ], { scale: 'mixolydian_b6', from: 'A3', drone: true }),
    example('E7 → Am7 in C major', [
      'Chord tones: E G♯ B D.',
      'Slots from C major: 9th = F (♭9), 11th = A, 13th = C (♭13).',
      'E F G♯ A B C D = **E Phrygian dominant**, the 5th mode of A harmonic minor — with a ♭9 and ♭13 already built in.',
    ], { scale: 'phrygian_dominant', from: 'E3', drone: true }),
    table(['In C major', 'Chord tones', 'Key fills the slots', 'Scale'], [
      ['C7 (V7/IV)', 'C E G B♭', 'D F A', 'Mixolydian'],
      ['D7 (V7/V)', 'D F♯ A C', 'E G B', 'Mixolydian'],
      ['A7 (V7/ii)', 'A C♯ E G', 'B D F', 'Mixolydian ♭6'],
      ['E7 (V7/vi)', 'E G♯ B D', 'F A C', 'Phrygian dominant'],
      ['B7 (V7/iii)', 'B D♯ F♯ A', 'C E G', 'Phrygian dominant'],
    ]),
    p('The pattern is worth understanding rather than memorising. A dominant aimed at a **major** chord keeps its tensions natural and comes out as Mixolydian. A dominant aimed at a **minor** chord picks up a ♭13 from the key — and a ♭9 too, when the key has one — and comes out as Mixolydian ♭6 or Phrygian dominant. That is not a coincidence. The target chord\'s notes all belong to the key, so the notes the method borrows from the key are notes of the target chord. A7\'s ♭13, F, is the 3rd of the Dm7 it resolves to; E7\'s ♭9 and ♭13, F and C, are the 6th and 3rd of A minor. The scale is quietly anticipating where the chord is going.'),
    listen([
      { label: 'D7: Mixolydian', music: { scale: 'mixolydian', from: 'D3', drone: true }, note: 'natural tensions, major target' },
      { label: 'A7: Mixolydian ♭6', music: { scale: 'mixolydian_b6', from: 'A3', drone: true }, note: 'a ♭13 pointing at Dm' },
      { label: 'E7: Phrygian dominant', music: { scale: 'phrygian_dominant', from: 'E3', drone: true }, note: '♭9 and ♭13 pointing at Am' },
    ]),

    h('Finding the avoid notes'),
    p('With the scale in hand, check each note against the chord tone a half step below it. On a dominant 7th chord, only one note usually fails: the **11th**, which sits a half step above the 3rd and buries it. The ♭9 and ♭13 also sit a half step above chord tones (the root and the 5th), but on a dominant those rubs are the whole point — they are the tension that makes the chord pull — so they are treated as colours rather than avoid notes.'),
    p('On a **sus** chord the situation flips. A 7sus4 has the 4th as a chord tone instead of the 3rd, so the 4th is safe to sustain and the 3rd becomes the note to pass through.'),

    h('Borrowed chords'),
    p('Some chords come not from a secondary key but from the **parallel minor**: in C major, Fm7 (iv), A♭maj7 (♭VI) and B♭7 (♭VII7) are all borrowed from C minor. For these, fill the slots from the key the chord is borrowed from — C minor — because the chord is a moment where the music darkens towards that key.'),
    p('- **Fm7** filled from C minor: 9th = G, 11th = B♭, 13th = D. That is **F Dorian**.\n- **A♭maj7** filled from C minor: 9th = B♭, ♯11 = D, 13th = F. That is **A♭ Lydian**, the bright, wide-open sound of a borrowed ♭VI.\n- **B♭7** (the backdoor dominant) filled from C minor gives B♭ Mixolydian. Many players instead keep C major\'s E for the 11th slot, giving **B♭ Lydian dominant**: the ♯11 avoids the clash with the 3rd, and the E is the 3rd of the Cmaj7 the chord is about to resolve to. Both sounds are common.'),
    example('Fm6 in a C major ballad', [
      'Chord tones: F A♭ C D (a minor triad with a 6th).',
      'Borrowed from C minor, but the D is the 6th and the music returns to C major, so most players use **F melodic minor**: F G A♭ B♭ C D E.',
      'Its E is a nice touch — the leading tone of F, and also the 3rd of the C chord coming next. This is the classic "minor iv" sound of a ballad\'s last bars.',
    ], { prog: ['Cmaj7', 'Fmaj7', 'Fm6', 'Cmaj7'], key: 'C', beats: 2, style: 'ballad' }),

    h('Where the method stops'),
    p('A few chords are too chromatic for the key to fill in usefully, and for those a fixed scale is simpler. The **tritone substitute** (D♭7 for G7 in C) normally takes Lydian dominant. **Diminished 7th** chords take the whole–half diminished scale. And the **half-diminished ii of a minor key** prefers Locrian ♮2 to the key\'s own Locrian, because the natural 9th sounds better than the ♭9. Those cases are covered in the lessons on substitution, symmetric scales and melodic-minor harmony.'),
    tryIt('On the Scales drill, Chord → scale asks you for the scale of a chord in context and Over the chord has you play it with the chord held underneath; avoid notes show up dashed. Work through the secondary dominants of C major with the method before you answer, then check whether your filled-in scale matches.'),
    recap([
      'A chord from outside the key is a local event: keep the key, change only what the chord changes.',
      'Write the chord tones, fill the 9th, 11th and 13th slots from the key, then mark avoid notes.',
      'Secondary dominants to major chords come out Mixolydian; to minor chords, Mixolydian ♭6 or Phrygian dominant.',
      'On dominants only the 11th is avoided; the ♭9 and ♭13 rubs are the point. On sus chords the 3rd becomes the passing note.',
      'Borrowed chords fill from the key they are borrowed from: Fm7 → F Dorian, A♭maj7 → A♭ Lydian.',
    ]),
    drill('jazz.chordscale'),
  ],
  drills: ['jazz.chordscale'],
};
