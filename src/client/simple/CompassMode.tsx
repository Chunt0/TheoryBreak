// The modal compass: the seven modes of major in a ring from bright to dark,
// after Milton Mermikides' Modal Compass. Each dial is a clock of the twelve
// notes with the root on top, the mode's notes in the Circle tab's degree
// colours. Neighbours differ by one note, and going darker lowers it a half step:
// ♯4, 7, 3, 6, 2, 5, then the root itself, landing on Lydian a half step down,
// so the compass can spin for ever. Mirror pairs are each other upside down.
// Step asks which note a move changes; Hear plays a mode to find on the dial.

import { useEffect, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from 'react';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { mod, noteName } from '../theory/core';
import {
  AXIS, change, COMPASS, describeStep, DARKER_DEGREE, mirror, modeDegree, modeSemis, modesHolding, modeTonic, parentOf, posName,
  posPcs, spellIn, step, tritone, walk, type Hold, type Pos,
} from '../theory/compass';
import type { KeyMark } from '../ui/Keyboard';
import { Bar, Chips, K, Pick, playEvents, releaseFocus, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';
import { degreeColor, degreeInk } from './CircleMode';
import { droneNotes } from './circleLogic';
import type { Help } from './Lessons';
import { ladder, pickFor, useTally } from './stats';
import { useSize } from './TonnetzMode';

type Task = 'explore' | 'step' | 'hear';
type Drone = 'off' | 'root' | 'fifth';
type Names = 'degrees' | 'notes';

const TASKS: Choice<Task>[] = [
  { id: 'explore', label: 'Explore', title: 'Turn the compass: each step brighter or darker changes one note' },
  { id: 'step', label: 'Step', title: 'A mode and a move round the compass: play the note that changes' },
  { id: 'hear', label: 'Hear', title: 'A mode plays over its root: find it on the compass' },
];
const DRONES: Choice<Drone>[] = [
  { id: 'off', label: 'Off', title: 'No drone' },
  { id: 'root', label: '1', title: 'Drone on the root' },
  { id: 'fifth', label: '1 + 5', title: 'Drone on the root and its 5th' },
];
const HOLDS: Choice<Hold>[] = [
  { id: 'spin', label: 'Spin', title: 'One note changes every step; past Locrian the root falls a half step and Lydian starts again' },
  { id: 'root', label: 'Same root', title: 'Parallel modes: the root stays put (Locrian to Lydian changes five notes)' },
  { id: 'notes', label: 'Same notes', title: 'Relative modes: the parent scale stays, the root moves in 5ths' },
];
const NAMES: Choice<Names>[] = [
  { id: 'degrees', label: 'Degrees', title: 'Scale degrees from the root' },
  { id: 'notes', label: 'Notes', title: 'Note names, spelled in the mode' },
];
const STEPS = [
  { id: '1', label: 'One step' },
  { id: '2', label: 'Up to 2 steps' },
  { id: '3', label: 'Up to 3 steps' },
] as const;
type Steps = (typeof STEPS)[number]['id'];
const POOLS = [
  { id: 'bright', label: 'Major side', ks: [0, 1, 2] },
  { id: 'dark', label: 'Minor side', ks: [3, 4, 5, 6] },
  { id: 'all', label: 'All seven', ks: [0, 1, 2, 3, 4, 5, 6] },
] as const;
type PoolId = (typeof POOLS)[number]['id'];
const KEY_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const TOPICS = ['core.compass', 'core.modes', 'core.chordscale'];
const HELP: Record<Task, Help> = {
  explore: {
    topics: TOPICS,
    method: [
      'Brightest is Lydian, darkest Locrian. Each step darker lowers one note a half step: ♯4, then 7, 3, 6, 2, 5. The last step lowers the root, and you are in Lydian a half step down.',
      'Dorian sits on top, the axis of the mirror. Modes facing each other across it are inversions: Ionian and Phrygian, Mixolydian and Aeolian, Lydian and Locrian.',
      'With Info on, a dashed red line on each dial joins its tritone. Every mode has exactly one, and where it sits gives the mode its colour.',
      'Same notes holds the parent scale: the roots go F C G D A E B round the compass, up in 5ths as it gets darker.',
    ],
  },
  step: {
    topics: ['core.compass', 'core.modes'],
    method: [
      'Learn the chain darker from Lydian: ♯4, 7, 3, 6, 2, 5, root. Brighter runs it backwards, raising the same notes.',
      'Find the start mode on the compass, count the steps, and play each note that changes in its new place.',
      'Past Locrian (darker) the root drops a half step; past Lydian (brighter) it rises one.',
    ],
  },
  hear: {
    topics: ['core.compass', 'core.modes'],
    method: [
      'First the 3rd: major puts you on the bright side (Lydian, Ionian, Mixolydian), minor on the dark.',
      'Then the one note that sets it apart: ♯4 is Lydian, ♭7 with a major 3rd is Mixolydian, a bright 6 over a minor 3rd is Dorian, ♭2 is Phrygian, ♭5 is Locrian.',
      'A wrong guess one dial away is one note off. Listen for that note next time.',
    ],
  },
};

/** The register the scales play in: root from G3 up to F♯4. */
const rootMidiOf = (p: number): number => 55 + mod(p - 7, 12);
/** Each mode's tint, from warm gold (Lydian) to deep violet (Locrian). */
const modeColor = (k: number): string => `oklch(${(0.84 - k * 0.045).toFixed(3)} ${(0.13 + k * 0.008).toFixed(3)} ${85 + k * 35})`;
/** Dorian on top; darker runs clockwise. */
const angleOf = (k: number): number => -Math.PI / 2 + ((k - AXIS) * 2 * Math.PI) / 7;

const heldKey = () => input.heldNotes().join(',');
const parseHeld = (k: string): number[] => (k ? k.split(',').map(Number) : []);
const scaleLine = (p: Pos, at = 0, step0 = 0.17): { note: number; start: number; dur: number }[] => {
  const base = rootMidiOf(p.root);
  const up = [...modeSemis(p.k), 12].map((s) => base + s);
  return up.map((note, i) => ({ note, start: at + i * step0, dur: step0 * 1.6 }));
};

interface StepQ {
  from: Pos;
  n: number;
  to: Pos;
  item: string;
  got: number[];
  missed: boolean;
  done: boolean;
}
interface HearQ {
  k: number;
  picked: number | null;
  done: boolean;
}

const stepItem = (k: number, n: number) => `${COMPASS[k].name} ${n > 0 ? '+' : '−'}${Math.abs(n)}`;
const stepLabel = (item: string) => {
  const [name, d] = item.split(' ');
  const n = Number(d.slice(1));
  return `${name}, ${n} ${n === 1 ? 'step' : 'steps'} ${d[0] === '+' ? 'darker' : 'brighter'}`;
};

export function CompassMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('mc.task', 'explore');
  const [root, setRoot] = usePref('mc.key', 0);
  const [k, setK] = usePref('mc.mode', 1);
  const [hold, setHold] = usePref<Hold>('mc.hold', 'spin');
  const [names, setNames] = usePref<Names>('mc.names', 'degrees');
  const [drone, setDrone] = usePref<Drone>('mc.drone', 'off');
  const [lastDrone, setLastDrone] = usePref<Exclude<Drone, 'off'>>('mc.droneKind', 'root');
  const [info, setInfo] = usePref('mc.info', false);
  const [steps, setSteps] = usePref<Steps>('mc.steps', '1');
  const [poolId, setPoolId] = usePref<PoolId>('mc.pool', 'bright');

  const pos: Pos = { root: mod(root, 12), k: mod(k, 7) };
  const go = (p: Pos) => {
    setRoot(p.root);
    setK(p.k);
  };
  const [box, size] = useSize();

  const held = parseHeld(useSyncExternalStore((fn) => input.onChange(fn), heldKey));
  const heldPcs = [...new Set(held.map((n) => mod(n, 12)))];
  const [wrong, flash] = useFlash(600);

  // ------------------------------------------------------------ drone
  useEffect(() => audio.drone(drone === 'off' ? [] : droneNotes(root, drone)), [drone, root]);
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
  useEffect(() => input.placeRoot(rootMidiOf(root)), [root]);

  // ------------------------------------------------------------ explore
  const [last, setLast] = useState<{ from: Pos; to: Pos } | null>(null);
  useEffect(() => setLast(null), [task]);
  /** the note that moves, old then new, so the ear hears the one change */
  const hearChange = (a: Pos, b: Pos) => {
    const { gone, came } = change(a, b);
    if (gone.length !== 1) return playEvents(scaleLine(b));
    const g = rootMidiOf(a.root) + mod(gone[0] - a.root, 12);
    const c = g + (mod(came[0] - gone[0], 12) === 1 ? 1 : -1);
    playEvents([{ note: g, start: 0, dur: 0.5 }, { note: c, start: 0.55, dur: 0.9 }]);
  };
  const turn = (dir: 1 | -1) => {
    const next = step(pos, dir, hold);
    setLast({ from: pos, to: next });
    go(next);
    hearChange(pos, next);
  };
  const pickMode = (j: number) => {
    const next: Pos = hold === 'notes' ? { root: mod(parentOf(pos) + COMPASS[j].offset, 12), k: j } : { root: pos.root, k: j };
    setLast(j === pos.k && next.root === pos.root ? null : { from: pos, to: next });
    go(next);
    playEvents(scaleLine(next));
  };

  // ------------------------------------------------------------ step
  const maxSteps = Number(steps);
  const stepPool = COMPASS.flatMap((_, j) => [1, -1].flatMap((d) => Array.from({ length: maxSteps }, (_, s) => stepItem(j, d * (s + 1)))));
  const stepTally = useTally('mc.step', 'Compass · steps', stepPool, stepLabel, ladder(STEPS, steps, setSteps));
  const newStep = (prev: StepQ | null): StepQ => {
    const item = pickFor('mc.step', stepPool, prev?.item ?? null);
    const [name, d] = item.split(' ');
    const j = COMPASS.findIndex((m) => m.name === name);
    const n = (d[0] === '+' ? 1 : -1) * Number(d.slice(1));
    const from: Pos = { root: mod(root, 12), k: j };
    return { from, n, to: walk(from, n, 'spin'), item, got: [], missed: false, done: false };
  };
  const [sq, setSq] = useState<StepQ>(() => newStep(null));
  const stepWant = change(sq.from, sq.to).came;
  const hearStep = (q = sq) => playEvents([...scaleLine(q.from), ...(q.done ? scaleLine(q.to, 1.75) : [])]);
  const nextStep = () => setSq(newStep(sq));
  const revealStep = () => {
    if (sq.done) return;
    if (!sq.missed) stepTally.record(sq.item, false);
    const n = { ...sq, missed: true, done: true };
    setSq(n);
    hearStep(n);
  };
  useEffect(() => {
    if (task === 'step') setSq(newStep(null));
  }, [task, steps, root]);
  useEffect(() => {
    if (task !== 'step' || !sq.done) return;
    const t = window.setTimeout(nextStep, sq.missed ? 3200 : 1800);
    return () => window.clearTimeout(t);
  }, [sq, task]);

  // ------------------------------------------------------------ hear
  const pool = (POOLS.find((p) => p.id === poolId) ?? POOLS[0]).ks.map((j) => COMPASS[j].name);
  const hearTally = useTally('mc.hear', 'Compass · modes by ear', pool, (s) => s, ladder(POOLS, poolId, setPoolId));
  const newHear = (prev: HearQ | null): HearQ => {
    const name = pickFor('mc.hear', pool, prev ? COMPASS[prev.k].name : null);
    return { k: COMPASS.findIndex((m) => m.name === name), picked: null, done: false };
  };
  const [hq, setHq] = useState<HearQ>(() => newHear(null));
  const hearPos: Pos = { root: mod(root, 12), k: hq.k };
  const playHear = (q = hq) => {
    const p = { root: mod(root, 12), k: q.k };
    const up = scaleLine(p, 0, 0.24);
    const down = [...up].reverse().slice(1).map((e, i) => ({ ...e, start: up.length * 0.24 + i * 0.24 }));
    playEvents([...up, ...down]);
  };
  const nextHear = () => {
    const n = newHear(hq);
    setHq(n);
    playHear(n);
  };
  const answer = (j: number) => {
    if (hq.done) return;
    const ok = j === hq.k;
    hearTally.record(COMPASS[hq.k].name, ok);
    setHq({ ...hq, picked: j, done: true });
    if (!ok) playEvents([...scaleLine({ root: mod(root, 12), k: j }), ...scaleLine(hearPos, 1.75)]);
  };
  useEffect(() => {
    if (task !== 'hear') return;
    const n = newHear(null);
    setHq(n);
  }, [task, poolId, root]);
  useEffect(() => {
    if (task !== 'hear' || !hq.done) return;
    const t = window.setTimeout(nextHear, hq.picked === hq.k ? 1600 : 4200);
    return () => window.clearTimeout(t);
  }, [hq, task]);

  // ------------------------------------------------------------ notes played
  useNoteOn((note) => {
    const p = mod(note, 12);
    if (task !== 'step' || sq.done) return;
    if (stepWant.includes(p)) {
      const got = [...new Set([...sq.got, p])];
      if (stepWant.every((x) => got.includes(x))) {
        if (!sq.missed) stepTally.record(sq.item, true);
        const n = { ...sq, got, done: true };
        setSq(n);
        hearStep(n);
      } else setSq({ ...sq, got });
    } else if (!posPcs(sq.to).includes(p)) {
      flash(p);
      if (!sq.missed) {
        stepTally.record(sq.item, false);
        setSq({ ...sq, missed: true });
      }
    }
  });

  useHotkeys((e) => {
    if (e.code === 'Escape') return setDrone('off');
    const c = e.code;
    if (c !== 'Space' && c !== 'Enter' && c !== 'Backspace') return;
    e.preventDefault();
    if (task === 'explore') {
      if (c === 'Space') toggleDrone();
      else turn(c === 'Enter' ? 1 : -1);
    } else if (task === 'step') {
      if (c === 'Backspace') toggleDrone();
      else if (sq.done || c === 'Enter') nextStep();
      else revealStep();
    } else {
      if (c === 'Backspace') toggleDrone();
      else if (hq.done || c === 'Enter') nextHear();
      else playHear();
    }
  });

  // ------------------------------------------------------------ the big keyboard
  const shown: Pos = task === 'step' ? sq.from : task === 'hear' ? hearPos : pos;
  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    const mark = (p: Pos, semis: number, tone: KeyMark['tone']) => {
      const label = names === 'degrees' ? modeDegree(p.k, semis) ?? '' : spellIn(p, p.root + semis);
      marks[rootMidiOf(p.root) + semis] = { label, tone, color: degreeColor(semis), ink: degreeInk(semis) };
    };
    if (task === 'explore') {
      modeSemis(pos.k).forEach((s) => mark(pos, s, s === 0 ? 'root' : 'scale'));
      mark(pos, 12, 'root');
    } else if (task === 'step') {
      modeSemis(sq.from.k).forEach((s) => mark(sq.from, s, s === 0 ? 'root' : 'scale'));
      if (sq.done) stepWant.forEach((p) => {
        marks[rootMidiOf(sq.from.root) + mod(p - sq.from.root, 12)] = { label: spellIn(sq.to, p), tone: sq.missed ? 'target' : 'ok' };
      });
    } else {
      mark(hearPos, 0, 'root');
      if (hq.done) modeSemis(hq.k).forEach((s) => s && mark(hearPos, s, 'scale'));
    }
    setMarks(marks);
  }, [task, root, k, names, sq, hq]);

  // ------------------------------------------------------------ the badge
  /** each dial's root: they differ when the parent scale's notes are held */
  const dialRoot = (j: number): number => {
    if (task === 'explore') return hold === 'notes' ? mod(parentOf(pos) + COMPASS[j].offset, 12) : pos.root;
    if (task === 'step') return sq.done && j === sq.to.k ? sq.to.root : sq.from.root;
    return root;
  };
  const fits = task === 'explore' && heldPcs.length
    ? (hold === 'notes' ? COMPASS.map((_, j) => j).filter((j) => heldPcs.every((p) => posPcs({ root: dialRoot(j), k: j }).includes(p))) : modesHolding(pos.root, heldPcs))
    : null;
  const badge = ((): { big: string; small?: string; tone?: string } | null => {
    if (task === 'step') {
      if (sq.done) return { big: `${posName(sq.from)} → ${posName(sq.to)}`, small: stepWant.map((p) => spellIn(sq.to, p)).join(' ') + (sq.missed ? ' · missed' : ''), tone: sq.missed ? 'bad' : 'good' };
      const n = Math.abs(sq.n);
      return { big: `${posName(sq.from)} · ${n} ${sq.n > 0 ? 'darker' : 'brighter'}`, small: `play the ${n === 1 ? 'note that changes' : `${n} notes that change`}` };
    }
    if (task === 'hear') {
      if (hq.done) return { big: posName(hearPos), small: hq.picked === hq.k ? COMPASS[hq.k].mood : `not ${COMPASS[hq.picked!].name}`, tone: hq.picked === hq.k ? 'good' : 'bad' };
      return { big: `${noteName(modeTonic(root, hq.k))} ?`, small: 'tap the mode you hear' };
    }
    if (held.length && fits) {
      const list = fits.map((j) => COMPASS[j].name);
      return { big: heldPcs.map((p) => (names === 'degrees' ? modeDegree(pos.k, p - pos.root) ?? spellIn(pos, p) : spellIn(pos, p))).join(' '), small: list.length ? (list.length === 7 ? 'in every mode' : `in ${list.join(', ')}`) : 'in no mode on this root' };
    }
    return { big: posName(pos), small: `${COMPASS[pos.k].chord} · ${COMPASS[pos.k].mood}` };
  })();
  const badgeAction = task === 'step' ? (sq.done ? nextStep : () => hearStep()) : task === 'hear' ? (hq.done ? nextHear : () => playHear()) : () => playEvents(scaleLine(pos));

  // what the dials show, by task
  const dialState = (j: number): string => {
    if (task === 'explore') return j === pos.k ? 'sel' : fits ? (fits.includes(j) ? 'fit' : 'dim') : '';
    if (task === 'step') {
      if (j === sq.from.k) return 'sel';
      if (sq.done && j === sq.to.k) return sq.missed ? 'target' : 'ok';
      return '';
    }
    if (!hq.done) return '';
    if (j === hq.k) return hq.picked === hq.k ? 'ok' : 'target';
    return j === hq.picked ? 'bad' : '';
  };
  /** the step the last move crossed, lit on the ring */
  const crossed = task === 'explore' && last && hold !== 'notes' ? edgeOf(last.from.k, last.to.k) : task === 'step' && sq.done && Math.abs(sq.n) === 1 ? edgeOf(sq.from.k, sq.to.k) : null;
  const lastText = task === 'explore' && last ? describeStep(last.from, last.to) : null;

  return (
    <div className="s-mode s-mcmode">
      <Bar tally={task === 'step' ? stepTally : task === 'hear' ? hearTally : undefined} help={HELP[task]}>
        <Chips label="Task" value={task} options={TASKS} onChange={setTask} />
        <Pick label="Root" prefix="Root" value={String(mod(root, 12))} options={KEY_ORDER.map((p) => ({ id: String(p), label: noteName(modeTonic(p, task === 'explore' ? pos.k : 1)) }))} onChange={(v) => setRoot(Number(v))} />
        {task === 'explore' ? <Pick label="Turning" value={hold} options={HOLDS} onChange={setHold} /> : null}
        {task === 'step' ? <Pick label="Steps" value={steps} options={STEPS.map((s) => ({ id: s.id, label: s.label }))} onChange={setSteps} /> : null}
        {task === 'hear' ? <Pick label="Modes" value={poolId} options={POOLS.map((p) => ({ id: p.id, label: p.label }))} onChange={setPoolId} /> : null}
        <Pick label="Note names" prefix="Names" value={names} options={NAMES} onChange={setNames} />
        <span className="s-cof-drone">
          <span className="k">Drone</span>
          <Chips label="Drone" value={drone} options={DRONES} onChange={pickDrone} />
        </span>
        <button type="button" className={`s-cof-info ${info ? 'on' : ''}`} aria-pressed={info} onClick={(e) => { setInfo(!info); if (e.detail) releaseFocus(e.currentTarget); }} title="The mirror, each mode's tritone and chord, and the words">
          <span className="dot" aria-hidden="true" /> Info
        </button>
      </Bar>

      <section className="s-stage">
        <div className={`s-tz s-mc ${info ? 'info' : ''}`}>
          {info ? (
            <div className="s-cof-side s-tz-side">
              <div className="s-q">
                <h1>{task === 'hear' && !hq.done ? 'Which mode?' : posName(shown)}</h1>
                <p className="sub">
                  {task === 'hear' && !hq.done
                    ? 'Listen for the 3rd first, then the one note that sets the mode apart. Tap its dial.'
                    : <ModeFacts p={shown} />}
                </p>
              </div>
              <div className="s-status" aria-live="polite">
                {task === 'explore' ? (
                  <>
                    {lastText ? <span className="s-tz-desc">{lastText}</span> : <span>Tap a dial, or step one note at a time:</span>}
                    <button type="button" className="btn ghost small" onClick={() => turn(-1)} title="One step brighter">◀ Brighter <K>⌫</K></button>
                    <button type="button" className="btn ghost small" onClick={() => turn(1)} title="One step darker">Darker ▶ <K>Enter</K></button>
                  </>
                ) : task === 'step' ? (
                  sq.done ? (
                    <>
                      <span className="s-tz-desc">{chain(sq.from, sq.n).map((t, i) => <span key={i}>{t}<br /></span>)}</span>
                      <button type="button" className="btn primary" onClick={nextStep}>Next <K>Space</K></button>
                    </>
                  ) : (
                    <>
                      {wrong.size ? <span className="bad">{[...wrong].map((p) => spellIn(sq.to, p)).join(', ')} is not in {posName(sq.to).split(' ').slice(1).join(' ') || 'it'}</span> : null}
                      <button type="button" className="btn ghost small" onClick={revealStep}>Show me <K>Space</K></button>
                      <button type="button" className="btn ghost small" onClick={nextStep}>Skip <K>Enter</K></button>
                    </>
                  )
                ) : hq.done ? (
                  <>
                    <strong className={hq.picked === hq.k ? 'good' : 'bad'}>{hq.picked === hq.k ? '✓ ' : '✗ '}{posName(hearPos)}</strong>
                    {hq.picked !== hq.k && hq.picked !== null ? <span className="s-tz-desc">{versus(hq.picked, hq.k, root)}</span> : null}
                    <button type="button" className="btn primary" onClick={nextHear}>Next <K>Space</K></button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn" onClick={() => playHear()}>Hear it <K>Space</K></button>
                    <button type="button" className="btn ghost small" onClick={nextHear}>Skip <K>Enter</K></button>
                  </>
                )}
              </div>
            </div>
          ) : null}

          <div className="s-tz-wrap">
            <div className="s-tz-top s-mc-top">
              {task === 'explore' ? <button type="button" className="btn ghost small s-mc-turn" onClick={() => turn(-1)} title="One step brighter (⌫)" aria-label="One step brighter">◀</button> : null}
              {badge ? (
                <button type="button" className={`s-tz-badge tap ${badge.tone ?? ''}`} onClick={badgeAction}>
                  <span className="big">{badge.big}</span>
                  {badge.small ? <span className="small">{badge.small}</span> : null}
                </button>
              ) : null}
              {task === 'explore' ? <button type="button" className="btn ghost small s-mc-turn" onClick={() => turn(1)} title="One step darker (Enter)" aria-label="One step darker">▶</button> : null}
            </div>
            <div className="s-tz-board" ref={box}>
              <Compass
                w={size.w}
                h={size.h}
                info={info}
                names={names}
                state={dialState}
                rootOf={dialRoot}
                sel={task === 'explore' ? pos.k : task === 'step' ? sq.from.k : hq.done ? hq.k : null}
                heldPcs={heldPcs}
                wrong={wrong}
                crossed={crossed}
                seam={hold === 'spin' || task === 'step'}
                changesShown={task !== 'step' || sq.done}
                droneOn={drone !== 'off'}
                onDial={task === 'explore' ? pickMode : task === 'hear' ? answer : (j) => playEvents(scaleLine({ root: dialRoot(j), k: j }))}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** The ring edge between two neighbouring modes (0 = Lydian–Ionian … 6 = Locrian–Lydian), or null. */
function edgeOf(a: number, b: number): number | null {
  if (mod(b - a, 7) === 1) return a;
  if (mod(a - b, 7) === 1) return b;
  return null;
}

/** Every step of a walk, in words. */
function chain(from: Pos, n: number): string[] {
  const out: string[] = [];
  let p = from;
  for (let i = 0; i < Math.abs(n); i++) {
    const q = step(p, n > 0 ? 1 : -1, 'spin');
    out.push(describeStep(p, q));
    p = q;
  }
  return out;
}

/** Why a wrong guess sounds close: how far apart the two are and which notes differ. */
function versus(picked: number, k: number, root: number): string {
  const a: Pos = { root: mod(root, 12), k: picked };
  const b: Pos = { root: mod(root, 12), k };
  const { gone, came } = change(a, b);
  const dist = Math.abs(picked - k);
  const way = picked < k ? 'brighter' : 'darker';
  const deg = (p: Pos, x: number) => modeDegree(p.k, x - p.root);
  return `${COMPASS[picked].name} is ${dist} ${dist === 1 ? 'step' : 'steps'} ${way} than ${COMPASS[k].name}: it has ${gone.map((x) => deg(a, x)).join(' ')} where ${COMPASS[k].name} has ${came.map((x) => deg(b, x)).join(' ')}.`;
}

function ModeFacts({ p }: { p: Pos }) {
  const m = COMPASS[p.k];
  const formula = modeSemis(p.k).map((s) => modeDegree(p.k, s)).join(' ');
  const [a, b] = tritone(p.k);
  const parent = noteName(modeTonic(parentOf(p), 1));
  const mir = COMPASS[mirror(p.k)];
  return (
    <>
      {formula} · {m.chord}. {m.mood[0].toUpperCase() + m.mood.slice(1)}.<br />
      Same notes as {parent} major. Tritone {modeDegree(p.k, a)}–{modeDegree(p.k, b)} ({spellIn(p, p.root + a)}–{spellIn(p, p.root + b)}). {mir.name === m.name ? 'Dorian is its own mirror image.' : `Upside down it is ${mir.name}.`}
    </>
  );
}

// ---------------------------------------------------------------- the compass

const f1 = (n: number) => n.toFixed(1);

function Compass({ w, h, info, names, state, rootOf, sel, heldPcs, wrong, crossed, seam, changesShown, droneOn, onDial }: {
  w: number;
  h: number;
  info: boolean;
  names: Names;
  /** sel, fit, dim, ok, target, bad */
  state: (k: number) => string;
  /** each dial's root (they differ when the parent scale is held) */
  rootOf: (k: number) => number;
  /** the dial whose notes are labelled and light as you play */
  sel: number | null;
  heldPcs: number[];
  wrong: Set<number>;
  crossed: number | null;
  seam: boolean;
  /** show what each step changes (hidden while it is the question) */
  changesShown: boolean;
  droneOn: boolean;
  onDial: (k: number) => void;
}) {
  // a ring when there is room, otherwise a row from bright to dark
  const ring = h >= 280 && w >= 280;
  const R = ring ? Math.min(w / 2.9, h / 2.9) : 0;
  const gap = w / 7;
  const rs = ring ? R * 0.37 : Math.min(h / 2 - 14, gap * 0.42);
  // the chosen dial is drawn bigger, just short of touching its neighbours
  const big = ring ? 1.3 : Math.max(1, Math.min(1.3, (gap * 0.97 - rs) / rs, (h / 2 - 2) / rs));
  const dy = ring ? R * 0.05 : -10;
  const at = (k: number): [number, number] => (ring ? [Math.cos(angleOf(k)) * R, Math.sin(angleOf(k)) * R + dy] : [(k - 3) * gap, dy]);
  const held = new Set(heldPcs);
  const press = (e: PointerEvent, k: number) => {
    e.preventDefault();
    onDial(k);
  };

  // the ring's coloured arcs, Lydian (warm) round through Dorian to Locrian (cool)
  const arcs = ring
    ? COMPASS.slice(0, 6).map((_, k) => {
      const a0 = angleOf(k);
      const a1 = angleOf(k + 1);
      const rr = R + rs + R * 0.08;
      const at0 = (a: number): string => `${f1(Math.cos(a) * rr)} ${f1(Math.sin(a) * rr + dy)}`;
      return <path key={`a${k}`} d={`M${at0(a0)}A${f1(rr)} ${f1(rr)} 0 0 1 ${at0(a1)}`} className="arc" style={{ stroke: modeColor(k + 0.5) }} />;
    })
    : null;

  // the change between neighbours, on the inner heptagon (ring) or under the gaps (row)
  const changes = !changesShown ? null : COMPASS.map((_, e) => {
    if (e === 6 && !seam) return null;
    const label = DARKER_DEGREE[e].replace('root → down a half step', '1 → ↓½');
    let x: number;
    let y: number;
    if (ring) {
      const mid = (angleOf(e) + angleOf(e + 1)) / 2;
      const rr = R * 0.47;
      x = Math.cos(mid) * rr;
      y = Math.sin(mid) * rr + dy;
    } else {
      if (e === 6) return null;
      x = (e - 2.5) * gap;
      y = dy + rs + 12;
    }
    return <text key={`c${e}`} x={f1(x)} y={f1(y)} className={`chg ${crossed === e ? 'on' : ''} ${e === 6 ? 'seam' : ''}`} style={{ fontSize: Math.max(9.5, rs * 0.19) }}>{label}</text>;
  });

  const hept = ring ? COMPASS.map((_, k) => at(k)).map(([x, y]) => `${f1(x * 0.5)},${f1((y - dy) * 0.5 + dy)}`).join(' ') : '';

  return (
    <svg viewBox={`${f1(-w / 2)} ${f1(-h / 2)} ${w} ${h}`} width={w} height={h} role="img" aria-label="Modal compass: the seven modes of major from bright to dark" className={`s-mc-svg ${ring ? 'ring' : 'row'} ${info ? 'info' : ''} ${droneOn ? 'drone' : ''}`}>
      {arcs}
      {ring ? (
        <>
          <text x={f1(-R * 1.18)} y={f1(R * 1.3 + dy)} className="side bright" style={{ fontSize: Math.max(12, R * 0.12), fill: modeColor(0) }}>Bright</text>
          <text x={f1(R * 1.18)} y={f1(R * 1.3 + dy)} className="side dark" style={{ fontSize: Math.max(12, R * 0.12), fill: modeColor(6) }}>Dark</text>
          <polygon points={hept} className="hept" />
        </>
      ) : null}
      {info && ring ? (
        <g className="mirror">
          <line x1="0" y1={f1(-R - rs * 1.25 + dy)} x2="0" y2={f1(R * 1.05 + dy)} />
          {[0, 1, 2].map((k) => {
            const [x1, y1] = at(k);
            const [x2, y2] = at(mirror(k));
            return <line key={k} x1={f1(x1 * 0.62)} y1={f1((y1 - dy) * 0.62 + dy)} x2={f1(x2 * 0.62)} y2={f1((y2 - dy) * 0.62 + dy)} className="pair" />;
          })}
        </g>
      ) : null}
      {changes}
      {COMPASS.map((_, k) => k).sort((a, b) => Number(a === sel) - Number(b === sel)).map((k) => {
        const m = COMPASS[k];
        const [cx, cy] = at(k);
        return (
          <Dial
            key={m.id}
            k={k}
            cx={cx}
            cy={cy}
            r={k === sel ? rs * big : rs}
            root={rootOf(k)}
            state={state(k)}
            labelled={k === sel}
            info={info}
            names={names}
            held={k === sel ? held : null}
            wrong={k === sel ? wrong : null}
            onDown={(e) => press(e, k)}
          />
        );
      })}
    </svg>
  );
}

function Dial({ k, cx, cy, r, root, state, labelled, info, names, held, wrong, onDown }: {
  k: number;
  cx: number;
  cy: number;
  r: number;
  root: number;
  state: string;
  labelled: boolean;
  info: boolean;
  names: Names;
  held: Set<number> | null;
  wrong: Set<number> | null;
  onDown: (e: PointerEvent) => void;
}) {
  const semis = modeSemis(k);
  const p: Pos = { root, k };
  const ptAt = (s: number, rr: number): [number, number] => {
    const a = -Math.PI / 2 + (s * Math.PI) / 6;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };
  const rd = r * 0.74;
  const poly = semis.map((s) => ptAt(s, rd).map(f1).join(',')).join(' ');
  const [ta, tb] = tritone(k);
  const dot = labelled ? r * 0.16 : r * 0.1;
  const m = COMPASS[k];
  return (
    <g className={`dial ${state} ${labelled ? 'labelled' : ''}`} style={{ '--m': modeColor(k) } as CSSProperties} onPointerDown={onDown}>
      <circle cx={f1(cx)} cy={f1(cy)} r={f1(r)} className="face" />
      {Array.from({ length: 12 }, (_, s) => {
        const [x1, y1] = ptAt(s, r * 0.9);
        const [x2, y2] = ptAt(s, r * 0.98);
        return <line key={`t${s}`} x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} className={`tick ${s === 0 ? 'top' : ''}`} />;
      })}
      <polygon points={poly} className="shape" />
      {!info ? null : (() => {
        const [x1, y1] = ptAt(ta, rd);
        const [x2, y2] = ptAt(tb, rd);
        return <line x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} className="tt" />;
      })()}
      {semis.map((s) => {
        const [x, y] = ptAt(s, rd);
        const pc = mod(root + s, 12);
        const lit = held?.has(pc) ?? false;
        const bad = wrong?.has(pc) ?? false;
        const label = names === 'degrees' ? modeDegree(k, s) ?? '' : spellIn(p, pc);
        return (
          <g key={s} className={`dot ${s === 0 ? 'root' : ''} ${lit ? 'lit' : ''} ${bad ? 'wrong' : ''} ${info && (s === ta || s === tb) ? 'tt' : ''}`} style={{ '--c': degreeColor(s), '--ink': degreeInk(s) } as CSSProperties}>
            <circle cx={f1(x)} cy={f1(y)} r={f1(s === 0 ? dot * 1.15 : dot)} />
            {labelled ? <text x={f1(x)} y={f1(y)} style={{ fontSize: dot * (label.length > 2 ? 0.8 : 0.95) }}>{label}</text> : null}
          </g>
        );
      })}
      {/* wrong notes outside the mode, shown where they would sit */}
      {wrong ? [...wrong].filter((pc) => !semis.includes(mod(pc - root, 12))).map((pc) => {
        const [x, y] = ptAt(mod(pc - root, 12), rd);
        return <circle key={`w${pc}`} cx={f1(x)} cy={f1(y)} r={f1(dot)} className="miss" />;
      }) : null}
      <text x={f1(cx)} y={f1(cy - (labelled ? r * 0.06 : 0))} className="name" style={{ fontSize: r * (labelled ? 0.2 : 0.22) }}>{m.name}</text>
      {labelled ? <text x={f1(cx)} y={f1(cy + r * 0.2)} className="sub" style={{ fontSize: r * 0.15 }}>{noteName(modeTonic(root, k))} · {m.chord}</text> : null}
    </g>
  );
}
