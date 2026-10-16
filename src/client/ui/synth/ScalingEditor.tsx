import { useRef } from 'react';
import { scaleLevel } from '../../audio/dx7/dsp';
import { breakPointName, CURVE_NAMES, type Curve, type Operator } from '../../audio/dx7/patch';

interface Props {
  op: Operator;
  onChange: (patch: Partial<Operator>) => void;
}

const W = 360;
const H = 90;

/** Keyboard level scaling: drag the breakpoint; curves/depths via controls. */
export function ScalingEditor({ op, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lo = 21;
  const hi = 108;
  const xOf = (midi: number) => ((midi - lo) / (hi - lo)) * W;
  const values = Array.from({ length: hi - lo + 1 }, (_, i) => scaleLevel(lo + i, op));
  const maxAbs = Math.max(30, ...values.map(Math.abs));
  const yOf = (v: number) => H / 2 - (v / maxAbs) * (H / 2 - 8);
  const path = values.map((v, i) => `${i ? 'L' : 'M'} ${xOf(lo + i)} ${yOf(v)}`).join(' ');
  const bpMidi = op.breakPoint + 21;

  const setFromEvent = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const midi = lo + ((e.clientX - r.left) / r.width) * (hi - lo);
    onChange({ breakPoint: Math.max(0, Math.min(99, Math.round(midi - 21))) });
  };

  return (
    <div className="ks">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          dragging.current = true;
          setFromEvent(e);
        }}
        onPointerMove={(e) => dragging.current && setFromEvent(e)}
        onPointerUp={() => (dragging.current = false)}
        role="img"
        aria-label="Keyboard level scaling"
        style={{ cursor: 'ew-resize' }}
      >
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="var(--line-strong)" strokeDasharray="3 3" />
        {[24, 36, 48, 60, 72, 84, 96].map((m) => <text key={m} x={xOf(m) - 6} y={H - 3} fontSize={9} fill="var(--text-faint)">C{m / 12 - 1}</text>)}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={xOf(bpMidi)} x2={xOf(bpMidi)} y1={4} y2={H - 12} stroke="var(--tone-target)" strokeWidth={2} />
        <text x={xOf(bpMidi) + 4} y={12} fontSize={10} fill="var(--tone-target)">{breakPointName(op.breakPoint)}</text>
      </svg>
      <div className="row" style={{ marginTop: 6, gap: 6 }}>
        <span className="tiny faint">Left</span>
        <div className="seg">{CURVE_NAMES.map((n, i) => <button key={n} type="button" className={op.leftCurve === i ? 'on' : ''} onClick={() => onChange({ leftCurve: i as Curve })}>{n}</button>)}</div>
        <span className="tiny faint">Right</span>
        <div className="seg">{CURVE_NAMES.map((n, i) => <button key={n} type="button" className={op.rightCurve === i ? 'on' : ''} onClick={() => onChange({ rightCurve: i as Curve })}>{n}</button>)}</div>
      </div>
    </div>
  );
}
