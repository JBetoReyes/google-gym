/**
 * Shared routine creation / edit form.
 * Used by app/routines/new.tsx and app/routines/[id]/edit.tsx
 */
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Activity, Camera, Check, Dumbbell, Heart, Image, Layers, Play, Shield, Triangle, X, Zap } from 'lucide-react-native';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { MUSCLE_GROUPS } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise, MuscleGroup } from '@shared/types/exercise';
import type { Lang } from '@shared/types/user';
import AnatomyModal from './AnatomyModal';

const MUSCLE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Cardio:    { icon: Heart,     color: '#f43f5e', bg: '#f43f5e20' },
  Chest:     { icon: Shield,    color: '#3b82f6', bg: '#3b82f620' },
  Back:      { icon: Layers,    color: '#8b5cf6', bg: '#8b5cf620' },
  Legs:      { icon: Activity,  color: '#f97316', bg: '#f9731620' },
  Shoulders: { icon: Triangle,  color: '#06b6d4', bg: '#06b6d420' },
  Arms:      { icon: Dumbbell,  color: '#eab308', bg: '#eab30820' },
  Abs:       { icon: Zap,       color: '#10b981', bg: '#10b98120' },
};

interface ExBtns {
  video: boolean;
  image: boolean;
  anatomy: boolean;
}

interface Props {
  lang: Lang;
  allExercises: Exercise[];
  exerciseButtons?: ExBtns;
  initialName?: string;
  initialExercises?: string[];
  onSave: (name: string, exercises: string[]) => void;
  onCancel: () => void;
}

export default function RoutineForm({
  lang,
  allExercises,
  exerciseButtons = { video: true, image: false, anatomy: false },
  initialName = '',
  initialExercises = [],
  onSave,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialName);
  const [selected, setSelected] = useState<string[]>(initialExercises);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [tab, setTab] = useState<'exercises' | 'selected'>('exercises');
  const [showPicker, setShowPicker] = useState(false);
  const [anatomyExId, setAnatomyExId] = useState<string | null>(null);

  const showAnyAction = exerciseButtons.video || exerciseButtons.image || exerciseButtons.anatomy;

  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  };

  const getMuscleName = (m: MuscleGroup): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
    const muscles = dict.muscles as Record<string, string> | undefined;
    return muscles?.[m] ?? m;
  };

  const getExName = (id: string): string => {
    const ex = allExercises.find(e => e.id === id || e.name === id);
    return ex?.name ?? id;
  };

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const exName = getExName(ex.id).toLowerCase();
      const muscleName = getMuscleName(ex.muscle).toLowerCase();
      const matchSearch = !search || exName.includes(search.toLowerCase()) || muscleName.includes(search.toLowerCase());
      const matchMuscle = muscleFilter === 'all' || ex.muscle === muscleFilter;
      return matchSearch && matchMuscle;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allExercises, search, muscleFilter, lang]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const openVideo = (exId: string) => {
    const name = getExName(exId);
    void Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${name} exercise`)}`);
  };

  const openImages = (exId: string) => {
    const name = getExName(exId);
    void Linking.openURL(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} exercise proper form technique`)}`);
  };

  const canSave = name.trim().length > 0 && selected.length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Name input */}
      <View className="px-4 pt-6 pb-4">
        <TextInput
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white font-bold text-lg"
          placeholder={t('name_placeholder')}
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Tab toggle */}
      <View className="flex-row bg-slate-800 border border-slate-700 rounded-xl mx-4 p-1.5 mb-4">
        {(['exercises', 'selected'] as const).map(tabKey => (
          <Pressable
            key={tabKey}
            onPress={() => setTab(tabKey)}
            className={`flex-1 py-3 rounded-lg items-center ${tab === tabKey ? 'bg-slate-900' : ''}`}
          >
            <Text className={`text-base font-bold ${tab === tabKey ? 'text-white' : 'text-slate-400'}`}>
              {tabKey === 'exercises' ? t('tab_exercises') : `${t('selected')} (${selected.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'exercises' ? (
        <>
          {/* Search + muscle filter */}
          <View className="px-4 mb-4">
            <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 mb-2">
              <Text className="text-slate-400 mr-2">🔍</Text>
              <TextInput
                className="flex-1 py-3.5 text-white text-base"
                placeholder={t('search_placeholder')}
                placeholderTextColor="#64748b"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            {/* Muscle filter chips */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={['all', ...MUSCLE_GROUPS] as (string | MuscleGroup)[]}
              keyExtractor={m => m}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              renderItem={({ item: m }) => (
                <Pressable
                  onPress={() => setMuscleFilter(m)}
                  className={`px-4 py-2 rounded-full border ${
                    muscleFilter === m
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <Text className={`text-sm font-bold ${muscleFilter === m ? 'text-white' : 'text-slate-400'}`}>
                    {m === 'all' ? t('all') : getMuscleName(m as MuscleGroup)}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          {/* Exercise list */}
          <FlatList
            data={filteredExercises}
            keyExtractor={ex => ex.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
            renderItem={({ item: ex }) => {
              const isSelected = selected.includes(ex.id);
              const meta = MUSCLE_META[ex.muscle] ?? { icon: Dumbbell, color: '#64748b', bg: '#1e293b' };
              const IconComp = meta.icon;
              return (
                <Pressable
                  onPress={() => toggle(ex.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
                    borderWidth: 1,
                    backgroundColor: isSelected ? '#1d4ed820' : '#0f172a',
                    borderColor: isSelected ? '#3b82f6' : '#1e293b',
                  }}
                >
                  <View style={{
                    width: 46, height: 46, borderRadius: 23, marginRight: 14,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSelected ? '#2563eb' : meta.bg,
                  }}>
                    {isSelected
                      ? <Check size={22} color="#fff" />
                      : <IconComp size={22} color={meta.color} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: isSelected ? '#fff' : '#cbd5e1', marginBottom: 2 }}>
                      {getExName(ex.id)}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: isSelected ? '#93c5fd' : meta.color, textTransform: 'uppercase' }}>
                      {getMuscleName(ex.muscle)}
                    </Text>
                  </View>
                  {/* Action buttons */}
                  {showAnyAction && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                      {exerciseButtons.video && (
                        <Pressable
                          onPress={(e) => { e.stopPropagation?.(); openVideo(ex.id); }}
                          hitSlop={6}
                          style={{ padding: 7, borderRadius: 20, backgroundColor: '#1e293b' }}
                        >
                          <Play size={16} color="#94a3b8" />
                        </Pressable>
                      )}
                      {exerciseButtons.image && (
                        <Pressable
                          onPress={(e) => { e.stopPropagation?.(); openImages(ex.id); }}
                          hitSlop={6}
                          style={{ padding: 7, borderRadius: 20, backgroundColor: '#1e293b' }}
                        >
                          <Image size={16} color="#94a3b8" />
                        </Pressable>
                      )}
                      {exerciseButtons.anatomy && (
                        <Pressable
                          onPress={(e) => { e.stopPropagation?.(); setAnatomyExId(ex.id); }}
                          hitSlop={6}
                          style={{ padding: 7, borderRadius: 20, backgroundColor: '#1e293b' }}
                        >
                          <Camera size={16} color="#94a3b8" />
                        </Pressable>
                      )}
                    </View>
                  )}
                  {isSelected && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginLeft: showAnyAction ? 4 : 0 }}>
                      <Check size={13} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </>
      ) : selected.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500 text-base">{t('no_exercises_selected')}</Text>
        </View>
      ) : (
        <FlatList
          data={selected}
          keyExtractor={id => id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
          renderItem={({ item: id }) => {
            const ex = allExercises.find(e => e.id === id || e.name === id);
            const meta = MUSCLE_META[ex?.muscle ?? ''] ?? { icon: Dumbbell, color: '#64748b', bg: '#1e293b' };
            const IconComp = meta.icon;
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#3b82f680', borderRadius: 14, padding: 14 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, marginRight: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: meta.bg }}>
                  <IconComp size={22} color={meta.color} />
                </View>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, flex: 1 }}>{getExName(id)}</Text>
                <Pressable onPress={() => setSelected(prev => prev.filter(e => e !== id))} style={{ padding: 6 }}>
                  <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {/* Save + cancel buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 px-4 pt-4 pb-10 flex-row gap-3">
        <Pressable onPress={onCancel} className="flex-1 py-4 bg-slate-800 rounded-xl items-center">
          <Text className="text-slate-300 font-bold text-base">{t('cancel')}</Text>
        </Pressable>
        <Pressable
          onPress={() => canSave && onSave(name.trim(), selected)}
          className={`flex-1 py-4 rounded-xl items-center ${canSave ? 'bg-blue-600' : 'bg-slate-800'}`}
          disabled={!canSave}
        >
          <Text className={`font-bold text-base ${canSave ? 'text-white' : 'text-slate-500'}`}>
            {t('save_routine')} ({selected.length})
          </Text>
        </Pressable>
      </View>

      {/* Anatomy Modal */}
      <AnatomyModal
        exerciseId={anatomyExId}
        allExercises={allExercises}
        lang={lang}
        onClose={() => setAnatomyExId(null)}
      />
    </KeyboardAvoidingView>
  );
}
