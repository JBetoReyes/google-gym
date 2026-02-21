/**
 * WorkoutPage — active workout session logger.
 * ActiveWorkoutView is a React.memo module-level component (stable ref).
 * Reference: FEATURES.md §8 Active Workout View
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  CheckCircle,
  GripVertical,
  ListFilter,
  Plus,
  Save,
  Search,
  Timer,
  Trash2,
  Trophy,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { MUSCLE_GROUPS } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise, MuscleGroup } from '@shared/types/exercise';
import type { ActiveWorkout, SetLog } from '@shared/types/routine';
import type { Session } from '@shared/types/session';
import type { Lang } from '@shared/types/user';
import { Button, Card, ConfirmationModal, MuscleIcon } from '@/components/ui';
import { useWorkout } from '@/context/WorkoutContext';
import { useStorage } from '@/hooks/useStorage';

// ── Sortable reorder item ─────────────────────────────────────────────────────
function SortableReorderItem({ id, index, label }: { id: string; index: number; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
        isDragging
          ? 'bg-[var(--bg-input)] border-[var(--accent)] shadow-xl scale-[1.02]'
          : 'bg-[var(--bg-card)] border-[var(--border)]'
      }`}
    >
      <span className="w-6 h-6 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[11px] font-black text-[var(--text-muted)] shrink-0">
        {index}
      </span>
      <span className="flex-1 text-[var(--text-primary)] font-semibold text-sm leading-tight">{label}</span>
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] touch-none cursor-grab active:cursor-grabbing rounded-lg hover:bg-[var(--bg-input)] transition-colors"
      >
        <GripVertical size={18} />
      </button>
    </div>
  );
}

// ── Exercise reorder modal ────────────────────────────────────────────────────
function ExerciseReorderModal({
  exercises,
  getExName,
  t,
  onSave,
  onClose,
}: {
  exercises: string[];
  getExName: (id: string) => string;
  t: (k: string) => string;
  onSave: (order: string[]) => void;
  onClose: () => void;
}) {
  const [order, setOrder] = useState(exercises);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in px-5">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col w-full max-w-md max-h-[75vh] animate-in zoom-in-95">
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-[var(--border)] shrink-0">
          <span className="flex-1 font-bold text-[var(--text-primary)]">{t('reorder_exercises')}</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--bg-input)] shrink-0">
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (active.id !== over?.id)
              setOrder((prev) =>
                arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over!.id as string)),
              );
          }}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2 space-y-1.5">
              {order.map((exId, i) => (
                <SortableReorderItem key={exId} id={exId} index={i + 1} label={getExName(exId)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="px-5 pt-3 pb-5 border-t border-[var(--border)] shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[var(--bg-input)] hover:brightness-110 text-[var(--text-secondary)] font-bold"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => onSave(order)}
            className="flex-1 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold"
          >
            {t('save_routine')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Workout picker modal ──────────────────────────────────────────────────────
function WorkoutPickerModal({
  routineExercises,
  allExercises,
  search,
  muscle,
  showFilter,
  setSearch,
  setMuscle,
  setShowFilter,
  onAdd,
  onClose,
  t,
  getExName,
  getMuscleName,
}: {
  routineExercises: string[];
  allExercises: Exercise[];
  search: string;
  muscle: string;
  showFilter: boolean;
  setSearch: (v: string) => void;
  setMuscle: (v: string) => void;
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
  onAdd: (exId: string) => void;
  onClose: () => void;
  t: (k: string) => string;
  getExName: (id: string) => string;
  getMuscleName: (m: MuscleGroup) => string;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in px-5">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md max-h-[75vh] flex flex-col animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)] shrink-0">
          <h3 className="font-bold text-[var(--text-primary)]">{t('add_exercise')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--bg-input)]">
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={16} />
            <input
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-10 py-2.5 text-[var(--text-primary)] outline-none text-sm"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`absolute right-2 top-1.5 p-1.5 rounded-lg transition-colors ${
                showFilter || muscle !== 'all'
                  ? 'text-[var(--accent)] bg-[var(--accent)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <ListFilter size={16} />
            </button>
          </div>
          {showFilter && (
            <div className="flex gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
              {(['all', ...MUSCLE_GROUPS] as (string | MuscleGroup)[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMuscle(m)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    muscle === m
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {m === 'all' ? t('all') : getMuscleName(m as MuscleGroup)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-5 space-y-2 min-h-0">
          {allExercises
            .filter((ex) => !routineExercises.includes(ex.id))
            .filter((ex) => {
              const name = getExName(ex.id);
              const mName = getMuscleName(ex.muscle);
              const matchesSearch =
                !search ||
                name.toLowerCase().includes(search.toLowerCase()) ||
                mName.toLowerCase().includes(search.toLowerCase());
              const matchesMuscle = muscle === 'all' || ex.muscle === muscle;
              return matchesSearch && matchesMuscle;
            })
            .map((ex) => (
              <div
                key={ex.id}
                onClick={() => onAdd(ex.id)}
                className="flex items-center gap-3 p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border)] hover:border-[var(--text-muted)] cursor-pointer transition-all"
              >
                <MuscleIcon muscle={ex.muscle} className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{getExName(ex.id)}</p>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold">
                    {getMuscleName(ex.muscle)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── SetLogItem ────────────────────────────────────────────────────────────────
const SetLogItem = React.memo(function SetLogItem({
  index,
  weight,
  reps,
  isCardio,
  isPR,
  onDelete,
}: {
  index: number;
  weight: string;
  reps: string;
  isCardio: boolean;
  isPR?: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border animate-in slide-in-from-top-2 ${
        isPR ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-[var(--bg-input)] border-[var(--border)]'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-[var(--text-muted)] font-mono text-sm">#{index}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-[var(--text-primary)]">{weight}</span>
          <span className="text-xs text-[var(--text-muted)] mr-3">{isCardio ? 'nvl' : 'kg'}</span>
          <span className="text-xl font-black text-[var(--text-primary)]">{reps}</span>
          <span className="text-xs text-[var(--text-muted)]">{isCardio ? 'min' : 'reps'}</span>
        </div>
        {isPR && <Trophy size={14} className="text-yellow-400" />}
      </div>
      <button
        onClick={onDelete}
        className="text-[var(--text-muted)] hover:text-[var(--danger)] p-2 rounded-lg hover:bg-[var(--bg-card)]"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});

// ── ActiveWorkoutView (stable module-level React.memo) ────────────────────────
const ActiveWorkoutView = React.memo(function ActiveWorkoutView({
  activeWorkout,
  routineExercises,
  workoutSelectedExercise,
  focusMode,
  showExerciseReorder,
  showWorkoutPicker,
  pickerSearch,
  pickerMuscle,
  showPickerFilter,
  history,
  allExercises,
  setWorkoutSelectedExercise,
  setFocusMode,
  setShowExerciseReorder,
  setShowWorkoutPicker,
  setPickerSearch,
  setPickerMuscle,
  setShowPickerFilter,
  logSet,
  deleteSet,
  onCancel,
  onFinish,
  onAddExercise,
  onReorderExercises,
  checkPR,
  restTimerDefault,
  t,
  getExName,
  getMuscleName,
  exerciseBtns,
}: {
  activeWorkout: ActiveWorkout;
  routineExercises: string[];
  workoutSelectedExercise: string | null;
  focusMode: boolean;
  showExerciseReorder: boolean;
  showWorkoutPicker: boolean;
  pickerSearch: string;
  pickerMuscle: string;
  showPickerFilter: boolean;
  history: Session[];
  allExercises: Exercise[];
  setWorkoutSelectedExercise: (ex: string) => void;
  setFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowExerciseReorder: (v: boolean) => void;
  setShowWorkoutPicker: (v: boolean) => void;
  setPickerSearch: (v: string) => void;
  setPickerMuscle: (v: string) => void;
  setShowPickerFilter: React.Dispatch<React.SetStateAction<boolean>>;
  logSet: (exId: string, weight: string, reps: string, isPR: boolean) => void;
  deleteSet: (exId: string, index: number) => void;
  onCancel: () => void;
  onFinish: () => void;
  onAddExercise: (exId: string) => void;
  onReorderExercises: (routineId: string, newOrder: string[]) => void;
  checkPR: (exId: string, weight: string) => boolean;
  restTimerDefault: number;
  t: (k: string) => string;
  getExName: (id: string) => string;
  getMuscleName: (m: MuscleGroup) => string;
  exerciseBtns: { video: boolean; image: boolean; anatomy: boolean };
}) {
  const selectedExercise = workoutSelectedExercise ?? routineExercises[0] ?? '';
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const pillContainerRef = useRef<HTMLDivElement>(null);

  const [prFlash, setPrFlash] = useState(false);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTotalRef = useRef<number>(restTimerDefault);
  const [pendingDelete, setPendingDelete] = useState<{
    exId: string;
    index: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  const clearTimer = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    setRestSeconds(null);
  }, []);

  const startRestTimer = useCallback(
    (seconds: number) => {
      clearTimer();
      restTotalRef.current = seconds;
      setRestSeconds(seconds);
      restRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(restRef.current!);
            navigator.vibrate?.(300);
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            } catch {
              /* audio not supported */
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer],
  );

  useEffect(() => () => { if (restRef.current) clearInterval(restRef.current); }, []);

  useEffect(() => {
    if (pillContainerRef.current) {
      const activeEl = pillContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) activeEl.scrollIntoView({ behavior: 'instant', inline: 'nearest', block: 'nearest' });
    }
  }, [selectedExercise]);

  useEffect(() => {
    const logs = activeWorkout.logs[selectedExercise];
    if (logs?.length) {
      const lastLog = logs[logs.length - 1];
      setWeight(lastLog?.weight ?? '');
      setReps(lastLog?.reps ?? '');
    } else {
      const hist = history.find((h) => h.logs[selectedExercise]?.length);
      if (hist) {
        const histLogs = hist.logs[selectedExercise] ?? [];
        const last = histLogs[histLogs.length - 1];
        setWeight(last?.weight ?? '');
        setReps(last?.reps ?? '');
      } else {
        setWeight('');
        setReps('');
      }
    }
  }, [selectedExercise]); // eslint-disable-line

  const exInfo = allExercises.find((e) => e.id === selectedExercise || e.name === selectedExercise);
  const isCardio = exInfo?.muscle === 'Cardio';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !reps) return;
    const isPR = !isCardio && checkPR(selectedExercise, weight);
    logSet(selectedExercise, weight, reps, isPR);
    if (isPR) {
      setPrFlash(true);
      setTimeout(() => setPrFlash(false), 2500);
    }
    startRestTimer(isCardio ? 60 : restTimerDefault);
  };

  const handleDeleteSet = useCallback(
    (exId: string, index: number) => {
      setPendingDelete((prev) => {
        if (prev) {
          clearTimeout(prev.timer);
          if (prev.exId !== exId || prev.index !== index) deleteSet(prev.exId, prev.index);
        }
        const timer = setTimeout(() => {
          deleteSet(exId, index);
          setPendingDelete(null);
        }, 3000);
        return { exId, index, timer };
      });
    },
    [deleteSet],
  );

  const handleUndoDelete = useCallback(() => {
    setPendingDelete((prev) => {
      if (prev) clearTimeout(prev.timer);
      return null;
    });
  }, []);

  const reversedLogs = useMemo(
    () => (activeWorkout.logs[selectedExercise] || []).slice().reverse(),
    [activeWorkout.logs, selectedExercise],
  );

  const openVideoSearch = (exName: string) => {
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${exName} exercise`)}`,
      '_blank',
    );
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-bottom">
      {!focusMode && (
        <div className="flex justify-between items-center mb-4 bg-[var(--bg-card)]/50 p-2 rounded-xl backdrop-blur shrink-0">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-[var(--text-primary)]">{activeWorkout.routineName}</span>
          </div>
          <button onClick={onCancel} className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)]">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Exercise pills */}
      <div ref={pillContainerRef} className="flex overflow-x-auto pb-3 gap-2 mb-3 no-scrollbar shrink-0">
        {routineExercises.map((ex) => {
          const active = selectedExercise === ex;
          const count = (activeWorkout.logs[ex] || []).length;
          const info = allExercises.find((e) => e.id === ex || e.name === ex);
          return (
            <button
              key={ex}
              data-active={active ? 'true' : 'false'}
              onClick={() => setWorkoutSelectedExercise(ex)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                active
                  ? 'bg-slate-100 text-slate-900 border-white shadow-lg shadow-white/10 scale-105'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--bg-input)]'
              }`}
            >
              {info && <MuscleIcon muscle={info.muscle} className="w-4 h-4" />}
              {getExName(ex)}
              {count > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setShowWorkoutPicker(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] shrink-0 transition-all"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => setShowExerciseReorder(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] shrink-0 transition-all"
          title={t('reorder_exercises')}
        >
          <GripVertical size={18} />
        </button>
      </div>

      {/* Two-column layout on desktop */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row md:gap-6">
        {/* Left: exercise input */}
        <div className={`flex flex-col ${focusMode ? 'flex-1' : 'md:w-[55%] md:shrink-0'}`}>
          <Card
            className={`border border-[var(--border)] relative overflow-hidden ${
              focusMode ? 'flex-1 flex flex-col justify-center px-5 py-6' : 'p-5 mb-4 md:mb-0'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className={`flex items-center justify-between gap-3 ${focusMode ? 'mb-4' : 'mb-5'}`}>
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight leading-tight flex-1 min-w-0 truncate">
                {getExName(selectedExercise)}
              </h2>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setFocusMode((prev) => !prev)}
                  className={`p-2 rounded-full transition-all active:scale-95 ${
                    focusMode
                      ? 'bg-[var(--accent)] text-white shadow-lg'
                      : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title={t('focus_mode')}
                >
                  <Zap size={20} />
                </button>
                {!focusMode && exerciseBtns.video && (
                  <button
                    onClick={() => openVideoSearch(getExName(selectedExercise))}
                    className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-input)] rounded-full transition-colors active:scale-95"
                  >
                    <Youtube size={22} />
                  </button>
                )}
              </div>
            </div>

            {focusMode && (() => {
              const logs = activeWorkout.logs[selectedExercise];
              const lastSet = logs?.length ? logs[logs.length - 1] : null;
              return lastSet ? (
                <p className="text-xs text-[var(--text-muted)] text-center mb-4">
                  {t('last_set')} {lastSet.weight}{isCardio ? '' : 'kg'} × {lastSet.reps}{isCardio ? 'min' : ''}
                </p>
              ) : null;
            })()}

            {prFlash && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 text-yellow-400 font-bold mb-3 animate-in slide-in-from-top-2">
                <Trophy size={16} /> {t('new_pr')}
              </div>
            )}

            <form onSubmit={handleAdd} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block ml-1">
                  {isCardio ? t('level') : t('weight')} (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  className={`w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-center text-2xl font-black text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-muted)] ${
                    focusMode ? 'h-20' : 'h-16'
                  }`}
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block ml-1">
                  {isCardio ? t('time') : t('reps')}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className={`w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-center text-2xl font-black text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-muted)] ${
                    focusMode ? 'h-20' : 'h-16'
                  }`}
                  placeholder="0"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className={`flex-none rounded-xl bg-[var(--success)] hover:brightness-110 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                  focusMode ? 'h-24 w-24' : 'h-16 w-16'
                }`}
              >
                <CheckCircle size={focusMode ? 40 : 28} strokeWidth={2.5} />
              </button>
            </form>

            {restSeconds !== null && (
              <div className="flex items-center justify-between bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 mt-3 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-[var(--accent)] font-mono font-bold text-lg">
                  <Timer size={18} />
                  {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
                </div>
                <div className="flex-1 mx-3 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-1000"
                    style={{ width: `${(restSeconds / (restTotalRef.current || restTimerDefault)) * 100}%` }}
                  />
                </div>
                <button
                  onClick={clearTimer}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold px-2 py-1 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
                >
                  {t('skip')}
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Right: sets log + finish */}
        {!focusMode && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {t('sets_completed')}
              </span>
              <span className="text-xs font-bold text-[var(--success)]">
                {(activeWorkout.logs[selectedExercise] || []).length}
              </span>
            </div>

            {pendingDelete && (
              <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 mb-2 animate-in slide-in-from-top-2">
                <span className="text-sm text-[var(--text-secondary)]">{t('set_deleted')}</span>
                <button
                  onClick={handleUndoDelete}
                  className="text-[var(--accent)] font-bold text-sm hover:text-[var(--accent-hover)] transition-colors"
                >
                  Undo
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {reversedLogs.map((set: SetLog, i: number, arr: SetLog[]) => {
                const realIndex = arr.length - 1 - i;
                const isPending =
                  pendingDelete?.exId === selectedExercise && pendingDelete?.index === realIndex;
                return (
                  <div key={realIndex} className={`transition-opacity ${isPending ? 'opacity-40' : ''}`}>
                    <SetLogItem
                      index={realIndex + 1}
                      weight={set.weight}
                      reps={set.reps}
                      isCardio={isCardio}
                      {...(set.isPR ? { isPR: true } : {})}
                      onDelete={() => handleDeleteSet(selectedExercise, realIndex)}
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-3 pb-2 shrink-0">
              <Button onClick={onFinish} className="w-full py-4 text-lg" icon={Save}>
                {t('finish_workout')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {showExerciseReorder && (
        <ExerciseReorderModal
          exercises={routineExercises}
          getExName={getExName}
          t={t}
          onSave={(newOrder) => {
            onReorderExercises(activeWorkout.routineId, newOrder);
            setShowExerciseReorder(false);
          }}
          onClose={() => setShowExerciseReorder(false)}
        />
      )}

      {showWorkoutPicker && (
        <WorkoutPickerModal
          routineExercises={routineExercises}
          allExercises={allExercises}
          search={pickerSearch}
          muscle={pickerMuscle}
          showFilter={showPickerFilter}
          setSearch={setPickerSearch}
          setMuscle={setPickerMuscle}
          setShowFilter={setShowPickerFilter}
          onAdd={(exId) => {
            onAddExercise(exId);
            setShowWorkoutPicker(false);
            setPickerSearch('');
          }}
          onClose={() => {
            setShowWorkoutPicker(false);
            setPickerMuscle('all');
            setShowPickerFilter(() => false);
          }}
          t={t}
          getExName={getExName}
          getMuscleName={getMuscleName}
        />
      )}
    </div>
  );
});

// ── WorkoutPage (thin wrapper, owns lifted state) ─────────────────────────────
export default function WorkoutPage() {
  const navigate = useNavigate();
  const { activeWorkout, setActiveWorkout } = useWorkout();
  const { getRoutines, getSessions, saveSession, getCustomExercises, getPreferences, saveRoutine: saveRoutineStorage } =
    useStorage();

  const [history, setHistory] = useState<Session[]>([]);
  const [routines, setRoutines] = useState<{ id: string; name: string; exercises: string[] }[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [restTimerDefault, setRestTimerDefault] = useState(90);
  const [exerciseBtns, setExerciseBtns] = useState({ video: true, image: false, anatomy: false });

  // Lifted state for ActiveWorkoutView
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showExerciseReorder, setShowExerciseReorder] = useState(false);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState('all');
  const [showPickerFilter, setShowPickerFilter] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const t = useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
      return dict[key] ?? key;
    },
    [lang],
  );

  const getMuscleName = useCallback(
    (m: MuscleGroup): string => {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
      const muscles = dict.muscles as Record<string, string> | undefined;
      return muscles?.[m] ?? m;
    },
    [lang],
  );

  useEffect(() => {
    getSessions().then(setHistory);
    getRoutines().then((r) => setRoutines(r as typeof routines));
    getCustomExercises().then(setCustomExercises);
    getPreferences().then((p) => {
      setLang(p.lang);
      setRestTimerDefault(p.restTimerDefault);
      setExerciseBtns(p.exerciseButtons.workoutView);
    });
  }, []); // eslint-disable-line

  const allExercises = useMemo(() => [...EXERCISE_CATALOG, ...customExercises], [customExercises]);

  const getExName = useCallback(
    (idOrName: string): string => {
      const entry = allExercises.find((e) => e.id === idOrName || e.name === idOrName);
      if (entry) {
        const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
        const exNames = dict.ex_names as Record<string, string> | undefined;
        return exNames?.[entry.id] ?? entry.name;
      }
      return idOrName;
    },
    [allExercises, lang],
  );

  const routineExercises = useMemo(() => {
    if (!activeWorkout) return [];
    const base = routines.find((r) => r.id === activeWorkout.routineId)?.exercises ?? [];
    return [...base, ...(activeWorkout.extraExercises ?? [])];
  }, [activeWorkout, routines]);

  const checkPR = useCallback(
    (exId: string, weight: string): boolean => {
      const prevBest = history
        .flatMap((s) => s.logs[exId] || [])
        .reduce((max, s) => Math.max(max, parseFloat(s.weight) || 0), 0);
      return parseFloat(weight) > prevBest && parseFloat(weight) > 0;
    },
    [history],
  );

  const logSet = useCallback(
    (exId: string, weight: string, reps: string, isPR: boolean) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        logs: {
          ...activeWorkout.logs,
          [exId]: [
            ...(activeWorkout.logs[exId] || []),
            { weight, reps, ...(isPR ? { isPR: true as const } : {}) },
          ],
        },
      });
    },
    [activeWorkout, setActiveWorkout],
  );

  const deleteSet = useCallback(
    (exId: string, index: number) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        logs: {
          ...activeWorkout.logs,
          [exId]: (activeWorkout.logs[exId] ?? []).filter((_, i) => i !== index),
        },
      });
    },
    [activeWorkout, setActiveWorkout],
  );

  const handleFinish = async () => {
    if (!activeWorkout) return;
    const newSession: Session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      routineName: activeWorkout.routineName,
      duration: Math.round((Date.now() - new Date(activeWorkout.startTime).getTime()) / 60000),
      logs: activeWorkout.logs,
    };
    await saveSession(newSession);
    setHistory((prev) => [newSession, ...prev]);
    setActiveWorkout(null);
    setSelectedExercise(null);
    setFocusMode(false);
    navigate('/dashboard');
  };

  const handleCancel = () => setShowCancelConfirm(true);
  const confirmCancel = () => {
    setActiveWorkout(null);
    setSelectedExercise(null);
    setFocusMode(false);
    setShowCancelConfirm(false);
    navigate('/routines');
  };

  const handleAddExercise = useCallback(
    (exId: string) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        extraExercises: [...(activeWorkout.extraExercises ?? []), exId],
      });
      setSelectedExercise(exId);
    },
    [activeWorkout, setActiveWorkout],
  );

  const handleReorderExercises = useCallback(
    async (routineId: string, newExercises: string[]) => {
      const r = routines.find((x) => x.id === routineId);
      if (!r) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await saveRoutineStorage({ ...r, exercises: newExercises } as any);
      setRoutines((prev) => prev.map((x) => (x.id === routineId ? { ...x, exercises: newExercises } : x)));
    },
    [routines, saveRoutineStorage],
  );

  if (!activeWorkout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <p className="text-[var(--text-muted)]">No active workout. Start a routine first.</p>
        <Button onClick={() => navigate('/routines')}>{t('routines')}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4">
      <ActiveWorkoutView
        activeWorkout={activeWorkout}
        routineExercises={routineExercises}
        workoutSelectedExercise={selectedExercise}
        focusMode={focusMode}
        showExerciseReorder={showExerciseReorder}
        showWorkoutPicker={showWorkoutPicker}
        pickerSearch={pickerSearch}
        pickerMuscle={pickerMuscle}
        showPickerFilter={showPickerFilter}
        history={history}
        allExercises={allExercises}
        setWorkoutSelectedExercise={setSelectedExercise}
        setFocusMode={setFocusMode}
        setShowExerciseReorder={setShowExerciseReorder}
        setShowWorkoutPicker={setShowWorkoutPicker}
        setPickerSearch={setPickerSearch}
        setPickerMuscle={setPickerMuscle}
        setShowPickerFilter={setShowPickerFilter}
        logSet={logSet}
        deleteSet={deleteSet}
        onCancel={handleCancel}
        onFinish={handleFinish}
        onAddExercise={handleAddExercise}
        onReorderExercises={handleReorderExercises}
        checkPR={checkPR}
        restTimerDefault={restTimerDefault}
        t={t}
        getExName={getExName}
        getMuscleName={getMuscleName}
        exerciseBtns={exerciseBtns}
      />

      <ConfirmationModal
        isOpen={showCancelConfirm}
        title={t('cancel_workout')}
        message={t('cancel_msg')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
