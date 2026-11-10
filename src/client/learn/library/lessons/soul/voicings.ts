import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const soulVoicings: Lesson = {
  id: 'soul.voicings',
  title: 'Neo-soul voicings',
  tags: ['soul', 'jazz'],
  level: 2,
  summary: 'Seconds tucked inside the chord, stacked 4ths, triads over shells and minor clusters: how neo-soul and R&B keyboard players build their voicings in two layers, and how they move them.',
  blocks: [
    p('A neo-soul chord progression on paper — Dm9, G13, Cmaj9 — looks just like a jazz progression. What makes it sound like neo-soul is largely the **voicings**: the way the notes are arranged on the keyboard. Neo-soul and modern R&B keyboard players favour closeness — notes packed together so that seconds rub gently inside the chord — over the even spacing of traditional voicings. Played on a Fender Rhodes, whose soft, bell-like tone flatters close intervals, these voicings give the style its warm, intimate, slightly smoky sound.'),
    p('This lesson shows how these voicings are built, in two layers, and how they move from chord to chord.'),

    h('Two layers'),
    p('Most neo-soul voicings split the job between the hands. The **left hand** lays a foundation that defines the chord and keeps the low register clear: usually the **root and 7th** (a shell), or a **10th** — the root with the 3rd an octave above. Both are open intervals that sound clean low on the keyboard.'),
    p('The **right hand** adds a compact **colour shape** in the middle register — a cluster, a triad or a stack of 4ths — containing the 3rd, the tensions and sometimes the 5th. Because the foundation already establishes the chord, the right hand is free to concentrate entirely on colour.'),

    h('Four colour shapes'),
    p('**The "mu" major.** A major triad with the 9th placed right next to the 3rd: C D E G. The whole step between D and E gives a soft, shimmering rub. This voicing is so associated with Steely Dan, who used it constantly, that it is often called the **mu chord**. Over a root and 7th in the left hand it becomes a lovely maj9.'),
    p('**Quartal.** Stacked perfect 4ths, often with a 3rd on top — the "So What" voicing from the modal jazz lesson. E A D G B over an E bass is a wide, airy Em11 with no obvious major or minor quality from the 4ths themselves. It is the classic sound of a Rhodes on a minor vamp.'),
    p('**Triad over shell.** An upper-structure triad above a dominant\'s 3rd and 7th. D F♯ A over C, E and B♭ adds the 9th, ♯11 and 13th: C13♯11. A clear, bright triad floating over a darker foundation, as the upper-structure lesson describes.'),
    p('**Minor cluster.** The ♭3, 11th and 5th bunched together over the root and ♭7: E♭ F G over C and B♭ gives Cm11. The whole step between E♭ and F and between F and G makes a dense, warm minor colour that is very characteristic of neo-soul.'),
    table(['Voicing', 'Example', 'Recipe'], [
      ['Mu major', 'C D E G', 'a triad with the 9th next to the 3rd (the Steely Dan chord)'],
      ['Quartal', 'E A D G B over E', 'three 4ths and a 3rd on top: Em11, the So What chord'],
      ['Triad over shell', 'D F♯ A over C E B♭', 'the triad adds 9 ♯11 13: C13♯11'],
      ['Minor cluster', 'E♭ F G over C B♭', '♭3 11 5 bunched over root and ♭7: Cm11'],
    ]),
    listen([
      { label: 'Mu major', music: { voicings: [['C3', 'C4', 'D4', 'E4', 'G4']], beat: 1.6 }, note: 'the 9th rubbing against the 3rd' },
      { label: 'Quartal Em11', music: { voicings: [['E2', 'E4', 'A4', 'D5', 'G5', 'B5']], beat: 1.6 }, note: 'wide and airy' },
      { label: 'C13♯11', music: { voicings: [['C2', 'E3', 'Bb3', 'D4', 'F#4', 'A4']], beat: 1.6 }, note: 'a triad over a shell' },
      { label: 'Cm11 cluster', music: { voicings: [['C2', 'Bb3', 'Eb4', 'F4', 'G4']], beat: 1.6 }, note: 'dense, warm minor' },
    ]),

    h('Seconds: soft and sharp'),
    p('The whole-step rub is the friendly kind of dissonance: soft, shimmering, never harsh. It is what makes these voicings sound rich rather than cluttered, and neo-soul players place whole steps inside their voicings deliberately.'),
    p('The **half step** is a different matter. A minor 2nd inside a voicing is sharp and tense. Used carefully — the major 7th rubbing against the root in a maj9 voicing, for instance, or the ♭9 of a dominant — it adds bite. Used carelessly, especially at the top of a voicing where it is most exposed, it sounds like a mistake. A good rule of thumb is to bury half steps in the middle of a voicing and keep them out of the top voice, and to avoid any half step that turns a tension into an avoid note.'),

    h('Moving voicings'),
    p('Neo-soul voicings usually move **by step and in parallel**. A cluster shape can be dragged down the scale chord by chord (planing), or the right hand can slide a half step while the left hand holds. The ear follows the top voice, so as the shapes move, treat the top note as a melody: aim for a line that steps smoothly rather than jumping around.'),
    { t: 'prog', key: 'C', tokens: ['Ebmaj9', 'Dm9', 'Dbmaj9', 'Cmaj9'], beats: 4, style: 'ballad', caption: 'Chromatic planing into I: maj9, m9, maj9, maj9, each a half step lower. Colour, not function.' },
    p('**Common tones** tie the movement together. When two chords share a note, keeping it in the same place in the voicing makes the change sound smooth and connected, even when the roots leap.'),
    example('Voice Dm9 – G13 – Cmaj9 neo-soul style', [
      'Left hand: root and 7th — D–C, G–F, C–B — while the roots fall in 5ths.',
      'Right hand: a three-note cluster with a 2nd inside: E F A (9, ♭3, 5), then E A B (13, 9, 3), then D E G (9, 3, 5).',
      'E holds through all three chords — the 9th of Dm9, the 13th of G13, the 3rd of Cmaj9 — and A holds from the first into the second. The roots leap in 5ths underneath, but the right hand barely moves: common tones tie the colours together.',
    ], { voicings: [['D2', 'C3', 'E4', 'F4', 'A4'], ['G2', 'F3', 'E4', 'A4', 'B4'], ['C2', 'B2', 'D4', 'E4', 'G4']], beat: 1.4 }),
    example('Build a Cm11 cluster and move it to Fm11', [
      'Left hand C and B♭ (root and ♭7). Right hand E♭ F G (♭3, 11, 5): Cm11.',
      'Move to Fm11 in the same way: left hand F and E♭, right hand A♭ B♭ C.',
      'The right-hand shape is identical, just transposed to the new root (here down a 5th, to stay in the same register); the whole-step rubs come along with it.',
    ], { voicings: [['C2', 'Bb3', 'Eb4', 'F4', 'G4'], ['F2', 'Eb3', 'Ab3', 'Bb3', 'C4']], beat: 1.5 }),

    h('Register and touch'),
    p('Close voicings depend on register. Clustered seconds that sound warm in the octave around middle C turn to mud an octave lower, which is why the left hand keeps to open intervals and the right hand keeps its clusters in the middle. Touch matters too: these voicings are usually played softly, with the notes slightly rolled or spread, and with a relaxed, behind-the-beat feel. On a Rhodes, a gentle attack lets the bell-like overtones bloom.'),
    onRecord('Steely Dan records are full of mu chords. For the neo-soul sound, listen to the Rhodes on D\'Angelo\'s and Erykah Badu\'s records and to Robert Glasper\'s playing: close clusters, quartal shapes and triads over shells, moving by step with the top note singing.'),
    ear('Close voicings have a distinctive shimmer: a soft rub inside the chord that makes it sound fuller than its notes suggest. If you hear that shimmer without any harshness, you are probably hearing a whole step tucked inside the voicing — the 9th next to the 3rd, or a minor cluster.'),
    tryIt('Play each of the four colour shapes over its left-hand foundation. Then voice Dm9 – G13 – Cmaj9 using the example voicings, and make up your own versions that keep a common tone and move the other voices by step. Finally, drag a mu-chord shape down the scale over a held C bass and listen to the colours change.'),
    recap([
      'Neo-soul voicings come in two layers: a left-hand foundation (root and 7th, or a 10th) and a right-hand colour shape.',
      'Four colour shapes: the mu major (C D E G), quartal stacks, triads over shells and minor clusters.',
      'Whole-step rubs sound soft and rich; half steps are sharper — bury them inside the voicing.',
      'Move voicings by step and in parallel, keep common tones, and treat the top note as a melody.',
      'Keep clusters in the middle register and play them softly.',
    ]),
    drill('gym.play.ext', 3),
  ],
  drills: ['gym.play.ext', 'ear.chord.ext', 'jazz.ust'],
};
