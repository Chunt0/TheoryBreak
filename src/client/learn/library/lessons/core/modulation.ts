import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const modulation: Lesson = {
  id: 'core.modulation',
  title: 'Modulation & tonicisation',
  tags: ['core', 'jazz', 'bach'],
  level: 3,
  summary: 'The difference between visiting a key and moving there, and the main ways music changes key: pivot chords, ii–Vs, common tones, direct shifts and chromatic slides.',
  blocks: [
    p('Very little music stays in one key from start to finish. A Bach invention travels to the dominant and back; a jazz standard might pass through four or five keys in thirty-two bars; a pop song may lift up a half step for its final chorus. Changing key is called **modulation**, and it is one of the main ways music creates a sense of journey — leaving home, travelling, and coming back.'),
    p('This lesson separates two things that are easy to confuse — briefly pointing at a key and actually moving to it — and then looks at the main techniques for getting from one key to another.'),

    h('Visiting versus moving'),
    p('**Tonicisation** is a short visit. A secondary dominant or a ii–V points at some chord other than the tonic and makes it sound, for a moment, like a temporary home. In C major, A7 – Dm7 makes D minor sound like a tonic for a beat or two, but the music does not settle there. The key is still C; D minor has just been tonicised.'),
    p('**Modulation** is a move. A new tonic is established by a proper cadence, and the music carries on in the new key long enough for it to feel like home. The difference is not a matter of which chords are used — the same A7 – Dm7 could be either — but of what happens afterwards. If the music returns to C straight away, it was a visit. If it cadences in D minor, keeps working in D minor and builds new phrases there, it has modulated.'),
    p('In practice the line is blurry, and that is fine. Analysts sometimes disagree about whether a passage modulates or merely tonicises. The useful question is always the same: where does the music feel like home right now?'),

    h('Pivot chords'),
    p('The smoothest way to change key is through a **pivot chord**: a chord that belongs to both the old key and the new one. The listener hears it as part of the old key, but it is followed by chords that reinterpret it as part of the new key, and the change slips by almost unnoticed.'),
    p('Closely related keys share several chords, which makes pivots easy. C major and G major share C, Em, G and Am. Am is vi in C and ii in G, so a progression can arrive on Am as vi, then continue as if it were ii of G: Am7 – D7 – Gmaj7. The D7 is the giveaway — its F♯ is not in C major — and the cadence on G confirms the new key.'),
    { t: 'prog', key: 'C', tokens: ['Cmaj7', 'Am7', 'D7', 'Gmaj7', 'Gmaj7'], beats: 4, style: 'ballad', caption: 'Pivot: Am7 is vi in C and ii in G; D7 confirms G.' },
    example('Pivot from C major to E minor', [
      'List the chords the two keys share: C, Em, G and Am.',
      'Choose a pivot just before the move: Am, which is vi in C and iv in E minor.',
      'Follow it with B7, the V7 of E minor (its D♯ is the new leading tone), and land on Em: C – Am – B7 – Em.',
    ], { prog: ['C', 'Am', 'B7', 'Em'], key: 'C', beats: 2 }),
    p('Bach\'s modulations are nearly always of this kind, and nearly always to closely related keys: the dominant, the relative minor, the subdominant. Follow the bass line of a chorale and you will often find it cadencing in two or three related keys before the final cadence in the home key.'),

    h('The ii–V: modulation, jazz style'),
    p('Jazz standards often change key with no pivot at all. They simply play a ii–V of the new key, and the ii–V is such a strong signpost that the ear accepts the new tonic immediately. A tune in C can drop a Fm7 – B♭7 into the middle of a phrase and land on E♭maj7 — a key with no chords in common with C major — and it sounds completely natural, because ii–V–I is the most familiar progression in the style.'),
    { t: 'prog', key: 'C', tokens: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7', 'Fm7', 'Bb7', 'Ebmaj7', 'Ebmaj7'], beats: 4, style: 'swing', caption: 'A ii–V up a minor 3rd: no shared chord, the ii–V does all the work.' },
    onRecord('Standards change key every few bars using ii–Vs. The bridge of "Have You Met Miss Jones" moves through keys a major 3rd apart (B♭, G♭, D); "Tune Up" falls by whole steps, with a ii–V–I in each key; "All the Things You Are" passes through several keys in its first sixteen bars. Hear each ii–V as a signpost and the key of the moment is never in doubt.'),
    p('This changes how you should read a jazz chart. Rather than trying to find one key for the whole tune, look for the ii–Vs and treat each one as a statement of a local key. Most standards make sense as a series of short visits and moves between keys, linked by ii–Vs.'),

    h('Common tones, direct shifts and chromatic slides'),
    p('Three other techniques produce more dramatic effects.'),
    p('A **common-tone modulation** holds one note while the harmony underneath changes to a chord from a distant key. C major to A♭ major share only the note C, but if C is held on top while the chord shifts from C major to A♭ major, the move sounds sudden yet bound together. This kind of shift between keys a major 3rd apart was a favourite of Romantic composers and remains a staple of film scores.'),
    p('A **direct modulation** simply starts in the new key, usually after a cadence or at the start of a new section, with no preparation at all. The most famous version is the "truck driver\'s gear change" of pop music: the last chorus lifts up a half step or a whole step for extra energy. It is not subtle, but it is effective, especially if the new key is announced by its dominant just before.'),
    p('A **chromatic modulation** moves one or more voices by half step into the new key\'s dominant. It is smoother than a direct shift and more surprising than a pivot, and it is common in Romantic music and in gospel, where whole progressions can slide up by half steps to build intensity.'),
    listen([
      { label: 'Common tone C → A♭', music: { voicings: [['C3', 'E4', 'G4', 'C5'], ['Ab2', 'Eb4', 'Ab4', 'C5']], beat: 1.4 }, note: 'C held on top' },
      { label: 'Up a half step', music: { prog: ['C', 'G7', 'C', 'Ab7', 'Db'], key: 'C', beats: 2 }, note: 'the last-chorus lift, announced by its dominant' },
      { label: 'Chromatic C → D', music: { voicings: [['C3', 'E4', 'G4', 'C5'], ['A2', 'E4', 'G4', 'C#5'], ['D3', 'F#4', 'A4', 'D5']], beat: 1.3 }, note: 'the top C slides to C♯, turning the chord into A7, the dominant of D' },
    ]),
    table(['Method', 'How', 'Sound'], [
      ['Pivot chord', 'a chord in both keys changes meaning (Am = vi in C = ii in G)', 'seamless'],
      ['ii–V', 'a ii–V of the new key, no shared chord needed', 'the jazz way: Dm7 G7 C → Fm7 B♭7 E♭'],
      ['Common tone', 'one held note belongs to both tonic chords (C major → A♭ major on C)', 'sudden but bound'],
      ['Direct', 'start in the new key after a cadence', 'a gear change'],
      ['Chromatic', 'a voice moves by half step into the new dominant', 'smooth, Romantic'],
    ]),

    h('How far is the new key?'),
    p('The circle of fifths tells you how far a modulation travels. Moving to a neighbouring key changes one note and sounds like a gentle shift of perspective; moving to a key opposite on the circle changes most of the notes and sounds like a new world. Keys a 3rd apart sit in between — distant on the circle, but often sharing a common tone, which is why they suit common-tone shifts so well.'),
    p('Different styles prefer different distances. Bach mostly visits closely related keys and saves distant ones for moments of drama. Jazz standards love keys a major 3rd or a whole step apart, reached through ii–Vs. Pop songs often lift up a half or whole step near the end. Knowing the habits of a style tells you what to expect, and makes the surprises easier to spot.'),
    ear('When you suspect a key change, listen for two things: a new leading tone (an accidental that keeps appearing a half step below a new note) and a cadence that lands somewhere other than home. If both are there and the music stays, it has modulated.'),
    tryIt('Play Cmaj7 – Am7, then continue with D7 – Gmaj7, and notice how the Am7 changes meaning after the fact. Then play Dm7 – G7 – Cmaj7 followed straight away by Fm7 – B♭7 – E♭maj7, and the same with E♭m7 – A♭7 – D♭maj7. Each time, say the key of the moment out loud as soon as you hear its ii–V.'),
    recap([
      'Tonicisation is a visit (a secondary dominant or ii–V points at a chord); modulation is a move confirmed by a cadence.',
      'A pivot chord belongs to both keys and is reinterpreted (Am: vi in C, ii in G).',
      'Jazz modulates with ii–Vs alone; read a chart as a series of local keys marked by ii–Vs.',
      'Common-tone, direct and chromatic modulations give sudden, bold or sliding changes of key.',
      'The circle of fifths measures distance: neighbours sound close, opposites like a new world.',
    ]),
    drill('jazz.keycenter', 3),
  ],
  drills: ['jazz.keycenter', 'jazz.analysis'],
};
