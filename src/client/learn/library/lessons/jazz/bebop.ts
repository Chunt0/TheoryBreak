import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const bebop: Lesson = {
  id: 'jazz.bebop',
  title: 'Bebop language',
  tags: ['jazz'],
  level: 2,
  summary: 'How bebop lines are built: chord tones on the beat, approach notes that lead into them, bebop scales that keep the line in step, enclosures, and the rhythm that makes it swing.',
  blocks: [
    p('In the 1940s, Charlie Parker, Dizzy Gillespie, Bud Powell and their contemporaries developed a way of improvising that is still the core vocabulary of jazz: long, fast lines of swung eighth notes that trace the chord changes so precisely you could almost reconstruct the harmony from the solo alone. That language is called **bebop**, and like any language it has a grammar.'),
    p('You do not need to know thousands of phrases to start speaking it. A handful of principles — where the important notes fall, how other notes lead to them, and how a scale can be adjusted to keep everything in step — explain most of what bebop players do. This lesson covers those principles.'),

    h('Targets on the beat'),
    p('In a line of swung eighth notes, each beat contains two notes: one on the beat and one on the "and". The notes on the beat are heard as stronger. Bebop players use this constantly: **chord tones go on the beats, other notes go between them.** That way, even at high speed, the listener hears the harmony outlined clearly, while the in-between notes give the line its motion and flow.'),
    p('Of all the chord tones, the most important targets are the **guide tones** — the 3rds and 7ths — especially at the moment a new chord arrives. A bebop line very often lands on the 3rd of each new chord on its first beat, approached from the notes around it. The guide-tone skeleton from the ii–V–I lesson is the backbone of the language; everything else is decoration that leads to it.'),

    h('Bebop scales: keeping in step'),
    p('Here is a problem. Run a seven-note scale in eighth notes and the chord tones drift off the beats. Over G7, descend G Mixolydian from G: G F E D C B A G. The notes on the beats are G, E, C and A — the root, the 13th, the 11th (an avoid note) and the 9th. Only one chord tone in four lands on a beat.'),
    p('The fix is to add one chromatic passing note, making an eight-note scale. Add F♯ between G and F: G F♯ F E D C B A. Now the beats fall on **G, F, D and B** — every one a chord tone of G7. This is the **bebop dominant scale**: Mixolydian with an added major 7th. Because it has eight notes, four beats of eighths take you exactly one octave, and as long as you start on a chord tone on a beat, chord tones keep falling on beats.'),
    p('There is a matching **bebop major scale**, which adds a ♯5 between the 5th and 6th: C D E F G G♯ A B. Descending from C, the beats fall on C, A, G and E — the notes of C6. The same principle works for minor chords: add a passing major 7th to Dorian (D E F G A B C C♯) and a run down from D puts D, C, A and F — the notes of Dm7 — on the beats.'),
    example('Run the G bebop dominant over G7', [
      'Start on the root on beat 1 and run down in eighths: G F♯ F E D C B A.',
      'The added F♯ shifts everything so that the beats fall on G, F, D and B — every one a chord tone of G7.',
      'Then target the 3rd of Cmaj7 on the next downbeat, approached by an enclosure: F – D♯ – E.',
    ], { notes: ['G4', 'F#4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'F4', 'D#4', 'E4'], beat: 0.22 }),

    h('Approach notes and enclosures'),
    p('The notes between the targets are rarely random. Most of them are **approach notes**, chosen to lead into the next target as strongly as possible.'),
    p('- A **chromatic approach** comes from a half step below or above the target: D♯ to E, or F to E. It is the simplest and strongest way to point at a note.\n- A **scale approach** comes from the next note of the scale above or below.\n- An **enclosure** surrounds the target from both sides before landing on it — typically a scale step above, then a chromatic step below, then the target: F – D♯ – E. Enclosures are one of the most recognisable sounds in bebop, and they let a line arrive on its target with real emphasis.\n- A **double chromatic approach** slides in by two half steps: D – D♯ – E.'),
    p('Approach notes usually fall on the weaker parts of the beat, with the target on the beat. That creates a constant feeling of forward motion: every off-beat leans into the next on-beat.'),
    listen([
      { label: 'G bebop dominant ↓', music: { notes: ['G4', 'F#4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3'], beat: 0.2 }, note: 'chord tones on every beat' },
      { label: 'Enclosure into E', music: { notes: ['F4', 'D#4', 'E4'], beat: 0.25 }, note: 'above, below, target' },
      { label: 'Double chromatic into E', music: { notes: ['D4', 'D#4', 'E4'], beat: 0.25 }, note: 'sliding in by two half steps' },
    ]),

    h('Arpeggios from the 3rd'),
    p('Bebop players often outline a chord by arpeggiating from its **3rd up to its 9th**. Over Dm7 that is F A C E; over G7 it is B D F A. Played this way, the arpeggio avoids the root — the bass is playing it — and implies a richer chord: F A C E over a D bass is Dm9, and B D F A over a G bass is G9. It is the rootless A voicing from the voicings lesson, played as a melody.'),
    p('A classic ii–V move combines this with the guide tones: arpeggiate up from the 3rd of the ii chord, then turn and descend through the V chord so that its 7th falls by a half step to the 3rd of the I right on the downbeat.'),
    example('Build a ii–V–I line in C', [
      'Dm7, two beats: arpeggiate from the 3rd — F A C E — the rootless A voicing played as a line.',
      'G7, two beats: turn and come down through its chord tones — D B G F — with D and G on the beats and the guide tones B and F between them.',
      'Cmaj7: the F, the 7th of G7, falls a half step to E, the 3rd of Cmaj7, right on beat 1. The guide-tone resolution, at full speed.',
    ], { notes: ['F4', 'A4', 'C5', 'E5', 'D5', 'B4', 'G4', 'F4', 'E4'], beat: 0.22 }),

    h('Rhythm and phrasing'),
    p('Notes are only half of bebop; rhythm is the other half. Eighth notes are **swung** — played long–short, with accents often falling on the off-beats rather than the beats. Phrases frequently **start on an off-beat**, which gives them a lively, conversational quality, and often end with a short, accented note on an off-beat rather than a long note on a downbeat. Varying the length of phrases, and leaving space between them, matters as much as the lines themselves.'),
    p('Bebop also uses a few more advanced devices that the later lessons cover: **side-slipping**, where a phrase is played a half step away from the harmony and then resolved back; **tritone substitution** in the line itself, implying D♭7 over G7; and **altered** lines over dominants, using the altered scale for maximum tension before a resolution.'),
    table(['Device', 'What it does', 'Example over G7 → C'], [
      ['Chord tones on beats', 'outlines the harmony at any speed', 'G, F, D, B on the beats'],
      ['Bebop dominant scale', 'adds ♮7 so a run stays in step', 'G F♯ F E D C B A'],
      ['Chromatic approach', 'points at a target from a half step away', 'D♯ → E'],
      ['Enclosure', 'surrounds the target before landing', 'F – D♯ – E'],
      ['Arpeggio from the 3rd', 'implies a 9th chord without the root', 'B D F A'],
    ]),
    onRecord('Charlie Parker\'s solos on blues and rhythm changes are the textbook. Listen for how often his lines land on the 3rd of a new chord right on the beat, and how many of those landings are prepared by enclosures. Learning a few of his phrases by ear, slowly, teaches the grammar faster than any rule.'),
    ear('When you listen to a bebop solo, try to hear only the notes on the beats. They usually sketch the chords like a slow melody, and the fast notes between them are the approach notes leading from one to the next.'),
    tryIt('Over G7, run the bebop dominant scale down from each chord tone — G, F, D and B — always starting on a beat, and check that chord tones keep landing on beats. Then play a ii–V–I in C, aiming for the 3rd of each chord on beat 1 and approaching it with an enclosure. Start slowly; accuracy of placement matters more than speed.'),
    recap([
      'Bebop lines put chord tones — especially 3rds and 7ths — on the beats, with other notes between them.',
      'Bebop scales add one chromatic passing note (♮7 to Mixolydian, ♯5 to major) so runs keep chord tones on beats.',
      'Approach notes lead into targets: chromatic, scale, double chromatic and enclosures (above, below, target).',
      'Arpeggios from the 3rd to the 9th imply rich chords without the root.',
      'Swing the eighths, start phrases on off-beats, and leave space.',
    ]),
    drill('ear.melody.bebop', 2),
  ],
  drills: ['ear.melody.bebop', 'jazz.bebop', 'jazz.guide'],
};
