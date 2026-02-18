import type { Routine, ActiveWorkout } from '../types/routine.js';
import type { Session } from '../types/session.js';
import type { Exercise } from '../types/exercise.js';
import type { UserPreferences } from '../types/user.js';

export interface StorageProvider {
  // Routines
  getRoutines(): Promise<Routine[]>;
  saveRoutine(r: Routine): Promise<Routine>;
  deleteRoutine(id: string): Promise<void>;

  // Sessions
  getSessions(): Promise<Session[]>;
  saveSession(s: Session): Promise<Session>;
  deleteSession(id: string): Promise<void>;

  // Custom exercises
  getCustomExercises(): Promise<Exercise[]>;
  saveCustomExercise(e: Exercise): Promise<Exercise>;
  deleteCustomExercise(id: string): Promise<void>;

  // Preferences
  getPreferences(): Promise<UserPreferences>;
  savePreferences(p: Partial<UserPreferences>): Promise<void>;

  // Active workout (in-progress, survives reload)
  getActiveWorkout(): Promise<ActiveWorkout | null>;
  saveActiveWorkout(w: ActiveWorkout | null): Promise<void>;

  /**
   * Migrate anonymous local data to the remote API.
   * Called after a user registers/logs in.
   */
  migrateToRemote(): Promise<void>;
}
