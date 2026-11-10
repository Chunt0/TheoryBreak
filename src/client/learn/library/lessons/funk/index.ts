import type { Lesson } from '../../types';
import { funkBass } from './bass';
import { groove } from './groove';
import { funkHarmony } from './harmony';
import { ninth } from './ninth';
import { pentatonic } from './pentatonic';
import { sideslip } from './sideslip';

/** Funk, in reading order. */
export const FUNK: Lesson[] = [groove, ninth, funkHarmony, funkBass, pentatonic, sideslip];
