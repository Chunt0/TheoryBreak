import { pick } from './core';

/**
 * Rhythms live on a step grid. A 4/4 bar uses 16 steps (16th notes) or
 * 12 steps (8th-note triplets). Each pattern lists the steps with onsets.
 */
export interface RhythmPattern {
  steps: number;
  onsets: number[];
  beatsPerBar: number;
  label?: string;
}

export type RhythmLevel = 2 | 3 | 4 | 5;

export const RHYTHM_LEVEL_NAMES: Record<RhythmLevel, string> = {
  2: '16th-note grid',
  3: 'syncopation & anticipations',
  4: 'triplets / shuffle',
  5: 'funk 16ths (off-beat e/a)',
};

const CELLS_16: Record<2 | 3 | 5, string[]> = {
  2: ['1000', '1010', '1111', '1011', '1110', '1010'],
  3: ['1010', '0010', '1001', '1011', '0110', '1110', '0011', '1000'],
  5: ['1001', '0010', '1011', '0110', '1101', '0101', '0011', '1001', '0100', '0001'],
};
const CELLS_12 = ['100', '111', '101', '111', '100', '011'];

function cellsToPattern(cells: string[], stepsPerBeat: number, label?: string): RhythmPattern {
  const onsets: number[] = [];
  cells.forEach((c, beat) => {
    [...c].forEach((ch, i) => {
      if (ch === '1') onsets.push(beat * stepsPerBeat + i);
    });
  });
  return { steps: cells.length * stepsPerBeat, onsets, beatsPerBar: cells.length, label };
}

export function randomRhythm(level: RhythmLevel, rnd = Math.random): RhythmPattern {
  if (level === 4) {
    const cells = [pick(['100', '111', '101'], rnd), pick(CELLS_12, rnd), pick(CELLS_12, rnd), pick(CELLS_12, rnd)];
    return cellsToPattern(cells, 3);
  }
  const pool = CELLS_16[level];
  const cells: string[] = [];
  for (let b = 0; b < 4; b++) {
    let c = pick(pool, rnd);
    if (b === 0 && c[0] !== '1') c = '1' + c.slice(1);
    cells.push(c);
  }
  if (cells.join('') === '1000'.repeat(4)) cells[1] = '1111';
  // a "16th" bar should actually contain a 16th-note subdivision
  if (level === 2 && !cells.some((c) => c[1] === '1' || c[3] === '1')) cells[1 + Math.floor(rnd() * 3)] = pick(['1111', '1011', '1110'], rnd);
  if (level === 5 && cells.filter((c) => c[1] === '1' || c[3] === '1').length < 2) cells[2] = '0101';
  return cellsToPattern(cells, 4);
}

export const patternKey = (p: RhythmPattern): string => `${p.steps}:${p.onsets.join(',')}`;

/** Counting syllables for each step: "1 e & a" (16ths) or "1 trip let" (triplets). */
export function countLabels(p: RhythmPattern): string[] {
  const perBeat = p.steps / p.beatsPerBar;
  const sub = perBeat === 4 ? ['', 'e', '&', 'a'] : perBeat === 3 ? ['', 'trip', 'let'] : perBeat === 2 ? ['', '&'] : [''];
  return Array.from({ length: p.steps }, (_, i) => {
    const beat = Math.floor(i / perBeat);
    const s = i % perBeat;
    return s === 0 ? String(beat + 1) : sub[s];
  });
}

export function patternFromCells(cells: string[], stepsPerBeat: number, label?: string): RhythmPattern {
  return cellsToPattern(cells, stepsPerBeat, label);
}

const fromSteps = (onsets: number[], label: string): RhythmPattern => ({ steps: 16, onsets, beatsPerBar: 4, label });

/** Afro-Cuban / Brazilian timelines written in one bar of 16ths. */
export const CLAVES: { id: string; name: string; pattern: RhythmPattern; note: string }[] = [
  { id: 'son32', name: 'Son clave 3-2', pattern: fromSteps([0, 3, 6, 10, 12], 'Son 3-2'), note: 'Tresillo side (3) then the 2 side. The backbone of salsa and much funk syncopation.' },
  { id: 'son23', name: 'Son clave 2-3', pattern: fromSteps([2, 4, 8, 11, 14], 'Son 2-3'), note: 'Same timeline starting from the 2 side.' },
  { id: 'rumba32', name: 'Rumba clave 3-2', pattern: fromSteps([0, 3, 7, 10, 12], 'Rumba 3-2'), note: 'Third stroke delayed by a 16th: more tension than son clave.' },
  { id: 'bossa', name: 'Bossa nova clave', pattern: fromSteps([0, 3, 6, 10, 13], 'Bossa'), note: 'Last stroke displaced: the gently pushing Brazilian timeline.' },
  { id: 'tresillo', name: 'Tresillo (3+3+2)', pattern: fromSteps([0, 3, 6, 8, 11, 14], 'Tresillo'), note: '3+3+2 grouping: New Orleans, funk bass lines, reggaeton.' },
];
