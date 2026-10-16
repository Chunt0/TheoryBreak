import { N, octaveOf, parseNote, spellPc } from '../theory/core';
import type { StaffChord } from '../learn/types';

interface Props {
  chords: StaffChord[];
  /** four-voice chorale layout: S/A on treble (stems up/down), T/B on bass */
  satb?: boolean;
  ariaLabel?: string;
}

const GAP = 10; // staff line spacing
const HALF = GAP / 2;
const LEFT = 64;
const COL = 64;
const TREBLE_TOP = 30;
const BASS_TOP = TREBLE_TOP + GAP * 4 + 50;
const TREBLE_BOTTOM_STEP = 2 + 7 * 4; // E4
const BASS_BOTTOM_STEP = 4 + 7 * 2; // G2

interface Placed {
  step: number;
  acc: number;
  treble: boolean;
  stemUp?: boolean;
}

function place(midi: number, name: string | undefined): { step: number; acc: number } {
  const n = (name && parseNote(name)) || spellPc(midi, 'auto') || N('C');
  const oct = octaveOf(midi - n.acc);
  return { step: n.letter + 7 * oct, acc: n.acc };
}

const yOf = (p: Placed) =>
  p.treble ? TREBLE_TOP + GAP * 4 - (p.step - TREBLE_BOTTOM_STEP) * HALF : BASS_TOP + GAP * 4 - (p.step - BASS_BOTTOM_STEP) * HALF;

// plain glyphs every text font has (𝄪/𝄫 often render as boxes)
const ACC: Record<string, string> = { '-2': '♭♭', '-1': '♭', '1': '♯', '2': 'x' };

/** Smooth path through points (Catmull–Rom → cubic Bézier). */
function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const [p1, p2] = [pts[i], pts[i + 1]];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// one pen stroke each, in staff-space units around the G line / F line
const G_CLEF: [number, number][] = [
  [2.5, 1], [1, -2], [-2, -2.2], [-4, 0.5], [-3, 4.5], [1, 6.5], [5.5, 5], [8, 0.5], [7, -5], [3.5, -9], [1, -15], [1, -22], [2.5, -30],
  [5.5, -38], [8, -41], [8.5, -36], [6, -30], [2, -25], [-1.5, -19], [-1, -10], [0.5, 0], [1.5, 12], [2, 22], [0, 27], [-4, 26.5], [-4.5, 23],
];
const F_CLEF: [number, number][] = [[0, 0], [2, -6], [7, -9.5], [12.5, -8], [15, -2.5], [14.5, 5], [10.5, 13], [4, 20], [-1, 24]];

const trebleClef = smooth(G_CLEF.map(([x, y]) => [24 + x * 1.5, TREBLE_TOP + GAP * 3 + y]));
const bassClef = smooth(F_CLEF.map(([x, y]) => [16 + x, BASS_TOP + GAP + y]));

export function Staff({ chords, satb = false, ariaLabel }: Props) {
  const width = LEFT + chords.length * COL + 20;
  const height = BASS_TOP + GAP * 4 + 56;
  // keep a line on one staff when it fits there (ledger lines beat jumping staves)
  const all = chords.flatMap((c) => c.notes);
  const split = Math.min(...all) >= 55 ? -Infinity : Math.max(...all) <= 64 ? Infinity : 60;

  const lines = (top: number) =>
    Array.from({ length: 5 }, (_, i) => <line key={`${top}-${i}`} x1={10} x2={width - 8} y1={top + i * GAP} y2={top + i * GAP} className="st-line" />);

  return (
    <svg className="staff" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: Math.round(width * 1.45) }} role="img" aria-label={ariaLabel ?? 'Grand staff'}>
      {lines(TREBLE_TOP)}
      {lines(BASS_TOP)}
      <line x1={10} x2={10} y1={TREBLE_TOP} y2={BASS_TOP + GAP * 4} className="st-line" />
      <path d={trebleClef} className="st-clef" />
      <circle cx={24 - 4.2 * 1.5} cy={TREBLE_TOP + GAP * 3 + 23.6} r={2.3} className="st-dot" />
      <path d={bassClef} className="st-clef" />
      <circle cx={17} cy={BASS_TOP + GAP + 0.5} r={3} className="st-dot" />
      <circle cx={36} cy={BASS_TOP + GAP - 5} r={1.6} className="st-dot" />
      <circle cx={36} cy={BASS_TOP + GAP + 5} r={1.6} className="st-dot" />
      {chords.map((c, ci) => {
        const x = LEFT + ci * COL + COL / 2;
        const placed: Placed[] = c.notes.map((m, i) => {
          const { step, acc } = place(m, c.names?.[i]);
          const treble = satb && c.notes.length === 4 ? i >= 2 : m >= split;
          return { step, acc, treble, stemUp: satb ? i === 1 || i === 3 : undefined };
        });
        // displace seconds within a staff
        const order = placed.map((p, i) => ({ p, i })).sort((a, b) => a.p.step - b.p.step);
        const shift = new Map<number, number>();
        order.forEach((o, k) => {
          const prev = order[k - 1];
          if (prev && prev.p.treble === o.p.treble && o.p.step - prev.p.step === 1 && !shift.get(prev.i) && !satb) shift.set(o.i, 12);
        });
        return (
          <g key={ci}>
            {placed.map((p, i) => {
              const y = yOf(p);
              const nx = x + (shift.get(i) ?? 0);
              const ledgers: number[] = [];
              const bottom = p.treble ? TREBLE_BOTTOM_STEP : BASS_BOTTOM_STEP;
              for (let s = bottom - 2; s >= p.step; s -= 2) ledgers.push(s);
              for (let s = bottom + 10; s <= p.step; s += 2) ledgers.push(s);
              const tone = c.tones?.[i];
              return (
                <g key={i} className={tone ? `st-tone-${tone}` : undefined}>
                  {ledgers.map((s) => {
                    const ly = yOf({ ...p, step: s });
                    return <line key={s} x1={nx - 10} x2={nx + 10} y1={ly} y2={ly} className="st-line" />;
                  })}
                  {p.acc ? (
                    <text x={nx - (Math.abs(p.acc) > 1 ? 21 : 17)} y={y + 4} className="st-acc">
                      {ACC[String(p.acc)]}
                    </text>
                  ) : null}
                  <ellipse cx={nx} cy={y} rx={6.2} ry={4.4} transform={`rotate(-20 ${nx} ${y})`} className="st-head" />
                  {satb ? (
                    <line
                      x1={p.stemUp ? nx + 5.6 : nx - 5.6}
                      x2={p.stemUp ? nx + 5.6 : nx - 5.6}
                      y1={y + (p.stemUp ? -1 : 1)}
                      y2={y + (p.stemUp ? -32 : 32)}
                      className="st-stem"
                    />
                  ) : null}
                </g>
              );
            })}
            {c.label ? (
              <text x={x} y={height - 6} className="st-label">
                {c.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
