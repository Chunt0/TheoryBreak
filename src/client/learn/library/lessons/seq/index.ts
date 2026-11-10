import type { Lesson } from '../../types';
import { arp } from './arp';
import { clock } from './clock';
import { drums } from './drums';
import { generative } from './generative';
import { polymeter } from './polymeter';
import { quant } from './quant';
import { step } from './step';

/** Sequencing, in reading order. */
export const SEQ: Lesson[] = [clock, step, quant, drums, polymeter, generative, arp];
