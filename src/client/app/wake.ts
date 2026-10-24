// Keep the screen on while you are playing. With a MiniLab doing all the input
// nobody touches the phone, and it would dim and lock mid-exercise. The lock
// lets go after a few idle minutes so a forgotten tab doesn't drain the battery.

import { input } from '../midi/input';

const IDLE_MS = 4 * 60 * 1000;

export function keepAwake(): void {
  if (!('wakeLock' in navigator)) return;
  let lock: WakeLockSentinel | null = null;
  let asking = false;
  let lastActive = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const release = () => {
    void lock?.release().catch(() => {});
    lock = null;
  };
  const acquire = async () => {
    if (lock || asking || document.visibilityState !== 'visible') return;
    asking = true;
    try {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => {
        lock = null;
      });
    } catch {
      /* low battery mode or not allowed yet: try again on the next activity */
    }
    asking = false;
  };
  const active = () => {
    lastActive = performance.now();
    void acquire();
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => performance.now() - lastActive >= IDLE_MS - 50 && release(), IDLE_MS);
  };

  input.on(active);
  window.addEventListener('pointerdown', active);
  window.addEventListener('keydown', active);
  // the system drops the lock when the tab is hidden; take it back on return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && performance.now() - lastActive < IDLE_MS) void acquire();
  });
}
