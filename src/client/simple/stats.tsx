// Memory across visits. Every answer is kept per drill and per item ("minor 6th
// falling", "vi7 in minor"), new questions lean toward what you miss, and the
// score opens the drill's weak spots.

import { useState } from 'react';
import { store, useStore } from '../app/store';
import { recordAnswer, weightedPick } from '../learn/srs';
import type { ItemStat } from '../learn/types';

/** A neighbouring level of the drill, and how to get there. */
export interface Step {
  label: string;
  go: () => void;
}
export interface Ladder {
  up?: Step;
  down?: Step;
}

/** The levels either side of `current` in an ordered list. */
export function ladder<T extends string>(levels: readonly { id: T; label: string }[], current: T, go: (v: T) => void): Ladder {
  const i = levels.findIndex((l) => l.id === current);
  const at = (j: number): Step | undefined => (i >= 0 && levels[j] ? { label: levels[j].label, go: () => go(levels[j].id) } : undefined);
  return { up: at(i + 1), down: at(i - 1) };
}

/**
 * Ready to move up: nearly every item asked, each recently right, enough answers
 * overall. Struggling: a fair number of answers and most recent ones wrong.
 */
export function readiness(stats: Record<string, ItemStat> | undefined, pool: readonly string[]): { ready: boolean; struggling: boolean } {
  const seen = pool.filter((i) => stats?.[i]?.n);
  const n = seen.reduce((a, i) => a + stats![i].n, 0);
  const mean = seen.length ? seen.reduce((a, i) => a + stats![i].ema, 0) / seen.length : 0;
  const ready = pool.length > 0 && seen.length >= Math.ceil(pool.length * 0.8) && n >= Math.min(60, pool.length * 2) && mean >= 0.86 && seen.every((i) => stats![i].ema >= 0.7);
  const struggling = n >= 12 && mean < 0.5;
  return { ready, struggling };
}

export interface Tally {
  ok: number;
  bad: number;
  /** what the answers are kept under, e.g. "ivl.hear" */
  skill: string;
  /** the drill's name over its weak spots */
  name: string;
  /** every item the current options can ask */
  pool: readonly string[];
  label: (item: string) => string;
  /** one answer: this visit's score, and the item's record */
  record: (item: string, ok: boolean) => void;
  /** the levels either side, offered when you are ready (or struggling) */
  ladder?: Ladder;
}

const FOCUS = 'focus';

/** This visit's score plus the drill's lasting record. Count each question once, on its first try. */
export function useTally(skill: string, name: string, pool: readonly string[], label: (item: string) => string = (s) => s, steps?: Ladder): Tally {
  const [score, setScore] = useState({ ok: 0, bad: 0 });
  const record = (item: string, ok: boolean) => {
    setScore((s) => (ok ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 }));
    store.update((d) => recordAnswer(d.progress, skill, item, ok));
  };
  return { ...score, skill, name, pool, label, record, ladder: steps };
}

/**
 * The next question's item. New, weak and long-unseen items come up more often;
 * with Weak spots on, mostly the ones you miss. Never `prev` twice running.
 */
export function pickFor<T>(skill: string, items: readonly T[], prev: T | null = null, key: (t: T) => string = String): T {
  const pool = items.length > 1 && prev !== null ? items.filter((t) => key(t) !== key(prev)) : items;
  const d = store.get();
  const k = weightedPick(pool.map(key), d.progress.items[skill], Math.random, Date.now(), d.practice[FOCUS] === true);
  return pool.find((t) => key(t) === k) ?? pool[0];
}

/**
 * For questions made of several items (a melody's scale degrees): the candidate
 * whose items you miss most, with enough chance that it never gets stuck.
 * Unseen items count as half known; Weak spots leans harder on the misses.
 */
export function pickByItems<T>(skill: string, candidates: readonly T[], itemsOf: (t: T) => string[]): T {
  const d = store.get();
  const stats = d.progress.items[skill];
  const focus = d.practice[FOCUS] === true;
  let best = candidates[0];
  let top = -Infinity;
  for (const c of candidates) {
    const items = itemsOf(c);
    const weak = items.reduce((a, i) => a + (stats?.[i]?.n ? 1 - stats[i].ema : 0.5), 0) / Math.max(1, items.length);
    const score = weak * (focus ? 3 : 1) + Math.random() * 0.45;
    if (score > top) {
      top = score;
      best = c;
    }
  }
  return best;
}

/** This visit's score; tap it for the drill's weak spots across every visit. */
export function Score({ tally }: { tally: Tally }) {
  const { ok, bad } = tally;
  const items = useStore((d) => d.progress.items[tally.skill]);
  const { ready } = readiness(items, tally.pool);
  const up = ready && tally.ladder?.up;
  return (
    <>
      <button
        type="button"
        className={`s-score ${ok || bad ? '' : 'empty'} ${up ? 'ready' : ''}`}
        popoverTarget="s-stats"
        aria-label={`${ok} right, ${bad} wrong. Show weak spots${up ? '. Ready for the next level' : ''}`}
        title={up ? `Ready for ${tally.ladder!.up!.label}. Tap to move up.` : 'Score since you opened the tab. Tap for your weak spots.'}
      >
        {up ? <span className="up" aria-hidden="true">↑</span> : null}
        <span className="ok">✓ {ok}</span>
        <span className="bad">✗ {bad}</span>
      </button>
      <div id="s-stats" popover="auto" className="s-pop s-stats">
        <Stats tally={tally} />
      </div>
    </>
  );
}

const tone = (ema: number) => (ema < 0.55 ? 'bad' : ema < 0.8 ? 'mid' : 'good');

function Stats({ tally }: { tally: Tally }) {
  const { skill, name, pool, label } = tally;
  const items = useStore((d) => d.progress.items[skill]);
  const all = useStore((d) => d.progress.skills[skill]);
  const focus = useStore((d) => d.practice[FOCUS] === true);
  // weakest first; the recent average (not the lifetime one) so a fixed weakness drops down the list
  const seen = pool.filter((i) => items?.[i]?.n).sort((a, b) => items![a].ema - items![b].ema);
  const fresh = pool.length - seen.length;
  const { ready, struggling } = readiness(items, pool);
  const move = ready ? tally.ladder?.up : struggling ? tally.ladder?.down : undefined;
  const close = (fn: () => void) => () => {
    document.getElementById('s-stats')?.hidePopover();
    fn();
  };

  const forget = () => {
    if (!window.confirm(`Forget every answer in ${name}?`)) return;
    store.update((d) => {
      delete d.progress.items[skill];
      delete d.progress.skills[skill];
    });
  };

  return (
    <>
      <div className="s-ctl-head">
        <strong>{name}</strong>
        <span>{all?.n ? `${all.n} answered · ${Math.round((100 * all.correct) / all.n)}% right overall` : 'Nothing answered yet.'}</span>
      </div>
      {seen.length ? (
        <ul className="s-weak" aria-label="Weakest first">
          {seen.map((i) => {
            const st = items![i];
            return (
              <li key={i} className={tone(st.ema)} title={`${st.n} asked · recent accuracy ${Math.round(st.ema * 100)}%`}>
                <span className="nm">{label(i)}</span>
                <span className="bar"><span style={{ width: `${Math.round(st.ema * 100)}%` }} /></span>
                <span className="n">{st.n}×</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {fresh ? <p className="s-ctl-last">{fresh} of {pool.length} not asked yet.</p> : null}
      {move ? (
        <div className={`s-level ${ready ? 'up' : 'down'}`}>
          <span>{ready ? 'You have this level down.' : 'Most recent answers here are misses. A step back can help.'}</span>
          <button type="button" className="btn small primary" onClick={close(move.go)}>{ready ? '↑' : '↓'} {move.label}</button>
        </div>
      ) : null}
      <label className="s-check">
        <input type="checkbox" checked={focus} onChange={(e) => store.update((d) => { d.practice[FOCUS] = e.target.checked; })} />
        <span><b>Weak spots</b> — ask mostly what I miss (every drill)</span>
      </label>
      {all?.n ? <button type="button" className="s-chip learn" onClick={forget}>Forget this drill</button> : null}
    </>
  );
}
