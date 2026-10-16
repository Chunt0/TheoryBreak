import { useEffect, useState } from 'react';
import { renderMusic, staffFromStrings, type Block, type Topic } from '../../learn/library';
import { SKILL_BY_ID } from '../../learn/skills';
import { parsePitch } from '../../learn/music';
import { chordEvents } from '../../learn/music';
import { patternFromCells, type RhythmPattern } from '../../theory/rhythm';
import { store } from '../../app/store';
import { Markdown } from '../Markdown';
import { Keyboard } from '../Keyboard';
import { Staff } from '../Staff';
import { PlayButton } from '../PlayButton';
import { ProgressionStrip } from '../ProgressionStrip';
import { RhythmGrid, playRhythm } from '../Rhythm';
import { ExerciseRunner } from './ExerciseRunner';

const NOTE_ICON = { ear: '👂', keys: '🎹', writing: '✍️', jazz: '🎷' } as const;

export function TopicView({ topic, onDrill }: { topic: Topic; onDrill?: (skill: string) => void }) {
  useEffect(() => {
    store.update((d) => {
      const t = d.progress.topics[topic.id] ?? { last: 0, views: 0 };
      d.progress.topics[topic.id] = { last: Date.now(), views: t.views + 1 };
    });
  }, [topic.id]);
  return (
    <div className="lesson-body">
      {topic.blocks.map((b, i) => (
        <div className="block" key={i}>
          <BlockView b={b} onDrill={onDrill} />
        </div>
      ))}
    </div>
  );
}

function BlockView({ b, onDrill }: { b: Block; onDrill?: (skill: string) => void }) {
  switch (b.t) {
    case 'p':
      return <Markdown md={b.md} />;
    case 'note':
      return (
        <div className={`callout ${b.kind === 'jazz' ? 'song' : b.kind === 'ear' ? 'ear' : 'guitar'}`}>
          <span className="ico">{NOTE_ICON[b.kind]}</span>
          <div><Markdown md={b.md} /></div>
        </div>
      );
    case 'keys': {
      const mids = b.notes.map((n) => parsePitch(n) ?? 60);
      const lo = Math.min(...mids);
      const hi = Math.max(...mids);
      return (
        <div className="card flat">
          <Keyboard range={[Math.min(48, lo - (lo % 12)), Math.max(lo - (lo % 12) + 24, hi + 2)]} marks={Object.fromEntries(mids.map((m, i) => [m, { label: b.labels?.[i], tone: 'chord' as const }]))} />
          <div className="row between">
            <span className="caption">{b.caption}</span>
            <PlayButton events={() => chordEvents(mids, { arp: true })}>Play</PlayButton>
          </div>
        </div>
      );
    }
    case 'staff': {
      const chords = staffFromStrings(b.chords);
      return (
        <div className="card flat">
          <Staff chords={chords} />
          <div className="row between">
            <span className="caption">{b.caption}</span>
            <PlayButton events={() => chords.flatMap((c, i) => chordEvents(c.notes, { start: i * 1.2, dur: 1.15 }))}>Play</PlayButton>
          </div>
        </div>
      );
    }
    case 'listen':
      return (
        <div className="listen-row">
          {b.items.map((it, i) => (
            <PlayButton key={i} className="btn listen-btn" events={() => renderMusic(it.music)}>
              <span>{it.label}{it.note ? <small> {it.note}</small> : null}</span>
            </PlayButton>
          ))}
        </div>
      );
    case 'prog':
      return (
        <div className="card flat">
          <ProgressionStrip keyName={b.key} tokens={b.tokens} bpm={b.bpm} style={b.style} beats={b.beats} caption={b.caption} drums={b.style === 'funk' || b.style === 'swing'} />
        </div>
      );
    case 'table':
      return (
        <div className="table-wrap">
          <table className="t">
            <thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'rhythm': {
      const pattern: RhythmPattern = b.onsets
        ? { steps: 16, onsets: b.onsets, beatsPerBar: 4 }
        : patternFromCells(b.cells ?? ['1000', '1000', '1000', '1000'], b.per ?? 4);
      return (
        <div className="card flat">
          <RhythmGrid pattern={pattern} />
          <div className="row between" style={{ marginTop: 8 }}>
            <span className="caption">{b.caption}</span>
            <button type="button" className="btn small" onClick={() => void playRhythm(pattern, b.bpm ?? 90, { countIn: true, withPattern: true })}>▶ Play</button>
          </div>
        </div>
      );
    }
    case 'drill':
      return <InlineDrill skill={b.skill} count={b.count ?? 3} label={b.label} onDrill={onDrill} />;
  }
}

function InlineDrill({ skill, count, label, onDrill }: { skill: string; count: number; label?: string; onDrill?: (skill: string) => void }) {
  const [open, setOpen] = useState(false);
  const s = SKILL_BY_ID[skill];
  if (!s) return null;
  return (
    <div className="card flat">
      <div className="row between">
        <div>
          <strong>Try it: {label ?? s.name}</strong>
          <div className="small muted">{s.desc}</div>
        </div>
        <div className="row">
          {onDrill ? <button type="button" className="btn small ghost" onClick={() => onDrill(skill)}>Open in Gym</button> : null}
          <button type="button" className="btn small" onClick={() => setOpen(!open)}>{open ? 'Hide' : `${count} questions`}</button>
        </div>
      </div>
      {open ? <div style={{ marginTop: 12 }}><ExerciseRunner skills={[skill]} count={count} /></div> : null}
    </div>
  );
}
