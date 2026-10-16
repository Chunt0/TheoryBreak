import { useEffect, useState } from 'react';
import { href } from '../../app/router';
import { store } from '../../app/store';
import { useMini } from '../../app/createStore';
import { clearWorkout, endWorkout, nextBlock, recordWorkoutAnswer, startWorkout, workout, type ActiveWorkout } from '../../app/workout';
import { TOPIC_BY_ID } from '../../learn/library';
import type { SessionBlock } from '../../learn/session';
import { addPracticeTime } from '../../learn/srs';
import { ExerciseRunner } from '../learn/ExerciseRunner';
import { TopicView } from '../learn/TopicView';
import { stopAll } from '../PlayButton';
import { ChangesTrainer, ProgressionLab } from './LabPage';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function WorkoutPage() {
  const w = useMini(workout, (x) => x);
  const [now, setNow] = useState(() => Date.now());

  // arriving here without a session (or after a finished one) starts a new one
  useEffect(() => {
    const cur = workout.get();
    if (!cur || (cur.finished && cur.saved)) startWorkout();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // a finished session is logged once; leaving its summary clears it
  useEffect(() => {
    if (!w?.finished || w.saved) return;
    // a session paused for a long lookup shouldn't log an hour of practice
    const planned = w.plan.blocks.reduce((s, b) => s + b.seconds, 0);
    const seconds = Math.min(Math.round((Date.now() - w.sessionStart) / 1000), planned + 600);
    store.update((d) => {
      d.progress.sessions = [...d.progress.sessions.slice(-199), { at: Date.now(), seconds, blocks: w.logs }];
      addPracticeTime(d.progress, seconds);
    });
    workout.set((x) => (x ? { ...x, saved: true } : x));
  }, [w]);
  useEffect(() => () => {
    if (workout.get()?.finished) clearWorkout();
  }, []);

  if (!w) return null;

  if (w.finished) {
    const attempts = w.logs.reduce((s, l) => s + l.attempts, 0);
    const correct = w.logs.reduce((s, l) => s + l.correct, 0);
    return (
      <div className="page">
        <div className="card">
          <h1>Workout done</h1>
          <p className="muted">{fmt(w.logs.reduce((s, l) => s + l.seconds, 0) * 1000)} · {attempts ? `${correct}/${attempts} correct (${Math.round((correct / attempts) * 100)}%)` : 'no graded reps'}</p>
          <div className="plan-list">
            {w.logs.map((l, i) => (
              <div key={i} className="plan-item done">
                <span className="num">✓</span>
                <div><strong>{l.title}</strong><div className="small muted">{l.attempts ? `${l.correct}/${l.attempts} correct` : 'completed'} · {fmt(l.seconds * 1000)}</div></div>
                <span />
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>Review intervals updated: strong skills move further out, weak ones come back tomorrow.</p>
          <div className="row end"><a className="btn primary" href={href('')}>Back to Today</a></div>
        </div>
      </div>
    );
  }

  const { plan, idx } = w;
  const total = plan.blocks.reduce((s, b) => s + b.seconds, 0) * 1000;
  const block = plan.blocks[idx];
  const blockMs = block.seconds * 1000;
  const blockLeft = w.blockStart + blockMs - now;

  const advance = () => {
    stopAll();
    nextBlock();
  };

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row between">
          <div className="row" style={{ gap: 18 }}>
            <div className="timer-big">{fmt(total - (now - w.sessionStart))}</div>
            <div>
              <div className="small muted">Block {idx + 1}/{plan.blocks.length}</div>
              <strong>{block.title}</strong>
            </div>
          </div>
          <div className="row">
            <span className={`badge ${blockLeft < 0 ? 'accent' : ''}`}>{blockLeft < 0 ? 'time — finish this one' : `${fmt(blockLeft)} left`}</span>
            <button type="button" className="btn small" onClick={advance}>Next block →</button>
            <button type="button" className="btn small ghost" onClick={() => { stopAll(); endWorkout(); }}>End</button>
          </div>
        </div>
        <div className="blocks-bar" style={{ marginTop: 10 }}>
          {plan.blocks.map((b, i) => (
            <div key={i} className={`blk ${i < idx ? 'done' : ''}`} style={{ flex: b.seconds }}>
              <i style={{ width: i === idx ? `${Math.min(100, ((now - w.blockStart) / blockMs) * 100)}%` : i < idx ? '100%' : '0%' }} />
            </div>
          ))}
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>{block.why}</div>
      </div>

      <BlockBody key={`${w.sessionStart}-${idx}`} w={w} block={block} onNext={advance} />
    </div>
  );
}

// stable identities: the page re-renders twice a second for the clock
const onWorkoutAnswer = (_: string, correct: boolean) => recordWorkoutAnswer(correct);
const onBlockFinished = () => workout.set((x) => (x ? { ...x, blockDone: true } : x));

function BlockBody({ w, block, onNext }: { w: ActiveWorkout; block: SessionBlock; onNext: () => void }) {
  // the runner works in performance.now() time
  const [deadline] = useState(() => performance.now() + (w.blockStart + block.seconds * 1000 - Date.now()));
  const done = w.blockDone ? <BlockDone stats={w.current} onNext={onNext} /> : null;
  const runner = (
    <ExerciseRunner
      skills={block.skills}
      deadline={deadline}
      onAnswer={onWorkoutAnswer}
      onFinish={onBlockFinished}
    />
  );
  if (block.kind === 'topic' && block.topicId) {
    const topic = TOPIC_BY_ID[block.topicId];
    return (
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', alignItems: 'start' }}>
        <div className="card"><h2>{topic.title}</h2><TopicView topic={topic} /></div>
        <div className="card" style={{ position: 'sticky', top: 70 }}>
          <h3>Drill it</h3>
          {done ?? runner}
        </div>
      </div>
    );
  }
  if (block.kind === 'apply' && block.challenge) {
    const c = block.challenge;
    return (
      <div className="card">
        <h2>{c.title}</h2>
        <p>{c.task}</p>
        <ul className="small">{c.checklist.map((x) => <li key={x}>{x}</li>)}</ul>
        <div style={{ marginTop: 12 }}>
          {c.tool === 'lab' ? (
            <ProgressionLab initial={{ key: c.key, tokens: c.tokens, bpm: c.bpm, style: c.style, beats: c.beats ?? 2 }} compact />
          ) : (
            <ChangesTrainer initial={{ key: c.key, tokens: c.tokens, bpm: c.bpm, style: c.style, beats: c.beats ?? 4 }} />
          )}
        </div>
        <div className="row between" style={{ marginTop: 16 }}>
          <span className="small muted">How did it go?</span>
          <div className="row">
            {['Rough', 'OK', 'Nailed it'].map((label, i) => (
              <button key={label} type="button" className="btn small" onClick={() => {
                store.update((d) => { d.progress.challenges[c.id] = { last: Date.now(), rating: i + 1 }; });
                onNext();
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return <div className="card">{done ?? runner}</div>;
}

function BlockDone({ stats, onNext }: { stats: { attempts: number; correct: number }; onNext: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext]);
  return (
    <div className="center col" style={{ alignItems: 'center' }}>
      <h3>Block complete</h3>
      <p className="muted">{stats.attempts ? `${stats.correct}/${stats.attempts} correct` : 'Done'}</p>
      <button type="button" className="btn primary" onClick={onNext}>Next block ⏎</button>
    </div>
  );
}
