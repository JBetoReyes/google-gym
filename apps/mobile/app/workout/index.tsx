/**
 * Active workout screen — full-screen modal.
 * Reference: FEATURES.md §8 Active Workout View
 * Mobile-specific: expo-haptics via useRestTimer, push notifications on rest end.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { MUSCLE_GROUPS } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise, MuscleGroup } from '@shared/types/exercise';
import type { Session, } from '@shared/types/session';
import type { Lang } from '@shared/types/user';
import { Camera, Check, CircleCheck, Image, Play, X, Zap } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useStorage, type ExerciseButtons } from '../../hooks/useStorage';
import { useRestTimer } from '../../hooks/useRestTimer';
import AnatomyModal from '../../components/AnatomyModal';
import CelebrationModal from '../../components/CelebrationModal';

// ── Exercise picker modal ──────────────────────────────────────────────────────
function ExercisePicker({
  visible,
  allExercises,
  excluded,
  lang,
  onAdd,
  onClose,
}: {
  visible: boolean;
  allExercises: Exercise[];
  excluded: string[];
  lang: Lang;
  onAdd: (id: string) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<string>('all');

  const t = (key: string) => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  };
  const getMuscleName = (m: MuscleGroup) => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
    const muscles = dict.muscles as Record<string, string> | undefined;
    return muscles?.[m] ?? m;
  };
  const getExName = (id: string) => allExercises.find(e => e.id === id)?.name ?? id;

  const filtered = allExercises
    .filter(ex => !excluded.includes(ex.id))
    .filter(ex => {
      const matchSearch = !search ||
        getExName(ex.id).toLowerCase().includes(search.toLowerCase()) ||
        getMuscleName(ex.muscle).toLowerCase().includes(search.toLowerCase());
      return matchSearch && (muscle === 'all' || ex.muscle === muscle);
    });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bgCard }}>
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-slate-700">
          <Text className="text-white font-bold text-base">{t('add_exercise')}</Text>
          <Pressable onPress={onClose}><X size={20} color="#94a3b8" /></Pressable>
        </View>

        <View className="px-4 py-3">
          <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 mb-2">
            <Text className="text-slate-400 mr-2">🔍</Text>
            <TextInput
              className="flex-1 py-2.5 text-white text-sm"
              placeholder={t('search_placeholder')}
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['all', ...MUSCLE_GROUPS] as string[]}
            keyExtractor={m => m}
            contentContainerStyle={{ gap: 6 }}
            renderItem={({ item: m }) => (
              <Pressable
                onPress={() => setMuscle(m)}
                className={`px-3 py-1 rounded-full border ${muscle === m ? 'bg-blue-600 border-blue-600' : 'bg-slate-800 border-slate-700'}`}
              >
                <Text className={`text-xs font-bold ${muscle === m ? 'text-white' : 'text-slate-400'}`}>
                  {m === 'all' ? t('all') : getMuscleName(m as MuscleGroup)}
                </Text>
              </Pressable>
            )}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={ex => ex.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
          renderItem={({ item: ex }) => (
            <Pressable
              onPress={() => { onAdd(ex.id); onClose(); setSearch(''); setMuscle('all'); }}
              className="flex-row items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700"
            >
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">{getExName(ex.id)}</Text>
                <Text className="text-slate-500 text-xs uppercase font-bold">
                  {getMuscleName(ex.muscle)}
                </Text>
              </View>
              <Text className="text-blue-400 font-bold">+</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function WorkoutScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { activeWorkout, setActiveWorkout } = useWorkout();
  const { getRoutines, getSessions, saveSession, getCustomExercises, getPreferences, getExerciseButtons } = useStorage();
  const { seconds: restSeconds, start: startRest, clear: clearRest, isRunning: restRunning } = useRestTimer();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  const [history, setHistory] = useState<Session[]>([]);
  const [routines, setRoutines] = useState<{ id: string; name: string; exercises: string[] }[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [restTimerDefault, setRestTimerDefault] = useState(90);

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [prFlash, setPrFlash] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ exId: string; index: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [anatomyExId, setAnatomyExId] = useState<string | null>(null);
  const [exBtns, setExBtns] = useState<ExerciseButtons['workoutView']>({ video: true, image: false, anatomy: false });
  const [focusMode, setFocusMode] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [showCelebration, setShowCelebration] = useState(false);

  const restTotal = useRef(restTimerDefault);
  // Mutable ref so deleteSet timeout can access latest workout without stale closure
  const activeWorkoutRef = useRef(activeWorkout);
  useEffect(() => { activeWorkoutRef.current = activeWorkout; }, [activeWorkout]);

  const t = useCallback((key: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  }, [lang]);

  const getMuscleName = useCallback((m: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
    const muscles = dict.muscles as Record<string, string> | undefined;
    return muscles?.[m] ?? m;
  }, [lang]);

  useEffect(() => {
    Promise.all([getRoutines(), getSessions(), getCustomExercises(), getPreferences(), getExerciseButtons()]).then(
      ([r, s, e, p, btns]) => {
        setRoutines(r as typeof routines);
        setHistory(s);
        setCustomExercises(e);
        setLang(p.lang);
        setRestTimerDefault(p.restTimerDefault);
        restTotal.current = p.restTimerDefault;
        setExBtns(btns.workoutView);
        setWeeklyGoal(p.weeklyGoal ?? 4);
      },
    );
  }, []); // eslint-disable-line

  const allExercises = useMemo(() => [...EXERCISE_CATALOG, ...customExercises], [customExercises]);

  const getExName = useCallback((id: string): string => {
    const ex = allExercises.find(e => e.id === id || e.name === id);
    return ex?.name ?? id;
  }, [allExercises]);

  const routineExercises = useMemo(() => {
    if (!activeWorkout) return [];
    const base = routines.find(r => r.id === activeWorkout.routineId)?.exercises ?? [];
    return [...base, ...(activeWorkout.extraExercises ?? [])];
  }, [activeWorkout, routines]);

  const currentEx = selectedExercise ?? routineExercises[0] ?? '';
  const exInfo = allExercises.find(e => e.id === currentEx);
  const isCardio = exInfo?.muscle === 'Cardio';

  // Pre-fill inputs from last set or history
  useEffect(() => {
    if (!activeWorkout) return;
    const logs = activeWorkout.logs[currentEx];
    if (logs?.length) {
      const last = logs[logs.length - 1];
      setWeight(last?.weight ?? '');
      setReps(last?.reps ?? '');
    } else {
      const hist = history.find(h => h.logs[currentEx]?.length);
      if (hist) {
        const histLogs = hist.logs[currentEx] ?? [];
        const last = histLogs[histLogs.length - 1];
        setWeight(last?.weight ?? '');
        setReps(last?.reps ?? '');
      } else {
        setWeight('');
        setReps('');
      }
    }
  }, [currentEx]); // eslint-disable-line

  const checkPR = useCallback((exId: string, w: string): boolean => {
    const best = history
      .flatMap(s => s.logs[exId] || [])
      .reduce((max, s) => Math.max(max, parseFloat(s.weight) || 0), 0);
    return parseFloat(w) > best && parseFloat(w) > 0;
  }, [history]);

  const logSet = useCallback(() => {
    if (!activeWorkout || !weight || !reps) return;
    const isPR = !isCardio && checkPR(currentEx, weight);
    const newLog = { weight, reps, ...(isPR ? { isPR: true as const } : {}) };
    setActiveWorkout({
      ...activeWorkout,
      logs: {
        ...activeWorkout.logs,
        [currentEx]: [...(activeWorkout.logs[currentEx] ?? []), newLog],
      },
    });
    if (isPR) {
      setPrFlash(true);
      setTimeout(() => setPrFlash(false), 2500);
    }
    const dur = isCardio ? 60 : restTimerDefault;
    restTotal.current = dur;
    startRest(dur);
  }, [activeWorkout, weight, reps, currentEx, isCardio, checkPR, setActiveWorkout, startRest, restTimerDefault]);

  const deleteSet = useCallback((exId: string, index: number) => {
    setPendingDelete(prev => {
      if (prev) {
        clearTimeout(prev.timer);
        if (prev.exId !== exId || prev.index !== index) {
          // Commit previous pending delete using the ref to avoid stale closure
          activeWorkoutRef.current && setActiveWorkout({
            ...activeWorkoutRef.current,
            logs: {
              ...activeWorkoutRef.current.logs,
              [prev.exId]: (activeWorkoutRef.current.logs[prev.exId] ?? []).filter((_: unknown, i: number) => i !== prev.index),
            },
          });
        }
      }
      const timer = setTimeout(() => {
        activeWorkoutRef.current && setActiveWorkout({
          ...activeWorkoutRef.current,
          logs: {
            ...activeWorkoutRef.current.logs,
            [exId]: (activeWorkoutRef.current.logs[exId] ?? []).filter((_: unknown, i: number) => i !== index),
          },
        });
        setPendingDelete(null);
      }, 3000);
      return { exId, index, timer };
    });
  }, [setActiveWorkout]);

  const handleCancel = () => {
    Alert.alert(t('cancel_workout'), t('cancel_msg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        style: 'destructive',
        onPress: () => { clearRest(); setActiveWorkout(null); router.back(); },
      },
    ]);
  };

  const handleFinish = async () => {
    if (!activeWorkout) return;
    clearRest();

    // Count unique workout days this week before saving
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(monday);
    endOfWeek.setDate(monday.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const inThisWeek = (s: Session) => {
      const d = new Date(s.date).getTime();
      return d >= monday.getTime() && d <= endOfWeek.getTime();
    };
    const uniqueBefore = new Set(history.filter(inThisWeek).map(s => new Date(s.date).toDateString())).size;
    const todayStr = now.toDateString();
    const todayAlreadyCounted = history.some(s => inThisWeek(s) && new Date(s.date).toDateString() === todayStr);
    const uniqueAfter = uniqueBefore + (todayAlreadyCounted ? 0 : 1);

    const session: Session = {
      id: Date.now().toString(),
      date: now.toISOString(),
      routineName: activeWorkout.routineName,
      duration: Math.round((Date.now() - new Date(activeWorkout.startTime).getTime()) / 60000),
      logs: activeWorkout.logs,
    };
    await saveSession(session);
    setActiveWorkout(null);

    // Celebrate if this workout just completed the weekly goal
    if (uniqueAfter >= weeklyGoal && uniqueBefore < weeklyGoal) {
      setShowCelebration(true);
    } else {
      router.back();
    }
  };

  const openVideo = (exId: string) => {
    const name = getExName(exId);
    void Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${name} exercise`)}`);
  };

  const openImages = (exId: string) => {
    const name = getExName(exId);
    void Linking.openURL(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} exercise proper form technique`)}`);
  };

  const showAnyAction = exBtns.video || exBtns.image || exBtns.anatomy;

  if (!activeWorkout) {
    return (
      <View style={{ flex: 1, paddingTop: topInset, paddingBottom: bottomInset, backgroundColor: theme.bgPage, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text className="text-white font-bold text-base mb-4">No active workout.</Text>
        <Pressable onPress={() => router.back()} className="bg-blue-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Back</Text>
        </Pressable>
      </View>
    );
  }

  const reversedLogs = (activeWorkout.logs[currentEx] ?? []).slice().reverse();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgPage }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header — hidden in focus mode */}
        {!focusMode && <View style={{ paddingTop: topInset + 8 }} className="flex-row items-center justify-between px-4 pb-3 bg-slate-900/50 border-b border-slate-800">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Text className="text-white font-bold text-sm" numberOfLines={1} style={{ maxWidth: 220 }}>
              {activeWorkout.routineName}
            </Text>
          </View>
          <Pressable onPress={handleCancel} className="p-2">
            <X size={22} color="#94a3b8" />
          </Pressable>
        </View>}

        {/* Exercise pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, borderBottomWidth: 1, borderColor: '#1e293b' }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10, alignItems: 'center' }}
        >
          {routineExercises.map(ex => {
            const active = currentEx === ex;
            const count = (activeWorkout.logs[ex] ?? []).length;
            return (
              <Pressable
                key={ex}
                onPress={() => setSelectedExercise(ex)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, backgroundColor: active ? '#fff' : '#1e293b', borderColor: active ? '#fff' : '#334155' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: active ? '#0f172a' : '#cbd5e1' }}>
                  {getExName(ex)}
                </Text>
                {count > 0 && (
                  <View style={{ width: 18, height: 18, backgroundColor: '#10b981', borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{ width: 36, height: 36, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '700' }}>+</Text>
          </Pressable>
        </ScrollView>

        {/* Input card */}
        <View className="mx-4 mt-4 rounded-2xl p-5" style={{ backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-white text-2xl font-black flex-1 mr-3">{getExName(currentEx)}</Text>
            <View className="flex-row gap-2 mt-1">
              {/* Focus mode toggle — always shown */}
              <Pressable
                onPress={() => setFocusMode(f => !f)}
                hitSlop={6}
                style={{
                  padding: 8, borderRadius: 20,
                  backgroundColor: focusMode ? '#1d4ed820' : '#1e293b',
                  borderWidth: 1,
                  borderColor: focusMode ? '#3b82f6' : 'transparent',
                }}
              >
                <Zap size={16} color={focusMode ? '#3b82f6' : '#94a3b8'} />
              </Pressable>
            {showAnyAction && (
              <>
                {exBtns.video && (
                  <Pressable
                    onPress={() => openVideo(currentEx)}
                    hitSlop={6}
                    style={{ padding: 8, borderRadius: 20, backgroundColor: '#1e293b' }}
                  >
                    <Play size={16} color="#94a3b8" />
                  </Pressable>
                )}
                {exBtns.image && (
                  <Pressable
                    onPress={() => openImages(currentEx)}
                    hitSlop={6}
                    style={{ padding: 8, borderRadius: 20, backgroundColor: '#1e293b' }}
                  >
                    <Image size={16} color="#94a3b8" />
                  </Pressable>
                )}
                {exBtns.anatomy && (
                  <Pressable
                    onPress={() => setAnatomyExId(currentEx)}
                    hitSlop={6}
                    style={{ padding: 8, borderRadius: 20, backgroundColor: '#1e293b' }}
                  >
                    <Camera size={16} color="#94a3b8" />
                  </Pressable>
                )}
              </>
            )}
            </View>
          </View>
          <Text className="text-slate-500 text-sm uppercase font-bold tracking-wide mb-4">
            {getMuscleName(exInfo?.muscle ?? (isCardio ? 'Cardio' : ''))}
          </Text>

          {/* PR flash */}
          {prFlash && (
            <View className="flex-row items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 mb-3">
              <Text className="text-yellow-400 font-bold">🏆 {t('new_pr')}</Text>
            </View>
          )}

          {/* Weight + reps inputs */}
          <View className="flex-row gap-3 items-end">
            <View className="flex-1">
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                {isCardio ? t('level') : t('weight')}
              </Text>
              <TextInput
                style={{ height: focusMode ? 96 : 64 }}
                className="bg-slate-800 border border-slate-700 rounded-xl text-center text-3xl font-black text-white"
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#475569"
                value={weight}
                onChangeText={setWeight}
                returnKeyType="next"
              />
            </View>
            <View className="flex-1">
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                {isCardio ? t('time') : t('reps')}
              </Text>
              <TextInput
                style={{ height: focusMode ? 96 : 64 }}
                className="bg-slate-800 border border-slate-700 rounded-xl text-center text-3xl font-black text-white"
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#475569"
                value={reps}
                onChangeText={setReps}
                returnKeyType="done"
                onSubmitEditing={logSet}
              />
            </View>
            <Pressable
              onPress={logSet}
              disabled={!weight || !reps}
              style={{ width: 64, height: focusMode ? 96 : 64 }}
              className={`rounded-xl items-center justify-center ${!weight || !reps ? 'bg-slate-700' : 'bg-emerald-600'}`}
            >
              <Check size={26} color="#fff" />
            </Pressable>
          </View>

          {/* Rest timer */}
          {restRunning && (
            <View className="flex-row items-center mt-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <Text className="text-blue-400 font-bold font-mono text-lg mr-2">
                ⏱ {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
              </Text>
              <View className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden mx-2">
                <View
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(restSeconds / restTotal.current) * 100}%` }}
                />
              </View>
              <Pressable onPress={clearRest}>
                <Text className="text-slate-400 text-xs font-bold px-2">{t('skip')}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Sets log — hidden in focus mode */}
        <View className="flex-1 mx-4 mt-4" style={{ display: focusMode ? 'none' : 'flex' }}>
          <View className="flex-row justify-between items-center mb-2 px-1">
            <Text className="text-slate-500 text-sm font-bold uppercase tracking-wide">
              {t('sets_completed')}
            </Text>
            <Text className="text-emerald-500 text-xs font-bold">
              {(activeWorkout.logs[currentEx] ?? []).length}
            </Text>
          </View>

          {/* Undo toast */}
          {pendingDelete && (
            <View className="flex-row items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 mb-2">
              <Text className="text-slate-300 text-sm">{t('set_deleted')}</Text>
              <Pressable onPress={() => {
                clearTimeout(pendingDelete.timer);
                setPendingDelete(null);
              }}>
                <Text className="text-blue-400 font-bold text-sm">Undo</Text>
              </Pressable>
            </View>
          )}

          <FlatList
            data={reversedLogs}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
            renderItem={({ item: set, index: i }) => {
              const realIndex = reversedLogs.length - 1 - i;
              const isPending = pendingDelete?.exId === currentEx && pendingDelete?.index === realIndex;
              return (
                <View
                  className={`flex-row items-center justify-between p-4 rounded-xl border ${
                    set.isPR ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-slate-900 border-slate-700/50'
                  } ${isPending ? 'opacity-40' : ''}`}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-slate-500 font-mono text-base">#{realIndex + 1}</Text>
                    <Text className="text-white text-2xl font-black">{set.weight}</Text>
                    <Text className="text-slate-500 text-sm mr-2">{isCardio ? 'nvl' : 'kg'}</Text>
                    <Text className="text-white text-2xl font-black">{set.reps}</Text>
                    <Text className="text-slate-500 text-sm">{isCardio ? 'min' : 'reps'}</Text>
                    {set.isPR && <Text className="text-yellow-400">🏆</Text>}
                  </View>
                  <Pressable onPress={() => deleteSet(currentEx, realIndex)} className="p-2">
                    <Text className="text-slate-500 text-base">🗑️</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        </View>

        {/* Finish button — hidden in focus mode */}
        {!focusMode && <View style={{ paddingBottom: bottomInset + 20, paddingTop: 14, paddingHorizontal: 20, borderTopWidth: 1, borderColor: '#1e293b' }}>
          <Pressable
            onPress={handleFinish}
            style={{ backgroundColor: '#059669', paddingVertical: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <CircleCheck size={24} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{t('finish_workout')}</Text>
          </Pressable>
        </View>}
      </KeyboardAvoidingView>

      {/* Exercise picker modal */}
      <ExercisePicker
        visible={showPicker}
        allExercises={allExercises}
        excluded={routineExercises}
        lang={lang}
        onAdd={id => {
          if (activeWorkout) {
            setActiveWorkout({ ...activeWorkout, extraExercises: [...(activeWorkout.extraExercises ?? []), id] });
          }
          setSelectedExercise(id);
        }}
        onClose={() => setShowPicker(false)}
      />

      {/* Anatomy modal */}
      <AnatomyModal
        exerciseId={anatomyExId}
        allExercises={allExercises}
        lang={lang}
        onClose={() => setAnatomyExId(null)}
      />

      {/* Celebration modal — shown when weekly goal is met */}
      <CelebrationModal
        visible={showCelebration}
        lang={lang}
        weeklyGoal={weeklyGoal}
        onClose={() => { setShowCelebration(false); router.back(); }}
      />
    </View>
  );
}
