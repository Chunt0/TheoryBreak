// AudioWorklet entry point: hosts several DX7 parts (synth, lesson, bass) and
// a time-stamped event queue so lessons can schedule music precisely.

import { Part, type PartStatus } from '../dx7/dsp';
import { PartFx } from '../dx7/fx';
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

export type WorkletOut =
  | { t: 'status'; parts: PartStatus[]; peakL: number; peakR: number }
  | { t: 'ready'; sampleRate: number };

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
  private partFx: PartFx[];
  private queue: Scheduled[] = [];
  private seq = 0;
  private mixL = new Float32Array(128);
  private mixR = new Float32Array(128);
  private scratchL = new Float32Array(128);
  private scratchR = new Float32Array(128);
  private statusEnabled = false;
  private statusCountdown = 0;
  private peakL = 0;
  private peakR = 0;

  constructor() {
    super();
    const sr = scope.sampleRate;
    this.parts = Array.from({ length: PART_COUNT }, (_, i) => new Part(sr, initPatch(), MAX_VOICES[i]));
    this.partFx = Array.from({ length: PART_COUNT }, () => new PartFx(sr));
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
      case 'patch':
        this.part(msg.part)?.setPatch(msg.patch);
        this.partFx[msg.part]?.setPatch(msg.patch.fx);
        break;
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
    if (this.mixL.length < n) {
      this.mixL = new Float32Array(n);
      this.mixR = new Float32Array(n);
      this.scratchL = new Float32Array(n);
      this.scratchR = new Float32Array(n);
    }
    const mixL = this.mixL;
    const mixR = this.mixR;
    const scratchL = this.scratchL;
    const scratchR = this.scratchR;
    mixL.fill(0, 0, n);
    mixR.fill(0, 0, n);
    const blockStart = scope.currentFrame;
    for (let off = 0; off < n; off += TICK) {
      const len = Math.min(TICK, n - off);
      const tickEnd = blockStart + off + len;
      while (this.queue.length && this.queue[0].frame < tickEnd) this.apply(this.queue.shift()!.msg);
      for (let pi = 0; pi < this.parts.length; pi++) {
        const p = this.parts[pi];
        const vol = p.config.volume;
        scratchL.fill(0, off, off + len);
        scratchR.fill(0, off, off + len);
        p.renderStereo(scratchL, scratchR, off, len);
        if (vol <= 0) continue;
        this.partFx[pi].processBlock(scratchL, scratchR, off, len);
        for (let i = off; i < off + len; i++) {
          mixL[i] += scratchL[i] * vol;
          mixR[i] += scratchR[i] * vol;
        }
      }
    }
    out[0].set(mixL.subarray(0, n));
    const outR = out[1] ?? out[0];
    outR.set(mixR.subarray(0, n));

    if (this.statusEnabled) {
      for (let i = 0; i < n; i++) {
        const al = Math.abs(mixL[i]);
        const ar = Math.abs(mixR[i]);
        if (al > this.peakL) this.peakL = al;
        if (ar > this.peakR) this.peakR = ar;
      }
      if (--this.statusCountdown <= 0) {
        this.statusCountdown = Math.round((scope.sampleRate * 0.04) / n);
        this.port.postMessage({
          t: 'status',
          parts: this.parts.map((p) => p.status()),
          peakL: this.peakL,
          peakR: this.peakR,
        } satisfies WorkletOut);
        this.peakL = 0;
        this.peakR = 0;
      }
    }
    return true;
  }
}

scope.registerProcessor('dx7', Dx7Processor);
