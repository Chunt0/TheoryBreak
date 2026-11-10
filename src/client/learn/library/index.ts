import { LESSONS_BY_TAG } from './lessons';
import { readingMinutes, type Tag, type Topic } from './types';

export const TAG_ORDER: Tag[] = ['core', 'jazz', 'funk', 'soul', 'bach', 'rhythm', 'modular', 'seq', 'fm'];
/** The synth categories: taught on the Synth tab, with demos instead of drills. */
export const SYNTH_TAGS: Tag[] = ['modular', 'seq', 'fm'];

// Every lesson file, with its reading time worked out from what it holds.
const ALL: Topic[] = TAG_ORDER.flatMap((tag) => LESSONS_BY_TAG[tag].map((l) => ({ ...l, minutes: readingMinutes(l) })));
const BY_ID: Record<string, Topic> = Object.fromEntries(ALL.map((t) => [t.id, t]));

/**
 * Each category's lessons in reading order, from first steps to advanced: the order
 * of its list in lessons/<tag>/index.ts. A lesson sits in the path of its first tag;
 * the index and the lesson-to-lesson arrows follow it.
 */
export const PATHS: Record<Tag, string[]> = Object.fromEntries(
  TAG_ORDER.map((tag) => [tag, LESSONS_BY_TAG[tag].map((l) => l.id)]),
) as Record<Tag, string[]>;

/** Every lesson, category by category in path order. */
export const TOPICS: Topic[] = TAG_ORDER.flatMap((tag) => PATHS[tag].map((id) => BY_ID[id]).filter(Boolean));
export const TOPIC_BY_ID: Record<string, Topic> = BY_ID;

/** Where a lesson sits on its category's path: 1-based position, length, and its neighbours. */
export function pathOf(id: string): { tag: Tag; n: number; of: number; prev: Topic | null; next: Topic | null } | null {
  const t = BY_ID[id];
  if (!t) return null;
  const path = PATHS[t.tags[0]];
  const i = path.indexOf(id);
  if (i < 0) return null;
  return { tag: t.tags[0], n: i + 1, of: path.length, prev: BY_ID[path[i - 1]] ?? null, next: BY_ID[path[i + 1]] ?? null };
}

export function topicsForTags(tags: Tag[]): Topic[] {
  return TOPICS.filter((t) => t.tags.some((x) => tags.includes(x)));
}

export type { Topic, Tag, Block, Music, Level } from './types';
export { TAG_NAMES, LEVEL_NAMES, renderMusic, staffFromStrings } from './types';
export const ALL_TOPICS = ALL;
