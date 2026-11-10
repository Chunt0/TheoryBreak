import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const voicings: Lesson = {
  id: 'jazz.voicings',
  title: 'Voicings: shells, rootless, drop 2',
  tags: ['jazz', 'soul'],
  level: 1,
  summary: 'A chord symbol says which notes; a voicing decides which ones to play, in which octave, and which goes on top. Three essential families, and the register rules that keep them clear.',
  blocks: [
    p('A chord symbol tells you which notes belong to a chord. It does not tell you how to play them. Which notes do you include, and which do you leave out? How far apart do you spread them? What goes at the bottom, and what goes on top? Those decisions make up a **voicing**, and they matter enormously. The same Cmaj7 can sound muddy, thin, lush or strikingly modern depending entirely on how it is voiced.'),
    p('Jazz and soul keyboard players build their voicings from a few principles and a few families of shapes. This lesson covers the three you will use most — shells, rootless voicings and drop 2 — and the rules about register that keep any voicing clear.'),

    h('What to keep, what to leave out'),
    p('A 13th chord has seven notes, and you have ten fingers and two ears. You will almost always leave something out, so it helps to know the order of importance.'),
    p('1. **The 3rd and 7th** define the chord\'s quality — major or minor, maj7 or dominant. Keep them.\n2. **Tensions** — 9ths, 11ths, 13ths and alterations — supply the colour. Add the ones the style and the chord want.\n3. **The root** is essential to the sound, but in a band the bass player is already playing it. Pianists playing with a bassist usually leave it out.\n4. **The 5th** is the least important note. It is the same in maj7, dominant and minor 7th chords and adds little colour, so it is the first to go — unless it is altered (♭5 or ♯5), in which case it becomes a defining note.'),

    h('Shell voicings'),
    p('The simplest useful voicing is the **shell**: the root, the 3rd and the 7th, and nothing else. Three notes are enough to define any seventh chord. Shells come in two positions — **root–3rd–7th** and **root–7th–3rd** — and the trick is to alternate between them so that the guide tones move smoothly from chord to chord.'),
    p('Through a ii–V–I in C: Dm7 as root–3rd–7th (D F C), G7 as root–7th–3rd (G F B), Cmaj7 as root–3rd–7th (C E B). The roots jump around, as roots do, but the upper two notes move by half steps or stay put. Shells are the classic left-hand sound of bebop piano, leaving the right hand free for melody, and they are the best possible foundation for learning more complex voicings.'),
    listen([
      { label: 'Shell ii–V–I', music: { voicings: [['D3', 'F3', 'C4'], ['G2', 'F3', 'B3'], ['C3', 'E3', 'B3']], beat: 1.3 }, note: 'R–3–7, R–7–3, R–3–7' },
    ]),

    h('Rootless voicings'),
    p('When a bass player covers the root, a pianist can drop it and use the space for tensions. **Rootless voicings** keep the guide tones and add the 9th and the 5th or 13th, making four-note shapes that sound full and modern. They became the standard sound of jazz piano from the late 1950s, associated with players such as Bill Evans, Red Garland and Wynton Kelly.'),
    p('There are two forms. The **A form** stacks 3–5–7–9 from the 3rd. The **B form** stacks 7–9–3–5 from the 7th. On a dominant chord the 13th usually replaces the 5th. Alternate A and B forms through a ii–V–I and, exactly as with the guide tones, every voice moves by step or holds still.'),
    {
      t: 'staff',
      chords: [
        { notes: ['F3', 'A3', 'C4', 'E4'], label: 'Dm9 (A)' },
        { notes: ['F3', 'A3', 'B3', 'E4'], label: 'G13 (B)' },
        { notes: ['E3', 'G3', 'B3', 'D4'], label: 'Cmaj9 (A)' },
      ],
      caption: 'Rootless ii–V–I: A form, B form, A form. The bass supplies D, G and C.',
    },
    listen([
      { label: 'Rootless ii–V–I', music: { voicings: [['D2', 'F3', 'A3', 'C4', 'E4'], ['G2', 'F3', 'A3', 'B3', 'E4'], ['C2', 'E3', 'G3', 'B3', 'D4']], beat: 1.3 }, note: 'with the roots in the bass' },
    ]),
    example('Rootless voicings: Fmaj9, then ii–V–I in F', [
      'Fmaj9 in A form: 3–5–7–9 from F is A C E G.',
      'Leave the root to the bass and keep the voicing around middle C: A3 C4 E4 G4.',
      'Through ii–V–I in F, alternate forms: Gm9 (A: B♭ D F A) → C13 (B: B♭ D E A) → Fmaj9 (A: A C E G). Every voice moves a step at most.',
    ], { voicings: [['G2', 'Bb3', 'D4', 'F4', 'A4'], ['C2', 'Bb3', 'D4', 'E4', 'A4'], ['F2', 'A3', 'C4', 'E4', 'G4']], beat: 1.3 }),

    h('Drop 2 voicings'),
    p('Close voicings — all the notes packed within an octave — can sound cramped. **Drop 2** is a simple way to open them up. Take a four-note close voicing, find the second note from the top, and drop it down an octave. The chord now spans more than an octave, with a wider gap at the bottom, and it sounds open, balanced and orchestral, like a horn or string section.'),
    p('Drop 2 voicings are especially useful for harmonising a melody, because the melody stays on top while the other voices spread out underneath it. Arrangers voicing a saxophone section use the same idea, and so do keyboard players who want a big, singing chord in the middle of the instrument. (Drop 3, which drops the third voice from the top instead, opens the voicing even further.)'),
    example('Turn a close Cmaj7 into drop 2', [
      'Close voicing, reading down from the top: B4, G4, E4, C4.',
      'The second voice from the top is G. Drop it an octave to G3.',
      'Result, from the bottom: G3 C4 E4 B4. The same four notes, now spread over more than an octave with the B singing on top.',
    ], { voicings: [['C4', 'E4', 'G4', 'B4'], ['G3', 'C4', 'E4', 'B4']], beat: 1.5 }),

    h('Register: where a voicing lives'),
    p('The same voicing sounds completely different in different parts of the keyboard, and the main reason is that low notes produce dense, slow-beating overtones that clash when notes are close together. Below about the C an octave beneath middle C, small intervals like 2nds and 3rds start to turn muddy; an octave lower still, only 5ths and octaves stay clear. This is why bass players own the roots, why shell and rootless voicings sit around middle C, and why the classic left-hand stretch for a full sound low down is a 10th — the root with the 3rd an octave above — rather than a close root and 3rd.'),
    p('At the other end, voicings placed too high sound thin and lose their warmth. Most of the action in jazz and soul comping happens in the octave and a half around middle C, with the bass below and the melody above.'),
    p('The **top note** deserves special attention. Whatever note is highest in a voicing is the one listeners hear as a melody, even when you do not intend it. Good comping chooses voicings whose top notes form a smooth line from chord to chord, and good players often choose the top note first and build the voicing down from it.'),
    table(['Voicing', 'Notes', 'Best for'], [
      ['Shell', 'R–3–7 or R–7–3', 'left-hand comping, learning the changes, solo piano'],
      ['Rootless A / B', '3–5–7–9 / 7–9–3–5 (13 for 5 on dominants)', 'comping with a bassist'],
      ['Drop 2', 'a close voicing with the second voice from the top dropped an octave', 'harmonising a melody, a big open sound'],
      ['10th', 'root with the 3rd an octave up', 'a full left hand in a low register'],
    ]),
    p('These three families are only the beginning. Quartal voicings built from stacked 4ths, upper-structure triads, slash-chord voicings and the clustered sounds of neo-soul all have lessons of their own. But each of them builds on the same principles: keep the guide tones, choose tensions for colour, respect the register, and watch the top note.'),
    ear('When you hear a chord you like on a record, listen to its top note and its bass note before anything else. Those two outer voices tell you most of what you need to recreate the sound; the inner voices can usually be worked out from the chord symbol.'),
    tryIt('Voice the same ii–V–I in C three ways: shells in the left hand, rootless A–B–A voicings with a bass note under them, and drop 2 voicings with a melody on top. Play each one slowly and listen to how the character changes while the harmony stays the same.'),
    recap([
      'A voicing decides which chord tones to play, where, and which goes on top.',
      'Keep the 3rd and 7th; add tensions for colour; leave the root to the bass and drop the 5th first.',
      'Shells (R–3–7 / R–7–3) and rootless A/B voicings alternate so that voices move by step.',
      'Drop 2 lowers the second voice from the top an octave for an open, orchestral sound.',
      'Keep small intervals out of the low register, and choose top notes that make a smooth line.',
    ]),
    drill('gym.name'),
  ],
  drills: ['gym.shells', 'gym.name', 'gym.play.ext'],
};
