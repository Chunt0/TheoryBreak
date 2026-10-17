import { useEffect, useState } from 'react';
import { input } from '../midi/input';
import { getInterval, intervalForSemis, mod, noteName, sameNote, transpose, type Note } from '../theory/core';
import type { KeyMark } from '../ui/Keyboard';
import { Answers, article, Bar, Chips, K, Listen, NotePicker, Pick, pickOther, playBlock, playLine, ROOTS, rootMidi, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';

type Task = 'play' | 'hear' | 'name';
type Level = 'basic' | 'all' | 'ext';
type Dir = 'up' | 'down' | 'harm';
const TASKS: Choice<Task>[] = [
  { id: 'play', label: 'Play it' },
  { id: 'hear', label: 'Hear it' },
  { id: 'name', label: 'Name it', title: 'Spell the note: a minor 6th above E is C, not B♯' },
];
const LEVELS: Choice<Level>[] = [
  { id: 'basic', label: '3rds, 4ths, 5ths, 8ve' },
  { id: 'all', label: 'All 12' },
  { id: 'ext', label: 'Tensions (9, 11, 13)' },
];
const SETS: Record<Level, string[]> = {
  basic: ['m3', 'M3', 'P4', 'P5', 'P8'],
  all: ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
  ext: ['m9', 'M9', 'A9', 'P11', 'A11', 'm13', 'M13'],
};
/** Jazz names for the tensions. */
const TENSION: Record<string, string> = { m9: '♭9', M9: '9', A9: '♯9', P11: '11', A11: '♯11', m13: '♭13', M13: '13' };
const label = (id: string) => (TENSION[id] ? `${TENSION[id]} · ${getInterval(id).name.toLowerCase()}` : getInterval(id).name);
const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

interface Q {
  root: Note;
  ivl: string;
}

/** A fresh question; spelled answers stay within single sharps and flats. */
function newQ(level: Level, dir: Dir, prev: Q | null): Q {
  for (;;) {
    const q = { root: ROOTS[Math.floor(Math.random() * 12)], ivl: pickOther(SETS[level], prev?.ivl ?? null) };
    if (Math.abs(transpose(q.root, q.ivl, dir === 'down' ? -1 : 1).acc) <= 1) return q;
  }
}

interface Answer {
  ok: boolean;
  /** interval picked (hear) or note picked (name); null when revealed */
  picked: string | null;
  note?: Note;
}

export function IntervalsMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('ivl.task', 'play');
  const [level, setLevel] = usePref<Level>('ivl.level', 'basic');
  const [dirPref, setDir] = usePref<Dir>('ivl.dir', 'up');
  const dir: Dir = task !== 'hear' && dirPref === 'harm' ? 'up' : dirPref;
  const [q, setQ] = useState<Q>(() => newQ(level, dir, null));
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [score, setScore] = useState({ ok: 0, bad: 0 });
  const [wrong, flash] = useFlash();
  const [said, setSaid] = useState<string | null>(null);

  const ivl = getInterval(q.ivl);
  const down = dir === 'down';
  const rootM = rootMidi(q.root);
  const otherM = rootM + (down ? -ivl.semis : ivl.semis);
  const other = transpose(q.root, q.ivl, down ? -1 : 1);
  const ext = level === 'ext';
  const word = TENSION[q.ivl] ?? ivl.name.toLowerCase();

  const next = (lvl = level, d = dir) => {
    setQ((p) => newQ(lvl, d, p));
    setAnswer(null);
    setSaid(null);
  };

  const sound = () => {
    if (task === 'hear') {
      if (dir === 'harm') playBlock([rootM, otherM], 1.4);
      else {
        playLine([rootM, otherM], 0.6, 0.55);
        playBlock([rootM, otherM], 1, 1.35);
      }
    } else playBlock([rootM], 0.7);
  };

  useEffect(() => {
    // root on the A/W key going up; going down, the octave below sits under your hand
    input.placeRoot(down ? rootM - 12 : rootM);
    sound();
  }, [q, task, dir]);

  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    if (task === 'play' || answer) marks[rootM] = { label: noteName(q.root), tone: 'root' };
    if (answer) marks[otherM] = { label: noteName(other), tone: answer.ok ? 'ok' : 'target' };
    for (const n of wrong) marks[n] = { tone: 'wrong' };
    setMarks(marks);
  }, [q, task, answer, wrong]);

  const settle = (a: Answer) => {
    setAnswer(a);
    setScore((s) => (a.ok ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 }));
    if (task !== 'hear') playLine([rootM, otherM], 0.45, 0.6, 0.1);
  };

  useNoteOn((note) => {
    if (task !== 'play' || answer) return;
    const semis = down ? rootM - note : note - rootM;
    // tensions count in any octave above the root; simple intervals must be the exact distance
    const hit = ext ? semis > 0 && mod(semis, 12) === mod(ivl.semis, 12) : semis === ivl.semis;
    if (hit) {
      setAnswer({ ok: true, picked: q.ivl });
      setScore((s) => ({ ...s, ok: s.ok + 1 }));
      playBlock([rootM, note], 1, 0.15);
      window.setTimeout(() => next(), 1100);
    } else if (note !== rootM) {
      flash(note);
      const name = intervalForSemis(semis).name;
      setSaid(semis > 0 && semis <= 24 ? `That's ${article(name)} ${semis > 12 ? 'compound ' : ''}${name.toLowerCase()} ${down ? 'below' : 'above'}` : `Go ${down ? 'down' : 'up'} from ${noteName(q.root)}`);
      setScore((s) => ({ ...s, bad: s.bad + 1 }));
    }
  });

  useHotkeys((e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && answer) {
      e.preventDefault();
      next();
    } else if (e.code === 'Space') {
      e.preventDefault();
      sound();
    }
  });

  const dirs: Choice<Dir>[] = [{ id: 'up', label: '↑ Up' }, { id: 'down', label: '↓ Down' }, ...(task === 'hear' ? [{ id: 'harm' as Dir, label: 'Together' }] : [])];
  const fact = `${noteName(q.root)} ${down ? 'down' : 'up'} to ${noteName(other)}: ${TENSION[q.ivl] ? `${word} = ${ivl.name.toLowerCase()}` : ivl.name.toLowerCase()}, ${ivl.semis} semitones`;

  return (
    <div className="s-mode">
      <Bar score={score}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => { setTask(t); next(); }} />
        <Pick label="Intervals" value={level} options={LEVELS} onChange={(l) => { setLevel(l); next(l); }} />
        <Pick label="Direction" value={dir} options={dirs} onChange={(d) => { setDir(d); next(level, d); }} />
      </Bar>

      <section className="s-stage">
        {task === 'hear' ? (
          <>
            <div className="s-q"><h1>Which interval?</h1><p className="sub">{dir === 'harm' ? 'Both notes together' : `Two notes, ${down ? 'falling' : 'rising'}, then together`}</p></div>
            <Answers options={SETS[level].map((id) => ({ id, label: label(id) }))} right={q.ivl} picked={answer?.picked ?? (answer ? '' : null)} onPick={(id) => settle({ ok: id === q.ivl, picked: id })} />
          </>
        ) : (
          <>
            <div className="s-q">
              <h1>{TENSION[q.ivl] ? `The ${word}` : ivl.name} {down ? 'below' : 'above'} {noteName(q.root)}</h1>
              <p className="sub">{task === 'play' ? `Find it on the keys${ext ? ', in any octave above' : ''}` : 'Spell it'}</p>
            </div>
            {task === 'name' ? (
              <NotePicker answer={other} picked={answer ? answer.note ?? other : null} onPick={(n) => settle({ ok: sameNote(n, other), picked: null, note: n })} />
            ) : null}
          </>
        )}

        <div className="s-status" aria-live="polite">
          {answer ? (
            <>
              <strong className={answer.ok ? 'good' : 'bad'}>{answer.ok ? '✓ ' : '✗ '}{fact}</strong>
              <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
            </>
          ) : task === 'play' ? (
            <>
              {said ? <span className="bad">{said}</span> : null}
              <Listen onClick={sound} label="Root" />
              <button type="button" className="btn ghost small" onClick={() => settle({ ok: false, picked: null })}>Show me</button>
            </>
          ) : task === 'name' ? (
            <>
              <span>
                A {ordinal(ivl.num)} is {ivl.num - 1} letter name{ivl.num > 2 ? 's' : ''} {down ? 'down' : 'up'}{ivl.num > 8 ? ` (${ordinal(ivl.num - 7)} plus an octave)` : ''}; then fix the accidental so it spans {ivl.semis} semitones.
              </span>
              <Listen onClick={sound} label="Root" />
            </>
          ) : (
            <>
              <span>Keys 1–{Math.min(8, SETS[level].length)} answer. Play on the keys to compare.</span>
              <Listen onClick={sound} label="Again" />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
