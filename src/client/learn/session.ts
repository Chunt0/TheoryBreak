// The 15-minute planner. Ingredients: retrieval practice, spacing, and
// interleaving across your chosen styles — plus one deep-dive topic and one
// applied/creative task. Nothing is locked: unseen drills are introduced
// gradually alongside reviews of what you've already practised.

import { CHALLENGES, type Challenge } from './challenges';
import { TOPICS, type Tag, type Topic } from './library';
import { SKILLS, SKILL_BY_ID } from './skills';
import { isDue, mastery } from './srs';
import type { ProgressData, Skill } from './types';

export type BlockKind = 'ear' | 'gym' | 'topic' | 'groove' | 'apply' | 'practice';

export interface SessionBlock {
  kind: BlockKind;
  title: string;
  why: string;
  seconds: number;
  skills: string[];
  topicId?: string;
  challenge?: Challenge;
}

export interface SessionPlan {
  minutes: number;
  blocks: SessionBlock[];
}

const EAR_TAGS: Record<string, Tag[]> = {
  'ear.chord.ext': ['jazz', 'soul'], 'ear.chord.alt': ['jazz'], 'ear.prog.jazz': ['jazz'], 'ear.prog.subs': ['jazz'],
  'ear.scales.jazz': ['jazz'], 'ear.melody.bebop': ['jazz'], 'ear.prog.soul': ['soul', 'funk'], 'ear.prog.bach': ['bach'],
  'ear.cadence': ['bach', 'core'],
};

/** Which library tags a skill belongs to (for focus filtering). */
export function skillTags(s: Skill): Tag[] {
  if (EAR_TAGS[s.id]) return EAR_TAGS[s.id];
  switch (s.area) {
    case 'jazz': return ['jazz'];
    case 'soul': return ['soul', 'funk'];
    case 'bach': return ['bach'];
    case 'rhythm': return ['rhythm', 'funk'];
    default: return ['core'];
  }
}

function inFocus(s: Skill, focus: Tag[]): boolean {
  const tags = skillTags(s);
  return tags.includes('core') || tags.some((t) => focus.includes(t));
}

/** Priority order: due first, then never-tried, then weakest; recently seen sinks. */
export function rankSkills(p: ProgressData, ids: string[], now = Date.now()): string[] {
  const score = (id: string) => {
    const s = p.skills[id];
    if (!s || s.n === 0) return 0.25;
    const overdue = Math.max(0, (now - s.due) / 86_400_000);
    const recent = now - s.lastSeen < 3_600_000 ? 0.5 : 0;
    return mastery(s) - Math.min(0.6, overdue * 0.15) - (isDue(s, now) ? 0.3 : 0) + recent;
  };
  return [...ids].sort((a, b) => score(a) - score(b));
}

/** Mix two never-seen skills into each pool at most, so new material arrives steadily. */
function pickPool(p: ProgressData, ids: string[], n: number, now: number): string[] {
  const ranked = rankSkills(p, ids, now);
  const out: string[] = [];
  let fresh = 0;
  for (const id of ranked) {
    const unseen = !p.skills[id] || p.skills[id].n === 0;
    if (unseen && fresh >= 2) continue;
    if (unseen) fresh++;
    out.push(id);
    if (out.length >= n) break;
  }
  return out;
}

export function pickTopic(p: ProgressData, focus: Tag[], now = Date.now()): Topic {
  const pool = TOPICS.filter((t) => t.tags.some((x) => focus.includes(x))) ;
  const list = pool.length ? pool : TOPICS;
  const day = Math.floor(now / 86_400_000);
  return [...list].sort((a, b) => {
    const la = p.topics[a.id]?.last ?? 0;
    const lb = p.topics[b.id]?.last ?? 0;
    return la - lb || ((a.id.length * 31 + day) % 7) - ((b.id.length * 31 + day) % 7);
  })[0];
}

export function pickChallenge(p: ProgressData, focus: Tag[], prefer: Tag[], now = Date.now()): Challenge {
  const pool = CHALLENGES.filter((c) => c.tags.some((t) => focus.includes(t)));
  const list = pool.length ? pool : CHALLENGES;
  return [...list].sort((a, b) => {
    const pa = a.tags.some((t) => prefer.includes(t)) ? -1 : 0;
    const pb = b.tags.some((t) => prefer.includes(t)) ? -1 : 0;
    return pa - pb || (p.challenges[a.id]?.last ?? 0) - (p.challenges[b.id]?.last ?? 0);
  })[0];
}

export function planSession(p: ProgressData, minutes: number, focus: Tag[], now = Date.now()): SessionPlan {
  const total = Math.round(minutes * 60);
  const tags = focus.length ? focus : (['core', 'jazz', 'funk', 'soul', 'bach'] as Tag[]);
  const skills = SKILLS.filter((s) => inFocus(s, tags));
  const ear = skills.filter((s) => s.tags.includes('ear') && s.area !== 'rhythm').map((s) => s.id);
  const groove = skills.filter((s) => s.area === 'rhythm').map((s) => s.id);
  const gym = skills.filter((s) => !s.tags.includes('ear') && s.area !== 'rhythm').map((s) => s.id);
  const topic = pickTopic(p, tags, now);
  const blocks: SessionBlock[] = [];

  const short = minutes <= 6;
  const shares = short ? { ear: 0.4, gym: 0.6, topic: 0, apply: 0 } : { ear: 0.22, gym: 0.26, topic: 0.32, apply: 0.2 };

  const day = Math.floor(now / 86_400_000);
  const useGroove = tags.includes('rhythm') || (tags.includes('funk') && day % 3 === 0);
  if (useGroove && groove.length && !short) {
    blocks.push({ kind: 'groove', title: 'Groove', why: 'Time feel first: 16th-note subdivision and syncopation on the pads.', seconds: Math.round(total * shares.ear), skills: pickPool(p, groove, 2, now) });
  } else {
    blocks.push({ kind: 'ear', title: 'Ear warm-up', why: 'Wake up the ear: hear it, name it, before thinking about it.', seconds: Math.round(total * shares.ear), skills: pickPool(p, ear, 3, now) });
  }

  const dueCount = gym.filter((id) => isDue(p.skills[id], now)).length;
  blocks.push({
    kind: 'gym', title: 'Harmony gym',
    why: dueCount ? `${dueCount} drill${dueCount > 1 ? 's are' : ' is'} due — fast retrieval locks them in.` : 'Fast-recall reps, interleaved across your styles.',
    seconds: Math.round(total * shares.gym), skills: pickPool(p, gym, 4, now),
  });

  if (shares.topic) {
    blocks.push({ kind: 'topic', title: topic.title, why: topic.summary, seconds: Math.round(total * shares.topic), skills: topic.drills.filter((d) => SKILL_BY_ID[d]), topicId: topic.id });
  }
  if (shares.apply) {
    const challenge = pickChallenge(p, tags, topic.tags, now);
    blocks.push({ kind: 'apply', title: challenge.title, why: 'Use it: a short musical task in the Lab.', seconds: Math.round(total * shares.apply), skills: [], challenge });
  }

  const used = blocks.reduce((s, b) => s + b.seconds, 0);
  if (used !== total) blocks[blocks.length > 2 ? 2 : blocks.length - 1].seconds += total - used;
  return { minutes, blocks };
}
