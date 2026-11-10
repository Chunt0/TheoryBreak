import type { Lesson } from '../../types';
import { drill, ear, example, h, listen, onRecord, p, recap, table, tryIt } from '../blocks';

export const minor: Lesson = {
  id: 'jazz.minor',
  title: 'The minor ii–V–i',
  tags: ['jazz'],
  level: 1,
  summary: 'The minor-key cadence: a half-diminished ii, a dominant with a ♭9, and a minor tonic with a 6th or major 7th. Why each chord is the way it is, and how to hear it coming.',
  blocks: [
    p('Major keys have ii–V–I; minor keys have their own version, **ii–V–i**, and it sounds quite different — darker, more dramatic, with a sharper sense of tension and release. In C minor it is Dm7♭5 – G7♭9 – Cm6. Minor ii–V–is are everywhere in the repertoire, and many of the best-loved standards move back and forth between major and minor ii–Vs, so you need to hear the difference instantly.'),
    p('Each of the three chords has its own story, and all three stories come back to the same source: the harmonic and melodic forms of the minor scale.'),

    h('The ii: half-diminished'),
    p('Build a seventh chord on degree 2 of C natural or harmonic minor and you get D F A♭ C: **Dm7♭5**, the half-diminished chord. Its ♭5 (A♭) is the ♭6 of the key, and that note is the first sign of the minor key — in a major ii–V, the same chord would be Dm7 with an A natural.'),
    p('The half-diminished chord sounds darker and less settled than a minor 7th. As a predominant it works just like ii in major: its root moves up a 4th to the V, and its guide tones fall smoothly into the dominant — the C falls to B, and the F stays as the 7th of G7.'),

    h('The V: a dominant with a ♭9'),
    p('In natural minor, the chord on degree 5 is minor (G B♭ D F), and minor v does not pull strongly to the tonic. So minor-key cadences borrow from **harmonic minor**, which raises the 7th degree: B♭ becomes B, and the chord becomes **G7**, a real dominant with a tritone and a leading tone.'),
    p('Harmonic minor also supplies the dominant\'s tensions. Played from G, C harmonic minor is G A♭ B C D E♭ F — so the natural tensions over G7 are A♭ (the ♭9) and E♭ (the ♭13). That is why the minor V is usually written **G7♭9**, G7♭13 or G7alt. Those altered tensions are not arbitrary spice: they are notes of the C minor key, so the dominant is already hinting at where it is going. A ♭9 on a dominant is one of the clearest signals that a minor chord is coming.'),

    h('The i: a minor tonic with a 6th or major 7th'),
    p('You might expect the tonic to be Cm7. Sometimes it is, but jazz players often prefer **Cm6** or **Cm(maj7)**, and there is a good reason. The V chord just made a point of the leading tone B. A Cm7 contains B♭, which contradicts that B right at the moment of arrival. Cm(maj7) keeps the B; Cm6 avoids the question entirely by using A instead. Both come from **melodic minor**, and both sound settled and poised. Cm7 sounds a little more modal and is common too, especially when the tune lingers on the tonic.'),
    { t: 'prog', key: 'Cm', tokens: ['iiø7', 'V7b9', 'i6', 'i6'], style: 'swing', beats: 4, caption: 'Dm7♭5 – G7♭9 – Cm6' },
    listen([
      { label: 'Major ii–V–I', music: { prog: ['Dm7', 'G7', 'Cmaj7'], key: 'C', beats: 2, style: 'swing' }, note: 'bright, smooth' },
      { label: 'Minor ii–V–i', music: { prog: ['Dm7b5', 'G7b9', 'Cm6'], key: 'Cm', beats: 2, style: 'swing' }, note: 'darker, more dramatic' },
    ]),
    example('Minor ii–V–i in D minor', [
      'The ii is a whole step above D: E. In a minor key it is half-diminished: **Em7♭5** (E G B♭ D).',
      'The V is a 5th above D: A, with the ♭9 from harmonic minor: **A7♭9** (A C♯ E G B♭).',
      'The tonic: **Dm6** or Dm(maj7), which keeps the C♯ you just heard. A plain Dm7 would cancel it with a C natural.',
    ], { prog: ['Em7b5', 'A7b9', 'Dm6'], key: 'Dm', beats: 2 }),

    h('Scales for the minor ii–V–i'),
    p('Each chord has a natural scale choice, and the choices fit together neatly.'),
    p('Over the **half-diminished ii**, plain Locrian (D E♭ F G A♭ B♭ C) follows the key exactly, but its ♭9 (E♭) clashes with the root. Most players prefer **Locrian ♮2**, which uses E natural instead and gives the chord a smooth, usable 9th. It is the 6th mode of F melodic minor.'),
    p('Over the **V7♭9**, **Phrygian dominant** (the 5th mode of harmonic minor) follows the key and gives you the ♭9 and ♭13. The **altered** scale adds a ♯9 and ♯11 for even more tension.'),
    p('Over the **tonic**, **melodic minor** supplies the major 7th and natural 6th. **Dorian** works well if the tonic is a plain m7 and the tune stays there for a while.'),
    table(['Chord', 'Scale'], [
      ['iiø7', 'Locrian ♮2 (smooth) · Locrian'],
      ['V7♭9', 'Phrygian dominant (♭9 ♭13) · altered'],
      ['i6 / im(maj7)', 'melodic minor · Dorian for a plain m7'],
    ]),
    p('Guide tones work exactly as in major: the 7th of each chord falls by step to the 3rd of the next, and the 3rd stays to become the next 7th. In C minor: C (7th of Dm7♭5) falls to B (3rd of G7), and F (3rd of Dm7♭5) stays as the 7th of G7 before falling to E♭, the 3rd of Cm. The only difference from major is that last half step: F to E♭ rather than F to E.'),

    h('Major and minor side by side'),
    p('Many standards are built from both kinds of ii–V, often in the relative major and minor keys, which share most of their notes. "Autumn Leaves" is the classic example: a major ii–V–I to the relative major, then a minor ii–V–i to the tonic minor, over and over. Learning to hear which kind of ii–V is coming — and the ♭5 of the ii and the ♭9 of the V are the giveaways — is one of the most useful listening skills in jazz.'),
    { t: 'prog', key: 'Gm', tokens: ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7b9', 'Gm6', 'Gm6'], beats: 4, style: 'swing', caption: 'Relative major and minor: ii–V–I in B♭, then ii–V–i in G minor (the "Autumn Leaves" shape).' },
    example('Major or minor? Read the chart', [
      'The chart says Am7♭5 – D7♭9 – Gm6.',
      'The half-diminished ii and the ♭9 on the V both point to a minor target before it arrives: G minor.',
      'Compare Am7 – D7 – Gmaj7: the same roots, but a m7 ii and a plain dominant point to G major.',
    ], { prog: ['Am7b5', 'D7b9', 'Gm6'], key: 'Gm', beats: 2 }),
    onRecord('"Autumn Leaves", "Blue Bossa" and "Alone Together" all alternate major and minor ii–Vs. Listen for the moment the ii turns half-diminished and the V picks up its ♭9: that is the music turning towards the minor key.'),
    ear('The minor ii–V–i has a darker ii, an edgier V and a tonic that sounds poised rather than bright. The quickest tell is the V: if you hear the ♭9 — a note a half step above the root of the dominant — expect a minor chord next.'),
    tryIt('Play ii–V–i in C minor (Dm7♭5 – G7♭9 – Cm6), then in G minor and D minor. Then alternate: major ii–V–I in E♭ followed by minor ii–V–i in C minor, its relative. Notice how few notes change between the two keys, and how much the mood changes anyway.'),
    recap([
      'The minor ii–V–i is iiø7 – V7♭9 – i: Dm7♭5 – G7♭9 – Cm6 in C minor.',
      'The ii is half-diminished because degree 6 of the key is ♭6; that ♭5 is the first sign of minor.',
      'The V comes from harmonic minor: a raised leading tone, with ♭9 and ♭13 as its natural tensions.',
      'The tonic is often m6 or m(maj7), keeping the leading tone that V just sounded.',
      'Scales: Locrian ♮2, Phrygian dominant or altered, melodic minor.',
    ]),
    drill('jazz.relatedii', 3),
  ],
  drills: ['jazz.relatedii', 'gym.keys7.harm', 'ear.prog.jazz'],
};
