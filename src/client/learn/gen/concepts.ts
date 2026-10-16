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

export const CONCEPTS: ConceptItem[] = [
  // --- jazz harmony / reharm
  { id: 'avoid-4', topic: 'jazz', q: 'Why is the natural 11 an "avoid note" over Cmaj7 but not over Dm7?', options: ['Over Cmaj7 it sits a ♭9 above the 3rd (E–F)', 'It clashes with the root', 'It is not in the key', 'It doubles the 5th'], a: 0, why: 'A ♭9 interval against a chord tone (F over E) blurs the chord identity. Over Dm7 the 11 (G) is a whole step from the ♭3 — fine.' },
  { id: 'tritone-why', topic: 'jazz', q: 'Why can D♭7 replace G7 before Cmaj7?', options: ['They share the tritone F–B (C♭)', 'They share the same root', 'D♭ is the relative minor', 'Both contain a C'], a: 0, why: 'The 3rd and 7th swap roles; the tritone resolves inward to E and C either way, and the bass moves down by half step.' },
  { id: 'backcycle', topic: 'jazz', q: '"Backcycling" a dominant means…', options: ['Preceding it with its related ii (or chain of dominants)', 'Playing it backwards', 'Replacing it with a tonic', 'Removing the 3rd'], a: 0, why: 'G7 → Dm7 G7, or further back A7 Dm7 G7 — extending the cycle of fifths.' },
  { id: 'iii-for-i', topic: 'jazz', q: 'Why does iii7 work as a substitute for Imaj7?', options: ['It shares three of four notes (Em7 ⊂ Cmaj9)', 'It is the dominant', 'It is a tritone away', 'It has the same root'], a: 0, why: 'Em7 = E G B D = Cmaj9 without the root. Diatonic substitutes share function by sharing notes.' },
  { id: 'v-vs-viio', topic: 'jazz', q: 'Bdim7 over a G bass is…', options: ['G7♭9', 'Gmaj7', 'Gm6', 'G13'], a: 0, why: 'G + B D F A♭ = R 3 5 ♭7 ♭9. Every dim7 is a rootless 7♭9 of four different dominants.' },
  { id: 'sus-function', topic: 'jazz', q: 'G7sus4 is often described as…', options: ['Dm7/G — ii over the V bass', 'A tonic chord', 'A tritone sub', 'A diminished chord'], a: 0, why: 'G C D F = Dm7 (D F A C) minus A over G. It compresses ii–V into one sound (Herbie\'s "Maiden Voyage").' },
  { id: 'minor-tonic', topic: 'jazz', q: 'In a minor ii–V–i, why do players prefer i6 or im(maj7) over im7?', options: ['The ♭7 of im7 weakens the resolution of the leading tone', 'im7 is not in the key', 'It sounds too bright', 'm6 has no 3rd'], a: 0, why: 'V7♭9 contains the leading tone; resolving to a chord containing ♭7 undercuts it. 6 and maj7 come from melodic minor.' },
  { id: 'coltrane', topic: 'jazz', q: 'Coltrane changes divide the octave into…', options: ['Three major 3rds', 'Four minor 3rds', 'Two tritones', 'Six whole steps'], a: 0, why: 'B → G → E♭ → B: three tonal centres a major 3rd apart, each approached by its own V7.' },
  { id: 'rhythm-bridge', topic: 'jazz', q: 'The bridge of rhythm changes (in B♭) is…', options: ['D7 – G7 – C7 – F7', 'Cm7 – F7 – B♭ – G7', 'E♭ – E°7 – B♭/F – G7', 'B♭ – A7 – Dm – G7'], a: 0, why: 'Extended dominants around the cycle of fifths: III7–VI7–II7–V7, two bars each.' },
  { id: 'bird-blues', topic: 'jazz', q: 'What distinguishes a "Bird blues" from a basic jazz blues?', options: ['Descending chains of ii–Vs (often tritone-related)', 'Only three chords', 'A minor tonic', 'No dominant chords'], a: 0, why: '"Blues for Alice": Fmaj7 | Em7♭5 A7 | Dm7 G7 | Cm7 F7 | B♭7 | B♭m7 E♭7 | Am7 D7 | A♭m7 D♭7 …' },

  // --- bebop / improvisation
  { id: 'bebop-scale', topic: 'bebop', q: 'Why add a passing major 7 to Mixolydian (bebop dominant)?', options: ['Running 8ths from a chord tone keep chord tones on downbeats', 'To make it a major scale', 'To avoid the tritone', 'For a Lydian sound'], a: 0, why: 'Eight notes per octave line up chord tones (1 3 5 ♭7) with the beat.' },
  { id: 'enclosure', topic: 'bebop', q: 'An enclosure is…', options: ['Approaching a target from above and below before landing on it', 'A rest before the phrase', 'A trill', 'Repeating the root'], a: 0, why: 'E.g. F – D♯ – E (scale step above, chromatic below, target 3rd of C). The most idiomatic bebop gesture.' },
  { id: 'guide-line', topic: 'bebop', q: 'A guide-tone line through changes is built from…', options: ['3rds and 7ths connected by the smallest steps', 'Roots only', 'Pentatonic scales', 'Fifths and octaves'], a: 0, why: 'It outlines the harmony with minimal motion — a ready-made melodic skeleton.' },
  { id: 'sideslip', topic: 'bebop', q: '"Side-slipping" means…', options: ['Briefly playing a half step above/below the key, then resolving', 'Changing tempo', 'Playing behind the beat', 'Using only chord tones'], a: 0, why: 'Over a static chord: outside tension (e.g. A♭ Dorian over Gm7) resolving back in.' },

  // --- modal
  { id: 'so-what', topic: 'modal', q: 'The "So What" voicing is…', options: ['Three stacked 4ths + a major 3rd on top', 'A close-position 7th chord', 'A rootless A voicing', 'Root, 5th and octave'], a: 0, why: 'E A D G B over Dm: quartal, ambiguous, the sound of modal jazz.' },
  { id: 'modal-vs-tonal', topic: 'modal', q: 'In modal jazz, harmony mainly…', options: ['Sustains one mode for many bars instead of cycling functional cadences', 'Uses many ii–Vs', 'Modulates every bar', 'Avoids extensions'], a: 0, why: '"So What", "Impressions", "Maiden Voyage": colour over function.' },
  { id: 'quartal-m11', topic: 'modal', q: 'Stacked 4ths D–G–C–F over a D bass give which chord?', options: ['Dm11 (♭7 ♭3 … 11)', 'Dmaj7', 'D7♭9', 'D+'], a: 0, why: 'D G C F = R 11 ♭7 ♭3 → Dm11 (sus-like). Quartal voicings are ambiguous by design.' },

  // --- funk
  { id: 'funk-one', topic: 'funk', q: 'In James Brown funk, "the One" means…', options: ['Heavy emphasis on beat 1 of each bar', 'Playing one chord only', 'Single-note riffs', 'Starting on the upbeat'], a: 0, why: 'Everything else is syncopated around a strong, shared downbeat.' },
  { id: 'funk-9', topic: 'funk', q: 'Why is the dominant 9th the quintessential funk chord?', options: ['Bluesy ♭7 + 9 colour with no need to resolve', 'It is minor', 'It has no 3rd', 'It is diatonic to major only'], a: 0, why: 'Static dominant vamps (E9, A13) treat the dominant as a tonic colour — blues heritage.' },
  { id: 'funk-static', topic: 'funk', q: 'In a one-chord funk vamp, interest comes mostly from…', options: ['Rhythmic interlock between parts', 'Frequent modulation', 'Long chord progressions', 'Rubato'], a: 0, why: 'Bass, drums, guitar/clav and horns each own a slice of the 16th grid.' },
  { id: 'ghost', topic: 'funk', q: 'Ghost notes are…', options: ['Very soft, often muted notes that fill the 16th grid', 'Notes that are not played', 'Wrong notes', 'Notes an octave higher'], a: 0, why: 'They create continuous motion and make the accents pop.' },
  { id: 'clav', topic: 'funk', q: 'In a funk clav or rhythm part, the main harmonic content is usually…', options: ['3rd & 7th (plus 9/13) in tight voicings', 'Root and 5th', 'Full six-note voicings', 'Only the root'], a: 0, why: 'The bass covers roots; comping parts take the guide tones and colour tones.' },

  // --- soul / gospel
  { id: 'gospel-dim', topic: 'soul', q: 'In I – IV – ♯iv°7 – I/5, the ♯iv°7 works because…', options: ['Bass rises chromatically and the dim7 is a rootless V7♭9 of the next chord', 'It is the tonic', 'It is a tritone sub', 'It contains the root of I'], a: 0, why: 'F♯°7 = D7♭9 (rootless) → G-bass chord (C/G): an applied dominant in disguise.' },
  { id: 'iv-over-v', topic: 'soul', q: 'F/G in the key of C functions as…', options: ['A soft dominant (G9sus4 / G11)', 'A subdominant only', 'A tonic', 'A Neapolitan'], a: 0, why: 'IV triad over V bass: dominant function without the leading tone.' },
  { id: 'minor-iv', topic: 'soul', q: 'The minor iv (Fm6 in C) colours a plagal cadence by…', options: ['A♭ (♭6) falling to G', 'Adding a leading tone', 'Removing the root', 'Raising the 4th'], a: 0, why: 'Borrowed from the parallel minor; ♭6–5 is the bittersweet line.' },
  { id: 'two-of-us', topic: 'soul', q: 'In "Just the Two of Us" (D♭maj7 – C7 – Fm7), C7 is…', options: ['V7/vi', 'A tritone sub', 'The tonic', 'iv7'], a: 0, why: 'In A♭ major, C7 is the dominant of Fm (vi) — the secondary dominant gives the progression its pull.' },
  { id: 'planing', topic: 'soul', q: 'Neo-soul "planing" means…', options: ['Moving one voicing shape in parallel through scale steps', 'Using only triads', 'Avoiding 7ths', 'Playing on the beat'], a: 0, why: 'IVmaj9–iii9–ii9–Imaj9 with the same shape: colour over function.' },

  // --- Bach / counterpoint
  { id: 'cp-perfect', topic: 'bach', q: 'Why are parallel perfect 5ths and octaves avoided in counterpoint?', options: ['The two voices fuse and lose independence', 'They are dissonant', 'They are too quiet', 'They modulate'], a: 0, why: 'Independence of line is the point of polyphony; perfect consonances in parallel sound like one voice.' },
  { id: 'cp-suspension', topic: 'bach', q: 'A suspension has three stages:', options: ['Preparation (consonant) – suspension (dissonant, on the beat) – resolution (down by step)', 'Leap – step – leap', 'Root – 3rd – 5th', 'Tonic – dominant – tonic'], a: 0, why: '4–3, 7–6, 9–8 (and the bass 2–3): tension tied over the bar line, released downward.' },
  { id: 'cp-contrary', topic: 'bach', q: 'The safest motion between outer voices is…', options: ['Contrary motion', 'Parallel motion', 'Similar motion into octaves', 'Leaps in both voices'], a: 0, why: 'It maximises independence and avoids direct 5ths/8ves.' },
  { id: 'cp-64', topic: 'bach', q: 'The cadential 6/4 is best understood as…', options: ['V with two suspensions (6–5 and 4–3) over the dominant bass', 'A tonic chord in inversion', 'A predominant', 'A mistake'], a: 0, why: 'I6/4 → V: the upper voices resolve down to the dominant triad while the bass holds 5.' },
  { id: 'cp-lt-doubling', topic: 'bach', q: 'In four-part writing, which note of V is never doubled?', options: ['The leading tone (3rd of V)', 'The root', 'The 5th', 'Any'], a: 0, why: 'Both copies would have to resolve to the tonic → parallel octaves.' },
  { id: 'cp-sequence', topic: 'bach', q: 'A descending-fifths sequence (I–IV–vii°–iii–vi–ii–V–I) appears in…', options: ['Both Baroque music and jazz standards ("Autumn Leaves")', 'Only Bach', 'Only modal jazz', 'Only 12-bar blues'], a: 0, why: 'Root motion by fifths is the strongest, so composers chain it — Vivaldi, Bach, Kosma, Gaynor.' },
  { id: 'fugue-answer', topic: 'bach', q: 'A "tonal" fugal answer differs from a "real" answer because…', options: ['It adjusts intervals so tonic and dominant swap, staying in key', 'It is played louder', 'It is in a different meter', 'It inverts the subject'], a: 0, why: 'Subject 1→5 is answered 5→1 rather than 5→2, to avoid wrenching the key toward the dominant\'s dominant.' },
  { id: 'fugue-stretto', topic: 'bach', q: 'Stretto is…', options: ['Overlapping entries of the subject', 'A fast tempo marking', 'A cadence', 'A pedal tone'], a: 0, why: 'A new voice enters before the previous statement ends — usually a climactic device near the end.' },
  { id: 'fugue-cs', topic: 'bach', q: 'A countersubject is…', options: ['A recurring counter-melody accompanying the subject/answer', 'The second theme in a sonata', 'An episode', 'The bass line only'], a: 0, why: 'Written in invertible counterpoint so it works above or below the subject.' },
  { id: 'invertible', topic: 'bach', q: 'Invertible counterpoint at the octave requires care with…', options: ['5ths, which become 4ths when inverted', '3rds, which become 5ths', 'Octaves, which become 3rds', 'Nothing'], a: 0, why: 'Intervals invert to 9 − n: a consonant 5th turns into a dissonant 4th above the bass.' },
  { id: 'n6-voice', topic: 'bach', q: 'In N6 → V, the ♭2 usually…', options: ['Falls a diminished 3rd to the leading tone (via I6/4 or directly)', 'Rises to 3', 'Stays', 'Leaps an octave'], a: 0, why: 'E.g. in A minor: B♭ → G♯. The "diminished 3rd" melodic move is the Neapolitan fingerprint.' },
  { id: 'picardy', topic: 'bach', q: 'A Picardy third is…', options: ['A major tonic at the end of a minor-key piece', 'A suspension', 'A type of fugue', 'An augmented sixth'], a: 0, why: 'Raising the 3rd of the final tonic: Baroque convention for a stable ending.' },
];

export const CONCEPT_TOPICS = [...new Set(CONCEPTS.map((c) => c.topic))];

export function conceptQ(skill: string, topics: string[]) {
  const pool = CONCEPTS.filter((c) => topics.includes(c.topic));
  return (ctx: GenContext): Question => {
    const id = ctx.pickItem(pool.map((c) => c.id));
    const c = pool.find((x) => x.id === id)!;
    const opts = shuffle(c.options.map((o, i) => ({ value: String(i), label: o })), ctx.rnd);
    return choiceQ({ skill, item: id, prompt: c.q, options: opts, correct: String(c.a), explain: c.why, columns: 1 });
  };
}
