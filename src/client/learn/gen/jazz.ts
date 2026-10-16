// Fast-recall jazz harmony drills: substitutions, guide tones, chord–scale,
// melodic-minor modes, upper structures, diminished relationships, analysis.

import { mod, noteName, pc, pick, practical, shuffle, spellPc, transpose, type Note } from '../../theory/core';
import { chordFormula, chordSymbol } from '../../theory/chords';
import { CHORD_SCALES, DOMINANT_USTS, ustRoot } from '../../theory/chordScale';
import { diatonicChords, keyFromName, keyName, keyScaleNotes, parseRoman, prefersFlats, type Key } from '../../theory/keys';
import { PROGRESSIONS, type ProgGroup } from '../../theory/progressions';
import { MELODIC_MODES, MODES, SCALE_BY_ID, scaleNotes } from '../../theory/scales';
import type { GenContext, Question } from '../types';
import { chordEvents, chordMidis, parseChordSymbol, progressionEvents, progressionInKey, scaleEvents } from '../music';
import { choiceQ, limitOptions, ordinal, randInt, randomMajorKey, randomMinorKey, textOptions } from './helpers';

// Lone chords take the spelling players reach for (auto); chords related to a
// key or another chord are spelled by interval from it, then tidied for the chart.
const flat = (p: number): Note => spellPc(p, 'flat');
const auto = (p: number): Note => spellPc(p, 'auto');
const chart = (k: Key) => (n: Note): Note => practical(n, prefersFlats(k) ? 'flat' : 'sharp');

// ---------------------------------------------------------------------------
// Tritone substitution

export function tritoneQ(skill: string) {
  const kinds = ['sub', 'shared', 'cadence'] as const;
  return (ctx: GenContext): Question => {
    const kind = ctx.pickItem(kinds);
    const r = randInt(ctx.rnd, 0, 11);
    const dom = chordSymbol(auto(r), 'dom7');
    const sub = chordSymbol(flat(r + 6), 'dom7');
    const third = noteName(transpose(auto(r), 'M3'));
    const seventh = noteName(transpose(auto(r), 'm7'));
    const distract = [r + 1, r + 5, r + 7, r - 1, r + 3].map((x) => chordSymbol(flat(x), 'dom7'));
    if (kind === 'cadence') {
      const k = randomMajorKey(ctx);
      const P = chart(k);
      const T = k.tonic;
      const ii = chordSymbol(transpose(T, 'M2'), 'min7');
      const subRoot = P(transpose(T, 'm2'));
      const sub7 = chordSymbol(subRoot, 'dom7');
      const target = chordSymbol(T, 'maj7');
      const others = (['P5', 'M2', 'm3', 'P4', 'M7', 'm6'] as const).map((i) => chordSymbol(P(transpose(T, i)), 'dom7'));
      return choiceQ({
        skill, item: kind,
        prompt: `${ii} – ? – ${target}`,
        sub: 'Fill in the tritone-substitute dominant.',
        hint: `Find the ordinary V7 of ${target} first, then move its root a tritone (three whole steps).`,
        options: textOptions(sub7, others, 4, ctx.rnd), correct: sub7,
        explain: `The V7 of ${target} is ${chordSymbol(transpose(T, 'P5'), 'dom7')}; its tritone sub is ${sub7}. Bass line: ${noteName(transpose(T, 'M2'))} → ${noteName(subRoot)} → ${noteName(T)}, chromatic descent.`,
        after: progressionEvents(k, [ii, sub7, target], { bpm: 100, beats: 2 }).events,
      });
    }
    return choiceQ({
      skill, item: kind,
      prompt: kind === 'sub' ? `Tritone sub of ${dom}?` : `${dom}'s tritone is ${third}–${seventh}. Which other dominant has the same tritone?`,
      hint: kind === 'sub'
        ? `Count three whole steps from ${noteName(auto(r))}: the new root sits there, and its 3rd and ♭7 are ${dom}'s ${seventh} and ${third} swapped.`
        : `Make ${seventh} the 3rd of a dominant chord (so ${third} becomes its ♭7): which root has ${seventh} as its major 3rd?`,
      options: textOptions(sub, distract, 4, ctx.rnd), correct: sub,
      explain: `${dom} and ${sub} share ${third} and ${seventh} (each one's 3rd is the other's 7th), so either resolves to the same target. ${sub} = ${dom} with altered tensions: its root is ${dom}'s ♭5, its 5th is ${dom}'s ♭9.`,
      audio: chordEvents(chordMidis(r, 'dom7')),
      audioLabel: `Hear ${dom}`,
      after: [...chordEvents(chordMidis(mod(r + 6, 12), 'dom7'))],
    });
  };
}

// ---------------------------------------------------------------------------
// Related ii / ii–V into a target

export function relatedIiQ(skill: string) {
  const kinds = ['relatedii', 'into-major', 'into-minor'] as const;
  return (ctx: GenContext): Question => {
    const kind = ctx.pickItem(kinds);
    const t = randInt(ctx.rnd, 0, 11);
    if (kind === 'relatedii') {
      const D = auto(t);
      const dom = chordSymbol(D, 'dom7');
      const ii = chordSymbol(practical(transpose(D, 'P5')), 'min7');
      const wrong = [t + 2, t + 5, t + 9, t + 10].map((x) => chordSymbol(auto(x), 'min7'));
      return choiceQ({
        skill, item: kind,
        prompt: `Related ii of ${dom}?`,
        hint: `The related ii is a minor 7th chord whose root is a perfect 5th above ${noteName(D)}.`,
        options: textOptions(ii, wrong, 4, ctx.rnd), correct: ii,
        explain: `The related ii is a 5th above the dominant root (a 4th below): ${ii} – ${dom}. "Backcycling" — putting a ii before any V7 — is the most common bebop reharmonisation.`,
      });
    }
    const minor = kind === 'into-minor';
    const k = minor ? randomMinorKey(ctx) : randomMajorKey(ctx);
    const P = chart(k);
    const T = k.tonic;
    const iiRoot = transpose(T, 'M2');
    const vRoot = transpose(T, 'P5');
    const target = chordSymbol(T, minor ? 'min6' : 'maj7');
    const ii = chordSymbol(iiRoot, minor ? 'm7b5' : 'min7');
    const v = chordSymbol(vRoot, minor ? '7b9' : 'dom7');
    const correct = `${ii} – ${v}`;
    const alt = [
      `${chordSymbol(iiRoot, minor ? 'min7' : 'm7b5')} – ${v}`,
      `${chordSymbol(P(transpose(T, 'M6')), 'min7')} – ${chordSymbol(iiRoot, 'dom7')}`,
      `${chordSymbol(vRoot, 'min7')} – ${chordSymbol(T, 'dom7')}`,
      `${ii} – ${chordSymbol(P(transpose(T, 'm2')), 'dom7')}`,
    ];
    return choiceQ({
      skill, item: kind, columns: 1,
      prompt: minor ? `Harmonic-minor ii–V into ${target}?` : `Diatonic ii–V into ${target}?`,
      hint: `ii is a whole step above ${noteName(T)}, V a perfect 5th above it. ${minor ? 'A minor target takes a half-diminished ii and a 7♭9.' : 'In major: a plain m7 and a plain 7.'}`,
      options: textOptions(correct, alt, 4, ctx.rnd), correct,
      explain: minor
        ? `Minor ii–V–i: iiø7–V7♭9–i (from harmonic minor): ${correct} – ${target}. Variants you'll meet: ii7 instead of iiø7 (Dorian colour) and subV7 (♭II7) for the V.`
        : `Major ii–V–I: ii7–V7–Imaj7: ${correct} – ${target}. Common non-diatonic variants: iiø7 (borrowed from minor) and ii–subV (♭II7).`,
      after: progressionEvents(k, [ii, v, target], { bpm: 100, beats: 2 }).events,
    });
  };
}

// ---------------------------------------------------------------------------
// Guide-tone voice leading

export function guideToneQ(skill: string) {
  const rel = ['ii7to3', 'ii3to7', 'V7to3', 'V3to7'] as const;
  return (ctx: GenContext): Question => {
    const r = ctx.pickItem(rel);
    const k = randomMajorKey(ctx);
    const [ii, v, i] = ['ii7', 'V7', 'Imaj7'].map((n) => parseRoman(n, k)!);
    const n3 = (c: typeof ii, t: 'm3' | 'M3') => transpose(c.root, t);
    const n7 = (c: typeof ii, t: 'm7' | 'M7') => transpose(c.root, t);
    const map = {
      ii7to3: { from: ii, to: v, note: n7(ii, 'm7'), ans: n3(v, 'M3'), q: `the 7th of ${ii.symbol}`, tgt: v.symbol, why: 'falls a half step to the 3rd' },
      ii3to7: { from: ii, to: v, note: n3(ii, 'm3'), ans: n7(v, 'm7'), q: `the 3rd of ${ii.symbol}`, tgt: v.symbol, why: 'stays put and becomes the 7th' },
      V7to3: { from: v, to: i, note: n7(v, 'm7'), ans: n3(i, 'M3'), q: `the 7th of ${v.symbol}`, tgt: i.symbol, why: 'falls a half step to the 3rd' },
      V3to7: { from: v, to: i, note: n3(v, 'M3'), ans: n7(i, 'M7'), q: `the 3rd of ${v.symbol}`, tgt: i.symbol, why: 'stays put and becomes the major 7th' },
    }[r];
    const ans = noteName(map.ans);
    const cands = [map.ans, transpose(map.ans, 'm2'), transpose(map.ans, 'M2', -1), transpose(map.ans, 'm3'), map.note].map(noteName);
    return choiceQ({
      skill, item: r,
      prompt: `The ${map.q.replace(/^the /, '')} (${noteName(map.note)}) moves to which note of ${map.tgt}?`,
      sub: `Smoothest guide-tone motion, key of ${keyName(k)}.`,
      hint: `Spell ${map.tgt}'s 3rd and 7th. A 7th falls a half step to the next chord's 3rd; a 3rd stays where it is and becomes the next chord's 7th.`,
      options: textOptions(ans, cands, 4, ctx.rnd), correct: ans,
      explain: `${noteName(map.note)} ${map.why} (${ans}). Through ii–V–I the guide tones alternate: 7→3, 3→7 — a line moving by half step or common tone. Target these on downbeats when improvising.`,
      after: progressionEvents(k, ['ii7', 'V7', 'Imaj7'], { bpm: 96, beats: 2 }).events,
    });
  };
}

// ---------------------------------------------------------------------------
// Chord–scale

const CS_TYPES = ['maj7', 'maj7s11', 'min7', 'min6', 'mmaj7', 'm7b5', 'dim7', 'dom7', '7s11', '7b13', '7b9', '13b9', '7alt', 'aug7', '7sus4', 'maj7s5'] as const;

export function chordScaleQ(skill: string) {
  return (ctx: GenContext): Question => {
    // half the time: which mode for a diatonic 7th chord in context
    if (ctx.rnd() < 0.35) {
      const k = randomMajorKey(ctx);
      const d = randInt(ctx.rnd, 1, 7);
      const c = diatonicChords(k, true)[d - 1];
      const mode = MODES[d - 1];
      const opts = MODES.map((m) => ({ value: m.mode, label: `${noteName(c.root)} ${m.mode}` }));
      return choiceQ({
        skill, item: `diatonic${d}`,
        prompt: `${c.symbol} as the ${c.numeral} of ${keyName(k)}: which mode?`,
        hint: `Play ${keyName(k)}'s notes starting on ${noteName(c.root)}. The modes in order from degree 1: Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian.`,
        options: limitOptions(opts, mode.mode, 4, ctx.rnd), correct: mode.mode,
        explain: `Diatonic chord → mode on that degree: ${c.numeral} = ${mode.mode}. ${SCALE_BY_ID[mode.scale].character}`,
      });
    }
    const typeId = ctx.pickItem(CS_TYPES);
    const root = auto(randInt(ctx.rnd, 0, 11));
    const choices = CHORD_SCALES[typeId];
    const correct = choices[0].scale;
    const valid = new Set(choices.map((c) => c.scale));
    const pool = [...new Set(Object.values(CHORD_SCALES).flatMap((c) => c.map((x) => x.scale)))].filter((s) => !valid.has(s));
    const opts = shuffle([correct, ...shuffle(pool, ctx.rnd).slice(0, 3)], ctx.rnd).map((s) => ({ value: s, label: `${noteName(root)} ${SCALE_BY_ID[s].name}` }));
    const sym = chordSymbol(root, typeId);
    const start = 55 + mod(pc(root) - 7, 12);
    return choiceQ({
      skill, item: typeId, columns: 1,
      prompt: `Best-fit scale for ${sym}?`,
      hint: `Spell ${sym} (${chordFormula(typeId)}). The right scale contains every chord tone and alteration, and no note a half step above a chord tone that would clash.`,
      options: opts, correct,
      explain: `${sym}: ${choices.map((c) => `${SCALE_BY_ID[c.scale].name} (${c.when})`).join('; ')}. ${SCALE_BY_ID[correct].formula}.`,
      after: [...chordEvents(chordMidis(pc(root), typeId), { dur: 2.2 }), ...scaleEvents(start, correct, 'up', 0.2).map((e) => ({ ...e, start: e.start + 0.4 }))],
    });
  };
}

// ---------------------------------------------------------------------------
// Melodic minor modes

export function melodicModesQ(skill: string) {
  const kinds = ['nth-mode', 'altered-parent', 'lydom-parent', 'loc2-parent'] as const;
  return (ctx: GenContext): Question => {
    const kind = ctx.pickItem(kinds);
    const mm = auto(randInt(ctx.rnd, 0, 11));
    const mmName = `${noteName(mm)} melodic minor`;
    if (kind === 'nth-mode') {
      const m = MELODIC_MODES[randInt(ctx.rnd, 1, 6)];
      const strict = scaleNotes(mm, 'melodic_minor')[m.degree - 1];
      const root = practical(strict);
      const correct = `${noteName(root)} ${m.mode}`;
      const wrong = MELODIC_MODES.filter((x) => x.mode !== m.mode).map((x) => `${noteName(root)} ${x.mode}`);
      return choiceQ({
        skill, item: m.mode, columns: 1,
        prompt: `${ordinal(m.degree)} mode of ${mmName}?`,
        hint: `Write out ${mmName} (1 2 ♭3 4 5 6 7) and start on degree ${m.degree}. Modes 1–7: melodic minor, Dorian ♭2, Lydian augmented, Lydian dominant, Mixolydian ♭6, Locrian ♮2, altered.`,
        options: textOptions(correct, wrong, 4, ctx.rnd), correct,
        explain: `${mmName}: ${scaleNotes(mm, 'melodic_minor').map(noteName).join(' ')}. Degree ${m.degree} → ${correct}${root === strict ? '' : ` (${noteName(strict)} in the scale)`}, the scale for ${chordSymbol(root, m.chord)}.`,
      });
    }
    const dom = auto(randInt(ctx.rnd, 0, 11));
    const spec = {
      'altered-parent': { chord: chordSymbol(dom, '7alt'), parent: practical(transpose(dom, 'm2')), rule: 'a half step above the root' },
      'lydom-parent': { chord: chordSymbol(dom, '7s11'), parent: practical(transpose(dom, 'P5')), rule: 'a 5th above the root' },
      'loc2-parent': { chord: chordSymbol(dom, 'm7b5'), parent: practical(transpose(dom, 'm3')), rule: 'a minor 3rd above the root' },
    }[kind];
    const correct = `${noteName(spec.parent)} melodic minor`;
    // never offer the right scale under its enharmonic name (C♯ vs D♭ melodic minor)
    const wrong = [1, 2, 5, 7, 3, 4].filter((x) => mod(pc(dom) + x, 12) !== pc(spec.parent)).map((x) => `${noteName(auto(pc(dom) + x))} melodic minor`);
    return choiceQ({
      skill, item: kind, columns: 1,
      prompt: `${spec.chord} — which melodic minor?`,
      hint: 'Rules of thumb: 7alt → melodic minor a half step above the root; 7♯11 → a 5th above; m7♭5 → a minor 3rd above.',
      options: textOptions(correct, wrong, 4, ctx.rnd), correct,
      explain: `Parent melodic minor is ${spec.rule}: ${correct}. Think of one scale, not seven modes.`,
    });
  };
}

// ---------------------------------------------------------------------------
// Upper-structure triads

export function ustQ(skill: string) {
  const items = DOMINANT_USTS.map((u) => u.numeral);
  return (ctx: GenContext): Question => {
    const numeral = ctx.pickItem(items);
    const u = DOMINANT_USTS.find((x) => x.numeral === numeral)!;
    const r = randInt(ctx.rnd, 0, 11);
    const dom = chordSymbol(auto(r), 'dom7');
    const ust = (x: typeof u) => chordSymbol(ustRoot(auto(r), x), x.quality === 'maj' ? 'maj' : 'min');
    const triad = ust(u);
    const reverse = ctx.rnd() < 0.4;
    const shell = [36 + r + 4, 36 + r + 10].map((m) => (m < 52 ? m + 12 : m));
    const tri = chordMidis(mod(r + u.semis, 12), u.quality === 'maj' ? 'maj' : 'min').slice(1).map((m) => (m < 64 ? m + 12 : m));
    const audio = chordEvents([36 + r, ...shell, ...tri], { dur: 2 });
    if (reverse) {
      return choiceQ({
        skill, item: numeral, shuffle: true, rnd: ctx.rnd,
        prompt: `Which triad over ${dom} gives ${u.tensions}?`,
        hint: `Work backwards from ${noteName(auto(r))}: put the first tension listed at the bottom of a triad — a ♯9 is a minor 3rd up, 9 a whole step, ♭13 a minor 6th, 13 a major 6th, ♯11 a tritone, ♭9 a half step, ♭7 a minor 7th.`,
        options: limitOptions(DOMINANT_USTS.map((x) => ({ value: x.numeral, label: `${ust(x)}/${dom}` })), numeral, 4, ctx.rnd), correct: numeral,
        explain: `${triad} over ${dom} (shell 3–♭7 below) = ${u.tensions}. Scale: ${SCALE_BY_ID[u.scale].name}.`,
        after: audio,
      });
    }
    return choiceQ({
      skill, item: numeral, columns: 1,
      prompt: `${triad} triad over ${dom}: which tensions?`,
      hint: `Spell ${triad}, then name each of its notes against ${noteName(auto(r))}: R ♭9 9 ♯9 3 11 ♯11 5 ♭13 13 ♭7.`,
      options: limitOptions(DOMINANT_USTS.map((x) => ({ value: x.numeral, label: x.tensions })), numeral, 4, ctx.rnd), correct: numeral,
      audio, audioLabel: 'Hear it',
      explain: `${triad} sits a ${['', '♭2nd', '2nd', '♭3rd', '3rd', '4th', 'tritone', '5th', '♭6th', '6th', '♭7th', '7th'][u.semis]} above the root → ${u.tensions} (${SCALE_BY_ID[u.scale].name}).`,
    });
  };
}

// ---------------------------------------------------------------------------
// Diminished relationships

export function dimQ(skill: string) {
  const kinds = ['family', 'rootless', 'passing'] as const;
  return (ctx: GenContext): Question => {
    const kind = ctx.pickItem(kinds);
    const r = randInt(ctx.rnd, 0, 11);
    const dim = chordSymbol(auto(r), 'dim7');
    if (kind === 'family') {
      const same = chordSymbol(auto(r + [3, 6, 9][randInt(ctx.rnd, 0, 2)]), 'dim7');
      const wrong = [1, 2, 4, 5].map((x) => chordSymbol(auto(r + x), 'dim7'));
      return choiceQ({
        skill, item: kind,
        prompt: `${dim} contains the same four notes as…`,
        hint: `A dim7 is stacked minor 3rds: count minor 3rds up from ${noteName(auto(r))} — each of those notes can be the root.`,
        options: textOptions(same, wrong, 4, ctx.rnd), correct: same,
        explain: `Diminished 7ths are stacks of minor 3rds, so ${dim} = its inversions a m3, tritone and M6 away. Only three distinct dim7 chords exist.`,
      });
    }
    if (kind === 'rootless') {
      const doms = [r - 4, r - 1, r + 2, r + 5].map((x) => chordSymbol(flat(x), '7b9'));
      const correct = pick(doms, ctx.rnd);
      const wrong = [r, r + 1, r + 3, r + 6, r - 2].map((x) => chordSymbol(flat(x), '7b9'));
      return choiceQ({
        skill, item: kind,
        prompt: `${dim} is a rootless version of which 7♭9 chord?`,
        hint: `Put a root a major 3rd below any note of ${dim}: the dim7 becomes that dominant's 3 5 ♭7 ♭9.`,
        options: textOptions(correct, wrong, 4, ctx.rnd), correct,
        explain: `Put a root a major 3rd below any note of ${dim}: the dim7 becomes 3 · 5 · ♭7 · ♭9. So ${dim} = ${doms.join(' = ')} (rootless).`,
      });
    }
    const k = randomMajorKey(ctx);
    const pairs = [['Imaj7', 'ii7', '♯I°7'], ['ii7', 'iii7', '♯II°7'], ['IVmaj7', 'V7', '♯IV°7']] as const;
    const [a, b, mid] = pick(pairs, ctx.rnd);
    const from = parseRoman(a, k)!;
    const to = parseRoman(b, k)!;
    const pd = chordSymbol(spellPc(pc(from.root) + 1, 'sharp'), 'dim7');
    const wrong = [pc(from.root) + 3, pc(from.root) + 2, pc(from.root) - 1].map((x) => chordSymbol(spellPc(x, 'sharp'), 'dim7'));
    return choiceQ({
      skill, item: kind,
      prompt: `Chromatic passing diminished between ${from.symbol} and ${to.symbol}?`,
      hint: `The bass climbs by half step: the passing °7's root sits a half step above ${noteName(from.root)}.`,
      sub: keyName(k),
      options: textOptions(pd, wrong, 4, ctx.rnd), correct: pd,
      explain: `${mid}: the bass rises by half step ${noteName(from.root)}–${noteName(spellPc(pc(from.root) + 1, 'sharp'))}–${noteName(to.root)}, and ${pd} acts as a rootless V7♭9 of ${to.symbol}.`,
      after: progressionEvents(k, [a, pd, b], { bpm: 96, beats: 2 }).events,
    });
  };
}

// ---------------------------------------------------------------------------
// Diatonic 7th chords in major / harmonic minor / melodic minor

export function keyChordsQ(skill: string, variant: 'major' | 'harmonic' | 'melodic') {
  const degrees = ['1', '2', '3', '4', '5', '6', '7'] as const;
  return (ctx: GenContext): Question => {
    const d = Number(ctx.pickItem(degrees));
    const k: Key = variant === 'major' ? randomMajorKey(ctx) : randomMinorKey(ctx);
    const chords = diatonicChords(k, true, variant === 'major' ? 'natural' : variant);
    const c = chords[d - 1];
    const label = variant === 'major' ? keyName(k) : `${noteName(k.tonic)} ${variant} minor`;
    const table = chords.map((x) => `${x.numeral} ${x.symbol}`).join(' · ');
    const qualities = { major: 'maj7 m7 m7 maj7 7 m7 m7♭5', harmonic: 'm(maj7) m7♭5 maj7♯5 m7 7 maj7 °7', melodic: 'm(maj7) m7 maj7♯5 7 7 m7♭5 m7♭5' }[variant];
    const scale = keyScaleNotes(k, variant === 'major' ? 'natural' : variant).map(noteName).join(' ');
    const hint = `${label}: ${scale}. Qualities from degree 1: ${qualities}.`;
    if (ctx.rnd() < 0.5) {
      const qualityVariants = ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mmaj7', 'maj7s5'].map((t) => chordSymbol(c.root, t));
      return choiceQ({
        skill, item: String(d),
        prompt: `${label}: the 7th chord on degree ${d}?`,
        hint,
        options: textOptions(c.symbol, qualityVariants, 4, ctx.rnd), correct: c.symbol,
        explain: `${label}: ${table}.`,
        after: chordEvents(chordMidis(pc(c.root), c.typeId)),
      });
    }
    return choiceQ({
      skill, item: String(d),
      prompt: `${label}: ${c.symbol} is…`,
      hint,
      options: limitOptions(chords.map((x) => ({ value: x.numeral, label: x.numeral })), c.numeral, 4, ctx.rnd), correct: c.numeral,
      explain: `${label}: ${table}.`,
    });
  };
}

// ---------------------------------------------------------------------------
// Analysis

/** Does a chord-symbol list contain a ii–V (minor-ish chord, then a dominant a 4th up)? */
function hasIiV(symbols: string[]): boolean {
  return symbols.some((a, i) => {
    const x = parseChordSymbol(a);
    const y = parseChordSymbol(symbols[i + 1] ?? '');
    if (!x || !y) return false;
    return /^(min|m7b5|m9b5)/.test(x.typeId) && /^(dom|7|13|9)/.test(y.typeId) && mod(pc(y.root) - pc(x.root), 12) === 5;
  });
}

export function analysisQ(skill: string, groups: ProgGroup[]) {
  const pool = PROGRESSIONS.filter((p) => groups.includes(p.group));
  return (ctx: GenContext): Question => {
    const id = ctx.pickItem(pool.map((p) => p.id));
    const prog = pool.find((p) => p.id === id)!;
    const ref = keyFromName(prog.key);
    const target: Key = ref.mode === 'major' ? randomMajorKey(ctx) : randomMinorKey(ctx);
    const chords = progressionInKey(prog.chords, prog.key, target);
    const correct = prog.numerals.join(' – ');
    const others = pool.filter((p) => p.id !== prog.id && p.numerals.length === prog.numerals.length).map((p) => p.numerals.join(' – '));
    const fallback = PROGRESSIONS.filter((p) => p.id !== prog.id).map((p) => p.numerals.slice(0, prog.numerals.length).join(' – '));
    const play = progressionEvents(target, chords, { bpm: 92, beats: prog.beats ?? 2, style: prog.group === 'funk' ? 'funk' : prog.group === 'jazz' || prog.group === 'subs' ? 'swing' : 'block' });
    return choiceQ({
      skill, item: id, columns: 1,
      prompt: chords.join('  |  '),
      sub: `Analyse in ${keyName(target)}.`,
      hint: `Measure each root from ${noteName(target.tonic)} and read the quality from the symbol. ${hasIiV(chords)
        ? 'There is a ii–V in here: a m7 (or ø7) moving up a 4th to a dominant 7th — the chord it points to is a 5th below the V.'
        : 'Watch for chords from outside the key: borrowed ones (iv, ♭VI, ♭VII), secondary dominants and tritone subs.'}`,
      options: textOptions(correct, others.length >= 3 ? others : [...others, ...fallback], 4, ctx.rnd), correct,
      audio: play.events, audioLabel: 'Play',
      explain: `${prog.name}: ${correct}. ${prog.description}`,
    });
  };
}

export function keyCenterQ(skill: string) {
  const kinds = ['major', 'minor', 'major-iii'] as const;
  return (ctx: GenContext): Question => {
    const kind = ctx.pickItem(kinds);
    const k: Key = kind === 'minor' ? randomMinorKey(ctx) : randomMajorKey(ctx);
    const nums = kind === 'minor' ? ['iiø7', 'V7♭9'] : kind === 'major' ? ['ii7', 'V7'] : ['iii7', 'VI7', 'ii7', 'V7'];
    const chords = nums.map((n) => parseRoman(n.replace('♭', 'b'), k)!.symbol);
    const correct = keyName(k);
    const wrong = [
      `${noteName(transpose(k.tonic, 'P5'))} ${k.mode}`,
      `${noteName(transpose(k.tonic, 'M2'))} ${k.mode === 'major' ? 'minor' : 'major'}`,
      `${noteName(k.tonic)} ${k.mode === 'major' ? 'minor' : 'major'}`,
      `${noteName(transpose(k.tonic, 'P4'))} major`,
    ];
    return choiceQ({
      skill, item: kind,
      prompt: `${chords.join(' – ')} → key centre?`,
      hint: `A ii–V resolves to the chord a perfect 5th below the V7 (${chords[chords.length - 1]}). ${kind === 'minor' ? 'Half-diminished ii + 7♭9: is the target major or minor?' : 'Plain m7 + 7: is the target major or minor?'}`,
      options: textOptions(correct, wrong, 4, ctx.rnd), correct,
      explain: kind === 'minor'
        ? `A half-diminished ii with a V7♭9 points to a minor target: ${correct}.`
        : `ii7–V7 resolves to the major chord a 5th below the V root: ${correct}. Spotting ii–Vs is how you read the key centres of a standard at sight.`,
      after: progressionEvents(k, [...nums.map((n) => n.replace('♭', 'b')), k.mode === 'major' ? 'Imaj7' : 'i6'], { bpm: 100, beats: 2 }).events,
    });
  };
}

/** Borrowed chords and every church mode on the same tonic that contains them (verified in tests). */
export const INTERCHANGE: { num: string; mode: string; also?: string[] }[] = [
  { num: 'bVImaj7', mode: 'Aeolian', also: ['Phrygian'] },
  { num: 'bIIImaj7', mode: 'Aeolian', also: ['Dorian'] },
  { num: 'iv7', mode: 'Aeolian', also: ['Phrygian', 'Locrian'] },
  { num: 'bVII7', mode: 'Aeolian' },
  { num: 'iiø7', mode: 'Aeolian' },
  { num: 'bIImaj7', mode: 'Phrygian', also: ['Locrian'] },
  { num: 'bVIImaj7', mode: 'Mixolydian', also: ['Dorian'] },
  { num: 'IV7', mode: 'Dorian' },
  { num: '#ivø7', mode: 'Lydian' },
];

export function interchangeQ(skill: string) {
  return (ctx: GenContext): Question => {
    const num = ctx.pickItem(INTERCHANGE.map((x) => x.num));
    const it = INTERCHANGE.find((x) => x.num === num)!;
    const k = randomMajorKey(ctx);
    const chord = parseRoman(num, k)!;
    const bad = new Set([it.mode, ...(it.also ?? [])]);
    const opts = shuffle(['Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'].filter((m) => !bad.has(m)), ctx.rnd).slice(0, 3);
    return choiceQ({
      skill, item: num, shuffle: true, rnd: ctx.rnd,
      prompt: `In ${keyName(k)}, ${chord.symbol} (${num.replace('b', '♭')}) is borrowed from ${noteName(k.tonic)}…`,
      hint: `Spell ${chord.symbol}, then check which mode on ${noteName(k.tonic)} contains all four notes. Clues: ♭3 ♭6 ♭7 → the minor side; a ♭2 or a ♯4 narrows it fast.`,
      options: [it.mode, ...opts].map((m) => ({ value: m, label: `${noteName(k.tonic)} ${m}` })), correct: it.mode,
      explain: `${chord.symbol} is diatonic to ${noteName(k.tonic)} ${it.mode}${it.also ? ` (also ${it.also.join('/')})` : ''}. Modal interchange: same tonic, borrowed mode.`,
      after: progressionEvents(k, ['Imaj7', num, 'Imaj7'], { bpm: 90, beats: 2 }).events,
    });
  };
}

export function secondaryQ(skill: string) {
  const targets = ['ii7', 'iii7', 'IVmaj7', 'V7', 'vi7'] as const;
  return (ctx: GenContext): Question => {
    const t = ctx.pickItem(targets);
    const k = randomMajorKey(ctx);
    const plain = t.replace(/maj7|7/, '');
    const sec = parseRoman(`V7/${plain}`, k)!;
    const target = parseRoman(t, k)!;
    const diat = diatonicChords(k, true);
    if (ctx.rnd() < 0.5) {
      const opts = targets.map((x) => ({ value: x, label: `${x} (${parseRoman(x, k)!.symbol})` }));
      return choiceQ({
        skill, item: t,
        prompt: `In ${keyName(k)}, ${sec.symbol} is V7 of…`,
        hint: `A dominant resolves down a perfect 5th: which chord of ${keyName(k)} has its root a 5th below ${noteName(sec.root)}?`,
        options: opts, correct: t,
        explain: `${sec.symbol} resolves down a 5th to ${target.symbol} (${t}). Its 3rd, ${noteName(transpose(sec.root, 'M3'))}, is the temporary leading tone.`,
        after: progressionEvents(k, [sec.symbol, target.symbol], { bpm: 96, beats: 2 }).events,
      });
    }
    const wrong = [...diat.map((c) => chordSymbol(c.root, 'dom7')), ...diat.map((c) => c.symbol)].filter((x) => x !== sec.symbol);
    return choiceQ({
      skill, item: t,
      prompt: `${keyName(k)}: V7/${plain}?`,
      hint: `Find ${plain}'s root in ${keyName(k)} (${noteName(target.root)}), go up a perfect 5th, and make that a dominant 7th.`,
      options: textOptions(sec.symbol, wrong, 4, ctx.rnd), correct: sec.symbol,
      explain: `Up a 5th from ${target.symbol}'s root, dominant quality: ${sec.symbol} → ${target.symbol}. Add its related ii for a full tonicisation.`,
      after: progressionEvents(k, [sec.symbol, target.symbol], { bpm: 96, beats: 2 }).events,
    });
  };
}
