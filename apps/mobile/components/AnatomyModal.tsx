/**
 * AnatomyModal — interactive muscle diagram for a given exercise.
 * Shows front/back SVG body with primary (glowing) + secondary (dimmer) highlights.
 * React Native version of the web AnatomyModal, using react-native-svg.
 */
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, FeGaussianBlur, FeMerge, FeMergeNode, Filter, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { X } from 'lucide-react-native';
import { SECONDARY_MUSCLES } from '@shared/constants/exercises';
import { MUSCLE_COLORS, FRONT_ACTIVE, BACK_ACTIVE } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise, MuscleGroup } from '@shared/types/exercise';
import type { Lang } from '@shared/types/user';

// ── SVG helpers ───────────────────────────────────────────────────────────────

interface BodySVGProps {
  muscle: MuscleGroup;
  color: string;
  secondary: MuscleGroup[];
  view: 'front' | 'back';
}

function FrontBodySVG({ muscle, color, secondary }: Omit<BodySVGProps, 'view'>) {
  const active = FRONT_ACTIVE[muscle] ?? [];
  const dim = '#1e293b';
  const head = '#334155';

  const c = (id: string): string => {
    if (active.includes(id)) return color;
    const sm = secondary.find((s) => (FRONT_ACTIVE[s] ?? []).includes(id));
    if (sm) return MUSCLE_COLORS[sm] ?? '#64748b';
    return dim;
  };
  const o = (id: string): number => {
    if (active.includes(id) || secondary.some((s) => (FRONT_ACTIVE[s] ?? []).includes(id))) return 1;
    return 0.1;
  };
  const glow = (id: string): string =>
    active.includes(id) ? 'url(#gf)' : '';

  return (
    <Svg width={130} height={270} viewBox="0 0 130 270">
      <Defs>
        <Filter id="gf" x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur stdDeviation="3" result="blur" />
          <FeMerge>
            <FeMergeNode in="blur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>

      {/* Head */}
      <Ellipse cx="65" cy="19" rx="14" ry="17" fill={head} opacity="0.7" />
      <Rect x="60" y="34" width="10" height="8" rx="3" fill={head} opacity="0.5" />

      {/* Deltoids */}
      <Ellipse cx="28" cy="62" rx="17" ry="11" fill={c('sh-l')} opacity={o('sh-l')} filter={glow('sh-l')} />
      <Ellipse cx="102" cy="62" rx="17" ry="11" fill={c('sh-r')} opacity={o('sh-r')} filter={glow('sh-r')} />

      {/* Pecs */}
      <Path d="M44 52 Q65 47 65 56 L63 90 Q52 95 40 90 Q35 75 40 58 Z"
        fill={c('chest-l')} opacity={o('chest-l')} filter={glow('chest-l')} />
      <Path d="M86 52 Q65 47 65 56 L67 90 Q78 95 90 90 Q95 75 90 58 Z"
        fill={c('chest-r')} opacity={o('chest-r')} filter={glow('chest-r')} />

      {/* Abs */}
      <G fill={c('abs')} opacity={o('abs')} filter={glow('abs')}>
        <Rect x="49" y="94" width="13" height="15" rx="4" />
        <Rect x="68" y="94" width="13" height="15" rx="4" />
        <Rect x="49" y="112" width="13" height="15" rx="4" />
        <Rect x="68" y="112" width="13" height="15" rx="4" />
        <Rect x="50" y="130" width="12" height="13" rx="4" />
        <Rect x="68" y="130" width="12" height="13" rx="4" />
      </G>

      {/* Hips */}
      <Ellipse cx="65" cy="148" rx="28" ry="10" fill={dim} opacity="0.2" />

      {/* Biceps */}
      <Path d="M13 56 Q8 76 10 102 Q14 108 22 106 Q26 80 24 56 Z"
        fill={c('arm-l')} opacity={o('arm-l')} filter={glow('arm-l')} />
      <Path d="M117 56 Q122 76 120 102 Q116 108 108 106 Q104 80 106 56 Z"
        fill={c('arm-r')} opacity={o('arm-r')} filter={glow('arm-r')} />

      {/* Forearms */}
      <Path d="M10 106 Q6 128 9 148 Q13 152 20 150 Q23 130 22 106 Z"
        fill={c('fore-l')} opacity={o('fore-l') * 0.9} filter={glow('fore-l')} />
      <Path d="M120 106 Q124 128 121 148 Q117 152 110 150 Q107 130 108 106 Z"
        fill={c('fore-r')} opacity={o('fore-r') * 0.9} filter={glow('fore-r')} />

      {/* Quads */}
      <Path d="M38 155 Q34 195 37 225 Q44 232 54 228 Q58 195 55 155 Z"
        fill={c('thigh-l')} opacity={o('thigh-l')} filter={glow('thigh-l')} />
      <Path d="M92 155 Q96 195 93 225 Q86 232 76 228 Q72 195 75 155 Z"
        fill={c('thigh-r')} opacity={o('thigh-r')} filter={glow('thigh-r')} />

      {/* Calves */}
      <Path d="M38 229 Q35 248 38 262 Q44 266 51 263 Q54 248 53 229 Z"
        fill={c('calf-l')} opacity={o('calf-l') * 0.85} filter={glow('calf-l')} />
      <Path d="M92 229 Q95 248 92 262 Q86 266 79 263 Q76 248 77 229 Z"
        fill={c('calf-r')} opacity={o('calf-r') * 0.85} filter={glow('calf-r')} />

      {active.length === 0 && (
        <SvgText x="65" y="155" textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">
          not targeted
        </SvgText>
      )}
    </Svg>
  );
}

function BackBodySVG({ muscle, color, secondary }: Omit<BodySVGProps, 'view'>) {
  const active = BACK_ACTIVE[muscle] ?? [];
  const dim = '#1e293b';
  const head = '#334155';

  const c = (id: string): string => {
    if (active.includes(id)) return color;
    const sm = secondary.find((s) => (BACK_ACTIVE[s] ?? []).includes(id));
    if (sm) return MUSCLE_COLORS[sm] ?? '#64748b';
    return dim;
  };
  const o = (id: string): number => {
    if (active.includes(id) || secondary.some((s) => (BACK_ACTIVE[s] ?? []).includes(id))) return 1;
    return 0.1;
  };
  const glow = (id: string): string =>
    active.includes(id) ? 'url(#gb)' : '';

  return (
    <Svg width={130} height={270} viewBox="0 0 130 270">
      <Defs>
        <Filter id="gb" x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur stdDeviation="3" result="blur" />
          <FeMerge>
            <FeMergeNode in="blur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>

      {/* Head */}
      <Ellipse cx="65" cy="19" rx="14" ry="17" fill={head} opacity="0.7" />
      <Rect x="60" y="34" width="10" height="8" rx="3" fill={head} opacity="0.5" />

      {/* Rear deltoids */}
      <Ellipse cx="28" cy="62" rx="17" ry="11" fill={c('sh-back-l')} opacity={o('sh-back-l')} filter={glow('sh-back-l')} />
      <Ellipse cx="102" cy="62" rx="17" ry="11" fill={c('sh-back-r')} opacity={o('sh-back-r')} filter={glow('sh-back-r')} />

      {/* Traps */}
      <Path d="M65 42 L82 56 L65 72 L48 56 Z"
        fill={c('trap-back')} opacity={o('trap-back')} filter={glow('trap-back')} />

      {/* Lats */}
      <Path d="M42 56 Q38 72 38 90 Q42 106 52 112 Q60 108 64 96 Q58 80 52 62 Z"
        fill={c('back-l')} opacity={o('back-l')} filter={glow('back-l')} />
      <Path d="M88 56 Q92 72 92 90 Q88 106 78 112 Q70 108 66 96 Q72 80 78 62 Z"
        fill={c('back-r')} opacity={o('back-r')} filter={glow('back-r')} />

      {/* Lower back */}
      <Rect x="55" y="112" width="20" height="30" rx="5" fill={dim} opacity="0.18" />

      {/* Triceps */}
      <Path d="M13 56 Q8 76 11 102 Q15 108 23 106 Q26 80 25 56 Z"
        fill={c('tri-l')} opacity={o('tri-l')} filter={glow('tri-l')} />
      <Path d="M117 56 Q122 76 119 102 Q115 108 107 106 Q104 80 105 56 Z"
        fill={c('tri-r')} opacity={o('tri-r')} filter={glow('tri-r')} />

      {/* Forearms back */}
      <Path d="M11 106 Q7 128 10 148 Q14 152 21 150 Q24 130 23 106 Z"
        fill={c('fore-back-l')} opacity={o('fore-back-l') * 0.9} filter={glow('fore-back-l')} />
      <Path d="M119 106 Q123 128 120 148 Q116 152 109 150 Q106 130 107 106 Z"
        fill={c('fore-back-r')} opacity={o('fore-back-r') * 0.9} filter={glow('fore-back-r')} />

      {/* Glutes */}
      <Path d="M38 148 Q36 168 46 175 Q56 178 65 172 Q65 155 55 148 Z"
        fill={c('glute-l')} opacity={o('glute-l')} filter={glow('glute-l')} />
      <Path d="M92 148 Q94 168 84 175 Q74 178 65 172 Q65 155 75 148 Z"
        fill={c('glute-r')} opacity={o('glute-r')} filter={glow('glute-r')} />

      {/* Hamstrings */}
      <Path d="M38 178 Q34 208 38 228 Q45 234 54 230 Q57 208 55 178 Z"
        fill={c('ham-l')} opacity={o('ham-l')} filter={glow('ham-l')} />
      <Path d="M92 178 Q96 208 92 228 Q85 234 76 230 Q73 208 75 178 Z"
        fill={c('ham-r')} opacity={o('ham-r')} filter={glow('ham-r')} />

      {/* Calves back */}
      <Path d="M38 232 Q35 250 38 264 Q44 268 52 265 Q55 250 53 232 Z"
        fill={c('calf-back-l')} opacity={o('calf-back-l') * 0.85} filter={glow('calf-back-l')} />
      <Path d="M92 232 Q95 250 92 264 Q86 268 78 265 Q75 250 77 232 Z"
        fill={c('calf-back-r')} opacity={o('calf-back-r') * 0.85} filter={glow('calf-back-r')} />

      {active.length === 0 && (
        <SvgText x="65" y="155" textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">
          not targeted
        </SvgText>
      )}
    </Svg>
  );
}

// ── AnatomyModal ──────────────────────────────────────────────────────────────

interface Props {
  exerciseId: string | null;
  allExercises: Exercise[];
  lang: Lang;
  onClose: () => void;
}

export default function AnatomyModal({ exerciseId, allExercises, lang, onClose }: Props) {
  const [view, setView] = useState<'front' | 'back'>('front');

  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  };
  const getMuscleName = (m: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
    const muscles = dict.muscles as Record<string, string> | undefined;
    return muscles?.[m] ?? m;
  };

  const exInfo = exerciseId
    ? allExercises.find((e) => e.id === exerciseId || e.name === exerciseId)
    : null;
  const muscle = (exInfo?.muscle ?? 'Cardio') as MuscleGroup;
  const muscleColor = MUSCLE_COLORS[muscle] ?? '#64748b';
  const exName = (() => {
    if (!exInfo) return exerciseId ?? '';
    const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
    const exNames = dict.ex_names as Record<string, string> | undefined;
    return exNames?.[exInfo.id] ?? exInfo.name;
  })();

  const secondaryRaw = exInfo?.id ? SECONDARY_MUSCLES[exInfo.id] : undefined;
  const secondaryMuscles: MuscleGroup[] = secondaryRaw
    ? (secondaryRaw.split(',') as MuscleGroup[])
    : [];

  const defaultView: 'front' | 'back' = muscle === 'Back' ? 'back' : 'front';
  // Set default view when exerciseId changes
  React.useEffect(() => {
    setView(defaultView);
  }, [exerciseId, defaultView]);

  const currentHasTarget =
    view === 'front'
      ? (FRONT_ACTIVE[muscle] ?? []).length > 0
      : (BACK_ACTIVE[muscle] ?? []).length > 0;

  return (
    <Modal
      visible={exerciseId !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-900">
        {/* Colored accent bar */}
        <View style={{ height: 3, backgroundColor: muscleColor }} />

        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1 mr-3">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${muscleColor}20` }}
            >
              <Text style={{ fontSize: 18 }}>💪</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-base leading-tight" numberOfLines={1}>
                {exName}
              </Text>
              <Text className="text-sm font-bold" style={{ color: muscleColor }}>
                {getMuscleName(muscle)}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} className="p-2">
            <X size={20} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Front/Back toggle */}
        <View className="flex-row gap-2 px-5 mb-3">
          {(['front', 'back'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              className={`flex-1 py-2 rounded-lg border items-center ${
                view === v
                  ? 'bg-slate-700 border-slate-500'
                  : 'border-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-bold ${view === v ? 'text-white' : 'text-slate-500'}`}
              >
                {v === 'front' ? t('view_front') : t('view_back')}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Body diagram */}
        <View
          className="items-center justify-center py-4 mx-5 rounded-2xl"
          style={{ backgroundColor: 'rgba(2,6,23,0.4)' }}
        >
          {view === 'front' ? (
            <FrontBodySVG muscle={muscle} color={muscleColor} secondary={secondaryMuscles} />
          ) : (
            <BackBodySVG muscle={muscle} color={muscleColor} secondary={secondaryMuscles} />
          )}
          {!currentHasTarget && (
            <Text className="text-xs text-slate-600 italic mt-1">
              {view === 'front' ? t('view_front') : t('view_back')} — not targeted from this side
            </Text>
          )}
        </View>

        {/* Muscle chips */}
        <ScrollView className="px-5 pt-4">
          {/* Primary */}
          <View className="flex-row items-center gap-2 flex-wrap mb-3">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
              {t('primary_muscle')}
            </Text>
            <View
              className="flex-row items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ backgroundColor: `${muscleColor}20` }}
            >
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: muscleColor }} />
              <Text className="text-xs font-bold" style={{ color: muscleColor }}>
                {getMuscleName(muscle)}
              </Text>
            </View>
          </View>

          {/* Secondary */}
          {secondaryMuscles.length > 0 && (
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
                {t('secondary_muscle')}
              </Text>
              {secondaryMuscles.map((sm) => {
                const sc = MUSCLE_COLORS[sm] ?? '#64748b';
                return (
                  <View
                    key={sm}
                    className="flex-row items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${sc}18` }}
                  >
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: sc }} />
                    <Text className="text-xs font-bold" style={{ color: sc }}>
                      {getMuscleName(sm)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
