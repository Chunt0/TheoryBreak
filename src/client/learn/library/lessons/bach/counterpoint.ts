import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const counterpoint: Lesson = {
  id: 'bach.counterpoint',
  title: 'Counterpoint & suspensions',
  tags: ['bach'],
  level: 2,
  summary: 'How counterpoint brings dissonance in under control: passing and neighbour notes on weak beats, the suspension on strong beats, the other common figures, and invertible counterpoint — lines that work either way up.',
  blocks: [
    p('First-species counterpoint keeps dissonance out entirely. Real music — Bach\'s above all — is full of it. What makes Bach\'s dissonances sound purposeful rather than accidental is **control**: each one appears in a recognisable way, at a particular kind of moment, and resolves in a predictable direction. Once you know the handful of patterns involved, you can hear and write dissonance that sounds expressive rather than wrong.'),
    p('This lesson covers those patterns, with special attention to the most expressive of them, the **suspension**, and then looks at the technique that lets two lines swap places: invertible counterpoint.'),

    h('Dissonance on weak beats'),
    p('The simplest way to bring in a dissonance is to put it on a **weak** beat or part of a beat, and to approach and leave it by step. The ear accepts it as a moment of motion between two consonances rather than as a clash.'),
    p('A **passing tone** fills the gap between two notes a 3rd apart: over a held C, an upper voice moving E – F – G passes through F, which is a dissonant 4th against the bass, but it is on a weak beat and moving by step, so it sounds like a smooth connection. A **neighbour tone** steps away from a note and back: E – F – E over C. Both are everywhere in Bach\'s inner voices and bass lines, giving them their flowing, continuous motion.'),

    h('Dissonance on strong beats: the suspension'),
    p('A dissonance on a **strong** beat is much more noticeable, and counterpoint admits it mainly in one carefully controlled form: the **suspension**. A suspension happens in three stages.'),
    p('1. **Preparation.** A note sounds as a consonance, usually on a weak beat.\n2. **Suspension.** The other voice moves to a new note on the strong beat, but the first note is held over — tied — and now forms a dissonance against it.\n3. **Resolution.** The held note falls by step to a consonance, usually on the next weak beat.'),
    p('The key point is that the dissonant note does not move into the dissonance; it stays where it was, and the harmony moves away underneath it. The note is left behind, holding on to the previous chord for a moment too long, and then it gives way. That sense of lingering and release is why suspensions sound so expressive — a sigh, a moment of yearning — and why Bach uses them at so many of his cadences.'),
    {
      t: 'staff',
      chords: [
        { notes: ['C3', 'E4', 'G4', 'C5'], label: 'I' },
        { notes: ['G2', 'D4', 'G4', 'C5'], label: 'V 4' },
        { notes: ['G2', 'D4', 'G4', 'B4'], label: '3' },
      ],
      caption: '4–3 suspension: C prepared, held over the G bass, resolving to B.',
    },
    listen([
      { label: '4–3 suspension', music: { voicings: [['C3', 'E4', 'G4', 'C5'], ['G2', 'D4', 'G4', 'C5'], ['G2', 'D4', 'G4', 'B4'], ['C3', 'E4', 'G4', 'C5']], beat: 1.1 }, note: 'C held over the G bass, then falling to B' },
    ]),
    p('Suspensions are named by the two intervals, above the bass, of the dissonance and its resolution. A **4–3** suspension has a 4th above the bass falling to a 3rd; a **7–6** has a 7th falling to a 6th; a **9–8** a 9th falling to an octave. When the bass itself is the suspended voice, the naming still counts the interval from the bass up: the held bass sits a 2nd below an upper note, then falls a step so that the interval opens to a 3rd — a **2–3** suspension. It is the one common suspension that resolves by the interval getting larger.'),
    table(['Suspension', 'Voice', 'Resolution'], [
      ['4–3', 'upper', 'the 4th above the bass falls to the 3rd'],
      ['7–6', 'upper', 'the 7th falls to the 6th (often chained over a falling bass)'],
      ['9–8', 'upper', 'the 9th falls to the octave'],
      ['2–3', 'bass', 'the held bass falls, making a 3rd'],
    ]),
    example('A chain of 7–6 suspensions', [
      'Over a bass falling by step (C B A G), an upper voice a 6th above would run A G F E.',
      'Delay it: each note is tied over the next bass note and becomes a 7th on the beat — a dissonance…',
      '…that falls a step to the 6th. 7–6, 7–6, 7–6: a favourite chain of Corelli and Handel as well as Bach.',
    ], { voicings: [['C3', 'A4'], ['B2', 'A4'], ['B2', 'G4'], ['A2', 'G4'], ['A2', 'F4'], ['G2', 'F4'], ['G2', 'E4']], beat: 0.6 }),

    h('Other dissonant figures'),
    p('A few more patterns complete the picture. An **anticipation** sounds a note of the next chord early, on a weak beat, so that it arrives before the harmony does — common in the soprano at cadences, where the tonic note appears just before the tonic chord. (Funk\'s rhythmic anticipations, accenting the "a" before an empty beat, are the same idea in rhythm.) An **appoggiatura** leaps to a dissonance on a strong beat and resolves by step, a more intense, emphatic gesture than the suspension. An **escape tone** steps away from a chord tone and leaps to the next.'),
    table(['Figure', 'Approached', 'Left', 'Beat'], [
      ['Passing tone', 'by step', 'by step, same direction', 'weak'],
      ['Neighbour tone', 'by step', 'by step, back again', 'weak'],
      ['Suspension', 'held over (prepared)', 'down by step', 'strong'],
      ['Anticipation', 'by step', 'held into the next chord', 'weak'],
      ['Appoggiatura', 'by leap', 'by step', 'strong'],
    ]),
    p('Learning to recognise these figures transforms how you read Bach. A passage that seems thick with clashing notes usually turns out to be simple harmony decorated with passing tones, neighbours and suspensions, each one handled exactly as the table describes.'),

    h('Invertible counterpoint'),
    p('Bach\'s two-part inventions and fugues often present a pair of lines, then later present them again with the upper and lower voices swapped. For that to work, the counterpoint has to be **invertible**: it must sound good either way up.'),
    p('When two voices swap at the octave, every interval between them inverts, and the inversion rule from the intervals lesson applies: a 3rd becomes a 6th, a 6th becomes a 3rd, an octave becomes a unison. Those all remain consonant. But a **5th becomes a 4th**, and a 4th above the bass is a dissonance. So in invertible counterpoint, 5ths have to be treated with care — placed on weak beats or approached and left like dissonances — because in the inverted version they will be 4ths. Suspensions change shape too when the voices swap, so a composer writing invertible lines plans every dissonance with both versions in mind.'),
    example('Invert a two-voice pair', [
      'Upper voice E – F – G over lower voice C – D – E: intervals 3, 3, 3 — parallel 3rds.',
      'Swap them at the octave (move the lower voice up an octave): now C – D – E sits above E – F – G, and the intervals become 6, 6, 6.',
      'Both versions are consonant. A pair built on 5ths would not survive: each 5th would turn into a 4th over the bass.',
    ], { voicings: [['C3', 'E3'], ['D3', 'F3'], ['E3', 'G3'], ['E3', 'C4'], ['F3', 'D4'], ['G3', 'E4']], beat: 0.7 }),
    onRecord('Listen to the endings of phrases in a Bach chorale: many contain a 4–3 suspension in an inner voice, a moment of friction just before the cadence chord settles. In the inventions and fugues, listen for a pair of lines that returns later with top and bottom swapped — invertible counterpoint at work.'),
    p('Jazz knows the suspension well. A **7sus4 resolving to 7** — G7sus4 to G7 — is exactly a 4–3 suspension over a dominant bass. A 13sus4 vamp in modal jazz is the same dissonance held indefinitely and never resolved, which is part of why it sounds so suspended.'),
    ear('A suspension sounds like one voice lagging behind the harmony: the chord changes, one note clings on and clashes, then falls a step and the chord is complete. Listen for that clash on the strong beat and the small fall that resolves it.'),
    tryIt('Play the 4–3 suspension slowly: C major, then hold the top C while the bass moves to G, then let C fall to B. Then play the 7–6 chain over a falling bass. Finally, take any two-voice phrase in parallel 3rds, swap the voices at the octave, and check that every interval is still consonant.'),
    recap([
      'Counterpoint admits dissonance under control: on weak beats as passing and neighbour tones, on strong beats mainly as suspensions.',
      'A suspension is prepared as a consonance, held over as the harmony moves (dissonant), and resolved down by step.',
      'Suspensions are named by intervals above the bass: 4–3, 7–6, 9–8, and 2–3 in the bass.',
      'Anticipations, appoggiaturas and escape tones complete the set of common dissonant figures.',
      'Invertible counterpoint works either way up; 3rds and 6ths swap safely, but 5ths become dissonant 4ths.',
    ]),
    drill('bach.concepts', 3),
  ],
  drills: ['bach.concepts', 'bach.vl'],
};
