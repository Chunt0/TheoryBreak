import { describe, expect, test } from 'bun:test';
import { ALGORITHMS, compileAlgorithm, layoutAlgorithm } from '../src/client/audio/dx7/algorithms';
import { Part, evalModMatrix, lfoHz, type ModSources } from '../src/client/audio/dx7/dsp';
import { PartFx } from '../src/client/audio/dx7/fx';
import { PRESETS } from '../src/client/audio/dx7/presets';
import { buildBank, parseSysex, packVoice, unpackVoice } from '../src/client/audio/dx7/sysex';
import { initPatch, modIndex, normalizePatch, type ModSlot, type OpShape } from '../src/client/audio/dx7/patch';

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

  test('every oscillator shape renders finite, audible audio', () => {
    for (let shape = 0; shape <= 4; shape++) {
      const patch = initPatch();
      patch.ops[0].shape = shape as OpShape;
      const part = new Part(SR, patch);
      part.noteOn(69, 100);
      const buf = render(part, 0.1);
      expect(buf.every(Number.isFinite)).toBe(true);
      expect(peak(buf)).toBeGreaterThan(0.01);
    }
  });

  test('unison stacks one voice per configured count, poly and mono', () => {
    const patch = initPatch();
    patch.unison.voices = 4;
    const poly = new Part(SR, patch);
    poly.noteOn(60, 100);
    render(poly, 0.01);
    expect(poly.status().activeVoices).toBe(4);
    poly.noteOff(60);
    render(poly, 1);
    expect(poly.status().activeVoices).toBe(0);

    const mono = new Part(SR, patch);
    mono.setConfig({ mono: true });
    mono.noteOn(60, 100);
    render(mono, 0.01);
    expect(mono.status().activeVoices).toBe(4);
  });
});

describe('mod matrix', () => {
  const neutral: ModSources = { wheel: 0, aftertouch: 0, velocity: 0, keyFollow: 0, lfo2: 0, macros: [0, 0, 0, 0] };

  test('empty slot list leaves every output neutral', () => {
    const outLevel = new Float64Array(6);
    const outPitchOct = new Float64Array(6);
    const [fb, pan] = evalModMatrix([], neutral, outLevel, outPitchOct);
    expect(Array.from(outLevel)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(Array.from(outPitchOct)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(fb).toBe(0);
    expect(pan).toBe(0);
  });

  test('an active slot nudges its destination; an off slot is ignored', () => {
    const outLevel = new Float64Array(6);
    const outPitchOct = new Float64Array(6);
    const slots: ModSlot[] = [
      { on: true, source: 'velocity', dest: 'op1Level', depth: 99 },
      { on: true, source: 'wheel', dest: 'feedback', depth: 50 },
      { on: false, source: 'wheel', dest: 'pan', depth: 99 },
    ];
    const [fb, pan] = evalModMatrix(slots, { ...neutral, wheel: 1, velocity: 1 }, outLevel, outPitchOct);
    expect(outLevel[0]).toBeCloseTo(2, 5); // 1 + velocity(1) * depth(99/99)
    expect(fb).toBeCloseTo(50 / 99, 5);
    expect(pan).toBe(0);
  });
});

describe('part fx chain', () => {
  test('every effect off bypasses the block unchanged', () => {
    const fx = new PartFx(SR);
    const l = Float32Array.from({ length: 64 }, (_, i) => Math.sin(i));
    const r = Float32Array.from({ length: 64 }, (_, i) => Math.cos(i));
    const l0 = l.slice();
    const r0 = r.slice();
    fx.processBlock(l, r, 0, 64);
    expect(l).toEqual(l0);
    expect(r).toEqual(r0);
  });

  test('chorus, delay, drive and reverb together stay finite and bounded', () => {
    const fx = new PartFx(SR);
    fx.setPatch({
      chorus: { on: true, rate: 40, depth: 30, mix: 50 },
      delay: { on: true, time: 30, feedback: 35, mix: 50, sync: false },
      drive: { on: true, amount: 50, tone: 50, mix: 100 },
      reverb: { on: true, size: 50, damp: 40, mix: 50 },
    });
    const n = SR;
    const l = new Float32Array(n);
    const r = new Float32Array(n);
    for (let i = 0; i < 100; i++) {
      l[i] = Math.sin(i * 0.3);
      r[i] = Math.sin(i * 0.3);
    }
    for (let off = 0; off < n; off += 128) fx.processBlock(l, r, off, Math.min(128, n - off));
    expect(l.every(Number.isFinite)).toBe(true);
    expect(r.every(Number.isFinite)).toBe(true);
    expect(peak(l)).toBeGreaterThan(0);
    expect(peak(l)).toBeLessThan(5);
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
