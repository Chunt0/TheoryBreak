import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const neo: Lesson = {
  id: 'soul.neo',
  title: 'Neo-soul & R&B harmony',
  tags: ['soul'],
  level: 2,
  summary: 'Jazz chords used for colour rather than cadence: diatonic planing, soft dominants, coloured secondary dominants, borrowed warmth, chromatic inner voices — and the laid-back feel that holds it together.',
  blocks: [
    p('In the late 1990s, a group of artists including D\'Angelo, Erykah Badu, Maxwell and Lauryn Hill, along with producers such as J Dilla, created a sound that came to be called **neo-soul**. It drew on 1970s soul, jazz and hip-hop, and its harmony is distinctive: rich jazz chords — maj9, m9, m11, 13sus4 — used not to drive towards cadences, as in bebop, but as **colours** that float, slide and shimmer. That approach has shaped a great deal of R&B since, and musicians such as Robert Glasper have carried it back into jazz.'),
    p('This lesson looks at the main harmonic habits of neo-soul and R&B, and at how they differ from the jazz harmony they borrow from.'),

    h('Colour, not function'),
    p('In a bebop tune, a Dm9 – G13 – Cmaj9 is a cadence: each chord does a job and the progression drives towards the tonic. Neo-soul uses the same chord types but often lets go of the jobs. Chords move by step, in parallel, or back and forth between two colours, and the music feels suspended rather than goal-directed. The pleasure is in the sound of each chord and the smoothness of the movement between them.'),
    p('That does not mean function disappears. Most neo-soul progressions still have a sense of home and still use secondary dominants and ii–Vs. But cadences are softened, delayed or avoided, and colour takes priority over pull.'),

    h('Diatonic planing'),
    p('One of the most characteristic neo-soul moves is to take a single rich voicing and slide it **step by step down the scale**, so that every chord keeps a similar shape and the same extended colour. Moving down from IV in C: **Fmaj9 – Em9 – Dm9 – Cmaj9**. The result is a smooth, cascading sequence of lush chords with no cadence at all, each one simply a new shade of the same sound.'),
    p('Notice one small cheat. Strictly inside C major, the 9th of the chord on E would be F, giving a harsh Em7♭9. R&B players almost always play a plain Em9 there instead, borrowing F♯ for a moment, because a consistent warm colour matters more to the style than staying strictly inside the key. Planing is about the sound of the shape.'),
    { t: 'prog', key: 'C', tokens: ['IVmaj9', 'iii9', 'ii9', 'Imaj9'], style: 'ballad', beats: 4, caption: 'Planing down the scale: Fmaj9 – Em9 – Dm9 – Cmaj9' },

    h('Soft dominants'),
    p('A plain V7 — G7 in C, with its insistent leading tone — can sound too hymn-like or too strong for neo-soul. Instead, dominants are softened. The most common replacement is **IV over V** (F/G), the gospel 9sus4: it has the dominant\'s root and ♭7 but no 3rd, so it leads home gently. **13sus4** chords do the same with even more colour. When a real dominant does appear, it is often **altered** (with ♭9 or ♯9) for a darker, more complex colour, or replaced by a **backdoor ♭VII9** or a **tritone sub**.'),
    { t: 'prog', key: 'C', tokens: ['Cmaj9', 'Am9', 'Dm9', 'F/G'], style: 'ballad', beats: 4, caption: 'A soul turnaround with IV/V as the dominant' },
    example('Why F/G works as a dominant in C', [
      'Spell it: G in the bass, F A C above.',
      'Against G: F = ♭7, A = 9, C = 11 (the sus 4th). That is G9sus4, or G11. There is no B, so no leading tone.',
      'It still pulls to C — the bass falls a 5th and F falls to E — just more softly: the gospel and R&B dominant.',
    ], { prog: ['Dm9', 'F/G', 'Cmaj9'], key: 'C', beats: 4, style: 'ballad' }),

    h('Coloured secondary dominants'),
    p('Secondary dominants are everywhere in R&B, often with altered tensions for extra colour. The most famous example is the progression of Grover Washington Jr. and Bill Withers\'s "Just the Two of Us", which has been borrowed by countless songs since. In A♭ major it runs **D♭maj7 – C7 – Fm7 – E♭m7 A♭7**, and then repeats.'),
    p('Each chord has a clear role. D♭maj7 is IVmaj7. C7 is III7, the secondary dominant of Fm7 (V7/vi), and it usually carries altered colour — a ♯9 or ♭13. Fm7 is the vi chord, the relative minor, which is where the progression feels most at home. Then E♭m7 – A♭7 is a ii–V aimed back at D♭: the A♭7 is the tonic chord turned into a dominant. The loop never settles on a plain I chord, which is why it can cycle forever.'),
    { t: 'prog', key: 'Ab', tokens: ['IVmaj7', 'III7', 'vi7', 'v7', 'I7'], beats: [4, 4, 4, 2, 2], style: 'ballad', bpm: 92, caption: '"Just the Two of Us": D♭maj7 – C7 – Fm7 – E♭m7 A♭7' },
    example('Analyse the "Just the Two of Us" loop', [
      'D♭maj7 is IV in A♭. C7 is V7/vi — its E♮ is a leading tone to F.',
      'Fm7 is vi, the relative minor: the loop\'s real centre of gravity.',
      'E♭m7 – A♭7 is a ii–V to D♭, so the loop returns to its start. The I chord only ever appears as A♭7, a dominant pointing at IV.',
    ], { prog: ['Dbmaj7', 'C7b9', 'Fm7', 'Ebm7', 'Ab7', 'Dbmaj7'], key: 'Ab', beats: [4, 4, 4, 2, 2, 4], style: 'ballad' }),

    h('Borrowed warmth and chromatic inner voices'),
    p('Neo-soul and R&B borrow freely from the parallel minor for warmth: the **minor iv** (Fm9 in C), the **backdoor** ♭VII9 – I, and ♭VI and ♭III major 7ths. The backdoor and modal-interchange lesson covers these in detail; in R&B they often appear as a single inner voice changing — the A of Fmaj9 sliding down to A♭ to make Fm9 — rather than as a whole new chord.'),
    p('That idea of **chromatic inner-voice motion** runs through the style. Within a held chord, one voice moves by half steps — the 5th rising to ♯5 and 6, or the root falling through the major 7th and ♭7 — so the chord seems to change colour from within. It is a gentle, almost liquid kind of movement that suits the style perfectly.'),
    listen([
      { label: 'Fmaj9 → Fm9 → Cmaj9', music: { prog: ['Fmaj9', 'Fm9', 'Cmaj9'], key: 'C', beats: 3, style: 'ballad' }, note: 'one inner voice: A → A♭ → G' },
      { label: 'Dm9 → D♭9 → Cmaj9', music: { prog: ['Dm9', 'Db9', 'Cmaj9'], key: 'C', beats: 3, style: 'ballad' }, note: 'a tritone sub sliding home' },
    ]),
    table(['Habit', 'In C', 'Effect'], [
      ['Diatonic planing', 'Fmaj9 – Em9 – Dm9 – Cmaj9', 'one shape sliding through the key'],
      ['IV/V or 9sus4 for V7', 'F/G → C', 'a soft, open dominant'],
      ['Coloured secondary dominant', 'E7♯9 → Am9', 'an altered push into the relative minor'],
      ['Minor iv / backdoor', 'Fm9 → C, B♭9 → C', 'borrowed warmth'],
      ['Chromatic inner voice', 'Fmaj9 → Fm9', 'colour changing from inside the chord'],
    ]),

    h('The feel'),
    p('No discussion of neo-soul harmony is complete without its rhythm. The style favours **swung 16ths**, a laid-back placement slightly behind the beat, and loose, human timing — J Dilla\'s deliberately unquantised drum programming, with its "drunk" feel, was hugely influential. Rich chords played with stiff, on-the-grid timing sound like a jazz exercise; the same chords played lazily and behind the beat sound like neo-soul. The harmony and the feel are two halves of one sound.'),
    onRecord('D\'Angelo\'s *Voodoo* and Erykah Badu\'s early albums are the classic neo-soul records. Listen for lush m9 and maj9 chords moving by step, dominants that never quite cadence, and keyboards and drums sitting just behind the beat.'),
    ear('Neo-soul harmony sounds lush but unhurried: chords glide rather than push. When you hear a rich chord shape sliding stepwise down the scale, or a dominant that resolves with no leading tone, you are hearing the neo-soul habits at work.'),
    tryIt('Play Fmaj9 – Em9 – Dm9 – Cmaj9 with one right-hand shape moved down the scale, over a left-hand root. Then loop D♭maj7 – C7 – Fm7 – E♭m7 A♭7, using an altered C7 (with a ♯9 or ♭13), and play it slowly and slightly behind the beat.'),
    recap([
      'Neo-soul uses jazz chords (maj9, m9, m11, 13sus4) as colour rather than as cadence-driving functions.',
      'Diatonic planing slides one voicing through the key: Fmaj9 – Em9 – Dm9 – Cmaj9.',
      'Dominants are softened: IV/V, 9sus4, 13sus4, or altered, backdoor and tritone-sub dominants.',
      '"Just the Two of Us" (IVmaj7 – III7 – vi7 – v7 I7) loops on secondary dominants and never settles on a plain I.',
      'Borrowed chords, chromatic inner voices and a laid-back, swung feel complete the sound.',
    ]),
    drill('ear.prog.soul', 3),
  ],
  drills: ['ear.prog.soul', 'soul.analysis', 'ear.chord.ext'],
};
