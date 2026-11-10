// The lesson library behind the ? on every drill: the topics that teach it,
// how to work its questions out, and every other lesson a tap away. A side
// panel like the rack guide, so the drill stays where you left it.

import { useEffect, useRef } from 'react';
import { createStore, useMini } from '../app/createStore';
import { store } from '../app/store';
import { LEVEL_NAMES, PATHS, pathOf, renderMusic, staffFromStrings, TAG_NAMES, TAG_ORDER, TOPIC_BY_ID, TOPICS, type Block } from '../learn/library';
import { chordEvents, parsePitch } from '../learn/music';
import { patternFromCells, type RhythmPattern } from '../theory/rhythm';
import { Keyboard } from '../ui/Keyboard';
import { Markdown } from '../ui/Markdown';
import { PlayButton } from '../ui/PlayButton';
import { ProgressionStrip } from '../ui/ProgressionStrip';
import { playRhythm, RhythmGrid } from '../ui/Rhythm';
import { Staff } from '../ui/Staff';
import { SynthDemoCard } from './SynthDemoCard';

export interface Help {
  /** library topics that teach the drill, most relevant first */
  topics: string[];
  /** how to work any of the drill's questions out */
  method?: string[];
}

/** `topic` null = the index of every lesson. */
const lessons = createStore<{ open: boolean; topic: string | null; help: Help }>({ open: false, topic: null, help: { topics: [] } });

export const openLessons = (help: Help): void => lessons.set({ open: true, topic: help.topics[0] ?? null, help });
const closeLessons = (): void => lessons.set((l) => ({ ...l, open: false }));
const showTopic = (topic: string | null): void => lessons.set((l) => ({ ...l, topic }));

/** "Intervals: size, quality, job" → "Intervals" for the strip of chips. */
const short = (title: string) => title.split(/[:—]/)[0].trim();

/** The ? in the options row. */
export function LessonsButton({ help }: { help: Help }) {
  return (
    <button type="button" className="s-help" onClick={() => openLessons(help)} title="Lessons and method for this drill" aria-label="Lessons">
      ?
    </button>
  );
}

export function Lessons() {
  const { open, topic, help } = useMini(lessons, (l) => l);
  const el = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = el.current;
    if (!p) return;
    if (open && !p.matches(':popover-open')) p.showPopover();
    if (!open && p.matches(':popover-open')) p.hidePopover();
  }, [open]);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    el.current?.querySelector('.rk-g-topics .on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [topic, open]);
  useEffect(() => {
    if (!open || !topic) return;
    store.update((d) => {
      const t = d.progress.topics[topic] ?? { last: 0, views: 0 };
      d.progress.topics[topic] = { last: Date.now(), views: t.views + 1 };
    });
  }, [open, topic]);

  const t = topic ? TOPIC_BY_ID[topic] : null;
  const where = topic ? pathOf(topic) : null;
  // reading a lesson: every lesson of its area, in reading order, so you can see where
  // you are and the arrows never leave the area; on the index: the drill's own lessons
  const strip = where ? PATHS[where.tag] : help.topics;
  const area = where ? TAG_NAMES[where.tag] : null;

  return (
    <div
      ref={el}
      id="s-lessons"
      popover="auto"
      className="rk-guide s-lessons"
      onToggle={(e) => (e as unknown as ToggleEvent).newState === 'closed' && closeLessons()}
      aria-label="Lessons"
    >
      <div className="rk-g-head">
        <strong>Lessons</strong>
        <span className="rk-g-step">
          <button type="button" disabled={!where?.prev} onClick={() => where?.prev && showTopic(where.prev.id)} aria-label={`Previous ${area ?? ''} lesson`}>‹</button>
          <button type="button" disabled={!where?.next} onClick={() => where?.next && showTopic(where.next.id)} aria-label={`Next ${area ?? ''} lesson`}>›</button>
          <button type="button" onClick={closeLessons} aria-label="Close lessons">×</button>
        </span>
      </div>
      <nav className="rk-g-topics" aria-label={area ? `${area} lessons` : 'Lessons for this drill'}>
        <button type="button" className={topic === null ? 'on' : ''} onClick={() => showTopic(null)}>All lessons</button>
        {area ? <span className="rk-g-area">{area}</span> : null}
        {strip.map((id, i) => (
          <button key={id} type="button" className={id === topic ? 'on' : ''} onClick={() => showTopic(id)}>
            {area ? `${i + 1}. ` : ''}{short(TOPIC_BY_ID[id]?.title ?? id)}
          </button>
        ))}
      </nav>
      <div className="rk-g-body" ref={body}>
        {t ? (
          <>
            {where ? <p className="s-lesson-where">{TAG_NAMES[where.tag]} · {where.n} of {where.of} · {LEVEL_NAMES[t.level]} · {t.minutes} min</p> : null}
            <h2>{t.title}</h2>
            <p className="rk-g-what">{t.summary}</p>
            {help.method?.length && help.topics.includes(t.id) ? <Method steps={help.method} /> : null}
            {t.blocks.map((b, i) => (b.t === 'drill' ? null : <div className="block" key={`${t.id}.${i}`}><BlockView b={b} /></div>))}
            {where ? (
              // along the category's path, basics to advanced
              <nav className="s-lesson-next" aria-label={`More ${TAG_NAMES[where.tag]}`}>
                {where.prev ? <button type="button" className="btn small ghost" onClick={() => showTopic(where.prev!.id)}>‹ {where.prev.title}</button> : <span />}
                {where.next
                  ? <button type="button" className="btn small" onClick={() => showTopic(where.next!.id)}>Next: {where.next.title} ›</button>
                  : <button type="button" className="btn small" onClick={() => showTopic(null)}>End of {TAG_NAMES[where.tag]} · all lessons</button>}
              </nav>
            ) : null}
          </>
        ) : (
          <Index help={help} />
        )}
      </div>
    </div>
  );
}

function Method({ steps }: { steps: string[] }) {
  return (
    <section className="s-method">
      <h3>Working out this drill</h3>
      <ol>{steps.map((m) => <li key={m}><Markdown md={m} inlineOnly /></li>)}</ol>
    </section>
  );
}

function Index({ help }: { help: Help }) {
  const seen = store.get().progress.topics;
  const link = (id: string) => {
    const t = TOPIC_BY_ID[id];
    return (
      <li key={id}>
        <button type="button" className="rk-help-link" onClick={() => showTopic(id)}>{t.title}</button>
        <span className="faint"> · {LEVEL_NAMES[t.level]} · {t.minutes} min{seen[id] ? ' · read' : ''}</span>
      </li>
    );
  };
  return (
    <>
      <h2>Lessons</h2>
      <p className="rk-g-what">Each idea explained properly, with examples you can hear and play and a short recap at the end. Each category runs from basics to advanced; jump in anywhere, or follow one through.</p>
      {help.method?.length ? <Method steps={help.method} /> : null}
      {help.topics.length ? (
        <section>
          <h3>For this drill</h3>
          <ul className="s-lesson-list">{help.topics.map(link)}</ul>
        </section>
      ) : null}
      {/* the categories this drill's lessons belong to come first */}
      {[...new Set([...help.topics.map((id) => TOPIC_BY_ID[id]?.tags[0]).filter((t) => t !== undefined), ...TAG_ORDER])].map((tag) => {
        // each topic sits under its first tag, in path order
        const list = TOPICS.filter((t) => t.tags[0] === tag);
        return list.length ? (
          <section key={tag}>
            <h3>{TAG_NAMES[tag]}</h3>
            <ul className="s-lesson-list">{list.map((x) => link(x.id))}</ul>
          </section>
        ) : null;
      })}
    </>
  );
}

const CALLOUT = { ear: 'ear', keys: 'keys', writing: 'keys', jazz: 'song', recap: 'recap' } as const;
/** a small label saying why the box is there */
const CALLOUT_LABEL = { ear: 'Listening', keys: 'Try it', writing: 'Writing', jazz: 'On record', recap: 'In short' } as const;

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'p':
      return <Markdown md={b.md} />;
    case 'h':
      return <h3 className="s-lesson-h">{b.md}</h3>;
    case 'note':
      return (
        <div className={`callout ${CALLOUT[b.kind]}`}>
          <div>
            <span className="callout-k">{CALLOUT_LABEL[b.kind]}</span>
            <Markdown md={b.md} />
          </div>
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
            <PlayButton key={i} className="btn small" events={() => renderMusic(it.music)}>
              {it.label}{it.note ? <small className="faint"> {it.note}</small> : null}
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
          <div className="row between">
            <span className="caption">{b.caption}</span>
            <button type="button" className="btn small" onClick={() => void playRhythm(pattern, b.bpm ?? 90, { countIn: true, withPattern: true })}>▶ Play</button>
          </div>
        </div>
      );
    }
    case 'example':
      return (
        <div className="card flat example">
          <div className="row between">
            <strong>{b.title}</strong>
            {b.music ? <PlayButton events={() => renderMusic(b.music!)}>Hear it</PlayButton> : null}
          </div>
          <ol>{b.steps.map((st, i) => <li key={i}><Markdown md={st} inlineOnly /></li>)}</ol>
        </div>
      );
    case 'synth':
      return <SynthDemoCard demo={b.demo} />;
    case 'drill':
      return null;
  }
}
