/**
 * useIAP — in-app purchase hook via expo-iap.
 * Handles iOS App Store + Google Play subscriptions.
 */
import { useCallback, useEffect, useState } from 'react';
import * as IAP from 'expo-iap';
import { api } from '@/services/api';

const PREMIUM_SKU = process.env['EXPO_PUBLIC_IAP_PREMIUM_SKU'] ?? 'gymtracker_premium_monthly';

export function useIAP() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    IAP.initConnection().catch(() => {});
    return () => { IAP.endConnection(); };
  }, []);

  const purchase = useCallback(async () => {
    setLoading(true);
    try {
      await IAP.requestSubscription({ sku: PREMIUM_SKU });
      // Backend webhook handles plan upgrade; poll status
      const status = await api.get<{ plan: string }>('/preferences');
      setIsPremium(status.plan === 'premium');
    } catch {
      // User cancelled or error
    } finally {
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      await IAP.getPurchaseHistory();
      const status = await api.get<{ plan: string }>('/preferences');
      setIsPremium(status.plan === 'premium');
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  return { isPremium, loading, purchase, restore };
}
