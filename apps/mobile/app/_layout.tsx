import './global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { INITIAL_ROUTINES } from '@shared/constants/routines';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { WorkoutProvider } from '../context/WorkoutContext';

/** Seed default routines exactly once on first launch. */
async function seedIfNeeded() {
  const seeded = await AsyncStorage.getItem('gym_seeded');
  if (seeded) return;
  // Parse what's stored — treat missing or empty array as "needs seeding"
  const raw = await AsyncStorage.getItem('gym_routines');
  let stored: unknown[] = [];
  try { stored = JSON.parse(raw ?? '[]') as unknown[]; } catch { /* ignore */ }
  if (stored.length === 0) {
    await AsyncStorage.setItem('gym_routines', JSON.stringify(INITIAL_ROUTINES));
  }
  await AsyncStorage.setItem('gym_seeded', '1');
}

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    seedIfNeeded()
      .catch(() => {})
      .finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
      <WorkoutProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/index" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="routines/new" options={{ headerShown: true, title: 'New Routine', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="routines/[id]/edit" options={{ headerShown: true, title: 'Edit Routine', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="auth" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </WorkoutProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
