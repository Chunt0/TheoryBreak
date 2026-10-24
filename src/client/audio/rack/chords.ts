// The CHORD module's harmony: chord types, diatonic chords in a key,
// inversions and voicings. Shared by the DSP (which plays the chord) and the
// panel (which names it).

export const NOTE_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

export interface ChordType {
  /** short panel label */
  label: string;
  /** chord symbol suffix */
  symbol: string;
  semis: number[];
}

export const CHORD_TYPES: ChordType[] = [
  { label: 'Maj', symbol: '', semis: [0, 4, 7] },
  { label: 'Min', symbol: 'm', semis: [0, 3, 7] },
  { label: '7', symbol: '7', semis: [0, 4, 7, 10] },
  { label: 'Maj7', symbol: 'maj7', semis: [0, 4, 7, 11] },
  { label: 'm7', symbol: 'm7', semis: [0, 3, 7, 10] },
  { label: 'm7♭5', symbol: 'm7♭5', semis: [0, 3, 6, 10] },
  { label: '°7', symbol: '°7', semis: [0, 3, 6, 9] },
  { label: 'sus4', symbol: 'sus4', semis: [0, 5, 7] },
  { label: '6', symbol: '6', semis: [0, 4, 7, 9] },
  { label: 'm6', symbol: 'm6', semis: [0, 3, 7, 9] },
  { label: '9', symbol: '9', semis: [0, 4, 7, 10, 14] },
  { label: 'Maj9', symbol: 'maj9', semis: [0, 4, 7, 11, 14] },
  { label: 'm9', symbol: 'm9', semis: [0, 3, 7, 10, 14] },
  { label: '13', symbol: '13', semis: [0, 4, 10, 14, 21] },
  { label: '7♯9', symbol: '7♯9', semis: [0, 4, 7, 10, 15] },
  // the last two build on the key: the diatonic triad or 7th chord on the note played
  { label: 'Key 3', symbol: '', semis: [] },
  { label: 'Key 7', symbol: '', semis: [] },
];
export const DIATONIC_TRIAD = CHORD_TYPES.length - 2;
export const DIATONIC_7TH = CHORD_TYPES.length - 1;
export const VOICINGS = ['Close', 'Drop 2', 'Spread'];

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

/** Quality suffix of a stack of semitones above its root (for naming diatonic chords). */
function suffixOf(semis: number[]): string {
  const key = semis.join(',');
  const hit = CHORD_TYPES.find((t) => t.semis.join(',') === key);
  if (hit) return hit.symbol;
  return key === '0,3,6' ? '°' : key === '0,4,8' ? '+' : '';
}

export interface Chord {
  /** semitones above middle C of every tone, low to high */
  tones: number[];
  /** the chord's root, semitones above middle C */
  root: number;
  /** chord symbol, e.g. "Dm7" */
  name: string;
}

/**
 * Build a chord on `note` (semitones from middle C, already rounded).
 * Diatonic types snap the note down to the key's major scale and stack thirds from there.
 */
export function buildChord(note: number, type: number, key: number, inversion: number, voicing: number): Chord {
  const t = Math.max(0, Math.min(CHORD_TYPES.length - 1, Math.round(type)));
  let root = note;
  let semis: number[];
  if (t === DIATONIC_TRIAD || t === DIATONIC_7TH) {
    const rel = (((note - key) % 12) + 12) % 12;
    let deg = 6;
    while (MAJOR[deg] > rel) deg--;
    root = note - (rel - MAJOR[deg]);
    const count = t === DIATONIC_TRIAD ? 3 : 4;
    semis = [];
    for (let k = 0; k < count; k++) {
      const d = deg + 2 * k;
      semis.push(MAJOR[d % 7] + 12 * Math.floor(d / 7) - MAJOR[deg]);
    }
  } else {
    semis = [...CHORD_TYPES[t].semis];
  }
  const name = `${NOTE_NAMES[((root % 12) + 12) % 12]}${t >= DIATONIC_TRIAD ? suffixOf(semis) : CHORD_TYPES[t].symbol}`;
  let tones = semis.map((s) => root + s);
  // inversions: the lowest tone goes up an octave, once per step
  const inv = ((Math.round(inversion) % tones.length) + tones.length) % tones.length;
  for (let k = 0; k < inv; k++) {
    tones.push(tones.shift()! + 12);
  }
  tones.sort((a, b) => a - b);
  if (voicing === 1 && tones.length >= 3) {
    // drop 2: the second voice from the top goes down an octave
    tones[tones.length - 2] -= 12;
  } else if (voicing === 2) {
    // spread: every other voice up an octave
    tones = tones.map((x, i) => (i % 2 ? x + 12 : x));
  }
  tones.sort((a, b) => a - b);
  return { tones, root, name };
}
