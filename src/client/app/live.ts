// Routes live input (MiniLab / MicroLab keys, strips, knobs, pads, QWERTY,
// on-screen keys) to the audio engine, the synth editor and the drills.

import { audio, PART, type PartId } from '../audio/engine';
import { CommandMatcher, encoderStep, sameTrigger, type Command, type Trigger } from '../midi/commands';
import { input, type InputEvent } from '../midi/input';
import { RelativeDetector, TARGET_BY_ID, applyCc, type CcMapping } from '../midi/mapping';
import { createStore } from './createStore';
import { pickPointed, pointAt } from './pointer';
import { controllerKnob, rack, selectModule } from './rackState';
import { store, updateSettings } from './store';
import { getParam, selectOp, setParam, synth } from './synthState';

export type LiveContext = 'synth' | 'learn';

export const live = createStore<{
  context: LiveContext;
  lastCc: { cc: number; value: number; channel: number } | null;
  /** command waiting for a controller button, encoder or pad (controller learn) */
  learnCmd: Command | null;
  /** the last control message, in words, so you can see what a button really sends */
  lastMsg: string;
}>({
  context: 'learn',
  lastCc: null,
  learnCmd: null,
  lastMsg: '',
});

/** Wait for the next control moved on the controller and bind it to `cmd` (null cancels). */
export function learnCommand(cmd: Command | null): void {
  pendingBend = null;
  live.set((s) => ({ ...s, learnCmd: s.learnCmd === cmd ? null : cmd }));
}

/** Run a command. Space or Enter first picks an answer the mod strip points at, if any. */
function fire(cmd: Command): void {
  if ((cmd === 'space' || cmd === 'enter') && pickPointed()) return;
  input.command(cmd);
}

// learning the pitch strip: a quick push or a long one, decided when it comes back
let pendingBend: { dir: 1 | -1; at: number } | null = null;
let longTimer: ReturnType<typeof setTimeout> | null = null;
const LONG_MS = 600;

// learning a button: wait a moment to tell a momentary button (127 then 0) from a latching one like Hold (one message)
let pendingLearn: { cc: number; values: number[] } | null = null;

function learnCc(cmd: Command, cc: number, value: number): void {
  if (cmd === 'point') return bindTrigger(cmd, { kind: 'slide', cc });
  if (pendingLearn) {
    if (pendingLearn.cc === cc) pendingLearn.values.push(value);
    return;
  }
  const step = encoderStep(value);
  if (value !== 127 && value !== 0 && step !== 0 && cc !== 64) return bindTrigger(cmd, { kind: 'turn', cc, dir: step });
  pendingLearn = { cc, values: [value] };
  setTimeout(() => {
    const p = pendingLearn;
    pendingLearn = null;
    if (!p || live.get().learnCmd !== cmd) return;
    const momentary = p.values.some((v) => v >= 64) && p.values.some((v) => v < 64);
    bindTrigger(cmd, momentary ? { kind: 'press', cc: p.cc } : { kind: 'toggle', cc: p.cc });
  }, 500);
}

function bindTrigger(cmd: Command, t: Trigger): void {
  const b = structuredClone(store.get().settings.controls);
  // a control does one thing: take it away from any other command
  for (const k of Object.keys(b) as Command[]) b[k] = b[k].filter((x) => !sameTrigger(x, t));
  b[cmd] = [t, ...b[cmd]];
  updateSettings({ controls: b });
  live.set((s) => ({ ...s, learnCmd: null }));
}

/** Pages call this so the keyboard plays the right instrument. */
export function setLiveContext(c: LiveContext): void {
  if (live.get().context !== c) {
    audio.allOff(partFor(live.get().context));
    live.set((s) => ({ ...s, context: c }));
  }
}

// Every keyboard plays your DX7 patch; the context only changes what pads and knobs do.
const partFor = (_c: LiveContext): PartId => PART.synth;

/** Extra handlers for pads on the synth page (preset stepping). */
export const padHooks: { prevPreset?: () => void; nextPreset?: () => void } = {};

const detector = new RelativeDetector();
const lastAbsolute = new Map<number, number>();
const matcher = new CommandMatcher();

function handleCc(e: Extract<InputEvent, { type: 'cc' }>): void {
  live.set((s) => ({ ...s, lastCc: { cc: e.cc, value: e.value, channel: e.channel }, lastMsg: `CC ${e.cc} = ${e.value} (channel ${e.channel})` }));
  const ctx = live.get().context;
  const part = partFor(ctx);
  // on the practice tabs the mod strip and Hold are controls; on the Synth tab they play
  const practice = ctx === 'learn';

  const learning = live.get().learnCmd;
  if (learning) return learnCc(learning, e.cc, e.value);
  const controls = store.get().settings.controls;
  const pos = matcher.slide(e.cc, e.value, controls, practice);
  if (pos !== null) return pointAt(pos);
  const cmds = matcher.cc(e.cc, e.value, controls, performance.now(), practice);
  if (cmds) {
    cmds.forEach(fire);
    return;
  }

  if (e.cc === 1) return audio.wheel(part, e.value / 127);
  if (e.cc === 64) return audio.sustain(part, e.value >= 64);
  if (e.cc === 120 || e.cc === 123) return audio.allOff(part);

  // MIDI learn
  const learn = synth.get().learn;
  if (learn) {
    store.update((d) => {
      const others = d.synth.mappings.filter((m) => m.cc !== e.cc && m.target !== learn);
      const control = d.synth.mappings.find((m) => m.cc === e.cc)?.control ?? `CC ${e.cc}`;
      d.synth.mappings = [...others, { cc: e.cc, target: learn, control, mode: 'absolute' }];
    });
    synth.set((s) => ({ ...s, learn: null }));
    return;
  }

  const mappings = store.get().synth.mappings;
  const m = mappings.find((x) => x.cc === e.cc);
  if (!m) return;
  // auto-detect endless encoders sending relative values
  const detected = detector.observe(e.cc, e.value);
  let mode = m.mode;
  if (detected && detected !== m.mode) {
    mode = detected;
    store.update((d) => {
      d.synth.mappings = d.synth.mappings.map((x: CcMapping) => (x.cc === e.cc ? { ...x, mode: detected } : x));
    });
  }
  // playing the rack: knobs 1-8 and faders 1-4 turn the selected module's knobs
  if (audio.instrument === 'rack') {
    const k = /^(Knob|Fader) (\d)$/.exec(m.control);
    if (!k) return;
    const index = (k[1] === 'Knob' ? 0 : 8) + Number(k[2]) - 1;
    if (mode === 'absolute') {
      if (lastAbsolute.get(e.cc) === e.value) return;
      lastAbsolute.set(e.cc, e.value);
    }
    controllerKnob(index, (cur) => applyCc(mode, e.value, cur, { id: '', label: '', min: 0, max: 127 }));
    return;
  }
  const t = TARGET_BY_ID[m.target];
  if (!t) return;
  if (mode === 'absolute') {
    // skip duplicate values (endless encoders at rest)
    if (lastAbsolute.get(e.cc) === e.value) return;
    lastAbsolute.set(e.cc, e.value);
  }
  setParam(m.target, applyCc(mode, e.value, getParam(m.target), t));
}

export function wireLive(): () => void {
  return input.on((e) => {
    const ctx = live.get().context;
    const part = partFor(ctx);
    switch (e.type) {
      case 'noteon':
        void audio.init();
        audio.noteOn(part, e.note, e.velocity);
        break;
      case 'noteoff':
        audio.noteOff(part, e.note);
        break;
      case 'pitchbend': {
        live.set((s) => ({ ...s, lastMsg: `Pitch bend ${e.value >= 0 ? '+' : ''}${e.value.toFixed(2)}` }));
        const learning = live.get().learnCmd;
        if (learning) {
          if (learning === 'point') break;
          if (!pendingBend && Math.abs(e.value) > 0.5) pendingBend = { dir: e.value > 0 ? 1 : -1, at: performance.now() };
          else if (pendingBend && Math.abs(e.value) < 0.25) {
            bindTrigger(learning, { kind: 'bend', dir: pendingBend.dir, long: performance.now() - pendingBend.at >= LONG_MS });
            pendingBend = null;
          }
          break;
        }
        // on the practice tabs the pitch strip is a control: quick push up = Space, long push up = Enter,
        // quick push down = Backspace, long push down = Esc
        const controls = store.get().settings.controls;
        const before = matcher.bendZone.since;
        const cmds = ctx === 'learn' ? matcher.bend(e.value, controls, performance.now()) : null;
        if (!cmds) {
          audio.bend(part, e.value);
          break;
        }
        cmds.forEach(fire);
        if (matcher.bendZone.zone !== 0 && matcher.bendZone.since !== before) {
          if (longTimer) clearTimeout(longTimer);
          longTimer = setTimeout(() => matcher.bendLong(store.get().settings.controls, performance.now(), LONG_MS).forEach(fire), LONG_MS + 20);
        }
        break;
      }
      case 'aftertouch':
        audio.aftertouch(part, e.value);
        break;
      case 'cc':
        handleCc(e);
        break;
      case 'pad': {
        if (!e.on) break;
        live.set((s) => ({ ...s, lastMsg: `Pad ${e.pad + 1}` }));
        const learning = live.get().learnCmd;
        if (learning) {
          bindTrigger(learning, { kind: 'pad', pad: e.pad });
          break;
        }
        const cmd = matcher.pad(e.pad, store.get().settings.controls);
        if (cmd) {
          fire(cmd);
          break;
        }
        if (ctx !== 'synth' || e.pad >= 8) break;
        if (audio.instrument === 'rack') {
          // pads 1-8 select the first eight modules
          const m = rack.get().patch.modules[e.pad];
          if (m) selectModule(m.id);
        } else if (e.pad < 6) selectOp(e.pad);
        else if (e.pad === 6) padHooks.prevPreset?.();
        else if (e.pad === 7) padHooks.nextPreset?.();
        break;
      }
    }
  });
}
