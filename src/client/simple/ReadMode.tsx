// Read: notes on the treble and bass staves, key signatures, and chords stacked
// on the grand staff. Answer by name, or play it on the keys; each answer is timed.

import { useEffect, useRef, useState } from 'react';
import { input } from '../midi/input';
import { chordSymbol, getChord } from '../theory/chords';
import { LETTERS, mod, N, noteName, sameNote, shuffle, type Note } from '../theory/core';
import { Staff, type Clef } from '../ui/Staff';
import type { KeyMark } from '../ui/Keyboard';
import type { Help } from './Lessons';
import { ladder, pickFor, useTally } from './stats';
import { Answers, Bar, Chips, K, NotePicker, Pick, playBlock, playLine, setMarks, useFlash, useHotkeys, useModeCleanup, useNoteOn, usePref, type Choice } from './common';
import { CHORD_TYPES_FOR, notePool, noteId, noteKey, noteKeyLabel, READ_ROOTS, sameChord, SIGS, sigKeyName, stackChord, type ChordSet, type Range, type StaffChordQ, type StaffNote } from './readLogic';

type Task = 'notes' | 'sigs' | 'chords';
type Mode = 'major' | 'minor';

const TASKS: Choice<Task>[] = [
  { id: 'notes', label: 'Notes', title: 'Name the note on the staff, or play it' },
  { id: 'sigs', label: 'Key signatures', title: 'Which key has this signature?' },
  { id: 'chords', label: 'Chords', title: 'Name the chord stacked on the staff, or play it' },
];
const CLEFS: Choice<Clef>[] = [
  { id: 'treble', label: 'Treble clef' },
  { id: 'bass', label: 'Bass clef' },
  { id: 'grand', label: 'Grand staff' },
];
const RANGES: Choice<Range>[] = [
  { id: 'staff', label: 'On the staff' },
  { id: 'ledger', label: '+ ledger lines' },
  { id: 'accidentals', label: '+ sharps & flats' },
];
const MODES: Choice<Mode>[] = [{ id: 'major', label: 'Major keys' }, { id: 'minor', label: 'Minor keys' }];
const CHORD_SETS: Choice<ChordSet>[] = [
  { id: 'triads', label: 'Triads' },
  { id: 'sevenths', label: '7th chords' },
  { id: 'triads-inv', label: 'Triads + inversions' },
  { id: 'sevenths-inv', label: '7ths + inversions' },
];
const INV_NAME = ['root position', '1st inversion', '2nd inversion', '3rd inversion'];

const HELP: Record<Task, Help> = {
  notes: {
    topics: ['core.intervals', 'bach.voiceleading'],
    method: [
      'Learn a few landmarks cold: treble G4 (the line the clef curls round), middle C (one ledger line between the staves), bass F3 (the line between the clef\'s dots).',
      'Read from the nearest landmark by step: line to space to line is one letter each.',
      'Treble lines E G B D F, spaces F A C E. Bass lines G B D F A, spaces A C E G.',
      'Ledger lines continue the pattern: a 3rd per ledger line. Two below the treble is A3, two above the bass is E4.',
      'Playing the note counts in any octave; the answer tells you the octave.',
    ],
  },
  sigs: {
    topics: ['core.degrees', 'core.modes'],
    method: [
      'Sharps: the last sharp is the leading tone, so the key is a half step above it (last sharp C♯ → D major).',
      'Flats: the second-to-last flat is the key (B♭ E♭ A♭ → E♭ major). One flat is F major.',
      'Order of sharps F C G D A E B; flats are the same backwards: B E A D G C F.',
      'Minor keys: the relative minor sits a minor 3rd below the major (3 flats: E♭ major or C minor).',
    ],
  },
  chords: {
    topics: ['core.sevenths', 'core.diatonic', 'bach.figured'],
    method: [
      'Stacked on lines (or all on spaces) = a chord in root position: the bottom note is the root.',
      'Not all in 3rds? Find the 4th (or 2nd) gap: the upper note of that gap is the root. That tells you the inversion.',
      'Then quality from the 3rds above the root: M3 + m3 = major, m3 + M3 = minor, m3 + m3 = diminished, M3 + M3 = augmented.',
      'Sevenths: the 7th above the root decides maj7 (half step below the octave), 7 or m7 (whole step), °7 (a 6th).',
      'Play it to answer: hold all its notes together, any octave or voicing.',
    ],
  },
};

interface Q {
  task: Task;
  note: StaffNote | null;
  sig: number;
  chord: StaffChordQ | null;
  /** chord answers offered */
  options: string[];
}

const skillOf = (task: Task) => `read.${task}`;

function chordOptions(q: StaffChordQ, types: string[]): string[] {
  const right = chordSymbol(q.root, q.typeId);
  const others = new Set<string>();
  for (const t of types) if (t !== q.typeId) others.add(chordSymbol(q.root, t));
  // the same chord a step away, so spelling counts
  const near = READ_ROOTS.map((r) => N(r)).filter((r) => r.letter !== q.root.letter && Math.abs(r.letter - q.root.letter) <= 2);
  for (const r of near) others.add(chordSymbol(r, q.typeId));
  return shuffle([right, ...shuffle([...others]).slice(0, 3)]);
}

function newQ(task: Task, clef: Clef, range: Range, mode: Mode, set: ChordSet, prev: Q | null): Q {
  if (task === 'notes') {
    const pool = notePool(clef, range);
    const note = pickFor(skillOf(task), pool, prev?.note ?? null, noteKey);
    return { task, note, sig: 0, chord: null, options: [] };
  }
  if (task === 'sigs') {
    const sig = pickFor(skillOf(task), SIGS, prev?.sig ?? null, (s) => `${mode}:${s}`);
    return { task, note: null, sig, chord: null, options: [] };
  }
  const kind = set.startsWith('triads') ? 'triads' : 'sevenths';
  const types = CHORD_TYPES_FOR[kind];
  const typeId = pickFor(skillOf(task), types, prev?.chord?.typeId ?? null);
  const root = N(READ_ROOTS[Math.floor(Math.random() * READ_ROOTS.length)]);
  const inv = set.endsWith('-inv') ? Math.floor(Math.random() * (kind === 'triads' ? 3 : 4)) : 0;
  const chord = stackChord(root, typeId, inv);
  return { task, note: null, sig: 0, chord, options: chordOptions(chord, types) };
}

export function ReadMode() {
  useModeCleanup();
  const [task, setTask] = usePref<Task>('read.task', 'notes');
  const [clef, setClef] = usePref<Clef>('read.clef', 'treble');
  const [range, setRange] = usePref<Range>('read.range', 'staff');
  const [mode, setMode] = usePref<Mode>('read.mode', 'major');
  const [set, setSet] = usePref<ChordSet>('read.chords', 'triads');
  const [q, setQ] = useState<Q>(() => newQ(task, clef, range, mode, set, null));
  const [answer, setAnswer] = useState<{ ok: boolean; picked: string | null; secs: number } | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const [wrong, flash] = useFlash();
  const shown = useRef(performance.now());

  const kind = set.startsWith('triads') ? 'triads' : 'sevenths';
  const pool =
    task === 'notes' ? notePool(clef, range).map(noteKey) : task === 'sigs' ? SIGS.map((s) => `${mode}:${s}`) : CHORD_TYPES_FOR[kind];
  const tally = useTally(
    skillOf(task),
    `Read · ${TASKS.find((t) => t.id === task)!.label}`,
    pool,
    task === 'notes' ? noteKeyLabel : task === 'sigs' ? (k) => { const [m, s] = k.split(':'); return `${sigKeyName(Number(s), m as Mode)} · ${Number(s) === 0 ? 'no sharps/flats' : `${Math.abs(Number(s))}${Number(s) > 0 ? '♯' : '♭'}`}`; } : (t) => getChord(t).name,
    task === 'notes'
      ? ladder(RANGES, range, (r) => { setRange(r); next(task, clef, r); })
      : task === 'sigs'
        ? ladder(MODES, mode, (m) => { setMode(m); next(task, clef, range, m); })
        : ladder(CHORD_SETS, set, (x) => { setSet(x); next(task, clef, range, mode, x); }),
  );

  const next = (t = task, c = clef, r = range, m = mode, s = set) => {
    setQ((p) => newQ(t, c, r, m, s, p));
    setAnswer(null);
  };
  useEffect(() => {
    shown.current = performance.now();
    if (q.note) input.placeRoot(60 + mod(q.note.midi, 12) - (mod(q.note.midi, 12) > 6 ? 12 : 0));
  }, [q]);

  const itemOf = () => (q.note ? noteKey(q.note) : q.task === 'sigs' ? `${mode}:${q.sig}` : q.chord!.typeId);
  const settle = (ok: boolean, picked: string | null) => {
    if (answer) return;
    const secs = (performance.now() - shown.current) / 1000;
    setAnswer({ ok, picked, secs });
    if (ok) setTimes((ts) => [...ts.slice(-19), secs]);
    tally.record(itemOf(), ok);
    if (q.note) playBlock([q.note.midi], 0.9);
    if (q.chord) {
      playLine(q.chord.midis, 0.22, 0.9);
      playBlock(q.chord.midis, 1.3, q.chord.midis.length * 0.22 + 0.1);
    }
  };

  useNoteOn((note) => {
    if (answer) return;
    if (q.note) {
      if (mod(note, 12) === mod(q.note.midi, 12)) settle(true, null);
      else {
        flash(note);
        settle(false, '');
      }
    } else if (q.chord && sameChord(input.heldNotes(), q.chord.midis)) settle(true, null);
  });

  useHotkeys((e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && answer) {
      e.preventDefault();
      next();
    } else if (e.code === 'Space' && q.chord && !answer) {
      e.preventDefault();
      settle(false, '');
    }
  });

  useEffect(() => {
    const marks: Record<number, KeyMark> = {};
    if (answer && q.note) marks[q.note.midi] = { label: noteId(q.note), tone: answer.ok ? 'ok' : 'target' };
    if (answer && q.chord) q.chord.midis.forEach((m, i) => (marks[m] = { label: q.chord!.names[i], tone: answer.ok ? 'ok' : 'target' }));
    for (const n of wrong) marks[n] = { tone: 'wrong' };
    setMarks(marks);
  }, [q, answer, wrong]);

  // ---------------------------------------------------------- view
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const staffNote: Note | null = q.note?.note ?? null;
  const naturalsOnly = range !== 'accidentals';
  const letterAnswers = LETTERS.map((_, letter) => ({ id: String(letter), label: noteName({ letter, acc: 0 }) }));
  const sigAnswers = SIGS.map((s) => ({ id: String(s), label: sigKeyName(s, mode) }));
  const chordName = q.chord ? chordSymbol(q.chord.root, q.chord.typeId) : '';

  return (
    <div className="s-mode">
      <Bar tally={tally} help={HELP[task]}>
        <Chips label="Task" value={task} options={TASKS} onChange={(t) => { setTask(t); next(t); }} />
        {task !== 'chords' ? <Pick label="Clef" value={clef} options={CLEFS} onChange={(c) => { setClef(c); next(task, c); }} /> : null}
        {task === 'notes' ? <Pick label="Range" value={range} options={RANGES} onChange={(r) => { setRange(r); next(task, clef, r); }} /> : null}
        {task === 'sigs' ? <Pick label="Keys" value={mode} options={MODES} onChange={(m) => { setMode(m); next(task, clef, range, m); }} /> : null}
        {task === 'chords' ? <Pick label="Chords" value={set} options={CHORD_SETS} onChange={(s) => { setSet(s); next(task, clef, range, mode, s); }} /> : null}
      </Bar>

      <section className="s-stage s-read">
        <div className="s-q">
          <h1>{task === 'notes' ? 'Which note?' : task === 'sigs' ? `Which ${mode} key?` : 'Which chord?'}</h1>
          <p className="sub">{task === 'notes' ? 'Name it, or play it on the keys' : task === 'sigs' ? 'Read the signature' : 'Name it, or play all its notes together'}</p>
        </div>
        <div className="s-staff">
          {q.note ? <Staff clef={clef === 'grand' ? 'grand' : q.note.clef} chords={[{ notes: [q.note.midi], names: [noteName(q.note.note)], tones: answer ? [answer.ok ? 'ok' : 'target'] : undefined }]} /> : null}
          {task === 'sigs' ? <Staff clef={clef} keySig={q.sig} chords={[]} /> : null}
          {q.chord ? <Staff chords={[{ notes: q.chord.midis, names: q.chord.names, tones: answer ? q.chord.midis.map(() => (answer.ok ? 'ok' : 'target')) : undefined }]} /> : null}
        </div>
        {task === 'notes' && staffNote ? (
          naturalsOnly
            ? <Answers options={letterAnswers} right={String(staffNote.letter)} picked={answer ? answer.picked ?? (answer.ok ? String(staffNote.letter) : '') : null} onPick={(id) => settle(Number(id) === staffNote.letter, id)} />
            : <NotePicker answer={staffNote} picked={answer ? (answer.picked ? (JSON.parse(answer.picked) as Note) : staffNote) : null} onPick={(n) => settle(sameNote(n, staffNote), JSON.stringify(n))} />
        ) : null}
        {task === 'sigs' ? (
          <Answers className="sig" options={sigAnswers} right={String(q.sig)} picked={answer ? answer.picked : null} onPick={(id) => settle(Number(id) === q.sig, id)} />
        ) : null}
        {task === 'chords' ? (
          <Answers options={q.options.map((o) => ({ id: o, label: o }))} right={chordName} picked={answer ? answer.picked ?? chordName : null} onPick={(id) => settle(id === chordName, id)} />
        ) : null}

        <div className="s-status" aria-live="polite">
          {answer ? (
            <>
              <strong className={answer.ok ? 'good' : 'bad'}>
                {answer.ok ? '✓ ' : '✗ '}
                {q.note ? `${noteId(q.note)} on the ${q.note.clef} staff` : task === 'sigs' ? `${sigKeyName(q.sig, mode)}: ${q.sig === 0 ? 'no sharps or flats' : `${Math.abs(q.sig)} ${q.sig > 0 ? 'sharp' : 'flat'}${Math.abs(q.sig) > 1 ? 's' : ''}`}` : `${chordName}, ${INV_NAME[q.chord!.inv]}: ${q.chord!.names.join(' ')}`}
                {answer.ok ? ` · ${answer.secs.toFixed(1)} s` : ''}
              </strong>
              <button type="button" className="btn primary" onClick={() => next()}>Next <K>Space</K></button>
            </>
          ) : (
            <>
              {avg ? <span className="muted">Average {avg.toFixed(1)} s over the last {times.length}</span> : <span className="muted">Timed: aim for under 2 s.</span>}
              {task === 'chords' ? <button type="button" className="btn ghost small" onClick={() => settle(false, '')}>Show me <K>Space</K></button> : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

