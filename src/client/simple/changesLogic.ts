// Changes: play over a looping progression and get scored on what you play
// against the chord sounding at that moment. Pure logic, so it can be tested.

import { INTERVALS, mod } from '../theory/core';
import { getChord } from '../theory/chords';
import type { CompStyle } from '../learn/music';

export type ChangesTask = 'guide' | 'downbeat' | 'line';

export interface Form {
  id: string;
  name: string;
  group: 'Jazz' | 'Soul & funk';
  /** reference key the chords are written in */
  key: string;
  chords: string[];
  /** beats per chord */
  beats: number[];
  style: CompStyle;
}

const fours = (n: number) => Array.from({ length: n }, () => 4);
const twos = (n: number) => Array.from({ length: n }, () => 2);

export const FORMS: Form[] = [
  { id: 'iivi', name: 'ii–V–I', group: 'Jazz', key: 'C', chords: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7'], beats: fours(4), style: 'swing' },
  { id: 'minor-iivi', name: 'Minor ii–V–i', group: 'Jazz', key: 'Cm', chords: ['Dm7b5', 'G7', 'Cm7', 'Cm7'], beats: fours(4), style: 'swing' },
  { id: 'turnaround', name: 'I–vi–ii–V turnaround', group: 'Jazz', key: 'C', chords: ['Cmaj7', 'A7', 'Dm7', 'G7'], beats: fours(4), style: 'swing' },
  { id: 'major-minor', name: 'ii–V–I major, then minor', group: 'Jazz', key: 'Gm', chords: ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7', 'Gm7', 'Gm7'], beats: fours(8), style: 'swing' },
  { id: 'blues', name: 'Jazz blues', group: 'Jazz', key: 'F', chords: ['F7', 'Bb7', 'F7', 'Cm7', 'F7', 'Bb7', 'Bdim7', 'F7', 'D7', 'Gm7', 'C7', 'F7', 'D7', 'Gm7', 'C7'], beats: [4, 4, 4, 2, 2, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2], style: 'swing' },
  { id: 'rhythm-a', name: 'Rhythm changes A', group: 'Jazz', key: 'Bb', chords: ['Bbmaj7', 'G7', 'Cm7', 'F7', 'Dm7', 'G7', 'Cm7', 'F7', 'Fm7', 'Bb7', 'Ebmaj7', 'Ab7', 'Dm7', 'G7', 'Cm7', 'F7'], beats: twos(16), style: 'swing' },
  { id: 'neo', name: 'Neo-soul 4–3–6 ("Just the Two of Us")', group: 'Soul & funk', key: 'Fm', chords: ['Dbmaj7', 'C7', 'Fm7', 'Ebm7', 'Ab7'], beats: [4, 4, 4, 2, 2], style: 'ballad' },
  { id: 'backdoor', name: 'R&B backdoor', group: 'Soul & funk', key: 'C', chords: ['Cmaj7', 'Am7', 'Fm7', 'Bb7'], beats: fours(4), style: 'ballad' },
  { id: 'dorian', name: 'Dorian vamp i7–IV7', group: 'Soul & funk', key: 'Dm', chords: ['Dm7', 'G7', 'Dm7', 'G7'], beats: fours(4), style: 'funk' },
  { id: 'dom-vamp', name: 'Dominant vamp I7–IV7', group: 'Soul & funk', key: 'E', chords: ['E7', 'A7', 'E7', 'A7'], beats: fours(4), style: 'funk' },
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
