// The modular synth: modules in a rack, patched with cables. Drag from a jack
// to a jack (or tap one, then the other); tap a patched input to unplug it.
// Tap a module's name to select it: the MiniLab's knobs and faders then turn
// its knobs, its pads select modules and the encoder steps along the rack.

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { audio } from '../../audio/engine';
import { MODULES, MODULE_LIST, NOTE_NAMES, formatParam, fromNorm, toNorm, type Family, type ModuleType, type ParamDef } from '../../audio/rack/modules';
import { RACK_PRESETS, type Jack, type RackCable, type RackModule } from '../../audio/rack/patch';
import { buildChord } from '../../audio/rack/chords';
import { euclid } from '../../audio/rack/more';
import { useMini } from '../../app/createStore';
import { addModule, connect, disconnect, moveModule, rack, redoRack, removeModule, saveRack, selectModule, selectStep, setModuleRow, setRackParam, undoRack } from '../../app/rackState';
import { chooseSound } from '../../app/sounds';
import { useStore } from '../../app/store';
import { input } from '../../midi/input';
import { Pick, releaseFocus, useMidiConnected, type Choice } from '../../simple/common';
import { RackGuide, openGuide } from './RackGuide';
import { ModuleScreen, meters } from './Screens';

const FAMILY_TITLE: Record<Family, string> = {
  io: 'In & out', src: 'Sources', drum: 'Drums', mod: 'Modulation', seq: 'Clocks & sequencing', filter: 'Filters & shapers', amp: 'Amp & mix', fx: 'Effects', util: 'Utility', view: 'Scopes & meters',
};
const ADD_GROUPS = (['src', 'drum', 'filter', 'amp', 'mod', 'seq', 'fx', 'util', 'view', 'io'] as Family[]).map((f) => ({
  title: FAMILY_TITLE[f],
  types: MODULE_LIST.filter((m) => m.family === f),
}));

/**
 * On a two-row case, modules nobody has placed split in rack order into two rows
 * of about the same width, so the signal still reads left to right, top to bottom.
 */
function splitRows(mods: RackModule[]): Record<string, 1 | 2> {
  const total = mods.reduce((a, m) => a + MODULES[m.type].cols, 0);
  const out: Record<string, 1 | 2> = {};
  let at = 0;
  for (const m of mods) {
    const w = MODULES[m.type].cols;
    out[m.id] = at + w / 2 <= total / 2 ? 1 : 2;
    at += w;
  }
  return out;
}
/** Two rows need about this much height (two modules plus the rails). */
const TWO_ROWS_AT = 610;

// ------------------------------------------------------------------ toolbar

/** Rack picker, add module, name + save, undo/redo: sits in the Synth tab's options row. */
export function RackToolbar() {
  const patch = useMini(rack, (s) => s.patch);
  const canUndo = useMini(rack, (s) => s.past.length > 0);
  const canRedo = useMini(rack, (s) => s.future.length > 0);
  const user = useStore((d) => d.rack.user);
  const selectedType = useMini(rack, (s) => s.patch.modules.find((m) => m.id === s.selected)?.type ?? null);
  const [name, setName] = useState(patch.name);
  useEffect(() => setName(patch.name), [patch.name]);

  const known = user.some((p) => p.name === patch.name) ? `ur:${patch.name}` : RACK_PRESETS.some((p) => p.patch.name === patch.name) ? `r:${patch.name}` : '';
  const groups: { title: string; options: Choice<string>[] }[] = [
    ...(known ? [] : [{ title: 'Now', options: [{ id: '', label: `${patch.name} (edited)` }] }]),
    { title: 'Factory racks', options: RACK_PRESETS.map((p) => ({ id: `r:${p.patch.name}`, label: p.patch.name })) },
    ...(user.length ? [{ title: 'Your racks', options: user.map((p) => ({ id: `ur:${p.name}`, label: p.name })) }] : []),
  ];

  return (
    <>
      <Pick label="Rack" value={known} groups={groups} onChange={(k) => k && chooseSound(k)} />
      <label className="s-pill" title="Add a module next to the selected one">
        <select
          value=""
          aria-label="Add a module"
          onChange={(e) => {
            if (e.target.value) addModule(e.target.value as ModuleType);
            releaseFocus(e.currentTarget);
          }}
        >
          <option value="">+ Module</option>
          {ADD_GROUPS.map((g) => (
            <optgroup key={g.title} label={g.title}>
              {g.types.map((m) => <option key={m.type} value={m.type}>{m.name} · {m.title}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <span className="rk-save">
        <input value={name} maxLength={24} onChange={(e) => setName(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && saveRack(name)} aria-label="Rack name" spellCheck={false} />
        <button type="button" onClick={() => saveRack(name)} title="Save to your racks">Save</button>
      </span>
      <span className="rk-undo">
        <button type="button" onClick={undoRack} disabled={!canUndo} title="Undo" aria-label="Undo">↶</button>
        <button type="button" onClick={redoRack} disabled={!canRedo} title="Redo" aria-label="Redo">↷</button>
      </span>
      <button type="button" className="rk-guide-btn" onClick={() => openGuide(selectedType ?? 'basics')} title="How the rack and every module work">
        <span aria-hidden="true">?</span> Guide
      </button>
    </>
  );
}

// --------------------------------------------------------------------- page

interface Pt {
  x: number;
  y: number;
}
type End = Jack & { dir: 'in' | 'out' };
interface Drag {
  id: number;
  /** the jack under the finger */
  touched: End;
  /** where the dragged cable starts */
  from: End;
  /** an existing cable picked up by its input end */
  moving: RackCable | null;
  start: Pt;
  at: Pt;
  moved: boolean;
}

const jackKey = (j: End) => `${j.mod}:${j.port}:${j.dir}`;
const parseJack = (s: string | undefined): End | null => {
  const [mod, port, dir] = (s ?? '').split(':');
  return mod && port && (dir === 'in' || dir === 'out') ? { mod, port, dir } : null;
};

export function RackPage() {
  const patch = useMini(rack, (s) => s.patch);
  const selected = useMini(rack, (s) => s.selected);
  const midi = useMidiConnected();
  const scroller = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<string, Pt>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const [armed, setArmed] = useState<End | null>(null);
  const [tall, setTall] = useState(false);
  // a second row when the window is tall enough (and both rows have something in them)
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTall(el.clientHeight >= TWO_ROWS_AT));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const auto = useMemo(() => splitRows(patch.modules), [patch.modules]);
  const rowOf = (m: RackModule): 1 | 2 => m.row ?? auto[m.id] ?? 1;
  const rows = tall && patch.modules.some((m) => rowOf(m) === 1) && patch.modules.some((m) => rowOf(m) === 2) ? 2 : 1;

  useEffect(() => audio.onRackStatus((s) => meters.set(s)), []);

  // the encoder steps along the rack while it is on screen (Enter / Backspace commands)
  useEffect(() => input.on((e) => {
    if (e.type !== 'command') return;
    if (e.cmd === 'enter') selectStep(1);
    else if (e.cmd === 'back') selectStep(-1);
  }), []);

  // measure where every jack sits, relative to the rail (which scrolls with the cables)
  const layoutKey = `${rows}:${patch.modules.map((m) => `${m.id}${rowOf(m)}`).join(',')}`;
  useLayoutEffect(() => {
    const el = rail.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const next: Record<string, Pt> = {};
      el.querySelectorAll<HTMLElement>('[data-jack]').forEach((j) => {
        const r = j.getBoundingClientRect();
        next[j.dataset.jack!] = { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
      });
      setPos(next);
      // size from the modules, not scrollWidth: that would include the cable layer itself and never shrink
      let right = 0;
      el.querySelectorAll<HTMLElement>('.rk-mod').forEach((m) => (right = Math.max(right, m.offsetLeft + m.offsetWidth)));
      setSize({ w: Math.max(el.clientWidth, right + 14), h: el.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layoutKey]);

  // keep the selected module in view (the MiniLab can select one off-screen)
  useEffect(() => {
    const el = selected ? rail.current?.querySelector<HTMLElement>(`[data-mod="${CSS.escape(selected)}"]`) : null;
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [selected]);

  const toRail = (e: { clientX: number; clientY: number }): Pt => {
    const box = rail.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };

  const finish = (a: End, b: End) => {
    if (a.dir === b.dir) return false;
    const [out, inp] = a.dir === 'out' ? [a, b] : [b, a];
    connect({ mod: out.mod, port: out.port }, { mod: inp.mod, port: inp.port });
    return true;
  };

  // edge scrolling while a cable is dragged near the side of the rack
  const edge = useRef(0);
  useEffect(() => {
    if (!drag) return;
    let raf = 0;
    const tick = () => {
      if (edge.current && scroller.current) scroller.current.scrollLeft += edge.current;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [!!drag]);

  const onDown = (e: ReactPointerEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-jack]');
    const end = parseJack(el?.dataset.jack);
    if (!end) {
      if (!(e.target as Element).closest('.rk-mod')) setArmed(null);
      return;
    }
    e.preventDefault();
    rail.current!.setPointerCapture(e.pointerId);
    const at = toRail(e);
    const moving = end.dir === 'in' ? patch.cables.find((c) => c.to.mod === end.mod && c.to.port === end.port) ?? null : null;
    // picking up a patched input drags its cable from the output it comes from
    const from: End = moving ? { ...moving.from, dir: 'out' } : end;
    setDrag({ id: e.pointerId, touched: end, from, moving, start: at, at, moved: false });
  };

  const onMove = (e: ReactPointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const at = toRail(e);
    const moved = drag.moved || Math.hypot(at.x - drag.start.x, at.y - drag.start.y) > 8;
    setDrag({ ...drag, at, moved });
    const box = scroller.current!.getBoundingClientRect();
    edge.current = e.clientX < box.left + 36 ? -10 : e.clientX > box.right - 36 ? 10 : 0;
  };

  const onUp = (e: ReactPointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    edge.current = 0;
    setDrag(null);
    const target = parseJack(document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-jack]')?.dataset.jack);
    if (!drag.moved) {
      // a tap: patch to the armed jack, unplug a patched input, or arm this jack for the next tap
      if (armed && finish(armed, drag.touched)) return setArmed(null);
      if (drag.moving) return disconnect(drag.moving.id);
      setArmed(armed && jackKey(armed) === jackKey(drag.touched) ? null : drag.touched);
      return;
    }
    if (target && finish(drag.from, target)) {
      if (drag.moving && !(target.mod === drag.moving.to.mod && target.port === drag.moving.to.port)) disconnect(drag.moving.id);
      return;
    }
    // dropped somewhere else: a picked-up cable is unplugged
    if (drag.moving) disconnect(drag.moving.id);
  };

  const patchedIns = useMemo(() => new Set(patch.cables.map((c) => `${c.to.mod}:${c.to.port}`)), [patch.cables]);
  const patchedOuts = useMemo(() => new Set(patch.cables.map((c) => `${c.from.mod}:${c.from.port}`)), [patch.cables]);
  const sel = patch.modules.find((m) => m.id === selected);
  const def = sel ? MODULES[sel.type] : null;

  return (
    <div className="rk">
      <div className="rk-scroll" ref={scroller}>
        <div className={`rk-rail ${rows === 2 ? 'two' : ''}`} ref={rail} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {(rows === 2 ? [1, 2] : [0]).map((r) => (
            <div key={r} className="rk-row">
              {patch.modules.map((m, i) => (r && rowOf(m) !== r ? null : (
                <ModulePanel
                  key={m.id}
                  m={m}
                  index={i}
                  row={rows === 2 ? rowOf(m) : 0}
                  autoRow={auto}
                  selected={m.id === selected}
                  numbered={midi && m.id === selected}
                  armed={armed && armed.mod === m.id ? armed.port + armed.dir : ''}
                  patchedIns={patchedIns}
                  patchedOuts={patchedOuts}
                />
              )))}
            </div>
          ))}
          {patch.modules.length === 0 ? <p className="rk-empty">Empty rack. Add a MIDI module, a VCO and an OUT from “+ Module”.</p> : null}
          <Cables cables={patch.cables} pos={pos} size={size} drag={drag} />
        </div>
      </div>
      <RackGuide />
      <p className="rk-help">
        {def && sel ? (
          <>
            <b>{def.name}</b> · {def.title}. {def.blurb}{' '}
            <button type="button" className="rk-help-link" onClick={() => openGuide(sel.type)}>More on the {def.name} →</button>
            {midi ? <span className="faint"> MiniLab knobs 1–8 and faders turn its knobs.</span> : null}
          </>
        ) : armed ? (
          <>Now tap {armed.dir === 'out' ? 'an input' : 'an output'} to patch it, or tap the jack again to let go.</>
        ) : (
          <>
            Drag from an output (dark plate) to an input, or tap one then the other. Tap a patched input to unplug it. Tap a module’s name to select it, its <b>?</b> to learn it.{' '}
            <button type="button" className="rk-help-link" onClick={() => openGuide('basics')}>Rack basics →</button>
          </>
        )}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------- cables

/** A cable hanging between two points; it sags with length but never below `floor`. */
const sagPath = (a: Pt, b: Pt, floor: number): string => {
  const dx = b.x - a.x;
  // the curve's lowest point is about ¾ of the sag below the lower end
  const room = (floor - Math.max(a.y, b.y)) / 0.75;
  const sag = Math.max(10, Math.min(140, 26 + Math.hypot(dx, b.y - a.y) * 0.32, room));
  return `M${a.x},${a.y} C${a.x + dx * 0.12},${a.y + sag} ${b.x - dx * 0.12},${b.y + sag} ${b.x},${b.y}`;
};

function Cables({ cables, pos, size, drag }: { cables: RackCable[]; pos: Record<string, Pt>; size: { w: number; h: number }; drag: Drag | null }) {
  const floor = size.h - 8;
  const one = (key: string, a: Pt | undefined, b: Pt | undefined, color: number, ghost = false) =>
    a && b ? (
      <g key={key} className={`rk-cable c${color} ${ghost ? 'ghost' : ''}`}>
        <path d={sagPath(a, b, floor)} className="shade" />
        <path d={sagPath(a, b, floor)} className="wire" />
        <circle cx={a.x} cy={a.y} r={5.5} className="plug" />
        <circle cx={b.x} cy={b.y} r={5.5} className="plug" />
      </g>
    ) : null;
  return (
    <svg className="rk-cables" width={size.w} height={size.h} aria-hidden="true">
      {cables.map((c) => (drag?.moving?.id === c.id ? null : one(c.id, pos[`${c.from.mod}:${c.from.port}:out`], pos[`${c.to.mod}:${c.to.port}:in`], c.color)))}
      {drag && drag.moved ? one('drag', pos[jackKey(drag.from)], drag.at, drag.moving?.color ?? cables.length % 7, true) : null}
    </svg>
  );
}

// ------------------------------------------------------------------ modules

interface PanelProps {
  m: RackModule;
  index: number;
  /** its row on a two-row case (0 = one row) */
  row: 0 | 1 | 2;
  /** where the even split puts every module, for fixing them in place on the first move */
  autoRow: Record<string, 1 | 2>;
  selected: boolean;
  /** show which MiniLab knob turns which knob */
  numbered: boolean;
  /** port+dir of an armed jack on this module */
  armed: string;
  patchedIns: Set<string>;
  patchedOuts: Set<string>;
}

const ModulePanel = memo(function ModulePanel({ m, index, row, autoRow, selected, numbered, armed, patchedIns, patchedOuts }: PanelProps) {
  const def = MODULES[m.type];
  const shown = useMini(meters, (s) => s.display[m.id] ?? -1);
  const fitsOneRow = def.ins.length + def.outs.length <= def.cols;
  let knobNo = 0;
  const param = (p: ParamDef) => {
    const v = m.params[p.id] ?? p.def;
    const set = (x: number) => setRackParam(m.id, p.id, x);
    if (p.kind === 'toggle') {
      const step = m.type === 'seq' ? Number(p.id.slice(1)) : -1;
      return (
        <button key={p.id} type="button" className={`rk-toggle ${v >= 0.5 ? 'on' : ''} ${step >= 0 && step === shown ? 'now' : ''}`} onClick={() => set(v >= 0.5 ? 0 : 1)} aria-pressed={v >= 0.5} title={p.label}>
          <i />
          {m.type === 'seq' ? null : <span>{p.label}</span>}
        </button>
      );
    }
    const n = knobNo++;
    const num = numbered ? (n < 8 ? String(n + 1) : n < 12 ? `F${n - 7}` : '') : '';
    if (p.kind === 'choice') {
      return (
        <label key={p.id} className="rk-choice">
          <span className="rk-kl">{p.label}{num ? <i className="rk-num">{num}</i> : null}</span>
          <select value={Math.round(v)} onChange={(e) => set(Number(e.target.value))} aria-label={`${def.name} ${p.label}`}>
            {p.options!.map((o, i) => <option key={o} value={i}>{o}</option>)}
          </select>
        </label>
      );
    }
    const now = m.type === 'seq' && p.id === `s${shown}`;
    return <RackKnob key={p.id} def={p} value={v} onChange={set} num={num} now={now} name={`${def.name} ${p.label}`} />;
  };
  const jack = (dir: 'in' | 'out', p: { id: string; label: string }) => {
    const key = `${m.id}:${p.id}`;
    return (
      <span key={dir + p.id} className={`rk-port ${dir}`}>
        <button
          type="button"
          className={`rk-jack ${(dir === 'in' ? patchedIns : patchedOuts).has(key) ? 'patched' : ''} ${armed === p.id + dir ? 'armed' : ''}`}
          data-jack={`${key}:${dir}`}
          aria-label={`${def.name} ${p.label} ${dir === 'in' ? 'input' : 'output'}`}
        >
          <i />
        </button>
        <span className="rk-pl">
          {dir === 'out' ? <Led k={`${m.id}.${p.id}`} /> : null}
          {p.label}
        </span>
      </span>
    );
  };

  return (
    <section className={`rk-mod fam-${def.family} ${selected ? 'sel' : ''}`} style={{ '--cols': def.cols } as CSSProperties} data-mod={m.id}>
      <header>
        <button type="button" className="rk-q" onClick={() => openGuide(m.type)} aria-label={`How the ${def.name} works`} title={`How the ${def.name} works`}>?</button>
        <button type="button" className="rk-title" onClick={() => selectModule(selected ? null : m.id)} title={`${def.title}: ${def.blurb}`}>
          {def.name}
          {m.type === 'quant' && shown >= 0 ? <span className="rk-disp">{NOTE_NAMES[shown % 12]}{Math.floor(shown / 12) - 1}</span> : null}
          {m.type === 'chord' && shown >= 0 ? <span className="rk-disp">{buildChord(shown - 60, m.params.type, m.params.key, 0, 0).name}</span> : null}
          {m.type === 'switch' && shown >= 0 ? <span className="rk-disp">{shown + 1}</span> : null}

        </button>
        {selected ? (
          <span className="rk-tools">
            <button type="button" onClick={() => moveModule(m.id, -1)} disabled={index === 0} aria-label="Move left">‹</button>
            <button type="button" onClick={() => moveModule(m.id, 1)} aria-label="Move right">›</button>
            {row ? <button type="button" onClick={() => setModuleRow(m.id, row === 1 ? 2 : 1, (x) => autoRow[x.id] ?? 1)} aria-label={row === 1 ? 'Move to the lower row' : 'Move to the upper row'} title={row === 1 ? 'Move to the lower row' : 'Move to the upper row'}>{row === 1 ? '↓' : '↑'}</button> : null}
            <button type="button" onClick={() => removeModule(m.id)} aria-label="Remove module">×</button>
          </span>
        ) : null}
      </header>
      <div className="rk-params">{def.params.filter((q) => !q.hidden).map(param)}</div>
      {m.type === 'out' ? <OutMeter id={m.id} /> : null}
      {m.type === 'clock' ? <span className="rk-beats">{[0, 1, 2, 3].map((b) => <i key={b} className={b === shown ? 'on' : ''} />)}</span> : null}
      {m.type === 'euclid' ? <EuclidRing steps={m.params.steps} fills={m.params.fills} rotate={m.params.rotate} now={shown} /> : null}
      {m.type === 'turing' ? <Bits value={shown} /> : null}
      <ModuleScreen m={m} />
      <div className="rk-jacks">
        {fitsOneRow ? (
          <div className="rk-ports">{[...def.ins.map((p) => jack('in', p)), ...def.outs.map((p) => jack('out', p))]}</div>
        ) : (
          <>
            {def.ins.length ? <div className="rk-ports">{def.ins.map((p) => jack('in', p))}</div> : null}
            {def.outs.length ? <div className="rk-ports">{def.outs.map((p) => jack('out', p))}</div> : null}
          </>
        )}
      </div>
    </section>
  );
});

/** Euclid's pattern as a row of dots, the current step lit. */
function EuclidRing({ steps, fills, rotate, now }: { steps: number; fills: number; rotate: number; now: number }) {
  const pattern = euclid(steps, fills, rotate);
  return (
    <div className="rk-pattern" aria-label={`${Math.round(fills)} hits in ${pattern.length} steps`}>
      {pattern.map((hit, i) => <i key={i} className={`${hit ? 'hit' : ''} ${i === now ? 'now' : ''}`} />)}
    </div>
  );
}

/** The Turing machine's eight output bits. */
function Bits({ value }: { value: number }) {
  return (
    <div className="rk-bits" aria-hidden="true">
      {[7, 6, 5, 4, 3, 2, 1, 0].map((b) => <i key={b} className={value >= 0 && (value >> b) & 1 ? 'on' : ''} />)}
    </div>
  );
}

function Led({ k }: { k: string }) {
  const v = useMini(meters, (s) => Math.min(1, Math.round(((s.meters[k] ?? 0) / 5) * 8) / 8));
  return <i className="rk-led" style={{ opacity: 0.15 + v * 0.85 }} />;
}

function OutMeter({ id }: { id: string }) {
  const v = useMini(meters, (s) => Math.min(1, Math.round((s.out[id] ?? 0) * 20) / 20));
  return (
    <div className="rk-meter" aria-hidden="true">
      <i style={{ height: `${v * 100}%` }} className={v >= 0.98 ? 'hot' : ''} />
    </div>
  );
}

// -------------------------------------------------------------------- knob

const A0 = -135;
const A1 = 135;
function arc(c: number, r: number, a0: number, a1: number): string {
  const p = (a: number) => [c + r * Math.cos(((a - 90) * Math.PI) / 180), c + r * Math.sin(((a - 90) * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

/** Touch-friendly knob: drag up or right to turn it up, double-tap to reset. */
function RackKnob({ def, value, onChange, num, now, name }: { def: ParamDef; value: number; onChange: (v: number) => void; num: string; now: boolean; name: string }) {
  const drag = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef(0);
  const [active, setActive] = useState(false);
  const t = toNorm(def, value);
  const bipolar = def.min < 0 && def.max > 0;
  const zero = bipolar ? toNorm(def, 0) : 0;
  const angle = A0 + t * (A1 - A0);
  const size = 30;
  const c = size / 2;
  const steps = def.curve === 'int' ? def.max - def.min : 100;
  const nudge = (d: number) => onChange(fromNorm(def, t + d / steps));
  return (
    <div className={`rk-knob ${active ? 'active' : ''} ${now ? 'now' : ''}`}>
      <span className="rk-kl">{def.label}{num ? <i className="rk-num">{num}</i> : null}</span>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="slider"
        tabIndex={0}
        aria-label={name}
        aria-valuemin={def.min}
        aria-valuemax={def.max}
        aria-valuenow={value}
        aria-valuetext={formatParam(def, value)}
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
          const now = performance.now();
          if (now - lastTap.current < 320) onChange(def.def);
          lastTap.current = now;
          drag.current = { x: e.clientX, y: e.clientY, t };
          setActive(true);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const delta = (e.clientX - d.x - (e.clientY - d.y)) / (e.shiftKey ? 700 : 170);
          onChange(fromNorm(def, d.t + delta));
        }}
        onPointerUp={() => {
          drag.current = null;
          setActive(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setActive(false);
        }}
        onWheel={(e) => nudge(e.deltaY < 0 ? 1 : -1)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') nudge(1);
          else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') nudge(-1);
          else return;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <path d={arc(c, c - 2.5, A0, A1)} className="trk" />
        {Math.abs(t - zero) > 0.004 ? <path d={arc(c, c - 2.5, Math.min(angle, A0 + zero * 270), Math.max(angle, A0 + zero * 270))} className="val" /> : null}
        <circle cx={c} cy={c} r={c - 6} className="cap" />
        <line x1={c} y1={c} x2={c + (c - 7) * Math.cos(((angle - 90) * Math.PI) / 180)} y2={c + (c - 7) * Math.sin(((angle - 90) * Math.PI) / 180)} className="ptr" />
      </svg>
      <span className="rk-kv">{formatParam(def, value)}</span>
    </div>
  );
}
