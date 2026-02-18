import type { ExerciseButtons } from './exercise.js';
import type { ThemeId } from './theme.js';

export type UserPlan = 'free' | 'premium';

export type Lang = 'es' | 'en' | 'fr';

export interface UserPreferences {
  weeklyGoal: number; // 1–7
  lang: Lang;
  restTimerDefault: 60 | 90 | 120 | 180;
  exerciseButtons: ExerciseButtons;
  /** Premium feature: selected app theme. Free users are locked to 'dark'. */
  theme: ThemeId;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  weeklyGoal: 4,
  lang: 'es',
  restTimerDefault: 90,
  theme: 'dark',
  exerciseButtons: {
    routineForm: { video: true, image: false, anatomy: false },
    workoutView: { video: true, image: false, anatomy: false },
  },
};

export interface Profile {
  id: string;
  email?: string;
  plan: UserPlan;
}
