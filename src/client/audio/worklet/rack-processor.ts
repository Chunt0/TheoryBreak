// AudioWorklet entry point for the modular synth: one rack, the same
// time-stamped note queue as the DX7 worklet (so exercises can play it), and
// meters for the panel's jack lights.

import { BLOCK, Rack, type RackStatus } from '../rack/dsp';
import type { RackPatch } from '../rack/patch';

interface WorkletScope {
  sampleRate: number;
  currentFrame: number;
  AudioWorkletProcessor: new () => { readonly port: MessagePort };
  registerProcessor(name: string, ctor: unknown): void;
}
const scope = globalThis as unknown as WorkletScope;

export type RackIn =
  | { t: 'patch'; patch: RackPatch }
  | { t: 'param'; mod: string; key: string; value: number }
  | { t: 'on'; note: number; vel: number; at?: number }
  | { t: 'off'; note: number; at?: number }
  | { t: 'bend'; value: number }
  | { t: 'wheel'; value: number }
  | { t: 'aftertouch'; value: number }
  | { t: 'sustain'; on: boolean }
  | { t: 'allOff' }
  | { t: 'cancel' }
  | { t: 'panic' }
  /** the rack only runs while it is the instrument */
  | { t: 'active'; on: boolean }
  | { t: 'status'; enabled: boolean };

export type RackOut = { t: 'status'; status: RackStatus };

interface Scheduled {
  frame: number;
  msg: RackIn;
}

class RackProcessor extends scope.AudioWorkletProcessor {
  private rack = new Rack(scope.sampleRate);
  private queue: Scheduled[] = [];
  private active = false;
  private statusEnabled = false;
  private statusCountdown = 0;
  private L = new Float32Array(128);
  private R = new Float32Array(128);

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent<RackIn>) => this.receive(e.data);
  }

  private receive(msg: RackIn): void {
    const at = 'at' in msg ? msg.at : undefined;
    if (at !== undefined && at > 0) {
      const frame = Math.round(at * scope.sampleRate);
      if (frame > scope.currentFrame) {
        const q = this.queue;
        let lo = 0;
        let hi = q.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (q[mid].frame <= frame) lo = mid + 1;
          else hi = mid;
        }
        q.splice(lo, 0, { frame, msg }); // after equal frames, so same-time events keep their order
        return;
      }
    }
    this.apply(msg);
  }

  private apply(msg: RackIn): void {
    const r = this.rack;
    switch (msg.t) {
      case 'patch': r.setPatch(msg.patch); break;
      case 'param': r.setParam(msg.mod, msg.key, msg.value); break;
      case 'on': if (this.active) r.noteOn(msg.note, msg.vel); break;
      case 'off': r.noteOff(msg.note); break;
      case 'bend': r.setBend(msg.value); break;
      case 'wheel': r.setWheel(msg.value); break;
      case 'aftertouch': r.setPressure(msg.value); break;
      case 'sustain': r.setSustain(msg.on); break;
      case 'allOff': r.allOff(); break;
      case 'cancel':
        this.queue = this.queue.filter((q) => q.msg.t !== 'on');
        r.allOff();
        break;
      case 'panic':
        this.queue = [];
        r.allOff();
        r.setSustain(false);
        break;
      case 'active':
        this.active = msg.on;
        if (!msg.on) {
          this.queue = [];
          r.allOff();
        }
        break;
      case 'status':
        this.statusEnabled = msg.enabled;
        r.metering = msg.enabled;
        break;
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0];
    if (!out || out.length === 0) return true;
    const n = out[0].length;
    if (!this.active) {
      for (const ch of out) ch.fill(0);
      return true;
    }
    if (this.L.length < n) {
      this.L = new Float32Array(n);
      this.R = new Float32Array(n);
    }
    const start = scope.currentFrame;
    for (let off = 0; off < n; off += BLOCK) {
      const len = Math.min(BLOCK, n - off);
      const end = start + off + len;
      while (this.queue.length && this.queue[0].frame < end) this.apply(this.queue.shift()!.msg);
      this.rack.render(this.L, this.R, off, len);
    }
    out[0].set(this.L.subarray(0, n));
    if (out[1]) out[1].set(this.R.subarray(0, n));

    if (this.statusEnabled && --this.statusCountdown <= 0) {
      this.statusCountdown = Math.round((scope.sampleRate * 0.05) / n);
      this.port.postMessage({ t: 'status', status: this.rack.status() } satisfies RackOut);
    }
    return true;
  }
}

scope.registerProcessor('rack', RackProcessor);
