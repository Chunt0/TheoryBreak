// Unified note/controller input: Web MIDI (Arturia MiniLab 3 or any controller),
// the computer keyboard (A-row piano layout) and on-screen keys/fretboards.

import type { Command } from './commands';

export type InputSource = 'midi' | 'qwerty' | 'screen';

export type InputEvent =
  | { type: 'noteon'; note: number; velocity: number; channel: number; source: InputSource; time: number }
  | { type: 'noteoff'; note: number; channel: number; source: InputSource; time: number }
  | { type: 'cc'; cc: number; value: number; channel: number; time: number }
  | { type: 'pitchbend'; value: number; channel: number; time: number }
  | { type: 'aftertouch'; value: number; channel: number; time: number }
  | { type: 'pad'; pad: number; velocity: number; on: boolean; time: number }
  /** a controller button/encoder/pad bound to a computer-key action (see commands.ts) */
  | { type: 'command'; cmd: Command; time: number };

export interface MidiPortInfo {
  id: string;
  name: string;
  manufacturer: string;
  connected: boolean;
}

export type MidiStatus = 'unsupported' | 'idle' | 'requesting' | 'ready' | 'denied' | 'error';

export interface PadConfig {
  /** 1-based MIDI channel the pads transmit on (MiniLab 3 default: 10) */
  channel: number;
  /** first pad note (MiniLab 3 bank A starts at 36, bank B continues at 44) */
  firstNote: number;
  count: number;
}

export interface MonitorEntry {
  time: number;
  port: string;
  text: string;
}

type Listener = (e: InputEvent) => void;

const mod12 = (n: number): number => ((n % 12) + 12) % 12;
const isWhite = (m: number): boolean => ![1, 3, 6, 8, 10].includes(mod12(m));

// Computer keyboard laid out like a piano: the middle row plays consecutive
// white keys and the row above plays the black keys between them, wherever a
// piano has one. The window can start on any white key, so the shape under
// your fingers always matches the real keyboard.
const WHITE_CODES: [string, string][] = [
  ['KeyA', 'A'], ['KeyS', 'S'], ['KeyD', 'D'], ['KeyF', 'F'], ['KeyG', 'G'], ['KeyH', 'H'],
  ['KeyJ', 'J'], ['KeyK', 'K'], ['KeyL', 'L'], ['Semicolon', ';'], ['Quote', "'"],
];
// BLACK_CODES[i] sits just left of WHITE_CODES[i]; the last one sits right of the last white key.
const BLACK_CODES: [string, string][] = [
  ['KeyQ', 'Q'], ['KeyW', 'W'], ['KeyE', 'E'], ['KeyR', 'R'], ['KeyT', 'T'], ['KeyY', 'Y'],
  ['KeyU', 'U'], ['KeyI', 'I'], ['KeyO', 'O'], ['KeyP', 'P'], ['BracketLeft', '['], ['BracketRight', ']'],
];

/** code → MIDI note and MIDI note → key label for a window whose A key plays `start` (a white key). */
export function pianoWindow(start: number): { notes: Map<string, number>; labels: Record<number, string> } {
  const whites: number[] = [];
  for (let m = start; whites.length < WHITE_CODES.length; m++) if (isWhite(m)) whites.push(m);
  const notes = new Map<string, number>();
  const labels: Record<number, string> = {};
  const put = ([code, label]: [string, string], m: number) => {
    notes.set(code, m);
    labels[m] = label;
  };
  whites.forEach((m, i) => put(WHITE_CODES[i], m));
  BLACK_CODES.forEach((k, i) => {
    const below = i === 0 ? whites[0] - 2 : whites[i - 1];
    const above = i === whites.length ? whites[i - 1] + 2 : whites[i];
    // a black key exists between two white keys a whole step apart
    if (above - below === 2 && !isWhite(below + 1)) put(k, below + 1);
  });
  return { notes, labels };
}

class InputHub {
  status: MidiStatus = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator ? 'idle' : 'unsupported';
  error = '';
  ports: MidiPortInfo[] = [];
  disabledPorts = new Set<string>();
  pads: PadConfig = { channel: 10, firstNote: 36, count: 16 };
  /** The white key the A key plays (C4 by default). */
  qwertyStart = 60;
  qwertyEnabled = true;
  readonly held = new Map<number, InputSource>();
  readonly monitor: MonitorEntry[] = [];

  private access: MIDIAccess | null = null;
  private listeners = new Set<Listener>();
  private changeListeners = new Set<() => void>();
  private qwertyDown = new Map<string, number>();
  private win = pianoWindow(60);

  // --------------------------------------------------------------- events

  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Notified when ports, status or held notes change. */
  onChange(fn: () => void): () => void {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }

  private changed(): void {
    this.changeListeners.forEach((f) => f());
  }

  emit(e: InputEvent): void {
    if (e.type === 'noteon') this.held.set(e.note, e.source);
    if (e.type === 'noteoff') this.held.delete(e.note);
    this.listeners.forEach((l) => l(e));
    if (e.type === 'noteon' || e.type === 'noteoff') this.changed();
  }

  /** On-screen keyboard / fretboard helpers. */
  screenNoteOn(note: number, velocity = 100): void {
    this.emit({ type: 'noteon', note, velocity, channel: 1, source: 'screen', time: performance.now() });
  }
  screenNoteOff(note: number): void {
    this.emit({ type: 'noteoff', note, channel: 1, source: 'screen', time: performance.now() });
  }
  /** Emit a virtual pad hit (number keys 1-8 mirror pads 1-8). */
  virtualPad(pad: number): void {
    const time = performance.now();
    this.emit({ type: 'pad', pad, velocity: 100, on: true, time });
    this.emit({ type: 'pad', pad, velocity: 0, on: false, time });
  }

  /** Fire a command (Space, Enter… from a controller). */
  command(cmd: Command): void {
    this.emit({ type: 'command', cmd, time: performance.now() });
  }

  heldNotes(): number[] {
    return [...this.held.keys()].sort((a, b) => a - b);
  }

  /** Octave of the A key (C4 → 4). */
  get qwertyOctave(): number {
    return Math.floor(this.qwertyStart / 12) - 1;
  }

  /** Put the computer keys' window on a white key (a black key snaps to the white key below). */
  setQwertyStart(midi: number): void {
    let m = Math.max(24, Math.min(96, Math.round(midi)));
    if (!isWhite(m)) m--;
    if (m === this.qwertyStart) return;
    this.qwertyStart = m;
    this.win = pianoWindow(m);
    this.changed();
  }

  /** Window for an exercise on `root`: a white root sits on A, a black root on W. */
  placeRoot(root: number): void {
    this.setQwertyStart(isWhite(root) ? root : root - 1);
  }

  /** Move the window by white keys (comma / period). */
  shiftWhite(steps: number): void {
    let m = this.qwertyStart;
    for (let n = 0; n < Math.abs(steps); n++) do m += Math.sign(steps); while (!isWhite(m));
    this.setQwertyStart(m);
  }

  qwertyHas(note: number): boolean {
    return note in this.win.labels;
  }

  /** MIDI note → computer-key label. */
  qwertyLabels(): Record<number, string> {
    return this.win.labels;
  }

  /** Move the window by octaves until `note` is playable (used when a line runs off the window). */
  qwertyReach(note: number): void {
    for (let i = 0; i < 8 && !this.qwertyHas(note); i++) {
      const lo = this.qwertyStart;
      this.setQwertyStart(note < lo ? lo - 12 : lo + 12);
    }
  }

  // ---------------------------------------------------------------- MIDI

  async requestMidi(): Promise<void> {
    if (this.status === 'unsupported') return;
    if (this.access) return;
    this.status = 'requesting';
    this.changed();
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
      this.access.onstatechange = () => this.refreshPorts();
      this.status = 'ready';
      this.refreshPorts();
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : '';
      this.status = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error';
      this.error = err instanceof Error ? err.message : String(err);
      this.changed();
    }
  }

  private refreshPorts(): void {
    if (!this.access) return;
    const ports: MidiPortInfo[] = [];
    this.access.inputs.forEach((input) => {
      ports.push({ id: input.id, name: input.name ?? 'MIDI input', manufacturer: input.manufacturer ?? '', connected: input.state === 'connected' });
      input.onmidimessage = (e: MIDIMessageEvent) => this.handleMidi(input, e);
    });
    this.ports = ports;
    this.changed();
  }

  setPortEnabled(id: string, enabled: boolean): void {
    if (enabled) this.disabledPorts.delete(id);
    else this.disabledPorts.add(id);
    this.changed();
  }

  /** True when a port that looks like an Arturia MiniLab is connected. */
  get minilabConnected(): boolean {
    return this.ports.some((p) => p.connected && /minilab/i.test(p.name));
  }

  get anyMidiConnected(): boolean {
    return this.ports.some((p) => p.connected && !this.disabledPorts.has(p.id));
  }

  private handleMidi(input: MIDIInput, e: MIDIMessageEvent): void {
    const d = e.data;
    if (!d || d.length === 0 || this.disabledPorts.has(input.id)) return;
    const status = d[0];
    if (status >= 0xf0) return; // clock, active sensing, sysex
    const kind = status & 0xf0;
    const channel = (status & 0x0f) + 1;
    const time = e.timeStamp || performance.now();
    this.log(input.name ?? '?', d);
    const isPad = (note: number) =>
      channel === this.pads.channel && note >= this.pads.firstNote && note < this.pads.firstNote + this.pads.count;

    if (kind === 0x90 && d[2] > 0) {
      if (isPad(d[1])) this.emit({ type: 'pad', pad: d[1] - this.pads.firstNote, velocity: d[2], on: true, time });
      else this.emit({ type: 'noteon', note: d[1], velocity: d[2], channel, source: 'midi', time });
    } else if (kind === 0x80 || (kind === 0x90 && d[2] === 0)) {
      if (isPad(d[1])) this.emit({ type: 'pad', pad: d[1] - this.pads.firstNote, velocity: 0, on: false, time });
      else this.emit({ type: 'noteoff', note: d[1], channel, source: 'midi', time });
    } else if (kind === 0xb0) {
      if (d[1] === 123 || d[1] === 120) {
        for (const n of [...this.held.keys()]) this.emit({ type: 'noteoff', note: n, channel, source: 'midi', time });
      }
      this.emit({ type: 'cc', cc: d[1], value: d[2], channel, time });
    } else if (kind === 0xe0) {
      const v = ((d[2] << 7) | d[1]) - 8192;
      this.emit({ type: 'pitchbend', value: v / (v < 0 ? 8192 : 8191), channel, time });
    } else if (kind === 0xd0) {
      this.emit({ type: 'aftertouch', value: d[1] / 127, channel, time });
    } else if (kind === 0xa0 && isPad(d[1])) {
      this.emit({ type: 'aftertouch', value: d[2] / 127, channel, time });
    }
  }

  private log(port: string, d: Uint8Array): void {
    const kind = d[0] & 0xf0;
    const ch = (d[0] & 0x0f) + 1;
    const names: Record<number, string> = { 0x80: 'Note off', 0x90: 'Note on', 0xa0: 'Poly AT', 0xb0: 'CC', 0xc0: 'Program', 0xd0: 'Chan AT', 0xe0: 'Pitch bend' };
    const text = `${names[kind] ?? 'Other'} ch${ch} ${Array.from(d.slice(1)).join(' ')}`;
    this.monitor.unshift({ time: performance.now(), port, text });
    if (this.monitor.length > 40) this.monitor.length = 40;
  }

  // -------------------------------------------------------------- QWERTY

  attachKeyboard(target: Window): () => void {
    // A focused dropdown still lets the letter keys play: notes win over its type-to-select.
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (!this.qwertyEnabled || e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      // Holding a key repeats it. Some systems send those repeats without e.repeat, so a key that is
      // already down counts as a repeat too: the note keeps sounding and one key-up ends it.
      if (e.repeat || this.qwertyDown.has(e.code)) {
        if (this.win.notes.has(e.code) || this.qwertyDown.has(e.code)) e.preventDefault();
        return;
      }
      if (e.code === 'KeyZ' || e.code === 'KeyX') {
        e.preventDefault();
        this.setQwertyStart(this.qwertyStart + (e.code === 'KeyZ' ? -12 : 12));
        return;
      }
      if (e.code === 'Comma' || e.code === 'Period') {
        e.preventDefault();
        this.shiftWhite(e.code === 'Comma' ? -1 : 1);
        return;
      }
      const digit = /^Digit([1-8])$/.exec(e.code);
      if (digit) {
        e.preventDefault();
        this.virtualPad(Number(digit[1]) - 1);
        return;
      }
      const note = this.win.notes.get(e.code);
      if (note === undefined) return;
      e.preventDefault();
      this.qwertyDown.set(e.code, note);
      this.emit({ type: 'noteon', note, velocity: 100, channel: 1, source: 'qwerty', time: e.timeStamp || performance.now() });
    };
    const up = (e: KeyboardEvent) => {
      // macOS never sends key-ups for keys released while ⌘ was down, so letting go of ⌘ releases everything
      if (e.key === 'Meta') return releaseQwerty();
      const note = this.qwertyDown.get(e.code);
      if (note === undefined) return;
      this.qwertyDown.delete(e.code);
      // another computer key may still hold the same pitch (the window moved in between)
      if ([...this.qwertyDown.values()].includes(note)) return;
      this.emit({ type: 'noteoff', note, channel: 1, source: 'qwerty', time: e.timeStamp || performance.now() });
    };
    // key-ups go missing when the window loses focus or the tab is hidden: release what is down
    const releaseQwerty = () => {
      const notes = new Set(this.qwertyDown.values());
      this.qwertyDown.clear();
      for (const note of notes) this.emit({ type: 'noteoff', note, channel: 1, source: 'qwerty', time: performance.now() });
    };
    const hidden = () => {
      if (document.hidden) releaseQwerty();
    };
    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    target.addEventListener('blur', releaseQwerty);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
      target.removeEventListener('blur', releaseQwerty);
      document.removeEventListener('visibilitychange', hidden);
    };
  }

  /** Panic: let go of every held note, whatever is holding it. */
  allNotesOff(): void {
    this.qwertyDown.clear();
    for (const note of [...this.held.keys()]) this.emit({ type: 'noteoff', note, channel: 1, source: 'screen', time: performance.now() });
  }
}

export const input = new InputHub();
