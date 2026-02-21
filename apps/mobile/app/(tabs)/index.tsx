/**
 * Dashboard tab — weekly goal ring, stats cards, charts gate.
 * Reference: FEATURES.md §5 Dashboard View
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line as SvgLine, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Dimensions } from 'react-native';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise } from '@shared/types/exercise';
import type { Session } from '@shared/types/session';
import type { Lang } from '@shared/types/user';
import { BarChart3, Calendar, Clock, Star, Target, Timer, TrendingUp } from 'lucide-react-native';
import { MUSCLE_COLORS } from '@shared/constants/muscles';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useStorage } from '../../hooks/useStorage';

// ── Goal ring ──────────────────────────────────────────────────────────────────
function GoalRing({ count, goal }: { count: number; goal: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(count / Math.max(goal, 1), 1);
  const dash = circ * pct;
  const gap = circ - dash;
  const color = pct >= 1 ? '#10b981' : '#3b82f6';
  return (
    <Svg width={110} height={110} viewBox="0 0 100 100">
      <Circle
        cx="50" cy="50" r={r}
        fill="none" stroke="#1e293b" strokeWidth="10"
        rotation="-90" originX="50" originY="50"
      />
      <Circle
        cx="50" cy="50" r={r}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        rotation="-90" originX="50" originY="50"
      />
      <SvgText x="50" y="46" textAnchor="middle" fill="white" fontSize="22" fontWeight="900">
        {count}
      </SvgText>
      <SvgText x="50" y="60" textAnchor="middle" fill="#64748b" fontSize="9">
        / {goal}
      </SvgText>
    </Svg>
  );
}

// ── 7-day bar chart ────────────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number; isToday: boolean }[];
  accentColor: string;
  mutedColor: string;
  gridColor: string;
}

function WorkoutBarChart({ data, accentColor, mutedColor, gridColor }: BarChartProps) {
  const W = 300;
  const H = 100;
  const paddingBottom = 18; // room for labels
  const paddingTop = 6;
  const chartH = H - paddingBottom - paddingTop;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor((W / data.length) * 0.55);
  const gap = W / data.length;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* grid line at top */}
      <SvgLine x1="0" y1={paddingTop} x2={W} y2={paddingTop} stroke={gridColor} strokeWidth="1" />

      {data.map((d, i) => {
        const barH = d.value > 0 ? Math.max((d.value / maxVal) * chartH, 4) : 0;
        const x = gap * i + gap / 2;
        const barX = x - barW / 2;
        const barY = paddingTop + chartH - barH;
        const fill = d.value > 0 ? accentColor : gridColor;
        const labelY = H - 3;
        return (
          <React.Fragment key={d.label}>
            {d.value > 0 && (
              <Rect
                x={barX} y={barY}
                width={barW} height={barH}
                rx="3"
                fill={fill}
                opacity={d.isToday ? 1 : 0.65}
              />
            )}
            <SvgText
              x={x} y={labelY}
              textAnchor="middle"
              fill={d.isToday ? accentColor : mutedColor}
              fontSize="9"
              fontWeight={d.isToday ? '700' : '400'}
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Area / Line chart ─────────────────────────────────────────────────────────
const CHART_W = 300;
const CHART_H = 90;
const CHART_PT = 8;
const CHART_PB = 20;
const CHART_INNER = CHART_H - CHART_PT - CHART_PB;

interface ChartPoint { value: number; label: string }

function AreaLineChart({ data, color, id }: { data: ChartPoint[]; color: string; id: string }) {
  if (data.length < 2) {
    return (
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <SvgText x={CHART_W / 2} y={CHART_H / 2} textAnchor="middle" fill="#475569" fontSize="10">
          Not enough data
        </SvgText>
      </Svg>
    );
  }
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_W,
    y: CHART_PT + CHART_INNER - (d.value / maxVal) * CHART_INNER,
  }));

  // Smooth cubic bezier path
  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1]!;
    const cpX = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpX} ${prev.y.toFixed(1)} ${cpX} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${(CHART_H - CHART_PB).toFixed(1)} L ${first.x.toFixed(1)} ${(CHART_H - CHART_PB).toFixed(1)} Z`;

  // Show at most 5 evenly spaced labels
  const step = Math.max(1, Math.floor((data.length - 1) / 4));
  const labelIdxs = Array.from({ length: data.length }, (_, i) => i)
    .filter(i => i === 0 || i === data.length - 1 || i % step === 0);

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      <Defs>
        <LinearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#grad-${id})`} />
      <Path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
      {labelIdxs.map(i => {
        const p = pts[i]!;
        const d = data[i]!;
        return (
          <SvgText key={i} x={p.x} y={CHART_H - 5} textAnchor="middle" fill="#475569" fontSize="8">
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ── Horizontal bar chart (frequency) ─────────────────────────────────────────
function FreqBarChart({ data, color }: { data: ChartPoint[]; color: string }) {
  const W = CHART_W;
  const H = CHART_H;
  const pT = 8; const pB = 20;
  const chartH = H - pT - pB;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(8, Math.floor((W / Math.max(data.length, 1)) * 0.5));
  const gap = data.length > 1 ? W / data.length : W;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {data.map((d, i) => {
        const barH = d.value > 0 ? Math.max((d.value / maxVal) * chartH, 4) : 0;
        const x = gap * i + gap / 2;
        return (
          <React.Fragment key={i}>
            {d.value > 0 && (
              <Rect x={x - barW / 2} y={pT + chartH - barH} width={barW} height={barH} rx="3" fill={color} opacity="0.85" />
            )}
            <SvgText x={x} y={H - 5} textAnchor="middle" fill="#475569" fontSize="8">
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Muscle split (horizontal % bars) ─────────────────────────────────────────
function MuscleSplitBars({ data }: { data: { muscle: string; sets: number; color: string }[] }) {
  const total = data.reduce((a, d) => a + d.sets, 0) || 1;
  return (
    <View style={{ gap: 6 }}>
      {data.slice(0, 6).map(d => (
        <View key={d.muscle} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', width: 68, textTransform: 'uppercase' }} numberOfLines={1}>
            {d.muscle}
          </Text>
          <View style={{ flex: 1, height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${(d.sets / total) * 100}%`, height: '100%', backgroundColor: d.color, borderRadius: 4 }} />
          </View>
          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', width: 28, textAlign: 'right' }}>
            {d.sets}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { plan } = useAuth();
  const { theme } = useTheme();
  const { getSessions, getCustomExercises, getPreferences, savePreferences } = useStorage();

  const [history, setHistory] = useState<Session[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [weeklyGoal, setWeeklyGoalState] = useState(4);
  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'1W' | '1M' | '3M' | '6M'>('1M');

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
        setWeeklyGoalState(p.weeklyGoal);
        setLang(p.lang);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }, [getSessions, getCustomExercises, getPreferences]),
  );

  const allExercises = useMemo(() => [...EXERCISE_CATALOG, ...customExercises], [customExercises]);

  const stats = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(monday);
    endOfWeek.setDate(monday.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeek = history.filter(s => {
      const d = new Date(s.date).getTime();
      return d >= monday.getTime() && d <= endOfWeek.getTime();
    });

    const uniqueDaySet = new Set(thisWeek.map(s => new Date(s.date).toDateString()));

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }

    const totalSets = history.reduce(
      (acc, s) => acc + Object.values(s.logs).reduce((a, l) => a + l.length, 0),
      0,
    );
    const avgDuration = history.length > 0
      ? Math.round(history.reduce((s, h) => s + (h.duration || 0), 0) / history.length)
      : 0;
    const totalMin = history.reduce((s, h) => s + (h.duration || 0), 0);
    const totalTime = totalMin < 60 ? `${totalMin}min` : `${(totalMin / 60).toFixed(1)}h`;

    const setsPerEx: Record<string, number> = {};
    history.forEach(s =>
      Object.entries(s.logs).forEach(([id, arr]) => {
        setsPerEx[id] = (setsPerEx[id] ?? 0) + arr.length;
      }),
    );
    const favExId = Object.entries(setsPerEx).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const favName = favExId ? (allExercises.find(e => e.id === favExId)?.name ?? favExId) : '—';

    const todayStr = new Date().toDateString();
    const shortDays = lang === 'es' || lang === 'fr'
      ? ['D', 'L', 'M', 'M', 'J', 'V', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const chartData = weekDays.map(d => {
      const ds = d.toDateString();
      const sessionsOnDay = history.filter(s => new Date(s.date).toDateString() === ds);
      const sets = sessionsOnDay.reduce(
        (acc, s) => acc + Object.values(s.logs).reduce((a, l) => a + l.length, 0), 0,
      );
      return { label: shortDays[d.getDay()] ?? '?', value: sets, isToday: ds === todayStr };
    });

    return {
      uniqueDays: uniqueDaySet.size,
      uniqueDaySet,
      weekDays,
      totalWorkouts: history.length,
      totalSets,
      avgDuration,
      totalTime,
      favName,
      chartData,
    };
  }, [history, allExercises]);

  const analytics = useMemo(() => {
    const now = new Date();
    const cutoffDays = chartRange === '1W' ? 7 : chartRange === '1M' ? 30 : chartRange === '3M' ? 90 : 180;
    const cutoff = new Date(now.getTime() - cutoffDays * 86400000);
    const rangeHistory = history.filter(s => new Date(s.date) >= cutoff);

    const sessionVolume = (s: Session): number => {
      let vol = 0;
      Object.values(s.logs).forEach(sets =>
        sets.forEach(set => { vol += (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0); }),
      );
      return vol;
    };
    const sessionSets = (s: Session): number =>
      Object.values(s.logs).reduce((a, sets) => a + sets.length, 0);

    // Build time buckets
    let buckets: { label: string; start: Date; end: Date }[];
    if (chartRange === '1W') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff); monday.setHours(0, 0, 0, 0);
      const shortDays = lang === 'es' || lang === 'fr'
        ? ['D', 'L', 'M', 'M', 'J', 'V', 'S']
        : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      buckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        return { label: shortDays[d.getDay()] ?? '?', start: new Date(d), end };
      });
    } else if (chartRange === '1M') {
      buckets = Array.from({ length: 4 }, (_, i) => {
        const weekEnd = new Date(now.getTime() - i * 7 * 86400000); weekEnd.setHours(23, 59, 59, 999);
        const weekStart = new Date(weekEnd.getTime() - 6 * 86400000); weekStart.setHours(0, 0, 0, 0);
        const mo = weekStart.toLocaleDateString('en-US', { month: 'short' });
        return { label: `${mo} ${weekStart.getDate()}`, start: weekStart, end: new Date(weekEnd) };
      }).reverse();
    } else if (chartRange === '3M') {
      buckets = Array.from({ length: 12 }, (_, i) => {
        const weekEnd = new Date(now.getTime() - i * 7 * 86400000); weekEnd.setHours(23, 59, 59, 999);
        const weekStart = new Date(weekEnd.getTime() - 6 * 86400000); weekStart.setHours(0, 0, 0, 0);
        const mo = weekStart.toLocaleDateString('en-US', { month: 'short' });
        return { label: `${mo[0] ?? ''}${weekStart.getDate()}`, start: weekStart, end: new Date(weekEnd) };
      }).reverse();
    } else {
      buckets = Array.from({ length: 6 }, (_, i) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); monthEnd.setHours(23, 59, 59, 999);
        return { label: monthStart.toLocaleDateString('en-US', { month: 'short' }), start: monthStart, end: monthEnd };
      }).reverse();
    }

    const inBucket = (s: Session, b: { start: Date; end: Date }) => {
      const d = new Date(s.date).getTime();
      return d >= b.start.getTime() && d <= b.end.getTime();
    };

    const volumeData: ChartPoint[] = buckets.map(b => ({
      label: b.label,
      value: rangeHistory.filter(s => inBucket(s, b)).reduce((a, s) => a + sessionVolume(s), 0),
    }));
    const durationData: ChartPoint[] = buckets.map(b => ({
      label: b.label,
      value: rangeHistory.filter(s => inBucket(s, b)).reduce((a, s) => a + (s.duration || 0), 0),
    }));
    const setsData: ChartPoint[] = buckets.map(b => ({
      label: b.label,
      value: rangeHistory.filter(s => inBucket(s, b)).reduce((a, s) => a + sessionSets(s), 0),
    }));
    const freqData: ChartPoint[] = buckets.map(b => ({
      label: b.label,
      value: rangeHistory.filter(s => inBucket(s, b)).length,
    }));

    const muscleSetCount: Record<string, number> = {};
    rangeHistory.forEach(s =>
      Object.entries(s.logs).forEach(([exId, sets]) => {
        const ex = allExercises.find(e => e.id === exId || e.name === exId);
        const muscle = ex?.muscle ?? 'Other';
        muscleSetCount[muscle] = (muscleSetCount[muscle] ?? 0) + sets.length;
      }),
    );
    const muscleSplitData = Object.entries(muscleSetCount)
      .sort((a, b) => b[1] - a[1])
      .map(([muscle, sets]) => ({
        muscle,
        sets,
        color: (MUSCLE_COLORS as Record<string, string>)[muscle] ?? '#475569',
      }));

    return { volumeData, durationData, setsData, freqData, muscleSplitData };
  }, [history, allExercises, chartRange, lang]);

  const setWeeklyGoal = (v: number) => {
    setWeeklyGoalState(v);
    savePreferences({ weeklyGoal: v });
  };

  const screenW = Dimensions.get('window').width;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bgPage }}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const dayLabels = lang === 'es' || lang === 'fr'
    ? ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const statCards = [
    { label: t('total_workouts'), value: String(stats.totalWorkouts), icon: Calendar, color: '#3b82f6' },
    { label: t('total_sets'),     value: String(stats.totalSets),     icon: Target,   color: '#8b5cf6' },
    { label: t('avg_duration'),   value: `${stats.avgDuration} ${t('min_label')}`, icon: Clock, color: '#f97316' },
    { label: t('total_time'),     value: stats.totalTime,             icon: Timer,    color: '#06b6d4' },
    { label: t('fav_exercise'),   value: stats.favName, small: true,  icon: Star,     color: '#eab308' },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bgPage }}>
      <View className="px-5 pt-8 pb-5 flex-row items-center gap-3">
        <BarChart3 size={26} color={theme.accent} />
        <Text className="text-3xl font-black" style={{ color: theme.textPrimary }}>{t('dashboard')}</Text>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 }}>

        {/* Weekly goal card */}
        <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{t('weekly_goal')}</Text>
              <Text className="text-slate-400 text-base mt-0.5">
                {stats.uniqueDays} / {weeklyGoal} {t('workouts_completed')}
              </Text>

              {/* +/- controls */}
              <View className="flex-row items-center gap-3 mt-3">
                <Pressable
                  onPress={() => setWeeklyGoal(Math.max(1, weeklyGoal - 1))}
                  className="w-9 h-9 bg-slate-800 rounded-full items-center justify-center border border-slate-700"
                >
                  <Text className="text-white text-xl font-bold leading-none">−</Text>
                </Pressable>
                <Text className="text-white text-2xl font-black w-8 text-center">{weeklyGoal}</Text>
                <Pressable
                  onPress={() => setWeeklyGoal(Math.min(7, weeklyGoal + 1))}
                  className="w-9 h-9 bg-slate-800 rounded-full items-center justify-center border border-slate-700"
                >
                  <Text className="text-white text-xl font-bold leading-none">+</Text>
                </Pressable>
              </View>
            </View>
            <GoalRing count={stats.uniqueDays} goal={weeklyGoal} />
          </View>

          {/* Progress bar */}
          <View className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4 border border-slate-700">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min((stats.uniqueDays / weeklyGoal) * 100, 100)}%` }}
            />
          </View>

          {/* Day dots */}
          <View className="flex-row justify-between">
            {stats.weekDays.map((date, i) => {
              const letter = dayLabels[date.getDay()];
              const isToday = new Date().toDateString() === date.toDateString();
              const isDone = stats.uniqueDaySet.has(date.toDateString());
              return (
                <View key={i} className="items-center gap-1">
                  <Text className="text-slate-500 text-sm font-bold">{letter}</Text>
                  <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                    isDone
                      ? 'bg-blue-600/20 border-blue-500'
                      : isToday
                      ? 'border-blue-400 bg-transparent'
                      : 'bg-slate-800 border-slate-700'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      isDone ? 'text-blue-400' : isToday ? 'text-white' : 'text-slate-500'
                    }`}>
                      {date.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stat cards — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 16 }}
          className="mb-4 -mx-4 px-4"
        >
          {statCards.map(({ label, value, small, icon: Icon, color }) => (
            <View
              key={label}
              style={{ width: 140, borderRadius: 16, padding: 16, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={18} color={color} />
              </View>
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }} numberOfLines={1}>
                {label}
              </Text>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: small ? 16 : 28, lineHeight: small ? 22 : 34 }} numberOfLines={2}>
                {value}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Charts section */}
        {plan === 'premium' ? (
          <View>
            {/* Range selector */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['1W', '1M', '3M', '6M'] as const).map(r => (
                <Pressable
                  key={r}
                  onPress={() => setChartRange(r)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: chartRange === r ? theme.accent : theme.bgCard,
                    borderWidth: 1,
                    borderColor: chartRange === r ? theme.accent : theme.border,
                  }}
                >
                  <Text style={{ color: chartRange === r ? '#fff' : theme.textMuted, fontSize: 13, fontWeight: '700' }}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 5 analytics chart cards — horizontal paged scroll */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={screenW - 32 + 12}
              decelerationRate="fast"
              contentContainerStyle={{ gap: 12 }}
            >
              {/* 1 — Volume */}
              <View style={{ width: screenW - 32, borderRadius: 16, padding: 16, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 2 }}>Volume</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>Total weight × reps</Text>
                <AreaLineChart data={analytics.volumeData} color="#3b82f6" id="vol" />
              </View>

              {/* 2 — Duration */}
              <View style={{ width: screenW - 32, borderRadius: 16, padding: 16, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 2 }}>{t('avg_duration')}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>{t('min_label')}</Text>
                <AreaLineChart data={analytics.durationData} color="#f97316" id="dur" />
              </View>

              {/* 3 — Sets */}
              <View style={{ width: screenW - 32, borderRadius: 16, padding: 16, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 2 }}>{t('total_sets')}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>Per period</Text>
                <AreaLineChart data={analytics.setsData} color="#8b5cf6" id="sets" />
              </View>

              {/* 4 — Frequency */}
              <View style={{ width: screenW - 32, borderRadius: 16, padding: 16, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 2 }}>{t('total_workouts')}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>Frequency per period</Text>
                <FreqBarChart data={analytics.freqData} color="#10b981" />
              </View>

              {/* 5 — Muscle Split */}
              <View style={{ width: screenW - 32, borderRadius: 16, padding: 16, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 2 }}>Muscle Split</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>Sets per muscle group</Text>
                {analytics.muscleSplitData.length > 0
                  ? <MuscleSplitBars data={analytics.muscleSplitData} />
                  : <Text style={{ color: '#475569', fontSize: 12 }}>No data for this period</Text>
                }
              </View>
            </ScrollView>

            {/* Dot pagination hint */}
            <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              ← swipe for more charts →
            </Text>
          </View>
        ) : (
          <View className="rounded-2xl p-5 items-center py-10" style={{ backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: `${theme.accent}18`, borderWidth: 1, borderColor: `${theme.accent}30`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <TrendingUp size={30} color={theme.accent} />
            </View>
            <Text className="font-bold text-base mb-1" style={{ color: theme.textPrimary }}>
              Premium Charts
            </Text>
            <Text className="text-sm text-center leading-relaxed" style={{ color: theme.textSecondary }}>
              Upgrade to Pro to unlock weekly analytics charts.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
