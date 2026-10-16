// Spaced repetition at two levels:
//  • skills (e.g. "interval ear training, level 2") get a review interval in days
//  • items inside a skill (e.g. "m6 ascending") get an accuracy average so the
//    generator keeps serving what you miss.

import type { ItemStat, ProgressData, SkillStat } from './types';

const DAY = 86_400_000;
const EMA_ALPHA = 0.18;

export function emptyProgress(): ProgressData {
  return { skills: {}, items: {}, topics: {}, challenges: {}, sessions: [], daily: {} };
}

export function newSkillStat(now = Date.now()): SkillStat {
  return { n: 0, correct: 0, ema: 0.5, streak: 0, lastSeen: 0, due: now, interval: 0 };
}

/** Mutates `p`: records one answer for a skill + item. */
export function recordAnswer(p: ProgressData, skill: string, item: string, correct: boolean, now = Date.now()): void {
  const s = (p.skills[skill] ??= newSkillStat(now));
  s.n++;
  if (correct) s.correct++;
  s.ema = s.ema + EMA_ALPHA * ((correct ? 1 : 0) - s.ema);
  s.streak = correct ? s.streak + 1 : 0;
  s.lastSeen = now;
  const items = (p.items[skill] ??= {});
  const it: ItemStat = (items[item] ??= { n: 0, ema: 0.5, last: 0 });
  it.n++;
  it.ema = it.ema + 0.3 * ((correct ? 1 : 0) - it.ema);
  it.last = now;
}

/**
 * Mutates `p`: after a practice set, push the skill's next review out
 * (good accuracy) or pull it in (struggling). Classic expanding intervals —
 * but reviewing early (cramming) never grows the interval, and a set of one
 * or two questions only nudges it.
 */
export function scheduleSkill(p: ProgressData, skill: string, attempts: number, correct: number, now = Date.now()): void {
  if (attempts === 0) return;
  const s = (p.skills[skill] ??= newSkillStat(now));
  const acc = correct / attempts;
  const early = s.interval > 0 && now < s.due;
  if (acc >= 0.85) {
    if (s.interval <= 0) s.interval = 1;
    else if (!early) s.interval = Math.min(60, s.interval * (attempts >= 3 ? 2.2 : 1.4));
  } else if (acc >= 0.6) s.interval = Math.max(0.5, early ? s.interval : s.interval * 1.15);
  else s.interval = 0.25;
  s.due = now + s.interval * DAY;
}

/** 0..1 mastery that blends recent accuracy with amount of practice. */
export function mastery(s: SkillStat | undefined): number {
  if (!s || s.n === 0) return 0;
  const volume = Math.min(1, s.n / 25);
  return s.ema * (0.35 + 0.65 * volume);
}

export function masteryLabel(m: number): string {
  if (m >= 0.85) return 'Mastered';
  if (m >= 0.65) return 'Solid';
  if (m >= 0.4) return 'Learning';
  if (m > 0) return 'New';
  return 'Not started';
}

export function isDue(s: SkillStat | undefined, now = Date.now()): boolean {
  return !!s && s.n > 0 && s.due <= now;
}

/** Weighted random pick favouring weak, unseen and long-unseen items. */
export function weightedPick<T extends string>(items: readonly T[], stats: Record<string, ItemStat> | undefined, rnd: () => number, now = Date.now()): T {
  if (items.length === 1) return items[0];
  const weights = items.map((it) => {
    const st = stats?.[it];
    if (!st || st.n === 0) return 2.2;
    const weakness = 1 - st.ema; // 0..1
    const staleness = Math.min(1, (now - st.last) / (3 * DAY));
    return 0.35 + weakness * 2.5 + staleness * 0.6;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export const dayKey = (t = Date.now()): string => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function addPracticeTime(p: ProgressData, seconds: number, now = Date.now()): void {
  const k = dayKey(now);
  p.daily[k] = (p.daily[k] ?? 0) + Math.round(seconds);
}

/** Consecutive days (ending today or yesterday) with at least 3 minutes of practice. */
export function streakDays(p: ProgressData, now = Date.now()): number {
  let streak = 0;
  let t = now;
  if ((p.daily[dayKey(t)] ?? 0) < 180) t -= DAY; // today not done yet doesn't break the streak
  while ((p.daily[dayKey(t)] ?? 0) >= 180) {
    streak++;
    t -= DAY;
  }
  return streak;
}
