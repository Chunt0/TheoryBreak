import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt, writing } from '../blocks';

export const soulReharm: Lesson = {
  id: 'soul.reharm',
  title: 'Reharmonising a melody, R&B style',
  tags: ['soul', 'jazz'],
  level: 3,
  summary: 'Keep the tune and change what is under it: one melody note over six different chords, three moves that sound instantly R&B, and how to choose a path that still goes somewhere.',
  blocks: [
    p('An R&B arranger has a familiar problem. The song\'s melody is set; the singer will sing it the same way in every verse and chorus. But the second verse should feel deeper than the first, the bridge should lift, and the final chorus should feel like an event. One of the most powerful ways to achieve that — used constantly in gospel, soul and R&B — is to **reharmonise**: to keep the melody exactly as it is and change the chords underneath it.'),
    p('The jazz reharmonisation lesson set out the general toolkit. This lesson focuses on the moves that give R&B and gospel their particular sound, and on the single idea that makes reharmonisation work: one melody note can mean many different things.'),

    h('The rule'),
    p('The rule is the same in every style: **each important melody note must be a chord tone or a usable tension of the new chord**. The long notes and the notes on strong beats are the ones that matter; short passing notes are more forgiving. Within that rule, there is enormous freedom.'),

    h('One note, six meanings'),
    p('Take a melody note E in the key of C. Under a plain C chord it is the 3rd — bright and simple. But plenty of other chords also contain E, and in each it plays a different role and takes on a different colour.'),
    table(['Chord under a melody E (key of C)', 'E is its…', 'Colour'], [
      ['C', '3rd', 'the original, plain'],
      ['Am7', '5th', 'softer, minor'],
      ['Fmaj7', 'major 7th', 'lush'],
      ['Em7', 'root', 'plain, a little sad'],
      ['D9', '9th', 'bright, wants to go to G'],
      ['B♭7♯11', '♯11', 'dark: the backdoor colour'],
    ]),
    listen([
      { label: 'One E, six chords', music: { voicings: [['C3', 'G3', 'E4'], ['A2', 'G3', 'C4', 'E4'], ['F2', 'A3', 'C4', 'E4'], ['E2', 'D3', 'G3', 'E4'], ['D2', 'C3', 'F#3', 'E4'], ['Bb1', 'Ab3', 'D4', 'E4']], beat: 1.3 }, note: 'the same top note, a new colour each time' },
    ]),
    p('Listen to how the same E seems to change: settled over C, wistful over Am7, glowing over Fmaj7, bright and expectant over D9, dark and sophisticated over B♭7♯11. That is the heart of reharmonisation. The singer does nothing different, but the listener hears the melody in a new light.'),

    h('Choosing a path'),
    p('Picking good chords for each note is only half the job; the chords also have to make sense **in sequence**. The most reliable guide is the **bass line**. A reharmonisation whose bass moves by step, or by strong root motion like falling 5ths, will sound purposeful even when the chords are unexpected. One whose bass jumps around at random will sound like a list of chords.'),
    example('Reharmonise a held E in C', [
      'The melody holds E for four bars. Chords that carry it: C, Am7, Fmaj7, Em7, D9, B♭7♯11.',
      'Choose a path that still goes somewhere: Cmaj7 → B♭7♯11 → Am7 → D9. The bass falls C – B♭ – A, then rises a 4th to D.',
      'Every chord changes what the same E means; the melody seems to glow differently on each.',
    ], { voicings: [['C3', 'B3', 'E4'], ['Bb2', 'Ab3', 'D4', 'E4'], ['A2', 'G3', 'C4', 'E4'], ['D3', 'F#3', 'C4', 'E4']], beat: 1.4 }),
    p('The other guide is the song\'s **structure**. Keep the main cadences recognisable — the moments where phrases end and sections turn — and reharmonise more freely in between. A listener will follow almost any journey if they arrive at the familiar places at the right times.'),

    h('Three moves that sound instantly R&B'),
    p('**Plane.** When the melody moves by step, harmonise it with a single chord type moving in parallel with it — all m9 chords, or all maj9 chords — so that each melody note sits in the same position in each chord. It gives a smooth, sliding, unmistakably neo-soul sound.'),
    p('**Approach from a half step above.** Precede any target chord with a chord a half step higher: a dominant (D♭7 into C, the tritone sub) or the same chord type (D♭maj9 into Cmaj9). The approach chord lasts a beat or two and slides into the target. Check that the melody note fits the approach chord too, or place the approach between melody notes.'),
    p('**Darken the IV.** Under a held melody note, turn the IV chord minor — Fmaj7 to Fm6 — borrowing from the parallel minor. If the melody note is C or F, which belong to both chords, it stays perfectly in place while the harmony underneath sighs. It is one of the most emotional moves available, and a gospel favourite.'),
    { t: 'prog', key: 'C', tokens: ['Cmaj7', 'Am7', 'Fmaj7', 'G7'], beats: 4, style: 'ballad', caption: 'Plain: I – vi – IV – V.' },
    { t: 'prog', key: 'C', tokens: ['Cmaj9', 'Am9', 'Fmaj9', 'Fm6', 'Em7', 'A7b13', 'Dm9', 'Db9'], beats: [4, 4, 2, 2, 2, 2, 2, 2], style: 'ballad', caption: 'Reharmonised: ninths, IV → iv, iii – VI7, and D♭9 (a tritone sub) back to I.' },
    example('Read the reharmonised version', [
      'Cmaj9 and Am9: the same I and vi, with 9ths for R&B colour.',
      'Fmaj9 – Fm6: the IV darkens to iv halfway through the bar. Em7 – A7♭13: iii and a secondary dominant pointing at ii.',
      'Dm9 – D♭9: the ii, then a tritone sub instead of G7, sliding down a half step into the C at the top.',
    ], { prog: ['Cmaj9', 'Am9', 'Fmaj9', 'Fm6', 'Em7', 'A7b13', 'Dm9', 'Db9', 'Cmaj9'], key: 'C', beats: [4, 4, 2, 2, 2, 2, 2, 2, 4], style: 'ballad' }),

    h('Where to use it'),
    p('Reharmonisation works best when it is placed with care. A common plan is to play the first verse and chorus with the original changes, reharmonise the second verse more richly, open up the bridge, and save the boldest colours — or a key change — for the final chorus and the ending. Gospel endings in particular are a playground: a coloured amen (IV – iv – I), a 7–3–6 chain, or a tag that repeats the last line over a new progression each time.'),
    writing('Hold the melody note in one hand and try chords under it with the other, checking each against the rule. Then play the bass line on its own: if it makes a good line by itself, the reharmonisation will usually make sense.'),
    onRecord('Listen to the same song sung in different verses or by different artists, and to gospel choirs\' endings, where the harmony often changes under a held final note. The melody stays; the chords tell a new story.'),
    ear('When a familiar melody suddenly sounds deeper or more surprising without the singer changing anything, listen to the bass. A new bass note under the same melody note is the quickest sign that the arranger has reharmonised.'),
    tryIt('Hold an E and play each of the six chords under it in turn. Then take a simple four-bar melody you know, keep it exactly, and reharmonise it three ways: once with 9ths and planing, once with an approach chord before each arrival, and once with IV turning to iv. Play the bass line of each on its own and keep the version with the best line.'),
    recap([
      'Reharmonisation keeps the melody and changes the chords under it; each important melody note must fit the new chord.',
      'One melody note can be the 3rd, 5th, 7th, root, 9th or ♯11 of different chords — each a different colour.',
      'Choose a path with a good bass line and keep the main cadences recognisable.',
      'R&B moves: plane parallel chords under a stepwise melody, approach targets from a half step above, darken IV to iv.',
      'Save the boldest colours for later verses, the final chorus and the ending.',
    ]),
    drill('soul.analysis', 3),
  ],
  drills: ['soul.analysis', 'jazz.analysis', 'ear.prog.soul'],
};
