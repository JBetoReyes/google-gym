/**
 * useAds — click-counter based ad trigger system.
 *
 * Every qualifying button click increments a counter stored in localStorage.
 * When counter >= threshold (fetched from GET /config on app load), an ad is shown.
 * Premium users skip ads entirely.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '@shared/utils/storage';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_THRESHOLD = 5;

export function useAds() {
  const { plan } = useAuth();
  const [showAd, setShowAd] = useState(false);
  const threshold = useRef(DEFAULT_THRESHOLD);

  // Fetch config once on mount
  useEffect(() => {
    api
      .get<Record<string, { clicks_between_ads?: number }>>('/config')
      .then(config => {
        const freq = config['ad_frequency']?.clicks_between_ads;
        if (typeof freq === 'number') threshold.current = freq;
      })
      .catch(() => {/* use default */});
  }, []);

  const recordClick = useCallback(() => {
    if (plan === 'premium') return; // no ads for premium

    const current = parseInt(localStorage.getItem(STORAGE_KEYS.AD_CLICK_COUNT) ?? '0', 10);
    const next = current + 1;

    if (next >= threshold.current) {
      localStorage.setItem(STORAGE_KEYS.AD_CLICK_COUNT, '0');
      setShowAd(true);
    } else {
      localStorage.setItem(STORAGE_KEYS.AD_CLICK_COUNT, String(next));
    }
  }, [plan]);

  const dismissAd = useCallback(() => setShowAd(false), []);

  return { showAd, recordClick, dismissAd };
}
