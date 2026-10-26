import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { keyFromName, romanFor, secondaryLabel, type Key } from '../theory/keys';
import { progressionEvents, resolveChord, type CompStyle } from '../learn/music';
import { playEvents, stopAll } from './PlayButton';

export interface StripChord {
  token: string;
  symbol: string;
  numeral: string;
}

export function analyseTokens(tokens: string[], key: Key): StripChord[] {
  return tokens.map((t) => {
    const c = resolveChord(t, key);
    if (!c) return { token: t, symbol: '?', numeral: '?' };
    const isNumeral = c.label === t && !/^[A-G]/.test(t);
    const secondary = secondaryLabel(key, c.rootPc, c.typeId);
    const numeral = isNumeral ? t.replace(/b(?=[IVX])/gi, '♭').replace(/#(?=[IVX])/gi, '♯') : secondary ?? romanFor(key, c.rootPc, c.typeId);
    return { token: t, symbol: c.symbol, numeral };
  });
}

/** Chord strip with play/loop; highlights the sounding chord. */
export function ProgressionStrip({
  keyName, tokens, bpm = 96, style = 'block', beats = 2, caption, loopable = true, drums = false, onRemove, onAudition,
}: {
  keyName: string; tokens: string[]; bpm?: number; style?: CompStyle; beats?: number | number[]; caption?: string; loopable?: boolean; drums?: boolean;
  onRemove?: (i: number) => void; onAudition?: (i: number) => void;
}) {
  const key = keyFromName(keyName);
  const chords = analyseTokens(tokens, key);
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const loop = useRef(false);
  const raf = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    loop.current = false;
    cancelAnimationFrame(raf.current);
    if (timer.current) clearTimeout(timer.current);
    setPlaying(false);
    setCurrent(-1);
    stopAll();
  };
  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playOnce = async () => {
    const play = progressionEvents(key, tokens, { bpm, style, beats });
    setPlaying(true);
    const start = await playEvents(play.events, { onEnd: () => undefined });
    if (drums) scheduleDrums(start, play.duration, play.beat, style);
    const tick = () => {
      const t = audio.now() - audio.latency() - start;
      let idx = -1;
      play.times.forEach((x, i) => {
        if (t >= x) idx = i;
      });
      setCurrent(t > play.duration ? -1 : idx);
      if (t <= play.duration) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    timer.current = setTimeout(() => {
      if (loop.current) void playOnce();
      else {
        setPlaying(false);
        setCurrent(-1);
      }
    }, play.duration * 1000 + 90);
  };

  return (
    <div className="col">
      <div className="prog-slots">
        {chords.map((c, i) => (
          <div key={i} className={`prog-slot ${current === i ? 'playing' : ''}`} onClick={onAudition ? () => onAudition(i) : undefined} style={onAudition ? { cursor: 'pointer' } : undefined}>
            {onRemove ? <button type="button" className="x" aria-label={`Remove ${c.symbol}`} onClick={(e) => { e.stopPropagation(); onRemove(i); }}>×</button> : null}
            <div className="nm">{c.symbol}</div>
            <div className="sy">{c.numeral}</div>
          </div>
        ))}
        {!chords.length ? <span className="small muted">Empty — add chords below.</span> : null}
      </div>
      <div className="row between">
        <span className="caption">{caption}</span>
        <div className="row">
          {playing ? (
            <button type="button" className="btn small active" onClick={stop}>■ Stop</button>
          ) : (
            <>
              <button type="button" className="btn small" onClick={() => { loop.current = false; void playOnce(); }}>▶ Play</button>
              {loopable ? <button type="button" className="btn small" onClick={() => { loop.current = true; void playOnce(); }}>⟳ Loop</button> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Simple style-appropriate drum loop under a progression. */
export function scheduleDrums(start: number, duration: number, beat: number, style: CompStyle): void {
  const beats = Math.round(duration / beat);
  for (let b = 0; b < beats; b++) {
    const t = start + b * beat;
    if (style === 'funk') {
      if (b % 4 === 0) audio.drum('kick', t);
      if (b % 4 === 2) audio.drum('kick', t + beat * 0.75, 0.7);
      if (b % 2 === 1) audio.drum('snare', t, 0.8);
      for (let s = 0; s < 4; s++) audio.drum('hat', t + (s * beat) / 4, s % 2 ? 0.35 : 0.7);
    } else if (style === 'bossa') {
      // two-bar cross-stick figure over straight eighths, kick on 1 and 3 with pickups
      if (b % 2 === 0) audio.drum('kick', t, 0.6);
      if (b % 2 === 1) audio.drum('kick', t + beat * 0.5, 0.4);
      for (const s of [0, 0.5]) audio.drum('hat', t + s * beat, s ? 0.25 : 0.4);
      const bar = b % 8;
      for (const x of [0, 1.5, 3, 5, 6.5]) if (Math.floor(x) === bar) audio.drum('click', t + (x - bar) * beat, 0.5);
    } else if (style === 'swing') {
      audio.drum('hat', t, 0.8);
      if (b % 2 === 1) audio.drum('hat', t + beat * 0.66, 0.45);
      if (b % 2 === 1) audio.drum('click', t, 0.35);
    } else {
      if (b % 4 === 0) audio.drum('kick', t, 0.8);
      if (b % 2 === 1) audio.drum('snare', t, 0.5);
      audio.drum('hat', t, 0.45);
    }
  }
}
