import type { Lesson } from '../../types';
import { chordscale } from './chordscale';
import { cskey } from './cskey';
import { degrees } from './degrees';
import { diatonic } from './diatonic';
import { fn } from './function';
import { intervals } from './intervals';
import { keys } from './keys';
import { melodic } from './melodic';
import { minorkeys } from './minorkeys';
import { modulation } from './modulation';
import { modes } from './modes';
import { negative } from './negative';
import { rootmotion } from './rootmotion';
import { sevenths } from './sevenths';
import { symmetric } from './symmetric';
import { tensions } from './tensions';
import { triads } from './triads';

/** Core harmony, in reading order. */
export const CORE: Lesson[] = [intervals, triads, sevenths, keys, degrees, diatonic, minorkeys, modes, fn, rootmotion, tensions, chordscale, cskey, melodic, symmetric, modulation, negative];
