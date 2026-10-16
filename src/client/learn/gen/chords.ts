import { INTERVALS, LETTER_PCS, mod, noteName, pc, shuffle, spellPc, uniqueBy, type Note } from '../../theory/core';
import { CHORD_BY_ID, CHORD_TYPES, chordFormula, chordNotes, chordPcs, chordSymbol, getChord } from '../../theory/chords';
import { guideTones } from '../../theory/chordScale';
import { getScale, scaleNotes } from '../../theory/scales';
import type { GenContext, Question } from '../types';
import { chordEvents, chordMidis, melodyEvents, scaleEvents } from '../music';
import { choiceQ, jazzRoot, keysVisual } from './helpers';

/** "4, 7, 11" — how far above the root each chord tone sits, in semitones. */
const semisAbove = (typeId: string) => getChord(typeId).intervals.slice(1).map((i) => INTERVALS[i].semis).join(', ');

const pcsOf = (notes: number[]) => new Set(notes.map((m) => mod(m, 12)));

/** Chord types one wrong note away (same degree, other quality): Cmaj7 → C7, Cm(maj7), Cmaj7♯5. */
function qualityNeighbours(typeId: string): string[] {
  const ivs = getChord(typeId).intervals;
  return CHORD_TYPES.filter((t) => {
    if (t.id === typeId || t.intervals.length !== ivs.length) return false;
    const diff = t.intervals.filter((i, k) => i !== ivs[k]);
    return diff.length === 1 && INTERVALS[diff[0]].num === INTERVALS[ivs[t.intervals.indexOf(diff[0])]].num;
  }).map((t) => t.id);
}

/** The same chord with one note spelled on the wrong letter (A♭ → G♯): the classic spelling slip. */
function enharmonicSlips(notes: Note[], maxAcc: number): string[] {
  const out: string[] = [];
  notes.forEach((n, i) => {
    if (i === 0) return;
    for (const d of [-1, 1]) {
      const letter = mod(n.letter + d, 7);
      let acc = mod(pc(n) - LETTER_PCS[letter], 12);
      if (acc > 6) acc -= 12;
      if (Math.abs(acc) > maxAcc) continue;
      out.push(notes.map((x, j) => noteName(j === i ? { letter, acc } : x)).join(' '));
    }
  });
  return out;
}

export function chordSpell(skill: string, types: string[]) {
  return (ctx: GenContext): Question => {
    const typeId = ctx.pickItem(types);
    const root = jazzRoot(ctx);
    const notes = chordNotes(root, typeId);
    const sym = chordSymbol(root, typeId);
    const correct = notes.map(noteName).join(' ');
    // double sharps/flats only appear as decoys when the real spelling needs them too
    const maxAcc = Math.max(1, ...notes.map((n) => Math.abs(n.acc)));
    const ok = (x: string) => x !== correct && (maxAcc > 1 || !/𝄪|𝄫/.test(x));
    const quality = uniqueBy(qualityNeighbours(typeId).map((t) => chordNotes(root, t).map(noteName).join(' ')), (x) => x).filter(ok);
    const slips = uniqueBy(enharmonicSlips(notes, maxAcc), (x) => x).filter(ok);
    const picks = shuffle(quality, ctx.rnd).slice(0, 2);
    for (const x of shuffle(slips, ctx.rnd)) if (picks.length < 3 && !picks.includes(x)) picks.push(x);
    for (const x of shuffle(quality, ctx.rnd)) if (picks.length < 3 && !picks.includes(x)) picks.push(x);
    const opts = shuffle([correct, ...picks], ctx.rnd).map((x) => ({ value: x, label: x }));
    return choiceQ({
      skill, item: typeId, columns: 1,
      prompt: `Spell ${sym}`,
      sub: 'Right notes and right letters: one letter per chord tone.',
      hint: `Stack 3rds from ${noteName(root)} — one letter per chord tone, skipping a letter each time. Then match ${chordFormula(typeId)}: ${semisAbove(typeId)} semitones above ${noteName(root)}.`,
      options: opts, correct,
      explain: `${sym}: ${chordFormula(typeId)} → ${correct}. ${CHORD_BY_ID[typeId].sound}`,
      after: chordEvents(chordMidis(pc(root), typeId)),
    });
  };
}

/** Name pitch classes the way a chord spells them; others follow the root's flat/sharp side. */
function speller(root: Note, notes: Note[]): (p: number) => string {
  const spell = new Map(notes.map((n) => [pc(n), n]));
  const side = root.acc < 0 || noteName(root) === 'F' ? 'flat' : 'sharp';
  return (p) => noteName(spell.get(mod(p, 12)) ?? spellPc(p, side));
}

/** 7alt: 3 and ♭7 plus at least two of ♭9 ♯9 ♯11 ♭13 — any such voicing counts, no natural 5, 9 or 13. */
const ALT_ALLOWED = new Set([0, 1, 3, 4, 6, 8, 10]);
const ALT_TENSIONS = [1, 3, 6, 8];

export function chordPlay(skill: string, types: string[]) {
  return (ctx: GenContext): Question => {
    const typeId = ctx.pickItem(types);
    const root = jazzRoot(ctx);
    const chord = getChord(typeId);
    const sym = chordSymbol(root, typeId);
    const all = chordPcs(pc(root), typeId);
    const required = chord.intervals.filter((i) => !(chord.optional ?? []).includes(i)).map((i) => mod(pc(root) + INTERVALS[i].semis, 12));
    const notes = chordNotes(root, typeId);
    const spell = new Map(notes.map((n) => [pc(n), n]));
    const mids = chordMidis(pc(root), typeId);
    const label = speller(root, notes);
    return {
      skill, item: typeId,
      prompt: `Play ${sym}`,
      sub: typeId === '7alt'
        ? 'Any altered voicing: 3 and ♭7 plus two or more of ♭9 ♯9 ♯11 ♭13 (root optional).'
        : 'Any voicing; root optional for 7th chords and up (rootless is fine).',
      input: { kind: 'chord' },
      labelPc: label,
      hint: typeId === '7alt'
        ? `Start with the 3rd and ♭7 of ${noteName(root)}, then add two altered tensions (♭9, ♯9, ♯11 or ♭13) — no natural 5, 9 or 13.`
        : `${sym} = ${chordFormula(typeId)}: ${semisAbove(typeId)} semitones above ${noteName(root)}. Any voicing, any octave${getChord(typeId).intervals.length >= 4 ? ' — the root may be left out' : ''}.`,
      check: (a) => {
        if (a.kind !== 'notes') return { correct: false };
        const got = pcsOf(a.notes);
        if (typeId === '7alt') {
          const rel = [...got].map((p) => mod(p - pc(root), 12));
          const outside = rel.filter((x) => !ALT_ALLOWED.has(x));
          const missing = [4, 10].filter((x) => !rel.includes(x));
          const alts = rel.filter((x) => ALT_TENSIONS.includes(x)).length;
          return {
            correct: !outside.length && !missing.length && alts >= 2,
            message: [
              missing.length ? `missing ${missing.map((x) => label(pc(root) + x)).join(', ')}` : '',
              outside.length ? `not altered: ${outside.map((x) => label(pc(root) + x)).join(', ')}` : '',
              alts < 2 ? 'needs two altered tensions' : '',
            ].filter(Boolean).join(' · ') || undefined,
          };
        }
        const need = required.filter((p) => p !== pc(root) || all.length <= 3);
        const missing = need.filter((p) => !got.has(p));
        const extra = [...got].filter((p) => !all.includes(p));
        return {
          correct: !missing.length && !extra.length,
          message: [missing.length ? `missing ${missing.map((p) => noteName(spell.get(p)!)).join(', ')}` : '', extra.length ? `outside: ${extra.map(label).join(', ')}` : ''].filter(Boolean).join(' · ') || undefined,
        };
      },
      explain: `${sym} = ${notes.map(noteName).join(' ')} (${chordFormula(typeId)}). ${chord.sound}`,
      reveal: { keyboard: keysVisual(mids, (m) => noteName(spell.get(mod(m, 12)) ?? root)) },
      after: chordEvents(mids),
    };
  };
}

/** Play only the guide tones (3rd + 7th) of a chord: the shell every comper uses. */
export function shellPlay(skill: string, types: string[]) {
  return (ctx: GenContext): Question => {
    const typeId = ctx.pickItem(types);
    const root = jazzRoot(ctx);
    const sym = chordSymbol(root, typeId);
    const gt = guideTones(pc(root), typeId);
    const name = speller(root, chordNotes(root, typeId));
    return {
      skill, item: typeId,
      prompt: `Guide tones of ${sym}`,
      sub: `Just the 3rd and ${typeId === 'maj6' || typeId === 'min6' ? '6th (the 7th\'s stand-in)' : '7th'} — any octave, either on top.`,
      input: { kind: 'chord' },
      labelPc: name,
      hint: `3rd: ${getChord(typeId).intervals.includes('m3') ? 'minor' : 'major'} 3rd above ${noteName(root)}. 7th: ${typeId === 'maj6' || typeId === 'min6' ? 'the major 6th stands in for it' : getChord(typeId).intervals.includes('M7') ? 'major 7th (a half step below the root)' : 'minor 7th (a whole step below the root)'}.`,
      check: (a) => {
        if (a.kind !== 'notes') return { correct: false };
        const got = pcsOf(a.notes);
        return { correct: got.size === 2 && gt.every((p) => got.has(p)) };
      },
      explain: `${sym}: 3rd = ${name(gt[0])}, 7th = ${name(gt[1])}. These two notes define the quality; everything else is colour. In a ii–V–I the 7th of each chord falls a half step to the 3rd of the next.`,
      reveal: { keyboard: keysVisual([48 + gt[0], 48 + gt[1] + (gt[1] < gt[0] ? 12 : 0)], (m) => name(mod(m, 12))) },
    };
  };
}

/** Name a chord shown on the keyboard (rootless voicings included). */
export function chordName(skill: string, types: string[]) {
  return (ctx: GenContext): Question => {
    const typeId = ctx.pickItem(types);
    const root = jazzRoot(ctx);
    const sym = chordSymbol(root, typeId);
    const mids = chordMidis(pc(root), typeId);
    const notes = chordNotes(root, typeId);
    const spell = new Map(notes.map((n) => [pc(n), n]));
    const others = shuffle(types.filter((t) => t !== typeId), ctx.rnd).slice(0, 3).map((t) => ({ value: t, label: chordSymbol(root, t) }));
    return choiceQ({
      skill, item: typeId, shuffle: true, rnd: ctx.rnd,
      prompt: 'Name this voicing',
      sub: 'Lowest note is the root (bass).',
      hint: `Root ${noteName(root)}. Name each upper note against it: major or minor 3rd? major, minor or diminished 7th? any 9th, 11th or 13th on top?`,
      hintAudio: { label: 'Slow arpeggio', events: melodyEvents(mids, 0.5) },
      show: { keyboard: keysVisual(mids, (m) => noteName(spell.get(mod(m, 12)) ?? root)) },
      options: [{ value: typeId, label: sym }, ...others], correct: typeId,
      audio: chordEvents(mids),
      audioLabel: 'Hear it',
      explain: `${sym}: ${chordFormula(typeId)}.`,
      optionAudio: (t) => chordEvents(chordMidis(pc(root), t)),
    });
  };
}

/** "W W H W W W H" — H = half step, W = whole step, W+H = augmented 2nd. */
function stepPattern(sid: string): string {
  const semis = [...getScale(sid).intervals.map((i) => INTERVALS[i].semis), 12];
  return semis.slice(1).map((x, i) => ({ 1: 'H', 2: 'W', 3: 'W+H' })[x - semis[i]] ?? '?').join(' ');
}

export function scalePlay(skill: string, scaleIds: string[]) {
  return (ctx: GenContext): Question => {
    const sid = ctx.pickItem(scaleIds);
    const root = jazzRoot(ctx);
    const scale = getScale(sid);
    const notes = scaleNotes(root, sid);
    const target = [...notes.map(pc), pc(root)];
    const start = 53 + mod(pc(root) - 5, 12);
    const spell = new Map(notes.map((n) => [pc(n), n]));
    return {
      skill, item: sid,
      prompt: `Play ${noteName(root)} ${scale.name}`,
      sub: `Ascending, root to root (${target.length} notes).`,
      input: { kind: 'sequence', length: target.length, startHint: start },
      labelPc: speller(root, notes),
      hint: `${scale.name}: ${scale.formula}. Step pattern from ${noteName(root)}: ${stepPattern(sid)}.`,
      check: (a) => {
        if (a.kind !== 'notes') return { correct: false };
        const right = a.notes.filter((m, i) => mod(m, 12) === target[i]).length;
        return { correct: right === target.length, score: right / target.length, message: `${right}/${target.length}` };
      },
      explain: `${noteName(root)} ${scale.name}: ${notes.map(noteName).join(' ')} — ${scale.formula}. ${scale.usage}`,
      reveal: { keyboard: keysVisual(scaleEvents(start, sid).map((e) => e.note), (m) => noteName(spell.get(mod(m, 12)) ?? root)) },
      after: scaleEvents(start, sid),
    };
  };
}
