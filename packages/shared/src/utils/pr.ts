import type { Session } from '../types/session.js';

/**
 * Returns true if `weight` is a new personal record for `exerciseId`
 * based on all prior sessions. The current in-progress session is NOT included.
 */
export function checkPR(
  exerciseId: string,
  weight: string,
  history: Session[],
): boolean {
  const newWeight = parseFloat(weight);
  if (isNaN(newWeight) || newWeight <= 0) return false;

  const best = history.reduce((max, session) => {
    const sets = session.logs[exerciseId] ?? [];
    const sessionBest = sets.reduce((m, s) => {
      const w = parseFloat(s.weight);
      return isNaN(w) ? m : Math.max(m, w);
    }, 0);
    return Math.max(max, sessionBest);
  }, 0);

  return newWeight > best;
}
