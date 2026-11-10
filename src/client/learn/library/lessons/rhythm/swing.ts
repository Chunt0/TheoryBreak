import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const swing: Lesson = {
  id: 'rhythm.swing',
  title: 'Swing feel',
  tags: ['rhythm', 'jazz'],
  level: 2,
  summary: 'Long–short 8th notes drawn from the triplet, the weight on beats 2 and 4, the ride-cymbal pattern, and where in the beat each player sits — plus the shuffle and swung 16ths.',
  blocks: [
    p('Swing is the rhythmic heart of jazz, and it is notoriously hard to write down. Jazz charts are written in ordinary 8th notes, but nobody plays them evenly. The 8ths are played **long–short**, the accents fall in unexpected places, and each player sits in a slightly different part of the beat. The result has a forward-moving, buoyant lilt that musicians recognise instantly — and that sounds stiff and wrong when it is missing. "It don\'t mean a thing if it ain\'t got that swing," as Duke Ellington\'s song title puts it.'),
    p('Swing is ultimately learned by listening and playing along with records. But understanding its ingredients makes the listening much more productive.'),

    h('Long–short: the triplet underneath'),
    p('The starting point is the triplet grid from the subdivision lesson. In swing, each beat is felt as three equal parts — "1 trip let" — and a pair of 8th notes takes the **first two thirds and the last third**: a long note on the beat and a short note just before the next beat. Played this way, "1 & 2 &" becomes "1 · let 2 · let": **long–short, long–short**.'),
    { t: 'rhythm', cells: ['111', '111', '111', '111'], per: 3, bpm: 100, caption: 'The triplet grid that swing sits on.' },
    { t: 'rhythm', cells: ['101', '101', '101', '101'], per: 3, bpm: 100, caption: 'Swung 8ths: the 1st and 3rd note of each triplet.' },
    p('The exact ratio is not fixed. At slow and medium tempos, swung 8ths are close to a 2:1 triplet ratio. As the tempo rises, they straighten towards even 8ths — at very fast bebop tempos the swing comes more from accents and phrasing than from uneven lengths. Different players and different eras also swing "harder" or "lighter". The triplet is a guide, not a ruler.'),

    h('The weight on 2 and 4'),
    p('In much classical music and in marches, beats 1 and 3 are the strong beats. In swing, the emphasis shifts to **beats 2 and 4**. The drummer\'s hi-hat closes on 2 and 4; audiences and musicians snap their fingers on 2 and 4. Feeling the music this way gives it its loping, relaxed forward motion. A simple way to absorb it is to set a slow metronome and hear its clicks as 2 and 4 rather than 1 and 3.'),
    p('Within a line of 8th notes, swing players often place light accents on the **off-beat** 8ths — the short notes — and connect the notes smoothly (legato). This is the opposite of what you might expect: the short note gets the accent. That combination of long–short timing and off-beat accents is the essence of swung phrasing.'),

    h('The ride cymbal'),
    p('The most recognisable swing pattern is the drummer\'s **ride-cymbal** figure: a hit on every beat, with an extra swung 8th before beats 2 and 4. Said aloud it goes "ding, ding-a ding, ding-a ding". With the hi-hat on 2 and 4 underneath, it defines the swing feel for the whole band.'),
    { t: 'rhythm', cells: ['100', '101', '100', '101'], per: 3, bpm: 100, caption: 'The ride-cymbal pattern: "ding, ding-a ding, ding-a".' },

    h('Where in the beat'),
    p('Swing also depends on **placement**: exactly where in time each player puts their notes. A walking bass line typically sits on top of the beat, or even slightly ahead of it, driving the time forward. The drummer\'s ride cymbal locks with the bass. A soloist may lay back slightly behind the beat for a relaxed feel, or push ahead for urgency. These differences are tiny — fractions of a beat — but they are what musicians mean when they talk about a band being "in the pocket", and they are why two bands playing the same notes can feel completely different.'),
    table(['Element', 'What it is'], [
      ['Ratio', 'about 2:1 at medium tempo, straighter when fast'],
      ['Accent', 'beats 2 and 4 (hi-hat, finger snaps); in lines, the off-beat 8ths'],
      ['Placement', 'the bass on top of the beat, the ride with it, soloists free to lay back: the pocket'],
      ['Shuffle', 'the same triplet long–short, played heavier: blues and R&B'],
    ]),

    h('Shuffle and swung 16ths'),
    p('The **shuffle** uses the same triplet-based long–short rhythm, but plays it heavier and more insistently, often with every swung 8th sounded. It is the feel of the blues, early R&B and rock and roll. A slow blues or gospel ballad often goes one step further, into **12/8**, where all three triplets of every beat are felt or played — the rolling feel of four beats each divided into three.'),
    p('The same principle applies to 16th notes. In hip-hop, neo-soul and much R&B, the 16ths are **swung**: each pair of 16ths is played long–short, giving the groove a lazy, loping bounce. J Dilla\'s programming and the neo-soul records it influenced made this feel enormously popular.'),
    example('Swing a scale', [
      'Set a slow click and feel it as beats 2 and 4.',
      'Play a scale in 8ths, long on the beat and short on the "&": DAH-da DAH-da.',
      'Accent the short "&"s lightly and connect the notes. That is the bebop phrasing that makes a line swing.',
    ]),
    example('Straight versus swung', [
      'Play a simple four-bar melody in even 8ths, as written.',
      'Play it again with every pair of 8ths long–short, as if each beat were a triplet.',
      'Play it a third time, swung, with a click on 2 and 4 and light accents on the off-beats. The same notes, three different feels.',
    ]),
    onRecord('Listen to the drummer\'s ride cymbal on any classic small-group jazz record and tap along with it, then switch your attention to the walking bass. Notice how the two lock together, and how the soloist floats over them, sometimes behind the beat, sometimes ahead.'),
    ear('To hear swing, listen to a line of 8th notes and ask whether the pairs are even or long–short. Then listen for where the weight falls: snaps on 2 and 4, accents on the off-beats. If a jazz performance sounds stiff, it is usually because the 8ths are too even or the weight is on 1 and 3.'),
    tryIt('Tap the three patterns above with a metronome, then play a scale swung against a click on 2 and 4. Next, play the ride pattern with one hand and swung 8ths with the other. The Rhythm drill under Ear has triplet and shuffle bars to tap.'),
    recap([
      'Swing 8ths are played long–short, from the triplet: the first two thirds and the last third of each beat.',
      'The ratio is near 2:1 at medium tempo and straighter at fast tempos.',
      'The weight falls on beats 2 and 4; lines accent the off-beat 8ths and connect smoothly.',
      'The ride cymbal (ding, ding-a ding) and the walking bass define the pocket; placement in the beat matters.',
      'The shuffle is a heavier version; 12/8 fills in every triplet; neo-soul and hip-hop swing their 16ths.',
    ]),
    drill('rhythm.tap.shuffle', 2),
  ],
  drills: ['rhythm.tap.shuffle'],
};
