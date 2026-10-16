import { useState } from 'react';
import { go, href } from '../../app/router';
import { useStore } from '../../app/store';
import { TAG_NAMES, TOPICS, TOPIC_BY_ID, type Tag } from '../../learn/library';
import { SKILL_BY_ID } from '../../learn/skills';
import { mastery } from '../../learn/srs';
import { TopicView } from '../learn/TopicView';
import { ExerciseRunner } from '../learn/ExerciseRunner';

const TAGS: Tag[] = ['core', 'jazz', 'funk', 'soul', 'bach', 'rhythm'];

export function LibraryPage({ topicId }: { topicId?: string }) {
  const progress = useStore((d) => d.progress);
  const [tag, setTag] = useState<Tag | 'all'>('all');
  const [q, setQ] = useState('');
  const topic = topicId ? TOPIC_BY_ID[topicId] : undefined;

  if (topic) return <TopicPage key={topic.id} id={topic.id} />;

  const list = TOPICS.filter((t) => (tag === 'all' || t.tags.includes(tag)) && (q === '' || `${t.title} ${t.summary}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="page">
      <div className="row between">
        <h1>Library</h1>
        <input type="text" placeholder="Search topics…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search topics" />
      </div>
      <p className="muted">Dense reference cards with audio and drills. Open anything, in any order.</p>
      <div className="row" style={{ margin: '10px 0 16px' }}>
        <button type="button" className={`btn small ${tag === 'all' ? 'active' : ''}`} onClick={() => setTag('all')}>All</button>
        {TAGS.map((t) => <button key={t} type="button" className={`btn small ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{TAG_NAMES[t]}</button>)}
      </div>
      <div className="grid three">
        {list.map((t) => {
          const m = t.drills.length ? t.drills.reduce((s, d) => s + mastery(progress.skills[d]), 0) / t.drills.length : 0;
          return (
            <a key={t.id} href={href(`library/${t.id}`)} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="row" style={{ gap: 6, marginBottom: 6 }}>{t.tags.map((x) => <span key={x} className="badge">{TAG_NAMES[x]}</span>)}</div>
              <strong>{t.title}</strong>
              <div className="small muted" style={{ minHeight: 40 }}>{t.summary}</div>
              <div className="meter good" style={{ marginTop: 8 }}><i style={{ width: `${m * 100}%` }} /></div>
              <div className="tiny faint" style={{ marginTop: 4 }}>{progress.topics[t.id] ? `Last opened ${new Date(progress.topics[t.id].last).toLocaleDateString()}` : 'Not opened'} · {t.minutes} min</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function TopicPage({ id }: { id: string }) {
  const topic = TOPIC_BY_ID[id];
  const [drill, setDrill] = useState<string[] | null>(null);
  const idx = TOPICS.findIndex((t) => t.id === id);
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  return (
    <div className="page">
      <a href={href('library')} className="small">← Library</a>
      <div className="row" style={{ gap: 6, margin: '10px 0 4px' }}>{topic.tags.map((x) => <span key={x} className="badge">{TAG_NAMES[x]}</span>)}</div>
      <h1>{topic.title}</h1>
      <p className="muted">{topic.summary}</p>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', alignItems: 'start' }}>
        <div className="card"><TopicView topic={topic} onDrill={(s) => go(`gym/${s}`)} /></div>
        <div className="card" style={{ position: 'sticky', top: 70 }}>
          <h3>Drills for this topic</h3>
          <div className="col">
            {topic.drills.map((d) => (
              <button key={d} type="button" className="btn" style={{ justifyContent: 'space-between' }} onClick={() => setDrill([d])}>
                <span>{SKILL_BY_ID[d].name}</span><span className="small muted">8 reps</span>
              </button>
            ))}
            <button type="button" className="btn primary" onClick={() => setDrill(topic.drills)}>Mixed set</button>
          </div>
          {drill ? <div style={{ marginTop: 14 }}><ExerciseRunner key={drill.join()} skills={drill} count={8} /></div> : null}
        </div>
      </div>
      <div className="row between" style={{ marginTop: 18 }}>
        {prev ? <a href={href(`library/${prev.id}`)} className="btn small">← {prev.title}</a> : <span />}
        {next ? <a href={href(`library/${next.id}`)} className="btn small">{next.title} →</a> : <span />}
      </div>
    </div>
  );
}
