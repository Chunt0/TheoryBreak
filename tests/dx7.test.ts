import { describe, expect, test } from 'bun:test';
import { ALGORITHMS, compileAlgorithm, layoutAlgorithm } from '../src/client/audio/dx7/algorithms';
import { Part, lfoHz } from '../src/client/audio/dx7/dsp';
import { PRESETS } from '../src/client/audio/dx7/presets';
import { buildBank, parseSysex, packVoice, unpackVoice } from '../src/client/audio/dx7/sysex';
import { initPatch, modIndex, normalizePatch } from '../src/client/audio/dx7/patch';

const SR = 48000;

function render(part: Part, seconds: number): Float32Array {
  const n = Math.round(seconds * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i += 32) part.render(buf, i, Math.min(32, n - i));
  return buf;
}
const peak = (b: Float32Array) => b.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
const rms = (b: Float32Array) => Math.sqrt(b.reduce((s, x) => s + x * x, 0) / b.length);

describe('algorithms', () => {
  test('every edge goes from a higher to a lower operator', () => {
    for (const a of ALGORITHMS) for (const [m, t] of a.edges) expect(m).toBeGreaterThan(t);
  });
  test('every operator is a carrier or modulates something', () => {
    for (const a of ALGORITHMS) {
      for (let op = 1; op <= 6; op++) {
        const used = a.carriers.includes(op) || a.edges.some(([m]) => m === op);
        expect(used).toBe(true);
      }
    }
  });
  test('layout puts carriers on the bottom row and no two ops overlap', () => {
    for (const a of ALGORITHMS) {
      const l = layoutAlgorithm(a.id);
      const bottom = l.rows - 1;
      for (const n of l.nodes) expect(n.y === bottom).toBe(n.carrier);
      const keys = new Set(l.nodes.map((n) => `${n.x.toFixed(2)}:${n.y}`));
      expect(keys.size).toBe(6);
    }
  });
  test('compiled algorithm 16 has OP1 modulated by OP2, OP3 and OP5', () => {
    expect(compileAlgorithm(16).modSources[0].sort()).toEqual([1, 2, 4]);
  });
});

describe('voice rendering', () => {
  test('init voice produces a clean sine at the right pitch', () => {
    const part = new Part(SR, initPatch());
    part.noteOn(69, 100);
    const buf = render(part, 0.5);
    expect(peak(buf)).toBeGreaterThan(0.05);
    expect(peak(buf)).toBeLessThan(0.2);
    // count zero crossings over the last 0.25s → ≈ 440 Hz
    const tail = buf.subarray(SR * 0.25);
    let crossings = 0;
    for (let i = 1; i < tail.length; i++) if (tail[i - 1] < 0 && tail[i] >= 0) crossings++;
    expect(Math.abs(crossings / 0.25 - 440)).toBeLessThan(6);
  });

  test('every preset renders finite, audible, non-clipping audio and releases', () => {
    for (const pr of PRESETS) {
      const part = new Part(SR, structuredClone(pr.patch));
      for (const n of [48, 60, 64, 67]) part.noteOn(n, 100);
      const on = render(part, 1.0);
      for (const n of [48, 60, 64, 67]) part.noteOff(n);
      render(part, 15); // bells and pads ring on after key-up, like the hardware
      expect(on.every(Number.isFinite)).toBe(true);
      expect(rms(on)).toBeGreaterThan(0.005);
      expect(peak(on)).toBeLessThan(2.5);
      expect(part.status().activeVoices).toBe(0);
    }
  });

  test('voice stealing respects polyphony', () => {
    const part = new Part(SR, initPatch());
    part.setConfig({ polyphony: 4 });
    for (let n = 60; n < 70; n++) part.noteOn(n, 100);
    render(part, 0.05);
    expect(part.status().activeVoices).toBeLessThanOrEqual(4);
  });

  test('sustain pedal holds notes until released', () => {
    const part = new Part(SR, initPatch());
    part.setSustain(true);
    part.noteOn(60, 100);
    render(part, 0.1);
    part.noteOff(60);
    render(part, 0.5);
    expect(part.status().activeVoices).toBe(1);
    part.setSustain(false);
    render(part, 1);
    expect(part.status().activeVoices).toBe(0);
  });

  test('mono legato keeps one voice', () => {
    const part = new Part(SR, structuredClone(PRESETS.find((p) => p.patch.name === 'SAW LEAD')!.patch));
    part.setConfig({ mono: true, portaTime: 40 });
    part.noteOn(60, 100);
    part.noteOn(64, 100);
    render(part, 0.2);
    expect(part.status().activeVoices).toBe(1);
    part.noteOff(64);
    part.noteOff(60);
    render(part, 2);
    expect(part.status().activeVoices).toBe(0);
  });

  test('LFO speed mapping is in the DX7 range', () => {
    expect(lfoHz(0)).toBeLessThan(0.1);
    expect(lfoHz(35)).toBeGreaterThan(4);
    expect(lfoHz(35)).toBeLessThan(8);
    expect(lfoHz(99)).toBeGreaterThan(20);
  });

  test('modulation index helper is monotonic and peaks near 4π', () => {
    expect(modIndex(99)).toBeCloseTo(4 * Math.PI, 0);
    expect(modIndex(70)).toBeLessThan(modIndex(80));
    expect(modIndex(0)).toBe(0);
  });
});

describe('sysex', () => {
  test('packed voice round-trips', () => {
    for (const pr of PRESETS) {
      const back = unpackVoice(packVoice(pr.patch));
      const strip = (p: typeof pr.patch) => ({ ...normalizePatch(p), name: p.name.padEnd(10).slice(0, 10).trimEnd() });
      expect(back).toEqual(strip(pr.patch));
    }
  });
  test('bank build + parse', () => {
    const bank = buildBank(PRESETS.map((p) => p.patch), initPatch);
    expect(bank.length).toBe(4104);
    const { patches, warnings } = parseSysex(bank);
    expect(warnings).toEqual([]);
    expect(patches.length).toBe(32);
    expect(patches[0].name).toBe(PRESETS[0].patch.name);
    expect(patches[31].name).toBe('INIT VOICE');
  });
  test('garbage input yields a warning, not a crash', () => {
    const { patches, warnings } = parseSysex(new Uint8Array([1, 2, 3]));
    expect(patches.length).toBe(0);
    expect(warnings.length).toBe(1);
  });
});
