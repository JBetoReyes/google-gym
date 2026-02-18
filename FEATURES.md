# GymTracker — Feature Reference

> **Purpose:** This document captures every feature, UX behavior, and implementation detail of the app as a refactor-safety reference. Before any refactor, read this file; after the refactor, verify every point still holds.

---

## Table of Contents
1. [Tech Stack](#1-tech-stack)
2. [Data Model & Persistence](#2-data-model--persistence)
3. [Internationalization](#3-internationalization)
4. [Navigation](#4-navigation)
5. [Dashboard View](#5-dashboard-view)
6. [Routines View](#6-routines-view)
7. [Routine Builder Form](#7-routine-builder-form)
8. [Active Workout View](#8-active-workout-view)
9. [History View](#9-history-view)
10. [Settings Modal](#10-settings-modal)
11. [Anatomy Modal](#11-anatomy-modal)
12. [QR Share & Import](#12-qr-share--import)
13. [Exercise System](#13-exercise-system)
14. [Achievement System](#14-achievement-system)
15. [Analytics & Charts](#15-analytics--charts)
16. [UI Patterns & Design Tokens](#16-ui-patterns--design-tokens)

---

## 1. Tech Stack

| Layer | Library | Notes |
|---|---|---|
| Framework | React 18 (JSX, no TS) | Single file: `src/App.jsx` |
| Build | Vite | `npm run dev / build / preview` |
| Styling | Tailwind CSS v3 | Custom keyframes in `src/index.css` |
| Routing | react-router-dom | URL-based, 4 routes |
| Drag & drop | @dnd-kit/core + sortable | Routines, exercises, reorder modal |
| Charts | Recharts | Line, Area, Pie, Bar |
| Icons | Lucide React | 40+ icons imported at top |
| QR generate | qrcode.react | `<QRCodeSVG>` |
| QR scan | qr-scanner | Camera modal |
| Deploy | Netlify | `npm run build && netlify deploy --dir=dist --prod` |

---

## 2. Data Model & Persistence

### localStorage keys

| Key | Type | Default | Description |
|---|---|---|---|
| `gym_lang` | `'es'│'en'│'fr'` | `'es'` | Active UI language |
| `gym_routines` | `Routine[]` | 2 seed routines | User's routine list |
| `gym_history` | `Session[]` | `[]` | Completed workout sessions |
| `gym_weekly_goal` | `number` 1–7 | `4` | Target sessions per week |
| `gym_custom_exercises` | `Exercise[]` | `[]` | User-created exercises |
| `gym_active_workout` | `ActiveWorkout│null` | `null` | In-progress workout (survives reload) |
| `gym_rest_timer` | `60│90│120│180` | `90` | Default rest countdown in seconds |
| `gym_exercise_btns` | `ExerciseButtons` | `{routineForm:{video:true,image:false,anatomy:false}, workoutView:{video:true,image:false,anatomy:false}}` | Visibility of action buttons per context |

### Shapes

```js
// Routine
{ id: string, name: string, exercises: string[] }  // exercises = exercise IDs

// Session (history entry)
{
  id: string,
  date: ISOString,
  routineName: string,
  duration: number,          // minutes
  logs: {
    [exerciseId]: [{ weight: string, reps: string, isPR?: true }]
  }
}

// ActiveWorkout (in-progress)
{
  routineId: string,
  routineName: string,
  startTime: ISOString,
  logs: { [exerciseId]: [{ weight, reps, isPR? }] },
  extraExercises: string[]   // exercises added mid-workout (NOT mutated into routine)
}

// Exercise (catalog or custom)
{ id: string, name: string, muscle: MuscleGroup }

// ExerciseButtons
{
  routineForm: { video: boolean, image: boolean, anatomy: boolean },
  workoutView: { video: boolean, image: boolean, anatomy: boolean }
}
```

### Seed routines (first launch only)
- **Full Body:** Squat, Bench Press, Barbell Row, Military Press, Treadmill
- **Cardio & Abs:** Treadmill, Elliptical, Crunch, Plank

---

## 3. Internationalization

- **Languages:** Spanish (`es`), English (`en`), French (`fr`)
- **Switch:** Settings modal — 3 flag buttons, persisted via `gym_lang`
- **Helpers:**
  - `t(key)` — reads flat key from `TRANSLATIONS[lang]`
  - `getExName(id)` — exercise name in active language
  - `getExNameEn(id)` — exercise name always in English (for Google/YouTube search)
  - `getMuscleName(key)` — muscle group in active language
- **Nested keys:** `t('muscles').Pecho`, `t('ex_names').bp`
- **All UI strings** are translated; no hardcoded Spanish/English text in JSX

---

## 4. Navigation

- **Router:** `react-router-dom`, URL-based
- **Routes:**
  - `/` → redirect to `/dashboard`
  - `/dashboard` → DashboardView
  - `/routines` → RoutinesView
  - `/routines/new` → RoutineCreationForm (create)
  - `/routines/:id/edit` → RoutineCreationForm (edit)
  - `/workout` → ActiveWorkoutView (redirects to /routines if no active workout)
  - `/history` → HistoryView
  - `*` → redirect to `/dashboard`
- **Bottom tab bar (mobile):** Dashboard / Routines / History — hidden on `/workout`
- **Desktop sidebar:** same 3 tabs — hidden on `/workout`
- **Active tab** is derived from `location.pathname`, not separate state
- **Back button** during active workout: intercepted via `popstate` listener, shows cancel confirmation modal; if confirmed clears workout and navigates to `/routines`

---

## 5. Dashboard View

### Weekly Goal Ring
- Custom SVG circle progress ring (not a Recharts component)
- Shows `sessions this week / weeklyGoal`
- Increment/decrement buttons (min 1, max 7)
- Day-of-week tracker row below ring — 7 dots (S/M/T/W/T/F/S), filled when a session was logged that day
- "Goal Met" celebration triggers `CelebrationModal` when finishing a workout that completes the weekly goal

### Stats Cards
- **Mobile:** horizontal snap-scroll carousel with left/right arrow buttons
- **Desktop:** 2×3 grid
- Cards: Total Workouts, Total Sets, Avg Duration, Total Time, Streak (weeks), Favorite Exercise
- All stats computed via `useMemo` from history

### Charts (ChartSlider)
- Time range selector: `1W` / `1M` / `6M` / `1Y` — applies to all charts
- **Mobile:** horizontal snap-scroll with dot-indicator pagination
- **Desktop:** 3-column grid + legend row
- 5 charts total: Volume, Duration, Sets, Frequency, Muscle Split (see §15)

---

## 6. Routines View

### Empty State
When `routines.length === 0`: large dumbbell icon + translated "no routines" + hint text.

### Routine Cards
- Drag-handle (GripVertical icon) — reorder routines via @dnd-kit
- Routine name (bold)
- Exercise count badge
- First 3 exercise chips (colored dots by muscle group); "+N more" if >3
- **Buttons:** Edit (pencil) | QR export | Delete (trash with confirmation)
- **Start Workout** button (full width, green) — initializes `activeWorkout` and navigates to `/workout`

### QR Import Button
- Top-right of routines list header
- Opens `QRScannerModal`

---

## 7. Routine Builder Form

**Shared between create (`/routines/new`) and edit (`/routines/:id/edit`).**

### Inputs
- Routine name text field (required)
- Exercise search field with debounced filter
- Muscle group filter chips (All, Cardio, Pecho, Espalda, Pierna, Hombro, Brazos, Abs) — toggle via filter icon

### Tabs
- **Exercises tab** — full catalog + custom exercises, filterable, selectable
- **Selected tab** — selected exercises with drag-to-reorder (dnd-kit) and remove buttons

### Exercise Rows (Exercises tab)
- Muscle icon + exercise name + muscle group label
- Selection state (blue highlight, check badge)
- Conditionally shown action buttons (controlled by `exerciseButtons.routineForm`):
  - **Video:** opens YouTube search for `"{name} how to do exercise"`
  - **Images:** opens Google Images for `"{name} exercise proper form technique"`
  - **Muscles:** opens AnatomyModal

### Custom Exercise Creation
- Inline "+ Create exercise" toggle inside exercise list
- Fields: name input + muscle group dropdown
- Adds to `customExercises` state (persisted) and immediately available in picker

### Save
- "Save Routine (N)" button — disabled until name + ≥1 exercise selected
- On save: calls `addNewRoutine` or `updateRoutine`, navigates back to `/routines`

---

## 8. Active Workout View

> `ActiveWorkoutView` is a `React.memo` **module-level component** — it must remain at module scope (not defined inside App) to preserve stable reference and avoid remounts on App re-renders. All its state is lifted to App.

### Header Bar
- Pulsing green dot + routine name
- X button → cancel workout confirmation modal

### Exercise Pills (horizontal scroll)
- One pill per exercise in `currentRoutineExercises` (routine exercises + `extraExercises`)
- Active pill: white background, dark text, slight scale-up
- Set count badge (green circle) if ≥1 set logged
- Muscle icon per pill
- **+ button** → opens WorkoutPickerModal to add exercise mid-workout
- **GripVertical button** → opens ExerciseReorderModal

### Exercise Card (left column / full width on mobile)
- Exercise name heading
- **Action buttons row** (right of heading), conditionally shown per `exerciseButtons.workoutView`:
  - **Zap (Focus Mode toggle):** blue when active, slate when inactive — always shown
  - **Video / Images / Muscles:** ghost icon style, slate → colored on hover

### Focus Mode
- Toggled by Zap button
- Hides: header bar, sets log, finish button
- Enlarges inputs (h-20 / h-24 submit) vs normal (h-16 / h-16)
- Shows last-set summary line below exercise name

### Input Form
- **Strength exercises:** Weight (kg) + Reps inputs
- **Cardio exercises** (muscle === 'Cardio'): Level + Minutes inputs
- Large centered number inputs
- Green checkmark submit button (right)
- Submit via button click or Enter key

### PR Detection
- On submit, `checkPR(exerciseId, weight)` compares against best weight in `history` for that exercise
- If new PR: `isPR: true` stored in log entry + yellow flash badge (Trophy icon) shown for 2.5s

### Rest Timer
- Auto-starts after every logged set: cardio → 60s, strength → `restTimerDefault`
- Visual: Timer icon + "M:SS" countdown + progress bar (shrinks left→right) + Skip button
- On completion: `navigator.vibrate(300)` + Web Audio API beep (880Hz, 0.5s fade)
- Skip button clears timer immediately

### Sets Log (right column / below card on mobile)
- Reverse-chronological list of logged sets for selected exercise
- Each row: set number, weight + reps/level + minutes, PR trophy icon if `isPR`, trash button
- **Undo toast:** trash click marks set as pending (3s grace), shows "Set deleted · Undo" toast; Undo cancels deletion; after 3s actually deletes

### Finish Workout Button
- Full-width green button at bottom of sets column
- Creates session in history with duration calculated from `startTime`
- Clears `activeWorkout`, navigates to `/routines`
- Triggers achievement check (weekly goal)

### Mid-Workout Exercise Picker (WorkoutPickerModal)
- Full-screen modal over workout view
- Search + muscle filter (same filter UI as routine builder)
- Adding exercise stores it in `activeWorkout.extraExercises` — **does NOT mutate the saved routine**

### Exercise Reorder (ExerciseReorderModal)
- Lists current workout exercises numbered
- Drag-to-reorder via @dnd-kit
- On save: calls `reorderRoutineExercises` which updates the routine in localStorage

---

## 9. History View

### Empty State
When `history.length === 0`: empty icon + translated message.

### Session Cards (2-column grid)
- Routine name (bold)
- Date formatted with `toLocaleDateString` in active language locale
- Duration in minutes
- Exercise breakdown: each exercise with set count
- Trophy icon (🏆) next to any exercise that has at least one `isPR: true` set
- Delete button (trash) — triggers confirmation modal

---

## 10. Settings Modal

Opened via gear icon (mobile: in Dashboard top-right; desktop: sidebar gear icon).

### Sections (top to bottom)

#### Import Feedback Banner
- Auto-shown for 3s after import attempt
- Green (success) or red (error) with appropriate icon and translated message

#### Language
- 3 buttons: 🇪🇸 Español / 🇺🇸 English / 🇫🇷 Français
- Active language gets blue highlight
- Immediately applies to all UI

#### Default Rest Timer
- 4 buttons: 60s / 90s / 120s / 180s
- Active selection highlighted blue
- Persisted to `gym_rest_timer`

#### Exercise Buttons
- Two sub-rows: "Routine Builder" and "During Workout"
- Each row has 3 toggle buttons: Video (Youtube icon) / Images (Image icon) / Muscles (Camera icon)
- Active = blue; inactive = slate
- Controls which action buttons appear on exercise cards in each context
- Default: Video ON, Images OFF, Muscles OFF for both contexts

#### My Exercises (collapsible)
- Header shows count; chevron rotates when expanded
- Empty state text when no custom exercises
- Each exercise row: muscle icon + name + muscle label + Edit (pencil) + Delete (trash)
- **Edit:** expands inline form with name input + muscle dropdown, Save/Cancel
- **Delete:** shows inline confirmation overlay with exercise name + warning + Cancel/Confirm

#### Data Management
- **Export:** downloads `gymtracker-backup-{YYYY-MM-DD}.json` with `{routines, history, weeklyGoal, customExercises}`
- **Import:** file picker (`.json` only), restores all 4 fields, triggers feedback banner
- Warning banner about data overwrite

---

## 11. Anatomy Modal

Triggered by Camera button on any exercise.

### Layout
- Colored top accent bar (muscle group color)
- Muscle group icon + exercise name + muscle name (colored)
- **Front / Back toggle tabs** — defaults to Back view for `Espalda` exercises, Front for all others
- SVG body diagram (see below)
- "Not targeted from this side" italic label when selected view has no active regions for that muscle
- **Primary muscle chip** — colored pill with muscle group color
- **Secondary muscle chips** — from `SECONDARY_MUSCLES[exerciseId]`, each with its own muscle color dot

### Body Diagrams
Two separate SVG components using bezier paths:
- **FrontBodySVG:** deltoids, fan-shaped pecs, 6-block abs grid, biceps, forearms, quads, calves
- **BackBodySVG:** rear-deltoids, diamond traps, V-shaped lats, triceps, forearms, glutes (rounded), hamstrings, calves

**Region highlighting:**
- Active primary regions: full opacity + glow filter (`url(#glow-f)` / `url(#glow-b)`)
- Active secondary regions: secondary muscle color at full opacity (no glow)
- Inactive regions: dim color (`#1e293b`) at 0.10 opacity

**FRONT_ACTIVE / BACK_ACTIVE mappings:**

| Muscle | Front regions | Back regions |
|---|---|---|
| Pecho | chest-l, chest-r | *(none)* |
| Espalda | *(none)* | back-l, back-r, trap-back |
| Pierna | thigh-l, thigh-r, calf-l, calf-r | glute-l, glute-r, ham-l, ham-r, calf-back-l, calf-back-r |
| Hombro | sh-l, sh-r | sh-back-l, sh-back-r |
| Brazos | arm-l, arm-r, fore-l, fore-r | tri-l, tri-r, fore-back-l, fore-back-r |
| Abs | abs | *(none)* |
| Cardio | chest-l, chest-r, abs, thigh-l, thigh-r | back-l, back-r, glute-l, glute-r, ham-l, ham-r |

---

## 12. QR Share & Import

### Export (per routine)
- QR icon on each routine card opens `QRExportModal`
- QR encodes JSON: `{ v: 1, name: string, exercises: string[] }`
- User can screenshot and share

### Import (camera scan)
- QR scan icon in routines header opens `QRScannerModal`
- Uses `qr-scanner` library to access camera feed
- On valid scan: parses JSON, shows `ImportConfirmModal` with routine name + exercise list
- On confirm: adds routine to `routines` state
- `camera_error` translation shown if camera access denied

---

## 13. Exercise System

### Muscle Groups
`Cardio` | `Pecho` | `Espalda` | `Pierna` | `Hombro` | `Brazos` | `Abs`

### Muscle Colors
| Group | Hex |
|---|---|
| Pecho | `#3b82f6` (blue) |
| Espalda | `#10b981` (emerald) |
| Pierna | `#f59e0b` (amber) |
| Hombro | `#8b5cf6` (purple) |
| Brazos | `#ef4444` (red) |
| Abs | `#06b6d4` (cyan) |
| Cardio | `#f97316` (orange) |

### Cardio vs Strength Detection
`isCardio = allExercises.find(e => e.id === id)?.muscle === 'Cardio'`
- Cardio → shows Level + Minutes inputs (not Weight + Reps)
- Cardio → rest timer defaults to 60s (not `restTimerDefault`)
- Cardio → excluded from PR detection and volume chart

### Custom Exercises
- Created in Settings modal or inline in Routine Builder
- ID format: `custom_` + `Date.now()`
- Merged into `allExercises` via `useMemo`
- Deleting removes from all routines that reference them

### Secondary Muscles (`SECONDARY_MUSCLES`)
Maps exercise IDs to comma-separated secondary muscle group strings, used by AnatomyModal to show secondary chips and dim-highlight secondary body regions.

### Action Buttons (per exercise)
Three buttons that appear on exercise rows; visibility controlled per context:

| Button | Icon | Action |
|---|---|---|
| Video | Youtube | YouTube search: `how to do {name} exercise` |
| Images | Image | Google Images: `{name} exercise proper form technique` |
| Muscles | Camera | Opens AnatomyModal for that exercise |

Both contexts (Routine Builder, Active Workout) use identical ghost-style buttons: `p-2 text-slate-400 hover:text-[color] hover:bg-slate-700/50 rounded-full`.

---

## 14. Achievement System

- **Trigger:** finishing a workout when `uniqueDaysCount` (sessions this week) reaches `weeklyGoal`
- **Display:** `CelebrationModal` — full-screen overlay, bouncing trophy, achievement title + description
- **Animation:** `animate-bounce` on trophy, staggered 150ms delay on each achievement card
- Achievements array passed as prop; modal auto-closes via `onClose` callback

---

## 15. Analytics & Charts

All computed with `useMemo` from `history`, filtered by `chartRange` (1W/1M/6M/1Y).

| Chart | Type | Data | Notes |
|---|---|---|---|
| Volume | LineChart | `Σ(weight × reps)` per session | Excludes cardio |
| Duration | AreaChart | Session minutes | Includes average ReferenceLine |
| Sets | AreaChart | Total sets per session | Includes average ReferenceLine |
| Frequency | BarChart | Sessions per week bucket | Groups history by ISO week |
| Muscle Split | PieChart | Sets by muscle group | Labels + legend with colors |

**Stat computations:**
- `streak` — consecutive weeks meeting goal (looks back 52 weeks)
- `favExId` — exercise with highest set count across all history
- `avgDuration` — mean session length in minutes (non-zero only)
- `totalHoursStr` — formatted as "Xh" if ≥60min else "Xmin"

---

## 16. UI Patterns & Design Tokens

### Color Palette
- Backgrounds: `slate-950` (page) → `slate-900` (modals) → `slate-800` (cards/inputs)
- Borders: `slate-700/50` default, `slate-700` inputs, `blue-500` focused/selected
- Text: `white` (primary) → `slate-400` (secondary) → `slate-500/600` (muted)
- Primary action: `blue-600` hover:`blue-500`
- Success: `emerald-500` hover:`emerald-400`
- Danger: `red-500` (text on red-500/10 bg)
- Warning: `yellow-500` text on `yellow-500/10` bg

### Reusable Components
- `Card` — `bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl`
- `Button` — 6 variants: `primary` (blue), `secondary` (slate), `danger` (red ghost), `success` (emerald), `ghost` (transparent), `icon` (square slate)
- `ConfirmationModal` — generic confirm/cancel with red AlertCircle icon
- `MuscleIcon` — inline SVG icon colored by muscle group

### Animations (custom in `src/index.css`)
- `animate-in fade-in` — view/modal entry
- `animate-in slide-in-from-top-2` — toasts, rest timer pill
- `animate-in slide-in-from-right` — routine builder form
- `animate-in slide-in-from-bottom` — workout view
- `animate-in zoom-in` — stat cards, celebration modal
- `active:scale-95` — button press feedback on all interactive elements
- `animate-pulse` — live workout indicator dot
- `animate-bounce` — trophy icon in celebration modal

### Responsive Breakpoints
- All layouts mobile-first; `lg:` prefix for desktop overrides
- Workout view: single column mobile, `md:flex-row` two-column desktop
- Dashboard: `lg:grid-cols-[360px_1fr]` for sidebar + content layout
- Charts: full-width snap-scroll mobile, `grid-cols-3` desktop

### Scrollbar Hiding
- `no-scrollbar` utility class (defined in index.css) applied to horizontal scroll containers
- `scrollbar-hide` on workout exercise pills

---

*Last updated: 2026-02-18. Update this file whenever a new feature is added, removed, or significantly changed.*
