import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { href } from '../../app/router';
import { store, useStore, type SongIdea } from '../../app/store';
import { input } from '../../midi/input';
import { CHORD_TYPES, chordFormula, chordNotes, chordPcs, chordSymbol, chordToneLabel, detectChord, getChord } from '../../theory/chords';
import { CHORD_SCALES, DOMINANT_USTS, guideTones, tensionLabel } from '../../theory/chordScale';
import { mod, noteName, pc, pcName, spellPc } from '../../theory/core';
import { diatonicChords, keyFromName, keyName, prefersFlats, type Key } from '../../theory/keys';
import { PROGRESSIONS, PROG_GROUP_NAMES } from '../../theory/progressions';
import { SCALES, SCALE_BY_ID, degreeInScale, scaleNotes, scalePcs } from '../../theory/scales';
import { chordEvents, chordMidis, progressionEvents, resolveChord, scaleEvents, transposeSymbol, type CompStyle, ev } from '../../learn/music';
import { CHALLENGES } from '../../learn/challenges';
import { PART } from '../../audio/engine';
import { Keyboard, type KeyMark } from '../Keyboard';
import { ProgressionStrip, scheduleDrums } from '../ProgressionStrip';
import { playEvents, stopAll } from '../PlayButton';

const TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const STYLES: CompStyle[] = ['swing', 'funk', 'ballad', 'block', 'pulse'];

export function LabPage({ tab }: { tab?: string }) {
  const t = tab ?? 'progressions';
  return (
    <div className="page wide">
      <div className="row between">
        <h1>Lab</h1>
        <div className="seg">
          {[['progressions', 'Progression Lab'], ['changes', 'Changes Trainer'], ['explorer', 'Chord & Scale Explorer']].map(([id, label]) => (
            <a key={id} href={href(`lab/${id}`)}><button type="button" className={t === id ? 'on' : ''}>{label}</button></a>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        {t === 'progressions' && <ProgressionLab />}
        {t === 'changes' && <ChangesTrainer />}
        {t === 'explorer' && <Explorer />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progression Lab

interface LabInit {
  key: string;
  tokens: string[];
  bpm: number;
  style: CompStyle;
  beats: number;
}

function paletteFor(k: Key): { label: string; items: string[] }[] {
  const dia = diatonicChords(k, true).map((c) => c.numeral.replace(/♭/g, 'b').replace(/♯/g, '#'));
  const major = k.mode === 'major';
  return [
    { label: 'Diatonic', items: dia },
    { label: 'Secondary', items: major ? ['V7/ii', 'V7/iii', 'V7/IV', 'V7/V', 'V7/vi', 'I7'] : ['V7', 'V7b9', 'V7/iv', 'V7/bIII', 'V7/bVI'] },
    { label: 'Substitutes', items: major ? ['bII7', 'bVI7', 'bIII7', '#I°7', '#iv°7', 'iv7', 'bVII7', 'bVImaj7', 'bIIImaj7', 'iv6', 'iiø7'] : ['bII7', 'i6', 'i(maj7)', 'IV7', 'bIImaj7', 'vii°7', 'bVII7'] },
  ];
}

export function ProgressionLab({ initial, compact = false }: { initial?: LabInit; compact?: boolean }) {
  const [keyName_, setKeyName] = useState(initial?.key ?? 'C');
  const [tokens, setTokens] = useState<string[]>(initial?.tokens ?? ['ii7', 'V7', 'Imaj7', 'Imaj7']);
  const [bpm, setBpm] = useState(initial?.bpm ?? 110);
  const [style, setStyle] = useState<CompStyle>(initial?.style ?? 'swing');
  const [beats, setBeats] = useState(initial?.beats ?? 4);
  const [text, setText] = useState('');
  const [capture, setCapture] = useState(false);
  const [title, setTitle] = useState('');
  const ideas = useStore((d) => d.ideas);
  const k = keyFromName(keyName_);
  const tonic = keyName_.replace(/m$/, '');
  const mode = keyName_.endsWith('m') ? 'minor' : 'major';

  // MIDI chord capture: play a chord, release → appended as a symbol
  useEffect(() => {
    if (!capture) return;
    const held = new Set<number>();
    let maxSet = new Set<number>();
    return input.on((e) => {
      if (e.type === 'noteon') {
        held.add(e.note);
        for (const n of held) maxSet.add(n);
      } else if (e.type === 'noteoff') {
        held.delete(e.note);
        if (held.size === 0) {
          const d = maxSet.size >= 3 ? detectChord([...maxSet], prefersFlats(k) ? 'flat' : 'sharp') : null;
          if (d) setTokens((t) => [...t, d.name]);
          maxSet = new Set();
        }
      }
    });
  }, [capture, keyName_]); // eslint-disable-line react-hooks/exhaustive-deps

  const addText = () => {
    const parts = text.split(/[\s,|]+/).filter(Boolean);
    const ok = parts.filter((p) => resolveChord(p, k));
    if (ok.length) setTokens((t) => [...t, ...ok]);
    setText(parts.length !== ok.length ? parts.filter((p) => !resolveChord(p, k)).join(' ') : '');
  };

  const transpose = (semis: number) => {
    const newTonic = spellPc(pc(k.tonic) + semis, 'auto');
    const nk: Key = { tonic: newTonic, mode: k.mode };
    const flats = prefersFlats(nk) || noteName(newTonic).includes('♭');
    setTokens((ts) => ts.map((t) => (/^[A-G]/.test(t) ? transposeSymbol(t, semis, flats) : t)));
    setKeyName(noteName(newTonic).replace('♭', 'b').replace('♯', '#') + (k.mode === 'minor' ? 'm' : ''));
  };

  const audition = (i: number) => {
    const c = resolveChord(tokens[i], k);
    if (c) void playEvents(chordEvents(chordMidis(c.rootPc, c.typeId, c.bassPc), { dur: 1.4 }));
  };

  const saveIdea = () => {
    const idea: SongIdea = { id: String(Date.now()), title: title || `${keyName(k)} sketch`, key: keyName_, tokens, bpm, style, notes: '', createdAt: Date.now() };
    store.update((d) => {
      d.ideas = [idea, ...d.ideas].slice(0, 100);
    });
    setTitle('');
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1.6fr) minmax(0, 1fr)', alignItems: 'start' }}>
      <div className="card">
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="row">
            <select value={tonic} onChange={(e) => setKeyName(e.target.value + (mode === 'minor' ? 'm' : ''))} aria-label="Key">
              {TONICS.map((t) => <option key={t} value={t}>{t.replace('b', '♭').replace('#', '♯')}</option>)}
            </select>
            <select value={mode} onChange={(e) => setKeyName(tonic + (e.target.value === 'minor' ? 'm' : ''))} aria-label="Mode">
              <option value="major">major</option>
              <option value="minor">minor</option>
            </select>
            <button type="button" className="btn small" onClick={() => transpose(-1)} title="Transpose down">−½</button>
            <button type="button" className="btn small" onClick={() => transpose(1)} title="Transpose up">+½</button>
          </div>
          <div className="row">
            <select value={style} onChange={(e) => setStyle(e.target.value as CompStyle)} aria-label="Style">
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="small row" style={{ gap: 4 }}>BPM <input type="number" min={40} max={240} value={bpm} onChange={(e) => setBpm(Number(e.target.value) || 100)} style={{ width: 70 }} /></label>
            <label className="small row" style={{ gap: 4 }}>Beats/chord <input type="number" min={1} max={8} value={beats} onChange={(e) => setBeats(Number(e.target.value) || 4)} style={{ width: 56 }} /></label>
          </div>
        </div>
        <ProgressionStrip keyName={keyName_} tokens={tokens} bpm={bpm} style={style} beats={beats} drums onRemove={(i) => setTokens(tokens.filter((_, j) => j !== i))} onAudition={audition} caption="Click a chord to audition · × removes" />
        <div className="row" style={{ marginTop: 12 }}>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addText()} placeholder="Type: ii9 V13 Imaj9 · or Dm9 G13 Cmaj9 · or F/G" style={{ flex: 1, minWidth: 220 }} aria-label="Add chords" />
          <button type="button" className="btn small" onClick={addText}>Add</button>
          <button type="button" className={`btn small ${capture ? 'active' : ''}`} onClick={() => setCapture(!capture)}>{capture ? '● Capturing MIDI chords' : '○ Capture from MiniLab'}</button>
          <button type="button" className="btn small ghost" onClick={() => setTokens([])}>Clear</button>
        </div>
        <div className="col" style={{ marginTop: 12 }}>
          {paletteFor(k).map((g) => (
            <div key={g.label}>
              <div className="tiny faint" style={{ marginBottom: 4 }}>{g.label}</div>
              <div className="palette">
                {g.items.map((n) => {
                  const c = resolveChord(n, k);
                  if (!c) return null;
                  return (
                    <button key={n} type="button" className="btn" onClick={() => setTokens((t) => [...t, n])} onContextMenu={(e) => { e.preventDefault(); void playEvents(chordEvents(chordMidis(c.rootPc, c.typeId))); }}>
                      {n.replace(/b(?=[IV])/g, '♭').replace(/#(?=[IV])/g, '♯')}
                      <small>{c.symbol}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {!compact ? (
        <div className="col">
          <div className="card">
            <h3>Presets</h3>
            <select onChange={(e) => {
              const p = PROGRESSIONS.find((x) => x.id === e.target.value);
              if (p) {
                setKeyName(p.key);
                setTokens(p.chords);
                setStyle(p.group === 'funk' ? 'funk' : p.group === 'bach' ? 'block' : p.group === 'soul' ? 'ballad' : 'swing');
              }
              e.target.value = '';
            }} defaultValue="" aria-label="Load preset">
              <option value="" disabled>Load a progression…</option>
              {Object.entries(PROG_GROUP_NAMES).map(([g, name]) => (
                <optgroup key={g} label={name}>
                  {PROGRESSIONS.filter((p) => p.group === g).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
            <div className="tiny faint" style={{ marginTop: 8 }}>Right-click a palette chord to hear it without adding.</div>
          </div>
          <div className="card">
            <h3>Save sketch</h3>
            <div className="row">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ flex: 1 }} aria-label="Sketch title" />
              <button type="button" className="btn small primary" onClick={saveIdea} disabled={!tokens.length}>Save</button>
            </div>
            <div className="col" style={{ marginTop: 10 }}>
              {ideas.map((idea) => (
                <div key={idea.id} className="row between">
                  <button type="button" className="btn small ghost" onClick={() => { setKeyName(idea.key); setTokens(idea.tokens); setBpm(idea.bpm); }}>{idea.title}</button>
                  <span className="tiny faint">{idea.key} · {idea.tokens.length} chords</span>
                  <button type="button" className="btn small ghost" aria-label="Delete" onClick={() => store.update((d) => { d.ideas = d.ideas.filter((x) => x.id !== idea.id); })}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Changes Trainer: improvise over a loop, get chord-tone feedback

type NoteClass = 'chord' | 'tension' | 'out';

function classify(rootPc: number, typeId: string, keyScale: number[], p: number): NoteClass {
  const core = chordPcs(rootPc, typeId).slice(0, 4);
  if (core.includes(p)) return 'chord';
  const scale = CHORD_SCALES[typeId]?.[0]?.scale;
  const pcs = scale ? scalePcs(rootPc, scale) : keyScale;
  return pcs.includes(p) ? 'tension' : 'out';
}

export function ChangesTrainer({ initial }: { initial?: LabInit }) {
  const presets = useMemo(() => [
    ...CHALLENGES.filter((c) => c.tool === 'changes').map((c) => ({ id: `c:${c.id}`, name: c.title, key: c.key, tokens: c.tokens, bpm: c.bpm, style: c.style as CompStyle, beats: c.beats ?? 4 })),
    ...PROGRESSIONS.map((p) => ({ id: `p:${p.id}`, name: p.name, key: p.key, tokens: p.chords, bpm: p.group === 'funk' ? 96 : 120, style: (p.group === 'funk' ? 'funk' : p.group === 'soul' ? 'ballad' : p.group === 'bach' ? 'block' : 'swing') as CompStyle, beats: 4 })),
  ], []);
  const [cfg, setCfg] = useState<LabInit>(initial ?? { key: 'C', tokens: ['Dm7', 'G7', 'Cmaj7', 'A7'], bpm: 110, style: 'swing', beats: 4 });
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(0);
  const [played, setPlayed] = useState<{ note: number; cls: NoteClass }[]>([]);
  const [score, setScore] = useState({ downbeats: 0, hits: 0, chord: 0, tension: 0, out: 0 });
  const k = keyFromName(cfg.key);
  const keyScale = scalePcs(pc(k.tonic), k.mode === 'major' ? 'major' : 'minor');
  const chords = cfg.tokens.map((t) => resolveChord(t, k));
  const loopRef = useRef<{ start: number; times: number[]; duration: number } | null>(null);
  const raf = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  const schedule = async () => {
    const play = progressionEvents(k, cfg.tokens, { bpm: cfg.bpm, style: cfg.style, beats: cfg.beats });
    const start = await playEvents(play.events.map((e) => ({ ...e, vel: Math.round((e.vel ?? 90) * 0.75) })));
    scheduleDrums(start, play.duration, play.beat, cfg.style);
    loopRef.current = { start, times: play.times, duration: play.duration };
    timer.current = setTimeout(() => {
      if (runningRef.current) void schedule();
    }, play.duration * 1000 - 60);
  };

  const startLoop = async () => {
    await audio.init();
    runningRef.current = true;
    setRunning(true);
    setScore({ downbeats: 0, hits: 0, chord: 0, tension: 0, out: 0 });
    setPlayed([]);
    void schedule();
    const tick = () => {
      const l = loopRef.current;
      if (l) {
        const t = audio.now() - audio.latency() - l.start;
        let idx = 0;
        l.times.forEach((x, i) => {
          if (t >= x) idx = i;
        });
        setCurrent(idx);
      }
      if (runningRef.current) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    runningRef.current = false;
    setRunning(false);
    cancelAnimationFrame(raf.current);
    if (timer.current) clearTimeout(timer.current);
    stopAll();
  };
  useEffect(() => stopLoop, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return input.on((e) => {
      if (e.type !== 'noteon' || !runningRef.current || !loopRef.current) return;
      const l = loopRef.current;
      const t = audio.perfToCtx(e.time) - l.start;
      let idx = 0;
      l.times.forEach((x, i) => {
        if (t >= x - 0.12) idx = i;
      });
      const c = chords[idx];
      if (!c) return;
      const cls = classify(c.rootPc, c.typeId, keyScale, mod(e.note, 12));
      const nearDownbeat = Math.abs(t - l.times[idx]) < 0.15;
      setPlayed((p) => [...p.slice(-23), { note: e.note, cls }]);
      setScore((s) => ({
        downbeats: s.downbeats + (nearDownbeat ? 1 : 0),
        hits: s.hits + (nearDownbeat && cls === 'chord' ? 1 : 0),
        chord: s.chord + (cls === 'chord' ? 1 : 0),
        tension: s.tension + (cls === 'tension' ? 1 : 0),
        out: s.out + (cls === 'out' ? 1 : 0),
      }));
    });
  }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = chords[current];
  const nextC = chords[(current + 1) % chords.length];
  const marks: Record<number, KeyMark> = {};
  if (c) {
    const gt = guideTones(c.rootPc, c.typeId);
    for (let m = 48; m <= 84; m++) {
      const p = mod(m, 12);
      if (chordPcs(c.rootPc, c.typeId).slice(0, 4).includes(p)) marks[m] = { label: chordToneLabel(c.rootPc, c.typeId, p) ?? tensionLabel(c.rootPc, p), tone: gt.includes(p) ? 'root' : 'chord' };
    }
  }
  const totalNotes = score.chord + score.tension + score.out;

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', alignItems: 'start' }}>
      <div className="card">
        <div className="row between">
          <div>
            <div className="small muted">Now</div>
            <div className="big-chord">{c?.symbol ?? '—'}</div>
            <div className="small muted">Next: {nextC?.symbol}</div>
          </div>
          <div className="row">
            {running ? <button type="button" className="btn active" onClick={stopLoop}>■ Stop</button> : <button type="button" className="btn primary" onClick={() => void startLoop()}>▶ Start loop</button>}
          </div>
        </div>
        <div style={{ margin: '12px 0' }}>
          <Keyboard range={[48, 84]} marks={marks} held={input.heldNotes()} />
          <div className="tiny faint">Orange = guide tones (3rd/7th) · blue = root/5th of the current chord.</div>
        </div>
        <div className="notes-live" aria-live="polite">
          {played.map((p, i) => <span key={i} className={p.cls === 'chord' ? 'chord' : p.cls === 'tension' ? 'scale' : 'out'}>{pcName(p.note)}</span>)}
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h3>Score</h3>
          <div className="grid three" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat"><b>{score.downbeats ? Math.round((score.hits / score.downbeats) * 100) : 0}%</b><span className="small muted">chord tones on downbeats</span></div>
            <div className="stat"><b>{totalNotes ? Math.round(((score.chord + score.tension) / totalNotes) * 100) : 0}%</b><span className="small muted">inside</span></div>
            <div className="stat"><b>{totalNotes}</b><span className="small muted">notes</span></div>
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>Green = chord tone, blue = available tension, red = outside (fine as a passing/approach tone — but resolve it).</p>
        </div>
        <div className="card">
          <h3>Changes</h3>
          <select value="" onChange={(e) => {
            const p = presets.find((x) => x.id === e.target.value);
            if (p) {
              stopLoop();
              setCfg({ key: p.key, tokens: p.tokens, bpm: p.bpm, style: p.style, beats: p.beats });
            }
          }} aria-label="Load changes">
            <option value="" disabled>Load changes…</option>
            {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="prog-slots" style={{ marginTop: 10 }}>
            {chords.map((ch, i) => <div key={i} className={`prog-slot ${i === current && running ? 'playing' : ''}`}><div className="nm">{ch?.symbol}</div></div>)}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <label className="small row" style={{ gap: 4 }}>BPM <input type="number" value={cfg.bpm} min={40} max={260} onChange={(e) => setCfg({ ...cfg, bpm: Number(e.target.value) || 100 })} style={{ width: 70 }} /></label>
            <select value={cfg.style} onChange={(e) => setCfg({ ...cfg, style: e.target.value as CompStyle })} aria-label="Style">{STYLES.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Explorer

const EXPLORE_TYPES = CHORD_TYPES.filter((t) => t.family !== 'power');

function harmonize(rootPc: number, scaleId: string): string[] {
  const pcs = scalePcs(rootPc, scaleId);
  if (pcs.length !== 7) return [];
  return pcs.map((_, i) => {
    const stack = [0, 2, 4, 6].map((d) => pcs[(i + d) % 7]);
    const mids = stack.map((p, j) => 48 + p + (j > 0 && p <= stack[0] ? 12 : 0));
    let last = mids[0];
    const ordered = mids.map((m, j) => {
      if (j === 0) return m;
      let x = m;
      while (x <= last) x += 12;
      last = x;
      return x;
    });
    return detectChord(ordered, 'auto')?.name ?? '?';
  });
}

function Explorer() {
  const [root, setRoot] = useState(0);
  const [typeId, setTypeId] = useState('dom7');
  const [scaleId, setScaleId] = useState('lydian_dom');
  const rootNote = spellPc(root, 'auto');
  const notes = chordNotes(rootNote, typeId);
  const sym = chordSymbol(rootNote, typeId);
  const mids = chordMidis(root, typeId);
  const scaleNs = scaleNotes(rootNote, scaleId);
  const scale = SCALE_BY_ID[scaleId];
  const harmony = harmonize(root, scaleId);
  const isDom = ['dom7', 'dom9', 'dom13', '7b9', '7s9', '7s11', '7alt', '7b13', '13b9', 'aug7', '7b5', '7b9b13', '13s11'].includes(typeId);

  return (
    <div className="grid two" style={{ alignItems: 'start' }}>
      <div className="card">
        <h3>Chord</h3>
        <div className="row">
          <select value={root} onChange={(e) => setRoot(Number(e.target.value))} aria-label="Root">
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{pcName(i)}</option>)}
          </select>
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)} aria-label="Chord type">
            {EXPLORE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.symbol || 'maj'})</option>)}
          </select>
          <button type="button" className="btn small" onClick={() => void playEvents(chordEvents(mids, { dur: 2 }))}>▶ Chord</button>
          <button type="button" className="btn small" onClick={() => void playEvents(chordEvents(mids, { arp: true }))}>▶ Arp</button>
        </div>
        <div className="big-chord" style={{ marginTop: 10 }}>{sym}</div>
        <div className="muted">{notes.map(noteName).join(' · ')} — {chordFormula(typeId)}</div>
        <p className="small">{getChord(typeId).sound}</p>
        <Keyboard range={[36, 84]} marks={Object.fromEntries(mids.map((m) => [m, { label: chordToneLabel(root, typeId, mod(m, 12)) ?? tensionLabel(root, mod(m, 12)), tone: m === mids[0] ? 'root' as const : 'chord' as const }]))} />
        <h4 style={{ marginTop: 12 }}>Scale choices</h4>
        <div className="col">
          {(CHORD_SCALES[typeId] ?? []).map((c) => (
            <div key={c.scale} className="row between">
              <span><strong>{pcName(root)} {SCALE_BY_ID[c.scale].name}</strong> <span className="small muted">— {c.when}</span></span>
              <div className="row">
                <button type="button" className="btn small" onClick={() => setScaleId(c.scale)}>Show</button>
                <button type="button" className="btn small" onClick={() => void playEvents([...chordEvents(mids, { dur: 3.2 }), ...scaleEvents(55 + mod(root - 7, 12), c.scale, 'updown', 0.18).map((e) => ({ ...e, start: e.start + 0.3 }))])}>▶ Over chord</button>
              </div>
            </div>
          ))}
        </div>
        {isDom ? (
          <>
            <h4 style={{ marginTop: 12 }}>Upper structures over {pcName(root)}7</h4>
            <div className="palette">
              {DOMINANT_USTS.map((u) => {
                const tri = chordSymbol(spellPc(root + u.semis, 'flat'), u.quality === 'maj' ? 'maj' : 'min');
                return (
                  <button key={u.numeral} type="button" className="btn" onClick={() => {
                    const triad = chordMidis(mod(root + u.semis, 12), u.quality === 'maj' ? 'maj' : 'min').slice(1).map((m) => (m < 64 ? m + 12 : m));
                    void playEvents(chordEvents([36 + root, 48 + root + 4, 48 + root + 10, ...triad], { dur: 2.2 }));
                  }}>{tri}/{pcName(root)}7<small>{u.tensions}</small></button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
      <div className="card">
        <h3>Scale</h3>
        <div className="row">
          <select value={scaleId} onChange={(e) => setScaleId(e.target.value)} aria-label="Scale">
            {SCALES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="button" className="btn small" onClick={() => {
            const t = 55 + mod(root - 7, 12);
            const run = scaleEvents(t, scaleId, 'updown', 0.2);
            const end = run.reduce((m, e) => Math.max(m, e.start + e.dur), 0);
            void playEvents([...run, ev(t - 24, 0, end, 70, PART.bass)]);
          }}>▶ Over drone</button>
        </div>
        <div className="big-chord" style={{ marginTop: 10, fontSize: '1.6rem' }}>{pcName(root)} {scale.name}</div>
        <div className="muted">{scaleNs.map(noteName).join(' · ')} — {scale.formula}</div>
        <p className="small">{scale.character} {scale.usage}</p>
        <Keyboard range={[48, 84]} marks={Object.fromEntries(scaleEvents(48 + root, scaleId).map((e) => e.note).map((m) => [m, { label: mod(m - root, 12) === 0 ? 'R' : degreeInScale(root, scaleId, mod(m, 12)) ?? '', tone: mod(m - root, 12) === 0 ? 'root' as const : 'scale' as const }]))} />
        {harmony.length ? (
          <>
            <h4 style={{ marginTop: 12 }}>7th chords of the scale</h4>
            <div className="palette">
              {harmony.map((h, i) => (
                <button key={i} type="button" className="btn" onClick={() => {
                  const r = resolveChord(h, keyFromName('C'));
                  if (r) void playEvents(chordEvents(chordMidis(r.rootPc, r.typeId), { dur: 1.6 }));
                }}>{h}<small>{i + 1}</small></button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
