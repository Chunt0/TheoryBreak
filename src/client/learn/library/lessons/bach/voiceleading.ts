import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const voiceleading: Lesson = {
  id: 'bach.voiceleading',
  title: 'Four-part voice leading',
  tags: ['bach'],
  level: 1,
  summary: 'The chorale texture: four independent lines that make good chords at every step. Ranges and spacing, which notes to double, how to move from chord to chord, and why the same rules turn up in jazz voicings.',
  blocks: [
    p('Bach harmonised hundreds of Lutheran hymn tunes — chorales — for his church cantatas and Passions, and after his death a collection of them was published as four-part chorales for students to study. They have been the standard training ground for harmony ever since. In a chorale, four voices — **soprano, alto, tenor and bass** — move together, one chord per beat, and each voice is a melody in its own right. The art lies in making the chords sound good and the lines move well at the same time.'),
    p('The conventions of four-part writing are often presented as rules, but each one has a reason, and most of them are simply the principles of two-voice counterpoint applied to more voices. This lesson explains them, and shows why they matter well beyond Bach.'),

    h('Four voices'),
    p('Each voice has a comfortable range, based on the human voices it was written for: roughly **soprano** C4–G5, **alto** G3–C5, **tenor** C3–G4 and **bass** E2–C4. Staying within these ranges keeps every line singable and keeps the texture balanced.'),
    p('**Spacing** matters too. The three upper voices should each stay within an octave of their neighbour — soprano to alto, alto to tenor — so that they blend into a single texture. The gap between tenor and bass can be wider, which mirrors the natural spacing of the harmonic series: wide intervals at the bottom, closer ones above. Voices should not cross (the alto going above the soprano, say), because that confuses which line is which.'),
    p('The **outer voices**, soprano and bass, are the most audible. Together they form the frame of the music — effectively a two-part counterpoint — and the inner voices fill in the harmony. Good chorale writing starts with a strong soprano–bass pair, usually moving in contrary motion.'),

    h('Doubling'),
    p('A triad has three notes and there are four voices, so one note has to be **doubled**. The usual choices follow from what each note does.'),
    p('- In a **root-position** chord, double the **root**. It is the most stable note and the safest to have twice.\n- **Never double the leading tone.** It has a strong tendency to rise to the tonic; two voices with that tendency would both rise, producing parallel octaves — or one would have to go somewhere unnatural.\n- **Never double a chordal 7th**, for the same reason: it has to resolve down, and two voices resolving down together make parallel octaves.\n- In **first inversion**, double whichever stable note gives the smoothest voice leading — often the soprano note or the bass — but still not the leading tone.'),
    p('Sometimes a chord is **incomplete**. After a V7, the tonic chord often has a tripled root and no 5th, because the voice leading into it demands it. Leaving out the 5th is fine; the 5th is the least important note of the chord.'),

    h('Moving from chord to chord'),
    p('The core habits of good voice leading are about economy.'),
    p('1. **Keep common tones** in the same voice. If two chords share a note, the voice that has it usually holds it.\n2. **Move the other voices by the shortest route**, usually a step. Inner voices in particular should move as little as possible.\n3. **Let the bass leap.** The bass often moves by 4ths and 5ths, from root to root; the upper voices compensate by moving smoothly.\n4. **Prefer contrary motion between the outer voices**, and especially when the bass moves by step.\n5. **Avoid parallel 5ths and octaves** between any two voices — the voices would fuse, as the previous lesson explained.'),
    example('Connect I – IV – V – I in C', [
      'I: bass C3, tenor G3, alto E4, soprano C5 (root doubled). To IV: the soprano holds C (a common tone), alto and tenor step up to F and A, and the bass falls to F2 — F A F C.',
      'IV to V is the danger spot: the bass steps up F → G, so the upper voices move down against it — A → G, F → D, C → B — and no pair of voices moves in parallel 5ths or octaves.',
      'V to I: the leading tone B rises to C in the soprano, D rises to E, the tenor holds G, and the bass leaps up a 4th to C. A complete C major chord.',
    ], { voicings: [['C3', 'G3', 'E4', 'C5'], ['F2', 'A3', 'F4', 'C5'], ['G2', 'G3', 'D4', 'B4'], ['C3', 'G3', 'E4', 'C5']], beat: 1.2 }),

    h('Tendency tones'),
    p('Two notes have strong tendencies that four-part writing respects. The **leading tone** rises to the tonic, especially in the soprano, where its resolution is clearly heard. (In an inner voice, Bach often lets it drop to the 5th of the tonic chord instead, so that the final chord is complete — a recognised exception.) The **chordal 7th** resolves down by step: in V7 to I, the 7th of G7, F, falls to E.'),
    {
      t: 'staff',
      chords: [
        { notes: ['G2', 'B3', 'D4', 'F4'], label: 'V7' },
        { notes: ['C3', 'C4', 'C4', 'E4'], label: 'I' },
      ],
      caption: 'V7 → I: B → C, F → E, D → C (a tripled root and no 5th).',
    },
    table(['Rule', 'Why'], [
      ['No parallel 5ths / octaves', 'the two voices fuse'],
      ['Leading tone rises to the tonic (outer voices)', 'the strongest melodic tendency'],
      ['Chordal 7th resolves down by step', 'a dissonance resolves downward'],
      ['Don\'t double the leading tone', 'two tendencies → parallel octaves'],
      ['Upper voices within an octave of each other', 'blend (bass–tenor may be wider)'],
      ['Hold common tones; move others by step', 'smoothness'],
      ['Prefer contrary motion in the outer voices', 'independence'],
    ]),
    example('Check V7 → I in G major', [
      'V7 = D F♯ A C. The leading tone is F♯; the chordal 7th is C.',
      'F♯ must rise to G (always in the soprano; an inner voice may drop to D). C must fall to B, the 3rd of I.',
      'Then scan every pair of voices for 5ths or octaves in both chords — moving from a 5th to a 5th, or an octave to an octave, in the same direction is out.',
    ], { voicings: [['D3', 'C4', 'F#4', 'A4'], ['G2', 'B3', 'G4', 'G4']], beat: 1.3 }),

    h('The same rules in jazz clothes'),
    p('These habits are not just Baroque etiquette. They describe how smooth harmony works in any style. In a jazz ii–V–I, the guide-tone motion — the 7th of each chord falling by step to the 3rd of the next — is exactly the resolution of the chordal 7th. The 3rd of G7 rising to the root of Cmaj7, or holding as its major 7th, is the leading tone doing its job. Rootless voicings that move by step while the bass leaps are four-part voice leading with tensions added. Learning to write a clean chorale is one of the best ways to learn to voice chords well on any instrument.'),
    onRecord('Follow one inner voice — the alto or the tenor — through a Bach chorale. You will hear a line that moves mostly by step, holds common tones and rarely draws attention to itself, yet is a real melody. Then listen to how the bass moves, often in contrary motion to the soprano.'),
    ear('In four-part music, try listening to the bass and soprano as a pair: they should sound like two independent melodies, often moving in opposite directions. Then try to pick out an inner voice — harder, but the best training for hearing harmony as moving lines.'),
    tryIt('Play the I – IV – V – I example slowly and sing or hum each voice in turn while you play. Then write the same progression in G major, starting with the soprano on G, and check every pair of voices for parallel 5ths and octaves.'),
    recap([
      'Chorale texture: soprano, alto, tenor and bass, each a melody, together making a chord on every beat.',
      'Keep voices in range, upper voices within an octave of each other, and avoid crossing.',
      'Double the root in root position; never double the leading tone or a chordal 7th.',
      'Hold common tones, move other voices by step, let the bass leap, prefer contrary outer voices, avoid parallel 5ths and octaves.',
      'The leading tone rises and the chordal 7th falls — the same motion as jazz guide tones.',
    ]),
    drill('bach.vl'),
  ],
  drills: ['bach.vl', 'bach.figured'],
};
