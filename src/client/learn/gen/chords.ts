import { INTERVALS, mod, noteName, pc, pcName, shuffle, spellPc, uniqueBy } from '../../theory/core';
import { CHORD_BY_ID, chordFormula, chordNotes, chordPcs, chordSymbol, getChord } from '../../theory/chords';
import { guideTones } from '../../theory/chordScale';
import { getScale, scaleNotes } from '../../theory/scales';
import type { GenContext, Question } from '../types';
import { chordEvents, chordMidis, scaleEvents } from '../music';
import { choiceQ, jazzRoot, keysVisual } from './helpers';

const pcsOf = (notes: number[]) => new Set(notes.map((m) => mod(m, 12)));

export function chordSpell(skill: string, types: string[]) {
  return (ctx: GenContext): Question => {
    const typeId = ctx.pickItem(types);
    const root = jazzRoot(ctx);
    const notes = chordNotes(root, typeId);
    const sym = chordSymbol(root, typeId);
    const correct = notes.map(noteName).join(' ');
    const wrongs = uniqueBy(
      notes.slice(1).flatMap((_, i) => [1, -1].map((d) => {
        const alt = notes.slice();
        alt[i + 1] = { ...alt[i + 1], acc: alt[i + 1].acc + d };
        return alt.map(noteName).join(' ');
      })),
      (x) => x,
    ).filter((x) => x !== correct && !/𝄪𝄪|𝄫𝄫|♯𝄪|♭𝄫/.test(x));
    const opts = shuffle([correct, ...shuffle(wrongs, ctx.rnd).slice(0, 3)], ctx.rnd).map((x) => ({ value: x, label: x }));
    return choiceQ({
      skill, item: typeId, columns: 1,
      prompt: `Spell ${sym}`,
      options: opts, correct,
      explain: `${sym}: ${chordFormula(typeId)} → ${correct}. ${CHORD_BY_ID[typeId].sound}`,
      after: chordEvents(chordMidis(pc(root), typeId)),
    });
  };
}

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
    return {
      skill, item: typeId,
      prompt: `Play ${sym}`,
      sub: 'Any voicing; root optional for 7th chords and up (rootless is fine). Hold, then release.',
      input: { kind: 'chord' },
      check: (a) => {
        if (a.kind !== 'notes') return { correct: false };
        const got = pcsOf(a.notes);
        const need = required.filter((p) => p !== pc(root) || all.length <= 3);
        const missing = need.filter((p) => !got.has(p));
        const extra = [...got].filter((p) => !all.includes(p));
        return {
          correct: !missing.length && !extra.length,
          message: [missing.length ? `missing ${missing.map((p) => noteName(spell.get(p)!)).join(', ')}` : '', extra.length ? `outside: ${extra.map((p) => pcName(p)).join(', ')}` : ''].filter(Boolean).join(' · ') || undefined,
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
    const spell = new Map(chordNotes(root, typeId).map((n) => [pc(n), n]));
    const name = (p: number) => noteName(spell.get(p) ?? spellPc(p));
    return {
      skill, item: typeId,
      prompt: `Guide tones of ${sym}`,
      sub: 'Play just the 3rd and 7th (any octave, either on top), then release.',
      input: { kind: 'chord' },
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
      show: { keyboard: keysVisual(mids, (m) => noteName(spell.get(mod(m, 12)) ?? root)) },
      options: [{ value: typeId, label: sym }, ...others], correct: typeId,
      audio: chordEvents(mids),
      audioLabel: 'Hear it',
      explain: `${sym}: ${chordFormula(typeId)}.`,
    });
  };
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
