// Changes: play over a looping progression and get scored on what you play
// against the chord sounding at that moment. Pure logic, so it can be tested.

import { INTERVALS, mod } from '../theory/core';
import { getChord } from '../theory/chords';
import type { CompStyle } from '../learn/music';

export type ChangesTask = 'guide' | 'downbeat' | 'line';

export const FORM_GROUPS = ['Jazz', 'Blues', 'Substitutions', 'Modal & Latin', 'Soul & funk', 'Gospel'] as const;

export interface Form {
  id: string;
  name: string;
  group: (typeof FORM_GROUPS)[number];
  /** reference key the chords are written in */
  key: string;
  chords: string[];
  /** beats per chord */
  beats: number[];
  style: CompStyle;
  /** what to hear in it, in degrees so it reads in any key */
  about: string;
}

const fours = (n: number) => Array.from({ length: n }, () => 4);
const twos = (n: number) => Array.from({ length: n }, () => 2);

export const FORMS: Form[] = [
  // Jazz
  { id: 'iivi', name: 'ii–V–I', group: 'Jazz', key: 'C', chords: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7'], beats: fours(4), style: 'swing',
    about: "The cadence under most standards. ii's ♭7 falls a half step to V's 3rd; V's ♭7 falls to I's 3rd." },
  { id: 'minor-iivi', name: 'Minor ii–V–i', group: 'Jazz', key: 'Cm', chords: ['Dm7b5', 'G7', 'Cm7', 'Cm7'], beats: fours(4), style: 'swing',
    about: "iiø7 and V7 come from harmonic minor: the key's ♭6 is ii's ♭5 and V's ♭9, and V's 3rd is the raised 7th." },
  { id: 'turnaround', name: 'I–VI7–ii–V', group: 'Jazz', key: 'C', chords: ['Cmaj7', 'A7', 'Dm7', 'G7'], beats: fours(4), style: 'swing',
    about: 'VI7 is V7 of ii: its 3rd, ♯1, leads up a half step into the root of ii.' },
  { id: 'long-iivi', name: 'iii–VI7–ii–V–I', group: 'Jazz', key: 'C', chords: ['Em7', 'A7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7'], beats: fours(6), style: 'swing',
    about: 'Back-cycling: every chord is a 5th above the next, so the guide tones keep trading a half step down.' },
  { id: 'major-minor', name: 'Relative ii–Vs', group: 'Jazz', key: 'Gm', chords: ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7', 'Gm7', 'Gm7'], beats: fours(8), style: 'swing',
    about: 'The relative major and minor ii–Vs on one key signature (the Autumn Leaves shape). ♭VImaj7 pivots between them.' },
  { id: 'whole-steps', name: 'Whole-step ii–V', group: 'Jazz', key: 'D',
    chords: ['Em7', 'A7', 'Dmaj7', 'Dmaj7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7', 'Cm7', 'F7', 'Bbmaj7', 'Em7b5', 'A7'], beats: [...fours(11), 2, 2], style: 'swing',
    about: 'Three keys a whole step apart (the Tune Up shape): each I turns minor and becomes the ii of the next key down.' },
  { id: 'rhythm-a', name: 'Rhythm A', group: 'Jazz', key: 'Bb', chords: ['Bbmaj7', 'G7', 'Cm7', 'F7', 'Dm7', 'G7', 'Cm7', 'F7', 'Fm7', 'Bb7', 'Ebmaj7', 'Ab7', 'Dm7', 'G7', 'Cm7', 'F7'], beats: twos(16), style: 'swing',
    about: 'I–VI7–ii–V, iii–VI7–ii–V, a ii–V into IV, ♭VII7, and back: two beats a chord, so think a bar ahead.' },
  { id: 'rhythm-b', name: 'Rhythm bridge', group: 'Jazz', key: 'Bb', chords: ['D7', 'D7', 'G7', 'G7', 'C7', 'C7', 'F7', 'F7'], beats: fours(8), style: 'swing',
    about: 'III7–VI7–II7–V7, two bars each round the cycle of 5ths. Every ♭7 falls a half step to the next 3rd.' },
  { id: 'passing-dim', name: 'Passing °7s', group: 'Jazz', key: 'C', chords: ['Cmaj7', 'C#dim7', 'Dm7', 'D#dim7', 'Em7', 'A7', 'Dm7', 'G7'], beats: [...fours(6), 2, 2], style: 'swing',
    about: '♯I°7 is a rootless VI7♭9 (V of ii), ♯II°7 a rootless VII7♭9 (V of iii): the bass climbs by half steps, 1–♯1–2–♯2–3.' },
  { id: 'cliche', name: 'Minor line cliché', group: 'Jazz', key: 'Am', chords: ['Am', 'Am(maj7)', 'Am7', 'Am6'], beats: fours(4), style: 'ballad',
    about: 'One voice moves, 1–7–♭7–6, a half step at a time under a held minor triad. Make that voice your line.' },

  // Blues
  { id: 'blues12', name: '12-bar blues', group: 'Blues', key: 'F', chords: ['F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'F7', 'C7', 'Bb7', 'F7', 'C7'], beats: fours(12), style: 'swing',
    about: "All dominant 7ths. I7 to IV7 is a guide-tone half step: I's 3rd falls to IV's ♭7, I's ♭7 to IV's 3rd." },
  { id: 'blues', name: 'Jazz blues', group: 'Blues', key: 'F', chords: ['F7', 'Bb7', 'F7', 'Cm7', 'F7', 'Bb7', 'Bdim7', 'F7', 'D7', 'Gm7', 'C7', 'F7', 'D7', 'Gm7', 'C7'], beats: [4, 4, 4, 2, 2, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2], style: 'swing',
    about: 'The 12 bars with a ii–V into IV (bar 4), ♯iv°7 (bar 6), VI7 into ii–V (bars 8–10) and a I–VI–ii–V turnaround.' },
  { id: 'minor-blues', name: 'Minor blues', group: 'Blues', key: 'Cm', chords: ['Cm7', 'Cm7', 'Cm7', 'Cm7', 'Fm7', 'Fm7', 'Cm7', 'Cm7', 'Ab7', 'G7', 'Cm7', 'Dm7b5', 'G7'], beats: [...fours(11), 2, 2], style: 'swing',
    about: 'i7 and iv7, then ♭VI7–V7: ♭VI7 is the tritone sub of V7/V, sliding a half step down into the dominant.' },
  { id: 'bird-blues', name: 'Bird blues', group: 'Blues', key: 'F',
    chords: ['Fmaj7', 'Em7b5', 'A7', 'Dm7', 'G7', 'Cm7', 'F7', 'Bb7', 'Bbm7', 'Eb7', 'Am7', 'D7', 'Abm7', 'Db7', 'Gm7', 'C7', 'Fmaj7', 'D7', 'Gm7', 'C7'],
    beats: [4, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 4, 4, 2, 2, 2, 2], style: 'swing',
    about: 'ii–Vs falling by whole steps from bar 2 (viiø–III7, vi–II7, v–I7), then by half steps from bar 6 (iv–♭VII7, iii–VI7, ♭iii–♭VI7) down to ii–V.' },

  // Substitutions
  { id: 'tritone', name: 'Tritone sub', group: 'Substitutions', key: 'C', chords: ['Dm7', 'Db7', 'Cmaj7', 'Cmaj7'], beats: fours(4), style: 'swing',
    about: "♭II7's 3rd and ♭7 are V7's ♭7 and 3rd: the guide tones hold while the bass slides down a half step." },
  { id: 'chromatic', name: 'Chromatic ii–Vs', group: 'Substitutions', key: 'C', chords: ['Em7', 'A7', 'Ebm7', 'Ab7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7'], beats: [...twos(6), 4, 4], style: 'swing',
    about: 'iii–VI7 slides down to ♭iii–♭VI7, then ii–V: each ii–V a half step below the last, the ♭VI7 a tritone sub for II7.' },
  { id: 'ladybird', name: 'Lady Bird', group: 'Substitutions', key: 'C', chords: ['Cmaj7', 'Eb7', 'Abmaj7', 'Db7'], beats: fours(4), style: 'swing',
    about: 'I–VI7–ii–V with every chord replaced: ♭III7 for VI7, ♭VImaj7 for ii, ♭II7 for V7. Roots still fall in 5ths.' },
  { id: 'coltrane', name: 'Coltrane cycle', group: 'Substitutions', key: 'C', chords: ['Dm7', 'Eb7', 'Abmaj7', 'B7', 'Emaj7', 'G7', 'Cmaj7', 'Cmaj7'], beats: [...twos(6), 4, 4], style: 'swing',
    about: 'ii, then three keys a major 3rd apart (♭VI, III, I), each reached by its own V7: the Countdown reharm of ii–V–I.' },
  { id: 'backdoor', name: 'Backdoor ♭VII7', group: 'Substitutions', key: 'C', chords: ['Cmaj7', 'Am7', 'Fm7', 'Bb7'], beats: fours(4), style: 'ballad',
    about: 'iv7–♭VII7, borrowed from the parallel minor, comes home from below: ♭6 falls to 5 instead of 7 rising to 1.' },

  // Modal & Latin
  { id: 'modal', name: 'So What form', group: 'Modal & Latin', key: 'Dm', chords: ['Dm7', 'Ebm7'], beats: [16, 16], style: 'swing',
    about: 'Four bars of one m7, then the same Dorian a half step up (the So What form). The 3rd and 7th move with it.' },
  { id: 'sus', name: 'Sus chords', group: 'Modal & Latin', key: 'D', chords: ['D7sus4', 'F7sus4'], beats: [8, 8], style: 'bossa',
    about: 'A 7sus4 has no 3rd: the 4th and ♭7 are its guide tones. They climb a minor 3rd with the chord (the Maiden Voyage shape).' },
  { id: 'andalusian', name: 'Andalusian', group: 'Modal & Latin', key: 'Am', chords: ['Am7', 'G7', 'Fmaj7', 'E7'], beats: fours(4), style: 'pulse',
    about: 'The bass walks down the minor tetrachord, 1–♭7–♭6–5; V7 brings in the raised 7th from harmonic minor.' },
  { id: 'bossa', name: 'Bossa nova', group: 'Modal & Latin', key: 'F', chords: ['Fmaj7', 'Fmaj7', 'G7', 'G7', 'Gm7', 'Gb7', 'Fmaj7', 'Gb7'], beats: fours(8), style: 'bossa',
    about: 'II7 (V of V) for two bars, then ii and its tritone-sub dominant ♭II7 home (the Ipanema A section).' },
  { id: 'minor-bossa', name: 'Minor bossa', group: 'Modal & Latin', key: 'Cm',
    chords: ['Cm7', 'Cm7', 'Fm7', 'Fm7', 'Dm7b5', 'G7', 'Cm7', 'Cm7', 'Ebm7', 'Ab7', 'Dbmaj7', 'Dbmaj7', 'Dm7b5', 'G7', 'Cm7', 'Dm7b5', 'G7'], beats: [...fours(15), 2, 2], style: 'bossa',
    about: 'i–iv–iiø–V–i, then a ii–V into ♭IImaj7, the Neapolitan, and back down (the Blue Bossa form).' },

  // Soul & funk
  { id: 'neo', name: 'Neo-soul 4–3–6', group: 'Soul & funk', key: 'Fm', chords: ['Dbmaj7', 'C7', 'Fm7', 'Ebm7', 'Ab7'], beats: [4, 4, 4, 2, 2], style: 'ballad',
    about: '♭VImaj7–V7–i7, then ♭vii7–♭III7: a ii–V whose I is the ♭VImaj7 that starts the loop again.' },
  { id: 'royal', name: 'Royal Road', group: 'Soul & funk', key: 'C', chords: ['Fmaj7', 'G7', 'Em7', 'Am7'], beats: fours(4), style: 'ballad',
    about: 'The city-pop and neo-soul staple: IV–V reaches for I and lands deceptively on iii, then vi.' },
  { id: 'descent', name: 'Down by step', group: 'Soul & funk', key: 'C', chords: ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7'], beats: fours(4), style: 'ballad',
    about: 'Diatonic 7ths sliding down by step, so every guide tone moves by step too: parallel 3rds and 7ths.' },
  { id: 'dorian', name: 'Dorian vamp', group: 'Soul & funk', key: 'Dm', chords: ['Dm7', 'G7', 'Dm7', 'G7'], beats: fours(4), style: 'funk',
    about: "Both chords from one Dorian scale: IV7's 3rd is the raised 6th that makes the mode Dorian." },
  { id: 'dom-vamp', name: 'Dominant vamp', group: 'Soul & funk', key: 'E', chords: ['E7', 'A7', 'E7', 'A7'], beats: fours(4), style: 'funk',
    about: "Two dominants a 4th apart, blues style: I7's 3rd falls a half step to IV7's ♭7, and back." },

  // Gospel
  { id: 'walkup', name: 'Gospel walk-up', group: 'Gospel', key: 'C', chords: ['Cmaj7', 'C7', 'Fmaj7', 'F#dim7', 'Cmaj7/G', 'A7', 'Dm7', 'G7'], beats: [...fours(4), ...twos(4)], style: 'ballad',
    about: 'I7 tips into IV, ♯iv°7 pushes the bass up a half step to 5 under I, then VI7–ii–V home.' },
  { id: 'seven-three-six', name: 'Gospel 7–3–6', group: 'Gospel', key: 'C', chords: ['Bm7b5', 'E7', 'Am7', 'D7', 'G7', 'Cmaj7'], beats: [...twos(4), 4, 4], style: 'ballad',
    about: 'Back-cycling from vii: each chord a 5th above the next, with secondary dominants on 3 and 2.' },
  { id: 'plagal', name: 'Minor plagal', group: 'Gospel', key: 'C', chords: ['Fmaj7', 'Fm6', 'Em7', 'A7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7'], beats: [4, 4, ...twos(4), 4, 4], style: 'ballad',
    about: 'IV turns minor (6 falls to ♭6, the gospel sigh), then falling 5ths home through iii–VI7–ii–V.' },
];
export const FORM_BY_ID: Record<string, Form> = Object.fromEntries(FORMS.map((f) => [f.id, f]));

/** Times around the form, so a run lasts about 8–12 bars. */
export const roundsFor = (f: Form): number => Math.max(1, Math.round(40 / f.beats.reduce((a, b) => a + b, 0)));

const ivs = (typeId: string) => getChord(typeId).intervals.map((i) => INTERVALS[i]);

/** The 3rd and 7th (a 6 chord's 6th, a sus chord's 4th) as pitch classes, 3rd first. */
export function guideTones(rootPc: number, typeId: string): number[] {
  const all = ivs(typeId);
  const third = all.find((i) => i.num === 3) ?? all.find((i) => i.num === 4 || i.num === 2);
  const seventh = all.find((i) => i.num === 7) ?? all.find((i) => i.num === 6) ?? all.find((i) => i.num === 5);
  return [third, seventh].filter((i) => i !== undefined).map((i) => mod(rootPc + i!.semis, 12));
}

/** Root, 3rd, 5th and 7th (or 6th), without the tensions. */
export function chordTones(rootPc: number, typeId: string): number[] {
  const all = ivs(typeId);
  const has7 = all.some((i) => i.num === 7);
  return all.filter((i) => [1, 2, 3, 4, 5, 7].includes(i.num) || (i.num === 6 && !has7)).map((i) => mod(rootPc + i.semis, 12));
}

/** Labels for the marks on the keys: "3", "♭7", "R"… keyed by pitch class. */
export function toneLabels(rootPc: number, typeId: string): Record<number, string> {
  const out: Record<number, string> = {};
  for (const i of ivs(typeId)) out[mod(rootPc + i.semis, 12)] = i.id === 'P1' ? 'R' : i.degree;
  return out;
}

export const targetsFor = (task: ChangesTask, rootPc: number, typeId: string): number[] =>
  task === 'downbeat' ? chordTones(rootPc, typeId) : guideTones(rootPc, typeId);

// ---------------------------------------------------------------- judging

export interface Slot {
  /** seconds */
  start: number;
  end: number;
  rootPc: number;
  typeId: string;
  /** index in the form */
  pos: number;
}

export interface Played {
  /** seconds, same clock as the slots */
  t: number;
  note: number;
}

export interface SlotResult {
  ok: boolean;
  /** notes that fell in this chord */
  notes: number;
  /** of those, on a target */
  hits: number;
  /** "no note", "not a guide tone", "too far from the last one"… when not ok */
  why?: string;
}

/**
 * Which chord a note belongs to. Players anticipate changes, so a note a little
 * before a chord counts for that chord.
 */
export function slotOf(slots: Slot[], t: number, early: number): number {
  for (let i = slots.length - 1; i >= 0; i--) if (t >= slots[i].start - early) return t < slots[i].end - (i < slots.length - 1 ? early : 0) ? i : -1;
  return -1;
}

/** Score every chord of a run. `beat` sets the timing windows. */
export function judge(task: ChangesTask, slots: Slot[], played: Played[], beat: number): SlotResult[] {
  const early = Math.min(0.15, beat * 0.3);
  const tol = Math.min(0.16, beat * 0.35);
  const by: Played[][] = slots.map(() => []);
  for (const p of played) {
    const i = slotOf(slots, p.t, early);
    if (i >= 0) by[i].push(p);
  }
  let lastGuide: number | null = null;
  return slots.map((s, i) => {
    const notes = by[i];
    const targets = targetsFor(task, s.rootPc, s.typeId);
    const hitsOf = (ns: Played[]) => ns.filter((p) => targets.includes(mod(p.note, 12)));
    const hits = hitsOf(notes);
    const base = { notes: notes.length, hits: hits.length };
    if (task === 'downbeat') {
      const near = notes.filter((p) => Math.abs(p.t - s.start) <= tol).sort((a, b) => Math.abs(a.t - s.start) - Math.abs(b.t - s.start))[0];
      if (!near) return { ...base, ok: false, why: 'nothing on beat 1' };
      return targets.includes(mod(near.note, 12)) ? { ...base, ok: true } : { ...base, ok: false, why: 'beat 1 was not a chord tone' };
    }
    if (!hits.length) {
      lastGuide = null;
      return { ...base, ok: false, why: notes.length ? 'no 3rd or 7th' : 'no note' };
    }
    if (task === 'guide') return { ...base, ok: true };
    // guide-tone line: the first guide tone moves to the nearest by step or stays
    const first = hits[0].note;
    const prev = lastGuide;
    lastGuide = hits[hits.length - 1].note;
    if (prev !== null && Math.abs(first - prev) > 2) return { ...base, ok: false, why: `leapt ${Math.abs(first - prev)} semitones` };
    return { ...base, ok: true };
  });
}

/** The smoothest next guide tone from `from` (MIDI), for the hint marks. */
export function nearestGuide(from: number, rootPc: number, typeId: string): number {
  let best = from;
  let dist = Infinity;
  for (const g of guideTones(rootPc, typeId)) {
    for (const m of [from - 12, from, from + 12].map((o) => o - mod(o, 12) + g)) {
      if (Math.abs(m - from) < dist) {
        dist = Math.abs(m - from);
        best = m;
      }
    }
  }
  return best;
}
