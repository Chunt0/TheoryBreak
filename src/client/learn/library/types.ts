import { PART } from '../../audio/engine';
import { INTERVALS, noteName, parseNote, pc } from '../../theory/core';
import { keyFromName } from '../../theory/keys';
import type { NoteEvent, StaffChord } from '../types';
import type { SynthDemo } from '../synth/demo';
import { chordEvents, chordMidis, ev, intervalEvents, melodyEvents, parseChordSymbol, parsePitch, progressionEvents, scaleEvents, type CompStyle } from '../music';

export type Tag = 'core' | 'jazz' | 'funk' | 'soul' | 'bach' | 'rhythm' | 'modular' | 'seq' | 'fm';

export const TAG_NAMES: Record<Tag, string> = {
  core: 'Core harmony',
  jazz: 'Jazz',
  funk: 'Funk',
  soul: 'R&B / Gospel',
  bach: 'Bach & counterpoint',
  rhythm: 'Rhythm',
  modular: 'Modular synthesis',
  seq: 'Sequencing',
  fm: 'FM synthesis',
};

export type Music =
  | { notes: string[]; mode?: 'chord' | 'arp' | 'seq'; beat?: number }
  | { voicings: string[][]; beat?: number }
  | { interval: string; from: string; dir?: 'asc' | 'desc' | 'harm' }
  | { scale: string; from: string; dir?: 'up' | 'down' | 'updown'; drone?: boolean }
  | { chord: string; arp?: boolean }
  | { prog: string[]; key: string; bpm?: number; style?: CompStyle; beats?: number | number[] };

export type Block =
  /** prose: one or more paragraphs (blank line between), lists allowed */
  | { t: 'p'; md: string }
  /** a section heading inside the lesson */
  | { t: 'h'; md: string }
  /** a side note; `recap` is the lesson's short version, for coming back to */
  | { t: 'note'; kind: 'ear' | 'keys' | 'writing' | 'jazz' | 'recap'; md: string }
  | { t: 'keys'; notes: string[]; labels?: string[]; caption?: string }
  | { t: 'staff'; chords: { notes: string[]; label?: string }[]; caption?: string }
  | { t: 'listen'; items: { label: string; music: Music; note?: string }[] }
  | { t: 'prog'; key: string; tokens: string[]; caption?: string; bpm?: number; style?: CompStyle; beats?: number | number[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'rhythm'; cells?: string[]; per?: number; onsets?: number[]; caption?: string; bpm?: number }
  | { t: 'drill'; skill: string; count?: number; label?: string }
  /** a synth patch to hear in variants, see and open in the instrument */
  | { t: 'synth'; demo: SynthDemo }
  /** a step-by-step worked example, optionally with sound */
  | { t: 'example'; title: string; steps: string[]; music?: Music };

/** 1 = first steps, 2 = building on those, 3 = advanced. */
export type Level = 1 | 2 | 3;
export const LEVEL_NAMES: Record<Level, string> = { 1: 'basics', 2: 'intermediate', 3: 'advanced' };

export interface Topic {
  id: string;
  title: string;
  tags: Tag[];
  minutes: number;
  level: Level;
  summary: string;
  blocks: Block[];
  /** skills drilled from this topic */
  drills: string[];
}

/** A lesson as written: its reading time is worked out from what it holds. */
export type Lesson = Omit<Topic, 'minutes'>;

/** Reading time: prose at an unhurried pace, plus time to play and listen. */
export function readingMinutes(l: Lesson): number {
  let words = 0;
  let extra = 0;
  const count = (s: string) => s.split(/\s+/).filter(Boolean).length;
  for (const b of l.blocks) {
    if (b.t === 'p' || b.t === 'h' || b.t === 'note') words += count(b.md);
    else if (b.t === 'table') words += count([...b.head, ...b.rows.flat()].join(' ')) * 0.6;
    else if (b.t === 'example') { words += count(b.steps.join(' ')); extra += b.music ? 0.3 : 0; }
    else if (b.t === 'listen') extra += b.items.length * 0.2;
    else if (b.t === 'prog' || b.t === 'rhythm' || b.t === 'keys' || b.t === 'staff') extra += 0.3;
    else if (b.t === 'synth') extra += 0.6 + b.demo.tries.length * 0.15;
  }
  return Math.max(3, Math.round(words / 220 + extra));
}

export function staffFromStrings(chords: { notes: string[]; label?: string }[]): StaffChord[] {
  return chords.map((c) => ({
    notes: c.notes.map((n) => parsePitch(n) ?? 60),
    names: c.notes.map((n) => noteName(parseNote(n.replace(/-?\d$/, ''))!)),
    label: c.label,
  }));
}

/** Render a topic's musical example to note events. */
export function renderMusic(m: Music): NoteEvent[] {
  if ('notes' in m) {
    const mids = m.notes.map(parsePitch).filter((x): x is number => x !== null);
    if (m.mode === 'chord') return chordEvents(mids, { dur: 2 });
    if (m.mode === 'arp') return chordEvents(mids, { arp: true });
    return melodyEvents(mids, m.beat ?? 0.4);
  }
  if ('voicings' in m) {
    const beat = m.beat ?? 1.2;
    return m.voicings.flatMap((v, i) =>
      chordEvents(v.map(parsePitch).filter((x): x is number => x !== null), { start: i * beat, dur: beat * 0.95 }),
    );
  }
  if ('interval' in m) {
    const lo = parsePitch(m.from) ?? 60;
    return intervalEvents(lo, lo + INTERVALS[m.interval].semis, m.dir ?? 'asc');
  }
  if ('scale' in m) {
    const tonic = parsePitch(m.from) ?? 60;
    const run = scaleEvents(tonic, m.scale, m.dir ?? 'updown', 0.22);
    if (!m.drone) return run;
    const end = run.reduce((t, e) => Math.max(t, e.start + e.dur), 0);
    return [...run, ev(tonic - 24, 0, end, 70, PART.bass)];
  }
  if ('chord' in m) {
    const p = parseChordSymbol(m.chord);
    if (!p) return [];
    const mids = chordMidis(pc(p.root), p.typeId, p.bass ? pc(p.bass) : undefined);
    return m.arp ? chordEvents(mids, { arp: true }) : chordEvents(mids, { dur: 2 });
  }
  return progressionEvents(keyFromName(m.key), m.prog, { bpm: m.bpm ?? 96, style: m.style ?? 'block', beats: m.beats ?? 2 }).events;
}
