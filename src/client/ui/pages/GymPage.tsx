import { useMemo, useState } from 'react';
import { href } from '../../app/router';
import { useStore } from '../../app/store';
import { SKILLS, SKILL_BY_ID } from '../../learn/skills';
import { isDue, mastery, masteryLabel } from '../../learn/srs';
import { rankSkills } from '../../learn/session';
import { AREA_NAMES, type Area } from '../../learn/types';
import { ExerciseRunner } from '../learn/ExerciseRunner';

const AREAS: Area[] = ['ear', 'harmony', 'jazz', 'soul', 'bach', 'rhythm'];

export function GymPage({ skillId }: { skillId?: string }) {
  const progress = useStore((d) => d.progress);
  const [length, setLength] = useState<number | undefined>(10);
  const pool = useMemo(() => {
    if (skillId === 'due') {
      const due = SKILLS.filter((s) => isDue(progress.skills[s.id])).map((s) => s.id);
      return due.length ? due : rankSkills(progress, SKILLS.map((s) => s.id)).slice(0, 5);
    }
    if (skillId === 'weak') return rankSkills(progress, SKILLS.filter((s) => progress.skills[s.id]?.n).map((s) => s.id)).slice(0, 5);
    if (skillId?.startsWith('area:')) return SKILLS.filter((s) => s.area === skillId.slice(5)).map((s) => s.id);
    return skillId && SKILL_BY_ID[skillId] ? [skillId] : null;
  }, [skillId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pool && pool.length) {
    const title = skillId === 'due' ? 'Due & weakest' : skillId === 'weak' ? 'Weakest skills' : skillId?.startsWith('area:') ? `${AREA_NAMES[skillId.slice(5) as Area]} — mixed` : SKILL_BY_ID[pool[0]].name;
    return (
      <div className="page">
        <a href={href('gym')} className="small">← Gym</a>
        <div className="row between" style={{ margin: '8px 0 14px' }}>
          <h1>{title}</h1>
          <div className="seg">
            {[10, 20].map((n) => <button key={n} type="button" className={length === n ? 'on' : ''} onClick={() => setLength(n)}>{n}</button>)}
            <button type="button" className={length === undefined ? 'on' : ''} onClick={() => setLength(undefined)}>∞</button>
          </div>
        </div>
        <div className="card"><ExerciseRunner key={`${skillId}-${length}`} skills={pool} count={length} showSkill={pool.length > 1} /></div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Gym</h1>
      <p className="muted">Every drill, any time. Mastery blends recent accuracy and volume; review dates follow spacing.</p>
      <div className="row" style={{ marginBottom: 14 }}>
        <a className="btn primary small" href={href('gym/due')}>Due & weakest</a>
        <a className="btn small" href={href('gym/weak')}>Weakest 5</a>
      </div>
      <div className="grid two">
        {AREAS.map((a) => (
          <div key={a} className="card">
            <div className="row between"><h3>{AREA_NAMES[a]}</h3><a className="btn small ghost" href={href(`gym/area:${a}`)}>Mixed ▶</a></div>
            {SKILLS.filter((s) => s.area === a).map((s) => {
              const st = progress.skills[s.id];
              const m = mastery(st);
              return (
                <a key={s.id} href={href(`gym/${s.id}`)} className="skill-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div><strong>{s.name}</strong> {isDue(st) ? <span className="badge accent">due</span> : null}</div>
                    <div className="tiny muted">{s.desc}</div>
                  </div>
                  <div className="meter good" title={masteryLabel(m)}><i style={{ width: `${m * 100}%` }} /></div>
                  <span className="tiny faint nowrap">{st?.n ? `${Math.round((st.correct / st.n) * 100)}% · ${st.n}` : 'new'}</span>
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
