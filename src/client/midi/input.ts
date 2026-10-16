// Unified note/controller input: Web MIDI (Arturia MiniLab 3 or any controller),
// the computer keyboard (A-row piano layout) and on-screen keys/fretboards.

export type InputSource = 'midi' | 'qwerty' | 'screen';

export type InputEvent =
  | { type: 'noteon'; note: number; velocity: number; channel: number; source: InputSource; time: number }
  | { type: 'noteoff'; note: number; channel: number; source: InputSource; time: number }
  | { type: 'cc'; cc: number; value: number; channel: number; time: number }
  | { type: 'pitchbend'; value: number; channel: number; time: number }
  | { type: 'aftertouch'; value: number; channel: number; time: number }
  | { type: 'pad'; pad: number; velocity: number; on: boolean; time: number };

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

// Computer keyboard: two rows like a piano (A = C, W = C♯ …), Z/X shift octaves.
export const QWERTY_KEYS: { code: string; label: string; semis: number }[] = [
  ['KeyA', 'A'], ['KeyW', 'W'], ['KeyS', 'S'], ['KeyE', 'E'], ['KeyD', 'D'], ['KeyF', 'F'], ['KeyT', 'T'], ['KeyG', 'G'], ['KeyY', 'Y'],
  ['KeyH', 'H'], ['KeyU', 'U'], ['KeyJ', 'J'], ['KeyK', 'K'], ['KeyO', 'O'], ['KeyL', 'L'], ['KeyP', 'P'], ['Semicolon', ';'], ['Quote', "'"],
].map(([code, label], semis) => ({ code, label, semis }));
const QWERTY: Record<string, number> = Object.fromEntries(QWERTY_KEYS.map((k) => [k.code, k.semis]));

class InputHub {
  status: MidiStatus = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator ? 'idle' : 'unsupported';
  error = '';
  ports: MidiPortInfo[] = [];
  disabledPorts = new Set<string>();
  pads: PadConfig = { channel: 10, firstNote: 36, count: 16 };
  qwertyOctave = 4; // C4 = MIDI 60
  qwertyEnabled = true;
  readonly held = new Map<number, InputSource>();
  readonly monitor: MonitorEntry[] = [];

  private access: MIDIAccess | null = null;
  private listeners = new Set<Listener>();
  private changeListeners = new Set<() => void>();
  private qwertyDown = new Map<string, number>();

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

  heldNotes(): number[] {
    return [...this.held.keys()].sort((a, b) => a - b);
  }

  /** MIDI note → computer-key label for the current QWERTY octave. */
  qwertyLabels(): Record<number, string> {
    const base = (this.qwertyOctave + 1) * 12;
    return Object.fromEntries(QWERTY_KEYS.map((k) => [base + k.semis, k.label]));
  }

  /** Move the QWERTY range so `note` is playable (used when a drill starts on a far-away note). */
  qwertyReach(note: number): void {
    const base = (this.qwertyOctave + 1) * 12;
    if (note >= base && note <= base + 17) return;
    this.qwertyOctave = Math.max(1, Math.min(7, Math.floor(note / 12) - 1));
    this.changed();
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
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (!this.qwertyEnabled || e.repeat || e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      if (e.code === 'KeyZ') {
        this.qwertyOctave = Math.max(1, this.qwertyOctave - 1);
        this.changed();
        return;
      }
      if (e.code === 'KeyX') {
        this.qwertyOctave = Math.min(7, this.qwertyOctave + 1);
        this.changed();
        return;
      }
      const digit = /^Digit([1-8])$/.exec(e.code);
      if (digit) {
        this.virtualPad(Number(digit[1]) - 1);
        return;
      }
      const off = QWERTY[e.code];
      if (off === undefined) return;
      e.preventDefault();
      const note = (this.qwertyOctave + 1) * 12 + off;
      this.qwertyDown.set(e.code, note);
      this.emit({ type: 'noteon', note, velocity: 100, channel: 1, source: 'qwerty', time: e.timeStamp || performance.now() });
    };
    const up = (e: KeyboardEvent) => {
      const note = this.qwertyDown.get(e.code);
      if (note === undefined) return;
      this.qwertyDown.delete(e.code);
      this.emit({ type: 'noteoff', note, channel: 1, source: 'qwerty', time: e.timeStamp || performance.now() });
    };
    const blur = () => {
      for (const [code, note] of this.qwertyDown) {
        this.qwertyDown.delete(code);
        this.emit({ type: 'noteoff', note, channel: 1, source: 'qwerty', time: performance.now() });
      }
    };
    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    target.addEventListener('blur', blur);
    return () => {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
      target.removeEventListener('blur', blur);
    };
  }
}

export const input = new InputHub();
