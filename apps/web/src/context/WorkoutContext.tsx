import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ActiveWorkout } from '@shared/types/routine';
import { STORAGE_KEYS } from '@shared/utils/storage';

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  setActiveWorkout: (w: ActiveWorkout | null) => void;
}

const WorkoutContext = createContext<WorkoutState | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkoutState] = useState<ActiveWorkout | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      return stored ? (JSON.parse(stored) as ActiveWorkout) : null;
    } catch {
      return null;
    }
  });

  const setActiveWorkout = useCallback((w: ActiveWorkout | null) => {
    setActiveWorkoutState(w);
    if (w === null) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(w));
    }
  }, []);

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
