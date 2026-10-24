import { describe, expect, test } from 'bun:test';
import { BLOCK, Rack } from '../src/client/audio/rack/dsp';
import { MODULES, MODULE_LIST, formatParam, fromNorm, toNorm } from '../src/client/audio/rack/modules';
import { RACK_PRESETS, newModule, normalizeRack, type RackPatch } from '../src/client/audio/rack/patch';
import { GUIDE } from '../src/client/audio/rack/guide';
import { buildChord } from '../src/client/audio/rack/chords';
import { euclid } from '../src/client/audio/rack/more';

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
      const params = m.params.map((p) => p.id).filter((id) => !(m.type === 'seq' && /^[sg][1-7]$/.test(id)));
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
    const sc = rack.status().scopes.s;
    expect(sc.a.length).toBe(120);
    expect(Math.max(...sc.a)).toBeGreaterThan(4);
    expect(sc.b).toBeNull();
  });
});
