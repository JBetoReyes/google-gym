/**
 * RoutinesPage — list, create, edit routines.
 * Premium gate: routine creation blocked at free_routine_limit.
 * Reference: FEATURES.md §6 Routines View, §7 Routine Builder Form
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  Dumbbell,
  GripVertical,
  ListFilter,
  Pencil,
  Play,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Trash2,
  X,
  Youtube,
  Image,
  Camera,
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
import { QRCodeSVG } from 'qrcode.react';
import QrScanner from 'qr-scanner';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { MUSCLE_GROUPS } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise, MuscleGroup } from '@shared/types/exercise';
import type { Routine } from '@shared/types/routine';
import type { Lang } from '@shared/types/user';
import { Button, Card, ConfirmationModal, MuscleIcon, UpgradeModal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useLayout } from '@/context/LayoutContext';
import { useWorkout } from '@/context/WorkoutContext';
import { useConfig } from '@/hooks/useConfig';
import { useStorage } from '@/hooks/useStorage';

// ── Sortable routine card ─────────────────────────────────────────────────────
function SortableRoutineCard({ routine, children }: { routine: Routine; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: routine.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        {...attributes}
        {...listeners}
        className="absolute top-3 left-3 z-10 p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={18} />
      </button>
      {children}
    </div>
  );
}

// ── Sortable exercise items ───────────────────────────────────────────────────
function SortableExerciseItem({
  id,
  label,
  onRemove,
}: {
  id: string;
  label: string;
  onRemove?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--accent)]/40 rounded-xl px-3 py-2.5"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      <span className="flex-1 text-[var(--text-primary)] font-semibold text-sm truncate">{label}</span>
      {onRemove && (
        <button onClick={() => onRemove(id)} className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function SortableReorderItem({ id, index, label }: { id: string; index: number; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
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

// ── QR Scanner modal ──────────────────────────────────────────────────────────
function QRScannerModal({
  t,
  onScan,
  onClose,
}: {
  t: (k: string) => string;
  onScan: (routine: { name: string; exercises: string[] }) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    scannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        try {
          const data = JSON.parse(result.data);
          if (data.v === 1 && data.routine?.name && Array.isArray(data.routine?.exercises)) {
            scannerRef.current?.stop();
            onScan(data.routine);
          }
        } catch {
          /* ignore malformed QR */
        }
      },
      { highlightScanRegion: true, highlightCodeOutline: true },
    );
    scannerRef.current.start().catch(() => setError(t('camera_error')));
    return () => scannerRef.current?.stop();
  }, []); // eslint-disable-line

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex justify-between items-center p-4">
        <h3 className="text-white font-bold">{t('scan_qr')}</h3>
        <button onClick={onClose}>
          <X size={24} className="text-white" />
        </button>
      </div>
      {error ? (
        <div className="flex-1 flex items-center justify-center text-red-400 p-6 text-center">{error}</div>
      ) : (
        <video ref={videoRef} className="flex-1 w-full object-cover" />
      )}
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
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--bg-input)] transition-colors shrink-0">
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
            className="flex-1 py-3 rounded-xl bg-[var(--bg-input)] hover:brightness-110 text-[var(--text-secondary)] font-bold transition-all active:scale-[0.98]"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => onSave(order)}
            className="flex-1 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-all active:scale-[0.98]"
          >
            {t('save_routine')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Routine creation / edit form ──────────────────────────────────────────────
const RoutineCreationForm = React.memo(function RoutineCreationForm({
  t,
  getExName,
  getMuscleName,
  onSave,
  onCancel,
  exercises,
  onAddCustomExercise,
  initialName = '',
  initialExercises = [],
  exerciseBtns = { video: true, image: false, anatomy: false },
}: {
  t: (k: string) => string;
  getExName: (id: string) => string;
  getMuscleName: (m: MuscleGroup) => string;
  onSave: (name: string, exercises: string[]) => void;
  onCancel: () => void;
  exercises: Exercise[];
  onAddCustomExercise: (name: string, muscle: MuscleGroup) => void;
  initialName?: string;
  initialExercises?: string[];
  exerciseBtns?: { video: boolean; image: boolean; anatomy: boolean };
}) {
  const [name, setName] = useState(initialName);
  const [selectedExercises, setSelectedExercises] = useState<string[]>(initialExercises);
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [showMuscleFilter, setShowMuscleFilter] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('Chest');
  const [formTab, setFormTab] = useState<'exercises' | 'selected'>('exercises');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleSelection = (exId: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exId) ? prev.filter((e) => e !== exId) : [...prev, exId],
    );
  };

  const filteredExercises = exercises.filter((ex) => {
    const exName = getExName(ex.id);
    const muscle = getMuscleName(ex.muscle);
    const matchesSearch =
      !searchTerm ||
      exName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      muscle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = muscleFilter === 'all' || ex.muscle === muscleFilter;
    return matchesSearch && matchesMuscle;
  });

  const filteredSelected = selectedExercises.filter((exId) =>
    getExName(exId).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    onAddCustomExercise(customName.trim(), customMuscle);
    setCustomName('');
    setCustomMuscle('Chest');
    setShowAddForm(false);
  };

  const openVideoSearch = (e: React.MouseEvent, exName: string) => {
    e.stopPropagation();
    const query = encodeURIComponent(`how to do ${exName} exercise`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const openImageSearch = (e: React.MouseEvent, exName: string) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${exName} exercise proper form technique`);
    window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in slide-in-from-right">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={onCancel} className="p-2 hover:bg-[var(--bg-card)] rounded-full">
            <ChevronLeft className="text-[var(--text-primary)]" />
          </button>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            {initialName ? t('edit_routine') : t('new_routine')}
          </h3>
        </div>
        <input
          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none mb-4 font-bold"
          placeholder={t('name_placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-[var(--text-muted)]" size={18} />
          <input
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-12 pr-12 py-3 text-[var(--text-primary)] outline-none text-sm"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => setShowMuscleFilter((v) => !v)}
            className={`absolute right-3 top-2.5 p-1.5 rounded-lg transition-colors ${
              showMuscleFilter || muscleFilter !== 'all'
                ? 'text-[var(--accent)] bg-[var(--accent)]/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <ListFilter size={18} />
          </button>
        </div>

        {showMuscleFilter && (
          <div className="flex gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
            {(['all', ...MUSCLE_GROUPS] as (string | MuscleGroup)[]).map((m) => (
              <button
                key={m}
                onClick={() => setMuscleFilter(m)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  muscleFilter === m
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

      {/* Tab toggle */}
      <div className="flex bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-1 mb-3 shrink-0">
        <button
          onClick={() => setFormTab('exercises')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            formTab === 'exercises'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {t('tab_exercises')}
        </button>
        <button
          onClick={() => setFormTab('selected')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            formTab === 'selected'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {t('selected')}
          {selectedExercises.length > 0 && (
            <span
              className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold ${
                formTab === 'selected'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
              }`}
            >
              {selectedExercises.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {formTab === 'exercises' ? (
        <>
          {/* Quick-add custom exercise */}
          <div className="mb-3 shrink-0">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold px-1 py-1 transition-colors"
              >
                <Plus size={16} /> {t('create_exercise')}
              </button>
            ) : (
              <div className="bg-[var(--bg-input)] border border-[var(--accent)]/40 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-[var(--accent)]">{t('new_exercise')}</p>
                <input
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder={t('exercise_name_placeholder')}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  autoFocus
                />
                <select
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none"
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>{getMuscleName(m)}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCustom}
                    disabled={!customName.trim()}
                    className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-semibold py-2 rounded-lg text-sm"
                  >
                    {t('add')}
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setCustomName(''); }}
                    className="flex-1 bg-[var(--bg-card)] hover:brightness-110 text-[var(--text-secondary)] font-semibold py-2 rounded-lg text-sm"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {filteredExercises.map((ex) => {
              const isSelected = selectedExercises.includes(ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => toggleSelection(ex.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                      : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-input)] text-[var(--text-muted)]'
                      }`}
                    >
                      <MuscleIcon muscle={ex.muscle} className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`font-bold ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {getExName(ex.id)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wide">
                        {getMuscleName(ex.muscle)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {exerciseBtns.video && (
                      <button
                        onClick={(e) => openVideoSearch(e, getExName(ex.id))}
                        className="p-3 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-input)] rounded-full transition-colors active:scale-95"
                      >
                        <Youtube size={22} />
                      </button>
                    )}
                    {exerciseBtns.image && (
                      <button
                        onClick={(e) => openImageSearch(e, ex.name)}
                        className="p-3 text-[var(--text-muted)] hover:text-blue-400 hover:bg-[var(--bg-input)] rounded-full transition-colors active:scale-95"
                      >
                        <Image size={22} />
                      </button>
                    )}
                    {isSelected && (
                      <div className="bg-[var(--accent)] rounded-full p-1 ml-1">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : selectedExercises.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm font-medium">
          {t('no_exercises_selected')}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (active.id !== over?.id)
              setSelectedExercises((prev) =>
                arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over!.id as string)),
              );
          }}
        >
          <SortableContext items={filteredSelected} strategy={verticalListSortingStrategy}>
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
              {filteredSelected.map((exId) => (
                <SortableExerciseItem
                  key={exId}
                  id={exId}
                  label={getExName(exId)}
                  onRemove={(id) => setSelectedExercises((prev) => prev.filter((e) => e !== id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="pt-4 mt-auto border-t border-[var(--border)]">
        <Button
          className="w-full py-4 text-lg"
          onClick={() => onSave(name, selectedExercises)}
          disabled={!name || selectedExercises.length === 0}
        >
          {t('save_routine')} ({selectedExercises.length})
        </Button>
      </div>
    </div>
  );
});

// ── Main RoutinesPage ─────────────────────────────────────────────────────────
interface RoutinesPageProps {
  formMode?: 'new' | 'edit';
}

export default function RoutinesPage({ formMode }: RoutinesPageProps) {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const { plan } = useAuth();
  const { recordClick } = useLayout();
  const config = useConfig();
  const { setActiveWorkout } = useWorkout();
  const { getRoutines, saveRoutine, deleteRoutine, getCustomExercises, saveCustomExercise, getPreferences } =
    useStorage();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [exerciseButtons, setExerciseButtons] = useState({ video: true, image: false, anatomy: false });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showQRExport, setShowQRExport] = useState<Routine | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ name: string; exercises: string[] } | null>(null);

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
    getRoutines().then(setRoutines);
    getCustomExercises().then(setCustomExercises);
    getPreferences().then((p) => {
      setLang(p.lang);
      setExerciseButtons(p.exerciseButtons.routineForm);
    });
  }, [getRoutines, getCustomExercises, getPreferences]);

  const allExercises = useMemo(
    () => [...EXERCISE_CATALOG, ...customExercises],
    [customExercises],
  );

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

  const editingRoutine = useMemo(
    () => (editId ? routines.find((r) => r.id === editId) ?? null : null),
    [editId, routines],
  );

  // DnD sensors for routine list
  const routineSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (active.id !== over?.id) {
      setRoutines((prev) =>
        arrayMove(
          prev,
          prev.findIndex((r) => r.id === active.id),
          prev.findIndex((r) => r.id === over!.id),
        ),
      );
    }
  };

  const handleSaveRoutine = async (name: string, exercises: string[]) => {
    if (!name || exercises.length === 0) return;
    if (editingRoutine) {
      const updated = { ...editingRoutine, name, exercises };
      await saveRoutine(updated);
      setRoutines((prev) => prev.map((r) => (r.id === editingRoutine.id ? updated : r)));
    } else {
      // Free plan routine limit gate
      if (plan !== 'premium' && routines.length >= config.free_routine_limit.max_routines) {
        setShowUpgrade(true);
        return;
      }
      const newRoutine: Routine = { id: Date.now().toString(), name, exercises };
      await saveRoutine(newRoutine);
      setRoutines((prev) => [...prev, newRoutine]);
    }
    recordClick();
    navigate('/routines');
  };

  const handleDeleteRoutine = async (id: string) => {
    await deleteRoutine(id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    setConfirmDelete(null);
  };

  const handleStartWorkout = (routine: Routine) => {
    setActiveWorkout({
      routineId: routine.id,
      routineName: routine.name,
      startTime: new Date().toISOString(),
      logs: {},
      extraExercises: [],
    });
    navigate('/workout');
  };

  const handleAddCustomExercise = async (name: string, muscle: MuscleGroup) => {
    const ex: Exercise = { id: `custom_${Date.now()}`, name, muscle };
    await saveCustomExercise(ex);
    setCustomExercises((prev) => [...prev, ex]);
  };

  const handleQRImportConfirm = async () => {
    if (!pendingImport) return;
    const newRoutine: Routine = {
      id: Date.now().toString(),
      name: pendingImport.name,
      exercises: pendingImport.exercises,
    };
    await saveRoutine(newRoutine);
    setRoutines((prev) => [...prev, newRoutine]);
    setPendingImport(null);
  };

  // ── Form modes ──────────────────────────────────────────────────────────────
  if (formMode === 'new' || formMode === 'edit') {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <RoutineCreationForm
          t={t}
          getExName={getExName}
          getMuscleName={getMuscleName}
          onSave={handleSaveRoutine}
          onCancel={() => navigate('/routines')}
          exercises={allExercises}
          onAddCustomExercise={handleAddCustomExercise}
          initialName={editingRoutine?.name ?? ''}
          initialExercises={editingRoutine?.exercises ?? []}
          exerciseBtns={exerciseButtons}
        />
      </div>
    );
  }

  // ── Routines list ────────────────────────────────────────────────────────────
  const routineToDelete = confirmDelete ? routines.find((r) => r.id === confirmDelete) : null;

  return (
    <div className="animate-in fade-in lg:max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="hidden lg:block text-2xl font-black text-[var(--text-primary)] flex-1">
          {t('routines')}
        </h2>
        <Button
          onClick={() => navigate('/routines/new')}
          className="flex-1 lg:flex-none py-4 lg:py-2.5 border-2 border-dashed border-[var(--border)] bg-transparent hover:bg-[var(--bg-card)] text-[var(--text-muted)]"
          icon={Plus}
        >
          {t('create_routine')}
        </Button>
        <button
          onClick={() => setShowQRScanner(true)}
          className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-all text-sm font-semibold shrink-0"
        >
          <ScanLine size={16} /> {t('import')}
        </button>
      </div>

      {routines.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <Dumbbell size={56} className="mx-auto text-[var(--text-muted)]" />
          <p className="font-bold text-[var(--text-secondary)]">{t('no_routines')}</p>
          <p className="text-[var(--text-muted)] text-sm">{t('no_routines_hint')}</p>
        </div>
      )}

      <DndContext
        sensors={routineSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd as never}
      >
        <SortableContext items={routines.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routines.map((routine) => (
              <SortableRoutineCard key={routine.id} routine={routine}>
                <Card className="p-5 pl-9 group hover:border-[var(--text-muted)] transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-[var(--text-primary)] mb-1">{routine.name}</h3>
                      <p className="text-[var(--text-muted)] text-sm">
                        {routine.exercises.length} {t('exercises')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/routines/${routine.id}/edit`)}
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] p-2"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setShowQRExport(routine)}
                        className="text-[var(--text-muted)] hover:text-emerald-400 p-2"
                      >
                        <QrCode size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(routine.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {routine.exercises.slice(0, 3).map((ex, i) => (
                      <span
                        key={i}
                        className="text-xs bg-[var(--bg-input)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border)]"
                      >
                        {getExName(ex)}
                      </span>
                    ))}
                    {routine.exercises.length > 3 && (
                      <span className="text-xs text-[var(--text-muted)] py-1">
                        +{routine.exercises.length - 3}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="success"
                    className="w-full font-bold"
                    icon={Play}
                    onClick={() => handleStartWorkout(routine)}
                  >
                    {t('start')}
                  </Button>
                </Card>
              </SortableRoutineCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* QR Export modal */}
      {showQRExport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowQRExport(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeSVG
              value={JSON.stringify({ v: 1, routine: { name: showQRExport.name, exercises: showQRExport.exercises } })}
              size={200}
            />
            <p className="font-bold text-slate-900">{showQRExport.name}</p>
            <button
              onClick={() => setShowQRExport(null)}
              className="text-slate-500 text-sm hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QR Scanner modal */}
      {showQRScanner && (
        <QRScannerModal
          t={t}
          onScan={(routine) => {
            setShowQRScanner(false);
            setPendingImport(routine);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Import confirm */}
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-sm p-6">
            <h3 className="font-bold text-[var(--text-primary)] text-lg mb-2">{t('import')}</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              Import routine <strong>&ldquo;{pendingImport.name}&rdquo;</strong> with {pendingImport.exercises.length}{' '}
              exercises?
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setPendingImport(null)} variant="secondary" className="flex-1">
                {t('cancel')}
              </Button>
              <Button onClick={handleQRImportConfirm} className="flex-1">
                {t('import')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmDelete !== null}
        title={t('delete_routine')}
        message={routineToDelete ? `Delete "${routineToDelete.name}"? ${t('delete_msg')}` : t('delete_msg')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        onConfirm={() => confirmDelete && handleDeleteRoutine(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
