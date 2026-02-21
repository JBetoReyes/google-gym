/**
 * Routines tab — list routines, start workout, navigate to create/edit.
 * Reference: FEATURES.md §6 Routines View + §12 QR Share & Import
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Dimensions, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { EXERCISE_CATALOG } from '@shared/constants/exercises';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Exercise } from '@shared/types/exercise';
import type { Routine } from '@shared/types/routine';
import type { Lang } from '@shared/types/user';
import { Activity, Dumbbell, Heart, Layers, Pencil, Play, Plus, QrCode, ScanLine, Shield, Triangle, Trash2, X, Zap } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useStorage } from '../../hooks/useStorage';
import { useWorkout } from '../../context/WorkoutContext';

const MUSCLE_META: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Cardio:    { color: '#f43f5e', bg: '#f43f5e20', icon: Heart },
  Chest:     { color: '#3b82f6', bg: '#3b82f620', icon: Shield },
  Back:      { color: '#8b5cf6', bg: '#8b5cf620', icon: Layers },
  Legs:      { color: '#f97316', bg: '#f9731620', icon: Activity },
  Shoulders: { color: '#06b6d4', bg: '#06b6d420', icon: Triangle },
  Arms:      { color: '#eab308', bg: '#eab30820', icon: Dumbbell },
  Abs:       { color: '#10b981', bg: '#10b98120', icon: Zap },
};

interface QRPayload { v: number; name: string; exercises: string[] }

// ── QR Export Modal ────────────────────────────────────────────────────────────
function QRExportModal({
  routine,
  lang,
  onClose,
}: {
  routine: Routine;
  lang: Lang;
  onClose: () => void;
}) {
  const t = (key: string) => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  };
  const qrData = JSON.stringify({ v: 1, name: routine.name, exercises: routine.exercises } as QRPayload);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#1e293b' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{t('routine_qr_title')}</Text>
          <Pressable onPress={onClose} style={{ padding: 6 }}>
            <X size={22} color="#64748b" />
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          {/* QR code */}
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 24 }}>
            <QRCode value={qrData} size={220} />
          </View>

          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 20, marginBottom: 6, textAlign: 'center' }}>
            {routine.name}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
            {routine.exercises.length} {t('exercises')}
          </Text>
          <Text style={{ color: '#475569', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            Screenshot this QR code to share your routine with others.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── QR Scanner Modal ───────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BOX = 260;
const BOX_LEFT = (SCREEN_W - BOX) / 2;
const BOX_TOP  = (SCREEN_H - BOX) / 2 - 40; // slightly above center
const ARM = 28;   // length of each corner bracket arm
const THK = 4;    // bracket thickness
const CLR = '#3b82f6';

function QRScannerModal({
  lang,
  onScan,
  onClose,
}: {
  lang: Lang;
  onScan: (data: string) => void;
  onClose: () => void;
}) {
  const t = (key: string) => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  };
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []); // eslint-disable-line

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={scanned ? undefined : handleBarcode}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />

            {/* ── Darkened overlay: 4 rectangles framing the transparent finder ── */}
            {/* Top */}
            <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: BOX_TOP }]} />
            {/* Bottom */}
            <View style={[styles.overlay, { top: BOX_TOP + BOX, left: 0, right: 0, bottom: 0 }]} />
            {/* Left */}
            <View style={[styles.overlay, { top: BOX_TOP, left: 0, width: BOX_LEFT, height: BOX }]} />
            {/* Right */}
            <View style={[styles.overlay, { top: BOX_TOP, right: 0, width: BOX_LEFT, height: BOX }]} />

            {/* ── Corner brackets (8 thin rectangles, 2 per corner) ── */}
            {/* Top-left — horizontal */}
            <View style={{ position: 'absolute', top: BOX_TOP, left: BOX_LEFT, width: ARM, height: THK, backgroundColor: CLR, borderTopLeftRadius: 3 }} />
            {/* Top-left — vertical */}
            <View style={{ position: 'absolute', top: BOX_TOP, left: BOX_LEFT, width: THK, height: ARM, backgroundColor: CLR, borderTopLeftRadius: 3 }} />

            {/* Top-right — horizontal */}
            <View style={{ position: 'absolute', top: BOX_TOP, left: BOX_LEFT + BOX - ARM, width: ARM, height: THK, backgroundColor: CLR, borderTopRightRadius: 3 }} />
            {/* Top-right — vertical */}
            <View style={{ position: 'absolute', top: BOX_TOP, left: BOX_LEFT + BOX - THK, width: THK, height: ARM, backgroundColor: CLR, borderTopRightRadius: 3 }} />

            {/* Bottom-left — horizontal */}
            <View style={{ position: 'absolute', top: BOX_TOP + BOX - THK, left: BOX_LEFT, width: ARM, height: THK, backgroundColor: CLR, borderBottomLeftRadius: 3 }} />
            {/* Bottom-left — vertical */}
            <View style={{ position: 'absolute', top: BOX_TOP + BOX - ARM, left: BOX_LEFT, width: THK, height: ARM, backgroundColor: CLR, borderBottomLeftRadius: 3 }} />

            {/* Bottom-right — horizontal */}
            <View style={{ position: 'absolute', top: BOX_TOP + BOX - THK, left: BOX_LEFT + BOX - ARM, width: ARM, height: THK, backgroundColor: CLR, borderBottomRightRadius: 3 }} />
            {/* Bottom-right — vertical */}
            <View style={{ position: 'absolute', top: BOX_TOP + BOX - ARM, left: BOX_LEFT + BOX - THK, width: THK, height: ARM, backgroundColor: CLR, borderBottomRightRadius: 3 }} />

            {/* Label below finder */}
            <View style={{ position: 'absolute', top: BOX_TOP + BOX + 28, left: 0, right: 0, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', opacity: 0.9 }}>
                {t('scan_qr')}
              </Text>
            </View>

            {/* Close button — bottom center, well above home indicator */}
            <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }} edges={['bottom']}>
              <Pressable
                onPress={onClose}
                style={{ marginBottom: 32, width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={26} color="#fff" />
              </Pressable>
            </SafeAreaView>
          </>
        ) : (
          <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              {t('camera_error')}
            </Text>
            <Pressable
              onPress={() => void requestPermission()}
              style={{ backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginBottom: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Allow Camera Access</Text>
            </Pressable>
            <Pressable onPress={onClose} style={{ marginTop: 8 }}>
              <Text style={{ color: '#64748b', fontSize: 15 }}>{t('cancel')}</Text>
            </Pressable>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.62)' },
});

// ── Import Confirm Modal ───────────────────────────────────────────────────────
function ImportConfirmModal({
  payload,
  allExercises,
  lang,
  onConfirm,
  onClose,
}: {
  payload: QRPayload;
  allExercises: Exercise[];
  lang: Lang;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = (key: string) => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  };
  const getExName = (id: string) => allExercises.find(e => e.id === id || e.name === id)?.name ?? id;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#1e293b' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{t('import_routine')}</Text>
          <Pressable onPress={onClose} style={{ padding: 6 }}>
            <X size={22} color="#64748b" />
          </Pressable>
        </View>

        <View style={{ padding: 20, flex: 1 }}>
          <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            {t('import_confirm')}
          </Text>

          {/* Routine preview card */}
          <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#334155' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 20, marginBottom: 4 }}>{payload.name}</Text>
            <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
              {payload.exercises.length} {t('exercises')}
            </Text>
            <View style={{ gap: 8 }}>
              {payload.exercises.slice(0, 6).map(id => (
                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6' }} />
                  <Text style={{ color: '#cbd5e1', fontSize: 15 }}>{getExName(id)}</Text>
                </View>
              ))}
              {payload.exercises.length > 6 && (
                <Text style={{ color: '#475569', fontSize: 13, marginLeft: 14 }}>
                  +{payload.exercises.length - 6} more
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ padding: 20, flexDirection: 'row', gap: 12, borderTopWidth: 1, borderColor: '#1e293b' }}>
          <Pressable
            onPress={onClose}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1e293b' }}
          >
            <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 15 }}>{t('cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#3b82f6' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('import')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function RoutinesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { getRoutines, saveRoutine, deleteRoutine, getCustomExercises, getPreferences } = useStorage();
  const { setActiveWorkout } = useWorkout();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [lang, setLang] = useState<Lang>('en');

  // Modal state
  const [qrExportRoutine, setQrExportRoutine] = useState<Routine | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [importCandidate, setImportCandidate] = useState<QRPayload | null>(null);

  const t = useCallback((key: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  }, [lang]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getRoutines(), getCustomExercises(), getPreferences()]).then(([r, e, p]) => {
        if (cancelled) return;
        setRoutines(r);
        setCustomExercises(e);
        setLang(p.lang);
      });
      return () => { cancelled = true; };
    }, [getRoutines, getCustomExercises, getPreferences]),
  );

  const allExercises = useMemo(() => [...EXERCISE_CATALOG, ...customExercises], [customExercises]);

  const getExName = (id: string): string => {
    const ex = allExercises.find(e => e.id === id || e.name === id);
    return ex?.name ?? id;
  };

  const getExMuscle = (id: string): string => {
    const ex = allExercises.find(e => e.id === id || e.name === id);
    return ex?.muscle ?? '';
  };

  const handleDelete = (r: Routine) => {
    Alert.alert(t('delete_routine'), `Delete "${r.name}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        style: 'destructive',
        onPress: async () => {
          await deleteRoutine(r.id);
          setRoutines(prev => prev.filter(x => x.id !== r.id));
        },
      },
    ]);
  };

  const handleStart = (r: Routine) => {
    setActiveWorkout({
      routineId: r.id,
      routineName: r.name,
      startTime: new Date().toISOString(),
      logs: {},
      extraExercises: [],
    });
    router.push('/workout');
  };

  const handleQRScan = (data: string) => {
    setShowScanner(false);
    try {
      const payload = JSON.parse(data) as QRPayload;
      if (payload.v === 1 && typeof payload.name === 'string' && Array.isArray(payload.exercises)) {
        setImportCandidate(payload);
      } else {
        Alert.alert('Invalid QR', 'This QR code is not a valid GymTracker routine.');
      }
    } catch {
      Alert.alert('Invalid QR', 'Could not read the QR code data.');
    }
  };

  const handleImportConfirm = async () => {
    if (!importCandidate) return;
    const newRoutine: Routine = {
      id: Date.now().toString(),
      name: importCandidate.name,
      exercises: importCandidate.exercises,
    };
    await saveRoutine(newRoutine);
    setRoutines(prev => [...prev, newRoutine]);
    setImportCandidate(null);
  };

  const emptyState = routines.length === 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bgPage }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Dumbbell size={26} color={theme.accent} />
          <Text style={{ color: theme.textPrimary, fontSize: 30, fontWeight: '900' }}>{t('routines')}</Text>
        </View>
        {/* Scan QR button */}
        <Pressable
          onPress={() => setShowScanner(true)}
          style={{ padding: 10, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155' }}
        >
          <ScanLine size={20} color="#94a3b8" />
        </Pressable>
      </View>

      {emptyState ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${theme.accent}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Dumbbell size={40} color={theme.accent} />
          </View>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 8 }}>{t('no_routines')}</Text>
          <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>{t('no_routines_hint')}</Text>
          <Pressable
            onPress={() => router.push('/routines/new')}
            style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.accent }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t('create_routine')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={r => r.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 12 }}
          ListHeaderComponent={
            <Pressable
              onPress={() => router.push('/routines/new')}
              style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: '#334155', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Plus size={18} color="#64748b" />
              <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 15 }}>{t('create_routine')}</Text>
            </Pressable>
          }
          renderItem={({ item: r }) => (
            <View style={{ borderRadius: 20, padding: 20, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }}>
              {/* Header row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 20 }} numberOfLines={1}>{r.name}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 15 }}>{r.exercises.length} {t('exercises')}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => router.push(`/routines/${r.id}/edit`)}
                    style={{ padding: 10, backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155' }}
                  >
                    <Pencil size={18} color="#94a3b8" />
                  </Pressable>
                  <Pressable
                    onPress={() => setQrExportRoutine(r)}
                    style={{ padding: 10, backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155' }}
                  >
                    <QrCode size={18} color="#94a3b8" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(r)}
                    style={{ padding: 10, backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155' }}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </View>

              {/* Exercise chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {r.exercises.slice(0, 3).map(ex => {
                  const meta = MUSCLE_META[getExMuscle(ex)] ?? { color: '#64748b', bg: '#1e293b', icon: Dumbbell };
                  const Icon = meta.icon;
                  return (
                    <View key={ex} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: meta.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Icon size={12} color={meta.color} />
                      <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: '600' }}>{getExName(ex)}</Text>
                    </View>
                  );
                })}
                {r.exercises.length > 3 && (
                  <Text style={{ color: '#475569', fontSize: 13, alignSelf: 'center' }}>
                    +{r.exercises.length - 3}
                  </Text>
                )}
              </View>

              {/* Start button */}
              <Pressable
                onPress={() => handleStart(r)}
                style={{ backgroundColor: '#059669', paddingVertical: 13, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Play size={16} color="#fff" fill="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('start')}</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {/* QR Export Modal */}
      {qrExportRoutine && (
        <QRExportModal
          routine={qrExportRoutine}
          lang={lang}
          onClose={() => setQrExportRoutine(null)}
        />
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          lang={lang}
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Import Confirm Modal */}
      {importCandidate && (
        <ImportConfirmModal
          payload={importCandidate}
          allExercises={allExercises}
          lang={lang}
          onConfirm={handleImportConfirm}
          onClose={() => setImportCandidate(null)}
        />
      )}
    </SafeAreaView>
  );
}
