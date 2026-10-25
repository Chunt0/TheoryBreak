// The screens on the rack's display modules: oscilloscope, spectrum, spectrogram,
// XY, tuner, keyboard, piano roll and voltmeter; and the granular looper's panel. Each reads its module's view from
// the status the worklet sends ~20× a second (see RackView in audio/rack/base.ts).

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactElement } from 'react';
import type { RackStatus } from '../../audio/rack/dsp';
import type { RackView } from '../../audio/rack/base';
import { COSM_EFFECTS, COSM_FAMILIES, COSM_SUBS, NOTE_NAMES } from '../../audio/rack/modules';
import { CMD_DOWN, CMD_ERASE, CMD_REC, CMD_STOP, CMD_TAP, CMD_UNDO, CMD_UP, LOOP_DUB, LOOP_EMPTY, LOOP_FADE, LOOP_PLAY, LOOP_REC } from '../../audio/rack/cosm';
import type { RackModule } from '../../audio/rack/patch';
import { SONO_COLS, SONO_HI, SONO_LO, SONO_ROWS, SPECTRUM_HI, SPECTRUM_LO, SPECTRUM_POINTS } from '../../audio/rack/visual';
import { createStore, useMini } from '../../app/createStore';
import { rackCommand, setRackParam } from '../../app/rackState';
import { detectChord } from '../../theory/chords';

/** Jack lights, panel numbers and screens, refreshed ~20× a second while the rack is on screen. */
export const meters = createStore<RackStatus>({ meters: {}, display: {}, out: {}, views: {} });

function useView<K extends RackView['k']>(id: string, k: K): Extract<RackView, { k: K }> | null {
  return useMini(meters, (s) => {
    const v = s.views[id];
    return v && v.k === k ? (v as Extract<RackView, { k: K }>) : null;
  });
}

/** A screen for module types that have one, else null. */
export function ModuleScreen({ m }: { m: RackModule }) {
  switch (m.type) {
    case 'scope': return <ScopeScreen id={m.id} />;
    case 'spectrum': return <SpectrumScreen id={m.id} floor={m.params.floor} harm={m.params.harm >= 0.5} />;
    case 'sono': return <SonoScreen id={m.id} />;
    case 'xy': return <XyScreen id={m.id} />;
    case 'tuner': return <TunerScreen id={m.id} />;
    case 'keys': return <KeysScreen id={m.id} />;
    case 'roll': return <RollScreen id={m.id} />;
    case 'volts': return <VoltsScreen id={m.id} range={[1, 5, 10][Math.round(m.params.range)] ?? 10} />;
    case 'cosm': return <CosmScreen m={m} />;
    default: return null;
  }
}

// ------------------------------------------------------------------- helpers

const C1 = 32.703;
const noteName = (midi: number) => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
/** A frequency as its nearest note and the cents either side, e.g. A2 +3¢. */
function hzName(hz: number): string {
  const m = 69 + 12 * Math.log2(hz / 440);
  const n = Math.round(m);
  const c = Math.round((m - n) * 100);
  return `${noteName(n)} ${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c)}¢`;
}
const hzText = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${hz.toFixed(1)} Hz`);
const fmt = (v: number) => v.toFixed(1);

/** Just ratios for each interval class, and names up to two octaves. */
const JUST: [number, number][] = [[1, 1], [16, 15], [9, 8], [6, 5], [5, 4], [4, 3], [45, 32], [3, 2], [8, 5], [5, 3], [9, 5], [15, 8]];
const INTERVAL = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8', 'm9', 'M9', 'm10', 'M10', 'P11', 'A11', 'P12', 'm13', 'M13', 'm14', 'M14', 'P15'];
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** The interval from one pitch to another, its pure ratio and how far off pure it is. */
export function intervalOf(from: number, to: number): { name: string; ratio: string; cents: number; down: boolean } | null {
  if (!(from > 0) || !(to > 0)) return null;
  const down = to < from;
  const r = down ? from / to : to / from;
  const s = Math.round(12 * Math.log2(r));
  if (s > 48) return null;
  const oct = Math.floor(s / 12);
  const [p, q] = JUST[s % 12];
  const num = p * 2 ** oct;
  const g = gcd(num, q);
  const cents = Math.round(1200 * Math.log2(r / (num / q)));
  const name = s <= 24 ? INTERVAL[s] : `${INTERVAL[(s % 12) + 12]} +${oct - 1} oct`;
  return { name, ratio: `${num / g}:${q / g}`, cents, down };
}
const signed = (c: number) => `${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c)}¢`;

/** Inferno-like heat map, dark to bright. */
const HEAT = (() => {
  const stops: [number, number, number, number][] = [[0, 4, 4, 10], [0.25, 66, 12, 104], [0.5, 150, 38, 102], [0.72, 222, 82, 58], [0.88, 250, 168, 20], [1, 252, 255, 170]];
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, ...a] = stops[k];
    const [t1, ...b] = stops[k + 1];
    const f = (t - t0) / (t1 - t0);
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = a[c] + (b[c] - a[c]) * f;
  }
  return lut;
})();

// --------------------------------------------------------------- oscilloscope

function ScopeScreen({ id }: { id: string }) {
  const sc = useView(id, 'scope');
  const W = 160;
  const H = 70;
  const line = (pts: number[] | null | undefined) =>
    pts && pts.length ? pts.map((v, i) => `${((i / (pts.length - 1)) * W).toFixed(1)},${(H / 2 - Math.max(-H / 2, Math.min(H / 2, (v / 5) * (H / 2 - 3)))).toFixed(1)}`).join(' ') : '';
  return (
    <svg className="rk-scope" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Oscilloscope">
      {[1, 2, 3].map((k) => <line key={`v${k}`} x1={(W * k) / 4} x2={(W * k) / 4} y1={0} y2={H} className="grid" />)}
      <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="axis" />
      {line(sc?.b) ? <polyline points={line(sc?.b)} className="tb" /> : null}
      {line(sc?.a) ? <polyline points={line(sc?.a)} className="ta" /> : null}
    </svg>
  );
}

// ------------------------------------------------------------------ spectrum

const SW = 320;
const SH = 140;
const TOP_DB = 6;
const specX = (hz: number) => (Math.log(hz / SPECTRUM_LO) / Math.log(SPECTRUM_HI / SPECTRUM_LO)) * SW;
/** The Cs from C1 up, for the grid. */
const OCTAVE_CS = Array.from({ length: 10 }, (_, k) => C1 * 2 ** k);

function SpectrumScreen({ id, floor, harm }: { id: string; floor: number; harm: boolean }) {
  const sp = useView(id, 'spectrum');
  const yOf = (db: number) => ((TOP_DB - Math.max(floor, Math.min(TOP_DB, db))) / (TOP_DB - floor)) * SH;
  const pts = (a: number[]) => a.map((db, i) => `${((i / (SPECTRUM_POINTS - 1)) * SW).toFixed(1)},${yOf(db).toFixed(1)}`).join(' ');
  const harmonics = harm && sp && sp.f0 > 0 ? Array.from({ length: 16 }, (_, k) => (k + 1) * sp.f0).filter((f) => f < SPECTRUM_HI) : [];
  const dbLines: number[] = [];
  for (let d = 0; d > floor; d -= 20) dbLines.push(d);
  return (
    <div className="rk-screen rk-spec" role="img" aria-label={sp?.f0 ? `Spectrum: fundamental ${hzName(sp.f0)}` : 'Spectrum'}>
      <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" aria-hidden="true">
        {OCTAVE_CS.map((f) => <line key={f} x1={specX(f)} x2={specX(f)} y1={0} y2={SH} className="grid" />)}
        {dbLines.map((d) => <line key={d} x1={0} x2={SW} y1={yOf(d)} y2={yOf(d)} className={d === 0 ? 'axis' : 'grid'} />)}
        {harmonics.map((f, k) => <line key={k} x1={specX(f)} x2={specX(f)} y1={k === 0 ? 0 : SH * 0.1} y2={k === 0 ? SH : SH * 0.18} className={k === 0 ? 'f0' : 'harm'} />)}
        {sp?.a ? <polygon points={`0,${SH} ${pts(sp.a)} ${SW},${SH}`} className="fa" /> : null}
        {sp?.peaks ? <polyline points={pts(sp.peaks)} className="pk" /> : null}
        {sp?.b ? <polyline points={pts(sp.b)} className="tb" /> : null}
        {sp?.a ? <polyline points={pts(sp.a)} className="ta" /> : null}
      </svg>
      <span className="rk-axis">
        {OCTAVE_CS.slice(0, 9).map((f, k) => <i key={f} style={{ left: `${(specX(f) / SW) * 100}%` }}>C{k + 1}</i>)}
      </span>
      {harmonics.length ? <HarmonicNumbers hz={harmonics} /> : null}
      <span className="rk-read">{sp?.a ? (harm && sp.f0 > 0 ? `${hzName(sp.f0)} · ${hzText(sp.f0)}` : sp.peak > 0 ? `peak ${hzText(sp.peak)}` : 'quiet') : 'patch A'}</span>
    </div>
  );
}

/** Numbers under the harmonic ticks, skipping any that would crowd the one before. */
function HarmonicNumbers({ hz }: { hz: number[] }) {
  let last = -10;
  return (
    <span className="rk-harm" aria-hidden="true">
      {hz.slice(0, 12).map((f, k) => {
        const x = (specX(f) / SW) * 100;
        if (x - last < 3.4) return null;
        last = x;
        return <i key={k} style={{ left: `${x}%` }}>{k + 1}</i>;
      })}
    </span>
  );
}

// --------------------------------------------------------------- spectrogram

const sonoY = (hz: number) => Math.log(hz / SONO_LO) / Math.log(SONO_HI / SONO_LO);

function SonoScreen({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;
    const img = g.createImageData(SONO_COLS, SONO_ROWS);
    for (let i = 0; i < img.data.length; i += 4) img.data.set([HEAT[0], HEAT[1], HEAT[2], 255], i);
    g.putImageData(img, 0, 0);
    let last: unknown = null;
    return meters.subscribe(() => {
      const v = meters.get().views[id];
      if (!v || v.k !== 'sono' || v === last || !v.cols.length) return;
      last = v;
      const n = Math.min(v.cols.length, SONO_COLS);
      const d = img.data;
      const row = SONO_COLS * 4;
      // scroll left by n columns, then paint the new ones on the right
      for (let y = 0; y < SONO_ROWS; y++) d.copyWithin(y * row, y * row + n * 4, (y + 1) * row);
      for (let k = 0; k < n; k++) {
        const col = v.cols[v.cols.length - n + k];
        const x = SONO_COLS - n + k;
        for (let r = 0; r < SONO_ROWS; r++) {
          const o = ((SONO_ROWS - 1 - r) * SONO_COLS + x) * 4;
          const c = (col[r] ?? 0) * 3;
          d[o] = HEAT[c];
          d[o + 1] = HEAT[c + 1];
          d[o + 2] = HEAT[c + 2];
        }
      }
      g.putImageData(img, 0, 0);
    });
  }, [id]);
  return (
    <div className="rk-screen rk-sono" role="img" aria-label="Spectrogram">
      <canvas ref={ref} width={SONO_COLS} height={SONO_ROWS} aria-hidden="true" />
      <span className="rk-axis v">
        {OCTAVE_CS.slice(1, 9).filter((_, k) => k % 2 === 0).map((f, k) => <i key={f} style={{ bottom: `${sonoY(f) * 100}%` }}>C{2 + k * 2}</i>)}
      </span>
    </div>
  );
}

// ------------------------------------------------------------------ XY scope

function XyScreen({ id }: { id: string }) {
  const xy = useView(id, 'xy');
  // the last two pictures stay on, fading, like phosphor
  const trail = useRef<{ v: unknown; pts: string[] }>({ v: null, pts: [] });
  if (xy && xy !== trail.current.v) {
    const pts = xy.x.map((x, i) => `${Math.max(-6, Math.min(6, x)).toFixed(2)},${(-Math.max(-6, Math.min(6, xy.y[i]))).toFixed(2)}`).join(' ');
    trail.current = { v: xy, pts: [pts, ...trail.current.pts].slice(0, 3) };
  }
  const iv = xy ? intervalOf(xy.fx, xy.fy) : null;
  return (
    <div className="rk-screen rk-xy" role="img" aria-label={iv ? `XY: ${iv.name}, ${iv.ratio}` : 'XY scope'}>
      <svg viewBox="-5.6 -5.6 11.2 11.2" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1={-5.6} x2={5.6} y1={0} y2={0} className="axis" />
        <line x1={0} x2={0} y1={-5.6} y2={5.6} className="axis" />
        {trail.current.pts.map((p, i) => (p ? <polyline key={i} points={p} className={`tx t${i}`} /> : null)).reverse()}
      </svg>
      <span className="rk-read">
        {iv ? <><b>{iv.down ? '↓' : ''}{iv.name}</b> {iv.ratio} {signed(iv.cents)}</> : xy && (xy.fx > 0 || xy.fy > 0) ? hzText(xy.fx || xy.fy) : ''}
      </span>
    </div>
  );
}

// --------------------------------------------------------------------- tuner

function TunerScreen({ id }: { id: string }) {
  const t = useView(id, 'tuner');
  const on = !!t && t.note >= 0;
  const n = on ? Math.round(t.note) : 0;
  const cents = on ? Math.round((t.note - n) * 100) : 0;
  const tone = Math.abs(cents) <= 5 ? 'ok' : Math.abs(cents) <= 15 ? 'near' : 'off';
  return (
    <div className={`rk-screen rk-tuner ${on ? tone : ''}`} role="img" aria-label={on ? `${noteName(n)} ${signed(cents)}` : 'Tuner: no pitch'}>
      <span className="rk-tn">
        {on ? <>{NOTE_NAMES[((n % 12) + 12) % 12]}<sub>{Math.floor(n / 12) - 1}</sub></> : '–'}
      </span>
      <span className="rk-cents" aria-hidden="true">
        <i className="mid" />
        {on ? <i className="needle" style={{ left: `${50 + cents}%` }} /> : null}
      </span>
      <span className="rk-tsub">{on ? `${signed(cents)} · ${hzText(t.hz)}${t.from === 'cv' ? ' · CV' : ''}` : 'no pitch'}</span>
    </div>
  );
}

// ------------------------------------------------------------------ keyboard

const BLACK = new Set([1, 3, 6, 8, 10]);
const WHITE_INDEX = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

function KeysScreen({ id }: { id: string }) {
  const k = useView(id, 'keys');
  const notes = k?.notes ?? [];
  // three octaves from C3, moved (and widened to five) to fit what is playing
  const range = useRef({ lo: 48, oct: 3 });
  if (notes.length) {
    const lo = notes[0];
    const hi = notes[notes.length - 1];
    const r = range.current;
    if (lo < r.lo || hi >= r.lo + r.oct * 12) {
      const start = Math.floor(lo / 12) * 12;
      range.current = { lo: start, oct: Math.min(5, Math.max(3, Math.ceil((hi + 1 - start) / 12))) };
    }
  }
  const { lo, oct } = range.current;
  const whites = oct * 7;
  const W = whites * 10;
  const H = 46;
  const lit = new Set(notes);
  const keys: ReactElement[] = [];
  const blacks: ReactElement[] = [];
  for (let m = lo; m < lo + oct * 12; m++) {
    const pc = m % 12;
    const x = (Math.floor((m - lo) / 12) * 7 + WHITE_INDEX[pc]) * 10;
    if (BLACK.has(pc)) blacks.push(<rect key={m} x={x + 6.5} y={0} width={7} height={H * 0.6} rx={1} className={`bk ${lit.has(m) ? 'on' : ''}`} />);
    else keys.push(<rect key={m} x={x + 0.5} y={0} width={9} height={H} rx={1.2} className={`wk ${lit.has(m) ? 'on' : ''} ${m === 60 ? 'c4' : ''}`} />);
  }
  const chord = notes.length >= 2 ? detectChord(notes) : null;
  const label = chord ? chord.name : notes.length === 1 ? noteName(notes[0]) : notes.length ? '' : '–';
  return (
    <div className="rk-screen rk-keys" role="img" aria-label={notes.length ? `${label || 'notes'}: ${notes.map(noteName).join(' ')}` : 'No notes'}>
      <span className="rk-chord">{label || '?'}</span>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {keys}
        {blacks}
      </svg>
      <span className="rk-tsub">{notes.length ? notes.map((n) => NOTE_NAMES[n % 12]).join(' ') : `${noteName(lo)}–${noteName(lo + oct * 12 - 1)}`}</span>
    </div>
  );
}

// ---------------------------------------------------------------- piano roll

const RW = 320;
const RH = 140;

function RollScreen({ id }: { id: string }) {
  const r = useView(id, 'roll');
  const notes = r?.notes ?? [];
  const span = r?.span ?? 8;
  // fit the notes seen, at least an octave, and keep that until they leave it
  const range = useRef({ lo: 55, hi: 67 });
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < notes.length; i += 3) {
    lo = Math.min(lo, notes[i]);
    hi = Math.max(hi, notes[i]);
  }
  if (Number.isFinite(lo)) {
    const cur = range.current;
    if (lo < cur.lo || hi > cur.hi || hi - lo < (cur.hi - cur.lo) / 2 - 6) {
      const mid = (lo + hi) / 2;
      const half = Math.max(6, (hi - lo) / 2 + 2);
      range.current = { lo: Math.floor(mid - half), hi: Math.ceil(mid + half) };
    }
  }
  const { lo: L, hi: Hn } = range.current;
  const rows = Hn - L + 1;
  const lane = RH / rows;
  const yOf = (n: number) => (Hn - n) * lane;
  const xOf = (ago: number) => (1 - ago / span) * RW;
  const lanes: ReactElement[] = [];
  const cs: { n: number; y: number }[] = [];
  for (let n = L; n <= Hn; n++) {
    if (BLACK.has(((n % 12) + 12) % 12)) lanes.push(<rect key={n} x={0} y={yOf(n)} width={RW} height={lane} className="lane" />);
    if (n % 12 === 0) cs.push({ n, y: yOf(n) + lane });
  }
  const bars: ReactElement[] = [];
  for (let i = 0; i < notes.length; i += 3) {
    const [n, a, b] = [notes[i], notes[i + 1], notes[i + 2]];
    const x0 = xOf(a);
    const x1 = Math.max(x0 + 1.5, xOf(b) - 0.6);
    bars.push(<rect key={i} x={x0} y={yOf(n) + 0.5} width={x1 - x0} height={Math.max(1, lane - 1)} rx={Math.min(2, lane / 3)} className={b === 0 ? 'nt now' : 'nt'} />);
  }
  return (
    <div className="rk-screen rk-roll" role="img" aria-label="Piano roll">
      <svg viewBox={`0 0 ${RW} ${RH}`} preserveAspectRatio="none" aria-hidden="true">
        {lanes}
        {cs.map((c) => <line key={c.n} x1={0} x2={RW} y1={c.y} y2={c.y} className="axis" />)}
        {bars}
      </svg>
      <span className="rk-axis v">
        {cs.map((c) => <i key={c.n} style={{ top: `${(c.y / RH) * 100}%` }}>{noteName(c.n)}</i>)}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------- voltmeter

function VoltsScreen({ id, range }: { id: string; range: number }) {
  const v = useView(id, 'volts');
  const pct = (x: number) => 50 - (Math.max(-range, Math.min(range, x)) / range) * 50;
  return (
    <div className="rk-screen rk-volts" role="img" aria-label={v ? v.v.map((x, k) => (v.on[k] ? `${k + 1}: ${fmt(x)} V` : '')).filter(Boolean).join(', ') || 'Voltmeter' : 'Voltmeter'}>
      {[0, 1, 2, 3].map((k) => {
        const on = !!v?.on[k];
        const x = v?.v[k] ?? 0;
        const lo = v?.lo[k] ?? 0;
        const hi = v?.hi[k] ?? 0;
        return (
          <span key={k} className={`rk-vm ${on ? '' : 'off'}`}>
            <b>{on ? `${x > 0.005 ? '+' : x < -0.005 ? '−' : ''}${Math.abs(x) >= 9.995 ? Math.abs(x).toFixed(1) : Math.abs(x).toFixed(2)}` : '–'}</b>
            <span className="track" aria-hidden="true">
              {on ? <i className="band" style={{ top: `${pct(hi)}%`, bottom: `${100 - pct(lo)}%` }} /> : null}
              {on ? <i className="bar" style={{ top: `${Math.min(50, pct(x))}%`, bottom: `${100 - Math.max(50, pct(x))}%` }} /> : null}
              <i className="zero" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------ granular looper

const LOOP_WORD = ['Empty', 'Rec', 'Play', 'Dub', 'Stopped', 'Fading'];
/** what the ● button does next, by looper state (like the pedal's left footswitch) */
const NEXT_PLAY = ['Rec', 'Play', 'Dub', 'Play', 'Play', 'Play'];
/** …with Order on Rec · Dub, where closing the loop goes straight into an overdub */
const NEXT_DUB = ['Rec', 'Dub', 'Dub', 'Play', 'Play', 'Play'];
/** The pedal's looper settings: switched here, saved with the patch. */
const LOOP_OPTS: [id: string, label: string, title: string][] = [
  ['pre', 'Pre-FX', 'Pre-FX: the looper before the effects, so the loop plays through them'],
  ['burst', 'Burst', 'Burst: hold ● to record, let go to play; the next press records afresh (no overdubs)'],
  ['lonly', 'Loop only', 'Looper only: the effects muted; modulation, reverb and filter stay on'],
  ['quant', 'Quantize', 'Quantize: recording starts the effect’s bar, and the loop rounds to whole beats'],
];

function CosmScreen({ m }: { m: RackModule }) {
  const v = useView(m.id, 'cosm');
  const fx = Math.round(m.params.fx ?? 0);
  const vr = Math.round(m.params.var ?? 0);
  const st = v?.loop ?? LOOP_EMPTY;
  const on = (id: string) => (m.params[id] ?? 0) >= 0.5;
  const flip = (id: string) => setRackParam(m.id, id, on(id) ? 0 : 1);
  const press = (cmd: number) => rackCommand(m.id, 'lcmd', cmd);
  const live = st === LOOP_PLAY || st === LOOP_DUB || st === LOOP_FADE;
  const burst = on('burst');
  const taps = useRef<number[]>([]);
  const held = useRef(false);
  const tap = () => {
    // quarter notes: the tempo from the last few gaps (a long pause starts over), the beat on the tap
    const t = performance.now();
    const last = taps.current[taps.current.length - 1];
    const list = last !== undefined && t - last < 2000 ? [...taps.current.slice(-4), t] : [t];
    taps.current = list;
    if (list.length >= 2) setRackParam(m.id, 'time', Math.round(Math.min(240, Math.max(40, (60000 * (list.length - 1)) / (t - list[0])))));
    press(CMD_TAP);
  };
  // Burst: ● records while held
  const down = () => {
    if (held.current) return;
    held.current = true;
    press(CMD_DOWN);
  };
  const up = () => {
    if (!held.current) return;
    held.current = false;
    press(CMD_UP);
  };
  const isKey = (e: KeyboardEvent<HTMLButtonElement>) => e.key === ' ' || e.key === 'Enter';
  const rec = burst
    ? {
        onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          down();
        },
        onPointerUp: up,
        onPointerCancel: up,
        onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
          if (!isKey(e)) return;
          e.preventDefault();
          if (!e.repeat) down();
        },
        onKeyUp: (e: KeyboardEvent<HTMLButtonElement>) => {
          if (isKey(e)) up();
        },
        title: 'Burst: hold to record, let go to play',
      }
    : { onClick: () => press(CMD_REC), title: 'Record, play, overdub' };
  const next = burst ? 'Rec' : ((m.params.order ?? 0) >= 0.5 ? NEXT_DUB : NEXT_PLAY)[st];
  return (
    <div className={`rk-screen rk-cosm ${v?.frozen ? 'frz' : ''}`}>
      <div className="rk-cz">
        <span className="rk-cn">{COSM_EFFECTS[fx]}</span>
        <span className="rk-cf">{COSM_FAMILIES[fx]}</span>
        {v?.frozen ? <b className="frz">Hold</b> : null}
        {on('rev') ? <b>Rev</b> : null}
        <span className="rk-cv" role="radiogroup" aria-label="Variation">
          {['A', 'B', 'C', 'D'].map((x, i) => (
            <button key={x} type="button" role="radio" className={i === vr ? 'on' : ''} aria-checked={i === vr} onClick={() => setRackParam(m.id, 'var', i)}>{x}</button>
          ))}
        </span>
      </div>
      <div className="rk-ct">
        <span className="rk-cb" aria-hidden="true">{[0, 1, 2, 3].map((b) => <i key={b} className={v && b === v.beat ? 'on' : ''} />)}</span>
        <span>{v ? Math.round(v.bpm) : Math.round(m.params.time)} bpm · {COSM_SUBS[Math.round(m.params.sub ?? 2)]}</span>
        <button type="button" onClick={tap} disabled={v?.clk} title={v?.clk ? 'The tempo follows the Clock jack' : 'Tap quarter notes to set the tempo'}>Tap</button>
        <span className="rk-co">
          {LOOP_OPTS.map(([id, label, title]) => (
            <button key={id} type="button" className={on(id) ? 'on' : ''} aria-pressed={on(id)} onClick={() => flip(id)} title={title}>{label}</button>
          ))}
        </span>
      </div>
      <div className="rk-cl">
        <span className={`rk-lbar s${st}`} aria-hidden="true">
          <i style={{ width: `${(live ? v!.pos : st === LOOP_REC ? 1 : 0) * 100}%` }} />
        </span>
        <span className="rk-ls">{LOOP_WORD[st]}{st !== LOOP_EMPTY && v ? ` ${v.len.toFixed(1)}s` : ''}</span>
        <button type="button" className={`rec s${st}`} {...rec}>● {next}</button>
        <button type="button" className={on('lrev') ? 'on' : ''} aria-pressed={on('lrev')} onClick={() => flip('lrev')} aria-label="Play the loop backwards" title="Loop reverse">⇄</button>
        <button type="button" onClick={() => press(CMD_UNDO)} disabled={!v?.dub} aria-label="Undo the overdubs" title="Undo: clear the overdubs, back to the first phrase">↶</button>
        <button type="button" onClick={() => press(CMD_STOP)} disabled={!(live || st === LOOP_REC)} aria-label="Stop the loop" title="Stop">■</button>
        <button type="button" onClick={() => press(CMD_ERASE)} disabled={st === LOOP_EMPTY} aria-label="Erase the loop" title="Erase">✕</button>
      </div>
    </div>
  );
}
