// Shared bits for the practice modes: the big keyboard's marks, note
// listeners, the options row, answer pickers, playback and saved preferences.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { audio, PART, type NoteEvent, type PartId } from '../audio/engine';
import { input } from '../midi/input';
import { createStore } from '../app/createStore';
import { store, useStore } from '../app/store';
import { LETTERS, N, noteName, pc, sameNote, type Note } from '../theory/core';
import type { KeyMark } from '../ui/Keyboard';
import { Icon } from '../ui/Icon';

/** What the big keyboard shows: marks per MIDI note. Modes own it while mounted. */
export const kb = createStore<{ marks: Record<number, KeyMark> }>({ marks: {} });
export const setMarks = (marks: Record<number, KeyMark>): void => kb.set({ marks });

/** The twelve roots, spelled the way they are usually written. */
export const ROOTS: Note[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(N);
export const rootByPc = (p: number): Note => ROOTS[p];

/** Root MIDI note in the middle register (C4..B4). */
export const rootMidi = (n: Note): number => 60 + pc(n);

/** Calls `fn` for every note-on (MIDI, computer keys or on-screen) with its timestamp. Always uses the latest `fn`. */
export function useNoteOn(fn: (note: number, time: number) => void): void {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => input.on((e) => {
    if (e.type === 'noteon') ref.current(e.note, e.time);
  }), []);
}

/** Shortcut keys that are not notes (Space, Enter, Backspace, digits). Ignored while typing in a field. */
export function useHotkeys(fn: (e: KeyboardEvent) => void): void {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return;
      ref.current(e);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);
}

/** Clears the keyboard marks, stops clicks and puts the computer keys back on C when a mode unmounts. */
export function useModeCleanup(): void {
  useEffect(() => () => {
    setMarks({});
    audio.stopScheduledClicks();
    input.setQwertyStart(60);
  }, []);
}

/** A short-lived set of "wrong" keys that fade after a moment. */
export function useFlash(ms = 450): [Set<number>, (note: number) => void] {
  const [set, setSet] = useState<Set<number>>(new Set());
  const flash = (note: number) => {
    setSet((s) => new Set(s).add(note));
    window.setTimeout(() => setSet((s) => {
      const next = new Set(s);
      next.delete(note);
      return next;
    }), ms);
  };
  return [set, flash];
}

// ---------------------------------------------------------------- sound

/** Exercises play with your DX7 patch, or the plain practice piano (Settings). */
export const practicePart = (): PartId => (store.get().settings.practiceSound === 'piano' ? PART.lesson : PART.synth);

/** Play prepared events; lesson-part notes go to the practice sound, the bass part stays. */
export function playEvents(events: NoteEvent[], startAt?: number): { start: number; end: number } {
  void audio.init();
  const part = practicePart();
  return audio.play(events.map((e) => ({ ...e, part: e.part === PART.bass ? PART.bass : part })), { startAt });
}

export function playLine(midis: number[], step = 0.32, dur = 0.3, at = 0): void {
  playEvents(midis.map((note, i) => ({ note, start: at + i * step, dur })));
}

export function playBlock(midis: number[], dur = 1.2, at = 0): void {
  playEvents(midis.map((note) => ({ note, start: at, dur })));
}

export function pickOther<T>(items: readonly T[], prev: T | null): T {
  if (items.length < 2) return items[0];
  let x: T;
  do x = items[Math.floor(Math.random() * items.length)];
  while (x === prev);
  return x;
}

export const pickAny = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

// ---------------------------------------------------------------- saved choices and records

/** Practice data lives in the app store, so it is saved locally and synced to the server. */
export function loadPref<T>(key: string, fallback: T): T {
  const v = store.get().practice[key];
  return v === undefined ? fallback : (v as T);
}

export function savePref(key: string, value: unknown): void {
  store.update((d) => {
    d.practice[key] = value;
  });
}

/** useState that remembers its value across visits and devices. */
export function usePref<T>(key: string, fallback: T): [T, (v: T) => void] {
  const v = useStore((d) => d.practice[key]) as T | undefined;
  return [v === undefined ? fallback : v, (next: T) => savePref(key, next)];
}

// ---------------------------------------------------------------- small UI pieces

export interface Choice<T extends string> {
  id: T;
  label: string;
  title?: string;
}

/** The options row above an exercise: controls in the middle, this session's score on the right. */
export function Bar({ children, score }: { children: ReactNode; score?: { ok: number; bad: number } }) {
  return (
    <div className="s-bar">
      <div className="s-bar-main">{children}</div>
      {score ? <Score {...score} /> : null}
    </div>
  );
}

/** Segmented control: pick one. */
export function Chips<T extends string>({ value, options, onChange, label }: { value: T; options: Choice<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="s-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} title={o.title} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Let go of a dropdown once a value is picked (after its picker has closed), so Space and Enter drive the exercise again. */
export const releaseFocus = (el: HTMLElement): void => {
  window.setTimeout(() => el.blur(), 0);
};

/** Option pill: a compact dropdown showing its value, with an optional quiet prefix. */
export function Pick<T extends string>({ value, options, groups, onChange, label, prefix }: {
  value: T;
  options?: Choice<T>[];
  groups?: { title: string; options: Choice<T>[] }[];
  onChange: (v: T) => void;
  label: string;
  prefix?: string;
}) {
  const opts = (list: Choice<T>[]) => list.map((o) => <option key={o.id} value={o.id}>{o.label}</option>);
  return (
    <label className="s-pill" title={label}>
      {prefix ? <span className="k">{prefix}</span> : null}
      <select
        value={value}
        aria-label={label}
        onChange={(e) => {
          onChange(e.target.value as T);
          releaseFocus(e.currentTarget);
        }}
      >
        {groups ? groups.map((g) => <optgroup key={g.title} label={g.title}>{opts(g.options)}</optgroup>) : opts(options ?? [])}
      </select>
    </label>
  );
}

/** Play the question again. */
export function Listen({ onClick, label = 'Hear it' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="s-listen" onClick={onClick} title={`${label} (Space)`}>
      <Icon name="play" size={13} className="fill" />
      {label}
      <K>Space</K>
    </button>
  );
}

export function Score({ ok, bad }: { ok: number; bad: number }) {
  return (
    <span className={`s-score ${ok || bad ? '' : 'empty'}`} aria-label={`${ok} right, ${bad} wrong`} title="Right and wrong answers since you opened this tab">
      <span className="ok">✓ {ok}</span>
      <span className="bad">✗ {bad}</span>
    </span>
  );
}

/** Tiny keyboard-key badge. */
export const K = ({ children }: { children: string }) => <span className="kbd">{children}</span>;

/** Multiple-choice answers with digit shortcuts. `right`/`picked` colour them once answered. */
export function Answers<T extends string>({ options, onPick, right, picked, wide }: {
  options: Choice<T>[];
  onPick: (id: T) => void;
  right?: T | null;
  picked?: T | null;
  wide?: boolean;
}) {
  const answered = picked !== undefined && picked !== null;
  // pads 1–8 pick answers: MiniLab pads, and the digit keys (which the input hub turns into pad hits)
  const latest = useRef({ options, onPick, answered });
  latest.current = { options, onPick, answered };
  useEffect(() => input.on((e) => {
    const { options: opts, onPick: pick, answered: done } = latest.current;
    if (e.type === 'pad' && e.on && !done && e.pad < opts.length) pick(opts[e.pad].id);
  }), []);
  return (
    <div className={`s-answers ${wide ? 'wide' : ''} ${answered ? 'answered' : ''}`}>
      {options.map((o, i) => {
        const cls = answered ? (o.id === right ? 'right' : o.id === picked ? 'wrongpick' : '') : '';
        return (
          <button key={o.id} type="button" className={`s-answer ${cls}`} title={o.title} onClick={() => !answered && onPick(o.id)}>
            {i < 8 ? <span className="dig">{i + 1}</span> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Spelled-note answer grid: seven letters × ♭ / ♮ / ♯ (so E♯ and C♭ are real answers). */
export function NotePicker({ answer, picked, onPick }: { answer: Note; picked: Note | null; onPick: (n: Note) => void }) {
  return (
    <div className={`s-notegrid ${picked ? 'answered' : ''}`} role="group" aria-label="Pick the note">
      {[-1, 0, 1].map((acc) => (
        <div key={acc} className="s-notegrid-row">
          {LETTERS.map((_, letter) => {
            const n: Note = { letter, acc };
            const cls = picked ? (sameNote(n, answer) ? 'right' : sameNote(n, picked) ? 'wrongpick' : '') : '';
            return <button key={letter} type="button" className={`s-answer ${cls}`} onClick={() => !picked && onPick(n)}>{noteName(n)}</button>;
          })}
        </div>
      ))}
    </div>
  );
}

/** "a" or "an" for an interval or chord name. */
export const article = (word: string): string => (/^[aeio]|^(octave|eleventh)/i.test(word) ? 'an' : 'a');
