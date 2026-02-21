/**
 * useIAP — in-app purchase hook.
 *
 * expo-iap was deprecated in Expo SDK 52 and does not work in Expo Go.
 * For production IAP, install react-native-iap via EAS Build and replace
 * the stubs below with real calls.
 *
 * Stub keeps the same public interface so no callers need to change.
 */
import { useCallback, useState } from 'react';

export function useIAP() {
  const [isPremium] = useState(false);
  const [loading] = useState(false);

  const purchase = useCallback(async () => {
    // Stub: no-op in Expo Go. Wire up react-native-iap via EAS Build.
  }, []);

  const restore = useCallback(async () => {
    // Stub: no-op in Expo Go.
  }, []);

  return { isPremium, loading, purchase, restore };
}
