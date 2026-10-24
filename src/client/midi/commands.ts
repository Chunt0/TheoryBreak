// Controller buttons, encoders, pads and strips that stand in for the computer
// keys, so the whole app runs from the controller with no keyboard or screen
// taps: Space, Enter, Backspace and Esc, picking answers, stepping tabs and sounds.
//
// Two layouts ship together. A MiniLab 3 has a clickable encoder and pads. A
// MicroLab (or any keyboard with just a pitch and a mod wheel/strip) has
// nothing else that sends MIDI — its Shift + key combinations only change its
// own channel — so on the practice tabs the pitch strip works as buttons (a
// quick push or a long push, up or down) and the mod strip points at answers.
// On the Synth tab they bend and modulate as usual. Hold is left alone.

export type Command = 'space' | 'enter' | 'back' | 'panic' | 'point' | 'tabPrev' | 'tabNext' | 'soundPrev' | 'soundNext';

/**
 * A control that fires a command:
 * - press: a button CC, fires on the way down
 * - toggle: a latching button CC (like Hold), fires on every change
 * - turn: one direction of an endless encoder
 * - pad: pad 0-15
 * - bend: the pitch strip/wheel pushed up or down: a quick push, or `long` = pushed and kept there ~½ s
 * - slide: a strip or fader whose position points at an answer
 */
export type Trigger =
  | { kind: 'press'; cc: number }
  | { kind: 'toggle'; cc: number }
  | { kind: 'turn'; cc: number; dir: 1 | -1 }
  | { kind: 'pad'; pad: number }
  | { kind: 'bend'; dir: 1 | -1; long?: boolean }
  | { kind: 'slide'; cc: number };

export type Bindings = Record<Command, Trigger[]>;

export const COMMANDS: { id: Command; label: string; key?: string }[] = [
  { id: 'space', label: 'Play · again · next once answered', key: 'Space' },
  { id: 'enter', label: 'Next · next key · pick the answer pointed at', key: 'Enter' },
  { id: 'back', label: 'Restart · clear · undo', key: '⌫' },
  { id: 'panic', label: 'Silence everything', key: 'Esc' },
  { id: 'point', label: 'Point at an answer', key: '1–8' },
  { id: 'tabPrev', label: 'Previous tab' },
  { id: 'tabNext', label: 'Next tab' },
  { id: 'soundPrev', label: 'Previous sound' },
  { id: 'soundNext', label: 'Next sound' },
];

/** The keyboard key a command replaces (what drills listen for). */
export const COMMAND_CODE: Partial<Record<Command, string>> = { space: 'Space', enter: 'Enter', back: 'Backspace', panic: 'Escape' };

/** Mod wheel and sustain: performance controls that only act as commands on the practice tabs. */
const PERFORMANCE_CCS = new Set([1, 64]);
export const isPerformanceTrigger = (t: Trigger): boolean => t.kind === 'bend' || (t.kind !== 'pad' && PERFORMANCE_CCS.has(t.cc));

/**
 * Factory layout.
 * MiniLab 3: the main encoder sends CC 114 (turn), 115 (click), 112 / 113 with
 * Shift held; in DAW mode 28, 118, 29, 119. Pad bank B (Shift + pad 2) holds the
 * same commands as buttons; bank A answers 1-8.
 * MicroLab (and any keyboard): pitch strip up / down, Hold (CC 64), mod strip (CC 1).
 */
export function defaultCommands(): Bindings {
  const turn = (cc: number, dir: 1 | -1): Trigger => ({ kind: 'turn', cc, dir });
  const press = (cc: number): Trigger => ({ kind: 'press', cc });
  const pad = (n: number): Trigger => ({ kind: 'pad', pad: n });
  return {
    space: [press(115), press(118), pad(8), { kind: 'bend', dir: 1 }],
    enter: [turn(114, 1), turn(28, 1), pad(9), { kind: 'bend', dir: 1, long: true }],
    back: [turn(114, -1), turn(28, -1), pad(10), { kind: 'bend', dir: -1 }],
    panic: [press(113), press(119), pad(11), { kind: 'bend', dir: -1, long: true }],
    point: [{ kind: 'slide', cc: 1 }],
    tabPrev: [turn(112, -1), turn(29, -1), pad(12)],
    tabNext: [turn(112, 1), turn(29, 1), pad(13)],
    soundPrev: [pad(14)],
    soundNext: [pad(15)],
  };
}

/**
 * Direction of one message from an endless encoder: binary offset (64 ± n) or
 * two's complement (1… clockwise, …127 counter-clockwise). 0 = no movement.
 */
export function encoderStep(value: number): -1 | 0 | 1 {
  if (value === 64 || value === 0) return 0;
  if (value > 32 && value < 96) return value > 64 ? 1 : -1;
  return value < 64 ? 1 : -1;
}

export function sameTrigger(a: Trigger, b: Trigger): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'pad': return a.pad === (b as typeof a).pad;
    case 'turn': return a.cc === (b as typeof a).cc && a.dir === (b as typeof a).dir;
    case 'bend': return a.dir === (b as typeof a).dir && !!a.long === !!(b as typeof a).long;
    default: return a.cc === (b as typeof a).cc;
  }
}

/** Short name for a control, as printed next to a command. */
export function triggerLabel(t: Trigger): string {
  switch (t.kind) {
    case 'pad': return t.pad < 8 ? `Pad ${t.pad + 1}` : `Pad B${t.pad - 7}`;
    case 'bend': return `Pitch ${t.dir > 0 ? '↑' : '↓'}${t.long ? ' long' : ''}`;
    case 'slide': return t.cc === 1 ? 'Mod strip' : `CC ${t.cc}`;
    case 'toggle': return t.cc === 64 ? 'Hold' : `CC ${t.cc}`;
    case 'press': return t.cc === 115 || t.cc === 118 ? 'Click' : t.cc === 113 || t.cc === 119 ? '⇧ Click' : t.cc === 64 ? 'Hold' : `CC ${t.cc}`;
    case 'turn': {
      const shift = t.cc === 112 || t.cc === 29 ? '⇧ ' : '';
      if (!(t.cc === 114 || t.cc === 28 || shift)) return `CC ${t.cc} ${t.dir > 0 ? '›' : '‹'}`;
      return t.dir > 0 ? `${shift}Turn ›` : `${shift}‹ Turn`;
    }
  }
}

/** What kind of controller is plugged in decides which control a label names. */
export type ControllerKind = 'encoder' | 'strips';
export const controllerKind = (portName: string): ControllerKind => (/minilab/i.test(portName) ? 'encoder' : 'strips');

/** Label for a command: the MiniLab's encoder and buttons first, or the strips and Hold on anything else. */
export function commandLabel(b: Bindings, cmd: Command, kind: ControllerKind = 'encoder'): string | null {
  const list = b[cmd] ?? [];
  const rank = (t: Trigger) => {
    const gesture = isPerformanceTrigger(t) || t.kind === 'slide';
    if (kind === 'strips') return gesture ? 0 : t.kind === 'pad' ? 2 : 1;
    return gesture ? 2 : t.kind === 'pad' ? 1 : 0;
  };
  const t = [...list].sort((x, y) => rank(x) - rank(y))[0];
  // a MicroLab has no encoder or pads: say nothing rather than name a control it lacks
  if (!t || (kind === 'strips' && rank(t) > 0)) return null;
  return triggerLabel(t);
}

/**
 * Turns controller messages into commands. A press fires on the way down
 * (value ≥ 64); a latching button on every change; an encoder once per burst
 * of detents, so a quick spin moves one step instead of skipping five
 * questions; a pitch flick once per trip out from the centre.
 */
export class CommandMatcher {
  private lastCc = new Map<number, number>();
  private lastFire = new Map<string, number>();
  /** latching buttons: when each went down, and which turned out to be momentary (let go straight away) */
  private riseAt = new Map<number, number>();
  private momentary = new Set<number>();
  private zone: -1 | 0 | 1 = 0;
  private zoneSince = 0;
  /** this push of the pitch strip already did something (a long push, or a direction with no long action) */
  private pushDone = false;

  constructor(private holdMs = 220) {}

  /**
   * Commands for a CC message, or null when no binding uses this CC (so it can
   * drive something else). `practice` = a practice tab, where the mod strip and
   * Hold are controls; elsewhere they stay performance controls.
   */
  cc(cc: number, value: number, b: Bindings, now: number, practice = true): Command[] | null {
    let bound = false;
    const out: Command[] = [];
    const prev = this.lastCc.get(cc) ?? 0;
    this.lastCc.set(cc, value);
    const step = encoderStep(value);
    for (const [cmd, list] of Object.entries(b) as [Command, Trigger[]][]) {
      for (const t of list) {
        if (t.kind === 'pad' || t.kind === 'bend' || t.kind === 'slide' || t.cc !== cc) continue;
        if (!practice && isPerformanceTrigger(t)) continue;
        bound = true;
        let fires = false;
        if (t.kind === 'press') fires = value >= 64 && (prev < 64 || this.quiet(cmd, now));
        else if (t.kind === 'toggle') fires = this.toggled(cc, value, prev, now) && this.quiet(cmd, now, 120);
        else fires = step === t.dir && this.quiet(cmd, now);
        if (fires && !out.includes(cmd)) {
          out.push(cmd);
          this.lastFire.set(cmd, now);
        }
      }
    }
    return bound ? out : null;
  }

  /** CC bound as a pointer (the mod strip): its position 0..1, or null. */
  slide(cc: number, value: number, b: Bindings, practice = true): number | null {
    if (!practice && PERFORMANCE_CCS.has(cc)) return null;
    return b.point.some((t) => t.kind === 'slide' && t.cc === cc) ? value / 127 : null;
  }

  /** Where the pitch strip is: -1 pushed down, 1 up, 0 centre, and since when. */
  get bendZone(): { zone: -1 | 0 | 1; since: number } {
    return { zone: this.zone, since: this.zoneSince };
  }

  /**
   * Commands for a pitch-bend value (-1..1), or null when the strip isn't bound.
   * A quick push fires as the strip comes back to the centre — unless that
   * direction also has a long push, which `bendLong` fires if it stays out.
   * A direction with no long action fires at once.
   */
  bend(value: number, b: Bindings, now: number): Command[] | null {
    const bound = Object.values(b).some((list) => list.some((t) => t.kind === 'bend'));
    if (!bound) return null;
    const zone: -1 | 0 | 1 = value > 0.5 ? 1 : value < -0.5 ? -1 : Math.abs(value) < 0.25 ? 0 : this.zone;
    const out: Command[] = [];
    if (zone === this.zone) return out;
    const was = this.zone;
    this.zone = zone;
    this.zoneSince = now;
    if (was !== 0 && !this.pushDone) out.push(...this.bound(b, was, false));
    if (zone !== 0) {
      this.pushDone = false;
      if (this.bound(b, zone, true).length === 0) {
        out.push(...this.bound(b, zone, false));
        this.pushDone = true;
      }
    }
    return out;
  }

  /** Commands for a push still out after `ms` (call from a timer); each push fires its long action once. */
  bendLong(b: Bindings, now: number, ms = 600): Command[] {
    if (this.zone === 0 || this.pushDone || now - this.zoneSince < ms) return [];
    const cmds = this.bound(b, this.zone, true);
    if (cmds.length) this.pushDone = true;
    return cmds;
  }

  private bound(b: Bindings, dir: -1 | 1, long: boolean): Command[] {
    return (Object.entries(b) as [Command, Trigger[]][]).filter(([, list]) => list.some((t) => t.kind === 'bend' && t.dir === dir && !!t.long === long)).map(([c]) => c);
  }

  pad(pad: number, b: Bindings): Command | null {
    for (const [cmd, list] of Object.entries(b) as [Command, Trigger[]][]) {
      if (list.some((t) => t.kind === 'pad' && t.pad === pad)) return cmd;
    }
    return null;
  }

  /**
   * A latching button (Hold) fires on every change. A momentary one sends a release
   * right after each press: the first quick release marks it, and releases stop counting.
   */
  private toggled(cc: number, value: number, prev: number, now: number): boolean {
    const down = value >= 64;
    if (down === prev >= 64) return false;
    if (down) {
      this.riseAt.set(cc, now);
      return true;
    }
    if (this.momentary.has(cc)) return false;
    if (now - (this.riseAt.get(cc) ?? -Infinity) < 300) {
      this.momentary.add(cc);
      return false;
    }
    return true;
  }

  private quiet(cmd: string, now: number, ms = this.holdMs): boolean {
    return now - (this.lastFire.get(cmd) ?? -Infinity) >= ms;
  }
}

/** Bump when the factory layout changes: saved layouts from older versions are replaced by the new defaults. */
export const CONTROLS_VERSION = 3;

/** Fill in commands missing from stored bindings and drop junk. */
export function normalizeBindings(raw: unknown): Bindings {
  const d = defaultCommands();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Bindings>;
  for (const c of COMMANDS) if (Array.isArray(r[c.id])) d[c.id] = r[c.id]!.filter((t) => t && typeof t === 'object' && 'kind' in t);
  return d;
}
