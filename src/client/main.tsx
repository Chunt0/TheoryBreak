import { createRoot } from 'react-dom/client';
import { audio, PART } from './audio/engine';
import { presetByName } from './audio/dx7/presets';
import { input } from './midi/input';
import { store } from './app/store';
import { initSynthFromStore } from './app/synthState';
import { initRackFromStore } from './app/rackState';
import { wireLive } from './app/live';
import { keepAwake } from './app/wake';
import { initTheme } from './app/themes';
import { SimpleApp } from './simple/SimpleApp';

function applySettings(): void {
  const s = store.get().settings;
  audio.setMaster(s.masterVolume);
  audio.setReverb(s.reverb);
  audio.setMetronome(s.metronome);
  audio.setDroneLevel(s.drone);
  audio.setPatch(PART.lesson, presetByName(s.lessonPatch));
  audio.setInstrument(s.instrument);
  input.pads.channel = s.padChannel;
}

store.loadLocal();
initTheme();
applySettings();
initSynthFromStore();
initRackFromStore();
input.attachKeyboard(window);
wireLive();
keepAwake();
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
window.addEventListener('pagehide', () => store.flush());

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
  initRackFromStore();
});

// Installed to the home screen, the app opens (and works) with no connection: a
// service worker keeps the files. Dev builds clear it so edits always show.
if ('serviceWorker' in navigator && window.isSecureContext) {
  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => {}));
    // a new build's worker took over from an older one: reload once so this page runs the new code too
    const hadWorker = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadWorker || reloaded) return;
      reloaded = true;
      store.flush();
      location.reload();
    });
  } else {
    void navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister()));
  }
}

// Handy for poking at the engine from DevTools.
(window as unknown as Record<string, unknown>).app = { audio, input, store };

createRoot(document.getElementById('root')!).render(<SimpleApp />);
