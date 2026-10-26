// A synth lesson's demo: one patch in a few variants. Each button renders its
// variant offline and plays it, and the card draws what you heard: a few cycles
// of the wave and its spectrum. "Open" loads the variant into the instrument.

import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { MODULES } from '../audio/rack/modules';
import { loadRack, setInstrument } from '../app/rackState';
import { loadPatch } from '../app/synthState';
import { demoLength, demoRoot, fmOf, levelGain, rackOf, renderDemo, spectrum, waveWindow, type Rendered, type SynthDemo } from '../learn/synth/demo';
import { opFreqText } from '../audio/dx7/patch';
import { getAlgorithm } from '../audio/dx7/algorithms';
import { AlgorithmDiagram } from '../ui/synth/AlgorithmDiagram';

const SR = 48000;

export function SynthDemoCard({ demo }: { demo: SynthDemo }) {
  const cache = useRef(new Map<number, Rendered>());
  const gain = useRef<number | null>(null);
  const timer = useRef(0);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(-1);
  const [shown, setShown] = useState<Rendered | null>(null);
  const [opened, setOpened] = useState(false);
  const view = demo.view ?? 'both';

  // every variant shares the first one's level, so louder really is louder
  const get = (i: number): Rendered => {
    if (gain.current === null) gain.current = levelGain(renderDemo(demo, demo.tries[0]?.set, SR));
    let x = cache.current.get(i);
    if (!x) {
      x = renderDemo(demo, demo.tries[i]?.set, SR, gain.current);
      cache.current.set(i, x);
    }
    return x;
  };

  // a new demo in the same card starts over; then draw its first variant once the panel has painted
  useEffect(() => {
    cache.current = new Map();
    gain.current = null;
    setActive(0);
    setShown(null);
    setOpened(false);
    if (view === 'none') return;
    // when the browser is idle, so several cards opening at once do not stall the panel
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 60));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => setShown(get(0)));
    return () => cancel(id);
  }, [demo]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const play = async (i: number) => {
    window.clearTimeout(timer.current);
    if (playing === i) {
      audio.stop();
      setPlaying(-1);
      return;
    }
    await audio.init();
    audio.stop();
    const x = get(i);
    setActive(i);
    if (view !== 'none') setShown(x);
    const t = audio.playBuffer(x.l, x.r, x.sampleRate);
    if (!t) return;
    setPlaying(i);
    timer.current = window.setTimeout(() => setPlaying(-1), (t.end - audio.now()) * 1000 + 50);
  };

  const open = () => {
    const set = demo.tries[active]?.set;
    if (demo.rack) {
      setInstrument('rack');
      loadRack(rackOf(demo.rack, demo.name, set));
    } else {
      setInstrument('dx7');
      loadPatch(fmOf(demo.fm ?? {}, demo.name, set));
    }
    setOpened(true);
  };

  const root = demoRoot(demo);
  const hz = demo.hz ?? 440 * Math.pow(2, (root - 69) / 12) * 16.5;
  const wave = useMemo(() => (shown && (view === 'both' || view === 'wave') ? waveWindow(shown, root) : null), [shown]);
  const spec = useMemo(() => (shown && (view === 'both' || view === 'spectrum') ? spectrum(shown, hz) : null), [shown]);

  return (
    <div className="card flat s-synthdemo">
      {demo.caption ? <p className="caption">{demo.caption}</p> : null}
      <div className="listen-row">
        {demo.tries.map((t, i) => (
          <button key={i} type="button" className={`btn small ${playing === i ? 'active' : ''} ${active === i ? 'on' : ''}`} onClick={() => void play(i)}>
            {playing === i ? '■' : '▶'} {t.label}{t.note ? <small className="faint"> {t.note}</small> : null}
          </button>
        ))}
      </div>
      {wave || spec ? (
        <div className="s-sd-pics" aria-label={`${demo.tries[active]?.label}: waveform and spectrum`}>
          {wave ? <WavePic x={wave} /> : null}
          {spec ? <SpecPic db={spec.db} binHz={spec.binHz} f0={440 * Math.pow(2, (root - 69) / 12)} /> : null}
        </div>
      ) : null}
      <details className="s-sd-patch">
        <summary>The patch{demo.rack ? '' : `: algorithm ${demo.fm?.algorithm ?? 1}`}</summary>
        {demo.rack ? <RackSummary demo={demo} /> : <FmSummary demo={demo} />}
      </details>
      <div className="row between s-sd-open">
        <span className="tiny faint">{opened ? `Loaded "${demo.name}" into the ${demo.rack ? 'rack' : 'DX7'}: play it from the keys and turn its knobs. Undo brings your own patch back.` : `${demoLength(demo).toFixed(1)} s · ${demo.rack ? 'modular rack' : 'DX7'}`}</span>
        <button type="button" className="btn small" onClick={open} title={`Load ${demo.tries[active]?.label ?? 'it'} into the ${demo.rack ? 'rack' : 'DX7'}`}>
          Open in {demo.rack ? 'rack' : 'DX7'}
        </button>
      </div>
    </div>
  );
}

function WavePic({ x }: { x: Float32Array }) {
  let peak = 1e-6;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  const step = Math.max(1, Math.floor(x.length / 300));
  const pts: string[] = [];
  for (let i = 0; i < x.length; i += step) pts.push(`${((i / (x.length - 1)) * 300).toFixed(1)},${(40 - (x[i] / peak) * 36).toFixed(1)}`);
  return (
    <svg className="s-sd-wave" viewBox="0 0 300 80" preserveAspectRatio="none" role="img" aria-label="Waveform">
      <line x1="0" y1="40" x2="300" y2="40" className="axis" />
      <polyline points={pts.join(' ')} vectorEffect="non-scaling-stroke" />
      <text x="4" y="12">wave</text>
    </svg>
  );
}

function SpecPic({ db, binHz, f0 }: { db: Float32Array; binHz: number; f0: number }) {
  const FLOOR = -60;
  const W = 300;
  const top = db.length * binHz;
  const x = (hz: number) => (hz / top) * W;
  const pts: string[] = [`0,76`];
  for (let i = 0; i < db.length; i++) pts.push(`${x(i * binHz).toFixed(1)},${(76 - ((Math.max(FLOOR, db[i]) - FLOOR) / -FLOOR) * 68).toFixed(1)}`);
  pts.push(`${W},76`);
  const ticks = [];
  for (let h = 1; h * f0 < top; h++) ticks.push(h);
  return (
    <svg className="s-sd-spec" viewBox="0 0 300 80" preserveAspectRatio="none" role="img" aria-label="Spectrum">
      {ticks.map((h) => <line key={h} x1={x(h * f0)} x2={x(h * f0)} y1="76" y2="72" className="tick" />)}
      <polygon points={pts.join(' ')} />
      <text x="4" y="12">spectrum · ticks = harmonics</text>
    </svg>
  );
}

const portLabel = (type: string, port: string, side: 'ins' | 'outs') =>
  MODULES[type as keyof typeof MODULES]?.[side].find((p) => p.id === port)?.label ?? port;

function RackSummary({ demo }: { demo: SynthDemo }) {
  const p = rackOf(demo.rack!, demo.name);
  const byId = new Map(p.modules.map((m) => [m.id, m]));
  // two of a kind get numbers, in the order they were added
  const name = (id: string) => {
    const type = byId.get(id)!.type;
    const same = p.modules.filter((m) => m.type === type);
    return MODULES[type].name + (same.length > 1 ? ` ${same.findIndex((m) => m.id === id) + 1}` : '');
  };
  const fam = (id: string) => `fam-${MODULES[byId.get(id)!.type].family}`;
  return (
    <ul className="s-sd-cables">
      {p.cables.map((c) => (
        <li key={c.id}>
          <b className={fam(c.from.mod)}>{name(c.from.mod)}</b> {portLabel(byId.get(c.from.mod)!.type, c.from.port, 'outs')}
          <span className="faint"> → </span>
          <b className={fam(c.to.mod)}>{name(c.to.mod)}</b> {portLabel(byId.get(c.to.mod)!.type, c.to.port, 'ins')}
        </li>
      ))}
    </ul>
  );
}

function FmSummary({ demo }: { demo: SynthDemo }) {
  const p = fmOf(demo.fm ?? {}, demo.name);
  const carriers = getAlgorithm(p.algorithm).carriers;
  const used = p.ops.map((o, i) => ({ o, n: i + 1 })).filter(({ o }) => o.outputLevel > 0);
  return (
    <div className="s-sd-fm">
      <div className="algo">
        <AlgorithmDiagram algorithm={p.algorithm} small={false} enabled={p.ops.map((o) => o.outputLevel > 0)} levels={p.ops.map((o) => o.outputLevel / 99)} />
      </div>
      <table className="t">
        <thead><tr><th>Op</th><th>Role</th><th>Freq</th><th>Level</th><th>Rates / levels</th></tr></thead>
        <tbody>
          {used.map(({ o, n }) => (
            <tr key={n}>
              <td>{n}</td>
              <td>{carriers.includes(n) ? 'carrier' : 'modulator'}</td>
              <td>{opFreqText(o)}</td>
              <td>{o.outputLevel}</td>
              <td className="tiny">{o.rates.join(' ')} / {o.levels.join(' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {p.feedback ? <p className="tiny faint">Feedback {p.feedback}</p> : null}
    </div>
  );
}
