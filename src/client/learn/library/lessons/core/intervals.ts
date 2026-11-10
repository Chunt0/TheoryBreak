import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, p, recap, table, tryIt } from '../blocks';

export const intervals: Lesson = {
  id: 'core.intervals',
  title: 'Intervals: size, quality and job',
  tags: ['core'],
  level: 1,
  summary: 'Every chord, scale and melody is made of intervals. Name them by counting letters and semitones, and hear them by the job they do in harmony.',
  blocks: [
    p('An **interval** is the distance between two notes. It sounds like a small idea, but almost everything else in theory is built out of it. A chord is a stack of intervals. A scale is a row of them. A melody is a chain of steps and leaps, and voice leading is nothing more than watching the intervals between parts. Once you can name an interval quickly and recognise it by ear, the rest of harmony becomes a matter of combining things you already know.'),
    p('This lesson covers how intervals are named, a reliable way to work any of them out, and — most usefully — how to hear each one by the role it plays inside a chord.'),

    h('Two numbers in one name'),
    p('Every interval name has two parts: a **size** (2nd, 3rd, 5th…) and a **quality** (major, minor, perfect…). You need both because a note has two identities at once. It has a letter name, which tells you where it sits on the staff, and it has a pitch, which tells you which key on the keyboard it is. The size comes from the letters; the quality comes from the exact distance in semitones.'),
    p('**Size: count the letter names, both ends included.** From C up to E you pass through C, D, E — three letters, so it is a 3rd. From C up to A: C D E F G A, a 6th. There is no "zeroth": the same note twice is a unison, or 1st. Accidentals never change the size. C to E♭ is still a 3rd, and so is C♯ to E♭, because the letters are still C and E.'),
    p('**Quality: count the semitones.** Intervals fall into two families. The **perfect** family is the unison, 4th, 5th and octave. These are the simplest, most blended sounds in music — an octave is a 2:1 frequency ratio, a 5th is 3:2, a 4th is 4:3 — and they come in one "normal" size, called perfect. The other family is the 2nds, 3rds, 6ths and 7ths, which each come in two common sizes a semitone apart: **major** (the larger) and **minor** (the smaller).'),
    p('Push any interval one semitone wider than major or perfect and it becomes **augmented**; squeeze it one semitone narrower than minor or perfect and it becomes **diminished**. So a 5th can be diminished (6 semitones), perfect (7) or augmented (8), while a 3rd can be diminished, minor, major or augmented.'),

    h('The major-scale shortcut'),
    p('Counting semitones works, but it is slow and easy to get wrong by one. Fluent readers use a better reference: the major scale. Measured up from its tonic, **every note of a major scale is either a major or a perfect interval**. In C major, C–D is a major 2nd, C–E a major 3rd, C–F a perfect 4th, C–G a perfect 5th, C–A a major 6th, C–B a major 7th and C–C a perfect octave.'),
    p('So to identify any interval, imagine the major scale of the bottom note. If the top note is in that scale, the interval is major or perfect. If it is a semitone lower than the scale note, a major interval becomes minor and a perfect one becomes diminished. A semitone higher makes it augmented. You only have to know your major scales — which you need anyway — and every interval falls out of them.'),
    example('What interval is D up to B♭?', [
      'Size first: D E F G A B — six letters, so it is some kind of 6th.',
      'D major has B natural (D E F♯ G A **B** C♯), so D–B would be a major 6th.',
      'B♭ is a semitone lower than that, so a major 6th shrinks to a **minor 6th**. Check: 8 semitones.',
    ], { interval: 'm6', from: 'D4', dir: 'harm' }),
    p('The table below is the reference you will come back to. Read the right-hand column carefully: it is the bridge between knowing an interval and hearing it.'),
    table(['Interval', 'Semitones', 'Its job in harmony'], [
      ['minor 2nd', '1', 'the ♭9 rub; leading tone → tonic'],
      ['major 2nd', '2', 'the 9th; stepwise motion'],
      ['minor 3rd', '3', 'minor colour; also the ♯9 of a dominant'],
      ['major 3rd', '4', 'major colour; half of the dominant tritone'],
      ['perfect 4th', '5', 'quartal voicings; the sus4'],
      ['tritone (A4 / d5)', '6', 'the 3rd–♭7 of every dominant 7th'],
      ['perfect 5th', '7', 'the root–5th frame; V → I root motion'],
      ['minor 6th', '8', 'the ♭13; a major 3rd turned upside down'],
      ['major 6th', '9', 'the 13th; the 6 of a 6/9 chord'],
      ['minor 7th', '10', 'the ♭7 of dominant and minor 7th chords'],
      ['major 7th', '11', 'the maj7 rub against the octave'],
      ['octave', '12', 'the same letter, doubled'],
    ]),

    h('Why spelling matters'),
    p('On a keyboard, C–E♭ and C–D♯ are the same two keys. On paper they are different intervals — a minor 3rd and an augmented 2nd — and they mean different things. E♭ is the 3rd of a C minor chord. D♯ is the raised 9th of a C7♯9, a dominant chord with a bluesy clash in it. A chord chart that writes the wrong one is telling you the wrong story about what the note is doing. That is why the letter count comes first and the semitones second: the letters fix the role, the semitones fix the exact shade.'),
    example('Spell a minor 7th above F♯', [
      'Letters first: count seven letter names from F, counting F as 1 — F G A B C D **E**. Whatever the answer is, it is some kind of E.',
      'F♯ major contains E♯, so a major 7th would be E♯. A minor 7th is a semitone smaller: **E**.',
      'Check with semitones: F♯ up to E is 10, a minor 7th. E♯ would make it major (11), E♭ diminished (9).',
    ], { interval: 'm7', from: 'F#3', dir: 'harm' }),
    example('Spell an augmented 4th above B♭', [
      'Four letters from B: B C D **E**.',
      'B♭ major contains E♭, a perfect 4th above B♭. Augmented is one semitone wider, so the answer is **E** natural (6 semitones).',
      'Not F♭ — that is the same key on the piano, but it would be a diminished 5th, a different interval doing a different job. In C7, the E is the 3rd and the B♭ the 7th: that tritone is an augmented 4th, spelled with E.',
    ]),

    h('Hearing intervals by their job'),
    p('A common way to learn intervals by ear is to tie each one to the opening of a famous tune. It works for a while, but it breaks down quickly — especially for harmonic intervals, where both notes sound together and there is no melody to recognise. A more durable approach, and one that pays off directly in harmony, is to hear each interval as part of the chord sound it belongs to.'),
    p('Listen to a **minor 3rd** and you are hearing the core of a minor chord; a **major 3rd** is the bright core of a major chord. The **perfect 5th** is hollow and stable — it is the frame that holds a chord up without saying whether it is major or minor. The **perfect 4th** is open and slightly unresolved, the sound of sus chords and of quartal voicings in modal jazz.'),
    p('The **tritone** — six semitones, exactly half an octave — is the restless one. It sits between the 3rd and the 7th of every dominant 7th chord. In G7, B and F are a tritone apart, and they want to collapse inward to C and E: that pull is what makes V–I sound like an arrival. The **minor 7th** sounds open and bluesy, the colour of dominant and minor 7th chords. The **major 7th** is a soft rub, a note leaning just under the octave, and it gives a maj7 chord its glow. At the sharp end, the **minor 2nd** is the most biting dissonance there is — the ♭9 of an altered dominant — while the **major 2nd** is mild, the added 9th that softens a chord.'),
    listen([
      { label: 'm3 vs M3', music: { voicings: [['C4', 'Eb4'], ['C4', 'E4']], beat: 1.2 }, note: 'minor colour, then major' },
      { label: 'P4 vs P5', music: { voicings: [['C4', 'F4'], ['C4', 'G4']], beat: 1.2 }, note: 'open and suspended, then a stable frame' },
      { label: 'Tritone', music: { interval: 'TT', from: 'B3', dir: 'harm' }, note: 'B–F: the engine of G7' },
      { label: 'm7 vs M7', music: { voicings: [['C4', 'Bb4'], ['C4', 'B4']], beat: 1.4 }, note: 'bluesy and open, then the maj7 rub' },
      { label: '♭9 vs 9', music: { voicings: [['G2', 'Ab3'], ['G2', 'A3']], beat: 1.4 }, note: 'dark tension, then a smooth one' },
    ]),
    p('Practise both directions, and both ways of sounding them. **Melodic** intervals (one note after the other) are easier because you hear a motion; **harmonic** intervals (both together) are harder because you hear a colour. Most people also find descending intervals harder than ascending ones. That is normal — the drills mix all of them so that none becomes a blind spot.'),

    h('Beyond the octave, and upside down'),
    p('**Compound intervals** are simply intervals larger than an octave. A 9th is a 2nd plus an octave, a 10th is a 3rd plus an octave, an 11th a 4th, a 13th a 6th. To reduce one, subtract 7 from the number: 9 → 2, 11 → 4, 13 → 6. Jazz uses compound names for chord tensions on purpose. A 9th is the same pitch class as a 2nd, but calling it a 9th tells you it sits on top of a full 7th chord rather than crowding the root.'),
    p('**Inverting** an interval means flipping it — moving the bottom note up an octave so it becomes the top. Two simple rules describe what happens. The numbers always add up to 9: a 3rd becomes a 6th, a 2nd becomes a 7th, a 4th becomes a 5th. And the quality swaps: major becomes minor, augmented becomes diminished, and perfect stays perfect. The semitones, meanwhile, add up to 12. So a major 3rd (4) inverts to a minor 6th (8), and the tritone (6) inverts to another tritone.'),
    p('Inversion is a practical shortcut. Asked for a major 6th above C, you can think of the much smaller minor 3rd *below* C instead — that is A — and you have your answer without counting nine semitones. It also explains why a 3rd and a 6th sound related: they are the same two pitch classes seen from opposite ends.'),

    ear('Hold the bottom note in your head, hum the top one, and ask: *what chord does this pair belong to?* A minor 3rd means minor, a tritone means dominant, a major 7th means maj7. Naming the chord sound first and the interval second is quicker than counting, and it trains the ear you will use for harmony.'),
    tryIt('Pick any key and work out the interval from it to each of the other eleven notes using the major-scale shortcut: in the scale means major or perfect, a semitone below means minor or diminished. Then play each one and say its job out loud — "minor 3rd, minor chord".'),
    recap([
      'An interval has a size (count letter names, both ends included) and a quality (count semitones).',
      'Unisons, 4ths, 5ths and octaves are perfect; 2nds, 3rds, 6ths and 7ths are major or minor; one semitone further either way is augmented or diminished.',
      'Every note of a major scale is major or perfect above its tonic — use that to work out any interval quickly.',
      'Spelling tells you the role: C–E♭ (a minor 3rd) and C–D♯ (an augmented 2nd) sound alike but do different jobs.',
      'Inversions add up to 9 and swap the quality; compound intervals are simple ones plus an octave.',
    ]),
    drill('ear.int'),
    drill('gym.int.spell'),
  ],
  drills: ['ear.int', 'ear.int.desc', 'ear.int.harm', 'ear.int.compound', 'gym.int.spell'],
};
