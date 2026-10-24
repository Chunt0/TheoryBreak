import { useEffect, useRef, useState } from 'react';
import { input } from '../midi/input';
import { progressionEvents, transposeSymbol, type CompStyle } from '../learn/music';
import { mod, pc, shuffle } from '../theory/core';
import { JAZZ_MAJOR_TONICS, JAZZ_MINOR_TONICS, keyFromName, keyName, prefersFlats, type Key } from '../theory/keys';
import { PROG_GROUP_NAMES, PROGRESSIONS, type ProgGroup, type ProgressionDef } from '../theory/progressions';
import { Answers, Bar, Chips, K, Listen, Pick, pickAny, playEvents, setMarks, useHotkeys, useModeCleanup, usePref, type Choice } from './common';
import { NUMERAL_SETS, randomProgression, type NumeralLevel } from './logic';
import { SKILL_HELP } from '../learn/help';
import type { Help } from './Lessons';
import { ladder, pickFor, useTally } from './stats';

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
  { id: 'secondary', label: 'Secondary dominants', title: 'V7/ii, V7/IV, V7/V, V7/vi — each resolves to its target' },
  { id: 'borrowed', label: 'Borrowed chords', title: 'iv, ♭III, ♭VI, ♭VII from the parallel minor' },
  { id: 'subs', label: 'Tritone subs', title: '♭II7, ♭III7, ♭VI7 standing in for V7, VI7, II7' },
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

const NUMERAL_HELP: Help = {
  topics: ['core.degrees', 'core.rootmotion', 'core.diatonic'],
  method: [
    'The first chord is the tonic: hum its root and keep it in your ear.',
    'Hum each new bass note and count scale steps from the tonic: that is the numeral.',
    'Then the quality: upper case major, lower case minor, ° diminished. Among the 7ths, V7 is the only dominant.',
    'Root motion helps: up a 4th (down a 5th) is the strongest move; 3rds share two notes and sound gentle.',
  ],
};
/** The out-of-key levels add what to listen for. */
const LEVEL_HELP: Partial<Record<NumeralLevel, Help>> = {
  secondary: {
    topics: ['jazz.secondary', 'core.degrees'],
    method: [
      'A major chord where the key has a minor one (II, III, VI) or a ♭7 on I is a secondary dominant: V7 of the chord a 5th below.',
      'It always resolves here, so hear where it goes: VI7 → ii, II7 → V, III7 → vi, I7 → IV.',
      'Listen for the note from outside the key: V7/ii adds ♯1, V7/V adds ♯4, V7/vi adds ♯5, V7/IV adds ♭7 — each moves a half step into the next chord.',
    ],
  },
  borrowed: {
    topics: ['jazz.backdoor', 'soul.gospel', 'core.degrees'],
    method: [
      'Borrowed chords come from the parallel minor: iv, ♭III, ♭VI, ♭VII. They darken the key without leaving it.',
      'iv after IV is the classic "minor plagal" sigh: the 6 falls to ♭6.',
      '♭VI and ♭VII are major chords whose roots sit a whole step apart; ♭VII–I is the rock / backdoor cadence.',
      'Bass a major 3rd below the tonic (♭VI) or a whole step below (♭VII) gives them away.',
    ],
  },
  subs: {
    topics: ['jazz.tritone', 'jazz.turnarounds', 'jazz.secondary'],
    method: [
      'A tritone sub is a dominant 7th a tritone from the one it replaces, so the bass slides down a half step to its target.',
      '♭II7 → Imaj7 replaces V7; ♭VI7 → V7 replaces II7; ♭III7 → ii7 replaces VI7.',
      'Hear the bass: falling 5ths are the originals; chromatic half steps down are the subs.',
    ],
  },
};

const JAZZ_EAR = [
  'Hum the bass line first and sketch its motion.',
  ...SKILL_HELP['ear.prog.jazz'].method.slice(1),
];
const LIB_HELP: Record<Group, Help> = {
  jazz: { topics: ['jazz.turnarounds', 'jazz.iivi', 'jazz.minor', 'jazz.rhythm'], method: JAZZ_EAR },
  subs: { topics: ['jazz.tritone', 'jazz.backdoor', 'jazz.secondary', 'jazz.coltrane', 'jazz.reharm'], method: SKILL_HELP['ear.prog.subs'].method },
  soul: { topics: ['soul.neo', 'soul.gospel', 'jazz.backdoor'], method: SKILL_HELP['ear.prog.soul'].method },
  funk: {
    topics: ['funk.harmony', 'jazz.modal', 'funk.groove'],
    method: [
      'Vamps sit on one or two chords: name the colour first (m7/m9 = Dorian, 9 or 13 = dominant, 7♯9 = the Hendrix chord).',
      'Then the motion: i7–IV9 is the Dorian vamp; a chord a half step above and back is a chromatic neighbour.',
      'A longer chain falling in 5ths over four-on-the-floor is the disco cycle.',
    ],
  },
  bach: { topics: ['bach.cadences', 'bach.chromatic', 'bach.sequences', 'bach.voiceleading'], method: SKILL_HELP['ear.prog.bach'].method },
  all: { topics: ['jazz.turnarounds', 'jazz.tritone', 'soul.neo', 'funk.harmony', 'bach.cadences'], method: JAZZ_EAR },
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
  const chords = randomProgression(NUMERAL_SETS[level], 4, Math.random, (choices) => pickFor('prog.numerals', choices));
  return { key: randomKey(level === 'minor' ? 'minor' : 'major'), chords, picks: [] };
}

const poolOf = (group: Group) => PROGRESSIONS.filter((p) => group === 'all' || p.group === group);
const progName = (id: string) => PROGRESSIONS.find((p) => p.id === id)?.name ?? id;

function newLibQ(group: Group, prev: LibQ | null): LibQ {
  const pool = poolOf(group);
  const def = pickFor('prog.library', pool, prev?.def ?? null, (p) => p.id);
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
  const tally = useTally(
    `prog.${task}`,
    `Progressions · ${TASKS.find((t) => t.id === task)!.label}`,
    task === 'numerals' ? NUMERAL_SETS[level] : poolOf(group).map((p) => p.id),
    task === 'numerals' ? (n) => n : progName,
    task === 'numerals' ? ladder(LEVELS, level, (l) => { setLevel(l); next(task, l); }) : undefined,
  );
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
    tally.record(nq.chords[i], n === nq.chords[i]);
    setNq({ ...nq, picks: [...nq.picks, n] });
  };

  const pickLib = (id: string) => {
    setLq({ ...lq, picked: id });
    tally.record(lq.def.id, id === lq.def.id);
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
      <Bar tally={tally} help={task === 'numerals' ? LEVEL_HELP[level] ?? NUMERAL_HELP : LIB_HELP[group]}>
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
