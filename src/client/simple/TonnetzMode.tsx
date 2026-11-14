// The Tonnetz, seen from a key: the twelve notes on a triangular lattice where
// right is up a 5th and the diagonals are major and minor 3rds, so every
// triangle is a triad and neighbours share two notes. Notes wear the Circle
// tab's degree colours and are spelled by where they sit, sharps up and to the
// right, flats down and to the left (or all one way). Whatever you play lights
// its notes, edges and triangles; Info adds chord names, the moves between
// chords and the words. Move asks for P, L, R and friends; Cycle walks them.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type RefObject } from 'react';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { chordSymbol, detectChord } from '../theory/chords';
import { mod, noteName, spellPc } from '../theory/core';
import type { KeyMark } from '../ui/Keyboard';
import { Bar, Chips, K, Pick, playEvents, releaseFocus, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';
import { degreeColor, degreeInk } from './CircleMode';
import { CIRCLE_SCALES, degreeLabel, droneNotes, keyText, NO_SCALE, scaleSemis, spellSemis, tonicFor } from './circleLogic';
import type { Help } from './Lessons';
import { ladder, pickFor, useTally } from './stats';
import {
  applyTri, closeVoicing, CYCLES, cycleTris, describeMove, enharmonic, fifthsOf, findTri, moveBetween, MOVE_INFO, MOVE_SETS,
  nodeFifths, nodePc, nodesIn, nodeX, placeNear, samePcs, spellFifths, triadName, triadsIn, triCentre, triIn, triKey, triNodes,
  triPcs, trisIn, triTriad, voiceLead, type Names, type Node, type Tri, type Win,
} from '../theory/tonnetz';

type Task = 'explore' | 'move' | 'cycle';
type Drone = 'off' | 'root' | 'fifth';
type Ask = 'name' | 'ear';

const TASKS: Choice<Task>[] = [
  { id: 'explore', label: 'Explore', title: 'Play anything: notes, edges and triads light up, and the move between chords is named' },
  { id: 'move', label: 'Move', title: 'A chord and a move (P, L, R…): play the triad it lands on' },
  { id: 'cycle', label: 'Cycle', title: 'Walk a cycle of moves round the lattice and home, timed' },
];
const DRONES: Choice<Drone>[] = [
  { id: 'off', label: 'Off', title: 'No drone' },
  { id: 'root', label: '1', title: 'Drone on the tonic' },
  { id: 'fifth', label: '1 + 5', title: 'Drone on the tonic and its 5th' },
];
const NAMES: Choice<Names>[] = [
  { id: 'spelled', label: 'Spelled', title: 'Each note named by where it sits: sharps up and to the right, flats down and to the left' },
  { id: 'sharps', label: 'Sharps', title: 'Every black key as a sharp' },
  { id: 'flats', label: 'Flats', title: 'Every black key as a flat' },
  { id: 'degrees', label: 'Degrees', title: 'Scale degrees from the tonic, in the Circle tab colours' },
];
const ASKS: Choice<Ask>[] = [{ id: 'name', label: 'By name' }, { id: 'ear', label: 'By ear' }];
const MOVES: Choice<string>[] = MOVE_SETS.map((m) => ({ id: m.id, label: m.label }));
const CYCLE_CHOICES: Choice<string>[] = CYCLES.map((c) => ({ id: c.id, label: c.label }));

const SCALE_LABEL: Record<string, string> = {
  lydian: 'Lydian', major: 'Major', mixolydian: 'Mixolydian', dorian: 'Dorian', minor: 'Minor', phrygian: 'Phrygian', locrian: 'Locrian',
  harmonic_minor: 'Harmonic minor', melodic_minor: 'Melodic minor', major_pent: 'Major pentatonic', minor_pent: 'Minor pentatonic', blues: 'Blues', [NO_SCALE]: 'No scale',
};
const SCALE_GROUPS = CIRCLE_SCALES.map((g) => ({ title: g.title, options: g.ids.map((id) => ({ id, label: SCALE_LABEL[id] })) }));
const KEY_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const HELP: Record<Task, Help> = {
  explore: {
    topics: ['core.tonnetz', 'core.plr', 'core.triads', 'core.rootmotion'],
    method: [
      'Right is up a 5th, up-right a major 3rd, down-right a minor 3rd. Each step right is one step sharper on the line of fifths; each row up is four steps sharper.',
      'Triangles pointing up are major, pointing down minor. Two triangles that share an edge share two notes.',
      'A key is a strip: the six triads of C major (Dm F Am C Em G) sit in one row of triangles, the scale\'s notes along its two edges.',
      'Spelled names grow sharper up and to the right and flatter down and to the left; G♯ and A♭ are three rows apart, the same key on the piano.',
    ],
  },
  move: {
    topics: ['core.plr', 'core.tonnetz'],
    method: [
      'Find the start triangle, then cross the edge the move keeps: P keeps root and 5th, R keeps root and 3rd of a major chord, L keeps 3rd and 5th.',
      'Hold the two notes that stay and move one finger: P moves the 3rd a half step, L and R move one note by a half or whole step.',
      'Compound moves are the letters in order: PL is P then L. N is R L P (C → Fm), S is L P R (C → C♯m), H is P L P (C → A♭m).',
      'By ear: listen for the one voice that moves. A half step down in the middle is P from major; the top voice up a whole step is R.',
    ],
  },
  cycle: {
    topics: ['core.plr', 'core.symmetric', 'core.tonnetz'],
    method: [
      'P L alternates major and minor down a column: C Cm A♭ A♭m E Em and home. Every note sits in one hexatonic scale.',
      'P R runs a diagonal: C Cm E♭ E♭m G♭ G♭m A Am and home, the notes of one diminished scale.',
      'R L and L R walk all 24 triads in falling or rising 5ths, one changed note at a time.',
      'Keep the notes that stay held down and move one finger per chord. No misses first, then speed.',
    ],
  },
};

const RH = Math.sqrt(3) / 2;
/** The register single notes play in: tonic from G3 up to F♯4. */
const tonicMidiOf = (p: number): number => 55 + mod(p - 7, 12);
const pcsOfMidis = (m: number[]): number[] => [...new Set(m.map((n) => mod(n, 12)))];

interface MoveQ {
  start: Tri;
  move: string;
  target: Tri;
  got: number[];
  missed: boolean;
  done: boolean;
}
interface Cyc {
  idx: number;
  misses: number;
  got: number[];
  started: number | null;
  finished: number | null;
}
const freshCyc = (): Cyc => ({ idx: 0, misses: 0, got: [], started: null, finished: null });

const heldKey = () => input.heldNotes().join(',');
const parseHeld = (k: string): number[] => (k ? k.split(',').map(Number) : []);

/** How much of the lattice fits: rows of triangles at least ~90 px tall, as many columns as the width allows. */
function layout(w: number, h: number): { win: Win; s: number } {
  const pad = 0.66;
  // a short stage (a phone on its side) keeps three rows big enough to read and tap
  const rows = h < 250 ? 1 : Math.min(4, Math.max(2, Math.floor((h / 92 - 2 * pad) / (2 * RH))));
  let s = h / (2 * rows * RH + 2 * pad);
  const minHalf = 2.5;
  if (w / s < 2 * (minHalf + pad)) s = w / (2 * (minHalf + pad));
  const xHalf = Math.max(minHalf, Math.floor((w / s / 2 - pad) * 2) / 2);
  return { win: { xHalf, rows }, s };
}

function useSize(): [RefObject<HTMLDivElement | null>, { w: number; h: number }] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 720, h: 380 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      if (w > 40 && h > 40) setSize((s) => (Math.abs(s.w - w) < 2 && Math.abs(s.h - h) < 2 ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

export function TonnetzMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('tz.task', 'explore');
  const [tonicPc, setTonicPc] = usePref('tz.key', 0);
  const [scaleId, setScaleId] = usePref('tz.scale', 'major');
  const [names, setNames] = usePref<Names>('tz.names', 'spelled');
  const [drone, setDrone] = usePref<Drone>('tz.drone', 'off');
  const [lastDrone, setLastDrone] = usePref<Exclude<Drone, 'off'>>('tz.droneKind', 'root');
  const [info, setInfo] = usePref('tz.info', false);
  const [ask, setAsk] = usePref<Ask>('tz.ask', 'name');
  const [movesId, setMovesId] = usePref('tz.moves', 'plr');
  const [cycleId, setCycleId] = usePref('tz.cycle', 'PL');
  const [cycleBest, setCycleBest] = usePref<Record<string, number>>('tz.cycleBest', {});

  const tonic = useMemo(() => tonicFor(tonicPc, scaleId), [tonicPc, scaleId]);
  const centreF = fifthsOf(tonic);
  const tonicMidi = tonicMidiOf(tonicPc);
  const inScale = useMemo(() => new Set(scaleSemis(scaleId)), [scaleId]);
  const minorKey = inScale.has(3) && !inScale.has(4);
  const [box, size] = useSize();
  const { win, s } = layout(size.w, size.h);
  const winKey = `${win.xHalf}|${win.rows}`;

  /** A note at a lattice place, named as asked (degrees fall back to spelled). */
  const nodeName = (n: Node): string => noteName(spellFifths(centreF + nodeFifths(n), names === 'degrees' ? 'spelled' : names));
  const triName = (t: Tri): string => triadName(triTriad(t, centreF), names);
  /** A pitch class named in the key, for the keyboard marks. */
  const keyName = (semis: number): string =>
    names === 'degrees' ? degreeLabel(semis, scaleId)
      : names === 'spelled' ? noteName(spellSemis(tonic, semis, scaleId))
        : noteName(spellPc(tonicPc + semis, names === 'sharps' ? 'sharp' : 'flat'));

  // ------------------------------------------------------------ what is played
  const held = parseHeld(useSyncExternalStore((fn) => input.onChange(fn), heldKey));
  const heldPcs = pcsOfMidis(held);
  const [wrong, flash] = useFlash(600);

  // ------------------------------------------------------------ drone
  useEffect(() => audio.drone(drone === 'off' ? [] : droneNotes(tonicPc, drone)), [drone, tonicPc]);
  useEffect(() => () => audio.drone([]), []);
  const toggleDrone = () => {
    void audio.init();
    setDrone(drone === 'off' ? lastDrone : 'off');
  };
  const pickDrone = (d: Drone) => {
    void audio.init();
    if (d !== 'off') setLastDrone(d);
    setDrone(d);
  };

  const homeTri: Tri = minorKey ? { i: 0, j: -1, up: false } : { i: 0, j: 0, up: true };
  /** the last chord's voicing, so moves are heard as one voice moving */
  const voicing = useRef<number[]>([]);
  const sound = (t: Tri, at = 0, dur = 1.4): number[] => {
    const pcs = triPcs(t, tonicPc);
    const v = voicing.current.length ? voiceLead(voicing.current, pcs) : closeVoicing(triTriad(t, centreF).root * 7, !t.up);
    voicing.current = v;
    playEvents(v.map((note) => ({ note, start: at, dur })));
    return v;
  };

  // ------------------------------------------------------------ explore: the trail of triads played
  const [trail, setTrail] = useState<Tri[]>([]);
  useEffect(() => setTrail([]), [tonicPc, winKey, task]);
  const hk = held.join(',');
  useEffect(() => {
    if (task !== 'explore' || heldPcs.length !== 3) return;
    const [t] = triadsIn(heldPcs);
    if (!t) return;
    const last = trail.at(-1);
    if (last && samePcs(triPcs(last, tonicPc), heldPcs)) return;
    const tri = findTri(t.rootPc, t.minor, tonicPc, win, last ? triCentre(last) : undefined);
    if (!tri) return;
    voicing.current = held;
    setTrail([...trail.slice(-4), tri]);
  }, [hk]);
  /** P, L, R… from the last chord (or the tonic's): heard, and added to the trail. */
  const transform = (move: string) => {
    const from = trail.at(-1) ?? homeTri;
    if (!trail.length) voicing.current = closeVoicing(tonicPc, minorKey);
    const moved = applyTri(from, move);
    const next = triIn(moved, win) ? moved : placeNear(moved, win, triCentre(from));
    if (!next) return;
    sound(next);
    setTrail([...(trail.length ? trail : [from]).slice(-4), next]);
  };

  // ------------------------------------------------------------ move
  const movePool = (MOVE_SETS.find((m) => m.id === movesId) ?? MOVE_SETS[0]).moves;
  const tally = useTally(`tz.${ask}`, `Tonnetz · moves by ${ask === 'ear' ? 'ear' : 'name'}`, movePool, (m) => `${m} · ${MOVE_INFO[m]?.name ?? m}`, ladder(MOVE_SETS, movesId, setMovesId));
  const newMove = (prev: MoveQ | null): MoveQ => {
    const move = pickFor(`tz.${ask}`, movePool, prev?.move ?? null);
    const fits = trisIn(win).filter((t) => triIn(applyTri(t, move), win));
    // a long move on a short screen may not fit: then it lands on a copy of its target
    const all = fits.length ? fits : trisIn(win);
    const near = all.filter((t) => {
      const c = triCentre(t);
      return Math.hypot(c.x, c.y) <= 2.4 && !(prev && t.i === prev.start.i && t.j === prev.start.j && t.up === prev.start.up);
    });
    const list = near.length ? near : all;
    const start = list[Math.floor(Math.random() * list.length)] ?? homeTri;
    const moved = applyTri(start, move);
    const target = triIn(moved, win) ? moved : placeNear(moved, win, triCentre(start)) ?? moved;
    return { start, move, target, got: [], missed: false, done: false };
  };
  const [q, setQ] = useState<MoveQ>(() => newMove(null));
  /** the start chord, then where the move lands, one voice moving */
  const hearMove = (mq = q, both = ask === 'ear' || mq.done) => {
    voicing.current = closeVoicing(triTriad(mq.start, centreF).root * 7, !mq.start.up);
    sound(mq.start, 0, both ? 1.1 : 1.6);
    if (both) sound(mq.target, 1.25, 1.6);
  };
  const nextMove = () => {
    const n = newMove(q);
    setQ(n);
    if (ask === 'ear') hearMove(n, true);
  };
  const reveal = () => {
    if (q.done) return;
    if (!q.missed) tally.record(q.move, false);
    const n = { ...q, missed: true, done: true };
    setQ(n);
    hearMove(n, true);
  };
  useEffect(() => {
    if (task !== 'move') return;
    const n = newMove(null);
    setQ(n);
    if (ask === 'ear') hearMove(n, true);
  }, [task, ask, movesId, tonicPc, winKey]);
  useEffect(() => {
    if (task !== 'move' || !q.done) return;
    const t = window.setTimeout(nextMove, q.missed ? 2600 : 1300);
    return () => window.clearTimeout(t);
  }, [q, task]);

  // ------------------------------------------------------------ cycle
  const cycle = CYCLES.find((c) => c.id === cycleId) ?? CYCLES[0];
  const steps = useMemo(() => cycleTris(homeTri, cycle.word, win, tonicPc), [cycle.word, winKey, tonicPc, minorKey]);
  const [cyc, setCyc] = useState<Cyc>(freshCyc);
  const cycDone = cyc.finished !== null;
  useEffect(() => setCyc(freshCyc()), [cycleId, tonicPc, task, winKey, minorKey]);
  const cycSecs = cyc.started !== null && cyc.finished !== null ? (cyc.finished - cyc.started) / 1000 : null;
  const best = cycleBest[cycleId];

  // ------------------------------------------------------------ key moves
  const stepKey = (n: number) => setTonicPc(mod(tonicPc + n * 7, 12));
  useEffect(() => input.placeRoot(tonicMidi), [tonicMidi]);

  useNoteOn((note) => {
    const p = mod(note, 12);
    const now = input.heldNotes().map((n) => mod(n, 12));
    if (task === 'move') {
      if (q.done) return;
      const want = triPcs(q.target, tonicPc);
      if (want.includes(p)) {
        const got = [...new Set([...q.got, p])];
        if (want.every((x) => got.includes(x) || now.includes(x))) {
          if (!q.missed) tally.record(q.move, true);
          setQ({ ...q, got, done: true });
        } else setQ({ ...q, got });
      } else if (!triPcs(q.start, tonicPc).includes(p)) {
        // the start chord's own notes are free to play: hold them, then move
        flash(p);
        if (!q.missed) {
          tally.record(q.move, false);
          setQ({ ...q, missed: true });
        }
      }
    } else if (task === 'cycle') {
      if (cycDone) return;
      const want = triPcs(steps[cyc.idx], tonicPc);
      if (want.includes(p)) {
        const got = [...new Set([...cyc.got, p])];
        if (!want.every((x) => got.includes(x) || now.includes(x))) return setCyc({ ...cyc, got, started: cyc.started ?? performance.now() });
        const t = performance.now();
        const idx = cyc.idx + 1;
        const finished = idx === steps.length ? t : null;
        const next = { ...cyc, idx, got: [], started: cyc.started ?? t, finished };
        setCyc(next);
        if (finished !== null && next.misses === 0) {
          const secs = (finished - next.started) / 1000;
          if (best === undefined || secs < best) setCycleBest({ ...cycleBest, [cycleId]: secs });
        }
      } else if (!(cyc.idx > 0 && triPcs(steps[cyc.idx - 1], tonicPc).includes(p))) {
        flash(p);
        setCyc({ ...cyc, misses: cyc.misses + 1 });
      }
    }
  });

  useHotkeys((e) => {
    if (e.code === 'Escape') return setDrone('off');
    const k = e.code;
    if (k !== 'Space' && k !== 'Enter' && k !== 'Backspace') return;
    e.preventDefault();
    if (task === 'explore') {
      if (k === 'Space') toggleDrone();
      else stepKey(k === 'Enter' ? 1 : -1);
    } else if (task === 'move') {
      if (k === 'Backspace') toggleDrone();
      else if (q.done || k === 'Enter') nextMove();
      else if (ask === 'ear') hearMove();
      else reveal();
    } else {
      if (k === 'Backspace') setCyc(freshCyc());
      else if (k === 'Enter' && cycDone) stepKey(1);
      else if (k === 'Space') toggleDrone();
    }
  });

  // ------------------------------------------------------------ the big keyboard, in the same colours
  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    const mark = (midi: number, tone: KeyMark['tone']) => {
      const semis = mod(midi - tonicPc, 12);
      marks[midi] = { label: keyName(semis), tone, color: degreeColor(semis), ink: degreeInk(semis) };
    };
    const chord = (t: Tri, tone: KeyMark['tone']) => closeVoicing(triTriad(t, centreF).root * 7, !t.up).forEach((m) => mark(m, tone));
    if (task === 'explore') {
      (scaleId === NO_SCALE ? Array.from({ length: 12 }, (_, i) => i) : scaleSemis(scaleId)).forEach((x) => mark(tonicMidi + x, x === 0 ? 'root' : 'scale'));
      mark(tonicMidi + 12, 'root');
    } else if (task === 'move') {
      if (ask === 'name' || q.done) chord(q.start, 'scale');
      if (q.done) chord(q.target, q.missed ? 'target' : 'ok');
    } else if (!cycDone) chord(steps[cyc.idx], cyc.idx === 0 ? 'root' : 'target');
    setMarks(marks);
  }, [task, tonicPc, scaleId, names, q, cyc, steps, ask]);

  // ------------------------------------------------------------ what the lattice shows
  const lastTri = trail.at(-1);
  const prevTri = trail.at(-2);
  const lastMove = lastTri && prevTri ? moveBetween(triTriad(prevTri, centreF), triTriad(lastTri, centreF)) : null;
  const marked = new Map<string, string>();
  let path: Tri[] = [];
  if (task === 'explore') path = trail;
  if (task === 'move') {
    marked.set(triKey(q.start), 'start');
    if (q.done) marked.set(triKey(q.target), q.missed ? 'target' : 'ok');
    if (q.done) path = [q.start, q.target];
  }
  if (task === 'cycle') {
    path = steps.slice(0, Math.min(cyc.idx, steps.length));
    path.forEach((t) => marked.set(triKey(t), 'ok'));
    if (!cycDone) marked.set(triKey(steps[cyc.idx]), 'target');
  }

  // the badge over the lattice: the chord, the question, or the count
  const badge = ((): { big: string; small?: string; tone?: string } | null => {
    if (task === 'move') {
      if (q.done) return { big: `${triName(q.start)} → ${triName(q.target)}`, small: `${q.move} · ${MOVE_INFO[q.move]?.name}`, tone: q.missed ? 'bad' : 'good' };
      if (ask === 'ear') return { big: `${triName(q.start)} → ?`, small: 'play the chord you hear next' };
      return { big: `${triName(q.start)} · ${q.move}`, small: info ? MOVE_INFO[q.move]?.what : 'play where it lands' };
    }
    if (task === 'cycle') {
      if (cycDone) return { big: cycSecs !== null ? `${cycSecs.toFixed(1)} s` : '✓', small: cyc.misses ? `${cyc.misses} miss${cyc.misses > 1 ? 'es' : ''}` : 'no misses', tone: cyc.misses ? undefined : 'good' };
      return { big: triName(steps[cyc.idx]), small: `${cyc.idx + 1} of ${steps.length}${cyc.idx ? ` · ${cycle.word[(cyc.idx - 1) % 2]}` : ''}` };
    }
    if (lastTri && samePcs(triPcs(lastTri, tonicPc), heldPcs)) return { big: triName(lastTri), small: lastMove ? `${lastMove} from ${triName(prevTri!)}` : undefined };
    if (held.length >= 3) {
      const ch = detectChord(held);
      if (ch) return { big: chordSymbol(spellPc(ch.rootPc, names === 'flats' ? 'flat' : names === 'sharps' ? 'sharp' : 'auto'), ch.typeId), small: lastMove ? `${lastMove} from ${triName(prevTri!)}` : undefined };
    }
    if (held.length) return { big: heldPcs.map((p) => (names === 'degrees' ? degreeLabel(p - tonicPc, scaleId) : keyName(mod(p - tonicPc, 12)))).join(' '), small: heldPcs.length === 1 && heldPcs[0] !== undefined && names !== 'degrees' ? enharmonic(heldPcs[0]) : undefined };
    if (lastTri) return { big: triName(lastTri), small: lastMove ? `${lastMove} from ${triName(prevTri!)}` : undefined, tone: 'rest' };
    return null;
  })();
  const badgeAction = task === 'move' ? (q.done ? nextMove : ask === 'ear' ? () => hearMove() : reveal) : task === 'cycle' && cycDone ? () => setCyc(freshCyc()) : undefined;

  const lastDesc = lastTri && prevTri ? describeMove(prevTri, lastTri, centreF, names) : null;

  return (
    <div className="s-mode s-tzmode">
      <Bar tally={task === 'move' ? tally : undefined} help={HELP[task]}>
        <Chips label="Task" value={task} options={TASKS} onChange={setTask} />
        <Pick label="Key" prefix="Key" value={String(tonicPc)} options={KEY_ORDER.map((p) => ({ id: String(p), label: noteName(tonicFor(p, scaleId)) }))} onChange={(v) => setTonicPc(Number(v))} />
        <Pick label="Scale" value={scaleId} groups={SCALE_GROUPS} onChange={setScaleId} />
        <Pick label="Note names" prefix="Names" value={names} options={NAMES} onChange={setNames} />
        {task === 'move' ? <Pick label="Moves" value={movesId} options={MOVES} onChange={setMovesId} /> : null}
        {task === 'move' ? <Pick label="Asked" value={ask} options={ASKS} onChange={setAsk} /> : null}
        {task === 'cycle' ? <Pick label="Cycle" value={cycleId} options={CYCLE_CHOICES} onChange={setCycleId} /> : null}
        <span className="s-cof-drone">
          <span className="k">Drone</span>
          <Chips label="Drone" value={drone} options={DRONES} onChange={pickDrone} />
        </span>
        <button type="button" className={`s-cof-info ${info ? 'on' : ''}`} aria-pressed={info} onClick={(e) => { setInfo(!info); if (e.detail) releaseFocus(e.currentTarget); }} title="Chord names on the triangles, the moves between chords, and the words">
          <span className="dot" aria-hidden="true" /> Info
        </button>
      </Bar>

      <section className="s-stage">
        <div className={`s-tz ${info ? 'info' : ''}`}>
          {info ? (
            <div className="s-cof-side s-tz-side">
              <div className="s-q">
                <h1>{task === 'cycle' ? cycle.label : keyText(tonic, scaleId)}</h1>
                <p className="sub">
                  {task === 'explore'
                    ? 'Right is up a 5th, the diagonals are 3rds. Up-triangles are major, down-triangles minor; neighbours share two notes. Sharps grow up and to the right, flats down and to the left.'
                    : task === 'move'
                      ? (ask === 'ear' ? 'Two chords play, the first one lit: find the second on the keys. Hold what stays, move what changes.' : `${MOVE_INFO[q.move]?.name}: ${MOVE_INFO[q.move]?.what}.`)
                      : `${cycle.about}${best !== undefined ? ` Best clean run: ${best.toFixed(1)} s.` : ''}`}
                </p>
              </div>
              <div className="s-status" aria-live="polite">
                {task === 'explore' ? (
                  <>
                    {lastDesc ? (
                      <span className="s-tz-desc">
                        <b>{triName(prevTri!)} → {triName(lastTri!)}</b>{lastMove ? ` · ${lastMove}` : ''}<br />
                        {lastDesc.stay.length ? `${lastDesc.stay.join(' ')} stay` : 'nothing stays'}{lastDesc.moves.length ? ` · ${lastDesc.moves.join(', ')}` : ''}
                      </span>
                    ) : <span>Play a triad, or move from {lastTri ? triName(lastTri) : triName(homeTri)}:</span>}
                    <span className="s-tz-moves" role="group" aria-label="Moves">
                      {['P', 'L', 'R', 'N', 'S', 'H'].map((m) => (
                        <button key={m} type="button" className={`btn small ${'PLR'.includes(m) ? '' : 'ghost'}`} onClick={() => transform(m)} title={`${MOVE_INFO[m].name}: ${MOVE_INFO[m].what}`}>{m}</button>
                      ))}
                    </span>
                    <button type="button" className="btn ghost small" onClick={() => stepKey(-1)} title="Key down a 5th">↺ {noteName(tonicFor(mod(tonicPc - 7, 12), scaleId))} <K>⌫</K></button>
                    <button type="button" className="btn ghost small" onClick={() => stepKey(1)} title="Key up a 5th">{noteName(tonicFor(mod(tonicPc + 7, 12), scaleId))} ↻ <K>Enter</K></button>
                  </>
                ) : task === 'move' ? (
                  q.done ? (
                    <>
                      <strong className={q.missed ? 'bad' : 'good'}>{q.missed ? '✗ ' : '✓ '}{q.move} takes {triName(q.start)} to {triName(q.target)}</strong>
                      <button type="button" className="btn primary" onClick={nextMove}>Next <K>Space</K></button>
                    </>
                  ) : (
                    <>
                      {wrong.size ? <span className="bad">{[...wrong].map((p) => keyName(mod(p - tonicPc, 12))).join(', ')} is not in it</span> : null}
                      {ask === 'ear' ? <button type="button" className="btn" onClick={() => hearMove()}>Hear it <K>Space</K></button> : <button type="button" className="btn ghost small" onClick={reveal}>Show me <K>Space</K></button>}
                      <button type="button" className="btn ghost small" onClick={nextMove}>Skip <K>Enter</K></button>
                    </>
                  )
                ) : cycDone ? (
                  <>
                    <strong className={cyc.misses ? '' : 'good'}>✓ Round in {cycSecs!.toFixed(1)} s{cyc.misses ? `, ${cyc.misses} miss${cyc.misses > 1 ? 'es' : ''}` : ''}</strong>
                    <button type="button" className="btn primary" onClick={() => stepKey(1)}>Next: {noteName(tonicFor(mod(tonicPc + 7, 12), scaleId))} <K>Enter</K></button>
                    <button type="button" className="btn ghost small" onClick={() => setCyc(freshCyc())}>Again <K>⌫</K></button>
                  </>
                ) : (
                  <>
                    <span className="tnum">{cyc.idx} / {steps.length}{cyc.misses ? ` · ${cyc.misses} miss${cyc.misses > 1 ? 'es' : ''}` : ''}</span>
                    {cyc.idx ? <button type="button" className="btn ghost small" onClick={() => setCyc(freshCyc())}>Restart <K>⌫</K></button> : null}
                  </>
                )}
              </div>
            </div>
          ) : null}

          <div className="s-tz-wrap">
            <div className="s-tz-top">
              {badge ? (
                <button type="button" className={`s-tz-badge ${badge.tone ?? ''} ${badgeAction ? 'tap' : ''}`} onClick={badgeAction} disabled={!badgeAction} tabIndex={badgeAction ? 0 : -1}>
                  <span className="big">{badge.big}</span>
                  {badge.small ? <span className="small">{badge.small}</span> : null}
                </button>
              ) : null}
            </div>
            <div className="s-tz-board" ref={box}>
              <Lattice
                win={win}
                s={s}
                w={size.w}
                h={size.h}
                tonicPc={tonicPc}
                scaleId={scaleId}
                inScale={inScale}
                info={info}
                names={names}
                nodeName={nodeName}
                triName={triName}
                heldPcs={heldPcs}
                wrong={wrong}
                marked={marked}
                path={path}
                trailMain={task === 'explore' && lastTri && samePcs(triPcs(lastTri, tonicPc), heldPcs) ? lastTri : null}
                droneOn={drone !== 'off'}
                tonicMidi={tonicMidi}
                centreF={centreF}
              />
              {info ? (
                <div className="s-tz-legend" aria-hidden="true">
                  <span>→ 5th</span><span>↗ maj 3rd</span><span>↘ min 3rd</span><span>▲ major</span><span>▼ minor</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- the lattice

const f1 = (n: number) => n.toFixed(1);

function Lattice({ win, s, w, h, tonicPc, scaleId, inScale, info, names, nodeName, triName, heldPcs, wrong, marked, path, trailMain, droneOn, tonicMidi, centreF }: {
  win: Win;
  /** a triangle's side, in px */
  s: number;
  w: number;
  h: number;
  tonicPc: number;
  scaleId: string;
  inScale: Set<number>;
  info: boolean;
  names: Names;
  nodeName: (n: Node) => string;
  triName: (t: Tri) => string;
  /** pitch classes sounding now */
  heldPcs: number[];
  wrong: Set<number>;
  /** triangles the drill marks: start, target, ok */
  marked: Map<string, string>;
  /** triads in the order played or walked, joined by a line */
  path: Tri[];
  /** the copy of the held triad the trail is on (other copies light more faintly) */
  trailMain: Tri | null;
  droneOn: boolean;
  tonicMidi: number;
  centreF: number;
}) {
  const nodes = useMemo(() => nodesIn(win), [win.xHalf, win.rows]);
  const tris = useMemo(() => trisIn(win), [win.xHalf, win.rows]);
  const X = (n: Node) => nodeX(n) * s;
  const Y = (n: Node) => -n.j * RH * s;
  const held = new Set(heldPcs);
  const semisOf = (n: Node) => mod(nodePc(n, tonicPc) - tonicPc, 12);
  const isIn = (semis: number) => scaleId === NO_SCALE || inScale.has(semis);
  const colour = (semis: number) => ({ '--c': degreeColor(semis), '--ink': degreeInk(semis) }) as CSSProperties;
  const showTriNames = info && s >= 64;

  // hold what a pointer started, to let it go on release
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
  const ends = { onPointerUp: (e: PointerEvent) => release(e.pointerId), onPointerLeave: (e: PointerEvent) => release(e.pointerId), onPointerCancel: (e: PointerEvent) => release(e.pointerId) };

  /** a triangle drawn a little inside its corners, so neighbours show a seam */
  const triPath = (t: Tri, k = 0.9): string => {
    const c = triCentre(t);
    const cx = c.x * s;
    const cy = -c.y * RH * s;
    return triNodes(t).map((n, i) => `${i ? 'L' : 'M'}${f1(cx + (X(n) - cx) * k)} ${f1(cy + (Y(n) - cy) * k)}`).join('') + 'Z';
  };
  const centreOf = (t: Tri): [number, number] => {
    const c = triCentre(t);
    return [c.x * s, -c.y * RH * s];
  };

  const edges: { a: Node; b: Node; kind: string }[] = [];
  const seen = new Set(nodes.map((n) => `${n.i},${n.j}`));
  for (const n of nodes) {
    for (const [di, dj, kind] of [[1, 0, 'p5'], [0, 1, 'M3'], [1, -1, 'm3']] as const) {
      const b = { i: n.i + di, j: n.j + dj };
      if (seen.has(`${b.i},${b.j}`)) edges.push({ a: n, b, kind });
    }
  }

  const r = s * 0.27;
  const pathPts = path.map(centreOf);

  return (
    <svg viewBox={`${f1(-w / 2)} ${f1(-h / 2)} ${w} ${h}`} width={w} height={h} role="img" aria-label="Tonnetz: notes on a lattice of 5ths and 3rds, triads as triangles" className={`s-tz-svg ${info ? 'info' : ''} ${droneOn ? 'drone' : ''}`}>
      {tris.map((t) => {
        const pcs = triPcs(t, tonicPc);
        const root = triNodes(t)[t.up ? 0 : 1];
        const semis = semisOf(root);
        const lit = pcs.every((p) => held.has(p));
        const main = lit && trailMain !== null && triKey(trailMain) === triKey(t);
        const echo = lit && trailMain !== null && !main;
        const inKey = scaleId !== NO_SCALE && pcs.every((p) => isIn(mod(p - tonicPc, 12)));
        const mark = marked.get(triKey(t)) ?? '';
        const triad = triTriad(t, centreF);
        const voicing = [52 + mod(triad.root * 7 - 4, 12)].flatMap((rt) => [rt, rt + (t.up ? 4 : 3), rt + 7]);
        return (
          <path
            key={triKey(t)}
            d={triPath(t)}
            className={`tri ${t.up ? 'up' : 'down'} ${inKey ? 'in' : ''} ${lit ? 'lit' : ''} ${main ? 'main' : ''} ${echo ? 'echo' : ''} ${mark}`}
            style={colour(semis)}
            onPointerDown={(e) => press(e, voicing)}
            {...ends}
          />
        );
      })}
      {edges.map(({ a, b, kind }) => {
        const on = held.has(nodePc(a, tonicPc)) && held.has(nodePc(b, tonicPc));
        return <line key={`${a.i},${a.j}-${kind}`} x1={f1(X(a))} y1={f1(Y(a))} x2={f1(X(b))} y2={f1(Y(b))} className={`edge ${kind} ${on ? 'on' : ''}`} />;
      })}
      {pathPts.length >= 2 ? (
        <g className="path">
          {pathPts.slice(1).map(([x, y], k) => {
            const [px, py] = pathPts[k];
            const jump = Math.hypot(x - px, y - py) > s * 1.2; // the walk left the screen and came back on a copy
            return <line key={k} x1={f1(px)} y1={f1(py)} x2={f1(x)} y2={f1(y)} className={jump ? 'jump' : ''} />;
          })}
          {pathPts.map(([x, y], k) => <circle key={`d${k}`} cx={f1(x)} cy={f1(y)} r={f1(s * (k === pathPts.length - 1 ? 0.07 : 0.05))} />)}
        </g>
      ) : null}
      {showTriNames ? tris.map((t) => {
        const [x, y] = centreOf(t);
        const pcs = triPcs(t, tonicPc);
        const lit = pcs.every((p) => held.has(p)) || marked.has(triKey(t));
        return <text key={`n${triKey(t)}`} x={f1(x)} y={f1(y + (t.up ? s * 0.04 : -s * 0.04))} className={`t-tri ${lit ? 'lit' : ''}`} style={{ fontSize: s * 0.15 }}>{triName(t)}</text>;
      }) : null}
      {nodes.map((n) => {
        const semis = semisOf(n);
        const p = nodePc(n, tonicPc);
        const lit = held.has(p);
        const bad = wrong.has(p);
        const label = names === 'degrees' ? degreeLabel(semis, scaleId) : nodeName(n);
        return (
          <g key={`${n.i},${n.j}`} className={`node ${isIn(semis) ? 'in' : 'out'} ${semis === 0 ? 'tonic' : ''} ${lit ? 'lit' : ''} ${bad ? 'wrong' : ''}`} style={colour(semis)} onPointerDown={(e) => press(e, [tonicMidi + semis])} {...ends}>
            <circle cx={f1(X(n))} cy={f1(Y(n))} r={f1(r)} />
            <text x={f1(X(n))} y={f1(Y(n))} style={{ fontSize: s * (label.length > 2 ? 0.17 : 0.21) }}>{label}</text>
          </g>
        );
      })}
    </svg>
  );
}
