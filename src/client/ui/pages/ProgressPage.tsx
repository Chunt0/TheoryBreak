import { useRef } from 'react';
import { href } from '../../app/router';
import { store, useStore } from '../../app/store';
import { TOPIC_BY_ID } from '../../learn/library';
import { SKILLS } from '../../learn/skills';
import { emptyProgress, mastery, masteryLabel } from '../../learn/srs';
import { AREA_NAMES, type Area } from '../../learn/types';

const AREAS: Area[] = ['ear', 'harmony', 'jazz', 'soul', 'bach', 'rhythm'];

export function ProgressPage() {
  const p = useStore((d) => d.progress);
  const fileRef = useRef<HTMLInputElement>(null);
  const minutes = Math.round(Object.values(p.daily).reduce((a, b) => a + b, 0) / 60);
  const reps = Object.values(p.skills).reduce((s, x) => s + x.n, 0);
  const correct = Object.values(p.skills).reduce((s, x) => s + x.correct, 0);
  const skills = SKILLS.map((s) => ({ s, st: p.skills[s.id], m: mastery(p.skills[s.id]) })).filter((x) => x.st?.n).sort((a, b) => a.m - b.m);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store.get(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `theory-break-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const importData = async (f: File) => {
    try {
      store.replace(JSON.parse(await f.text()));
    } catch {
      alert('That file is not a Theory Break export.');
    }
  };

  return (
    <div className="page">
      <h1>Progress</h1>
      <div className="grid four">
        <div className="card stat"><b>{p.sessions.length}</b><span className="small muted">workouts</span></div>
        <div className="card stat"><b>{minutes}</b><span className="small muted">minutes practised</span></div>
        <div className="card stat"><b>{reps}</b><span className="small muted">reps</span></div>
        <div className="card stat"><b>{reps ? Math.round((correct / reps) * 100) : 0}%</b><span className="small muted">accuracy</span></div>
      </div>

      <h2 style={{ marginTop: 22 }}>By area</h2>
      <div className="grid three">
        {AREAS.map((a) => {
          const list = SKILLS.filter((s) => s.area === a);
          const m = list.reduce((s, x) => s + mastery(p.skills[x.id]), 0) / list.length;
          const tried = list.filter((x) => p.skills[x.id]?.n).length;
          return (
            <a key={a} className="card" href={href(`gym/area:${a}`)} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="row between"><strong>{AREA_NAMES[a]}</strong><span className="small muted">{tried}/{list.length} tried</span></div>
              <div className="meter good" style={{ marginTop: 8 }}><i style={{ width: `${m * 100}%` }} /></div>
            </a>
          );
        })}
      </div>

      <h2 style={{ marginTop: 22 }}>Skills (weakest first)</h2>
      <div className="card">
        {skills.length ? (
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Skill</th><th>Mastery</th><th>Accuracy</th><th>Reps</th><th>Next review</th></tr></thead>
              <tbody>
                {skills.map(({ s, st, m }) => (
                  <tr key={s.id}>
                    <td><a href={href(`gym/${s.id}`)}>{s.name}</a></td>
                    <td>{masteryLabel(m)}</td>
                    <td>{Math.round((st!.correct / st!.n) * 100)}% <span className="faint tiny">(recent {Math.round(st!.ema * 100)}%)</span></td>
                    <td>{st!.n}</td>
                    <td>{st!.due <= Date.now() ? <span className="badge accent">due</span> : new Date(st!.due).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No reps yet — start a break workout.</p>}
      </div>

      <div className="grid two" style={{ marginTop: 22 }}>
        <div className="card">
          <h3>Recent workouts</h3>
          {p.sessions.slice(-12).reverse().map((s, i) => {
            const att = s.blocks.reduce((a, b) => a + b.attempts, 0);
            const cor = s.blocks.reduce((a, b) => a + b.correct, 0);
            return <div key={i} className="row between small"><span>{new Date(s.at).toLocaleString()}</span><span className="muted">{Math.round(s.seconds / 60)} min · {att ? `${cor}/${att}` : '—'}</span></div>;
          })}
          {!p.sessions.length ? <p className="muted small">None yet.</p> : null}
        </div>
        <div className="card">
          <h3>Topics read</h3>
          {Object.entries(p.topics).sort((a, b) => b[1].last - a[1].last).slice(0, 12).map(([id, t]) => (
            <div key={id} className="row between small"><a href={href(`library/${id}`)}>{TOPIC_BY_ID[id]?.title ?? id}</a><span className="muted">{t.views}× · {new Date(t.last).toLocaleDateString()}</span></div>
          ))}
          {!Object.keys(p.topics).length ? <p className="muted small">None yet.</p> : null}
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <h3>Data</h3>
        <p className="small muted">Everything lives in this browser and (when the server is reachable) in the Docker volume. Export a backup any time.</p>
        <div className="row">
          <button type="button" className="btn small" onClick={exportData}>Export JSON</button>
          <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>Import JSON</button>
          <button type="button" className="btn small ghost" onClick={() => {
            if (confirm('Reset all progress? Settings and synth patches are kept.')) store.update((d) => { d.progress = emptyProgress(); });
          }}>Reset progress</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && void importData(e.target.files[0])} />
        </div>
      </div>
    </div>
  );
}
