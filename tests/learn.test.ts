import { describe, expect, test } from 'bun:test';
import { SKILLS, SKILL_BY_ID } from '../src/client/learn/skills';
import { TOPICS, renderMusic } from '../src/client/learn/library';
import { CHALLENGES } from '../src/client/learn/challenges';
import { planSession } from '../src/client/learn/session';
import { emptyProgress, recordAnswer, scheduleSkill, weightedPick } from '../src/client/learn/srs';
import { keyFromName } from '../src/client/theory/keys';
import { progressionEvents, resolveChord } from '../src/client/learn/music';
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
        if (b.t === 'prog') {
          const k = keyFromName(b.key);
          for (const tok of b.tokens) expect(resolveChord(tok, k)).not.toBeNull();
        }
      }
    }
    expect(TOPICS.length).toBeGreaterThanOrEqual(25);
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
    expect(bachOnly.blocks.find((b) => b.kind === 'topic')!.topicId!.startsWith('bach') || bachOnly.blocks.find((b) => b.kind === 'topic')!.topicId === 'core.symmetric').toBe(true);
  });

  test('weightedPick favours weak items', () => {
    const rnd = seeded(42);
    const stats = { a: { n: 20, ema: 0.95, last: Date.now() }, b: { n: 20, ema: 0.2, last: Date.now() } };
    let b = 0;
    for (let i = 0; i < 1000; i++) if (weightedPick(['a', 'b'], stats, rnd) === 'b') b++;
    expect(b).toBeGreaterThan(650);
  });
});
