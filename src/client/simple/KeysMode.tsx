import { useEffect, useState } from 'react';
import { MAJOR_KEYS, relativeMinor, type KeyMode } from '../theory/keys';
import { mod, noteName, sameNote, type Note } from '../theory/core';
import { scaleMidis, scaleNotes } from '../theory/scales';
import type { KeyMark } from '../ui/Keyboard';
import { Bar, Chips, K, NotePicker, Pick, playLine, rootMidi, setMarks, useAnswerPointer, useHotkeys, useModeCleanup, usePref, type Choice } from './common';
import type { Help } from './Lessons';
import { ladder, pickFor, useTally } from './stats';

type Task = 'sig' | 'key' | 'relative' | 'degree' | 'modes';
type Which = KeyMode | 'both';
const TASKS: Choice<Task>[] = [
  { id: 'sig', label: 'Key → signature' },
  { id: 'key', label: 'Signature → key' },
  { id: 'relative', label: 'Relatives' },
  { id: 'degree', label: 'Scale degrees' },
  { id: 'modes', label: 'Modes', title: 'E♭ Dorian, A Mixolydian…: which signature?' },
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

/** The modes of major, by the degree of the parent scale they start on. */
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const MODE_SCALE = ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor', 'locrian'];
const MODE_COLOUR = ['', 'the ♮6 against a minor 3rd', 'the ♭2', 'the ♯4', 'the ♭7 against a major 3rd', 'the ♭6', 'the ♭2 and ♭5'];
/** A mode's tonic: degree `idx` of the major key with signature `sig`. */
const modeTonic = (sig: number, idx: number): Note => scaleNotes(majorOf(sig), 'major')[idx];
// tonics a chart would actually write (no E♯ Phrygian or F♭ Lydian)
const plainTonic = (n: Note) => Math.abs(n.acc) <= 1 && !(n.acc === 1 && (n.letter === 2 || n.letter === 6)) && !(n.acc === -1 && (n.letter === 0 || n.letter === 3));

interface Q {
  sig: number;
  mode: KeyMode;
  /** 2–7, for scale-degree questions */
  degree: number;
  /** modes: which mode of the signature's major key (0 = Ionian … 6 = Locrian) */
  modeIdx: number;
}
/** What the record keeps: the key ("minor:-3" is C minor). */
const itemOf = (mode: KeyMode, sig: number) => `${mode}:${sig}`;
const itemLabel = (item: string) => {
  const [mode, sig] = item.split(':');
  return `${keyLabel(Number(sig), mode as KeyMode)} · ${sigLabel(Number(sig))}`;
};
const poolOf = (which: Which) => (which === 'both' ? (['major', 'minor'] as KeyMode[]) : [which]).flatMap((m) => SIGS.map((sig) => itemOf(m, sig)));

/** A fresh question, leaning toward the keys you miss. */
function newQ(task: Task, which: Which, prev: Q | null): Q {
  const mode: KeyMode = which === 'both' ? (Math.random() < 0.5 ? 'major' : 'minor') : which;
  if (task === 'modes') {
    const name = pickFor('keys.modes', MODES, prev ? MODES[prev.modeIdx] : null);
    const modeIdx = MODES.indexOf(name);
    const sigs = SIGS.filter((s) => plainTonic(modeTonic(s, modeIdx)) && s !== prev?.sig);
    return { sig: sigs[Math.floor(Math.random() * sigs.length)], mode: 'major', degree: 1, modeIdx };
  }
  return {
    sig: pickFor(`keys.${task}`, SIGS, prev?.sig ?? null, (sig) => itemOf(mode, sig)),
    mode,
    degree: 2 + Math.floor(Math.random() * 6),
    modeIdx: 0,
  };
}

const TOPICS = ['core.degrees', 'core.modes', 'core.diatonic'];
const HELP: Record<Task, Help> = {
  sig: {
    topics: TOPICS,
    method: [
      'Sharps go F C G D A E B; flats go B E A D G C F.',
      'Major keys: count 5ths up from C for sharps (G 1♯, D 2♯, A 3♯…) and down for flats (F 1♭, B♭ 2♭, E♭ 3♭…).',
      'Minor keys: use the relative major, a minor 3rd up (C minor → E♭ major → 3♭).',
    ],
  },
  key: {
    topics: TOPICS,
    method: [
      'Sharps: the last sharp is a half step below the major tonic (F♯ C♯ → D).',
      'Flats: the second-to-last flat is the major tonic (B♭ E♭ A♭ → E♭); one flat is F.',
      'Minor: a minor 3rd down from the major tonic.',
    ],
  },
  relative: {
    topics: TOPICS,
    method: [
      'Major → relative minor: down a minor 3rd, to the 6th degree.',
      'Minor → relative major: up a minor 3rd, to the ♭3.',
      'The letters stay three apart and share the signature: C–A, E♭–C, F♯–D♯.',
    ],
  },
  modes: {
    topics: ['core.modes', 'core.chordscale'],
    method: [
      'A mode borrows its signature from the major key it is a degree of: Dorian starts on 2, Phrygian 3, Lydian 4, Mixolydian 5, Aeolian 6, Locrian 7.',
      'So count down to the parent: E♭ Dorian → E♭ is the 2nd of D♭ major → 5♭. A Mixolydian → A is the 5th of D major → 2♯.',
      'Or by colour from the tonic\'s own major key: Lydian +1♯, Mixolydian +1♭, Dorian +2♭, Aeolian +3♭, Phrygian +4♭, Locrian +5♭.',
    ],
  },
  degree: {
    topics: TOPICS,
    method: [
      'Count letters from the tonic: the 6th of E♭ is C (E F G A B C).',
      'Then apply the signature to that letter: E♭ has B♭ E♭ A♭, so C stays natural.',
      'Minor keys are natural minor here: the 7th is the subtonic, a whole step below the tonic.',
    ],
  },
};

export function KeysMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('keys.task', 'sig');
  const [which, setWhich] = usePref<Which>('keys.which', 'major');
  const [q, setQ] = useState<Q>(() => newQ(task, which, null));
  const [picked, setPicked] = useState<number | null>(null);
  const [pickedNote, setPickedNote] = useState<Note | null>(null);
  const modes = task === 'modes';
  const tally = useTally(`keys.${task}`, `Keys · ${TASKS.find((t) => t.id === task)!.label}`, modes ? MODES : poolOf(which), modes ? (m) => m : itemLabel, modes ? undefined : ladder(WHICH, which, (w) => { setWhich(w); next(w); }));

  const tonic = modes ? modeTonic(q.sig, q.modeIdx) : tonicOf(q.sig, q.mode);
  const scaleId = modes ? MODE_SCALE[q.modeIdx] : q.mode === 'major' ? 'major' : 'minor';
  const names = scaleNotes(tonic, scaleId);
  const midis = scaleMidis(rootMidi(tonic), scaleId);
  const answered = picked !== null || pickedNote !== null;
  const target = names[q.degree - 1];
  // the relatives question asks for the key in the other mode with the same signature
  const answerMode = task === 'relative' ? other(q.mode) : q.mode;

  const next = (w = which, t = task) => {
    setQ((p) => newQ(t, w, p));
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
    tally.record(modes ? MODES[q.modeIdx] : itemOf(q.mode, q.sig), ok);
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

  // the mod strip points along the key signatures (the note grid has its own pointer)
  const pointed = useAnswerPointer(task === 'degree' ? 0 : SIGS.length, (i) => choose(SIGS[i]), !answered);

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
      <Bar tally={tally} help={HELP[task]}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => { setTask(t); next(which, t); }} />
        {modes ? null : <Pick label="Keys" value={which} options={WHICH} onChange={(w) => { setWhich(w); next(w); }} />}
      </Bar>

      <section className="s-stage">
        <div className="s-keys">
          <div className="s-keys-q">
            <div className="s-q">
              <h1>
                {modes ? <>{noteName(tonic)} {MODES[q.modeIdx]}</>
                  : task === 'sig' ? <>{noteName(tonic)} {q.mode}</>
                  : task === 'key' ? <>{sigWords}</>
                  : task === 'relative' ? <>{noteName(tonic)} {q.mode}</>
                  : <>{ORD[q.degree - 1]} of {noteName(tonic)} {q.mode}</>}
              </h1>
              <p className="sub">
                {modes ? 'Which signature?'
                  : task === 'sig' ? `How many ${kind}?`
                  : task === 'key' ? `Which ${q.mode} key?`
                  : task === 'relative' ? `Its relative ${answerMode}?`
                  : `The ${degreeName(q.degree, q.mode)} — which note?`}
              </p>
            </div>
            {task === 'degree' ? (
              <NotePicker answer={target} picked={pickedNote} onPick={chooseNote} />
            ) : (
              <div className={`s-answers sig ${answered ? 'answered' : ''}`}>
                {SIGS.map((sig, i) => {
                  const cls = answered ? (sig === q.sig ? 'right' : sig === picked ? 'wrongpick' : '') : '';
                  return (
                    <button key={sig} type="button" className={`s-answer ${cls} ${i === pointed ? 'pointed' : ''}`} onClick={() => choose(sig)}>
                      {task === 'sig' || modes ? sigLabel(sig) : keyLabel(sig, answerMode)}
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
                    {modes
                      ? `${noteName(tonic)} ${MODES[q.modeIdx]} = ${keyLabel(q.sig, 'major')} major from its ${ORD[q.modeIdx]} degree: ${sigText}`
                      : task === 'degree'
                      ? `${noteName(target)} — ${noteName(tonic)} ${q.mode}: ${names.map(noteName).join(' ')}`
                      : task === 'relative'
                        ? `${noteName(tonic)} ${q.mode} and ${noteName(tonicOf(q.sig, answerMode))} ${answerMode} share ${sigText}`
                        : `${noteName(tonic)} ${q.mode} = ${sigText}`}
                  </strong>
                  {task === 'sig' || task === 'key' ? <span className="muted">Relative {other(q.mode)}: {keyLabel(q.sig, other(q.mode))}</span> : null}
                  {modes && q.modeIdx ? <span className="muted s-hint">Its colour: {MODE_COLOUR[q.modeIdx]}</span> : null}
                  <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
                </>
              ) : (
                <span>
                  {modes
                    ? 'Find the major key it is a mode of.'
                    : task === 'relative'
                    ? q.mode === 'major' ? 'Relative minor: down a minor 3rd (the 6th degree).' : 'Relative major: up a minor 3rd (the ♭3).'
                    : task === 'degree'
                      ? `Spell from the key signature (${sigText}).`
                      : <>{q.sig >= 0 ? 'Sharps go F C G D A E B' : 'Flats go B E A D G C F'} — {task === 'sig' ? 'count along the circle' : 'last sharp is a half step below the major tonic; second-to-last flat is the tonic'}.</>}
                </span>
              )}
            </div>
          </div>
          <Circle sig={answered ? q.sig : null} mode={modes ? 'major' : answerMode} label={keyLabel(q.sig, modes ? 'major' : answerMode)} />
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
