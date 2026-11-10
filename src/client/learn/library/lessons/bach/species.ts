import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const species: Lesson = {
  id: 'bach.species',
  title: 'Two voices: note against note',
  tags: ['bach'],
  level: 1,
  summary: 'The first step in counterpoint: two lines, one note against one, using only consonances. The four kinds of motion, why parallel 5ths are avoided, and how to shape a line that sings.',
  blocks: [
    p('**Counterpoint** is the art of combining melodic lines so that each one makes sense on its own and they also sound good together. It is the foundation of Bach\'s music — a chorale, an invention and a fugue are all, at heart, several melodies woven together — and its principles reach far beyond the Baroque. Every time a jazz pianist moves the guide tones smoothly through a ii–V–I, or a bass line moves against a melody in a soul ballad, counterpoint is at work.'),
    p('The traditional way to learn it is step by step, starting with just two voices, one note against one. The method goes back to Johann Joseph Fux\'s textbook *Gradus ad Parnassum* (1725), from which generations of composers learned their craft. This lesson covers that first step, which teachers call **first species**.'),

    h('Consonance and dissonance'),
    p('In first-species counterpoint, every vertical interval — every pair of notes sounding together — must be a **consonance**. The consonances fall into two groups with quite different characters.'),
    p('The **perfect consonances** are the unison, the 5th and the octave. They are the most blended, stable intervals, but also the most hollow: the two voices nearly merge into one sound. They make good beginnings and endings, where stability is wanted, but too many of them make two-part writing sound empty.'),
    p('The **imperfect consonances** are the 3rd and the 6th, major or minor. They are full, sweet and rich, and they keep the music moving, because they sound pleasant but not final. Good two-part writing uses mostly imperfect consonances, framed by perfect ones at the ends.'),
    p('Everything else is a **dissonance** — 2nds, 7ths, the tritone, and, perhaps surprisingly, the perfect 4th. On its own a 4th sounds fine, but above the lowest voice it sounds unstable, as if it wants to resolve (it is the same instability as the 6/4 chord in the triads lesson). In two-voice counterpoint, where the lower voice is the bass, the 4th counts as a dissonance. Dissonances are introduced in later species, under careful control.'),

    h('Four kinds of motion'),
    p('As two voices move from one pair of notes to the next, they can move in four ways relative to each other.'),
    table(['Motion', 'The two voices', 'Rule of thumb'], [
      ['Contrary', 'move in opposite directions', 'best: the lines stay independent'],
      ['Oblique', 'one holds, one moves', 'good'],
      ['Similar', 'same direction, different intervals', 'fine, but not into a 5th or octave in the outer voices'],
      ['Parallel', 'same direction, same interval', '3rds and 6ths: a few in a row; 5ths and octaves: never'],
    ]),
    p('**Contrary motion** is the backbone of good counterpoint. When the voices move in opposite directions, each keeps its own identity; the ear hears two lines. **Parallel motion** is the opposite: the voices move together, keeping the same interval. Parallel 3rds and 6ths sound sweet, and a few in a row are lovely — but a long string of them makes the lower voice sound like a mere shadow of the upper one.'),

    h('Why parallel 5ths and octaves are avoided'),
    p('The most famous rule in counterpoint forbids **parallel 5ths and octaves**: two voices moving in the same direction from one perfect 5th to another, or from one octave to another. The reason is not that the sound is unpleasant. It is that perfect intervals blend so completely that two voices moving in parallel 5ths or octaves fuse into a single, thickened line. The independence that counterpoint exists to create disappears for that moment.'),
    p('Rock power chords and medieval organum use parallel 5ths deliberately, for exactly that fused, hollow sound. In Bach\'s style, though, where every voice should be heard as an individual, they are avoided. A related rule applies to the outer voices: do not move into a 5th or an octave by **similar motion** (both voices going the same way), because the ear hears a "hidden" parallel.'),
    listen([
      { label: 'Parallel 5ths', music: { voicings: [['C3', 'G3'], ['D3', 'A3'], ['E3', 'B3'], ['F3', 'C4']], beat: 0.7 }, note: 'hollow: the lines fuse' },
      { label: 'Parallel 6ths', music: { voicings: [['C3', 'A3'], ['D3', 'B3'], ['E3', 'C4'], ['F3', 'D4']], beat: 0.7 }, note: 'sweet, but the lower voice shadows the upper' },
      { label: 'Mostly contrary', music: { voicings: [['C3', 'C4'], ['D3', 'B3'], ['E3', 'G3'], ['F3', 'A3'], ['E3', 'C4'], ['D3', 'B3'], ['C3', 'C4']], beat: 0.7 }, note: 'two independent lines' },
    ]),

    h('Shaping a good line'),
    p('Counterpoint is not only about the intervals between the voices; each line must also be a good melody in its own right. A few principles describe what that means.'),
    p('- **Move mostly by step.** Stepwise motion is smooth and singable; leaps add interest but should be used sparingly.\n- **Balance a leap with a step back.** After a leap, move by step in the opposite direction, filling in the gap. This is how most good melodies behave.\n- **Give the line one high point.** A single climax gives a melody shape and direction; repeated peaks make it aimless.\n- **Begin and end on perfect consonances.** Start on a unison, 5th or octave, and end on a unison or octave on the tonic.\n- **Approach the final note by step from both sides.** The classic ending is a 6th expanding to an octave, with the upper voice rising by step (the leading tone going up to the tonic) and the lower voice falling by step to the tonic.'),
    {
      t: 'staff',
      chords: [
        { notes: ['C3', 'C4'], label: '8' }, { notes: ['D3', 'B3'], label: '6' }, { notes: ['E3', 'G3'], label: '3' },
        { notes: ['F3', 'A3'], label: '3' }, { notes: ['E3', 'C4'], label: '6' }, { notes: ['D3', 'B3'], label: '6' }, { notes: ['C3', 'C4'], label: '8' },
      ],
      caption: 'Note against note: perfect consonances at the ends, imperfect ones in between.',
    },
    example('Check a two-voice phrase', [
      'Name every vertical interval: 8 6 3 3 6 6 8.',
      'Check each neighbouring pair: is there ever a move from one perfect interval to another with both voices going the same way? No — so no parallels.',
      'The ending 6 → 8 has the upper voice B → C and the lower D → C: contrary motion into the final octave.',
    ], { voicings: [['C3', 'C4'], ['D3', 'B3'], ['E3', 'G3'], ['F3', 'A3'], ['E3', 'C4'], ['D3', 'B3'], ['C3', 'C4']], beat: 0.75 }),
    example('Write a line above C – D – F – E – D – C', [
      'Start on an octave: C above C. Against D, move down to B — a 6th, in contrary motion.',
      'Against F, step down to A (a 3rd, contrary again); against E, leap up to C (a 6th), then step back down to B against D (a 6th — two parallel 6ths are fine).',
      'End on C against C: the 6th expands to an octave, B rising, D falling. Intervals 8 6 3 6 6 8; upper line C B A C B C — mostly steps, one small leap balanced by a step back. (It touches C three times, so C is a ceiling rather than a single peak: fine in six notes, but in a longer line aim for one clear high point.)',
    ], { voicings: [['C3', 'C4'], ['D3', 'B3'], ['F3', 'A3'], ['E3', 'C4'], ['D3', 'B3'], ['C3', 'C4']], beat: 0.75 }),

    h('Why start here'),
    p('First species can feel restrictive — no dissonance, no rhythm, just one note against one. But that is exactly its value. With everything else stripped away, you can hear clearly what makes two lines independent and what makes them sound good together. The later species add rhythm (two notes against one), dissonance (passing notes and suspensions) and freedom, and four-part harmony applies the same principles to four voices at once. Everything from a Bach chorale to a smooth jazz voicing rests on these few ideas.'),
    ear('Listen to two-part music by following the lower voice instead of the upper. If it sounds like a real melody, moving independently and often against the upper part, the counterpoint is good. If it seems to shadow the upper voice, you are probably hearing a lot of parallel motion.'),
    tryIt('Play the lower line C – D – F – E – D – C with your left hand and write your own upper line against it, one note per note. Check every interval (only 1, 3, 5, 6, 8), check every move for parallel 5ths and octaves, and finish with a 6th opening to an octave. Then try writing the counterpoint below the line instead.'),
    recap([
      'Counterpoint combines independent lines; first species sets one note against one, using only consonances.',
      'Perfect consonances (1, 5, 8) are stable but hollow; imperfect ones (3, 6) are full and keep the music moving. The 4th above the bass counts as a dissonance.',
      'Contrary motion keeps voices independent; parallel 3rds and 6ths are fine in moderation; parallel 5ths and octaves fuse the voices and are avoided.',
      'Good lines move mostly by step, balance leaps with steps back, and have one high point.',
      'Begin and end on perfect consonances; end with a 6th opening to an octave by step.',
    ]),
    drill('ear.motion', 3),
  ],
  drills: ['ear.motion', 'bach.vl', 'bach.concepts'],
};
