import { useEffect, useRef, useState, type ReactNode } from 'react';
import { audio, type NoteEvent, type PartId } from '../audio/engine';

let current: (() => void) | null = null;

/** Play note events; only one example plays at a time. */
export async function playEvents(events: NoteEvent[], opts: { part?: PartId; onEnd?: () => void } = {}): Promise<number> {
  await audio.init();
  current?.();
  audio.stop();
  const { start, end } = audio.play(events, { part: opts.part });
  const ms = Math.max(0, (end - audio.now()) * 1000);
  let cancelled = false;
  const timer = setTimeout(() => {
    if (!cancelled) opts.onEnd?.();
  }, ms + 50);
  current = () => {
    cancelled = true;
    clearTimeout(timer);
    opts.onEnd?.();
  };
  return start;
}

export function stopAll(): void {
  current?.();
  current = null;
  audio.stop();
}

export function PlayButton({ events, children, className = 'btn small', title }: { events: () => NoteEvent[]; children: ReactNode; className?: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);
  return (
    <button
      type="button"
      className={`${className} ${playing ? 'active' : ''}`}
      title={title}
      onClick={() => {
        if (playing) return stopAll();
        setPlaying(true);
        void playEvents(events(), { onEnd: () => mounted.current && setPlaying(false) });
      }}
    >
      {playing ? '■' : '▶'} {children}
    </button>
  );
}
