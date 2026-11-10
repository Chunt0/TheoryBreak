// Every lesson, one file each, grouped by the category whose path it sits on.
import type { Lesson } from '../types';
import { BACH } from './bach';
import { CORE } from './core';
import { FUNK } from './funk';
import { JAZZ } from './jazz';
import { MODULAR } from './modular';
import { RHYTHM } from './rhythm';
import { SOUL } from './soul';

export const LESSONS: Lesson[] = [...CORE, ...JAZZ, ...FUNK, ...SOUL, ...BACH, ...RHYTHM, ...MODULAR];
