import { useEffect, useState } from 'react';
import { MAJOR_KEYS, relativeMinor, type KeyMode } from '../theory/keys';
import { mod, noteName, sameNote, type Note } from '../theory/core';
import { scaleMidis, scaleNotes } from '../theory/scales';
import type { KeyMark } from '../ui/Keyboard';
import { Bar, Chips, K, NotePicker, Pick, pickOther, playLine, rootMidi, setMarks, useHotkeys, useModeCleanup, usePref, type Choice } from './common';

type Task = 'sig' | 'key' | 'relative' | 'degree';
type Which = KeyMode | 'both';
const TASKS: Choice<Task>[] = [
  { id: 'sig', label: 'Key → signature' },
  { id: 'key', label: 'Signature → key' },
  { id: 'relative', label: 'Relatives' },
  { id: 'degree', label: 'Scale degrees' },
];
const WHICH: Choice<Which>[] = [{ id: 'major', label: 'Major keys' }, { id: 'minor', label: 'Minor keys' }, { id: 'both', label: 'Major & minor' }];

const SIGS = Array.from({ length: 15 }, (_, i) => i - 7); // -7 (7 flats) … +7 (7 sharps)
const SHARP_ORDER = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'];
const FLAT_ORDER = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'];
const DEGREE_NAMES = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading tone'];
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];

const majorOf = (sig: number): Note => MAJOR_KEYS.find((k) => k.sig === sig)!.tonic;
const tonicOf = (sig: number, mode: KeyMode): Note => (mode === 'major' ? majorOf(sig) : relativeMinor(majorOf(sig)));
const keyLabel = (sig: number, mode: KeyMode): string => noteName(tonicOf(sig, mode)) + (mode === 'minor' ? 'm' : '');
const sigLabel = (sig: number): string => (sig === 0 ? 'none' : `${Math.abs(sig)}${sig > 0 ? '♯' : '♭'}`);
const accidentals = (sig: number): string[] => (sig > 0 ? SHARP_ORDER.slice(0, sig) : FLAT_ORDER.slice(0, -sig));
const other = (m: KeyMode): KeyMode => (m === 'major' ? 'minor' : 'major');
const degreeName = (d: number, mode: KeyMode) => (d === 7 && mode === 'minor' ? 'subtonic' : DEGREE_NAMES[d - 1]);

interface Q {
  sig: number;
  mode: KeyMode;
  /** 2–7, for scale-degree questions */
  degree: number;
}
const newQ = (which: Which, prev: Q | null): Q => ({
  sig: pickOther(SIGS, prev?.sig ?? null),
  mode: which === 'both' ? (Math.random() < 0.5 ? 'major' : 'minor') : which,
  degree: 2 + Math.floor(Math.random() * 6),
});

export function KeysMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('keys.task', 'sig');
  const [which, setWhich] = usePref<Which>('keys.which', 'major');
  const [q, setQ] = useState<Q>(() => newQ(which, null));
  const [picked, setPicked] = useState<number | null>(null);
  const [pickedNote, setPickedNote] = useState<Note | null>(null);
  const [score, setScore] = useState({ ok: 0, bad: 0 });

  const tonic = tonicOf(q.sig, q.mode);
  const scaleId = q.mode === 'major' ? 'major' : 'minor';
  const names = scaleNotes(tonic, scaleId);
  const midis = scaleMidis(rootMidi(tonic), scaleId);
  const answered = picked !== null || pickedNote !== null;
  const target = names[q.degree - 1];
  // the relatives question asks for the key in the other mode with the same signature
  const answerMode = task === 'relative' ? other(q.mode) : q.mode;

  const next = (w = which) => {
    setQ((p) => newQ(w, p));
    setPicked(null);
    setPickedNote(null);
  };

  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    if (answered) {
      midis.forEach((m, i) => {
        const n = names[i % names.length];
        marks[m] = { label: noteName(n), tone: task === 'degree' && i === q.degree - 1 ? 'target' : i % names.length === 0 ? 'root' : n.acc ? 'accent' : 'scale' };
      });
    }
    setMarks(marks);
  }, [q, answered, task]);

  const settle = (ok: boolean) => {
    setScore((s) => (ok ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 }));
    playLine(midis, 0.18, 0.2);
  };
  const choose = (sig: number) => {
    if (answered) return;
    setPicked(sig);
    settle(sig === q.sig);
  };
  const chooseNote = (n: Note) => {
    setPickedNote(n);
    settle(sameNote(n, target));
  };

  useHotkeys((e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && answered) {
      e.preventDefault();
      next();
    }
  });

  const ok = task === 'degree' ? !!pickedNote && sameNote(pickedNote, target) : picked === q.sig;
  const accs = accidentals(q.sig);
  const sigText = q.sig === 0 ? 'no sharps or flats' : `${sigLabel(q.sig)}: ${accs.join(' ')}`;
  const sigWords = q.sig === 0 ? 'No sharps or flats' : `${sigLabel(q.sig).replace('♯', ' sharp').replace('♭', ' flat')}${Math.abs(q.sig) > 1 ? 's' : ''}`;

  const kind = q.sig === 0 ? 'sharps or flats' : q.sig > 0 ? 'sharps' : 'flats';

  return (
    <div className="s-mode">
      <Bar score={score}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => { setTask(t); next(); }} />
        <Pick label="Keys" value={which} options={WHICH} onChange={(w) => { setWhich(w); next(w); }} />
      </Bar>

      <section className="s-stage">
        <div className="s-keys">
          <div className="s-keys-q">
            <div className="s-q">
              <h1>
                {task === 'sig' ? <>{noteName(tonic)} {q.mode}</>
                  : task === 'key' ? <>{sigWords}</>
                  : task === 'relative' ? <>{noteName(tonic)} {q.mode}</>
                  : <>{ORD[q.degree - 1]} of {noteName(tonic)} {q.mode}</>}
              </h1>
              <p className="sub">
                {task === 'sig' ? `How many ${kind}?`
                  : task === 'key' ? `Which ${q.mode} key?`
                  : task === 'relative' ? `Its relative ${answerMode}?`
                  : `The ${degreeName(q.degree, q.mode)} — which note?`}
              </p>
            </div>
            {task === 'degree' ? (
              <NotePicker answer={target} picked={pickedNote} onPick={chooseNote} />
            ) : (
              <div className={`s-answers sig ${answered ? 'answered' : ''}`}>
                {SIGS.map((sig) => {
                  const cls = answered ? (sig === q.sig ? 'right' : sig === picked ? 'wrongpick' : '') : '';
                  return (
                    <button key={sig} type="button" className={`s-answer ${cls}`} onClick={() => choose(sig)}>
                      {task === 'sig' ? sigLabel(sig) : keyLabel(sig, answerMode)}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="s-status" aria-live="polite">
              {answered ? (
                <>
                  <strong className={ok ? 'good' : 'bad'}>
                    {ok ? '✓ ' : '✗ '}
                    {task === 'degree'
                      ? `${noteName(target)} — ${noteName(tonic)} ${q.mode}: ${names.map(noteName).join(' ')}`
                      : task === 'relative'
                        ? `${noteName(tonic)} ${q.mode} and ${noteName(tonicOf(q.sig, answerMode))} ${answerMode} share ${sigText}`
                        : `${noteName(tonic)} ${q.mode} = ${sigText}`}
                  </strong>
                  {task === 'sig' || task === 'key' ? <span className="muted">Relative {other(q.mode)}: {keyLabel(q.sig, other(q.mode))}</span> : null}
                  <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
                </>
              ) : (
                <span>
                  {task === 'relative'
                    ? q.mode === 'major' ? 'Relative minor: down a minor 3rd (the 6th degree).' : 'Relative major: up a minor 3rd (the ♭3).'
                    : task === 'degree'
                      ? `Spell from the key signature (${sigText}).`
                      : <>{q.sig >= 0 ? 'Sharps go F C G D A E B' : 'Flats go B E A D G C F'} — {task === 'sig' ? 'count along the circle' : 'last sharp is a half step below the major tonic; second-to-last flat is the tonic'}.</>}
                </span>
              )}
            </div>
          </div>
          <Circle sig={answered ? q.sig : null} mode={answerMode} label={keyLabel(q.sig, answerMode)} />
        </div>
      </section>
    </div>
  );
}

// Circle of fifths: majors outside, relative minors inside. Position = signature mod 12.
const OUTER = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
const INNER = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];

/** `label` replaces the default spelling at the highlighted spot (G♭ vs F♯, C♯ vs D♭ …). */
function Circle({ sig, mode, label }: { sig: number | null; mode: KeyMode; label: string }) {
  const at = sig === null ? -1 : mod(sig, 12);
  const pt = (i: number, r: number) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
  };
  return (
    <svg className="s-circle" viewBox="0 0 200 200" role="img" aria-label="Circle of fifths">
      <circle cx="100" cy="100" r="96" className="ring" />
      <circle cx="100" cy="100" r="58" className="ring inner" />
      {OUTER.map((maj, i) => {
        const [x, y] = pt(i, 78);
        const [ix, iy] = pt(i, 42);
        const hit = i === at;
        return (
          <g key={i}>
            {hit ? <circle cx={mode === 'major' ? x : ix} cy={mode === 'major' ? y : iy} r={mode === 'major' ? 15 : 12} className="hit" /> : null}
            <text x={x} y={y} className={`maj ${hit && mode === 'major' ? 'on' : ''}`}>{hit && mode === 'major' ? label : maj}</text>
            <text x={ix} y={iy} className={`min ${hit && mode === 'minor' ? 'on' : ''}`}>{hit && mode === 'minor' ? label : INNER[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
