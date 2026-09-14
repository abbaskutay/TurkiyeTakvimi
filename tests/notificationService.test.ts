import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { notificationService } from '../services/notificationService';
import { mockNotificationState } from './mocks/expoNotificationsMock';
import { ReminderConfig } from '../types';
import { ApiVakitItem } from '../services/turkishCalendarApi';

function createFutureVakit(daysAhead: number): ApiVakitItem {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const tarih = `${year}-${month}-${day}`;

  return {
    '@attributes': { tarih, gun: 'Pazartesi', hicri: '15 RECEB 1447' },
    imsak: '05:30',
    sabah: '05:50',
    gunes: '07:00',
    israk: '07:50',
    dahve: '12:15',
    kerahet: '12:55',
    ogle: '13:15',
    ikindi: '16:45',
    asrisani: '17:25',
    isfirar: '18:55',
    aksam: '19:20',
    istibak: '20:15',
    yatsi: '20:45',
    isaisani: '21:05',
    geceyarisi: '00:15',
    teheccud: '02:15',
    seher: '04:15',
    kible: '11:40',
  };
}

describe('notificationService - Permissions & Cancellation', () => {
  beforeEach(() => {
    mockNotificationState.reset();
  });

  it('requestPermissions returns true when status is granted', async () => {
    mockNotificationState.permissionStatus = 'granted';
    const granted = await notificationService.requestPermissions();
    assert.strictEqual(granted, true);
  });

  it('requestPermissions returns false when denied', async () => {
    mockNotificationState.permissionStatus = 'denied';
    const granted = await notificationService.requestPermissions();
    assert.strictEqual(granted, false);
  });

  it('cancelAllNotifications calls cancel on expo-notifications', async () => {
    await notificationService.cancelAllNotifications();
    assert.strictEqual(mockNotificationState.cancelAllCount, 1);
  });
});

describe('notificationService - Schedule Notifications', () => {
  beforeEach(() => {
    mockNotificationState.reset();
  });

  it('cancels all and returns 0 if globalEnabled is false', async () => {
    const vakitList = [createFutureVakit(1)];
    const reminders: Record<string, ReminderConfig> = {
      imsak: { enabled: true, offset: 0 },
    };

    const count = await notificationService.schedulePrayerNotifications(
      vakitList,
      reminders,
      false, // global disabled
      'İstanbul'
    );

    assert.strictEqual(count, 0);
    assert.strictEqual(mockNotificationState.cancelAllCount >= 1, true);
    assert.strictEqual(mockNotificationState.scheduledNotifications.length, 0);
  });

  it('returns 0 without scheduling if permission is denied', async () => {
    mockNotificationState.permissionStatus = 'denied';
    const vakitList = [createFutureVakit(1)];
    const reminders: Record<string, ReminderConfig> = {
      imsak: { enabled: true, offset: 0 },
    };

    const count = await notificationService.schedulePrayerNotifications(
      vakitList,
      reminders,
      true,
      'İstanbul'
    );

    assert.strictEqual(count, 0);
    assert.strictEqual(mockNotificationState.scheduledNotifications.length, 0);
  });

  it('schedules notifications for enabled prayers in future days with correct text and offsets', async () => {
    const vakitList = [
      createFutureVakit(1), // Tomorrow
      createFutureVakit(2), // Day after tomorrow
    ];

    const reminders: Record<string, ReminderConfig> = {
      imsak: { enabled: true, offset: 0 },   // exact time
      ogle: { enabled: true, offset: 15 },   // 15 mins before
      aksam: { enabled: false, offset: 5 },  // disabled, should not schedule
    };

    const count = await notificationService.schedulePrayerNotifications(
      vakitList,
      reminders,
      true,
      'İstanbul'
    );

    // 2 days * 2 enabled prayers (imsak + ogle) = 4 notifications
    assert.strictEqual(count, 4);
    assert.strictEqual(mockNotificationState.scheduledNotifications.length, 4);

    // Check exact-time imsak notification formatting
    const imsakNotif = mockNotificationState.scheduledNotifications.find(n => n.content.data.prayerId === 'imsak');
    assert.notStrictEqual(imsakNotif, undefined);
    assert.strictEqual(imsakNotif.content.title, '🕌 İmsak Vakti Girdi');
    assert.strictEqual(imsakNotif.content.body, 'İstanbul için İmsak vakti girdi.');

    // Check 15-minute before ogle notification formatting
    const ogleNotif = mockNotificationState.scheduledNotifications.find(n => n.content.data.prayerId === 'ogle');
    assert.notStrictEqual(ogleNotif, undefined);
    assert.strictEqual(ogleNotif.content.title, '⏰ Öğle Vakti Yaklaşıyor');
    assert.strictEqual(ogleNotif.content.body, 'İstanbul için Öğle vaktine 15 dakika kaldı.');
  });

  it('respects MAX_SCHEDULE_DAYS cap (does not schedule past 7 days)', async () => {
    // Generate 15 days of future data
    const vakitList = Array.from({ length: 15 }, (_, i) => createFutureVakit(i + 1));
    const reminders: Record<string, ReminderConfig> = {
      yatsi: { enabled: true, offset: 5 },
    };

    const count = await notificationService.schedulePrayerNotifications(
      vakitList,
      reminders,
      true,
      'Ankara'
    );

    // Max 7 days * 1 prayer = 7
    assert.strictEqual(count, 7);
  });
});
