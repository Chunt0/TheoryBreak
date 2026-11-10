import type { Lesson } from '../../types';
import { audiorate } from './audiorate';
import { classic } from './classic';
import { env } from './env';
import { filter } from './filter';
import { mod } from './mod';
import { osc } from './osc';
import { poly } from './poly';
import { voltage } from './voltage';
import { westcoast } from './westcoast';

/** Modular synthesis, in reading order. */
export const MODULAR: Lesson[] = [voltage, osc, filter, env, mod, classic, poly, westcoast, audiorate];
