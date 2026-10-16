import { DEGREE_BY_SEMIS, mod, noteName, pcName, pick, shuffle, spellPc } from '../../theory/core';
import { CHORD_BY_ID, chordSymbol } from '../../theory/chords';
import { keyFromName, keyName, type Key } from '../../theory/keys';
import { PROGRESSIONS, PROG_GROUP_NAMES, type ProgGroup } from '../../theory/progressions';
import { SCALE_BY_ID, scaleSemis } from '../../theory/scales';
import { PART } from '../../audio/engine';
import type { GenContext, NoteEvent, Question } from '../types';
import {
  cadenceEvents, chordEvents, chordMidis, ev, eventsEnd, melodyEvents, progressionEvents, progressionInKey, scaleEvents, shiftEvents, tonicMidi,
} from '../music';
import { SOLFEGE, choiceQ, keysVisual, nearOptions, randInt, randomMajorKey, randomMinorKey } from './helpers';

// ---------------------------------------------------------------------------
// Chord quality

export function chordEar(skill: string, types: string[], inversions = false) {
  return (ctx: GenContext): Question => {
    const typeId = ctx.pickItem(types);
    const rootPc = randInt(ctx.rnd, 0, 11);
    let mids = chordMidis(rootPc, typeId);
    if (inversions && ctx.rnd() < 0.6) {
      const upper = mids.slice(1);
      const k = randInt(ctx.rnd, 1, upper.length - 1);
      mids = [upper[k] - 12, ...upper.slice(k), ...upper.slice(0, k).map((m) => m + 12)];
    }
    const audio = [...chordEvents(mids, { dur: 1.8 }), ...chordEvents(mids.slice(1), { arp: true, start: 2.0, dur: 1.2 })];
    const opts = types.map((t) => ({ value: t, label: CHORD_BY_ID[t].name, sub: CHORD_BY_ID[t].symbol || 'triad' }));
    const sym = chordSymbol(spellPc(rootPc), typeId);
    return choiceQ({
      skill, item: typeId,
      prompt: 'Chord quality?',
      sub: 'Block chord, then arpeggiated (root in the bass).',
      options: nearOptions(opts, typeId, 8, ctx.rnd), correct: typeId,
      audio,
      explain: `${CHORD_BY_ID[typeId].name} (${sym}). ${CHORD_BY_ID[typeId].sound}`,
      reveal: { keyboard: keysVisual(mids, (m) => pcName(m)) },
    });
  };
}

// ---------------------------------------------------------------------------
// Scale degrees in context (functional ear training)

const CHROMATIC_LABELS = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'];

export function degreeEar(skill: string, mode: 'diatonic' | 'chromatic' | 'minor') {
  const semisSet = mode === 'chromatic' ? Array.from({ length: 12 }, (_, i) => i) : scaleSemis(mode === 'minor' ? 'minor' : 'major');
  const items = semisSet.map(String);
  return (ctx: GenContext): Question => {
    const semis = Number(ctx.pickItem(items));
    const k: Key = mode === 'minor' ? randomMinorKey(ctx) : randomMajorKey(ctx);
    const cad = cadenceEvents(k, 126);
    const tonic = tonicMidi(k, 57);
    const target = tonic + semis;
    const label = (s: number) => (mode === 'chromatic' ? CHROMATIC_LABELS[s] : DEGREE_BY_SEMIS[s]);
    const audio = [...cad.events, ev(target, cad.duration + 0.45, 1.4, 100)];
    // resolve to the nearest tonic by step through the scale
    const scale = scaleSemis(k.mode === 'minor' ? 'minor' : 'major');
    const below = scale.filter((s) => s <= semis).reverse();
    const above = [...scale.filter((s) => s > semis), 12];
    const path = semis === 0 ? [] : semis <= 6 ? [target, ...below.filter((s) => s < semis).map((s) => tonic + s)] : [target, ...above.map((s) => tonic + s)];
    const opts = semisSet.map((s) => ({ value: String(s), label: label(s), sub: mode === 'chromatic' ? undefined : SOLFEGE[scale.indexOf(s)] }));
    return choiceQ({
      skill, item: String(semis),
      prompt: 'Scale degree of the last note?',
      sub: `${keyName(k)} cadence first. Pads, or play the note.`,
      options: nearOptions(opts, String(semis), 8, ctx.rnd), correct: String(semis),
      columns: mode === 'chromatic' ? 4 : 7,
      audio,
      audioLabel: 'Cadence + note',
      after: path.length ? melodyEvents(path, 0.38) : undefined,
      explain: `Degree ${label(semis)} — ${noteName(spellPc(target))} in ${keyName(k)}. ${semis === 11 ? 'Leading tone: pulls up to 1.' : semis === 5 ? '4 leans down to 3.' : semis === 6 ? '♯4/♭5: the Lydian / blue-note colour.' : semis === 10 ? '♭7: Mixolydian / blues colour.' : semis === 3 && k.mode === 'major' ? '♭3 in major: the blue third.' : ''}`.trim(),
      noteToChoice: (m) => {
        const s = mod(m - tonic, 12);
        return semisSet.includes(s) ? String(s) : null;
      },
      reveal: { keyboard: keysVisual([tonic, target === tonic ? target + 12 : target], (m) => (m === tonic ? '1' : label(semis))) },
    });
  };
}

// ---------------------------------------------------------------------------
// Progressions

export function progressionEar(skill: string, groups: ProgGroup[]) {
  const pool = PROGRESSIONS.filter((p) => groups.includes(p.group));
  return (ctx: GenContext): Question => {
    const id = ctx.pickItem(pool.map((p) => p.id));
    const prog = pool.find((p) => p.id === id)!;
    const ref = keyFromName(prog.key);
    const target: Key = ref.mode === 'major' ? randomMajorKey(ctx) : randomMinorKey(ctx);
    const chords = progressionInKey(prog.chords, prog.key, target);
    const style = prog.group === 'funk' ? 'funk' : prog.group === 'bach' ? 'block' : prog.group === 'soul' ? 'ballad' : 'swing';
    const play = progressionEvents(target, chords, { bpm: prog.group === 'funk' ? 96 : 92, beats: prog.beats ?? (prog.group === 'bach' ? 2 : 4), style });
    const same = shuffle(pool.filter((p) => p.id !== prog.id), ctx.rnd);
    const fill = shuffle(PROGRESSIONS.filter((p) => p.id !== prog.id && !same.includes(p)), ctx.rnd);
    const opts = shuffle([prog, ...[...same, ...fill].slice(0, 3)], ctx.rnd).map((p) => ({ value: p.id, label: p.name, sub: p.numerals.join(' – ') }));
    return choiceQ({
      skill, item: id, columns: 1,
      prompt: 'Which progression?',
      sub: `${groups.map((g) => PROG_GROUP_NAMES[g]).join(' / ')} — listen to the bass and the top voice.`,
      options: opts, correct: id,
      audio: play.events,
      audioLabel: 'Play',
      explain: `${prog.name}: ${prog.numerals.join(' – ')} (${chords.join(' – ')}). ${prog.description}${prog.heardIn.length ? ` Heard in ${prog.heardIn.join(', ')}.` : ''}`,
    });
  };
}

const CADENCES: Record<string, { name: string; key: string; chords: string[]; why: string }> = {
  pac: { name: 'Authentic (V7–I)', key: 'C', chords: ['F', 'G7', 'C'], why: 'Dominant to tonic, root position: the full stop.' },
  plagal: { name: 'Plagal (IV–I)', key: 'C', chords: ['C', 'F', 'C'], why: '"Amen" — subdominant to tonic.' },
  half: { name: 'Half (→ V)', key: 'C', chords: ['C', 'Dm/F', 'G'], why: 'Ends on V: a comma.' },
  phrygian: { name: 'Phrygian half (iv6–V)', key: 'Am', chords: ['Am', 'Dm/F', 'E'], why: 'Minor-key half cadence: bass falls a half step ♭6–5 while the top rises.' },
  deceptive: { name: 'Deceptive (V7–vi)', key: 'C', chords: ['F', 'G7', 'Am'], why: 'V7 resolves to vi: the bass steps up instead of falling a 5th.' },
  picardy: { name: 'Picardy (minor → major I)', key: 'Am', chords: ['Dm', 'E7', 'A'], why: 'Minor key, major final tonic.' },
};

export function cadenceEar(skill: string) {
  const ids = Object.keys(CADENCES);
  return (ctx: GenContext): Question => {
    const id = ctx.pickItem(ids);
    const c = CADENCES[id];
    const ref = keyFromName(c.key);
    const target: Key = ref.mode === 'major' ? randomMajorKey(ctx) : randomMinorKey(ctx);
    const chords = progressionInKey(c.chords, c.key, target);
    const lead = progressionInKey(ref.mode === 'major' ? ['C', 'Am'] : ['Am', 'C/G'], c.key, target);
    const play = progressionEvents(target, [...lead, ...chords], { bpm: 80, beats: 2, style: 'block' });
    return choiceQ({
      skill, item: id, columns: 2,
      prompt: 'Cadence type?',
      options: ids.map((x) => ({ value: x, label: CADENCES[x].name })), correct: id,
      audio: play.events, audioLabel: 'Play phrase',
      explain: `${c.name}: ${chords.join(' – ')}. ${c.why}`,
    });
  };
}

// ---------------------------------------------------------------------------
// Root motion between two chords

const MOTION_LABEL = ['—', 'up ½ step', 'up whole step', 'up m3', 'up M3', 'up 4th (down 5th)', 'tritone', 'down 4th (up 5th)', 'down M3', 'down m3', 'down whole step', 'down ½ step'];

export function rootMotionEar(skill: string) {
  const motions = ['5', '7', '11', '1', '2', '10', '3', '9', '4', '8', '6'];
  const qualities = ['maj7', 'min7', 'dom7', 'dom9', 'min9', 'maj9'];
  return (ctx: GenContext): Question => {
    const m = Number(ctx.pickItem(motions));
    const r1 = randInt(ctx.rnd, 0, 11);
    const r2 = mod(r1 + m, 12);
    const q1 = pick(qualities, ctx.rnd);
    const q2 = pick(qualities, ctx.rnd);
    const a = chordMidis(r1, q1);
    const b = chordMidis(r2, q2, undefined, a.slice(1));
    const audio = [...chordEvents(a, { dur: 1.3 }), ...chordEvents(b, { start: 1.4, dur: 1.5 })];
    const opts = motions.map((x) => ({ value: x, label: MOTION_LABEL[Number(x)] }));
    return choiceQ({
      skill, item: String(m),
      prompt: 'Root (bass) motion?',
      sub: 'Ignore the chord qualities — follow the bass.',
      options: nearOptions(opts, String(m), 8, ctx.rnd), correct: String(m),
      audio, audioLabel: 'Play',
      explain: `${chordSymbol(spellPc(r1), q1)} → ${chordSymbol(spellPc(r2), q2)}: ${MOTION_LABEL[m]}. ${m === 5 ? 'Up a 4th = the strongest functional motion (ii→V→I).' : m === 11 ? 'Down a half step: the tritone-sub resolution (♭II7→I).' : m === 6 ? 'Tritone: V7 → subV7 swap.' : m === 4 || m === 8 ? 'Major-3rd motion: Coltrane / chromatic-mediant territory.' : ''}`.trim(),
    });
  };
}

// ---------------------------------------------------------------------------
// Scales over a drone

export function scaleEar(skill: string, scaleIds: string[]) {
  return (ctx: GenContext): Question => {
    const sid = ctx.pickItem(scaleIds);
    const tonic = randInt(ctx.rnd, 55, 63);
    const run = scaleEvents(tonic, sid, 'updown', 0.22);
    const end = eventsEnd(run);
    const audio: NoteEvent[] = [...run, ev(tonic - 24, 0, end, 70, PART.bass), ev(tonic - 12, 0, end, 60, PART.bass)];
    const opts = scaleIds.map((s) => ({ value: s, label: SCALE_BY_ID[s].name }));
    const s = SCALE_BY_ID[sid];
    return choiceQ({
      skill, item: sid,
      prompt: 'Which scale / mode?',
      sub: 'Played up and down over a root drone.',
      options: nearOptions(opts, sid, 8, ctx.rnd), correct: sid,
      audio,
      explain: `${s.name}: ${s.formula}. ${s.character} ${s.usage}`,
    });
  };
}

// ---------------------------------------------------------------------------
// Melodic dictation with chromatic approach tones

export function melodyEcho(skill: string, length: number, chromatic: boolean) {
  return (ctx: GenContext): Question => {
    const k = randomMajorKey(ctx);
    const tonic = tonicMidi(k, 57);
    const scale = scaleSemis('major');
    const toMidi = (d: number) => tonic + Math.floor(d / 7) * 12 + scale[mod(d, 7)];
    const degs: number[] = [pick([2, 4, 7], ctx.rnd)];
    while (degs.length < length) {
      const prev = degs[degs.length - 1];
      const step = ctx.rnd() < 0.3 ? pick([-2, 2, -3, 3], ctx.rnd) : pick([-1, 1], ctx.rnd);
      degs.push(Math.max(-2, Math.min(9, prev + step)));
    }
    let notes = degs.map(toMidi);
    if (chromatic) {
      // enclose the final target: upper neighbour, lower chromatic neighbour, target
      const target = toMidi(pick([2, 4, 0], ctx.rnd));
      notes = [...notes.slice(0, length - 3), target + 2, target - 1, target];
    }
    const cad = cadenceEvents(k, 132);
    const audio = [...cad.events, ...shiftEvents(melodyEvents(notes, 0.36), cad.duration + 0.45)];
    const target = notes.map((n) => mod(n, 12));
    return {
      skill, item: `${chromatic ? 'chr' : 'dia'}${length}`,
      prompt: `Play back the ${length}-note line`,
      sub: `${keyName(k)}. Starts on ${pcName(notes[0])}.${chromatic ? ' Ends with an enclosure.' : ''}`,
      audio, audioLabel: 'Cadence + line',
      show: { keyboard: keysVisual([notes[0]], () => 'start', () => 'target') },
      input: { kind: 'sequence', length: notes.length, startHint: notes[0] },
      check: (a) => {
        if (a.kind !== 'notes') return { correct: false };
        const right = a.notes.filter((m, i) => mod(m, 12) === target[i]).length;
        return { correct: right === notes.length, score: right / notes.length, message: `${right}/${notes.length}` };
      },
      explain: `${notes.map((n) => pcName(n)).join(' – ')}.${chromatic ? ' The last three notes enclose the target (scale step above, chromatic step below, target) — core bebop vocabulary.' : ''}`,
      reveal: { keyboard: keysVisual(notes, (m) => String(notes.indexOf(m) + 1)) },
      after: melodyEvents(notes, 0.36),
    };
  };
}
