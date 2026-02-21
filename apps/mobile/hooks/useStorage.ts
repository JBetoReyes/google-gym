import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { INITIAL_ROUTINES } from '@shared/constants/routines';
import { DEFAULT_PREFERENCES } from '@shared/types/user';
import type { Routine } from '@shared/types/routine';
import type { Session } from '@shared/types/session';
import type { Exercise } from '@shared/types/exercise';
import type { UserPreferences } from '@shared/types/user';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const KEYS = {
  ROUTINES: 'gym_routines',
  HISTORY: 'gym_history',
  CUSTOM_EXERCISES: 'gym_custom_exercises',
  WEEKLY_GOAL: 'gym_weekly_goal',
  LANG: 'gym_lang',
  REST_TIMER: 'gym_rest_timer',
  EXERCISE_BTNS: 'gym_exercise_btns',
};

export interface ExerciseButtons {
  routineForm: { video: boolean; image: boolean; anatomy: boolean };
  workoutView: { video: boolean; image: boolean; anatomy: boolean };
}

const DEFAULT_EXERCISE_BUTTONS: ExerciseButtons = {
  routineForm: { video: true, image: false, anatomy: false },
  workoutView: { video: true, image: false, anatomy: false },
};

async function asGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function asSet(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function useStorage() {
  const { user } = useAuth();
  const isAuth = user !== null;

  const getRoutines = useCallback(async (): Promise<Routine[]> => {
    if (isAuth) return api.get<Routine[]>('/routines');
    return asGet(KEYS.ROUTINES, INITIAL_ROUTINES);
  }, [isAuth]);

  const saveRoutine = useCallback(async (r: Routine): Promise<Routine> => {
    if (isAuth) return api.post<Routine>('/routines', r);
    const routines = await asGet<Routine[]>(KEYS.ROUTINES, INITIAL_ROUTINES);
    const idx = routines.findIndex(x => x.id === r.id);
    if (idx >= 0) routines[idx] = r;
    else routines.push(r);
    await asSet(KEYS.ROUTINES, routines);
    return r;
  }, [isAuth]);

  const deleteRoutine = useCallback(async (id: string): Promise<void> => {
    if (isAuth) return api.delete(`/routines/${id}`);
    const routines = await asGet<Routine[]>(KEYS.ROUTINES, []);
    await asSet(KEYS.ROUTINES, routines.filter(r => r.id !== id));
  }, [isAuth]);

  const getSessions = useCallback(async (): Promise<Session[]> => {
    if (isAuth) return api.get<Session[]>('/sessions');
    return asGet(KEYS.HISTORY, []);
  }, [isAuth]);

  const saveSession = useCallback(async (s: Session): Promise<Session> => {
    if (isAuth) return api.post<Session>('/sessions', s);
    const sessions = await asGet<Session[]>(KEYS.HISTORY, []);
    sessions.unshift(s);
    await asSet(KEYS.HISTORY, sessions);
    return s;
  }, [isAuth]);

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    if (isAuth) return api.delete(`/sessions/${id}`);
    const sessions = await asGet<Session[]>(KEYS.HISTORY, []);
    await asSet(KEYS.HISTORY, sessions.filter(s => s.id !== id));
  }, [isAuth]);

  const getCustomExercises = useCallback(async (): Promise<Exercise[]> => {
    if (isAuth) {
      try {
        const exercises = await api.get<Exercise[]>('/exercises');
        // Cache locally so the app works when offline
        await asSet(KEYS.CUSTOM_EXERCISES, exercises);
        return exercises;
      } catch {
        return asGet(KEYS.CUSTOM_EXERCISES, []);
      }
    }
    return asGet(KEYS.CUSTOM_EXERCISES, []);
  }, [isAuth]);

  const saveCustomExercise = useCallback(async (e: Exercise): Promise<Exercise> => {
    if (isAuth) return api.post<Exercise>('/exercises', e);
    const exercises = await asGet<Exercise[]>(KEYS.CUSTOM_EXERCISES, []);
    const idx = exercises.findIndex(x => x.id === e.id);
    if (idx >= 0) exercises[idx] = e;
    else exercises.push(e);
    await asSet(KEYS.CUSTOM_EXERCISES, exercises);
    return e;
  }, [isAuth]);

  const deleteCustomExercise = useCallback(async (id: string): Promise<void> => {
    if (isAuth) return api.delete(`/exercises/${id}`);
    const exercises = await asGet<Exercise[]>(KEYS.CUSTOM_EXERCISES, []);
    await asSet(KEYS.CUSTOM_EXERCISES, exercises.filter(e => e.id !== id));
  }, [isAuth]);

  const getPreferences = useCallback(async (): Promise<UserPreferences> => {
    if (isAuth) return api.get<UserPreferences>('/preferences');
    const goal = await AsyncStorage.getItem(KEYS.WEEKLY_GOAL);
    const lang = await AsyncStorage.getItem(KEYS.LANG);
    const rest = await AsyncStorage.getItem(KEYS.REST_TIMER);
    return {
      ...DEFAULT_PREFERENCES,
      weeklyGoal: goal ? parseInt(goal, 10) : DEFAULT_PREFERENCES.weeklyGoal,
      lang: (lang as UserPreferences['lang']) ?? DEFAULT_PREFERENCES.lang,
      restTimerDefault: rest
        ? (parseInt(rest, 10) as UserPreferences['restTimerDefault'])
        : DEFAULT_PREFERENCES.restTimerDefault,
    };
  }, [isAuth]);

  const savePreferences = useCallback(async (p: Partial<UserPreferences>): Promise<void> => {
    if (isAuth) return api.put('/preferences', p);
    if (p.weeklyGoal !== undefined) await AsyncStorage.setItem(KEYS.WEEKLY_GOAL, String(p.weeklyGoal));
    if (p.lang !== undefined) await AsyncStorage.setItem(KEYS.LANG, p.lang);
    if (p.restTimerDefault !== undefined) await AsyncStorage.setItem(KEYS.REST_TIMER, String(p.restTimerDefault));
  }, [isAuth]);

  const getExerciseButtons = useCallback(async (): Promise<ExerciseButtons> => {
    return asGet(KEYS.EXERCISE_BTNS, DEFAULT_EXERCISE_BUTTONS);
  }, []);

  const saveExerciseButtons = useCallback(async (btns: ExerciseButtons): Promise<void> => {
    await asSet(KEYS.EXERCISE_BTNS, btns);
  }, []);

  const exportData = useCallback(async (): Promise<void> => {
    const [routines, sessions, exercises, prefs] = await Promise.all([
      getRoutines(),
      getSessions(),
      getCustomExercises(),
      getPreferences(),
    ]);
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      routines,
      sessions,
      customExercises: exercises,
      preferences: prefs,
    };
    const json = JSON.stringify(payload, null, 2);
    const file = new File(Paths.cache, 'gymtracker_backup.json');
    file.create({ overwrite: true });
    file.write(json);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export GymTracker Data' });
  }, [getRoutines, getSessions, getCustomExercises, getPreferences]);

  const importData = useCallback(async (): Promise<boolean> => {
    const picked = await File.pickFileAsync(undefined, 'application/json');
    const pickedFile = Array.isArray(picked) ? picked[0] : picked;
    if (!pickedFile) return false;
    const json = await pickedFile.text();
    const data = JSON.parse(json) as Record<string, unknown>;
    if (Array.isArray(data.routines)) await asSet(KEYS.ROUTINES, data.routines);
    if (Array.isArray(data.sessions)) await asSet(KEYS.HISTORY, data.sessions);
    if (Array.isArray(data.customExercises)) await asSet(KEYS.CUSTOM_EXERCISES, data.customExercises);
    if (data.preferences && typeof data.preferences === 'object') {
      const p = data.preferences as Record<string, unknown>;
      if (p.weeklyGoal !== undefined) await AsyncStorage.setItem(KEYS.WEEKLY_GOAL, String(p.weeklyGoal));
      if (typeof p.lang === 'string') await AsyncStorage.setItem(KEYS.LANG, p.lang);
      if (p.restTimerDefault !== undefined) await AsyncStorage.setItem(KEYS.REST_TIMER, String(p.restTimerDefault));
    }
    return true;
  }, []);

  return {
    getRoutines, saveRoutine, deleteRoutine,
    getSessions, saveSession, deleteSession,
    getCustomExercises, saveCustomExercise, deleteCustomExercise,
    getPreferences, savePreferences,
    getExerciseButtons, saveExerciseButtons,
    exportData, importData,
  };
}
