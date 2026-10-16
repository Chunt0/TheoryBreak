// Main-thread audio engine: owns the AudioContext, the DX7 worklet, the
// effects chain (reverb + limiter), an analyser for the scope, and simple
// Web Audio metronome/drum voices for rhythm work.

import type { PartStatus } from './dx7/dsp';
import { defaultPartConfig, normalizePatch, type PartConfig, type Patch } from './dx7/patch';
import { presetByName } from './dx7/presets';
import type { WorkletIn, WorkletOut } from './worklet/dx7-processor';

export const PART = { synth: 0, lesson: 1, bass: 2 } as const;
export type PartId = 0 | 1 | 2;

export interface NoteEvent {
  note: number;
  /** seconds from the sequence start */
  start: number;
  dur: number;
  vel?: number;
  part?: PartId;
}

export type DrumKind = 'kick' | 'snare' | 'hat' | 'click' | 'accent';

export type EngineState = 'idle' | 'starting' | 'running' | 'suspended' | 'error';

class AudioEngine {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  state: EngineState = 'idle';
  error = '';
  status: PartStatus[] = [];

  private node: AudioWorkletNode | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private clickBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private starting: Promise<void> | null = null;
  /** live notes played while the worklet is still loading (the very first key press) */
  private pending: WorkletIn[] = [];
  private patches: Patch[] = [presetByName('TINE PIANO'), presetByName('LESSON KEYS'), presetByName('ROUND BASS')];
  private configs: PartConfig[] = [
    defaultPartConfig(),
    { ...defaultPartConfig(), volume: 0.75 },
    { ...defaultPartConfig(), volume: 0.7, polyphony: 4 },
  ];
  private statusListeners = new Set<(s: PartStatus[]) => void>();
  private stateListeners = new Set<() => void>();
  private scheduledNodes = new Set<AudioScheduledSourceNode>();
  private settings = { master: 0.8, reverb: 0.18, metronome: 0.7 };

  // ------------------------------------------------------------------ setup

  /** Start audio. Must be called from a user gesture the first time (autoplay policy). */
  init(): Promise<void> {
    if (this.ctx && this.node) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return Promise.resolve();
    }
    if (this.starting) return this.starting;
    this.setState('starting');
    this.starting = this.boot().catch((err: unknown) => {
      this.error = err instanceof Error ? err.message : String(err);
      this.setState('error');
      this.starting = null;
    });
    return this.starting;
  }

  private async boot(): Promise<void> {
    if (!window.isSecureContext) {
      throw new Error('Audio worklets need a secure context: open the app via http://localhost or HTTPS.');
    }
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    this.ctx = ctx;
    ctx.onstatechange = () => this.setState(ctx.state === 'running' ? 'running' : ctx.state === 'suspended' ? 'suspended' : 'idle');
    await ctx.audioWorklet.addModule(new URL('/dx7-processor.js', location.href).href);
    const node = new AudioWorkletNode(ctx, 'dx7', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
    node.port.onmessage = (e: MessageEvent<WorkletOut>) => {
      if (e.data.t === 'status') {
        this.status = e.data.parts;
        this.statusListeners.forEach((l) => l(this.status));
      }
    };

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 6;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    const master = ctx.createGain();
    master.gain.value = this.settings.master;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.6;
    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(ctx, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = this.settings.reverb;
    const clickBus = ctx.createGain();
    clickBus.gain.value = this.settings.metronome;

    node.connect(comp);
    node.connect(verb).connect(wet).connect(comp);
    comp.connect(master).connect(analyser).connect(ctx.destination);
    clickBus.connect(master);

    this.node = node;
    this.master = master;
    this.wet = wet;
    this.analyser = analyser;
    this.clickBus = clickBus;
    this.noise = this.makeNoise(ctx);
    this.patches.forEach((patch, part) => this.post({ t: 'patch', part, patch }));
    this.configs.forEach((config, part) => this.post({ t: 'config', part, config }));
    this.pending.splice(0).forEach((m) => this.post(m));
    if (this.statusListeners.size) this.post({ t: 'status', enabled: true });
    await ctx.resume();
    this.setState(ctx.state === 'running' ? 'running' : 'suspended');
  }

  get running(): boolean {
    return this.state === 'running';
  }

  onState(fn: () => void): () => void {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  onStatus(fn: (s: PartStatus[]) => void): () => void {
    this.statusListeners.add(fn);
    this.post({ t: 'status', enabled: true });
    return () => {
      this.statusListeners.delete(fn);
      if (!this.statusListeners.size) this.post({ t: 'status', enabled: false });
    };
  }

  private setState(s: EngineState): void {
    this.state = s;
    this.stateListeners.forEach((l) => l());
  }

  private post(msg: WorkletIn): void {
    if (this.node) this.node.port.postMessage(msg);
    else if (this.starting && !('at' in msg && msg.at) && this.pending.length < 64) this.pending.push(msg);
  }

  private impulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * (i < 200 ? i / 200 : 1);
      }
    }
    return buf;
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ------------------------------------------------------------- settings

  setMaster(v: number): void {
    this.settings.master = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }
  setReverb(v: number): void {
    this.settings.reverb = v;
    if (this.wet && this.ctx) this.wet.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }
  setMetronome(v: number): void {
    this.settings.metronome = v;
    if (this.clickBus && this.ctx) this.clickBus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  setPatch(part: PartId, patch: Patch): void {
    this.patches[part] = normalizePatch(patch);
    this.post({ t: 'patch', part, patch: this.patches[part] });
  }
  getPatch(part: PartId): Patch {
    return this.patches[part];
  }
  setConfig(part: PartId, config: Partial<PartConfig>): void {
    this.configs[part] = { ...this.configs[part], ...config };
    this.post({ t: 'config', part, config });
  }
  getConfig(part: PartId): PartConfig {
    return this.configs[part];
  }

  // ---------------------------------------------------------------- notes

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  noteOn(part: PartId, note: number, vel = 100, at?: number): void {
    this.post({ t: 'on', part, note, vel, at });
  }
  noteOff(part: PartId, note: number, at?: number): void {
    this.post({ t: 'off', part, note, at });
  }
  bend(part: PartId, value: number): void {
    this.post({ t: 'bend', part, value });
  }
  wheel(part: PartId, value: number): void {
    this.post({ t: 'wheel', part, value });
  }
  aftertouch(part: PartId, value: number): void {
    this.post({ t: 'aftertouch', part, value });
  }
  sustain(part: PartId, on: boolean): void {
    this.post({ t: 'sustain', part, on });
  }
  allOff(part?: PartId): void {
    this.post({ t: 'allOff', part });
  }
  /** Drop scheduled notes and release sounding ones (stop a playing example). */
  stop(part?: PartId): void {
    this.post({ t: 'cancel', part });
    if (part === undefined || part === PART.lesson) this.stopScheduledClicks();
  }
  panic(): void {
    this.post({ t: 'panic' });
    this.stopScheduledClicks();
  }

  /**
   * Schedule a list of notes. Returns the absolute start/end times (AudioContext seconds).
   * Starting slightly in the future keeps the first note on time.
   */
  play(events: NoteEvent[], opts: { part?: PartId; startAt?: number } = {}): { start: number; end: number } {
    const t0 = opts.startAt ?? this.now() + 0.08;
    let end = t0;
    for (const e of events) {
      const part = e.part ?? opts.part ?? PART.lesson;
      const on = t0 + e.start;
      const off = on + Math.max(0.03, e.dur);
      this.post({ t: 'on', part, note: e.note, vel: e.vel ?? 96, at: on });
      this.post({ t: 'off', part, note: e.note, at: off });
      end = Math.max(end, off);
    }
    return { start: t0, end };
  }

  // ----------------------------------------------------- clicks and drums

  drum(kind: DrumKind, at?: number, gain = 1): void {
    const ctx = this.ctx;
    const bus = this.clickBus;
    if (!ctx || !bus) return;
    const t = at ?? ctx.currentTime;
    const g = ctx.createGain();
    g.connect(bus);
    const track = (n: AudioScheduledSourceNode) => {
      this.scheduledNodes.add(n);
      n.onended = () => {
        this.scheduledNodes.delete(n);
        g.disconnect();
      };
    };
    if (kind === 'click' || kind === 'accent') {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = kind === 'accent' ? 1760 : 1320;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5 * gain, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.07);
      track(o);
    } else if (kind === 'kick') {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.9 * gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.36);
      track(o);
    } else if (this.noise) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      if (kind === 'hat') {
        f.type = 'highpass';
        f.frequency.value = 7000;
        g.gain.setValueAtTime(0.25 * gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      } else {
        f.type = 'bandpass';
        f.frequency.value = 1800;
        f.Q.value = 0.8;
        g.gain.setValueAtTime(0.6 * gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      }
      src.connect(f).connect(g);
      src.start(t);
      src.stop(t + 0.2);
      track(src);
    }
  }

  stopScheduledClicks(): void {
    for (const n of this.scheduledNodes) {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    }
    this.scheduledNodes.clear();
  }

  /** Map a performance.now()/event.timeStamp value (ms) to AudioContext time (s). */
  perfToCtx(perfMs: number): number {
    const ctx = this.ctx;
    if (!ctx) return 0;
    const ts = ctx.getOutputTimestamp?.();
    if (ts && ts.contextTime !== undefined && ts.performanceTime !== undefined && ts.performanceTime > 0) {
      return ts.contextTime + (perfMs - ts.performanceTime) / 1000;
    }
    // currentTime runs ahead of what is audible by the output latency
    return ctx.currentTime - (performance.now() - perfMs) / 1000 - this.latency();
  }

  /** Output latency estimate in seconds (what the listener hears vs. scheduled time). */
  latency(): number {
    const ctx = this.ctx;
    if (!ctx) return 0;
    return (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
  }
}

export const audio = new AudioEngine();
