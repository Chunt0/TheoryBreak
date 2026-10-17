import { useRef } from 'react';
import { isBlackKey, mod, octaveOf } from '../theory/core';
import type { Tone } from '../learn/types';

export interface KeyMark {
  label?: string;
  tone?: Tone;
}

interface Props {
  /** inclusive MIDI range; snapped outward to white keys */
  range: [number, number];
  marks?: Record<number, KeyMark>;
  held?: number[];
  onDown?: (midi: number) => void;
  onUp?: (midi: number) => void;
  showOctaveLabels?: boolean;
  /** computer-key letters printed on the keys they play */
  keyLabels?: Record<number, string>;
  className?: string;
  ariaLabel?: string;
}

const WHITE_W = 24;
const WHITE_H = 120;
const BLACK_W = 14;
const BLACK_H = 76;
// black key x-offset (relative to the preceding white key) by pitch class
const BLACK_OFFSET: Record<number, number> = { 1: 15, 3: 19, 6: 14, 8: 17, 10: 20 };

export function Keyboard({ range, marks = {}, held = [], onDown, onUp, showOctaveLabels = true, keyLabels, className = '', ariaLabel = 'Piano keyboard' }: Props) {
  let lo = range[0];
  let hi = range[1];
  while (isBlackKey(lo)) lo--;
  while (isBlackKey(hi)) hi++;
  const whites: number[] = [];
  const blacks: { midi: number; x: number }[] = [];
  for (let m = lo; m <= hi; m++) {
    if (!isBlackKey(m)) whites.push(m);
    else blacks.push({ midi: m, x: (whites.length - 1) * WHITE_W + BLACK_OFFSET[mod(m, 12)] });
  }
  const width = whites.length * WHITE_W;
  const heldSet = new Set(held);
  // one entry per finger / mouse button, so several keys can be held and each lets go of its own note
  const down = useRef(new Map<number, number>());
  const playable = !!onDown;

  const release = (e: { pointerId: number }) => {
    const m = down.current.get(e.pointerId);
    if (m === undefined) return;
    down.current.delete(e.pointerId);
    onUp?.(m);
  };
  const press = (m: number, e: React.PointerEvent) => {
    if (!onDown) return;
    e.preventDefault();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer already gone: the window-level listener below still ends the note */
    }
    release(e);
    down.current.set(e.pointerId, m);
    onDown(m);
    // safety net: a release anywhere on the page ends this note even if the key element missed it
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', end, true);
      release(ev);
    };
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
  };

  const markEl = (m: number, cx: number, black: boolean) => {
    const mk = marks[m];
    if (!mk) return null;
    const cy = black ? BLACK_H - 14 : WHITE_H - 16;
    return (
      <g key={`m${m}`} className="mark">
        <circle cx={cx} cy={cy} r={black ? 6.5 : 9} className={`tone-${mk.tone ?? 'chord'}`} />
        {mk.label ? (
          <text x={cx} y={black ? cy - 12 : cy - 16} className={`lbl ${black ? 'onb' : ''}`}>
            {mk.label}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <svg
      className={`kb ${playable ? 'playable' : ''} ${className}`}
      viewBox={`0 0 ${width} ${WHITE_H + 2}`}
      role="img"
      aria-label={ariaLabel}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {whites.map((m, i) => (
        <g key={m}>
          <rect
            x={i * WHITE_W + 0.5}
            y={0.5}
            width={WHITE_W - 1}
            height={WHITE_H}
            rx={3}
            className={`w ${heldSet.has(m) ? 'held' : ''}`}
            onPointerDown={(e) => press(m, e)}
          />
          {showOctaveLabels && mod(m, 12) === 0 ? (
            <text x={i * WHITE_W + WHITE_W / 2} y={WHITE_H - 4} className="clabel">
              C{octaveOf(m)}
            </text>
          ) : null}
        </g>
      ))}
      {whites.map((m, i) => markEl(m, i * WHITE_W + WHITE_W / 2, false))}
      {keyLabels
        ? whites.map((m, i) => (keyLabels[m] ? <text key={`k${m}`} x={i * WHITE_W + WHITE_W / 2} y={WHITE_H - 20} className="klabel">{keyLabels[m]}</text> : null))
        : null}
      {blacks.map((b) => (
        <rect
          key={b.midi}
          x={b.x}
          y={0.5}
          width={BLACK_W}
          height={BLACK_H}
          rx={2}
          className={`b ${heldSet.has(b.midi) ? 'held' : ''}`}
          onPointerDown={(e) => press(b.midi, e)}
        />
      ))}
      {blacks.map((b) => markEl(b.midi, b.x + BLACK_W / 2, true))}
      {keyLabels
        ? blacks.map((b) => (keyLabels[b.midi] ? <text key={`k${b.midi}`} x={b.x + BLACK_W / 2} y={BLACK_H - 8} className="klabel onb">{keyLabels[b.midi]}</text> : null))
        : null}
    </svg>
  );
}
