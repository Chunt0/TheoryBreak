// For every drill: the library lesson that teaches it and a short method —
// "how to work any question of this drill out". Shown behind the ? on each
// question and under "Working it out" on the lesson page.

type Help = { lesson: string; method: string[] };

const intervalsEar = (extra: string): Help => ({
  lesson: 'core.intervals',
  method: [
    'Hold the bottom note in your ear — replay as often as you like.',
    'Size first: a step (2nd), a chord skip (3rd), an open frame (4th/5th), a wide stretch (6th/7th), the same letter (octave).',
    'Then quality: m3/M3 are the minor/major chord colours, the tritone is a dominant\'s 3–♭7, a M7 is the maj7 rub.',
    extra,
  ],
});

const recallAnalysis: string[] = [
  'Find the key: the first or last chord, or the target of the ii–Vs.',
  'Measure every root from the tonic and write the numeral; the chord quality sets case and suffix.',
  'Mark the borrowed and chromatic chords: secondary dominants (V7/x), tritone subs (♭II7), backdoor ♭VII7, mixture.',
];

const tapping: string[] = [
  'Press Space (or a pad) to start the four-click count-in and count the grid out loud: "1 e & a 2 e & a…" (triplets: "1 trip let").',
  'Keep the subdivision running in your head the whole bar; tap only on the highlighted slots.',
  'Tap with Space, a pad or any key. Late or early everywhere? Calibrate the tap offset once in Settings.',
];

export const SKILL_HELP: Record<string, Help> = {
  // ---------------------------------------------------------------- ear
  'ear.int': intervalsEar('Ascending: you can also play the top note on the keys to answer.'),
  'ear.int.desc': intervalsEar('Descending intervals sound smaller than they are: sing the bottom note back up to the top to check.'),
  'ear.int.harm': intervalsEar('Harmonic: the hint plays the two notes one at a time — melodic intervals are easier to measure.'),
  'ear.int.compound': intervalsEar('Compound: hear the top note an octave lower (the hint plays it) to get the simple interval, then add 7 to the number.'),
  'ear.chord.7': {
    lesson: 'core.sevenths',
    method: [
      '3rd first: bright (major) or dark (minor)?',
      'Then the 7th: a major 7th rubs a half step under the octave; a ♭7 sits a whole step under it and sounds bluesy and open.',
      'Then the 5th: a ♭5 tightens a minor chord into half-diminished; three stacked minor 3rds (°7) sound symmetrical and unstable.',
      'm(maj7) = minor 3rd against a major 7th — the film-noir chord.',
    ],
  },
  'ear.chord.ext': {
    lesson: 'core.tensions',
    method: [
      'Find the 7th first: major 7, ♭7, or none at all (6/9).',
      'Then the colour on top: 9 is smooth, 11 over a minor chord sounds open and quartal, 13 is bright, ♯11 shimmers (Lydian).',
      '13sus4 has no 3rd: it floats; m11 is still clearly minor.',
    ],
  },
  'ear.chord.alt': {
    lesson: 'core.tensions',
    method: [
      'Start from a plain dominant 7: how much extra tension is there?',
      '♭9 rubs a half step against the root (dark); ♯9 clashes with the major 3rd (bluesy, Hendrix); ♯11 shimmers; ♭13 darkens the top.',
      '7alt stacks several alterations — the most tension; 7♯5 sounds whole-tone and dreamy.',
    ],
  },
  'ear.chord.inv': {
    lesson: 'core.sevenths',
    method: [
      'Ignore the bass note — inversion changes the bottom, not the colour.',
      'Major = bright and stable; minor = dark and stable; diminished = tight and unstable; augmented = floating and symmetrical.',
      'sus2/sus4 have no 3rd: open, neither major nor minor.',
    ],
  },
  'ear.degree': {
    lesson: 'core.degrees',
    method: [
      'Let the cadence set the key and keep the tonic in your ear.',
      'Sing from the note to the nearest tonic, counting scale steps — up or down, whichever is shorter.',
      'Use tendencies: 7 pulls up to 1, 4 leans down to 3, 6 leans to 5, 2 wants 1 or 3.',
      'Or play the note on the keys: the drill answers by pitch.',
    ],
  },
  'ear.degree.chrom': {
    lesson: 'core.degrees',
    method: [
      'Hold the tonic; decide first whether the note belongs to the major scale.',
      'If it rubs, it is chromatic: ♭ notes lean down (♭2 → 1, ♭6 → 5, ♭3/♭7 are blue), ♯4 leans up to 5.',
      'Sing to the nearest diatonic note, then name the half step.',
    ],
  },
  'ear.degree.minor': {
    lesson: 'core.degrees',
    method: [
      'The cadence is minor: 1 ♭3 5 are the home chord.',
      'Natural-minor degrees: 2, ♭3, 4, 5, ♭6, ♭7 — ♭6 leans down to 5, ♭7 sits a whole step under the tonic.',
      'Sing to the tonic and count steps.',
    ],
  },
  'ear.motion': {
    lesson: 'core.rootmotion',
    method: [
      'Hum only the lowest note of each chord — the hint plays the bass alone.',
      'Name the interval between the two bass notes, with direction.',
      'Up a 4th (down a 5th) is the strongest move; down a half step is the tritone-sub resolution; 3rds share two notes and sound gentle.',
    ],
  },
  'ear.prog.jazz': {
    lesson: 'jazz.turnarounds',
    method: [
      'Hum the bass line first (the hint isolates it) and sketch its motion.',
      'Falling 5ths (rising 4ths) = ii–V chains and turnarounds; dominant 7ths everywhere = extended dominants (rhythm bridge).',
      'Half-diminished + 7♭9 = a minor ii–V; then check where it lands.',
    ],
  },
  'ear.prog.subs': {
    lesson: 'jazz.tritone',
    method: [
      'Follow the bass: a chromatic descent into I is a tritone sub (ii–♭II7–I).',
      'A whole step up into I from a dominant is the backdoor (♭VII7–I); major-3rd jumps between key centres are Coltrane changes.',
      'Lady Bird: every chord is a dominant or maj7 a half step above its usual target.',
    ],
  },
  'ear.prog.soul': {
    lesson: 'soul.neo',
    method: [
      'Listen for function vs colour: parallel 9th chords stepping down = planing.',
      'A soft dominant without a leading tone = IV/V (or 9sus4); a minor iv before I = the gospel "Amen" colour.',
      'A dominant that resolves to a minor chord a 5th below = V7/vi (the "Just the Two of Us" pull).',
    ],
  },
  'ear.prog.bach': {
    lesson: 'bach.cadences',
    method: [
      'Bass first: a half step down onto V (♭6–5) = Phrygian cadence; a step-by-step descent 1–♭7–♭6–5 = lament.',
      'V → vi = deceptive; minor key ending on a major tonic = Picardy.',
      'A very dark predominant before V = Neapolitan (♭II) or augmented sixth (♭6 bass with ♯4 above).',
    ],
  },
  'ear.cadence': {
    lesson: 'bach.cadences',
    method: [
      'Only the last two chords decide it — the hint plays just those.',
      'V → I: authentic. IV → I: plagal. Ends on V: half (♭6–5 in the bass in minor: Phrygian).',
      'V → vi: deceptive. Minor key, major final chord: Picardy.',
    ],
  },
  'ear.modes': {
    lesson: 'core.modes',
    method: [
      'Major or minor 3rd?',
      'Major family: ♯4 → Lydian, ♭7 → Mixolydian, neither → Ionian.',
      'Minor family: natural 6 → Dorian, ♭2 → Phrygian, ♭2 and ♭5 → Locrian, otherwise Aeolian.',
    ],
  },
  'ear.scales.jazz': {
    lesson: 'core.melodic',
    method: [
      'Count the notes: 6 = whole tone; 8 = diminished (half-whole or whole-half) or bebop.',
      'Altered: ♭9 ♯9 and a major 3rd right at the bottom; Lydian dominant: major with ♯4 and ♭7; Locrian ♮2: minor with ♭5.',
      'Melodic minor: minor 3rd but major 6th and 7th; Mixolydian ♭6: major 3rd but ♭6.',
    ],
  },
  'ear.melody': {
    lesson: 'core.degrees',
    method: [
      'The first note is shown: play it.',
      'For each move ask: step or skip, up or down? Relate notes to the key — sing back to the tonic if you get lost.',
      'Octave doesn\'t matter; ⌫ takes back a wrong note. The hint plays the line slower.',
    ],
  },
  'ear.melody.bebop': {
    lesson: 'jazz.bebop',
    method: [
      'Place the first note, then follow the line step by step.',
      'The last three notes are an enclosure: a scale step above the target, a half step below it, then the target.',
      'Octave doesn\'t matter; ⌫ takes back a wrong note.',
    ],
  },

  // ---------------------------------------------------------------- harmony gym
  'gym.spell.7': {
    lesson: 'core.sevenths',
    method: [
      'Letters first, in 3rds from the root: one letter per chord tone (C E G B — never C E G C♭).',
      'Then the accidentals from the formula: M3 = 4 semitones, m3 = 3, P5 = 7, d5 = 6, M7 = 11, m7 = 10, d7 = 9.',
      'A diminished 7th is a half step below a minor 7th but keeps the 7th\'s letter: C°7 = C E♭ G♭ B𝄫 (not A).',
    ],
  },
  'gym.spell.ext': {
    lesson: 'core.tensions',
    method: [
      'Spell the 7th chord first (letters in 3rds, then accidentals).',
      'Keep stacking letters for the tensions: 9 = the 2nd letter, 11 = the 4th, 13 = the 6th.',
      'Altered tensions keep their letter: ♯9 above C is D♯ (not E♭), ♭13 is A♭ (not G♯).',
    ],
  },
  'gym.play.7': {
    lesson: 'core.sevenths',
    method: [
      'Spell it in your head first: letters in 3rds, then the accidentals from the formula.',
      'Any voicing and octave; for 7th chords the root may be left out.',
      'Computer keys or clicks: tap each note (again to remove), then Enter. MIDI: hold the chord and release.',
    ],
  },
  'gym.play.ext': {
    lesson: 'core.tensions',
    method: [
      'Essential tones first: 3rd and 7th (or the sus 4).',
      'Add the named tensions; the root and 5th are optional (13ths usually drop the 11).',
      '7alt: 3 and ♭7 plus two or more of ♭9 ♯9 ♯11 ♭13.',
    ],
  },
  'gym.shells': {
    lesson: 'jazz.voicings',
    method: [
      'The 3rd gives the quality: major 3rd for maj7 and 7, minor 3rd for m7 and m7♭5.',
      'The 7th: major 7 for maj7, ♭7 for 7, m7 and m7♭5; 6th chords use the 6th instead.',
      'Play just those two notes — either one on top.',
    ],
  },
  'gym.name': {
    lesson: 'jazz.voicings',
    method: [
      'The lowest note is the root.',
      'Name every upper note against it: is the 3rd major or minor? the 7th major, minor or diminished?',
      'Then the extensions: 9, 11, 13 or altered ones. 3rd + 7th give the family.',
    ],
  },
  'gym.int.spell': {
    lesson: 'core.intervals',
    method: [
      'Count letter names for the number, including the starting letter: a 6th above E♭ is C (E F G A B C).',
      'Count semitones for the quality and set the accidental: M6 = 9 semitones → C natural.',
      'Never swap to an enharmonic letter: an augmented 4th above F is B, not C♭.',
    ],
  },
  'gym.keys7': {
    lesson: 'core.diatonic',
    method: [
      'Major-key 7ths, in order: maj7, m7, m7, maj7, 7, m7, m7♭5 (Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7).',
      'Find the root on that degree of the key and apply the quality.',
      'Reverse questions: find the chord\'s root in the key — that is the degree.',
    ],
  },
  'gym.keys7.harm': {
    lesson: 'core.diatonic',
    method: [
      'Harmonic minor = natural minor with a raised 7th.',
      'Its 7ths: im(maj7) iiø7 ♭IIImaj7♯5 iv7 V7 ♭VImaj7 vii°7 — the raised 7th makes V7 and vii°7.',
    ],
  },
  'gym.keys7.mel': {
    lesson: 'core.diatonic',
    method: [
      'Melodic (jazz) minor = major with a ♭3.',
      'Its 7ths: im(maj7) ii7 ♭IIImaj7♯5 IV7 V7 viø7 viiø7 — two dominants and two half-diminished chords.',
    ],
  },
  'gym.scales.play': {
    lesson: 'core.chordscale',
    method: [
      'Start on the root and follow the formula (e.g. Dorian 1 2 ♭3 4 5 6 ♭7) or its step pattern (W H W W W H W).',
      'Octave doesn\'t matter — wrap around if you run out of computer keys.',
      'Finish on the root: the drill expects every note plus the octave.',
    ],
  },
  'gym.secondary': {
    lesson: 'jazz.secondary',
    method: [
      'V7 of a chord = the dominant 7th a perfect 5th above that chord\'s root.',
      'Reverse: go down a 5th from the secondary dominant\'s root to find its target.',
      'Its 3rd is the temporary leading tone (A7 → Dm: C♯ → D).',
    ],
  },
  'gym.plr': {
    lesson: 'core.plr',
    method: [
      'Spell the start triad: root, 3rd, 5th.',
      'P moves the 3rd a half step; R moves the major chord\'s 5th up a whole step (the minor chord\'s root down one); L moves the major chord\'s root down a half step (the minor chord\'s 5th up one).',
      'For a compound move, apply the letters left to right: N = R L P, S = L P R, H = P L P.',
    ],
  },
  'gym.interchange': {
    lesson: 'jazz.backdoor',
    method: [
      'Spell the borrowed chord in the key.',
      'Check which mode on the same tonic contains all its notes: ♭3/♭6/♭7 → Aeolian; ♭2 → Phrygian; ♭7 with a natural 6 → Dorian or Mixolydian; ♯4 → Lydian.',
    ],
  },

  // ---------------------------------------------------------------- jazz vocabulary
  'jazz.tritone': {
    lesson: 'jazz.tritone',
    method: [
      'The tritone sub\'s root is a tritone (♭5, three whole steps) from the original root.',
      'Check: both dominants share the 3rd–♭7 pair, swapped (G7: B–F, D♭7: F–C♭).',
      'In a cadence the sub sits a half step above the target, so the bass slides down chromatically.',
    ],
  },
  'jazz.relatedii': {
    lesson: 'jazz.secondary',
    method: [
      'Related ii of a V7: the m7 chord whose root is a 5th above the V\'s root.',
      'ii–V into a target: ii a whole step above the target, V a 5th above it.',
      'Minor target: half-diminished ii and V7♭9 (from harmonic minor).',
    ],
  },
  'jazz.guide': {
    lesson: 'jazz.iivi',
    method: [
      'Spell the 3rd and 7th of each chord.',
      'A 7th falls a half step to the 3rd of the next chord; a 3rd stays put and becomes the next chord\'s 7th.',
    ],
  },
  'jazz.chordscale': {
    lesson: 'core.chordscale',
    method: [
      'Read the chord: 3rd, 7th and any written alterations.',
      'Pick the scale that contains them without clashes: maj7 → Ionian/Lydian, m7 (ii) → Dorian, 7 → Mixolydian, m7♭5 → Locrian ♮2, 7alt → altered, 13♭9 → half-whole.',
      'Context matters for diatonic chords: the same m7 is Dorian as ii, Phrygian as iii, Aeolian as vi.',
    ],
  },
  'jazz.mm': {
    lesson: 'core.melodic',
    method: [
      'Melodic minor = 1 2 ♭3 4 5 6 7; its modes start on each degree.',
      'Shortcuts: 7alt → melodic minor a half step above the root; 7♯11 → a 5th above; m7♭5 → a minor 3rd above.',
    ],
  },
  'jazz.ust': {
    lesson: 'jazz.ust',
    method: [
      'Spell the triad.',
      'Name each triad note against the dominant root: ♭9 9 ♯9 3 11 ♯11 5 ♭13 13 ♭7.',
      'Reverse: find the root that puts those tensions on top (♯9 → a minor 3rd up, ♭13 → a minor 6th up, 13 → a major 6th up, 9 → a whole step up).',
    ],
  },
  'jazz.dim': {
    lesson: 'core.symmetric',
    method: [
      'A dim7 is stacked minor 3rds: every note can be the root, so only three different dim7 chords exist.',
      'As a rootless 7♭9: put a root a major 3rd below any of its notes.',
      'As a passing chord: its root is a half step above the previous chord\'s root, so the bass climbs.',
    ],
  },
  'jazz.keycenter': {
    lesson: 'jazz.iivi',
    method: [
      'Find the ii–V pair: a m7 followed by a 7 whose root is a 4th higher.',
      'The target I is a 5th below the V (a whole step below the ii).',
      'Half-diminished ii + V7♭9 → minor target.',
    ],
  },
  'jazz.analysis': { lesson: 'jazz.turnarounds', method: recallAnalysis },
  'jazz.concepts': {
    lesson: 'jazz.reharm',
    method: ['Name the principle the question is about (shared tones, root motion, function).', 'If it\'s new, open the lesson linked below — each question links the topic that explains it.'],
  },
  'jazz.bebop': {
    lesson: 'jazz.bebop',
    method: ['Name the principle the question is about.', 'If it\'s new, open the lesson linked below — each question links the topic that explains it.'],
  },

  // ---------------------------------------------------------------- funk / soul
  'soul.analysis': { lesson: 'soul.neo', method: recallAnalysis },
  'soul.concepts': {
    lesson: 'funk.harmony',
    method: ['Name the principle the question is about (groove, voicing, borrowed chord).', 'If it\'s new, open the lesson linked below — each question links the topic that explains it.'],
  },

  // ---------------------------------------------------------------- Bach
  'bach.vl': {
    lesson: 'bach.voiceleading',
    method: [
      'Every pair of voices: perfect 5th or octave in both chords with both voices moving = parallels.',
      'Outer voices moving the same way into an octave with a soprano leap = direct octaves.',
      'Find the leading tone (in the soprano it must rise) and any chordal 7th (it must fall by step); never two leading tones.',
      'Gaps: soprano–alto and alto–tenor within an octave.',
    ],
  },
  'bach.figured': {
    lesson: 'bach.figured',
    method: [
      'Figures are intervals above the bass note.',
      'Which chord member is in the bass? Root → 5/3 (triad) or 7; 3rd → 6 or 6/5; 5th → 6/4 or 4/3; 7th → 4/2.',
    ],
  },
  'bach.chromatic': {
    lesson: 'bach.chromatic',
    method: [
      'Neapolitan: a major triad on ♭2, usually with its 3rd (scale degree 4) in the bass.',
      'Augmented sixths: ♭6 in the bass, ♯4 above. Italian adds 1; French adds 1 and 2; German adds 1 and ♭3 (and sounds like a dominant 7th).',
      'vii°7/V: a diminished 7th on ♯4, the leading tone of V.',
    ],
  },
  'bach.analysis': { lesson: 'bach.sequences', method: recallAnalysis },
  'bach.concepts': {
    lesson: 'bach.counterpoint',
    method: ['Name the principle the question is about (independence of voices, dissonance treatment, fugal procedure).', 'If it\'s new, open the lesson linked below — each question links the topic that explains it.'],
  },

  // ---------------------------------------------------------------- rhythm
  'rhythm.tap.16': { lesson: 'rhythm.subdivision', method: tapping },
  'rhythm.tap.sync': { lesson: 'rhythm.subdivision', method: tapping },
  'rhythm.tap.funk': { lesson: 'funk.groove', method: tapping },
  'rhythm.tap.shuffle': { lesson: 'rhythm.subdivision', method: tapping },
  'rhythm.ear.funk': {
    lesson: 'funk.groove',
    method: [
      'Count the grid with the clicks: "1 e & a".',
      'Beat by beat, place each hit: on the beat, on "&" (halfway), on "e" (just after the beat) or "a" (just before the next).',
      'Compare only the beats where the options differ.',
    ],
  },
  'rhythm.clave': {
    lesson: 'rhythm.clave',
    method: [
      'Does the bar open with three strokes (3-2) or two (2-3)?',
      'Son vs rumba: rumba delays the third stroke by a 16th; bossa delays the last one.',
      'Tresillo is 3+3+2 repeated — no "2 side" at all.',
    ],
  },
};
