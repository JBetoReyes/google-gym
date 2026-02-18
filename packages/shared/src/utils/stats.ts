import type { Session } from '../types/session.js';
import type { MuscleGroup, Exercise } from '../types/exercise.js';

export type ChartRange = '1W' | '1M' | '6M' | '1Y';

/** Filter sessions by chart range relative to today */
export function filterByRange(sessions: Session[], range: ChartRange): Session[] {
  const now = new Date();
  const msMap: Record<ChartRange, number> = {
    '1W': 7,
    '1M': 30,
    '6M': 180,
    '1Y': 365,
  };
  const cutoff = new Date(now.getTime() - msMap[range] * 86_400_000);
  return sessions.filter(s => new Date(s.date) >= cutoff);
}

/** Volume per session: Σ(weight × reps), excludes cardio exercises */
export function volumeData(
  sessions: Session[],
  allExercises: Exercise[],
): Array<{ date: string; volume: number }> {
  const cardioIds = new Set(
    allExercises.filter(e => e.muscle === 'Cardio').map(e => e.id),
  );

  return sessions.map(s => ({
    date: s.date,
    volume: Object.entries(s.logs).reduce((total, [exId, sets]) => {
      if (cardioIds.has(exId)) return total;
      return total + sets.reduce((sum, set) => {
        const w = parseFloat(set.weight);
        const r = parseFloat(set.reps);
        return sum + (isNaN(w) || isNaN(r) ? 0 : w * r);
      }, 0);
    }, 0),
  }));
}

/** Sessions per ISO week bucket */
export function frequencyData(
  sessions: Session[],
): Array<{ week: string; count: number }> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const d = new Date(s.date);
    const week = getISOWeek(d);
    map.set(week, (map.get(week) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}

/** Sets per muscle group across all sessions */
export function muscleSplitData(
  sessions: Session[],
  allExercises: Exercise[],
): Array<{ muscle: MuscleGroup; sets: number }> {
  const exMap = new Map(allExercises.map(e => [e.id, e]));
  const counts = new Map<MuscleGroup, number>();

  for (const s of sessions) {
    for (const [exId, sets] of Object.entries(s.logs)) {
      const ex = exMap.get(exId);
      if (!ex) continue;
      counts.set(ex.muscle, (counts.get(ex.muscle) ?? 0) + sets.length);
    }
  }

  return Array.from(counts.entries()).map(([muscle, sets]) => ({ muscle, sets }));
}

/** Consecutive weeks meeting goal (looks back up to 52 weeks) */
export function computeStreak(sessions: Session[], weeklyGoal: number): number {
  const now = new Date();
  let streak = 0;

  for (let i = 0; i < 52; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const uniqueDays = new Set(
      sessions
        .filter(s => {
          const d = new Date(s.date);
          return d >= weekStart && d < weekEnd;
        })
        .map(s => new Date(s.date).toDateString()),
    ).size;

    if (uniqueDays >= weeklyGoal) streak++;
    else if (i > 0) break; // only break streak after first week
  }

  return streak;
}

/** Exercise with most sets across all history */
export function favExercise(sessions: Session[]): string | null {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const [exId, sets] of Object.entries(s.logs)) {
      counts.set(exId, (counts.get(exId) ?? 0) + sets.length);
    }
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
}

/** Average session duration in minutes (excludes zero) */
export function avgDuration(sessions: Session[]): number {
  const nonZero = sessions.filter(s => s.duration > 0);
  if (nonZero.length === 0) return 0;
  return Math.round(
    nonZero.reduce((sum, s) => sum + s.duration, 0) / nonZero.length,
  );
}

// --- helpers ---
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
