import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const ninth: Lesson = {
  id: 'funk.ninth',
  title: 'The funk dominant: 9, 13 and 7♯9',
  tags: ['funk'],
  level: 1,
  summary: 'In funk the dominant 7th is home, not a chord on the way somewhere. Its three classic colours — the 9, the 13 and the 7♯9 — and how to voice them small, short and in the pocket.',
  blocks: [
    p('In jazz and classical harmony, a dominant 7th chord is a point of tension: it exists to resolve. Funk turns that on its head. A funk tune can sit on a single dominant chord — E9, say — for its entire length, and the chord never resolves and never needs to. Inherited from the blues, where every chord is a dominant 7th, this use of the dominant as a **tonic** is one of the defining sounds of funk.'),
    p('When the harmony stays still, colour matters more. Funk players choose between three classic versions of the dominant — the 9, the 13 and the 7♯9 — and voice them in small, punchy shapes that cut through a band without getting in the way. This lesson covers all three.'),

    h('Why the dominant can be home'),
    p('A dominant 7th sounds unstable in classical harmony because its tritone wants to resolve. But context changes everything. In the blues, the I chord is a dominant 7th, and its ♭7 is simply part of the home colour — a bluesy, earthy flavour rather than a tension. Funk takes that idea and freezes it: with no V–I anywhere, and with a groove that keeps returning to the same chord, the ear accepts the dominant as the place where the music lives.'),
    p('This also explains why funk melodies and riffs so often use the **minor pentatonic** and blues scales over dominant chords. The ♭3 of the scale clashes with the major 3rd of the chord, and that clash — the blue note — is exactly the sound the style is after.'),

    h('Three colours'),
    p('**The 9 chord.** E9 is E G♯ B D F♯: a dominant 7th with a natural 9th on top. It is smooth and full, and it is the James Brown chord — the bright, chopped guitar chord that drives so many of his grooves. The 9th softens the dominant\'s edge without making it any less funky.'),
    p('**The 13 chord.** E13 adds the 13th (C♯), usually in place of the 5th: E G♯ D C♯ in a typical voicing. The 13th is the same note as the 6th, and it makes the chord brighter and more open, with a slightly jazzier lilt. Moving between a 9 and a 13 voicing on the same root — the top note moving between F♯ and C♯ while the 3rd and ♭7 hold — is a classic way of making a one-chord vamp move.'),
    p('**The 7♯9 chord.** E7♯9 is E G♯ B D G: a dominant 7th with a raised 9th on top. The ♯9 is spelled F𝄪 in theory but always written and thought of as G, because what it really is, sonically, is a **minor 3rd sitting above a major 3rd**. The chord contains both G♯ and G at once — major and minor together, the blues in a single chord. It is raw, aggressive and instantly recognisable; rock players call it the Hendrix chord, and in funk it is a tonic in its own right.'),
    listen([
      { label: 'E9', music: { voicings: [['E2', 'G#3', 'D4', 'F#4']], beat: 1.6 }, note: 'smooth and full' },
      { label: 'E13', music: { voicings: [['E2', 'D3', 'G#3', 'C#4']], beat: 1.6 }, note: 'bright, with the 6th' },
      { label: 'E7♯9', music: { voicings: [['E2', 'G#3', 'D4', 'G4']], beat: 1.6 }, note: 'raw: major and minor 3rds at once' },
    ]),
    table(['Chord', 'Notes (on E)', 'Sound', 'Typical voicing'], [
      ['E9', 'E G♯ B D F♯', 'smooth, the James Brown chord', 'G♯ D F♯ over E'],
      ['E13', 'E G♯ D C♯ (no 5th)', 'bright, open', 'D G♯ C♯ over E'],
      ['E7♯9', 'E G♯ D G', 'raw, bluesy', 'G♯ D G over E'],
    ]),
    example('Build E7♯9 from a shell', [
      'Shell: G♯ (3rd) and D (♭7) — the tritone, the dominant sound.',
      'Add G on top: the ♯9, strictly F𝄪 but always written G. Against the G♯ below, you hear a major and a minor 3rd at once.',
      'Keep the root in the bass and play the chord short, on the "&" and the "a": the Hendrix chord, used as a funk tonic.',
    ], { voicings: [['E2', 'G#3', 'D4'], ['E2', 'G#3', 'D4', 'G4']], beat: 1.2 }),

    h('Voicing for funk'),
    p('Funk voicings are **small**. Three notes above the bass is usually plenty — the 3rd and ♭7 for the dominant sound, plus one colour note on top: the 9, the 13 or the ♯9. The 5th is left out, and often so is the root, because the bass player has it covered. Small voicings sound tighter, leave room for the other parts, and can be moved and repeated quickly.'),
    p('They live in the **middle register** — roughly the octave above middle C — where they cut through without clashing with the bass below or the horns and vocals above. And they are played **short**. A funk chord is a percussive event as much as a harmonic one: a sharp stab on an off-beat, released immediately so that silence follows. Between the stabs, a guitarist or keyboard player often keeps a muted 16th-note scratch going, so the chord is felt as part of the rhythm of the groove.'),

    h('Moving inside one chord'),
    p('Even on a one-chord vamp, funk harmony moves. The simplest move is between colours on the same root: a 9 voicing on one beat, a 13 on the next. Another is the **IV chord answer**: a brief move to the IV9 (A9 in the key of E) and back, which gives the vamp a call-and-response shape without ever leaving home. A third is to slide into the chord from a half step above or below — an F9 slipping down to E9 on the downbeat — which adds a moment of tension on the way into the One.'),
    { t: 'prog', key: 'E', tokens: ['E7#9', 'E7#9', 'A9', 'E7#9'], beats: 4, bpm: 100, style: 'funk', caption: 'One-chord funk: E7♯9 with a IV9 answer.' },
    example('Make a one-chord vamp move', [
      'Play E9 (G♯ D F♯ over E) on the One and the "&" of 2.',
      'On the "a" of 3, lift the top voice from F♯ up to C♯ for a 13 voicing (G♯ D C♯), or slip the whole chord down from F9 to E9.',
      'Every few bars, answer with A9 (C♯ G B over A) for one bar, then return. The harmony barely changes; the groove feels alive.',
    ], { prog: ['E9', 'E13', 'E9', 'A9', 'E9'], key: 'E', beats: [4, 4, 4, 4, 4], style: 'funk' }),
    onRecord('James Brown\'s rhythm guitarists built whole songs from tightly chopped 9th chords, and the 7♯9 is all over funk and funk-rock. Listen for how short the chords are and how much of their effect comes from the silence after each stab.'),
    ear('To tell the three apart, listen to the top note. A smooth, consonant top note a whole step above the root (an octave up) is the 9; a bright note a major 6th above the root is the 13; a crunchy note that clashes with the major 3rd below it is the ♯9.'),
    tryIt('Play E9, E13 and E7♯9 in the voicings above, short and on off-beats, over a low E. Then keep the 16ths going quietly with muted chords between the stabs. Finally, try the same three voicings on A and B, so that you have the I, IV and V of a funk blues in E.'),
    recap([
      'In funk the dominant 7th is a tonic: it stays put and never needs to resolve.',
      'The 9 chord is smooth (the James Brown chord); the 13 is brighter; the 7♯9 puts a minor 3rd over a major 3rd.',
      'Voice them small: 3rd, ♭7 and one colour note; leave the 5th and often the root to the bass.',
      'Play them short, in the middle register, on off-beats, with muted 16ths between.',
      'Move inside one chord with colour changes, a IV9 answer or a half-step slide.',
    ]),
    drill('ear.chord.ext', 3),
  ],
  drills: ['ear.chord.ext', 'gym.spell.ext'],
};
