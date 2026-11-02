// Chord–scale on the Scales tab. "Chord → scale": a chord where it stands
// (Em7 as iii in C, A7 → Dm, G13♭9), name the scale. "Over the chord": the
// chord holds underneath and you play its scale from the root, hearing which
// notes are tensions and which rub as avoid notes.

import { useEffect, useState, type ReactNode } from 'react';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { chordSymbol } from '../theory/chords';
import { mod, noteName, pc } from '../theory/core';
import { keyName } from '../theory/keys';
import type { KeyMark } from '../ui/Keyboard';
import type { Help } from './Lessons';
import { ladder, pickFor, useTally } from './stats';
import { Answers, Bar, K, Listen, Pick, playBlock, playEvents, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';
import {
  answersFor, chordVoicing, CS_LEVELS, CS_NAME, csLabel, itemsFor, makeQ, melodicParent, overChord, stillFits,
  type CsLevel, type CsQ, type Role, type ScaleTone,
} from './chordScaleLogic';

export type CsTask = 'name' | 'play';
type Under = 'held' | 'struck';
const UNDERS: Choice<Under>[] = [
  { id: 'held', label: 'Chord held', title: 'The chord drones under the question' },
  { id: 'struck', label: 'Chord struck', title: 'The chord is played once, with your practice sound' },
];
const LEVEL_CHOICES: Choice<CsLevel>[] = CS_LEVELS.map((l) => ({ id: l.id, label: l.label }));

const METHOD: Record<CsTask, string[]> = {
  name: [
    'Quality first: maj7, m7, 7 or ø narrows it to a family of scales.',
    'Then context. Inside the key, take the key\'s notes from the chord\'s root (ii → Dorian, IV → Lydian). Outside it, keep the chord tones and fill the gaps with the key\'s notes (A7 in C → Mixolydian ♭6).',
    'Tensions written in the symbol overrule both: ♭9 with 13 → half-whole, 9 with ♯5 → whole tone, ♯9 with ♭13 → altered.',
  ],
  play: [
    'Start on the chord\'s root, in any octave, and go up to the octave.',
    'Think the chord tones first (R 3 5 7), then fill each gap with the right tension.',
    'Let the avoid notes rub against the held chord: pass through them, don\'t land on them.',
  ],
};
const TOPICS: Record<CsLevel, string[]> = {
  major: ['core.chordscale', 'core.modes', 'core.tensions'],
  minor: ['core.chordscale', 'jazz.minor', 'core.melodic'],
  secondary: ['core.cskey', 'jazz.secondary', 'core.chordscale'],
  dominant: ['core.tensions', 'core.chordscale', 'core.symmetric', 'core.melodic'],
  melodic: ['core.melodic', 'core.chordscale'],
  mixed: ['core.chordscale', 'core.cskey', 'core.tensions'],
};

const TONE: Record<Role, KeyMark['tone']> = { root: 'root', chord: 'chord', tension: 'scale', avoid: 'wrong' };
const ROLE_WORD: Record<Role, string> = { root: 'root', chord: 'chord tone', tension: 'tension', avoid: 'avoid note' };

function newQ(task: CsTask, level: CsLevel, prev: CsQ | null): CsQ {
  const item = pickFor(`cs.${task}`, itemsFor(level), prev?.item ?? null, (i) => i.id);
  return makeQ(item);
}

const symbolOf = (q: CsQ) => chordSymbol(q.root, q.item.type);
function contextOf(q: CsQ): string {
  if (!q.key) return q.item.use ?? '';
  const to = q.target ? ` → ${noteName(q.target.root)}${q.target.minor ? 'm' : ''}` : '';
  return `${q.item.numeral} in ${keyName(q.key)}${to}`;
}
const scaleName = (q: CsQ, id: string) => `${noteName(q.root)} ${CS_NAME[id] ?? id}`;
/** Who the avoid notes are, said plainly. */
function avoidText(tones: ScaleTone[]): string {
  const avoid = tones.filter((t) => t.role === 'avoid');
  const tensions = tones.filter((t) => t.role === 'tension').map((t) => t.label);
  const t = tensions.length ? `Tensions ${tensions.join(' ')}` : 'No tensions';
  return avoid.length ? `${t} · avoid ${avoid.map((a) => `${a.label} (${noteName(a.note)})`).join(', ')}` : `${t} · no avoid notes`;
}

export function ChordScaleMode({ task, taskChips }: { task: CsTask; taskChips: ReactNode }) {
  useModeCleanup();
  const [level, setLevel] = usePref<CsLevel>('cs.level', 'major');
  const [under, setUnder] = usePref<Under>('cs.under', 'held');
  const [q, setQ] = useState<CsQ>(() => newQ(task, level, null));
  const [picked, setPicked] = useState<string | null>(null);
  // Over the chord: semitones above the root played so far, and the scales they still fit
  const [played, setPlayed] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [shown, setShown] = useState(false);
  const [wrong, flash] = useFlash();
  const [droneOn, setDroneOn] = useState(true);

  const steps = ladder(LEVEL_CHOICES, level, (l) => { setLevel(l); next(l); });
  const tally = useTally(`cs.${task}`, `Scales · ${task === 'name' ? 'Chord → scale' : 'Over the chord'}`, itemsFor(level).map((i) => i.id), csLabel, steps);

  const item = q.item;
  const rootPc = pc(q.root);
  const voicing = chordVoicing(rootPc, item.type);
  const alive = stillFits(item.scales, played);
  // the scale on show: what you picked if it fits, else what your notes still fit, else the usual one
  const shownScale = picked && item.scales.includes(picked) ? picked : alive[0] ?? item.scales[0];
  const tones = overChord(q.root, item.type, shownScale);
  const len = tones.length + 1;
  const base = 60 + rootPc;
  const answered = task === 'name' ? picked !== null : played.length >= len || shown;
  const ok = task === 'name' ? !!picked && item.scales.includes(picked) : played.length >= len && misses === 0 && !shown;
  const others = item.scales.filter((s) => s !== shownScale);

  const next = (l = level) => {
    setQ((p) => newQ(task, l, p));
    setPicked(null);
    setPlayed([]);
    setMisses(0);
    setShown(false);
  };

  // a fresh chord: hold it (or strike it) and put the computer keys under its root
  useEffect(() => {
    input.placeRoot(base);
    if (under === 'struck') strike();
  }, [q]);
  useEffect(() => {
    void audio.init();
    audio.drone(under === 'held' && droneOn ? voicing : []);
  }, [q, under, droneOn]);
  useEffect(() => () => audio.drone([]), []);

  const strike = (at = 0, dur = 1.8) => playBlock(voicing, dur, at);
  /** The scale up from the root; struck mode strikes the chord under it. */
  const runScale = (id = shownScale) => {
    const line = [...overChord(q.root, item.type, id).map((t) => base + t.semis), base + 12];
    if (under === 'struck') strike(0, line.length * 0.26 + 0.6);
    playEvents(line.map((note, i) => ({ note, start: 0.05 + i * 0.26, dur: 0.24 })));
  };

  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    if (answered) tones.forEach((t) => (marks[base + t.semis] = { label: t.label, tone: TONE[t.role] }));
    else if (task === 'play') {
      marks[base] = { label: 'R', tone: 'root' };
      played.forEach((s, i) => (marks[base + s] = { label: i < tones.length ? tones[i].label : 'R', tone: 'ok' }));
    }
    if (answered) marks[base + 12] = { label: 'R', tone: 'root' };
    for (const w of wrong) marks[w] = { tone: 'wrong' };
    setMarks(marks);
  }, [q, answered, played, wrong, shownScale]);

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    tally.record(item.id, item.scales.includes(id));
    window.setTimeout(() => runScale(item.scales.includes(id) ? id : item.scales[0]), 150);
  };

  const showMe = () => {
    setShown(true);
    tally.record(item.id, false);
    runScale(item.scales[0]);
  };

  useNoteOn((midi) => {
    if (task !== 'play' || answered) return;
    const s = mod(midi - rootPc, 12);
    const semis = played.length === tones.length && s === 0 ? 12 : s;
    const tried = [...played, semis];
    if (!stillFits(item.scales, tried).length) {
      flash(midi);
      setMisses((m) => m + 1);
      return;
    }
    setPlayed(tried);
    if (tried.length === len) tally.record(item.id, misses === 0);
  });

  useHotkeys((e) => {
    if (e.code === 'Escape') return setDroneOn(false); // panic silenced it: show that
    if ((e.code === 'Space' || e.code === 'Enter') && answered) {
      e.preventDefault();
      if (e.code === 'Space' && task === 'play') return runScale();
      return next();
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (under === 'held' && !droneOn) setDroneOn(true);
      strike(0, 1.4);
    } else if (e.code === 'Backspace' && task === 'play') {
      e.preventDefault();
      setPlayed([]);
    }
  });

  const parent = melodicParent(q.root, shownScale);
  const reveal = shown || misses >= 2 || answered;
  const options = answersFor(item, level).map((id) => ({ id, label: CS_NAME[id] ?? id }));

  return (
    <div className="s-mode">
      <Bar tally={tally} help={{ topics: TOPICS[level], method: METHOD[task] } satisfies Help}>
        {taskChips}
        <Pick label="Chords" value={level} options={LEVEL_CHOICES} onChange={(l) => { setLevel(l); next(l); }} />
        <Pick label="Chord under the scale" value={under} options={UNDERS} onChange={(u) => { setUnder(u); setDroneOn(true); }} />
      </Bar>

      <section className="s-stage cs">
        <div className="s-q">
          <h1 className="symbol">{symbolOf(q)}</h1>
          <p className="sub">{contextOf(q)}</p>
        </div>

        {task === 'name' ? (
          <Answers
            options={options}
            right={picked && item.scales.includes(picked) ? picked : item.scales[0]}
            picked={picked}
            onPick={choose}
          />
        ) : null}

        {task === 'play' || answered ? (
          <ol className="s-steps cs" aria-label={`${scaleName(q, shownScale)} over ${symbolOf(q)}`}>
            {[...tones, { ...tones[0], label: 'R' }].map((t, i) => {
              const done = i < played.length;
              const open = done || reveal || i === 0;
              const now = task === 'play' && i === played.length && !answered;
              const cls = [done ? 'ok' : '', now ? `now ${wrong.size ? 'shake' : ''}` : '', open && (answered || done) && t.role === 'avoid' ? 'avoid' : ''].join(' ');
              return (
                <li key={i} className={cls} title={open && answered ? ROLE_WORD[t.role] : undefined}>
                  <span className="n">{open ? noteName(t.note) : '?'}</span>
                  <span className="d">{open && (answered || done || i === 0) ? t.label : '·'}</span>
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="s-status" aria-live="polite">
          {answered ? (
            <>
              <strong className={ok ? 'good' : 'bad'}>
                {ok ? '✓ ' : '✗ '}
                {scaleName(q, shownScale)}
                {task === 'play' && misses ? ` · ${misses} wrong` : ''}
              </strong>
              <span className="muted">{avoidText(tones)}{others.length ? ` · also fits: ${others.map((s) => CS_NAME[s]).join(', ')}` : ''}</span>
              {task === 'play' ? <Listen onClick={() => runScale()} label="Hear it" /> : null}
              <button type="button" className="btn primary" onClick={() => next()}>Next <K>{task === 'play' ? 'Enter' : 'Space'}</K></button>
            </>
          ) : task === 'play' ? (
            <>
              <span>
                {played.length === 0 ? <>Play its scale up from <b>{noteName(q.root)}</b>, over the chord.</> : <>{played.length} / {len}</>}
                {misses ? <span className="muted"> · {misses} wrong{misses >= 2 ? ' — notes shown' : ''}</span> : null}
              </span>
              <button type="button" className="btn ghost small" onClick={() => strike(0, 1.4)}>Chord <K>Space</K></button>
              {played.length ? <button type="button" className="btn ghost small" onClick={() => setPlayed([])}>Restart <K>⌫</K></button> : null}
              <button type="button" className="btn ghost small" onClick={showMe}>Show me</button>
            </>
          ) : (
            <>
              <span>Which scale? Keys 1–{Math.min(8, options.length)}.</span>
              <Listen onClick={() => strike(0, 1.4)} label="Chord" />
            </>
          )}
        </div>

        {answered ? (
          <p className="s-info">
            {item.why}
            {parent && parent.degree > 1 ? <> <b>Same notes as</b> {noteName(parent.tonic)} melodic minor, from its {['', '2nd', '3rd', '4th', '5th', '6th', '7th'][parent.degree - 1]} note.</> : null}
          </p>
        ) : null}
      </section>
    </div>
  );
}
