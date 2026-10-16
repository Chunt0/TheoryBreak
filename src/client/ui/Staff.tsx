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

const ACC: Record<string, string> = { '-2': '𝄫', '-1': '♭', '1': '♯', '2': '𝄪' };

export function Staff({ chords, satb = false, ariaLabel }: Props) {
  const width = LEFT + chords.length * COL + 20;
  const height = BASS_TOP + GAP * 4 + 46;

  const lines = (top: number) =>
    Array.from({ length: 5 }, (_, i) => <line key={`${top}-${i}`} x1={10} x2={width - 8} y1={top + i * GAP} y2={top + i * GAP} className="st-line" />);

  return (
    <svg className="staff" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: Math.round(width * 1.45) }} role="img" aria-label={ariaLabel ?? 'Grand staff'}>
      {lines(TREBLE_TOP)}
      {lines(BASS_TOP)}
      <line x1={10} x2={10} y1={TREBLE_TOP} y2={BASS_TOP + GAP * 4} className="st-line" />
      <text x={14} y={TREBLE_TOP + GAP * 3 + 8} className="st-clef">𝄞</text>
      <text x={16} y={BASS_TOP + GAP + 7} className="st-clef bass">𝄢</text>
      {chords.map((c, ci) => {
        const x = LEFT + ci * COL + COL / 2;
        const placed: Placed[] = c.notes.map((m, i) => {
          const { step, acc } = place(m, c.names?.[i]);
          const treble = satb && c.notes.length === 4 ? i >= 2 : m >= 60;
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
                    <text x={nx - 18} y={y + 4} className="st-acc">
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
              <text x={x} y={height - 10} className="st-label">
                {c.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
