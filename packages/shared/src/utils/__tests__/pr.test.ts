import { describe, expect, it } from 'vitest';
import { checkPR } from '../pr.js';
import type { Session } from '../../types/session.js';

function makeSession(logs: Session['logs']): Session {
  return {
    id: Math.random().toString(36).slice(2),
    date: new Date().toISOString(),
    routineName: 'Test',
    duration: 45,
    logs,
  };
}

describe('checkPR', () => {
  it('returns true when weight exceeds all-time best', () => {
    const history = [makeSession({ bench: [{ weight: '100', reps: '5' }] })];
    expect(checkPR('bench', '105', history)).toBe(true);
  });

  it('returns false when weight equals previous best', () => {
    const history = [makeSession({ bench: [{ weight: '100', reps: '5' }] })];
    expect(checkPR('bench', '100', history)).toBe(false);
  });

  it('returns false when weight is below previous best', () => {
    const history = [makeSession({ bench: [{ weight: '100', reps: '5' }] })];
    expect(checkPR('bench', '90', history)).toBe(false);
  });

  it('returns true when there is no prior history for the exercise', () => {
    const history = [makeSession({ squat: [{ weight: '100', reps: '5' }] })];
    expect(checkPR('bench', '60', history)).toBe(true);
  });

  it('returns false for non-numeric weight', () => {
    expect(checkPR('bench', 'BW', [])).toBe(false);
  });

  it('returns false for zero weight', () => {
    expect(checkPR('bench', '0', [])).toBe(false);
  });

  it('returns false for empty history with zero weight', () => {
    expect(checkPR('bench', '0', [])).toBe(false);
  });

  it('finds PR against best set across multiple sessions', () => {
    const history = [
      makeSession({ bench: [{ weight: '80', reps: '5' }] }),
      makeSession({ bench: [{ weight: '100', reps: '3' }] }),
      makeSession({ bench: [{ weight: '95', reps: '5' }] }),
    ];
    expect(checkPR('bench', '101', history)).toBe(true);
    expect(checkPR('bench', '100', history)).toBe(false);
  });
});
