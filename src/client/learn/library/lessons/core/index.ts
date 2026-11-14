import type { Lesson } from '../../types';
import { chordscale } from './chordscale';
import { compass } from './compass';
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
import { plr } from './plr';
import { rootmotion } from './rootmotion';
import { sevenths } from './sevenths';
import { symmetric } from './symmetric';
import { tensions } from './tensions';
import { tonnetz } from './tonnetz';
import { triads } from './triads';

/** Core harmony, in reading order. */
export const CORE: Lesson[] = [intervals, triads, sevenths, keys, degrees, diatonic, minorkeys, modes, compass, fn, rootmotion, tonnetz, tensions, chordscale, cskey, melodic, symmetric, plr, modulation, negative];
