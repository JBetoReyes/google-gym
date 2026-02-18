import type { SetLog } from './routine.js';

export interface Session {
  id: string;
  date: string; // ISO string
  routineName: string;
  duration: number; // minutes
  logs: Record<string, SetLog[]>;
}
