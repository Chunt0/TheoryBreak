import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const syncopation: Lesson = {
  id: 'rhythm.syncopation',
  title: 'Syncopation, ties & anticipations',
  tags: ['rhythm', 'funk'],
  level: 1,
  summary: 'Accents where the beat is not: off-beats, pushes, notes tied over the beat and the bar line, anticipations and displacement — and how to count all of them so they land exactly.',
  blocks: [
    p('A rhythm that falls only on the beats sounds like marching. What makes jazz swing, funk groove and Latin music dance is **syncopation**: putting accents where the beat is not. The pulse keeps going — in the drums, in the bass, in the listener\'s body — while the music leans against it, anticipates it, or leaves it conspicuously empty. That tension between the steady beat and the accents that pull against it is the source of rhythmic energy in almost every style in this library.'),
    p('This lesson describes the main kinds of syncopation and shows how to count them, so that you can read, play and hear them precisely.'),

    h('On the beat and off it'),
    p('Start with the simplest contrast. Notes on the beats — 1, 2, 3, 4 — sound stable and grounded. Notes on the "&"s, halfway between the beats, sound light and buoyant, because they fall where the pulse is weakest. A rhythm that accents the "&"s and leaves some beats silent immediately sounds syncopated: the accent seems to fall off the pulse, and the ear has to keep the beat going on its own.'),
    { t: 'rhythm', cells: ['1000', '1000', '1000', '1000'], bpm: 90, caption: 'On the beat: 1 2 3 4.' },
    { t: 'rhythm', cells: ['1010', '0010', '1010', '0010'], bpm: 90, caption: 'Off-beat 8ths: beats 2 and 4 are left silent and their "&"s carry the accent.' },

    h('Ties and the silent beat'),
    p('Syncopation becomes much stronger when an off-beat note is **held through** the beat that follows. In written music, this is shown with a **tie** — a curved line joining two notes so that they sound as one longer note. A note on the "&" of 2, tied over beat 3, means that beat 3 is not played at all; the note that would have marked it has already sounded half a beat early. The beat is still there, but it is **felt, not played**, and that silence is what gives the rhythm its kick.'),
    p('Musicians call a short accented hit on the "&" before a beat a **push**. Big-band arrangements are full of pushes — the whole brass section hitting on the "&" of 4 — and so is funk, where a band hit on the "&" of a beat, followed by silence on the beat itself, is one of the most exciting sounds in the style.'),
    { t: 'rhythm', cells: ['1000', '0010', '0000', '1000'], bpm: 90, caption: 'The push: the "&" of 2 held through beat 3. Beat 3 is felt, not played.' },

    h('Anticipations'),
    p('An **anticipation** is a syncopation that arrives early for something important — usually a chord change or the downbeat of a new bar. Instead of the new chord landing on beat 1, it arrives on the "&" of 4 in the previous bar and is held over the bar line. The harmony changes half a beat early, and the downbeat itself is silent.'),
    p('This is the normal way jazz, pop and R&B phrase chord changes and melodies: a singer\'s line that "pushes" into a new bar, a comping pattern that hits each new chord on the "&" before it. Played exactly on the beat, the same changes would sound stiff. It is closely related to the anticipation in classical counterpoint, where a melody note of the next chord sounds early; here the whole chord does.'),
    example('Count a push over the bar line', [
      'Count 8ths: "1 & 2 & 3 & 4 &".',
      'Play on 1, then on the "&" of 4, and hold it through the next 1.',
      'The next bar\'s chord now arrives an 8th early: an anticipation, the usual way jazz and pop phrase a chord change.',
    ]),

    h('Displacement'),
    p('A more advanced kind of syncopation takes a whole figure and shifts it by an 8th or a 16th. The notes and their spacing stay the same, but every accent lands in a new place relative to the beat, and the figure takes on a completely different character. This is called **rhythmic displacement**. Drummers and improvisers use it to play with the listener\'s sense of where the beat is — a phrase that starts on the "&" instead of the beat can sound as if it has been turned inside out.'),
    table(['Device', 'Where', 'Count it'], [
      ['Off-beat', 'on the "&"', '"1 & 2 &…", accent the &s'],
      ['Push', 'a hit on the "&" before a beat', 'big-band kicks, funk hits'],
      ['Tie over the beat', 'an off-beat note held through the next beat', 'that beat is felt, not played'],
      ['Anticipation', 'an off-beat note tied into a strong beat', 'the change arrives an 8th early, on the "&" of 4'],
      ['Displacement', 'a figure shifted by an 8th or a 16th', 'same notes, new accents'],
    ]),
    example('Displace a figure by an 8th', [
      'Start with a simple figure on the beats: hits on 1, 2 and 3, then silence on 4.',
      'Shift every note an 8th later: hits on the "&" of 1, the "&" of 2 and the "&" of 3.',
      'The spacing is identical, but now every hit is off the beat and beat 1 is empty — the same idea sounds restless and syncopated.',
    ]),

    h('Keeping the pulse'),
    p('All syncopation depends on one thing: the pulse must stay absolutely steady underneath it. If you rush the off-beat notes, or let the silent beats shrink, the syncopation collapses into a confused rhythm. That is why counting matters so much when learning syncopated parts, and why it helps to keep the beat physically — a foot, a nod — while playing. The steadier the pulse, the more the syncopation can pull against it.'),
    onRecord('Listen for anticipations in the vocal line of almost any soul or R&B song: the singer arrives on a new word just before the downbeat and holds through it. In big-band jazz, listen for the brass hitting on the "&" of 4 and the drummer setting it up with a fill.'),
    ear('When a rhythm feels exciting but hard to pin down, find the beat first, then ask which slots the accents fall on. Is beat 1 played, or felt? Are the accents on the "&"s? Do notes arrive just before the beats and hold through them? Naming the slots makes even a complex syncopation easy to copy.'),
    tryIt('Count 8ths out loud and tap each pattern above, keeping your foot on the beats. Then take a simple four-chord progression and play each new chord on the "&" of 4 of the previous bar, holding it over the bar line. The Rhythm drill under Ear has syncopated bars to tap.'),
    recap([
      'Syncopation puts accents where the beat is not — on the "&", "e" or "a" — while the pulse continues underneath.',
      'A tie holds an off-beat note through the next beat, so that beat is felt rather than played.',
      'A push is a short hit on the "&" before a beat; an anticipation brings a chord or downbeat in an 8th early.',
      'Displacement shifts a whole figure by an 8th or 16th, changing every accent.',
      'Keep the pulse rock-steady; count, and keep the beat in your body, while you play.',
    ]),
    drill('rhythm.tap.sync', 3),
  ],
  drills: ['rhythm.tap.sync', 'rhythm.tap.16'],
};
