import { INTERVALS, mod, noteName, pc, spellPc, transpose, type Note, type Spelling } from './core';

export type ChordFamily = 'triad' | 'sus' | 'power' | 'seventh' | 'sixth' | 'extended' | 'altered';

export interface ChordType {
  id: string;
  name: string;
  /** suffix after the root letter: "m7", "maj7", "°" … */
  symbol: string;
  intervals: string[];
  family: ChordFamily;
  /** Intervals a real voicing may leave out (usually the 5th). */
  optional?: string[];
  /** One-line description of the sound / usage. */
  sound: string;
}

export const CHORD_TYPES: ChordType[] = [
  // triads & sus
  { id: 'maj', name: 'Major triad', symbol: '', intervals: ['P1', 'M3', 'P5'], family: 'triad', sound: 'Stable, consonant — the building block of upper-structure voicings.' },
  { id: 'min', name: 'Minor triad', symbol: 'm', intervals: ['P1', 'm3', 'P5'], family: 'triad', sound: 'Darker consonance; in jazz usually extended to m7/m9/m6.' },
  { id: 'dim', name: 'Diminished triad', symbol: '°', intervals: ['P1', 'm3', 'd5'], family: 'triad', sound: 'Two stacked minor 3rds; the leading-tone triad (vii°) in Bach.' },
  { id: 'aug', name: 'Augmented triad', symbol: '+', intervals: ['P1', 'M3', 'A5'], family: 'triad', sound: 'Symmetrical (three major 3rds); whole-tone colour.' },
  { id: 'sus2', name: 'Sus2', symbol: 'sus2', intervals: ['P1', 'M2', 'P5'], family: 'sus', sound: 'Open, ambiguous — no 3rd.' },
  { id: 'sus4', name: 'Sus4', symbol: 'sus4', intervals: ['P1', 'P4', 'P5'], family: 'sus', sound: 'The 4th hangs over the 3rd — the classic 4–3 suspension.' },
  { id: 'pow', name: 'Root + 5th', symbol: '5', intervals: ['P1', 'P5'], family: 'power', sound: 'Bare 5th — no quality.' },
  // sevenths
  { id: 'maj7', name: 'Major 7th', symbol: 'maj7', intervals: ['P1', 'M3', 'P5', 'M7'], family: 'seventh', optional: ['P5'], sound: 'Imaj7 / IVmaj7. Tensions 9, ♯11, 13; the natural 11 is an avoid note.' },
  { id: 'dom7', name: 'Dominant 7th', symbol: '7', intervals: ['P1', 'M3', 'P5', 'm7'], family: 'seventh', optional: ['P5'], sound: 'Contains the 3–♭7 tritone; takes every tension, natural or altered.' },
  { id: 'min7', name: 'Minor 7th', symbol: 'm7', intervals: ['P1', 'm3', 'P5', 'm7'], family: 'seventh', optional: ['P5'], sound: 'ii7 / vi7 / iii7. Dorian ii takes 9, 11, 13.' },
  { id: 'm7b5', name: 'Half-diminished', symbol: 'm7♭5', intervals: ['P1', 'm3', 'd5', 'm7'], family: 'seventh', sound: 'iiø7 of minor; = m6 chord over its 6th (Cm6/A). Locrian ♮2 adds the 9.' },
  { id: 'dim7', name: 'Diminished 7th', symbol: '°7', intervals: ['P1', 'm3', 'd5', 'd7'], family: 'seventh', sound: 'Symmetrical: four inversions share the same notes. Rootless 7♭9.' },
  { id: 'mmaj7', name: 'Minor-major 7th', symbol: 'm(maj7)', intervals: ['P1', 'm3', 'P5', 'M7'], family: 'seventh', optional: ['P5'], sound: 'Melodic/harmonic-minor tonic: the film-noir i chord.' },
  { id: 'maj7s5', name: 'Major 7♯5', symbol: 'maj7♯5', intervals: ['P1', 'M3', 'A5', 'M7'], family: 'seventh', sound: 'Lydian augmented (3rd mode of melodic minor).' },
  { id: '7sus4', name: 'Dominant 7sus4', symbol: '7sus4', intervals: ['P1', 'P4', 'P5', 'm7'], family: 'sus', optional: ['P5'], sound: 'Suspended dominant: ii/V in one chord (G7sus4 ≈ Dm7/G).' },
  { id: 'aug7', name: 'Dominant 7♯5', symbol: '7♯5', intervals: ['P1', 'M3', 'A5', 'm7'], family: 'altered', sound: 'Whole-tone dominant.' },
  { id: '7b5', name: 'Dominant 7♭5', symbol: '7♭5', intervals: ['P1', 'M3', 'd5', 'm7'], family: 'altered', sound: 'Tritone-symmetrical: G7♭5 = D♭7♭5. French-sixth sound.' },
  // sixths
  { id: 'maj6', name: 'Major 6th', symbol: '6', intervals: ['P1', 'M3', 'P5', 'M6'], family: 'sixth', optional: ['P5'], sound: 'Swing-era tonic; avoids the maj7–root rub.' },
  { id: 'min6', name: 'Minor 6th', symbol: 'm6', intervals: ['P1', 'm3', 'P5', 'M6'], family: 'sixth', optional: ['P5'], sound: 'Melodic-minor tonic; Cm6 = Am7♭5/C.' },
  { id: '69', name: 'Six-nine', symbol: '6/9', intervals: ['P1', 'M3', 'P5', 'M6', 'M9'], family: 'extended', optional: ['P5'], sound: 'Pentatonic tonic — very open final chord.' },
  { id: 'm69', name: 'Minor six-nine', symbol: 'm6/9', intervals: ['P1', 'm3', 'P5', 'M6', 'M9'], family: 'extended', optional: ['P5'], sound: 'Dorian/melodic-minor tonic colour.' },
  // ninths
  { id: 'add9', name: 'Add 9', symbol: 'add9', intervals: ['P1', 'M3', 'P5', 'M9'], family: 'extended', optional: ['P5'], sound: 'Triad + 9, no 7th.' },
  { id: 'madd9', name: 'Minor add 9', symbol: 'm(add9)', intervals: ['P1', 'm3', 'P5', 'M9'], family: 'extended', optional: ['P5'], sound: 'm3 against the 9 — a whole-step cluster.' },
  { id: 'maj9', name: 'Major 9th', symbol: 'maj9', intervals: ['P1', 'M3', 'P5', 'M7', 'M9'], family: 'extended', optional: ['P5'], sound: 'Neo-soul tonic and IV.' },
  { id: 'dom9', name: 'Dominant 9th', symbol: '9', intervals: ['P1', 'M3', 'P5', 'm7', 'M9'], family: 'extended', optional: ['P5'], sound: 'The funk chord — James Brown vamps.' },
  { id: 'min9', name: 'Minor 9th', symbol: 'm9', intervals: ['P1', 'm3', 'P5', 'm7', 'M9'], family: 'extended', optional: ['P5'], sound: 'Smooth Dorian ii / i.' },
  { id: 'mmaj9', name: 'Minor-major 9th', symbol: 'm(maj9)', intervals: ['P1', 'm3', 'P5', 'M7', 'M9'], family: 'extended', optional: ['P5'], sound: 'Melodic-minor tonic, full.' },
  { id: '9sus4', name: '9sus4', symbol: '9sus4', intervals: ['P1', 'P4', 'P5', 'm7', 'M9'], family: 'sus', optional: ['P5'], sound: 'F/G sound (IV over V): gospel/R&B dominant.' },
  { id: 'm9b5', name: 'Half-diminished 9', symbol: 'm9♭5', intervals: ['P1', 'm3', 'd5', 'm7', 'M9'], family: 'extended', sound: 'Locrian ♮2 — the smoother minor ii.' },
  // elevenths
  { id: 'min11', name: 'Minor 11th', symbol: 'm11', intervals: ['P1', 'm3', 'P5', 'm7', 'M9', 'P11'], family: 'extended', optional: ['P5', 'M9'], sound: 'Quartal-friendly Dorian colour (So What voicing).' },
  { id: 'dom11', name: 'Dominant 11th', symbol: '11', intervals: ['P1', 'P5', 'm7', 'M9', 'P11'], family: 'extended', optional: ['P5', 'M9'], sound: '3rd omitted: the slash-chord IV/V sound.' },
  { id: 'maj7s11', name: 'Major 7♯11', symbol: 'maj7♯11', intervals: ['P1', 'M3', 'P5', 'M7', 'A11'], family: 'extended', optional: ['P5'], sound: 'Lydian tonic / IVmaj7.' },
  { id: 'maj9s11', name: 'Major 9♯11', symbol: 'maj9♯11', intervals: ['P1', 'M3', 'P5', 'M7', 'M9', 'A11'], family: 'extended', optional: ['P5'], sound: 'Full Lydian sound.' },
  { id: '7s11', name: 'Dominant 7♯11', symbol: '7♯11', intervals: ['P1', 'M3', 'P5', 'm7', 'A11'], family: 'altered', optional: ['P5'], sound: 'Lydian dominant: the sound of subV7 and non-resolving dominants.' },
  // thirteenths
  { id: 'dom13', name: 'Dominant 13th', symbol: '13', intervals: ['P1', 'M3', 'P5', 'm7', 'M9', 'M13'], family: 'extended', optional: ['P5', 'M9'], sound: 'Mixolydian, unaltered — big-band and funk horns.' },
  { id: '13sus4', name: '13sus4', symbol: '13sus4', intervals: ['P1', 'P4', 'P5', 'm7', 'M9', 'M13'], family: 'sus', optional: ['P5', 'M9'], sound: 'Neo-soul / Herbie (Maiden Voyage) sus colour.' },
  { id: 'maj13', name: 'Major 13th', symbol: 'maj13', intervals: ['P1', 'M3', 'P5', 'M7', 'M9', 'M13'], family: 'extended', optional: ['P5', 'M9'], sound: 'Lush tonic.' },
  { id: 'min13', name: 'Minor 13th', symbol: 'm13', intervals: ['P1', 'm3', 'P5', 'm7', 'M9', 'M13'], family: 'extended', optional: ['P5', 'M9'], sound: 'Dorian signature (♮13 on a minor chord).' },
  { id: '13b9', name: 'Dominant 13♭9', symbol: '13♭9', intervals: ['P1', 'M3', 'P5', 'm7', 'm9', 'M13'], family: 'altered', optional: ['P5'], sound: 'Half-whole diminished dominant.' },
  { id: '13s11', name: 'Dominant 13♯11', symbol: '13♯11', intervals: ['P1', 'M3', 'm7', 'M9', 'A11', 'M13'], family: 'altered', optional: ['M9'], sound: 'Lydian dominant, full.' },
  // altered dominants
  { id: '7b9', name: 'Dominant 7♭9', symbol: '7♭9', intervals: ['P1', 'M3', 'P5', 'm7', 'm9'], family: 'altered', optional: ['P5'], sound: 'V7♭9 → minor (harmonic minor) or diminished-scale colour.' },
  { id: '7s9', name: 'Dominant 7♯9', symbol: '7♯9', intervals: ['P1', 'M3', 'P5', 'm7', 'A9'], family: 'altered', optional: ['P5'], sound: 'Major 3rd against the ♯9 (= ♭3): funk, blues, Hendrix.' },
  { id: '7b13', name: 'Dominant 7♭13', symbol: '7♭13', intervals: ['P1', 'M3', 'P5', 'm7', 'm13'], family: 'altered', optional: ['P5'], sound: 'Mixolydian ♭6 — the V of a minor ii in a turnaround (A7♭13 → Dm).' },
  { id: '7b9b13', name: 'Dominant 7♭9♭13', symbol: '7♭9♭13', intervals: ['P1', 'M3', 'm7', 'm9', 'm13'], family: 'altered', sound: 'Phrygian dominant: V of minor.' },
  { id: '7alt', name: 'Altered dominant', symbol: '7alt', intervals: ['P1', 'M3', 'm7', 'A9', 'm13'], family: 'altered', sound: 'Altered scale: ♭9 ♯9 ♯11 ♭13 — maximum pull to I.' },
];

export const CHORD_BY_ID: Record<string, ChordType> = Object.fromEntries(CHORD_TYPES.map((c) => [c.id, c]));

export function getChord(id: string): ChordType {
  const c = CHORD_BY_ID[id];
  if (!c) throw new Error(`Unknown chord type ${id}`);
  return c;
}

export function chordNotes(root: Note, typeId: string): Note[] {
  return getChord(typeId).intervals.map((i) => transpose(root, i));
}

export function chordPcs(rootPc: number, typeId: string): number[] {
  return getChord(typeId).intervals.map((i) => mod(rootPc + INTERVALS[i].semis, 12));
}

export function chordSymbol(root: Note, typeId: string, bass?: Note | null): string {
  const base = noteName(root) + getChord(typeId).symbol;
  if (bass && pc(bass) !== pc(root)) return `${base}/${noteName(bass)}`;
  return base;
}

/** Chord tone label ("R", "3", "♭7"…) for a pitch class relative to a chord. */
export function chordToneLabel(rootPc: number, typeId: string, p: number): string | null {
  const semis = mod(p - rootPc, 12);
  for (const i of getChord(typeId).intervals) {
    const iv = INTERVALS[i];
    if (mod(iv.semis, 12) === semis) return iv.id === 'P1' ? 'R' : iv.degree;
  }
  return null;
}

export interface DetectedChord {
  rootPc: number;
  bassPc: number;
  typeId: string;
  name: string;
  /** true when every chord tone (including optional ones) is present */
  complete: boolean;
}

const FAMILY_BONUS: Record<ChordFamily, number> = {
  triad: 3, seventh: 2.5, power: 2, sus: 1.5, sixth: 1, extended: 0.5, altered: 0.3,
};

/**
 * Name the chord formed by a set of MIDI notes (any voicing / inversion).
 * Returns null when the notes don't form a recognisable chord.
 */
export function detectChord(midis: number[], spelling: Spelling = 'auto'): DetectedChord | null {
  if (midis.length < 2) return null;
  const sorted = [...midis].sort((a, b) => a - b);
  const bassPc = mod(sorted[0], 12);
  const played = new Set(sorted.map((m) => mod(m, 12)));
  if (played.size < 2) return null;

  let best: { score: number; d: DetectedChord } | null = null;
  for (const rootPc of played) {
    for (const t of CHORD_TYPES) {
      const full = t.intervals.map((i) => mod(INTERVALS[i].semis, 12));
      const fullSet = new Set(full);
      const required = t.intervals.filter((i) => !t.optional?.includes(i)).map((i) => mod(rootPc + INTERVALS[i].semis, 12));
      const fullAbs = new Set([...fullSet].map((s) => mod(rootPc + s, 12)));
      let ok = true;
      for (const p of played) if (!fullAbs.has(p)) { ok = false; break; }
      if (!ok) continue;
      if (!required.every((p) => played.has(p))) continue;
      const complete = fullAbs.size === played.size;
      let score = FAMILY_BONUS[t.family];
      if (rootPc === bassPc) score += 4;
      if (complete) score += 2;
      score -= Math.max(0, fullAbs.size - played.size) * 0.5;
      if (!best || score > best.score) {
        const root = spellPc(rootPc, spelling);
        const bass = spellPc(bassPc, spelling);
        best = {
          score,
          d: { rootPc, bassPc, typeId: t.id, complete, name: chordSymbol(root, t.id, bass) },
        };
      }
    }
  }
  return best?.d ?? null;
}

/** Interval stack of a chord from root, e.g. "R  3  5  ♭7". */
export function chordFormula(typeId: string): string {
  return getChord(typeId).intervals.map((i) => (i === 'P1' ? 'R' : INTERVALS[i].degree)).join(' – ');
}
