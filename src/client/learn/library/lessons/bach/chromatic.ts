import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const chromatic: Lesson = {
  id: 'bach.chromatic',
  title: 'Chromatic harmony: N6, +6, applied °7',
  tags: ['bach', 'core'],
  level: 3,
  summary: 'The chromatic chords of common-practice harmony — applied diminished 7ths, the Neapolitan sixth and the augmented sixths — what they are, where they go, and why the German sixth is a tritone substitute two centuries early.',
  blocks: [
    p('Diatonic harmony uses only the notes of the key. But from Bach onwards, composers coloured their harmony with chromatic chords — chords containing notes from outside the key — to intensify a cadence, darken a phrase or point dramatically at the dominant. A small family of these chords became standard in common-practice music, and each has a recognisable sound and a predictable destination.'),
    p('This lesson introduces them: the applied diminished 7th, the Neapolitan sixth and the three augmented sixths. Along the way it shows how closely they relate to the secondary dominants and tritone substitutions of jazz.'),

    h('Applied diminished 7ths'),
    p('The lesson on secondary dominants showed that any chord can be preceded by its own dominant. It can just as well be preceded by its own **leading-tone chord** — a diminished 7th built a half step below it. In A minor, the chord built on D♯, a half step below E, is D♯ F♯ A C: **vii°7 of V**, written vii°7/V. It leads to E with great force, because every one of its notes moves by step into the E chord (D♯ up to E, F♯ to E or G♯, A to G♯, C down to B).'),
    p('Bach uses applied diminished 7ths constantly, especially before cadences, and they are his most common chromatic chord. They are close relatives of the secondary dominant: D♯°7 is simply B7♭9 (V of V) without its root, exactly as the symmetric-scales lesson explained.'),

    h('The Neapolitan sixth'),
    p('The **Neapolitan** is a major chord built on the lowered 2nd degree of the key — ♭II. In A minor that is B♭ major (B♭ D F). It is almost always used in first inversion, with its 3rd in the bass, which is why it is called the **Neapolitan sixth** (N6): B♭/D.'),
    p('Its job is predominant. In first inversion its bass note is the same as the iv chord\'s — D in A minor — so it behaves like a darkened iv, leading to the dominant. Its striking feature is the ♭2 (B♭), which usually falls through the leading tone to the dominant, B♭ → G♯ → A — a diminished 3rd that sounds strange and expressive. The Neapolitan has a dark, plush, tragic quality, and it became a favourite of composers for moments of pathos. It often goes to V via a cadential 6/4.'),
    { t: 'prog', key: 'Am', tokens: ['Am', 'Bb/D', 'E7', 'Am'], caption: 'N6 – V7 – i: the Neapolitan in A minor' },

    h('Augmented sixth chords'),
    p('The augmented sixth chords are defined by one interval: an **augmented 6th** between the lowered 6th degree in the bass and the raised 4th degree above it. In A minor those notes are **F** and **D♯**. That interval is unstable, and it resolves by **expanding outward** by half steps to an octave: F falls to E, D♯ rises to E. The target is the dominant, so augmented sixth chords are pre-dominants that land on V with extraordinary force — both outer voices moving into the dominant note at once.'),
    p('There are three standard types, named (for no very good historical reason) after nationalities. All three contain the ♭6, the tonic and the ♯4; they differ in the fourth note.'),
    p('- The **Italian** sixth has just those three notes: F A D♯.\n- The **French** sixth adds the 2nd degree: F A B D♯. It has a distinctive whole-tone flavour.\n- The **German** sixth adds the ♭3: F A C D♯. Resolving it directly to V produces parallel 5ths (F–C to E–B), so it usually passes through a cadential 6/4 first: German sixth → i6/4 → V.'),
    table(['Chord', 'Built on', 'Goes to', 'In A minor'], [
      ['vii°7/V', '♯4', 'V', 'D♯°7 → E'],
      ['Neapolitan (N6)', '♭2, first inversion', 'V (often via i6/4)', 'B♭/D'],
      ['Italian +6', '♭6 · 1 · ♯4', 'V', 'F A D♯'],
      ['French +6', '♭6 · 1 · 2 · ♯4', 'V', 'F A B D♯'],
      ['German +6', '♭6 · 1 · ♭3 · ♯4', 'i6/4 → V', 'F A C D♯'],
      ['Picardy third', 'major I at the end', '—', 'A'],
    ]),
    p('Historically, Bach mostly uses applied diminished 7ths, the Neapolitan and Picardy thirds. The augmented sixths appear in his music but become truly standard later in the 18th century, in the Classical style of Haydn and Mozart. They belong in this lesson because they complete the family, and because they connect so neatly to jazz.'),

    h('The German sixth is a tritone sub'),
    p('Here is the connection. The German sixth in A minor is F A C D♯. Spell the D♯ as E♭ and it becomes F A C E♭ — an **F7 chord**. And F7 is the tritone substitute of B7, which is the V of V in A minor. Resolving the German sixth to E (via the 6/4 or not) is therefore exactly the jazz move **subV7/V → V**: a dominant a half step above the target, sliding down into it. Composers in the 1780s and jazz musicians in the 1950s arrived at the same sound for the same reason: both chords share a tritone with the true dominant of the target, and the bass slides down a half step.'),
    { t: 'prog', key: 'Am', tokens: ['Am', 'F7', 'Am/E', 'E7', 'Am'], caption: 'German +6 (it sounds as F7) – i6/4 – V7 – i' },
    example('The German sixth in D minor', [
      'The ♭6 of D minor is B♭ (the bass). The ♯4 is G♯.',
      'German = ♭6 + 1 + ♭3 + ♯4: B♭ D F G♯.',
      'B♭ and G♯ expand outward to A (an octave apart) — the dominant. Spelled B♭ D F A♭, it is B♭7: the tritone sub of E7, the V of V.',
    ], { prog: ['Dm', 'Bb7', 'Dm/A', 'A7', 'Dm'], key: 'Dm', beats: 2 }),
    example('The Neapolitan in D minor', [
      '♭2 of D minor is E♭; the Neapolitan is E♭ major (E♭ G B♭), in first inversion over G: E♭/G.',
      'The bass G is the same as iv (G minor), so N6 works as a darker iv leading to the dominant.',
      'E♭ falls to C♯, the leading tone, and on to D or to the A chord: E♭/G – A7 – Dm.',
    ], { prog: ['Dm', 'Eb/G', 'A7', 'Dm'], key: 'Dm', beats: 2 }),
    listen([
      { label: 'Applied °7', music: { prog: ['Am', 'D#dim7', 'E', 'Am'], key: 'Am', beats: 2 }, note: 'D♯°7 leading into V' },
      { label: 'Neapolitan', music: { prog: ['Am', 'Bb/D', 'E7', 'Am'], key: 'Am', beats: 2 }, note: 'the dark ♭II' },
      { label: 'German sixth', music: { prog: ['Am', 'F7', 'Am/E', 'E7', 'Am'], key: 'Am', beats: 2 }, note: 'F7 in disguise, expanding to E' },
    ]),
    onRecord('Listen for the Neapolitan in slow, minor-key Baroque and Classical movements: a sudden, dark major chord just before the final cadence. The German sixth is easiest to hear in Classical-era music, where it often marks the climax of a phrase just before the dominant arrives.'),
    ear('Chromatic predominants share one feature: a moment of intense colour followed by a strong arrival on the dominant. The Neapolitan sounds dark and plush; augmented sixths sound tense and expansive, with the bass sinking a half step to V while an upper voice rises a half step to the same note an octave above. If it sounds like a dominant 7th a half step above V, it is probably a German sixth.'),
    tryIt('In A minor, play Am – D♯°7 – E – Am, then Am – B♭/D – E7 – Am, then Am – F7 – Am/E – E7 – Am. In the last one, hold F in the bass and D♯ (as E♭) on top, and feel them expand outward to E. Then play B7 – E and F7 – E one after the other, and notice that the German sixth is the tritone sub of V of V.'),
    recap([
      'Applied diminished 7ths (vii°7/V) lead into a chord from a half step below; they are rootless secondary dominants.',
      'The Neapolitan sixth is ♭II in first inversion: a dark predominant whose ♭2 falls to the leading tone.',
      'Augmented sixth chords (Italian, French, German) contain ♭6 and ♯4, which expand outward to the dominant.',
      'The German sixth resolves via i6/4 to avoid parallel 5ths; it sounds exactly like a dominant 7th.',
      'The German sixth is the tritone substitute of V of V — the same move as subV7/V → V in jazz.',
    ]),
    drill('bach.chromatic'),
  ],
  drills: ['bach.chromatic', 'ear.prog.bach'],
};
