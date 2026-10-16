import { useCallback, useEffect, useRef, useState } from 'react';
import { audio, PART } from '../../audio/engine';
import { input } from '../../midi/input';
import { store } from '../../app/store';
import { openLesson, overlayOpen } from '../../app/ui';
import { TOPIC_BY_ID } from '../../learn/library';
import { SKILL_BY_ID } from '../../learn/skills';
import { recordAnswer, scheduleSkill, weightedPick } from '../../learn/srs';
import { rankSkills } from '../../learn/session';
import type { Answer, GenContext, Question, Skill, Verdict, Visual } from '../../learn/types';
import { eventsEnd } from '../../learn/music';
import { pcName, pcNameBoth } from '../../theory/core';
import { Keyboard, type KeyMark } from '../Keyboard';
import { Staff } from '../Staff';
import { RhythmGrid, playRhythm } from '../Rhythm';
import { playEvents, stopAll } from '../PlayButton';
import { Icon } from '../Icon';
import { Markdown } from '../Markdown';

export interface RunStats {
  attempts: number;
  correct: number;
  bySkill: Record<string, { attempts: number; correct: number }>;
}

interface Props {
  skills: string[];
  /** stop after this many questions */
  count?: number;
  /** performance.now() deadline; the current question is finished first */
  deadline?: number;
  onFinish?: (s: RunStats) => void;
  /** called after every graded answer */
  onAnswer?: (skill: string, correct: boolean) => void;
  /** show a header with the skill name */
  showSkill?: boolean;
}

/** Drills on screen, newest last: the ? key opens the newest one's help. */
const helpToggles: (() => void)[] = [];
export function toggleExerciseHelp(): boolean {
  const t = helpToggles[helpToggles.length - 1];
  t?.();
  return !!t;
}

/** Practice sets that still owe the scheduler their results (flushed on pagehide). */
const openSets = new Set<() => void>();
export function flushPracticeSets(): void {
  openSets.forEach((f) => f());
}

function makeQuestion(skillId: string): Question {
  const rnd = Math.random;
  const ctx: GenContext = {
    rnd,
    pickItem: (items) => weightedPick(items, store.get().progress.items[skillId], rnd),
  };
  return SKILL_BY_ID[skillId].gen(ctx);
}

function chooseSkill(pool: string[], last: string | null): string {
  if (pool.length === 1) return pool[0];
  const ranked = rankSkills(store.get().progress, pool).filter((s) => s !== last);
  // mostly the neediest, sometimes any (interleaving)
  return Math.random() < 0.65 ? ranked[0] : ranked[Math.floor(Math.random() * ranked.length)];
}

const emptyStats = (): RunStats => ({ attempts: 0, correct: 0, bySkill: {} });

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
};

export function ExerciseRunner({ skills, count, deadline, onFinish, onAnswer, showSkill = true }: Props) {
  const [q, setQ] = useState<Question>(() => makeQuestion(skills[0]));
  const [qn, setQn] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [seq, setSeq] = useState<number[]>([]);
  const [chordSel, setChordSel] = useState<number[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [help, setHelp] = useState(false);
  const statsRef = useRef<RunStats>(emptyStats());
  const lastSkill = useRef<string | null>(skills[0]);
  const chordMax = useRef<Set<number>>(new Set());
  const held = useRef<Set<number>>(new Set());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef<number[]>([]);
  const scheduled = useRef(false);
  const skillsKey = skills.join('|');

  const playQuestionAudio = useCallback(async (question: Question) => {
    if (question.rhythmAudio) {
      await playRhythm(question.rhythmAudio.pattern, question.rhythmAudio.bpm, { countIn: true, withPattern: true });
    } else if (question.audio?.length) {
      await playEvents(question.audio);
    }
  }, []);

  /** Hand this set's results to the spaced-repetition scheduler (once). */
  const flushSchedule = useCallback(() => {
    const by = statsRef.current.bySkill;
    if (scheduled.current || !Object.keys(by).length) return;
    scheduled.current = true;
    store.update((d) => {
      for (const [k, v] of Object.entries(by)) scheduleSkill(d.progress, k, v.attempts, v.correct);
    });
  }, []);

  useEffect(() => {
    openSets.add(flushSchedule);
    return () => {
      openSets.delete(flushSchedule);
      flushSchedule();
    };
  }, [flushSchedule]);

  const showQuestion = useCallback((nq: Question) => {
    setQ(nq);
    setQn((n) => n + 1);
    setVerdict(null);
    setPicked(null);
    setHelp(false);
    setSeq([]);
    seqRef.current = [];
    setChordSel([]);
    chordMax.current = new Set();
    if (nq.input.kind === 'sequence' && nq.input.startHint !== undefined) input.qwertyReach(nq.input.startHint);
    void playQuestionAudio(nq);
  }, [playQuestionAudio]);

  const restart = useCallback(() => {
    flushSchedule();
    const first = chooseSkill(skills, null);
    lastSkill.current = first;
    statsRef.current = emptyStats();
    scheduled.current = false;
    setResults([]);
    setFinished(false);
    showQuestion(makeQuestion(first));
  }, [skills, flushSchedule, showQuestion]);

  // reset when the pool changes
  useEffect(() => {
    restart();
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      stopAll();
    };
  }, [skillsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    setFinished(true);
    flushSchedule();
    onFinish?.(statsRef.current);
  }, [onFinish, flushSchedule]);

  const next = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const done = (count !== undefined && statsRef.current.attempts >= count) || (deadline !== undefined && performance.now() >= deadline);
    if (done) return finish();
    const s = chooseSkill(skills, lastSkill.current);
    lastSkill.current = s;
    stopAll();
    showQuestion(makeQuestion(s));
  }, [count, deadline, finish, skills, showQuestion]);

  useEffect(() => {
    if (finished) return;
    const toggle = () => setHelp((h) => !h);
    helpToggles.push(toggle);
    return () => {
      helpToggles.splice(helpToggles.indexOf(toggle), 1);
    };
  }, [finished]);

  /** Book an answer (or a shown solution, which counts as a miss). */
  const grade = useCallback(
    (v: Verdict) => {
      if (verdict) return;
      setVerdict(v);
      const st = statsRef.current;
      st.attempts++;
      if (v.correct) st.correct++;
      const bs = (st.bySkill[q.skill] ??= { attempts: 0, correct: 0 });
      bs.attempts++;
      if (v.correct) bs.correct++;
      scheduled.current = false;
      setResults((r) => [...r, v.correct]);
      store.update((d) => recordAnswer(d.progress, q.skill, q.item, v.correct));
      onAnswer?.(q.skill, v.correct);
      const afterLen = q.after?.length ? eventsEnd(q.after) : 0;
      if (q.after?.length) void playEvents(q.after);
      if (v.correct && store.get().settings.autoAdvance) {
        advanceTimer.current = setTimeout(next, Math.max(1100, afterLen * 1000 + 350));
      }
    },
    [q, verdict, next, onAnswer],
  );
  const submit = useCallback((a: Answer) => grade(q.check(a)), [q, grade]);
  const reveal = useCallback(() => grade({ correct: false, revealed: true, message: 'counted as a miss, so this one comes back sooner' }), [grade]);

  const addSeq = useCallback(
    (m: number) => {
      if (verdict || q.input.kind !== 'sequence') return;
      seqRef.current = [...seqRef.current, m];
      setSeq(seqRef.current);
      if (seqRef.current.length >= q.input.length) submit({ kind: 'notes', notes: seqRef.current });
    },
    [q, verdict, submit],
  );
  const undoSeq = useCallback(() => {
    seqRef.current = seqRef.current.slice(0, -1);
    setSeq(seqRef.current);
  }, []);
  const clearSeq = useCallback(() => {
    seqRef.current = [];
    setSeq([]);
  }, []);
  const toggleChordNote = useCallback((m: number) => {
    setChordSel((sel) => (sel.includes(m) ? sel.filter((x) => x !== m) : [...sel, m].sort((a, b) => a - b)));
  }, []);

  // ----------------------------------------------------------- live input
  useEffect(() => {
    held.current = new Set();
    return input.on((e) => {
      // finished, or reading a lesson / the shortcut sheet: notes still sound, but answer nothing
      if (finished || overlayOpen()) return;
      if (verdict) {
        if (e.type === 'pad' && e.on) next();
        return;
      }
      const kind = q.input.kind;
      if (e.type === 'pad' && e.on && kind === 'choice') {
        const opt = q.input.options[e.pad];
        if (opt) {
          setPicked(opt.value);
          submit({ kind: 'choice', value: opt.value });
        }
        return;
      }
      if (e.type === 'noteon') {
        if (kind === 'choice' && q.noteToChoice) {
          const v = q.noteToChoice(e.note);
          if (v) {
            setPicked(v);
            submit({ kind: 'choice', value: v });
          }
        } else if (kind === 'note') {
          submit({ kind: 'notes', notes: [e.note] });
        } else if (kind === 'sequence') {
          addSeq(e.note);
        } else if (kind === 'chord') {
          if (e.source !== 'midi') {
            // computer keys and on-screen keys latch: build the chord note by note, Enter submits
            toggleChordNote(e.note);
            return;
          }
          held.current.add(e.note);
          for (const n of held.current) chordMax.current.add(n);
          setChordSel([...chordMax.current].sort((a, b) => a - b));
        }
      }
      if (e.type === 'noteoff' && kind === 'chord' && e.source === 'midi') {
        // a real keyboard: hold the chord, release to submit
        held.current.delete(e.note);
        if (held.current.size === 0 && chordMax.current.size >= 2) {
          const notes = [...chordMax.current];
          chordMax.current = new Set();
          submit({ kind: 'notes', notes });
        } else if (held.current.size === 0) {
          chordMax.current = new Set();
        }
      }
    });
  }, [q, verdict, finished, submit, next, addSeq, toggleChordNote]);

  // computer-keyboard shortcuts: Enter/Space = next (or submit the built chord), Backspace = undo, R = replay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || overlayOpen() || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const kind = q.input.kind;
      if ((e.key === 'Enter' || e.key === ' ') && verdict) {
        e.preventDefault();
        next();
      } else if (e.key === 'Enter' && kind === 'chord' && chordSel.length >= 2) {
        e.preventDefault();
        submit({ kind: 'notes', notes: chordSel });
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && !verdict && (kind === 'chord' || kind === 'sequence')) {
        e.preventDefault();
        if (kind === 'chord') setChordSel([]);
        else undoSeq();
      } else if (e.key.toLowerCase() === 'r' && !e.repeat) {
        void playQuestionAudio(q);
      } else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)) {
        e.preventDefault(); // Space belongs to the drill, not to page scrolling
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [verdict, finished, next, submit, q, chordSel, undoSeq, playQuestionAudio]);

  if (finished) {
    const s = statsRef.current;
    return (
      <div className="card flat center">
        <h3>Set complete</h3>
        <p className="muted">{s.correct}/{s.attempts} correct</p>
        {deadline === undefined ? <button type="button" className="btn small" onClick={restart}>Another set</button> : null}
      </div>
    );
  }

  const skill = SKILL_BY_ID[q.skill];
  const label = q.labelPc ?? ((p: number) => pcName(p));
  const optLabel = (v: string | null) => (q.input.kind === 'choice' ? q.input.options.find((o) => o.value === v)?.label ?? v : v);
  const rightValue = verdict && q.input.kind === 'choice' ? q.input.options.find((o) => q.check({ kind: 'choice', value: o.value }).correct)?.value ?? null : null;
  return (
    <div className="exercise">
      <div className="progress-strip" aria-hidden>
        {(count ? Array.from({ length: count }, (_, i) => results[i]) : [...results.slice(-14), undefined]).map((r, i, arr) => (
          <i key={i} className={r === true ? 'ok' : r === false ? 'no' : i === results.length || (!count && i === arr.length - 1) ? 'cur' : ''} />
        ))}
      </div>
      <div className="q-head">
        <div>
          {showSkill ? <div className="tiny faint">{skill.name}</div> : null}
          <div className="q-prompt">{q.prompt}</div>
          {q.sub ? <div className="q-sub">{q.sub}</div> : null}
        </div>
        <div className="row">
          {q.audio?.length || q.rhythmAudio ? (
            <button type="button" className="btn small" onClick={() => void playQuestionAudio(q)} title="Replay (R)">
              ↻ {q.audioLabel ?? 'Replay'}
            </button>
          ) : null}
          <button type="button" className={`btn small help-btn ${help ? 'active' : ''}`} onClick={() => setHelp(!help)} title="Hint, solution and lesson (?)" aria-expanded={help} aria-label="Help with this question">?</button>
        </div>
      </div>

      {help ? <HelpPanel q={q} skill={skill} answered={!!verdict} onReveal={reveal} /> : null}

      {q.show ? <VisualView v={q.show} satb={q.skill === 'bach.vl'} /> : null}

      <AnswerArea
        key={qn}
        q={q}
        verdict={verdict}
        picked={picked}
        seq={seq}
        chordSel={chordSel}
        label={label}
        setChordSel={setChordSel}
        toggleChordNote={toggleChordNote}
        clearSeq={clearSeq}
        submit={(a) => {
          if (a.kind === 'choice') setPicked(a.value);
          submit(a);
        }}
      />

      {verdict ? (
        <div className={`feedback ${verdict.revealed ? 'sol' : verdict.correct ? 'ok' : 'no'}`}>
          <div className="row between">
            <h3>{verdict.revealed ? 'Solution' : verdict.correct ? '✓ Correct' : '✗ Not quite'}{verdict.message ? <span className="muted small"> — {verdict.message}</span> : null}</h3>
            <div className="row">
              {!verdict.correct && TOPIC_BY_ID[q.lesson ?? skill.lesson] ? (
                <button type="button" className="btn small ghost" onClick={() => openLesson(q.lesson ?? skill.lesson)}><Icon name="topic" size={14} /> Lesson</button>
              ) : null}
              {!verdict.correct && q.optionAudio && picked && rightValue ? (
                <>
                  <button type="button" className="btn small" onClick={() => void playEvents(q.optionAudio!(picked))}>▶ Yours: {optLabel(picked)}</button>
                  <button type="button" className="btn small" onClick={() => void playEvents(q.optionAudio!(rightValue))}>▶ Right: {optLabel(rightValue)}</button>
                </>
              ) : null}
              {q.after?.length ? <button type="button" className="btn small" onClick={() => void playEvents(q.after!)}>▶ Hear answer</button> : null}
              <button type="button" className="btn primary small" onClick={next}>Next ⏎</button>
            </div>
          </div>
          <p style={{ margin: '6px 0 0' }}>{q.explain}</p>
          {q.optionAudio ? <p className="tiny faint" style={{ margin: '4px 0 0' }}>Click any option to hear it.</p> : null}
          {verdict.reveal ? <VisualView v={verdict.reveal} satb={q.skill === 'bach.vl'} /> : q.reveal ? <VisualView v={q.reveal} satb={q.skill === 'bach.vl'} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function HelpPanel({ q, skill, answered, onReveal }: { q: Question; skill: Skill; answered: boolean; onReveal: () => void }) {
  const lesson = TOPIC_BY_ID[q.lesson ?? skill.lesson];
  const tap = q.input.kind === 'rhythm' ? q.input : null;
  const canReveal = !answered && !tap;
  return (
    <div className="help-panel">
      {q.hint ? <p><strong>Hint.</strong> <Markdown md={q.hint} inlineOnly /></p> : null}
      {q.hintAudio || q.rhythmAudio || tap ? (
        <div className="row">
          {q.hintAudio ? <button type="button" className="btn small" onClick={() => void playEvents(q.hintAudio!.events)}>▶ {q.hintAudio.label}</button> : null}
          {q.rhythmAudio ? <button type="button" className="btn small" onClick={() => void playRhythm(q.rhythmAudio!.pattern, Math.round(q.rhythmAudio!.bpm * 0.7), { countIn: true, withPattern: true })}>▶ Slower</button> : null}
          {tap ? <button type="button" className="btn small" onClick={() => void playRhythm(tap.pattern, Math.round(tap.bpm * 0.7), { countIn: true, withPattern: true })}>▶ Hear it slower</button> : null}
        </div>
      ) : null}
      <div className="small">
        <strong>How to work it out</strong>
        <ol>{skill.method.map((m, i) => <li key={i}><Markdown md={m} inlineOnly /></li>)}</ol>
      </div>
      <div className="row between">
        <div className="row">
          {canReveal ? <button type="button" className="btn small" onClick={onReveal}>Show solution</button> : null}
          {lesson ? <button type="button" className="btn small" onClick={() => openLesson(lesson.id)}><Icon name="topic" size={14} /> Lesson: {lesson.title}</button> : null}
        </div>
        {canReveal ? <span className="tiny faint">A shown solution counts as a miss.</span> : null}
      </div>
    </div>
  );
}

function blip(m: number): void {
  void audio.init();
  audio.noteOn(PART.lesson, m, 90);
  setTimeout(() => audio.noteOff(PART.lesson, m), 350);
}

function VisualView({ v, satb }: { v: Visual; satb?: boolean }) {
  return (
    <div className="col">
      {v.title ? <div className="small muted">{v.title}</div> : null}
      {v.staff ? <Staff chords={v.staff.chords} satb={satb} /> : null}
      {v.keyboard ? (
        <Keyboard
          className="kb-show"
          range={v.keyboard.range ?? [48, 84]}
          marks={Object.fromEntries(v.keyboard.notes.map((n) => [n, { label: v.keyboard!.labels?.[n], tone: v.keyboard!.tones?.[n] ?? 'chord' } satisfies KeyMark]))}
        />
      ) : null}
      {v.rhythm ? <RhythmGrid pattern={v.rhythm.pattern} marks={v.rhythm.marks} /> : null}
    </div>
  );
}

interface AnswerProps {
  q: Question;
  verdict: Verdict | null;
  picked: string | null;
  seq: number[];
  chordSel: number[];
  label: (pc: number) => string;
  setChordSel: (n: number[]) => void;
  toggleChordNote: (m: number) => void;
  clearSeq: () => void;
  submit: (a: Answer) => void;
}

function AnswerArea({ q, verdict, picked, seq, chordSel, label, setChordSel, toggleChordNote, clearSeq, submit }: AnswerProps) {
  const inp = q.input;
  if (inp.kind === 'choice') {
    const correctValue = verdict ? inp.options.find((o) => q.check({ kind: 'choice', value: o.value }).correct)?.value : undefined;
    const compare = !!verdict && !!q.optionAudio;
    return (
      <div className={`choices cols-${inp.columns ?? 'auto'} ${compare ? 'compare' : ''}`}>
        {inp.options.map((o, i) => {
          const state = verdict ? (o.value === correctValue ? 'correct' : o.value === picked ? 'wrong' : '') : '';
          return (
            <button
              key={o.value}
              type="button"
              className={`choice ${state}`}
              disabled={!!verdict && !compare}
              title={compare ? 'Hear this option' : undefined}
              onClick={() => (verdict ? q.optionAudio && void playEvents(q.optionAudio(o.value)) : submit({ kind: 'choice', value: o.value }))}
            >
              <span className="padno">{i < 8 ? i + 1 : ''}</span>
              {o.rhythm ? <RhythmGrid pattern={o.rhythm} /> : null}
              {o.rhythm ? null : o.label}
              {o.sub ? <span className="csub">{o.sub}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }
  if (inp.kind === 'note') {
    return (
      <div className="col">
        <div className="notegrid">
          {Array.from({ length: 12 }, (_, p) => (
            <button key={p} type="button" className={[1, 3, 6, 8, 10].includes(p) ? 'blk' : ''} disabled={!!verdict} onClick={() => { blip(60 + p); submit({ kind: 'notes', notes: [60 + p] }); }}>
              {pcNameBoth(p)}
            </button>
          ))}
        </div>
        <div className="tiny faint">Or play it on your MIDI keyboard / computer keys.</div>
      </div>
    );
  }
  if (inp.kind === 'chord') {
    return (
      <div className="col">
        <Keyboard
          className="kb-answer"
          range={[48, 83]}
          marks={Object.fromEntries(chordSel.map((n) => [n, { label: label(n % 12), tone: 'accent' as const }]))}
          onDown={verdict ? undefined : (m) => { blip(m); toggleChordNote(m); }}
        />
        <div className="row between">
          <span className="small muted">
            MIDI: hold the chord, release to submit. Computer keys or clicks: build it note by note — <span className="kbd">Enter</span> submits, <span className="kbd">⌫</span> clears.
          </span>
          <div className="row">
            <button type="button" className="btn small" onClick={() => setChordSel([])} disabled={!!verdict || !chordSel.length}>Clear</button>
            <button type="button" className="btn small primary" disabled={!!verdict || chordSel.length < 2} onClick={() => submit({ kind: 'notes', notes: chordSel })}>Submit ⏎</button>
          </div>
        </div>
      </div>
    );
  }
  if (inp.kind === 'sequence') {
    return (
      <div className="col">
        <div className="seq-dots">
          {Array.from({ length: inp.length }, (_, i) => (
            <span key={i} className={seq[i] !== undefined ? 'filled' : ''}>{seq[i] !== undefined ? label(seq[i] % 12) : ''}</span>
          ))}
        </div>
        <Keyboard
          className="kb-answer"
          range={[48, 83]}
          marks={inp.startHint !== undefined && !seq.length ? { [inp.startHint]: { label: 'start', tone: 'target' } } : {}}
          onDown={verdict ? undefined : (m) => input.screenNoteOn(m)}
          onUp={(m) => input.screenNoteOff(m)}
        />
        <div className="row between">
          <span className="small muted">Octave doesn't matter. <span className="kbd">⌫</span> takes back the last note.</span>
          <button type="button" className="btn small" disabled={!!verdict || !seq.length} onClick={clearSeq}>Clear</button>
        </div>
      </div>
    );
  }
  return <RhythmInput q={q} disabled={!!verdict} submit={submit} />;
}

function RhythmInput({ q, disabled, submit }: { q: Question; disabled: boolean; submit: (a: Answer) => void }) {
  const inp = q.input as Extract<Question['input'], { kind: 'rhythm' }>;
  const [state, setState] = useState<'idle' | 'countin' | 'recording'>('idle');
  const [step, setStep] = useState<number | undefined>(undefined);
  const taps = useRef<number[]>([]);
  const bar = useRef<{ barStart: number; barLength: number } | null>(null);
  const raf = useRef(0);

  const start = async () => {
    taps.current = [];
    setState('countin');
    bar.current = await playRhythm(inp.pattern, inp.bpm, { countIn: true, withPattern: false });
    const tick = () => {
      const b = bar.current;
      if (!b) return;
      const t = audio.now() - audio.latency() - b.barStart;
      if (t >= 0) setState('recording');
      setStep(t >= 0 && t < b.barLength ? Math.floor((t / b.barLength) * inp.pattern.steps) : undefined);
      if (t < b.barLength + 0.35) raf.current = requestAnimationFrame(tick);
      else {
        const offsetMs = store.get().settings.tapOffsetMs;
        bar.current = null;
        submit({ kind: 'taps', offsets: taps.current.map((x) => x - offsetMs / 1000) });
        setState('idle');
        setStep(undefined);
      }
    };
    raf.current = requestAnimationFrame(tick);
  };
  // listeners below are bound once; read the latest values through a ref
  const live = useRef({ state, disabled, start });
  live.current = { state, disabled, start };

  useEffect(() => {
    const record = (perfMs: number) => {
      const b = bar.current;
      if (!b) return;
      const t = audio.perfToCtx(perfMs) - b.barStart;
      if (t > -0.25 && t < b.barLength + 0.25) taps.current.push(t);
    };
    // idle: Enter, Space or a pad starts the count-in; afterwards they tap
    const startIfIdle = () => {
      const l = live.current;
      if (l.state !== 'idle' || l.disabled || overlayOpen()) return false;
      void l.start();
      return true;
    };
    const off = input.on((e) => {
      if (e.type === 'pad' && e.on && startIfIdle()) return;
      if ((e.type === 'pad' && e.on) || e.type === 'noteon') record(e.time);
    });
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.repeat || overlayOpen()) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        if (live.current.disabled) return;
        e.preventDefault();
        if (!startIfIdle() && e.code === 'Space') record(e.timeStamp);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      off();
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div className="col">
      <RhythmGrid pattern={inp.pattern} now={step} />
      <div className="row between">
        <span className="small muted">
          {state === 'countin' ? 'Count-in… 1 2 3 4' : state === 'recording' ? 'Tap now!' : <>Press <span className="kbd">Space</span> (or a pad) to start the count-in, then tap with Space, pads or keys.</>}
        </span>
        <div className="row">
          <button type="button" className="btn small" onClick={() => void playRhythm(inp.pattern, inp.bpm, { countIn: true, withPattern: true })} disabled={state !== 'idle'}>▶ Hear it</button>
          <button type="button" className="btn small primary" onClick={() => void start()} disabled={disabled || state !== 'idle'}>● Start</button>
        </div>
      </div>
    </div>
  );
}
