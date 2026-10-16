import { FOUNDATION_TOPICS } from './topics-foundations';
import { CORE_JAZZ_TOPICS } from './topics-core-jazz';
import { SOUL_BACH_TOPICS } from './topics-soul-bach';
import type { Tag, Topic } from './types';

export const TOPICS: Topic[] = [...FOUNDATION_TOPICS, ...CORE_JAZZ_TOPICS, ...SOUL_BACH_TOPICS];

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export function topicsForTags(tags: Tag[]): Topic[] {
  return TOPICS.filter((t) => t.tags.some((x) => tags.includes(x)));
}

export type { Topic, Tag, Block, Music } from './types';
export { TAG_NAMES, renderMusic, staffFromStrings } from './types';
