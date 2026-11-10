import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const fugue: Lesson = {
  id: 'bach.fugue',
  title: 'Fugue anatomy',
  tags: ['bach'],
  level: 3,
  summary: 'How a fugue works: a subject introduced in each voice in turn, real and tonal answers, the countersubject, episodes and middle entries, and the devices — stretto, pedal point, inversion — that drive it to its close.',
  blocks: [
    p('The **fugue** is where counterpoint reaches its summit, and Bach is its greatest master. His *Well-Tempered Clavier* contains forty-eight preludes and fugues, two in every major and minor key across its two books; *The Art of Fugue*, left unfinished at his death, explores a single theme through a series of ever more elaborate fugues. A fugue can sound dauntingly complex, but it is built from a few clear procedures, and once you know them you can follow even a dense four-voice fugue as it unfolds.'),
    p('A fugue is not really a fixed form, like a sonata or a 12-bar blues. It is better thought of as a **procedure**: a way of building a piece from one theme passed between several independent voices. The details vary enormously from fugue to fugue, but the ingredients are always the same.'),

    h('The exposition'),
    p('A fugue begins with its theme, the **subject**, played alone in a single voice. Then a second voice enters with the subject transposed to the dominant — this is called the **answer** — while the first voice continues with a counter-melody against it. Then a third voice enters, with the subject back in the tonic; then a fourth, if there is one, with the answer again. Each entry piles another independent line on top of the texture. When every voice has entered, the **exposition** is complete.'),
    p('Most fugues have three or four voices, though two and five are possible. The order of entries varies — the subject might begin in the alto, then the soprano answer, then the bass — but the alternation of subject (tonic) and answer (dominant) is constant.'),

    h('Real and tonal answers'),
    p('The answer is the subject transposed up a 5th (or down a 4th). If it is transposed exactly, it is a **real answer**. But exact transposition can cause a problem. If the subject leaps from the tonic up to the dominant — C up to G — a real answer would leap from G up to D, and that D pulls the music towards the key of G before the exposition has properly established C.'),
    p('So Bach often adjusts the answer: wherever the subject has the tonic, the answer has the dominant, and wherever the subject has the dominant, the answer has the tonic. The opening leap from C to G is answered by a leap from G to C — a 4th instead of a 5th. This adjusted version is called a **tonal answer**, and spotting where the answer differs from the subject is one of the pleasures of following a fugue closely.'),
    listen([
      { label: 'Subject', music: { notes: ['C4', 'G4', 'E4', 'F4', 'D4', 'C4'], beat: 0.32 }, note: 'opens with a leap from tonic to dominant' },
      { label: 'Real answer', music: { notes: ['G4', 'D5', 'B4', 'C5', 'A4', 'G4'], beat: 0.32 }, note: 'transposed exactly: the D leans towards G major' },
      { label: 'Tonal answer', music: { notes: ['G4', 'C5', 'B4', 'C5', 'A4', 'G4'], beat: 0.32 }, note: 'the leap adjusted: G to C' },
    ]),
    example('Tonal answer to C – G – E – F – D – C', [
      'The subject leaps from the tonic C to the dominant G.',
      'A real answer would transpose it up a 5th: G – D – B – C – A – G. The D pulls towards the key of G.',
      'A tonal answer swaps tonic and dominant at the start — G – C – B – C – A – G — so the music stays in C.',
    ], { notes: ['G4', 'C5', 'B4', 'C5', 'A4', 'G4'], beat: 0.32 }),

    h('The countersubject'),
    p('When the second voice enters with the answer, the first voice continues with a counter-melody. If that counter-melody comes back every time the subject or answer appears, it is called a **countersubject**. A good countersubject contrasts with the subject — moving when the subject holds, holding when the subject moves, rising where the subject falls — so that the two lines are easy to tell apart. And it is written in **invertible counterpoint**, so it can appear above or below the subject and still sound right. Some fugues have two countersubjects, which multiplies the possible combinations.'),

    h('Episodes and middle entries'),
    p('After the exposition, a fugue alternates two kinds of passage. **Episodes** are passages without a complete statement of the subject. They are usually built from fragments of the subject or countersubject, worked through **sequences**, and they often modulate. **Middle entries** are statements of the subject, often in new keys — the relative major or minor, the dominant, the subdominant — sometimes in several voices in turn.'),
    p('This is the same plan as the two-part invention, now with more voices: episodes carry the music from key to key, and entries of the subject mark the arrivals. Eventually the subject returns in the home key, and the fugue moves towards its close.'),

    h('Driving to the end'),
    p('Fugues often save their most intense devices for the later stages.'),
    p('- **Stretto**: entries of the subject overlap, a second voice starting before the first has finished. Because the subject is now heard on top of itself, stretto builds intensity, and it often appears near the end.\n- **Inversion, augmentation and diminution**: the subject turned upside down, slowed down or sped up.\n- **Pedal point**: a long sustained note in the bass, usually the dominant, under which the upper voices continue. A dominant pedal near the end creates a great build-up of tension; a tonic pedal at the very end confirms the arrival.\n- **A final entry in the bass**: the subject heard one last time in the lowest voice, with the full weight of the texture above it.'),
    table(['Term', 'Meaning'], [
      ['Subject', 'the main theme, stated alone at the start'],
      ['Answer', 'the subject at the dominant — real (exact) or tonal (adjusted)'],
      ['Countersubject', 'a recurring counter-melody in invertible counterpoint'],
      ['Exposition', 'every voice enters with the subject or answer'],
      ['Episode', 'a sequential, often modulating passage built from motifs'],
      ['Stretto', 'overlapping entries of the subject'],
      ['Pedal point', 'a sustained bass note (often the dominant) near the end'],
    ]),
    example('Map a three-voice exposition', [
      'Entry 1: the alto states the subject in C. Nothing else is playing.',
      'Entry 2: the soprano enters with the answer in G (perhaps tonal). The alto continues with the countersubject beneath it.',
      'Entry 3: the bass enters with the subject in C. The soprano now plays the countersubject, the alto a free line. Every voice has entered — the exposition is over, and an episode begins.',
    ]),
    onRecord('The C minor fugue from Book I of *The Well-Tempered Clavier* is a perfect place to start: three voices, a clearly shaped subject, regular countersubjects and well-defined episodes. Bach\'s "Little" Fugue in G minor for organ is another, with four voices and a subject that is easy to follow every time it returns.'),
    ear('To follow a fugue, learn the subject first — sing it until you know it well. Then listen for every time it enters, and in which voice: high, middle or low. Between entries, notice the episodes, where fragments of the subject climb or fall in sequence. In a first listening, simply counting the entries in the exposition is a great achievement.'),
    tryIt('Play the subject C – G – E – F – D – C, then its tonal answer G – C – B – C – A – G a 5th higher, and compare it with the real answer. Then write a short subject of your own in C, starting with a leap from C to G, and work out its tonal answer. Finally, try playing the subject in one hand and the answer in the other, starting the answer when the subject finishes.'),
    recap([
      'A fugue is a procedure: one theme (the subject) introduced in each voice in turn and developed throughout.',
      'The exposition alternates subject (tonic) and answer (dominant) until every voice has entered.',
      'A real answer transposes exactly; a tonal answer swaps tonic and dominant notes to stay in the home key.',
      'The countersubject recurs against the subject in invertible counterpoint.',
      'Episodes (sequential, modulating) alternate with middle entries; stretto, pedal points and a final bass entry drive to the end.',
    ]),
    drill('bach.concepts', 3),
  ],
  drills: ['bach.concepts'],
};
