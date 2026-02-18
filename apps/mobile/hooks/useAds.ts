/**
 * Mobile ad hook — same click-counter logic as web,
 * but uses Expo AdMob interstitials instead of AdSense modals.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdMobInterstitial } from 'expo-ads-admob';
import { api } from '@/services/api';

const AD_KEY = 'gym_ad_clicks';
const DEFAULT_THRESHOLD = 5;

export function useAds(isPremium: boolean) {
  const threshold = useRef(DEFAULT_THRESHOLD);
  const [adReady, setAdReady] = useState(false);

  useEffect(() => {
    // Fetch threshold from API
    api
      .get<Record<string, { clicks_between_ads?: number }>>('/config')
      .then(config => {
        const freq = config['ad_frequency']?.clicks_between_ads;
        if (typeof freq === 'number') threshold.current = freq;
      })
      .catch(() => {});

    // Pre-load first interstitial
    const adUnitId = process.env['EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID'] ?? 'ca-app-pub-3940256099942544/1033173712'; // test ID
    AdMobInterstitial.setAdUnitID(adUnitId);
    AdMobInterstitial.requestAdAsync({ servePersonalizedAds: false })
      .then(() => setAdReady(true))
      .catch(() => {});
  }, []);

  const recordClick = useCallback(async () => {
    if (isPremium) return;

    const stored = await AsyncStorage.getItem(AD_KEY);
    const current = stored ? parseInt(stored, 10) : 0;
    const next = current + 1;

    if (next >= threshold.current) {
      await AsyncStorage.setItem(AD_KEY, '0');
      if (adReady) {
        try {
          await AdMobInterstitial.showAdAsync();
          // Pre-load next ad
          await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: false });
        } catch {/* ignore */}
      }
    } else {
      await AsyncStorage.setItem(AD_KEY, String(next));
    }
  }, [isPremium, adReady]);

  return { recordClick };
}
