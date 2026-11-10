import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const clave: Lesson = {
  id: 'rhythm.clave',
  title: 'Clave & timelines',
  tags: ['rhythm', 'funk'],
  level: 2,
  summary: 'A timeline is a fixed rhythmic key that every part relates to. The son, rumba and bossa claves, the 3-2 and 2-3 directions, and the tresillo that runs from Cuba through New Orleans into funk and modern pop.',
  blocks: [
    p('In many African and Afro-diasporic musical traditions, a groove is organised around a **timeline**: a short, asymmetrical rhythmic pattern that repeats throughout a piece and serves as the reference point for everything else. Every other part — bass, piano, horns, melody, dance — is shaped in relation to it. In Afro-Cuban music the timeline is called the **clave** (from the pair of wooden sticks that often play it), and musicians speak of a part being "in clave" or "against the clave" as seriously as a jazz musician speaks of right and wrong notes.'),
    p('Clave and its relatives are not just Latin-music specialities. The first half of the clave, the **tresillo**, is one of the most widespread rhythms in popular music — at the root of New Orleans R&B, funk bass lines, reggaeton and a great deal of contemporary pop. Understanding it explains a lot of syncopation you already know.'),

    h('The son clave'),
    p('The most common clave is the **son clave**, named after the Cuban son. It spans two bars of 4/4 — or one bar of fast 2/2, the way it is often felt — and has five strokes, divided unevenly between the two halves: **three strokes in one half and two in the other**.'),
    p('Counted in 16ths across one bar of 4/4 (with the beat at a moderate tempo), the three-stroke half falls on "1", the "a" of 1 and the "&" of 2. Those strokes are spaced 3 + 3 + 2 16ths apart — the tresillo. The two-stroke half falls on the "&" of 3 and on 4. Played in that order, three then two, it is called **3-2 clave**.'),
    { t: 'rhythm', onsets: [0, 3, 6, 10, 12], caption: 'Son clave 3-2', bpm: 96 },
    example('Count son clave 3-2 in 16ths', [
      'Steps 1, 4 and 7: "1 · · a · · & ·" — the tresillo side (3 + 3 + 2).',
      'Then steps 11 and 13: the "&" of 3 and beat 4 — the 2 side.',
      'Say it: "1 · · a · · & · · · & · 4 · · ·" while tapping the strokes.',
    ]),

    h('3-2 and 2-3'),
    p('The same pattern can start from either half. Begin with the two-stroke half and you have **2-3 clave**. The rhythm is identical as a repeating cycle; what changes is which half lines up with the start of the musical phrase. That matters a great deal in Afro-Cuban music: a melody or arrangement is written "in 3-2" or "in 2-3", and playing the clave the wrong way round makes everything sound subtly crossed, even to listeners who could not explain why. A song\'s phrasing — where its strong melodic accents fall — usually tells you which direction it is in.'),
    { t: 'rhythm', onsets: [2, 4, 8, 11, 14], caption: 'Son clave 2-3: the same cycle starting from the two-stroke side — the "&" of 1 and beat 2, then 3, the "a" of 3 and the "&" of 4.', bpm: 96 },

    h('Rumba and bossa clave'),
    p('Two close relatives differ by a single stroke. The **rumba clave** delays the third stroke of the three-side by one 16th, so the strokes fall on 1, the "a" of 1 and the "a" of 2 rather than the "&" of 2. That small shift makes the pattern more tense and off-balance; it is the timeline of Cuban rumba. The **bossa nova clave**, heard on the rim of the snare drum in bossa nova, instead delays the last stroke of the two-side, giving a lighter, more lilting cycle.'),
    { t: 'rhythm', onsets: [0, 3, 7, 10, 12], caption: 'Rumba clave 3-2', bpm: 96 },
    { t: 'rhythm', onsets: [0, 3, 6, 10, 13], caption: 'Bossa nova clave', bpm: 96 },
    table(['Timeline', 'Strokes (16ths, one bar)', 'Where you hear it'], [
      ['Son clave 3-2', '1 · · a · · & · · · & · 4 · · ·', 'son, salsa, Latin jazz'],
      ['Rumba clave 3-2', '1 · · a · · · a · · & · 4 · · ·', 'rumba, Afro-Cuban jazz'],
      ['Bossa clave', '1 · · a · · & · · · & · · e · ·', 'bossa nova, Brazilian jazz'],
      ['Tresillo', '1 · · a · · & ·', 'New Orleans R&B, funk, pop'],
    ]),

    h('The tresillo: 3 + 3 + 2'),
    p('The three-stroke half of the clave is a rhythm in its own right: the **tresillo**, eight 16ths divided 3 + 3 + 2. It is an ancient and widespread pattern, and it travelled from the Caribbean into New Orleans, where it became part of the city\'s piano style and its R&B. From there it fed into rock and roll, funk bass lines and, more recently, reggaeton and countless pop hits, which often build their entire groove on a repeated tresillo.'),
    p('The tresillo is a perfect example of syncopation over an even grid: eight equal 16ths grouped unequally, so that the second and third accents fall off the beat. Once you know its sound, you will hear it everywhere — in bass lines, in kick-drum patterns, in the rhythm of a synth riff.'),
    { t: 'rhythm', onsets: [0, 3, 6, 8, 11, 14], caption: 'Tresillo ×2 (3 + 3 + 2, twice)', bpm: 96 },

    h('Playing in clave'),
    p('In Afro-Cuban music, every part relates to the clave even when nobody is playing it. Bass lines often anticipate the beat in a pattern called the **tumbao**, landing just before beats 3 and 1. The piano plays syncopated **montuno** patterns whose accents are arranged to agree with the clave\'s direction. Melodies place their strongest accents on clave strokes. You do not need to master these styles to benefit from the idea: practise tapping the clave while a groove plays, and try phrasing melodies that begin on different strokes of it.'),
    onRecord('In salsa and Latin jazz recordings, listen for the clave itself — often played on wooden sticks or a woodblock — and notice how the bass and piano parts fit against it. In New Orleans R&B and funk, listen for the 3 + 3 + 2 tresillo in the bass and drums.'),
    ear('To find the clave direction, listen to where the melody\'s strongest accents fall. If the busier, three-stroke side of the rhythm lines up with the start of a phrase, the song is in 3-2; if the sparser two-stroke side does, it is in 2-3.'),
    tryIt('Tap son clave 3-2 while counting 16ths out loud, then 2-3, then rumba and bossa. Then tap the tresillo with one hand while the other keeps quarter notes, and feel how the 3 + 3 + 2 pulls against the even beat. The Rhythm drill under Ear has a Clave task for naming son, rumba, bossa and tresillo by ear.'),
    recap([
      'A timeline is a fixed, repeating rhythmic key that every other part relates to; in Afro-Cuban music it is the clave.',
      'Son clave has five strokes: a three-stroke side (the tresillo, 3 + 3 + 2) and a two-stroke side.',
      'It can run 3-2 or 2-3; the direction must match the music\'s phrasing.',
      'Rumba clave delays one stroke on the three-side; bossa clave delays the last stroke of the two-side.',
      'The tresillo alone runs through New Orleans R&B, funk bass lines and modern pop.',
    ]),
    drill('rhythm.clave', 3),
  ],
  drills: ['rhythm.clave', 'rhythm.tap.sync'],
};
