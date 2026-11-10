import type { Lesson } from '../../types';
import { example, h, p, recap, table, tryIt } from '../blocks';
import { ARP, ARP_LEN } from './demos';

export const arp: Lesson = {
  id: 'seq.arp',
  title: 'Arpeggiators & playing a rack live',
  tags: ['seq'],
  level: 3,
  summary: 'Turning held chords into moving patterns: arpeggiator modes, octaves, gate length and clock sync — and the performance moves that let you improvise with harmony while the rack handles the rhythm.',
  blocks: [
    p('An **arpeggiator** takes the notes you hold down and plays them one at a time, in a repeating pattern: a held chord becomes a moving line. It is a simple idea with a big effect, and it sits right at the meeting point of this library\'s two halves. The arpeggiator turns harmony into rhythm, so everything you know about chords and progressions becomes something you can perform live: change the chord and the pattern follows instantly.'),

    h('How an arpeggiator works'),
    p('Hold a chord and the arpeggiator steps through its notes in time with a clock. Its **mode** decides the order: **up** plays the notes from lowest to highest and starts again; **down** goes from highest to lowest; **up-down** climbs and then descends; **random** picks notes in no fixed order. An **octave** setting repeats the pattern across one to four octaves, stretching a small chord into a long, sweeping, harp-like run.'),
    p('In this rack, the arpeggiator needs to receive several notes at once, so set the MIDI module to two or more voices and feed the arpeggiator its V/Oct and Gate signals. Its output then plays a single voice — the arpeggiated line — through whatever patch you connect it to.'),
    { t: 'synth', demo: ARP },
    p('In the demo, Cm7 and then A♭maj7 are held and arpeggiated in 16ths over two octaves, in each of the four modes. Notice how the same two chords produce four quite different melodic shapes, and how changing the chord immediately changes the notes while the rhythm runs on.'),

    h('Gate length and clock sync'),
    p('The arpeggiator\'s **gate length** (Len) controls articulation: how long each note is held relative to the step. A **short** gate gives staccato notes, separated by silence, which suits pluck patches whose envelopes can ring out on their own. A **full** gate gives legato notes that run into each other; on a pad patch with a sustaining envelope, this turns the arpeggio into a shimmering wash of sound.'),
    { t: 'synth', demo: ARP_LEN },
    p('In the demo, a held Dm7 is arpeggiated up and down in 8ths on a sustaining envelope with the gate at 15, 50 and 100 percent. The notes are identical each time; only the articulation changes, and with it the whole character of the part.'),
    p('**Clock sync** keeps the arpeggio in time with everything else. Patch the rack\'s clock into the arpeggiator and it locks to the master tempo, and therefore to any drums and sequences running from the same clock. Without a clock input, its own Rate knob sets the speed.'),

    h('Playing it live'),
    p('With the arpeggiator handling the rhythm, your hands are free to make the musical decisions: which chords, when to change them, and how to shape the sound. A few performance moves make a big difference.'),
    table(['Performance move', 'How'], [
      ['Change chords on the beat', 'release and press just before the downbeat; the arp keeps time'],
      ['Open the filter by hand', 'a slow sweep with the mod strip or a knob is the classic build'],
      ['Delay synced to the arp', 'a dotted-8th echo doubles the pattern\'s density'],
      ['Inversions', 'play the same chord in a different inversion: the pattern\'s top note changes'],
      ['Mute and drop', 'stop the clock for a bar, then start it again on the One'],
    ]),
    p('Two of these deserve a little explanation. **Inversions** matter because the arpeggiator plays exactly the notes you hold: the same chord in a different inversion produces a pattern with a different top note and a different contour, so voice leading — moving each finger as little as possible between chords — makes an arpeggiated progression sound smooth and melodic, just as it does in a chorale. And a slow **filter sweep** over a running arpeggio is one of the classic builds of electronic dance music: the notes stay the same while the brightness rises, building tension towards a drop.'),
    example('Make the factory ARP LPG rack yours', [
      'Load ARP LPG: a wavetable voice through a low-pass gate, pinged by the arp\'s gates, with the wavetable swept by a slow looping Func.',
      'Hold a four-note chord and set the arp to Up-down over two octaves; set the delay to a dotted 8th (0.375 s at 120 BPM).',
      'Change chords every bar, following a progression you know (ii–V–I–VI): you are improvising with harmony while the arp handles the rhythm.',
    ]),
    tryIt('Patch an arpeggiator into a pluck voice, clocked from the rack\'s clock, and play a progression from the jazz or soul lessons — a ii–V–I or the "Just the Two of Us" loop — changing chords on the beat. Try each mode and octave range, then switch to a pad voice with a long gate. Finally, practise moving between chords with the smallest possible hand movement and listen to the arpeggio\'s line.'),
    recap([
      'An arpeggiator plays held notes one at a time — up, down, up-down or random — across one to four octaves.',
      'It turns harmony into rhythm: change the chord and the pattern follows.',
      'Gate length is articulation: short for staccato plucks, full for legato washes.',
      'Clock sync locks the arp to the rack\'s tempo and drums.',
      'Perform with chord changes on the beat, inversions for a smooth top line, filter sweeps and synced delay.',
    ]),
  ],
  drills: [],
};
