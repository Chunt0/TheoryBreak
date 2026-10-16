import { getAlgorithm, layoutAlgorithm } from '../../audio/dx7/algorithms';

interface Props {
  algorithm: number;
  selected?: number;
  enabled?: boolean[];
  levels?: number[];
  onSelect?: (op: number) => void;
  small?: boolean;
}

/** DX7-style algorithm chart: carriers on the bottom row, modulators above. */
export function AlgorithmDiagram({ algorithm, selected, enabled, levels, onSelect, small = false }: Props) {
  const a = getAlgorithm(algorithm);
  const l = layoutAlgorithm(algorithm);
  const box = small ? 14 : 34;
  const gapX = small ? 6 : 16;
  const gapY = small ? 8 : 22;
  const pad = small ? 4 : 14;
  const W = l.cols * box + (l.cols - 1) * gapX + pad * 2 + (small ? 6 : 18);
  const H = l.rows * box + (l.rows - 1) * gapY + pad * 2 + (small ? 8 : 22);
  const pos = (op: number) => {
    const n = l.nodes.find((x) => x.op === op)!;
    return { x: pad + n.x * (box + gapX), y: pad + n.y * (box + gapY) };
  };
  const outY = H - (small ? 3 : 8);
  const carriers = l.nodes.filter((n) => n.carrier).map((n) => pos(n.op).x + box / 2);
  const [fbFrom, fbTo] = a.feedback;
  const pf = pos(fbFrom);
  const pt = pos(fbTo);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="algo-svg" role="img" aria-label={`Algorithm ${algorithm}`}>
      {a.edges.map(([m, t], i) => {
        const pm = pos(m);
        const ptg = pos(t);
        return <path key={i} className="wire" d={`M ${pm.x + box / 2} ${pm.y + box} L ${ptg.x + box / 2} ${ptg.y}`} />;
      })}
      {carriers.map((x, i) => <line key={`o${i}`} className="wire" x1={x} x2={x} y1={pos(l.nodes.filter((n) => n.carrier)[i].op).y + box} y2={outY} />)}
      {carriers.length ? <line className="wire" x1={Math.min(...carriers)} x2={Math.max(...carriers)} y1={outY} y2={outY} /> : null}
      {fbFrom === fbTo ? (
        <path className="fbwire" d={`M ${pf.x + box / 2} ${pf.y} L ${pf.x + box / 2} ${pf.y - (small ? 3 : 8)} L ${pf.x + box + (small ? 3 : 8)} ${pf.y - (small ? 3 : 8)} L ${pf.x + box + (small ? 3 : 8)} ${pf.y + box + (small ? 3 : 6)} L ${pf.x + box / 2} ${pf.y + box + (small ? 3 : 6)}`} />
      ) : (
        <path className="fbwire" d={`M ${pf.x + box} ${pf.y + box / 2} L ${pf.x + box + (small ? 4 : 10)} ${pf.y + box / 2} L ${pf.x + box + (small ? 4 : 10)} ${pt.y - (small ? 3 : 8)} L ${pt.x + box / 2} ${pt.y - (small ? 3 : 8)} L ${pt.x + box / 2} ${pt.y}`} />
      )}
      {l.nodes.map((n) => {
        const p = pos(n.op);
        const on = enabled ? enabled[n.op - 1] : true;
        const lvl = levels?.[n.op - 1] ?? 0;
        return (
          <g key={n.op} onClick={onSelect ? () => onSelect(n.op - 1) : undefined}>
            <rect
              x={p.x}
              y={p.y}
              width={box}
              height={box}
              rx={small ? 2 : 6}
              className={`opbox ${n.carrier ? 'c' : 'm'} ${selected === n.op - 1 ? 'sel' : ''} ${on ? '' : 'off'}`}
              style={levels ? { filter: `brightness(${1 + lvl * 0.9})` } : undefined}
            />
            {!small ? <text x={p.x + box / 2} y={p.y + box / 2} className="optxt">{n.op}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}
