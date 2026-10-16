import type { NoteEvent } from '../audio/engine';
import type { RhythmPattern } from '../theory/rhythm';

// ---------------------------------------------------------------------------
// Progress / spaced repetition

export interface SkillStat {
  n: number;
  correct: number;
  /** exponential moving average of correctness, 0..1 */
  ema: number;
  streak: number;
  lastSeen: number;
  due: number;
  /** review interval in days */
  interval: number;
}

export interface ItemStat {
  n: number;
  ema: number;
  last: number;
}

export interface BlockLog {
  kind: string;
  title: string;
  attempts: number;
  correct: number;
  seconds: number;
}

export interface SessionLog {
  at: number;
  seconds: number;
  blocks: BlockLog[];
}

export interface ProgressData {
  skills: Record<string, SkillStat>;
  items: Record<string, Record<string, ItemStat>>;
  /** topics opened in the library: last visit + count */
  topics: Record<string, { last: number; views: number }>;
  /** challenges attempted */
  challenges: Record<string, { last: number; rating: number }>;
  sessions: SessionLog[];
  /** YYYY-MM-DD → seconds of practice */
  daily: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Questions

export type Tone = 'root' | 'chord' | 'scale' | 'target' | 'wrong' | 'ok' | 'muted' | 'accent';

export interface KeyboardVisual {
  notes: number[];
  labels?: Record<number, string>;
  tones?: Record<number, Tone>;
  range?: [number, number];
}

export interface StaffChord {
  /** MIDI notes, low to high */
  notes: number[];
  /** spelled names matching `notes` (e.g. "F♯") for correct accidentals */
  names?: string[];
  /** text under the bass (figured bass / numeral) */
  label?: string;
  tones?: Tone[];
}

export interface Visual {
  title?: string;
  keyboard?: KeyboardVisual;
  staff?: { chords: StaffChord[] };
  rhythm?: { pattern: RhythmPattern; marks?: Record<number, Tone> };
}

export interface ChoiceOption {
  value: string;
  label: string;
  sub?: string;
  /** render a rhythm grid inside the option button */
  rhythm?: RhythmPattern;
}

export type InputSpec =
  | { kind: 'choice'; options: ChoiceOption[]; columns?: number }
  /** a single note; answered from MIDI, on-screen keys or the 12-note grid */
  | { kind: 'note'; octaveMatters?: boolean }
  /** play a chord (any voicing) and release */
  | { kind: 'chord' }
  /** play notes in order */
  | { kind: 'sequence'; length: number; startHint?: number }
  /** tap a rhythm on pads / keys / space bar */
  | { kind: 'rhythm'; pattern: RhythmPattern; bpm: number };

export type Answer =
  | { kind: 'choice'; value: string }
  | { kind: 'notes'; notes: number[] }
  | { kind: 'taps'; offsets: number[] };

export interface Verdict {
  correct: boolean;
  /** 0..1 partial credit (rhythm, sequences) */
  score?: number;
  message?: string;
  /** marks to overlay on the reveal visual */
  reveal?: Visual;
  /** the learner asked for the solution instead of answering (graded as a miss) */
  revealed?: boolean;
}

export interface Question {
  skill: string;
  item: string;
  prompt: string;
  sub?: string;
  audio?: NoteEvent[];
  /** short label for the replay button */
  audioLabel?: string;
  show?: Visual;
  input: InputSpec;
  check: (a: Answer) => Verdict;
  explain: string;
  /** shown after answering (correct answer visual) */
  reveal?: Visual;
  /** played after answering (e.g. resolution to the tonic) */
  after?: NoteEvent[];
  /** let a played MIDI note answer a choice question (e.g. scale degrees) */
  noteToChoice?: (midi: number) => string | null;
  /** what an answer option sounds like — after answering, compare yours with the right one */
  optionAudio?: (value: string) => NoteEvent[];
  /** spell a played pitch class the way this question's chord/key spells it */
  labelPc?: (pc: number) => string;
  /** a nudge for this question that stops short of the answer */
  hint?: string;
  /** a listening aid for the hint (e.g. the bass line alone, or slower) */
  hintAudio?: { label: string; events: NoteEvent[] };
  /** library topic that teaches this question (overrides the skill's lesson) */
  lesson?: string;
  /** rhythm to play (with count-in clicks) instead of / in addition to notes */
  rhythmAudio?: { pattern: RhythmPattern; bpm: number };
}

export interface GenContext {
  rnd: () => number;
  /** pick an item, biased toward weak / unseen items for this skill */
  pickItem: <T extends string>(items: readonly T[]) => T;
}

export type Area = 'ear' | 'harmony' | 'jazz' | 'soul' | 'bach' | 'rhythm';

export const AREA_NAMES: Record<Area, string> = {
  ear: 'Ear',
  harmony: 'Harmony gym',
  jazz: 'Jazz vocabulary',
  soul: 'Funk · R&B · Gospel',
  bach: 'Bach & counterpoint',
  rhythm: 'Rhythm & groove',
};

export interface Skill {
  id: string;
  name: string;
  area: Area;
  desc: string;
  gen: (ctx: GenContext) => Question;
  /** ear = audio-only, keys = answered on the keyboard, recall = fast theory recall */
  tags: ('ear' | 'keys' | 'rhythm' | 'recall')[];
  /** library topic that teaches the concept */
  lesson: string;
  /** how to work any question of this drill out, step by step */
  method: string[];
}

export type { NoteEvent };
