// Shared bits for the practice modes: the big keyboard's marks, note
// listeners, the options row, answer pickers, playback and saved preferences.

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { audio, PART, type NoteEvent, type PartId } from '../audio/engine';
import { COMMAND_CODE, commandLabel, controllerKind, type Command, type ControllerKind } from '../midi/commands';
import { input } from '../midi/input';
import { createStore, useMini } from '../app/createStore';
import { clearPointer, pointer, registerAnswers } from '../app/pointer';
import { store, useStore } from '../app/store';
import { LETTERS, N, noteName, pc, sameNote, type Note } from '../theory/core';
import type { KeyMark } from '../ui/Keyboard';
import { Icon } from '../ui/Icon';
import { LessonsButton, type Help } from './Lessons';
import { Score, type Tally } from './stats';

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

/**
 * Shortcut keys that are not notes (Space, Enter, Backspace, digits). Ignored while typing in a field.
 * Controller commands (the MiniLab's encoder and pads) arrive here too, as the key they stand for.
 */
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
    const off = input.on((e) => {
      const code = e.type === 'command' ? COMMAND_CODE[e.cmd] : undefined;
      if (code) ref.current({ code, key: code, repeat: false, preventDefault() {} } as KeyboardEvent);
    });
    return () => {
      window.removeEventListener('keydown', on);
      off();
    };
  }, []);
}

const midiConnected = () => input.anyMidiConnected;
const midiKind = (): ControllerKind | null => {
  const port = input.ports.find((p) => p.connected && !input.disabledPorts.has(p.id));
  return port ? controllerKind(port.name) : null;
};

/** True while a MIDI controller is plugged in. */
export function useMidiConnected(): boolean {
  return useSyncExternalStore((fn) => input.onChange(fn), midiConnected);
}

/** What the plugged-in controller has: a MiniLab's encoder and pads, or just strips and Hold (null = none). */
export function useControllerKind(): ControllerKind | null {
  return useSyncExternalStore((fn) => input.onChange(fn), midiKind);
}

/**
 * Lets the mod strip point at one of `count` answers and Enter (Hold) pick it.
 * Returns the index pointed at, for highlighting. Count 0 = no answers on screen.
 */
export function useAnswerPointer(count: number, pick: (i: number) => void, open: boolean): number | null {
  const latest = useRef({ count, pick, open });
  latest.current = { count, pick, open };
  const active = count > 0;
  useEffect(() => (active ? registerAnswers({ count: () => latest.current.count, pick: (i) => latest.current.pick(i), open: () => latest.current.open }) : undefined), [active]);
  useEffect(() => {
    if (!open) clearPointer();
  }, [open]);
  const i = useMini(pointer, (p) => p.index);
  return open && i !== null && i < count ? i : null;
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

/** The options row above an exercise: controls in the middle; the lessons ? and the score (with its weak spots) on the right. */
export function Bar({ children, tally, help }: { children: ReactNode; tally?: Tally; help?: Help }) {
  return (
    <div className="s-bar">
      <div className="s-bar-main">{children}</div>
      {tally || help ? (
        <div className="s-bar-side">
          {help ? <LessonsButton help={help} /> : null}
          {tally ? <Score tally={tally} /> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Segmented control: pick one. */
export function Chips<T extends string>({ value, options, onChange, label }: { value: T; options: Choice<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="s-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          title={o.title}
          className={value === o.id ? 'on' : ''}
          onClick={(e) => {
            onChange(o.id);
            // a click or tap lets go, so Space drives the exercise instead of pressing this again
            if (e.detail) releaseFocus(e.currentTarget);
          }}
        >
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

/** The finer options, folded away: a quiet pill that opens them. The row stays short; the depth is one tap off. */
export function More({ children, changed }: { children: ReactNode; changed?: boolean }) {
  const id = `s-more-${useId().replace(/[^a-z0-9]/gi, '')}`;
  return (
    <>
      <button type="button" className={`s-pill s-more ${changed ? 'changed' : ''}`} popoverTarget={id} title={changed ? 'More options (some changed)' : 'More options'}>
        {changed ? <i className="dot" aria-hidden="true" /> : null}
        More
      </button>
      <div id={id} popover="auto" className="s-pop s-more-pop">{children}</div>
    </>
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


const KEY_COMMAND: Record<string, Command> = { Space: 'space', Enter: 'enter', '⌫': 'back', Backspace: 'back', Esc: 'panic' };

/** Tiny keyboard-key badge. With a controller plugged in, it names the controller's button for that key instead. */
export function K({ children }: { children: string }) {
  const kind = useControllerKind();
  const controls = useStore((d) => d.settings.controls);
  const cmd = KEY_COMMAND[children];
  const ctl = kind && cmd ? commandLabel(controls, cmd, kind) : null;
  return <span className={`kbd ${ctl ? 'ctl' : ''}`}>{ctl ?? children}</span>;
}

/** Multiple-choice answers with digit shortcuts. `right`/`picked` colour them once answered. */
export function Answers<T extends string>({ options, onPick, right, picked, wide, render, className = '' }: {
  options: Choice<T>[];
  onPick: (id: T) => void;
  right?: T | null;
  picked?: T | null;
  wide?: boolean;
  /** draw an answer as something other than its label (a rhythm grid…) */
  render?: (o: Choice<T>) => ReactNode;
  /** extra layout class, e.g. "sig" for a grid of fifteen keys */
  className?: string;
}) {
  const answered = picked !== undefined && picked !== null;
  const pointed = useAnswerPointer(options.length, (i) => onPick(options[i].id), !answered);
  // pads 1–8 pick answers: MiniLab pads, and the digit keys (which the input hub turns into pad hits)
  const latest = useRef({ options, onPick, answered });
  latest.current = { options, onPick, answered };
  useEffect(() => input.on((e) => {
    const { options: opts, onPick: pick, answered: done } = latest.current;
    if (e.type !== 'pad' || !e.on || done || e.pad >= Math.min(8, opts.length)) return;
    // a pad bound to a command (Space, Enter…) does that instead
    const bound = Object.values(store.get().settings.controls).some((list) => list.some((t) => t.kind === 'pad' && t.pad === e.pad));
    if (!bound) pick(opts[e.pad].id);
  }), []);
  return (
    <div className={`s-answers ${wide ? 'wide' : ''} ${className} ${answered ? 'answered' : ''}`}>
      {options.map((o, i) => {
        const cls = answered ? (o.id === right ? 'right' : o.id === picked ? 'wrongpick' : '') : '';
        return (
          <button key={o.id} type="button" className={`s-answer ${cls} ${i === pointed ? 'pointed' : ''}`} title={o.title} onClick={() => !answered && onPick(o.id)}>
            {i < 8 ? <span className="dig">{i + 1}</span> : null}
            {render ? render(o) : o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Spelled-note answer grid: seven letters × ♭ / ♮ / ♯ (so E♯ and C♭ are real answers). */
export function NotePicker({ answer, picked, onPick }: { answer: Note; picked: Note | null; onPick: (n: Note) => void }) {
  // the mod strip runs along the grid row by row: C♭ … B♭, C … B, C♯ … B♯
  const pointed = useAnswerPointer(21, (i) => onPick({ letter: i % 7, acc: Math.floor(i / 7) - 1 }), !picked);
  return (
    <div className={`s-notegrid ${picked ? 'answered' : ''}`} role="group" aria-label="Pick the note">
      {[-1, 0, 1].map((acc) => (
        <div key={acc} className="s-notegrid-row">
          {LETTERS.map((_, letter) => {
            const n: Note = { letter, acc };
            const cls = picked ? (sameNote(n, answer) ? 'right' : sameNote(n, picked) ? 'wrongpick' : '') : '';
            const here = pointed === (acc + 1) * 7 + letter;
            return <button key={letter} type="button" className={`s-answer ${cls} ${here ? 'pointed' : ''}`} onClick={() => !picked && onPick(n)}>{noteName(n)}</button>;
          })}
        </div>
      ))}
    </div>
  );
}

/** "a" or "an" for an interval or chord name. */
export const article = (word: string): string => (/^[aeio]|^(octave|eleventh)/i.test(word) ? 'an' : 'a');
