// Chord–scale theory for the Scales tab: which scale a chord takes where it
// stands (Dm7 as ii is Dorian, Em7 as iii Phrygian, A7 → Dm Mixolydian ♭6),
// and what each note of that scale does over the chord: chord tone, available
// tension, or avoid note (a half step above a chord tone).

import { INTERVALS, mod, pc, transpose, type Note } from '../theory/core';
import { chordNotes, getChord } from '../theory/chords';
import { MAJOR_KEYS, relativeMinor, type Key } from '../theory/keys';
import { getScale, scaleNotes } from '../theory/scales';

export type CsLevel = 'major' | 'minor' | 'secondary' | 'dominant' | 'melodic' | 'mixed';
type Home = Exclude<CsLevel, 'mixed'>;

export interface CsItem {
  id: string;
  level: Home;
  /** the key the chord lives in; 'none' for the melodic-minor chords, which stand alone */
  mode: 'major' | 'minor' | 'none';
  /** chord root above the tonic */
  from: string;
  type: string;
  /** its job in the key: "iii7", "V7/ii", "♭II7" */
  numeral: string;
  /** where it resolves: root above the tonic, and whether that chord is minor */
  to?: { from: string; minor: boolean };
  /** chords without a key: what they are for */
  use?: string;
  /** scales that fit, the usual one first */
  scales: string[];
  /** the reasoning, to say out loud */
  why: string;
}

const I = (from: string, minor = false) => ({ from, minor });

export const CS_ITEMS: CsItem[] = [
  // the key's own notes from each degree: the modes as chord scales
  { id: 'maj.I', level: 'major', mode: 'major', from: 'P1', type: 'maj7', numeral: 'Imaj7', scales: ['major'],
    why: 'The key\'s own notes from the tonic: Ionian. The 4 sits a half step above the 3rd, so pass through it. Lydian (♯4) is the brighter colour once you leave the key.' },
  { id: 'maj.ii', level: 'major', mode: 'major', from: 'M2', type: 'min7', numeral: 'ii7', scales: ['dorian'],
    why: 'The key\'s notes from the 2nd: Dorian. Its natural 13 is what makes a ii sound like a ii, and nothing sits a half step above a chord tone.' },
  { id: 'maj.iii', level: 'major', mode: 'major', from: 'M3', type: 'min7', numeral: 'iii7', scales: ['phrygian'],
    why: 'The key\'s notes from the 3rd: Phrygian. The ♭9 and ♭13 each sit a half step above a chord tone: avoid notes, fine in passing.' },
  { id: 'maj.IV', level: 'major', mode: 'major', from: 'P4', type: 'maj7', numeral: 'IVmaj7', scales: ['lydian'],
    why: 'The key\'s notes from the 4th: Lydian. The ♯11 is the key\'s 7th, a whole step clear of the 3rd, so it floats instead of clashing.' },
  { id: 'maj.V', level: 'major', mode: 'major', from: 'P5', type: 'dom7', numeral: 'V7', scales: ['mixolydian'],
    why: 'The key\'s notes from the 5th: Mixolydian. The 11 (the key\'s tonic) is the avoid note over the major 3rd.' },
  { id: 'maj.vi', level: 'major', mode: 'major', from: 'M6', type: 'min7', numeral: 'vi7', scales: ['minor'],
    why: 'The key\'s notes from the 6th: Aeolian. The ♭13 sits a half step above the 5th.' },
  { id: 'maj.vii', level: 'major', mode: 'major', from: 'M7', type: 'm7b5', numeral: 'viiø7', scales: ['locrian'],
    why: 'The key\'s notes from the 7th: Locrian. Its ♭9 rubs against the root.' },

  // the minor ii–V–i world
  { id: 'min.i', level: 'minor', mode: 'minor', from: 'P1', type: 'min6', numeral: 'im6', scales: ['melodic_minor'],
    why: 'A minor tonic with a major 6th: melodic minor, natural 6 and 7, no avoid notes. Dorian\'s ♭7 would sit a half step above the 6.' },
  { id: 'min.ii', level: 'minor', mode: 'minor', from: 'M2', type: 'm7b5', numeral: 'iiø7', scales: ['locrian_n2', 'locrian'],
    why: 'The key\'s notes give Locrian; raising the 2 (Locrian ♮2, melodic minor from its 6th) takes away the ♭9 rub. Both are standard.' },
  { id: 'min.iv', level: 'minor', mode: 'minor', from: 'P4', type: 'min7', numeral: 'iv7', scales: ['dorian'],
    why: 'The minor key\'s notes from the 4th: Dorian. The key\'s 2nd becomes the chord\'s natural 13.' },
  { id: 'min.V', level: 'minor', mode: 'minor', from: 'P5', type: '7b9', numeral: 'V7♭9', to: I('P1', true), scales: ['phrygian_dominant'],
    why: 'Harmonic minor from the 5th: the key\'s ♭6 is the ♭13, its ♭2-above-the-V is the ♭9, and the raised leading tone is the 3rd. Phrygian dominant.' },
  { id: 'min.Valt', level: 'minor', mode: 'minor', from: 'P5', type: '7alt', numeral: 'V7alt', to: I('P1', true), scales: ['altered'],
    why: '♯9 and ♭13 on the V: every tension altered. The altered scale is melodic minor a half step above the root.' },
  { id: 'min.VI', level: 'minor', mode: 'minor', from: 'm6', type: 'maj7', numeral: '♭VImaj7', scales: ['lydian'],
    why: 'The minor key\'s notes from the ♭6: Lydian. The key\'s 2nd is the chord\'s ♯11.' },
  { id: 'min.VII', level: 'minor', mode: 'minor', from: 'm7', type: 'dom7', numeral: '♭VII7', scales: ['mixolydian'],
    why: 'The minor key\'s notes from the ♭7: Mixolydian. The 11 (the key\'s ♭3) is the avoid note.' },

  // chord tones plus the key's other notes
  { id: 'sec.ii', level: 'secondary', mode: 'major', from: 'M6', type: 'dom7', numeral: 'V7/ii', to: I('M2', true), scales: ['mixolydian_b6'],
    why: 'Chord tones plus the key\'s other notes: only the 3rd is new, and the key gives a natural 9 and a ♭13. Mixolydian ♭6.' },
  { id: 'sec.iii', level: 'secondary', mode: 'major', from: 'M7', type: 'dom7', numeral: 'V7/iii', to: I('M3', true), scales: ['phrygian_dominant'],
    why: 'Chord tones plus the key\'s notes: the key gives a ♭9 and a ♭13. Phrygian dominant, as for the V of any minor chord.' },
  { id: 'sec.IV', level: 'secondary', mode: 'major', from: 'P1', type: 'dom7', numeral: 'V7/IV', to: I('P4'), scales: ['mixolydian'],
    why: 'Only the ♭7 is new; everything else is the key. Mixolydian.' },
  { id: 'sec.V', level: 'secondary', mode: 'major', from: 'M2', type: 'dom7', numeral: 'V7/V', to: I('P5'), scales: ['mixolydian'],
    why: 'Only the major 3rd is new; the key gives a natural 9 and 13. Mixolydian.' },
  { id: 'sec.vi', level: 'secondary', mode: 'major', from: 'M3', type: 'dom7', numeral: 'V7/vi', to: I('M6', true), scales: ['phrygian_dominant'],
    why: 'Chord tones plus the key\'s notes: a ♭9 and a ♭13 over it. Phrygian dominant, the V of a minor chord.' },
  { id: 'sec.subV', level: 'secondary', mode: 'major', from: 'm2', type: 'dom7', numeral: '♭II7', to: I('P1'), scales: ['lydian_dom'],
    why: 'The tritone sub: its ♯11 is the V\'s root, and its scale has the same notes as the V\'s altered scale. Lydian dominant.' },

  // the tensions in the symbol pick the scale
  { id: 'dom.13', level: 'dominant', mode: 'major', from: 'P5', type: 'dom13', numeral: 'V13', to: I('P1'), scales: ['mixolydian'],
    why: '9 and 13 natural, nothing altered: Mixolydian.' },
  { id: 'dom.sus', level: 'dominant', mode: 'major', from: 'P5', type: '7sus4', numeral: 'V7sus4', to: I('P1'), scales: ['mixolydian'],
    why: 'The 4 replaces the 3rd, so the 11 is a chord tone now and the 3 is the note to pass through. Mixolydian.' },
  { id: 'dom.13b9', level: 'dominant', mode: 'major', from: 'P5', type: '13b9', numeral: 'V13♭9', to: I('P1'), scales: ['dim_hw'],
    why: '♭9 with a natural 13 (and 5): only half-whole diminished has both.' },
  { id: 'dom.13s11', level: 'dominant', mode: 'major', from: 'm2', type: '13s11', numeral: '♭II13♯11', to: I('P1'), scales: ['lydian_dom'],
    why: '9, ♯11 and 13: Mixolydian with a raised 11. Lydian dominant.' },
  { id: 'dom.9s5', level: 'dominant', mode: 'major', from: 'P5', type: '9s5', numeral: 'V9♯5', to: I('P1'), scales: ['whole_tone'],
    why: 'A natural 9 with a ♯5: whole steps all the way round. Whole tone.' },
  { id: 'dom.b13', level: 'dominant', mode: 'minor', from: 'P5', type: '7b13', numeral: 'V7♭13', to: I('P1', true), scales: ['mixolydian_b6', 'phrygian_dominant'],
    why: '♭13 over a natural 5, the 9 left natural: Mixolydian ♭6, melodic minor from its 5th. Phrygian dominant adds a ♭9 and fits too.' },
  { id: 'dom.b9b13', level: 'dominant', mode: 'minor', from: 'P5', type: '7b9b13', numeral: 'V7♭9♭13', to: I('P1', true), scales: ['phrygian_dominant', 'altered'],
    why: '♭9 and ♭13 with the 5 left in: Phrygian dominant, harmonic minor from its 5th. The altered scale fits too once you drop the 5.' },
  { id: 'dom.alt', level: 'dominant', mode: 'major', from: 'P5', type: '7alt', numeral: 'V7alt', to: I('P1'), scales: ['altered'],
    why: '♯9 and ♭13: every tension altered. The altered scale, melodic minor a half step above the root.' },

  // one scale, seven chords
  { id: 'mm.1', level: 'melodic', mode: 'none', from: 'P1', type: 'mmaj7', numeral: '', use: 'minor tonic', scales: ['melodic_minor'],
    why: 'Minor 3rd with a major 7th: melodic minor itself, no avoid notes.' },
  { id: 'mm.2', level: 'melodic', mode: 'none', from: 'P1', type: '7sus4b9', numeral: '', use: 'suspended dominant with ♭9', scales: ['dorian_b2', 'phrygian'],
    why: 'Sus4 with ♭9 and a natural 13: Dorian ♭2, melodic minor from its 2nd. Phrygian (♭13) fits too.' },
  { id: 'mm.3', level: 'melodic', mode: 'none', from: 'P1', type: 'maj7s5', numeral: '', use: 'augmented major tonic', scales: ['lydian_aug'],
    why: 'maj7 with a ♯5, and so a ♯11 too: Lydian augmented, melodic minor from its 3rd.' },
  { id: 'mm.4', level: 'melodic', mode: 'none', from: 'P1', type: '7s11', numeral: '', use: 'dominant that doesn\'t resolve down a 5th', scales: ['lydian_dom'],
    why: '♯11 on an otherwise natural dominant: Lydian dominant, melodic minor from its 4th.' },
  { id: 'mm.5', level: 'melodic', mode: 'none', from: 'P1', type: '7b13', numeral: '', use: 'V of a minor chord', scales: ['mixolydian_b6', 'phrygian_dominant'],
    why: '♭13 with a natural 9: Mixolydian ♭6, melodic minor from its 5th.' },
  { id: 'mm.6', level: 'melodic', mode: 'none', from: 'P1', type: 'm9b5', numeral: '', use: 'minor ii with a natural 9', scales: ['locrian_n2'],
    why: 'Half-diminished with a natural 9: Locrian ♮2, melodic minor from its 6th.' },
  { id: 'mm.7', level: 'melodic', mode: 'none', from: 'P1', type: '7alt', numeral: '', use: 'V resolving as hard as it can', scales: ['altered'],
    why: '♭9 ♯9 ♯11 ♭13: the altered scale, melodic minor from its 7th.' },
];

export const CS_BY_ID: Record<string, CsItem> = Object.fromEntries(CS_ITEMS.map((i) => [i.id, i]));

export const CS_LEVELS: { id: CsLevel; label: string }[] = [
  { id: 'major', label: 'Major-key chords' },
  { id: 'minor', label: 'Minor-key chords' },
  { id: 'secondary', label: 'Secondary dominants' },
  { id: 'dominant', label: 'Dominant tensions' },
  { id: 'melodic', label: 'Melodic-minor chords' },
  { id: 'mixed', label: 'Everything' },
];

export const itemsFor = (level: CsLevel): CsItem[] => (level === 'mixed' ? CS_ITEMS : CS_ITEMS.filter((i) => i.level === level));

/** Short names for the answer buttons. */
export const CS_NAME: Record<string, string> = {
  major: 'Ionian', dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian', mixolydian: 'Mixolydian', minor: 'Aeolian', locrian: 'Locrian',
  melodic_minor: 'Melodic minor', dorian_b2: 'Dorian ♭2', lydian_aug: 'Lydian augmented', lydian_dom: 'Lydian dominant',
  mixolydian_b6: 'Mixolydian ♭6', locrian_n2: 'Locrian ♮2', altered: 'Altered', phrygian_dominant: 'Phrygian dominant',
  dim_hw: 'Half-whole dim.', whole_tone: 'Whole tone',
};

/** The answers a level offers, in an order worth memorising. */
const ANSWERS: Record<Home, string[]> = {
  major: ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor', 'locrian'],
  minor: ['melodic_minor', 'dorian', 'locrian_n2', 'locrian', 'phrygian_dominant', 'altered', 'lydian', 'mixolydian'],
  secondary: ['mixolydian', 'mixolydian_b6', 'phrygian_dominant', 'lydian_dom', 'altered', 'dim_hw'],
  dominant: ['mixolydian', 'lydian_dom', 'dim_hw', 'whole_tone', 'mixolydian_b6', 'phrygian_dominant', 'altered'],
  melodic: ['melodic_minor', 'dorian_b2', 'lydian_aug', 'lydian_dom', 'mixolydian_b6', 'locrian_n2', 'altered'],
};
// Everything: the scales that suit the chord's quality, so the choice is about context and tensions
const BY_QUALITY: Record<'dom' | 'minor' | 'major', string[]> = {
  dom: ['mixolydian', 'mixolydian_b6', 'phrygian_dominant', 'lydian_dom', 'altered', 'dim_hw', 'whole_tone', 'dorian_b2'],
  minor: ['dorian', 'phrygian', 'minor', 'melodic_minor', 'locrian', 'locrian_n2'],
  major: ['major', 'lydian', 'lydian_aug', 'mixolydian', 'melodic_minor'],
};

const semisOf = (type: string) => getChord(type).intervals.map((i) => INTERVALS[i].semis);
const isDominant = (type: string) => {
  const s = semisOf(type);
  return s.includes(10) && (s.includes(4) || s.includes(5)) && !s.includes(3);
};
const isMinorish = (type: string) => semisOf(type).includes(3);

export function answersFor(item: CsItem, level: CsLevel): string[] {
  if (level !== 'mixed') return ANSWERS[item.level];
  return BY_QUALITY[isDominant(item.type) ? 'dom' : isMinorish(item.type) ? 'minor' : 'major'];
}

/** How the weak-spots list names an item. */
export function csLabel(id: string): string {
  const it = CS_BY_ID[id];
  if (!it) return id;
  if (it.level === 'major' || it.level === 'minor') return `${it.numeral} in ${it.level}`;
  if (it.level === 'melodic') return `${getChord(it.type).symbol.replace(/^m\(/, 'm(')} (${it.use})`;
  return it.numeral;
}

// ---------------------------------------------------------------- questions

export interface CsQ {
  item: CsItem;
  key: Key | null;
  root: Note;
  /** the chord it resolves to */
  target: { root: Note; minor: boolean } | null;
}

// keys a chart would be written in: up to five sharps or flats
const TONICS = MAJOR_KEYS.filter((k) => Math.abs(k.sig) <= 5).map((k) => k.tonic);
const plain = (n: Note) => Math.abs(n.acc) <= 1;

/** Every note the question will spell stays within one sharp or flat. */
export function spellsCleanly(q: CsQ): boolean {
  const notes = [...chordNotes(q.root, q.item.type), ...q.item.scales.flatMap((s) => scaleNotes(q.root, s))];
  if (q.target) notes.push(q.target.root);
  return notes.every(plain);
}

export function makeQ(item: CsItem, rnd: () => number = Math.random): CsQ {
  let q: CsQ | null = null;
  for (let tries = 0; tries < 60; tries++) {
    const major = TONICS[Math.floor(rnd() * TONICS.length)];
    const tonic = item.mode === 'minor' ? relativeMinor(major) : major;
    const key: Key | null = item.mode === 'none' ? null : { tonic, mode: item.mode };
    const root = transpose(tonic, item.from);
    const target = item.to ? { root: transpose(tonic, item.to.from), minor: item.to.minor } : null;
    q = { item, key, root, target };
    if (spellsCleanly(q)) return q;
  }
  // C (or A minor) always spells cleanly
  const tonic = item.mode === 'minor' ? relativeMinor(TONICS.find((t) => pc(t) === 0)!) : TONICS.find((t) => pc(t) === 0)!;
  return {
    item,
    key: item.mode === 'none' ? null : { tonic, mode: item.mode },
    root: transpose(tonic, item.from),
    target: item.to ? { root: transpose(tonic, item.to.from), minor: item.to.minor } : null,
  };
}

// ---------------------------------------------------------------- the scale over the chord

export type Role = 'root' | 'chord' | 'tension' | 'avoid';

export interface ScaleTone {
  note: Note;
  /** semitones above the chord root, 0–11 */
  semis: number;
  /** what it is over the chord: "R", "♭3", "9", "♯11", "♭13" */
  label: string;
  role: Role;
}

const TENSION_LABEL: Record<number, string> = { 1: '♭9', 2: '9', 3: '♯9', 5: '11', 6: '♯11', 8: '♭13', 9: '13', 10: '♭7', 11: '7' };

/** The chord's own tones below the 9th (semitones), with the 5th implied when the symbol leaves it out. */
export function chordToneSemis(type: string): Map<number, string> {
  const tones = new Map<number, string>();
  for (const id of getChord(type).intervals) {
    const iv = INTERVALS[id];
    if (iv.semis < 12) tones.set(iv.semis, id === 'P1' ? 'R' : iv.degree);
  }
  // 7alt and 7♭9♭13 drop the 5th from the symbol; it is still the chord's 5th when a scale has it
  if (!tones.has(6) && !tones.has(7) && !tones.has(8)) tones.set(7, '5');
  return tones;
}

/**
 * Each note of `scaleId` from `root` over the chord. Avoid notes: a scale
 * note a half step above a chord tone; on a dominant only the 11 (it buries
 * the 3rd: the ♭9 and ♭13 rubs are the point), and on a sus chord the 3rd.
 */
export function overChord(root: Note, type: string, scaleId: string): ScaleTone[] {
  const tones = chordToneSemis(type);
  const sus = !tones.has(3) && !tones.has(4) && tones.has(5);
  const dominant = tones.has(4) && tones.has(10);
  const notes = scaleNotes(root, scaleId);
  return getScale(scaleId).intervals.map((id, i) => {
    const semis = INTERVALS[id].semis;
    if (tones.has(semis)) return { note: notes[i], semis, label: tones.get(semis)!, role: semis === 0 ? 'root' : 'chord' };
    const avoid = sus ? semis === 4 : dominant ? semis === 5 : tones.has(mod(semis - 1, 12));
    const label = sus && semis === 4 ? '3' : TENSION_LABEL[semis] ?? INTERVALS[id].degree;
    return { note: notes[i], semis, label, role: avoid ? 'avoid' : 'tension' };
  });
}

/** Scales in `ids` whose first `played` notes (semitones above the root, in order) match. */
export function stillFits(ids: string[], played: number[]): string[] {
  return ids.filter((id) => {
    const s = getScale(id).intervals.map((i) => INTERVALS[i].semis);
    return played.every((p, i) => (i === s.length ? p === 12 : s[i] === p));
  });
}

/** A chord to hold under the scale: the root low, the rest of the symbol above it. */
export function chordVoicing(rootPc: number, type: string): number[] {
  const c = getChord(type);
  const drop5 = c.intervals.length > 4 && c.optional?.includes('P5');
  const upper = c.intervals
    .filter((i) => i !== 'P1' && !(drop5 && i === 'P5'))
    .map((i) => 48 + rootPc + INTERVALS[i].semis);
  return [36 + rootPc, ...upper].sort((a, b) => a - b);
}

/** Where a melodic-minor mode comes from: its parent's tonic and the degree it starts on. */
const MM_MODES = ['melodic_minor', 'dorian_b2', 'lydian_aug', 'lydian_dom', 'mixolydian_b6', 'locrian_n2', 'altered'];
export function melodicParent(root: Note, scaleId: string): { tonic: Note; degree: number } | null {
  const d = MM_MODES.indexOf(scaleId);
  if (d < 0) return null;
  return { tonic: transpose(root, getScale('melodic_minor').intervals[d], -1), degree: d + 1 };
}
