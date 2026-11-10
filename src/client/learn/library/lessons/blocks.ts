// Small builders so a lesson file reads like the lesson: paragraphs,
// headings and side notes without the object noise.
import type { Block, Music } from '../types';

/** one paragraph */
export const p = (md: string): Block => ({ t: 'p', md });
/** a section heading */
export const h = (md: string): Block => ({ t: 'h', md });
/** something to listen for */
export const ear = (md: string): Block => ({ t: 'note', kind: 'ear', md });
/** something to try at the keys */
export const tryIt = (md: string): Block => ({ t: 'note', kind: 'keys', md });
/** where it turns up on records */
export const onRecord = (md: string): Block => ({ t: 'note', kind: 'jazz', md });
/** a note on writing it down or composing with it */
export const writing = (md: string): Block => ({ t: 'note', kind: 'writing', md });
/** the lesson in a few lines, for coming back to */
export const recap = (points: string[]): Block => ({ t: 'note', kind: 'recap', md: points.map((x) => `- ${x}`).join('\n') });
export const table = (head: string[], rows: string[][]): Block => ({ t: 'table', head, rows });
export const example = (title: string, steps: string[], music?: Music): Block => ({ t: 'example', title, steps, music });
export const listen = (items: { label: string; music: Music; note?: string }[]): Block => ({ t: 'listen', items });
export const drill = (skill: string, count = 4): Block => ({ t: 'drill', skill, count });
