/**
 * WorkoutPage — active workout session.
 *
 * ActiveWorkoutView must remain a React.memo module-level component (not
 * defined inside a parent) to preserve stable reference and avoid remounts.
 *
 * TODO: Migrate full ActiveWorkoutView JSX from v1 src/App.jsx.
 * Reference: FEATURES.md §8 Active Workout View
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkout } from '@/context/WorkoutContext';

export default function WorkoutPage() {
  const { activeWorkout } = useWorkout();
  if (!activeWorkout) return <Navigate to="/routines" replace />;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] p-4">
      <p className="text-[var(--text-muted)] text-sm">
        WorkoutPage — migration from App.jsx in progress.
        Active: {activeWorkout.routineName}
      </p>
    </div>
  );
}
