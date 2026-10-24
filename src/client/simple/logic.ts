// Pure exercise logic for the practice modes (no DOM, no audio), so it can be tested.

export type Dir = 'up' | 'down' | 'updown';
export type Pattern = 'straight' | 'thirds' | 'fourths' | 'fours' | 'triads' | 'sevenths';

const GROUP: Record<Pattern, number[]> = { straight: [0], thirds: [0, 2], fourths: [0, 3], fours: [0, 1, 2, 3], triads: [0, 2, 4], sevenths: [0, 2, 4, 6] };

/**
 * Scale-degree indexes of a scale exercise: 0 = root, n = the octave. Patterns
 * start a group on every degree of the range and then land on the top note, so
 * "in 3rds" in C runs C-E D-F … B-D C; descending mirrors the ascending line.
 */
export function degreeLine(n: number, octaves: number, pattern: Pattern, dir: Dir): number[] {
  const top = n * octaves;
  const up: number[] = [];
  if (pattern === 'straight') for (let d = 0; d <= top; d++) up.push(d);
  else {
    for (let i = 0; i < top; i++) up.push(...GROUP[pattern].map((x) => i + x));
    up.push(top);
  }
  const down = up.map((d) => top - d);
  return dir === 'up' ? up : dir === 'down' ? down : [...up, ...down.slice(1)];
}

export type NumeralLevel = 'basic' | 'diatonic' | 'sevenths' | 'minor' | 'secondary' | 'borrowed' | 'subs';

/** Roman numerals to listen for; the first one is the tonic every progression starts on. */
export const NUMERAL_SETS: Record<NumeralLevel, string[]> = {
  basic: ['I', 'IV', 'V', 'vi'],
  diatonic: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  sevenths: ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'],
  minor: ['i', 'iiø7', '♭III', 'iv', 'V7', '♭VI', '♭VII'],
  secondary: ['I', 'ii', 'IV', 'V', 'vi', 'V7/ii', 'V7/IV', 'V7/V', 'V7/vi'],
  borrowed: ['I', 'ii', 'IV', 'V', 'vi', 'iv', '♭III', '♭VI', '♭VII'],
  subs: ['Imaj7', 'ii7', 'V7', 'vi7', 'VI7', '♭II7', '♭III7', '♭VI7'],
};

/**
 * Chords that only make sense going somewhere: a secondary dominant resolves to
 * its target, a tritone sub down a half step.
 */
export const RESOLVES: Record<string, string> = {
  'V7/ii': 'ii', 'V7/IV': 'IV', 'V7/V': 'V', 'V7/vi': 'vi',
  '♭II7': 'Imaj7', VI7: 'ii7', '♭III7': 'ii7', '♭VI7': 'V7',
};

/**
 * A progression that starts on the tonic and never repeats a chord back to back.
 * Chords in RESOLVES are followed by their resolution and never end it.
 * `pick` chooses each next chord (the app leans it toward the ones you miss).
 */
export function randomProgression(set: string[], len = 4, rnd: () => number = Math.random, pick?: (choices: string[]) => string): string[] {
  const out = [set[0]];
  while (out.length < len) {
    const last = out[out.length - 1];
    const to = RESOLVES[last];
    if (to && set.includes(to)) {
      out.push(to);
      continue;
    }
    // the last chord can't leave you hanging on one that needs resolving
    const final = out.length === len - 1;
    const choices = set.filter((c) => c !== last && !(final && RESOLVES[c] && set.includes(RESOLVES[c])) && RESOLVES[c] !== last);
    out.push(pick ? pick(choices) : choices[Math.floor(rnd() * choices.length)]);
  }
  return out;
}
