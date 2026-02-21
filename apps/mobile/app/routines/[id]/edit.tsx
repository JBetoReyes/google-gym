import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import type { Exercise } from '@shared/types/exercise';
import type { Routine } from '@shared/types/routine';
import type { Lang } from '@shared/types/user';
import RoutineForm from '../../../components/RoutineForm';
import { useStorage, type ExerciseButtons } from '../../../hooks/useStorage';

export default function EditRoutineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRoutines, saveRoutine, getCustomExercises, getPreferences, getExerciseButtons } = useStorage();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [exBtns, setExBtns] = useState<ExerciseButtons['routineForm']>({ video: true, image: false, anatomy: false });

  useEffect(() => {
    Promise.all([getRoutines(), getCustomExercises(), getPreferences(), getExerciseButtons()]).then(([routines, e, p, btns]) => {
      const found = routines.find(r => r.id === id) ?? null;
      setRoutine(found);
      setCustomExercises(e);
      setLang(p.lang);
      setExBtns(btns.routineForm);
    });
  }, [getRoutines, getCustomExercises, getPreferences, getExerciseButtons, id]);

  const allExercises = useMemo(() => [...EXERCISE_CATALOG, ...customExercises], [customExercises]);

  const handleSave = async (name: string, exercises: string[]) => {
    if (!routine) return;
    const updated: Routine = { ...routine, name, exercises };
    await saveRoutine(updated);
    router.back();
  };

  if (!routine) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <RoutineForm
      lang={lang}
      allExercises={allExercises}
      exerciseButtons={exBtns}
      initialName={routine.name}
      initialExercises={routine.exercises}
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
