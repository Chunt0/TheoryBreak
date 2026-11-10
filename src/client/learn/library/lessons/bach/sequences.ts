import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const sequences: Lesson = {
  id: 'bach.sequences',
  title: 'Sequences',
  tags: ['bach', 'jazz'],
  level: 2,
  summary: 'A pattern repeated at new pitch levels: the engine that drives Baroque music from one place to the next — and the same patterns behind "Autumn Leaves", ii–V chains and the improviser\'s motif.',
  blocks: [
    p('A **sequence** is a musical pattern repeated several times in a row, each time starting on a different pitch. Play a two-chord idea, then the same idea a step lower, then a step lower again, and you have a sequence. It is one of the oldest and most powerful devices in tonal music: in the Baroque era it was the main engine of motion, carrying music from one key to another and spinning a short idea out into a long, driving passage. Bach, Vivaldi, Corelli and Handel used a small set of standard sequences constantly.'),
    p('The same patterns run straight through into jazz and pop. Once you know the handful of common sequences, you will recognise long stretches of Bach at a glance — and you will hear them in "Autumn Leaves" and ii–V chains too.'),

    h('Model and copies'),
    p('Every sequence has a **model** — the original pattern, usually one or two chords or a short melodic figure — followed by **copies** of it, each transposed by the same interval. Three or so statements are typical; more than four tends to sound mechanical, so composers usually break the pattern before it outstays its welcome.'),
    p('There are two kinds. A **tonal** (or diatonic) sequence keeps every copy inside the key, so the exact interval qualities change from copy to copy: a pattern of major chords might pick up a minor or diminished one where the key demands it. A **real** sequence transposes the model exactly, chromatically, so every copy is identical in quality — which means it leaves the key, and real sequences are often used to modulate.'),

    h('Descending fifths'),
    p('The most common sequence of all moves its roots **down a 5th, then up a 4th**, over and over: in C major, C F B° Em Am Dm G C. Down a 5th and up a 4th land on the same note, so the alternation simply keeps the bass in a comfortable register while every chord falls a 5th to the next — the strongest root motion there is.'),
    p('With 7th chords it becomes even more compelling, because the 7th of each chord is prepared as a common tone and resolves down into the 3rd of the next — the same guide-tone motion as in a jazz ii–V. In A minor, the cycle Am7 – Dm7 – G7 – Cmaj7 – Fmaj7 – Bm7♭5 – E7 – Am7 visits every degree of the key. Jazz musicians know it as the opening of "Autumn Leaves" and "Fly Me to the Moon".'),
    { t: 'prog', key: 'Am', tokens: ['i7', 'iv7', 'bVII7', 'bIIImaj7', 'bVImaj7', 'iiø7', 'V7', 'i7'], style: 'block', caption: 'Descending fifths with 7ths in A minor' },
    example('Descending fifths with 7ths in A minor', [
      'Roots fall by 5ths (or rise by 4ths): A D G C F B E A.',
      'Every chord uses the key\'s notes — Am7 Dm7 G7 Cmaj7 Fmaj7 Bm7♭5 E7 Am7 — and only the E7 borrows G♯ from harmonic minor.',
      'One pattern repeated at each step is a sequence; jazz players know this one from "Autumn Leaves".',
    ], { prog: ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am7'], key: 'Am', beats: 2 }),

    h('Ascending 5–6'),
    p('Rising sequences build intensity, and the classic one is the **ascending 5–6**. Over each bass note, an upper voice moves from a 5th to a 6th above it, turning a root-position chord into a first-inversion chord on the same bass; then the bass steps up and the pattern repeats. In C: C – Am/C – Dm – B°/D – Em – C/E – F. The bass climbs C, D, E, F, while the harmony alternates root-position and first-inversion chords. Corelli and Bach used it for passages that climb steadily towards a climax.'),
    { t: 'prog', key: 'C', tokens: ['C', 'Am/C', 'Dm', 'Bdim/D', 'Em', 'C/E', 'F', 'G7'], style: 'block', caption: 'Ascending 5–6: the bass climbs while the chords alternate root position and first inversion' },

    h('Descending 3rds, parallel 6/3s and suspension chains'),
    p('The **descending 3rds** sequence moves down a 4th, then up a step: I – V – vi – iii – IV – I – IV – V. In D major that is D A Bm F♯m G D G A — the progression of Pachelbel\'s Canon. Pairs of chords descend by 3rds, and the pattern has a gentle, stately, endlessly repeatable quality.'),
    p('**Parallel 6/3 chords** move a chain of first-inversion chords down by step: C/E – B°/D – Am/C – G/B. Because first-inversion chords contain no perfect 5th above the bass, they can move in parallel without forbidden parallel 5ths, giving smooth, flowing passagework that Baroque composers loved.'),
    p('The **7–6 suspension chain** from the counterpoint lesson is a sequence too: a bass falling by step under an upper voice that is suspended over every bass note, sighing 7–6, 7–6, 7–6.'),
    table(['Sequence', 'Root motion', 'Chords (C)', 'Also in'], [
      ['Descending fifths', 'down a 5th / up a 4th', 'C F B° Em Am Dm G C', '"Autumn Leaves", "Fly Me to the Moon"'],
      ['Ascending 5–6', 'up a step via 5–6', 'C Am/C Dm B°/D Em C/E', 'Corelli, Bach'],
      ['Descending 3rds', 'down a 4th, up a step', 'C G Am Em F C F G', 'Pachelbel\'s Canon'],
      ['Parallel 6/3', 'down by step', 'C/E B°/D Am/C G/B', 'Baroque passagework'],
      ['7–6 suspension chain', 'down by step', 'over a falling bass', 'Corelli, Handel'],
    ]),

    h('How Bach uses sequences'),
    p('Many Baroque phrases follow a three-part plan that German theorists named with a memorable word: an opening idea, then **Fortspinnung** ("spinning out"), then a cadence. The opening states a motif and establishes the key. The spinning-out section takes a fragment of that motif and runs it through a sequence, building momentum and often moving towards a new key. The cadence brings it to rest. Once you know to look for it, you will find this shape in countless Bach movements.'),
    p('In inventions and fugues, the **episodes** between statements of the main theme are usually sequential, and they often use real sequences to modulate — carrying the music from one key to the next, where the theme will enter again. The sequence is the vehicle; the theme is the destination.'),

    h('Sequences in jazz'),
    p('Jazz harmony is full of sequences. The descending-fifths cycle is everywhere. Chains of ii–Vs that move by a consistent interval are real sequences: "Tune Up" moves its ii–V–I down by whole steps, and the second half of the Bird blues moves its ii–Vs down by half steps. And improvisers use **melodic sequences** constantly, playing a short motif and then repeating it at a new pitch level to follow the changes — one of the simplest ways to make a solo sound coherent.'),
    example('Spot the sequence: Dm7 G7 | Cm7 F7 | B♭maj7', [
      'The model is a ii–V: Dm7 – G7.',
      'The copy is the same ii–V a whole step lower: Cm7 – F7. Every chord quality is identical, so it is a real sequence.',
      'It leaves C major and arrives in B♭: a modulating sequence, exactly the technique of "Tune Up".',
    ], { prog: ['Dm7', 'G7', 'Cm7', 'F7', 'Bbmaj7'], key: 'Bb', beats: 2, style: 'swing' }),
    onRecord('Listen to the fast movements of Vivaldi\'s concertos or Bach\'s Brandenburg Concertos: after the opening theme, you will hear a figure repeated at descending or ascending pitch levels, driving the music forward — a sequence. Then listen to the opening of "Autumn Leaves" and hear the same descending-fifths engine in jazz clothes.'),
    ear('A sequence sounds like the music is repeating itself at a new height, step after step, gathering momentum. Listen for a short pattern that you have just heard coming back a step or a 3rd higher or lower. If the repetitions sound slightly different in colour, the sequence is tonal; if they sound identical, it is real and probably modulating.'),
    tryIt('Play the descending-fifths sequence in C (C F B° Em Am Dm G C) and then with 7ths in A minor. Then play the ascending 5–6 sequence, moving one upper voice from the 5th to the 6th above each bass note. Finally, take a two-bar melodic idea and repeat it twice, each time a step lower, over the descending-fifths chords.'),
    recap([
      'A sequence repeats a model pattern at new pitch levels; tonal sequences stay in the key, real ones transpose exactly and can modulate.',
      'Descending fifths (C F B° Em Am Dm G C) is the most common; with 7ths it drives "Autumn Leaves".',
      'Other standards: the ascending 5–6, descending 3rds (Pachelbel), parallel 6/3 chords, and 7–6 suspension chains.',
      'Baroque phrases often go: opening idea, Fortspinnung (sequential spinning-out), cadence; fugue episodes are sequential.',
      'Jazz uses sequences in ii–V chains and in melodic motifs repeated over the changes.',
    ]),
    drill('ear.prog.bach', 3),
  ],
  drills: ['bach.analysis', 'ear.prog.bach', 'ear.motion'],
};
