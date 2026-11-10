import type { Lesson } from '../../types';
import { alt } from './alt';
import { backdoor } from './backdoor';
import { bebop } from './bebop';
import { blues } from './blues';
import { coltrane } from './coltrane';
import { forms } from './forms';
import { hybrid } from './hybrid';
import { iivi } from './iivi';
import { minor } from './minor';
import { modal } from './modal';
import { reharm } from './reharm';
import { rhythmChanges } from './rhythm';
import { secondary } from './secondary';
import { tritone } from './tritone';
import { turnarounds } from './turnarounds';
import { ust } from './ust';
import { voicings } from './voicings';

/** Jazz, in reading order. */
export const JAZZ: Lesson[] = [forms, iivi, voicings, minor, turnarounds, secondary, tritone, backdoor, blues, rhythmChanges, modal, bebop, alt, ust, hybrid, coltrane, reharm];
