import { useCallback, useEffect, useRef, useState } from 'react';
import { audio, PART } from '../../audio/engine';
import { input } from '../../midi/input';
import { store } from '../../app/store';
import { SKILL_BY_ID } from '../../learn/skills';
import { recordAnswer, weightedPick } from '../../learn/srs';
import { rankSkills } from '../../learn/session';
import type { Answer, GenContext, Question, Verdict, Visual } from '../../learn/types';
import { eventsEnd } from '../../learn/music';
import { pcName, pcNameBoth } from '../../theory/core';
import { Keyboard, type KeyMark } from '../Keyboard';
import { Staff } from '../Staff';
import { RhythmGrid, playRhythm } from '../Rhythm';
import { playEvents, stopAll } from '../PlayButton';

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
  /** show a header with the skill name */
  showSkill?: boolean;
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

export function ExerciseRunner({ skills, count, deadline, onFinish, showSkill = true }: Props) {
  const [q, setQ] = useState<Question>(() => makeQuestion(skills[0]));
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [seq, setSeq] = useState<number[]>([]);
  const [chordSel, setChordSel] = useState<number[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const statsRef = useRef<RunStats>({ attempts: 0, correct: 0, bySkill: {} });
  const lastSkill = useRef<string | null>(skills[0]);
  const chordMax = useRef<Set<number>>(new Set());
  const held = useRef<Set<number>>(new Set());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef<number[]>([]);
  const skillsKey = skills.join('|');

  const playQuestionAudio = useCallback(async (question: Question) => {
    if (question.rhythmAudio) {
      await playRhythm(question.rhythmAudio.pattern, question.rhythmAudio.bpm, { countIn: true, withPattern: true });
    } else if (question.audio?.length) {
      await playEvents(question.audio);
    }
  }, []);

  // reset when the pool changes
  useEffect(() => {
    const first = chooseSkill(skills, null);
    lastSkill.current = first;
    const nq = makeQuestion(first);
    setQ(nq);
    setVerdict(null);
    setPicked(null);
    setSeq([]);
    seqRef.current = [];
    setChordSel([]);
    setResults([]);
    setFinished(false);
    statsRef.current = { attempts: 0, correct: 0, bySkill: {} };
    void playQuestionAudio(nq);
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      stopAll();
    };
  }, [skillsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    setFinished(true);
    onFinish?.(statsRef.current);
  }, [onFinish]);

  const next = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const done = (count !== undefined && statsRef.current.attempts >= count) || (deadline !== undefined && performance.now() >= deadline);
    if (done) return finish();
    const s = chooseSkill(skills, lastSkill.current);
    lastSkill.current = s;
    const nq = makeQuestion(s);
    stopAll();
    setQ(nq);
    setVerdict(null);
    setPicked(null);
    setSeq([]);
    seqRef.current = [];
    setChordSel([]);
    chordMax.current = new Set();
    void playQuestionAudio(nq);
  }, [count, deadline, finish, skills, playQuestionAudio]);

  const submit = useCallback(
    (a: Answer) => {
      if (verdict) return;
      const v = q.check(a);
      setVerdict(v);
      const st = statsRef.current;
      st.attempts++;
      if (v.correct) st.correct++;
      const bs = (st.bySkill[q.skill] ??= { attempts: 0, correct: 0 });
      bs.attempts++;
      if (v.correct) bs.correct++;
      setResults((r) => [...r, v.correct]);
      store.update((d) => recordAnswer(d.progress, q.skill, q.item, v.correct));
      const afterLen = q.after?.length ? eventsEnd(q.after) : 0;
      if (q.after?.length) void playEvents(q.after);
      if (v.correct && store.get().settings.autoAdvance) {
        advanceTimer.current = setTimeout(next, Math.max(1100, afterLen * 1000 + 350));
      }
    },
    [q, verdict, next],
  );

  const addSeq = useCallback(
    (m: number) => {
      if (verdict || q.input.kind !== 'sequence') return;
      seqRef.current = [...seqRef.current, m];
      setSeq(seqRef.current);
      if (seqRef.current.length >= q.input.length) submit({ kind: 'notes', notes: seqRef.current });
    },
    [q, verdict, submit],
  );
  const clearSeq = useCallback(() => {
    seqRef.current = [];
    setSeq([]);
  }, []);

  // ----------------------------------------------------------- live input
  useEffect(() => {
    held.current = new Set();
    return input.on((e) => {
      if (finished) return;
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
          held.current.add(e.note);
          for (const n of held.current) chordMax.current.add(n);
          setChordSel([...chordMax.current].sort((a, b) => a - b));
        }
      }
      if (e.type === 'noteoff' && kind === 'chord') {
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
  }, [q, verdict, finished, submit, next, addSeq]);

  // keyboard shortcuts: Enter/Space = next, R = replay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      if ((e.key === 'Enter' || e.key === ' ') && verdict) {
        e.preventDefault();
        next();
      } else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        void playQuestionAudio(q);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [verdict, next, q, playQuestionAudio]);

  if (finished) {
    const s = statsRef.current;
    return (
      <div className="card flat center">
        <h3>Set complete</h3>
        <p className="muted">{s.correct}/{s.attempts} correct</p>
      </div>
    );
  }

  const skill = SKILL_BY_ID[q.skill];
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
        </div>
      </div>

      {q.show ? <VisualView v={q.show} satb={q.skill === 'bach.vl'} /> : null}

      <AnswerArea
        q={q}
        verdict={verdict}
        picked={picked}
        seq={seq}
        chordSel={chordSel}
        setChordSel={setChordSel}
        addSeq={addSeq}
        clearSeq={clearSeq}
        submit={(a) => {
          if (a.kind === 'choice') setPicked(a.value);
          submit(a);
        }}
      />

      {verdict ? (
        <div className={`feedback ${verdict.correct ? 'ok' : 'no'}`}>
          <div className="row between">
            <h3>{verdict.correct ? '✓ Correct' : '✗ Not quite'}{verdict.message ? <span className="muted small"> — {verdict.message}</span> : null}</h3>
            <div className="row">
              {q.after?.length ? <button type="button" className="btn small" onClick={() => void playEvents(q.after!)}>▶ Hear answer</button> : null}
              <button type="button" className="btn primary small" onClick={next}>Next ⏎</button>
            </div>
          </div>
          <p style={{ margin: '6px 0 0' }}>{q.explain}</p>
          {verdict.reveal ? <VisualView v={verdict.reveal} satb={q.skill === 'bach.vl'} /> : q.reveal ? <VisualView v={q.reveal} satb={q.skill === 'bach.vl'} /> : null}
        </div>
      ) : null}
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
  setChordSel: (n: number[]) => void;
  addSeq: (m: number) => void;
  clearSeq: () => void;
  submit: (a: Answer) => void;
}

function AnswerArea({ q, verdict, picked, seq, chordSel, setChordSel, clearSeq, submit }: AnswerProps) {
  const inp = q.input;
  if (inp.kind === 'choice') {
    const correctValue = verdict ? inp.options.find((o) => q.check({ kind: 'choice', value: o.value }).correct)?.value : undefined;
    return (
      <div className={`choices cols-${inp.columns ?? 'auto'}`}>
        {inp.options.map((o, i) => {
          const state = verdict ? (o.value === correctValue ? 'correct' : o.value === picked ? 'wrong' : '') : '';
          return (
            <button key={o.value} type="button" className={`choice ${state}`} disabled={!!verdict} onClick={() => submit({ kind: 'choice', value: o.value })}>
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
        <div className="tiny faint">Or play it on the MiniLab / computer keys (A–K row).</div>
      </div>
    );
  }
  if (inp.kind === 'chord') {
    const toggle = (m: number) => {
      blip(m);
      setChordSel(chordSel.includes(m) ? chordSel.filter((x) => x !== m) : [...chordSel, m].sort((a, b) => a - b));
    };
    return (
      <div className="col">
        <Keyboard range={[48, 83]} marks={Object.fromEntries(chordSel.map((n) => [n, { label: pcName(n), tone: 'accent' as const }]))} onDown={verdict ? undefined : toggle} />
        <div className="row between">
          <span className="small muted">Play the chord on the MiniLab (release to submit) — or click keys and press Submit.</span>
          <div className="row">
            <button type="button" className="btn small" onClick={() => setChordSel([])} disabled={!!verdict}>Clear</button>
            <button type="button" className="btn small primary" disabled={!!verdict || chordSel.length < 2} onClick={() => submit({ kind: 'notes', notes: chordSel })}>Submit</button>
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
            <span key={i} className={seq[i] !== undefined ? 'filled' : ''}>{seq[i] !== undefined ? pcName(seq[i]) : ''}</span>
          ))}
        </div>
        <Keyboard
          range={[48, 83]}
          marks={inp.startHint !== undefined && !seq.length ? { [inp.startHint]: { label: 'start', tone: 'target' } } : {}}
          onDown={verdict ? undefined : (m) => input.screenNoteOn(m)}
          onUp={(m) => input.screenNoteOff(m)}
        />
        <div className="row end">
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
        submit({ kind: 'taps', offsets: taps.current.map((x) => x - offsetMs / 1000) });
        setState('idle');
        setStep(undefined);
      }
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const record = (perfMs: number) => {
      const b = bar.current;
      if (!b) return;
      const t = audio.perfToCtx(perfMs) - b.barStart;
      if (t > -0.25 && t < b.barLength + 0.25) taps.current.push(t);
    };
    const off = input.on((e) => {
      if ((e.type === 'pad' && e.on) || e.type === 'noteon') record(e.time);
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        record(e.timeStamp);
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
        <span className="small muted">{state === 'countin' ? 'Count-in… 1 2 3 4' : state === 'recording' ? 'Tap now!' : 'Pads, keys or space bar. Feel all four 16ths of every beat.'}</span>
        <div className="row">
          <button type="button" className="btn small" onClick={() => void playRhythm(inp.pattern, inp.bpm, { countIn: true, withPattern: true })} disabled={state !== 'idle'}>▶ Hear it</button>
          <button type="button" className="btn small primary" onClick={() => void start()} disabled={disabled || state !== 'idle'}>● Start</button>
        </div>
      </div>
    </div>
  );
}

