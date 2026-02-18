import type { Routine } from '../types/routine.js';

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'r1',
    name: 'Full Body',
    exercises: ['sen', 'bp', 'rem', 'pmil', 'cinta'],
  },
  {
    id: 'r2',
    name: 'Cardio & Abs',
    exercises: ['cinta', 'eliptica', 'crunch', 'plank'],
  },
];
