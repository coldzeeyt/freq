import * as Notifications from 'expo-notifications';
import { upcomingMoments } from './onAir';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export const remindersSupported = true;

export async function remindersEnabled() {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Asks for permission (once) and schedules the next week of On Air alerts. */
export async function scheduleOnAirReminders(ask: boolean): Promise<boolean> {
  let granted = (await Notifications.getPermissionsAsync()).granted;
  if (!granted && ask) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const tz = new Date().getTimezoneOffset();
  for (const m of upcomingMoments(Date.now(), tz, 7)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Freq is On Air', body: 'You have 2 minutes. Show what you’re doing right now.', data: { url: '/onair' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: m.startsAt },
    });
  }
  return true;
}
