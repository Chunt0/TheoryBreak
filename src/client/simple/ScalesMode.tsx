import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChordScaleMode, type CsTask } from './ChordScaleMode';
import { useStore } from '../app/store';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { mod, noteName, transpose } from '../theory/core';
import { getScale, scaleNotes, scaleSemis } from '../theory/scales';
import type { KeyMark } from '../ui/Keyboard';
import { degreeLine, type Dir, type Pattern } from './logic';
import type { Help } from './Lessons';
import { Bar, Chips, K, Listen, Pick, playLine, rootByPc, rootMidi, savePref, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';

const SCALE_GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Major & minor', ids: ['major', 'minor', 'harmonic_minor', 'melodic_minor'] },
  { title: 'Modes', ids: ['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'] },
  { title: 'Jazz', ids: ['lydian_dom', 'altered', 'dim_hw', 'whole_tone', 'bebop_dom'] },
  { title: 'Pentatonic & blues', ids: ['major_pent', 'minor_pent', 'blues'] },
];
/** The lessons behind each scale, most relevant first. */
const SCALE_TOPICS: Record<string, string[]> = {
  melodic_minor: ['core.melodic', 'core.chordscale'],
  lydian_dom: ['core.melodic', 'core.chordscale'],
  altered: ['core.melodic', 'core.chordscale', 'core.tensions'],
  dim_hw: ['core.symmetric', 'core.chordscale'],
  whole_tone: ['core.symmetric', 'core.chordscale'],
  bebop_dom: ['jazz.bebop', 'core.chordscale'],
  minor_pent: ['funk.harmony', 'jazz.blues'],
  blues: ['jazz.blues', 'funk.harmony'],
};
const scaleHelp = (id: string): Help => ({
  topics: [...(SCALE_TOPICS[id] ?? []), 'core.modes', 'core.chordscale'].filter((t, i, a) => a.indexOf(t) === i),
  method: [
    'Say the formula before you play (Dorian: 1 2 ♭3 4 5 6 ♭7) and spell it from the root: one letter per degree.',
    'Patterns: in 3rds, play each degree and the one a 3rd above, then step on; groups of four run 1-2-3-4, 2-3-4-5…',
    'Clean before fast: only runs with no wrong notes set a record. Raise the tempo once a key is clean.',
  ],
});

const SHORT: Record<string, string> = {
  major: 'Major', minor: 'Natural minor', harmonic_minor: 'Harmonic minor', melodic_minor: 'Melodic minor',
  dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian', mixolydian: 'Mixolydian', locrian: 'Locrian',
  lydian_dom: 'Lydian ♭7', altered: 'Altered', dim_hw: 'Half-whole dim', whole_tone: 'Whole tone', bebop_dom: 'Bebop dom.',
  major_pent: 'Major pent.', minor_pent: 'Minor pent.', blues: 'Blues',
};
const TITLE: Record<string, string> = {
  major: 'major', minor: 'natural minor', harmonic_minor: 'harmonic minor', melodic_minor: 'melodic minor',
  lydian_dom: 'Lydian dominant', altered: 'altered', dim_hw: 'half-whole diminished', whole_tone: 'whole tone', bebop_dom: 'bebop dominant',
  major_pent: 'major pentatonic', minor_pent: 'minor pentatonic', blues: 'blues scale',
};
// diatonic modes: degree of the parent major scale they start on
const MODE_DEGREE: Record<string, number> = { major: 1, dorian: 2, phrygian: 3, lydian: 4, mixolydian: 5, minor: 6, locrian: 7 };
const MAJOR_STEPS = ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'];

type Guide = 'show' | 'memory';
type Clock = 'free' | 'metro';
const GUIDES: Choice<Guide>[] = [{ id: 'show', label: 'Notes shown' }, { id: 'memory', label: 'From memory' }];
const DIRS: Choice<Dir>[] = [{ id: 'up', label: '↑ Up' }, { id: 'down', label: '↓ Down' }, { id: 'updown', label: '↕ Up & down' }];
const PATTERNS: Choice<Pattern>[] = [
  { id: 'straight', label: 'Straight' },
  { id: 'thirds', label: 'In 3rds' },
  { id: 'fourths', label: 'In 4ths' },
  { id: 'fours', label: 'Groups of 4' },
  { id: 'triads', label: 'Triads 1-3-5' },
  { id: 'sevenths', label: '7ths 1-3-5-7' },
];
const OCTAVES: Choice<'1' | '2'>[] = [{ id: '1', label: '1 octave' }, { id: '2', label: '2 octaves' }];
// timing and notes per click share one pill, so the options row stays one row
type Timing = 'free' | 'metro1' | 'metro2';
const TIMINGS: Choice<Timing>[] = [
  { id: 'free', label: 'Free time' },
  { id: 'metro1', label: 'Click ♩', title: 'Metronome, one note per click' },
  { id: 'metro2', label: 'Click ♫', title: 'Metronome, two notes per click' },
];
const scaleLabel = (id: string) => (TITLE[id] ? TITLE[id][0].toUpperCase() + TITLE[id].slice(1) : SHORT[id]);
const SCALE_CHOICES = SCALE_GROUPS.map((g) => ({ title: g.title, options: g.ids.map((id) => ({ id, label: scaleLabel(id) })) }));
// circle of fifths order, for the key strip and "next key"
const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

interface Run {
  idx: number;
  misses: number;
  started: number | null;
  finished: number | null;
  /** metronome runs: audio time of the first expected note, and each note's offset in ms */
  t0: number | null;
  offsets: number[];
}
const freshRun = (): Run => ({ idx: 0, misses: 0, started: null, finished: null, t0: null, offsets: [] });

interface KeyRecord {
  /** best clean time in free time, seconds */
  t?: number;
  /** fastest clean, in-time metronome run */
  bpm?: number;
}

type Task = 'run' | CsTask;
const TASKS: Choice<Task>[] = [
  { id: 'run', label: 'Run it', title: 'Run a scale through patterns, against the clock or a metronome' },
  { id: 'name', label: 'Chord → scale', title: 'Name the scale a chord takes where it stands' },
  { id: 'play', label: 'Over the chord', title: 'Play the chord\'s scale with the chord held underneath' },
];

/** Run scales, or chord–scale: which scale a chord takes, and playing it over the chord. */
export function ScalesMode() {
  const [task, setTask] = usePref<Task>('scale.task', 'run');
  const chips = <Chips label="Task" value={task} options={TASKS} onChange={setTask} />;
  return task === 'run' ? <ScaleRun taskChips={chips} /> : <ChordScaleMode key={task} task={task} taskChips={chips} />;
}

function ScaleRun({ taskChips }: { taskChips: ReactNode }) {
  useModeCleanup();
  const [rootPc, setRootPc] = usePref('scale.root', 0);
  const [scaleId, setScaleId] = usePref('scale.id', 'major');
  const [guide, setGuide] = usePref<Guide>('scale.guide', 'show');
  const [dir, setDir] = usePref<Dir>('scale.dir', 'up');
  const [pattern, setPattern] = usePref<Pattern>('scale.pattern', 'straight');
  const [octs, setOcts] = usePref<'1' | '2'>('scale.octaves', '1');
  const [clock, setClock] = usePref<Clock>('scale.clock', 'free');
  const [bpm, setBpm] = usePref('scale.bpm', 72);
  const [sub, setSub] = usePref<'1' | '2'>('scale.sub', '2');
  const [run, setRun] = useState<Run>(freshRun);
  const [wrong, flash] = useFlash();
  const [peek, setPeek] = useState(false);
  const [note, setNote] = useState('');

  const root = rootByPc(rootPc);
  const scale = getScale(scaleId);
  const n = scale.intervals.length;
  const spelled = useMemo(() => scaleNotes(root, scaleId), [root, scaleId]);
  const semis = scaleSemis(scaleId);
  const degrees = useMemo(() => degreeLine(n, Number(octs), pattern, dir), [n, octs, pattern, dir]);
  const midiOf = (d: number) => rootMidi(root) + 12 * Math.floor(d / n) + semis[mod(d, n)];
  const seq = useMemo(() => degrees.map(midiOf), [degrees, rootPc, scaleId]);
  const nameAt = (i: number) => noteName(spelled[mod(degrees[i], n)]);
  const formula = scale.formula.split(' ');
  const done = run.finished !== null;
  const metro = clock === 'metro';
  const beat = 60 / bpm;
  const step = beat / Number(sub);

  const recKey = `scale.rec.${scaleId}.${pattern}.${dir}.${octs}.${guide}`;
  const records = (useStore((d) => d.practice[recKey]) ?? {}) as Record<number, KeyRecord>;
  const record = records[rootPc] ?? {};
  const saveRecord = (r: KeyRecord) => savePref(recKey, { ...records, [rootPc]: { ...record, ...r } });

  const reset = () => {
    audio.stopScheduledClicks();
    setRun(freshRun());
  };

  // new exercise: put the computer keys under the lowest note
  useEffect(() => {
    input.placeRoot(Math.min(...seq));
    reset();
    setPeek(false);
    setNote('');
  }, [rootPc, scaleId, dir, guide, pattern, octs, clock]);

  // follow a long line with the computer keys
  useEffect(() => {
    const target = seq[run.idx];
    if (target !== undefined && !input.qwertyHas(target)) input.qwertyReach(target);
  }, [run.idx, seq]);

  const show = guide === 'show' || peek;
  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    if (show) for (let i = run.idx; i < seq.length; i++) marks[seq[i]] ??= { label: nameAt(i), tone: 'scale' };
    for (let i = Math.max(0, run.idx - 8); i < Math.min(run.idx, seq.length); i++) marks[seq[i]] = { label: nameAt(i), tone: 'ok' };
    // from memory, only the starting note is marked
    if (!done && (show || run.idx === 0)) marks[seq[run.idx]] = { label: nameAt(run.idx), tone: run.idx === 0 ? 'root' : 'target' };
    for (const w of wrong) marks[w] = { tone: 'wrong' };
    setMarks(marks);
  }, [run, seq, show, wrong, done]);

  /** Count in one bar, then click through the whole line. */
  const startMetro = () => {
    void audio.init();
    audio.stopScheduledClicks();
    const start = audio.now() + 0.15;
    const beats = 4 + Math.ceil(seq.length / Number(sub)) + 1;
    for (let b = 0; b < beats; b++) audio.drum(b % 4 === 0 ? 'accent' : 'click', start + b * beat, b < 4 ? 1 : 0.8);
    setRun({ ...freshRun(), t0: start + 4 * beat });
    setNote('');
  };

  const finish = (r: Run) => {
    audio.stopScheduledClicks();
    if (r.misses > 0 || r.finished === null || r.started === null) return;
    if (!metro) {
      const secs = (r.finished - r.started) / 1000;
      if (record.t === undefined || secs < record.t) {
        saveRecord({ t: secs });
        setNote(record.t === undefined ? 'First clean run in this key.' : `New best (was ${record.t.toFixed(1)} s).`);
      }
      return;
    }
    // judge steadiness around your own average: a constant lean is keyboard/audio latency more often than you
    const { lean, spread } = timingStats(r.offsets);
    const tight = r.offsets.every((o) => Math.abs(o - lean) < step * 1000 * 0.3);
    if (spread < 35 && Math.abs(lean) < 80 && tight) {
      if (!record.bpm || bpm > record.bpm) saveRecord({ bpm });
      setBpm(Math.min(240, bpm + 4));
      setNote(`Clean and steady — tempo up to ${bpm + 4}.`);
    } else setNote(spread >= 35 ? 'Clean, but uneven — stay at this tempo until the dots line up.' : Math.abs(lean) >= 80 ? 'Clean and even, but well off the click.' : 'Clean, but a few notes were far off the click.');
  };

  useNoteOn((midi, time) => {
    if (done) {
      if (!metro && mod(midi, 12) === mod(seq[0], 12)) {
        // playing the first note again starts a new run
        setRun({ ...freshRun(), idx: 1, started: performance.now() });
        setNote('');
      }
      return;
    }
    if (metro && run.t0 === null) return; // press Space to count in first
    const target = seq[run.idx];
    if (mod(midi, 12) !== mod(target, 12)) {
      flash(midi);
      setRun((r) => ({ ...r, misses: r.misses + 1 }));
      return;
    }
    const now = performance.now();
    const idx = run.idx + 1;
    const offsets = run.t0 !== null ? [...run.offsets, (audio.perfToCtx(time) - (run.t0 + run.idx * step)) * 1000] : run.offsets;
    const next: Run = { ...run, idx, offsets, started: run.started ?? now, finished: idx >= seq.length ? now : null };
    setRun(next);
    if (next.finished !== null) finish(next);
  });

  const nextRoot = FIFTHS[(FIFTHS.indexOf(rootPc) + 1) % 12];
  const hear = () => playLine(seq, metro ? step : 0.24, metro ? step * 0.9 : 0.22);

  useHotkeys((e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (metro) startMetro();
      else if (done) reset();
      else hear();
    } else if (e.code === 'Enter') {
      e.preventDefault();
      if (done) setRootPc(nextRoot);
    } else if (e.code === 'Backspace') {
      e.preventDefault();
      reset();
    }
  });

  const secs = run.started !== null && run.finished !== null ? (run.finished - run.started) / 1000 : null;
  const parent = MODE_DEGREE[scaleId] && MODE_DEGREE[scaleId] > 1 ? transpose(root, MAJOR_STEPS[MODE_DEGREE[scaleId] - 1], -1) : null;
  // show a sliding window of the line around the current note
  const from = Math.max(0, Math.min(run.idx - 4, seq.length - 16));
  const visible = seq.slice(from, from + 16).map((_, j) => from + j);
  const best = record.t !== undefined || record.bpm ? recordText(record) : null;

  return (
    <div className="s-mode">
      <Bar help={scaleHelp(scaleId)}>
        {taskChips}
        <Pick label="Scale" value={scaleId} groups={SCALE_CHOICES} onChange={setScaleId} />
        <Pick label="Pattern" value={pattern} options={PATTERNS} onChange={setPattern} />
        <Pick label="Range" value={octs} options={OCTAVES} onChange={setOcts} />
        <Pick label="Direction" value={dir} options={DIRS} onChange={setDir} />
        <Pick label="Guide" value={guide} options={GUIDES} onChange={setGuide} />
        <Pick
          label="Timing"
          value={metro ? (`metro${sub}` as Timing) : 'free'}
          options={TIMINGS}
          onChange={(t) => {
            if (t !== 'free') setSub(t === 'metro1' ? '1' : '2');
            setClock(t === 'free' ? 'free' : 'metro');
          }}
        />
        {metro ? (
          <span className="s-stepper" role="group" aria-label="Tempo">
            <button type="button" onClick={() => setBpm(Math.max(40, bpm - 4))} aria-label="Slower">−</button>
            <span>♩ = {bpm}</span>
            <button type="button" onClick={() => setBpm(Math.min(240, bpm + 4))} aria-label="Faster">+</button>
          </span>
        ) : null}
      </Bar>

      <section className="s-stage">
        <div className="s-q">
          <h1>{noteName(root)} {TITLE[scaleId] ?? SHORT[scaleId]}</h1>
          <KeyStrip value={rootPc} onChange={setRootPc} records={records} />
        </div>

        <div className="s-line">
          <ol className="s-steps" aria-label="Notes of the exercise">
            {from > 0 ? <li className="more">…</li> : null}
            {visible.map((i) => {
              const state = i < run.idx ? 'ok' : i === run.idx && !done ? `now ${wrong.size ? 'shake' : ''}` : '';
              const shown = show || i < run.idx || i === 0;
              return (
                <li key={i} className={state}>
                  <span className="n">{shown ? nameAt(i) : '?'}</span>
                  <span className="d">{formula[mod(degrees[i], n)] ?? '1'}</span>
                </li>
              );
            })}
            {from + 16 < seq.length ? <li className="more">…</li> : null}
          </ol>
          <div className="s-progress" aria-hidden="true"><i style={{ width: `${(run.idx / seq.length) * 100}%` }} /></div>
        </div>

        <div className="s-status" aria-live="polite">
          {done ? (
            <>
              <span className="s-result">
                <strong className={run.misses ? 'bad' : 'good'}>{run.misses ? `${run.misses} wrong note${run.misses > 1 ? 's' : ''}` : 'Clean run'}</strong>
                {!metro && secs !== null ? <span>{secs.toFixed(1)} s{record.t !== undefined ? ` · best ${Math.min(record.t, secs).toFixed(1)} s` : ''}</span> : null}
                {metro && run.offsets.length ? <TimingSummary offsets={run.offsets} /> : null}
                {note ? <span className="muted">{note}</span> : null}
              </span>
              <span className="s-actions">
                <button type="button" className="btn" onClick={metro ? startMetro : reset}>Again <K>Space</K></button>
                <button type="button" className="btn primary" onClick={() => setRootPc(nextRoot)}>Next key: {noteName(rootByPc(nextRoot))} <K>Enter</K></button>
              </span>
            </>
          ) : metro && run.t0 === null ? (
            <>
              <span>One bar of clicks, then {sub === '2' ? 'two notes' : 'one note'} per click.</span>
              <button type="button" className="btn primary" onClick={startMetro}>Count in <K>Space</K></button>
            </>
          ) : run.idx === 0 ? (
            <>
              <span>Play <b>{nameAt(0)}</b> to start{guide === 'memory' ? ' — the rest is up to you' : ''}.{best ? <span className="muted"> Best here: {best}</span> : null}</span>
              {!metro ? <Listen onClick={hear} /> : null}
            </>
          ) : (
            <>
              <span className="tnum">{run.idx} / {seq.length}{run.misses ? ` · ${run.misses} miss${run.misses > 1 ? 'es' : ''}` : ''}</span>
              {guide === 'memory' ? <button type="button" className="btn ghost small" onClick={() => setPeek(!peek)}>{peek ? 'Hide notes' : 'Peek'}</button> : null}
              <button type="button" className="btn ghost small" onClick={reset}>Restart <K>⌫</K></button>
            </>
          )}
        </div>
        {metro && done && run.offsets.length ? <TimingStrip offsets={run.offsets} stepMs={step * 1000} /> : null}

        <div className="s-info">
          <p>{scale.character}</p>
          <p><b>Use it on:</b> {scale.usage}{parent ? <> <b>Same notes as</b> {noteName(parent)} major, from its {MODE_DEGREE[scaleId]}{['st', 'nd', 'rd'][MODE_DEGREE[scaleId] - 1] ?? 'th'} degree.</> : null}</p>
        </div>
      </section>
    </div>
  );
}

const recordText = (r: KeyRecord): string => [r.bpm ? `♩ = ${r.bpm}` : '', r.t !== undefined ? `${r.t.toFixed(1)} s` : ''].filter(Boolean).join(', ');

/** The twelve keys round the circle of fifths; a dot marks keys with a clean run in this exact setup. */
function KeyStrip({ value, onChange, records }: { value: number; onChange: (p: number) => void; records: Record<number, KeyRecord> }) {
  const done = FIFTHS.filter((p) => records[p]).length;
  return (
    <div className="s-keystrip" role="radiogroup" aria-label="Key">
      {FIFTHS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          className={`${value === p ? 'on' : ''} ${records[p] ? 'done' : ''}`}
          onClick={() => onChange(p)}
          title={records[p] ? `Best: ${recordText(records[p])}` : undefined}
        >
          {noteName(rootByPc(p))}
        </button>
      ))}
      <span className="s-count" title="Keys with a clean run in this exact setup">{done}/12</span>
    </div>
  );
}

/** Average lean (positive = late) and spread around it, in ms. */
function timingStats(offsets: number[]): { lean: number; spread: number } {
  const lean = offsets.reduce((a, b) => a + b, 0) / offsets.length;
  const spread = offsets.reduce((a, b) => a + Math.abs(b - lean), 0) / offsets.length;
  return { lean, spread };
}

function TimingSummary({ offsets }: { offsets: number[] }) {
  const { lean, spread } = timingStats(offsets);
  return (
    <span>
      steadiness ±{Math.round(spread)} ms · {Math.abs(lean) < 10 ? 'centred on the click' : `${Math.round(Math.abs(lean))} ms ${lean > 0 ? 'behind' : 'ahead of'} the click on average`}
    </span>
  );
}

/** Each note's offset from the click: above the line = late, below = early. */
function TimingStrip({ offsets, stepMs }: { offsets: number[]; stepMs: number }) {
  const w = 600;
  const h = 70;
  const lim = Math.max(60, stepMs * 0.5);
  const x = (i: number) => 10 + (i / Math.max(1, offsets.length - 1)) * (w - 20);
  const y = (o: number) => h / 2 - (Math.max(-lim, Math.min(lim, o)) / lim) * (h / 2 - 6);
  return (
    <svg className="s-timing" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Timing of each note: above the line is late, below is early">
      <rect x="0" y={y(stepMs * 0.15)} width={w} height={y(-stepMs * 0.15) - y(stepMs * 0.15)} className="band" />
      <line x1="0" x2={w} y1={h / 2} y2={h / 2} className="mid" />
      <text x="4" y="11" className="lab">late</text>
      <text x="4" y={h - 4} className="lab">early</text>
      {offsets.map((o, i) => <circle key={i} cx={x(i)} cy={y(o)} r="3.5" className={Math.abs(o) < stepMs * 0.15 ? 'on' : 'off'} />)}
    </svg>
  );
}
