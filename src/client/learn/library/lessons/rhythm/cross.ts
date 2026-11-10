import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const cross: Lesson = {
  id: 'rhythm.cross',
  title: 'Cross-rhythm, hemiola & polyrhythm',
  tags: ['rhythm', 'bach', 'funk'],
  level: 3,
  summary: 'Two pulses at once: three against two, three against four, the hemiola that broadens Bach\'s cadences, and the groupings of three that cut across a funk or drum-and-bass bar.',
  blocks: [
    p('Most rhythm sets one pulse — the beat — and places notes on and around it. A **cross-rhythm** sets a second, conflicting pulse against the first, so that two different ways of dividing time sound at once. The result can be dizzying or deeply grooving, and it turns up across a remarkable range of music: the bell patterns of West African and Afro-Cuban music, the cadences of Baroque dances, jazz piano comping, funk drumming and drum and bass.'),
    p('This lesson starts with the most fundamental cross-rhythm, three against two, and works outwards.'),

    h('Three against two'),
    p('**3:2** means three evenly spaced notes in the time of two beats. Count a triplet grid across two beats — "1 2 3 4 5 6" — and the two beats fall on 1 and 4, while the three notes fall on 1, 3 and 5. Together they make a lopsided pattern: both together, then the three, then the two, then the three: **together, three, two, three**. Pianists have long learned it with the mnemonic "nice cup of tea", one syllable per event.'),
    p('The effect of 3:2 is a kind of rhythmic shimmer: neither pulse wins, and the ear can switch between hearing the music in two and hearing it in three. That ambiguity is the basis of a vast amount of music in 6/8 and 12/8, where the bar can be felt either as two big beats each divided into three, or as three beats each divided into two.'),
    { t: 'rhythm', cells: ['101', '010'], per: 3, bpm: 70, caption: '3 against 2: three even notes across two clicks.' },
    example('Play 3 against 2 with two hands', [
      'Count a triplet grid, "1 2 3 4 5 6", across two beats.',
      'Left hand on 1 and 4 (the two beats), right hand on 1, 3 and 5 (the three).',
      'Together: both, right, left, right — "nice cup of tea". Speed it up until the two pulses feel independent.',
    ]),

    h('Three against four'),
    p('**3:4** sets three even notes against four beats — half-note triplets across a bar of 4/4. It is harder to feel than 3:2, because the two pulses only coincide at the start of the bar, but it is common in jazz, where a soloist or pianist may phrase in groups of three across the beat to create a sense of floating above the time. Counted on a 12-step triplet grid, the four beats fall on steps 1, 4, 7 and 10, and the three notes on 1, 5 and 9.'),
    { t: 'rhythm', cells: ['100', '010', '001', '000'], per: 3, bpm: 90, caption: '3 against 4: three even notes across a bar of four (half-note triplets).' },

    h('The hemiola'),
    p('A **hemiola** is a 3:2 cross-rhythm stretched over a larger span. Take two bars of 3/4 — | 1 2 3 | 1 2 3 | — and regroup the six beats as three groups of two — | 1 2 | 1 2 | 1 2 |. For a moment the music seems to slow down and broaden, as if it has switched into a larger triple meter, before snapping back into place.'),
    p('Baroque composers used the hemiola constantly, especially in triple-meter dances like the minuet, courante and sarabande, where it marks the approach to a cadence. The final bars of a phrase suddenly regroup into twos, the harmony moves in longer strides, and the cadence arrives with a feeling of weight and finality. Once you know the sound, you will hear it at the end of countless Bach and Handel dance movements.'),
    { t: 'rhythm', cells: ['1', '0', '1', '0', '1', '0'], per: 1, bpm: 132, caption: 'Hemiola: six beats grouped 2 + 2 + 2 against two bars of 3.' },
    example('Hear a hemiola at a cadence', [
      'Count two bars of 3/4: "1 2 3, 1 2 3".',
      'Now accent every second beat across both bars: "ONE two, ONE two, ONE two" — three groups of two.',
      'The phrase seems to broaden into one big bar of 3/2 just before the cadence: the classic Baroque hemiola.',
    ]),

    h('Groupings of three inside four'),
    p('A different kind of cross-rhythm comes from grouping the subdivisions of a bar in threes. Sixteen 16ths do not divide evenly by three, so a pattern that accents every third 16th — 3 + 3 + 3 + 3 + 2 + 2 — cuts across the beat for most of the bar and then resolves with two groups of two to land back on the next downbeat. The tresillo (3 + 3 + 2) is the shortest version. Funk drummers, drum-and-bass producers and jazz soloists all use these groupings to create tension against a steady 4/4.'),
    { t: 'rhythm', cells: ['1001', '0010', '0100', '1010'], bpm: 96, caption: 'Groups of three 16ths (3 + 3 + 3 + 3 + 2 + 2): a figure that cuts across the beat.' },
    table(['Cross-rhythm', 'What sounds', 'Where you hear it'], [
      ['3:2', 'three even notes in the time of two beats', '6/8 and 12/8 grooves, Afro-Cuban bell patterns'],
      ['3:4', 'half-note triplets across a bar of four', 'jazz phrasing, ballad comping'],
      ['Hemiola', 'two bars of three regrouped as three groups of two', 'Baroque dance cadences'],
      ['3s inside 4/4', '16ths grouped 3 + 3 + 3 + 3 + 2 + 2', 'funk, drum and bass, the tresillo'],
    ]),

    h('Polyrhythm and polymeter'),
    p('When two cross-rhythms continue for a long time, each with its own sense of beat, the music is **polyrhythmic**. Much West African drumming layers several patterns that relate to the main pulse in different ways, so that the overall groove contains two and three at once. A related idea, **polymeter**, sets patterns of different lengths against each other — a 3-beat figure repeating over a 4-beat bar, for instance, so that the two drift in and out of alignment. The sequencing lessons explore polymeter with step sequencers of different lengths, which is one of the easiest ways to hear it.'),
    onRecord('Listen for 3:2 in the bell patterns of Afro-Cuban 6/8 music, where the bell implies one pulse and the dancers another. For hemiolas, listen to the last bars of a minuet or courante from a Bach suite. For groupings of three in 4/4, listen to a funk drummer\'s fills or the busy breakbeats of drum and bass.'),
    ear('When a rhythm seems to pull against the beat for several notes in a row and then snap back, try counting its accents: if they come every three 16ths or every three triplets, you are hearing a grouping of three across a duple beat. If a triple-meter piece suddenly seems to slow down before a cadence, listen for a hemiola.'),
    tryIt('Tap 3 against 2 with both hands, then 3 against 4, saying the triplet grid out loud. Then tap the 3 + 3 + 3 + 3 + 2 + 2 figure against a steady quarter-note click. Finally, count two bars of 3/4 and accent them as three groups of two, and listen to the phrase broaden.'),
    recap([
      'A cross-rhythm sets a second pulse against the beat; the two can be heard either way.',
      '3:2 (three against two) underlies 6/8 and 12/8 grooves; 3:4 floats triplets across a bar of four.',
      'A hemiola regroups two bars of three as three groups of two, broadening Baroque cadences.',
      'Grouping 16ths in threes (3 + 3 + 3 + 3 + 2 + 2) cuts across 4/4 and resolves on the downbeat.',
      'Polyrhythm layers conflicting pulses; polymeter layers patterns of different lengths.',
    ]),
    drill('rhythm.clave', 2),
  ],
  drills: ['rhythm.clave', 'rhythm.tap.sync'],
};
