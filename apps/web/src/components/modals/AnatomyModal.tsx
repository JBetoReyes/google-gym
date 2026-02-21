/**
 * AnatomyModal — interactive muscle diagram for a given exercise.
 * Shows front/back SVG body with primary (glowing) + secondary (dimmer) highlights.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SECONDARY_MUSCLES } from '@shared/constants/exercises';
import { MUSCLE_COLORS, FRONT_ACTIVE, BACK_ACTIVE } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise, MuscleGroup } from '@shared/types/exercise';
import type { Lang } from '@shared/types/user';
import { MuscleIcon } from '@/components/ui';
import { useStorage } from '@/hooks/useStorage';

// ── SVG body diagrams ─────────────────────────────────────────────────────────

interface BodySVGProps {
  muscle: MuscleGroup;
  color: string;
  secondary: MuscleGroup[];
}

function FrontBodySVG({ muscle, color, secondary }: BodySVGProps) {
  const active = FRONT_ACTIVE[muscle] ?? [];
  const dim = '#1e293b';
  const head = '#334155';
  const hasAny = active.length > 0;

  const c = (id: string): string => {
    if (active.includes(id)) return color;
    const secMuscle = secondary.find((sm) => (FRONT_ACTIVE[sm] ?? []).includes(id));
    if (secMuscle) return MUSCLE_COLORS[secMuscle] ?? '#64748b';
    return dim;
  };
  const o = (id: string): number => {
    if (active.includes(id) || secondary.some((sm) => (FRONT_ACTIVE[sm] ?? []).includes(id)))
      return 1;
    return 0.1;
  };
  const glow = (id: string): string | undefined =>
    active.includes(id) ? 'url(#glow-f)' : undefined;

  return (
    <svg width="130" height="270" viewBox="0 0 130 270" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-f" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Head */}
      <ellipse cx="65" cy="19" rx="14" ry="17" fill={head} opacity="0.7" />
      <rect x="60" y="34" width="10" height="8" rx="3" fill={head} opacity="0.5" />

      {/* Deltoids */}
      <ellipse cx="28" cy="62" rx="17" ry="11" fill={c('sh-l')} opacity={o('sh-l')} filter={glow('sh-l')} />
      <ellipse cx="102" cy="62" rx="17" ry="11" fill={c('sh-r')} opacity={o('sh-r')} filter={glow('sh-r')} />

      {/* Pecs */}
      <path d="M44 52 Q65 47 65 56 L63 90 Q52 95 40 90 Q35 75 40 58 Z"
        fill={c('chest-l')} opacity={o('chest-l')} filter={glow('chest-l')} />
      <path d="M86 52 Q65 47 65 56 L67 90 Q78 95 90 90 Q95 75 90 58 Z"
        fill={c('chest-r')} opacity={o('chest-r')} filter={glow('chest-r')} />

      {/* Abs — 6-block grid */}
      <g fill={c('abs')} opacity={o('abs')} filter={glow('abs')}>
        <rect x="49" y="94" width="13" height="15" rx="4" />
        <rect x="68" y="94" width="13" height="15" rx="4" />
        <rect x="49" y="112" width="13" height="15" rx="4" />
        <rect x="68" y="112" width="13" height="15" rx="4" />
        <rect x="50" y="130" width="12" height="13" rx="4" />
        <rect x="68" y="130" width="12" height="13" rx="4" />
      </g>

      {/* Hips */}
      <ellipse cx="65" cy="148" rx="28" ry="10" fill={dim} opacity="0.2" />

      {/* Biceps */}
      <path d="M13 56 Q8 76 10 102 Q14 108 22 106 Q26 80 24 56 Z"
        fill={c('arm-l')} opacity={o('arm-l')} filter={glow('arm-l')} />
      <path d="M117 56 Q122 76 120 102 Q116 108 108 106 Q104 80 106 56 Z"
        fill={c('arm-r')} opacity={o('arm-r')} filter={glow('arm-r')} />

      {/* Forearms */}
      <path d="M10 106 Q6 128 9 148 Q13 152 20 150 Q23 130 22 106 Z"
        fill={c('fore-l')} opacity={o('fore-l') * 0.9} filter={glow('fore-l')} />
      <path d="M120 106 Q124 128 121 148 Q117 152 110 150 Q107 130 108 106 Z"
        fill={c('fore-r')} opacity={o('fore-r') * 0.9} filter={glow('fore-r')} />

      {/* Quads */}
      <path d="M38 155 Q34 195 37 225 Q44 232 54 228 Q58 195 55 155 Z"
        fill={c('thigh-l')} opacity={o('thigh-l')} filter={glow('thigh-l')} />
      <path d="M92 155 Q96 195 93 225 Q86 232 76 228 Q72 195 75 155 Z"
        fill={c('thigh-r')} opacity={o('thigh-r')} filter={glow('thigh-r')} />

      {/* Calves */}
      <path d="M38 229 Q35 248 38 262 Q44 266 51 263 Q54 248 53 229 Z"
        fill={c('calf-l')} opacity={o('calf-l') * 0.85} filter={glow('calf-l')} />
      <path d="M92 229 Q95 248 92 262 Q86 266 79 263 Q76 248 77 229 Z"
        fill={c('calf-r')} opacity={o('calf-r') * 0.85} filter={glow('calf-r')} />

      {!hasAny && (
        <text x="65" y="155" textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">
          not targeted
        </text>
      )}
    </svg>
  );
}

function BackBodySVG({ muscle, color, secondary }: BodySVGProps) {
  const active = BACK_ACTIVE[muscle] ?? [];
  const dim = '#1e293b';
  const head = '#334155';
  const hasAny = active.length > 0;

  const c = (id: string): string => {
    if (active.includes(id)) return color;
    const secMuscle = secondary.find((sm) => (BACK_ACTIVE[sm] ?? []).includes(id));
    if (secMuscle) return MUSCLE_COLORS[secMuscle] ?? '#64748b';
    return dim;
  };
  const o = (id: string): number => {
    if (active.includes(id) || secondary.some((sm) => (BACK_ACTIVE[sm] ?? []).includes(id)))
      return 1;
    return 0.1;
  };
  const glow = (id: string): string | undefined =>
    active.includes(id) ? 'url(#glow-b)' : undefined;

  return (
    <svg width="130" height="270" viewBox="0 0 130 270" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-b" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Head (back) */}
      <ellipse cx="65" cy="19" rx="14" ry="17" fill={head} opacity="0.7" />
      <rect x="60" y="34" width="10" height="8" rx="3" fill={head} opacity="0.5" />

      {/* Rear deltoids */}
      <ellipse cx="28" cy="62" rx="17" ry="11" fill={c('sh-back-l')} opacity={o('sh-back-l')} filter={glow('sh-back-l')} />
      <ellipse cx="102" cy="62" rx="17" ry="11" fill={c('sh-back-r')} opacity={o('sh-back-r')} filter={glow('sh-back-r')} />

      {/* Traps */}
      <path d="M65 42 L82 56 L65 72 L48 56 Z"
        fill={c('trap-back')} opacity={o('trap-back')} filter={glow('trap-back')} />

      {/* Lats */}
      <path d="M42 56 Q38 72 38 90 Q42 106 52 112 Q60 108 64 96 Q58 80 52 62 Z"
        fill={c('back-l')} opacity={o('back-l')} filter={glow('back-l')} />
      <path d="M88 56 Q92 72 92 90 Q88 106 78 112 Q70 108 66 96 Q72 80 78 62 Z"
        fill={c('back-r')} opacity={o('back-r')} filter={glow('back-r')} />

      {/* Lower back / erectors (always dim) */}
      <rect x="55" y="112" width="20" height="30" rx="5" fill={dim} opacity="0.18" />

      {/* Triceps */}
      <path d="M13 56 Q8 76 11 102 Q15 108 23 106 Q26 80 25 56 Z"
        fill={c('tri-l')} opacity={o('tri-l')} filter={glow('tri-l')} />
      <path d="M117 56 Q122 76 119 102 Q115 108 107 106 Q104 80 105 56 Z"
        fill={c('tri-r')} opacity={o('tri-r')} filter={glow('tri-r')} />

      {/* Forearms (back) */}
      <path d="M11 106 Q7 128 10 148 Q14 152 21 150 Q24 130 23 106 Z"
        fill={c('fore-back-l')} opacity={o('fore-back-l') * 0.9} filter={glow('fore-back-l')} />
      <path d="M119 106 Q123 128 120 148 Q116 152 109 150 Q106 130 107 106 Z"
        fill={c('fore-back-r')} opacity={o('fore-back-r') * 0.9} filter={glow('fore-back-r')} />

      {/* Glutes */}
      <path d="M38 148 Q36 168 46 175 Q56 178 65 172 Q65 155 55 148 Z"
        fill={c('glute-l')} opacity={o('glute-l')} filter={glow('glute-l')} />
      <path d="M92 148 Q94 168 84 175 Q74 178 65 172 Q65 155 75 148 Z"
        fill={c('glute-r')} opacity={o('glute-r')} filter={glow('glute-r')} />

      {/* Hamstrings */}
      <path d="M38 178 Q34 208 38 228 Q45 234 54 230 Q57 208 55 178 Z"
        fill={c('ham-l')} opacity={o('ham-l')} filter={glow('ham-l')} />
      <path d="M92 178 Q96 208 92 228 Q85 234 76 230 Q73 208 75 178 Z"
        fill={c('ham-r')} opacity={o('ham-r')} filter={glow('ham-r')} />

      {/* Calves (back) */}
      <path d="M38 232 Q35 250 38 264 Q44 268 52 265 Q55 250 53 232 Z"
        fill={c('calf-back-l')} opacity={o('calf-back-l') * 0.85} filter={glow('calf-back-l')} />
      <path d="M92 232 Q95 250 92 264 Q86 268 78 265 Q75 250 77 232 Z"
        fill={c('calf-back-r')} opacity={o('calf-back-r') * 0.85} filter={glow('calf-back-r')} />

      {!hasAny && (
        <text x="65" y="155" textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">
          not targeted
        </text>
      )}
    </svg>
  );
}

// ── AnatomyModal ──────────────────────────────────────────────────────────────

interface Props {
  exerciseId: string | null;
  onClose: () => void;
}

export default function AnatomyModal({ exerciseId, onClose }: Props) {
  const { getCustomExercises, getPreferences } = useStorage();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    import('@shared/constants/exercises').then(({ EXERCISE_CATALOG }) => {
      getCustomExercises().then((custom) => setAllExercises([...EXERCISE_CATALOG, ...custom]));
    });
    getPreferences().then((p) => setLang(p.lang));
  }, [getCustomExercises, getPreferences]);

  const t = useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
      return dict[key] ?? key;
    },
    [lang],
  );

  const getMuscleName = useCallback(
    (muscle: string): string => {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
      const muscles = dict.muscles as Record<string, string> | undefined;
      return muscles?.[muscle] ?? muscle;
    },
    [lang],
  );

  if (!exerciseId) return null;

  const exInfo = allExercises.find((e) => e.id === exerciseId || e.name === exerciseId);
  const muscle = (exInfo?.muscle ?? 'Cardio') as MuscleGroup;
  const muscleColor = MUSCLE_COLORS[muscle] ?? '#64748b';
  const exName = (() => {
    if (!exInfo) return exerciseId;
    const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
    const exNames = dict.ex_names as Record<string, string> | undefined;
    return exNames?.[exInfo.id] ?? exInfo.name;
  })();

  const secondaryRaw = exInfo?.id ? SECONDARY_MUSCLES[exInfo.id] : undefined;
  const secondaryMuscles = secondaryRaw
    ? (secondaryRaw.split(',') as MuscleGroup[])
    : [];

  const defaultView: 'front' | 'back' = muscle === 'Back' ? 'back' : 'front';

  return (
    <AnatomyModalInner
      exName={exName}
      muscle={muscle}
      muscleColor={muscleColor}
      secondaryMuscles={secondaryMuscles}
      defaultView={defaultView}
      onClose={onClose}
      t={t}
      getMuscleName={getMuscleName}
    />
  );
}

// ── Inner stateful component (keeps hooks unconditional) ──────────────────────

interface InnerProps {
  exName: string;
  muscle: MuscleGroup;
  muscleColor: string;
  secondaryMuscles: MuscleGroup[];
  defaultView: 'front' | 'back';
  onClose: () => void;
  t: (key: string) => string;
  getMuscleName: (muscle: string) => string;
}

function AnatomyModalInner({
  exName,
  muscle,
  muscleColor,
  secondaryMuscles,
  defaultView,
  onClose,
  t,
  getMuscleName,
}: InnerProps) {
  const [view, setView] = useState<'front' | 'back'>(defaultView);

  const frontActive = (FRONT_ACTIVE[muscle] ?? []).length > 0;
  const backActive = (BACK_ACTIVE[muscle] ?? []).length > 0;
  const currentHasTarget = view === 'front' ? frontActive : backActive;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored accent bar + header */}
        <div className="relative p-5 pb-3">
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(to right, ${muscleColor}, ${muscleColor}55)` }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mt-1">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${muscleColor}20` }}>
              <MuscleIcon muscle={muscle} className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight truncate max-w-[200px]">
                {exName}
              </h3>
              <p className="text-sm font-bold" style={{ color: muscleColor }}>
                {getMuscleName(muscle)}
              </p>
            </div>
          </div>
        </div>

        {/* Front/Back toggle tabs */}
        <div className="flex gap-2 px-5 mb-3">
          {(['front', 'back'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                view === v
                  ? 'bg-slate-700 border-slate-500 text-white'
                  : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              {v === 'front' ? t('view_front') : t('view_back')}
            </button>
          ))}
        </div>

        {/* Diagram */}
        <div className="flex flex-col justify-center items-center py-2 bg-slate-950/40 min-h-[200px] relative">
          {view === 'front' ? (
            <FrontBodySVG muscle={muscle} color={muscleColor} secondary={secondaryMuscles} />
          ) : (
            <BackBodySVG muscle={muscle} color={muscleColor} secondary={secondaryMuscles} />
          )}
          {!currentHasTarget && (
            <p className="text-[10px] text-slate-600 italic mt-1">
              {view === 'front' ? t('view_front') : t('view_back')} — not targeted from this side
            </p>
          )}
        </div>

        {/* Primary + secondary muscle chips */}
        <div className="px-5 pt-3 pb-5 space-y-2">
          {/* Primary */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">
              {t('primary_muscle')}
            </span>
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${muscleColor}20`, color: muscleColor }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: muscleColor }} />
              {getMuscleName(muscle)}
            </span>
          </div>

          {/* Secondary */}
          {secondaryMuscles.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">
                {t('secondary_muscle')}
              </span>
              {secondaryMuscles.map((sm) => {
                const sc = MUSCLE_COLORS[sm] ?? '#64748b';
                return (
                  <span
                    key={sm}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${sc}18`, color: sc }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc }} />
                    {getMuscleName(sm)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
