import { describe, expect, test } from 'bun:test';
import { SKILLS, SKILL_BY_ID } from '../src/client/learn/skills';
import { ALL_TOPICS, PATHS, TAG_ORDER, TOPICS, TOPIC_BY_ID, pathOf, renderMusic } from '../src/client/learn/library';
import { CONCEPTS, CONCEPT_HELP } from '../src/client/learn/gen/concepts';
import { CHALLENGES } from '../src/client/learn/challenges';
import { planSession, rankSkills } from '../src/client/learn/session';
import { emptyProgress, recordAnswer, scheduleSkill, weightedPick } from '../src/client/learn/srs';
import { keyFromName } from '../src/client/theory/keys';
import { N, pc } from '../src/client/theory/core';
import { parsePitch, progressionEvents, resolveChord } from '../src/client/learn/music';
import { PROGRESSIONS } from '../src/client/theory/progressions';
import type { GenContext } from '../src/client/learn/types';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const ctxFor = (seed: number): GenContext => {
  const rnd = seeded(seed);
  return { rnd, pickItem: (items) => weightedPick(items, undefined, rnd) };
};

describe('library', () => {
  test('topics have unique ids, valid drills and renderable music', () => {
    const ids = new Set<string>();
    for (const t of TOPICS) {
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);
      for (const d of t.drills) expect(SKILL_BY_ID[d]).toBeDefined();
      for (const b of t.blocks) {
        if (b.t === 'drill') expect(SKILL_BY_ID[b.skill]).toBeDefined();
        if (b.t === 'listen') for (const it of b.items) expect(renderMusic(it.music).length).toBeGreaterThan(0);
        if (b.t === 'example') {
          expect(b.steps.length).toBeGreaterThanOrEqual(2);
          if (b.music) expect(renderMusic(b.music).length).toBeGreaterThan(0);
        }
        if (b.t === 'prog') {
          const k = keyFromName(b.key);
          for (const tok of b.tokens) expect(resolveChord(tok, k)).not.toBeNull();
        }
      }
    }
    expect(TOPICS.length).toBeGreaterThanOrEqual(25);
  });

  test('each category is a path from basics to advanced, and every lesson is on its own', () => {
    const onPath = TAG_ORDER.flatMap((tag) => PATHS[tag]);
    expect(new Set(onPath).size).toBe(onPath.length);
    expect(TOPICS.length).toBe(ALL_TOPICS.length);
    for (const t of ALL_TOPICS) expect(PATHS[t.tags[0]]).toContain(t.id);
    for (const tag of TAG_ORDER) {
      const levels = PATHS[tag].map((id) => TOPIC_BY_ID[id].level);
      expect(levels).toEqual([...levels].sort());
      expect(new Set(levels)).toEqual(new Set([1, 2, 3]));
      expect(levels.length).toBeGreaterThanOrEqual(6);
    }
    const w = pathOf('jazz.tritone')!;
    expect(w.tag).toBe('jazz');
    expect(w.prev!.id).toBe('jazz.secondary');
    expect(w.next!.id).toBe('jazz.backdoor');
    expect(pathOf('core.intervals')!.prev).toBeNull();
  });

  test('every written pitch in a lesson parses', () => {
    const pitches = (m: any): string[] => ('notes' in m ? m.notes : 'voicings' in m ? m.voicings.flat() : 'from' in m ? [m.from] : []);
    for (const t of TOPICS) {
      for (const b of t.blocks) {
        const all = b.t === 'keys' ? b.notes
          : b.t === 'staff' ? b.chords.flatMap((c) => c.notes)
          : b.t === 'listen' ? b.items.flatMap((it) => pitches(it.music))
          : b.t === 'example' && b.music ? pitches(b.music) : [];
        for (const p of all) expect(parsePitch(p), `${t.id}: ${p}`).not.toBeNull();
        if (b.t === 'keys' && b.labels) expect(b.labels).toHaveLength(b.notes.length);
      }
    }
  });

  test('every topic reads as a lesson: explanation, a worked example, and drills', () => {
    for (const t of TOPICS) {
      expect(t.blocks.some((b) => b.t === 'example')).toBe(true);
      expect(t.blocks.some((b) => b.t === 'p' || b.t === 'table')).toBe(true);
      expect(t.drills.length).toBeGreaterThan(0);
    }
  });

  test('every drill has a lesson that teaches it and a method', () => {
    const taught = new Set(TOPICS.flatMap((t) => t.drills));
    for (const sk of SKILLS) {
      expect(TOPIC_BY_ID[sk.lesson]).toBeDefined();
      expect(sk.method.length).toBeGreaterThanOrEqual(2);
      expect(taught.has(sk.id)).toBe(true);
    }
    for (const c of CONCEPTS) expect(TOPIC_BY_ID[CONCEPT_HELP[c.id]?.[0]]).toBeDefined();
  });

  test('challenges and progressions resolve', () => {
    for (const c of CHALLENGES) for (const tok of c.tokens) expect(resolveChord(tok, keyFromName(c.key))).not.toBeNull();
    for (const p of PROGRESSIONS) {
      expect(p.chords.length).toBe(p.numerals.length);
      for (const ch of p.chords) expect(resolveChord(ch, keyFromName(p.key))).not.toBeNull();
      const play = progressionEvents(p.key, p.chords, { style: 'swing', beats: 4 });
      expect(play.events.every((e) => e.note > 20 && e.note < 110)).toBe(true);
    }
  });
});

describe('generators', () => {
  for (const skill of SKILLS) {
    test(`${skill.id} generates valid questions`, () => {
      for (let i = 0; i < 40; i++) {
        const q = skill.gen(ctxFor(i * 7919 + skill.id.length * 13));
        expect(q.skill).toBe(skill.id);
        expect(q.prompt.length).toBeGreaterThan(2);
        expect(q.explain.length).toBeGreaterThan(3);
        for (const e of [...(q.audio ?? []), ...(q.after ?? [])]) {
          expect(Number.isFinite(e.note) && e.note > 0 && e.note < 128).toBe(true);
          expect(e.start).toBeGreaterThanOrEqual(0);
        }
        if (q.input.kind === 'choice') {
          const values = q.input.options.map((o) => o.value);
          expect(new Set(values).size).toBe(values.length);
          const right = values.filter((v) => q.check({ kind: 'choice', value: v }).correct);
          expect(right.length).toBe(1);
          expect(values.length).toBeGreaterThanOrEqual(2);
          expect(values.length).toBeLessThanOrEqual(8);
          for (const o of q.input.options) expect(o.label).not.toMatch(/undefined|NaN/);
          // compare playback must work for every option, not just the right one
          if (q.optionAudio) {
            for (const v of values) {
              const evs = q.optionAudio(v);
              expect(evs.length).toBeGreaterThan(0);
              for (const e of evs) expect(Number.isFinite(e.note) && e.note > 0 && e.note < 128 && e.start >= 0).toBe(true);
            }
          }
        }
        if (q.labelPc) for (let p = 0; p < 12; p++) expect(q.labelPc(p)).toMatch(/^[A-G](♯|♭|𝄪|𝄫)?$/);
        // the ? panel: a hint that stops short of the answer, playable aids, a real lesson
        expect(q.hint && q.hint.length > 10).toBe(true);
        if (q.lesson) expect(TOPIC_BY_ID[q.lesson]).toBeDefined();
        for (const e of q.hintAudio?.events ?? []) expect(Number.isFinite(e.note) && e.note > 0 && e.note < 128 && e.start >= 0).toBe(true);
        if (q.input.kind === 'choice') {
          const right = q.input.options.find((o) => q.check({ kind: 'choice', value: o.value }).correct)!.label;
          if (right.length >= 3) expect(q.hint!.includes(right)).toBe(false);
        }
        // two options naming the same sound under different spellings would make two answers right
        // (spelling drills excepted: there the misspelling is the decoy)
        if (q.input.kind === 'choice' && !/spell/.test(skill.id)) {
          const seen = new Map<string, string>();
          for (const o of q.input.options) {
            const m = /^([A-G](?:♯|♭)?)(.*)$/.exec(o.label);
            if (!m) continue;
            const key = `${pc(N(m[1].replace('♯', '#').replace('♭', 'b')))}|${m[2]}`;
            expect(seen.get(key) ?? o.label).toBe(o.label);
            seen.set(key, o.label);
          }
        }
      }
    });
  }
});

describe('planner', () => {
  test('fresh learner gets a full 15-minute session with four blocks', () => {
    const plan = planSession(emptyProgress(), 15, ['core', 'jazz', 'funk', 'soul', 'bach']);
    expect(plan.blocks.map((b) => (b.kind === 'groove' ? 'ear' : b.kind))).toEqual(['ear', 'gym', 'topic', 'apply']);
    expect(plan.blocks.reduce((s, b) => s + b.seconds, 0)).toBe(900);
    for (const b of plan.blocks) for (const s of b.skills) expect(SKILL_BY_ID[s]).toBeDefined();
  });

  test('due skills are reviewed first and focus is respected', () => {
    const p = emptyProgress();
    const now = Date.now();
    for (let i = 0; i < 10; i++) recordAnswer(p, 'jazz.tritone', 'x', i % 2 === 0, now - 5 * 86_400_000);
    scheduleSkill(p, 'jazz.tritone', 10, 5, now - 5 * 86_400_000);
    const plan = planSession(p, 15, ['jazz'], now);
    const gym = plan.blocks.find((b) => b.kind === 'gym')!;
    expect(gym.skills[0]).toBe('jazz.tritone');
    const bachOnly = planSession(emptyProgress(), 15, ['bach'], now);
    // the topic rotates by day; whichever it is, it carries the focus tag
    expect(TOPIC_BY_ID[bachOnly.blocks.find((b) => b.kind === 'topic')!.topicId!].tags).toContain('bach');
  });

  test('cramming a skill early does not stretch its review interval', () => {
    const p = emptyProgress();
    const day = 86_400_000;
    const t0 = Date.now();
    scheduleSkill(p, 'jazz.tritone', 8, 8, t0);
    expect(p.skills['jazz.tritone'].interval).toBe(1);
    for (let i = 1; i <= 5; i++) scheduleSkill(p, 'jazz.tritone', 8, 8, t0 + i * 60_000);
    expect(p.skills['jazz.tritone'].interval).toBe(1);
    scheduleSkill(p, 'jazz.tritone', 8, 8, t0 + 2 * day);
    expect(p.skills['jazz.tritone'].interval).toBeCloseTo(2.2);
    scheduleSkill(p, 'jazz.tritone', 1, 1, t0 + 6 * day);
    expect(p.skills['jazz.tritone'].interval).toBeCloseTo(2.2 * 1.4);
    scheduleSkill(p, 'jazz.tritone', 6, 2, t0 + 6 * day + 1000);
    expect(p.skills['jazz.tritone'].interval).toBe(0.25);
  });

  test('new skills rotate from day to day but stay put within a day', () => {
    const ids = SKILLS.filter((s) => s.area === 'ear').map((s) => s.id);
    const day = 86_400_000;
    const t = Date.UTC(2026, 9, 16, 9);
    expect(rankSkills(emptyProgress(), ids, t)).toEqual(rankSkills(emptyProgress(), ids, t + 3_600_000));
    const firsts = new Set(Array.from({ length: 7 }, (_, d) => rankSkills(emptyProgress(), ids, t + d * day)[0]));
    expect(firsts.size).toBeGreaterThan(2);
  });

  test('weightedPick favours weak items', () => {
    const rnd = seeded(42);
    const stats = { a: { n: 20, ema: 0.95, last: Date.now() }, b: { n: 20, ema: 0.2, last: Date.now() } };
    let b = 0;
    for (let i = 0; i < 1000; i++) if (weightedPick(['a', 'b'], stats, rnd) === 'b') b++;
    expect(b).toBeGreaterThan(650);
  });
});
