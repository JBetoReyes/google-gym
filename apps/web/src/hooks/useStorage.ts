/**
 * useStorage — abstraction over localStorage (anonymous) vs API (authenticated).
 *
 * When the user is anonymous, all reads/writes go to localStorage using the
 * same keys as v1 (backwards-compatible).
 *
 * When the user is authenticated, reads/writes go to the FastAPI backend.
 *
 * The switch happens automatically when `user` from AuthContext changes.
 */
import { useCallback } from 'react';
import type { Routine } from '@shared/types/routine';
import type { Session } from '@shared/types/session';
import type { Exercise } from '@shared/types/exercise';
import type { UserPreferences } from '@shared/types/user';
import { STORAGE_KEYS } from '@shared/utils/storage';
import { INITIAL_ROUTINES } from '@shared/constants/routines';
import { DEFAULT_PREFERENCES } from '@shared/types/user';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useStorage() {
  const { user } = useAuth();
  const isAuth = user !== null;

  // ── Routines ──────────────────────────────────────────────────────────────
  const getRoutines = useCallback(async (): Promise<Routine[]> => {
    if (isAuth) return api.get<Routine[]>('/routines');
    return lsGet<Routine[]>(STORAGE_KEYS.ROUTINES, INITIAL_ROUTINES);
  }, [isAuth]);

  const saveRoutine = useCallback(async (r: Routine): Promise<Routine> => {
    if (isAuth) {
      // Determine create vs update by trying PUT first
      return api.post<Routine>('/routines', r);
    }
    const routines = lsGet<Routine[]>(STORAGE_KEYS.ROUTINES, []);
    const idx = routines.findIndex(x => x.id === r.id);
    if (idx >= 0) routines[idx] = r;
    else routines.push(r);
    lsSet(STORAGE_KEYS.ROUTINES, routines);
    return r;
  }, [isAuth]);

  const deleteRoutine = useCallback(async (id: string): Promise<void> => {
    if (isAuth) return api.delete(`/routines/${id}`);
    const routines = lsGet<Routine[]>(STORAGE_KEYS.ROUTINES, []);
    lsSet(STORAGE_KEYS.ROUTINES, routines.filter(r => r.id !== id));
  }, [isAuth]);

  // ── Sessions ──────────────────────────────────────────────────────────────
  const getSessions = useCallback(async (): Promise<Session[]> => {
    if (isAuth) return api.get<Session[]>('/sessions');
    return lsGet<Session[]>(STORAGE_KEYS.HISTORY, []);
  }, [isAuth]);

  const saveSession = useCallback(async (s: Session): Promise<Session> => {
    if (isAuth) return api.post<Session>('/sessions', s);
    const sessions = lsGet<Session[]>(STORAGE_KEYS.HISTORY, []);
    sessions.unshift(s);
    lsSet(STORAGE_KEYS.HISTORY, sessions);
    return s;
  }, [isAuth]);

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    if (isAuth) return api.delete(`/sessions/${id}`);
    const sessions = lsGet<Session[]>(STORAGE_KEYS.HISTORY, []);
    lsSet(STORAGE_KEYS.HISTORY, sessions.filter(s => s.id !== id));
  }, [isAuth]);

  // ── Custom exercises ───────────────────────────────────────────────────────
  const getCustomExercises = useCallback(async (): Promise<Exercise[]> => {
    if (isAuth) return api.get<Exercise[]>('/exercises');
    return lsGet<Exercise[]>(STORAGE_KEYS.CUSTOM_EXERCISES, []);
  }, [isAuth]);

  const saveCustomExercise = useCallback(async (e: Exercise): Promise<Exercise> => {
    if (isAuth) return api.post<Exercise>('/exercises', e);
    const exercises = lsGet<Exercise[]>(STORAGE_KEYS.CUSTOM_EXERCISES, []);
    const idx = exercises.findIndex(x => x.id === e.id);
    if (idx >= 0) exercises[idx] = e;
    else exercises.push(e);
    lsSet(STORAGE_KEYS.CUSTOM_EXERCISES, exercises);
    return e;
  }, [isAuth]);

  const deleteCustomExercise = useCallback(async (id: string): Promise<void> => {
    if (isAuth) return api.delete(`/exercises/${id}`);
    const exercises = lsGet<Exercise[]>(STORAGE_KEYS.CUSTOM_EXERCISES, []);
    lsSet(STORAGE_KEYS.CUSTOM_EXERCISES, exercises.filter(e => e.id !== id));
  }, [isAuth]);

  // ── Preferences ───────────────────────────────────────────────────────────
  const getPreferences = useCallback(async (): Promise<UserPreferences> => {
    if (isAuth) return api.get<UserPreferences>('/preferences');
    const stored = lsGet<Partial<UserPreferences>>(STORAGE_KEYS.WEEKLY_GOAL, {});
    return {
      ...DEFAULT_PREFERENCES,
      weeklyGoal: (localStorage.getItem(STORAGE_KEYS.WEEKLY_GOAL)
        ? parseInt(localStorage.getItem(STORAGE_KEYS.WEEKLY_GOAL)!, 10)
        : DEFAULT_PREFERENCES.weeklyGoal),
      lang: (localStorage.getItem(STORAGE_KEYS.LANG) as UserPreferences['lang']) ?? DEFAULT_PREFERENCES.lang,
      restTimerDefault: (localStorage.getItem(STORAGE_KEYS.REST_TIMER)
        ? parseInt(localStorage.getItem(STORAGE_KEYS.REST_TIMER)!, 10) as UserPreferences['restTimerDefault']
        : DEFAULT_PREFERENCES.restTimerDefault),
      exerciseButtons: lsGet(STORAGE_KEYS.EXERCISE_BUTTONS, DEFAULT_PREFERENCES.exerciseButtons),
    };
  }, [isAuth]);

  const savePreferences = useCallback(async (p: Partial<UserPreferences>): Promise<void> => {
    if (isAuth) return api.put('/preferences', p);
    if (p.weeklyGoal !== undefined) lsSet(STORAGE_KEYS.WEEKLY_GOAL, p.weeklyGoal);
    if (p.lang !== undefined) lsSet(STORAGE_KEYS.LANG, p.lang);
    if (p.restTimerDefault !== undefined) lsSet(STORAGE_KEYS.REST_TIMER, p.restTimerDefault);
    if (p.exerciseButtons !== undefined) lsSet(STORAGE_KEYS.EXERCISE_BUTTONS, p.exerciseButtons);
    if (p.theme !== undefined) localStorage.setItem('gym_theme', p.theme);
  }, [isAuth]);

  // ── Migration (anon → registered) ─────────────────────────────────────────
  const migrateToRemote = useCallback(async (): Promise<void> => {
    const routines  = lsGet<Routine[]>(STORAGE_KEYS.ROUTINES, []);
    const sessions  = lsGet<Session[]>(STORAGE_KEYS.HISTORY, []);
    const exercises = lsGet<Exercise[]>(STORAGE_KEYS.CUSTOM_EXERCISES, []);
    const prefs     = await getPreferences();

    await api.post('/auth/migrate', {
      routines,
      sessions,
      custom_exercises: exercises,
      preferences: prefs,
    });

    // Clear local storage after successful migration
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }, [getPreferences]);

  return {
    getRoutines, saveRoutine, deleteRoutine,
    getSessions, saveSession, deleteSession,
    getCustomExercises, saveCustomExercise, deleteCustomExercise,
    getPreferences, savePreferences,
    migrateToRemote,
  };
}
