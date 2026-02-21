import { describe, expect, it } from 'vitest';
import {
  avgDuration,
  computeStreak,
  favExercise,
  filterByRange,
  frequencyData,
  muscleSplitData,
  volumeData,
} from '../stats.js';
import type { Session } from '../../types/session.js';
import type { Exercise } from '../../types/exercise.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: Math.random().toString(36).slice(2),
    date: daysAgo(0),
    routineName: 'Push Day',
    duration: 60,
    logs: {},
    ...overrides,
  };
}

const exercises: Exercise[] = [
  { id: 'bench', name: 'Bench Press', muscle: 'Chest' },
  { id: 'squat', name: 'Squat', muscle: 'Legs' },
  { id: 'run',   name: 'Treadmill', muscle: 'Cardio' },
];

// ── filterByRange ─────────────────────────────────────────────────────────────

describe('filterByRange', () => {
  it('returns sessions within 1W', () => {
    const sessions = [
      makeSession({ date: daysAgo(3) }),
      makeSession({ date: daysAgo(8) }),
    ];
    const result = filterByRange(sessions, '1W');
    expect(result).toHaveLength(1);
  });

  it('returns all sessions within 1Y', () => {
    const sessions = [
      makeSession({ date: daysAgo(10) }),
      makeSession({ date: daysAgo(200) }),
      makeSession({ date: daysAgo(400) }),
    ];
    expect(filterByRange(sessions, '1Y')).toHaveLength(2);
  });

  it('returns empty array when no sessions match', () => {
    const sessions = [makeSession({ date: daysAgo(400) })];
    expect(filterByRange(sessions, '1M')).toHaveLength(0);
  });
});

// ── volumeData ────────────────────────────────────────────────────────────────

describe('volumeData', () => {
  it('computes weight × reps for each session', () => {
    const sessions = [
      makeSession({
        date: daysAgo(1),
        logs: {
          bench: [
            { weight: '100', reps: '5' },
            { weight: '100', reps: '5' },
          ],
        },
      }),
    ];
    const result = volumeData(sessions, exercises);
    expect(result[0]?.volume).toBe(1000);
  });

  it('excludes cardio exercises from volume', () => {
    const sessions = [
      makeSession({
        logs: {
          bench: [{ weight: '80', reps: '10' }],
          run:   [{ weight: '10', reps: '30' }], // cardio — excluded
        },
      }),
    ];
    const result = volumeData(sessions, exercises);
    expect(result[0]?.volume).toBe(800);
  });

  it('handles non-numeric weight gracefully', () => {
    const sessions = [
      makeSession({
        logs: { bench: [{ weight: 'BW', reps: '10' }] },
      }),
    ];
    expect(volumeData(sessions, exercises)[0]?.volume).toBe(0);
  });

  it('returns empty array for empty input', () => {
    expect(volumeData([], exercises)).toEqual([]);
  });
});

// ── muscleSplitData ───────────────────────────────────────────────────────────

describe('muscleSplitData', () => {
  it('counts sets per muscle group', () => {
    const sessions = [
      makeSession({
        logs: {
          bench: [{ weight: '100', reps: '5' }, { weight: '100', reps: '5' }],
          squat: [{ weight: '120', reps: '5' }],
        },
      }),
    ];
    const result = muscleSplitData(sessions, exercises);
    const chest = result.find(r => r.muscle === 'Chest');
    const legs  = result.find(r => r.muscle === 'Legs');
    expect(chest?.sets).toBe(2);
    expect(legs?.sets).toBe(1);
  });

  it('returns empty array when no sessions', () => {
    expect(muscleSplitData([], exercises)).toEqual([]);
  });
});

// ── favExercise ───────────────────────────────────────────────────────────────

describe('favExercise', () => {
  it('returns exercise with most total sets', () => {
    const sessions = [
      makeSession({
        logs: {
          bench: [{ weight: '100', reps: '5' }, { weight: '100', reps: '5' }],
          squat: [{ weight: '120', reps: '3' }],
        },
      }),
    ];
    expect(favExercise(sessions)).toBe('bench');
  });

  it('returns null for empty history', () => {
    expect(favExercise([])).toBeNull();
  });
});

// ── avgDuration ───────────────────────────────────────────────────────────────

describe('avgDuration', () => {
  it('computes average of non-zero durations', () => {
    const sessions = [
      makeSession({ duration: 60 }),
      makeSession({ duration: 90 }),
      makeSession({ duration: 0 }),  // excluded
    ];
    expect(avgDuration(sessions)).toBe(75);
  });

  it('returns 0 when all durations are zero', () => {
    expect(avgDuration([makeSession({ duration: 0 })])).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(avgDuration([])).toBe(0);
  });
});

// ── frequencyData ─────────────────────────────────────────────────────────────

describe('frequencyData', () => {
  it('groups sessions by ISO week', () => {
    const sessions = [
      makeSession({ date: daysAgo(1) }),
      makeSession({ date: daysAgo(2) }),
      makeSession({ date: daysAgo(10) }),
    ];
    const result = frequencyData(sessions);
    const total = result.reduce((s, r) => s + r.count, 0);
    expect(total).toBe(3);
  });

  it('returns empty array for no sessions', () => {
    expect(frequencyData([])).toEqual([]);
  });
});

// ── computeStreak ─────────────────────────────────────────────────────────────

describe('computeStreak', () => {
  it('returns 0 when no sessions', () => {
    expect(computeStreak([], 3)).toBe(0);
  });

  it('counts consecutive weeks meeting goal', () => {
    // 4 sessions this week (goal=3) → streak ≥ 1
    const thisWeekSessions = [0, 1, 2, 3].map(d => makeSession({ date: daysAgo(d) }));
    expect(computeStreak(thisWeekSessions, 3)).toBeGreaterThanOrEqual(1);
  });
});
