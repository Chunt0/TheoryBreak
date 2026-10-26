import { describe, expect, test } from 'bun:test';
import { MODULES } from '../src/client/audio/rack/modules';
import { TOPICS } from '../src/client/learn/library';
import { demoLength, fmOf, rackOf, renderDemo, type SynthDemo } from '../src/client/learn/synth/demo';

const demos: { id: string; d: SynthDemo }[] = TOPICS.flatMap((t) => t.blocks.flatMap((b) => (b.t === 'synth' ? [{ id: t.id, d: b.demo }] : [])));
const SR = 16000;

const rms = (x: Float32Array) => Math.sqrt(x.reduce((a, v) => a + v * v, 0) / x.length);

describe('synth lesson demos', () => {
  test('there are demos in every synth lesson', () => {
    expect(demos.length).toBeGreaterThanOrEqual(40);
  });

  test('every cable survives into the patch, and every change names a real knob', () => {
    for (const { id, d } of demos) {
      const where = `${id} ${d.name}`;
      expect(d.tries.length, where).toBeGreaterThan(0);
      if (d.rack) {
        const p = rackOf(d.rack, d.name);
        expect(p.cables.length, `${where}: cables`).toBe(d.rack.wires.length);
        for (const t of d.tries) for (const k of Object.keys(t.set ?? {})) {
          const [mod, param] = k.split('.');
          const type = d.rack.mods[mod]?.[0];
          expect(type, `${where}: ${k}`).toBeDefined();
          expect(MODULES[type!].params.some((x) => x.id === param), `${where}: ${k}`).toBe(true);
        }
        for (const [m, [type, params]] of Object.entries(d.rack.mods))
          for (const k of Object.keys(params ?? {})) expect(MODULES[type].params.some((x) => x.id === k), `${where}: ${m}.${k}`).toBe(true);
      } else {
        const base = JSON.stringify(fmOf(d.fm ?? {}, d.name));
        for (const t of d.tries) {
          const p = fmOf(d.fm ?? {}, d.name, t.set);
          for (const k of Object.keys(t.set ?? {})) {
            const path = k.split('.');
            let at: any = /^op[1-6]$/.test(path[0]) ? p.ops[Number(path.shift()![2]) - 1] : p;
            for (const seg of path) at = at?.[seg];
            expect(at, `${where}: ${k}`).toBe(t.set![k]);
          }
          if (t.set && Object.keys(t.set).length) expect(JSON.stringify(p), `${where}: ${t.label} changes nothing`).not.toBe(base);
        }
      }
    }
  });

  test('every variant renders: finite, audible, and different from the first', () => {
    for (const { id, d } of demos) {
      const first = renderDemo(d, d.tries[0].set, SR);
      expect(first.l.length).toBe(Math.ceil((demoLength(d) * SR) / 32) * 32);
      for (const [i, t] of d.tries.entries()) {
        const x = i === 0 ? first : renderDemo(d, t.set, SR);
        const where = `${id} ${d.name} / ${t.label}`;
        expect(x.l.every(Number.isFinite), where).toBe(true);
        expect(rms(x.l), `${where}: silent`).toBeGreaterThan(0.002);
        if (i > 0) {
          let diff = 0;
          for (let j = 0; j < x.l.length; j++) diff += Math.abs(x.l[j] - first.l[j]);
          expect(diff / x.l.length, `${where}: sounds the same as ${d.tries[0].label}`).toBeGreaterThan(1e-4);
        }
      }
    }
  }, 60000);
});
