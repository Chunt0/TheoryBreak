import { describe, expect, test } from 'bun:test';
import { mod, noteName, parseNote } from '../src/client/theory/core';
import {
  applyTri, applyTriad, cycleTriads, cycleTris, describeMove, enharmonic, fifthsOf, findTri, moveBetween, moveTri, moveTriad,
  nodePc, nodesIn, noteAtFifths, placeNear, samePcs, spellFifths, triadName, triadPcs, triadsIn, triIn, triPcs, trisIn, triTriad,
  voiceLead, type Tri, type Win,
} from '../src/client/theory/tonnetz';

const N = (s: string) => parseNote(s)!;
const C = { root: 0, minor: false };
const win: Win = { xHalf: 4, rows: 2 };

describe('Tonnetz: spelling by place', () => {
  test('the line of fifths round trip', () => {
    for (let f = -14; f <= 14; f++) expect(fifthsOf(noteAtFifths(f))).toBe(f);
    expect(noteName(noteAtFifths(6))).toBe('F♯');
    expect(noteName(noteAtFifths(-4))).toBe('A♭');
    expect(noteName(noteAtFifths(12))).toBe('B♯');
    expect(fifthsOf(N('Bb'))).toBe(-2);
  });

  test('sharps up and right, flats down and left; G♯ and A♭ both on the chart', () => {
    const at = (i: number, j: number) => noteName(spellFifths(i + 4 * j, 'spelled'));
    expect(at(1, 0)).toBe('G');
    expect(at(0, 1)).toBe('E');
    expect(at(0, 2)).toBe('G♯');
    expect(at(0, -1)).toBe('A♭');
    expect(at(-1, 0)).toBe('F');
    const names = new Set(nodesIn(win).map((n) => noteName(spellFifths(n.i + 4 * n.j, 'spelled'))));
    for (const n of ['G♯', 'A♭', 'D♯', 'E♭', 'C♯', 'D♭', 'F♯', 'G♭', 'A♯', 'B♭']) expect(names.has(n)).toBe(true);
  });

  test('doubles become plain; sharps and flats force one side', () => {
    expect(noteName(spellFifths(14, 'spelled'))).toBe('D'); // C𝄪
    expect(noteName(spellFifths(-4, 'sharps'))).toBe('G♯');
    expect(noteName(spellFifths(8, 'flats'))).toBe('A♭');
    expect(enharmonic(8)).toBe('G♯ = A♭');
    expect(enharmonic(0)).toBe('C');
  });
});

describe('Tonnetz: triangles are triads', () => {
  test('up is major, down is minor', () => {
    expect(triPcs({ i: 0, j: 0, up: true }, 0).sort((a, b) => a - b)).toEqual([0, 4, 7]);
    expect(triadName(triTriad({ i: 0, j: 0, up: true }, 0))).toBe('C');
    expect(triadName(triTriad({ i: -1, j: 0, up: false }, 0))).toBe('Am');
    expect(triadName(triTriad({ i: 0, j: 0, up: false }, 0))).toBe('Em');
    expect(triadName(triTriad({ i: 0, j: 0, up: true }, 6))).toBe('F♯');
  });

  test('P, L and R on the lattice match P, L and R on triads, and undo themselves', () => {
    for (const t of trisIn(win)) for (const m of ['P', 'L', 'R'] as const) {
      const moved = moveTri(t, m);
      expect(moveTri(moved, m)).toEqual(t);
      expect(triTriad(moved, 0)).toEqual(moveTriad(triTriad(t, 0), m));
      // a single move keeps two notes
      const a = triPcs(t, 0);
      expect(triPcs(moved, 0).filter((p) => a.includes(p))).toHaveLength(2);
    }
  });

  test('the moves from C', () => {
    const from = (w: string) => triadName(applyTriad(C, w));
    expect(from('P')).toBe('Cm');
    expect(from('R')).toBe('Am');
    expect(from('L')).toBe('Em');
    expect(from('N')).toBe('Fm');
    expect(from('S')).toBe('C♯m');
    expect(from('H')).toBe('A♭m');
    expect(triadName(applyTriad({ root: 0, minor: true }, 'N'))).toBe('G'); // minor i → major V
  });

  test('naming the move between two triads', () => {
    expect(moveBetween(C, { root: 3, minor: true })).toBe('R');
    expect(moveBetween(C, { root: -1, minor: true })).toBe('N');
    expect(moveBetween(C, { root: -4, minor: true })).toBe('H');
    expect(moveBetween(C, { root: 1, minor: false })).toBe('LR'); // C → Em → G: up a 5th is two moves
    expect(moveBetween(C, C)).toBe('');
  });

  test('triads hiding in bigger chords', () => {
    expect(triadsIn([0, 4, 7, 11])).toHaveLength(2); // Cmaj7 = C + Em
    expect(triadsIn([0, 4, 7, 10])).toHaveLength(1); // C7 = C + a diminished triad
    expect(triadsIn([2, 5, 9, 0])).toHaveLength(2); // Dm7 = Dm + F
  });
});

describe('Tonnetz: the screen and the torus', () => {
  test('the same triad appears again four 5ths over and a 3rd down', () => {
    const t: Tri = { i: 0, j: 0, up: true };
    expect(samePcs(triPcs({ i: 4, j: -1, up: true }, 0), triPcs(t, 0))).toBe(true);
    expect(samePcs(triPcs({ i: 0, j: 3, up: true }, 0), triPcs(t, 0))).toBe(true);
    expect(nodePc({ i: 0, j: 3 }, 0)).toBe(0);
  });

  test('every triad can be found on screen, nearest the middle', () => {
    for (let r = 0; r < 12; r++) for (const minor of [false, true]) {
      const t = findTri(r, minor, 5, win)!;
      expect(t).not.toBeNull();
      expect(triIn(t, win)).toBe(true);
      const pcs = triPcs(t, 5);
      expect(samePcs(pcs, [r, mod(r + (minor ? 3 : 4), 12), mod(r + 7, 12)])).toBe(true);
    }
    expect(placeNear({ i: 9, j: 0, up: true }, win)).not.toBeNull();
  });

  test('cycles come home: six for P L, eight for P R, 24 for L R', () => {
    expect(cycleTriads(C, 'PL').map((t) => triadName(t))).toEqual(['C', 'Cm', 'A♭', 'A♭m', 'F♭', 'F♭m', 'C']); // D𝄫 by place, named plainly
    expect(cycleTriads(C, 'PR')).toHaveLength(9);
    expect(cycleTriads(C, 'LR')).toHaveLength(25);
    expect(cycleTriads(C, 'RL').slice(0, 5).map((t) => triadName(t))).toEqual(['C', 'Am', 'F', 'Dm', 'B♭']);
    const start: Tri = { i: 0, j: 0, up: true };
    for (const w of ['PL', 'PR', 'LR', 'RL']) {
      const tris = cycleTris(start, w, win, 0);
      expect(tris.at(-1)).toEqual(start);
      expect(tris.every((t) => triIn(t, win))).toBe(true);
      // each step is the cycle's move, wherever on screen it is drawn
      tris.slice(1).forEach((t, k) => {
        const want = applyTri(tris[k], w[k % 2]);
        expect(samePcs(triPcs(t, 0), triPcs(want, 0))).toBe(true);
      });
    }
  });
});

describe('Tonnetz: voice leading', () => {
  test('common tones stay, the rest move by step', () => {
    expect(voiceLead([60, 64, 67], triadPcs({ root: 3, minor: true }))).toEqual([60, 64, 69]); // C → Am: G up to A
    expect(voiceLead([60, 64, 67], triadPcs({ root: 4, minor: true }))).toEqual([59, 64, 67]); // C → Em: C down to B
    expect(voiceLead([60, 64, 67], triadPcs({ root: -4, minor: true }))).toEqual([59, 63, 68]); // H: all three by half step
  });

  test('what stays and what moves, spelled', () => {
    const c: Tri = { i: 0, j: 0, up: true };
    const d = describeMove(c, moveTri(c, 'R'), 0, 'spelled');
    expect(d.stay).toEqual(['C', 'E']);
    expect(d.moves).toEqual(['G → A (↑ 1)']);
    expect(describeMove(c, moveTri(c, 'P'), 0, 'spelled').moves).toEqual(['E → E♭ (↓ ½)']);
  });
});
