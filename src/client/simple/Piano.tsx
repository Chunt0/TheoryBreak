// The keyboard along the bottom of the app. Keys are drawn in real pixels so
// they fill the width at any size; marks are labelled chips, the computer-key
// letters sit on the keys they play and a bar underlines the stretch they reach.

import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyMark } from '../ui/Keyboard';

const isBlack = (m: number): boolean => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
// where a black key's centre sits relative to the gap between its white keys, in white-key widths
const BLACK_SHIFT: Record<number, number> = { 1: -0.08, 3: 0.08, 6: -0.11, 8: 0, 10: 0.11 };

/**
 * Shown range: `octaves` octaves from C3 plus the top C, moved by octaves when
 * marks or the computer keys' notes fall outside it. If no stretch from a C
 * holds them all, it starts on the white key at the lowest note instead.
 */
export function pianoRange(notes: number[], octaves: number): [number, number] {
  const span = octaves * 12;
  let lo = 48;
  if (notes.length) {
    const min = Math.min(...notes);
    const max = Math.max(...notes);
    while (max > lo + span && lo + 12 <= min) lo += 12;
    while (min < lo) lo -= 12;
    if (max > lo + span) {
      lo = min;
      while (isBlack(lo)) lo--;
    }
  }
  return [lo, lo + span];
}

interface Props {
  marks: Record<number, KeyMark>;
  held: number[];
  /** computer-key letter per MIDI note */
  letters: Record<number, string>;
  onDown: (midi: number) => void;
  onUp: (midi: number) => void;
}

export function Piano({ marks, held, letters, onDown, onUp }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });
  // one entry per finger / mouse button, so several keys can be held and each lets go of its own note
  const down = useRef(new Map<number, number>());

  useLayoutEffect(() => {
    const el = box.current!;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const release = (e: { pointerId: number }) => {
    const m = down.current.get(e.pointerId);
    if (m === undefined) return;
    down.current.delete(e.pointerId);
    onUp(m);
  };
  const press = (m: number, e: React.PointerEvent) => {
    e.preventDefault();
    release(e);
    down.current.set(e.pointerId, m);
    onDown(m);
    // a release anywhere on the page ends the note, even off the key
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', end, true);
      release(ev);
    };
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
  };

  const [lo, hi] = pianoRange([...Object.keys(marks), ...Object.keys(letters)].map(Number), w >= 980 ? 4 : w >= 620 ? 3 : 2);
  const whites: number[] = [];
  for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
  const kw = w / Math.max(1, whites.length);
  const bw = kw * 0.6;
  const bh = h * 0.6;
  const blackX = (m: number) => whites.indexOf(m - 1) * kw + kw * (1 + BLACK_SHIFT[((m % 12) + 12) % 12]) - bw / 2;
  const blacks: number[] = [];
  for (let m = lo + 1; m < hi; m++) if (isBlack(m)) blacks.push(m);
  const heldSet = new Set(held);
  const fs = Math.max(9, Math.min(12.5, kw * 0.28));
  const ch = Math.min(22, fs * 1.75);

  /** A mark: a labelled chip, or a dot when it has no label. */
  const chip = (m: number, cx: number, cy: number, width: number, black = false) => {
    const mk = marks[m];
    if (!mk) return null;
    return (
      <g key={`m${m}`} className={`mark tone-${mk.tone ?? 'chord'}`}>
        {mk.label ? (
          <>
            <rect x={cx - width / 2} y={cy - ch / 2} width={width} height={ch} rx={black ? Math.min(5, width / 4) : Math.min(ch, width) / 2} />
            <text x={cx} y={cy} style={{ fontSize: black ? fs * 0.88 : fs }}>{mk.label}</text>
          </>
        ) : (
          <circle cx={cx} cy={cy} r={Math.min(6, width / 3)} />
        )}
      </g>
    );
  };

  // the white keys the computer keys reach
  const reach = whites.map((m, i) => (letters[m] ? i : -1)).filter((i) => i >= 0);

  return (
    <div ref={box} className="s-piano">
      {w > 0 && h > 0 ? (
        <svg className="pk" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Keyboard">
          <defs>
            <linearGradient id="pk-black" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="pk-b0" />
              <stop offset="1" className="pk-b1" />
            </linearGradient>
          </defs>
          {whites.map((m, i) => (
            <rect key={m} x={i * kw + 0.5} y={-6} width={kw - 1} height={h + 5.5} rx={Math.min(6, kw / 6)} className={`w ${heldSet.has(m) ? 'held' : ''}`} onPointerDown={(e) => press(m, e)} />
          ))}
          {kw >= 30 ? whites.map((m, i) => (m % 12 === 0 ? <text key={`o${m}`} x={i * kw + 5} y={13} className="oct">C{m / 12 - 1}</text> : null)) : null}
          {reach.length ? <rect x={reach[0] * kw + 3} y={h - 3} width={(reach[reach.length - 1] - reach[0] + 1) * kw - 6} height={3} rx={1.5} className="reach" /> : null}
          {whites.map((m, i) => chip(m, i * kw + kw / 2, h - fs - 10 - ch / 2, Math.min(kw - 8, fs * 3.2)))}
          {whites.map((m, i) => (letters[m] ? <text key={`k${m}`} x={i * kw + kw / 2} y={h - 8} className="letter" style={{ fontSize: fs - 1 }}>{letters[m]}</text> : null))}
          {blacks.map((m) => (
            <rect key={m} x={blackX(m)} y={-4} width={bw} height={bh + 4} rx={Math.min(4, bw / 5)} className={`b ${heldSet.has(m) ? 'held' : ''}`} onPointerDown={(e) => press(m, e)} />
          ))}
          {blacks.map((m) => chip(m, blackX(m) + bw / 2, bh - 5 - ch / 2, bw - 4, true))}
          {blacks.map((m) => (letters[m] ? <text key={`k${m}`} x={blackX(m) + bw / 2} y={fs + 4} className="letter onb" style={{ fontSize: fs - 1 }}>{letters[m]}</text> : null))}
        </svg>
      ) : null}
    </div>
  );
}
