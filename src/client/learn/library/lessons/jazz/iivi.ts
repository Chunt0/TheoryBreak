import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const iivi: Lesson = {
  id: 'jazz.iivi',
  title: 'ii–V–I & guide tones',
  tags: ['jazz'],
  level: 1,
  summary: 'The cadence that tonal jazz is built from, and the two half-step lines — the guide tones — that run through it and hold every voicing and solo together.',
  blocks: [
    p('If jazz harmony has a basic sentence, it is **ii–V–I**. In C major it is Dm7 – G7 – Cmaj7: a predominant chord, a dominant chord, and the tonic. Open almost any standard and you will find it everywhere — sometimes in the home key, often in passing keys, frequently chained together so that one ii–V leads into the next. Being able to recognise, play and hear ii–V–I instantly is the foundation for everything else in jazz harmony.'),
    p('Inside the progression are two quiet lines of notes, the **guide tones**, that move by tiny steps from chord to chord. They are the reason ii–V–I sounds so smooth, and they are the key to both voicing chords and improvising over them.'),

    h('The progression'),
    p('ii–V–I walks through the three harmonic functions in order. The ii chord (Dm7) is predominant: it has left home and contains the 4th degree of the key. The V chord (G7) is dominant: it holds the tritone B–F, which wants to resolve. And the I chord (Cmaj7) is the resolution. The roots move up a 4th each time — D to G to C — which is the strongest root motion there is, so the progression has a powerful sense of momentum.'),
    p('In a tune, the ii–V usually occupies one or two bars, with the I arriving on a strong bar after it. But the pair ii–V is so familiar that it works as a unit on its own. Jazz musicians talk about "the ii–V in bar 5" or "a ii–V to F" even when the I never comes, or comes in disguise. Whenever you see a m7 chord followed by a dominant 7th a 4th higher, you are looking at a ii–V, and it is pointing at a key.'),
    listen([
      { label: 'ii – V – I in C', music: { prog: ['Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }, note: 'roots D → G → C' },
      { label: 'ii – V – I in F', music: { prog: ['Gm7', 'C7', 'Fmaj7'], key: 'F', beats: 2, style: 'swing' }, note: 'the same shape, a 4th higher' },
    ]),

    h('Guide tones: the notes that matter most'),
    p('Of the four notes in a seventh chord, two do most of the work of telling you what the chord is. The **3rd** decides whether it is major or minor. The **7th** decides whether it is a maj7, a dominant 7th or a m7. Together, the 3rd and 7th define the chord\'s quality. The root is usually played by the bass, and the 5th adds very little colour — it is the same in maj7, dominant 7th and m7 chords. So the 3rd and the 7th are called the **guide tones**: they guide the ear through the harmony.'),
    p('Now watch what they do in ii–V–I. In C: Dm7\'s 3rd and 7th are F and C. G7\'s are B and F. Cmaj7\'s are E and B.'),
    p('- The **7th of each chord falls by step to the 3rd of the next**: Dm7\'s C falls to G7\'s B; G7\'s F falls to Cmaj7\'s E.\n- The **3rd of each chord stays put and becomes the 7th of the next**: Dm7\'s F is G7\'s 7th; G7\'s B is Cmaj7\'s 7th.'),
    p('So two lines run through the progression. One goes C → B → B; the other goes F → F → E. Every move is a half step or no move at all. That is the whole secret of why ii–V–I sounds so smooth: underneath the changing roots, the notes that define the chords hardly move.'),
    {
      t: 'staff',
      chords: [
        { notes: ['C4', 'F4'], label: 'Dm7' },
        { notes: ['B3', 'F4'], label: 'G7' },
        { notes: ['B3', 'E4'], label: 'Cmaj7' },
      ],
      caption: 'The guide-tone lines: C → B (7 → 3), F stays (3 → 7), F → E (7 → 3), B stays (3 → 7).',
    },
    p('This is not a coincidence peculiar to ii–V–I. It happens whenever roots move up a 4th (or down a 5th). The 3rd of the first chord is always a common tone with the 7th of the second, and the 7th of the first is always a step above the 3rd of the second. That means the same two smooth lines run through any chain of falling 5ths — a whole cycle of dominants, a long sequence of ii–Vs — which is a large part of why that root motion is so central to jazz.'),
    example('Guide tones through ii–V–I in F', [
      'Gm7: 3rd B♭, 7th F. C7: 3rd E, 7th B♭. Fmaj7: 3rd A, 7th E.',
      'Line 1 starts on the 7th of Gm7: F → E → E. The 7th falls to the 3rd, then holds as the next 7th.',
      'Line 2 starts on the 3rd: B♭ → B♭ → A. Two voices, three chords, nothing but half steps and common tones.',
    ], { voicings: [['G2', 'Bb3', 'F4'], ['C3', 'Bb3', 'E4'], ['F2', 'A3', 'E4']], beat: 1.2 }),

    h('From guide tones to voicings'),
    p('Because the guide tones carry the harmony, a pianist can play a convincing ii–V–I with just three notes per chord: the root in the bass and the 3rd and 7th above it. These are called **shell voicings**, and they are the first voicings most jazz players learn. Alternate between root–3rd–7th and root–7th–3rd so that the guide tones move smoothly, and you have the skeleton of jazz comping.'),
    p('Add tensions to the guide tones and you get **rootless voicings** — the standard sound of jazz piano with a bass player. They come in two forms. The **A form** stacks 3–5–7–9 from the 3rd (with the 13th in place of the 5th on the dominant); the **B form** stacks 7–9–3–5 from the 7th. Alternating A and B forms through a ii–V–I keeps every voice moving by step or holding still, just as the guide tones do.'),
    table(['Chord', 'A voicing (3 5 7 9)', 'B voicing (7 9 3 5/13)'], [
      ['Dm9', 'F A C E', 'C E F A'],
      ['G13', 'B E F A', 'F A B E'],
      ['Cmaj9', 'E G B D', 'B D E G'],
    ]),
    { t: 'prog', key: 'C', tokens: ['ii9', 'V13', 'Imaj9', 'Imaj9'], style: 'swing', beats: 4, caption: 'Dm9 – G13 – Cmaj9 (rootless voicings, walking bass)' },
    onRecord('Dm9 in A form, G13 in B form and Cmaj9 in A form move every voice by a step or a common tone. That smooth, almost static top with changing harmony underneath is the sound Bill Evans, Wynton Kelly and Red Garland made standard in the late 1950s — listen to the piano behind the horns on Miles Davis\'s records of that period and you will hear these shapes, chord after chord.'),

    h('Guide tones in a solo'),
    p('Guide tones are just as useful for improvising. The most reliable way to make a line sound like it is following the changes is to land on the **3rd of each new chord** at the moment the chord arrives, often approached from the 7th of the previous chord a step above. You can sketch a whole solo this way: a slow guide-tone line as the skeleton, then fill in the space between the skeleton notes with scale tones, arpeggios and chromatic approaches.'),
    p('Many classic bebop phrases are built exactly like this. Strip away the decoration and you find a line that falls from the 7th of the ii to the 3rd of the V, then from the 7th of the V to the 3rd of the I. The decoration is what makes it sound fluent; the guide tones are what make it sound right.'),
    example('A guide-tone skeleton over ii–V–I in C', [
      'Write the skeleton one note per chord: C (7th of Dm7) → B (3rd of G7) → B (7th of Cmaj7) — or, starting higher, F → F → E.',
      'Fill in, one bar per chord: arpeggiate Dm7 down from its 7th (C, A, F, D), then land on B, the 3rd of G7, on the downbeat where the chord changes.',
      'Climb through G7 (B, D, F, A), turn on G, and land on E, the 3rd of Cmaj7, on the downbeat. The decoration can change every chorus; the landing notes stay.',
    ], { notes: ['C5', 'A4', 'F4', 'D4', 'B3', 'D4', 'F4', 'A4', 'G4', 'E4'], at: [0, 4, 8, 12, 16, 20, 24, 28, 30.67, 32], len: [3, 3, 3, 3, 3, 3, 3, 2, 1, 8], bpm: 120 }),
    ear('To hear a ii–V–I, listen first for the bass moving up a 4th twice, then for the moment of tension on V and its release on I. Then try to follow one guide-tone line through it — usually the top voice of the piano — and hear it fall by half step at each change.'),
    tryIt('Play the guide tones of ii–V–I in C, then move down a whole step and play them in B♭ (Cm7 – F7 – B♭maj7), then A♭, and so on through all the keys. Keep the lines in the same register so that each key flows into the next, and say the 3rd and 7th of each chord as you go.'),
    recap([
      'ii–V–I (Dm7 – G7 – Cmaj7) is predominant → dominant → tonic, with roots rising by 4ths.',
      'The guide tones are the 3rd and 7th: they define each chord\'s quality.',
      'The 7th of each chord falls by step to the 3rd of the next; the 3rd holds and becomes the next 7th.',
      'Shell voicings (root, 3rd, 7th) and rootless A/B voicings are built on the guide tones.',
      'In a solo, land on the 3rd of each new chord, approached from the 7th of the last.',
    ]),
    drill('jazz.guide'),
  ],
  drills: ['jazz.guide', 'gym.shells', 'ear.prog.jazz'],
};
