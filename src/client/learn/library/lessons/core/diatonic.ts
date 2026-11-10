import type { Lesson } from '../../types';
import { drill, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const diatonic: Lesson = {
  id: 'core.diatonic',
  title: 'The 7th chords of a key',
  tags: ['core', 'jazz'],
  level: 1,
  summary: 'Stack 3rds on every degree of a scale and you get the key\'s family of chords: what each one is, what job it does, and how the minor-key versions differ.',
  blocks: [
    p('A key is more than a scale. Build a chord on each of its seven notes, using only notes from the key, and you get a family of seven chords that belong together. Most of the harmony in a jazz standard, a soul tune or a Bach chorale comes from that family, with occasional visitors from outside.'),
    p('Knowing the family by heart changes how you read a chord chart. Instead of a string of unrelated names, you see positions — this is the ii, this is the V, this one does not belong — and you can transpose a whole song by thinking in numbers rather than letters.'),

    h('Harmonising the scale'),
    p('To build the chords, take each degree of the scale in turn and stack every other note on top of it, staying inside the key. In C major: on C you get C E G B; on D, D F A C; on E, E G B D; on F, F A C E; on G, G B D F; on A, A C E G; and on B, B D F A.'),
    p('Name those chords and a pattern appears: **Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7♭5**. Because every major scale has the same arrangement of whole and half steps, every major key produces the same pattern of qualities on the same degrees. Written as Roman numerals — upper case for chords with a major 3rd, lower case for a minor 3rd — the pattern is:'),
    p('**Imaj7 · ii7 · iii7 · IVmaj7 · V7 · vi7 · viiø7**'),
    p('Learn that line and you know the chords of all twelve major keys. In F major it gives Fmaj7, Gm7, Am7, B♭maj7, C7, Dm7, Em7♭5; in E♭ it gives E♭maj7, Fm7, Gm7, A♭maj7, B♭7, Cm7, Dm7♭5. As triads, without the 7ths, the pattern is I ii iii IV V vi vii°.'),
    p('Notice that there is exactly **one dominant 7th** chord in a major key, on degree 5. That makes it a powerful signpost. If you hear G7 and it resolves, the key is almost certainly C (major or minor). When a chart suddenly contains a different dominant 7th — say A7 in the key of C — that chord has come from outside the key, and it is pointing somewhere new. Secondary dominants, covered later, are exactly this.'),
    listen([
      { label: 'Up the key of C', music: { prog: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5', 'Cmaj7'], key: 'C', beats: 1.5, bpm: 110 }, note: 'Imaj7 to viiø7 and home' },
    ]),
    example('The 7th chord on degree 6 of E♭ major', [
      'E♭ major: E♭ F G A♭ B♭ **C** D — degree 6 is C.',
      'Stack 3rds using only the key\'s notes: C E♭ G B♭.',
      'Minor 3rd, perfect 5th, minor 7th: **Cm7**, the vi7. It matches the pattern — degree 6 is always m7.',
    ], { prog: ['Ebmaj7', 'Cm7', 'Fm7', 'Bb7'], key: 'Eb', beats: 2 }),
    example('Find the key of Em7 – A7 – Dmaj7', [
      'Look for the dominant 7th: A7. In a major key the only dominant 7th sits on degree 5, so A is the 5th of the key and the tonic is **D**.',
      'Check the others: in D major, Em7 is ii7 and Dmaj7 is Imaj7. Everything fits.',
      'So this is ii – V – I in D major — the most common progression in jazz.',
    ], { prog: ['Em7', 'A7', 'Dmaj7'], key: 'D', beats: 2 }),

    h('Three jobs: tonic, predominant, dominant'),
    p('The seven chords fall into three groups according to what they do, and this idea — **harmonic function** — is the key to understanding why progressions sound the way they do.'),
    p('**Tonic** chords feel like home. The I chord is the obvious one, but vi and iii share most of its notes (Am7 contains C, E and G; Em7 contains E, G and B), so they can stand in for it. A tune that moves from I to vi has not really left home; it has moved to a darker room in the same house.'),
    p('**Predominant** chords lead away from home and prepare the dominant. These are ii and IV. Both contain the 4th degree of the scale, which is the note that most clearly says "we are no longer on the tonic".'),
    p('**Dominant** chords create tension that wants to resolve to the tonic. V7 is the main one; viiø7 is closely related — B D F A is a G9 chord without its root. Both contain the tritone between degrees 7 and 4 (B and F in C major), and resolving that tritone is what produces the feeling of arrival.'),
    p('The basic story of tonal harmony is a journey through those three functions: **tonic → predominant → dominant → tonic**. I–IV–V–I tells it in four chords; ii–V–I tells the second half; the progression below tells it twice, with vi and iii standing in for the tonic.'),
    table(['Degree', 'C major', 'Quality', 'Function'], [
      ['I', 'Cmaj7', 'maj7', 'tonic'],
      ['ii', 'Dm7', 'm7', 'predominant'],
      ['iii', 'Em7', 'm7', 'tonic (weak)'],
      ['IV', 'Fmaj7', 'maj7', 'predominant'],
      ['V', 'G7', '7', 'dominant'],
      ['vi', 'Am7', 'm7', 'tonic (the relative minor)'],
      ['vii', 'Bm7♭5', 'm7♭5', 'dominant (a rootless G9)'],
    ]),
    { t: 'prog', key: 'C', tokens: ['Imaj7', 'vi7', 'ii7', 'V7', 'iii7', 'vi7', 'ii7', 'V7'], style: 'swing', caption: 'Tonic – tonic – predominant – dominant, then iii standing in for I' },

    h('The chords of a minor key'),
    p('Minor keys are less tidy, because minor has three common forms of its scale (the next lessons explain why). Each form produces a slightly different set of chords:'),
    table(['Degree', 'Natural minor', 'Harmonic minor', 'Melodic minor'], [
      ['1', 'im7', 'im(maj7)', 'im(maj7)'],
      ['2', 'iiø7', 'iiø7', 'ii7'],
      ['3', '♭IIImaj7', '♭IIImaj7♯5', '♭IIImaj7♯5'],
      ['4', 'iv7', 'iv7', 'IV7'],
      ['5', 'v7', 'V7', 'V7'],
      ['6', '♭VImaj7', '♭VImaj7', 'viø7'],
      ['7', '♭VII7', 'vii°7', 'viiø7'],
    ]),
    p('In practice, minor-key harmony mixes all three, choosing whichever version does the job best. The cadence usually comes from harmonic minor — **iiø7 – V7** — because natural minor\'s v7 has no leading tone and does not pull home. The tonic is often a **i6 or im(maj7)** from melodic minor, or a plain im7. And the colourful chords on the way — **♭VI, ♭VII and iv** — come from natural minor. Tunes like "Autumn Leaves" and "Blue Bossa" are built almost entirely from this mixture.'),
    listen([
      { label: 'Minor ii–V–i', music: { prog: ['Dm7b5', 'G7', 'Cm7'], key: 'Cm', beats: 2 }, note: 'harmonic-minor cadence' },
      { label: '♭VI – ♭VII – i', music: { prog: ['Abmaj7', 'Bb7', 'Cm7'], key: 'Cm', beats: 2 }, note: 'natural-minor colour' },
    ]),

    tryIt('Play the seven chords of C major in order, saying each numeral aloud, then do the same in F and B♭. Then take a tune you know and write its chords as numerals. You will quickly find that most songs use the same handful of functions, just in different keys.'),
    recap([
      'Stacking 3rds on each degree of a major scale always gives Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7.',
      'There is only one dominant 7th in a major key, so V7 points clearly to its tonic.',
      'Tonic chords (I, iii, vi) rest; predominants (ii, IV) lead away; dominants (V, vii) carry the tritone back home.',
      'Tonic → predominant → dominant → tonic is the basic shape of tonal harmony.',
      'Minor keys mix three scales: harmonic minor for the cadence, melodic minor for the tonic, natural minor for colour.',
    ]),
    drill('gym.keys7'),
  ],
  drills: ['gym.keys7', 'gym.keys7.harm', 'gym.keys7.mel'],
};
