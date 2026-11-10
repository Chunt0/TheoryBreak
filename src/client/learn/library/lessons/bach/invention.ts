import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const invention: Lesson = {
  id: 'bach.invention',
  title: 'The two-part invention',
  tags: ['bach'],
  level: 2,
  summary: 'One motive, two hands: how Bach builds a complete piece from a few notes through imitation, inversion, fragmentation and sequence, with a trip to related keys and back.',
  blocks: [
    p('Bach wrote his fifteen **Two-Part Inventions** as teaching pieces. In his preface to the fair copy, dated 1723, he says they are meant to teach keyboard players to play two voices cleanly, to have good musical ideas — *inventiones* — and to develop them well, and to acquire a singing style of playing. They do all three, and more. Each invention is a complete piece built almost entirely from one short idea, and studying how Bach does it is one of the best lessons in composition there is.'),
    p('This lesson looks at the techniques Bach uses to develop a motive, the tonal plan that gives an invention its shape, and the sequence that drives it from one key to another.'),

    h('Two voices, one idea'),
    p('An invention has two voices, one for each hand, and they are **equal partners**. Neither is simply melody or accompaniment; each takes turns presenting the main idea and supporting the other. The main idea is a **motive** — a short, distinctive figure, often only a bar or less — and nearly everything in the piece is derived from it.'),
    p('The motive of Invention No. 1 in C major is a famous example: after a 16th rest, four notes rising by step (C D E F), then a little turn back (D E C), then a leap up to G. It is so compact that it fits in half a bar, yet the whole piece grows out of it.'),
    listen([
      { label: 'Motive', music: { notes: ['C4', 'D4', 'E4', 'F4', 'D4', 'E4', 'C4', 'G4'], at: [1, 2, 3, 4, 5, 6, 7, 8], len: [1, 1, 1, 1, 1, 1, 1, 2], bpm: 76 }, note: 'Invention No. 1: a 16th rest, seven 16ths, then the leap to G' },
      { label: 'Inverted', music: { notes: ['G4', 'F4', 'E4', 'D4', 'F4', 'E4', 'G4', 'C4'], at: [1, 2, 3, 4, 5, 6, 7, 8], len: [1, 1, 1, 1, 1, 1, 1, 2], bpm: 76 }, note: 'every step turned upside down' },
    ]),

    h('Developing a motive'),
    p('Bach transforms the motive in a handful of ways, and recognising them is the key to hearing an invention.'),
    p('- **Imitation.** One hand states the motive, and the other repeats it a little later, usually an octave or a 5th away — like a short canon. The opening of nearly every invention works this way.\n- **Inversion.** The motive is turned upside down: every rising step falls and every falling step rises. In Invention No. 1, the rising C D E F becomes a falling line.\n- **Fragmentation.** Only part of the motive is used — the first four notes, say — and repeated or developed on its own.\n- **Sequence.** A fragment is repeated at successively higher or lower pitch levels, as the previous lesson described.\n- **Augmentation.** The motive is played in longer note values, slowed down, often in the bass.'),
    table(['Technique', 'What happens to the motive', 'Effect'], [
      ['Imitation', 'repeated in the other voice, a little later', 'dialogue between the hands'],
      ['Inversion', 'turned upside down', 'familiar but new'],
      ['Fragmentation', 'only part of it is used', 'concentration, momentum'],
      ['Sequence', 'a fragment repeated at new pitch levels', 'motion towards a new key'],
      ['Augmentation', 'played in longer notes', 'weight, emphasis'],
    ]),

    h('The plan'),
    p('Underneath the constant activity, an invention has a clear tonal journey — the same basic plan you will meet in fugues and in much other Baroque music.'),
    table(['Section', 'What happens'], [
      ['Exposition', 'the motive in one hand, imitated an octave lower in the other'],
      ['Episode', 'sequences of the motive (fragmented, inverted) that modulate'],
      ['Middle entries', 'the motive in related keys: V, then vi in Invention No. 1'],
      ['Return', 'the motive back in the tonic, and a final cadence'],
    ]),
    p('In Invention No. 1, the first section establishes C major and moves to the dominant, ending with a cadence in **G major**. The middle section presents the motive in G and then moves on to **A minor**, the relative minor, closing with a cadence there. The final section works its way home through sequences and ends with the motive back in **C** and a final cadence. Home, a journey through closely related keys, home again: the whole piece fills just a page.'),
    example('Follow the plan of Invention No. 1', [
      'Opening: the motive in the right hand in C, imitated by the left hand an octave lower. Then sequences lead towards G major and a cadence there.',
      'Middle: the motive returns in G, often inverted, and further sequences carry the music to A minor, which gets its own cadence.',
      'End: sequences lead back towards C, the motive returns in the home key, and the piece closes with a final cadence.',
    ]),

    h('The sequence as engine'),
    p('The episodes that carry an invention from one key to the next are almost always **sequences**. Take a fragment of the motive, repeat it a step lower (or higher) each time over a bass moving in 5ths, and within a few beats you have reached a new key. Bach marks each arrival with a cadence and a fresh entry of the motive, so the listener always knows when the journey has reached its next station.'),
    example('Spin a sequence from the motive', [
      'Take its first four notes: C D E F.',
      'Start them again a step lower each time — C D E F, B C D E, A B C D, G A B C — over a bass falling in 5ths.',
      'Stop on the group that sits in the new key, cadence there, and enter the whole motive in that key.',
    ], { notes: ['C4', 'D4', 'E4', 'F4', 'B3', 'C4', 'D4', 'E4', 'A3', 'B3', 'C4', 'D4', 'G3', 'A3', 'B3', 'C4'], beat: 0.2 }),

    h('The other voice'),
    p('While one hand has the motive, the other is not idle. Often it plays a **counter-line**: a contrasting idea, sometimes in longer notes, that fits against the motive and recurs whenever the motive does. Because Bach writes in **invertible counterpoint**, the two lines can swap hands later in the piece — the motive moving to the bass and the counter-line to the treble — and still sound good. That interchange is one of the pleasures of listening closely: the same material keeps reappearing in new arrangements.'),
    onRecord('Listen to Invention No. 1 in C, then No. 4 in D minor and No. 8 in F major. Each has its own character, but in every one you can follow the motive as it passes between the hands, turns upside down, breaks into fragments and climbs or falls in sequence. Glenn Gould\'s 1964 recordings make the two voices unusually clear.'),
    ear('Listening to two-part counterpoint is a skill in itself. Try following just the left hand for a whole invention, then just the right. Then try to hear both at once, and notice when the motive moves from one hand to the other.'),
    tryIt('Write a mini-invention. Choose a motive of five to eight notes. State it in the right hand in C, then imitate it in the left hand an octave lower while the right hand plays a simple counter-line. Spin a short sequence from the motive\'s first few notes, move to G major and cadence there. Finally, bring the motive back in C and end with a cadence.'),
    recap([
      'Bach\'s Two-Part Inventions (preface dated 1723) teach clean two-voice playing, good ideas and how to develop them.',
      'Each is built from a single short motive shared equally between the hands.',
      'The motive is developed by imitation, inversion, fragmentation, sequence and augmentation.',
      'The plan: exposition in the tonic, sequential episodes, middle entries in related keys (V, vi), return home.',
      'Invertible counterpoint lets the motive and its counter-line swap hands.',
    ]),
    drill('bach.concepts', 3),
  ],
  drills: ['bach.concepts', 'bach.analysis', 'ear.prog.bach'],
};
