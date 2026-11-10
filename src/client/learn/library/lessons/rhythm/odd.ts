import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const odd: Lesson = {
  id: 'rhythm.odd',
  title: 'Odd meters: 5, 7 and grouping',
  tags: ['rhythm', 'jazz'],
  level: 3,
  summary: 'Meters of 5, 7, 9 or 11 sound exotic but are built from the same 2s and 3s as everything else. How to count them by groups, how the grouping shapes the feel, and how to make them groove.',
  blocks: [
    p('Almost all the music in this library is in 4/4: four beats to a bar, divided evenly. Meters with five, seven, nine or eleven beats can sound strange and difficult at first — a little lopsided, as if a beat has gone missing or one has been added. But in many traditions they are completely natural. Bulgarian and Macedonian folk dances move in 7/8 and 11/8 as easily as a waltz moves in 3/4; Indian classical music uses rhythmic cycles of many different lengths; and since Dave Brubeck\'s 1959 album *Time Out*, odd meters have been part of jazz, later spreading through fusion, progressive rock and film music.'),
    p('The secret is that odd meters are not really odd at all. They are built from the same small units as every other meter: **groups of two and three**.'),

    h('Meters as groups'),
    p('A time signature\'s top number gives the number of beats in a bar; the bottom number gives the note value of each beat — 4 for a quarter note, 8 for an eighth. In 4/4, the four beats group naturally as 2 + 2. In 6/8, the six eighth notes group as 3 + 3, so the bar is felt in two big beats, each divided into three.'),
    p('Any number of beats can be broken into 2s and 3s, and the way a meter is grouped is what you actually feel. Five can be 3 + 2 or 2 + 3. Seven can be 2 + 2 + 3, 3 + 2 + 2 or 2 + 3 + 2. The first note of each group carries a natural accent, so the grouping gives each bar its shape. The **longer group** — the 3 among the 2s — gives the meter its characteristic lilt or limp, and where it falls in the bar changes the feel completely.'),

    h('Five'),
    p('**5/4** is usually felt as **3 + 2** or **2 + 3**. The most famous example in jazz is "Take Five", composed by Paul Desmond and recorded by the Dave Brubeck Quartet, whose piano vamp groups each bar as 3 + 2: a long group and a short one, with accents on beats 1 and 4. Lalo Schifrin\'s *Mission: Impossible* theme is another well-known 5/4.'),
    { t: 'rhythm', cells: ['1', '0', '0', '1', '0'], per: 1, bpm: 160, caption: '5/4 as 3 + 2: accents on 1 and 4.' },
    example('Comp in 5/4 as 3 + 2', [
      'Count "1 2 3 4 5", accenting 1 and 4.',
      'Play a chord on 1 and on 4 — a long group, then a short one — and let the bass land on 1.',
      'Once the long–short shape is in your body, stop counting to five and just feel "ONE-two-three, FOUR-five".',
    ]),

    h('Seven'),
    p('**7/8** is usually felt in three groups: **2 + 2 + 3** (short, short, long) or **3 + 2 + 2** (long, short, short). At a fast tempo the eighth notes go by too quickly to count individually, so you feel the bar as three uneven beats — and the uneven one is what makes 7/8 dance. **7/4** is the same idea at a slower pulse; Pink Floyd\'s "Money" is a well-known 7/4.'),
    { t: 'rhythm', cells: ['1', '0', '1', '0', '1', '0', '0'], per: 1, bpm: 240, caption: '7/8 as 2 + 2 + 3; the click is the 8th.' },
    { t: 'rhythm', cells: ['1', '0', '0', '1', '0', '1', '0'], per: 1, bpm: 240, caption: '7/8 as 3 + 2 + 2.' },
    example('Feel 7/8 as 2 + 2 + 3', [
      'Count groups, not 8ths: "1-2, 1-2, 1-2-3".',
      'Tap your foot on each group\'s first note: short, short, long.',
      'Place chord hits on the group starts. Once short-short-long is in your body, the bar line takes care of itself.',
    ]),

    h('Nine, eleven and beyond'),
    p('**9/8** is normally 3 + 3 + 3, a compound triple meter with a smooth, rolling feel. But it can also be grouped irregularly, as **2 + 2 + 2 + 3**, which sounds completely different. Brubeck\'s "Blue Rondo à la Turk" plays on exactly this contrast, alternating bars of 2 + 2 + 2 + 3 with bars of 3 + 3 + 3. Longer meters — 11/8 as 2 + 2 + 3 + 2 + 2, for instance, a common Balkan dance rhythm — are simply longer chains of 2s and 3s.'),
    table(['Meter', 'Groupings', 'Heard in'], [
      ['5/4', '3 + 2 or 2 + 3', '"Take Five", the Mission: Impossible theme'],
      ['7/8 or 7/4', '2 + 2 + 3, 3 + 2 + 2, 4 + 3', 'Balkan folk, "Money" (7/4)'],
      ['9/8', '2 + 2 + 2 + 3, against 3 + 3 + 3', '"Blue Rondo à la Turk"'],
      ['11/8, 13/8…', 'longer chains of 2s and 3s', 'Balkan dance, progressive fusion'],
    ]),

    h('Making it groove'),
    p('Counting gets you through an odd meter; grouping makes it groove. A few habits help.'),
    p('- **Count groups, not beats.** "1-2, 1-2, 1-2-3" is easier to feel than "1 2 3 4 5 6 7".\n- **Feel the long group.** Its extra length is the character of the meter; lean into it rather than rushing it.\n- **Learn each bar as one gesture.** A 7/8 bar is a single shape — short-short-long — not seven separate counts.\n- **Let the melody guide you.** Melodies in odd meters are phrased to the grouping; sing the tune and the meter follows.'),
    p('Odd groupings also appear **inside** even meters. The tresillo groups the eight 8ths of a 4/4 bar as 3 + 3 + 2; a drum-and-bass or funk figure might group sixteen 16ths as 3 + 3 + 3 + 3 + 2 + 2. Because the bar is still 4/4, these groupings cut across the beat and create cross-rhythmic tension — the subject of the next lesson.'),
    onRecord('Listen to "Take Five" and tap the 3 + 2 grouping of the piano vamp; then to "Blue Rondo à la Turk" and notice the switch between 2 + 2 + 2 + 3 and 3 + 3 + 3. For 7/8, Balkan brass bands and folk dance recordings make the short-short-long feel unmistakable.'),
    ear('To work out an odd meter by ear, find the strongest accent — the start of the bar — and count the pulses until it comes round again. Then listen for the long group: where does the bar seem to stretch? That tells you the grouping.'),
    tryIt('Tap the three patterns above with the metronome, saying the group counts out loud. Then improvise a simple melody in 5/4 (3 + 2) and in 7/8 (2 + 2 + 3), placing the first note of each phrase on a group start. Finally, try tapping 7/8 as 3 + 2 + 2 and notice how different it feels from 2 + 2 + 3.'),
    recap([
      'Odd meters are built from groups of 2 and 3, just like even meters.',
      'The grouping is what you feel: 5 as 3 + 2 or 2 + 3; 7 as 2 + 2 + 3 or 3 + 2 + 2; 9 as 3 + 3 + 3 or 2 + 2 + 2 + 3.',
      'The first note of each group carries the accent; the longer group gives the meter its lilt.',
      'Count groups rather than beats, and learn each bar as a single gesture.',
      'Odd groupings inside 4/4 (3 + 3 + 2) create cross-rhythms against the beat.',
    ]),
    drill('rhythm.tap.sync', 3),
  ],
  drills: ['rhythm.tap.sync', 'rhythm.tap.16'],
};
