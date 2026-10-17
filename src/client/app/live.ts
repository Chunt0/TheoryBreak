// Routes live input (MiniLab keys, strips, knobs, pads, QWERTY, on-screen keys)
// to the audio engine and to the synth editor.

import { audio, PART, type PartId } from '../audio/engine';
import { input, type InputEvent } from '../midi/input';
import { RelativeDetector, TARGET_BY_ID, applyCc, type CcMapping } from '../midi/mapping';
import { createStore } from './createStore';
import { store } from './store';
import { getParam, selectOp, setParam, synth } from './synthState';

export type LiveContext = 'synth' | 'learn';

export const live = createStore<{ context: LiveContext; lastCc: { cc: number; value: number; channel: number } | null }>({
  context: 'learn',
  lastCc: null,
});

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

function handleCc(e: Extract<InputEvent, { type: 'cc' }>): void {
  live.set((s) => ({ ...s, lastCc: { cc: e.cc, value: e.value, channel: e.channel } }));
  const part = partFor(live.get().context);
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
      case 'pitchbend':
        audio.bend(part, e.value);
        break;
      case 'aftertouch':
        audio.aftertouch(part, e.value);
        break;
      case 'cc':
        handleCc(e);
        break;
      case 'pad':
        if (ctx === 'synth' && e.on) {
          if (e.pad < 6) selectOp(e.pad);
          else if (e.pad === 6) padHooks.prevPreset?.();
          else if (e.pad === 7) padHooks.nextPreset?.();
        }
        break;
    }
  });
}
