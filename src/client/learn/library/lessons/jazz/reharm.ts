import type { Lesson } from '../../types';
import { drill, example, h, listen, onRecord, p, recap, table, tryIt, writing } from '../blocks';

export const reharm: Lesson = {
  id: 'jazz.reharm',
  title: 'Reharmonisation toolkit',
  tags: ['jazz', 'soul'],
  level: 3,
  summary: 'Changing the chords under a melody you keep: the one rule that matters, eight techniques that recolour a tune without breaking it, and a method for putting them together.',
  blocks: [
    p('**Reharmonisation** means keeping a melody and changing the chords underneath it. Jazz musicians do it all the time: arrangers give a familiar standard a fresh colour, pianists accompanying a singer vary the harmony from chorus to chorus, and soloists imply substitutions in their lines. A good reharmonisation can make a well-worn tune sound new, darker, brighter, more modern or more urgent — while every listener can still sing along.'),
    p('This lesson brings together techniques from across the jazz path into a single toolkit, and offers a method for using it. The tools are not new; what is new is choosing between them with a melody in mind.'),

    h('The one rule'),
    p('Everything in reharmonisation depends on one constraint: **the melody note must fit the new chord.** Specifically, each important melody note — the long notes and the notes on strong beats — must be either a chord tone or an available tension of the chord you put under it. Short passing notes are more forgiving, but the notes the melody leans on are not.'),
    p('This turns reharmonisation into a search with clear limits. For any melody note there are many possible chords, and the job is to find ones that contain the note in a good position and that connect well to the chords around them.'),
    example('Which chords can sit under a held G (in C)?', [
      'Cmaj7: G is the 5th. Em7 (iii for I): G is its ♭3. Am7 (vi): G is its ♭7. All fine.',
      'A♭maj7 (♭VI, borrowed): G is its major 7th — darker, still consonant.',
      'E7 (V7/vi): G is its ♯9 — usable only as an altered dominant that goes on to Am. The rule holds: the melody note must be a chord tone or an available tension of the new chord.',
    ], { voicings: [['C3', 'E3', 'B3', 'G4'], ['E3', 'B3', 'D4', 'G4'], ['A2', 'E3', 'C4', 'G4'], ['Ab2', 'Eb3', 'C4', 'G4'], ['E2', 'D3', 'G#3', 'G4']], beat: 1.2 }),

    h('Eight techniques'),
    p('The techniques fall into a few families: swapping chords for others with the same job, adding motion, recolouring dominants, and approaching chords from unexpected directions.'),
    p('**1. Diatonic substitution.** Replace a chord with another from the same function family: iii or vi for I, ii for IV. Em7 for Cmaj7 keeps the tonic feel but darkens it and changes the bass. This is the gentlest reharmonisation there is.'),
    p('**2. Related ii.** Put the ii chord in front of a dominant: G7 becomes Dm7 – G7. It adds a predominant step and more harmonic motion, and it works in front of secondary dominants too.'),
    p('**3. Backcycling.** Work backwards from a target, inserting dominants a 5th above each chord: G7 becomes D7 – G7, then A7 – D7 – G7. Each added dominant pulls into the next, building momentum towards the cadence.'),
    p('**4. Tritone substitution.** Replace a dominant with the one a tritone away: G7 becomes D♭7. The function stays, the bass becomes chromatic, and the colour turns darker and more sophisticated.'),
    p('**5. Backdoor dominant.** Replace V7 – I with iv7 – ♭VII7 – I: G7 – C becomes Fm7 – B♭7 – C. Borrowed from the parallel minor, it approaches the tonic from a whole step below, softly.'),
    p('**6. Passing diminished chords.** Fill the gap between two chords a whole step apart with a diminished 7th: Cmaj7 – Dm7 becomes Cmaj7 – C♯°7 – Dm7. The bass climbs chromatically and the diminished chord acts as a rootless secondary dominant.'),
    p('**7. Chromatic planing.** Approach a chord or a ii–V from a half step above or below by sliding the same chord type: before Dm7 – G7, play E♭m7 – A♭7. It is a moment of controlled "outside" colour that resolves as soon as the real ii–V arrives.'),
    p('**8. Pedal point.** Hold the bass on one note while the chords above change: Dm7/G – G7, or a tonic pedal under a whole turnaround. The held bass creates tension that is released when the bass finally moves.'),
    table(['Technique', 'Example', 'Why it works'], [
      ['Diatonic sub', 'Cmaj7 → Em7 / Am7', 'shared notes, same function'],
      ['Related ii', 'G7 → Dm7 G7', 'predominant preparation'],
      ['Backcycling', 'G7 → D7 G7 → A7 D7 G7', 'extended dominants'],
      ['Tritone sub', 'G7 → D♭7', 'shared tritone, chromatic bass'],
      ['Backdoor', 'G7 → Fm7 B♭7 (→ C)', 'borrowed iv–♭VII'],
      ['Passing °7', 'Cmaj7 Dm7 → Cmaj7 C♯°7 Dm7', 'rootless V7♭9, chromatic bass'],
      ['Chromatic planing', 'Dm7 G7 → E♭m7 A♭7 Dm7 G7', 'approach the cadence from a half step above'],
      ['Pedal point', 'Dm7/G – G7', 'tension over a held bass'],
    ]),
    p('To these you can add the colour tools from earlier lessons: **modal interchange** (a minor iv6 or a ♭VImaj7 for a sudden shadow), **altered tensions** on dominants, **upper-structure** and **hybrid** voicings, and even **Coltrane cycles** for a bold re-routing of a ii–V–I.'),

    h('A method'),
    p('1. **Learn the melody and the original changes thoroughly.** You cannot recolour a tune you do not know.\n2. **Mark the structural points** — the cadences at the ends of phrases and sections. These usually stay recognisable; listeners hear them as the shape of the tune.\n3. **Decide what you want.** More motion? A darker mood? A smoother bass line? A more modern sound? The goal tells you which tools to reach for.\n4. **Try options under each important melody note**, checking each against the rule. Hold the melody note in one hand and try chords under it with the other.\n5. **Play it through and judge it as music.** Does the bass line make sense? Does the harmony support the melody\'s phrasing? Does it still sound like the tune?'),
    p('The last step matters most. A reharmonisation that changes every chord can easily smother the melody; often the best results come from changing just a few chords at key moments and leaving the rest alone.'),
    example('Reharmonise five bars in C', [
      'Original: | Cmaj7 | Cmaj7 | Dm7 | G7 | Cmaj7 |, melody G, E, F, D, C — one long note per bar.',
      'Bar 1: Em7 for Cmaj7 (G is its ♭3). Bar 2: A7 (E is its 5th) — a secondary dominant pointing at Dm7. Bar 3: keep Dm7 (F is its ♭3).',
      'Bar 4: a backdoor instead of G7 — Fm7 – B♭7, where the melody D is the 13th of Fm7 and the 3rd of B♭7. Bar 5: Cmaj7, with C as the root.',
      'Result: | Em7 | A7 | Dm7 | Fm7 B♭7 | Cmaj7 |. Every melody note still fits, the start and the arrival are unchanged, and the journey between them is richer.',
    ], { prog: ['Em7', 'A7', 'Dm7', 'Fm7', 'Bb7', 'Cmaj7'], key: 'C', beats: [4, 4, 4, 2, 2, 4], style: 'ballad' }),
    listen([
      { label: 'Original', music: { prog: ['Cmaj7', 'Cmaj7', 'Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 4, style: 'ballad' }, note: 'plain and clear' },
      { label: 'Reharmonised', music: { prog: ['Em7', 'A7', 'Dm7', 'Fm7', 'Bb7', 'Cmaj7'], key: 'C', beats: [4, 4, 4, 2, 2, 4], style: 'ballad' }, note: 'the same melody, a richer journey' },
    ]),
    writing('Reharmonise *against the melody*: every important melody note must be a chord tone or an available tension of the new chord. Hold the melody note with one hand and try new chords under it with the other.'),
    onRecord('Listen to several recordings of the same standard by different pianists or arrangers. The melody stays recognisable every time, but the chords underneath can vary enormously — and comparing them is the quickest way to build your own toolkit.'),
    tryIt('Take the A section of a standard you know. Reharmonise it five times, each time using just one technique: a diatonic sub, a secondary dominant with its ii, a tritone sub, a backdoor, a passing diminished chord. Check every melody note against the rule. Then combine your favourite moves into one version.'),
    recap([
      'Reharmonisation keeps the melody and changes the chords under it.',
      'The rule: every important melody note must be a chord tone or available tension of the new chord.',
      'Tools: diatonic subs, related iis, backcycling, tritone subs, backdoor dominants, passing diminished chords, chromatic planing, pedal points — plus modal interchange and altered colour.',
      'Keep the structural cadences recognisable; decide what effect you want before choosing tools.',
      'Judge the result by ear — often changing a few chords is better than changing all of them.',
    ]),
    drill('jazz.analysis', 3),
  ],
  drills: ['jazz.analysis', 'jazz.tritone', 'gym.interchange', 'jazz.concepts'],
};
