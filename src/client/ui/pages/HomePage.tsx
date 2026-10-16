import { useMemo } from 'react';
import { go, href } from '../../app/router';
import { store, updateSettings, useStore } from '../../app/store';
import { TOPICS, TAG_NAMES, type Tag } from '../../learn/library';
import { planSession } from '../../learn/session';
import { SKILLS } from '../../learn/skills';
import { dayKey, isDue, streakDays } from '../../learn/srs';
import { input } from '../../midi/input';

const ALL_TAGS: Tag[] = ['core', 'jazz', 'funk', 'soul', 'bach', 'rhythm'];
const KIND_ICON: Record<string, string> = { ear: '👂', gym: '🏋', topic: '📖', apply: '🧪', groove: '🥁', practice: '🎯' };

export function HomePage() {
  const progress = useStore((d) => d.progress);
  const settings = useStore((d) => d.settings);
  const plan = useMemo(() => planSession(progress, settings.sessionMinutes, settings.focusTags), [progress, settings.sessionMinutes, settings.focusTags]);
  const streak = streakDays(progress);
  const today = Math.round((progress.daily[dayKey()] ?? 0) / 60);
  const week = Array.from({ length: 7 }, (_, i) => {
    const t = Date.now() - (6 - i) * 86_400_000;
    return { label: new Date(t).toLocaleDateString(undefined, { weekday: 'narrow' }), min: (progress.daily[dayKey(t)] ?? 0) / 60 };
  });
  const maxMin = Math.max(15, ...week.map((w) => w.min));
  const due = SKILLS.filter((s) => isDue(progress.skills[s.id]));
  const reps = Object.values(progress.skills).reduce((s, x) => s + x.n, 0);
  const suggestions = [...TOPICS]
    .filter((t) => t.tags.some((x) => settings.focusTags.includes(x)))
    .sort((a, b) => (progress.topics[a.id]?.last ?? 0) - (progress.topics[b.id]?.last ?? 0))
    .slice(0, 4);

  const toggleTag = (t: Tag) => {
    const has = settings.focusTags.includes(t);
    const next = has ? settings.focusTags.filter((x) => x !== t) : [...settings.focusTags, t];
    if (next.length) updateSettings({ focusTags: next });
  };

  return (
    <div className="page">
      <div className="hero">
        <section className="card">
          <div className="row between">
            <h1>Break workout</h1>
            <div className="seg" role="group" aria-label="Session length">
              {[5, 10, 15, 20].map((m) => (
                <button key={m} type="button" className={settings.sessionMinutes === m ? 'on' : ''} onClick={() => updateSettings({ sessionMinutes: m })}>{m}m</button>
              ))}
            </div>
          </div>
          <p className="muted">Spaced review, interleaved drills, one deep-dive topic and one musical task — planned from what you know and what's due.</p>
          <div className="row" style={{ marginBottom: 12 }}>
            {ALL_TAGS.map((t) => (
              <button key={t} type="button" className={`btn small ${settings.focusTags.includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t)}>{TAG_NAMES[t]}</button>
            ))}
          </div>
          <div className="plan-list">
            {plan.blocks.map((b, i) => (
              <div key={i} className="plan-item">
                <span className="num">{KIND_ICON[b.kind]}</span>
                <div>
                  <strong>{b.title}</strong>
                  <div className="small muted">{b.why}</div>
                </div>
                <span className="badge">{Math.round(b.seconds / 60)} min</span>
              </div>
            ))}
          </div>
          <div className="row end" style={{ marginTop: 14 }}>
            <button type="button" className="btn primary big" onClick={() => go('workout')}>Start {settings.sessionMinutes}-minute workout</button>
          </div>
        </section>

        <section className="col">
          <div className="card">
            <div className="grid three" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat"><b>{streak}</b><span className="small muted">day streak</span></div>
              <div className="stat"><b>{today}</b><span className="small muted">min today</span></div>
              <div className="stat"><b>{reps}</b><span className="small muted">reps total</span></div>
            </div>
            <div className="week" style={{ marginTop: 14 }}>
              {week.map((w, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div className="bar" style={{ height: '100%' }}><i style={{ height: `${(w.min / maxMin) * 100}%` }} /></div>
                  <div className="lbl">{w.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Due for review</h3>
            {due.length ? (
              <>
                <p className="small muted">{due.slice(0, 5).map((s) => s.name).join(' · ')}{due.length > 5 ? ` +${due.length - 5}` : ''}</p>
                <a className="btn small" href={href('gym/due')}>Drill due skills</a>
              </>
            ) : (
              <p className="small muted">Nothing due. Explore the library or the gym.</p>
            )}
          </div>
          {!input.anyMidiConnected ? (
            <div className="card">
              <h3>Connect the MiniLab 3</h3>
              <p className="small muted">Plug it in via USB and allow MIDI access when Chrome/Edge asks. Keys play and answer, pads 1–8 pick answers, knobs/faders drive the DX7. Until then, the computer keys A–K play notes and 1–8 act as pads.</p>
              <button type="button" className="btn small" onClick={() => void input.requestMidi()}>Request MIDI access</button>
            </div>
          ) : null}
        </section>
      </div>

      <h2 style={{ marginTop: 28 }}>Jump in</h2>
      <div className="grid four">
        {suggestions.map((t) => (
          <a key={t.id} href={href(`library/${t.id}`)} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="row" style={{ gap: 6, marginBottom: 6 }}>{t.tags.map((x) => <span key={x} className="badge">{TAG_NAMES[x]}</span>)}</div>
            <strong>{t.title}</strong>
            <div className="small muted">{t.summary}</div>
            <div className="tiny faint" style={{ marginTop: 6 }}>{progress.topics[t.id] ? `Viewed ${new Date(progress.topics[t.id].last).toLocaleDateString()}` : 'Not opened yet'} · {t.minutes} min</div>
          </a>
        ))}
      </div>
      <p className="tiny faint" style={{ marginTop: 24 }}>Data stays on this machine{store.syncState === 'synced' ? ' and the Theory Break server' : ''}.</p>
    </div>
  );
}
