import { useEffect, useState, useSyncExternalStore } from 'react';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { detectChord } from '../theory/chords';
import { pcName } from '../theory/core';
import { useRoute, href } from '../app/router';
import { setLiveContext } from '../app/live';
import { store } from '../app/store';
import { useMini } from '../app/createStore';
import { inProgress, workout } from '../app/workout';
import { closeLesson, setSheet, ui } from '../app/ui';
import { TOPIC_BY_ID } from '../learn/library';
import { TopicView } from './learn/TopicView';
import { toggleExerciseHelp } from './learn/ExerciseRunner';
import { Icon } from './Icon';
import { Keyboard } from './Keyboard';
import { HomePage } from './pages/HomePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { LibraryPage } from './pages/LibraryPage';
import { GymPage } from './pages/GymPage';
import { LabPage } from './pages/LabPage';
import { SynthPage } from './pages/SynthPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

const NAV = [
  { id: '', label: 'Today', icon: 'today' },
  { id: 'workout', label: 'Break workout', icon: 'workout' },
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'gym', label: 'Gym', icon: 'gym' },
  { id: 'lab', label: 'Lab', icon: 'lab' },
  { id: 'synth', label: 'DX7 Lab', icon: 'synth' },
  { id: 'progress', label: 'Progress', icon: 'progress' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

let inputVersion = 0;
input.onChange(() => {
  inputVersion++;
});
const subscribeInput = (fn: () => void) => input.onChange(fn);

function useInputVersion(): number {
  return useSyncExternalStore(subscribeInput, () => inputVersion);
}

function useAudioState(): string {
  return useSyncExternalStore((fn) => audio.onState(fn), () => audio.state);
}

const DOCK_KEY = 'theory-break:dock';
const dockDefault = () => {
  try {
    return localStorage.getItem(DOCK_KEY) !== 'hidden';
  } catch {
    return true;
  }
};

export function App() {
  const route = useRoute();
  const page = route[0] ?? '';
  useInputVersion();
  const audioState = useAudioState();
  const [dock, setDock] = useState(dockDefault);
  const { lesson, sheet } = useMini(ui, (u) => u);
  const syncState = useSyncExternalStore(store.subscribe, () => store.syncState);
  const running = useMini(workout, (w) => (inProgress(w) ? `${w.idx + 1}/${w.plan.blocks.length}` : null));

  useEffect(() => {
    setLiveContext(page === 'synth' ? 'synth' : 'learn');
  }, [page]);

  useEffect(() => {
    try {
      localStorage.setItem(DOCK_KEY, dock ? 'shown' : 'hidden');
    } catch {
      /* storage disabled */
    }
  }, [dock]);

  // "?" opens the help of the question on screen (or the shortcut sheet); Escape closes overlays
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;
      if (e.key === '?') {
        if (ui.get().lesson || ui.get().sheet || !toggleExerciseHelp()) setSheet(!ui.get().sheet);
      } else if (e.key === 'Escape') {
        closeLesson();
        setSheet(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const held = input.heldNotes();
  const chord = held.length >= 3 ? detectChord(held) : null;
  const midiPill = input.anyMidiConnected
    ? <span className="pill good"><i className="dot" /> {input.minilabConnected ? 'MiniLab 3' : 'MIDI'}</span>
    : input.status === 'unsupported'
      ? <span className="pill warn" title="This browser has no Web MIDI (use Chrome or Edge). Computer keys work.">Computer keys · no Web MIDI</span>
      : input.status === 'denied'
        ? <span className="pill warn" title="MIDI permission was refused — allow it in the site settings (padlock icon) and reload. Computer keys work meanwhile.">Computer keys · MIDI blocked</span>
        : <button type="button" className="pill warn" title="Plug in a MIDI keyboard any time — it is picked up automatically." onClick={() => void input.requestMidi()}>Computer keys · no MIDI device</button>;

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Main">
        <div className="brand"><span className="brand-badge">♪</span> Theory Break</div>
        {NAV.map((n) => (
          <a key={n.id} href={href(n.id)} className={`nav-link ${page === n.id ? 'active' : ''}`}>
            <span className="nav-icon"><Icon name={n.icon} /></span>
            {n.label}
            {n.id === 'workout' && running && page !== 'workout' ? <span className="badge accent" style={{ marginLeft: 'auto' }}>{running}</span> : null}
          </a>
        ))}
        <div className="sidebar-foot">
          <button type="button" className="btn small ghost nowrap" onClick={() => setSheet(true)}><Icon name="keyboard" size={15} /> Shortcuts</button>
          <div style={{ marginTop: 6 }}>{syncState === 'synced' ? 'Progress synced to server' : syncState === 'offline' ? 'Saved locally (server offline)' : 'Saved locally'}</div>
        </div>
      </nav>
      <div className="main">
        <header className="topbar">
          {midiPill}
          {audioState !== 'running' ? (
            <button type="button" className="pill warn" onClick={() => void audio.init()}>
              {audioState === 'error' ? `Audio error: ${audio.error}` : 'Click (or press a key) to enable audio'}
            </button>
          ) : (
            <span className="pill good"><i className="dot" /> Audio</span>
          )}
          {running && page !== 'workout' ? <a className="pill warn" href={href('workout')}>Workout paused at block {running} — resume</a> : null}
          <span className="spacer" />
          <span className="chord-now" aria-live="polite">{chord ? chord.name : held.map((n) => pcName(n)).join(' ')}</span>
          <button type="button" className="btn small ghost" onClick={() => setDock(!dock)}>{dock ? 'Hide keys' : 'Show keys'}</button>
        </header>
        {page === '' && <HomePage />}
        {page === 'workout' && <WorkoutPage />}
        {page === 'library' && <LibraryPage topicId={route[1]} />}
        {page === 'gym' && <GymPage skillId={route[1]} />}
        {page === 'lab' && <LabPage tab={route[1]} />}
        {page === 'synth' && <SynthPage />}
        {page === 'progress' && <ProgressPage />}
        {page === 'settings' && <SettingsPage />}
      </div>
      {dock ? (
        <div className="dock">
          <div className="dock-head">
            <span>Computer keys: <span className="kbd">A</span>–<span className="kbd">'</span> play C{input.qwertyOctave}–F{input.qwertyOctave + 1} · <span className="kbd">Z</span>/<span className="kbd">X</span> octave · <span className="kbd">1</span>–<span className="kbd">8</span> pads</span>
            <span className="spacer" style={{ flex: 1 }} />
            <span>{page === 'synth' ? 'Playing: DX7 Lab patch' : 'Playing: lesson sound'}</span>
          </div>
          <Keyboard
            range={[36, 84]}
            held={held}
            keyLabels={input.qwertyEnabled ? input.qwertyLabels() : undefined}
            onDown={(m) => input.screenNoteOn(m)}
            onUp={(m) => input.screenNoteOff(m)}
            ariaLabel="On-screen keyboard"
          />
        </div>
      ) : null}
      {sheet ? <HelpSheet onClose={() => setSheet(false)} /> : null}
      {lesson && TOPIC_BY_ID[lesson] ? <LessonDrawer id={lesson} /> : null}
    </div>
  );
}

/** A lesson in a side drawer, opened from a drill, so the drill keeps its place. */
function LessonDrawer({ id }: { id: string }) {
  const topic = TOPIC_BY_ID[id];
  return (
    <div className="overlay drawer-wrap" onClick={closeLesson}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Lesson: ${topic.title}`} onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <div><div className="tiny faint upper">Lesson</div><h2 style={{ margin: 0 }}>{topic.title}</h2></div>
          <div className="row">
            <a className="btn small ghost" href={href(`library/${topic.id}`)} onClick={closeLesson}>Open as page</a>
            <button type="button" className="btn small" onClick={closeLesson}>Back to the drill <span className="kbd">Esc</span></button>
          </div>
        </div>
        <p className="muted">{topic.summary}</p>
        <TopicView topic={topic} embedded />
      </aside>
    </div>
  );
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ['A W S E D F T G Y H U J K O L P ; \'', 'Play notes (piano layout: A = C, W = C♯ … \' = F an octave up)'],
    ['Z / X', 'Octave down / up for the computer keys'],
    ['1 – 8', 'Pads: pick answer 1–8 · after answering, next question · in the DX7 Lab: operators 1–6, voices ◀ ▶'],
    ['Enter or Space', 'Next question · start a rhythm count-in · submit a chord you built'],
    ['Space', 'Tap (rhythm drills)'],
    ['Backspace', 'Clear the chord you are building · take back the last note of a line'],
    ['R', 'Replay the question audio'],
    ['?', 'On a question: hint, method, solution and lesson. Elsewhere: this sheet. Esc closes'],
  ];
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Keys and shortcuts" onClick={onClose}>
      <div className="card sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row between"><h2>Keys &amp; shortcuts</h2><button type="button" className="btn small ghost" onClick={onClose}>Close</button></div>
        <p className="small muted">
          No MIDI keyboard needed: the computer keys play and answer everything. Chord drills: with computer keys or clicks you build the chord note by note (press a key again to remove it) and submit with Enter; on a MIDI keyboard you hold the chord and release. A MIDI device plugged in later is picked up automatically — keys, pads 1–8 and knobs then work alongside the computer keys.
        </p>
        <table className="t">
          <tbody>{rows.map(([k, v]) => <tr key={k}><td className="nowrap"><span className="kbd">{k}</span></td><td>{v}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
