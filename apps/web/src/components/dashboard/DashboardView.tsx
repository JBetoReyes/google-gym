/**
 * DashboardView — weekly goal ring, stat cards, charts.
 * Premium gate: ChartSlider (all 5 charts) only for premium users.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ChevronLeft, ChevronRight, Clock, Dumbbell,
  Settings, Target, TrendingUp, Trophy,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { MUSCLE_COLORS } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Lang } from '@shared/types/user';
import type { Exercise, MuscleGroup } from '@shared/types/exercise';
import type { Session } from '@shared/types/session';
import { STORAGE_KEYS } from '@shared/utils/storage';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useLayout } from '@/context/LayoutContext';
import { useStorage } from '@/hooks/useStorage';

// ── Helper ─────────────────────────────────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

const tooltipStyle = { backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' };

// ── Sub-charts ─────────────────────────────────────────────────────────────────
const VolumeChart = React.memo(function VolumeChart({
  data,
}: {
  data: { date: string; volumen: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="volumen" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
});

const DurationChart = React.memo(function DurationChart({
  data,
}: {
  data: { date: string; duration: number }[];
}) {
  const avg =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + (d.duration || 0), 0) / data.length)
      : 0;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          wrapperStyle={{ outline: 'none' }}
          cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        {avg > 0 && (
          <ReferenceLine
            y={avg}
            stroke="#8b5cf6"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: `avg ${avg}min`, position: 'insideTopRight', fill: '#a78bfa', fontSize: 9 }}
          />
        )}
        <Area
          type="monotone"
          dataKey="duration"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          fill="url(#durGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#8b5cf6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

const SetsChart = React.memo(function SetsChart({
  data,
}: {
  data: { date: string; sets: number }[];
}) {
  const avg =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + (d.sets || 0), 0) / data.length)
      : 0;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="setsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          wrapperStyle={{ outline: 'none' }}
          cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        {avg > 0 && (
          <ReferenceLine
            y={avg}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: `avg ${avg}`, position: 'insideTopRight', fill: '#6ee7b7', fontSize: 9 }}
          />
        )}
        <Area
          type="monotone"
          dataKey="sets"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#setsGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#10b981' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

const RANGE_WEEKS: Record<string, number> = { '1W': 1, '1M': 4, '6M': 26, '1Y': 52 };
const RANGE_LABEL_KEY: Record<string, string> = {
  '1W': 'this_week', '1M': 'this_month', '6M': 'range_6m', '1Y': 'this_year',
};

const GoalRingChart = React.memo(function GoalRingChart({
  rangedCount,
  weeklyGoal,
  chartRange,
  t,
}: {
  rangedCount: number;
  weeklyGoal: number;
  chartRange: string;
  t: (k: string) => string;
}) {
  const weeks = RANGE_WEEKS[chartRange] ?? 1;
  const rangeGoal = weeklyGoal * weeks;
  const rangeLabel = t(RANGE_LABEL_KEY[chartRange] ?? 'this_week');
  const pct = Math.min(rangedCount / Math.max(rangeGoal, 1), 1);
  const done = pct >= 1;
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;
  const gap = circumference - dash;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ height: '100%', aspectRatio: '1', maxWidth: '100%' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-input)" strokeWidth="10" transform="rotate(-90 50 50)" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={done ? 'var(--success)' : 'var(--accent)'}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <text x="50" y="44" textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary)" fontSize="20" fontWeight="900" fontFamily="inherit">
            {rangedCount}
          </text>
          <text x="50" y="58" textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize="8" fontFamily="inherit">
            / {rangeGoal} {t('sessions_label')}
          </text>
          <text x="50" y="69" textAnchor="middle" dominantBaseline="middle" fill={done ? 'var(--success)' : 'var(--accent)'} fontSize="7" fontWeight="700" fontFamily="inherit">
            {rangeLabel}
          </text>
        </svg>
      </div>
    </div>
  );
});

const MuscleChart = React.memo(function MuscleChart({
  data,
  setsLabel,
}: {
  data: { name: string; id: string; value: number }[];
  setsLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
          {data.map((entry) => (
            <Cell key={entry.id} fill={MUSCLE_COLORS[entry.id as MuscleGroup] || '#64748b'} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} ${setsLabel}`, n]} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
});

// ── Chart slide wrapper ────────────────────────────────────────────────────────
const ChartSlide = React.memo(function ChartSlide({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full shrink-0 snap-center">
      <p className="text-xs font-bold text-slate-400 uppercase mb-2">{title}</p>
      <div className="h-44">{children}</div>
    </div>
  );
});

// ── Stats type ─────────────────────────────────────────────────────────────────
interface Stats {
  totalWorkouts: number;
  totalSets: number;
  uniqueDaysCount: number;
  rangedUniqueDaysCount: number;
  weekDays: Date[];
  uniqueDaysSet: Set<string>;
  volumeData: { date: string; volumen: number }[];
  durationData: { date: string; duration: number }[];
  setsData: { date: string; sets: number }[];
  muscleData: { name: string; id: string; value: number }[];
  avgDuration: number;
  totalHoursStr: string;
  favExId: string | null;
  streak: number;
}

// ── ChartSlider ────────────────────────────────────────────────────────────────
const CHART_LABELS_KEY = ['chart_freq', 'chart_muscle', 'chart_volume', 'chart_duration', 'chart_sets'];

const ChartSlider = React.memo(function ChartSlider({
  stats,
  chartRange,
  setChartRange,
  weeklyGoal,
  t,
}: {
  stats: Stats;
  chartRange: string;
  setChartRange: (r: string) => void;
  weeklyGoal: number;
  t: (k: string) => string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const labels = CHART_LABELS_KEY.map((k) => t(k));
  const setsLabel = t('chart_sets').toLowerCase();

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const idx = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth);
    setActiveIndex(idx);
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={20} /> {t('progress')}
        </h3>
        <div className="flex gap-1">
          {['1W', '1M', '6M', '1Y'].map((r) => (
            <button
              key={r}
              onClick={() => setChartRange(r)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                chartRange === r
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: horizontal scroll-snap */}
      <div className="relative lg:hidden">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 no-scrollbar overscroll-x-contain"
          style={{ touchAction: 'pan-x pan-y' }}
          onScroll={handleScroll}
        >
          <ChartSlide title={t('chart_freq')}>
            <GoalRingChart rangedCount={stats.rangedUniqueDaysCount} weeklyGoal={weeklyGoal} chartRange={chartRange} t={t} />
          </ChartSlide>
          <ChartSlide title={t('chart_muscle')}>
            <MuscleChart data={stats.muscleData} setsLabel={setsLabel} />
          </ChartSlide>
          <ChartSlide title={t('chart_volume')}>
            <VolumeChart data={stats.volumeData} />
          </ChartSlide>
          <ChartSlide title={t('chart_duration')}>
            <DurationChart data={stats.durationData} />
          </ChartSlide>
          <ChartSlide title={t('chart_sets')}>
            <SetsChart data={stats.setsData} />
          </ChartSlide>
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-[var(--bg-card)] to-transparent pointer-events-none rounded-r-xl" />
        <div className="flex justify-center gap-1.5 mt-2">
          {labels.map((label, i) => (
            <div
              key={i}
              title={label}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === i ? 'w-4 bg-[var(--accent)]' : 'w-1.5 bg-[var(--bg-input)]'}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('chart_volume')}</p>
          <div className="h-52"><VolumeChart data={stats.volumeData} /></div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('chart_duration')}</p>
          <div className="h-52"><DurationChart data={stats.durationData} /></div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('chart_sets')}</p>
          <div className="h-52"><SetsChart data={stats.setsData} /></div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('chart_freq')}</p>
          <div className="h-52">
            <GoalRingChart rangedCount={stats.rangedUniqueDaysCount} weeklyGoal={weeklyGoal} chartRange={chartRange} t={t} />
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('chart_muscle')}</p>
          <div className="h-52"><MuscleChart data={stats.muscleData} setsLabel={setsLabel} /></div>
        </div>
      </div>
    </Card>
  );
});

// ── Main component ─────────────────────────────────────────────────────────────
export default function DashboardView() {
  const { plan } = useAuth();
  const { openSettings, openUpgrade } = useLayout();
  const { getSessions, getCustomExercises, getPreferences, savePreferences } = useStorage();

  const [history, setHistory] = useState<Session[]>([]);
  const [weeklyGoal, setWeeklyGoalState] = useState(4);
  const [lang, setLangState] = useState<Lang>('en');
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [chartRange, setChartRange] = useState('1M');
  const statsScrollRef = useRef<HTMLDivElement>(null);

  const t = useCallback((key: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  }, [lang]);

  // Load data on mount
  useEffect(() => {
    getSessions().then(setHistory);
    getCustomExercises().then(setCustomExercises);
    getPreferences().then((p) => {
      setWeeklyGoalState(p.weeklyGoal);
      setLangState(p.lang);
    });
  }, [getSessions, getCustomExercises, getPreferences]);

  const setWeeklyGoal = useCallback((val: number) => {
    setWeeklyGoalState(val);
    savePreferences({ weeklyGoal: val });
  }, [savePreferences]);

  const allExercises = useMemo(
    () => [...EXERCISE_CATALOG, ...customExercises],
    [customExercises],
  );

  const getExName = useCallback((idOrName: string): string => {
    const entry = allExercises.find((e) => e.id === idOrName || e.name === idOrName);
    if (entry) {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
      const exNames = dict.ex_names as Record<string, string> | undefined;
      return exNames?.[entry.id] ?? entry.name;
    }
    return idOrName;
  }, [allExercises, lang]);

  const stats = useMemo((): Stats => {
    const now = new Date();
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }

    const startOfWeek = weekDays[0]!.getTime();
    const endOfWeek = new Date(weekDays[6]!).setHours(23, 59, 59, 999);

    const thisWeekSessions = history.filter((s) => {
      const sDate = new Date(s.date).getTime();
      return sDate >= startOfWeek && sDate <= endOfWeek;
    });

    const uniqueDaysSet = new Set(thisWeekSessions.map((s) => new Date(s.date).toDateString()));
    const uniqueDaysCount = uniqueDaysSet.size;

    const totalWorkouts = history.length;
    const totalSets = history.reduce((acc, session) => {
      let sets = 0;
      Object.values(session.logs).forEach((exLogs) => (sets += exLogs.length));
      return acc + sets;
    }, 0);

    const rangeDays: Record<string, number> = { '1W': 7, '1M': 30, '6M': 180, '1Y': 365 };
    const cutoff = new Date(Date.now() - (rangeDays[chartRange] ?? 30) * 86400000);
    const rangedHistory = history.filter((s) => new Date(s.date) >= cutoff);
    const rangedUniqueDaysCount = new Set(rangedHistory.map((s) => new Date(s.date).toDateString())).size;

    const localeStr = lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US';

    const volumeData = rangedHistory.map((session) => {
      let volume = 0;
      Object.entries(session.logs).forEach(([exId, exLogs]) => {
        const catInfo = EXERCISE_CATALOG.find((c) => c.id === exId || c.name === exId);
        if (catInfo?.muscle === 'Cardio') return;
        exLogs.forEach((set) => (volume += (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0)));
      });
      return {
        date: new Date(session.date).toLocaleDateString(localeStr, { day: 'numeric', month: 'short' }),
        volumen: Math.round(volume),
      };
    });

    const durationData = rangedHistory.map((s) => ({
      date: new Date(s.date).toLocaleDateString(localeStr, { day: 'numeric', month: 'short' }),
      duration: s.duration || 0,
    }));

    const setsData = rangedHistory.map((s) => ({
      date: new Date(s.date).toLocaleDateString(localeStr, { day: 'numeric', month: 'short' }),
      sets: Object.values(s.logs).reduce((acc, arr) => acc + arr.length, 0),
    }));

    const muscleCount: Record<string, number> = {};
    rangedHistory.forEach((s) => {
      Object.entries(s.logs).forEach(([exId, exLogs]) => {
        const ex = allExercises.find((e) => e.id === exId || e.name === exId);
        if (ex) muscleCount[ex.muscle] = (muscleCount[ex.muscle] || 0) + exLogs.length;
      });
    });
    const langDict = TRANSLATIONS[lang] as unknown as Record<string, unknown>;
    const musclesMap = langDict.muscles as Record<string, string> | undefined;
    const muscleData = Object.entries(muscleCount)
      .map(([key, value]) => ({ name: musclesMap?.[key] ?? key, id: key, value }))
      .sort((a, b) => b.value - a.value);

    const avgDuration =
      history.length > 0
        ? Math.round(history.reduce((sum, s) => sum + (s.duration || 0), 0) / history.length)
        : 0;

    const totalMinutes = history.reduce((sum, s) => sum + (s.duration || 0), 0);
    const minLbl = (langDict.min_label as string) || 'min';
    const totalHoursStr =
      totalMinutes < 60 ? `${totalMinutes} ${minLbl}` : `${(totalMinutes / 60).toFixed(1)}h`;

    const setsPerEx: Record<string, number> = {};
    history.forEach((s) =>
      Object.entries(s.logs).forEach(([id, arr]) => {
        setsPerEx[id] = (setsPerEx[id] || 0) + arr.length;
      }),
    );
    const favExId = Object.entries(setsPerEx).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Streak: consecutive weeks meeting weeklyGoal
    let streak = 0;
    let checkMon = new Date(monday);
    for (let i = 0; i < 52; i++) {
      const wEnd = new Date(checkMon);
      wEnd.setDate(checkMon.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);
      const wSessions = history.filter((s) => {
        const d = new Date(s.date).getTime();
        return d >= checkMon.getTime() && d <= wEnd.getTime();
      });
      const uniqueDaysW = new Set(wSessions.map((s) => new Date(s.date).toDateString())).size;
      if (uniqueDaysW >= weeklyGoal) {
        streak++;
        checkMon = new Date(checkMon);
        checkMon.setDate(checkMon.getDate() - 7);
      } else break;
    }

    return {
      totalWorkouts, totalSets, volumeData, uniqueDaysCount, rangedUniqueDaysCount, weekDays,
      uniqueDaysSet, durationData, setsData, muscleData,
      avgDuration, totalHoursStr, favExId, streak,
    };
  }, [history, lang, weeklyGoal, chartRange, allExercises]);

  const dayNames = lang === 'es' || lang === 'fr'
    ? ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const statItems: { icon: React.ElementType; label: string; value: string | number; unit?: string; small?: boolean }[] = [
    { icon: Activity, label: t('total_workouts'), value: stats.totalWorkouts },
    { icon: Dumbbell, label: t('total_sets'), value: stats.totalSets },
    { icon: Clock, label: t('avg_duration'), value: stats.avgDuration, unit: t('min_label') },
    { icon: Clock, label: t('total_time'), value: stats.totalHoursStr },
    { icon: Trophy, label: t('streak'), value: stats.streak, unit: t('weeks_label') },
    { icon: Dumbbell, label: t('fav_exercise'), value: stats.favExId ? getExName(stats.favExId) : '—', small: true },
  ];

  return (
    <div className="animate-in fade-in zoom-in duration-300 space-y-6">

      {/* Settings button — mobile only */}
      <div className="flex justify-end pt-4 lg:hidden">
        <button
          onClick={openSettings}
          className="p-2 bg-[var(--bg-card)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)]"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* ── Row 1: Goal card + stat cards ────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[380px_1fr] lg:gap-6 lg:items-stretch space-y-6 lg:space-y-0">

        {/* Weekly goal card */}
        <Card className="p-6 border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="text-[var(--accent)]" size={24} />
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{t('weekly_goal')}</h3>
              </div>
              <p className="text-[var(--text-muted)] text-sm">
                {stats.uniqueDaysCount} / {weeklyGoal} {t('workouts_completed')}
              </p>
            </div>
            <div className="flex items-center bg-[var(--bg-input)] rounded-lg p-1 border border-[var(--border)]">
              <button
                onClick={() => setWeeklyGoal(Math.max(1, weeklyGoal - 1))}
                className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors active:scale-90"
              >
                <span className="text-lg font-bold">−</span>
              </button>
              <span className="w-8 text-center font-bold text-[var(--text-primary)]">{weeklyGoal}</span>
              <button
                onClick={() => setWeeklyGoal(Math.min(7, weeklyGoal + 1))}
                className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors active:scale-90"
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[var(--bg-input)] h-3 rounded-full overflow-hidden mb-6 border border-[var(--border)]">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((stats.uniqueDaysCount / weeklyGoal) * 100, 100)}%`, background: 'linear-gradient(to right, var(--accent), var(--success))' }}
            />
          </div>

          {/* Day-of-week dots */}
          <div className="flex justify-between items-center px-1">
            {stats.weekDays.map((date, idx) => {
              const dayLetter = dayNames[date.getDay()];
              const dayNumber = date.getDate();
              const isToday = new Date().toDateString() === date.toDateString();
              const isDone = stats.uniqueDaysSet.has(date.toDateString());
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-muted)]">{dayLetter}</span>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      isDone
                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_10px_var(--accent)/30]'
                        : isToday
                        ? 'bg-transparent border-[var(--accent)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    {dayNumber}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Stat cards — mobile: horizontal scroll */}
        <div className="relative lg:hidden">
          <button
            onClick={() => statsScrollRef.current?.scrollBy({ left: -312, behavior: 'smooth' })}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-input)] text-[var(--text-secondary)] rounded-full p-1 shadow-lg"
          >
            <ChevronLeft size={14} />
          </button>
          <div
            ref={statsScrollRef}
            className="flex overflow-x-auto snap-x snap-proximity gap-3 pb-1 no-scrollbar px-6 overscroll-x-contain"
            style={{ touchAction: 'pan-x pan-y' }}
          >
            {statItems.map(({ icon: Icon, label, value, unit, small }) => (
              <Card key={label} className="w-36 shrink-0 snap-start p-4 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-input)]">
                <div className="flex items-center gap-2 mb-2 text-[var(--text-muted)] overflow-hidden">
                  <Icon size={16} className="shrink-0" />
                  <span className="text-[10px] font-bold uppercase truncate">{label}</span>
                </div>
                {small ? (
                  <p className="text-lg font-black text-[var(--text-primary)] leading-tight">{value}</p>
                ) : (
                  <p className="text-3xl font-black text-[var(--text-primary)]">
                    {value}
                    {unit && <span className="text-sm text-[var(--text-muted)] ml-1">{unit}</span>}
                  </p>
                )}
              </Card>
            ))}
          </div>
          <button
            onClick={() => statsScrollRef.current?.scrollBy({ left: 312, behavior: 'smooth' })}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-input)] text-[var(--text-secondary)] rounded-full p-1 shadow-lg"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Stat cards — desktop: 3 × 2 grid */}
        <div className="hidden lg:grid grid-cols-3 grid-rows-2 gap-3 h-full">
          {statItems.map(({ icon: Icon, label, value, unit, small }) => (
            <Card key={label} className="p-4 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-input)] flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-[var(--text-muted)] overflow-hidden">
                <Icon size={14} className="shrink-0" />
                <span className="text-[10px] font-bold uppercase truncate">{label}</span>
              </div>
              {'small' in { small } && small ? (
                <p className="text-base font-black text-[var(--text-primary)] leading-tight">{value}</p>
              ) : (
                <p className="text-2xl font-black text-[var(--text-primary)]">
                  {value}
                  {unit && <span className="text-xs text-[var(--text-muted)] ml-1">{unit}</span>}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* ── Row 2: Charts (full width) ───────────────────────────────── */}
      <div>
        {plan === 'premium' ? (
          <ChartSlider
            stats={stats}
            chartRange={chartRange}
            setChartRange={setChartRange}
            weeklyGoal={weeklyGoal}
            t={t}
          />
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-emerald-400" size={20} />
              <h3 className="font-bold text-lg text-[var(--text-primary)]">{t('progress')}</h3>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 py-4">
              <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left lg:max-w-xs">
                <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                  <TrendingUp size={32} className="text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-lg">Premium Charts</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Upgrade to Premium to unlock all 5 charts and detailed analytics.
                  </p>
                </div>
                <button
                  onClick={openUpgrade}
                  className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl transition-all"
                >
                  Upgrade Now
                </button>
              </div>
              {/* Blurred chart preview */}
              <div className="hidden lg:grid grid-cols-3 gap-4 flex-1 select-none pointer-events-none">
                {['Volume', 'Duration', 'Sets'].map((label) => (
                  <div key={label} className="relative overflow-hidden rounded-xl bg-[var(--bg-input)] h-40 flex flex-col p-3">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">{label}</p>
                    <div className="flex-1 blur-sm opacity-40 flex items-end gap-1 px-1">
                      {[40, 65, 30, 80, 55, 70, 45, 90, 60, 75].map((h, i) => (
                        <div key={i} className="flex-1 bg-[var(--accent)] rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-[var(--bg-card)]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[var(--border)]">
                        <span className="text-xs font-bold text-[var(--text-muted)]">🔒 Premium</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
