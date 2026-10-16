import { useRef } from 'react';
import { scaleOutLevel, pitchEgOctaves } from '../../audio/dx7/dsp';

type R4 = [number, number, number, number];

interface Props {
  rates: R4;
  levels: R4;
  onChange: (rates: R4, levels: R4) => void;
  kind: 'amp' | 'pitch';
  height?: number;
}

const W = 360;
const HOLD = 40;

/** Approximate DX7 operator EG segment time in ms (output level 99, no rate scaling). */
export function ampSegmentMs(rate: number, from: number, to: number): number {
  const lv = (l: number) => Math.max(16, ((scaleOutLevel(l) >> 1) << 6) + 4064 - 4256);
  const a = lv(from);
  const b = lv(to);
  const q = Math.min(63, (rate * 41) >> 6);
  const inc = (4 + (q & 3)) * Math.pow(2, (q >> 2) - 14);
  let n: number;
  if (b > a) {
    const a0 = Math.max(a, 1716);
    n = b <= a0 ? 0 : (256 / inc) * Math.log((4352 - a0) / (4352 - b));
  } else n = (a - b) / inc;
  return n / 44.1;
}

const PITCH_RATE_OCT_S = (rate: number) => {
  const tab = [1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 16, 16, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 33, 34, 36, 37, 38, 39, 41, 42, 44, 46, 47, 49, 51, 53, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 79, 82, 85, 88, 91, 94, 98, 102, 106, 110, 115, 120, 125, 130, 135, 141, 147, 153, 159, 165, 171, 178, 185, 193, 202, 211, 232, 243, 254, 255];
  return tab[rate] / 21.3;
};

export function pitchSegmentMs(rate: number, from: number, to: number): number {
  return (Math.abs(pitchEgOctaves(to) - pitchEgOctaves(from)) / PITCH_RATE_OCT_S(rate)) * 1000;
}

const segW = (ms: number) => Math.min(110, 6 + Math.log2(1 + ms / 8) * 11);

export const fmtMs = (ms: number) => (ms < 1 ? '0' : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`);

export function EnvelopeEditor({ rates, levels, onChange, kind, height = 120 }: Props) {
  const drag = useRef<{ i: number; x: number; y: number; r: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const seg = kind === 'amp' ? ampSegmentMs : pitchSegmentMs;
  const start = levels[3];
  const ms = [seg(rates[0], start, levels[0]), seg(rates[1], levels[0], levels[1]), seg(rates[2], levels[1], levels[2]), seg(rates[3], levels[2], levels[3])];
  const pad = 10;
  const yOf = (l: number) => pad + (1 - l / 99) * (height - pad * 2);
  const xs: number[] = [pad];
  xs.push(xs[0] + segW(ms[0]));
  xs.push(xs[1] + segW(ms[1]));
  xs.push(xs[2] + segW(ms[2]));
  xs.push(xs[3] + HOLD);
  xs.push(xs[4] + segW(ms[3]));
  const scaleX = Math.min(1, (W - pad * 2) / (xs[5] - pad));
  const X = (x: number) => pad + (x - pad) * scaleX;
  const pts = [
    { x: X(xs[0]), y: yOf(start) },
    { x: X(xs[1]), y: yOf(levels[0]) },
    { x: X(xs[2]), y: yOf(levels[1]) },
    { x: X(xs[3]), y: yOf(levels[2]) },
    { x: X(xs[4]), y: yOf(levels[2]) },
    { x: X(xs[5]), y: yOf(levels[3]) },
  ];
  const path = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const handles = [1, 2, 3, 5]; // point index → stage 0..3

  const toLocal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * height };
  };

  return (
    <div className="eg">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${height}`} role="img" aria-label={kind === 'amp' ? 'Amplitude envelope' : 'Pitch envelope'}>
        {kind === 'pitch' ? <line className="guide" x1={0} x2={W} y1={yOf(50)} y2={yOf(50)} /> : null}
        <line className="guide" x1={pts[3].x} x2={pts[3].x} y1={0} y2={height} />
        <line className="guide" x1={pts[4].x} x2={pts[4].x} y1={0} y2={height} />
        {kind === 'amp' ? <path className="area" d={`${path} L ${pts[5].x} ${height - pad} L ${pts[0].x} ${height - pad} Z`} /> : null}
        <path className="curve" d={path} />
        <text className="seglbl" x={(pts[3].x + pts[4].x) / 2 - 12} y={height - 2}>key up</text>
        {handles.map((pi, stage) => (
          <g key={pi}>
            <text className="seglbl" x={(pts[pi - 1].x + pts[pi].x) / 2 - 10} y={12}>{fmtMs(ms[stage])}</text>
            <circle
              className="pt"
              cx={pts[pi].x}
              cy={pts[pi].y}
              r={6}
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture(e.pointerId);
                const l = toLocal(e);
                drag.current = { i: stage, x: l.x, y: l.y, r: rates[stage] };
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d) return;
                const l = toLocal(e);
                const nl = Math.round(Math.max(0, Math.min(99, (1 - (l.y - pad) / (height - pad * 2)) * 99)));
                const nr = Math.round(Math.max(0, Math.min(99, d.r - (l.x - d.x) / 2.2)));
                const r = [...rates] as R4;
                const lv = [...levels] as R4;
                r[d.i] = nr;
                lv[d.i] = nl;
                onChange(r, lv);
              }}
              onPointerUp={() => (drag.current = null)}
            >
              <title>{`Stage ${stage + 1}: rate ${rates[stage]}, level ${levels[stage]} — drag ↕ level, ↔ time`}</title>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
