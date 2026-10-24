import { useEffect, useState } from 'react';
import { input } from '../midi/input';
import { chordNotes, chordSymbol, getChord } from '../theory/chords';
import { INTERVALS, mod, noteName, pc, spellPc, type Note } from '../theory/core';
import { diatonicChords, FUNCTION_NAMES, keyName, MAJOR_KEYS, relativeMinor, type Key, type KeyChord } from '../theory/keys';
import type { KeyMark } from '../ui/Keyboard';
import { SKILL_HELP } from '../learn/help';
import type { Help } from './Lessons';
import { ladder, pickFor, useTally } from './stats';
import { Answers, Bar, Chips, K, Listen, Pick, pickAny, playBlock, playLine, ROOTS, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';

type Task = 'build' | 'hear' | 'key';
type Level = 'triads' | 'sevenths' | 'sixsus' | 'ext' | 'alt';
type Inv = 'root' | 'any' | 'ask';
type KeyMode = 'major' | 'minor';
const TASKS: Choice<Task>[] = [
  { id: 'build', label: 'Build it' },
  { id: 'hear', label: 'Hear it' },
  { id: 'key', label: 'In a key', title: 'Roman numerals: build the vi7 in E♭' },
];
const LEVELS: Choice<Level>[] = [
  { id: 'triads', label: 'Triads' },
  { id: 'sevenths', label: '7ths' },
  { id: 'sixsus', label: '6ths, sus, add9' },
  { id: 'ext', label: '9ths–13ths' },
  { id: 'alt', label: 'Altered dominants' },
];
const SETS: Record<Level, string[]> = {
  triads: ['maj', 'min', 'dim', 'aug'],
  sevenths: ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mmaj7'],
  sixsus: ['maj6', 'min6', 'sus2', 'sus4', '7sus4', 'add9'],
  ext: ['maj9', 'dom9', 'min9', '69', 'min11', 'dom13', 'maj7s11'],
  alt: ['7b9', '7s9', '7s11', '7b13', 'aug7', '7alt'],
};
const INVS: Choice<Inv>[] = [
  { id: 'any', label: 'Any voicing' },
  { id: 'root', label: 'Root position' },
  { id: 'ask', label: 'Named inversions' },
];
const KEY_MODES: Choice<KeyMode>[] = [{ id: 'major', label: 'Major keys' }, { id: 'minor', label: 'Minor keys' }];
const INV_NAMES = ['root position', '1st inversion', '2nd inversion', '3rd inversion'];

interface Q {
  root: Note;
  type: string;
  /** chord tone that must be lowest (0 = root) when an inversion is asked for */
  inv: number;
  /** "In a key" questions */
  key?: Key;
  kc?: KeyChord;
}

/** Diatonic chords of a key; minor keys borrow V(7) and vii°(7) from harmonic minor, as players do. */
function keyChords(k: Key, sevenths: boolean): KeyChord[] {
  const nat = diatonicChords(k, sevenths, 'natural');
  if (k.mode === 'major') return nat;
  const harm = diatonicChords(k, sevenths, 'harmonic');
  return nat.map((c, i) => (i === 4 || i === 6 ? harm[i] : c));
}

/** What the record keeps for In a key: the numeral and the mode ("major:vi7"). */
const keyItem = (mode: KeyMode, numeral: string) => `${mode}:${numeral}`;
const itemLabel = (item: string) => {
  const [mode, numeral] = item.split(':');
  return mode === 'major' || mode === 'minor' ? `${numeral} in ${mode}` : getChord(item).name;
};

const hearHelp = (h: string): Help => ({ topics: [SKILL_HELP[h].lesson, 'core.tensions', 'jazz.voicings'].filter((t, i, a) => a.indexOf(t) === i), method: SKILL_HELP[h].method });
const HELP: Record<Task, Record<Level, Help>> = {
  build: {
    triads: { topics: ['core.intervals', 'core.sevenths'], method: SKILL_HELP['gym.spell.7'].method },
    sevenths: { topics: ['core.sevenths', 'jazz.voicings'], method: SKILL_HELP['gym.spell.7'].method },
    sixsus: { topics: ['core.sevenths', 'core.tensions'], method: SKILL_HELP['gym.spell.7'].method },
    ext: { topics: ['core.tensions', 'jazz.voicings', 'jazz.ust'], method: [...SKILL_HELP['gym.spell.ext'].method, ...SKILL_HELP['gym.play.ext'].method.slice(0, 2)] },
    alt: { topics: ['core.tensions', 'jazz.ust', 'core.melodic'], method: [...SKILL_HELP['gym.spell.ext'].method, SKILL_HELP['gym.play.ext'].method[2]] },
  },
  hear: { triads: hearHelp('ear.chord.inv'), sevenths: hearHelp('ear.chord.7'), sixsus: hearHelp('ear.chord.ext'), ext: hearHelp('ear.chord.ext'), alt: hearHelp('ear.chord.alt') },
  key: Object.fromEntries((['triads', 'sevenths', 'sixsus', 'ext', 'alt'] as Level[]).map((l) => [l, { topics: ['core.diatonic', 'core.modes', 'jazz.secondary'], method: SKILL_HELP['gym.keys7'].method.slice(0, 2) }])) as Record<Level, Help>,
};

const MINOR_KEY_HELP: Help = {
  topics: ['core.diatonic', 'jazz.minor', 'core.modes'],
  method: [
    'Minor keys here are natural minor with the raised 7th for V and vii° — the way players use them.',
    'Triads: i ii° ♭III iv V ♭VI vii°. 7ths: i7 iiø7 ♭IIImaj7 iv7 V7 ♭VImaj7 vii°7.',
    'Find the root on that degree (♭III a minor 3rd up, ♭VI a minor 6th up, vii° a half step below the tonic), then apply the quality.',
  ],
};

function newQ(task: Task, level: Level, inv: Inv, keyMode: KeyMode, prev: Q | null): Q {
  if (task === 'key') {
    const major = pickAny(MAJOR_KEYS.filter((m) => Math.abs(m.sig) <= 6)).tonic;
    const key: Key = { tonic: keyMode === 'major' ? major : relativeMinor(major), mode: keyMode };
    const chords = keyChords(key, level !== 'triads');
    const kc = pickFor('chord.key', chords, prev?.kc ? chords.find((c) => c.degree === prev.kc!.degree) ?? null : null, (c) => keyItem(keyMode, c.numeral));
    return { root: kc.root, type: kc.typeId, inv: 0, key, kc };
  }
  const type = pickFor(`chord.${task}`, SETS[level], prev?.type ?? null);
  const tones = getChord(type).intervals.length;
  const canInvert = level === 'triads' || level === 'sevenths';
  let root = ROOTS[Math.floor(Math.random() * 12)];
  // write D♭° as C♯° and F♯+ as G♭+: no double sharps or flats unless the key demands them
  if (chordNotes(root, type).some((n) => Math.abs(n.acc) > 1)) root = spellPc(pc(root), root.acc < 0 ? 'sharp' : 'flat');
  return { root, type, inv: task === 'build' && inv === 'ask' && canInvert ? Math.floor(Math.random() * tones) : 0 };
}

/** Root-position voicing from C3–B3 upward, extensions above the octave. */
const voicing = (root: Note, type: string): number[] => getChord(type).intervals.map((i) => 48 + pc(root) + INTERVALS[i].semis);

export function ChordsMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('chord.task', 'build');
  const [level, setLevel] = usePref<Level>('chord.level', 'triads');
  const [inv, setInv] = usePref<Inv>('chord.inv', 'any');
  const [keyMode, setKeyMode] = usePref<KeyMode>('chord.keyMode', 'major');
  const [q, setQ] = useState<Q>(() => newQ(task, level, inv, keyMode, null));
  const [found, setFound] = useState<Map<number, number>>(new Map()); // pc → MIDI note played
  const [answer, setAnswer] = useState<{ ok: boolean; picked: string | null } | null>(null);
  const [misses, setMisses] = useState(0);
  const [wrong, flash] = useFlash();
  const [said, setSaid] = useState('');
  const pool = task === 'key' && q.key ? keyChords(q.key, level !== 'triads').map((c) => keyItem(keyMode, c.numeral)) : SETS[level];
  const steps = task === 'key'
    ? ladder(LEVELS.slice(0, 2), level === 'triads' ? 'triads' : 'sevenths', (l) => { setLevel(l); next(task, l); })
    : ladder(LEVELS, level, (l) => { setLevel(l); next(task, l); });
  const tally = useTally(`chord.${task}`, `Chords · ${TASKS.find((t) => t.id === task)!.label}`, pool, itemLabel, steps);

  const type = getChord(q.type);
  const spelled = chordNotes(q.root, q.type);
  const pcs = spelled.map(pc);
  const degrees = type.intervals.map((i) => (i === 'P1' ? '1' : INTERVALS[i].degree));
  // extended and altered chords may drop the 5th (and 9th under a 13th), like real voicings
  const loose = level === 'ext' || level === 'alt';
  const required = pcs.filter((_, i) => !(loose && type.optional?.includes(type.intervals[i])));
  const notes = voicing(q.root, q.type);
  const symbol = chordSymbol(q.root, q.type, q.inv ? spelled[q.inv] : null);
  const building = task !== 'hear';
  const strictRoot = task === 'build' && inv === 'root';

  const next = (t = task, l = level, i = inv, km = keyMode) => {
    setQ((p) => newQ(t, l, i, km, p));
    setAnswer(null);
    setFound(new Map());
    setMisses(0);
    setSaid('');
  };

  useEffect(() => {
    input.placeRoot(60 + pc(q.root));
    if (task === 'hear') {
      playBlock(notes, 1.2);
      playLine(notes, 0.28, 0.3, 1.4);
    }
  }, [q, task]);

  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    if (answer && (task === 'hear' || !answer.ok)) notes.forEach((m, i) => (marks[m + 12] = { label: noteName(spelled[i]), tone: i === 0 ? 'root' : 'chord' }));
    for (const [p, m] of found) marks[m] = { label: noteName(spelled[pcs.indexOf(p)]), tone: 'ok' };
    for (const n of wrong) marks[n] = { tone: 'wrong' };
    setMarks(marks);
  }, [q, task, answer, found, wrong]);

  const settle = (ok: boolean, picked: string | null) => {
    setAnswer({ ok, picked });
    tally.record(task === 'key' && q.kc ? keyItem(keyMode, q.kc.numeral) : q.type, ok);
  };

  useNoteOn((note) => {
    if (!building || answer) return;
    const p = mod(note, 12);
    if (!pcs.includes(p)) {
      flash(note);
      setMisses((m) => m + 1);
      return;
    }
    const got = new Map(found).set(p, note);
    setFound(got);
    if (!required.every((r) => got.has(r))) return;
    const played = [...got.values()].sort((a, b) => a - b);
    const bassPc = mod(played[0], 12);
    if ((q.inv > 0 || strictRoot) && bassPc !== pcs[q.inv]) {
      // all the right notes, wrong one at the bottom: try again
      setSaid(`All the notes — but ${noteName(spelled[pcs.indexOf(bassPc)])} is lowest. ${INV_NAMES[q.inv][0].toUpperCase()}${INV_NAMES[q.inv].slice(1)} puts ${noteName(spelled[q.inv])} in the bass.`);
      setFound(new Map());
      setMisses((m) => m + 1);
      return;
    }
    settle(misses === 0, q.type);
    window.setTimeout(() => playBlock(played, 1.2), 120);
    window.setTimeout(() => next(), 1600);
  });

  const replay = () => {
    if (task === 'hear') {
      playBlock(notes, 1.2);
      playLine(notes, 0.28, 0.3, 1.4);
    } else playBlock(notes, 1.2);
  };

  useHotkeys((e) => {
    if (e.code === 'Backspace') {
      e.preventDefault();
      setFound(new Map());
    } else if ((e.code === 'Space' || e.code === 'Enter') && answer) {
      e.preventDefault();
      next();
    } else if (e.code === 'Space' && task === 'hear') {
      e.preventDefault();
      replay();
    }
  });

  const showTones = !!answer || misses >= 2;
  const chordFact = `${symbol} = ${spelled.map(noteName).join(' ')}`;

  return (
    <div className="s-mode">
      <Bar tally={tally} help={task === 'key' && keyMode === 'minor' ? MINOR_KEY_HELP : HELP[task][level]}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => { setTask(t); next(t); }} />
        {task === 'key' ? (
          <>
            <Pick label="Keys" value={keyMode} options={KEY_MODES} onChange={(m) => { setKeyMode(m); next(task, level, inv, m); }} />
            <Pick label="Chords" value={level === 'triads' ? 'triads' : 'sevenths'} options={LEVELS.slice(0, 2)} onChange={(l) => { setLevel(l); next(task, l); }} />
          </>
        ) : (
          <Pick label="Chords" value={level} options={LEVELS} onChange={(l) => { setLevel(l); next(task, l); }} />
        )}
        {task === 'build' ? <Pick label="Voicing" value={inv} options={INVS} onChange={(i) => { setInv(i); next(task, level, i); }} /> : null}
      </Bar>

      <section className="s-stage">
        {task === 'hear' ? (
          <>
            <div className="s-q"><h1>Which chord?</h1><p className="sub">Played together, then broken upward</p></div>
            <Answers options={SETS[level].map((id) => ({ id, label: getChord(id).name }))} right={q.type} picked={answer ? answer.picked ?? '' : null} onPick={(id) => settle(id === q.type, id)} />
          </>
        ) : (
          <>
            <div className="s-q">
              {task === 'key' && q.key && q.kc ? (
                <>
                  <h1>{q.kc.numeral} <span className="muted">in</span> {keyName(q.key)}</h1>
                  <p className="sub">{FUNCTION_NAMES[q.kc.fn]} function</p>
                </>
              ) : (
                <>
                  <h1 className="symbol">{symbol}</h1>
                  <p className="sub">{noteName(q.root)} {type.name.toLowerCase()}{q.inv ? `, ${INV_NAMES[q.inv]}` : ''}</p>
                </>
              )}
            </div>
            <ol className="s-steps" aria-label="Chord tones">
              {pcs.map((p, i) => (
                <li key={p} className={found.has(p) ? 'ok' : `${required.includes(p) ? '' : 'opt'} ${wrong.size ? 'shake' : ''}`}>
                  <span className="n">{found.has(p) || showTones ? noteName(spelled[i]) : '?'}</span>
                  <span className="d">{task === 'key' && !showTones ? '·' : degrees[i]}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="s-status" aria-live="polite">
          {answer ? (
            <>
              <strong className={answer.ok ? 'good' : 'bad'}>
                {answer.ok ? '✓ ' : '✗ '}
                {task === 'key' && q.kc && q.key ? `${q.kc.numeral} in ${keyName(q.key)} is ${chordFact}` : task === 'hear' ? `${type.name}: ${chordFact}` : chordFact}
              </strong>
              <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
            </>
          ) : building ? (
            <>
              <span className={said ? 'bad' : ''}>
                {said || <>Play it: any order{q.inv || strictRoot ? `, ${noteName(spelled[q.inv])} lowest` : ', any octave'}{loose && required.length < pcs.length ? '; faded tones are optional' : ''}{misses >= 2 ? ' — notes revealed' : ''}.</>}
              </span>
              {found.size ? <button type="button" className="btn ghost small" onClick={() => setFound(new Map())}>Clear <K>⌫</K></button> : null}
              <button type="button" className="btn ghost small" onClick={() => { settle(false, null); playBlock(notes, 1.2); }}>Show me</button>
            </>
          ) : (
            <>
              <span>Keys 1–{Math.min(8, SETS[level].length)} answer.</span>
              <Listen onClick={replay} label="Again" />
            </>
          )}
        </div>
        {/* the description names the quality, so it waits for the answer unless the symbol already shows it */}
        {task === 'build' || answer ? <p className="s-info">{type.sound}</p> : null}
      </section>
    </div>
  );
}
