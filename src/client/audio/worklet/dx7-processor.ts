// AudioWorklet entry point: hosts several DX7 parts (synth, lesson, bass) and
// a time-stamped event queue so lessons can schedule music precisely.

import { Part, type PartStatus } from '../dx7/dsp';
import { initPatch, type PartConfig, type Patch } from '../dx7/patch';

interface WorkletScope {
  sampleRate: number;
  currentFrame: number;
  AudioWorkletProcessor: new () => { readonly port: MessagePort };
  registerProcessor(name: string, ctor: unknown): void;
}
const scope = globalThis as unknown as WorkletScope;

export type WorkletIn =
  | { t: 'patch'; part: number; patch: Patch }
  | { t: 'config'; part: number; config: Partial<PartConfig> }
  | { t: 'on'; part: number; note: number; vel: number; at?: number }
  | { t: 'off'; part: number; note: number; at?: number }
  | { t: 'bend'; part: number; value: number }
  | { t: 'wheel'; part: number; value: number }
  | { t: 'aftertouch'; part: number; value: number }
  | { t: 'sustain'; part: number; on: boolean }
  | { t: 'allOff'; part?: number; at?: number }
  | { t: 'cancel'; part?: number }
  | { t: 'panic' }
  | { t: 'status'; enabled: boolean };

export type WorkletOut = { t: 'status'; parts: PartStatus[] } | { t: 'ready'; sampleRate: number };

interface Scheduled {
  frame: number;
  seq: number;
  msg: WorkletIn;
}

const TICK = 32;
const PART_COUNT = 3;
const MAX_VOICES = [16, 16, 6];

class Dx7Processor extends scope.AudioWorkletProcessor {
  private parts: Part[];
  private queue: Scheduled[] = [];
  private seq = 0;
  private mix = new Float32Array(128);
  private scratch = new Float32Array(128);
  private statusEnabled = false;
  private statusCountdown = 0;

  constructor() {
    super();
    const sr = scope.sampleRate;
    this.parts = Array.from({ length: PART_COUNT }, (_, i) => new Part(sr, initPatch(), MAX_VOICES[i]));
    this.port.onmessage = (e: MessageEvent<WorkletIn | WorkletIn[]>) => {
      const data = e.data;
      if (Array.isArray(data)) data.forEach((m) => this.receive(m));
      else this.receive(data);
    };
    this.port.postMessage({ t: 'ready', sampleRate: sr } satisfies WorkletOut);
  }

  private receive(msg: WorkletIn): void {
    const at = 'at' in msg ? msg.at : undefined;
    if (at !== undefined && at > 0) {
      const frame = Math.round(at * scope.sampleRate);
      if (frame > scope.currentFrame) {
        this.insert({ frame, seq: this.seq++, msg });
        return;
      }
    }
    this.apply(msg);
  }

  private insert(ev: Scheduled): void {
    const q = this.queue;
    let lo = 0;
    let hi = q.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (q[mid].frame < ev.frame || (q[mid].frame === ev.frame && q[mid].seq < ev.seq)) lo = mid + 1;
      else hi = mid;
    }
    q.splice(lo, 0, ev);
  }

  private part(i: number): Part | undefined {
    return this.parts[i];
  }

  private apply(msg: WorkletIn): void {
    switch (msg.t) {
      case 'patch': this.part(msg.part)?.setPatch(msg.patch); break;
      case 'config': this.part(msg.part)?.setConfig(msg.config); break;
      case 'on': this.part(msg.part)?.noteOn(msg.note, msg.vel); break;
      case 'off': this.part(msg.part)?.noteOff(msg.note); break;
      case 'bend': { const p = this.part(msg.part); if (p) p.bend = msg.value; break; }
      case 'wheel': { const p = this.part(msg.part); if (p) p.wheel = msg.value; break; }
      case 'aftertouch': { const p = this.part(msg.part); if (p) p.aftertouch = msg.value; break; }
      case 'sustain': this.part(msg.part)?.setSustain(msg.on); break;
      case 'allOff':
        if (msg.part === undefined) this.parts.forEach((p) => p.allNotesOff());
        else this.part(msg.part)?.allNotesOff();
        break;
      case 'cancel': {
        const target = msg.part;
        this.queue = target === undefined ? [] : this.queue.filter((e) => 'part' in e.msg && e.msg.part !== target);
        if (msg.part === undefined) this.parts.forEach((p) => p.allNotesOff());
        else this.part(msg.part)?.allNotesOff();
        break;
      }
      case 'panic':
        this.queue = [];
        this.parts.forEach((p) => p.panic());
        break;
      case 'status': this.statusEnabled = msg.enabled; break;
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0];
    const left = out[0];
    if (!left) return true;
    const n = left.length;
    if (this.mix.length < n) {
      this.mix = new Float32Array(n);
      this.scratch = new Float32Array(n);
    }
    const mix = this.mix;
    const scratch = this.scratch;
    mix.fill(0, 0, n);
    const blockStart = scope.currentFrame;
    for (let off = 0; off < n; off += TICK) {
      const len = Math.min(TICK, n - off);
      const tickEnd = blockStart + off + len;
      while (this.queue.length && this.queue[0].frame < tickEnd) this.apply(this.queue.shift()!.msg);
      for (const p of this.parts) {
        const vol = p.config.volume;
        scratch.fill(0, off, off + len);
        p.render(scratch, off, len);
        if (vol <= 0) continue;
        for (let i = off; i < off + len; i++) mix[i] += scratch[i] * vol;
      }
    }
    for (let c = 0; c < out.length; c++) out[c].set(mix.subarray(0, n));

    if (this.statusEnabled && --this.statusCountdown <= 0) {
      this.statusCountdown = Math.round((scope.sampleRate * 0.04) / n);
      this.port.postMessage({ t: 'status', parts: this.parts.map((p) => p.status()) } satisfies WorkletOut);
    }
    return true;
  }
}

scope.registerProcessor('dx7', Dx7Processor);
