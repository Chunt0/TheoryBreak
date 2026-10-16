import { useEffect, useRef, useState } from 'react';
import { href } from '../../app/router';
import { store } from '../../app/store';
import { TOPIC_BY_ID } from '../../learn/library';
import { planSession, type SessionBlock, type SessionPlan } from '../../learn/session';
import { addPracticeTime, scheduleSkill } from '../../learn/srs';
import type { BlockLog } from '../../learn/types';
import { ExerciseRunner, type RunStats } from '../learn/ExerciseRunner';
import { TopicView } from '../learn/TopicView';
import { stopAll } from '../PlayButton';
import { ChangesTrainer, ProgressionLab } from './LabPage';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function WorkoutPage() {
  const [plan] = useState<SessionPlan>(() => {
    const d = store.get();
    return planSession(d.progress, d.settings.sessionMinutes, d.settings.focusTags);
  });
  const [idx, setIdx] = useState(0);
  const [blockStart, setBlockStart] = useState(() => performance.now());
  const [sessionStart] = useState(() => performance.now());
  const [now, setNow] = useState(() => performance.now());
  const [blockDone, setBlockDone] = useState<RunStats | null>(null);
  const [finished, setFinished] = useState(false);
  const logs = useRef<BlockLog[]>([]);
  const skillAgg = useRef<Record<string, { attempts: number; correct: number }>>({});
  const saved = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(performance.now()), 500);
    return () => clearInterval(t);
  }, []);

  const total = plan.blocks.reduce((s, b) => s + b.seconds, 0) * 1000;
  const block = plan.blocks[idx];
  const blockMs = block ? block.seconds * 1000 : 0;
  const blockLeft = blockStart + blockMs - now;

  const closeBlock = (stats: RunStats | null) => {
    const b = plan.blocks[idx];
    if (!b) return;
    const s = stats ?? { attempts: 0, correct: 0, bySkill: {} };
    logs.current.push({ kind: b.kind, title: b.title, attempts: s.attempts, correct: s.correct, seconds: Math.round((performance.now() - blockStart) / 1000) });
    for (const [k, v] of Object.entries(s.bySkill)) {
      const a = (skillAgg.current[k] ??= { attempts: 0, correct: 0 });
      a.attempts += v.attempts;
      a.correct += v.correct;
    }
  };

  const advance = (stats: RunStats | null) => {
    closeBlock(stats);
    stopAll();
    setBlockDone(null);
    if (idx + 1 >= plan.blocks.length) setFinished(true);
    else {
      setIdx(idx + 1);
      setBlockStart(performance.now());
    }
  };

  useEffect(() => {
    if (!finished || saved.current) return;
    saved.current = true;
    const seconds = Math.round((performance.now() - sessionStart) / 1000);
    store.update((d) => {
      d.progress.sessions = [...d.progress.sessions.slice(-199), { at: Date.now(), seconds, blocks: logs.current }];
      addPracticeTime(d.progress, seconds);
      for (const [k, v] of Object.entries(skillAgg.current)) scheduleSkill(d.progress, k, v.attempts, v.correct);
    });
  }, [finished, sessionStart]);

  if (finished) {
    const attempts = logs.current.reduce((s, l) => s + l.attempts, 0);
    const correct = logs.current.reduce((s, l) => s + l.correct, 0);
    return (
      <div className="page">
        <div className="card">
          <h1>Workout done</h1>
          <p className="muted">{fmt(performance.now() - sessionStart)} · {attempts ? `${correct}/${attempts} correct (${Math.round((correct / attempts) * 100)}%)` : 'no graded reps'}</p>
          <div className="plan-list">
            {logs.current.map((l, i) => (
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

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row between">
          <div className="row" style={{ gap: 18 }}>
            <div className="timer-big">{fmt(total - (now - sessionStart))}</div>
            <div>
              <div className="small muted">Block {idx + 1}/{plan.blocks.length}</div>
              <strong>{block.title}</strong>
            </div>
          </div>
          <div className="row">
            <span className={`badge ${blockLeft < 0 ? 'accent' : ''}`}>{blockLeft < 0 ? 'time — finish this one' : `${fmt(blockLeft)} left`}</span>
            <button type="button" className="btn small" onClick={() => advance(blockDone)}>Next block →</button>
            <button type="button" className="btn small ghost" onClick={() => { closeBlock(blockDone); setFinished(true); }}>End</button>
          </div>
        </div>
        <div className="blocks-bar" style={{ marginTop: 10 }}>
          {plan.blocks.map((b, i) => (
            <div key={i} className={`blk ${i < idx ? 'done' : ''}`} style={{ flex: b.seconds }}>
              <i style={{ width: i === idx ? `${Math.min(100, ((now - blockStart) / blockMs) * 100)}%` : i < idx ? '100%' : '0%' }} />
            </div>
          ))}
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>{block.why}</div>
      </div>

      <BlockBody key={idx} block={block} deadline={blockStart + blockMs} done={blockDone} onDone={setBlockDone} onNext={advance} />
    </div>
  );
}

function BlockBody({ block, deadline, done, onDone, onNext }: { block: SessionBlock; deadline: number; done: RunStats | null; onDone: (s: RunStats) => void; onNext: (s: RunStats | null) => void }) {
  if (block.kind === 'topic' && block.topicId) {
    const topic = TOPIC_BY_ID[block.topicId];
    return (
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', alignItems: 'start' }}>
        <div className="card"><h2>{topic.title}</h2><TopicView topic={topic} /></div>
        <div className="card" style={{ position: 'sticky', top: 70 }}>
          <h3>Drill it</h3>
          {done ? <BlockDone stats={done} onNext={() => onNext(done)} /> : <ExerciseRunner skills={block.skills} deadline={deadline} onFinish={onDone} />}
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
                onNext(null);
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      {done ? <BlockDone stats={done} onNext={() => onNext(done)} /> : <ExerciseRunner skills={block.skills} deadline={deadline} onFinish={onDone} />}
    </div>
  );
}

function BlockDone({ stats, onNext }: { stats: RunStats; onNext: () => void }) {
  return (
    <div className="center col" style={{ alignItems: 'center' }}>
      <h3>Block complete</h3>
      <p className="muted">{stats.attempts ? `${stats.correct}/${stats.attempts} correct` : 'Done'}</p>
      <button type="button" className="btn primary" onClick={onNext}>Next block →</button>
    </div>
  );
}
