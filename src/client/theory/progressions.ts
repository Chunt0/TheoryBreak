// Progression library. Chords are written as symbols in a reference key and
// transposed for playback/ear training; numerals are the analysis shown.

export type ProgGroup = 'jazz' | 'subs' | 'soul' | 'funk' | 'bach';

export interface ProgressionDef {
  id: string;
  name: string;
  group: ProgGroup;
  /** reference key, e.g. "C" or "Am" */
  key: string;
  chords: string[];
  numerals: string[];
  /** beats per chord (default 4) */
  beats?: number[];
  description: string;
  heardIn: string[];
}

export const PROG_GROUP_NAMES: Record<ProgGroup, string> = {
  jazz: 'Jazz core',
  subs: 'Substitutions',
  soul: 'R&B / neo-soul / gospel',
  funk: 'Funk vamps',
  bach: 'Bach & common practice',
};

export const PROGRESSIONS: ProgressionDef[] = [
  // --- jazz core
  { id: 'ii-v-i', name: 'ii–V–I', group: 'jazz', key: 'C', chords: ['Dm9', 'G13', 'Cmaj9', 'Cmaj9'], numerals: ['ii9', 'V13', 'Imaj9', 'Imaj9'],
    description: 'The cadence of tonal jazz: predominant → dominant → tonic, guide tones moving by half step (7 of ii → 3 of V; 7 of V → 3 of I).', heardIn: ['"Autumn Leaves"', '"Satin Doll"', 'every bebop head'] },
  { id: 'minor-ii-v-i', name: 'Minor ii–V–i', group: 'jazz', key: 'Cm', chords: ['Dm7b5', 'G7b9', 'Cm6', 'Cm6'], numerals: ['iiø7', 'V7♭9', 'i6', 'i6'],
    description: 'Harmonic-minor cadence: half-diminished ii, V7♭9, minor tonic (m6 or m(maj7) rather than m7).', heardIn: ['"Autumn Leaves" (relative minor)', '"Blue Bossa"', '"Alone Together"'] },
  { id: 'turn-1625', name: 'I–VI7–ii–V turnaround', group: 'jazz', key: 'C', chords: ['Cmaj7', 'A7b13', 'Dm7', 'G7'], numerals: ['Imaj7', 'VI7♭13', 'ii7', 'V7'],
    description: 'vi becomes VI7 (V7/ii) to add chromatic pull into the ii–V.', heardIn: ['"I Got Rhythm" A section', 'countless endings'] },
  { id: 'turn-3625', name: 'iii–VI–ii–V', group: 'jazz', key: 'C', chords: ['Em7', 'A7', 'Dm7', 'G7'], numerals: ['iii7', 'VI7', 'ii7', 'V7'],
    description: 'iii substitutes for I; a chain of descending fifths back to the tonic.', heardIn: ['"I Got Rhythm" variations', '"Fly Me to the Moon"'] },
  { id: 'rhythm-bridge', name: 'Rhythm-changes bridge', group: 'jazz', key: 'Bb', chords: ['D7', 'G7', 'C7', 'F7'], numerals: ['III7', 'VI7', 'II7', 'V7'],
    description: 'Extended dominants: each V7 resolves to another V7 around the cycle of fifths ("Sears Roebuck bridge").', heardIn: ['"I Got Rhythm"', '"Oleo"', '"Anthropology"'] },
  { id: 'cycle-5ths', name: 'Diatonic cycle of fifths', group: 'jazz', key: 'Am', chords: ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am7'], numerals: ['i7', 'iv7', '♭VII7', '♭IIImaj7', '♭VImaj7', 'iiø7', 'V7', 'i7'],
    description: 'Roots fall in fifths through every diatonic chord — the engine of Baroque sequences and jazz standards alike.', heardIn: ['"Autumn Leaves"', '"I Will Survive"', '"Fly Me to the Moon"'] },

  // --- substitutions
  { id: 'tritone-sub', name: 'ii–subV–I', group: 'subs', key: 'C', chords: ['Dm7', 'Db7', 'Cmaj7', 'Cmaj7'], numerals: ['ii7', '♭II7', 'Imaj7', 'Imaj7'],
    description: 'D♭7 shares G7\'s tritone (F–C♭/B), so it resolves the same way — with a chromatic bass D–D♭–C.', heardIn: ['"The Girl from Ipanema" (G♭7 → Fmaj7)', '"Satin Doll"'] },
  { id: 'backdoor', name: 'Backdoor ii–V', group: 'subs', key: 'C', chords: ['Fm7', 'Bb7', 'Cmaj7', 'Cmaj7'], numerals: ['iv7', '♭VII7', 'Imaj7', 'Imaj7'],
    description: 'Borrowed iv7–♭VII7 from the parallel minor: the ♭VII7 slides into I by whole step instead of resolving down a 5th.', heardIn: ['"Lady Bird"', '"There Will Never Be Another You"', '"Just Friends"'] },
  { id: 'ladybird', name: 'Lady Bird turnaround', group: 'subs', key: 'C', chords: ['Cmaj7', 'Eb7', 'Abmaj7', 'Db7'], numerals: ['Imaj7', '♭III7', '♭VImaj7', '♭II7'],
    description: 'Tritone-substituted I–VI–ii–V: every chord is a half step above its diatonic counterpart\'s target.', heardIn: ['Tadd Dameron, "Lady Bird"', 'endings of standards'] },
  { id: 'coltrane', name: 'Coltrane cycle', group: 'subs', key: 'B', chords: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7', 'Bmaj7'], numerals: ['Imaj7', '♭III7', '♭VImaj7', 'VII7', 'IIImaj7', 'V7', 'Imaj7', 'Imaj7'],
    description: 'Three tonal centres a major 3rd apart (B, G, E♭), each approached by its own V7.', heardIn: ['"Giant Steps"', '"Countdown"'] },
  { id: 'chromatic-ii-v', name: 'Chromatic ii–V chain', group: 'subs', key: 'C', chords: ['Em7', 'A7', 'Ebm7', 'Ab7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7'], numerals: ['iii7', 'VI7', '♭iii7', '♭VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'],
    description: 'Whole ii–V cells slide down by half step toward the target — chromatic planing of the cadence itself.', heardIn: ['"Satin Doll" (Am7–D7 → A♭m7–D♭7)', 'bebop reharmonisation'] },

  // --- R&B / neo-soul / gospel
  { id: 'two-of-us', name: '"Just the Two of Us" progression', group: 'soul', key: 'Ab', chords: ['Dbmaj7', 'C7', 'Fm7', 'Ebm7', 'Ab7'], numerals: ['IVmaj7', 'III7', 'vi7', 'v7', 'I7'], beats: [4, 4, 4, 2, 2],
    description: 'IVmaj7 → III7 (V of vi) → vi7, then v7–I7 as a ii–V back to IV. Endlessly recycled in R&B and hip-hop.', heardIn: ['Grover Washington Jr. & Bill Withers', 'countless samples'] },
  { id: 'neo-descend', name: 'Neo-soul diatonic descent', group: 'soul', key: 'C', chords: ['Fmaj9', 'Em9', 'Dm9', 'Cmaj9'], numerals: ['IVmaj9', 'iii9', 'ii9', 'Imaj9'],
    description: 'Parallel 9th chords stepping down the scale; colour over function.', heardIn: ['D\'Angelo / Erykah Badu vocabulary'] },
  { id: 'soul-turn', name: 'Soul turnaround with IV/V', group: 'soul', key: 'C', chords: ['Cmaj9', 'Am9', 'Dm9', 'F/G'], numerals: ['Imaj9', 'vi9', 'ii9', 'IV/V'],
    description: 'IV over the V bass (a 9sus4/11 sound) replaces V7: a softer gospel/R&B dominant.', heardIn: ['Stevie Wonder, Donny Hathaway, gospel turnarounds'] },
  { id: 'gospel-walkup', name: 'Gospel passing diminished', group: 'soul', key: 'C', chords: ['C', 'F', 'F#dim7', 'C/G', 'A7', 'Dm7', 'G7', 'C'], numerals: ['I', 'IV', '♯iv°7', 'I/5', 'VI7', 'ii7', 'V7', 'I'],
    description: '♯iv°7 connects IV to I/5 chromatically in the bass (F–F♯–G); then the classic VI7–ii–V–I.', heardIn: ['Church turnarounds', 'gospel ballads'] },
  { id: 'minor-plagal', name: 'Minor plagal ("Amen" with iv)', group: 'soul', key: 'C', chords: ['Cmaj7', 'Fmaj7', 'Fm6', 'Cmaj7'], numerals: ['Imaj7', 'IVmaj7', 'iv6', 'Imaj7'],
    description: 'IV → iv borrows A♭ from C minor; the ♭6 falls to 5. Bittersweet resolution without a dominant.', heardIn: ['Beatles, Stevie Wonder, gospel endings'] },
  { id: 'rnb-backdoor', name: 'R&B backdoor', group: 'soul', key: 'C', chords: ['Cmaj9', 'Fm9', 'Bb13', 'Cmaj9'], numerals: ['Imaj9', 'iv9', '♭VII13', 'Imaj9'],
    description: 'Backdoor ii–V with lush extensions — the "smooth" cadence.', heardIn: ['Quiet storm ballads'] },

  // --- funk
  { id: 'dorian-vamp', name: 'Dorian i7–IV9 vamp', group: 'funk', key: 'Bbm', chords: ['Bbm7', 'Eb9', 'Bbm7', 'Eb9'], numerals: ['i7', 'IV9', 'i7', 'IV9'],
    description: 'The major IV in a minor key = Dorian ♮6. Static harmony; the groove does the work.', heardIn: ['"Chameleon" (Herbie Hancock)', '"Oye Como Va" family'] },
  { id: 'dom-vamp', name: 'Dominant I9–IV13 vamp', group: 'funk', key: 'E', chords: ['E9', 'A13', 'E9', 'A13'], numerals: ['I9', 'IV13', 'I9', 'IV13'],
    description: 'Blues-derived funk: both chords are dominants (Mixolydian), 3rds and 7ths swap by half step.', heardIn: ['James Brown', 'The Meters'] },
  { id: 'minor-funk-chromatic', name: 'Minor vamp + chromatic neighbour', group: 'funk', key: 'Em', chords: ['Em9', 'F9', 'Em9', 'A13'], numerals: ['i9', '♭II9', 'i9', 'IV13'],
    description: 'Side-slipping a half step up (♭II) and back adds tension to a one-chord groove.', heardIn: ['P-Funk / Headhunters vocabulary'] },
  { id: 'disco-cycle', name: 'Disco cycle', group: 'funk', key: 'Am', chords: ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'E7'], numerals: ['i7', 'iv7', '♭VII7', '♭IIImaj7', '♭VImaj7', 'iiø7', 'V7', 'V7'],
    description: 'The diatonic cycle of fifths over four-on-the-floor.', heardIn: ['"I Will Survive"'] },

  // --- Bach & common practice
  { id: 'prelude-c', name: 'Prelude in C opening', group: 'bach', key: 'C', chords: ['C', 'Dm7/C', 'G7/B', 'C'], numerals: ['I', 'ii4/2', 'V6/5', 'I'],
    description: 'Tonic pedal, then a 4/2 and 6/5 that let the bass move by step (C–C–B–C).', heardIn: ['Bach, WTC I Prelude in C, BWV 846'] },
  { id: 'phrygian-hc', name: 'Phrygian half cadence', group: 'bach', key: 'Am', chords: ['Am', 'Dm/F', 'E', 'E'], numerals: ['i', 'iv6', 'V', 'V'],
    description: 'Bass descends a half step (F–E) into V while the soprano rises: the Baroque minor-key "question" (often ends a slow movement).', heardIn: ['Bach chorales', 'Brandenburg 3, 2nd mvt (just this cadence!)'] },
  { id: 'neapolitan', name: 'Neapolitan sixth', group: 'bach', key: 'Am', chords: ['Am', 'Bb/D', 'E7', 'Am'], numerals: ['i', 'N6 (♭II6)', 'V7', 'i'],
    description: '♭II in first inversion as a predominant; ♭2 falls to the leading tone.', heardIn: ['Bach, Mozart, Beethoven minor-key cadences'] },
  { id: 'german6', name: 'German augmented sixth', group: 'bach', key: 'Am', chords: ['Am', 'F7', 'Am/E', 'E7', 'Am'], numerals: ['i', 'Ger+6', 'i6/4', 'V7', 'i'],
    description: 'F–D♯ expands outward to E–E. Sounds exactly like F7 — the classical ancestor of the tritone sub.', heardIn: ['Bach (rarely), Mozart, Beethoven'] },
  { id: 'picardy', name: 'Picardy third', group: 'bach', key: 'Am', chords: ['Am', 'Dm', 'E7', 'A'], numerals: ['i', 'iv', 'V7', 'I'],
    description: 'A minor-key piece ends on a major tonic.', heardIn: ['Many Bach minor-key chorales and preludes'] },
  { id: 'lament', name: 'Lament bass', group: 'bach', key: 'Am', chords: ['Am', 'Em/G', 'Dm/F', 'E'], numerals: ['i', 'v6', 'iv6', 'V'],
    description: 'Descending tetrachord 1–♭7–♭6–5 in the bass (Phrygian half-cadence ending).', heardIn: ['Bach "Crucifixus" (chromatic form)', 'Purcell "Dido\'s Lament"'] },
  { id: 'deceptive', name: 'Deceptive cadence', group: 'bach', key: 'C', chords: ['C', 'F', 'G7', 'Am'], numerals: ['I', 'IV', 'V7', 'vi'],
    description: 'V resolves to vi: the leading tone still rises, the bass steps up.', heardIn: ['Bach chorales, everywhere'] },
  { id: 'five-six', name: 'Ascending 5–6 sequence', group: 'bach', key: 'C', chords: ['C', 'Am/C', 'Dm', 'Bdim/D', 'Em', 'C/E', 'F', 'G7'], numerals: ['I', 'vi6', 'ii', 'vii°6', 'iii', 'I6', 'IV', 'V7'],
    description: 'Upper voice alternates 5th and 6th above a rising bass — root-position chord, then its 5–6 shift.', heardIn: ['Bach, Corelli, Handel'] },
];

export const PROGRESSION_BY_ID: Record<string, ProgressionDef> = Object.fromEntries(PROGRESSIONS.map((p) => [p.id, p]));

/** Jazz blues in F (two chords per bar where needed), one entry per half bar. */
export const JAZZ_BLUES_F = {
  key: 'F',
  chords: ['F7', 'F7', 'Bb7', 'Bdim7', 'F7', 'F7', 'Cm7', 'F7', 'Bb7', 'Bb7', 'Bdim7', 'Bdim7', 'F7', 'F7', 'Am7', 'D7', 'Gm7', 'Gm7', 'C7', 'C7', 'F7', 'D7', 'Gm7', 'C7'],
  beats: 2,
};

/** "Blues for Alice"-style Bird blues in F, one entry per half bar. */
export const BIRD_BLUES_F = {
  key: 'F',
  chords: ['Fmaj7', 'Fmaj7', 'Em7b5', 'A7', 'Dm7', 'G7', 'Cm7', 'F7', 'Bb7', 'Bb7', 'Bbm7', 'Eb7', 'Am7', 'D7', 'Abm7', 'Db7', 'Gm7', 'Gm7', 'C7', 'C7', 'F', 'D7', 'Gm7', 'C7'],
  beats: 2,
};
