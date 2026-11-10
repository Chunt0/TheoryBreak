import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const funkBass: Lesson = {
  id: 'funk.bass',
  title: 'Funk bass lines',
  tags: ['funk', 'rhythm'],
  level: 2,
  summary: 'The One, the octave, the ♭7 and chromatic pickups: how a funk bass line locks with the drums, defines the harmony with very few notes, and leaves the space that makes the groove breathe.',
  blocks: [
    p('In funk the bass line is often the most memorable part of the song — the riff people hum, the hook the whole groove hangs on. It sits at the junction of rhythm and harmony: locked with the kick drum below, defining the chord for everyone above. Players like Bootsy Collins, Larry Graham, George Porter Jr. and Rocco Prestia built their reputations on lines that are rhythmically intricate but harmonically very simple, and that combination is the key to the style.'),
    p('This lesson looks at what a funk bass line does, which notes it uses and why, and how to write one.'),

    h('Mostly rhythm'),
    p('A funk bass line is mostly **rhythm**. It lands hard on **the One** — the first beat of the bar — together with the kick drum, so that the whole band feels where the bar begins. Then it leaves space, and fills the rest of the bar with a few syncopated notes, often on the "e" and "a" 16ths, that lead back to the next One. The line is a cycle: strong arrival, space, pickups, strong arrival.'),
    { t: 'rhythm', cells: ['1001', '0010', '1010', '0011'], bpm: 96, caption: 'The One, the "a" of 1, the "&" of 2, beat 3 and its "&", then two pickups into the next bar.' },
    p('The space is as important as the notes. Leave beat 3 empty, and the One of the next bar hits harder. Fill every 16th, and the line becomes a blur that competes with the guitar and drums instead of locking with them. Great funk bass players are known as much for what they leave out as for what they play.'),

    h('Few notes, chosen well'),
    p('Harmonically, a funk line uses a small vocabulary, and each note has a clear job.'),
    table(['Note', 'Job'], [
      ['Root', 'the One, almost always'],
      ['Octave', 'bounce and drive; often popped on an off-beat'],
      ['♭7', 'the dominant colour, and a pickup back to the root'],
      ['5th', 'support; the 5th below the root works too'],
      ['Chromatic approach', 'a half step under (or over) the next root, on the last 16th'],
    ]),
    p('The **root** on the One tells everyone what the chord is. The **octave** adds bounce without adding new harmony — jumping between a low root and its octave is one of the most characteristic funk bass sounds. The **♭7** gives the line its dominant, bluesy colour, and it leads naturally back down to the root. The **5th** fills in without disturbing anything. And a **chromatic approach** note — a half step below or above the root, placed on the very last 16th of the bar — pulls the line into the next One with real force.'),
    p('Over minor vamps, the vocabulary widens to the **minor pentatonic** — root, ♭3, 4, 5, ♭7 — which gives the line a more melodic, riff-like quality while staying firmly inside the Dorian or Aeolian colour.'),

    h('Ghost notes and articulation'),
    p('Between the pitched notes, funk bass players add **ghost notes**: muted, almost pitchless thumps that fill some of the 16ths and keep the grid audible. They work like a drummer\'s ghost notes on the snare, giving the line a percussive texture and making the accented notes stand out.'),
    p('**Note length** matters just as much. A note held for its full value and the same note cut short sound completely different in a groove. Funk lines mix short, staccato notes, which leave silence behind them, with occasional longer notes that sit on the beat. The percussive octave "pop" associated with slap bass is the extreme of this: a short, bright attack on an off-beat, answering the low root on the One.'),

    h('Locking with the drums'),
    p('The bass and the kick drum work as a team. They almost always share the One. Beyond that, the bass may double some of the kick\'s syncopations to reinforce them, or fill the gaps between kicks so that the two parts interlock. The feeling of a bass and drums perfectly aligned, neither rushing nor dragging, is called the **pocket**, and it is the foundation of every funk band.'),
    { t: 'prog', key: 'E', tokens: ['E7', 'E7', 'A7', 'A7'], beats: 4, bpm: 98, style: 'funk', caption: 'The band\'s bass: root on the One, octave on the "&" of 2, the ♭7 as a pickup.' },

    h('Writing a line'),
    example('Write a one-bar line over E7', [
      'Beat 1: low E, held long enough to feel the One.',
      '"&" of 2: the octave E. "&" of 3: D, the ♭7.',
      '"a" of 4: D♯, a half step under the root, leading up into the next E on the One.',
    ], { notes: ['E2', 'E3', 'D3', 'D#2', 'E2'], beat: 0.3 }),
    example('A Dorian line over Em7', [
      'Beat 1: E, the root, on the One. Leave the rest of beat 1 and beat 2 mostly empty — perhaps one ghost note.',
      '"&" of 2: the octave E for bounce. Beat 3: rest, so the line breathes.',
      'Beat 4: climb the minor pentatonic — G, A, B on the "e", "&" and "a" — and land back on E for the next One.',
    ], { notes: ['E2', 'E3', 'G2', 'A2', 'B2', 'E2'], beat: 0.28 }),
    p('A good test of a funk line is to play it alone. It should still make you want to move, and the harmony should be clear from the root on the One. Then play it with a drum groove and check that it locks: the One together, the syncopations either doubling the kick or neatly filling its gaps.'),

    h('Synth bass'),
    p('Funk was also one of the first styles to put synthesisers on the bass line. Bernie Worrell\'s Minimoog bass on Parliament\'s "Flash Light" and Stevie Wonder\'s Moog bass lines are classic examples: fat, round, sometimes sliding between notes, but following exactly the same principles — the One, space, few notes, strong pickups. The modular synthesis lessons show how a classic synth bass sound is built, if you want to make one yourself.'),
    onRecord('Listen to a few classic funk tracks with your attention only on the bass. Count how many different pitches the line uses — often just three or four — and notice where it rests. Then listen to how the kick drum lines up with it on the One.'),
    ear('To learn a funk bass line by ear, find the One first, then the root, then work out the rhythm of the pickups before worrying about their exact pitches. Most of the time the pitches will turn out to be the octave, the ♭7, the 5th or a chromatic approach.'),
    tryIt('Over a held E7, play the root on the One and nothing else for a few bars. Then add the octave on the "&" of 2, then the ♭7 on the "&" of 3, then a D♯ pickup on the last 16th. Add one element at a time and listen to how each changes the groove. The Rhythm drill under Ear has 16th-note patterns to tap against a metronome.'),
    recap([
      'A funk bass line is mostly rhythm: the One, space, and syncopated pickups back to the next One.',
      'Its notes are few: root, octave, ♭7, 5th and chromatic approaches — plus the minor pentatonic on minor vamps.',
      'Ghost notes and note length give it texture; space makes the One hit harder.',
      'The bass and kick drum share the One and interlock elsewhere: that is the pocket.',
      'Synth bass lines follow the same principles with a different sound.',
    ]),
    drill('rhythm.tap.funk', 2),
  ],
  drills: ['rhythm.tap.funk', 'rhythm.tap.sync'],
};
