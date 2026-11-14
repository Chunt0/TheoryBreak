import { describe, expect, test } from 'bun:test';
import { noteName } from '../src/client/theory/core';
import {
  change, COMPASS, describeStep, mirror, modeNotes, modeSemis, modesHolding, parentOf, posName, posPcs, step, tritone, walk, type Pos,
} from '../src/client/theory/compass';

const C = (k: number): Pos => ({ root: 0, k });
const names = (p: Pos) => modeNotes(p).map(noteName).join(' ');

describe('modal compass', () => {
  test('bright to dark, one note lowered a half step per step', () => {
    expect(COMPASS.map((m) => m.name)).toEqual(['Lydian', 'Ionian', 'Mixolydian', 'Dorian', 'Aeolian', 'Phrygian', 'Locrian']);
    const lowered: number[] = [];
    for (let k = 0; k < 6; k++) {
      const { gone, came } = change(C(k), C(k + 1));
      expect(gone.length).toBe(1);
      expect(came).toEqual([(gone[0] + 11) % 12]);
      lowered.push(gone[0]);
    }
    expect(lowered).toEqual([6, 11, 4, 9, 2, 7]); // F♯ B E A D G: falling 5ths
  });

  test('spin: past Locrian the root falls and Lydian starts again', () => {
    const b = step(C(6), 1, 'spin');
    expect(b).toEqual({ root: 11, k: 0 });
    expect(change(C(6), b)).toEqual({ gone: [0], came: [11] });
    expect(names(b)).toBe('B C♯ D♯ E♯ F♯ G♯ A♯');
    expect(describeStep(C(6), b)).toBe('C Locrian → B Lydian: the root C falls to B, the new root');
    expect(step(b, -1, 'spin')).toEqual(C(6));
    expect(walk(C(0), 7, 'spin')).toEqual({ root: 11, k: 0 });
    expect(walk(C(1), 84, 'spin')).toEqual(C(1));
    // holding the root, the seam changes many notes
    expect(step(C(6), 1, 'root')).toEqual(C(0));
  });

  test('same notes: roots rise in 5ths from bright to dark', () => {
    let p: Pos = { root: 5, k: 0 }; // F Lydian
    const roots: string[] = [];
    for (let i = 0; i < 7; i++) {
      roots.push(posName(p));
      expect(parentOf(p)).toBe(0);
      expect(posPcs(p).sort((a, b) => a - b)).toEqual([0, 2, 4, 5, 7, 9, 11]);
      p = step(p, 1, 'notes');
    }
    expect(roots).toEqual(['F Lydian', 'C Ionian', 'G Mixolydian', 'D Dorian', 'A Aeolian', 'E Phrygian', 'B Locrian']);
    expect(p).toEqual({ root: 5, k: 0 });
  });

  test('mirror pairs are inversions; Dorian is the axis', () => {
    for (let k = 0; k < 7; k++) {
      const inv = modeSemis(k).map((s) => (12 - s) % 12).sort((a, b) => a - b);
      expect(inv).toEqual(modeSemis(mirror(k)).slice().sort((a, b) => a - b));
    }
    expect(COMPASS[mirror(1)].name).toBe('Phrygian');
    expect(mirror(3)).toBe(3);
  });

  test('one tritone each; modes holding a set of notes', () => {
    expect(tritone(1)).toEqual([5, 11]);
    expect(tritone(0)).toEqual([0, 6]);
    expect(tritone(3)).toEqual([3, 9]);
    expect(modesHolding(0, [4, 10]).map((k) => COMPASS[k].name)).toEqual(['Mixolydian']);
    expect(modesHolding(0, [3, 9]).map((k) => COMPASS[k].name)).toEqual(['Dorian']);
  });

  test('roots spelled the simple way', () => {
    expect(posName({ root: 1, k: 6 })).toBe('C♯ Locrian');
    expect(posName({ root: 1, k: 0 })).toBe('D♭ Lydian');
    expect(names({ root: 3, k: 4 })).toBe('E♭ F G♭ A♭ B♭ C♭ D♭');
  });
});
