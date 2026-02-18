export interface Routine {
  id: string;
  name: string;
  exercises: string[]; // exercise IDs
}

export interface ActiveWorkout {
  routineId: string;
  routineName: string;
  startTime: string; // ISO string
  logs: Record<string, SetLog[]>;
  extraExercises: string[]; // exercise IDs added mid-workout
}

export interface SetLog {
  weight: string;
  reps: string;
  isPR?: true;
}
