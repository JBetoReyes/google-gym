# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Stack

- **Vite** + **React 18** (JSX, no TypeScript)
- **Tailwind CSS v3** for styling
- **Recharts** for the volume progress chart
- **Lucide React** for icons

## Architecture

The entire app lives in a single file: `src/App.jsx` (migrated from `init.jsx`).

### State & Persistence
All state is managed with React hooks and persisted to `localStorage` under these keys:
- `gym_routines` — user's routine list
- `gym_history` — completed workout sessions
- `gym_weekly_goal` — integer (1–7)
- `gym_lang` — active language (`es` | `en` | `fr`)

### i18n
`TRANSLATIONS` is a static object at the top of `App.jsx` with keys for `es`, `en`, `fr`. The `t(key)` helper reads from `TRANSLATIONS[lang]`. Exercise names are keyed by exercise ID in `ex_names`, muscle group names in `muscles`.

### Views (tab-based SPA)
Navigation is controlled by `activeTab` state. Views are rendered inline:
- `dashboard` → `DashboardView` — weekly goal ring, stats cards, volume line chart
- `routines` → `RoutinesView` — lists routines; switches to creation form when `isCreating`
- `workout` → `ActiveWorkoutView` — active session logger; only shown when `activeWorkout !== null`
- `history` → `HistoryView` — past sessions list

### Data Model
```js
// Routine
{ id: string, name: string, exercises: string[] }  // exercises = array of exercise IDs

// Session (history entry)
{ id: string, date: ISO string, routineName: string, duration: number (min),
  logs: { [exerciseId]: [{ weight: string, reps: string }] } }
```

### Exercise Catalog
`EXERCISE_CATALOG` is a static array of `{ id, name, muscle }`. Muscle groups: `Cardio`, `Pecho`, `Espalda`, `Pierna`, `Hombro`, `Brazos`, `Abs`. Cardio exercises use `level`/`minutes` labels instead of `weight`/`reps`.

### CSS Animations
Tailwind v3 doesn't include `animate-in` by default. Custom keyframes and animation utilities (`fade-in`, `slide-in-from-*`, `zoom-in`) are defined in `src/index.css`.
