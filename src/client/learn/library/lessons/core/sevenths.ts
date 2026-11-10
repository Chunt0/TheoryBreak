import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const sevenths: Lesson = {
  id: 'core.sevenths',
  title: 'Seventh chords: build, spell, hear',
  tags: ['core'],
  level: 1,
  summary: 'Add one more 3rd to a triad and you get the basic chord of jazz, soul and much of Bach. Five everyday types, how to spell them, and how to tell them apart.',
  blocks: [
    p('A triad sounds complete. Add one more 3rd on top and you get a **seventh chord**, and something changes: the chord gains a fourth colour and, often, a sense of direction. In jazz and soul the 7th chord is the default — a plain triad can sound almost bare by comparison — and in Bach the 7th is the dissonance that pushes harmony forward from one chord to the next.'),
    p('There are five seventh chords you will use constantly and a couple of rarer ones. This lesson shows how they are built from three simple choices, how to spell any of them on any root, and how to recognise each by ear.'),

    h('Three choices, stacked in 3rds'),
    p('A seventh chord is a root, 3rd, 5th and 7th, each a 3rd above the last. Like a triad, it is spelled with **one letter per chord tone**, skipping a letter each time: C E G B, D F A C, F♯ A C E. This rule is worth holding on to, because the spelling then always shows the structure. A chord written C E G C♭ is not wrong to the ear, but it hides the fact that the top note is a 7th.'),
    p('Every seventh chord comes from three choices: the **3rd** (major or minor), the **5th** (perfect, diminished or augmented) and the **7th** (major, minor or diminished). Most combinations are rare. Five of them do almost all the work.'),

    h('The five everyday types'),
    p('**Major 7th (maj7)** — a major triad with a major 7th: C E G B. The 7th sits a half step below the octave and gives the chord a soft, glowing shimmer. It is the sound of a jazz tonic and lives on I and IV of a major key.'),
    p('**Dominant 7th (7)** — a major triad with a minor 7th: C E G B♭. Its 3rd and 7th (E and B♭) form a tritone, and that tritone is the most important tension in tonal music: it wants to resolve, and it is what makes V7 lead so strongly to I. In blues and funk, though, the dominant 7th is also used as a *home* chord, enjoyed for its bluesy grit rather than resolved.'),
    p('**Minor 7th (m7)** — a minor triad with a minor 7th: C E♭ G B♭. Mellow and soft, with no tritone, so it is at rest. It lives on ii, iii and vi of a major key and is the chord of modal vamps.'),
    p('**Half-diminished (m7♭5, or ø7)** — a diminished triad with a minor 7th: C E♭ G♭ B♭. Think of it as a minor 7th chord whose 5th has been squeezed down a semitone, which makes it darker and more unsettled. It appears on vii of a major key and, more importantly, on ii of a minor key, where it starts the minor ii–V–i.'),
    p('**Diminished 7th (°7)** — a diminished triad with a diminished 7th: C E♭ G♭ B𝄫. It is three minor 3rds stacked evenly, which makes it perfectly symmetrical: the same shape repeats every three semitones, so there are only three different diminished 7th chords in total. It belongs on vii of harmonic minor and works as a passing chord between almost anything — Bach uses it for drama, gospel players to slide between chords.'),
    p('Two more turn up regularly. **Minor-major 7th**, m(maj7), is a minor triad with a major 7th (C E♭ G B): the dark, cinematic tonic of harmonic and melodic minor. **Major 7th ♯5**, maj7♯5, is an augmented triad with a major 7th (C E G♯ B): the bright, strange ♭III chord of minor keys.'),
    table(['Chord', 'Formula', 'On C', 'Lives on'], [
      ['maj7', 'R 3 5 7', 'C E G B', 'I and IV in major'],
      ['7 (dominant)', 'R 3 5 ♭7', 'C E G B♭', 'V — and every secondary dominant'],
      ['m7', 'R ♭3 5 ♭7', 'C E♭ G B♭', 'ii, iii, vi in major'],
      ['m7♭5 (ø7)', 'R ♭3 ♭5 ♭7', 'C E♭ G♭ B♭', 'vii in major, ii in minor'],
      ['°7', 'R ♭3 ♭5 𝄫7', 'C E♭ G♭ B𝄫', 'vii in harmonic minor; passing chords'],
      ['m(maj7)', 'R ♭3 5 7', 'C E♭ G B', 'the minor tonic of melodic and harmonic minor'],
      ['maj7♯5', 'R 3 ♯5 7', 'C E G♯ B', '♭III in minor (Lydian augmented)'],
    ]),
    listen([
      { label: 'Cmaj7', music: { chord: 'Cmaj7', arp: true }, note: 'glowing, at rest' },
      { label: 'C7', music: { chord: 'C7', arp: true }, note: 'bluesy, wants to move' },
      { label: 'Cm7', music: { chord: 'Cm7', arp: true }, note: 'mellow, at rest' },
      { label: 'Cm7♭5', music: { chord: 'Cm7b5', arp: true }, note: 'darker, unsettled' },
      { label: 'C°7', music: { chord: 'Cdim7', arp: true }, note: 'symmetrical, tense' },
      { label: 'Cm(maj7)', music: { chord: 'Cm(maj7)', arp: true }, note: 'dark and cinematic' },
    ]),

    h('Spelling them on any root'),
    p('The reliable method has two steps. First write the letters, skipping one each time, so you know what the four notes must be called. Then adjust each letter with sharps or flats to match the formula, measuring every note from the root. Because the letters are fixed first, you will sometimes need a double sharp or double flat — that is the system working correctly, not a mistake.'),
    example('Spell F♯7', [
      'Letters in 3rds from F: **F A C E**.',
      'A dominant 7th is a major triad plus a minor 7th. F♯ major is F♯ A♯ C♯, so the triad is F♯ A♯ C♯.',
      'A minor 7th above F♯ is E (a major 7th would be E♯). Answer: **F♯ A♯ C♯ E**.',
    ], { chord: 'F#7', arp: true }),
    example('Spell E♭m7♭5', [
      'Letters in 3rds from E: **E G B D**.',
      'Apply R ♭3 ♭5 ♭7 from E♭: a minor 3rd up is G♭, a diminished 5th up is B𝄫, a minor 7th up is D♭.',
      '**E♭ G♭ B𝄫 D♭**. The double flat is right: the 5th has to be some kind of B, and B𝄫 is the B six semitones above E♭. Writing A would make it a 4th.',
    ], { chord: 'Ebm7b5', arp: true }),
    example('Spell the diminished 7th on B', [
      'Letters in 3rds from B: **B D F A**.',
      'Three minor 3rds: B up to D, D up to F, F up to A♭.',
      '**B D F A♭** — the vii°7 of C minor. Not G♯: the letter rule says the 7th must be an A.',
    ], { chord: 'Bdim7', arp: true }),

    h('Hearing the difference'),
    p('Listen in layers rather than trying to recognise the whole chord at once. **First the 3rd**: is the chord bright or dark? That splits the five types into two groups — maj7 and dominant 7 on the bright side; m7, half-diminished and diminished on the dark side.'),
    p('**Then the 7th.** A major 7th sits a half step under the octave and rubs gently against it; you hear a shimmer. A minor 7th sits a whole step under the octave and sounds open and bluesy. Between the two bright chords, that is the whole difference: maj7 shimmers, dominant 7 has grit and wants to go somewhere.'),
    p('**Then the 5th**, for the dark chords. A plain minor 7th is mellow. Lower its 5th and it tightens into half-diminished, which sounds unresolved. Lower the 7th as well and you reach the fully diminished 7th, which is tense in a strange, balanced way — because it is symmetrical, it does not point to any one key and could resolve in several directions.'),
    p('Context helps too. The chords that contain a tritone — the dominant 7th, half-diminished and diminished 7th — sound like they are leading somewhere. The ones without — maj7 and m7 — sound like places to stay.'),

    h('Why the 7th matters'),
    p('In classical harmony the 7th is a dissonance, and dissonances resolve: the 7th of a chord moves down by step into the next chord. In G7 going to C, the F falls to E. Bach treats almost every 7th this way, and it is a large part of why his harmony feels so purposeful.'),
    p('Jazz relaxes the rule — Cmaj7 is a perfectly good final chord, and nobody expects its B to resolve — but the tendency is still there underneath. In a ii–V–I, the 7th of each chord falls by step to become the 3rd of the next: the C of Dm7 becomes the B of G7, and the F of G7 becomes the E of Cmaj7. Those falling lines, called **guide tones**, are the backbone of jazz voicing and improvisation, and they get a lesson of their own.'),
    p('Seventh chords can be inverted just like triads, and with four notes there are three inversions: the 3rd, the 5th or the 7th in the bass. In figured bass these are written 6/5, 4/3 and 4/2. The last one, with the 7th in the bass, is the most restless: the bass itself is the dissonance, so it usually steps down — V4/2 resolving to I6 is a standard Bach move.'),

    ear('Name the chord in three questions: bright or dark (the 3rd)? Shimmer or grit (the 7th)? And if it is dark, mellow or tight (the 5th)? Three yes-or-no answers get you to any of the five.'),
    tryIt('Play this chain on one root: Cmaj7 → C7 → Cm7 → Cm7♭5 → C°7. Each step lowers exactly one note by a semitone — first the 7th, then the 3rd, then the 5th, then the 7th again. Learning the five types as one family, a semitone apart, is far easier than learning them as five separate shapes. Then try the chain on F, B♭ and E♭.'),
    recap([
      'A seventh chord is a triad plus a 7th, spelled with one letter per chord tone (C E G B).',
      'The five everyday types: maj7 (R 3 5 7), dominant 7 (R 3 5 ♭7), m7 (R ♭3 5 ♭7), half-diminished (R ♭3 ♭5 ♭7) and diminished 7th (R ♭3 ♭5 𝄫7).',
      'Spell letters first, then adjust; double flats and sharps are sometimes required.',
      'Hear the 3rd (bright or dark), then the 7th (shimmer or grit), then the 5th (mellow or tight).',
      'Chords with a tritone — dominant, half-diminished, diminished — lead somewhere; maj7 and m7 can rest.',
    ]),
    drill('ear.chord.7'),
    drill('gym.spell.7'),
  ],
  drills: ['ear.chord.7', 'gym.spell.7', 'gym.play.7', 'ear.chord.inv'],
};
