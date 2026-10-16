// "Apply" tasks for the last block of a session: short, musical, open-ended.
// Each loads the Progression Lab or the Changes Trainer with a starting point.

import type { Tag } from './library/types';

export interface Challenge {
  id: string;
  title: string;
  task: string;
  tags: Tag[];
  tool: 'lab' | 'changes';
  key: string;
  /** Roman numerals or chord symbols */
  tokens: string[];
  bpm: number;
  style: 'swing' | 'funk' | 'ballad' | 'block';
  beats?: number;
  checklist: string[];
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'reharm-1625', tags: ['jazz'], tool: 'lab', key: 'Bb', tokens: ['Imaj7', 'vi7', 'ii7', 'V7'], bpm: 132, style: 'swing',
    title: 'Reharmonise a turnaround',
    task: 'Start from I–vi–ii–V in B♭. Make vi a VI7, then tritone-sub the V, then try the Lady Bird version (I – ♭III7 – ♭VImaj7 – ♭II7). Loop each and pick a favourite.',
    checklist: ['Used a secondary dominant', 'Used a tritone sub', 'Compared at least three versions'],
  },
  {
    id: 'guide-blues', tags: ['jazz'], tool: 'changes', key: 'F', tokens: ['F7', 'Bb7', 'F7', 'Cm7', 'F7', 'Bb7', 'Bdim7', 'F7', 'Am7', 'D7', 'Gm7', 'C7'], bpm: 120, style: 'swing', beats: 4,
    title: 'Guide-tone line through a jazz blues',
    task: 'Play only 3rds and 7ths, one per bar on beat 1, moving by the smallest step. Then add one approach note before each target.',
    checklist: ['Guide tones on 70%+ of chord changes', 'No leaps bigger than a 3rd'],
  },
  {
    id: 'minor-iiv', tags: ['jazz'], tool: 'changes', key: 'Cm', tokens: ['iiø7', 'V7b9', 'i6', 'i6'], bpm: 120, style: 'swing', beats: 4,
    title: 'Target the ♭9',
    task: 'Over the minor ii–V–i, land on the ♭9 of the V7 (A♭ over G7♭9) on beat 1 and resolve it down to G (the 5th of Cm6).',
    checklist: ['Hit the ♭9 on the downbeat', 'Resolved it by half step'],
  },
  {
    id: 'ust-color', tags: ['jazz'], tool: 'lab', key: 'C', tokens: ['Dm9', 'G13', 'Cmaj9', 'Cmaj9'], bpm: 100, style: 'ballad', beats: 4,
    title: 'Upper-structure colours',
    task: 'Hold the G7 shell (F + B) in your left hand and try triads E, A, A♭, E♭ and D♭ on top. Rewrite the second chord in the Lab as G13, G7♯9, G7alt or G13♭9 to match your favourite.',
    checklist: ['Tried four upper structures', 'Saved the best version'],
  },
  {
    id: 'coltrane', tags: ['jazz'], tool: 'changes', key: 'B', tokens: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'Ebmaj7', 'Am7', 'D7'], bpm: 110, style: 'swing', beats: 2,
    title: 'Survive Giant Steps (slowly)',
    task: 'Play only the root, 3rd or 5th of each chord on its downbeat. Then outline each chord with a 1-2-3-5 cell.',
    checklist: ['Chord tones on 60%+ of chord changes', 'Heard the three key centres'],
  },
  {
    id: 'dorian-funk', tags: ['funk'], tool: 'changes', key: 'Ebm', tokens: ['i7', 'IV9'], bpm: 98, style: 'funk', beats: 4,
    title: 'Dorian funk vamp',
    task: 'Over E♭m7 – A♭9, improvise with E♭ minor pentatonic, then add C (the Dorian 6th) and land it on the A♭9. Keep phrases on the 16th grid.',
    checklist: ['Used the natural 6', 'Started phrases on an off-beat 16th'],
  },
  {
    id: 'dom-vamp', tags: ['funk'], tool: 'changes', key: 'E', tokens: ['I9', 'IV13'], bpm: 104, style: 'funk', beats: 4,
    title: 'Guide-tone funk comping',
    task: 'Comp E9 – A13 with just two notes per chord (3 + ♭7), sliding by half step. Then add the 9th or 13th on top and play stabs on the "e" and "a".',
    checklist: ['Guide tones moved by half step', 'Stabs on off-beat 16ths'],
  },
  {
    id: 'neo-plane', tags: ['soul'], tool: 'lab', key: 'C', tokens: ['IVmaj9', 'iii9', 'ii9', 'Imaj9'], bpm: 80, style: 'ballad', beats: 4,
    title: 'Neo-soul planing',
    task: 'Voice the four chords with the same hand shape moving down the scale. Then swap the last two for Dm9 – F/G – Cmaj9 and compare the cadences.',
    checklist: ['Same voicing shape throughout', 'Tried IV/V as the dominant'],
  },
  {
    id: 'two-of-us', tags: ['soul'], tool: 'changes', key: 'Ab', tokens: ['IVmaj7', 'III7', 'vi7', 'v7', 'I7'], bpm: 92, style: 'ballad', beats: 4,
    title: 'Improvise on "Just the Two of Us" changes',
    task: 'Target the 3rd of each chord on beat 1 — especially E (the 3rd of C7) leading into Fm7.',
    checklist: ['Targeted 3rds', 'Heard C7 as V7/vi'],
  },
  {
    id: 'gospel-walk', tags: ['soul'], tool: 'lab', key: 'C', tokens: ['I', 'IV', '#iv°7', 'C/G', 'VI7', 'ii7', 'V7', 'I'], bpm: 76, style: 'block', beats: 2,
    title: 'Gospel walk-up',
    task: 'Loop it, then make the top voice move chromatically wherever possible. Replace V7 with F/G and hear the softer arrival.',
    checklist: ['Chromatic top line', 'Tried IV/V'],
  },
  {
    id: 'bach-bass', tags: ['bach'], tool: 'lab', key: 'C', tokens: ['C', 'G/B', 'Am', 'Em/G', 'F', 'C/E', 'Dm7', 'G7'], bpm: 70, style: 'block', beats: 2,
    title: 'Descending bass, upper counterpoint',
    task: 'Over this stepwise bass (C–B–A–G–F–E–D–G), play a soprano line mostly in 10ths and 6ths with the bass. Avoid parallel 5ths and octaves.',
    checklist: ['Mostly imperfect consonances', 'No parallel perfect intervals', 'Leading tone resolved'],
  },
  {
    id: 'bach-sequence', tags: ['bach', 'jazz'], tool: 'changes', key: 'Am', tokens: ['i7', 'iv7', 'bVII7', 'bIIImaj7', 'bVImaj7', 'iiø7', 'V7', 'i7'], bpm: 100, style: 'swing', beats: 4,
    title: 'Cycle of fifths, two dialects',
    task: 'Treat it as a Baroque sequence first (one pattern repeated per chord), then as "Autumn Leaves" changes with guide tones.',
    checklist: ['Kept the same motif through the sequence', 'Guide tones on 60%+ of chord changes'],
  },
  {
    id: 'phrygian', tags: ['bach'], tool: 'lab', key: 'Am', tokens: ['Am', 'Dm/F', 'E', 'Am', 'Bb/D', 'E7', 'A'], bpm: 72, style: 'block', beats: 2,
    title: 'Minor-key cadence palette',
    task: 'Compare the Phrygian half cadence (iv6–V), the Neapolitan (N6–V7) and the Picardy ending. Rewrite the progression to end deceptively (V7 → ♭VI).',
    checklist: ['Heard the ♭6–5 bass', 'Wrote a deceptive ending'],
  },
];
