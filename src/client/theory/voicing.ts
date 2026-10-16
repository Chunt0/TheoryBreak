import { INTERVALS, midiAtOrAbove, mod } from './core';
import { getChord } from './chords';

export interface PlayVoicing {
  bass: number;
  upper: number[];
}

/**
 * Voice a chord for playback the way a jazz keyboardist would: root in the
 * bass, a rootless upper structure (for 7th chords and beyond) with the 5th
 * dropped first and at most five voices, voice-led as smoothly as possible
 * from the previous chord.
 */
export function voiceChord(
  rootPc: number,
  typeId: string,
  prev: number[] | null,
  opts: { bassPc?: number; low?: number; high?: number; bassLow?: number } = {},
): PlayVoicing {
  const chord = getChord(typeId);
  let ivs = chord.intervals.slice();
  if (ivs.length >= 4) ivs = ivs.filter((i) => i !== 'P1');
  if (ivs.length >= 5) ivs = ivs.filter((i) => i !== 'P5');
  if (ivs.length >= 5) ivs = ivs.filter((i) => i !== 'P11' || typeId === 'min11' || typeId === 'dom11');
  const pcs = [...new Set(ivs.map((i) => mod(rootPc + INTERVALS[i].semis, 12)))];
  const low = opts.low ?? 53;
  const high = opts.high ?? 78;
  const bass = midiAtOrAbove(opts.bassPc ?? rootPc, opts.bassLow ?? 36);

  let best: number[] | null = null;
  let bestCost = Infinity;
  for (let start = low; start <= Math.min(low + 16, high - 4); start++) {
    if (!pcs.includes(mod(start, 12))) continue;
    const notes = [start];
    for (const p of pcs) if (p !== mod(start, 12)) notes.push(midiAtOrAbove(p, start + 1));
    notes.sort((a, b) => a - b);
    if (notes[notes.length - 1] > high) continue;
    // avoid muddy close intervals low in the register
    const mud = notes[0] < 58 && notes[1] - notes[0] < 3 ? 6 : 0;
    const cost = (prev && prev.length ? leadCost(prev, notes) : Math.abs(centroid(notes) - 66)) + mud;
    if (cost < bestCost) {
      bestCost = cost;
      best = notes;
    }
  }
  return { bass, upper: best ?? pcs.map((p) => midiAtOrAbove(p, 60)).sort((a, b) => a - b) };
}

const centroid = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length;

function leadCost(prev: number[], next: number[]): number {
  let cost = 0;
  for (const n of next) cost += Math.min(...prev.map((p) => Math.abs(p - n)));
  return cost + Math.abs(centroid(prev) - centroid(next)) * 0.5;
}
