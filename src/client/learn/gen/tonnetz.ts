// Tonnetz moves: a triad and a move (P, L, R, two in a row, or N S H), name
// the triad it lands on. The wrong answers are where the other moves land.

import { noteName, practical, shuffle, spellPc } from '../../theory/core';
import { applyTriad, closeVoicing, fifthsOf, lettersOf, MOVE_INFO, MOVE_SETS, noteAtFifths, pcOfFifths, triadFifths, triadPcs, voiceLead, type Triad } from '../../theory/tonnetz';
import type { GenContext, NoteEvent, Question } from '../types';
import { choiceQ, randInt } from './helpers';

const ALL = MOVE_SETS.find((m) => m.id === 'all')!.moves;

/** A chord-chart name for a note on the line of fifths: B♯ becomes C, D𝄫 becomes C. */
const chartName = (f: number, flats: boolean): string => noteName(practical(noteAtFifths(f), flats ? 'flat' : 'sharp'));
const name = (t: Triad, flats: boolean): string => chartName(t.root, flats) + (t.minor ? 'm' : '');
const notesOf = (t: Triad, flats: boolean): string[] => triadFifths(t).map((f) => chartName(f, flats));

const block = (notes: number[], start: number, dur: number): NoteEvent[] => notes.map((note) => ({ note, start, dur }));

export function plrQ(skill: string) {
  return (ctx: GenContext): Question => {
    const move = ctx.pickItem(ALL);
    const minor = ctx.rnd() < 0.4;
    const r = randInt(ctx.rnd, 0, 11);
    const root = spellPc(r, minor ? 'sharp' : 'auto');
    const start: Triad = { root: fifthsOf(root), minor };
    const flats = start.root < 0 || (start.root === 0 && !minor);
    const land = applyTriad(start, move);
    const key = (t: Triad) => triadPcs(t).sort((a, b) => a - b).join(',');
    // the other moves' landings, one per distinct triad
    const seen = new Set([key(start), key(land)]);
    const others: Triad[] = [];
    for (const m of ALL) {
      const t = applyTriad(start, m);
      if (seen.has(key(t))) continue;
      seen.add(key(t));
      others.push(t);
    }
    const pickOthers = shuffle(others, ctx.rnd).slice(0, 3);
    const options = [land, ...pickOthers].map((t) => ({ value: key(t), label: name(t, flats) }));

    const a = notesOf(start, flats);
    const b = notesOf(land, flats);
    const pa = triadPcs(start);
    const pb = triadPcs(land);
    const stay = a.filter((_, k) => pb.includes(pa[k]));
    const left = a.filter((_, k) => !pb.includes(pa[k]));
    const came = b.filter((_, k) => !pa.includes(pb[k]));
    const v0 = closeVoicing(pcOfFifths(start.root), minor);
    const v1 = voiceLead(v0, pb);
    const info = MOVE_INFO[move];
    const startName = name(start, flats);
    return choiceQ({
      skill, item: move,
      prompt: `${startName} → ${move} → ?`,
      sub: `${move}: ${info.name.toLowerCase()}. Which triad does it land on?`,
      options, correct: key(land), shuffle: true, rnd: ctx.rnd,
      hint: move.length === 1 && 'PLR'.includes(move)
        ? `${info.what}. Spell ${startName} first, then move only that one note.`
        : `Apply the letters in order (${lettersOf(move).join(' then ')}), one note at a time.`,
      explain: `${startName} (${a.join(' ')}) → ${name(land, flats)} (${b.join(' ')}): ${stay.length ? `${stay.join(' and ')} stay` : 'no note stays'}${left.length ? `, ${left.join(' ')} → ${came.join(' ')}` : ''}. On the Tonnetz that is ${lettersOf(move).length === 1 ? 'one flip across an edge' : `${lettersOf(move).length} flips across edges`}.`,
      audio: block(v0, 0, 1.4),
      audioLabel: `Hear ${startName}`,
      after: [...block(v0, 0, 1.1), ...block(v1, 1.2, 1.6)],
      lesson: 'core.plr',
    });
  };
}
