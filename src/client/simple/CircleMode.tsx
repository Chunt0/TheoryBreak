// The circle of fifths, seen from a key. Out of the box it is only the degrees,
// each its own colour round the rainbow (tonic red, 5 orange, 2 yellow…), and
// whatever you play lights its degree. Info adds note names, the chord on each
// degree, chord shapes and the words. A drone holds the tonic for the ear.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type RefObject } from 'react';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { chordSymbol, detectChord, getChord } from '../theory/chords';
import { getInterval, mod, noteName, type Note } from '../theory/core';
import type { KeyMark } from '../ui/Keyboard';
import { Bar, Chips, K, Pick, playEvents, releaseFocus, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';
import type { Help } from './Lessons';
import { pickFor, useTally } from './stats';
import {
  CIRCLE_SCALES, degreeLabel, diatonicOnDegrees, droneNotes, intervalWords, keyText, NO_SCALE, numeralOf,
  scaleSemis, shapeText, slotOf, spellPcIn, spellSemis, tonicFor, walkSemis,
} from './circleLogic';

type Task = 'explore' | 'find' | 'walk';
type Drone = 'off' | 'root' | 'fifth';
type View = 'tonic' | 'c';
type Chords = 'triads' | 'sevenths' | 'none';
type Ask = 'name' | 'ear';
type Dir = 'fourths' | 'fifths';

const TASKS: Choice<Task>[] = [
  { id: 'explore', label: 'Explore', title: 'Play anything: the circle lights up' },
  { id: 'find', label: 'Find', title: 'Find degrees: one is named (or played), you play it' },
  { id: 'walk', label: 'Walk', title: 'Walk the circle: every root in 4ths or 5ths, then home' },
];
const DRONES: Choice<Drone>[] = [
  { id: 'off', label: 'Off', title: 'No drone' },
  { id: 'root', label: '1', title: 'Drone on the tonic' },
  { id: 'fifth', label: '1 + 5', title: 'Drone on the tonic and its 5th' },
];
const VIEWS: Choice<View>[] = [{ id: 'tonic', label: 'Tonic on top' }, { id: 'c', label: 'C on top' }];
const CHORDS: Choice<Chords>[] = [{ id: 'triads', label: 'Triads' }, { id: 'sevenths', label: '7th chords' }, { id: 'none', label: 'No chords' }];
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

/**
 * Each degree's colour, round the rainbow in circle order from a red tonic: the
 * major scale is the warm half, the flats the cool. Lightness is set by eye per
 * hue (yellow has to be light to look yellow at all); `ink` reads on top of it.
 */
const RAINBOW: { c: string; ink: string }[] = [
  ['0.66 0.20 27', 0], // 1  red
  ['0.75 0.17 55', 0], // 5  orange
  ['0.87 0.17 95', 0], // 2  yellow
  ['0.84 0.19 128', 0], // 6  lime
  ['0.75 0.18 150', 0], // 3  green
  ['0.76 0.13 185', 0], // 7  teal
  ['0.74 0.13 225', 0], // ♯4 sky
  ['0.62 0.18 262', 1], // ♭2 blue
  ['0.56 0.21 287', 1], // ♭6 indigo
  ['0.63 0.22 315', 1], // ♭3 violet
  ['0.66 0.23 345', 1], // ♭7 magenta
  ['0.76 0.15 10', 0], // 4  rose
].map(([c, light]) => ({ c: `oklch(${c})`, ink: light ? '#fff' : '#141414' }));
export const degreeColor = (semis: number): string => RAINBOW[slotOf(semis)].c;
export const degreeInk = (semis: number): string => RAINBOW[slotOf(semis)].ink;

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
  const [info, setInfo] = usePref('cof.info', false);
  const [view, setView] = usePref<View>('cof.view', 'tonic');
  const [chordRing, setChordRing] = usePref<Chords>('cof.chords', 'triads');
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
  /** the last notes played together: they stay shown after the keys let go */
  const [shown, setShown] = useState<number[]>([]);
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
  // answered questions move on by themselves (a miss stays up a little longer)
  useEffect(() => {
    if (task !== 'find' || !q.done) return;
    const t = window.setTimeout(nextFind, q.missed ? 2200 : 1100);
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
  const walkOn = () => stepKey(dir === 'fourths' ? -1 : 1);

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
      else if (k === 'Enter' && walkDone) walkOn();
      else if (k === 'Space') toggleDrone();
    }
  });

  // ------------------------------------------------------------ the big keyboard: the same colours, degrees unless Info is on
  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    const mark = (semis: number, tone: KeyMark['tone']) => {
      marks[tonicMidi + semis] = { label: info ? noteName(spell(semis)) : degreeLabel(semis, scaleId), tone, color: degreeColor(semis), ink: degreeInk(semis) };
    };
    if (task === 'explore') {
      pool.forEach((s) => mark(s, s === 0 ? 'root' : 'scale'));
      mark(12, 'root');
    } else if (task === 'find') {
      mark(0, 'root');
      if (q.done) mark(q.semis, q.missed ? 'target' : 'ok');
    } else if (!walkDone) {
      mark(walkSeq[walk.idx], walk.idx === 0 ? 'root' : 'target');
    }
    setMarks(marks);
  }, [task, tonicPc, scaleId, q, walk, walkSeq, info]);

  // ------------------------------------------------------------ what the centre shows
  const lit = new Set(held.map((n) => mod(n - tonicPc, 12)));
  const resting = held.length === 0;
  /** degrees of the last notes played, lowest first */
  const shownDegs = [...new Set([...shown].sort((a, b) => a - b).map((n) => mod(n - tonicPc, 12)))];
  const centre = ((): Centre => {
    if (task === 'find') {
      if (q.done) return info ? { big: noteName(spell(q.semis)), small: `${degreeLabel(q.semis, scaleId)} of ${noteName(tonic)}`, tone: q.missed ? 'bad' : 'good' } : { degs: [q.semis], tone: q.missed ? 'bad' : 'good' };
      if (ask === 'ear') return info ? { big: '?', small: 'play what you hear' } : { big: '?' };
      return info ? { big: degreeLabel(q.semis, scaleId), small: `${intervalWords(q.semis, scaleId)} up` } : { big: degreeLabel(q.semis, scaleId) };
    }
    if (task === 'walk') {
      if (walkDone) return { big: walkSecs !== null ? `${walkSecs.toFixed(1)} s` : '✓', small: info ? (walk.misses ? `${walk.misses} miss${walk.misses > 1 ? 'es' : ''}` : 'no misses') : undefined, tone: walk.misses ? undefined : 'good' };
      return info ? { big: noteName(spell(walkSeq[walk.idx])), small: `${walk.idx + 1} of ${walkSeq.length}` } : { degs: [walkSeq[walk.idx]] };
    }
    return info ? readout(shown, tonic, tonicPc, scaleId) : { degs: shownDegs, rest: resting };
  })();
  /** tapping the centre: hear the question again, show the answer, or go on */
  const hubAction = task === 'find' ? (q.done ? nextFind : ask === 'ear' ? () => hear() : reveal) : task === 'walk' && walkDone ? () => setWalk(freshWalk()) : undefined;

  const marksOn = new Map<number, string>();
  if (task === 'find' && q.done) marksOn.set(q.semis, q.missed ? 'target' : 'ok');
  if (task === 'walk') walkSeq.slice(0, walk.idx).forEach((s) => marksOn.set(s, 'ok'));
  if (task === 'walk' && !walkDone) marksOn.set(walkSeq[walk.idx], 'target');
  for (const w of wrong) marksOn.set(w, 'wrong');

  const nextKeyName = (steps: number) => noteName(tonicFor(mod(tonicPc + steps * 7, 12), scaleId));

  return (
    <div className="s-mode s-cofmode">
      <Bar tally={task === 'find' ? tally : undefined} help={HELP[task]}>
        <Chips label="Task" value={task} options={TASKS} onChange={setTask} />
        <Pick label="Key" prefix="Key" value={String(tonicPc)} options={KEY_ORDER.map((p) => ({ id: String(p), label: noteName(tonicFor(p, scaleId)) }))} onChange={(v) => setTonicPc(Number(v))} />
        <Pick label="Scale" value={scaleId} groups={SCALE_GROUPS} onChange={setScaleId} />
        {task === 'find' ? <Pick label="Asked" value={ask} options={ASKS} onChange={setAsk} /> : null}
        {task === 'walk' ? <Pick label="Direction" value={dir} options={DIRS} onChange={setDir} /> : null}
        <span className="s-cof-drone">
          <span className="k">Drone</span>
          <Chips label="Drone" value={drone} options={DRONES} onChange={pickDrone} />
        </span>
        {info ? <Pick label="View" value={view} options={VIEWS} onChange={setView} /> : null}
        {info ? <Pick label="Chord ring" value={chordRing === 'triads' || chordRing === 'sevenths' ? chordRing : 'none'} options={CHORDS} onChange={setChordRing} /> : null}
        <button type="button" className={`s-cof-info ${info ? 'on' : ''}`} aria-pressed={info} onClick={(e) => { setInfo(!info); if (e.detail) releaseFocus(e.currentTarget); }} title="Note names, the chord on each degree, chord shapes and notes on the circle">
          <span className="dot" aria-hidden="true" /> Info
        </button>
      </Bar>

      <section className="s-stage">
        <div className={`s-cof ${info ? 'info' : ''}`}>
          {info ? (
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
                    </>
                  )
                ) : walkDone ? (
                  <>
                    <strong className={walk.misses ? '' : 'good'}>✓ Round in {walkSecs!.toFixed(1)} s{walk.misses ? `, ${walk.misses} miss${walk.misses > 1 ? 'es' : ''}` : ''}</strong>
                    <button type="button" className="btn primary" onClick={walkOn}>Next: {nextKeyName(dir === 'fourths' ? -1 : 1)} <K>Enter</K></button>
                    <button type="button" className="btn ghost small" onClick={() => setWalk(freshWalk())}>Again <K>⌫</K></button>
                  </>
                ) : (
                  <>
                    <span className="tnum">{walk.idx} / {walkSeq.length}{walk.misses ? ` · ${walk.misses} miss${walk.misses > 1 ? 'es' : ''}` : ''}</span>
                    {walk.idx ? <button type="button" className="btn ghost small" onClick={() => setWalk(freshWalk())}>Restart <K>⌫</K></button> : null}
                  </>
                )}
              </div>
            </div>
          ) : null}

          <Wheel
            tonicPc={tonicPc}
            tonic={tonic}
            scaleId={scaleId}
            inScale={inScale}
            info={info}
            view={info ? view : 'tonic'}
            chordRing={chordRing}
            droneOn={drone !== 'off'}
            lit={lit}
            marks={marksOn}
            shape={info && task === 'explore' ? shownDegs : []}
            shapeResting={resting}
            centre={centre}
            onHub={hubAction}
            tonicMidi={tonicMidi}
          />
        </div>
      </section>
    </div>
  );
}

interface Centre {
  /** words (Info), or a short mark like "?" */
  big?: string;
  small?: string;
  more?: string;
  /** degrees to show, each in its colour */
  degs?: number[];
  /** nothing held any more: shown dimmer */
  rest?: boolean;
  tone?: string;
}

/** What the centre shows with Info on: a chord and its numeral, an interval, or a note and its degree. */
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

function Wheel({ tonicPc, tonic, scaleId, inScale, info, view, chordRing, droneOn, lit, marks, shape, shapeResting, centre, onHub, tonicMidi }: {
  tonicPc: number;
  tonic: Note;
  scaleId: string;
  inScale: Set<number>;
  /** note names and chords as well as degrees */
  info: boolean;
  view: View;
  chordRing: Chords;
  /** the tonic's slot breathes while the drone holds it */
  droneOn: boolean;
  /** degrees sounding now */
  lit: Set<number>;
  /** degrees marked by the drill: ok, wrong, target */
  marks: Map<number, string>;
  /** degrees of the last notes played together, joined up */
  shape: number[];
  shapeResting: boolean;
  centre: Centre;
  onHub?: () => void;
  tonicMidi: number;
}) {
  const [box, width] = useWidth();
  const compact = width < 330;
  const showChords = info && (chordRing === 'triads' || chordRing === 'sevenths') && !compact;
  const chords = useMemo(() => new Map(diatonicOnDegrees(scaleId, chordRing === 'sevenths').map((c) => [c.semis, c])), [scaleId, chordRing]);
  // rings, outside in: note names (Info), degrees, chords (Info), then the centre
  const R0 = 198;
  const R1 = info ? (compact ? 138 : 150) : R0;
  const R2 = !info ? 96 : showChords ? 106 : compact ? 84 : 98;
  const R3 = showChords ? 64 : R2;
  const hubR = R3 - 4;
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
  const ends = { onPointerUp: (e: PointerEvent) => release(e.pointerId), onPointerLeave: (e: PointerEvent) => release(e.pointerId), onPointerCancel: (e: PointerEvent) => release(e.pointerId) };
  const chordNotes = (semis: number, typeId: string) => {
    const root = 48 + mod(tonicPc + semis, 12);
    return getChord(typeId).intervals.map((i) => root + getInterval(i).semis);
  };

  const order = Array.from({ length: 12 }, (_, i) => mod(i * 7, 12)); // degrees round from the tonic
  const pts = [...shape].sort((a, b) => mod(angleOf(a) + 90, 360) - mod(angleOf(b) + 90, 360)).map((s) => xy(R1 - 3, angleOf(s)));
  const slotClass = (semis: number) =>
    `${scaleId === NO_SCALE || inScale.has(semis) ? 'in' : 'out'} ${semis === 0 ? 'tonic' : ''} ${lit.has(semis) ? 'lit' : ''} ${marks.get(semis) ?? ''}`;
  const colour = (semis: number) => ({ '--c': degreeColor(semis), '--ink': degreeInk(semis) }) as CSSProperties;
  // the centre's degrees: rows of up to four, smaller as more of them sound together
  const degs = centre.degs ?? [];
  const rows = Array.from({ length: Math.ceil(degs.length / 4) }, (_, i) => degs.slice(i * 4, i * 4 + 4));
  const across = Math.min(degs.length, 4);
  const degSize = Math.min([0, 64, 50, 40, 32][across], 150 / (rows.length * 1.1)) * (hubR / 92) * (compact ? 1.15 : 1);
  const bigLong = (centre.big ?? '').length > 6 ? 'long' : '';

  return (
    <div className="s-cof-wheel" ref={box}>
      <svg viewBox="-200 -200 400 400" role="img" aria-label={`Scale degrees on the circle of fifths, ${noteName(tonic)} on top`} className={`${compact ? 'compact' : ''} ${info ? 'info' : 'solo'} ${droneOn ? 'drone' : ''}`}>
        {order.map((semis) => {
          const a = angleOf(semis);
          const chord = chords.get(semis);
          return (
            <g key={semis} className={`slot ${slotClass(semis)}`} style={colour(semis)}>
              <g onPointerDown={(e) => press(e, [tonicMidi + semis])} {...ends}>
                {info ? <path className="c-note" d={cell(a, R1, R0)} /> : null}
                <path className="c-deg" d={cell(a, R2, R1)} />
              </g>
              {showChords ? <path className={`c-chord ${chord ? 'has' : ''}`} d={cell(a, R3, R2)} onPointerDown={chord ? (e) => press(e, chordNotes(semis, chord.typeId)) : undefined} {...ends} /> : null}
            </g>
          );
        })}
        {pts.length >= 2 ? <polygon className={`shape ${shapeResting ? 'rest' : ''}`} points={pts.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' ')} /> : null}
        {order.map((semis) => {
          const a = angleOf(semis);
          const chord = chords.get(semis);
          const [nx, ny] = xy((R0 + R1) / 2, a);
          const [dx, dy] = xy((R1 + R2) / 2, a);
          const [cx, cy] = xy((R2 + R3) / 2, a);
          return (
            <g key={semis} className={`labels ${slotClass(semis)}`} style={colour(semis)}>
              {info ? <text x={f2(nx)} y={f2(ny)} className="t-note">{noteName(spellSemis(tonic, semis, scaleId))}</text> : null}
              <text x={f2(dx)} y={f2(dy)} className="t-deg">{degreeLabel(semis, scaleId)}</text>
              {showChords && chord ? <ChordLabel x={cx} y={cy} numeral={chord.numeral} /> : null}
            </g>
          );
        })}
        <circle r={hubR} className={`hub ${centre.tone ?? ''} ${onHub ? 'tap' : ''}`} onClick={onHub} />
        {degs.length ? (
          <g className={`t-degs ${centre.rest ? 'rest' : ''}`} style={{ fontSize: degSize }}>
            {rows.map((row, r) => (
              <text key={r} y={f2((r - (rows.length - 1) / 2) * degSize * 1.1)}>
                {row.map((d, i) => (
                  <tspan key={d} style={colour(d)} dx={i ? degSize * 0.22 : 0}>{degreeLabel(d, scaleId)}</tspan>
                ))}
              </text>
            ))}
          </g>
        ) : centre.big !== undefined ? (
          <>
            <text y={centre.more ? (compact ? -20 : -14) : centre.small ? -6 : 0} className={`t-big ${bigLong} ${centre.tone ?? ''}`}>{centre.big}</text>
            {centre.small ? <text y={centre.more ? 14 : compact ? 26 : 22} className="t-small">{centre.small}</text> : null}
            {centre.more ? <text y={compact ? 38 : 32} className="t-more">{centre.more}</text> : null}
          </>
        ) : null}
      </svg>
    </div>
  );
}
