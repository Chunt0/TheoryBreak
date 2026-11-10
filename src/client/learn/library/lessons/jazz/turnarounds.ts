import type { Lesson } from '../../types';
import { drill, ear, example, h, p, recap, table, tryIt } from '../blocks';

export const turnarounds: Lesson = {
  id: 'jazz.turnarounds',
  title: 'Turnarounds',
  tags: ['jazz'],
  level: 1,
  summary: 'The short progressions that lead from the end of a section back to the top. One template, I – vi – ii – V, and four simple transformations that produce nearly every version you will hear.',
  blocks: [
    p('At the end of a section of a standard, the melody often holds a long note on the tonic for a bar or two. Harmonically, nothing needs to happen — the tune has arrived home. But if the band simply sat on the I chord, the music would stall, and the next chorus, which also starts on I, would begin with no sense of arrival. So jazz musicians fill those bars with a **turnaround**: a short progression, usually four chords in two bars, that winds the harmony back up and drops it onto bar 1 with fresh momentum.'),
    p('Turnarounds are also one of the great playgrounds of jazz harmony. Players vary them freely from chorus to chorus, and almost every substitution technique in jazz can be heard applied to them. The good news is that nearly all of them come from one template.'),

    h('The template: I – vi – ii – V'),
    p('The basic turnaround in C is **Cmaj7 – Am7 – Dm7 – G7**, then back to Cmaj7 at the top of the form. In terms of function it goes tonic, tonic, predominant, dominant: the vi is a darker stand-in for the I, so the turnaround starts at home, drifts, then builds through ii–V back to I.'),
    p('Look at the roots: C, A, D, G, and back to C. After the first move (down a 3rd), every move is a falling 5th — A to D, D to G, G to C. That chain of falling 5ths is what gives a turnaround its rolling, inevitable feel. Every variation below keeps that underlying journey and changes the colours on the way.'),
    { t: 'prog', key: 'C', tokens: ['Imaj7', 'vi7', 'ii7', 'V7'], style: 'swing', caption: 'The template: Cmaj7 – Am7 – Dm7 – G7' },

    h('Four ways to vary it'),
    p('**1. Substitute a chord that shares notes.** Em7 shares three notes with Cmaj7 (E, G and B), so it can replace the I: **iii – vi – ii – V**. Starting on iii gives the turnaround one more falling 5th (E to A), so the whole thing becomes a continuous cycle: E, A, D, G, C.'),
    p('**2. Make chords dominant.** Any chord in the turnaround can be turned into a dominant 7th to point harder at the chord after it. Am7 becomes **A7**, the V7 of Dm7 — a secondary dominant. Its C♯ is a leading tone into D, so the arrival on Dm7 feels stronger. Push the idea further and every chord becomes a dominant: **E7 – A7 – D7 – G7**, a chain of dominants round the circle that you also hear in the bridge of rhythm changes.'),
    p('**3. Pass through a diminished chord.** Replace the vi with **C♯°7**: Cmaj7 – C♯°7 – Dm7 – G7. The bass climbs chromatically, C – C♯ – D, and C♯°7 works because it is a rootless A7♭9 — the same secondary dominant as in variation 2, just without its root. This is a sound you will hear constantly in older swing and in gospel.'),
    p('**4. Use tritone substitutes.** Any dominant 7th can be replaced by the dominant a tritone away, which shares its tritone. A7 becomes **E♭7** and G7 becomes **D♭7**. Apply that to I – VI7 – ii – V7 and you get Cmaj7 – E♭7 – Dm7 – D♭7, and the bass now slides down by half steps — E♭, D, D♭ — into the C at the top.'),
    { t: 'prog', key: 'C', tokens: ['Imaj7', 'VI7', 'ii7', 'V7'], style: 'swing', caption: 'Secondary dominant: A7 is V7 of Dm7' },
    { t: 'prog', key: 'C', tokens: ['Imaj7', '#I°7', 'ii7', 'V7'], style: 'swing', caption: 'Diminished passing chord: the bass climbs C – C♯ – D' },

    h('Combining the moves'),
    p('The variations combine freely, and the most famous turnarounds are simply several moves applied at once. Start from iii – VI7 – ii – V7 (variations 1 and 2) and tritone-substitute both dominants (variation 4): **Em7 – E♭7 – Dm7 – D♭7**. The bass line now descends chromatically all the way home — E, E♭, D, D♭, C — while the guide tones above move just as smoothly. It is one of the most common turnarounds in all of jazz.'),
    example('Build the chromatic iii – ♭III7 – ii – ♭II7', [
      'Start with iii – VI7 – ii – V7: Em7 – A7 – Dm7 – G7. Roots fall in 5ths: E, A, D, G.',
      'Replace each dominant with its tritone sub: A7 → E♭7, G7 → D♭7.',
      'Result: Em7 – E♭7 – Dm7 – D♭7, with the bass sliding down by half steps into C.',
    ], { prog: ['Em7', 'Eb7', 'Dm7', 'Db7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }),
    p('Go one step further and substitute the ii chord as well. Moving its root a tritone (D to A♭) and voicing it as a major 7th gives **Cmaj7 – E♭7 – A♭maj7 – D♭7**, the turnaround from Tadd Dameron\'s "Lady Bird". After the I, every chord slides down by a half step or a 5th into the next, and the colours are richer and more surprising than the plain diatonic version, though the underlying journey is the same.'),
    example('From I – vi – ii – V to "Lady Bird", in C', [
      'Start: Cmaj7 – Am7 – Dm7 – G7.',
      'Make the vi point at the ii: Am7 → A7 (V7/ii).',
      'Tritone-sub the dominants: A7 → E♭7, G7 → D♭7. Move the ii slot a tritone too (D → A♭) and voice it as maj7.',
      'Result: Cmaj7 – E♭7 – A♭maj7 – D♭7, the "Lady Bird" turnaround.',
    ], { prog: ['Cmaj7', 'Eb7', 'Abmaj7', 'Db7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }),
    { t: 'prog', key: 'C', tokens: ['Imaj7', 'bIII7', 'bVImaj7', 'bII7'], style: 'swing', caption: 'The "Lady Bird" turnaround: tritone subs throughout' },
    table(['Turnaround', 'In C', 'Idea'], [
      ['I – vi – ii – V', 'Cmaj7 Am7 Dm7 G7', 'the diatonic template'],
      ['iii – vi – ii – V', 'Em7 Am7 Dm7 G7', 'iii replaces I: a full cycle of 5ths'],
      ['I – VI7 – ii – V', 'Cmaj7 A7 Dm7 G7', 'VI7 = V7/ii'],
      ['III7 – VI7 – II7 – V7', 'E7 A7 D7 G7', 'all dominants round the circle'],
      ['I – ♯I°7 – ii – V', 'Cmaj7 C♯°7 Dm7 G7', 'C♯°7 = rootless A7♭9'],
      ['iii – ♭III7 – ii – ♭II7', 'Em7 E♭7 Dm7 D♭7', 'tritone subs: a chromatic bass'],
      ['I – ♭III7 – ♭VImaj7 – ♭II7', 'Cmaj7 E♭7 A♭maj7 D♭7', 'the "Lady Bird" turnaround'],
    ]),

    h('Choosing one'),
    p('Which turnaround to play depends on three things. First, **the melody**: if the melody holds a C over the turnaround, a plain A7 puts its C♯ right against it. You can embrace that as a ♯9 — A7♯9 is a strong, bluesy sound — or keep the gentler Am7, but you should choose, not stumble into it. A melody on E or G, by contrast, sits comfortably over almost every version. Second, **the band**: in a group, the pianist or guitarist usually sets the turnaround and the bassist follows, so the most adventurous versions need everyone listening. Third, **the moment**: plain turnarounds suit the head, while the richer versions are often saved for solos, where a soloist can play off them.'),
    p('Turnarounds also make good endings. A **tag** repeats the last turnaround of a tune several times before finally landing on the tonic — a familiar way to close a performance.'),
    ear('Listen to the bass. If it falls in 5ths (C, A, D, G), the turnaround is built on the diatonic template, possibly with dominant chords. If it slides down by half steps (E, E♭, D, D♭), tritone substitutes are at work. If it climbs chromatically (C, C♯, D), there is a diminished passing chord.'),
    tryIt('Play every turnaround in the table in C, two beats per chord, then go back to the top of an imaginary form on Cmaj7. Then pick two and alternate them in F and B♭. Finally, improvise over the chromatic version, landing on the 3rd of each chord — G, G, F, F, E — and hear how smoothly the guide tones move.'),
    recap([
      'A turnaround fills the last bars of a section and leads back to I with momentum.',
      'The template is I – vi – ii – V; its roots fall in 5ths after the first move.',
      'Vary it by substituting chords that share notes (iii for I), making chords dominant (VI7), adding diminished passing chords (♯I°7) or using tritone subs.',
      'Combined moves give classic versions: iii – ♭III7 – ii – ♭II7 and the "Lady Bird" turnaround.',
      'Choose by the melody, the band and the moment.',
    ]),
    drill('ear.prog.jazz', 3),
  ],
  drills: ['ear.prog.jazz', 'jazz.dim', 'jazz.analysis'],
};
