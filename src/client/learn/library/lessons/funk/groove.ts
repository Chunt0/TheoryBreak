import type { Lesson } from '../../types';
import { drill, ear, example, h, onRecord, p, recap, table, tryIt } from '../blocks';

export const groove: Lesson = {
  id: 'funk.groove',
  title: 'The 16th-note groove',
  tags: ['funk', 'rhythm'],
  level: 1,
  summary: 'Funk is built on a continuous grid of 16th notes, anchored by the One. How syncopation, ghost notes and interlocking parts turn very simple patterns into a groove.',
  blocks: [
    p('In most of the music in this library, harmony leads and rhythm supports. In funk it is the other way round. A funk tune might sit on one chord for five minutes, and nobody minds, because the excitement is in the rhythm — in the way a handful of simple, repeated parts lock together into something that makes people move. From James Brown\'s bands in the late 1960s through Sly & the Family Stone, The Meters, Parliament-Funkadelic and Tower of Power, funk musicians refined that craft into a precise language.'),
    p('Understanding that language — the grid, the One, syncopation, ghost notes and interlock — will change how you hear funk, R&B, hip-hop and neo-soul, and it is essential for playing any of them.'),

    h('The grid'),
    p('Funk lives on a **continuous grid of 16th notes**: every beat divided into four equal parts, counted **"1 e & a, 2 e & a, 3 e & a, 4 e & a"**. The "1" is the beat itself, the "&" is halfway through it, and the "e" and "a" are the in-between 16ths.'),
    p('What makes funk distinctive is that this grid is always present. Somebody — the hi-hat, a muted guitar scratch, a clavinet — is usually playing every 16th or nearly every one, so the whole band, and the listener, feels every slot of the grid all the time. That constant pulse is the canvas; everything else is painted on it. Because every slot is felt, a note placed on an "e" or an "a" has a precise, tangible effect, rather than just sounding vaguely off the beat.'),

    h('The One'),
    p('James Brown famously organised his music around **"the One"** — the first beat of the bar. In his bands, everyone lands together on beat 1 with weight and conviction, and much of the rest of the bar is free to be syncopated, sparse or busy. The One is the anchor that makes all the syncopation make sense: you can push and pull against the beat as much as you like, as long as everyone knows where home is and arrives there together.'),
    p('This is different from rock and pop, where the backbeat — the snare on beats 2 and 4 — often feels like the strongest pulse. In funk the backbeat is still there, but the emphasis on the One gives the groove a forward-leaning, circular quality: each bar rolls towards the next downbeat.'),

    h('Syncopation on the e and the a'),
    p('A **syncopation** is an accent on a weak part of the beat. In funk the most important weak positions are the **e** and the **a** — the second and fourth 16ths of each beat. An accent on the "a" of a beat arrives just before the next beat, so it sounds like it is leaning into it, pushing the music forward. An accent on the "e" arrives just after a beat, a little late, giving a snappy, hiccuping feel.'),
    p('Often the strong position after a syncopation is left empty. If you accent the "a" of beat 2 and then play nothing on beat 3, the ear hears the "a" as an early arrival of beat 3 — an **anticipation**. Anticipations are everywhere in funk bass lines and horn parts.'),
    { t: 'rhythm', cells: ['1001', '0010', '1011', '0010'], caption: 'A bass-style figure: the One, the a of 1, the & of 2, then 3 – & – a and the & of 4.', bpm: 96 },
    { t: 'rhythm', cells: ['1000', '1001', '0110', '1010'], caption: 'Anticipations: the a of 2 arrives early for an empty beat 3, then the e and & of 3 push on towards 4.', bpm: 96 },

    h('Ghost notes and dynamics'),
    p('Funk is as much about **how loudly** notes are played as about which slots they fall in. Between the accents, players fill the grid with **ghost notes** — notes so quiet they are felt more than heard. A drummer plays soft snare taps between the backbeats; a guitarist strums muted strings in a steady 16th-note scratch; a bass player adds muted "dead" notes. Ghost notes keep the grid audible and give the accents something to push against. Take them away and the same accents sound stiff and isolated; put them back and the groove breathes.'),
    p('The contrast between loud and quiet is one of the main expressive tools in funk. A groove can stay on one chord and one pattern while the band builds and releases intensity just by changing dynamics.'),

    h('Interlock'),
    p('The secret of a funk band is that every individual part is **simple** — often a one- or two-bar pattern repeated for the whole tune — but the parts are designed to fit together like gears. Each instrument occupies different slots of the grid, so that together they form a dense, detailed composite rhythm that no single player is playing.'),
    p('A typical division of labour: the **drums** lock the One with the kick and the backbeat with the snare, and keep the 16ths going on the hi-hat. The **bass** plays a strong note on the One and syncopated pickups that lead back to it, leaving space in between. **Guitar or clavinet** fills the grid with short chord stabs and muted 16ths. **Horns** punctuate the off-beats with short, sharp hits. The most important skill is restraint: leaving space so that the other parts can be heard.'),
    table(['Feel', 'Grid', 'Where you hear it'], [
      ['Straight 16ths', '1 e & a, evenly spaced', 'classic funk, disco'],
      ['Swung 16ths', 'long–short pairs of 16ths', 'neo-soul, hip-hop, some R&B'],
      ['Shuffle', 'triplets: 1 trip let', 'blues, New Orleans grooves'],
    ]),
    p('Not all 16th grooves are perfectly even. Neo-soul and hip-hop often **swing** their 16ths — each pair played long–short — or place some parts slightly behind the beat for a loose, lazy feel. Classic funk and disco keep the 16ths straight and tight. The rhythm lessons go into swing in detail.'),
    example('Lock a syncopated figure to the One', [
      'Count 16ths through the bar out loud: "1 e & a 2 e & a…".',
      'Play beat 1 strong, then the "a" of 1 and the "&" of 2. The late hits lean into beat 2 instead of landing on it.',
      'Keep the 16ths in between alive with ghost notes, so the accents have something to push against.',
    ]),
    onRecord('Clyde Stubblefield\'s drumming on James Brown\'s "Funky Drummer" is a masterclass in ghost notes and the One. The Meters\' "Cissy Strut" shows how sparse interlocking parts can be, and Tower of Power\'s rhythm section shows how tight a straight 16th-note grid can sound with a full band.'),
    ear('To find your way into a funk groove, first find the grid — usually in the hi-hat or the guitar scratch. Then find the One: where does everybody land together? Then pick out one instrument and listen to which slots it plays and which it leaves empty.'),
    tryIt('Tap the two rhythms above while counting every 16th out loud. Then tap the One with one hand and keep the 16ths going softly with the other, adding accents on the "e" and "a" slots. The Rhythm drill under Ear has 16th-note patterns to tap and to recognise by ear.'),
    recap([
      'Funk is built on a continuous 16th-note grid, counted "1 e & a".',
      'The One — beat 1 — is the anchor everyone lands on; syncopation is measured against it.',
      'Accents on the e and a push and pull against the beat; an "a" before an empty beat is an anticipation.',
      'Ghost notes fill the grid quietly between accents; dynamics are part of the groove.',
      'Simple parts interlock: each instrument takes different slots, and space matters as much as notes.',
    ]),
    drill('rhythm.tap.funk', 2),
  ],
  drills: ['rhythm.tap.funk', 'rhythm.ear.funk', 'rhythm.tap.sync'],
};
