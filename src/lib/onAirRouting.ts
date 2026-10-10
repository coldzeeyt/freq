import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

/** Tapping an On Air alert opens the On Air screen. */
export function useOnAirNotificationRouting() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as '/onair');
    });
    return () => sub.remove();
  }, []);
}
