/**
 * expo-notifications wrappers.
 *
 * ISOLATION RULE: Only this file imports from 'expo-notifications'.
 * All other modules that need notification functionality must import
 * from this service instead.
 */
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/stores/settingsStore';

const DAILY_WALK_REMINDER_ID = 'daily-walk-reminder';
const CHECKIN_REMINDER_ID = 'checkin-reminder';

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------

/**
 * Schedule a daily walk reminder at 09:00 local time.
 * If 09:00 falls within quiet hours [quietHoursStart, quietHoursEnd),
 * the reminder is advanced to quietHoursEnd:05 instead.
 * No-op when notifications are disabled in settings.
 */
export async function scheduleDailyWalkReminder(
  quietHoursStart: number,
  quietHoursEnd: number,
): Promise<void> {
  const { notificationsEnabled } = useSettingsStore.getState();
  if (!notificationsEnabled) return;

  // Cancel any existing scheduled reminder before re-scheduling.
  await cancelDailyWalkReminder();

  let triggerHour = 9;
  let triggerMinute = 0;

  // Check if 09:00 falls inside quiet hours.
  // Quiet hours can wrap midnight (e.g. start=22, end=7).
  function isInsideQuietHours(hour: number): boolean {
    if (quietHoursStart <= quietHoursEnd) {
      // Non-wrapping range (e.g. 10–18)
      return hour >= quietHoursStart && hour < quietHoursEnd;
    } else {
      // Wrapping range (e.g. 22–7)
      return hour >= quietHoursStart || hour < quietHoursEnd;
    }
  }

  if (isInsideQuietHours(triggerHour)) {
    triggerHour = quietHoursEnd;
    triggerMinute = 5;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_WALK_REMINDER_ID,
    content: {
      title: 'Time for a walk!',
      body: 'Your pet is waiting for you. Take a stroll today.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: triggerHour,
      minute: triggerMinute,
    },
  });
}

export async function cancelDailyWalkReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_WALK_REMINDER_ID);
}

/**
 * Schedule a one-time check-in reminder for the next occurrence of 08:00 local time.
 * No-op when notifications are disabled in settings.
 */
export async function scheduleCheckinReminder(): Promise<void> {
  const { notificationsEnabled } = useSettingsStore.getState();
  if (!notificationsEnabled) return;

  await Notifications.cancelScheduledNotificationAsync(CHECKIN_REMINDER_ID);

  await Notifications.scheduleNotificationAsync({
    identifier: CHECKIN_REMINDER_ID,
    content: {
      title: 'Daily check-in ready!',
      body: 'Open PawStep to claim your daily reward.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
}
