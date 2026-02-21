/**
 * Mobile ad hook — click-counter logic that shows an interstitial every N actions.
 *
 * AdMob integration is intentionally stubbed here. expo-ads-admob was removed in
 * Expo SDK 52. When building for production with EAS, install
 * react-native-google-mobile-ads and replace the stub below with real calls.
 *
 * Stub keeps the same public interface so no callers need to change.
 */
import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AD_KEY = 'gym_ad_clicks';
const DEFAULT_THRESHOLD = 5;

// ---------------------------------------------------------------------------
// Swap this section for the real react-native-google-mobile-ads calls when
// you add the native library to your EAS build.
// ---------------------------------------------------------------------------
const Ads = {
  setAdUnitID: (_id: string) => {},
  requestAd: async () => {},
  showAd: async () => {},
};
// ---------------------------------------------------------------------------

export function useAds(isPremium: boolean) {
  const threshold = useRef(DEFAULT_THRESHOLD);
  const adReady = useRef(false);

  useEffect(() => {
    // Fetch threshold from admin config
    api
      .get<Record<string, { clicks_between_ads?: number }>>('/config')
      .then((config: Record<string, { clicks_between_ads?: number }>) => {
        const freq = config['ad_frequency']?.clicks_between_ads;
        if (typeof freq === 'number') threshold.current = freq;
      })
      .catch(() => {});

    // Pre-load interstitial (no-op stub)
    const adUnitId =
      process.env['EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID'] ??
      'ca-app-pub-3940256099942544/1033173712'; // Google test ID
    Ads.setAdUnitID(adUnitId);
    Ads.requestAd()
      .then(() => { adReady.current = true; })
      .catch(() => {});
  }, []);

  const recordClick = useCallback(async () => {
    if (isPremium) return;

    const stored = await AsyncStorage.getItem(AD_KEY);
    const current = stored ? parseInt(stored, 10) : 0;
    const next = current + 1;

    if (next >= threshold.current && adReady.current) {
      await AsyncStorage.setItem(AD_KEY, '0');
      try {
        await Ads.showAd();
        await Ads.requestAd(); // pre-load next
      } catch {
        /* ignore */
      }
    } else {
      await AsyncStorage.setItem(AD_KEY, String(next));
    }
  }, [isPremium]);

  return { recordClick };
}
