/**
 * useRestTimer — same countdown logic as web, but:
 * - Uses expo-haptics instead of navigator.vibrate
 * - Uses expo-notifications for background rest-done push
 * - Audio beep via expo-av (if available)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

export function useRestTimer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef  = useRef<string | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSeconds(0);
    if (notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      notifIdRef.current = null;
    }
  }, []);

  const start = useCallback(async (duration: number) => {
    clear();
    setSeconds(duration);

    // Schedule a push notification in case app is backgrounded
    const notifId = await Notifications.scheduleNotificationAsync({
      content: { title: 'Rest done!', body: 'Time to get back to work 💪' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: duration },
    });
    notifIdRef.current = notifId;

    let remaining = duration;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSeconds(remaining);
      if (remaining <= 0) {
        clear();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);
  }, [clear]);

  useEffect(() => () => clear(), [clear]);

  return { seconds, start, clear, isRunning: seconds > 0 };
}
