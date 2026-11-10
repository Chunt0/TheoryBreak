import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const rhythmChanges: Lesson = {
  id: 'jazz.rhythm',
  title: 'Rhythm changes',
  tags: ['jazz'],
  level: 2,
  summary: 'The chords of "I Got Rhythm": a 32-bar AABA in B♭ with turnarounds in every A and a bridge of dominants round the circle. The second great form of bebop, and how to find your way through it.',
  blocks: [
    p('After the blues, the most important form in bebop comes from a Broadway song: George and Ira Gershwin\'s "I Got Rhythm", written in 1930. Jazz musicians loved improvising on its chords so much that they wrote hundreds of new melodies over them. A chord progression cannot be copyrighted, so a new tune over borrowed changes — a **contrafact** — was both a creative challenge and a way to record original material. The chords became known simply as **rhythm changes**, and playing them at speed became a rite of passage for every bebop musician.'),
    p('Rhythm changes look dense on paper — two chords a bar for most of the form — but they are built from just two ideas you already know: turnarounds and extended dominants.'),

    h('The form'),
    p('Rhythm changes are a **32-bar AABA** form, almost always in **B♭**. (Gershwin\'s original song adds a two-bar tag to the last A; jazz musicians dropped it.) The A sections are busy, cycling through turnarounds and returning constantly to B♭. The bridge is the opposite: four dominant chords, two bars each, falling round the circle of fifths. The contrast between the churning A sections and the long, open dominants of the bridge is the essence of the form.'),

    h('The A section'),
    p('The first four bars are two turnarounds in a row: **B♭6 – G7 | Cm7 – F7 | Dm7 – G7 | Cm7 – F7**. That is I – VI7 – ii – V, then iii – VI7 – ii – V, with the iii (Dm7) standing in for the tonic the second time. The G7 is a secondary dominant pointing at Cm7, so every bar is a little cadence.'),
    { t: 'prog', key: 'Bb', tokens: ['I6', 'VI7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], style: 'swing', caption: 'A section, bars 1–4: two turnarounds' },
    p('Bars 5–8 head briefly towards the IV chord and then come home. A typical version is **B♭7 | E♭7 – E°7 | B♭/F – G7 | Cm7 – F7**. The B♭7 is the tonic turned into a dominant, V7 of E♭. Then comes E♭ (often E♭7, the bluesy IV7), and an **E°7** passing chord that lifts the bass from E♭ through E to F, under a B♭ chord in second inversion. Then a last turnaround — G7, Cm7, F7 — leads into the next section. The second A usually ends on B♭ instead, so that the bridge can begin.'),
    table(['Bar', '1', '2', '3', '4', '5', '6', '7', '8'], [
      ['A section', 'B♭6 G7', 'Cm7 F7', 'Dm7 G7', 'Cm7 F7', 'B♭7', 'E♭7 E°7', 'B♭/F G7', 'Cm7 F7'],
    ]),
    p('There are many variations. Bar 6 might be E♭ – E♭m (IV – iv, a borrowed minor iv); bars 1–4 might use any of the turnarounds from the turnaround lesson. Players and bands mix and match freely, often changing from chorus to chorus. What stays constant is the shape: turnarounds that keep circling back to B♭, a brief lean towards E♭ in bars 5–6, and a turnaround at the end.'),

    h('The bridge'),
    p('The bridge is **D7 – G7 – C7 – F7**, two bars each: III7 – VI7 – II7 – V7 in B♭. Each chord is the dominant of the next, so the whole bridge is a chain of extended dominants falling round the circle, ending on F7, the V7 that drops you back into the last A.'),
    { t: 'prog', key: 'Bb', tokens: ['III7', 'VI7', 'II7', 'V7'], beats: 4, style: 'swing', caption: 'Bridge: D7 – G7 – C7 – F7' },
    p('Musicians often decorate it. Adding the related ii before each dominant gives **Am7 – D7 | Dm7 – G7 | Gm7 – C7 | Cm7 – F7**, which keeps the two-chords-a-bar motion going through the bridge. Tritone-substituting some of the dominants gives chromatic bass lines: D7 – D♭7 – C7 – B7, for instance, sliding down by half steps.'),
    p('Underneath any of these versions, the guide tones make a smooth line through the bridge. The 3rds of the four dominants are F♯, B, E and A; the 7ths are C, F, B♭ and E♭. As in every chain of falling 5ths, the 7th of each chord falls a half step to the 3rd of the next: C to B, F to E, B♭ to A. Hearing those two lines is the best way to make the bridge sound like it is going somewhere, rather than a series of separate chords.'),
    example('Guide tones through the rhythm bridge', [
      'D7: 3rd F♯, 7th C. G7: 3rd B, 7th F. C7: 3rd E, 7th B♭. F7: 3rd A, 7th E♭.',
      'Line one: C (7th of D7) → B (3rd of G7) → B♭ (7th of C7) → A (3rd of F7). A chromatic descent.',
      'Line two: F♯ (3rd of D7) → F (7th of G7) → E (3rd of C7) → E♭ (7th of F7). Another one, a step below.',
    ], { voicings: [['D3', 'F#3', 'C4'], ['G2', 'F3', 'B3'], ['C3', 'E3', 'Bb3'], ['F2', 'Eb3', 'A3']], beat: 1.4 }),

    h('Reharmonising the A section'),
    p('Because the first four bars are just turnarounds, they are a natural place to apply every substitution you know. The example below transforms the opening two bars step by step.'),
    example('Reharmonise bars 1–2 of rhythm changes', [
      'Plain: B♭6 – G7 | Cm7 – F7 (I – VI7 – ii – V).',
      'Swap I for iii: Dm7 – G7 | Cm7 – F7. Now every root falls a 5th (D, G, C, F).',
      'Tritone-sub the dominants: Dm7 – D♭7 | Cm7 – B7. The bass slides down chromatically — D, D♭, C, B — into B♭.',
    ], { prog: ['Dm7', 'Db7', 'Cm7', 'B7', 'Bb6'], key: 'Bb', beats: 2, style: 'swing' }),

    h('Finding your way through'),
    p('At bebop tempos — often well over 200 beats per minute — nobody thinks about every chord. Experienced players hold on to a few **points of gravity** instead. In the A sections, the music keeps returning to B♭ (bars 1, 3, 5 and 7), and the turnarounds between those points can often be treated as a single sound: a line that clearly states B♭ on the strong bars and outlines the ii–V on the weak ones is enough. Many players even treat the first four bars as simply "B♭" and use the bluesy B♭ sounds — the blues scale, the ♭7 — before getting more specific in bars 5–8.'),
    p('The bridge needs a different approach. With two bars on each dominant, there is time to be precise: target the 3rd of each new chord, follow the guide-tone lines, and colour each dominant with tensions that point at the next one.'),
    onRecord('Heads on rhythm changes include Sonny Rollins\'s "Oleo", Charlie Parker\'s "Anthropology" and "Moose the Mooche", Thelonious Monk\'s "Rhythm-a-ning", Duke Ellington\'s "Cotton Tail" and Lester Young\'s "Lester Leaps In". Each puts a different melody on the same chords, and many vary the changes slightly.'),
    ear('You can tell an A section from the bridge by the speed of the harmony: the A sections churn, two chords a bar, always circling back to the tonic, while the bridge settles into long dominant chords, each pulling to the next. The moment the harmony slows down and turns into dominants, you are in the bridge.'),
    tryIt('Play through rhythm changes slowly with shell voicings, A A B A. Then play only the guide tones of the bridge — the two chromatic lines — until you can sing them. Finally, improvise over the A sections using just the B♭ major scale and the blues scale, and switch to targeting chord tones when you reach the bridge.'),
    recap([
      'Rhythm changes come from "I Got Rhythm": a 32-bar AABA, usually in B♭, used for hundreds of contrafacts.',
      'A sections: turnarounds in bars 1–4 (I–VI7–ii–V, iii–VI7–ii–V), a move towards IV in bars 5–6, a turnaround to finish.',
      'Bridge: D7 – G7 – C7 – F7, extended dominants falling round the circle back to the last A.',
      'The A section is a playground for turnaround substitutions; the bridge can take related iis or tritone subs.',
      'At speed, think in points of gravity in the A, and follow the guide tones through the bridge.',
    ]),
    drill('jazz.analysis', 3),
  ],
  drills: ['jazz.analysis', 'ear.prog.jazz'],
};
