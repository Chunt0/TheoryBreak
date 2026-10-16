import { useRef } from 'react';
import { useMini } from '../../app/createStore';
import { startLearn, synth } from '../../app/synthState';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** default for double-click reset */
  dflt?: number;
  format?: (v: number) => string;
  size?: number;
  /** parameter path for MIDI learn (right-click to learn) */
  learn?: string;
  title?: string;
}

const A0 = -135;
const A1 = 135;

function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export function Knob({ label, value, min, max, onChange, dflt, format, size = 40, learn, title }: Props) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const learning = useMini(synth, (s) => !!learn && s.learn === learn);
  const t = (value - min) / (max - min || 1);
  const angle = A0 + t * (A1 - A0);
  const c = size / 2;
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(v))));

  return (
    <div className={`knob ${learning ? 'learn' : ''}`} title={title ?? (learn ? `${label} — right-click to MIDI-learn` : label)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, v: value };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const range = max - min;
          const sens = e.shiftKey ? 600 : 160;
          set(drag.current.v + ((drag.current.y - e.clientY) / sens) * range);
        }}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={() => dflt !== undefined && set(dflt)}
        onWheel={(e) => set(value + (e.deltaY < 0 ? 1 : -1))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') set(value + 1);
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') set(value - 1);
        }}
        onContextMenu={(e) => {
          if (!learn) return;
          e.preventDefault();
          startLearn(learn);
        }}
      >
        <path d={arc(c, c, c - 4, A0, A1)} stroke="var(--bg-sunk)" strokeWidth={4} fill="none" strokeLinecap="round" />
        {t > 0.001 ? <path d={arc(c, c, c - 4, A0, angle)} stroke="var(--accent)" strokeWidth={4} fill="none" strokeLinecap="round" /> : null}
        <circle cx={c} cy={c} r={c - 9} fill="var(--bg-elev2)" stroke="var(--line-strong)" />
        <line
          x1={c}
          y1={c}
          x2={c + (c - 11) * Math.cos(((angle - 90) * Math.PI) / 180)}
          y2={c + (c - 11) * Math.sin(((angle - 90) * Math.PI) / 180)}
          stroke="var(--text)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <span className="kv">{format ? format(value) : value}</span>
      <span className="kl">{label}</span>
    </div>
  );
}
