import { FOUNDATION_TOPICS } from './topics-foundations';
import { CORE_JAZZ_TOPICS } from './topics-core-jazz';
import { SOUL_BACH_TOPICS } from './topics-soul-bach';
import { MORE_TOPICS } from './topics-more';
import { MODULAR_TOPICS } from './topics-modular';
import { SEQ_TOPICS } from './topics-seq';
import { FM_TOPICS } from './topics-fm';
import type { Tag, Topic } from './types';

const ALL: Topic[] = [...FOUNDATION_TOPICS, ...CORE_JAZZ_TOPICS, ...SOUL_BACH_TOPICS, ...MORE_TOPICS, ...MODULAR_TOPICS, ...SEQ_TOPICS, ...FM_TOPICS];
const BY_ID: Record<string, Topic> = Object.fromEntries(ALL.map((t) => [t.id, t]));

export const TAG_ORDER: Tag[] = ['core', 'jazz', 'funk', 'soul', 'bach', 'rhythm', 'modular', 'seq', 'fm'];
/** The synth categories: taught on the Synth tab, with demos instead of drills. */
export const SYNTH_TAGS: Tag[] = ['modular', 'seq', 'fm'];

/**
 * Each category's lessons in reading order, from first steps to advanced. A lesson
 * sits in the path of its first tag; the index and the lesson-to-lesson arrows follow it.
 */
export const PATHS: Record<Tag, string[]> = {
  core: [
    'core.intervals', 'core.triads', 'core.sevenths', 'core.keys', 'core.degrees', 'core.diatonic',
    'core.minorkeys', 'core.modes', 'core.function', 'core.rootmotion', 'core.tensions', 'core.chordscale',
    'core.melodic', 'core.symmetric', 'core.modulation', 'core.negative',
  ],
  jazz: [
    'jazz.forms', 'jazz.iivi', 'jazz.voicings', 'jazz.minor', 'jazz.turnarounds',
    'jazz.secondary', 'jazz.tritone', 'jazz.backdoor', 'jazz.blues', 'jazz.rhythm', 'jazz.modal', 'jazz.bebop',
    'jazz.alt', 'jazz.ust', 'jazz.hybrid', 'jazz.coltrane', 'jazz.reharm',
  ],
  funk: ['funk.groove', 'funk.ninth', 'funk.harmony', 'funk.bass', 'funk.pentatonic', 'funk.sideslip'],
  soul: ['soul.colours', 'soul.neo', 'soul.gospel', 'soul.voicings', 'soul.backcycle', 'soul.reharm'],
  bach: [
    'bach.species', 'bach.voiceleading', 'bach.figured', 'bach.cadences',
    'bach.counterpoint', 'bach.chorale', 'bach.sequences', 'bach.invention',
    'bach.chromatic', 'bach.fugue',
  ],
  rhythm: ['rhythm.subdivision', 'rhythm.syncopation', 'rhythm.swing', 'rhythm.clave', 'rhythm.odd', 'rhythm.cross'],
  modular: [
    'modular.voltage', 'modular.osc', 'modular.filter', 'modular.env',
    'modular.mod', 'modular.classic', 'modular.poly',
    'modular.westcoast', 'modular.audiorate',
  ],
  seq: ['seq.clock', 'seq.step', 'seq.quant', 'seq.drums', 'seq.polymeter', 'seq.generative', 'seq.arp'],
  fm: ['fm.basics', 'fm.ratios', 'fm.envelopes', 'fm.algorithms', 'fm.scaling', 'fm.recipes', 'fm.motion'],
};

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
