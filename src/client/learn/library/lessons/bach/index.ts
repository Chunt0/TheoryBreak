import type { Lesson } from '../../types';
import { cadences } from './cadences';
import { chorale } from './chorale';
import { chromatic } from './chromatic';
import { counterpoint } from './counterpoint';
import { figured } from './figured';
import { fugue } from './fugue';
import { invention } from './invention';
import { sequences } from './sequences';
import { species } from './species';
import { voiceleading } from './voiceleading';

/** Bach & counterpoint, in reading order. */
export const BACH: Lesson[] = [species, voiceleading, figured, cadences, counterpoint, chorale, sequences, invention, chromatic, fugue];
