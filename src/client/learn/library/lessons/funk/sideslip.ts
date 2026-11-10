import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const sideslip: Lesson = {
  id: 'funk.sideslip',
  title: 'Side-slipping & going outside',
  tags: ['funk', 'jazz'],
  level: 3,
  summary: 'Leave the key by a half step for a beat or a bar and come back: how deliberate "wrong" notes create tension over a static vamp, and how to make them sound intended rather than accidental.',
  blocks: [
    p('Over a one-chord funk vamp or a long modal section, nothing happens harmonically for minutes at a time. That is the point — but it leaves a soloist or accompanist with a challenge: how do you create tension and release when the harmony refuses to move? One answer, used constantly in jazz-funk and post-bop, is to **make the motion yourself**: slide a line or a chord a half step out of the key, stay there briefly, and then slip back in. This is called **side-slipping**, and it is the simplest and most controlled way of playing "outside".'),
    p('Done well, it sounds thrilling — a flash of dissonance that makes the return to the key feel even more solid. Done badly, it just sounds like wrong notes. The difference lies almost entirely in how you leave and how you come back.'),

    h('Why a half step works'),
    p('A half step is a strange distance. In terms of the notes they share, two keys a half step apart are about as far apart as keys can be: D minor pentatonic (D F G A C) and E♭ minor pentatonic (E♭ G♭ A♭ B♭ D♭) have **not a single note in common**. So slipping up a half step produces maximum contrast — every note clashes with the vamp.'),
    p('Yet every one of those clashing notes is only a half step from a note of the home key. That means the way back is short, smooth and obvious: each note can drop straight down into its neighbour. It is the same principle as a leading tone, applied to a whole phrase at once. Maximum contrast with minimum distance is what makes the side-slip so effective.'),

    h('Slipping a line'),
    p('The basic move for a soloist is **in → out → in**. Play an idea inside the key, repeat the same shape a half step higher, then bring it back down. Because the outside phrase is clearly a transposition of something the listener has just heard, the ear understands it as a deliberate move rather than an error.'),
    listen([
      { label: 'In → out → in', music: { notes: ['D4', 'F4', 'G4', 'A4', 'C5', 'Eb4', 'Gb4', 'Ab4', 'Bb4', 'Db5', 'D4', 'F4', 'A4'], beat: 0.2 }, note: 'D, then E♭, then D minor pentatonic' },
    ]),
    example('Side-slip a Dm7 vamp', [
      'Play a D minor pentatonic idea for a bar.',
      'Repeat the same shape a half step up, in E♭ minor pentatonic, on beats 3 and 4: every note rubs against the vamp.',
      'Drop it back down onto the One of the next bar. The ear hears tension and release, not a wrong note.',
    ], { notes: ['A4', 'G4', 'F4', 'D4', 'Bb4', 'Ab4', 'Gb4', 'Eb4', 'A4', 'F4', 'D4'], beat: 0.25 }),
    p('Slipping **up** sounds tense and edgy, like the music has been knocked off balance until it falls back. Slipping **down** a half step has a different feel: the outside notes sit just below the home notes and pull upward into them, like a row of leading tones. Both are common; try each and notice the difference.'),

    h('Slipping chords'),
    p('Accompanists do the same thing with chords. The simplest version is an **approach chord**: on the last 16th or 8th before the One, play the vamp chord a half step above or below, then land on the real chord on the downbeat — E♭m7 or E♭7 into Dm7. It gives the downbeat a satisfying snap and is a staple of funk keyboard and guitar comping.'),
    p('Whole bands can side-slip together, moving the entire vamp up a half step for a bar or two and then dropping back. It is a dramatic effect and is usually written into the arrangement, so that everyone moves at once.'),
    { t: 'prog', key: 'Dm', tokens: ['Dm7', 'Dm7', 'Ebm7', 'Dm7'], beats: 4, bpm: 100, style: 'funk', caption: 'The whole band slips: two bars of Dm7, one a half step up, home on the One.' },

    h('Planing'),
    p('A related technique is **planing**: moving a single voicing in parallel, so that every voice moves by the same interval. Slide a quartal voicing up and down the notes of D Dorian over a D bass and you get the shimmering, restless comping sound of McCoy Tyner or Herbie Hancock. Slide a voicing chromatically — up a half step and back — and you are side-slipping with chords. Because the shape stays the same, the ear hears a single sound moving rather than a series of separate chords.'),
    listen([
      { label: 'Quartal planing', music: { voicings: [['D3', 'E4', 'A4', 'D5'], ['D3', 'F4', 'B4', 'E5'], ['D3', 'G4', 'C5', 'F5'], ['D3', 'F4', 'B4', 'E5'], ['D3', 'E4', 'A4', 'D5']], beat: 0.8 }, note: 'stacked 4ths up and down D Dorian' },
    ]),
    table(['Move', 'Over Dm7', 'Effect'], [
      ['Slip up a half step', 'E♭ minor ideas for a beat or a bar', 'tense, then home'],
      ['Slip down a half step', 'C♯ minor ideas', 'pulls back up like a leading tone'],
      ['Planing', 'one voicing moved in parallel', 'the McCoy Tyner and Herbie Hancock comping sound'],
      ['Approach chord', 'E♭m7 or E♭7 into Dm7 on the One', 'a chromatic push into the downbeat'],
    ]),

    h('Making it sound intended'),
    p('Three habits separate a convincing side-slip from a mistake.'),
    p('**Resolve on a strong beat.** Go outside on weak beats, or for a whole bar, but come back in on a strong beat — ideally the One. The return is what defines the move; without a clear landing, the outside notes have nothing to be measured against.'),
    p('**Use a recognisable shape.** The ear accepts outside notes much more readily when they form a pattern it can follow: a motif transposed, a familiar pentatonic shape moved up, a voicing slid in parallel. Random chromatic notes sound lost; a clear shape in the wrong place sounds bold.'),
    p('**Commit to it.** Play the outside phrase with exactly the same rhythmic conviction, tone and phrasing as the inside one. Hesitation is what makes outside playing sound like a mistake. And use it sparingly — the effect depends on contrast, and a solo that spends most of its time outside loses the home base that makes the slips exciting.'),

    h('Further out'),
    p('The half step is the most common distance, but not the only one. Players also superimpose ideas a tritone away — the most distant key of all, which echoes the logic of tritone substitution — or move a motif through a symmetrical sequence, such as up in minor 3rds, before returning. These are bolder sounds, and they follow the same rules: a clear shape, total conviction, and an unmistakable return.'),
    onRecord('Jazz-funk keyboard players and saxophonists from the 1970s onwards side-slip constantly over long vamps. Listen for the moments when a solo suddenly sounds "wrong" for a beat or two and then snaps back into place, usually right on the One.'),
    ear('A side-slip sounds like the whole line has briefly shifted into a different key and then dropped back. If you can hear that the outside phrase is the same shape as the phrase before it, just moved, it is almost certainly a deliberate slip.'),
    tryIt('Over a Dm7 vamp, play a short D minor pentatonic riff for a bar, the same riff in E♭ minor pentatonic for two beats, then land back on D on the One. Then try slipping down to C♯ instead. Finally, comp the vamp with an E♭m7 on the last 8th of every second bar, resolving to Dm7 on the downbeat.'),
    recap([
      'Side-slipping moves a line or chord a half step out of the key and back, creating tension over a static harmony.',
      'A half step gives maximum contrast (keys a half step apart share almost nothing) with the shortest way home.',
      'In → out → in: play an idea, transpose it a half step, resolve it — ideally on the One.',
      'Accompanists use approach chords and planing; whole bands can slip together.',
      'Make it sound intended with a strong-beat resolution, a recognisable shape and total conviction.',
    ]),
    drill('jazz.concepts', 3),
  ],
  drills: ['jazz.concepts', 'soul.analysis'],
};
