import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const forms: Lesson = {
  id: 'jazz.forms',
  title: 'Song forms: AABA, ABAC, the blues',
  tags: ['jazz'],
  level: 1,
  summary: 'How standards are built from 8-bar sections, what a chorus and a bridge are, and how to keep your place in a tune without counting every bar.',
  blocks: [
    p('Before harmony and before improvisation, a jazz tune is a **shape**. Most standards are short — thirty-two bars or fewer — and a performance plays that short form over and over: the melody once or twice, then solo after solo over the same chords, then the melody again. If you know the shape, you always know where you are. You can feel the bridge coming, phrase your solo so it breathes with the sections, and come back in with the melody at exactly the right moment. If you do not know it, you are counting bars and hoping.'),
    p('Most of the repertoire uses a handful of forms. This lesson covers the common ones and the landmarks that help you hear them.'),

    h('Choruses, heads and solos'),
    p('One complete trip through the form is called a **chorus**. The melody is called the **head**. A typical small-group performance goes like this: an introduction (optional), the head, a series of solos — each soloist taking one or more choruses — sometimes a section where soloists trade short phrases with the drummer, then the head again, and an ending.'),
    p('The important thing is that the form never changes during all of this. A soloist\'s second chorus has exactly the same chords, in the same places, as the head. That is why knowing the form is so valuable: the chords of bar 17 are always the chords of bar 17, whoever is playing.'),

    h('AABA: the 32-bar song form'),
    p('The most common form in the standard repertoire is **AABA**: four sections of eight bars each. The first A states the main melody. The second A repeats it, often with a slightly different ending — the first A usually ends with a turnaround that leads back to the top, while the second ends firmly on the tonic so that something new can begin. Then comes the **bridge**, the B section, which offers contrast: a different melody, and usually a move away from the home key. The final A brings back the opening melody and rounds the chorus off.'),
    p('Bridges go to predictable places. Many move to the IV chord — the bridges of "Satin Doll" and "Take the A Train" both head there. The bridge of **rhythm changes**, the form of Gershwin\'s "I Got Rhythm" and hundreds of bebop tunes built on it, takes a different route: a chain of dominant 7th chords round the circle of fifths, two bars each, ending on the V7 that leads back into the last A.'),
    { t: 'prog', key: 'Bb', tokens: ['D7', 'D7', 'G7', 'G7', 'C7', 'C7', 'F7', 'F7'], beats: 4, bpm: 160, style: 'swing', caption: 'The rhythm-changes bridge: dominants round the circle, then back to the A.' },
    p('Whatever the route, the last bar or two of the bridge always prepares the return. When you hear the harmony winding up towards a dominant at the end of a contrasting section, the last A is about to begin.'),

    h('ABAC: two halves'),
    p('The other common 32-bar form is **ABAC**, which is better thought of as two 16-bar halves. Both halves begin the same way — that is the repeated A — but they end differently. The first half ends somewhere open, often on a half cadence or in another key; the second half ends with a strong cadence home. "All of Me", "Fly Me to the Moon" and "There Will Never Be Another You" are all built this way.'),
    p('ABAC has no bridge in the AABA sense, so it feels more continuous. The landmark to listen for is bar 17, where the opening melody returns and tells you that you are halfway through.'),
    p('Some tunes use other arrangements of 8-bar sections. "Autumn Leaves", for instance, is usually described as AABC: an A section played twice, then two different sections that bring the tune home.'),

    h('The blues'),
    p('The **12-bar blues** is the other great form of jazz, and it works differently. Instead of four 8-bar sections it has three 4-bar phrases. In its simplest version the first phrase sits on the I chord, the second moves to IV and back to I, and the third goes to V, then IV, then back to I. Jazz versions usually replace the last phrase with a ii–V–I and add passing chords throughout — the blues lesson goes into all of that.'),
    p('Because the form is so short, a blues goes round quickly, and soloists often play many choruses in a row. Charlie Parker\'s "Billie\'s Bounce" and "Now\'s the Time", Thelonious Monk\'s "Blue Monk" and "Straight, No Chaser" are all 12-bar blues heads.'),

    h('Other lengths'),
    p('Not everything fits these moulds. "Blue Bossa" and "Watermelon Man" are 16-bar forms. "Giant Steps" is 16 bars. "Footprints" is a 24-bar minor blues. Modal tunes often use the AABA layout but stay on one chord for long stretches: "So What" spends its A sections on D Dorian and its bridge a half step higher on E♭ Dorian, and "Maiden Voyage" is an AABA form built from sus chords. Whatever the length, the same principle applies: learn the sections and their landmarks, and count sections rather than bars.'),
    table(['Form', 'Shape', 'Examples'], [
      ['AABA', 'A twice, a contrasting bridge (B), A again', 'rhythm changes, "Satin Doll", "Take the A Train"'],
      ['ABAC', 'two halves that start alike and end differently', '"All of Me", "Fly Me to the Moon"'],
      ['12-bar blues', 'three 4-bar phrases: I, IV–I, V–IV–I (or ii–V–I)', '"Billie\'s Bounce", "Blue Monk"'],
      ['Other lengths', 'forms of their own', '"Blue Bossa" (16 bars), "Footprints" (24), "So What" (AABA of 8s)'],
    ]),

    h('Keeping your place'),
    p('Three habits make forms easy to follow.'),
    p('**Count sections, not bars.** Think "A1, A2, bridge, last A" rather than "bar 1 to bar 32". Eight bars is a natural phrase length, and after a little practice you will feel the end of each section coming without counting.'),
    p('**Listen for turnarounds.** The last two bars of most sections contain a turnaround — a short progression that leads back to the start of the next section. When you hear one, a new section is about to begin. If the turnaround ends on the dominant of a new key, the bridge is next.'),
    p('**Keep the melody in your head.** Experienced players hum the head silently while someone else solos. The melody carries the form with it, so if you know where you are in the tune, you know where you are in the chorus.'),
    example('Keep your place in an AABA chorus', [
      'Count sections, not bars: A1, A2, B, A3 — four 8-bar blocks.',
      'Listen for the turnaround in bars 7–8 of each A: it signals "A again" or "bridge next".',
      'After the bridge, the last A is your cue to finish your chorus or hand over to the next soloist.',
    ], { prog: ['Bbmaj7', 'G7', 'Cm7', 'F7'], key: 'Bb', beats: 2, style: 'swing' }),
    ear('The band tells you where the form is. Drummers mark section boundaries with fills and a cymbal crash on the first beat of the new section; bass players often walk up into the bridge; the whole band tends to build towards the last A. Once you start noticing these signals, you will hear the form even when nobody is playing the melody.'),
    onRecord('Pick a recording of a standard and follow one soloist through a chorus while humming the head under them. You will notice that good soloists phrase with the form — starting ideas at the top of a section, building through the bridge, resolving as the chorus ends.'),
    tryIt('Take a tune you know and write out its form as letters with the chords underneath, one 8-bar line per section. Then play the chords while singing the melody, and mark the turnarounds. Seeing the shape on one page makes it far easier to hold in your head.'),
    recap([
      'A chorus is one trip through the form; the head is the melody; solos repeat the same form.',
      'AABA: two A sections, a contrasting bridge (often to IV, or round the circle in rhythm changes), and a final A.',
      'ABAC: two 16-bar halves that start alike and end differently.',
      'The 12-bar blues is three 4-bar phrases; other tunes use 16, 24 or other lengths.',
      'Count sections, listen for turnarounds, and keep the melody in your head.',
    ]),
    drill('ear.prog.jazz', 3),
  ],
  drills: ['ear.prog.jazz', 'jazz.analysis'],
};
