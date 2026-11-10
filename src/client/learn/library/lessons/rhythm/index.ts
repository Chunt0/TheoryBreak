import type { Lesson } from '../../types';
import { clave } from './clave';
import { cross } from './cross';
import { odd } from './odd';
import { subdivision } from './subdivision';
import { swing } from './swing';
import { syncopation } from './syncopation';

/** Rhythm, in reading order. */
export const RHYTHM: Lesson[] = [subdivision, syncopation, swing, clave, odd, cross];
