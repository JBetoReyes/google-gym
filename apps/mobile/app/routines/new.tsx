import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import type { Exercise } from '@shared/types/exercise';
import type { Routine } from '@shared/types/routine';
import type { Lang } from '@shared/types/user';
import RoutineForm from '../../components/RoutineForm';
import { useStorage, type ExerciseButtons } from '../../hooks/useStorage';

export default function NewRoutineScreen() {
  const router = useRouter();
  const { saveRoutine, getCustomExercises, getPreferences, getExerciseButtons } = useStorage();
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [exBtns, setExBtns] = useState<ExerciseButtons['routineForm']>({ video: true, image: false, anatomy: false });

  useEffect(() => {
    Promise.all([getCustomExercises(), getPreferences(), getExerciseButtons()]).then(([e, p, btns]) => {
      setCustomExercises(e);
      setLang(p.lang);
      setExBtns(btns.routineForm);
    });
  }, [getCustomExercises, getPreferences, getExerciseButtons]);

  const allExercises = useMemo(() => [...EXERCISE_CATALOG, ...customExercises], [customExercises]);

  const handleSave = async (name: string, exercises: string[]) => {
    const routine: Routine = { id: Date.now().toString(), name, exercises };
    await saveRoutine(routine);
    router.back();
  };

  return (
    <RoutineForm
      lang={lang}
      allExercises={allExercises}
      exerciseButtons={exBtns}
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
