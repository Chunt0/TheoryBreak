// Ear: hearing in a key. A cadence sets the key, then name the scale degree of
// a note, play back a melody or a bass line, or name the cadence that ends a phrase.

import { useEffect, useRef, useState } from 'react';
import { PART, type NoteEvent } from '../audio/engine';
import { input } from '../midi/input';
import { cadenceEvents, melodyEvents, progressionEvents, progressionInKey, resolveChord, shiftEvents, tonicMidi } from '../learn/music';
import { midiAtOrAbove, mod, noteName, pc } from '../theory/core';
import { JAZZ_MAJOR_TONICS, JAZZ_MINOR_TONICS, keyName, type Key } from '../theory/keys';
import type { KeyMark } from '../ui/Keyboard';
import { analyseTokens } from '../ui/ProgressionStrip';
import type { Help } from './Lessons';
import { ladder, pickByItems, pickFor, useTally } from './stats';
import { Answers, Bar, Chips, K, Listen, Pick, pickAny, playEvents, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';
import {
  BASS_LINES, CADENCE_BY_ID, CADENCE_SETS, degreeLabel, degreeSet, echoLine, keyModeOf, resolvePath, spellDegree,
  type BassLine, type CadenceSet, type EarKey,
} from './earLogic';

type Task = 'degree' | 'echo' | 'bass' | 'cadence';
type Len = '3' | '4' | '5' | '6';

const TASKS: Choice<Task>[] = [
  { id: 'degree', label: 'Degrees', title: 'A cadence sets the key, then one note: which scale degree?' },
  { id: 'echo', label: 'Echo', title: 'Play back a short melody in the key' },
  { id: 'bass', label: 'Bass line', title: 'Play back the bass line under a progression' },
  { id: 'cadence', label: 'Cadences', title: 'How does the phrase end: authentic, plagal, half, deceptive…' },
];
const KEYS: Choice<EarKey>[] = [
  { id: 'major', label: 'Major key' },
  { id: 'minor', label: 'Minor key' },
  { id: 'chromatic', label: 'Chromatic', title: 'Notes from outside the key: ♭2, ♯4, ♭6, ♭7… (melodies end with an enclosure)' },
];
const LENGTHS: Choice<Len>[] = (['3', '4', '5', '6'] as Len[]).map((n) => ({ id: n, label: `${n} notes` }));
const SETS: Choice<CadenceSet>[] = [
  { id: 'core', label: 'Core four', title: 'Authentic, plagal, half, deceptive' },
  { id: 'all', label: 'All eight', title: '+ Phrygian half, Picardy, backdoor, tritone sub' },
];

/** Degrees each drill can contain: melodies in minor use the natural minor; degrees and bass lines add the leading tone. */
const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10];
const poolFor = (task: Task, k: EarKey): number[] => (task === 'echo' && k === 'minor' ? NATURAL_MINOR : degreeSet(k));

const HELP: Record<Task, Help> = {
  degree: {
    topics: ['core.degrees', 'core.modes'],
    method: [
      'Hold the tonic in your ear after the cadence: hum it quietly.',
      'Sing from the note back home by step and count the steps; the app plays that path after you answer.',
      'Each degree has a pull: 7 leans up to 1, 4 leans down to 3, 2 sits between, 5 is stable but wants to move, 6 is sweet, 3 is bright.',
      'Outside the key: a note that rubs is a half step from a scale note. Which way does it lean? ♭7 drops to 6, ♯4 rises to 5, ♭6 sinks to 5, ♭3 (the blue third) slides to 3 or 2.',
    ],
  },
  echo: {
    topics: ['core.degrees', 'jazz.iivi'],
    method: [
      'Sing it back first, then play it. If you can sing it, finding it is just counting steps.',
      'The first note is marked. From there decide up or down, then step or leap, one note at a time.',
      'Steps follow the key: in major, half steps fall between 3–4 and 7–1.',
      'Chromatic lines end with an enclosure: a scale note above the target, a half step below it, then the target. Bebop players use it to land on chord tones.',
    ],
  },
  bass: {
    topics: ['core.rootmotion', 'core.degrees', 'bach.voiceleading'],
    method: [
      'Hum the lowest voice under the chords; "Bass alone" plays just the bass.',
      'The first bass note is the tonic (or close to it). Then: does each one step, or leap?',
      'Leaps of a 4th or 5th are usually root motion (V–I, ii–V). Steps often mean an inversion: I6, V6 or a passing chord.',
      'Chromatic lines move by half steps between chords that keep the same function: the line cliché, a passing °7, a tritone sub.',
    ],
  },
  cadence: {
    topics: ['bach.cadences', 'jazz.backdoor', 'jazz.tritone'],
    method: [
      'Only the last two chords decide it. Ignore the lead-in.',
      'Does it end on the tonic? No → a half cadence (V), or Phrygian if the bass falls a half step to 5 in minor.',
      'Ends on I: falling 5th in the bass with a leading tone = authentic; IV–I with the "amen" sound = plagal.',
      'Ends somewhere unexpected after V7 (usually vi) = deceptive. Ends major in a minor key = Picardy.',
      'Bass rises a whole step into I from ♭VII7 = backdoor; slides down a half step from ♭II7 = tritone sub.',
    ],
  },
};

interface Q {
  task: Task;
  key: Key;
  /** tonic MIDI note, A3–G♯4 */
  tonic: number;
  /** degree: the note's semitones above the tonic */
  semis: number;
  /** echo / bass: the notes to play back (MIDI) */
  line: number[];
  /** bass: the chords in the key */
  chords: string[];
  bassName: string;
  /** cadence id */
  cadence: string;
}

function randomKey(mode: Key['mode'], prev: Key | null): Key {
  const tonics = (mode === 'minor' ? JAZZ_MINOR_TONICS : JAZZ_MAJOR_TONICS).filter((t) => !prev || prev.mode !== mode || pc(t) !== pc(prev.tonic));
  return { tonic: pickAny(tonics), mode };
}

const skillOf = (task: Task, k: EarKey) => (task === 'cadence' ? 'ear.cadence' : `ear.${task}.${k}`);

function newQ(task: Task, k: EarKey, len: number, set: CadenceSet, prev: Q | null): Q {
  const skill = skillOf(task, k);
  if (task === 'cadence') {
    const id = pickFor(skill, CADENCE_SETS[set], prev?.cadence ?? null);
    const c = CADENCE_BY_ID[id];
    const key = randomKey(c.key === 'Am' ? 'minor' : 'major', prev?.key ?? null);
    return { task, key, tonic: tonicMidi(key, 57), semis: 0, line: [], chords: progressionInKey([...c.lead, ...c.chords], c.key, key), bassName: '', cadence: id };
  }
  const key = randomKey(keyModeOf(k), prev?.key ?? null);
  const tonic = tonicMidi(key, 57);
  const base = { task, key, tonic, semis: 0, line: [] as number[], chords: [] as string[], bassName: '', cadence: '' };
  if (task === 'degree') return { ...base, semis: pickFor(skill, degreeSet(k), prev?.semis ?? null, String) };
  if (task === 'echo') {
    const tries = Array.from({ length: 6 }, () => echoLine(len, k));
    const line = pickByItems(skill, tries, (l) => l.slice(1).map(degreeLabel));
    return { ...base, line: line.map((s) => tonic + s) };
  }
  // bass: a real bass line, leaning toward the degrees you miss
  const pool = BASS_LINES[k].filter((b) => b.name !== prev?.bassName);
  const lowTonic = midiAtOrAbove(pc(key.tonic), 40);
  const bassOf = (b: BassLine) => progressionInKey(b.chords, b.key, key).map((sym) => resolveChord(sym, key)?.bassPc ?? pc(key.tonic));
  const pick = pickByItems(skill, pool, (b) => bassOf(b).slice(1).map((p) => degreeLabel(p - pc(key.tonic))));
  const chords = progressionInKey(pick.chords, pick.key, key);
  return { ...base, chords, bassName: pick.name, line: bassOf(pick).map((p) => midiAtOrAbove(p, lowTonic - 2)) };
}

/** What a question plays. */
function questionEvents(q: Q): NoteEvent[] {
  if (q.task === 'degree' || q.task === 'echo') {
    const cad = cadenceEvents(q.key, 126);
    const at = cad.duration + 0.45;
    const tail = q.task === 'degree' ? [{ note: q.tonic + q.semis, start: 0, dur: 1.4, vel: 100, part: PART.lesson }] : melodyEvents(q.line, 0.42);
    return [...cad.events, ...shiftEvents(tail, at)];
  }
  return progressionEvents(q.key, q.chords, { bpm: q.task === 'bass' ? 84 : 80, beats: 2, style: 'block' }).events;
}

interface Entry {
  /** notes played right so far */
  got: number[];
  /** indexes missed at least once */
  missed: number[];
  /** a picked answer (degree, cadence), or '' when revealed */
  picked: string | null;
  done: boolean;
}
const freshEntry = (): Entry => ({ got: [], missed: [], picked: null, done: false });

export function EarMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('ear.task', 'degree');
  const [ek, setEk] = usePref<EarKey>('ear.key', 'major');
  const [len, setLen] = usePref<Len>('ear.len', '4');
  const [set, setSet] = usePref<CadenceSet>('ear.cadences', 'core');
  const [q, setQ] = useState<Q>(() => newQ(task, ek, Number(len), set, null));
  const [entry, setEntry] = useState<Entry>(freshEntry);
  const [wrong, flash] = useFlash();
  const timer = useRef(0);

  const skill = skillOf(task, ek);
  const pool = task === 'cadence' ? CADENCE_SETS[set] : poolFor(task, ek).map(String);
  const tally = useTally(
    skill,
    `Ear · ${TASKS.find((t) => t.id === task)!.label}${task === 'cadence' ? '' : ` · ${KEYS.find((x) => x.id === ek)!.label}`}`,
    task === 'cadence' || task === 'degree' ? pool : poolFor(task, ek).map(degreeLabel),
    task === 'cadence' ? (id) => CADENCE_BY_ID[id]?.name ?? id : task === 'degree' ? (s) => degreeLabel(Number(s)) : (s) => s,
    task === 'cadence'
      ? ladder(SETS, set, (s) => { setSet(s); next(task, ek, len, s); })
      : task === 'echo' && ek !== 'chromatic'
        ? ladder(LENGTHS, len, (l) => { setLen(l); next(task, ek, l); })
        : ladder(KEYS, ek, (k) => { setEk(k); next(task, k); }),
  );

  const sound = () => playEvents(questionEvents(q));
  const next = (t = task, k = ek, l = len, s = set) => {
    window.clearTimeout(timer.current);
    setQ((p) => newQ(t, k, Number(l), s, p));
    setEntry(freshEntry());
  };

  useEffect(() => {
    input.placeRoot(q.tonic);
    const t = window.setTimeout(sound, 120);
    return () => window.clearTimeout(t);
  }, [q]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const tonicLabel = noteName(q.key.tonic);
  const degName = (m: number) => degreeLabel(m - q.tonic);
  const spelled = (m: number) => noteName(spellDegree(q.key, m - q.tonic));
  const playsBack = task === 'echo' || task === 'bass';

  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    if (task === 'degree' && entry.done) {
      marks[q.tonic] = { label: '1', tone: 'root' };
      marks[q.tonic + q.semis + (q.semis === 0 ? 12 : 0)] = { label: degreeLabel(q.semis), tone: entry.picked === String(q.semis) ? 'ok' : 'target' };
    }
    if (playsBack) {
      const view = (m: number) => (task === 'bass' ? midiAtOrAbove(mod(m, 12), 48) : m);
      if (entry.done) q.line.forEach((m, i) => (marks[view(m)] ??= { label: String(i + 1), tone: entry.missed.includes(i) ? 'target' : 'ok' }));
      else {
        marks[view(q.line[0])] = { label: entry.got.length ? degName(q.line[0]) : 'start', tone: 'root' };
        entry.got.slice(1).forEach((m, i) => (marks[m] = { label: degName(q.line[i + 1]), tone: 'ok' }));
      }
    }
    for (const n of wrong) marks[n] = { tone: 'wrong' };
    setMarks(marks);
  }, [q, entry, wrong, task]);

  // ---------------------------------------------------------- answers
  const pickDegree = (s: string) => {
    if (entry.done) return;
    const ok = s === String(q.semis);
    setEntry({ ...entry, picked: s, done: true });
    tally.record(String(q.semis), ok);
    // walk the note home so its pull is heard
    const path = resolvePath(q.semis, q.key.mode).map((x) => q.tonic + x);
    playEvents(melodyEvents(path, 0.34).map((e) => ({ ...e, start: e.start + 0.15 })));
  };

  const pickCadence = (id: string) => {
    if (entry.done) return;
    setEntry({ ...entry, picked: id, done: true });
    tally.record(q.cadence, id === q.cadence);
  };

  /** Echo and bass: the next note played back. The first note is given, so only the rest count. */
  const playBack = (note: number) => {
    const i = entry.got.length;
    const want = q.line[i];
    if (mod(note, 12) !== mod(want, 12)) {
      flash(note);
      if (i > 0 && !entry.missed.includes(i)) {
        tally.record(degName(want), false);
        setEntry({ ...entry, missed: [...entry.missed, i] });
      }
      return;
    }
    if (i > 0 && !entry.missed.includes(i)) tally.record(degName(want), true);
    const got = [...entry.got, note];
    const done = got.length === q.line.length;
    setEntry({ ...entry, got, done });
    if (done && entry.missed.length === 0) timer.current = window.setTimeout(() => next(), 1400);
  };

  const reveal = () => {
    if (entry.done) return;
    if (task === 'degree') return pickDegree('');
    if (task === 'cadence') return pickCadence('');
    // the notes not played yet count as missed
    for (let i = Math.max(1, entry.got.length); i < q.line.length; i++) if (!entry.missed.includes(i)) tally.record(degName(q.line[i]), false);
    const missed = [...new Set([...entry.missed, ...q.line.map((_, i) => i).filter((i) => i >= Math.max(1, entry.got.length))])];
    setEntry({ ...entry, missed, done: true });
    playEvents(task === 'echo' ? melodyEvents(q.line, 0.42) : questionEvents(q).filter((e) => e.part === PART.bass));
  };

  useNoteOn((note) => {
    if (entry.done) return;
    if (playsBack) playBack(note);
    else if (task === 'degree') {
      const s = mod(note - q.tonic, 12);
      if (degreeSet(ek).includes(s)) pickDegree(String(s));
      else flash(note);
    }
  });

  useHotkeys((e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && entry.done) {
      e.preventDefault();
      next();
    } else if (e.code === 'Space') {
      e.preventDefault();
      sound();
    } else if (e.code === 'Backspace' && playsBack && !entry.done) {
      e.preventDefault();
      setEntry({ ...entry, got: [] });
    }
  });

  // ---------------------------------------------------------- view
  const bassAlone = () => playEvents(questionEvents(q).filter((e) => e.part === PART.bass));
  const strip = task === 'bass' ? analyseTokens(q.chords, q.key) : [];
  const cad = CADENCE_BY_ID[q.cadence];
  const right = entry.done && (task === 'degree' ? entry.picked === String(q.semis) : task === 'cadence' ? entry.picked === q.cadence : entry.missed.length === 0);
  const okCount = q.line.length - 1 - entry.missed.filter((i) => i > 0).length;

  return (
    <div className="s-mode">
      <Bar tally={tally} help={HELP[task]}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => { setTask(t); next(t); }} />
        {task === 'cadence'
          ? <Pick label="Cadences" value={set} options={SETS} onChange={(s) => { setSet(s); next(task, ek, len, s); }} />
          : <Pick label="Key" value={ek} options={KEYS} onChange={(k) => { setEk(k); next(task, k); }} />}
        {task === 'echo' ? <Pick label="Length" value={len} options={LENGTHS} onChange={(l) => { setLen(l); next(task, ek, l); }} /> : null}
      </Bar>

      <section className="s-stage">
        {task === 'degree' ? (
          <>
            <div className="s-q"><h1>Which degree?</h1><p className="sub">{keyName(q.key)} cadence, then one note. Pick it, or play it.</p></div>
            <Answers options={degreeSet(ek).map((s) => ({ id: String(s), label: degreeLabel(s) }))} right={String(q.semis)} picked={entry.done ? entry.picked ?? '' : null} onPick={pickDegree} />
          </>
        ) : task === 'cadence' ? (
          <>
            <div className="s-q"><h1>Which cadence?</h1><p className="sub">{keyName(q.key)} · listen to the last two chords</p></div>
            <ol className="s-steps prog tight" aria-label="Chords">
              {q.chords.map((c, i) => (
                <li key={i} className={i < cad.lead.length ? 'given' : ''}>
                  <span className="n">{entry.done || i < cad.lead.length ? c : '?'}</span>
                  <span className="d">{i < cad.lead.length ? 'lead-in' : ''}</span>
                </li>
              ))}
            </ol>
            {entry.done ? <p className="s-why">{cad.why}</p> : null}
            <Answers wide options={CADENCE_SETS[set].map((id) => ({ id, label: CADENCE_BY_ID[id].name }))} right={q.cadence} picked={entry.done ? entry.picked ?? '' : null} onPick={pickCadence} />
          </>
        ) : (
          <>
            <div className="s-q">
              <h1>{task === 'echo' ? `Play back the ${q.line.length}-note line` : 'Play back the bass line'}</h1>
              <p className="sub">{keyName(q.key)} · starts on {spelled(q.line[0])}{task === 'bass' ? ` · ${q.line.length} chords` : ''}</p>
            </div>
            <ol className={`s-steps ${task === 'bass' ? 'prog' : ''}`} aria-label="Notes">
              {q.line.map((m, i) => {
                const have = i < entry.got.length;
                const state = i === 0 && !have ? 'given' : entry.done ? (entry.missed.includes(i) ? 'bad' : 'ok') : have ? 'ok' : i === entry.got.length ? 'now' : '';
                return (
                  <li key={i} className={state}>
                    <span className="n">{have || entry.done || i === 0 ? spelled(m) : '?'}</span>
                    <span className="d">{entry.done ? (task === 'bass' ? `${strip[i]?.symbol ?? ''} · ${degName(m)}` : degName(m)) : have || i === 0 ? degName(m) : ''}</span>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        <div className="s-status" aria-live="polite">
          {entry.done ? (
            <>
              <strong className={right ? 'good' : 'bad'}>
                {right ? '✓ ' : '✗ '}
                {task === 'degree'
                  ? `${degreeLabel(q.semis)} = ${spelled(q.tonic + q.semis)} in ${keyName(q.key)}`
                  : task === 'cadence'
                    ? `${cad.name}: ${q.chords.slice(cad.lead.length).join(' – ')}`
                    : task === 'bass'
                      ? `${q.bassName}: ${strip.map((s) => s.numeral).join(' – ')}${okCount < q.line.length - 1 ? ` · ${Math.max(0, okCount)}/${q.line.length - 1} first try` : ''}`
                      : `${q.line.map(spelled).join(' – ')}${okCount < q.line.length - 1 ? ` · ${Math.max(0, okCount)}/${q.line.length - 1} first try` : ''}`}
              </strong>
              <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
            </>
          ) : (
            <>
              {playsBack ? <span>Play it on the keys, any octave. <K>⌫</K> starts over.</span> : task === 'degree' ? <span>Keys 1–{Math.min(8, degreeSet(ek).length)} or play the note. Tonic: {tonicLabel}.</span> : null}
              <Listen onClick={sound} label="Again" />
              {task === 'bass' ? <button type="button" className="btn ghost small" onClick={bassAlone}>Bass alone</button> : null}
              {task === 'echo' ? <button type="button" className="btn ghost small" onClick={() => playEvents(melodyEvents(q.line, 0.6))}>Line, slower</button> : null}
              <button type="button" className="btn ghost small" onClick={reveal}>Show me</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
