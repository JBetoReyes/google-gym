/**
 * HistoryPage — list of past workout sessions.
 * Reference: FEATURES.md §9 History View
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, History, Trash2, Trophy } from 'lucide-react';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise } from '@shared/types/exercise';
import type { Session } from '@shared/types/session';
import type { Lang } from '@shared/types/user';
import { Card, ConfirmationModal } from '@/components/ui';
import { useStorage } from '@/hooks/useStorage';

export default function HistoryPage() {
  const { getSessions, deleteSession, getCustomExercises, getPreferences } = useStorage();

  const [history, setHistory] = useState<Session[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const t = useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
      return dict[key] ?? key;
    },
    [lang],
  );

  useEffect(() => {
    getSessions().then(setHistory);
    getCustomExercises().then(setCustomExercises);
    getPreferences().then((p) => setLang(p.lang));
  }, [getSessions, getCustomExercises, getPreferences]);

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

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      setHistory((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirm(null);
    },
    [deleteSession],
  );

  const localeStr = lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const sessionToDelete = deleteConfirm ? history.find((s) => s.id === deleteConfirm) : null;

  return (
    <div className="animate-in fade-in lg:max-w-4xl">
      <h2 className="hidden lg:block text-2xl font-black text-[var(--text-primary)] mb-6">
        {t('history')}
      </h2>

      {history.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <History size={64} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)]">{t('no_history')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {history.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex justify-between items-center mb-4 border-b border-[var(--border)] pb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--text-primary)] text-lg truncate">
                    {s.routineName}
                  </h3>
                  <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mt-1">
                    <Calendar size={12} />
                    {new Date(s.date).toLocaleDateString(localeStr, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="bg-[var(--bg-input)] px-3 py-1 rounded-lg border border-[var(--border)] text-blue-400 font-bold text-sm">
                    {s.duration} {t('min_label')}
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(s.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1.5 rounded-lg hover:bg-[var(--bg-input)] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(s.logs).map(([ex, sets]) => {
                  const hasPR = sets.some((set) => set.isPR);
                  return (
                    <div key={ex} className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{getExName(ex)}</span>
                        {/* Fixed-width slot — always reserves space so text never reflows */}
                        <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                          {hasPR && <Trophy size={12} className="text-yellow-400" />}
                        </span>
                      </span>
                      <span className="text-[var(--text-muted)] shrink-0 ml-2">{sets.length}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm !== null}
        title={t('delete_session')}
        message={t('delete_msg')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        onConfirm={() => deleteConfirm && handleDeleteSession(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
