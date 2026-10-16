// Common-practice drills: SATB voice-leading errors, figured bass, chromatic
// predominants (Neapolitan, augmented sixths), secondary leading-tone chords.

import { INTERVALS, midiAtOrAbove, noteName, parseNote, pc, pick, shuffle, transpose, type Note } from '../../theory/core';
import { chordNotes, chordSymbol } from '../../theory/chords';
import { keyName, type Key } from '../../theory/keys';
import type { GenContext, Question, StaffChord } from '../types';
import { chordEvents, parsePitch } from '../music';
import { choiceQ, randomMajorKey, randomMinorKey, textOptions } from './helpers';

/** Spell an SATB voice ("C3") transposed by a spelled interval; MIDI moves by `shift` semitones. */
function satbVoice(v: string, ivl: string, dir: 1 | -1, shift: number): { midi: number; name: string } {
  const n = parseNote(v.replace(/-?\d$/, ''))!;
  return { midi: parsePitch(v)! + shift, name: noteName(transpose(n, ivl, dir)) };
}

function satb(voices: string[], ivl: string, dir: 1 | -1, shift: number, label?: string): StaffChord {
  const vs = voices.map((v) => satbVoice(v, ivl, dir, shift));
  return { notes: vs.map((x) => x.midi), names: vs.map((x) => x.name), label };
}

/**
 * Semitone shift for a transposition — the spelled interval, or an octave
 * either side — that best keeps the bass in E2–D4 and the soprano in D4–G5.
 */
function satbFit(a: string[], b: string[], ivl: string, dir: 1 | -1): { shift: number; cost: number } {
  const base = INTERVALS[ivl].semis * dir;
  const bass = [a[0], b[0]].map((v) => parsePitch(v)!);
  const sop = [a[3], b[3]].map((v) => parsePitch(v)!);
  const cost = (sh: number) =>
    Math.max(0, 40 - Math.min(...bass) - sh) + Math.max(0, Math.max(...bass) + sh - 62) + Math.max(0, 62 - Math.min(...sop) - sh) + Math.max(0, Math.max(...sop) + sh - 79);
  const shift = [base, base + 12, base - 12].reduce((best, sh) => (cost(sh) < cost(best) ? sh : best));
  return { shift, cost: cost(shift) };
}

export const VL_ERRORS = {
  par5: 'Parallel 5ths',
  par8: 'Parallel octaves',
  lt: 'Leading tone not resolved',
  sev: 'Chordal 7th not resolved',
  dbllt: 'Doubled leading tone',
  space: 'Spacing (upper voices > octave)',
  direct: 'Direct octaves, outer voices',
  ok: 'No error',
} as const;
export type VlError = keyof typeof VL_ERRORS;

/**
 * Two-chord SATB examples (bass, tenor, alto, soprano) written in C major and
 * transposed to a random key per question. [X] in the explanation is a note
 * name that gets transposed with the music. Tests check every example with a
 * small voice-leading analyser.
 */
export const VL_BANK: { id: string; error: VlError; a: string[]; b: string[]; labels: [string, string]; why: string }[] = [
  { id: 'p5-ta', error: 'par5', a: ['C3', 'C4', 'G4', 'E5'], b: ['F2', 'D4', 'A4', 'F5'], labels: ['I', 'ii6'], why: 'Tenor [C]→[D] and alto [G]→[A] move in parallel perfect 5ths: the voices lose independence.' },
  { id: 'p5-bs', error: 'par5', a: ['C3', 'G3', 'E4', 'G4'], b: ['D3', 'F3', 'D4', 'A4'], labels: ['I', 'ii'], why: 'Bass [C]→[D] and soprano [G]→[A]: parallel 5ths (as 12ths) between the outer voices — the most exposed place for them. Contrary motion in the bass (down to the ii6 bass) avoids it.' },
  { id: 'p8-bs', error: 'par8', a: ['C3', 'G3', 'E4', 'C5'], b: ['G2', 'B3', 'D4', 'G4'], labels: ['I', 'V'], why: 'Bass [C]→[G] and soprano [C]→[G]: parallel octaves between the outer voices.' },
  { id: 'p8-bt', error: 'par8', a: ['C3', 'C4', 'E4', 'G4'], b: ['G2', 'G3', 'D4', 'B4'], labels: ['I', 'V'], why: 'Bass [C]→[G] and tenor [C]→[G] move in parallel octaves — an inner voice paired with the bass is still a violation. Take the tenor up to [D] instead.' },
  { id: 'lt-sop', error: 'lt', a: ['G2', 'F3', 'D4', 'B4'], b: ['C3', 'E3', 'C4', 'G4'], labels: ['V7', 'I'], why: 'The leading tone [B] is in the soprano and leaps down to [G] instead of rising to [C]. (In an inner voice this "frustrated" leading tone is tolerated.)' },
  { id: 'sev-up', error: 'sev', a: ['G2', 'B3', 'D4', 'F4'], b: ['C3', 'C4', 'E4', 'G4'], labels: ['V7', 'I'], why: 'The chordal 7th ([F]) must resolve down by step to [E]; here it rises to [G].' },
  { id: 'dbl-lt', error: 'dbllt', a: ['C3', 'C4', 'E4', 'G4'], b: ['B2', 'D4', 'G4', 'B4'], labels: ['I', 'V6'], why: '[B], the leading tone, is doubled (bass and soprano). Both would want to resolve to [C] → parallel octaves.' },
  { id: 'space-as', error: 'space', a: ['C3', 'G3', 'C4', 'E5'], b: ['F2', 'A3', 'C4', 'F5'], labels: ['I', 'IV'], why: 'Alto and soprano are more than an octave apart. Keep the upper three voices within an octave of their neighbours (bass–tenor may be wider).' },
  { id: 'direct-8', error: 'direct', a: ['F2', 'C4', 'F4', 'A4'], b: ['C3', 'C4', 'E4', 'C5'], labels: ['IV', 'I'], why: 'Outer voices move in similar motion into an octave with a leap in the soprano ([A]→[C]): direct ("hidden") octaves.' },
  { id: 'good-1', error: 'ok', a: ['C3', 'C4', 'E4', 'G4'], b: ['F2', 'C4', 'F4', 'A4'], labels: ['I', 'IV'], why: 'Correct: common tone [C] held, the other upper voices move by step, no parallels.' },
  { id: 'good-2', error: 'ok', a: ['G2', 'B3', 'D4', 'F4'], b: ['C3', 'C4', 'C4', 'E4'], labels: ['V7', 'I'], why: 'Correct: [B]→[C], [F]→[E], [D]→[C] — the incomplete tonic (tripled root, no 5th) is the textbook resolution of a complete V7.' },
  { id: 'good-3', error: 'ok', a: ['G2', 'B3', 'D4', 'G4'], b: ['C3', 'G3', 'E4', 'G4'], labels: ['V', 'I'], why: 'Acceptable: the leading tone [B] is in an inner voice (tenor), so it may drop to [G] for a complete tonic chord — Bach does this constantly. In the soprano it would have to rise to [C].' },
];

/** Keys to transpose the C-major examples into, with the spelled interval that keeps the ranges sane. */
const VL_KEYS: [string, string, 1 | -1][] = [
  ['C', 'P1', 1], ['F', 'P4', 1], ['G', 'P4', -1], ['D', 'M2', 1], ['Bb', 'M2', -1], ['Eb', 'm3', 1], ['A', 'm3', -1], ['E', 'M3', 1], ['Ab', 'M3', -1],
];

export function voiceLeadingQ(skill: string) {
  return (ctx: GenContext): Question => {
    const id = ctx.pickItem(VL_BANK.map((x) => x.id));
    const ex = VL_BANK.find((x) => x.id === id)!;
    // any key the example fits comfortably (wide examples get fewer choices)
    const fits = VL_KEYS.map(([t, i, d]) => ({ t, i, d, ...satbFit(ex.a, ex.b, i, d) }));
    const best = Math.min(...fits.map((f) => f.cost));
    const { t: tonic, i: ivl, d: dir, shift } = pick(fits.filter((f) => f.cost <= best), ctx.rnd);
    const a = satb(ex.a, ivl, dir, shift, ex.labels[0]);
    const b = satb(ex.b, ivl, dir, shift, ex.labels[1]);
    const why = ex.why.replace(/\[([A-G])\]/g, (_, l: string) => noteName(transpose(parseNote(l)!, ivl, dir)));
    const audio = [...chordEvents(a.notes, { dur: 1.3 }), ...chordEvents(b.notes, { start: 1.4, dur: 1.6 })];
    return choiceQ({
      skill, item: id, columns: 2,
      prompt: 'Spot the voice-leading problem',
      sub: `SATB in ${noteName(parseNote(tonic)!)} major (stems: soprano/tenor up, alto/bass down).`,
      hint: `Leading tone here: ${noteName(transpose(parseNote(tonic)!, 'M7'))}${ex.labels[0].startsWith('V7') ? `; chordal 7th: ${noteName(transpose(parseNote(tonic)!, 'P4'))}` : ''}. Check every pair of voices for a perfect 5th or octave in both chords, then where the leading tone goes, then the gaps between soprano–alto and alto–tenor.`,
      show: { staff: { chords: [a, b] } },
      options: (Object.keys(VL_ERRORS) as VlError[]).map((k) => ({ value: k, label: VL_ERRORS[k] })), correct: ex.error,
      audio, audioLabel: 'Hear it',
      explain: why,
    });
  };
}

// ---------------------------------------------------------------------------
// Figured bass

const FIGURES = [
  { fig: '5/3', name: 'Triad, root position', inv: 0, seventh: false },
  { fig: '6', name: 'Triad, 1st inversion (3rd in bass)', inv: 1, seventh: false },
  { fig: '6/4', name: 'Triad, 2nd inversion (5th in bass)', inv: 2, seventh: false },
  { fig: '7', name: '7th chord, root position', inv: 0, seventh: true },
  { fig: '6/5', name: '7th chord, 1st inversion', inv: 1, seventh: true },
  { fig: '4/3', name: '7th chord, 2nd inversion', inv: 2, seventh: true },
  { fig: '4/2', name: '7th chord, 3rd inversion (7th in bass)', inv: 3, seventh: true },
] as const;

export function figuredBassQ(skill: string) {
  return (ctx: GenContext): Question => {
    const fig = ctx.pickItem(FIGURES.map((f) => f.fig));
    const f = FIGURES.find((x) => x.fig === fig)!;
    const k = randomMajorKey(ctx);
    const rootDeg = f.seventh ? 5 : pick([1, 4, 5], ctx.rnd);
    const root = transpose(k.tonic, ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'][rootDeg - 1]);
    const type = f.seventh ? 'dom7' : 'maj';
    const notes = chordNotes(root, type);
    const bass = notes[f.inv];
    const sym = chordSymbol(root, type, f.inv ? bass : null);
    const staff = staffChord(notes, f.inv, fig);
    if (ctx.rnd() < 0.5) {
      return choiceQ({
        skill, item: fig, columns: 1,
        prompt: `Figure "${fig}" means…`,
        hint: 'Figures are intervals above the bass. A 6 means the bass is not the root; a 2, 4/3 or 6/5 means there is a 7th in the chord.',
        options: shuffle([{ value: fig, label: f.name }, ...shuffle(FIGURES.filter((x) => x.fig !== fig), ctx.rnd).slice(0, 3).map((x) => ({ value: x.fig, label: x.name }))], ctx.rnd),
        correct: fig,
        show: { staff: { chords: [staff] } },
        explain: `Figures are intervals above the bass: ${fig} → ${f.name}. Example: ${sym} in ${keyName(k)}.`,
        audio: chordEvents(staff.notes), audioLabel: 'Hear it',
      });
    }
    return choiceQ({
      skill, item: fig,
      prompt: `${sym}: which figure?`,
      sub: `Bass ${noteName(bass)}. ${keyName(k)}.`,
      hint: `${noteName(bass)} is the chord's ${['root', '3rd', '5th', '7th'][f.inv]}. Name the other chord tones as intervals above ${noteName(bass)} and keep the characteristic ones.`,
      options: shuffle([fig, ...shuffle(FIGURES.filter((x) => x.fig !== fig && x.seventh === f.seventh).map((x) => x.fig), ctx.rnd)].slice(0, 4), ctx.rnd).map((x) => ({ value: x, label: x })),
      correct: fig,
      explain: `${f.name} → ${fig}. Triads: 5/3, 6, 6/4. Sevenths: 7, 6/5, 4/3, 4/2.`,
      audio: chordEvents(staff.notes), audioLabel: 'Hear it',
      reveal: { staff: { chords: [staff] } },
    });
  };
}

function staffChord(notes: Note[], inv: number, label: string): StaffChord {
  const order = [...notes.slice(inv), ...notes.slice(0, inv)];
  const mids: number[] = [];
  order.forEach((n, i) => {
    const m = i === 0 ? midiAtOrAbove(pc(n), 43) : midiAtOrAbove(pc(n), Math.max(mids[i - 1] + 1, 55));
    mids.push(m);
  });
  return { notes: mids, names: order.map(noteName), label };
}

// ---------------------------------------------------------------------------
// Chromatic predominants & applied leading-tone chords

const CHROMATIC = ['N6', 'It+6', 'Fr+6', 'Ger+6', 'Ger=V7', 'viio7/V'] as const;

export function chromaticChordQ(skill: string) {
  return (ctx: GenContext): Question => {
    const kind = ctx.pickItem(CHROMATIC);
    const k: Key = kind === 'viio7/V' ? randomMajorKey(ctx) : randomMinorKey(ctx);
    const t = k.tonic;
    const b6 = transpose(t, 'm6');
    const s4 = transpose(t, 'A4');
    const spell = (ns: Note[]) => ns.map(noteName).join(' ');
    let correct = '';
    let wrong: string[] = [];
    let why = '';
    let prompt = '';
    if (kind === 'N6') {
      const root = transpose(t, 'm2');
      const triad = chordNotes(root, 'maj');
      correct = `${chordSymbol(root, 'maj', triad[1])} (${spell([triad[1], triad[2], triad[0]])})`;
      wrong = [transpose(t, 'M2'), transpose(t, 'm2', -1), transpose(t, 'P4')].map((r) => {
        const tr = chordNotes(r, 'maj');
        return `${chordSymbol(r, 'maj', tr[1])} (${spell([tr[1], tr[2], tr[0]])})`;
      });
      prompt = `Neapolitan sixth in ${keyName(k)}?`;
      why = `♭II in first inversion: root ${noteName(root)} (♭2), bass ${noteName(triad[1])} (4). The ♭2 falls to the leading tone at V.`;
    } else if (kind === 'Ger=V7') {
      const ger = [b6, t, transpose(t, 'm3'), s4];
      const dom = chordSymbol(b6, 'dom7');
      correct = dom;
      wrong = [chordSymbol(transpose(t, 'P5'), 'dom7'), chordSymbol(transpose(t, 'm2'), 'dom7'), chordSymbol(transpose(t, 'P4'), 'dom7')];
      prompt = `The German sixth in ${keyName(k)} (${spell(ger)}) sounds like which dominant 7th?`;
      why = `${spell(ger)} = ${dom} enharmonically (${noteName(s4)} = the 7th). That is why a German sixth resolving to V is the classical twin of a tritone substitution.`;
    } else if (kind === 'viio7/V') {
      const lt = transpose(t, 'A4');
      const ch = chordNotes(lt, 'dim7');
      correct = `${chordSymbol(lt, 'dim7')} (${spell(ch)})`;
      wrong = [transpose(t, 'M7'), transpose(t, 'M3'), transpose(t, 'P4')].map((r) => `${chordSymbol(r, 'dim7')} (${spell(chordNotes(r, 'dim7'))})`);
      prompt = `vii°7/V in ${keyName(k)}?`;
      why = `The leading-tone 7th of V: built on ♯4 (${noteName(lt)}), resolving to ${noteName(transpose(t, 'P5'))}.`;
    } else {
      const sets: Record<string, Note[]> = {
        'It+6': [b6, t, s4],
        'Fr+6': [b6, t, transpose(t, 'M2'), s4],
        'Ger+6': [b6, t, transpose(t, 'm3'), s4],
      };
      correct = spell(sets[kind]);
      wrong = Object.entries(sets).filter(([x]) => x !== kind).map(([, v]) => spell(v));
      wrong.push(spell([transpose(t, 'M6'), t, s4]));
      prompt = `${{ 'It+6': 'Italian', 'Fr+6': 'French', 'Ger+6': 'German' }[kind]} augmented sixth in ${keyName(k)}?`;
      why = `Augmented sixths sit on ♭6 with ♯4 above: ${noteName(b6)}–${noteName(s4)} expands outward to the octave on 5. Italian = ♭6 1 ♯4; French adds 2; German adds ♭3.`;
    }
    const hint = {
      N6: `A major triad on ♭2 of ${keyName(k)} (${noteName(transpose(t, 'm2'))}), with its 3rd in the bass.`,
      'Ger=V7': `Respell the ♯4 (${noteName(s4)}) as ${noteName(transpose(t, 'd5'))}: the four notes now stack in 3rds — from which root?`,
      'viio7/V': `A diminished 7th built on the leading tone of V: one half step below ${noteName(transpose(t, 'P5'))}.`,
    }[kind as string] ?? `All three sit on ♭6 (${noteName(b6)}) with ♯4 (${noteName(s4)}) above it: Italian adds 1, French adds 1 and 2, German adds 1 and ♭3.`;
    return choiceQ({
      skill, item: kind, columns: 1,
      prompt,
      hint,
      options: textOptions(correct, wrong, 4, ctx.rnd), correct,
      explain: why,
    });
  };
}
