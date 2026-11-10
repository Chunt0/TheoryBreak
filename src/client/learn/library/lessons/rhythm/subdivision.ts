import type { Lesson } from '../../types';
import { drill, ear, example, h, p, recap, table, tryIt } from '../blocks';

export const subdivision: Lesson = {
  id: 'rhythm.subdivision',
  title: 'Subdivision: counting the grid',
  tags: ['rhythm', 'funk'],
  level: 1,
  summary: 'Divide every beat into equal parts and feel them all, even the silent ones. Counting the 8th, 16th or triplet grid out loud is what turns syncopation from guesswork into precision.',
  blocks: [
    p('Rhythm can feel like the most instinctive part of music — you either feel it or you do not. But the kind of rhythm that makes a funk band tight, a swing band lilt or a Latin groove sit just right depends on something quite concrete: an internal **grid** of evenly spaced pulses that the musician feels all the time, including in the silences. Dividing each beat into equal smaller parts and feeling them is called **subdivision**, and it is the single most useful rhythmic skill there is.'),
    p('This lesson introduces the common grids, the counting syllables that name every slot in them, and how to use counting to play syncopated rhythms accurately.'),

    h('Beat, meter and subdivision'),
    p('Three levels of time work together. The **beat** is the basic pulse you tap your foot to. The **meter** groups beats into bars — four beats per bar in most of the music in this library. And the **subdivision** divides each beat into smaller equal parts. Most rhythms that sound interesting do so because of what happens at the subdivision level: notes that fall between the beats.'),

    h('The common grids'),
    p('**8ths** divide each beat in two, counted **"1 & 2 & 3 & 4 &"**. The number is the beat; the "&" is exactly halfway to the next one. **16ths** divide each beat into four, counted **"1 e & a, 2 e & a…"** — the "e" a quarter of the way through the beat, the "&" halfway, the "a" three quarters. **Triplets** divide each beat into three, counted **"1 trip let, 2 trip let…"**.'),
    p('Each grid has its home styles. Straight 8ths drive rock and pop and the melodies of bossa nova. 16ths are the grid of funk, R&B, hip-hop and much Latin music. Triplets underlie shuffles, slow blues, 12/8 gospel ballads and, in a softened form, the swing feel of jazz.'),
    table(['Grid', 'Count', 'Where you hear it'], [
      ['8ths', '1 & 2 &', 'straight rock and pop, bossa melodies'],
      ['16ths', '1 e & a', 'funk, R&B, hip-hop, Latin'],
      ['triplets', '1 trip let', 'shuffle, 12/8 blues and gospel'],
      ['swung 8ths', 'long–short ≈ "1 · let"', 'jazz'],
    ]),
    { t: 'rhythm', cells: ['1111', '1111', '1111', '1111'], caption: 'All sixteen 16ths: 1 e & a 2 e & a 3 e & a 4 e & a', bpm: 80 },

    h('Why counting helps'),
    p('A **syncopation** is simply a note on a weak slot of the grid — an "e", an "&" or an "a" — usually with nothing on the strong slot that follows, so the accent seems to arrive early. Without a grid in your head, those off-beat notes drift: they come a little early or a little late, and the rhythm loses its snap. With the grid, every slot has a name, and a rhythm like "the a of 1, then the & of 2" becomes a precise instruction rather than a vague feeling.'),
    p('This is why drummers, bass players and dancers often count out loud when learning a part. Saying the syllables keeps every slot of the grid alive, so you can place notes exactly where they belong and — just as important — leave the others silent while still feeling them.'),
    { t: 'rhythm', cells: ['1001', '0010', '1000', '0110'], caption: 'Hits on 1, the a of 1, the & of 2, 3, and the e and & of 4', bpm: 84 },
    example('Count before you tap', [
      'During the count-in, say the grid out loud: "1 e & a 2 e & a…".',
      'Keep saying it while you tap, and tap only on the highlighted syllables.',
      'A hit on an "a" belongs to the next beat — feel it pushing forward rather than arriving late.',
    ]),
    example('Read a 16th-note bar', [
      'The pattern above has hits in slots 1 and 4 of beat 1, slot 3 of beat 2, slot 1 of beat 3 and slots 2 and 3 of beat 4.',
      'Name them: "1", "a" of 1, "&" of 2, "3", "e" and "&" of 4.',
      'Now say the whole grid and clap only on those syllables. The rhythm that looked complicated is six named slots.',
    ]),

    h('Straight and triplet grids'),
    p('The 8th and 16th grids divide the beat into twos; the triplet grid divides it into threes. They feel completely different. A straight grid sounds square and driving; a triplet grid rolls and sways. Some music lives entirely in one or the other, but a great deal moves between them, and being able to switch grids cleanly — or to hear which one a groove is using — is an important skill.'),
    { t: 'rhythm', cells: ['101', '101', '101', '111'], per: 3, caption: 'Triplet grid, shuffle feel: "1 · let 2 · let …"', bpm: 88 },
    p('The swing feel of jazz sits between the two. Swung 8ths are written as plain 8ths but played long–short, closer to the first and third notes of a triplet than to an even division. The swing lesson goes into this in detail.'),

    h('From counting to feeling'),
    p('Counting is a means, not an end. At first, say the grid out loud. Then whisper it. Then just think it. Eventually the grid becomes something you feel in your body, and you no longer need the words — but you can always return to them when a rhythm is difficult. A useful bridge is to keep the beat with your foot while your hands play the subdivided rhythm: the foot holds the meter, the hands place the notes, and the silent slots are felt between them.'),
    ear('When you listen to a groove, try to find its grid. Is something — a hi-hat, a shaker, a guitar — marking every 16th? Every triplet? Once you can hear the grid, the syncopated parts on top of it become much easier to follow and to copy.'),
    tryIt('Count the grid out loud while the metronome runs: "1 e & a 2 e & a". Then tap only the highlighted slots of the patterns above, keeping the count going through the rests. The Rhythm drill under Ear gives you bars to read and tap and to recognise by ear.'),
    recap([
      'Subdivision divides each beat into equal parts: 8ths (1 &), 16ths (1 e & a) or triplets (1 trip let).',
      'Feeling the whole grid, including the silent slots, is what makes syncopated rhythms precise.',
      'Counting syllables names every slot, so a rhythm becomes a list of exact positions.',
      'Straight grids divide the beat in twos and feel square; triplet grids divide it in threes and roll; swing sits between.',
      'Count aloud first, then internalise the grid — keep the beat in your foot while your hands play.',
    ]),
    drill('rhythm.tap.16', 2),
  ],
  drills: ['rhythm.tap.16', 'rhythm.tap.sync', 'rhythm.tap.shuffle', 'rhythm.ear.funk'],
};
