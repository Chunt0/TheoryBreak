import { describe, expect, test } from 'bun:test';
import { BLOCK, Rack } from '../src/client/audio/rack/dsp';
import { MODULES, MODULE_LIST, formatParam, fromNorm, moodRate, toNorm } from '../src/client/audio/rack/modules';
import { RACK_PRESETS, newModule, normalizeRack, type RackPatch } from '../src/client/audio/rack/patch';
import { GUIDE } from '../src/client/audio/rack/guide';
import { buildChord } from '../src/client/audio/rack/chords';
import { euclid } from '../src/client/audio/rack/more';
import { SONO_ROWS, SPECTRUM_POINTS, detectPitch, spectrumHz } from '../src/client/audio/rack/visual';
import { seedRand, type RackView } from '../src/client/audio/rack/base';
import { CMD_DOWN, CMD_REC, CMD_STOP, CMD_UNDO, CMD_UP, LOOP_PLAY, LOOP_REC, LOOP_STOP } from '../src/client/audio/rack/cosm';
import { MOOD_RING, M_LOOP, M_LOOP_HOLD, M_LOOP_LET, M_WET, M_WET_HOLD, M_WET_LET, delayTime } from '../src/client/audio/rack/mood';

const SR = 48000;

function render(rack: Rack, seconds: number): { L: Float32Array; R: Float32Array } {
  const n = Math.round(seconds * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i += BLOCK) rack.render(L, R, i, Math.min(BLOCK, n - i));
  return { L, R };
}
const peak = (b: Float32Array) => b.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
const finite = (b: Float32Array) => b.every((x) => Number.isFinite(x));

/** Zero crossings per second of a signal → its frequency (for simple waves). */
function pitchOf(b: Float32Array): number {
  let n = 0;
  for (let i = 1; i < b.length; i++) if (b[i - 1] < 0 && b[i] >= 0) n++;
  return n / (b.length / SR);
}

function patch(mods: [string, string, Record<string, number>?][], wires: [string, string][]): RackPatch {
  return normalizeRack({
    name: 'T',
    modules: mods.map(([id, type, params]) => ({ ...newModule(type as never, id), params: { ...newModule(type as never, id).params, ...params } })),
    cables: wires.map(([a, b], i) => ({ id: `c${i}`, from: { mod: a.split('.')[0], port: a.split('.')[1] }, to: { mod: b.split('.')[0], port: b.split('.')[1] }, color: 0 })),
  })!;
}

describe('catalogue', () => {
  test('every module has a unique id and sane params', () => {
    for (const m of MODULE_LIST) {
      expect(MODULES[m.type]).toBe(m);
      for (const p of m.params) {
        expect(p.def).toBeGreaterThanOrEqual(p.min);
        expect(p.def).toBeLessThanOrEqual(p.max);
        expect(fromNorm(p, toNorm(p, p.def))).toBeCloseTo(p.def, 6);
        expect(formatParam(p, p.def)).not.toBe('');
      }
    }
  });
});

describe('guide', () => {
  test('every module has a page covering each knob and jack, and nothing else', () => {
    for (const m of MODULE_LIST) {
      const g = GUIDE[m.type];
      expect(g.what.length).toBeGreaterThan(40);
      expect(g.tryIt.length).toBeGreaterThan(0);
      // the sequencer's step knobs and lights share one entry each (s0, g0)
      const params = m.params.map((p) => p.id).filter((id) => !(m.type === 'seq' && /^[sg]([1-9]|1[0-5])$/.test(id)));
      expect(Object.keys(g.knobs).sort()).toEqual(params.sort());
      expect(Object.keys(g.ins).sort()).toEqual(m.ins.map((p) => p.id).sort());
      expect(Object.keys(g.outs).sort()).toEqual(m.outs.map((p) => p.id).sort());
    }
  });

  test('presets the guide says to load exist', () => {
    const names = RACK_PRESETS.map((p) => p.patch.name);
    for (const g of Object.values(GUIDE)) {
      for (const step of g.tryIt) {
        const m = /Load ([A-Z&' ]+?)(?=[.,]| and|$)/.exec(step);
        if (m) expect(names).toContain(m[1].trim());
      }
    }
  });
});

describe('patches', () => {
  test('normalize drops unknown modules, dangling cables and a second cable into one input', () => {
    const p = normalizeRack({
      name: 'x',
      modules: [{ id: 'a', type: 'vco', params: { oct: 99 } }, { id: 'b', type: 'nope', params: {} }, { id: 'o', type: 'out', params: {} }],
      cables: [
        { id: '1', from: { mod: 'a', port: 'saw' }, to: { mod: 'o', port: 'l' }, color: 1 },
        { id: '2', from: { mod: 'a', port: 'sqr' }, to: { mod: 'o', port: 'l' }, color: 2 },
        { id: '3', from: { mod: 'b', port: 'x' }, to: { mod: 'o', port: 'r' }, color: 3 },
        { id: '4', from: { mod: 'a', port: 'nope' }, to: { mod: 'o', port: 'r' }, color: 3 },
      ],
    })!;
    expect(p.modules.map((m) => m.id)).toEqual(['a', 'o']);
    expect(p.modules[0].params.oct).toBe(3);
    expect(p.cables.map((c) => c.id)).toEqual(['1']);
  });

  test('every factory rack plays a note, and stays finite', () => {
    for (const { patch: p } of RACK_PRESETS) {
      const rack = new Rack(SR);
      rack.setPatch(p);
      rack.noteOn(60, 100);
      const a = render(rack, 0.6);
      rack.noteOff(60);
      const b = render(rack, 0.6);
      expect(finite(a.L) && finite(b.L)).toBe(true);
      expect(peak(a.L)).toBeGreaterThan(0.02);
      expect(peak(a.L)).toBeLessThanOrEqual(1.3);
    }
  });
});

describe('every module', () => {
  test('renders finite output with noise and gates in every input, mono and poly', () => {
    for (const def of MODULE_LIST) {
      for (const voices of [0, 3]) {
        const rack = new Rack(SR);
        const mods: [string, string, Record<string, number>?][] = [['m', 'midi', { voices }], ['n', 'noise'], ['c', 'clock', { bpm: 300 }], ['x', def.type], ['o', 'out']];
        const wires: [string, string][] = def.ins.map((inp, i) => [i % 3 === 0 ? 'n.white' : i % 3 === 1 ? 'c.s' : 'm.voct', `x.${inp.id}`]);
        if (def.ins.some((i) => i.id === 'gate')) wires.push(['m.gate', 'x.gate']);
        if (def.outs[0]) wires.push([`x.${def.outs[0].id}`, 'o.l']);
        rack.setPatch(patch(mods, wires.filter((w, i, all) => all.findIndex((v) => v[1] === w[1]) === i)));
        rack.noteOn(60, 100);
        rack.noteOn(67, 90);
        const { L, R } = render(rack, 0.5);
        rack.status();
        expect({ type: def.type, voices, ok: finite(L) && finite(R) }).toEqual({ type: def.type, voices, ok: true });
      }
    }
  });
});

describe('modules', () => {
  test('VCO follows 1 V/oct from the MIDI module (A4 = 440 Hz)', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['m', 'midi', { voices: 0 }], ['v', 'vco'], ['o', 'out']], [['m.voct', 'v.voct'], ['v.sin', 'o.l']]));
    rack.noteOn(69, 100);
    const { L } = render(rack, 1);
    expect(pitchOf(L)).toBeGreaterThan(437);
    expect(pitchOf(L)).toBeLessThan(443);
  });

  test('envelope + VCA: silent before the note, sounding during, silent after release', () => {
    const rack = new Rack(SR);
    rack.setPatch(RACK_PRESETS[0].patch);
    expect(peak(render(rack, 0.2).L)).toBe(0);
    rack.noteOn(60, 100);
    expect(peak(render(rack, 0.3).L)).toBeGreaterThan(0.1);
    rack.noteOff(60);
    render(rack, 2);
    expect(peak(render(rack, 0.1).L)).toBeLessThan(1e-3);
  });

  test('poly MIDI: a chord makes poly cables and every voice sounds', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['m', 'midi', { voices: 2 }], ['v', 'vco'], ['e', 'adsr'], ['a', 'vca'], ['o', 'out', { level: 0.3 }]], [
      ['m.voct', 'v.voct'], ['m.gate', 'e.gate'], ['v.sin', 'a.in'], ['e.env', 'a.cv'], ['a.out', 'o.l'],
    ]));
    rack.noteOn(60, 100);
    const one = peak(render(rack, 0.3).L);
    rack.noteOn(64, 100);
    rack.noteOn(67, 100);
    const three = peak(render(rack, 0.3).L);
    expect(three).toBeGreaterThan(one * 1.3);
  });

  test('mono MIDI is last-note priority and falls back to the held note', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['m', 'midi', { voices: 0 }], ['v', 'vco'], ['o', 'out']], [['m.voct', 'v.voct'], ['v.sin', 'o.l']]));
    rack.noteOn(57, 100);
    rack.noteOn(69, 100);
    render(rack, 0.05);
    expect(pitchOf(render(rack, 0.5).L)).toBeGreaterThan(435);
    rack.noteOff(69);
    render(rack, 0.05);
    const f = pitchOf(render(rack, 0.5).L);
    expect(f).toBeGreaterThan(216);
    expect(f).toBeLessThan(224);
  });

  test('clock drives the sequencer through its steps', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['c', 'clock', { bpm: 240 }], ['s', 'seq', { len: 4 }]], [['c.s', 's.clk']]));
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      render(rack, 0.02);
      const d = rack.status().display.s;
      if (d !== undefined) seen.add(d);
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  test('the sequencer runs sixteen steps, the lower bank in turn', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['c', 'clock', { bpm: 240 }], ['s', 'seq', { s12: -7 }]], [['c.s', 's.clk']]));
    const seen = new Set<number>();
    let low = 0;
    for (let i = 0; i < 70; i++) {
      render(rack, 0.02);
      const d = rack.status().display.s;
      if (d !== undefined) seen.add(d);
      // step 13 plays its own pitch
      if (d === 12) low = Math.min(low, (rack as unknown as { mods: Map<string, { outs: Record<string, { buf: Float32Array }> }> }).mods.get('s')!.outs.voct.buf[0]);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i));
    expect(low).toBeCloseTo(-7 / 12, 6);
  });

  test('quantizer snaps to the scale', () => {
    const rack = new Rack(SR);
    // offset 1 V/12 = one semitone above C → C♯, not in C major: snaps to C or D
    rack.setPatch(patch([['u', 'util', { a1: 0, o1: 1 / 12 + 0.01 }], ['q', 'quant', { root: 0, scale: 1 }]], [['u.out1', 'q.in']]));
    render(rack, 0.01);
    const note = rack.status().display.q;
    expect([60, 62]).toContain(note);
  });

  test('a feedback loop renders without blowing up', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['v', 'vco'], ['f', 'vcf', { res: 1 }], ['o', 'out']], [['v.saw', 'f.in'], ['f.bp', 'v.fm'], ['f.lp', 'o.l']]));
    const { L } = render(rack, 1);
    expect(finite(L)).toBe(true);
  });

  test('re-patching keeps module state (no reset of a sounding voice)', () => {
    const rack = new Rack(SR);
    const p = RACK_PRESETS[0].patch;
    rack.setPatch(p);
    rack.noteOn(60, 100);
    render(rack, 0.2);
    rack.setPatch(structuredClone(p));
    expect(peak(render(rack, 0.05).L)).toBeGreaterThan(0.1);
  });
});

/** Fundamental by autocorrelation (works on bright, harmonic-rich sounds). */
function pitchAc(b: Float32Array): number {
  const N = Math.min(b.length, 8192);
  let best = 0;
  let lag = 0;
  for (let l = Math.floor(SR / 2000); l < SR / 50; l++) {
    let s = 0;
    for (let i = 0; i + l < N; i++) s += b[i] * b[i + l];
    if (s > best) {
      best = s;
      lag = l;
    }
  }
  return SR / lag;
}

describe('second shelf', () => {
  const pitchPatch = (type: string, port: string, params: Record<string, number> = {}) => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['m', 'midi', { voices: 0 }], ['x', type, params], ['o', 'out', { level: 0.3 }]], [['m.voct', 'x.voct'], ['m.trig', `x.trig`], [`x.${port}`, 'o.l']].filter(([, to]) => MODULES[type as 'wt'].ins.some((i) => `x.${i.id}` === to) || to === 'o.l') as [string, string][]));
    return rack;
  };

  test('WT, FM OP (ratio 1, no index) and STRING play in tune: A4 = 440 Hz', () => {
    for (const [type, port, params] of [['wt', 'out', { table: 0 }], ['fmop', 'out', { index: 0 }], ['string', 'out', { decay: 6, tone: 1 }]] as const) {
      const rack = pitchPatch(type, port, params);
      rack.noteOn(69, 100);
      render(rack, 0.1);
      const f = pitchAc(render(rack, 0.3).L);
      expect({ type, f: Math.round(f / 4) * 4 }).toEqual({ type, f: 440 });
    }
  });

  test('drums sound on a clock and are silent without one', () => {
    for (const type of ['kick', 'snare', 'hats']) {
      const rack = new Rack(SR);
      rack.setPatch(patch([['x', type], ['o', 'out']], [['x.out', 'o.l']]));
      expect(peak(render(rack, 0.2).L)).toBe(0);
      rack.setPatch(patch([['c', 'clock', { bpm: 240 }], ['x', type], ['o', 'out']], [['c.q', 'x.trig'], ['x.out', 'o.l']]));
      expect(peak(render(rack, 0.3).L)).toBeGreaterThan(0.05);
    }
  });

  test('euclidean patterns', () => {
    const str = (p: boolean[]) => p.map((x) => (x ? 'x' : '.')).join('');
    expect(str(euclid(8, 3, 0))).toBe('x..x..x.');
    expect(str(euclid(16, 4, 0))).toBe('x...x...x...x...');
    expect(str(euclid(8, 3, 1))).toBe('.x..x..x');
    expect(euclid(5, 9, 0).every(Boolean)).toBe(true);
  });

  test('chords: qualities, inversions, voicings and diatonic chords in a key', () => {
    expect(buildChord(2, 4, 0, 0, 0)).toEqual({ tones: [2, 5, 9, 12], root: 2, name: 'Dm7' });
    expect(buildChord(0, 0, 0, 1, 0).tones).toEqual([4, 7, 12]);
    expect(buildChord(0, 3, 0, 0, 1).tones).toEqual([-5, 0, 4, 11]); // drop 2: G goes down
    // in C: D → Dm7, G → G7, B → Bm7♭5, a black key snaps down
    expect(buildChord(2, 16, 0, 0, 0).name).toBe('Dm7');
    expect(buildChord(7, 16, 0, 0, 0).name).toBe('G7');
    expect(buildChord(11, 16, 0, 0, 0).name).toBe('Bm7♭5');
    expect(buildChord(11, 15, 0, 0, 0).name).toBe('B°');
    expect(buildChord(1, 15, 0, 0, 0).name).toBe('C');
    // in E♭, F is the ii
    expect(buildChord(5, 16, 3, 0, 0).name).toBe('Fm7');
  });

  test('CHORD turns one note into a poly cable of chord tones', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['m', 'midi', { voices: 0 }], ['k', 'chord', { type: 3 }], ['v', 'vco'], ['o', 'out', { level: 0.3 }]], [['m.voct', 'k.voct'], ['k.voct', 'v.voct'], ['v.sin', 'o.l']]));
    rack.noteOn(60, 100);
    render(rack, 0.05);
    expect(rack.status().display.k).toBe(60);
    // four sines (C E G B) are louder than one
    expect(peak(render(rack, 0.2).L)).toBeGreaterThan(0.3);
  });

  test('clock divider: ÷4 fires on every 4th pulse', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['c', 'clock', { bpm: 300 }], ['d', 'div'], ['s', 'seq', { len: 8 }]], [['c.q', 'd.clk'], ['d.d4', 's.clk']]));
    render(rack, 1.7); // 9 clock pulses → the sequencer has moved on pulses 1, 5 and 9
    expect(rack.status().display.s).toBe(2);
  });

  test('a locked Turing machine (change 0) repeats its loop', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['c', 'clock', { bpm: 300 }], ['t', 'turing', { change: 0, length: 4 }]], [['c.q', 't.clk']]));
    const seen: number[] = [];
    for (let i = 0; i < 12; i++) {
      render(rack, 0.2);
      seen.push(rack.status().display.t ?? -1);
    }
    // every 4 steps the low 4 bits come round again
    expect(seen.slice(4).map((x) => x & 15)).toEqual(seen.slice(0, 8).map((x) => x & 15));
  });

  test('a fresh Turing machine always has a note in its loop, whatever the Length', () => {
    try {
      for (let seed = 1; seed <= 200; seed++) {
        seedRand(seed);
        for (const length of [2, 5, 8]) {
          const rack = new Rack(SR);
          rack.setPatch(patch([['c', 'clock', { bpm: 300 }], ['t', 'turing', { change: 0, length }]], [['c.q', 't.clk']]));
          render(rack, 0.01);
          expect((rack.status().display.t ?? 0) & ((1 << length) - 1), `seed ${seed}, length ${length}`).not.toBe(0);
        }
      }
    } finally {
      seedRand(null);
    }
  });

  test('ARP steps through held notes', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['m', 'midi', { voices: 2 }], ['a', 'arp', { rate: 10 }], ['v', 'vco'], ['o', 'out', { level: 0.3 }]], [['m.voct', 'a.voct'], ['m.gate', 'a.gate'], ['a.voct', 'v.voct'], ['v.sin', 'o.l']]));
    rack.noteOn(57, 100);
    rack.noteOn(69, 100);
    const pitches = new Set<number>();
    for (let i = 0; i < 6; i++) pitches.add(Math.round(pitchOf(render(rack, 0.1).L) / 20) * 20);
    expect(pitches.size).toBeGreaterThanOrEqual(2);
  });

  test('SCOPE reports the wave it sees', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['v', 'vco'], ['s', 'scope']], [['v.sin', 's.a']]));
    render(rack, 0.1);
    const sc = rack.status().views.s;
    if (sc.k !== 'scope') throw new Error(sc.k);
    expect(sc.a.length).toBe(120);
    expect(Math.max(...sc.a)).toBeGreaterThan(4);
    expect(sc.b).toBeNull();
  });
});

/** The view of display module `id`, checked to be of kind K. */
function view<K extends RackView['k']>(rack: Rack, id: string, k: K): Extract<RackView, { k: K }> {
  const v = rack.status().views[id];
  if (!v || v.k !== k) throw new Error(`${id}: ${v?.k}`);
  return v as Extract<RackView, { k: K }>;
}
const sine = (hz: number, n = 4096, sr = SR) => Float64Array.from({ length: n }, (_, i) => 3 * Math.sin((2 * Math.PI * hz * i) / sr));

describe('display modules', () => {
  test('pitch detection finds the fundamental of sines and a saw, and nothing in noise or silence', () => {
    for (const hz of [41.2, 110, 261.63, 440, 1046.5]) expect(Math.abs(detectPitch(sine(hz), SR) / hz - 1)).toBeLessThan(0.003);
    const saw = Float64Array.from({ length: 4096 }, (_, i) => 4 * (((i * 196) / SR) % 1) - 2);
    expect(Math.abs(detectPitch(saw, SR) / 196 - 1)).toBeLessThan(0.003);
    expect(detectPitch(new Float64Array(4096), SR)).toBe(0);
    let seed = 1;
    const noise = Float64Array.from({ length: 4096 }, () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 4 - 2);
    expect(detectPitch(noise, SR)).toBe(0);
  });

  test('SPECTRUM: a saw shows its harmonics and names its fundamental; a sine has one partial', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['v', 'vco', { oct: -1 }], ['s', 'spectrum', { smooth: 0 }]], [['v.saw', 's.a']]));
    render(rack, 0.4);
    const sp = view(rack, 's', 'spectrum');
    const f0 = 261.6256 / 2;
    expect(Math.abs(sp.f0 / f0 - 1)).toBeLessThan(0.005);
    expect(Math.abs(sp.peak / f0 - 1)).toBeLessThan(0.02);
    expect(sp.a!.length).toBe(SPECTRUM_POINTS);
    expect(sp.b).toBeNull();
    const at = (hz: number) => sp.a![Math.round((Math.log(hz / 20) / Math.log(1000)) * (SPECTRUM_POINTS - 1))];
    // a saw's nth harmonic is 1/n as loud: the 4th about 12 dB down, and well above the floor
    expect(at(f0) - at(f0 * 4)).toBeGreaterThan(8);
    expect(at(f0 * 4)).toBeGreaterThan(-30);

    rack.setPatch(patch([['v', 'vco', { oct: -1 }], ['s', 'spectrum', { smooth: 0 }]], [['v.sin', 's.a']]));
    render(rack, 0.4);
    const pure = view(rack, 's', 'spectrum');
    const near = (hz: number) => pure.a![Math.round((Math.log(hz / 20) / Math.log(1000)) * (SPECTRUM_POINTS - 1))];
    expect(near(f0)).toBeGreaterThan(-3);
    expect(near(f0 * 3)).toBeLessThan(-50);
    expect(spectrumHz(SPECTRUM_POINTS - 1)).toBeCloseTo(20000, 3);
  });

  test('SONO scrolls at its Time setting and lights the row of the note', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['v', 'vco'], ['s', 'sono', { time: 6 }]], [['v.sin', 's.in']]));
    render(rack, 0.5);
    view(rack, 's', 'sono');
    // the panel asks 20 times a second: 160 columns over 6 s is about 27 a second
    const cols: number[][] = [];
    for (let i = 0; i < 20; i++) {
      render(rack, 0.05);
      cols.push(...view(rack, 's', 'sono').cols);
    }
    expect(cols.length).toBeGreaterThanOrEqual(25);
    expect(cols.length).toBeLessThanOrEqual(28);
    const last = cols[cols.length - 1];
    expect(last.length).toBe(SONO_ROWS);
    const row = Math.round((Math.log(261.6256 / 30) / Math.log(16000 / 30)) * (SONO_ROWS - 1));
    const brightest = last.indexOf(Math.max(...last));
    expect(Math.abs(brightest - row)).toBeLessThanOrEqual(1);
  });

  test('XY reads both pitches: an FM OP at ×1.5 is a 3:2 fifth', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['f', 'fmop', { ratio: 2, index: 0 }], ['x', 'xy']], [['f.out', 'x.x'], ['f.mod', 'x.y']]));
    render(rack, 0.3);
    const xy = view(rack, 'x', 'xy');
    expect(xy.x.length).toBe(400);
    expect(Math.abs(xy.fy / xy.fx - 1.5)).toBeLessThan(0.002);
  });

  test('TUNER names what it hears and tracks it as V/Oct; reads a V/Oct cable directly', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['v', 'vco', { tune: 9 }], ['t', 'tuner'], ['o', 'out']], [['v.saw', 't.in'], ['t.voct', 'o.l']]));
    render(rack, 0.3);
    const t = view(rack, 't', 'tuner');
    expect(t.from).toBe('audio');
    expect(Math.abs(t.note - 69)).toBeLessThan(0.05);
    expect(Math.abs(t.hz - 440)).toBeLessThan(1);

    rack.setPatch(patch([['u', 'util', { a1: 0, o1: 7 / 12 }], ['t', 'tuner', { ref: 415.3 }]], [['u.out1', 't.voct']]));
    render(rack, 0.05);
    const cv = view(rack, 't', 'tuner');
    expect(cv.from).toBe('cv');
    // G4 at A440 is A♭4 when A = 415.3
    expect(Math.abs(cv.note - 68)).toBeLessThan(0.01);
  });

  test('KEYS shows every voice of a chord; ROLL writes down a sequence', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['m', 'midi', { voices: 0 }], ['c', 'chord', { key: 0, type: 16 }], ['k', 'keys']], [['m.voct', 'c.voct'], ['c.voct', 'k.voct'], ['m.gate', 'k.gate']]));
    render(rack, 0.05);
    view(rack, 'k', 'keys');
    rack.noteOn(62, 100);
    render(rack, 0.05);
    const keys = view(rack, 'k', 'keys');
    expect(new Set(keys.notes.map((n) => n % 12))).toEqual(new Set([2, 5, 9, 0]));
    rack.noteOff(62);
    render(rack, 0.05);
    view(rack, 'k', 'keys');
    expect(view(rack, 'k', 'keys').notes).toEqual([]);

    rack.setPatch(patch([['c', 'clock', { bpm: 120 }], ['s', 'seq', { s0: 0, s1: 2, s2: 4, s3: 5, len: 4 }], ['r', 'roll', { time: 4 }]], [['c.q', 's.clk'], ['s.voct', 'r.voct'], ['s.gate', 'r.gate']]));
    render(rack, 2.2);
    const roll = view(rack, 'r', 'roll');
    const notes = [];
    for (let i = 0; i < roll.notes.length; i += 3) notes.push(roll.notes[i]);
    expect(new Set(notes)).toEqual(new Set([60, 62, 64, 65]));
    for (let i = 0; i < roll.notes.length; i += 3) expect(roll.notes[i + 1]).toBeGreaterThanOrEqual(roll.notes[i + 2]);
  });

  test('VOLTS reads a steady voltage and the swing of an LFO', () => {
    const rack = new Rack(SR);
    rack.setPatch(patch([['u', 'util', { a1: 0, o1: 2.5 }], ['l', 'lfo', { rate: 5 }], ['v', 'volts']], [['u.out1', 'v.in1'], ['l.sin', 'v.in2']]));
    render(rack, 0.5);
    const v = view(rack, 'v', 'volts');
    expect(v.on).toEqual([true, true, false, false]);
    expect(v.v[0]).toBeCloseTo(2.5, 2);
    expect(v.lo[1]).toBeLessThan(-4.5);
    expect(v.hi[1]).toBeGreaterThan(4.5);

    // a poly cable: the meter follows the newest note, whichever voice it landed on
    rack.setPatch(patch([['m', 'midi', { voices: 4 }], ['v', 'volts']], [['m.voct', 'v.in1'], ['m.gate', 'v.in2']]));
    for (const note of [60, 64, 72]) {
      rack.noteOn(note, 100);
      render(rack, 0.05);
    }
    const poly = view(rack, 'v', 'volts');
    expect(poly.v[0]).toBeCloseTo(1, 2);
    expect(poly.v[1]).toBeCloseTo(10, 1);
  });
});

describe('granular looper', () => {
  const C5 = 523.2511;
  const C3 = 130.8128;
  /** A VCO's sine (C4) through ATT/OFS (so it can be muted) into the looper, the looper into OUT. */
  function cosm(params: Record<string, number>, extra: [string, string, Record<string, number>?][] = [], wires: [string, string][] = []): Rack {
    const rack = new Rack(SR);
    rack.setPatch(patch(
      [['v', 'vco'], ['u', 'util', { a1: 1 }], ['c', 'cosm', { mix: 1, space: 0, ...params }], ['o', 'out', { level: 0.25 }], ...extra],
      [['v.sin', 'u.in1'], ['u.out1', 'c.l'], ['c.l', 'o.l'], ['c.r', 'o.r'], ...wires],
    ));
    return rack;
  }
  const pitchAt = (b: Float32Array, at: number) => detectPitch(Float64Array.from(b.subarray(Math.round(at * SR), Math.round(at * SR) + 4096)), SR);
  const rmsOf = (b: Float32Array, from: number, to: number) => {
    let s = 0;
    for (let i = Math.round(from * SR); i < Math.round(to * SR); i++) s += b[i] * b[i];
    return Math.sqrt(s / (Math.round(to * SR) - Math.round(from * SR)));
  };
  let seq = 0;
  const press = (rack: Rack, cmd: number) => rack.setParam('c', 'lcmd', ++seq * 8 + cmd);

  test('Mosaic: C loops an octave up, B adds an octave down', () => {
    // (the first slices reach back to before the sound began, so listen once they have moved on)
    const up = render(cosm({ fx: 0, var: 2, act: 0.4 }), 4.5).L;
    for (const t of [3.1, 3.5, 3.9]) expect(Math.abs(pitchAt(up, t) / C5 - 1)).toBeLessThan(0.01);
    // two samplers: normal and half speed, so the sound's fundamental drops an octave
    const down = render(cosm({ fx: 0, var: 1, act: 0.2 }), 4.5).L;
    for (const t of [3.1, 3.9]) expect(Math.abs(pitchAt(down, t) / C3 - 1)).toBeLessThan(0.01);
  });

  test('Glide C sweeps between the note and its octave', () => {
    const { L } = render(cosm({ fx: 2, var: 2, act: 0.6, shape: 0.6 }), 4);
    const seen = [1, 1.4, 1.8, 2.2, 2.6, 3, 3.4].map((t) => pitchAt(L, t)).filter((hz) => hz > 0);
    expect(seen.length).toBeGreaterThan(4);
    for (const hz of seen) expect(hz).toBeGreaterThan(250), expect(hz).toBeLessThan(540);
    expect(Math.max(...seen) - Math.min(...seen)).toBeGreaterThan(100);
  });

  test('Warp C: one tap, an octave up', () => {
    const { L } = render(cosm({ fx: 10, var: 2, act: 0, rep: 0, time: 120 }), 2);
    expect(Math.abs(pitchAt(L, 1.2) / C5 - 1)).toBeLessThan(0.01);
  });

  test('Pattern A echoes once per unit, on the beat', () => {
    // a 20 ms blip at the start, one tap, no feedback, 120 bpm quarters: one echo at 0.5 s
    const rack = new Rack(SR);
    rack.setPatch(patch(
      [['m', 'midi', { voices: 0 }], ['v', 'vco'], ['e', 'adsr', { a: 0.001, d: 0.02, s: 0, r: 0.005 }], ['a', 'vca'], ['c', 'cosm', { fx: 9, var: 0, act: 0, rep: 0, mix: 1, space: 0, time: 120 }], ['o', 'out', { level: 0.25 }]],
      [['v.sin', 'a.in'], ['m.gate', 'e.gate'], ['e.env', 'a.cv'], ['a.out', 'c.l'], ['c.l', 'o.l']],
    ));
    rack.noteOn(60, 100);
    render(rack, 0.03);
    rack.noteOff(60);
    const { L } = render(rack, 1.2);
    expect(rmsOf(L, 0.47, 0.53)).toBeGreaterThan(rmsOf(L, 0.2, 0.4) * 20);
    expect(rmsOf(L, 0.9, 1.1)).toBeLessThan(rmsOf(L, 0.47, 0.53) * 0.05);
  });

  test('Interrupt with Repeats down passes the sound through untouched', () => {
    const wet = render(cosm({ fx: 7, rep: 0 }), 1).L;
    const dry = render(cosm({ mix: 0 }), 1).L;
    expect(Math.abs(rmsOf(wet, 0.5, 1) / rmsOf(dry, 0.5, 1) - 1)).toBeLessThan(0.05);
  });

  test('looper: record, close, play on after the input stops, erase', () => {
    const rack = cosm({ mix: 0 });
    render(rack, 0.1);
    press(rack, 1);
    render(rack, 1.05);
    expect(view(rack, 'c', 'cosm').loop).toBe(1);
    press(rack, 1);
    render(rack, 0.01);
    const v = view(rack, 'c', 'cosm');
    expect(v.loop).toBe(2);
    expect(v.len).toBeCloseTo(1.05, 1);
    rack.setParam('u', 'a1', 0);
    const { L } = render(rack, 1.5);
    expect(Math.abs(pitchAt(L, 0.5) / 261.6256 - 1)).toBeLessThan(0.01);
    expect(rmsOf(L, 0.2, 1.2)).toBeGreaterThan(0.1);
    press(rack, 3);
    expect(rmsOf(render(rack, 0.3).L, 0.05, 0.3)).toBe(0);
    expect(view(rack, 'c', 'cosm').loop).toBe(0);
  });

  test('looper Quantize with a clock in rounds to whole beats, and the Loop jack steps it', () => {
    const rack = cosm({ mix: 0, quant: 1 }, [['k', 'clock', { bpm: 120 }]], [['k.q', 'c.clock']]);
    render(rack, 0.6);
    press(rack, 1);
    render(rack, 0.9);
    press(rack, 1);
    // 0.9 s rounds up to two beats: it records on to 1 s, then plays
    render(rack, 0.05);
    expect(view(rack, 'c', 'cosm').loop).toBe(1);
    render(rack, 0.1);
    const v = view(rack, 'c', 'cosm');
    expect(v.loop).toBe(2);
    expect(v.len).toBeCloseTo(1, 3);
    expect(v.bpm).toBeCloseTo(120, 0);

    // one trigger a bar on Loop: record, play, overdub
    const jack = cosm({ mix: 0 }, [['k', 'clock', { bpm: 110 }]], [['k.bar', 'c.loop']]);
    render(jack, 0.1);
    expect(view(jack, 'c', 'cosm').loop).toBe(1);
    render(jack, 2.2);
    const w = view(jack, 'c', 'cosm');
    expect(w.loop).toBe(2);
    expect(w.len).toBeCloseTo((4 * 60) / 110, 1);
    render(jack, 2.2);
    expect(view(jack, 'c', 'cosm').loop).toBe(3);
  });

  test('a clock sets the tempo whichever output it comes from', () => {
    for (const out of ['q', 's', 'bar']) {
      const rack = cosm({}, [['k', 'clock', { bpm: 110 }]], [[`k.${out}`, 'c.clock']]);
      render(rack, 5);
      expect(view(rack, 'c', 'cosm').bpm).toBeCloseTo(110, 0);
    }
  });

  test('Freeze keeps the effect going on what it last heard', () => {
    const rack = cosm({ fx: 3, var: 1, act: 0.8, rep: 0 });
    render(rack, 1.5);
    rack.setParam('c', 'freeze', 1);
    rack.setParam('u', 'a1', 0);
    const held = render(rack, 2).L;
    expect(rmsOf(held, 1, 2)).toBeGreaterThan(0.05);
    // overlapping grains of a sine wobble its pitch a little either way, so take the middle of many readings
    const seen = Array.from({ length: 17 }, (_, k) => pitchAt(held, 0.2 + k * 0.1)).sort((a, b) => a - b);
    expect(Math.abs(seen[8] / 261.6256 - 1)).toBeLessThan(0.02);
    rack.setParam('c', 'freeze', 0);
    expect(rmsOf(render(rack, 1).L, 0.6, 1)).toBeLessThan(0.001);
  });

  test('Space: a bigger room rings longer', () => {
    const tail = (verb: number) => {
      const rack = cosm({ lonly: 1, space: 1, verb });
      render(rack, 0.5);
      rack.setParam('u', 'a1', 0);
      return rmsOf(render(rack, 2).L, 1, 1.5);
    };
    const small = tail(0);
    const huge = tail(3);
    expect(huge).toBeGreaterThan(0.01);
    expect(huge).toBeGreaterThan(small * 20);
  });

  /** Level of one frequency over a stretch (Goertzel), as an amplitude. */
  const tone = (b: Float32Array, from: number, to: number, hz: number) => {
    const a = Math.round(from * SR), z = Math.round(to * SR);
    const c = 2 * Math.cos((2 * Math.PI * hz) / SR);
    let s1 = 0, s2 = 0;
    for (let i = a; i < z; i++) {
      const s0 = b[i] + c * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    return (2 * Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - c * s1 * s2))) / (z - a);
  };
  /** Record `secs` of the input into the looper, close it, and mute the input. */
  const recorded = (rack: Rack, secs: number) => {
    render(rack, 0.2);
    press(rack, CMD_REC);
    render(rack, secs);
    press(rack, CMD_REC);
    rack.setParam('u', 'a1', 0);
  };

  test('Subdiv: the pedal’s units against the beat, from two beats to a sixteenth of one', () => {
    // one Pattern tap, no feedback, 120 bpm: its echo of a blip comes one unit on
    const echo = (sub: number) => {
      const rack = new Rack(SR);
      rack.setPatch(patch(
        [['m', 'midi', { voices: 0 }], ['v', 'vco'], ['e', 'adsr', { a: 0.001, d: 0.02, s: 0, r: 0.005 }], ['a', 'vca'], ['c', 'cosm', { fx: 9, act: 0, rep: 0, mix: 1, space: 0, time: 120, sub }], ['o', 'out', { level: 0.25 }]],
        [['v.sin', 'a.in'], ['m.gate', 'e.gate'], ['e.env', 'a.cv'], ['a.out', 'c.l'], ['c.l', 'o.l']],
      ));
      rack.noteOn(60, 100);
      const { L } = render(rack, 1.3);
      rack.noteOff(60);
      let best = 0, at = 0;
      for (let t = 0.03; t < 1.25; t += 0.0025) {
        const v = rmsOf(L, t, t + 0.01);
        if (v > best) {
          best = v;
          at = t;
        }
      }
      return at;
    };
    for (const [sub, unit] of [[1, 1], [2, 0.5], [3, 0.25], [4, 0.125], [5, 0.0625]]) expect(Math.abs(echo(sub) - unit)).toBeLessThan(0.015);
  });

  test('Shape: the pedal’s four zones contour each loop — square, ramp up, triangle, ramp down', () => {
    // one Mosaic sampler looping a steady tone, a pass a second
    const contour = (shape: number) => {
      const { L } = render(cosm({ fx: 0, var: 0, act: 0, rep: 0, time: 60, shape }), 3);
      return [0.12, 0.5, 0.88].map((f) => rmsOf(L, 2 + f - 0.05, 2 + f + 0.05));
    };
    const [sq, up, tri, down] = [0.1, 0.35, 0.6, 0.9].map(contour);
    expect(sq[0] / sq[2]).toBeGreaterThan(0.9);
    expect(sq[0] / sq[2]).toBeLessThan(1.1);
    expect(up[2]).toBeGreaterThan(up[0] * 5);
    expect(tri[1]).toBeGreaterThan(tri[0] * 2);
    expect(tri[1]).toBeGreaterThan(tri[2] * 2);
    expect(down[0]).toBeGreaterThan(down[2] * 5);
  });

  test('Repeats: how long the effect goes on once you stop playing', () => {
    const after = (rep: number) => {
      const rack = cosm({ fx: 0, var: 0, act: 0.4, rep, time: 120 });
      const playing = rmsOf(render(rack, 2).L, 1, 2);
      rack.setParam('u', 'a1', 0);
      const { L } = render(rack, 8);
      return [0.5, 2, 7].map((t) => rmsOf(L, t, t + 1) / playing);
    };
    const low = after(0), mid = after(0.5), full = after(1);
    // down, it stops with you; at noon it fades over a couple of seconds; fully up it goes on for good
    expect(low[1]).toBeLessThan(0.01);
    expect(mid[0]).toBeGreaterThan(0.05);
    expect(mid[2]).toBeLessThan(0.005);
    expect(full[2]).toBeGreaterThan(0.3);
  });

  test('Warp’s repeats die away: B’s band-pass does not run away, C’s shift does not climb out of hearing', () => {
    const hf = (b: Float32Array, from: number, to: number) => {
      // energy above ~8 kHz (two one-pole high-passes) over all of it
      const a = Math.exp((-2 * Math.PI * 8000) / SR);
      let e = 0, h = 0, l1 = 0, l2 = 0;
      for (let i = Math.round(from * SR); i < Math.round(to * SR); i++) {
        const x = b[i];
        l1 = l1 * a + x * (1 - a);
        l2 = l2 * a + (x - l1) * (1 - a);
        e += x * x;
        h += (x - l1 - l2) ** 2;
      }
      return h / e;
    };
    for (const [act, rep] of [[0, 0.9], [0, 0.6], [0.5, 0.9]]) {
      const rack = cosm({ fx: 10, var: 1, act, rep, time: 120 });
      const playing = rmsOf(render(rack, 2).L, 1, 2);
      rack.setParam('u', 'a1', 0);
      const { L } = render(rack, 14);
      expect(rmsOf(L, 13, 14)).toBeLessThan(playing * 0.5);
      expect(rmsOf(L, 13, 14)).toBeLessThan(rmsOf(L, 0, 1));
    }
    // C, five taps (the fed-back one two octaves up): the tail keeps the note's own harmonics
    const rack = cosm({ fx: 10, var: 2, act: 0.6, rep: 0.8, time: 120 }, [['f', 'vcf', { cutoff: 3000, res: 0 }]], [['v.saw', 'f.in'], ['f.lp', 'u.in1']]);
    render(rack, 3);
    rack.setParam('u', 'a1', 0);
    const { L } = render(rack, 6);
    expect(hf(L, 2, 6)).toBeLessThan(0.005);
  });

  test('bit-crushing follows the slice’s own level: quiet playing is not crushed to nothing', () => {
    // a plucked C4 four times a second into Blocks A (clean) and D (crushed), at full level and a tenth of it
    const level = (gain: number, v = 3) => {
      const rack = new Rack(SR);
      rack.setPatch(patch(
        [['v', 'vco'], ['l', 'lfo', { rate: 4 }], ['e', 'adsr', { a: 0.002, d: 0.15, s: 0.4, r: 0.05 }], ['a', 'vca', { level: gain }], ['c', 'cosm', { fx: 6, var: v, act: 0, rep: 1, mix: 1, space: 0, time: 120 }], ['o', 'out', { level: 0.25 }]],
        [['v.sin', 'a.in'], ['l.sqr', 'e.gate'], ['e.env', 'a.cv'], ['a.out', 'c.l'], ['c.l', 'o.l']],
      ));
      const { L } = render(rack, 6);
      return rmsOf(L, 1, 6);
    };
    const loud = level(1), quiet = level(0.1);
    expect(loud).toBeGreaterThan(0.01);
    // every pluck is heard either way, and a crusher with fixed steps would round most of the quiet slices to silence
    expect(quiet / loud).toBeGreaterThan(0.09);
    expect(quiet / loud).toBeLessThan(0.11);
    expect(Math.abs(quiet / level(0.1, 0) - 1)).toBeLessThan(0.1);
  });

  test('Hold loops one unit of what was played into the effect, which hears nothing new', () => {
    const rack = cosm({ fx: 0, var: 0, act: 0, rep: 0.5, time: 120 });
    const before = rmsOf(render(rack, 1.5).L, 1, 1.5);
    rack.setParam('c', 'freeze', 1);
    rack.setParam('v', 'tune', 7);
    const { L } = render(rack, 4);
    // still C4 from the held loop, not the G4 now coming in, at full level all the while
    const seen = [0.6, 1.1, 1.6, 2.1, 2.6, 3.1, 3.6].map((t) => pitchAt(L, t)).sort((a, b) => a - b);
    expect(Math.abs(seen[3] / 261.6256 - 1)).toBeLessThan(0.015);
    expect(rmsOf(L, 3, 4)).toBeGreaterThan(before * 0.5);
  });

  test('pitch modulation: from still to a wobble of about a semitone either way', () => {
    const { L } = render(cosm({ lonly: 1, mdep: 1, mrate: 0.5 }), 4);
    const seen = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3].map((t) => pitchAt(L, t));
    expect(Math.max(...seen) / Math.min(...seen)).toBeGreaterThan(1.07);
    expect(Math.max(...seen) / Math.min(...seen)).toBeLessThan(1.16);
    const still = render(cosm({ lonly: 1 }), 2).L;
    expect(Math.abs(pitchAt(still, 1.5) / 261.6256 - 1)).toBeLessThan(0.003);
  });

  test('Filter closes the effect to nothing; Mix and FX vol set it against the dry sound', () => {
    const level = (params: Record<string, number>, a1 = 1) => {
      const rack = cosm({ lonly: 1, ...params });
      rack.setParam('u', 'a1', a1);
      return rmsOf(render(rack, 1).L, 0.5, 1);
    };
    expect(level({ filter: 20 })).toBeLessThan(level({}) * 0.001);
    expect(level({ filter: 100 })).toBeLessThan(level({ filter: 2000 }) * 0.3);
    expect(level({ vol: 0 })).toBeLessThan(1e-6);
    expect(level({ vol: 1.5 }, 0.1) / level({ vol: 1 }, 0.1)).toBeCloseTo(1.5, 1);
    // Mosaic C is an octave up: dry only at Mix down, effect only fully up
    const pitch = (mix: number) => pitchAt(render(cosm({ fx: 0, var: 2, act: 0, rep: 0, mix }), 3).L, 2.5);
    expect(pitch(0) / 261.6256).toBeCloseTo(1, 2);
    expect(pitch(1) / C5).toBeCloseTo(1, 2);
  });

  test('Looper only mutes the effect; the dry sound goes on through the chain', () => {
    const { L } = render(cosm({ fx: 0, var: 2, act: 0, lonly: 1 }), 3);
    expect(pitchAt(L, 2.5) / 261.6256).toBeCloseTo(1, 2);
  });

  test('EXP moves the knob it is assigned to', () => {
    // +5 V on EXP pointed at Filter lifts it from 100 Hz to halfway up its travel
    const level = (exp: number) => rmsOf(render(cosm({ lonly: 1, filter: 100, exp }, [['k', 'util', { o2: 5 }]], [['k.out2', 'c.act']]), 1).L, 0.5, 1);
    expect(level(3)).toBeGreaterThan(level(0) * 3);
  });

  test('the tempo eases to a new setting', () => {
    const rack = cosm({ time: 100 });
    render(rack, 0.5);
    rack.setParam('c', 'time', 140);
    render(rack, 0.1);
    const mid = view(rack, 'c', 'cosm').bpm;
    expect(mid).toBeGreaterThan(101);
    expect(mid).toBeLessThan(139);
    render(rack, 3);
    expect(view(rack, 'c', 'cosm').bpm).toBeCloseTo(140, 0);
  });

  test('looper Speed: ½× an octave down, 2× an octave up', () => {
    const rack = cosm({ mix: 0 });
    recorded(rack, 1);
    rack.setParam('c', 'speed', 0.5);
    expect(pitchAt(render(rack, 0.5).L, 0.3) / C3).toBeCloseTo(1, 2);
    rack.setParam('c', 'speed', 2);
    expect(pitchAt(render(rack, 0.5).L, 0.3) / C5).toBeCloseTo(1, 2);
  });

  test('looper reverse, on while recording: the loop plays back from its end', () => {
    const rack = cosm({ mix: 0, lrev: 1 });
    render(rack, 0.2);
    press(rack, CMD_REC);
    render(rack, 0.5);
    rack.setParam('v', 'tune', 4);
    render(rack, 0.5);
    press(rack, CMD_REC);
    rack.setParam('u', 'a1', 0);
    const { L } = render(rack, 1);
    expect(pitchAt(L, 0.15) / 329.6276).toBeCloseTo(1, 2);
    expect(pitchAt(L, 0.65) / 261.6256).toBeCloseTo(1, 2);
  });

  test('looper: overdubs go on a layer of their own, and undo clears it', () => {
    const rack = cosm({ mix: 0 });
    render(rack, 0.2);
    press(rack, CMD_REC);
    render(rack, 1);
    press(rack, CMD_REC);
    render(rack, 0.01);
    // an octave up, overdubbed for a pass
    rack.setParam('v', 'tune', 12);
    press(rack, CMD_REC);
    render(rack, 1);
    press(rack, CMD_REC);
    rack.setParam('u', 'a1', 0);
    let { L } = render(rack, 1);
    expect(view(rack, 'c', 'cosm').dub).toBe(true);
    expect(tone(L, 0.2, 0.8, C5)).toBeGreaterThan(tone(L, 0.2, 0.8, 261.6256) * 0.5);
    press(rack, CMD_UNDO);
    ({ L } = render(rack, 1));
    expect(view(rack, 'c', 'cosm').dub).toBe(false);
    expect(tone(L, 0.2, 0.8, C5)).toBeLessThan(tone(L, 0.2, 0.8, 261.6256) * 0.02);
  });

  test('looper: ■ fades out over Fade, ● fades back in, and Fades picks which', () => {
    const rack = cosm({ mix: 0, fade: 1 });
    recorded(rack, 1);
    const full = rmsOf(render(rack, 1).L, 0, 1);
    press(rack, CMD_STOP);
    let { L } = render(rack, 1.5);
    expect(rmsOf(L, 0.4, 0.6) / full).toBeCloseTo(0.5, 1);
    expect(rmsOf(L, 1.1, 1.5)).toBeLessThan(full * 0.001);
    expect(view(rack, 'c', 'cosm').loop).toBe(LOOP_STOP);
    press(rack, CMD_REC);
    ({ L } = render(rack, 1.5));
    expect(rmsOf(L, 0.15, 0.35) / full).toBeCloseTo(0.25, 1);
    expect(rmsOf(L, 1.1, 1.5) / full).toBeCloseTo(1, 1);
    // Out only: playing starts at once
    rack.setParam('c', 'fades', 2);
    press(rack, CMD_STOP);
    render(rack, 1.5);
    press(rack, CMD_REC);
    ({ L } = render(rack, 0.5));
    expect(rmsOf(L, 0.05, 0.25) / full).toBeCloseTo(1, 1);
  });

  test('looper Burst: records while held, plays on release, and the next press records afresh', () => {
    const rack = cosm({ mix: 0, burst: 1 });
    render(rack, 0.2);
    press(rack, CMD_DOWN);
    render(rack, 0.6);
    expect(view(rack, 'c', 'cosm').loop).toBe(LOOP_REC);
    press(rack, CMD_UP);
    render(rack, 0.1);
    let v = view(rack, 'c', 'cosm');
    expect(v.loop).toBe(LOOP_PLAY);
    expect(v.len).toBeCloseTo(0.6, 1);
    press(rack, CMD_DOWN);
    render(rack, 0.3);
    v = view(rack, 'c', 'cosm');
    expect(v.loop).toBe(LOOP_REC);
    expect(v.len).toBeCloseTo(0.3, 1);
  });

  test('looper Quantize: recording starts the bar, and the loop rounds to the nearest beat', () => {
    const loopLen = (quant: number, secs: number) => {
      const rack = cosm({ mix: 0, time: 120, quant });
      render(rack, 0.83);
      press(rack, CMD_REC);
      render(rack, 0.01);
      expect(view(rack, 'c', 'cosm').beat).toBe(quant ? 0 : 1);
      render(rack, secs);
      press(rack, CMD_REC);
      render(rack, 0.6);
      return view(rack, 'c', 'cosm').len;
    };
    expect(loopLen(0, 1.12)).toBeCloseTo(1.13, 1);
    // two beats: trimmed back to them, or recorded on to them
    expect(loopLen(1, 1.12)).toBeCloseTo(1, 2);
    expect(loopLen(1, 0.88)).toBeCloseTo(1, 2);
  });

  test('every effect and variation stays finite, makes sound, and fits in the CPU', () => {
    const t0 = performance.now();
    for (let fx = 0; fx < 11; fx++) for (let v = 0; v < 4; v++) {
      const rev = (fx + v) & 1;
      const rack = cosm({ fx, var: v, rev, act: 0.8, rep: 0.6, mdep: 0.5, filter: 3000, res: 0.5, space: 0.4 });
      const { L, R } = render(rack, 2.5);
      expect({ fx, v, rev, ok: finite(L) && finite(R) && peak(L) < 6 && rmsOf(L, 1.5, 2.5) > 0.005 }).toEqual({ fx, v, rev, ok: true });
    }
    // 44 runs of 2.5 s: well under a fifth of real time
    expect(performance.now() - t0).toBeLessThan(44 * 2500 * 0.2);
  });
});

describe('two-channel micro-looper', () => {
  const C3 = 130.8128, C4 = 261.6256, C5 = 523.2511, G4 = 391.9954;
  /** A VCO's sine (C4) through ATT/OFS (so it can be muted) into MOOD (all MOOD, no dry), MOOD into OUT. */
  function mood(params: Record<string, number>, extra: [string, string, Record<string, number>?][] = [], wires: [string, string][] = []): Rack {
    const rack = new Rack(SR);
    rack.setPatch(patch(
      [['v', 'vco'], ['u', 'util', { a1: 1 }], ['d', 'mood', { mix: 1, ...params }], ['o', 'out', { level: 0.25 }], ...extra],
      [['v.sin', 'u.in1'], ['u.out1', 'd.l'], ['d.l', 'o.l'], ['d.r', 'o.r'], ...wires],
    ));
    return rack;
  }
  /** A 20 ms blip of C4 at the start into MOOD. */
  function blip(params: Record<string, number>): Rack {
    const rack = new Rack(SR);
    rack.setPatch(patch(
      [['m', 'midi', { voices: 0 }], ['v', 'vco'], ['e', 'adsr', { a: 0.001, d: 0.02, s: 0, r: 0.005 }], ['a', 'vca'], ['d', 'mood', { mix: 1, ...params }], ['o', 'out', { level: 0.25 }]],
      [['v.sin', 'a.in'], ['m.gate', 'e.gate'], ['e.env', 'a.cv'], ['a.out', 'd.l'], ['d.l', 'o.l']],
    ));
    rack.noteOn(60, 100);
    render(rack, 0.02);
    rack.noteOff(60);
    return rack;
  }
  const pitchAt = (b: Float32Array, at: number) => detectPitch(Float64Array.from(b.subarray(Math.round(at * SR), Math.round(at * SR) + 4096)), SR);
  const rmsOf = (b: Float32Array, from: number, to: number) => {
    let s = 0;
    for (let i = Math.round(from * SR); i < Math.round(to * SR); i++) s += b[i] * b[i];
    return Math.sqrt(s / (Math.round(to * SR) - Math.round(from * SR)));
  };
  /** The strongest frequency between 50 Hz and 1.2 kHz (Goertzel, 2 Hz then 0.1 Hz steps): grains of a sine fool autocorrelation */
  const peakHz = (b: Float32Array, from: number, to: number) => {
    const a = Math.round(from * SR), e = Math.round(to * SR);
    const mag = (f: number) => {
      const c = 2 * Math.cos((2 * Math.PI * f) / SR);
      let s1 = 0, s2 = 0;
      for (let i = a; i < e; i++) {
        const s0 = b[i] + c * s1 - s2;
        s2 = s1;
        s1 = s0;
      }
      return s1 * s1 + s2 * s2 - c * s1 * s2;
    };
    let best = 50, bm = 0;
    for (let f = 50; f <= 1200; f += 2) if (mag(f) > bm) (bm = mag(f)), (best = f);
    for (let f = best - 2; f <= best + 2; f += 0.1) if (mag(f) > bm) (bm = mag(f)), (best = f);
    return best;
  };
  /** How unevenly the level moves, frame to frame (5 ms): high for distinct echoes, low for a wash. */
  const unevenness = (b: Float32Array, from: number, to: number) => {
    const fr: number[] = [];
    for (let t = from; t < to; t += 0.005) fr.push(rmsOf(b, t, t + 0.005));
    const m = fr.reduce((x, y) => x + y) / fr.length;
    return Math.sqrt(fr.reduce((x, y) => x + (y - m) ** 2, 0) / fr.length) / m;
  };
  let seq = 0;
  const press = (rack: Rack, cmd: number) => rack.setParam('d', 'cmd', ++seq * 8 + cmd);
  const st = (rack: Rack) => view(rack, 'd', 'mood');
  /** Wet Channel off, listen to the sine until the ring is full, mute it, and loop what was heard. */
  function looped(params: Record<string, number>): Rack {
    const rack = mood(params);
    press(rack, M_WET);
    render(rack, 2.4);
    rack.setParam('u', 'a1', 0);
    press(rack, M_LOOP);
    render(rack, 0.001);
    return rack;
  }

  test('Clock moves in harmonized steps over five octaves, or glides with Smooth', () => {
    expect(moodRate(0)).toBe(2000);
    expect(moodRate(0.8)).toBe(32000);
    expect(moodRate(1)).toBe(64000);
    const ratios = [1, 5 / 4, 4 / 3, 3 / 2, 5 / 3];
    for (let v = 0; v <= 1; v += 0.013) {
      const r = moodRate(v) / 2000;
      const oct = Math.floor(Math.log2(r) + 1e-9);
      expect(ratios.some((q) => Math.abs(r / 2 ** oct / q - 1) < 1e-9)).toBe(true);
    }
    expect(moodRate(0.81, true)).toBeCloseTo(2000 * 2 ** 4.05, 3);
    expect(formatParam(MODULES.mood.params.find((p) => p.id === 'clock')!, 0.8)).toBe('32k');
  });

  test('Micro-Looper: loops what it heard; Tape plays it at octave speeds either way; Clock an octave down halves it', () => {
    const rack = looped({ lmode: 1, lmod: 0.7 });
    let v = st(rack);
    expect(v.loop).toBe(true);
    expect(v.len).toBeCloseTo(MOOD_RING / 32000, 3);
    const at = (lmod: number, clock = 0.8) => {
      rack.setParam('d', 'lmod', lmod);
      rack.setParam('d', 'clock', clock);
      return pitchAt(render(rack, 0.5).L, 0.3);
    };
    expect(Math.abs(at(0.7) / C4 - 1)).toBeLessThan(0.01);
    expect(Math.abs(at(6.5 / 8) / C5 - 1)).toBeLessThan(0.01);
    expect(Math.abs(at(4.5 / 8) / C3 - 1)).toBeLessThan(0.01);
    expect(Math.abs(at(2.5 / 8) / C4 - 1)).toBeLessThan(0.01);
    expect(Math.abs(at(0.7, 0.6) / C3 - 1)).toBeLessThan(0.01);
    v = st(rack);
    expect(v.rate).toBe(16000);
    expect(v.len).toBeCloseTo(MOOD_RING / 16000, 3);
  });

  test('until the ring has filled, the loop is only what it heard', () => {
    const rack = mood({});
    press(rack, M_WET);
    render(rack, 0.5);
    expect(st(rack).len).toBeCloseTo(0.5, 2);
    rack.setParam('u', 'a1', 0);
    press(rack, M_LOOP);
    const { L } = render(rack, 1);
    expect(rmsOf(L, 0.05, 0.45)).toBeGreaterThan(0.1);
    expect(rmsOf(L, 0.55, 0.95)).toBeGreaterThan(0.1);
  });

  test('Tape Length shortens the loop, Stretch keeps the pitch as it crawls and holds still at noon', () => {
    const rack = looped({ lmode: 2, lmod: 0.75, len: 1 });
    const { L } = render(rack, 1);
    expect(Math.abs(peakHz(L, 0.2, 0.9) / C4 - 1)).toBeLessThan(0.01);
    // a quarter of real speed: 32000 samples a second, a quarter of them, of a 65536-sample loop
    expect(st(rack).pos).toBeCloseTo(8000 / MOOD_RING, 2);
    rack.setParam('d', 'lmod', 0.5);
    const at = st(rack).pos;
    const held = render(rack, 1).L;
    expect(st(rack).pos).toBeCloseTo(at, 3);
    expect(rmsOf(held, 0.2, 1)).toBeGreaterThan(0.05);
    expect(Math.abs(peakHz(held, 0.2, 0.9) / C4 - 1)).toBeLessThan(0.01);
    // Tape: Length at 3/7 plays a sixteenth of the loop over and over
    rack.setParam('d', 'lmode', 1);
    rack.setParam('d', 'lmod', 0.7);
    rack.setParam('d', 'len', 3 / 7);
    let hi = 0;
    for (let i = 0; i < 20; i++) {
      render(rack, 0.05);
      hi = Math.max(hi, st(rack).pos);
    }
    expect(hi).toBeLessThan(1 / 16 + 0.002);
  });

  test('Env repeats the slice it is on while it hears the input, and moves on when it stops', () => {
    const rack = mood({ lmode: 0, lmod: 1, len: 0.3 });
    press(rack, M_WET);
    render(rack, 2.4);
    press(rack, M_LOOP);
    render(rack, 0.5);
    // a slice of 2^-6.3 of the loop, halved
    expect(st(rack).pos).toBeLessThan(0.007);
    expect(st(rack).det).toBe(true);
    // (the detector lets go once the level has fallen under the threshold, a few tenths of a second at full sensitivity)
    rack.setParam('u', 'a1', 0);
    render(rack, 0.4);
    expect(st(rack).det).toBe(false);
    const from = st(rack).pos;
    render(rack, 0.5);
    expect(st(rack).pos - from).toBeCloseTo(16000 / MOOD_RING, 2);
  });

  test('overdubs add the clean input; Fade wears the loop down as you dub; No dub replaces it', () => {
    // a loop of silence, then the sine overdubbed onto it
    const rack = mood({ lmode: 1, lmod: 0.7 });
    press(rack, M_WET);
    rack.setParam('u', 'a1', 0);
    render(rack, 2.4);
    press(rack, M_LOOP);
    expect(rmsOf(render(rack, 0.5).L, 0, 0.5)).toBe(0);
    rack.setParam('u', 'a1', 1);
    press(rack, M_LOOP_HOLD);
    render(rack, 2.2);
    expect(st(rack).dub).toBe(true);
    press(rack, M_LOOP_LET);
    rack.setParam('u', 'a1', 0);
    const dubbed = rmsOf(render(rack, 2.1).L, 0, 2);
    expect(dubbed).toBeGreaterThan(0.1);
    // Fade down: two passes of dubbing silence leave about 0.3² of it
    rack.setParam('d', 'fade', 0);
    press(rack, M_LOOP_HOLD);
    render(rack, 4.2);
    press(rack, M_LOOP_LET);
    const faded = rmsOf(render(rack, 2.1).L, 0, 2);
    expect(faded / dubbed).toBeGreaterThan(0.04);
    expect(faded / dubbed).toBeLessThan(0.2);
    // No dub: one pass replaces the loop with what comes in (silence)
    rack.setParam('d', 'nodub', 1);
    press(rack, M_LOOP_HOLD);
    render(rack, 2.2);
    press(rack, M_LOOP_LET);
    expect(rmsOf(render(rack, 2.1).L, 0, 2)).toBeLessThan(1e-4);
  });

  test('Delay echoes after Time, twice as late a Clock octave down, and Modify fully up keeps every repeat', () => {
    // (the blip went in 20 ms before what is measured)
    const d = delayTime(0.5) / 32000 - 0.02;
    const echo = (clock: number, at: number) => {
      const { L } = render(blip({ wet: 1, time: 0.5, wmod: 0, clock }), 1);
      return [rmsOf(L, at + 0.003, at + 0.017), rmsOf(L, at - 0.05, at - 0.005)];
    };
    const [on, before] = echo(0.8, d);
    expect(on).toBeGreaterThan(0.02);
    expect(on).toBeGreaterThan(before * 20);
    const [late, early] = echo(0.6, 2 * d + 0.02);
    expect(late).toBeGreaterThan(0.02);
    expect(late).toBeGreaterThan(early * 20);
    const { L } = render(blip({ wet: 1, time: 0.5, wmod: 1 }), 1);
    const e6 = 6 * (d + 0.02) - 0.02;
    expect(rmsOf(L, e6 + 0.003, e6 + 0.017) / rmsOf(L, d + 0.003, d + 0.017)).toBeGreaterThan(0.9);
  });

  test('Freeze holds the Wet Channel while the left switch is held, or with Latch until it is held again', () => {
    for (const latch of [0, 1]) {
      const rack = mood({ wet: 1, time: 0.3, wmod: 0, latch });
      render(rack, 0.5);
      press(rack, M_WET_HOLD);
      rack.setParam('u', 'a1', 0);
      const held = render(rack, 1).L;
      expect(st(rack).frz).toBe(true);
      expect(rmsOf(held, 0.5, 1)).toBeGreaterThan(0.1);
      press(rack, M_WET_LET);
      const after = render(rack, 0.6).L;
      if (latch) expect(rmsOf(after, 0.3, 0.6)).toBeGreaterThan(0.1);
      else expect(rmsOf(after, 0.3, 0.6)).toBeLessThan(1e-3);
    }
  });

  test('Reverb: Modify down is a pattern of distinct echoes, up a smooth wash; frozen it sustains', () => {
    const uneven = (wmod: number) => unevenness(render(blip({ wet: 0, time: 0.8, wmod }), 1.2).L, 0.1, 1);
    expect(uneven(0)).toBeGreaterThan(2 * uneven(1));
    const rack = mood({ wet: 0, time: 0.6, wmod: 1 });
    const before = rmsOf(render(rack, 1).L, 0.5, 1);
    press(rack, M_WET_HOLD);
    rack.setParam('u', 'a1', 0);
    const held = render(rack, 3).L;
    expect(rmsOf(held, 2, 3)).toBeGreaterThan(before * 0.3);
    expect(finite(held)).toBe(true);
  });

  test('Slip plays the input back in semitone steps: a fifth up, an octave up, an octave up reversed, and neutral at noon', () => {
    // (a long sampling size: a short one is a pitch shifter with a blur of sidebands)
    const hz = (wmod: number) => peakHz(render(mood({ wet: 2, time: 0.4, wmod }), 1).L, 0.3, 0.9);
    expect(Math.abs(hz(0.5) / C4 - 1)).toBeLessThan(0.01);
    expect(Math.abs(hz(0.804) / G4 - 1)).toBeLessThan(0.01);
    expect(Math.abs(hz(1) / C5 - 1)).toBeLessThan(0.01);
    expect(Math.abs(hz(0) / C5 - 1)).toBeLessThan(0.01);
  });

  test('Routing decides what the Wet Channel hears with both channels on', () => {
    const d = delayTime(0.5) / 32000;
    for (const route of [0, 2]) {
      const rack = new Rack(SR);
      rack.setPatch(patch(
        [['m', 'midi', { voices: 0 }], ['v', 'vco'], ['e', 'adsr', { a: 0.001, d: 0.02, s: 0, r: 0.005 }], ['a', 'vca'], ['d', 'mood', { mix: 1, wet: 1, time: 0.5, wmod: 0, route }], ['o', 'out', { level: 0.25 }]],
        [['v.sin', 'a.in'], ['m.gate', 'e.gate'], ['e.env', 'a.cv'], ['a.out', 'd.l'], ['d.l', 'o.l']],
      ));
      // loop the silence first, so the loop adds nothing
      render(rack, 0.1);
      press(rack, M_LOOP);
      render(rack, 0.1);
      rack.noteOn(60, 100);
      render(rack, 0.02);
      rack.noteOff(60);
      const { L } = render(rack, 0.5);
      const e = rmsOf(L, d - 0.02 + 0.003, d - 0.02 + 0.017);
      if (route === 0) expect(e).toBeGreaterThan(0.02);
      else expect(e).toBeLessThan(1e-4);
    }
  });

  test('switching the Wet Channel off cuts it, or with Trails lets it ring out; Dry kill silences the dry sound', () => {
    for (const trails of [0, 1]) {
      const rack = mood({ wet: 0, time: 0.8, wmod: 1, trails });
      render(rack, 1);
      rack.setParam('u', 'a1', 0);
      press(rack, M_WET);
      const { L } = render(rack, 0.4);
      expect(st(rack).wet).toBe(false);
      if (trails) expect(rmsOf(L, 0.2, 0.4)).toBeGreaterThan(0.02);
      else expect(rmsOf(L, 0.2, 0.4)).toBe(0);
    }
    const dry = (kill: number) => {
      const rack = mood({ mix: 0, dry: kill });
      press(rack, M_WET);
      return rmsOf(render(rack, 0.5).L, 0.2, 0.5);
    };
    expect(dry(0)).toBeGreaterThan(0.1);
    expect(dry(1)).toBe(0);
  });

  test('Sync: Loop to wet makes the loop a run of delay times; Wet to loop steps Time in fractions of the loop', () => {
    // (once the ring has filled: until then the loop is only what it has heard)
    const rack = mood({ wet: 1, time: 0.5, sync: 0 });
    render(rack, 2.2);
    const v = st(rack);
    const runs = (v.len * v.rate) / delayTime(0.5);
    expect(Math.log2(runs) % 1).toBeCloseTo(0, 6);
    expect(v.len * v.rate).toBeLessThanOrEqual(MOOD_RING);
    // Wet to loop: Time at 0.65 is the seventh step, half the loop
    const d = MOOD_RING / 2 / 32000 - 0.02;
    const { L } = render(blip({ wet: 1, time: 0.65, wmod: 0, sync: 2 }), 1.2);
    expect(rmsOf(L, d + 0.003, d + 0.017)).toBeGreaterThan(0.02);
  });

  test('ramping bounces the Clock between the knob and the bottom, and EXP moves Mix', () => {
    const rack = mood({ ramp: 1, rknob: 3, rspeed: 2, clock: 1 });
    const rates = new Set<number>();
    for (let i = 0; i < 20; i++) {
      render(rack, 0.05);
      rates.add(st(rack).rate);
    }
    expect(rates.size).toBeGreaterThan(5);
    expect(Math.max(...rates)).toBeLessThanOrEqual(64000);
    // EXP: +5 V takes Mix from noon to MOOD only, so with both channels off nothing is heard
    const mixed = (cv: number) => {
      const r = mood({ mix: 0.5 }, [['k', 'util', { o2: cv }]], [['k.out2', 'd.exp']]);
      press(r, M_WET);
      return rmsOf(render(r, 0.5).L, 0.2, 0.5);
    };
    expect(mixed(0)).toBeGreaterThan(0.1);
    expect(mixed(5)).toBe(0);
  });

  test('every mode, routing and switch stays finite and fits in the CPU', () => {
    const t0 = performance.now();
    let runs = 0;
    for (let wet = 0; wet < 3; wet++) for (let lmode = 0; lmode < 3; lmode++) {
      const classic = (wet + lmode) & 1;
      const rack = mood({ wet, lmode, route: (wet + lmode) % 3, classic, spread: 1 - classic, wmod: 0.9, lmod: 0.3, len: 0.6, clock: 0.55, tone: 0.5, sync: lmode });
      render(rack, 1);
      press(rack, M_LOOP);
      const { L, R } = render(rack, 1);
      press(rack, M_LOOP_HOLD);
      const b = render(rack, 0.5);
      press(rack, M_LOOP_LET);
      expect({ wet, lmode, ok: finite(L) && finite(R) && finite(b.L) && peak(L) < 6 && rmsOf(L, 0.2, 1) > 0.005 }).toEqual({ wet, lmode, ok: true });
      runs++;
    }
    // 9 runs of 2.5 s: well under a fifth of real time
    expect(performance.now() - t0).toBeLessThan(runs * 2500 * 0.2);
  });
});
