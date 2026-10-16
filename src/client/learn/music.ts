// Turn musical ideas (intervals, chords, scales, progressions) into timed note
// events for the audio engine, plus parsing of chord symbols and pitches.

import { PART, type NoteEvent } from '../audio/engine';
import { midiAtOrAbove, mod, noteName, noteToMidi, parseNote, pc, spellPc, type Note } from '../theory/core';
import { CHORD_TYPES, chordPcs, chordSymbol } from '../theory/chords';
import { parseRoman, prefersFlats, type Key, keyFromName } from '../theory/keys';
import { scaleSemis } from '../theory/scales';
import { voiceChord } from '../theory/voicing';

// ---------------------------------------------------------------------------
// Chord symbols ("F#m7b5", "Bbmaj9", "C/E", "G13sus4", "Db7#11")

const SUFFIX_ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const ascii = (s: string) => s.replace(/♯/g, '#').replace(/♭/g, 'b');
  for (const t of CHORD_TYPES) {
    map[t.symbol] = t.id;
    map[ascii(t.symbol)] = t.id;
  }
  Object.assign(map, {
    M: 'maj', maj: 'maj', min: 'min', '-': 'min', dim: 'dim', o: 'dim', aug: 'aug',
    sus: 'sus4', M7: 'maj7', 'Δ7': 'maj7', 'Δ': 'maj7', min7: 'min7', '-7': 'min7', 'ø': 'm7b5', 'ø7': 'm7b5', 'ø9': 'm9b5',
    dim7: 'dim7', o7: 'dim7', mmaj7: 'mmaj7', mMaj7: 'mmaj7', 'm(maj9)': 'mmaj9', '+7': 'aug7', m69: 'm69', '69': '69',
    '7sus': '7sus4', '9sus': '9sus4', '13sus': '13sus4', alt: '7alt', m7: 'min7', m9: 'min9', m11: 'min11', m13: 'min13', m6: 'min6',
  });
  return map;
})();

export interface ParsedSymbol {
  root: Note;
  typeId: string;
  bass: Note | null;
}

export function parseChordSymbol(sym: string): ParsedSymbol | null {
  const m = /^([A-G](?:#|b|♯|♭)?)(.*?)(?:\/([A-G](?:#|b|♯|♭)?))?$/.exec(sym.trim());
  if (!m) return null;
  const root = parseNote(m[1]);
  const typeId = SUFFIX_ALIASES[m[2]];
  if (!root || !typeId) return null;
  return { root, typeId, bass: m[3] ? parseNote(m[3]) : null };
}

/** Transpose a chord symbol by semitones, spelling roots for a flat or sharp key. */
export function transposeSymbol(sym: string, semis: number, flats: boolean): string {
  const p = parseChordSymbol(sym);
  if (!p) return sym;
  const spell = (n: Note) => spellPc(pc(n) + semis, flats ? 'flat' : 'sharp');
  return chordSymbol(spell(p.root), p.typeId, p.bass ? spell(p.bass) : null);
}

/** Parse "C4", "F#3", "Bb2" → MIDI. */
export function parsePitch(s: string): number | null {
  const m = /^([A-G](?:#|b|♯|♭|x|bb)?)(-?\d)$/.exec(s.trim());
  if (!m) return null;
  const n = parseNote(m[1]);
  return n ? noteToMidi(n, Number(m[2])) : null;
}

export interface ResolvedChord {
  rootPc: number;
  typeId: string;
  bassPc: number;
  symbol: string;
  label: string;
}

/** Resolve a progression token: a Roman numeral in the key, or a chord symbol. */
export function resolveChord(token: string, key: Key): ResolvedChord | null {
  const r = parseRoman(token, key);
  if (r) {
    const rootPc = pc(r.root);
    return { rootPc, typeId: r.typeId, bassPc: rootPc, symbol: r.symbol, label: token };
  }
  const s = parseChordSymbol(token);
  if (s) {
    const rootPc = pc(s.root);
    return { rootPc, typeId: s.typeId, bassPc: s.bass ? pc(s.bass) : rootPc, symbol: chordSymbol(s.root, s.typeId, s.bass), label: token };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Builders

export const ev = (note: number, start: number, dur: number, vel = 96, part: NoteEvent['part'] = PART.lesson): NoteEvent => ({
  note, start, dur, vel, part,
});

export function intervalEvents(low: number, high: number, mode: 'asc' | 'desc' | 'harm', gap = 0.75): NoteEvent[] {
  if (mode === 'harm') return [ev(low, 0, 1.4), ev(high, 0, 1.4)];
  const [a, b] = mode === 'asc' ? [low, high] : [high, low];
  return [ev(a, 0, gap * 0.95), ev(b, gap, 1.1)];
}

export function chordEvents(notes: number[], opts: { arp?: boolean; dur?: number; start?: number; vel?: number } = {}): NoteEvent[] {
  const start = opts.start ?? 0;
  const dur = opts.dur ?? 1.6;
  const sorted = [...notes].sort((a, b) => a - b);
  if (opts.arp) {
    const step = 0.18;
    return [
      ...sorted.map((n, i) => ev(n, start + i * step, step * 0.9, opts.vel)),
      ...sorted.map((n) => ev(n, start + sorted.length * step + 0.05, dur, (opts.vel ?? 96) - 8)),
    ];
  }
  return sorted.map((n, i) => ev(n, start + i * 0.01, dur, opts.vel));
}

export function melodyEvents(notes: number[], beat = 0.45, start = 0): NoteEvent[] {
  return notes.map((n, i) => ev(n, start + i * beat, beat * 0.92));
}

export function scaleEvents(tonicMidi: number, scaleId: string, dir: 'up' | 'down' | 'updown' = 'up', beat = 0.26): NoteEvent[] {
  const up = [...scaleSemis(scaleId).map((s) => tonicMidi + s), tonicMidi + 12];
  const notes = dir === 'up' ? up : dir === 'down' ? [...up].reverse() : [...up, ...up.slice(0, -1).reverse()];
  return melodyEvents(notes, beat);
}

/** Bass note + voice-led upper structure for one chord (rootless for 4+ note chords). */
export function chordMidis(rootPc: number, typeId: string, bassPc?: number, prev: number[] | null = null): number[] {
  const v = voiceChord(rootPc, typeId, prev, { bassPc });
  return [v.bass, ...v.upper];
}

export function symbolMidis(sym: string): number[] {
  const p = parseChordSymbol(sym);
  if (!p) return [];
  return chordMidis(pc(p.root), p.typeId, p.bass ? pc(p.bass) : undefined);
}

export type CompStyle = 'block' | 'swing' | 'funk' | 'ballad' | 'pulse';

export interface ProgressionPlay {
  events: NoteEvent[];
  /** start time (s) of each chord */
  times: number[];
  /** duration (s) of each chord */
  lengths: number[];
  chords: (ResolvedChord | null)[];
  duration: number;
  beat: number;
}

/**
 * Voice-led progression playback with a bass part. Tokens may be Roman
 * numerals (relative to `key`) or chord symbols.
 */
export function progressionEvents(
  key: Key | string,
  tokens: string[],
  opts: { bpm?: number; beats?: number | number[]; bass?: boolean; style?: CompStyle; start?: number } = {},
): ProgressionPlay {
  const k = typeof key === 'string' ? keyFromName(key) : key;
  const bpm = opts.bpm ?? 96;
  const beat = 60 / bpm;
  const style = opts.style ?? 'block';
  const events: NoteEvent[] = [];
  const times: number[] = [];
  const lengths: number[] = [];
  const chords: (ResolvedChord | null)[] = [];
  let t = opts.start ?? 0;
  let prev: number[] | null = null;
  tokens.forEach((tok, i) => {
    const beats = Array.isArray(opts.beats) ? opts.beats[i] ?? 4 : opts.beats ?? 2;
    const len = beats * beat;
    times.push(t);
    lengths.push(len);
    const c = resolveChord(tok, k);
    chords.push(c);
    if (c) {
      const v = voiceChord(c.rootPc, c.typeId, prev, { bassPc: c.bassPc, low: 55, high: 79 });
      prev = v.upper;
      pushComp(events, v.upper, t, beats, beat, style);
      if (opts.bass !== false) pushBass(events, v.bass, c, t, beats, beat, style, tokens[i + 1] ? resolveChord(tokens[i + 1], k) : null);
    }
    t += len;
  });
  return { events, times, lengths, chords, duration: t - (opts.start ?? 0), beat };
}

function pushComp(out: NoteEvent[], upper: number[], t: number, beats: number, beat: number, style: CompStyle): void {
  const hit = (at: number, dur: number, vel: number) => upper.forEach((n) => out.push(ev(n, t + at * beat, dur * beat, vel)));
  if (style === 'block') return hit(0, beats * 0.97, 86);
  if (style === 'pulse') {
    for (let b = 0; b < beats; b++) hit(b, 0.8, b === 0 ? 90 : 76);
    return;
  }
  if (style === 'ballad') {
    const pattern = [...upper, ...upper.slice(1, -1).reverse()];
    const step = beats / Math.max(4, pattern.length);
    pattern.forEach((n, j) => out.push(ev(n, t + j * step * beat, step * beat * 1.8, 78)));
    return;
  }
  if (style === 'swing') {
    // Charleston-ish comp: beat 1 and the "and" of 2 (swung), per 4 beats
    for (let b = 0; b < beats; b += 4) {
      hit(b, 0.6, 84);
      if (b + 1.66 < beats) hit(b + 1.66, 0.9, 78);
    }
    if (beats < 4) hit(0, Math.min(beats, 1) * 0.6, 84);
    return;
  }
  // funk: 16th stabs on 1, "a" of 1, "&" of 2, "e" of 4
  const stabs = [0, 0.75, 1.5, 3.25];
  for (let b = 0; b < beats; b += 4) for (const s of stabs) if (b + s < beats) hit(b + s, 0.2, s === 0 ? 96 : 82);
}

function pushBass(out: NoteEvent[], bass: number, c: ResolvedChord, t: number, beats: number, beat: number, style: CompStyle, next: ResolvedChord | null): void {
  const b = (n: number, at: number, dur: number, vel = 100) => out.push(ev(n, t + at * beat, dur * beat, vel, PART.bass));
  if (style === 'swing' && beats >= 2) {
    // walking: root, chord tones, chromatic approach to the next root
    const pcs = chordPcs(c.rootPc, c.typeId);
    const third = midiAtOrAbove(pcs[1] ?? c.rootPc, bass);
    const fifth = midiAtOrAbove(pcs[2] ?? pcs[1] ?? c.rootPc, bass);
    const target = next ? midiAtOrAbove(next.bassPc, bass - 5) : bass;
    const approach = target + (target > fifth ? -1 : 1);
    const line = beats >= 4 ? [bass, third, fifth, approach] : [bass, approach];
    line.slice(0, beats).forEach((n, i) => b(n, i, 0.9, i === 0 ? 100 : 86));
    return;
  }
  if (style === 'funk') {
    for (let k = 0; k < beats; k += 4) {
      b(bass, k, 0.45, 104);
      if (k + 1.5 < beats) b(bass + 12, k + 1.5, 0.2, 90);
      if (k + 2.75 < beats) b(bass, k + 2.75, 0.2, 86);
      if (k + 3.5 < beats) b(bass + 10, k + 3.5, 0.25, 84);
    }
    return;
  }
  b(bass, 0, beats * 0.9);
}

/** I–IV–V–I (or i–iv–V–i) cadence that establishes a key before ear questions. */
export function cadenceEvents(k: Key, bpm = 120): ProgressionPlay {
  const nums = k.mode === 'major' ? ['Imaj7', 'IVmaj7', 'V7', 'Imaj7'] : ['i7', 'iv7', 'V7', 'i6'];
  return progressionEvents(k, nums, { bpm, beats: 1.5, bass: true });
}

export function shiftEvents(events: NoteEvent[], dt: number): NoteEvent[] {
  return events.map((e) => ({ ...e, start: e.start + dt }));
}

export function eventsEnd(events: NoteEvent[]): number {
  return events.reduce((m, e) => Math.max(m, e.start + e.dur), 0);
}

/** Tonic MIDI note for a key placed comfortably around middle C. */
export function tonicMidi(k: Key, low = 55): number {
  return midiAtOrAbove(pc(k.tonic), low);
}

export const pcOfMidi = (m: number): number => mod(m, 12);

/** Transpose a reference-key progression into a target key. */
export function progressionInKey(chords: string[], refKey: string, target: Key): string[] {
  const ref = keyFromName(refKey);
  const semis = mod(pc(target.tonic) - pc(ref.tonic), 12);
  const flats = prefersFlats(target) || (target.mode === 'minor' && ['D', 'G', 'C', 'F', 'Bb', 'Eb'].includes(noteName(target.tonic).replace('♭', 'b')));
  return chords.map((c) => transposeSymbol(c, semis, flats));
}
