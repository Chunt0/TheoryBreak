import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const blues: Lesson = {
  id: 'jazz.blues',
  title: 'Jazz blues & Bird blues',
  tags: ['jazz'],
  level: 2,
  summary: 'The 12-bar blues from three chords to Charlie Parker\'s chains of ii–Vs: what each added chord does, which landmarks never move, and the minor blues.',
  blocks: [
    p('The blues is both a feeling and a form, and jazz has never been far from either. The 12-bar blues is still one of the most played forms in jazz — the default tune at a jam session, the basis of dozens of bebop heads, the backbone of soul-jazz. In its simplest form it uses three chords. Jazz musicians keep its skeleton and dress it up with ii–Vs, passing chords and substitutions, all the way to Charlie Parker\'s "Blues for Alice", where hardly a chord of the original survives but the shape is still unmistakably the blues.'),
    p('Seeing how each layer is added is one of the best ways to understand jazz reharmonisation, because every technique from the previous lessons turns up somewhere in it.'),

    h('The basic 12-bar blues'),
    p('The form is three phrases of four bars. In F: the first phrase sits on **F7** for four bars. The second moves to **B♭7** for two bars and back to F7 for two. The third goes to **C7**, then B♭7, then back to F7 — and the last bar often returns to C7 to turn the form around. Lyrics follow the same plan: a line, the same line repeated, then an answering line.'),
    { t: 'prog', key: 'F', tokens: ['F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'F7', 'C7', 'Bb7', 'F7', 'C7'], beats: 4, bpm: 140, style: 'swing', caption: 'The basic blues in F, with a quick change to B♭7 in bar 2' },
    p('Two things about this are unusual compared with other music in this library. First, **every chord is a dominant 7th**, even the tonic. In the blues, F7 is not the V of anything; it is home, and its ♭7 is part of the home sound. Second, the **V – IV – I** of the last phrase moves "backwards" from dominant to predominant, which classical harmony avoids. That relaxed, unhurried descent is part of the blues\' character.'),
    p('A common variation, the **quick change**, moves to IV in bar 2 and back to I in bar 3, as in the recording above. Either way, a few **landmarks** stay fixed in every version of the blues: bar 5 goes to IV, bar 7 returns to I, bar 9 begins the move towards the cadence, and bars 11–12 turn the form around. Keep those in your ear and you will recognise the blues however it is dressed.'),

    h('The jazz blues'),
    p('The standard jazz version keeps the landmarks and fills the spaces between them with ii–Vs and passing chords. In F it looks like this:'),
    table(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], [
      ['F7', 'B♭7 B°7', 'F7', 'Cm7 F7', 'B♭7', 'B°7', 'F7', 'Am7 D7', 'Gm7', 'C7', 'F7 D7', 'Gm7 C7'],
    ]),
    p('Each addition does a specific job:'),
    p('- **Bar 2, B°7**: a passing diminished chord between B♭7 and F7. Its notes lean by half step into the F7 that follows — B up to C, A♭ up to A — and a bass player can walk B♭, B, C straight through it.\n- **Bar 4, Cm7 – F7**: the ii–V of B♭. The tonic F7 is turned into a dominant pointing at bar 5, so the move to IV becomes a cadence.\n- **Bar 6, B°7**: the same passing chord again, leading from B♭7 back to F7 in bar 7.\n- **Bar 8, Am7 – D7**: a ii–V aimed at Gm7. D7 is V7/ii, a secondary dominant.\n- **Bars 9–10, Gm7 – C7**: a ii–V of F replacing the old V – IV, so the last phrase becomes a real cadence.\n- **Bars 11–12, F7 D7 Gm7 C7**: a turnaround, I – VI7 – ii – V, leading back to bar 1.'),
    { t: 'prog', key: 'F', tokens: ['F7', 'F7', 'Bb7', 'Bdim7', 'F7', 'F7', 'Cm7', 'F7', 'Bb7', 'Bb7', 'Bdim7', 'Bdim7', 'F7', 'F7', 'Am7', 'D7', 'Gm7', 'Gm7', 'C7', 'C7', 'F7', 'D7', 'Gm7', 'C7'], style: 'swing', bpm: 140, caption: 'The jazz blues in F' },
    example('From a basic blues to a jazz blues, bars 1–4 in F', [
      'Basic: F7 | B♭7 | F7 | F7.',
      'Bar 2: B♭7 for two beats, then B°7 — the bass climbs B♭, B into C under the F7 of bar 3.',
      'Bar 4: Cm7 – F7, the ii–V of B♭7, so bar 5 arrives with a cadence.',
    ], { prog: ['F7', 'Bb7', 'Bdim7', 'F7', 'Cm7', 'F7', 'Bb7'], key: 'F', beats: [4, 2, 2, 4, 2, 2, 4], style: 'swing' }),

    h('The Bird blues'),
    p('Charlie Parker took the idea much further. His "Blues for Alice" keeps the landmarks — IV in bar 5, a ii–V home in bars 9–10, a turnaround at the end — but replaces almost everything else with chains of ii–Vs.'),
    table(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], [
      ['Fmaj7', 'Em7♭5 A7', 'Dm7 G7', 'Cm7 F7', 'B♭7', 'B♭m7 E♭7', 'Am7 D7', 'A♭m7 D♭7', 'Gm7', 'C7', 'F D7', 'Gm7 C7'],
    ]),
    p('Read it as a journey. It starts on **Fmaj7** rather than F7 — a sweeter, more song-like tonic. Then it falls through a series of ii–Vs, each a whole step lower than the last: Em7♭5 – A7 points at D minor, Dm7 – G7 points at C, Cm7 – F7 points at B♭, which arrives right on time in bar 5. From bar 6, the ii–Vs descend by **half steps**: B♭m7 – E♭7, Am7 – D7, A♭m7 – D♭7, and finally Gm7 – C7, the ii–V of the home key. It is a slide down a chromatic staircase that lands precisely on the cadence.'),
    p('Bar 6 can be heard two ways, and both are useful. As part of the descending chain, B♭m7 – E♭7 is simply the next ii–V down. In relation to the key, it is iv7 – ♭VII7 of F — the backdoor ii–V — leading into Am7, the iii chord, which stands in for the tonic at the landmark in bar 7.'),
    { t: 'prog', key: 'F', tokens: ['Fmaj7', 'Fmaj7', 'Em7b5', 'A7', 'Dm7', 'G7', 'Cm7', 'F7', 'Bb7', 'Bb7', 'Bbm7', 'Eb7', 'Am7', 'D7', 'Abm7', 'Db7', 'Gm7', 'Gm7', 'C7', 'C7', 'F', 'D7', 'Gm7', 'C7'], style: 'swing', bpm: 150, caption: 'The Bird blues in F' },
    onRecord('Bebop players treat the blues as a whole family of reharmonisations rather than one progression. Listen to several blues heads by Parker, Monk or Sonny Rollins and you will hear the band moving freely between the basic, jazz and Bird versions, often within one tune.'),

    h('The minor blues'),
    p('The blues also comes in minor. A typical minor blues in C uses **Cm7** for four bars, **Fm7** for two, Cm7 for two, then a cadence — often **A♭7 – G7** (the ♭VI7 sliding down a half step to the dominant) or a minor ii–V, **Dm7♭5 – G7♭9** — before returning to Cm7. The landmarks are the same as in major; only the colours have changed. John Coltrane\'s "Mr. P.C." and "Equinox" are well-known minor blues, and Wayne Shorter\'s "Footprints" stretches the idea into a 24-bar form.'),
    { t: 'prog', key: 'Cm', tokens: ['Cm7', 'Cm7', 'Cm7', 'Cm7', 'Fm7', 'Fm7', 'Cm7', 'Cm7', 'Ab7', 'G7', 'Cm7', 'G7'], beats: 4, bpm: 140, style: 'swing', caption: 'A minor blues in C' },

    h('Blues language'),
    p('Whatever the harmony, the blues brings its own melodic language. The **blues scale** — 1 ♭3 4 ♭5 5 ♭7 — and the blue notes ♭3, ♭5 and ♭7 are played over the dominant chords of a major blues, deliberately clashing with their major 3rds. A ♭3 bent or slid up towards the major 3rd is one of the most characteristic sounds in all of jazz, and it sounds right precisely because the clash is part of the blues tradition. Even the most harmonically sophisticated bebop solo on a Bird blues will usually come back to blues phrasing at some point.'),
    ear('Track the landmarks: the move to IV in bar 5, the return to I (or a stand-in) in bar 7, the ii–V home in bars 9–10. If you can hear those three moments, you will never lose your place in a blues, however many substitutions are going on.'),
    tryIt('Play the three versions of the blues in F one after another — basic, jazz, Bird — with the same simple melody or riff over each. Then improvise on the basic blues using the blues scale, and on the jazz blues landing on the 3rd of each new chord. The contrast shows you two sides of the same form.'),
    recap([
      'The 12-bar blues is three 4-bar phrases: I7, IV7–I7, V7–IV7–I7; every chord is a dominant 7th.',
      'Landmarks never move: IV in bar 5, I in bar 7, the cadence from bar 9, a turnaround in bars 11–12.',
      'The jazz blues adds passing diminished chords, ii–Vs into IV and ii, a ii–V home and a turnaround.',
      'The Bird blues ("Blues for Alice") replaces most bars with descending chains of ii–Vs.',
      'The minor blues uses i, iv and a cadence like ♭VI7 – V7 or iiø7 – V7♭9.',
    ]),
    drill('jazz.keycenter', 3),
  ],
  drills: ['jazz.keycenter', 'jazz.analysis', 'jazz.relatedii'],
};
