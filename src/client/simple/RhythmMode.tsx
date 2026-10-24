// Rhythm: read a bar and tap it in time, hear a bar and pick it from four, or
// name a clave. Any key taps (MIDI, computer keys, the on-screen keys or the grid).

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { audio, type NoteEvent } from '../audio/engine';
import { CLAVES, RHYTHM_LEVEL_NAMES, type RhythmLevel, type RhythmPattern } from '../theory/rhythm';
import { RhythmGrid } from '../ui/Rhythm';
import type { Help } from './Lessons';
import { ladder, pickByItems, pickFor, useTally } from './stats';
import { Answers, Bar, Chips, K, Listen, Pick, playEvents, useHotkeys, useModeCleanup, useNoteOn, usePref, setMarks, type Choice } from './common';
import { cellLabel, cellResults, cellsOf, decoys, freshBar, gridMarks, repeatBar, scoreTaps, type TapScore } from './rhythmLogic';

type Task = 'tap' | 'hear' | 'clave';
type Level = '2' | '3' | '4' | '5';
type Tempo = '60' | '72' | '84' | '96' | '108';

const TASKS: Choice<Task>[] = [
  { id: 'tap', label: 'Tap it', title: 'Read the bar, then tap it in time (twice through)' },
  { id: 'hear', label: 'Hear it', title: 'A bar plays: which one was it?' },
  { id: 'clave', label: 'Clave', title: 'Name the timeline: son, rumba, bossa, tresillo' },
];
const LEVELS: Choice<Level>[] = (['2', '3', '4', '5'] as Level[]).map((l) => ({ id: l, label: RHYTHM_LEVEL_NAMES[Number(l) as RhythmLevel].replace(/^./, (c) => c.toUpperCase()) }));
const TEMPOS: Choice<Tempo>[] = (['60', '72', '84', '96', '108'] as Tempo[]).map((t) => ({ id: t, label: `♩ = ${t}` }));
const PASSES = 2;

const HELP: Record<Task, Help> = {
  tap: {
    topics: ['rhythm.subdivision', 'funk.groove'],
    method: [
      'Count the whole grid out loud ("1 e & a 2 e & a…") and tap only the notes shown. The grid never stops, even on rests.',
      'Hear it first if the bar is new: the click plays with the rhythm.',
      'Off-beat 16ths (e and a) are where funk lives: feel them against the & you are not playing.',
      'The graph after each bar: a steady lean early or late is usually your setup\'s latency; the spread is you.',
    ],
  },
  hear: {
    topics: ['rhythm.subdivision', 'funk.groove'],
    method: [
      'Find beat 1, then count the grid along with what you hear.',
      'Compare the options beat by beat: most share some beats, so listen for the beat where they differ.',
      'Tap along on any key while it plays: your hands often hear the rhythm before you can name it.',
    ],
  },
  clave: {
    topics: ['rhythm.clave', 'funk.groove'],
    method: [
      'Count "1 e & a" in 16ths. The 3 side has three strokes, the 2 side two; which comes first gives 3-2 or 2-3.',
      'Son vs rumba: rumba delays the third stroke by a 16th (onto the "a" of 2). Bossa delays the last stroke instead.',
      'Tresillo is 3+3+2 in 8ths, twice: the New Orleans and funk bass pulse.',
    ],
  },
};

interface Q {
  bar: RhythmPattern;
  /** hear: the four bars offered, the right one among them */
  options: RhythmPattern[];
  clave: string;
}

const barKey = (p: RhythmPattern) => `${p.steps}:${p.onsets.join(',')}`;
const skillOf = (task: Task, level: Level) => (task === 'clave' ? 'rhythm.clave' : `rhythm.${task}.${level}`);

function newQ(task: Task, level: Level, prev: Q | null): Q {
  const lv = Number(level) as RhythmLevel;
  if (task === 'clave') {
    const clave = pickFor('rhythm.clave', CLAVES.map((c) => c.id), prev?.clave ?? null);
    return { bar: CLAVES.find((c) => c.id === clave)!.pattern, options: [], clave };
  }
  const tries = Array.from({ length: 8 }, () => freshBar(lv, prev?.bar ?? null));
  const bar = pickByItems(skillOf(task, level), tries, cellsOf);
  const options = task === 'hear' ? shuffled([bar, ...decoys(lv, bar)]) : [];
  return { bar, options, clave: '' };
}

function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The pattern as short notes, from `at` seconds. */
const strokes = (p: RhythmPattern, bpm: number, at: number, bars = 1): NoteEvent[] => {
  const step = (60 / bpm) * (p.beatsPerBar / p.steps);
  return repeatBar(p, bars).onsets.map((o) => ({ note: 79, start: at + o * step, dur: Math.min(0.1, step * 0.8), vel: 104 }));
};

interface TapRun {
  state: 'idle' | 'count' | 'tap' | 'done';
  /** AudioContext time of the first downbeat */
  t0: number;
  taps: number[];
  score: TapScore | null;
}
const IDLE: TapRun = { state: 'idle', t0: 0, taps: [], score: null };

export function RhythmMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('rhy.task', 'tap');
  const [level, setLevel] = usePref<Level>('rhy.level', '2');
  const [tempo, setTempo] = usePref<Tempo>('rhy.tempo', '84');
  const [q, setQ] = useState<Q>(() => newQ(task, level, null));
  const [run, setRun] = useState<TapRun>(IDLE);
  const [picked, setPicked] = useState<string | null>(null);
  const [now, setNow] = useState(-1);
  const timers = useRef<number[]>([]);
  const ticker = useRef(0);

  const skill = skillOf(task, level);
  // the beat figures a level uses (sampled once per level)
  const cellsPool = useMemo(() => [...new Set(Array.from({ length: 60 }, () => cellsOf(freshBar(Number(level) as RhythmLevel, null))).flat())].sort().reverse(), [level]);
  const tally = useTally(
    skill,
    `Rhythm · ${TASKS.find((t) => t.id === task)!.label}${task === 'clave' ? '' : ` · ${LEVELS.find((l) => l.id === level)!.label}`}`,
    task === 'clave' ? CLAVES.map((c) => c.id) : cellsPool,
    task === 'clave' ? (id) => CLAVES.find((c) => c.id === id)?.name ?? id : cellLabel,
    task === 'clave' ? undefined : ladder(LEVELS, level, (l) => { setLevel(l); next(task, l); }),
  );
  const bpm = task === 'tap' ? Number(tempo) : task === 'clave' ? 100 : Number(level) === 5 ? 92 : 84;
  const beat = 60 / bpm;
  const long = repeatBar(q.bar, PASSES);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    window.clearInterval(ticker.current);
    setNow(-1);
  };
  useEffect(() => () => {
    clear();
    audio.stop();
  }, []);
  useEffect(() => setMarks({}), []);

  /** Count-in, then `bars` bars of clicks, with the pattern (and a groove for claves) if asked. */
  const schedule = (bars: number, withPattern: boolean, groove = false) => {
    clear();
    void audio.init();
    audio.stop();
    const t0 = audio.now() + 0.15;
    for (let b = 0; b < 4; b++) audio.drum(b === 0 ? 'accent' : 'click', t0 + b * beat);
    const first = t0 + 4 * beat;
    for (let b = 0; b < q.bar.beatsPerBar * bars; b++) {
      if (groove) {
        if (b % 4 === 0) audio.drum('kick', first + b * beat, 0.7);
        audio.drum('hat', first + b * beat, 0.6);
        audio.drum('hat', first + (b + 0.5) * beat, 0.35);
      } else audio.drum(b % q.bar.beatsPerBar === 0 ? 'accent' : 'click', first + b * beat, 0.6);
    }
    if (withPattern) playEvents(strokes(q.bar, bpm, 0, bars), first);
    // the step now sounding, for the grid's cursor
    const step = beat * (q.bar.beatsPerBar / q.bar.steps);
    ticker.current = window.setInterval(() => {
      const t = audio.now() - audio.latency() - first;
      setNow(t >= 0 && t < bars * q.bar.beatsPerBar * beat ? Math.floor(t / step) % q.bar.steps : -1);
    }, 30);
    timers.current.push(window.setTimeout(() => window.clearInterval(ticker.current), (first - audio.now() + bars * q.bar.beatsPerBar * beat) * 1000 + 100));
    return { first, end: first + bars * q.bar.beatsPerBar * beat };
  };

  const hear = () => {
    if (task === 'clave') schedule(2, true, true);
    else schedule(task === 'tap' ? 1 : 2, true);
  };

  const startTaps = () => {
    const { first, end } = schedule(PASSES, false);
    setRun({ state: 'count', t0: first, taps: [], score: null });
    const ms = (t: number) => Math.max(0, (t - audio.now()) * 1000);
    timers.current.push(
      window.setTimeout(() => setRun((r) => (r.state === 'count' ? { ...r, state: 'tap' } : r)), ms(first - 0.12)),
      window.setTimeout(() => setRun((r) => (r.state === 'tap' ? { ...r, state: 'done' } : r)), ms(end) + 300),
    );
  };

  // a finished bar: score it, mark the grid, record each beat
  useEffect(() => {
    if (run.state !== 'done' || run.score) return;
    const score = scoreTaps(long, bpm, run.taps);
    setRun((r) => ({ ...r, score }));
    for (const c of cellResults(q.bar, long, bpm, run.taps, score)) tally.record(c.cell, c.ok);
  }, [run.state]);

  const tap = (time: number) => {
    if (run.state !== 'count' && run.state !== 'tap') return;
    const t = audio.perfToCtx(time) - run.t0;
    if (t < -beat * 0.5) return; // still counting in
    setRun((r) => ({ ...r, taps: [...r.taps, t] }));
  };
  useNoteOn((_note, time) => {
    if (task === 'tap') tap(time);
  });
  const onGrid = (e: ReactPointerEvent) => {
    if (task !== 'tap') return;
    e.preventDefault();
    tap(e.timeStamp);
  };

  const next = (t = task, l = level) => {
    clear();
    audio.stop();
    setQ((p) => newQ(t, l, p));
    setRun(IDLE);
    setPicked(null);
  };

  // Hear it and Clave play as soon as the question appears
  useEffect(() => {
    if (task === 'tap') return;
    const t = window.setTimeout(hear, 150);
    return () => window.clearTimeout(t);
  }, [q, task]);

  const pickHear = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const right = barKey(q.bar);
    const chosen = q.options.find((o) => barKey(o) === id);
    // a wrong pick: the beats where the two bars differ were misheard
    const mine = chosen ? cellsOf(chosen) : [];
    cellsOf(q.bar).forEach((c, i) => tally.record(c, id === right || mine[i] === c));
  };
  const pickClave = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    tally.record(q.clave, id === q.clave);
  };

  const answered = task === 'tap' ? run.state === 'done' : picked !== null;
  useHotkeys((e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (task === 'tap') {
        if (run.state === 'idle' || run.state === 'done') startTaps();
      } else if (answered) next();
      else hear();
    } else if (e.code === 'Enter' && (answered || task === 'tap')) {
      e.preventDefault();
      if (run.state !== 'count' && run.state !== 'tap') next();
    } else if (e.code === 'Backspace' && task === 'tap') {
      e.preventDefault();
      clear();
      audio.stopScheduledClicks();
      setRun(IDLE);
    }
  });

  const s = run.score;
  const clave = CLAVES.find((c) => c.id === q.clave);
  const feel = s && s.hits ? `${Math.abs(s.lean)} ms ${s.lean > 8 ? 'late' : s.lean < -8 ? 'early' : 'centred'}, spread ±${s.spread} ms` : '';
  const clean = s ? s.hits === s.total && s.extras === 0 : false;

  return (
    <div className="s-mode">
      <Bar tally={tally} help={HELP[task]}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => { setTask(t); next(t); }} />
        {task !== 'clave' ? <Pick label="Rhythms" value={level} options={LEVELS} onChange={(l) => { setLevel(l); next(task, l); }} /> : null}
        {task === 'tap' ? <Pick label="Tempo" value={tempo} options={TEMPOS} onChange={(t) => { setTempo(t); setRun(IDLE); }} /> : null}
      </Bar>

      <section className="s-stage">
        {task === 'tap' ? (
          <>
            <div className="s-q"><h1>Tap the rhythm</h1><p className="sub">♩ = {bpm} · count-in, then twice through · any key or the grid</p></div>
            <div className="s-rhythm" onPointerDown={onGrid}>
              <RhythmGrid pattern={q.bar} marks={s ? gridMarks(q.bar, long, s) : undefined} now={now >= 0 ? now : undefined} />
            </div>
          </>
        ) : task === 'hear' ? (
          <>
            <div className="s-q"><h1>Which rhythm?</h1><p className="sub">Count-in, then the bar twice</p></div>
            <Answers
              options={q.options.map((o) => ({ id: barKey(o), label: o.onsets.join(' ') }))}
              right={barKey(q.bar)}
              picked={picked}
              onPick={pickHear}
              render={(o) => <RhythmGrid pattern={q.options.find((x) => barKey(x) === o.id)!} />}
            />
          </>
        ) : (
          <>
            <div className="s-q"><h1>Which timeline?</h1><p className="sub">Two bars over a hi-hat and kick</p></div>
            {picked !== null ? <div className="s-rhythm"><RhythmGrid pattern={q.bar} now={now >= 0 ? now : undefined} /></div> : null}
            {picked !== null ? <p className="s-why">{clave!.note}</p> : null}
            <Answers wide options={CLAVES.map((c) => ({ id: c.id, label: c.name }))} right={q.clave} picked={picked} onPick={pickClave} />
          </>
        )}

        <div className="s-status" aria-live="polite">
          {task === 'tap' ? (
            run.state === 'done' && s ? (
              <>
                <strong className={clean ? 'good' : s.hits >= s.total * 0.8 ? '' : 'bad'}>
                  {clean ? '✓ ' : ''}{s.hits}/{s.total} in time{s.extras ? `, ${s.extras} extra` : ''}{feel ? ` · ${feel}` : ''}
                </strong>
                <button type="button" className="btn" onClick={startTaps}>Again <K>Space</K></button>
                <button type="button" className="btn primary" onClick={() => next()}>Next <K>Enter</K></button>
              </>
            ) : run.state === 'count' || run.state === 'tap' ? (
              <span>{run.state === 'count' ? 'Count-in…' : `Tap! ${run.taps.length} so far`}</span>
            ) : (
              <>
                <button type="button" className="btn primary" onClick={startTaps}>▶ Start <K>Space</K></button>
                <Listen onClick={hear} label="Hear it" />
                <button type="button" className="btn ghost small" onClick={() => next()}>Skip <K>Enter</K></button>
              </>
            )
          ) : answered ? (
            <>
              <strong className={(task === 'clave' ? picked === q.clave : picked === barKey(q.bar)) ? 'good' : 'bad'}>
                {(task === 'clave' ? picked === q.clave : picked === barKey(q.bar)) ? '✓ ' : '✗ '}
                {task === 'clave' ? clave!.name : cellsOf(q.bar).map(cellLabel).join(' | ')}
              </strong>
              <Listen onClick={hear} label="Again" />
              <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
            </>
          ) : (
            <>
              <span>{task === 'hear' ? 'Keys 1–4 answer.' : 'Keys 1–5 answer.'}</span>
              <Listen onClick={hear} label="Again" />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
