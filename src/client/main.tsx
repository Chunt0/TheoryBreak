import { createRoot } from 'react-dom/client';
import { audio, PART } from './audio/engine';
import { presetByName } from './audio/dx7/presets';
import { input } from './midi/input';
import { store } from './app/store';
import { initSynthFromStore } from './app/synthState';
import { wireLive } from './app/live';
import { App } from './ui/App';
import { flushPracticeSets } from './ui/learn/ExerciseRunner';

function applySettings(): void {
  const s = store.get().settings;
  audio.setMaster(s.masterVolume);
  audio.setReverb(s.reverb);
  audio.setMetronome(s.metronome);
  audio.setPatch(PART.lesson, presetByName(s.lessonPatch));
  input.pads.channel = s.padChannel;
}

store.loadLocal();
applySettings();
initSynthFromStore();
input.attachKeyboard(window);
wireLive();
void input.requestMidi();

// Browsers only allow audio after a user gesture.
const unlock = () => {
  void audio.init();
  if (audio.running) {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  }
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
window.addEventListener('pagehide', () => {
  flushPracticeSets();
  store.flush();
});

// Space/Enter drive the drills. A button keeps focus after a mouse click, and
// the next Space/Enter would silently press it again ("Next block" mid-question),
// so mouse-clicked buttons give focus back. Keyboard-focused buttons keep it.
document.addEventListener('click', (e) => {
  if (e.detail === 0) return;
  const el = (e.target as Element | null)?.closest?.('button, a.btn, [role="button"]');
  if (el instanceof HTMLElement) el.blur();
});

void store.syncFromServer().then(() => {
  applySettings();
  initSynthFromStore();
});

// Handy for poking at the engine from DevTools.
(window as unknown as Record<string, unknown>).theoryBreak = { audio, input, store };

createRoot(document.getElementById('root')!).render(<App />);
