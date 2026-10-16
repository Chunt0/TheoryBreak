// Concept checks for ideas that aren't easily generated: reharmonisation,
// bebop language, modal jazz, funk & gospel practice, counterpoint, fugue.

import { shuffle } from '../../theory/core';
import type { GenContext, Question } from '../types';
import { choiceQ } from './helpers';

interface ConceptItem {
  id: string;
  topic: string;
  q: string;
  options: string[];
  /** index of the correct option */
  a: number;
  why: string;
}

// Distractors are real misconceptions or neighbouring concepts, never jokes:
// a wrong answer should be something a half-informed player might believe.
export const CONCEPTS: ConceptItem[] = [
  // --- jazz harmony / reharm
  { id: 'avoid-4', topic: 'jazz', q: 'Why is the natural 11 an "avoid note" over Cmaj7 but not over Dm7?', options: ['Over Cmaj7 it sits a ♭9 above the 3rd (E–F)', 'It rubs a whole step against the 5th (F–G)', 'F is outside the C major scale', '11ths only work on minor-quality chords'], a: 0, why: 'A ♭9 interval against a chord tone (F over E) blurs the chord identity. Over Dm7 the 11 (G) is a whole step from the ♭3 — fine. Sus and ♯11 chords show 11ths aren\'t a minor-only thing.' },
  { id: 'tritone-why', topic: 'jazz', q: 'Why can D♭7 replace G7 before Cmaj7?', options: ['They share the tritone F–B (C♭)', 'D♭ is G\'s ♭9, so D♭7 is just G7♭9 with a new bass', 'D♭7 is the backdoor dominant of C', 'Both roots resolve up a 4th to C'], a: 0, why: 'The 3rd and 7th swap roles; the tritone resolves inward to E and C either way, and the bass moves down by half step. (D♭ is G\'s ♭5, not its ♭9; the backdoor dominant is B♭7.)' },
  { id: 'backcycle', topic: 'jazz', q: '"Backcycling" a dominant means…', options: ['Preceding it with its related ii (or a chain of dominants)', 'Replacing it with the dominant a tritone away', 'Resolving it deceptively to vi', 'Borrowing it from the parallel minor'], a: 0, why: 'G7 → Dm7 G7, or further back A7 Dm7 G7 — extending the cycle of fifths backwards from the target.' },
  { id: 'iii-for-i', topic: 'jazz', q: 'Why does iii7 work as a substitute for Imaj7?', options: ['It shares three of four notes (Em7 ⊂ Cmaj9)', 'It is the relative minor of I', 'It has dominant function and leads back to I', 'Its root is the leading tone of the key'], a: 0, why: 'Em7 = E G B D = Cmaj9 without the root. Diatonic substitutes share function by sharing notes. (The relative minor is vi; the leading tone is B.)' },
  { id: 'v-vs-viio', topic: 'jazz', q: 'Bdim7 over a G bass is…', options: ['G7♭9', 'G13', 'G7♯9', 'Gm(maj7)'], a: 0, why: 'G + B D F A♭ = R 3 5 ♭7 ♭9. Every dim7 is a rootless 7♭9 of four different dominants.' },
  { id: 'sus-function', topic: 'jazz', q: 'G7sus4 is often described as…', options: ['Dm7/G — ii over the V bass', 'A G7 whose 4th must resolve to the 3rd before the next chord', 'Cmaj7/G — the tonic over its 5th', 'G7 with an added ♯11'], a: 0, why: 'G C D F ≈ Dm7 over G: it compresses ii–V into one sound. In jazz the 4th needn\'t resolve — Herbie\'s "Maiden Voyage" never does.' },
  { id: 'minor-tonic', topic: 'jazz', q: 'In a minor ii–V–i, why do players prefer i6 or im(maj7) over im7?', options: ['The ♭7 of im7 undercuts the leading tone just heard in V', 'im7 isn\'t diatonic to natural minor', 'The 6th and major 7th make the tonic darker than ♭7 does', 'im7 clashes with the root of V7♭9'], a: 0, why: 'V7♭9 contains the leading tone; resolving to a chord with ♭7 cancels it. 6 and maj7 come from melodic minor and keep the arrival bright and stable.' },
  { id: 'coltrane', topic: 'jazz', q: 'Coltrane changes divide the octave into…', options: ['Three major 3rds', 'Four minor 3rds', 'Two tritones', 'Six whole steps'], a: 0, why: 'B → G → E♭ → B: three tonal centres a major 3rd apart, each approached by its own V7. (Minor 3rds are the diminished axis; tritones the tritone-sub axis.)' },
  { id: 'rhythm-bridge', topic: 'jazz', q: 'The bridge of rhythm changes (in B♭) is…', options: ['D7 – G7 – C7 – F7', 'Cm7 – F7 – B♭ – G7', 'E♭ – E°7 – B♭/F – G7', 'B♭ – A7 – Dm – G7'], a: 0, why: 'Extended dominants around the cycle of fifths: III7–VI7–II7–V7, two bars each. The other options are A-section moves.' },
  { id: 'bird-blues', topic: 'jazz', q: 'What distinguishes a "Bird blues" from a basic jazz blues?', options: ['Descending chains of ii–Vs leading into IV and back', 'A minor tonic with a ♭VI–V turnaround', 'Only I7, IV7 and V7 throughout', 'A 16-bar form with a bridge'], a: 0, why: '"Blues for Alice": Fmaj7 | Em7♭5 A7 | Dm7 G7 | Cm7 F7 | B♭7 | B♭m7 E♭7 | Am7 D7 | A♭m7 D♭7 …' },

  // --- bebop / improvisation
  { id: 'bebop-scale', topic: 'bebop', q: 'Why add a passing major 7 to Mixolydian (bebop dominant)?', options: ['Running 8ths from a chord tone keep chord tones on downbeats', 'To turn the dominant into a major 7th chord', 'To replace the natural 4, the avoid note', 'To imply the tritone substitute'], a: 0, why: 'Eight notes per octave line up chord tones (1 3 5 ♭7) with the beat. The 4 is still there — the extra note is a passing tone, not a colour.' },
  { id: 'enclosure', topic: 'bebop', q: 'An enclosure is…', options: ['Approaching a target from above and below before landing on it', 'Repeating a motif a half step higher (side-slip)', 'Surrounding a phrase with rests', 'Ending phrases on the 9th instead of the root'], a: 0, why: 'E.g. F – D♯ – E (scale step above, chromatic below, target 3rd of C). The most idiomatic bebop gesture.' },
  { id: 'guide-line', topic: 'bebop', q: 'A guide-tone line through changes is built from…', options: ['3rds and 7ths connected by the smallest steps', 'Roots and 5ths on every downbeat', 'The top note of each voicing', 'The available tensions (9, 11, 13)'], a: 0, why: 'It outlines the harmony with minimal motion — a ready-made melodic skeleton.' },
  { id: 'sideslip', topic: 'bebop', q: '"Side-slipping" means…', options: ['Briefly playing a half step above/below the key, then resolving', 'Moving one voicing in parallel down the scale', 'Replacing a dominant with the one a tritone away', 'Phrasing behind the beat'], a: 0, why: 'Over a static chord: outside tension (e.g. A♭ Dorian over Gm7) resolving back in. Parallel voicings are planing; the tritone swap is a substitution.' },

  // --- modal
  { id: 'so-what', topic: 'modal', q: 'The "So What" voicing is…', options: ['Three stacked 4ths + a major 3rd on top', 'Four stacked 4ths', 'A rootless 3–5–7–9 voicing', 'A drop-2 minor-7th voicing'], a: 0, why: 'E A D G B over Dm: quartal, ambiguous, the sound of modal jazz.' },
  { id: 'modal-vs-tonal', topic: 'modal', q: 'In modal jazz, harmony mainly…', options: ['Sustains one mode for many bars instead of cycling functional cadences', 'Cycles ii–Vs through every key', 'Modulates every two bars by major 3rds', 'Uses only church-mode triads'], a: 0, why: '"So What", "Impressions", "Maiden Voyage": colour over function. Major-3rd modulation is Coltrane\'s other project.' },
  { id: 'quartal-m11', topic: 'modal', q: 'Stacked 4ths D–G–C–F over a D bass give which chord?', options: ['Dm11 (R 11 ♭7 ♭3)', 'G7/D', 'D7♭9', 'Dmaj9'], a: 0, why: 'D G C F = R 11 ♭7 ♭3 → Dm11 (sus-like). Quartal voicings are ambiguous by design.' },

  // --- funk
  { id: 'funk-one', topic: 'funk', q: 'In James Brown funk, "the One" means…', options: ['Heavy emphasis on beat 1 of each bar', 'Staying on one chord for the whole tune', 'Accenting beats 2 and 4', 'Every part playing in unison'], a: 0, why: 'Everything else is syncopated around a strong, shared downbeat. (The one-chord vamp is common too, but that\'s not what "the One" names.)' },
  { id: 'funk-9', topic: 'funk', q: 'Why is the dominant 9th the quintessential funk chord?', options: ['Bluesy ♭7 + 9 colour with no need to resolve', 'It is the V of the relative minor', 'Its 9th replaces the 3rd, so the quality stays open', 'It contains the key\'s leading tone'], a: 0, why: 'Static dominant vamps (E9, A13) treat the dominant as a tonic colour — blues heritage. The 3rd is still there; that\'s what makes it dominant.' },
  { id: 'funk-static', topic: 'funk', q: 'In a one-chord funk vamp, interest comes mostly from…', options: ['Rhythmic interlock between parts', 'Frequent key changes', 'A new chord substitution every bar', 'Rubato and tempo changes'], a: 0, why: 'Bass, drums, guitar/clav and horns each own a slice of the 16th grid.' },
  { id: 'ghost', topic: 'funk', q: 'Ghost notes are…', options: ['Very soft, often muted notes that fill the 16th grid', 'Notes implied by the harmony but never played', 'Grace notes a half step below the target', 'Accents on beats 2 and 4'], a: 0, why: 'They create continuous motion and make the accents pop.' },
  { id: 'clav', topic: 'funk', q: 'In a funk clav or rhythm part, the main harmonic content is usually…', options: ['3rd & 7th (plus 9/13) in tight voicings', 'Root–5th power chords', 'Full six-note voicings across the range', 'Single-note pentatonic lines only'], a: 0, why: 'The bass covers roots; comping parts take the guide tones and colour tones.' },

  // --- soul / gospel
  { id: 'gospel-dim', topic: 'soul', q: 'In I – IV – ♯iv°7 – I/5, the ♯iv°7 works because…', options: ['Bass rises chromatically and the dim7 is a rootless V7♭9 of the next chord', 'It is the tritone sub of V', 'It borrows iv from the parallel minor', 'It is a rootless I7 leading to IV'], a: 0, why: 'F♯°7 = D7♭9 (rootless) → G-bass chord (C/G): an applied dominant in disguise.' },
  { id: 'iv-over-v', topic: 'soul', q: 'F/G in the key of C functions as…', options: ['A soft dominant (G9sus4 / G11)', 'IV in second inversion', 'A tonic substitute (it contains C)', 'A backdoor dominant'], a: 0, why: 'IV triad over the V bass: dominant function without the leading tone. G isn\'t in an F triad, so it\'s no inversion; the backdoor dominant is B♭7.' },
  { id: 'minor-iv', topic: 'soul', q: 'The minor iv (Fm6 in C) colours a plagal cadence by…', options: ['A♭ (♭6) falling to G', 'F (4) falling to E', 'B♭ (♭7) rising to C', 'E♭ (♭3) rising to E'], a: 0, why: 'Borrowed from the parallel minor; ♭6–5 is the bittersweet line. F→E happens in every plagal cadence; Fm6 has no B♭ or E♭.' },
  { id: 'two-of-us', topic: 'soul', q: 'In "Just the Two of Us" (D♭maj7 – C7 – Fm7), C7 is…', options: ['V7/vi', 'V7/V', '♭VII7 — the backdoor dominant', 'The tritone sub of V7'], a: 0, why: 'In A♭ major, C7 is the dominant of Fm (vi) — the secondary dominant gives the progression its pull. (V7/V would be B♭7, ♭VII7 G♭7, subV7 A7.)' },
  { id: 'planing', topic: 'soul', q: 'Neo-soul "planing" means…', options: ['Moving one voicing shape in parallel through scale steps', 'Holding one chord while the bass walks', 'Alternating two chords a tritone apart', 'Voicing every chord in open 5ths'], a: 0, why: 'IVmaj9–iii9–ii9–Imaj9 with the same shape: colour over function.' },

  // --- Bach / counterpoint
  { id: 'cp-perfect', topic: 'bach', q: 'Why are parallel perfect 5ths and octaves avoided in counterpoint?', options: ['The two voices fuse and lose independence', 'Perfect intervals sounded dissonant in Baroque tuning', 'They always form a tritone with a third voice', 'They make the bass line static'], a: 0, why: 'Independence of line is the point of polyphony; perfect consonances in parallel sound like one voice doubled.' },
  { id: 'cp-suspension', topic: 'bach', q: 'A suspension has three stages:', options: ['Preparation (consonant) – suspension (dissonant, on the beat) – resolution (down by step)', 'Preparation (dissonant) – suspension (consonant) – resolution (up by step)', 'Leap – dissonance on the weak beat – step away', 'Anticipation – suspension – leap away'], a: 0, why: '4–3, 7–6, 9–8 (and the bass 2–3): tension tied over the bar line, released downward.' },
  { id: 'cp-contrary', topic: 'bach', q: 'The safest motion between outer voices is…', options: ['Contrary motion', 'Similar motion into perfect intervals', 'Parallel motion', 'Both voices leaping in the same direction'], a: 0, why: 'It maximises independence and can\'t produce parallel or direct 5ths/8ves.' },
  { id: 'cp-64', topic: 'bach', q: 'The cadential 6/4 is best understood as…', options: ['V with two suspensions (6–5 and 4–3) over the dominant bass', 'A tonic chord in second inversion acting as tonic', 'A predominant that prepares V', 'A passing chord between IV and IV6'], a: 0, why: 'I6/4 → V: the upper voices resolve down to the dominant triad while the bass holds 5. It looks like I, but it functions as V.' },
  { id: 'cp-lt-doubling', topic: 'bach', q: 'In four-part writing, which note of V is never doubled?', options: ['The leading tone (3rd of V)', 'The root of V', 'The 5th of V', 'Whichever note is in the bass'], a: 0, why: 'Both copies would have to resolve to the tonic → parallel octaves. Doubling the root of V is the norm.' },
  { id: 'cp-sequence', topic: 'bach', q: 'A descending-fifths sequence (I–IV–vii°–iii–vi–ii–V–I) appears in…', options: ['Both Baroque music and jazz standards ("Autumn Leaves")', 'Baroque music only', 'Bebop and later jazz only', 'Minor keys only'], a: 0, why: 'Root motion by fifths is the strongest, so composers chain it — Vivaldi, Bach, Kosma, Gaynor.' },
  { id: 'fugue-answer', topic: 'bach', q: 'A "tonal" fugal answer differs from a "real" answer because…', options: ['It adjusts intervals so tonic and dominant swap, staying in key', 'It transposes the subject exactly to the dominant', 'It inverts the subject', 'It states the subject in augmentation'], a: 0, why: 'Subject 1→5 is answered 5→1 rather than 5→2, to avoid wrenching the key toward the dominant\'s dominant. An exact transposition is a real answer.' },
  { id: 'fugue-stretto', topic: 'bach', q: 'Stretto is…', options: ['Overlapping entries of the subject', 'The subject in longer note values', 'A modulating passage between entries', 'A sustained bass under the final entries'], a: 0, why: 'A new voice enters before the previous statement ends — usually a climactic device near the end. (The others are augmentation, episode and pedal point.)' },
  { id: 'fugue-cs', topic: 'bach', q: 'A countersubject is…', options: ['A recurring counter-melody accompanying the subject/answer', 'The answer at the dominant', 'A free episode between entries', 'The subject turned upside down'], a: 0, why: 'Written in invertible counterpoint so it works above or below the subject.' },
  { id: 'invertible', topic: 'bach', q: 'Invertible counterpoint at the octave requires care with…', options: ['5ths, which become 4ths when inverted', '3rds, which become 5ths', '6ths, which become 2nds', 'Octaves, which become 3rds'], a: 0, why: 'Intervals invert to 9 − n: a consonant 5th turns into a dissonant 4th above the bass (3rds ↔ 6ths stay consonant).' },
  { id: 'n6-voice', topic: 'bach', q: 'In N6 → V, the ♭2 usually…', options: ['Falls a diminished 3rd to the leading tone (directly or via the cadential 6/4)', 'Rises a half step to the 2nd degree', 'Holds as a common tone into V', 'Leaps up a tritone to the 5th'], a: 0, why: 'E.g. in A minor: B♭ → G♯. The "diminished 3rd" melodic move is the Neapolitan fingerprint. ♭2 isn\'t in V, so it can\'t be held.' },
  { id: 'picardy', topic: 'bach', q: 'A Picardy third is…', options: ['A major tonic at the end of a minor-key piece', 'The raised 7th (leading tone) in minor', 'A minor tonic at the end of a major-key piece', 'The 3rd suspension in a 4–3 chain'], a: 0, why: 'Raising the 3rd of the final tonic: Baroque convention for a stable ending.' },
];

/** Per question: the lesson that explains it and a nudge that stops short of the answer. */
export const CONCEPT_HELP: Record<string, [lesson: string, hint: string]> = {
  'avoid-4': ['core.tensions', 'Measure F against each chord tone of Cmaj7, then of Dm7. Which interval is the trouble?'],
  'tritone-why': ['jazz.tritone', 'Spell both chords and compare their 3rds and 7ths.'],
  backcycle: ['jazz.secondary', 'Think of walking backwards round the cycle of fifths from the dominant.'],
  'iii-for-i': ['jazz.reharm', 'Spell Em7 and Cmaj7 and count the notes they share.'],
  'v-vs-viio': ['core.symmetric', 'Name B, D, F and A♭ as intervals above G.'],
  'sus-function': ['jazz.modal', 'Spell G7sus4 (G C D F) and look for a ii chord hiding inside it.'],
  'minor-tonic': ['jazz.minor', 'Which note of V7♭9 pulls hardest to the tonic, and what does a ♭7 on the tonic chord do to it?'],
  coltrane: ['jazz.coltrane', 'Giant Steps visits B, G and E♭: what interval separates them?'],
  'rhythm-bridge': ['jazz.rhythm', 'The bridge chains dominants round the cycle of fifths, two bars each, starting on III7.'],
  'bird-blues': ['jazz.blues', 'Think of "Blues for Alice": what fills bars 2–10?'],
  'bebop-scale': ['jazz.bebop', 'Count it: eight notes per octave against eight 8th notes per bar.'],
  enclosure: ['jazz.bebop', 'The name says it: what happens around the target before you land?'],
  'guide-line': ['jazz.iivi', 'Which two chord tones define a chord\'s quality?'],
  sideslip: ['jazz.bebop', 'A slip is a brief step sideways — into which key, and for how long?'],
  'so-what': ['jazz.modal', 'Measure each gap in E A D G B.'],
  'modal-vs-tonal': ['jazz.modal', '"So What" sits on one chord for sixteen bars.'],
  'quartal-m11': ['jazz.modal', 'Name G, C and F as intervals above D.'],
  'funk-one': ['funk.groove', 'Where does James Brown want the whole band to land together?'],
  'funk-9': ['funk.harmony', 'In an E9 vamp, does the dominant ever go anywhere?'],
  'funk-static': ['funk.harmony', 'If the harmony doesn\'t move, what\'s left to listen to?'],
  ghost: ['funk.groove', 'Ghost — barely there, but it keeps the grid moving.'],
  clav: ['funk.harmony', 'The bass has the root. What does a comping part need to say which chord it is?'],
  'gospel-dim': ['soul.gospel', 'Spell F♯°7, then put a D underneath it.'],
  'iv-over-v': ['soul.neo', 'Spell G + F A C: which dominant chord is that, and is there a leading tone?'],
  'minor-iv': ['jazz.backdoor', 'Which note of Fm6 is not in C major, and where does it want to go?'],
  'two-of-us': ['soul.neo', 'C7 resolves down a 5th to which chord of A♭ major?'],
  planing: ['soul.neo', 'Planes move in parallel.'],
  'cp-perfect': ['bach.counterpoint', 'What happens to the sound of two voices locked in perfect 5ths?'],
  'cp-suspension': ['bach.counterpoint', 'Prepared, held over the beat, then released — in which direction?'],
  'cp-contrary': ['bach.voiceleading', 'Which motion makes parallel or direct perfect intervals impossible?'],
  'cp-64': ['bach.cadences', 'What sits in the bass under a cadential 6/4, and where do the upper voices go next?'],
  'cp-lt-doubling': ['bach.voiceleading', 'Where must the leading tone go — and what if there are two of them?'],
  'cp-sequence': ['bach.sequences', 'Think of Vivaldi and of "Autumn Leaves".'],
  'fugue-answer': ['bach.fugue', 'A real answer transposes exactly. What would that do to a subject that leaps 1→5?'],
  'fugue-stretto': ['bach.fugue', 'Stretto means "tightened": entries crowd together.'],
  'fugue-cs': ['bach.fugue', 'It runs counter to the subject and keeps coming back with it.'],
  invertible: ['bach.counterpoint', 'Inverting at the octave turns an interval n into 9 − n. Which consonance becomes a dissonance?'],
  'n6-voice': ['bach.chromatic', 'In A minor: B♭ goes to G♯. What interval is that?'],
  picardy: ['bach.cadences', 'It\'s about the very last chord of a minor-key piece.'],
};

export const CONCEPT_TOPICS = [...new Set(CONCEPTS.map((c) => c.topic))];

export function conceptQ(skill: string, topics: string[]) {
  const pool = CONCEPTS.filter((c) => topics.includes(c.topic));
  return (ctx: GenContext): Question => {
    const id = ctx.pickItem(pool.map((c) => c.id));
    const c = pool.find((x) => x.id === id)!;
    const opts = shuffle(c.options.map((o, i) => ({ value: String(i), label: o })), ctx.rnd);
    const [lesson, hint] = CONCEPT_HELP[id] ?? [];
    return choiceQ({ skill, item: id, prompt: c.q, options: opts, correct: String(c.a), explain: c.why, columns: 1, lesson, hint });
  };
}
