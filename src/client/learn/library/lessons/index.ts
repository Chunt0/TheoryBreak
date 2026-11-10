// Every lesson, one file each, grouped by the category whose path it sits on.
// Each category's list is its path: reading order, first steps to advanced.
import type { Lesson, Tag } from '../types';
import { BACH } from './bach';
import { CORE } from './core';
import { FM } from './fm';
import { FUNK } from './funk';
import { JAZZ } from './jazz';
import { MODULAR } from './modular';
import { RHYTHM } from './rhythm';
import { SEQ } from './seq';
import { SOUL } from './soul';

export const LESSONS_BY_TAG: Record<Tag, Lesson[]> = {
  core: CORE,
  jazz: JAZZ,
  funk: FUNK,
  soul: SOUL,
  bach: BACH,
  rhythm: RHYTHM,
  modular: MODULAR,
  seq: SEQ,
  fm: FM,
};
