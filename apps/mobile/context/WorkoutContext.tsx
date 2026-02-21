import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActiveWorkout } from '@shared/types/routine';

const WORKOUT_KEY = 'gym_active_workout';

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  setActiveWorkout: (w: ActiveWorkout | null) => void;
}

const WorkoutContext = createContext<WorkoutState | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkoutState] = useState<ActiveWorkout | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WORKOUT_KEY).then(v => {
      if (v) {
        try { setActiveWorkoutState(JSON.parse(v) as ActiveWorkout); } catch { /* ignore */ }
      }
    });
  }, []);

  const setActiveWorkout = (w: ActiveWorkout | null) => {
    setActiveWorkoutState(w);
    if (w) {
      AsyncStorage.setItem(WORKOUT_KEY, JSON.stringify(w)).catch(() => {});
    } else {
      AsyncStorage.removeItem(WORKOUT_KEY).catch(() => {});
    }
  };

  return (
    <WorkoutContext.Provider value={{ activeWorkout, setActiveWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout(): WorkoutState {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used inside <WorkoutProvider>');
  return ctx;
}
