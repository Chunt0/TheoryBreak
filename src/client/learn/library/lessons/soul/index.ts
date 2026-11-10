import type { Lesson } from '../../types';
import { backcycle } from './backcycle';
import { colours } from './colours';
import { gospel } from './gospel';
import { neo } from './neo';
import { soulReharm } from './reharm';
import { soulVoicings } from './voicings';

/** R&B / gospel, in reading order. */
export const SOUL: Lesson[] = [colours, neo, gospel, soulVoicings, backcycle, soulReharm];
