// Every lesson, one file each, grouped by the category whose path it sits on.
import type { Lesson } from '../types';
import { CORE } from './core';
import { JAZZ } from './jazz';

export const LESSONS: Lesson[] = [...CORE, ...JAZZ];
