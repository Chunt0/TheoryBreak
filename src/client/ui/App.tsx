import { useEffect, useState, useSyncExternalStore } from 'react';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { detectChord } from '../theory/chords';
import { pcName } from '../theory/core';
import { useRoute, href } from '../app/router';
import { setLiveContext } from '../app/live';
import { store } from '../app/store';
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
  { id: '', label: 'Today', icon: '☀' },
  { id: 'workout', label: 'Break workout', icon: '⏱' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'gym', label: 'Gym', icon: '🏋' },
  { id: 'lab', label: 'Lab', icon: '🧪' },
  { id: 'synth', label: 'DX7 Lab', icon: '🎛' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
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

export function App() {
  const route = useRoute();
  const page = route[0] ?? '';
  useInputVersion();
  const audioState = useAudioState();
  const [dock, setDock] = useState(true);
  const syncState = useSyncExternalStore(store.subscribe, () => store.syncState);

  useEffect(() => {
    setLiveContext(page === 'synth' ? 'synth' : 'learn');
  }, [page]);

  const held = input.heldNotes();
  const chord = held.length >= 3 ? detectChord(held) : null;
  const midiPill = input.status === 'unsupported'
    ? <span className="pill bad" title="Use Chrome or Edge for Web MIDI">MIDI unsupported</span>
    : input.status === 'denied'
      ? <span className="pill bad">MIDI blocked</span>
      : input.minilabConnected
        ? <span className="pill good"><i className="dot" /> MiniLab 3</span>
        : input.anyMidiConnected
          ? <span className="pill good"><i className="dot" /> MIDI</span>
          : <button type="button" className="pill warn" onClick={() => void input.requestMidi()}>No MIDI — QWERTY active</button>;

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Main">
        <div className="brand"><span className="brand-badge">♪</span> Theory Break</div>
        {NAV.map((n) => (
          <a key={n.id} href={href(n.id)} className={`nav-link ${page === n.id ? 'active' : ''}`}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </a>
        ))}
        <div className="sidebar-foot">
          Pads 1–8 answer · Enter = next · R = replay
          <br />
          {syncState === 'synced' ? 'Progress synced to server' : syncState === 'offline' ? 'Saved locally (server offline)' : 'Saved locally'}
        </div>
      </nav>
      <div className="main">
        <header className="topbar">
          {midiPill}
          {audioState !== 'running' ? (
            <button type="button" className="pill warn" onClick={() => void audio.init()}>
              {audioState === 'error' ? `Audio error: ${audio.error}` : '🔇 Click to enable audio'}
            </button>
          ) : (
            <span className="pill good"><i className="dot" /> Audio</span>
          )}
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
            <span>Octave {input.qwertyOctave} · Z/X shift QWERTY</span>
            <span className="spacer" style={{ flex: 1 }} />
            <span>{page === 'synth' ? 'Playing: DX7 Lab patch' : 'Playing: lesson sound'}</span>
          </div>
          <Keyboard
            range={[36, 84]}
            held={held}
            onDown={(m) => input.screenNoteOn(m)}
            onUp={(m) => input.screenNoteOff(m)}
            ariaLabel="On-screen keyboard"
          />
        </div>
      ) : null}
    </div>
  );
}
