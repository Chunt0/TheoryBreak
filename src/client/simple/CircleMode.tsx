// The circle of fifths, seen from a key. Play and the circle lights up (chords
// draw their shape); every slot names its degree from the tonic and the chord
// built on it; a drone holds the tonic so the ear has somewhere to stand.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent, type RefObject } from 'react';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { chordSymbol, detectChord, getChord } from '../theory/chords';
import { getInterval, mod, noteName, type Note } from '../theory/core';
import type { KeyMark } from '../ui/Keyboard';
import { Bar, Chips, K, Pick, playEvents, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';
import type { Help } from './Lessons';
import { pickFor, useTally } from './stats';
import {
  CIRCLE_SCALES, degreeLabel, diatonicOnDegrees, droneNotes, intervalWords, keyText, NO_SCALE, numeralOf,
  scaleSemis, shapeText, slotOf, spellPcIn, spellSemis, tonicFor, walkSemis,
} from './circleLogic';

type Task = 'explore' | 'find' | 'walk';
type Drone = 'off' | 'root' | 'fifth';
type View = 'tonic' | 'c';
type Rings = 'triads' | 'sevenths' | 'degrees' | 'notes';
type Ask = 'name' | 'ear';
type Dir = 'fourths' | 'fifths';

const TASKS: Choice<Task>[] = [
  { id: 'explore', label: 'Explore', title: 'Play anything: the circle lights up' },
  { id: 'find', label: 'Find', title: 'Find degrees: one is named (or played), you play it' },
  { id: 'walk', label: 'Walk', title: 'Walk the circle: every root in 4ths or 5ths, then home' },
];
const DRONES: Choice<Drone>[] = [{ id: 'off', label: 'Off' }, { id: 'root', label: 'Tonic' }, { id: 'fifth', label: 'Tonic + 5th' }];
const VIEWS: Choice<View>[] = [{ id: 'tonic', label: 'Tonic on top' }, { id: 'c', label: 'C on top' }];
const RINGS: Choice<Rings>[] = [
  { id: 'triads', label: 'Degrees + triads' },
  { id: 'sevenths', label: 'Degrees + 7ths' },
  { id: 'degrees', label: 'Degrees only' },
  { id: 'notes', label: 'Names only' },
];
const ASKS: Choice<Ask>[] = [{ id: 'name', label: 'By name' }, { id: 'ear', label: 'By ear' }];
const DIRS: Choice<Dir>[] = [{ id: 'fourths', label: 'In 4ths ↺' }, { id: 'fifths', label: 'In 5ths ↻' }];

const SCALE_LABEL: Record<string, string> = {
  lydian: 'Lydian', major: 'Major', mixolydian: 'Mixolydian', dorian: 'Dorian', minor: 'Minor', phrygian: 'Phrygian', locrian: 'Locrian',
  harmonic_minor: 'Harmonic minor', melodic_minor: 'Melodic minor', major_pent: 'Major pentatonic', minor_pent: 'Minor pentatonic', blues: 'Blues', [NO_SCALE]: 'No scale',
};
const SCALE_GROUPS = CIRCLE_SCALES.map((g) => ({ title: g.title, options: g.ids.map((id) => ({ id, label: SCALE_LABEL[id] })) }));
/** Keys in circle order, so the picker reads like the wheel. */
const KEY_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const TOPICS = ['core.keys', 'core.degrees', 'core.modes', 'core.diatonic', 'core.rootmotion'];
const HELP: Record<Task, Help> = {
  explore: {
    topics: TOPICS,
    method: [
      'Clockwise is up a 5th: each step adds a sharp or drops a flat. Counter-clockwise is up a 4th, the way V falls to I.',
      'With the tonic on top the degrees never move: 5 one step right, 4 one step left, 2 and ♭7 two steps out, 6 and ♭3 three.',
      'A major key is seven neighbours, 4 round to 7. Every mode is that arc with the tonic moved along it: Lydian at the flat end, Locrian at the sharp end.',
      'Neighbouring roots are a 5th apart, so ii–V–I walks three steps counter-clockwise and a tritone sub sits straight across.',
    ],
  },
  find: {
    topics: ['core.degrees', 'core.keys', 'core.modes'],
    method: [
      'Find the degree on the wheel first: 5 one step clockwise, 4 one step back, 2 two steps clockwise, ♭7 two steps back, and so on.',
      'Then hear it against the drone: 5 and 4 are open, 3 and 6 sweet, 7 and ♭2 lean hard on their neighbour, ♯4 floats.',
      'By ear: hum the tonic, then walk up to the note in your head before you touch a key.',
    ],
  },
  walk: {
    topics: ['core.keys', 'core.rootmotion', 'jazz.iivi'],
    method: [
      'In 4ths (counter-clockwise) is the ii–V–I direction: C F B♭ E♭ A♭ D♭ G♭ B E A D G, then home.',
      'In 5ths each step adds a sharp: C G D A E B F♯, then round the flat side back to C.',
      'Say each name before you play it. No misses first, then speed.',
    ],
  },
};

/** The register the circle's notes play in: tonic from G3 up to F♯4. */
const tonicMidiOf = (p: number): number => 55 + mod(p - 7, 12);

interface FindQ {
  semis: number;
  missed: boolean;
  done: boolean;
}

interface Walk {
  idx: number;
  misses: number;
  started: number | null;
  finished: number | null;
}
const freshWalk = (): Walk => ({ idx: 0, misses: 0, started: null, finished: null });

const heldKey = () => input.heldNotes().join(',');
const parseHeld = (k: string): number[] => (k ? k.split(',').map(Number) : []);

export function CircleMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('cof.task', 'explore');
  const [tonicPc, setTonicPc] = usePref('cof.key', 0);
  const [scaleId, setScaleId] = usePref('cof.scale', 'major');
  const [drone, setDrone] = usePref<Drone>('cof.drone', 'off');
  const [lastDrone, setLastDrone] = usePref<Exclude<Drone, 'off'>>('cof.droneKind', 'root');
  const [view, setView] = usePref<View>('cof.view', 'tonic');
  const [rings, setRings] = usePref<Rings>('cof.rings', 'triads');
  const [ask, setAsk] = usePref<Ask>('cof.ask', 'name');
  const [dir, setDir] = usePref<Dir>('cof.dir', 'fourths');
  const [walkBest, setWalkBest] = usePref<Record<string, number>>('cof.walkBest', {});

  const tonic = useMemo(() => tonicFor(tonicPc, scaleId), [tonicPc, scaleId]);
  const tonicMidi = tonicMidiOf(tonicPc);
  const inScale = useMemo(() => new Set(scaleSemis(scaleId)), [scaleId]);
  const pool = useMemo(() => (scaleId === NO_SCALE ? Array.from({ length: 12 }, (_, i) => i) : scaleSemis(scaleId)), [scaleId]);
  const spell = (semis: number): Note => spellSemis(tonic, semis, scaleId);

  // ------------------------------------------------------------ what is played
  const held = parseHeld(useSyncExternalStore((fn) => input.onChange(fn), heldKey));
  /** the last notes played together: they stay drawn after the keys let go */
  const [shown, setShown] = useState<number[]>([]);
  const [wrong, flash] = useFlash(600);

  // ------------------------------------------------------------ drone
  useEffect(() => audio.drone(drone === 'off' ? [] : droneNotes(tonicPc, drone)), [drone, tonicPc]);
  useEffect(() => () => audio.drone([]), []);
  const toggleDrone = () => {
    void audio.init();
    if (drone === 'off') setDrone(lastDrone);
    else setDrone('off');
  };
  const pickDrone = (d: Drone) => {
    void audio.init();
    if (d !== 'off') setLastDrone(d);
    setDrone(d);
  };

  // ------------------------------------------------------------ find
  const tally = useTally(`cof.${ask}`, `Circle · find by ${ask === 'ear' ? 'ear' : 'name'}`, pool.map(String), (i) => degreeLabel(Number(i), scaleId));
  const newFind = (prev: number | null): FindQ => ({ semis: pickFor(`cof.${ask}`, pool, prev), missed: false, done: false });
  const [q, setQ] = useState<FindQ>(() => newFind(null));
  const hear = (semis = q.semis) => playEvents([{ note: tonicMidi + semis, start: 0, dur: 1.2 }]);
  const nextFind = () => {
    const n = newFind(q.semis);
    setQ(n);
    if (ask === 'ear') hear(n.semis);
  };
  const reveal = () => {
    if (q.done) return;
    if (!q.missed) tally.record(String(q.semis), false);
    setQ({ ...q, missed: true, done: true });
    hear();
  };
  // a new set of degrees (or way of asking) starts afresh
  useEffect(() => {
    if (task !== 'find') return;
    const n = newFind(null);
    setQ(n);
    if (ask === 'ear') hear(n.semis);
  }, [task, ask, scaleId, tonicPc]);
  // right answers move on by themselves
  useEffect(() => {
    if (task !== 'find' || !q.done || q.missed) return;
    const t = window.setTimeout(nextFind, 1100);
    return () => window.clearTimeout(t);
  }, [q, task]);

  // ------------------------------------------------------------ walk
  const walkSeq = useMemo(() => walkSemis(dir), [dir]);
  const [walk, setWalk] = useState<Walk>(freshWalk);
  const walkDone = walk.finished !== null;
  useEffect(() => setWalk(freshWalk()), [dir, tonicPc, task]);
  const walkSecs = walk.started !== null && walk.finished !== null ? (walk.finished - walk.started) / 1000 : null;
  const best = walkBest[dir];

  // ------------------------------------------------------------ key moves
  /** One step round the circle: +1 clockwise (up a 5th), −1 counter-clockwise. */
  const stepKey = (steps: number) => setTonicPc(mod(tonicPc + steps * 7, 12));

  useEffect(() => input.placeRoot(tonicMidi), [tonicMidi]);

  useNoteOn((note) => {
    setShown(input.heldNotes());
    const semis = mod(note - tonicPc, 12);
    if (task === 'find') {
      if (q.done) return;
      if (semis === q.semis) {
        if (!q.missed) tally.record(String(q.semis), true);
        setQ({ ...q, done: true });
      } else {
        flash(semis);
        if (!q.missed) {
          tally.record(String(q.semis), false);
          setQ({ ...q, missed: true });
        }
      }
    } else if (task === 'walk') {
      if (walkDone) return;
      if (semis !== walkSeq[walk.idx]) {
        flash(semis);
        setWalk({ ...walk, misses: walk.misses + 1 });
        return;
      }
      const now = performance.now();
      const idx = walk.idx + 1;
      const finished = idx === walkSeq.length ? now : null;
      const next = { ...walk, idx, started: walk.started ?? now, finished };
      setWalk(next);
      if (finished !== null && next.misses === 0) {
        const secs = (finished - next.started) / 1000;
        if (best === undefined || secs < best) setWalkBest({ ...walkBest, [dir]: secs });
      }
    }
  });

  useHotkeys((e) => {
    if (e.code === 'Escape') return setDrone('off'); // the panic silenced it: show that
    const k = e.code;
    if (k !== 'Space' && k !== 'Enter' && k !== 'Backspace') return;
    e.preventDefault();
    if (task === 'explore') {
      if (k === 'Space') toggleDrone();
      else stepKey(k === 'Enter' ? 1 : -1);
    } else if (task === 'find') {
      if (k === 'Backspace') toggleDrone();
      else if (q.done || k === 'Enter') nextFind();
      else if (ask === 'ear') hear();
      else reveal();
    } else {
      if (k === 'Backspace') setWalk(freshWalk());
      else if (k === 'Enter' && walkDone) stepKey(dir === 'fourths' ? -1 : 1);
      else if (k === 'Space') toggleDrone();
    }
  });

  // ------------------------------------------------------------ the big keyboard
  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    const mark = (semis: number, tone: KeyMark['tone'], label = noteName(spell(semis))) => (marks[tonicMidi + semis] = { label, tone });
    if (task === 'explore') {
      pool.forEach((s) => mark(s, s === 0 ? 'root' : 'scale'));
      mark(12, 'root', noteName(tonic));
    } else if (task === 'find') {
      mark(0, 'root');
      if (q.done) mark(q.semis, q.missed ? 'target' : 'ok');
    } else if (!walkDone) {
      mark(walkSeq[walk.idx], walk.idx === 0 ? 'root' : 'target');
    }
    setMarks(marks);
  }, [task, tonicPc, scaleId, q, walk, walkSeq]);

  // ------------------------------------------------------------ what the centre says
  const lit = new Set(held.map((n) => mod(n - tonicPc, 12)));
  const restShown = held.length === 0;
  const centre = ((): Centre => {
    if (task === 'find') {
      if (q.done) return { big: noteName(spell(q.semis)), small: `${degreeLabel(q.semis, scaleId)} of ${noteName(tonic)}`, tone: q.missed ? 'bad' : 'good' };
      return ask === 'ear' ? { big: '?', small: 'play what you hear' } : { big: degreeLabel(q.semis, scaleId), small: `${intervalWords(q.semis, scaleId)} up` };
    }
    if (task === 'walk') {
      if (walkDone) return { big: walkSecs !== null ? `${walkSecs.toFixed(1)} s` : '✓', small: walk.misses ? `${walk.misses} miss${walk.misses > 1 ? 'es' : ''}` : 'no misses', tone: walk.misses ? undefined : 'good' };
      return { big: noteName(spell(walkSeq[walk.idx])), small: `${walk.idx + 1} of ${walkSeq.length}` };
    }
    return readout(shown, tonic, tonicPc, scaleId);
  })();

  const shapePcs = task === 'explore' ? [...new Set(shown.map((n) => mod(n - tonicPc, 12)))] : [];
  const marksOn = new Map<number, string>();
  if (task === 'find' && q.done) marksOn.set(q.semis, q.missed ? 'target' : 'ok');
  if (task === 'walk') walkSeq.slice(0, walk.idx).forEach((s) => marksOn.set(s, 'ok'));
  if (task === 'walk' && !walkDone) marksOn.set(walkSeq[walk.idx], 'target');
  for (const w of wrong) marksOn.set(w, 'wrong');

  const nextKeyName = (steps: number) => noteName(tonicFor(mod(tonicPc + steps * 7, 12), scaleId));
  const droneOn = drone !== 'off';

  return (
    <div className="s-mode s-cofmode">
      <Bar tally={task === 'find' ? tally : undefined} help={HELP[task]}>
        <Chips label="Task" value={task} options={TASKS} onChange={setTask} />
        <Pick label="Key" prefix="Key" value={String(tonicPc)} options={KEY_ORDER.map((p) => ({ id: String(p), label: noteName(tonicFor(p, scaleId)) }))} onChange={(v) => setTonicPc(Number(v))} />
        <Pick label="Scale" value={scaleId} groups={SCALE_GROUPS} onChange={setScaleId} />
        <Pick label="Drone" prefix="Drone" value={drone} options={DRONES} onChange={pickDrone} />
        <Pick label="View" value={view} options={VIEWS} onChange={setView} />
        <Pick label="Rings" value={rings} options={RINGS} onChange={setRings} />
        {task === 'find' ? <Pick label="Asked" value={ask} options={ASKS} onChange={setAsk} /> : null}
        {task === 'walk' ? <Pick label="Direction" value={dir} options={DIRS} onChange={setDir} /> : null}
      </Bar>

      <section className="s-stage">
        <div className="s-cof">
          <div className="s-cof-side">
            <div className="s-q">
              <h1>{keyText(tonic, scaleId)}</h1>
              <p className="sub">
                {task === 'explore' ? shapeText(scaleId)
                  : task === 'find' ? (ask === 'ear' ? 'A degree plays over the drone: find it on the keys.' : 'The centre names a degree: play it, in any octave.')
                  : `Every root ${dir === 'fourths' ? 'counter-clockwise in 4ths' : 'clockwise in 5ths'} from ${noteName(tonic)}, then home.${best !== undefined ? ` Best clean run: ${best.toFixed(1)} s.` : ''}`}
              </p>
            </div>
            <div className="s-status" aria-live="polite">
              {task === 'explore' ? (
                <>
                  <button type="button" className={`btn ${droneOn ? 'primary' : ''}`} onClick={toggleDrone} aria-pressed={droneOn}>Drone {droneOn ? 'on' : 'off'} <K>Space</K></button>
                  <button type="button" className="btn ghost small" onClick={() => stepKey(-1)} title="Down a 5th (up a 4th)">↺ {nextKeyName(-1)} <K>⌫</K></button>
                  <button type="button" className="btn ghost small" onClick={() => stepKey(1)} title="Up a 5th">{nextKeyName(1)} ↻ <K>Enter</K></button>
                </>
              ) : task === 'find' ? (
                q.done ? (
                  <>
                    <strong className={q.missed ? 'bad' : 'good'}>{q.missed ? '✗ ' : '✓ '}{noteName(spell(q.semis))} is the {degreeLabel(q.semis, scaleId)} of {noteName(tonic)}</strong>
                    <button type="button" className="btn primary" onClick={nextFind}>Next <K>Space</K></button>
                  </>
                ) : (
                  <>
                    {wrong.size ? <span className="bad">That was the {[...wrong].map((w) => degreeLabel(w, scaleId)).join(', ')}</span> : null}
                    {ask === 'ear' ? <button type="button" className="btn" onClick={() => hear()}>Hear it <K>Space</K></button> : <button type="button" className="btn ghost small" onClick={reveal}>Show me <K>Space</K></button>}
                    <button type="button" className="btn ghost small" onClick={nextFind}>Skip <K>Enter</K></button>
                    <button type="button" className={`btn ghost small ${droneOn ? 'on' : ''}`} onClick={toggleDrone} aria-pressed={droneOn}>Drone {droneOn ? 'on' : 'off'} <K>⌫</K></button>
                  </>
                )
              ) : walkDone ? (
                <>
                  <strong className={walk.misses ? '' : 'good'}>✓ Round in {walkSecs!.toFixed(1)} s{walk.misses ? `, ${walk.misses} miss${walk.misses > 1 ? 'es' : ''}` : ''}</strong>
                  <button type="button" className="btn primary" onClick={() => stepKey(dir === 'fourths' ? -1 : 1)}>Next: {nextKeyName(dir === 'fourths' ? -1 : 1)} <K>Enter</K></button>
                  <button type="button" className="btn ghost small" onClick={() => setWalk(freshWalk())}>Again <K>⌫</K></button>
                </>
              ) : (
                <>
                  <span className="tnum">{walk.idx} / {walkSeq.length}{walk.misses ? ` · ${walk.misses} miss${walk.misses > 1 ? 'es' : ''}` : ''}</span>
                  <button type="button" className={`btn ghost small ${droneOn ? 'on' : ''}`} onClick={toggleDrone} aria-pressed={droneOn}>Drone {droneOn ? 'on' : 'off'} <K>Space</K></button>
                  {walk.idx ? <button type="button" className="btn ghost small" onClick={() => setWalk(freshWalk())}>Restart <K>⌫</K></button> : null}
                </>
              )}
            </div>
          </div>

          <Wheel
            tonicPc={tonicPc}
            tonic={tonic}
            scaleId={scaleId}
            inScale={inScale}
            view={view}
            rings={rings}
            lit={lit}
            marks={marksOn}
            shape={shapePcs}
            shapeResting={restShown}
            centre={centre}
            tonicMidi={tonicMidi}
          />
        </div>
      </section>
    </div>
  );
}

interface Centre {
  big: string;
  small: string;
  more?: string;
  tone?: string;
}

/** What the centre shows for the notes last played: a chord and its numeral, an interval, or a note and its degree. */
function readout(notes: number[], tonic: Note, tonicPc: number, scaleId: string): Centre {
  const pcs = [...new Set(notes.map((n) => mod(n, 12)))];
  const name = (p: number) => noteName(spellPcIn(tonic, p, scaleId));
  const deg = (p: number) => degreeLabel(p - tonicPc, scaleId);
  if (!pcs.length) return { big: noteName(tonic), small: 'play anything' };
  if (pcs.length === 1) {
    const s = mod(pcs[0] - tonicPc, 12);
    return { big: name(pcs[0]), small: deg(pcs[0]), more: `${intervalWords(s, scaleId)}${scaleId !== NO_SCALE && !scaleSemis(scaleId).includes(s) ? ' · outside' : ''}` };
  }
  const chord = pcs.length >= 3 ? detectChord(notes) : null;
  if (chord) {
    const root = spellPcIn(tonic, chord.rootPc, scaleId);
    const bass = chord.bassPc !== chord.rootPc ? spellPcIn(tonic, chord.bassPc, scaleId) : null;
    return { big: chordSymbol(root, chord.typeId, bass), small: numeralOf(chord.rootPc - tonicPc, chord.typeId, scaleId), more: getChord(chord.typeId).name.toLowerCase() };
  }
  const sorted = [...notes].sort((a, b) => a - b);
  if (pcs.length === 2) {
    const ivl = getInterval(['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'][mod(sorted[sorted.length - 1] - sorted[0], 12)]);
    return { big: pcs.map(name).join(' '), small: pcs.map(deg).join(' + '), more: ivl.name.toLowerCase() };
  }
  return { big: pcs.map(name).join(' '), small: pcs.map(deg).join(' ') };
}

// ---------------------------------------------------------------- the wheel

/** Eases the wheel's turn (in slots) the short way round. */
function useTurn(target: number): number {
  const [shown, setShown] = useState(target);
  const at = useRef(target);
  useEffect(() => {
    const from = at.current;
    const to = from + (mod(target - from + 6, 12) - 6);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(to - from) < 1e-3) {
      at.current = to;
      setShown(to);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 450);
      at.current = from + (to - from) * (1 - Math.pow(1 - k, 3));
      setShown(at.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

/** The wheel's drawn size in px, to drop the chord ring when it gets small. */
function useWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const xy = (r: number, a: number): [number, number] => [r * Math.cos(rad(a)), r * Math.sin(rad(a))];
const f2 = (n: number) => n.toFixed(2);

/** A ring cell: the slot's slice between two radii, with a hairline gap. */
function cell(a: number, r0: number, r1: number): string {
  const gap = 0.9;
  const [ax, ay] = xy(r1, a - 15 + gap);
  const [bx, by] = xy(r1, a + 15 - gap);
  const g0 = (gap * r1) / r0;
  const [cx, cy] = xy(r0, a + 15 - g0);
  const [dx, dy] = xy(r0, a - 15 + g0);
  return `M${f2(ax)} ${f2(ay)}A${r1} ${r1} 0 0 1 ${f2(bx)} ${f2(by)}L${f2(cx)} ${f2(cy)}A${r0} ${r0} 0 0 0 ${f2(dx)} ${f2(dy)}Z`;
}

/** "♭IIImaj7♯5" on two lines, the numeral over its quality, so it fits its slot. */
function ChordLabel({ x, y, numeral }: { x: number; y: number; numeral: string }) {
  const [, roman, rest] = /^([♭♯]?[ivxIVX]+)(.*)$/.exec(numeral) ?? [numeral, numeral, ''];
  if (!rest || numeral.length <= 4) return <text x={f2(x)} y={f2(y)} className="t-chord">{numeral}</text>;
  return (
    <text x={f2(x)} y={f2(y)} className="t-chord">
      <tspan x={f2(x)} dy="-6">{roman}</tspan>
      <tspan x={f2(x)} dy="13" className="q">{rest}</tspan>
    </text>
  );
}

function Wheel({ tonicPc, tonic, scaleId, inScale, view, rings, lit, marks, shape, shapeResting, centre, tonicMidi }: {
  tonicPc: number;
  tonic: Note;
  scaleId: string;
  inScale: Set<number>;
  view: View;
  rings: Rings;
  /** degrees sounding now */
  lit: Set<number>;
  /** degrees marked by the drill: ok, wrong, target */
  marks: Map<number, string>;
  /** degrees of the last notes played together, joined up */
  shape: number[];
  shapeResting: boolean;
  centre: Centre;
  tonicMidi: number;
}) {
  const [box, width] = useWidth();
  const compact = width < 330;
  const showDeg = rings !== 'notes';
  const showChords = (rings === 'triads' || rings === 'sevenths') && !compact;
  const chords = useMemo(() => new Map(diatonicOnDegrees(scaleId, rings === 'sevenths').map((c) => [c.semis, c])), [scaleId, rings]);
  // radii: note names outside, degrees, chords, then the centre
  const R0 = 198;
  const R1 = showDeg ? (compact ? 138 : 150) : 112;
  const R2 = showDeg ? (showChords ? 106 : compact ? 84 : 98) : R1;
  const R3 = showChords ? 64 : R2;
  // the tonic's slot on the C-based circle; with the tonic on top the wheel turns to it
  const turn = useTurn(view === 'tonic' ? slotOf(tonicPc) : 0);
  const angleOf = (semis: number) => (slotOf(mod(tonicPc + semis, 12)) - turn) * 30 - 90;

  // hold the notes a pointer started, to let them go on release
  const downs = useRef(new Map<number, number[]>());
  const press = (e: PointerEvent, notes: number[]) => {
    e.preventDefault();
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    release(e.pointerId);
    downs.current.set(e.pointerId, notes);
    notes.forEach((n) => input.screenNoteOn(n));
  };
  const release = (id: number) => {
    downs.current.get(id)?.forEach((n) => input.screenNoteOff(n));
    downs.current.delete(id);
  };
  useEffect(() => () => [...downs.current.keys()].forEach(release), []);
  const chordNotes = (semis: number, typeId: string) => {
    const root = 48 + mod(tonicPc + semis, 12);
    return getChord(typeId).intervals.map((i) => root + getInterval(i).semis);
  };

  const order = Array.from({ length: 12 }, (_, i) => mod(i * 7, 12)); // degrees round from the tonic
  const pts = [...shape].sort((a, b) => mod(angleOf(a) + 90, 360) - mod(angleOf(b) + 90, 360)).map((s) => xy(R1 - 3, angleOf(s)));
  const label = `Circle of fifths from ${noteName(tonic)}`;
  const big = centre.big.length > 6 ? 'long' : '';

  return (
    <div className="s-cof-wheel" ref={box}>
      <svg viewBox="-200 -200 400 400" role="img" aria-label={label} className={compact ? 'compact' : ''}>
        {order.map((semis) => {
          const a = angleOf(semis);
          const ins = scaleId === NO_SCALE || inScale.has(semis);
          const chord = chords.get(semis);
          const note = tonicMidi + semis;
          const cls = `${ins ? 'in' : 'out'} ${semis === 0 ? 'tonic' : ''} ${lit.has(semis) ? 'lit' : ''} ${marks.get(semis) ?? ''}`;
          return (
            <g key={semis} className={`slot ${cls}`}>
              <g onPointerDown={(e) => press(e, [note])} onPointerUp={(e) => release(e.pointerId)} onPointerLeave={(e) => release(e.pointerId)} onPointerCancel={(e) => release(e.pointerId)}>
                <path className="c-note" d={cell(a, R1, R0)} />
                {showDeg ? <path className="c-deg" d={cell(a, R2, R1)} /> : null}
              </g>
              {showChords ? (
                <path
                  className={`c-chord ${chord ? 'has' : ''}`}
                  d={cell(a, R3, R2)}
                  onPointerDown={chord ? (e) => press(e, chordNotes(semis, chord.typeId)) : undefined}
                  onPointerUp={(e) => release(e.pointerId)}
                  onPointerLeave={(e) => release(e.pointerId)}
                  onPointerCancel={(e) => release(e.pointerId)}
                />
              ) : null}
            </g>
          );
        })}
        {pts.length >= 2 ? (
          <polygon className={`shape ${shapeResting ? 'rest' : ''}`} points={pts.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' ')} />
        ) : null}
        {order.map((semis) => {
          const a = angleOf(semis);
          const ins = scaleId === NO_SCALE || inScale.has(semis);
          const chord = chords.get(semis);
          const [nx, ny] = xy((R0 + R1) / 2, a);
          const [dx, dy] = xy((R1 + R2) / 2, a);
          const [cx, cy] = xy((R2 + R3) / 2, a);
          const cls = `${ins ? 'in' : 'out'} ${semis === 0 ? 'tonic' : ''} ${lit.has(semis) ? 'lit' : ''} ${marks.get(semis) ?? ''}`;
          return (
            <g key={semis} className={`labels ${cls}`}>
              <text x={f2(nx)} y={f2(ny)} className="t-note">{noteName(spellSemis(tonic, semis, scaleId))}</text>
              {showDeg ? <text x={f2(dx)} y={f2(dy)} className="t-deg">{degreeLabel(semis, scaleId)}</text> : null}
              {showChords && chord ? <ChordLabel x={cx} y={cy} numeral={chord.numeral} /> : null}
            </g>
          );
        })}
        <circle r={R3 - 4} className="hub" />
        <text y={centre.more ? (compact ? -20 : -14) : -6} className={`t-big ${big} ${centre.tone ?? ''}`}>{centre.big}</text>
        <text y={centre.more ? (compact ? 14 : 14) : compact ? 26 : 22} className="t-small">{centre.small}</text>
        {centre.more ? <text y={compact ? 38 : 32} className="t-more">{centre.more}</text> : null}
      </svg>
    </div>
  );
}
