import type { MuscleGroup } from '../types/exercise.js';

export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  Chest:     '#3b82f6',
  Back:      '#10b981',
  Legs:      '#f59e0b',
  Shoulders: '#8b5cf6',
  Arms:      '#ef4444',
  Abs:       '#06b6d4',
  Cardio:    '#f97316',
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Cardio', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs',
];

export const FRONT_ACTIVE: Record<MuscleGroup, string[]> = {
  Chest:     ['chest-l', 'chest-r'],
  Shoulders: ['sh-l', 'sh-r'],
  Arms:      ['arm-l', 'arm-r', 'fore-l', 'fore-r'],
  Abs:       ['abs'],
  Legs:      ['thigh-l', 'thigh-r', 'calf-l', 'calf-r'],
  Cardio:    ['chest-l', 'chest-r', 'abs', 'thigh-l', 'thigh-r'],
  Back:      [],
};

export const BACK_ACTIVE: Record<MuscleGroup, string[]> = {
  Back:      ['back-l', 'back-r', 'trap-back'],
  Shoulders: ['sh-back-l', 'sh-back-r'],
  Arms:      ['tri-l', 'tri-r', 'fore-back-l', 'fore-back-r'],
  Legs:      ['glute-l', 'glute-r', 'ham-l', 'ham-r', 'calf-back-l', 'calf-back-r'],
  Cardio:    ['back-l', 'back-r', 'glute-l', 'glute-r', 'ham-l', 'ham-r'],
  Chest:     [],
  Abs:       [],
};
