// Changes: theory in use. A rhythm section loops a progression and every note
// you play is judged against the chord sounding at that moment: hit the 3rds
// and 7ths, land a chord tone on beat 1, or connect guide tones by step.

import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { getChord } from '../theory/chords';
import { mod, N, pc } from '../theory/core';
import { JAZZ_MAJOR_TONICS, JAZZ_MINOR_TONICS, keyFromName, keyName, keyShort, type Key } from '../theory/keys';
import { progressionEvents, progressionInKey, resolveChord } from '../learn/music';
import { input } from '../midi/input';
import type { KeyMark } from '../ui/Keyboard';
import { analyseTokens, scheduleDrums } from '../ui/ProgressionStrip';
import type { Help } from './Lessons';
import { ladder, useTally } from './stats';
import { Bar, Chips, K, Pick, pickOther, playEvents, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';
import { FORM_BY_ID, FORM_GROUPS, FORMS, judge, nearestGuide, roundsFor, slotOf, targetsFor, toneLabels, type ChangesTask, type Form, type Played, type Slot } from './changesLogic';

type Tempo = '70' | '90' | '110' | '130' | '160';
type Show = 'show' | 'hide';

const TASKS: Choice<ChangesTask>[] = [
  { id: 'guide', label: 'Guide tones', title: 'Play a 3rd or 7th of every chord' },
  { id: 'downbeat', label: 'Beat 1', title: 'Land a chord tone (R 3 5 7) on beat 1 of every chord' },
  { id: 'line', label: 'Guide-tone line', title: 'Connect 3rds and 7ths by step or common tone' },
];
const TEMPOS: Choice<Tempo>[] = (['70', '90', '110', '130', '160'] as Tempo[]).map((t) => ({ id: t, label: `♩ = ${t}` }));
const FORM_CHOICES = FORM_GROUPS.map((g) => ({ title: g, options: FORMS.filter((f) => f.group === g).map((f) => ({ id: f.id, label: f.name })) }));

/** 'any' for a random key each time, else the tonic's pitch class */
type KeyPick = string;
// lead-sheet spellings by pitch class: flat major keys, minor keys as written in jazz
const MAJOR_SPELL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_SPELL = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const modeOf = (form: Form) => keyFromName(form.key).mode;
const pickedKey = (form: Form, p: KeyPick): Key | null => {
  if (p === 'any') return null;
  const mode = modeOf(form);
  return { tonic: N((mode === 'minor' ? MINOR_SPELL : MAJOR_SPELL)[Number(p)]), mode };
};
const keyChoices = (form: Form): Choice<KeyPick>[] => [
  { id: 'any', label: 'Any key', title: 'A random key every time' },
  ...MAJOR_SPELL.map((_, i) => ({ id: String(i), label: keyShort(pickedKey(form, String(i))!) })),
];

const HELP: Record<ChangesTask, Help> = {
  guide: {
    topics: ['jazz.iivi', 'core.sevenths', 'core.chordscale'],
    method: [
      'The 3rd and 7th say the chord: 3rd = major or minor, 7th = maj7, ♭7 or (on °7) 𝄫7.',
      'm7: ♭3 and ♭7. 7: 3 and ♭7, a tritone apart. maj7: 3 and 7. m7♭5: ♭3 and ♭7 (the ♭5 is its colour).',
      'Read one chord ahead: a note a little early counts for the next chord, the way players anticipate.',
      'Start slow with the targets shown, then hide them and work them out from the chord symbol.',
    ],
  },
  downbeat: {
    topics: ['core.chordscale', 'core.sevenths', 'jazz.blues'],
    method: [
      'Anything goes between the changes; on beat 1 of each new chord, land on R, 3, 5 or 7.',
      'Aim for the 3rd or 7th: they change the most from chord to chord and sound the change best.',
      'Get there by step: a scale or chromatic note just before beat 1 makes the landing sound intended.',
      'Within ±⅓ beat of the change counts.',
    ],
  },
  line: {
    topics: ['jazz.iivi', 'bach.voiceleading', 'jazz.turnarounds'],
    method: [
      'In a ii–V–I the 7th of one chord falls a half step to the 3rd of the next; the 3rd stays as the next 7th.',
      'So a guide-tone line barely moves: Dm7–G7–Cmaj7 is C–B–B (7→3→7) or F–F–E (3→7→3).',
      'Each chord: play a 3rd or 7th no more than a whole step from the last one you played.',
      'This is how horn backgrounds and shell voicings move. Play the line in the left hand later as comping.',
      'A note a little before a change counts for the next chord, so you can lead into it.',
    ],
  },
};

function randomKey(form: Form, prev: Key | null): Key {
  const mode = modeOf(form);
  const tonics = mode === 'minor' ? JAZZ_MINOR_TONICS : JAZZ_MAJOR_TONICS;
  return { tonic: pickOther(tonics.filter((t) => !prev || pc(t) !== pc(prev.tonic)), null), mode };
}

interface Run {
  state: 'idle' | 'count' | 'play' | 'done';
  slots: Slot[];
  played: Played[];
  beat: number;
}
const IDLE: Run = { state: 'idle', slots: [], played: [], beat: 0.5 };

const typeWord = (typeId: string) => {
  const s = getChord(typeId).symbol;
  return s ? `${s} chords` : 'major chords';
};

export function ChangesMode() {
  useModeCleanup();
  const [task, setTask] = usePref<ChangesTask>('changes.task', 'guide');
  const [formId, setFormId] = usePref<string>('changes.form', 'iivi');
  const [tempo, setTempo] = usePref<Tempo>('changes.tempo', '90');
  const [show, setShow] = usePref<Show>('changes.show', 'show');
  const [keyPick, setKeyPick] = usePref<KeyPick>('changes.key', 'any');
  const form = FORM_BY_ID[formId] ?? FORMS[0];
  const keyFor = (f: Form, p: KeyPick, prev: Key | null) => pickedKey(f, p) ?? randomKey(f, prev);
  const [key, setKey] = useState<Key>(() => keyFor(form, keyPick, null));
  const [run, setRun] = useState<Run>(IDLE);
  const [now, setNow] = useState(0);
  const [wrong, flash] = useFlash(300);
  const timers = useRef<number[]>([]);
  const ticker = useRef(0);

  const symbols = useMemo(() => progressionInKey(form.chords, form.key, key), [form, key]);
  const chords = useMemo(() => symbols.map((s) => resolveChord(s, key)!), [symbols, key]);
  const strip = useMemo(() => analyseTokens(symbols, key), [symbols, key]);
  const rounds = roundsFor(form);
  const pool = [...new Set(chords.map((c) => c.typeId))];
  const tally = useTally(`changes.${task}`, `Changes · ${TASKS.find((t) => t.id === task)!.label}`, pool, typeWord, ladder(TEMPOS, tempo, (t) => change(() => setTempo(t))));
  const running = run.state === 'count' || run.state === 'play';

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    window.clearInterval(ticker.current);
  };
  const stop = () => {
    clear();
    audio.stop();
    audio.stopScheduledClicks();
    setRun(IDLE);
  };
  useEffect(() => () => {
    clear();
    audio.stop();
  }, []);

  const start = () => {
    clear();
    void audio.init();
    audio.stop();
    const bpm = Number(tempo);
    const beat = 60 / bpm;
    const prog = progressionEvents(key, symbols, { bpm, beats: form.beats, style: form.style });
    const t0 = audio.now() + 0.15;
    for (let b = 0; b < 4; b++) audio.drum(b === 0 ? 'accent' : 'click', t0 + b * beat);
    const first = t0 + 4 * beat;
    const slots: Slot[] = [];
    for (let r = 0; r < rounds; r++) {
      const at = first + r * prog.duration;
      playEvents(prog.events, at);
      prog.times.forEach((t, i) => slots.push({ start: at + t, end: at + t + prog.lengths[i], rootPc: chords[i].rootPc, typeId: chords[i].typeId, pos: i }));
    }
    scheduleDrums(first, prog.duration * rounds, beat, form.style);
    audio.drum('accent', first + prog.duration * rounds, 0.5);
    setRun({ state: 'count', slots, played: [], beat });
    const ms = (t: number) => Math.max(0, (t - audio.now()) * 1000);
    timers.current = [
      window.setTimeout(() => setRun((r) => (r.state === 'count' ? { ...r, state: 'play' } : r)), ms(first)),
      window.setTimeout(() => setRun((r) => (r.state === 'play' ? { ...r, state: 'done' } : r)), ms(first + prog.duration * rounds) + 250),
    ];
    ticker.current = window.setInterval(() => setNow(audio.now() - audio.latency()), 40);
  };

  // a finished run goes into the record, one answer per chord
  const results = useMemo(() => judge(task, run.slots, run.played, run.beat), [task, run]);
  useEffect(() => {
    if (run.state !== 'done') return;
    window.clearInterval(ticker.current);
    run.slots.forEach((s, i) => tally.record(s.typeId, results[i].ok));
  }, [run.state]);

  // a random key, or with a key picked, round the cycle: up a 4th each time
  const fixed = keyPick !== 'any';
  const newKey = () => {
    stop();
    if (!fixed) return setKey((k) => randomKey(form, k));
    const next = String(mod(Number(keyPick) + 5, 12));
    setKeyPick(next);
    setKey(pickedKey(form, next)!);
  };
  const keyLabel = fixed ? 'Up a 4th' : 'New key';
  useEffect(() => {
    input.placeRoot(60 + pc(key.tonic));
  }, [key]);

  // the chord sounding now, or the first one during the count-in
  const cur = run.state === 'play' ? slotOf(run.slots, now, 0) : -1;
  const curPos = run.state === 'count' ? 0 : cur >= 0 ? run.slots[cur].pos : -1;
  const lastNote = run.played.length ? run.played[run.played.length - 1].note : 60 + pc(key.tonic);

  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    if (show === 'show' && curPos >= 0) {
      const c = chords[curPos];
      const labels = toneLabels(c.rootPc, c.typeId);
      if (task === 'line') {
        const m = nearestGuide(lastNote, c.rootPc, c.typeId);
        for (const g of targetsFor(task, c.rootPc, c.typeId)) {
          const at = 60 + mod(g - 60, 12);
          marks[at] = { label: labels[g], tone: 'chord' };
        }
        marks[m] = { label: labels[mod(m, 12)], tone: 'target' };
      } else for (const g of targetsFor(task, c.rootPc, c.typeId)) marks[60 + mod(g - 60, 12)] = { label: labels[g], tone: g === c.rootPc ? 'root' : 'chord' };
    }
    for (const n of wrong) marks[n] = { tone: 'wrong' };
    setMarks(marks);
  }, [curPos, show, task, wrong, lastNote, chords]);

  useNoteOn((note, time) => {
    if (!running) return;
    const t = audio.perfToCtx(time);
    setRun((r) => ({ ...r, played: [...r.played, { t, note }] }));
    const i = slotOf(run.slots, t, Math.min(0.15, run.beat * 0.3));
    if (i >= 0 && !targetsFor(task, run.slots[i].rootPc, run.slots[i].typeId).includes(mod(note, 12))) {
      if (task !== 'downbeat' || Math.abs(t - run.slots[i].start) <= Math.min(0.16, run.beat * 0.35)) flash(note);
    }
  });

  useHotkeys((e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (running) stop();
      else start();
    } else if (e.code === 'Enter' && !running) {
      e.preventDefault();
      newKey();
    } else if (e.code === 'Backspace' && running) {
      e.preventDefault();
      stop();
    }
  });

  const change = (fn: () => void) => {
    stop();
    fn();
  };

  // per position: how the latest pass through it went
  const posState = strip.map((_, i) => {
    let st = '';
    run.slots.forEach((s, j) => {
      if (s.pos !== i) return;
      if (run.state === 'done' || (cur >= 0 && j < cur)) st = results[j].ok ? 'ok' : 'bad';
    });
    return st;
  });
  const done = run.state === 'done';
  const okCount = results.filter((r) => r.ok).length;
  const notes = results.reduce((a, r) => a + r.notes, 0);
  const hits = results.reduce((a, r) => a + r.hits, 0);
  const why = done ? [...new Set(results.filter((r) => !r.ok && r.why).map((r) => r.why!))].slice(0, 2).join('; ') : '';
  // beat counts under the chords only when they differ
  const mixed = new Set(form.beats).size > 1;
  const round = cur >= 0 ? Math.floor(cur / chords.length) + 1 : 1;
  // the marks on the keys, on or off at any point, even mid-run
  const targets = (
    <button type="button" className="btn ghost small" aria-pressed={show === 'show'} onClick={() => setShow(show === 'show' ? 'hide' : 'show')}
      title={show === 'show' ? 'Find the notes by ear and theory' : 'Mark the notes to aim for on the keys'}>
      {show === 'show' ? 'Hide targets' : 'Show targets'}
    </button>
  );

  return (
    <div className="s-mode">
      <Bar tally={tally} help={{ ...HELP[task], method: [`${form.name}: ${form.about}`, ...(HELP[task].method ?? [])] }}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => change(() => setTask(t))} />
        <Pick label="Changes" value={form.id} groups={FORM_CHOICES} onChange={(f) => change(() => { setFormId(f); setKey(keyFor(FORM_BY_ID[f], keyPick, null)); })} />
        <Pick label="Key" value={keyPick} options={keyChoices(form)} onChange={(p) => change(() => { setKeyPick(p); setKey(keyFor(form, p, key)); })} />
        <Pick label="Tempo" value={tempo} options={TEMPOS} onChange={(t) => change(() => setTempo(t))} />
      </Bar>

      <section className="s-stage">
        <div className="s-q">
          <h1>{task === 'guide' ? 'Play the 3rds and 7ths' : task === 'downbeat' ? 'Land a chord tone on beat 1' : 'Connect 3rds and 7ths by step'}</h1>
          <p className="sub">{keyName(key)} · {form.name} · {rounds}× around</p>
        </div>
        <ol className={`s-steps prog ${chords.length > 8 ? 'tight' : ''}`} aria-label="Chords">
          {strip.map((c, i) => (
            <li key={i} className={`${posState[i]} ${i === curPos ? 'playing' : ''}`}>
              <span className="n">{c.symbol}</span>
              <span className="d">{c.numeral}{mixed ? ` · ${form.beats[i]}` : ''}</span>
            </li>
          ))}
        </ol>
        <div className="s-status" aria-live="polite">
          {done ? (
            <>
              <strong className={okCount === results.length ? 'good' : okCount >= results.length * 0.75 ? '' : 'bad'}>
                {okCount === results.length ? '✓ ' : ''}{okCount}/{results.length} chords{notes ? ` · ${Math.round((100 * hits) / notes)}% of notes on target` : ''}{why ? ` · missed: ${why}` : ''}
              </strong>
              <button type="button" className="btn primary" onClick={start}>Again <K>Space</K></button>
              <button type="button" className="btn" onClick={newKey}>{keyLabel} <K>Enter</K></button>
              {targets}
            </>
          ) : running ? (
            <>
              <span>{run.state === 'count' ? 'Count-in…' : `Round ${round} of ${rounds}`}</span>
              <button type="button" className="btn" onClick={stop}>■ Stop <K>Space</K></button>
              {targets}
            </>
          ) : (
            <>
              <span className="s-hint s-about">{form.about}</span>
              <button type="button" className="btn primary" onClick={start} title="One bar of clicks, then the band plays">▶ Play <K>Space</K></button>
              <button type="button" className="btn ghost small" onClick={newKey}>{keyLabel} <K>Enter</K></button>
              {targets}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
