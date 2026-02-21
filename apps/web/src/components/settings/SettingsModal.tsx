/**
 * SettingsModal — language, rest timer, exercise buttons, custom exercises,
 * data export/import, and theme picker (premium).
 * Reference: FEATURES.md §10 Settings Modal
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle, AlertTriangle, Camera, Check, ChevronRight,
  Download, Image, LogIn, LogOut, Pencil, Settings, Trash2, Upload, X, Youtube,
} from 'lucide-react';
import { MUSCLE_GROUPS } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise, ExerciseButtons, MuscleGroup } from '@shared/types/exercise';
import type { Lang } from '@shared/types/user';
import { STORAGE_KEYS } from '@shared/utils/storage';
import { Button, Card, MuscleIcon } from '@/components/ui';
import { ThemePicker } from '@/components/settings/ThemePicker';
import { useAuth } from '@/context/AuthContext';
import { useLayout } from '@/context/LayoutContext';
import { useStorage } from '@/hooks/useStorage';
import { api } from '@/services/api';

interface Props {
  onClose: () => void;
}

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function SettingsModal({ onClose }: Props) {
  const { user, plan, signOut } = useAuth();
  const { openAuth } = useLayout();
  const { getRoutines, getSessions, getCustomExercises, saveCustomExercise, deleteCustomExercise, getPreferences, savePreferences } = useStorage();

  const [lang, setLangState] = useState<Lang>('en');
  const [restTimerDefault, setRestTimerDefaultState] = useState<60 | 90 | 120 | 180>(90);
  const [exerciseButtons, setExerciseButtonsState] = useState<ExerciseButtons>({
    routineForm: { video: true, image: false, anatomy: false },
    workoutView: { video: true, image: false, anatomy: false },
  });
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [importFeedback, setImportFeedback] = useState<'success' | 'error' | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Custom exercise section state
  const [showCustomExercises, setShowCustomExercises] = useState(false);
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMuscle, setEditMuscle] = useState<MuscleGroup>('Chest');
  const [deleteExConfirm, setDeleteExConfirm] = useState<string | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('Chest');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
      return dict[key] ?? key;
    },
    [lang],
  );

  const muscleNames = useCallback(
    (m: MuscleGroup): string => {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
      const muscles = dict.muscles as Record<string, string> | undefined;
      return muscles?.[m] ?? m;
    },
    [lang],
  );

  useEffect(() => {
    getPreferences().then((p) => {
      setLangState(p.lang);
      setRestTimerDefaultState(p.restTimerDefault);
      setExerciseButtonsState(p.exerciseButtons);
    });
    getCustomExercises().then(setCustomExercises);
  }, [getPreferences, getCustomExercises]);

  const setLang = (l: Lang) => {
    setLangState(l);
    savePreferences({ lang: l });
  };

  const setRestTimerDefault = (s: 60 | 90 | 120 | 180) => {
    setRestTimerDefaultState(s);
    savePreferences({ restTimerDefault: s });
  };

  const setExerciseButtons = (updated: ExerciseButtons) => {
    setExerciseButtonsState(updated);
    savePreferences({ exerciseButtons: updated });
  };

  // ── Custom exercise handlers ───────────────────────────────────────────────
  const handleAddExercise = async () => {
    if (!newExName.trim()) return;
    const ex: Exercise = { id: `custom_${Date.now()}`, name: newExName.trim(), muscle: newExMuscle };
    await saveCustomExercise(ex);
    setCustomExercises((prev) => [...prev, ex]);
    setNewExName('');
  };

  const handleEditSave = async () => {
    if (!editingExId || !editName.trim()) return;
    const updated: Exercise = { id: editingExId, name: editName.trim(), muscle: editMuscle };
    await saveCustomExercise(updated);
    setCustomExercises((prev) => prev.map((e) => (e.id === editingExId ? updated : e)));
    setEditingExId(null);
  };

  const handleDeleteExercise = async (id: string) => {
    await deleteCustomExercise(id);
    setCustomExercises((prev) => prev.filter((e) => e.id !== id));
    setDeleteExConfirm(null);
  };

  // ── Export / Import ────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true);
    try {
      let routines, history, weeklyGoal;
      if (user) {
        // Authenticated: fetch live data from API (already mapped to frontend types)
        [routines, history] = await Promise.all([getRoutines(), getSessions()]);
        const prefs = await getPreferences();
        weeklyGoal = prefs.weeklyGoal;
      } else {
        routines = lsGet(STORAGE_KEYS.ROUTINES, []);
        history = lsGet(STORAGE_KEYS.HISTORY, []);
        weeklyGoal = lsGet(STORAGE_KEYS.WEEKLY_GOAL, 4);
      }
      const dataStr = JSON.stringify({ routines, history, weeklyGoal, customExercises });
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', 'gymtracker_backup.json');
      link.click();
    } finally {
      setExportLoading(false);
    }
  };

  // Normalize a session from any format (v1 or API) to API POST body
  const normalizeSession = (s: Record<string, unknown>) => {
    const ts = (s.date ?? s.started_at ?? new Date().toISOString()) as string;
    return {
      routine_name: ((s.routineName ?? s.routine_name ?? 'Imported') as string),
      started_at: ts,
      finished_at: (s.finished_at ?? ts) as string,
      duration_minutes: Number(s.duration ?? s.duration_minutes ?? 0),
      logs: (s.logs ?? {}) as Record<string, unknown>,
    };
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as Record<string, unknown>;

        if (user) {
          // Authenticated: push each item to the API
          const jobs: Promise<unknown>[] = [];

          if (Array.isArray(parsed.routines)) {
            (parsed.routines as Record<string, unknown>[]).forEach((r) =>
              jobs.push(
                api.post('/routines', {
                  name: r.name,
                  exercises: (r.exercises as string[]) ?? [],
                  position: 0,
                }).catch(() => null)
              )
            );
          }

          if (Array.isArray(parsed.history)) {
            (parsed.history as Record<string, unknown>[]).forEach((s) =>
              jobs.push(api.post('/sessions', normalizeSession(s)).catch(() => null))
            );
          }

          if (Array.isArray(parsed.customExercises)) {
            (parsed.customExercises as Record<string, unknown>[]).forEach((ex) =>
              jobs.push(api.post('/exercises', ex).catch(() => null))
            );
          }

          await Promise.all(jobs);
        } else {
          // Anonymous: save to localStorage
          if (parsed.routines) localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(parsed.routines));
          if (parsed.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(parsed.history));
          if (parsed.weeklyGoal) localStorage.setItem(STORAGE_KEYS.WEEKLY_GOAL, JSON.stringify(parsed.weeklyGoal));
          if (parsed.customExercises) {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(parsed.customExercises));
            setCustomExercises(parsed.customExercises as Exercise[]);
          }
        }

        setImportFeedback('success');
        setTimeout(() => setImportFeedback(null), 3000);
      } catch {
        setImportFeedback('error');
        setTimeout(() => setImportFeedback(null), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exToDelete = deleteExConfirm ? customExercises.find((e) => e.id === deleteExConfirm) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-md relative overflow-y-auto max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border)]">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X />
          </button>

          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <Settings className="text-[var(--accent)]" /> {t('settings')}
          </h2>

          {/* Import feedback banner */}
          {importFeedback && (
            <div
              className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-sm font-semibold animate-in slide-in-from-top-2 ${
                importFeedback === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {importFeedback === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {t(importFeedback === 'success' ? 'import_success' : 'import_error')}
            </div>
          )}

          {/* Language */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-muted)] uppercase mb-3 block">
              {t('language')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'es' as Lang, label: 'Español', flag: '🇪🇸' },
                { code: 'en' as Lang, label: 'English', flag: '🇺🇸' },
                { code: 'fr' as Lang, label: 'Français', flag: '🇫🇷' },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    lang === l.code
                      ? 'bg-[var(--accent)] border-[var(--accent-hover)] text-white'
                      : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:brightness-110'
                  }`}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <span className="text-xs font-bold">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rest Timer Default */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-muted)] uppercase mb-3 block">
              {t('rest_timer_default')}
            </label>
            <div className="flex gap-2">
              {([60, 90, 120, 180] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setRestTimerDefault(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                    restTimerDefault === s
                      ? 'bg-[var(--accent)] border-[var(--accent-hover)] text-white'
                      : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:brightness-110'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Buttons */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-muted)] uppercase mb-3 block">
              {t('exercise_buttons')}
            </label>
            {(
              [
                { loc: 'routineForm' as const, label: t('routine_form_btns') },
                { loc: 'workoutView' as const, label: t('workout_btns') },
              ] as const
            ).map(({ loc, label }) => (
              <div key={loc} className="mb-3">
                <p className="text-xs text-[var(--text-muted)] font-semibold mb-2">{label}</p>
                <div className="flex gap-2">
                  {[
                    { key: 'video' as const, icon: Youtube, label: t('btn_video') },
                    { key: 'image' as const, icon: Image, label: t('btn_image') },
                    { key: 'anatomy' as const, icon: Camera, label: t('btn_anatomy') },
                  ].map(({ key, icon: Icon, label: btnLabel }) => {
                    const active = exerciseButtons[loc][key];
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          setExerciseButtons({
                            ...exerciseButtons,
                            [loc]: { ...exerciseButtons[loc], [key]: !exerciseButtons[loc][key] },
                          })
                        }
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          active
                            ? 'bg-[var(--accent)] border-[var(--accent-hover)] text-white'
                            : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:brightness-110'
                        }`}
                      >
                        <Icon size={16} />
                        {btnLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* My Exercises */}
          <div className="mb-6">
            <button
              onClick={() => setShowCustomExercises((v) => !v)}
              className="flex items-center justify-between w-full text-sm font-bold text-[var(--text-muted)] uppercase mb-3"
            >
              <span>
                {t('my_exercises')} ({customExercises.length})
              </span>
              <ChevronRight
                size={16}
                className={`transition-transform ${showCustomExercises ? 'rotate-90' : ''}`}
              />
            </button>

            {showCustomExercises && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                {/* Add new exercise row */}
                <div className="flex gap-2 mb-3">
                  <input
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder={t('name_placeholder')}
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                  />
                  <select
                    className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-2 py-2 text-[var(--text-primary)] text-sm outline-none"
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}
                  >
                    {MUSCLE_GROUPS.map((m) => (
                      <option key={m} value={m}>{muscleNames(m)}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddExercise}
                    disabled={!newExName.trim()}
                    className="px-3 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-bold rounded-lg text-sm"
                  >
                    +
                  </button>
                </div>

                {customExercises.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm py-2 text-center">
                    {t('no_custom_exercises')}
                  </p>
                ) : (
                  customExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-[var(--bg-input)] rounded-xl border border-[var(--border)]"
                    >
                      {editingExId === ex.id ? (
                        <div className="p-3 space-y-2">
                          <input
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <select
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none"
                            value={editMuscle}
                            onChange={(e) => setEditMuscle(e.target.value as MuscleGroup)}
                          >
                            {MUSCLE_GROUPS.map((m) => (
                              <option key={m} value={m}>{muscleNames(m)}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={handleEditSave}
                              disabled={!editName.trim()}
                              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-semibold py-1.5 rounded-lg text-sm"
                            >
                              {t('save_routine')}
                            </button>
                            <button
                              onClick={() => setEditingExId(null)}
                              className="flex-1 bg-[var(--bg-card)] hover:brightness-110 text-[var(--text-secondary)] font-semibold py-1.5 rounded-lg text-sm"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <MuscleIcon muscle={ex.muscle} className="w-4 h-4 shrink-0" />
                          <span className="flex-1 text-[var(--text-primary)] text-sm font-semibold truncate">
                            {ex.name}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mr-1">
                            {muscleNames(ex.muscle)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingExId(ex.id);
                              setEditName(ex.name);
                              setEditMuscle(ex.muscle);
                            }}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg hover:bg-[var(--bg-card)] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteExConfirm(ex.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] rounded-lg hover:bg-[var(--bg-card)] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Theme picker (premium) */}
          <div className="mb-6">
            <label className="text-sm font-bold text-[var(--text-muted)] uppercase mb-3 block">
              Theme
            </label>
            <ThemePicker plan={plan} onUpgradeClick={() => {}} />
          </div>

          {/* Data management */}
          <div>
            <label className="text-sm font-bold text-[var(--text-muted)] uppercase mb-3 block">
              {t('data_management')}
            </label>
            <div className="space-y-3">
              <Button onClick={() => { void handleExport(); }} variant="secondary" className="w-full justify-start" icon={Download} disabled={exportLoading}>
                {exportLoading ? '…' : t('export_data')}
              </Button>

              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  className="hidden"
                  accept=".json"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="w-full justify-start"
                  icon={Upload}
                >
                  {t('import_data')}
                </Button>
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg text-yellow-500 text-xs">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>{t('import_alert')}</p>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <label className="text-sm font-bold text-[var(--text-muted)] uppercase mb-3 block">
              Account
            </label>
            {user === null ? (
              <div className="space-y-3">
                <p className="text-[var(--text-muted)] text-sm">
                  Sign in to sync your data across devices.
                </p>
                <Button
                  onClick={() => { onClose(); openAuth(); }}
                  variant="primary"
                  className="w-full justify-center"
                  icon={LogIn}
                >
                  Sign In / Register
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border)]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 ${
                    plan === 'premium'
                      ? 'bg-gradient-to-tr from-blue-600 to-purple-600'
                      : 'bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-muted)]'
                  }`}>
                    {plan === 'premium' ? 'PRO' : 'FREE'}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)] truncate flex-1" title={user.email}>
                    {user.email}
                  </span>
                </div>
                <Button
                  onClick={() => { void signOut(); onClose(); }}
                  variant="secondary"
                  className="w-full justify-start"
                  icon={LogOut}
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Delete exercise confirmation overlay */}
        {deleteExConfirm && exToDelete && (
          <div className="absolute inset-0 bg-[var(--bg-card)]/95 rounded-2xl flex items-center justify-center p-6 animate-in fade-in">
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--danger)]/10 rounded-full text-[var(--danger)]">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{exToDelete.name}</h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">{t('delete_exercise_warn')}</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setDeleteExConfirm(null)}
                  variant="secondary"
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => handleDeleteExercise(deleteExConfirm)}
                  variant="danger"
                  className="flex-1"
                >
                  {t('confirm')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
