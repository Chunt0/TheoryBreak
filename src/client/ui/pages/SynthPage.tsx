import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { ALGORITHMS, getAlgorithm } from '../../audio/dx7/algorithms';
import {
  LFO_WAVE_NAMES,
  MOD_DESTS,
  MOD_SOURCES,
  SHAPE_NAMES,
  detuneText,
  initOperator,
  initPatch,
  modIndex,
  opFreqText,
  type LfoWave,
  type ModDest,
  type ModSlot,
  type ModSource,
  type OpShape,
  type Operator,
  type Patch,
} from '../../audio/dx7/patch';
import { PRESETS } from '../../audio/dx7/presets';
import { buildBank, parseSysex } from '../../audio/dx7/sysex';
import { lfoHz, pitchEgOctaves } from '../../audio/dx7/dsp';
import { useMini } from '../../app/createStore';
import { padHooks } from '../../app/live';
import { store, useStore } from '../../app/store';
import { editPatch, loadPatch, redo, selectOp, setSynthConfig, synth, undo } from '../../app/synthState';
import { TARGET_BY_ID } from '../../midi/mapping';
import { AlgorithmDiagram } from '../synth/AlgorithmDiagram';
import { EnvelopeEditor } from '../synth/EnvelopeEditor';
import { Knob } from '../synth/Knob';
import { ScalingEditor } from '../synth/ScalingEditor';
import { Scope } from '../synth/Scope';

type R4 = [number, number, number, number];

const OP_TABS = [{ id: 'env', label: 'Envelope' }, { id: 'freq', label: 'Frequency' }, { id: 'scale', label: 'Scaling' }] as const;
const SIDE_TABS = [
  { id: 'voices', label: 'Voices' },
  { id: 'lfo', label: 'LFO' },
  { id: 'peg', label: 'Pitch EG' },
  { id: 'play', label: 'Play' },
  { id: 'fx', label: 'FX' },
  { id: 'mod', label: 'Mod' },
] as const;

export function SynthPage() {
  const patch = useMini(synth, (s) => s.patch);
  const sel = useMini(synth, (s) => s.selectedOp);
  const config = useMini(synth, (s) => s.config);
  const canUndo = useMini(synth, (s) => s.past.length > 0);
  const canRedo = useMini(synth, (s) => s.future.length > 0);
  const learn = useMini(synth, (s) => s.learn);
  const userPatches = useStore((d) => d.synth.userPatches);
  const mappings = useStore((d) => d.synth.mappings);
  const [bank, setBank] = useState<Patch[]>([]);
  const [bankName, setBankName] = useState('');
  const [levels, setLevels] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [clip, setClip] = useState<Operator | null>(null);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const algo = getAlgorithm(patch.algorithm);
  const op = patch.ops[sel];
  const [opTab, setOpTab] = useState<'env' | 'freq' | 'scale'>('env');
  const [side, setSide] = useState<'voices' | 'lfo' | 'peg' | 'play' | 'fx' | 'mod'>('voices');
  const [peak, setPeak] = useState({ l: 0, r: 0 });
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [ab, setAb] = useState<{ a: Patch | null; b: Patch | null; active: 'a' | 'b' | null }>({ a: null, b: null, active: null });

  useEffect(() => audio.onStatus((s) => {
    setLevels(s[0]?.opLevels ?? [0, 0, 0, 0, 0, 0]);
    setPeak({ l: audio.peakL, r: audio.peakR });
  }), []);

  const allPatches = useMemo(() => [...PRESETS.map((p) => p.patch), ...userPatches, ...bank], [userPatches, bank]);
  useEffect(() => {
    const step = (d: number) => {
      const i = allPatches.findIndex((p) => p.name === synth.get().patch.name);
      const n = allPatches[(i + d + allPatches.length) % allPatches.length];
      if (n) loadPatch(structuredClone(n));
    };
    padHooks.prevPreset = () => step(-1);
    padHooks.nextPreset = () => step(1);
    return () => {
      padHooks.prevPreset = undefined;
      padHooks.nextPreset = undefined;
    };
  }, [allPatches]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setOp = (i: number, p: Partial<Operator>, key: string) => editPatch((x) => Object.assign(x.ops[i], p), `op${i}.${key}`);
  const learnable = (path: string) => (mappings.find((m) => m.target === path)?.control ?? '') || undefined;
  const setChorus = (p: Partial<Patch['fx']['chorus']>) => editPatch((x) => Object.assign(x.fx.chorus, p), 'fx.chorus');
  const setDelay = (p: Partial<Patch['fx']['delay']>) => editPatch((x) => Object.assign(x.fx.delay, p), 'fx.delay');
  const setDrive = (p: Partial<Patch['fx']['drive']>) => editPatch((x) => Object.assign(x.fx.drive, p), 'fx.drive');
  const setReverb = (p: Partial<Patch['fx']['reverb']>) => editPatch((x) => Object.assign(x.fx.reverb, p), 'fx.reverb');
  const setSlot = (i: number, p: Partial<ModSlot>) => editPatch((x) => Object.assign(x.modMatrix[i], p), `mod${i}`);
  const addSlot = () => editPatch((x) => { if (x.modMatrix.length < 8) x.modMatrix.push({ on: true, source: 'wheel', dest: 'op1Level', depth: 10 }); }, 'mod+');
  const removeSlot = (i: number) => editPatch((x) => { x.modMatrix.splice(i, 1); }, 'mod-');

  const abClick = (slot: 'a' | 'b') => {
    if (ab.active === slot || !ab[slot]) setAb((s) => ({ ...s, [slot]: structuredClone(patch), active: slot }));
    else {
      loadPatch(structuredClone(ab[slot]!));
      setAb((s) => ({ ...s, active: slot }));
    }
  };

  const categories = useMemo(() => ['All', ...Array.from(new Set(PRESETS.map((p) => p.category)))], []);
  const nameMatches = (n: string) => !search || n.toLowerCase().includes(search.toLowerCase());
  const shownPresets = PRESETS.filter((pr) => (cat === 'All' || pr.category === cat) && nameMatches(pr.patch.name));
  const shownUser = userPatches.filter((p) => nameMatches(p.name));
  const shownBank = bank.filter((p) => nameMatches(p.name));

  const onFile = async (f: File) => {
    const { patches, warnings } = parseSysex(new Uint8Array(await f.arrayBuffer()));
    setBank(patches);
    setBankName(f.name);
    setMsg(patches.length ? `Loaded ${patches.length} voices from ${f.name}${warnings.length ? ` (${warnings.join(' ')})` : ''}` : warnings.join(' '));
  };
  const download = (name: string, bytes: Uint8Array) => {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const carrierSel = algo.carriers.includes(sel + 1);
  const stepAlgo = (d: number) => editPatch((p) => { p.algorithm = ((p.algorithm - 1 + d + 32) % 32) + 1; }, 'algorithm');

  return (
    <div className="page wide dx dx-fit">
      <div className="dx-panel dx-head">
        <div className="row between">
          <div className="row">
            <span className="dx-title">DX7 Lab</span>
            <div className="lcd">
              <input value={patch.name} maxLength={10} onChange={(e) => editPatch((p) => { p.name = e.target.value.toUpperCase(); }, 'name')} aria-label="Patch name" />
            </div>
            <span className="small muted">ALG {patch.algorithm} · FB {patch.feedback}</span>
            {msg ? <span className="small muted dx-msg" title={msg}>{msg}</span> : null}
          </div>
          <div className="row">
            <button type="button" className="btn small" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">↶</button>
            <button type="button" className="btn small" onClick={redo} disabled={!canRedo} title="Redo (Shift+Ctrl/Cmd+Z)">↷</button>
            <button type="button" className="btn small" onClick={() => loadPatch(initPatch())}>Init voice</button>
            <button type="button" className="btn small" onClick={() => {
              store.update((d) => { d.synth.userPatches = [...d.synth.userPatches.filter((p) => p.name !== patch.name), structuredClone(patch)].slice(-64); });
              setMsg(`Saved "${patch.name}" to your bank`);
            }}>Save</button>
            <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>Load .syx</button>
            <button type="button" className="btn small" onClick={() => download('dx7-bank.syx', buildBank(userPatches.length ? userPatches : [patch], initPatch))}>Export bank</button>
            <div className="row" style={{ gap: 3 }} title={`Output peak — L ${Math.round(peak.l * 100)}% / R ${Math.round(peak.r * 100)}%`}>
              <span className="tiny faint">Out</span>
              <div className="meter" style={{ width: 30 }}><i style={{ width: `${Math.min(100, peak.l * 100)}%`, background: peak.l >= 0.98 ? 'var(--bad)' : undefined }} /></div>
              <div className="meter" style={{ width: 30 }}><i style={{ width: `${Math.min(100, peak.r * 100)}%`, background: peak.r >= 0.98 ? 'var(--bad)' : undefined }} /></div>
            </div>
            <button type="button" className="btn small" onClick={() => audio.panic()} title="All sound off">Panic</button>
            <input ref={fileRef} type="file" accept=".syx,application/octet-stream" hidden onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
          </div>
        </div>
        <div className="dx-stripe" />
        {learn ? <div className="banner" style={{ marginTop: 8 }}>MIDI learn: move a knob or fader on the MiniLab to assign <strong>&nbsp;{TARGET_BY_ID[learn]?.label ?? learn}</strong>. <button type="button" className="btn small" onClick={() => synth.set((s) => ({ ...s, learn: null }))}>Cancel</button></div> : null}
      </div>

      <div className="dx-body">
        {/* left: the algorithm and the voice's global settings */}
        <div className="dx-col">
          <div className="dx-panel algo">
            <div className="row between">
              <span className="dx-title">Algorithm {patch.algorithm}</span>
              <span className="row dx-algo-step">
                <button type="button" className="btn small" onClick={() => stepAlgo(-1)} aria-label="Previous algorithm">‹</button>
                <button type="button" className="btn small" popoverTarget="dx-algos" title="All 32 algorithms">All 32</button>
                <button type="button" className="btn small" onClick={() => stepAlgo(1)} aria-label="Next algorithm">›</button>
              </span>
            </div>
            <AlgorithmDiagram algorithm={patch.algorithm} selected={sel} enabled={patch.ops.map((o) => o.enabled)} levels={levels} onSelect={selectOp} />
            <div className="tiny faint">{algo.carriers.length} carrier{algo.carriers.length > 1 ? 's' : ''} (heard) · the rest modulate</div>
            <div className="knob-row" style={{ marginTop: 8 }}>
              <Knob label="Feedback" value={patch.feedback} min={0} max={7} dflt={0} onChange={(v) => editPatch((p) => { p.feedback = v; }, 'feedback')} learn="feedback" />
              <Knob label="Transpose" value={patch.transpose} min={0} max={48} dflt={24} format={(v) => (v === 24 ? '0' : v > 24 ? `+${v - 24}` : String(v - 24))} onChange={(v) => editPatch((p) => { p.transpose = v; }, 'transpose')} learn="transpose" />
              <label className="small row" style={{ gap: 6 }}>
                <input type="checkbox" checked={patch.oscSync} onChange={(e) => editPatch((p) => { p.oscSync = e.target.checked; })} /> Osc key sync
              </label>
            </div>
          </div>
          <div id="dx-algos" popover="auto" className="dx dx-panel dx-algos">
            <div className="algo-pick">
              {ALGORITHMS.map((a) => (
                <button key={a.id} type="button" className={a.id === patch.algorithm ? 'on' : ''} onClick={() => editPatch((p) => { p.algorithm = a.id; }, 'algorithm')} title={`Algorithm ${a.id}`}>
                  <AlgorithmDiagram algorithm={a.id} small />
                  {a.id}
                </button>
              ))}
            </div>
          </div>
          <div className="dx-panel dx-scope"><Scope /></div>
        </div>

        {/* middle: the six operators and the selected one */}
        <div className="dx-col">
          <div className="ops">
            {patch.ops.map((o, i) => {
              const carrier = algo.carriers.includes(i + 1);
              return (
                <div key={i} className={`op ${sel === i ? 'sel' : ''} ${o.enabled ? '' : 'off'}`} onClick={() => selectOp(i)} title={carrier ? 'Carrier: heard directly' : `Modulator: index ≈ ${modIndex(o.outputLevel).toFixed(2)} rad`}>
                  <div className="op-head">
                    <span className="op-num">OP{i + 1}</span>
                    <span className={`op-role ${carrier ? 'c' : 'm'}`}>{carrier ? 'CAR' : 'MOD'}</span>
                  </div>
                  <div className="op-ratio">{opFreqText(o)}</div>
                  <div className="op-meter"><i style={{ width: `${Math.round((levels[i] ?? 0) * 100)}%` }} /></div>
                  <div className="row between">
                    <Knob label={carrier ? 'Level' : 'Mod'} value={o.outputLevel} min={0} max={99} dflt={carrier ? 99 : 0} size={32} onChange={(v) => setOp(i, { outputLevel: v }, 'ol')} learn={`ops.${i}.outputLevel`} title={learnable(`ops.${i}.outputLevel`) ? `Mapped to ${learnable(`ops.${i}.outputLevel`)}` : undefined} />
                    <button type="button" className="btn small" onClick={(e) => { e.stopPropagation(); setOp(i, { enabled: !o.enabled }, 'en'); }} aria-pressed={o.enabled}>{o.enabled ? 'On' : 'Off'}</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dx-panel dx-op">
            <div className="row between">
              <span className="dx-title">OP{sel + 1} · {carrierSel ? 'carrier' : 'modulator'}</span>
              <div className="seg dx-tabs" role="tablist" aria-label="Operator page">
                {OP_TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={opTab === t.id} className={opTab === t.id ? 'on' : ''} onClick={() => setOpTab(t.id)}>{t.label}</button>)}
              </div>
              <div className="row">
                <button type="button" className="btn small" onClick={() => setClip(structuredClone(op))}>Copy</button>
                <button type="button" className="btn small" disabled={!clip} onClick={() => clip && setOp(sel, { ...clip }, 'paste')}>Paste</button>
                <button type="button" className="btn small" onClick={() => setOp(sel, initOperator(carrierSel), 'reset')}>Reset</button>
              </div>
            </div>
            {opTab === 'env' ? (
              <div className="dx-tab">
                <div className="tiny faint">Envelope (drag points: ↕ level, ↔ time)</div>
                <EnvelopeEditor kind="amp" rates={op.rates} levels={op.levels} onChange={(r: R4, l: R4) => setOp(sel, { rates: r, levels: l }, 'eg')} height={84} />
                <div className="knob-row" style={{ marginTop: 6 }}>
                  {[0, 1, 2, 3].map((k) => <Knob key={`r${k}`} size={34} label={`R${k + 1}`} value={op.rates[k]} min={0} max={99} onChange={(v) => { const r = [...op.rates] as R4; r[k] = v; setOp(sel, { rates: r }, `r${k}`); }} learn={k === 0 ? 'sel.rates.0' : k === 1 ? 'sel.rates.1' : k === 3 ? 'sel.rates.3' : undefined} />)}
                  {[0, 1, 2, 3].map((k) => <Knob key={`l${k}`} size={34} label={`L${k + 1}`} value={op.levels[k]} min={0} max={99} onChange={(v) => { const l = [...op.levels] as R4; l[k] = v; setOp(sel, { levels: l }, `l${k}`); }} learn={k === 2 ? 'sel.levels.2' : undefined} />)}
                </div>
              </div>
            ) : opTab === 'freq' ? (
              <div className="dx-tab">
                <div className="knob-row">
                  <div className="seg"><button type="button" className={op.oscMode === 0 ? 'on' : ''} onClick={() => setOp(sel, { oscMode: 0 }, 'mode')}>Ratio</button><button type="button" className={op.oscMode === 1 ? 'on' : ''} onClick={() => setOp(sel, { oscMode: 1 }, 'mode')}>Fixed</button></div>
                  <Knob label="Coarse" value={op.coarse} min={0} max={31} dflt={1} onChange={(v) => setOp(sel, { coarse: v }, 'coarse')} learn="sel.coarse" />
                  <Knob label="Fine" value={op.fine} min={0} max={99} dflt={0} onChange={(v) => setOp(sel, { fine: v }, 'fine')} learn="sel.fine" />
                  <Knob label="Detune" value={op.detune} min={0} max={14} dflt={7} format={detuneText} onChange={(v) => setOp(sel, { detune: v }, 'detune')} learn="sel.detune" />
                  <div className="lcd">{opFreqText(op)}</div>
                </div>
                <div className="seg" style={{ marginTop: 6, flexWrap: 'wrap' }} title="Oscillator shape — Sine is the original DX7 behaviour">
                  {SHAPE_NAMES.map((n, i) => <button key={n} type="button" className={op.shape === i ? 'on' : ''} onClick={() => setOp(sel, { shape: i as OpShape }, 'shape')}>{n}</button>)}
                </div>
                <div className="tiny faint">Integer ratios → harmonic tones; non-integer (e.g. 3.50) → bells and metal.</div>
                <div className="tiny faint" style={{ marginTop: 10 }}>Sensitivity</div>
                <div className="knob-row">
                  <Knob label="Velocity" value={op.velocitySens} min={0} max={7} dflt={0} onChange={(v) => setOp(sel, { velocitySens: v }, 'kvs')} learn="sel.velocitySens" />
                  <Knob label="Amp mod" value={op.ampModSens} min={0} max={3} dflt={0} onChange={(v) => setOp(sel, { ampModSens: v }, 'ams')} />
                  <Knob label="Rate scale" value={op.rateScaling} min={0} max={7} dflt={0} onChange={(v) => setOp(sel, { rateScaling: v }, 'rs')} />
                </div>
              </div>
            ) : (
              <div className="dx-tab">
                <div className="tiny faint">Keyboard level scaling (drag to move the breakpoint)</div>
                <ScalingEditor op={op} onChange={(p) => setOp(sel, p, 'ks')} />
                <div className="knob-row" style={{ marginTop: 6 }}>
                  <Knob label="L depth" value={op.leftDepth} min={0} max={99} dflt={0} onChange={(v) => setOp(sel, { leftDepth: v }, 'ld')} />
                  <Knob label="R depth" value={op.rightDepth} min={0} max={99} dflt={0} onChange={(v) => setOp(sel, { rightDepth: v }, 'rd')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* right: voices, then the voice-wide pages */}
        <div className="dx-col">
          <div className="dx-panel dx-side">
            <div className="seg dx-tabs" role="tablist" aria-label="Voice page">
              {SIDE_TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={side === t.id} className={side === t.id ? 'on' : ''} onClick={() => setSide(t.id)}>{t.label}</button>)}
            </div>
            {side === 'voices' ? (
              <div className="dx-tab" style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0, flex: 1 }}>
                <div className="row" style={{ gap: 6 }}>
                  <input className="lcd" style={{ flex: 1 }} placeholder="Search patches…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  <div className="row" style={{ gap: 2 }} title="A/B compare: click an empty slot to store the current patch, click the other slot to recall it, click the active slot again to re-store your edits">
                    <button type="button" className={`btn small ${ab.active === 'a' ? 'on' : ''}`} onClick={() => abClick('a')}>A</button>
                    <button type="button" className={`btn small ${ab.active === 'b' ? 'on' : ''}`} onClick={() => abClick('b')}>B</button>
                  </div>
                </div>
                <div className="seg" style={{ flexWrap: 'wrap' }}>
                  {categories.map((c) => <button key={c} type="button" className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}
                </div>
                <div className="patch-list">
                  {shownPresets.map((pr) => (
                    <div key={pr.patch.name} className={`patch-item ${patch.name === pr.patch.name ? 'on' : ''}`} onClick={() => { loadPatch(structuredClone(pr.patch)); setMsg(pr.notes); }}>
                      <span>{pr.patch.name}</span><span className="tiny faint">{pr.category}</span>
                    </div>
                  ))}
                  {shownUser.length ? <div className="tiny faint" style={{ marginTop: 6 }}>Your bank</div> : null}
                  {shownUser.map((p) => {
                    const i = userPatches.indexOf(p);
                    return (
                      <div key={`u${i}`} className={`patch-item ${patch.name === p.name ? 'on' : ''}`} onClick={() => loadPatch(structuredClone(p))}>
                        <span>{p.name}</span>
                        <button type="button" className="btn small ghost" onClick={(e) => { e.stopPropagation(); store.update((d) => { d.synth.userPatches = d.synth.userPatches.filter((_, j) => j !== i); }); }}>×</button>
                      </div>
                    );
                  })}
                  {shownBank.length ? <div className="tiny faint" style={{ marginTop: 6 }}>{bankName}</div> : null}
                  {shownBank.map((p) => {
                    const i = bank.indexOf(p);
                    return <div key={`b${i}`} className={`patch-item ${patch.name === p.name ? 'on' : ''}`} onClick={() => loadPatch(structuredClone(p))}><span>{String(i + 1).padStart(2, '0')} {p.name}</span></div>;
                  })}
                  {!shownPresets.length && !shownUser.length && !shownBank.length ? <div className="tiny faint" style={{ padding: 6 }}>No patches match "{search}".</div> : null}
                </div>
              </div>
            ) : side === 'lfo' ? (
              <div className="dx-tab">
                <div className="seg" style={{ margin: '4px 0 8px', flexWrap: 'wrap' }}>
                  {LFO_WAVE_NAMES.map((n, i) => <button key={n} type="button" className={patch.lfo.wave === i ? 'on' : ''} onClick={() => editPatch((p) => { p.lfo.wave = i as LfoWave; }, 'lfo.wave')}>{n}</button>)}
                </div>
                <div className="knob-row">
                  <Knob label="Speed" value={patch.lfo.speed} min={0} max={99} dflt={35} format={(v) => `${lfoHz(v).toFixed(1)}Hz`} onChange={(v) => editPatch((p) => { p.lfo.speed = v; }, 'lfo.speed')} learn="lfo.speed" />
                  <Knob label="Delay" value={patch.lfo.delay} min={0} max={99} dflt={0} onChange={(v) => editPatch((p) => { p.lfo.delay = v; }, 'lfo.delay')} />
                  <Knob label="Pitch depth" value={patch.lfo.pmd} min={0} max={99} dflt={0} onChange={(v) => editPatch((p) => { p.lfo.pmd = v; }, 'lfo.pmd')} learn="lfo.pmd" />
                  <Knob label="Amp depth" value={patch.lfo.amd} min={0} max={99} dflt={0} onChange={(v) => editPatch((p) => { p.lfo.amd = v; }, 'lfo.amd')} learn="lfo.amd" />
                  <Knob label="Pitch sens" value={patch.pitchModSens} min={0} max={7} dflt={3} onChange={(v) => editPatch((p) => { p.pitchModSens = v; }, 'pms')} />
                </div>
                <label className="small row" style={{ gap: 6, marginTop: 6 }}><input type="checkbox" checked={patch.lfo.sync} onChange={(e) => editPatch((p) => { p.lfo.sync = e.target.checked; })} /> Key sync</label>
              </div>
            ) : side === 'peg' ? (
              <div className="dx-tab">
                <div className="tiny faint">50 = no shift · {(pitchEgOctaves(patch.pitchEg.levels[0]) * 12).toFixed(1)} st at L1</div>
                <EnvelopeEditor kind="pitch" rates={patch.pitchEg.rates} levels={patch.pitchEg.levels} onChange={(r, l) => editPatch((p) => { p.pitchEg.rates = r; p.pitchEg.levels = l; }, 'peg')} height={90} />
              </div>
            ) : side === 'play' ? (
              <div className="dx-tab">
                <div className="seg" style={{ marginBottom: 8 }}><button type="button" className={!config.mono ? 'on' : ''} onClick={() => setSynthConfig({ mono: false })}>Poly</button><button type="button" className={config.mono ? 'on' : ''} onClick={() => setSynthConfig({ mono: true })}>Mono</button></div>
                <div className="knob-row">
                  <Knob label="Voices" value={config.polyphony} min={1} max={16} dflt={16} onChange={(v) => setSynthConfig({ polyphony: v })} />
                  <Knob label="Bend range" value={config.pbRange} min={0} max={12} dflt={2} onChange={(v) => setSynthConfig({ pbRange: v })} />
                  <Knob label="Portamento" value={config.portaTime} min={0} max={99} dflt={0} onChange={(v) => setSynthConfig({ portaTime: v })} />
                  <Knob label="Wheel range" value={config.wheel.range} min={0} max={99} dflt={50} onChange={(v) => setSynthConfig({ wheel: { ...config.wheel, range: v } })} />
                </div>
                <div className="row" style={{ marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="tiny faint">Mod strip →</span>
                  {(['pitch', 'amp', 'eg'] as const).map((k) => (
                    <label key={k} className="small row" style={{ gap: 4 }}><input type="checkbox" checked={config.wheel[k]} onChange={(e) => setSynthConfig({ wheel: { ...config.wheel, [k]: e.target.checked } })} /> {k === 'eg' ? 'EG bias' : k}</label>
                  ))}
                </div>
                <div className="tiny faint" style={{ marginTop: 10 }}>Unison — stacks detuned/panned copies of each note</div>
                <div className="knob-row">
                  <Knob label="Voices" value={patch.unison.voices} min={1} max={8} dflt={1} onChange={(v) => editPatch((p) => { p.unison.voices = v; }, 'unison.voices')} />
                  <Knob label="Detune" value={patch.unison.detune} min={0} max={99} dflt={20} onChange={(v) => editPatch((p) => { p.unison.detune = v; }, 'unison.detune')} />
                  <Knob label="Spread" value={patch.unison.spread} min={0} max={99} dflt={50} onChange={(v) => editPatch((p) => { p.unison.spread = v; }, 'unison.spread')} />
                </div>
                <p className="tiny faint" style={{ marginTop: 10 }}>
                  MiniLab 3: knobs 1–6 = OP1–6 level, 7 = feedback, 8 = algorithm; faders = selected op coarse / fine / attack / release; pads 1–6 select an operator, 7/8 change voice. Right-click any knob to MIDI-learn.
                </p>
              </div>
            ) : side === 'fx' ? (
              <div className="dx-tab" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto' }}>
                <div>
                  <div className="row between">
                    <span className="tiny faint">Chorus</span>
                    <div className="seg"><button type="button" className={!patch.fx.chorus.on ? 'on' : ''} onClick={() => setChorus({ on: false })}>Off</button><button type="button" className={patch.fx.chorus.on ? 'on' : ''} onClick={() => setChorus({ on: true })}>On</button></div>
                  </div>
                  <div className="knob-row">
                    <Knob label="Rate" value={patch.fx.chorus.rate} min={0} max={99} dflt={40} onChange={(v) => setChorus({ rate: v })} />
                    <Knob label="Depth" value={patch.fx.chorus.depth} min={0} max={99} dflt={30} onChange={(v) => setChorus({ depth: v })} />
                    <Knob label="Mix" value={patch.fx.chorus.mix} min={0} max={99} dflt={35} onChange={(v) => setChorus({ mix: v })} learn="fx.chorus.mix" />
                  </div>
                </div>
                <div>
                  <div className="row between">
                    <span className="tiny faint">Delay</span>
                    <div className="seg"><button type="button" className={!patch.fx.delay.on ? 'on' : ''} onClick={() => setDelay({ on: false })}>Off</button><button type="button" className={patch.fx.delay.on ? 'on' : ''} onClick={() => setDelay({ on: true })}>On</button></div>
                  </div>
                  <div className="knob-row">
                    <Knob label="Time" value={patch.fx.delay.time} min={0} max={99} dflt={30} onChange={(v) => setDelay({ time: v })} />
                    <Knob label="Feedback" value={patch.fx.delay.feedback} min={0} max={99} dflt={35} onChange={(v) => setDelay({ feedback: v })} />
                    <Knob label="Mix" value={patch.fx.delay.mix} min={0} max={99} dflt={25} onChange={(v) => setDelay({ mix: v })} learn="fx.delay.mix" />
                  </div>
                  <label className="small row" style={{ gap: 6, marginTop: 6 }}><input type="checkbox" checked={patch.fx.delay.sync} onChange={(e) => setDelay({ sync: e.target.checked })} /> Sync (quantize time to even steps)</label>
                </div>
                <div>
                  <div className="row between">
                    <span className="tiny faint">Drive</span>
                    <div className="seg"><button type="button" className={!patch.fx.drive.on ? 'on' : ''} onClick={() => setDrive({ on: false })}>Off</button><button type="button" className={patch.fx.drive.on ? 'on' : ''} onClick={() => setDrive({ on: true })}>On</button></div>
                  </div>
                  <div className="knob-row">
                    <Knob label="Amount" value={patch.fx.drive.amount} min={0} max={99} dflt={20} onChange={(v) => setDrive({ amount: v })} />
                    <Knob label="Tone" value={patch.fx.drive.tone} min={0} max={99} dflt={50} onChange={(v) => setDrive({ tone: v })} />
                    <Knob label="Mix" value={patch.fx.drive.mix} min={0} max={99} dflt={100} onChange={(v) => setDrive({ mix: v })} learn="fx.drive.mix" />
                  </div>
                </div>
                <div>
                  <div className="row between">
                    <span className="tiny faint">Reverb2</span>
                    <div className="seg"><button type="button" className={!patch.fx.reverb.on ? 'on' : ''} onClick={() => setReverb({ on: false })}>Off</button><button type="button" className={patch.fx.reverb.on ? 'on' : ''} onClick={() => setReverb({ on: true })}>On</button></div>
                  </div>
                  <div className="knob-row">
                    <Knob label="Size" value={patch.fx.reverb.size} min={0} max={99} dflt={50} onChange={(v) => setReverb({ size: v })} />
                    <Knob label="Damp" value={patch.fx.reverb.damp} min={0} max={99} dflt={40} onChange={(v) => setReverb({ damp: v })} />
                    <Knob label="Mix" value={patch.fx.reverb.mix} min={0} max={99} dflt={25} onChange={(v) => setReverb({ mix: v })} learn="fx.reverb.mix" />
                  </div>
                </div>
                <div className="tiny faint">Chorus → Delay → Drive → Reverb2, per patch, upstream of the master reverb/compressor.</div>
              </div>
            ) : (
              <div className="dx-tab" style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                <div>
                  <div className="tiny faint">Macros — user knobs, patched in below</div>
                  <div className="knob-row">
                    {([0, 1, 2, 3] as const).map((i) => (
                      <Knob key={i} label={`Macro ${i + 1}`} value={patch.macros[i]} min={0} max={99} dflt={0} onChange={(v) => editPatch((p) => { p.macros[i] = v; }, `macro${i}`)} learn={`macros.${i}`} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0, flex: 1, overflowY: 'auto' }}>
                  <div className="row between">
                    <span className="tiny faint">Mod matrix</span>
                    <button type="button" className="btn small" disabled={patch.modMatrix.length >= 8} onClick={addSlot}>+ Add routing</button>
                  </div>
                  {patch.modMatrix.length === 0 ? <div className="tiny faint">No routings yet — add one to patch a source (wheel, velocity, a macro…) onto a destination (an operator's level or pitch, feedback, pan).</div> : null}
                  {patch.modMatrix.map((slot, i) => (
                    <div key={i} className="row" style={{ gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="checkbox" checked={slot.on} onChange={(e) => setSlot(i, { on: e.target.checked })} aria-label={`Routing ${i + 1} on`} />
                      <select value={slot.source} onChange={(e) => setSlot(i, { source: e.target.value as ModSource })} aria-label={`Routing ${i + 1} source`}>
                        {MOD_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                      <span className="tiny faint">→</span>
                      <select value={slot.dest} onChange={(e) => setSlot(i, { dest: e.target.value as ModDest })} aria-label={`Routing ${i + 1} destination`}>
                        {MOD_DESTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                      </select>
                      <Knob size={28} label="Depth" value={slot.depth} min={-99} max={99} dflt={0} onChange={(v) => setSlot(i, { depth: v })} />
                      <button type="button" className="btn small ghost" onClick={() => removeSlot(i)} aria-label={`Remove routing ${i + 1}`}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
