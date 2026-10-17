import { useEffect, useRef, useState } from 'react';
import { input } from '../midi/input';
import { progressionEvents, transposeSymbol, type CompStyle } from '../learn/music';
import { mod, pc, shuffle } from '../theory/core';
import { JAZZ_MAJOR_TONICS, JAZZ_MINOR_TONICS, keyFromName, keyName, prefersFlats, type Key } from '../theory/keys';
import { PROG_GROUP_NAMES, PROGRESSIONS, type ProgGroup, type ProgressionDef } from '../theory/progressions';
import { Answers, Bar, Chips, K, Listen, Pick, pickAny, playEvents, setMarks, useHotkeys, useModeCleanup, usePref, type Choice } from './common';
import { NUMERAL_SETS, randomProgression, type NumeralLevel } from './logic';

type Task = 'numerals' | 'library';
const TASKS: Choice<Task>[] = [
  { id: 'numerals', label: 'Name the chords', title: 'Hear a progression, name each chord as a Roman numeral' },
  { id: 'library', label: 'Name the progression', title: 'ii–V–I, backdoor, Lady Bird, lament bass…' },
];
const LEVELS: Choice<NumeralLevel>[] = [
  { id: 'basic', label: 'I IV V vi' },
  { id: 'diatonic', label: 'All triads' },
  { id: 'sevenths', label: 'Diatonic 7ths' },
  { id: 'minor', label: 'Minor key' },
];
type Group = ProgGroup | 'all';
const GROUPS: Choice<Group>[] = [
  ...(Object.keys(PROG_GROUP_NAMES) as ProgGroup[]).map((g) => ({ id: g, label: PROG_GROUP_NAMES[g] })),
  { id: 'all', label: 'Everything' },
];
const FEEL: Record<ProgGroup, { style: CompStyle; bpm: number; beats: number }> = {
  jazz: { style: 'swing', bpm: 132, beats: 2 },
  subs: { style: 'swing', bpm: 132, beats: 2 },
  soul: { style: 'ballad', bpm: 76, beats: 2 },
  funk: { style: 'funk', bpm: 100, beats: 4 },
  bach: { style: 'block', bpm: 76, beats: 2 },
};

/** A random practical key in the given mode. */
function randomKey(mode: 'major' | 'minor'): Key {
  return { tonic: pickAny(mode === 'major' ? JAZZ_MAJOR_TONICS : JAZZ_MINOR_TONICS), mode };
}

interface NumQ {
  key: Key;
  chords: string[];
  /** answers given so far for chords 2… */
  picks: string[];
}

interface LibQ {
  def: ProgressionDef;
  key: Key;
  symbols: string[];
  options: string[];
  picked: string | null;
}

function newNumQ(level: NumeralLevel): NumQ {
  return { key: randomKey(level === 'minor' ? 'minor' : 'major'), chords: randomProgression(NUMERAL_SETS[level]), picks: [] };
}

function newLibQ(group: Group, prev: LibQ | null): LibQ {
  const pool = PROGRESSIONS.filter((p) => group === 'all' || p.group === group);
  let def = pickAny(pool);
  if (pool.length > 1) while (def.id === prev?.def.id) def = pickAny(pool);
  const ref = keyFromName(def.key);
  const key = randomKey(ref.mode);
  const shift = mod(pc(key.tonic) - pc(ref.tonic), 12);
  const symbols = def.chords.map((c) => transposeSymbol(c, shift, prefersFlats(key)));
  const others = shuffle(pool.filter((p) => p.id !== def.id)).slice(0, 3).map((p) => p.id);
  return { def, key, symbols, options: shuffle([def.id, ...others]), picked: null };
}

export function ProgressionsMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('prog.task', 'numerals');
  const [level, setLevel] = usePref<NumeralLevel>('prog.level', 'basic');
  const [group, setGroup] = usePref<Group>('prog.group', 'jazz');
  const [nq, setNq] = useState<NumQ>(() => newNumQ(level));
  const [lq, setLq] = useState<LibQ>(() => newLibQ(group, null));
  const [playing, setPlaying] = useState<number | null>(null);
  const [score, setScore] = useState({ ok: 0, bad: 0 });
  const timers = useRef<number[]>([]);

  const numDone = nq.picks.length === nq.chords.length - 1;
  const answered = task === 'numerals' ? numDone : lq.picked !== null;

  /** Play chords with the on-screen slot following along. */
  const play = (key: Key, tokens: string[], opts: { style: CompStyle; bpm: number; beats: number | number[] }) => {
    timers.current.forEach(clearTimeout);
    const prog = progressionEvents(key, tokens, opts);
    playEvents(prog.events);
    timers.current = [
      ...prog.times.map((t, i) => window.setTimeout(() => setPlaying(i), 80 + t * 1000)),
      window.setTimeout(() => setPlaying(null), 80 + prog.duration * 1000),
    ];
  };
  const playNum = () => play(nq.key, nq.chords, { style: 'block', bpm: 80, beats: 2 });
  const libFeel = FEEL[lq.def.group];
  const playLib = () => play(lq.key, lq.symbols, { style: libFeel.style, bpm: libFeel.bpm, beats: lq.def.beats ? lq.def.beats.map((b) => b / 2) : libFeel.beats });
  const replay = () => (task === 'numerals' ? playNum() : playLib());

  useEffect(() => {
    setMarks({});
    input.placeRoot(60 + pc(task === 'numerals' ? nq.key.tonic : lq.key.tonic));
    const t = window.setTimeout(replay, 150);
    return () => window.clearTimeout(t);
  }, [nq.key, nq.chords, lq.def, lq.key, task]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const next = (t = task, l = level, g = group) => {
    if (t === 'numerals') setNq(newNumQ(l));
    else setLq((p) => newLibQ(g, p));
  };

  const pickNumeral = (n: string) => {
    if (numDone) return;
    const i = nq.picks.length + 1;
    const ok = n === nq.chords[i];
    setScore((s) => (ok ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 }));
    setNq({ ...nq, picks: [...nq.picks, n] });
  };

  const pickLib = (id: string) => {
    setLq({ ...lq, picked: id });
    setScore((s) => (id === lq.def.id ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 }));
  };

  useHotkeys((e) => {
    if (e.code === 'Space' || (e.code === 'Enter' && answered)) {
      e.preventDefault();
      if (answered) next();
      else replay();
    } else if (e.code === 'Backspace' && task === 'numerals' && nq.picks.length && !numDone) {
      e.preventDefault();
      setNq({ ...nq, picks: nq.picks.slice(0, -1) });
    }
  });

  const symbolsInKey = (key: Key, tokens: string[]) => {
    const prog = progressionEvents(key, tokens, {});
    return prog.chords.map((c, i) => c?.symbol ?? tokens[i]);
  };

  return (
    <div className="s-mode">
      <Bar score={score}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => { setTask(t); next(t); }} />
        {task === 'numerals'
          ? <Pick label="Chords" value={level} options={LEVELS} onChange={(l) => { setLevel(l); next(task, l); }} />
          : <Pick label="Style" value={group} options={GROUPS} onChange={(g) => { setGroup(g); next(task, level, g); }} />}
      </Bar>

      <section className="s-stage">
        {task === 'numerals' ? (
          <>
            <div className="s-q">
              <h1>Name chords 2–{nq.chords.length}</h1>
              <p className="sub">{keyName(nq.key)} · starts on {nq.chords[0]}</p>
            </div>
            <ol className="s-steps prog" aria-label="Chords">
              {nq.chords.map((c, i) => {
                const pick = i === 0 ? c : nq.picks[i - 1];
                const state = i === 0 ? 'given' : pick === undefined ? (i === nq.picks.length + 1 ? 'now' : '') : pick === c ? 'ok' : 'bad';
                return (
                  <li key={i} className={`${state} ${playing === i ? 'playing' : ''}`}>
                    <span className="n">{pick ?? '?'}</span>
                    <span className="d">{numDone ? (pick === c ? symbolsInKey(nq.key, [c])[0] : `→ ${c}`) : i === 0 ? 'given' : ''}</span>
                  </li>
                );
              })}
            </ol>
            {!numDone ? <Answers options={NUMERAL_SETS[level].map((n) => ({ id: n, label: n }))} onPick={pickNumeral} /> : null}
            <div className="s-status" aria-live="polite">
              {numDone ? (
                <>
                  <strong className={nq.picks.every((p, i) => p === nq.chords[i + 1]) ? 'good' : 'bad'}>
                    {nq.picks.filter((p, i) => p === nq.chords[i + 1]).length}/{nq.picks.length} · {nq.chords.join(' – ')} = {symbolsInKey(nq.key, nq.chords).join(' – ')}
                  </strong>
                  <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
                </>
              ) : (
                <>
                  <span>The bass gives the root. Keys 1–{NUMERAL_SETS[level].length} answer, <K>⌫</K> takes one back.</span>
                  <Listen onClick={playNum} label="Again" />
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="s-q">
              <h1>Which progression?</h1>
              <p className="sub">{keyName(lq.key)}</p>
            </div>
            <ol className="s-steps prog" aria-label="Chords">
              {lq.symbols.map((s, i) => (
                <li key={i} className={playing === i ? 'playing' : ''}>
                  <span className="n">{answered ? s : '?'}</span>
                  <span className="d">{answered ? lq.def.numerals[i] : ''}</span>
                </li>
              ))}
            </ol>
            <Answers
              wide
              options={lq.options.map((id) => ({ id, label: PROGRESSIONS.find((p) => p.id === id)!.name }))}
              right={lq.def.id}
              picked={lq.picked}
              onPick={pickLib}
            />
            <div className="s-status" aria-live="polite">
              {answered ? (
                <>
                  <strong className={lq.picked === lq.def.id ? 'good' : 'bad'}>{lq.picked === lq.def.id ? '✓ ' : '✗ '}{lq.def.name}</strong>
                  <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
                </>
              ) : (
                <>
                  <span>Listen for the bass motion and the chord qualities.</span>
                  <Listen onClick={playLib} label="Again" />
                </>
              )}
            </div>
            {answered ? (
              <div className="s-info">
                <p>{lq.def.description}</p>
                <p><b>Heard in:</b> {lq.def.heardIn.join(', ')}</p>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
