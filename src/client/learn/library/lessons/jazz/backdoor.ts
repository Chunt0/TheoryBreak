import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const backdoor: Lesson = {
  id: 'jazz.backdoor',
  title: 'Backdoor & modal interchange',
  tags: ['jazz', 'soul', 'core'],
  level: 2,
  summary: 'Borrowing chords from the parallel minor: the bittersweet minor iv, the backdoor ii–V (iv7 – ♭VII7 – I), and the wide-open ♭VI and ♭III — darker colours that never leave home.',
  blocks: [
    p('Not every chord from outside the key is a dominant pointing somewhere else. Some outside chords do something gentler and stranger: they cast a shadow over the music for a moment while the home key stays exactly where it was. An Fm6 near the end of a C major ballad, an A♭maj7 opening up in the middle of a soul tune, a B♭7 that slides into C without ever going near G7 — these chords are **borrowed** from the parallel minor key. The technique is called **modal interchange**, or modal mixture.'),
    p('Its most important product in jazz is the **backdoor ii–V**, a cadence that approaches the tonic from an unexpected direction. This lesson explains where borrowed chords come from, how they sound and how to use them.'),

    h('Same tonic, different mode'),
    p('C major and C minor share a tonic but differ in three notes. C minor (natural minor, or Aeolian) has **E♭, A♭ and B♭** where C major has E, A and B. Any chord built from those notes belongs to C minor rather than C major, and if you drop one into a C major tune, the ear hears a momentary darkening — the major key glimpsing its minor twin — without losing track of where home is.'),
    p('That is the difference between a borrowed chord and a modulation or secondary dominant. A secondary dominant adds a sharp, a new leading tone that points at another chord. A borrowed chord adds flats — the ♭3, ♭6 or ♭7 of the parallel minor — and keeps pointing at the same tonic.'),
    p('You can borrow from other modes on the same root too — D♭maj7 in C comes from C Phrygian, for instance — but the parallel minor supplies the chords you will meet most often.'),

    h('The minor iv'),
    p('The simplest and most common borrowed chord is the minor iv: **Fm**, **Fm6** or **Fm7** in C major. Its key note is A♭, the ♭6 of the key, which sits a half step above G and falls to it with a sigh. The progression IV – iv – I — Fmaj7, then Fm6, then Cmaj7 — is one of the most beautiful and recognisable sounds in harmony: the major IV turns minor for a moment, the A becomes A♭, and the A♭ melts down to G as the tonic arrives. It is called the **minor plagal cadence**, and it closes ballads, gospel songs and soul tunes everywhere.'),
    { t: 'prog', key: 'C', tokens: ['Imaj7', 'IVmaj7', 'iv6', 'Imaj7'], style: 'ballad', caption: 'IV → iv: the minor plagal cadence' },

    h('The backdoor ii–V'),
    p('The pair **iv7 – ♭VII7 → I** — Fm7 – B♭7 – Cmaj7 in C — is called the **backdoor ii–V**. It looks like a ii–V in E♭ (Fm7 – B♭7 is exactly that), but instead of resolving to E♭ it resolves to C, a whole step up. Instead of entering the tonic through the "front door" of G7, the music comes in through the back.'),
    p('It works because B♭7 brings notes that resolve smoothly into C. Its A♭ falls a half step to G; its F falls a half step to E; its D moves to C or E; and the bass rises a whole step from B♭ to C. There is no leading tone and no tritone resolving in the usual way, so the arrival is softer and warmer than V7 – I — a sideways glance rather than a push. (The negative harmony lesson shows that B♭9 is the mirror image of G9, which is another way of explaining why it feels like a dominant.)'),
    { t: 'prog', key: 'C', tokens: ['iv7', 'bVII7', 'Imaj7', 'Imaj7'], style: 'swing', caption: 'Backdoor: Fm7 – B♭7 – Cmaj7' },
    listen([
      { label: 'Front door', music: { prog: ['Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }, note: 'ii – V – I' },
      { label: 'Back door', music: { prog: ['Fm7', 'Bb7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }, note: 'iv7 – ♭VII7 – I' },
    ]),
    onRecord('The backdoor ii–V turns up in many standards. "Lady Bird" goes from its tonic to Fm7 – B♭7 and back to C in its opening bars, and "Misty" approaches its tonic E♭ through A♭m7 – D♭7. Players also use it freely as a substitute for an ordinary ii–V, especially at the end of a ballad.'),

    h('The other borrowed chords'),
    p('**♭VImaj7** (A♭maj7 in C) sounds wide and cinematic, as if the floor has dropped away to reveal a bigger room. It often moves to ♭VII and then home — **A♭ – B♭ – C**, the ♭VI – ♭VII – I cadence beloved of soul, gospel and rock, which climbs to the tonic by whole steps.'),
    p('**♭IIImaj7** (E♭maj7) is bold and bright in a surprising way, a major chord on the minor 3rd of the key. **♭IImaj7** (D♭maj7), borrowed from Phrygian, has the dark, plush colour of the Neapolitan chord and makes a smooth chromatic approach to the tonic. And **iiø7** (Dm7♭5) is a darker predominant: Dm7♭5 – G7 – Cmaj7 mixes a minor-key ii with a major-key ending, a common and lovely combination.'),
    table(['Borrowed', 'From C …', 'Example', 'Colour'], [
      ['iv, iv7, iv6', 'Aeolian', 'Fm7, Fm6', 'bittersweet ♭6'],
      ['♭VII7', 'Aeolian', 'B♭7', 'the backdoor dominant'],
      ['♭VImaj7', 'Aeolian', 'A♭maj7', 'wide, cinematic'],
      ['♭IIImaj7', 'Aeolian / Dorian', 'E♭maj7', 'bold'],
      ['♭IImaj7', 'Phrygian', 'D♭maj7', 'Neapolitan colour'],
      ['iiø7', 'Aeolian', 'Dm7♭5', 'a darker predominant'],
    ]),
    listen([
      { label: '♭VI – ♭VII – I', music: { prog: ['Abmaj7', 'Bb7', 'Cmaj7'], key: 'C', beats: 2 }, note: 'climbing home by whole steps' },
      { label: 'I – ♭IIImaj7', music: { prog: ['Cmaj7', 'Ebmaj7', 'Cmaj7'], key: 'C', beats: 2 }, note: 'a bold, bright shadow' },
      { label: '♭IImaj7 – I', music: { prog: ['Dbmaj7', 'Cmaj7'], key: 'C', beats: 2 }, note: 'a plush slide down' },
    ]),
    example('Where does A♭maj7 come from in C?', [
      'Spell it: A♭ C E♭ G.',
      'A♭ and E♭ are not in C major, so look for a mode on C with ♭3 and ♭6. Aeolian (C D E♭ F G A♭ B♭) contains all four notes, and so does Phrygian.',
      'So ♭VImaj7 is borrowed from C minor: the same tonic, a darker mode.',
    ], { prog: ['Cmaj7', 'Abmaj7', 'Cmaj7'], key: 'C', beats: 2, style: 'ballad' }),
    example('Analyse a ballad ending: Cmaj7 – Fmaj7 – Fm6 – Cmaj7', [
      'Cmaj7 and Fmaj7 are I and IVmaj7 in C.',
      'Fm6 (F A♭ C D) contains A♭, the ♭6 of C — borrowed from C minor: the minor iv.',
      'The A of Fmaj7 becomes A♭ and then falls to G in Cmaj7: one inner line, A – A♭ – G, carries the whole effect.',
    ], { prog: ['Cmaj7', 'Fmaj7', 'Fm6', 'Cmaj7'], key: 'C', beats: 2, style: 'ballad' }),

    h('Scales for borrowed chords'),
    p('The lesson on chord–scales outside the key gives the method: keep each borrowed chord\'s own tones and fill the gaps from the key it is borrowed from. Fm7 filled from C minor gives **F Dorian**. A♭maj7 gives **A♭ Lydian**. B♭7 gives **B♭ Mixolydian** — or, if you keep C major\'s E for its ♯11, **B♭ Lydian dominant**, which many players prefer because that E is the 3rd of the Cmaj7 about to arrive.'),
    ear('Borrowed chords sound like a cloud passing over the sun: the key does not change, but the light does. Listen for the ♭6 in particular — a note a half step above the 5th of the key that sinks down to it. When you hear that sigh, a minor iv or backdoor dominant is usually responsible.'),
    tryIt('In C, play IV – iv – I, then ii – V – I followed by iv7 – ♭VII7 – I, then ♭VI – ♭VII – I. Then take a simple tune you know in a major key and replace its IV near the end with iv6, or its ii–V with the backdoor. Notice how much emotional weight a single borrowed chord adds.'),
    recap([
      'Modal interchange borrows chords from the parallel minor (or another mode on the same tonic).',
      'Borrowed chords bring ♭3, ♭6 or ♭7 and darken the music without changing the tonic.',
      'The minor iv (Fm6 in C) resolves its ♭6 down to 5: the minor plagal cadence.',
      'The backdoor ii–V, iv7 – ♭VII7 – I (Fm7 – B♭7 – C), approaches the tonic from a whole step below.',
      '♭VImaj7, ♭IIImaj7, ♭IImaj7 and iiø7 add wide, bold, plush and dark colours.',
    ]),
    drill('gym.interchange'),
  ],
  drills: ['gym.interchange', 'ear.prog.subs', 'ear.prog.soul'],
};
