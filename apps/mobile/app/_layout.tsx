/**
 * Root layout — wraps all screens with providers.
 */
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

// Keep splash screen visible until fonts load
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
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="workout/index" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="routines/new" />
      <Stack.Screen name="routines/[id]/edit" />
    </Stack>
  );
}
