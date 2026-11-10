import type { Lesson } from '../../types';
import { algorithms } from './algorithms';
import { basics } from './basics';
import { envelopes } from './envelopes';
import { motion } from './motion';
import { ratios } from './ratios';
import { recipes } from './recipes';
import { scaling } from './scaling';

/** FM synthesis, in reading order. */
export const FM: Lesson[] = [basics, ratios, envelopes, algorithms, scaling, recipes, motion];
