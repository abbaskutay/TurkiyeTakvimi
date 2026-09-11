import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderConfig } from '../types';
import { ApiVakitItem } from './turkTakvimApi';

// Configure default notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PRAYER_DISPLAY_NAMES: Record<string, string> = {
  imsak: 'İmsak',
  gunes: 'Güneş',
  ogle: 'Öğle',
  ikindi: 'İkindi',
  aksam: 'Akşam',
  yatsi: 'Yatsı',
};

// Maximum days to schedule ahead (7 days * 6 prayers = max 42 notifications, under iOS limit of 64)
const MAX_SCHEDULE_DAYS = 7;

export const notificationService = {
  /**
   * Requests push/local notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('ezan-vakitleri', {
          name: 'Ezan Vakti Bildirimleri',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#a01826',
          sound: 'default',
        });
      }

      return true;
    } catch (e) {
      console.error('Permission request error:', e);
      return false;
    }
  },

  /**
   * Cancels all scheduled prayer notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.error('Cancel notifications error:', e);
    }
  },

  /**
   * Schedules prayer notifications for upcoming days based on user reminders
   */
  async schedulePrayerNotifications(
    vakitList: ApiVakitItem[],
    reminders: Record<string, ReminderConfig>,
    globalEnabled: boolean,
    cityName: string
  ): Promise<number> {
    if (!globalEnabled) {
      await this.cancelAllNotifications();
      return 0;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return 0;
    }

    await this.cancelAllNotifications();

    let scheduledCount = 0;
    const now = new Date();

    // Iterate through available days (next 7 days max to respect iOS 64-notification cap)
    for (const vakit of vakitList.slice(0, MAX_SCHEDULE_DAYS)) {
      const dateStr = vakit['@attributes']?.tarih; // "YYYY-MM-DD"
      if (!dateStr) continue;

      const [year, month, day] = dateStr.split('-').map(Number);

      const mainTimes: Record<string, string> = {
        imsak: vakit.imsak,
        gunes: vakit.gunes,
        ogle: vakit.ogle,
        ikindi: vakit.ikindi,
        aksam: vakit.aksam,
        yatsi: vakit.yatsi,
      };

      for (const [prayerId, timeStr] of Object.entries(mainTimes)) {
        const config = reminders[prayerId];
        if (!config || !config.enabled) continue;

        if (!timeStr || !timeStr.includes(':')) continue;
        const [h, m] = timeStr.split(':').map(Number);

        // Target prayer date & time
        const prayerDate = new Date(year, month - 1, day, h, m, 0, 0);

        // Apply offset (minutes before prayer)
        const triggerDate = new Date(prayerDate.getTime() - config.offset * 60 * 1000);

        // Only schedule if the trigger time is in the future
        if (triggerDate.getTime() > now.getTime()) {
          const prayerName = PRAYER_DISPLAY_NAMES[prayerId] || prayerId;
          const bodyText =
            config.offset === 0
              ? `${cityName} için ${prayerName} vakti girdi.`
              : `${cityName} için ${prayerName} vaktine ${config.offset} dakika kaldı.`;

          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: config.offset === 0 ? `🕌 ${prayerName} Vakti Girdi` : `⏰ ${prayerName} Vakti Yaklaşıyor`,
                body: bodyText,
                sound: 'default',
                data: { prayerId, cityName, dateStr },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
                channelId: 'ezan-vakitleri',
              },
            });
            scheduledCount++;
          } catch (err) {
            console.error(`Error scheduling ${prayerId} notification:`, err);
          }
        }
      }
    }

    console.log(`Scheduled ${scheduledCount} prayer notifications for ${cityName}.`);
    return scheduledCount;
  },
};
