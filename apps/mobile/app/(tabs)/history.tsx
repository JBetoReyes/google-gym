/**
 * History tab — list of past workout sessions.
 * Reference: FEATURES.md §9 History View
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise } from '@shared/types/exercise';
import type { Session } from '@shared/types/session';
import type { Lang } from '@shared/types/user';
import { History as HistoryIcon, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useStorage } from '../../hooks/useStorage';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const { getSessions, deleteSession, getCustomExercises, getPreferences } = useStorage();

  const [history, setHistory] = useState<Session[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');

  const t = useCallback((key: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  }, [lang]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getSessions(), getCustomExercises(), getPreferences()]).then(([s, e, p]) => {
        if (cancelled) return;
        setHistory(s);
        setCustomExercises(e);
        setLang(p.lang);
      });
      return () => { cancelled = true; };
    }, [getSessions, getCustomExercises, getPreferences]),
  );

  const allExercises = useMemo(() => [...EXERCISE_CATALOG, ...customExercises], [customExercises]);

  const getExName = (id: string): string => {
    const ex = allExercises.find(e => e.id === id || e.name === id);
    return ex?.name ?? id;
  };

  const handleDelete = (s: Session) => {
    Alert.alert(t('delete_session'), t('delete_msg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        style: 'destructive',
        onPress: async () => {
          await deleteSession(s.id);
          setHistory(prev => prev.filter(x => x.id !== s.id));
        },
      },
    ]);
  };

  const localeStr = lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US';

  if (history.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bgPage }}>
        <Text className="text-6xl mb-4">📅</Text>
        <Text className="text-slate-400 text-base">{t('no_history')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bgPage }}>
      <View className="px-5 pt-8 pb-5 flex-row items-center gap-3">
        <HistoryIcon size={26} color={theme.accent} />
        <Text className="text-3xl font-black" style={{ color: theme.textPrimary }}>{t('history')}</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={s => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 12 }}
        renderItem={({ item: s }) => (
          <View className="rounded-2xl p-5" style={{ backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
            {/* Header */}
            <View className="flex-row justify-between items-start mb-3 border-b border-slate-700/50 pb-3">
              <View className="flex-1 min-w-0 mr-2">
                <Text className="text-white font-bold text-lg" numberOfLines={1}>
                  {s.routineName}
                </Text>
                <Text className="text-slate-400 text-sm mt-0.5">
                  {new Date(s.date).toLocaleDateString(localeStr, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 shrink-0">
                <View className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                  <Text className="text-blue-400 font-bold text-base">
                    {s.duration} {t('min_label')}
                  </Text>
                </View>
                <Pressable onPress={() => handleDelete(s)} className="p-1.5">
                  <Trash2 size={17} color="#64748b" />
                </Pressable>
              </View>
            </View>

            {/* Exercise breakdown */}
            <View className="gap-1.5">
              {Object.entries(s.logs).map(([ex, sets]) => {
                const hasPR = sets.some(set => set.isPR);
                return (
                  <View key={ex} className="flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1 min-w-0 mr-2">
                      <Text className="text-slate-300 text-base font-medium shrink" numberOfLines={1}>
                        {getExName(ex)}
                      </Text>
                      {/* Fixed-width slot — always reserves 20px so text never reflows */}
                      <View style={{ width: 20, marginLeft: 4, alignItems: 'center' }}>
                        {hasPR && <Text style={{ fontSize: 13, lineHeight: 18 }}>🏆</Text>}
                      </View>
                    </View>
                    <Text className="text-slate-500 text-base shrink-0">{sets.length}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
