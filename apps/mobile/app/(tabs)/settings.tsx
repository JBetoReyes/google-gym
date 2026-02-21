import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Check, CheckCircle, Download, Image, Lock, LogIn, LogOut, Pencil, Play, Plus, Settings, Trash2, Upload, X, Zap } from 'lucide-react-native';
import { MUSCLE_GROUPS } from '@shared/constants/muscles';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise, MuscleGroup } from '@shared/types/exercise';
import type { Lang } from '@shared/types/user';
import { useAuth } from '../../context/AuthContext';
import { FREE_THEME, PREMIUM_THEMES, useTheme, type ThemeId } from '../../context/ThemeContext';
import { THEMES } from '@shared/types/theme';
import { useIAP } from '../../hooks/useIAP';
import { useStorage, type ExerciseButtons } from '../../hooks/useStorage';

function useT(lang: Lang) {
  return useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
      return dict[key] ?? key;
    },
    [lang],
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 px-4">
      {children}
    </Text>
  );
}

function Row({
  children,
  onPress,
  last,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const inner = (
    <View
      className={`flex-row items-center px-4 py-4 bg-slate-800/60 ${
        !last ? 'border-b border-slate-700/50' : ''
      }`}
    >
      {children}
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {inner}
    </TouchableOpacity>
  ) : (
    inner
  );
}

// ─── Custom Exercise Modal ──────────────────────────────────────────────────

interface ExerciseModalProps {
  visible: boolean;
  initial: Exercise | undefined;
  lang: Lang;
  onSave: (name: string, muscle: MuscleGroup) => void;
  onClose: () => void;
}

function ExerciseModal({ visible, initial, lang, onSave, onClose }: ExerciseModalProps) {
  const t = useT(lang);
  const [name, setName] = useState(initial?.name ?? '');
  const [muscle, setMuscle] = useState<MuscleGroup>(initial?.muscle ?? 'Chest');

  useEffect(() => {
    setName(initial?.name ?? '');
    setMuscle(initial?.muscle ?? 'Chest');
  }, [initial, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <Text className="text-white font-bold text-lg">
            {initial ? t('save_routine') : t('add')} Exercise
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View className="p-4 gap-4">
          <View>
            <Text className="text-slate-400 text-xs font-semibold uppercase mb-2">Name</Text>
            <TextInput
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base"
              placeholder={t('exercise_name_placeholder')}
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <View>
            <Text className="text-slate-400 text-xs font-semibold uppercase mb-2">Muscle Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {MUSCLE_GROUPS.map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMuscle(m)}
                    className={`px-3 py-2 rounded-lg border ${
                      muscle === m
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${muscle === m ? 'text-white' : 'text-slate-400'}`}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity
            onPress={() => name.trim() && onSave(name.trim(), muscle)}
            disabled={!name.trim()}
            className={`py-3.5 rounded-xl items-center ${name.trim() ? 'bg-blue-600' : 'bg-slate-700 opacity-50'}`}
          >
            <Text className="text-white font-bold text-base">{t('save_routine')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Settings Screen ───────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { user, plan, signOut, refreshPlan } = useAuth();
  const { purchase, restore, loading: iapLoading } = useIAP();
  const { themeId, theme, setTheme } = useTheme();
  const {
    getPreferences,
    savePreferences,
    getCustomExercises,
    saveCustomExercise,
    deleteCustomExercise,
    getExerciseButtons,
    saveExerciseButtons,
    exportData,
    importData,
  } = useStorage();

  const [lang, setLangState] = useState<Lang>('en');
  const [restTimer, setRestTimerState] = useState<60 | 90 | 120 | 180>(90);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [exerciseButtons, setExerciseButtons] = useState<ExerciseButtons>({
    routineForm: { video: true, image: false, anatomy: false },
    workoutView: { video: true, image: false, anatomy: false },
  });

  // Modal state
  const [exModalVisible, setExModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState<'export' | 'import' | null>(null);

  const t = useT(lang);

  useEffect(() => {
    Promise.all([getPreferences(), getCustomExercises(), getExerciseButtons()]).then(([prefs, exs, btns]) => {
      setLangState(prefs.lang);
      setRestTimerState(prefs.restTimerDefault);
      setCustomExercises(exs);
      setExerciseButtons(btns);
    });
  }, [getPreferences, getCustomExercises, getExerciseButtons]);

  const setLang = (l: Lang) => {
    setLangState(l);
    void savePreferences({ lang: l });
  };

  const setRestTimer = (s: 60 | 90 | 120 | 180) => {
    setRestTimerState(s);
    void savePreferences({ restTimerDefault: s });
  };

  const openAddExercise = () => {
    setEditingExercise(undefined);
    setExModalVisible(true);
  };

  const openEditExercise = (ex: Exercise) => {
    setEditingExercise(ex);
    setExModalVisible(true);
  };

  const handleSaveExercise = async (name: string, muscle: MuscleGroup) => {
    const ex: Exercise = {
      id: editingExercise?.id ?? `custom_${Date.now()}`,
      name,
      muscle,
    };
    await saveCustomExercise(ex);
    setCustomExercises(prev =>
      editingExercise
        ? prev.map(e => (e.id === ex.id ? ex : e))
        : [...prev, ex],
    );
    setExModalVisible(false);
  };

  const handleDeleteExercise = (ex: Exercise) => {
    Alert.alert(
      ex.name,
      t('delete_exercise_warn'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            await deleteCustomExercise(ex.id);
            setCustomExercises(prev => prev.filter(e => e.id !== ex.id));
          },
        },
      ],
    );
  };

  const toggleExBtn = (ctx: 'routineForm' | 'workoutView', key: 'video' | 'image' | 'anatomy') => {
    setExerciseButtons(prev => {
      const updated: ExerciseButtons = {
        ...prev,
        [ctx]: { ...prev[ctx], [key]: !prev[ctx][key] },
      };
      void saveExerciseButtons(updated);
      return updated;
    });
  };

  const handleExport = async () => {
    setDataLoading('export');
    try {
      await exportData();
    } catch {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
    } finally {
      setDataLoading(null);
    }
  };

  const handleImport = async () => {
    setDataLoading('import');
    try {
      const success = await importData();
      if (success) {
        Alert.alert('Import Successful', 'Your data has been restored. Restart the app to see all changes.');
      }
    } catch {
      Alert.alert('Import Failed', 'Could not read the backup file. Make sure it is a valid GymTracker JSON export.');
    } finally {
      setDataLoading(null);
    }
  };

  const handleSignIn = () => {
    router.push('/auth');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: t('cancel'), style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const handleUpgrade = async () => {
    await purchase();
    await refreshPlan();
  };

  const handleRestore = async () => {
    await restore();
    await refreshPlan();
    if (plan !== 'premium') {
      Alert.alert('Restore Purchases', 'No active subscription found.');
    }
  };

  const LANGS: { code: Lang; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  const ALL_THEMES: { id: ThemeId; label: string }[] = [
    { id: 'dark',     label: 'Dark'     },
    { id: 'midnight', label: 'Midnight' },
    { id: 'ocean',    label: 'Ocean'    },
    { id: 'forest',   label: 'Forest'   },
    { id: 'rose',     label: 'Rose'     },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bgPage }}>
      <View className="px-5 pt-8 pb-5 flex-row items-center gap-3">
        <Settings size={26} color={theme.accent} />
        <Text className="text-3xl font-black" style={{ color: theme.textPrimary }}>{t('settings')}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}>
        {/* Language */}
        <View className="mb-6 mt-2">
          <SectionLabel>{t('language')}</SectionLabel>
          <View className="flex-row gap-2 px-4">
            {LANGS.map(l => (
              <TouchableOpacity
                key={l.code}
                onPress={() => setLang(l.code)}
                className={`flex-1 py-3 rounded-xl border items-center gap-1 ${
                  lang === l.code
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <Text className="text-2xl">{l.flag}</Text>
                <Text className={`text-xs font-bold ${lang === l.code ? 'text-white' : 'text-slate-400'}`}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rest Timer Default */}
        <View className="mb-6">
          <SectionLabel>{t('rest_timer_default')}</SectionLabel>
          <View className="flex-row gap-2 px-4">
            {([60, 90, 120, 180] as const).map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setRestTimer(s)}
                className={`flex-1 py-3 rounded-xl border items-center ${
                  restTimer === s
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <Text className={`font-bold text-sm ${restTimer === s ? 'text-white' : 'text-slate-400'}`}>
                  {s}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercise Buttons */}
        <View className="mb-6">
          <SectionLabel>{t('exercise_buttons')}</SectionLabel>
          <View className="mx-4 rounded-xl overflow-hidden border border-slate-700/50">
            {([
              { ctx: 'routineForm' as const, label: 'Routine Builder' },
              { ctx: 'workoutView' as const, label: 'During Workout' },
            ]).map(({ ctx, label }, idx, arr) => (
              <View
                key={ctx}
                className={`px-4 py-3 bg-slate-800/60 flex-row items-center justify-between ${idx < arr.length - 1 ? 'border-b border-slate-700/50' : ''}`}
              >
                <Text className="text-slate-300 text-sm font-semibold">{label}</Text>
                <View className="flex-row gap-2">
                  {([
                    { key: 'video' as const, Icon: Play, activeColor: '#f43f5e' },
                    { key: 'image' as const, Icon: Image, activeColor: '#3b82f6' },
                    { key: 'anatomy' as const, Icon: Camera, activeColor: '#8b5cf6' },
                  ]).map(({ key, Icon, activeColor }) => {
                    const on = exerciseButtons[ctx][key];
                    return (
                      <Pressable
                        key={key}
                        onPress={() => toggleExBtn(ctx, key)}
                        style={{
                          padding: 8, borderRadius: 10,
                          backgroundColor: on ? `${activeColor}22` : '#1e293b',
                          borderWidth: 1,
                          borderColor: on ? activeColor : '#334155',
                        }}
                      >
                        <Icon size={16} color={on ? activeColor : '#475569'} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Upgrade to Pro */}
        {plan === 'free' ? (
          <View className="mb-6 mx-4">
            <View className="rounded-2xl overflow-hidden border border-blue-500/30 bg-blue-950/40">
              {/* Header */}
              <View className="px-4 pt-4 pb-3 border-b border-blue-500/20 flex-row items-center gap-2">
                <Zap size={18} color="#3b82f6" />
                <Text className="text-white font-bold text-base">Upgrade to Pro</Text>
              </View>

              {/* Benefits */}
              <View className="px-4 py-3 gap-2">
                {[
                  'Premium themes (Midnight, Ocean, Forest, Rose)',
                  'Advanced analytics & charts',
                  'Sync across all devices',
                  'Priority support',
                ].map(benefit => (
                  <View key={benefit} className="flex-row items-center gap-2">
                    <CheckCircle size={16} color="#22c55e" />
                    <Text className="text-slate-300 text-base">{benefit}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <View className="px-4 pb-4 gap-2">
                <TouchableOpacity
                  onPress={handleUpgrade}
                  disabled={iapLoading}
                  className="bg-blue-600 py-3.5 rounded-xl items-center flex-row justify-center gap-2"
                  activeOpacity={0.8}
                >
                  {iapLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Zap size={16} color="#fff" />
                      <Text className="text-white font-bold text-sm">Subscribe — $4.99 / month</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRestore}
                  disabled={iapLoading}
                  className="items-center py-2"
                >
                  <Text className="text-slate-500 text-xs">Already subscribed? Restore purchases</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View className="mb-6 mx-4">
            <View className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 flex-row items-center gap-3">
              <CheckCircle size={20} color="#22c55e" />
              <View className="flex-1">
                <Text className="text-white font-bold text-sm">You're on Pro</Text>
                <Text className="text-slate-400 text-xs mt-0.5">All premium features unlocked</Text>
              </View>
            </View>
          </View>
        )}

        {/* Theme Picker */}
        <View className="mb-6">
          <SectionLabel>Theme</SectionLabel>
          <View className="flex-row gap-2.5 px-4">
            {ALL_THEMES.map(entry => {
              const tokens = THEMES[entry.id];
              const isPremium = PREMIUM_THEMES.includes(entry.id as typeof PREMIUM_THEMES[number]);
              const locked = isPremium && plan === 'free';
              const active = themeId === entry.id;
              return (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => !locked && setTheme(entry.id as ThemeId)}
                  disabled={locked}
                  activeOpacity={0.75}
                  style={{ flex: 1, alignItems: 'center', gap: 7 }}
                >
                  {/* Swatch card */}
                  <View style={[
                    styles.swatch,
                    {
                      borderColor: active ? tokens.accent : 'rgba(255,255,255,0.07)',
                      borderWidth: active ? 2 : 1,
                      shadowColor: active ? tokens.accent : 'transparent',
                      shadowOpacity: active ? 0.45 : 0,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}>
                    {/* Accent strip */}
                    <View style={{ height: 22, backgroundColor: tokens.accent }} />
                    {/* Card body */}
                    <View style={{ flex: 1, backgroundColor: tokens.bgCard, paddingHorizontal: 5, paddingVertical: 5 }}>
                      <View style={{ height: 3, borderRadius: 2, backgroundColor: tokens.textMuted, marginBottom: 3, width: '75%', opacity: 0.5 }} />
                      <View style={{ height: 3, borderRadius: 2, backgroundColor: tokens.textMuted, width: '50%', opacity: 0.3 }} />
                    </View>
                    {/* Page bg strip */}
                    <View style={{ height: 10, backgroundColor: tokens.bgPage }} />

                    {/* Active checkmark */}
                    {active && (
                      <View style={[styles.badge, { backgroundColor: tokens.accent }]}>
                        <Check size={9} color="#fff" />
                      </View>
                    )}

                    {/* Lock overlay */}
                    {locked && (
                      <View style={styles.lockOverlay}>
                        <View style={styles.lockBadge}>
                          <Lock size={13} color="#94a3b8" />
                        </View>
                      </View>
                    )}
                  </View>

                  <Text style={{ fontSize: 11, fontWeight: '700', color: active ? tokens.accent : '#475569' }}>
                    {entry.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Exercises */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {t('my_exercises')} ({customExercises.length})
            </Text>
            <TouchableOpacity
              onPress={openAddExercise}
              className="flex-row items-center gap-1.5 bg-blue-600/20 border border-blue-500/30 px-3 py-2 rounded-lg"
            >
              <Plus size={16} color="#3b82f6" />
              <Text className="text-blue-400 text-sm font-bold">{t('add')}</Text>
            </TouchableOpacity>
          </View>

          {customExercises.length === 0 ? (
            <View className="mx-4 py-6 bg-slate-800/40 rounded-xl items-center border border-slate-700/50">
              <Text className="text-slate-500 text-sm">{t('no_custom_exercises')}</Text>
            </View>
          ) : (
            <View className="mx-4 rounded-xl overflow-hidden border border-slate-700/50">
              <FlatList
                data={customExercises}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <Row last={index === customExercises.length - 1}>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">{item.name}</Text>
                      <Text className="text-slate-500 text-sm mt-0.5">{item.muscle}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openEditExercise(item)}
                      style={{ padding: 8, marginRight: 4 }}
                    >
                      <Pencil size={18} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteExercise(item)}
                      style={{ padding: 8 }}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </Row>
                )}
              />
            </View>
          )}
        </View>

        {/* Data Management */}
        <View className="mb-6">
          <SectionLabel>Data Management</SectionLabel>
          <View className="mx-4 rounded-xl overflow-hidden border border-slate-700/50">
            <Row {...(dataLoading ? {} : { onPress: handleExport })}>
              {dataLoading === 'export' ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Download size={18} color="#3b82f6" />
              )}
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-base">Export Data</Text>
                <Text className="text-slate-500 text-sm mt-0.5">Save a backup of your routines & history</Text>
              </View>
            </Row>
            <Row last {...(dataLoading ? {} : { onPress: handleImport })}>
              {dataLoading === 'import' ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <Upload size={18} color="#10b981" />
              )}
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-base">Import Data</Text>
                <Text className="text-slate-500 text-sm mt-0.5">Restore from a JSON backup file</Text>
              </View>
            </Row>
          </View>
        </View>

        {/* Account */}
        <View className="mb-6">
          <SectionLabel>Account</SectionLabel>
          <View className="mx-4 rounded-xl overflow-hidden border border-slate-700/50">
            {user === null ? (
              <>
                <Row last>
                  <Text className="flex-1 text-slate-400 text-sm">
                    Sign in to sync your data across devices.
                  </Text>
                </Row>
                <TouchableOpacity
                  onPress={handleSignIn}
                  className="mx-0 mt-0 flex-row items-center gap-2 px-4 py-3.5 bg-blue-600/20 border-t border-slate-700/50"
                  activeOpacity={0.7}
                >
                  <LogIn size={18} color="#3b82f6" />
                  <Text className="text-blue-400 font-semibold text-sm">Sign In / Register</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Row>
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      plan === 'premium' ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <Text className="text-white text-xs font-bold">
                      {plan === 'premium' ? 'PRO' : 'FREE'}
                    </Text>
                  </View>
                  <Text className="flex-1 text-slate-300 text-sm" numberOfLines={1}>
                    {user.email}
                  </Text>
                </Row>
                <Row last onPress={handleSignOut}>
                  <LogOut size={16} color="#ef4444" />
                  <Text className="text-red-400 font-semibold text-sm ml-3">Sign Out</Text>
                </Row>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <ExerciseModal
        visible={exModalVisible}
        initial={editingExercise}
        lang={lang}
        onSave={handleSaveExercise}
        onClose={() => setExModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  swatch: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15,23,42,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
});
