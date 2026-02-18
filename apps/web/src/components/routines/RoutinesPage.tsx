/**
 * RoutinesPage — list, create, edit routines.
 *
 * Premium gate: routine creation blocked at free_routine_limit.
 *
 * TODO: Migrate full RoutinesView + RoutineCreationForm JSX from v1 src/App.jsx.
 * Reference: FEATURES.md §6 Routines View, §7 Routine Builder Form
 */
import React from 'react';

interface Props {
  formMode?: 'new' | 'edit';
}

export default function RoutinesPage({ formMode }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] p-4">
      <p className="text-[var(--text-muted)] text-sm">
        RoutinesPage — migration from App.jsx in progress. formMode={formMode ?? 'list'}
      </p>
    </div>
  );
}
