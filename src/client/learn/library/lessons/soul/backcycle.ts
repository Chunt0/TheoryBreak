import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const backcycle: Lesson = {
  id: 'soul.backcycle',
  title: 'Gospel 7–3–6 & chained dominants',
  tags: ['soul', 'jazz'],
  level: 3,
  summary: 'Walking back from the 7th degree to the tonic, one falling 5th at a time: the gospel 7–3–6, how secondary dominants and tritone subs turn it into a rolling turnaround, and how to aim the chain at any chord.',
  blocks: [
    p('Gospel musicians name chords by scale-degree numbers, and one string of numbers has become famous: **7–3–6**, usually continuing **2–5–1**. It describes a chain of chords whose roots each fall a perfect 5th — the longest walk round the circle of fifths that fits inside a key, starting on its 7th degree and arriving home. Played with dominant chords and tritone substitutions, it becomes one of the most exciting sounds in gospel and R&B: a turnaround that gathers momentum with every chord until it lands on the tonic.'),
    p('This is backcycling, the technique from the secondary dominants lesson, applied to the whole key. Understanding it gives you a powerful tool for endings, turnarounds and reharmonisations.'),

    h('The diatonic cycle'),
    p('In C major, start on B — degree 7 — and move each root down a 5th: **B → E → A → D → G → C**. Those are degrees 7, 3, 6, 2, 5 and 1. With the key\'s own chords on each root, the cycle is **Bø7 – Em7 – Am7 – Dm7 – G7 – Cmaj7**. Every move is a falling 5th, so every chord leads into the next with the strongest root motion there is, and the guide tones move smoothly by step all the way down.'),
    p('Even in this plain, diatonic form, the cycle has a satisfying sense of inevitability. But it only has one real dominant chord, the G7 at the end. Gospel players add more.'),

    h('Making the links dominant'),
    p('Any chord in the chain can be turned into a dominant 7th, which makes it the V of the chord after it. Em7 becomes **E7**, the V of Am. Dm7 becomes **D7**, the V of G. Do it to every link and you get **B7 – E7 – A7 – D7 – G7 – C**: a chain of extended dominants, each one pulling hard into the next. That sustained pull is the essence of the gospel 7–3–6.'),
    table(['Degree', 'Diatonic (C)', 'All dominants', 'Alternate tritone subs'], [
      ['7', 'Bø7', 'B7', 'B7'],
      ['3', 'Em7', 'E7', 'B♭7'],
      ['6', 'Am7', 'A7', 'A7'],
      ['2', 'Dm7', 'D7', 'A♭7'],
      ['5', 'G7', 'G7', 'G7'],
      ['1', 'Cmaj7', 'C', 'C'],
    ]),
    { t: 'prog', key: 'C', tokens: ['Bm7b5', 'E7', 'Am7', 'D7', 'G7', 'Cmaj7'], beats: [2, 2, 2, 2, 4, 4], style: 'ballad', caption: '7–3–6–2–5–1 with secondary dominants on 3 and 2.' },

    h('Tritone subs: the chromatic slide'),
    p('Now apply tritone substitution to every other link. E7 becomes **B♭7**; D7 becomes **A♭7**. The chain becomes **B7 – B♭7 – A7 – A♭7 – G7 – C**, and the bass, instead of leaping in 5ths, slides down by half steps: B, B♭, A, A♭, G, and home to C. The functions are exactly the same — every chord is still a dominant leading to the next — but the sound changes from a series of leaps to a smooth chromatic descent. Gospel and R&B players switch between the two versions freely, and mix them.'),
    { t: 'prog', key: 'C', tokens: ['B7', 'Bb7', 'A7', 'Ab7', 'G7', 'Cmaj7'], beats: [2, 2, 2, 2, 4, 4], style: 'ballad', caption: 'Every other link tritone-subbed: dominants sliding down by half steps.' },

    h('Colouring each link'),
    p('Each dominant in the chain takes its colour from where it is going. A dominant resolving to a **minor** chord suits the darker tensions, ♭9 and ♭13: E7♭13 into Am. A dominant resolving to a **major** or another **dominant** chord suits brighter ones, 9 and 13: D13 into G13. Choosing tensions link by link makes the chain sound shaped rather than mechanical, darkening and brightening as it rolls home.'),
    listen([
      { label: 'With colour', music: { prog: ['Bm7b5', 'E7b13', 'Am9', 'D13', 'G13', 'Cmaj9'], key: 'C', beats: [2, 2, 2, 2, 4, 4], style: 'ballad' }, note: 'Bø7 – E7♭13 – Am9 – D13 – G13 – Cmaj9' },
      { label: 'All dominants', music: { prog: ['B7', 'E7', 'A7', 'D7', 'G7', 'Cmaj7'], key: 'C', beats: [2, 2, 2, 2, 4, 4], style: 'ballad' }, note: 'maximum pull at every step' },
    ]),
    p('The bass can add even more motion by walking chromatically between the roots — B, B♭, A, A♭… — even when the chords above are the leaping version, or by approaching each root from a half step below.'),

    h('Aim it anywhere'),
    p('The chain does not have to end on the tonic. Any chord can be the target: pick it, find its dominant (a 5th above), then that chord\'s dominant, and so on as far back as you have room. Then play the chain forwards into the target.'),
    example('Back-cycle into any chord', [
      'Target: Am7 (vi in C). Its V is E7, the V of that is B7, and the V of that is F♯7.',
      'Play them in reverse on the beats before the target: F♯7 – B7 – E7 – Am7, two beats each.',
      'Swap any link for its tritone sub (B7 → F7) and the bass turns chromatic: F♯7 – F7 – E7 – Am7.',
    ], { prog: ['F#7', 'F7', 'E7', 'Am7'], key: 'C', beats: 2, style: 'ballad' }),
    example('A gospel ending with 3–6–2–5–1', [
      'The song arrives on C. Instead of stopping, the band plays E7 – A7 – D7 – G7, two beats each.',
      'Colour the minor-bound link darker and the others brighter: E7♭13 – A13 – D9 – G13.',
      'Land on Cmaj9 — or tag it: play the chain again, and again, before the final arrival.',
    ], { prog: ['Cmaj9', 'E7b13', 'A13', 'D9', 'G13', 'Cmaj9'], key: 'C', beats: [4, 2, 2, 2, 2, 4], style: 'ballad' }),
    onRecord('Listen for the 7–3–6 at the ends of gospel songs and in R&B ballads, where the band suddenly fills the last bars with a rolling chain of dominants before the final chord. It is also a favourite of gospel organists during a "shout", cycling the chain at high speed.'),
    ear('The 7–3–6 sounds like the harmony is rolling downhill towards home, gathering speed. If the bass leaps in 5ths, you are hearing the dominant chain; if it slides down by half steps, tritone subs are mixed in. Either way, every chord sounds like it is leaning into the next.'),
    tryIt('Play B7 – E7 – A7 – D7 – G7 – C, two beats per chord, then the tritone-sub version, B7 – B♭7 – A7 – A♭7 – G7 – C. Then aim the chain at other targets: back-cycle three chords into F, into Am and into Dm. Finally, add tensions to each link according to its target.'),
    recap([
      'The gospel 7–3–6–2–5–1 is a chain of roots each falling a 5th, from degree 7 to the tonic.',
      'Turn any link into a dominant and it becomes the V of the next chord: B7 – E7 – A7 – D7 – G7 – C.',
      'Tritone-sub every other link for a chromatic bass: B7 – B♭7 – A7 – A♭7 – G7 – C.',
      'Colour each link by its target: ♭9/♭13 before minor chords, 9/13 before major or dominant ones.',
      'Back-cycle from any target chord, and use the chain for endings, turnarounds and tags.',
    ]),
    drill('gym.secondary', 3),
  ],
  drills: ['gym.secondary', 'jazz.tritone', 'ear.prog.soul'],
};
