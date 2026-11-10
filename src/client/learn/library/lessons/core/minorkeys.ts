import type { Lesson } from '../../types';
import { drill, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const minorkeys: Lesson = {
  id: 'core.minorkeys',
  title: 'The three minor scales',
  tags: ['core', 'jazz'],
  level: 2,
  summary: 'Natural, harmonic and melodic minor: why minor needs three versions of its scale, what the raised 7th does, and how real minor-key music mixes all three.',
  blocks: [
    p('Major has one scale. Minor has three. That can look like theory being difficult for the sake of it, but there is a simple story behind it: the darkest, most natural form of the minor scale has a weakness, and the other two forms are the two ways musicians fixed it. Once you understand the problem and the fixes, most minor-key harmony — in Bach, in jazz standards, in soul ballads — makes sense.'),

    h('Natural minor and its missing pull'),
    p('The **natural minor** scale is the one that shares its notes with the relative major. A minor uses the white keys from A to A: A B C D E F G. Measured from its own tonic, that is 1 2 ♭3 4 5 ♭6 ♭7 — compared with major, the 3rd, 6th and 7th are all lowered. It is also called the **Aeolian** mode, and it has a plaintive, serious sound.'),
    p('Its weakness is the 7th. In major, the 7th degree sits a half step below the tonic and pulls up into it — the leading tone. In natural minor the 7th (G in A minor) sits a whole step below, and a whole step does not pull nearly as hard. You can hear the consequence in the chords: the chord on degree 5 is E G B D, a **minor** v7, and v–i sounds soft and modal rather than final. There is no tritone in the dominant to resolve, and no leading tone to lift into the tonic.'),
    p('That softness is not always a problem. Plenty of rock, pop and R&B lives happily in natural minor, using chords like ♭VI, ♭VII and i. But for a strong cadence — the kind that ends a Bach chorale or sets up the head of a jazz tune — natural minor needs help.'),

    h('Harmonic minor: fixing the harmony'),
    p('The first fix is the obvious one: raise the 7th degree a half step. In A minor, G becomes G♯, giving A B C D E F G♯ — the **harmonic minor** scale, so called because it exists to fix the harmony. Now the chord on degree 5 is E G♯ B D, a real **dominant 7th**. Its 3rd and 7th, G♯ and D, form a tritone, and resolving that tritone inward to A and C gives minor keys the same decisive cadence that major keys have.'),
    p('The fix has a side effect. Between F and G♯ there is now a gap of three semitones — an augmented 2nd — and in a melody that gap has a striking, exotic sound that many listeners associate with flamenco or with music of the eastern Mediterranean. Sometimes that is exactly the colour you want. But composers writing smooth melodic lines often wanted to avoid it.'),
    example('Why V7 in minor needs the raised 7th', [
      'In A natural minor, v is E G B D. G sits a whole step under A, so nothing pulls hard to the tonic.',
      'Raise G to G♯: E G♯ B D, a dominant 7th whose tritone (G♯–D) resolves inward to A–C.',
      'That G♯ is not in the key signature, so it is written as an accidental every time it appears — which makes a raised 7th the quickest way to spot a minor key on the page.',
    ], { prog: ['Am7', 'Em7', 'Am7', 'E7', 'Am7'], key: 'Am', beats: 2 }),

    h('Melodic minor: smoothing the melody'),
    p('The second fix raises the 6th degree as well: A B C D E F♯ G♯. The awkward gap disappears and the top of the scale climbs smoothly by step into the tonic, with the leading tone intact. This is the **melodic minor** scale. Its formula, 1 2 ♭3 4 5 6 7, is simply a major scale with a lowered 3rd.'),
    p('In classical music, melodic minor is used going up and natural minor coming down. The logic is that a rising line needs the leading tone to push into the tonic, while a falling line does not — on the way down, the lowered ♭7 and ♭6 sink naturally towards the 5th and keep the minor colour. Bach\'s melodies switch between the forms constantly, sometimes within a single bar.'),
    p('Jazz musicians use the ascending form in both directions, often called **jazz melodic minor**. Its modes produce some of the most important sounds in modern jazz — the altered scale, Lydian dominant and others — and they have a lesson of their own later in this path.'),
    table(['Scale', 'Degrees', 'On A', 'Seventh chords'], [
      ['Natural', '1 2 ♭3 4 5 ♭6 ♭7', 'A B C D E F G', 'i7 iiø7 ♭IIImaj7 iv7 v7 ♭VImaj7 ♭VII7'],
      ['Harmonic', '1 2 ♭3 4 5 ♭6 7', 'A B C D E F G♯', 'i(maj7) iiø7 ♭III+maj7 iv7 V7 ♭VImaj7 vii°7'],
      ['Melodic', '1 2 ♭3 4 5 6 7', 'A B C D E F♯ G♯', 'i(maj7) ii7 ♭III+maj7 IV7 V7 viø7 viiø7'],
    ]),
    listen([
      { label: 'Natural', music: { scale: 'minor', from: 'A3' }, note: 'plaintive; G a whole step below A' },
      { label: 'Harmonic', music: { scale: 'harmonic_minor', from: 'A3' }, note: 'listen for the F – G♯ gap' },
      { label: 'Melodic', music: { scale: 'melodic_minor', from: 'A3' }, note: 'a smooth climb to the tonic' },
      { label: 'iv – v – i', music: { prog: ['Dm7', 'Em7', 'Am7'], key: 'Am', beats: 2 }, note: 'natural minor: a soft cadence' },
      { label: 'iv – V7 – i', music: { prog: ['Dm7', 'E7', 'Am7'], key: 'Am', beats: 2 }, note: 'harmonic minor: a real arrival' },
    ]),

    h('How real minor keys work'),
    p('No piece in a minor key uses just one of these scales. A minor key is better thought of as a pool of notes with two flexible degrees, the 6th and the 7th, each available in a lowered and a raised form. Musicians pick whichever version does the job at that moment.'),
    listen([
      { label: 'Up raised, down lowered', music: { notes: ['E4', 'F#4', 'G#4', 'A4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4'], beat: 0.32 }, note: 'F♯ and G♯ climb into A; G and F sink back to E' },
      { label: 'vii°7 – i', music: { prog: ['G#dim7', 'Am'], key: 'Am', beats: 2 }, note: 'the other harmonic-minor dominant: G♯ rises, F falls to E' },
    ]),
    p('The **harmony** takes its dominant chords, V7 and vii°7, from harmonic minor, because they need the leading tone. The **melody** tends to use the raised forms going up and the lowered forms coming down. And **jazz soloists** choose a scale per chord: Dorian or melodic minor on the tonic minor chord, Locrian ♮2 on the half-diminished ii, and the altered scale or Phrygian dominant on the V7.'),
    example('Spot the minor key in a chord chart', [
      'The chart reads Gm7 – Am7♭5 – D7 – Gm7.',
      'Am7♭5 – D7 is a half-diminished ii going to a dominant V: the minor ii–V. It points to **G minor**.',
      'D7 contains F♯, which is not in G minor\'s signature of two flats. That F♯ is the raised 7th — harmonic minor at work.',
    ], { prog: ['Gm7', 'Am7b5', 'D7', 'Gm7'], key: 'Gm', beats: 2 }),
    p('There is a fourth minor colour you will meet constantly: **Dorian**, which is natural minor with a raised 6th but a lowered 7th (A B C D E F♯ G). It has no leading tone either, so it is not used for cadences, but its bright 6th makes it the default sound of minor vamps in funk, soul and modal jazz. The modes lesson covers it alongside the others.'),

    tryIt('Over an A drone, play natural, harmonic and melodic minor in turn, and listen to how the top of each scale approaches the tonic. Then play iv – v – i and iv – V7 – i back to back. That single raised note, G to G♯, is the whole difference between a soft modal ending and a full cadence.'),
    recap([
      'Natural minor (1 2 ♭3 4 5 ♭6 ♭7) has no leading tone, so its v chord is minor and its cadence is weak.',
      'Harmonic minor raises the 7th: V becomes a dominant 7th with a tritone to resolve, at the cost of an augmented 2nd between ♭6 and 7.',
      'Melodic minor raises the 6th too, smoothing the line; classical music uses it going up, jazz in both directions.',
      'Real minor keys mix all three: the 6th and 7th degrees each come in two forms, chosen by the job at hand.',
      'An accidental raised 7th in the music is the quickest sign that a piece is in a minor key.',
    ]),
    drill('gym.keys7.harm', 3),
  ],
  drills: ['gym.keys7.harm', 'gym.keys7.mel', 'ear.degree.minor'],
};
