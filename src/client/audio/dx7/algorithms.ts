// The 32 DX7 algorithms as explicit operator graphs (operators numbered 1-6).
// Every modulation edge goes from a higher-numbered operator to a lower one,
// so rendering OP6 → OP1 each sample always has modulator output ready.

export interface Algorithm {
  id: number;
  carriers: number[];
  /** [modulator, target] pairs */
  edges: [number, number][];
  /** feedback loop: output of `from` feeds the phase of `to` (same op = self feedback) */
  feedback: [number, number];
}

const A = (id: number, carriers: number[], edges: [number, number][], feedback: [number, number]): Algorithm => ({
  id, carriers, edges, feedback,
});

export const ALGORITHMS: Algorithm[] = [
  A(1, [1, 3], [[2, 1], [4, 3], [5, 4], [6, 5]], [6, 6]),
  A(2, [1, 3], [[2, 1], [4, 3], [5, 4], [6, 5]], [2, 2]),
  A(3, [1, 4], [[2, 1], [3, 2], [5, 4], [6, 5]], [6, 6]),
  A(4, [1, 4], [[2, 1], [3, 2], [5, 4], [6, 5]], [4, 6]),
  A(5, [1, 3, 5], [[2, 1], [4, 3], [6, 5]], [6, 6]),
  A(6, [1, 3, 5], [[2, 1], [4, 3], [6, 5]], [5, 6]),
  A(7, [1, 3], [[2, 1], [4, 3], [5, 3], [6, 5]], [6, 6]),
  A(8, [1, 3], [[2, 1], [4, 3], [5, 3], [6, 5]], [4, 4]),
  A(9, [1, 3], [[2, 1], [4, 3], [5, 3], [6, 5]], [2, 2]),
  A(10, [1, 4], [[2, 1], [3, 2], [5, 4], [6, 4]], [3, 3]),
  A(11, [1, 4], [[2, 1], [3, 2], [5, 4], [6, 4]], [6, 6]),
  A(12, [1, 3], [[2, 1], [4, 3], [5, 3], [6, 3]], [2, 2]),
  A(13, [1, 3], [[2, 1], [4, 3], [5, 3], [6, 3]], [6, 6]),
  A(14, [1, 3], [[2, 1], [4, 3], [5, 4], [6, 4]], [6, 6]),
  A(15, [1, 3], [[2, 1], [4, 3], [5, 4], [6, 4]], [2, 2]),
  A(16, [1], [[2, 1], [3, 1], [5, 1], [4, 3], [6, 5]], [6, 6]),
  A(17, [1], [[2, 1], [3, 1], [5, 1], [4, 3], [6, 5]], [2, 2]),
  A(18, [1], [[2, 1], [3, 1], [4, 1], [5, 4], [6, 5]], [3, 3]),
  A(19, [1, 4, 5], [[2, 1], [3, 2], [6, 4], [6, 5]], [6, 6]),
  A(20, [1, 2, 4], [[3, 1], [3, 2], [5, 4], [6, 4]], [3, 3]),
  A(21, [1, 2, 4, 5], [[3, 1], [3, 2], [6, 4], [6, 5]], [3, 3]),
  A(22, [1, 3, 4, 5], [[2, 1], [6, 3], [6, 4], [6, 5]], [6, 6]),
  A(23, [1, 2, 4, 5], [[3, 2], [6, 4], [6, 5]], [6, 6]),
  A(24, [1, 2, 3, 4, 5], [[6, 3], [6, 4], [6, 5]], [6, 6]),
  A(25, [1, 2, 3, 4, 5], [[6, 4], [6, 5]], [6, 6]),
  A(26, [1, 2, 4], [[3, 2], [5, 4], [6, 4]], [6, 6]),
  A(27, [1, 2, 4], [[3, 2], [5, 4], [6, 4]], [3, 3]),
  A(28, [1, 3, 6], [[2, 1], [4, 3], [5, 4]], [5, 5]),
  A(29, [1, 2, 3, 5], [[4, 3], [6, 5]], [6, 6]),
  A(30, [1, 2, 3, 6], [[4, 3], [5, 4]], [5, 5]),
  A(31, [1, 2, 3, 4, 5], [[6, 5]], [6, 6]),
  A(32, [1, 2, 3, 4, 5, 6], [], [6, 6]),
];

export function getAlgorithm(id: number): Algorithm {
  return ALGORITHMS[Math.min(32, Math.max(1, Math.round(id))) - 1];
}

/** Compiled form for the DSP: zero-based operator indices. */
export interface CompiledAlgorithm {
  /** modSources[op] = zero-based indices of operators modulating op */
  modSources: number[][];
  isCarrier: boolean[];
  fbFrom: number;
  fbTo: number;
  carrierCount: number;
}

export function compileAlgorithm(id: number): CompiledAlgorithm {
  const a = getAlgorithm(id);
  const modSources: number[][] = [[], [], [], [], [], []];
  for (const [m, t] of a.edges) modSources[t - 1].push(m - 1);
  const isCarrier = [1, 2, 3, 4, 5, 6].map((n) => a.carriers.includes(n));
  return { modSources, isCarrier, fbFrom: a.feedback[0] - 1, fbTo: a.feedback[1] - 1, carrierCount: a.carriers.length };
}

// ---------------------------------------------------------------------------
// Diagram layout: carriers on the bottom row, modulators stacked above their
// targets (barycentre placement), like the printed DX7 algorithm chart.

export interface AlgoLayout {
  nodes: { op: number; x: number; y: number; carrier: boolean }[];
  cols: number;
  rows: number;
}

export function layoutAlgorithm(id: number): AlgoLayout {
  const a = getAlgorithm(id);
  const targets = new Map<number, number[]>();
  for (const [m, t] of a.edges) targets.set(m, [...(targets.get(m) ?? []), t]);
  const row = new Map<number, number>();
  const rowOf = (op: number): number => {
    if (row.has(op)) return row.get(op)!;
    const ts = targets.get(op);
    const r = !ts || ts.length === 0 ? 0 : 1 + Math.max(...ts.map(rowOf));
    row.set(op, r);
    return r;
  };
  for (let op = 1; op <= 6; op++) rowOf(op);

  const x = new Map<number, number>();
  const maxRow = Math.max(...row.values());
  for (let r = 0; r <= maxRow; r++) {
    const ops = [1, 2, 3, 4, 5, 6].filter((op) => row.get(op) === r);
    const desired = ops.map((op) => {
      if (r === 0) return { op, x: 0 };
      const ts = targets.get(op) ?? [];
      return { op, x: ts.reduce((s, t) => s + (x.get(t) ?? 0), 0) / ts.length };
    });
    if (r === 0) desired.forEach((d, i) => (d.x = i));
    desired.sort((p, q) => p.x - q.x || p.op - q.op);
    for (let i = 1; i < desired.length; i++) {
      if (desired[i].x < desired[i - 1].x + 1) desired[i].x = desired[i - 1].x + 1;
    }
    // re-centre a row that was pushed right over its targets
    if (r > 0 && desired.length > 1) {
      const want = desired.reduce((s, d) => {
        const ts = targets.get(d.op) ?? [];
        return s + ts.reduce((u, t) => u + (x.get(t) ?? 0), 0) / ts.length;
      }, 0) / desired.length;
      const have = desired.reduce((s, d) => s + d.x, 0) / desired.length;
      const shift = want - have;
      desired.forEach((d) => (d.x += shift));
    }
    desired.forEach((d) => x.set(d.op, d.x));
  }
  const minX = Math.min(...x.values());
  const nodes = [1, 2, 3, 4, 5, 6].map((op) => ({
    op,
    x: x.get(op)! - minX,
    y: maxRow - row.get(op)!,
    carrier: a.carriers.includes(op),
  }));
  const cols = Math.max(...nodes.map((n) => n.x)) + 1;
  return { nodes, cols, rows: maxRow + 1 };
}
