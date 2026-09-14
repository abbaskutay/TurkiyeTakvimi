// In-memory state for tracking in tests
export const mockNotificationState = {
  permissionStatus: 'granted',
  scheduledNotifications: [] as any[],
  cancelAllCount: 0,
  channelConfig: null as any,
  notificationHandler: null as any,
  reset() {
    this.permissionStatus = 'granted';
    this.scheduledNotifications = [];
    this.cancelAllCount = 0;
    this.channelConfig = null;
  }
};

export const AndroidImportance = {
  MAX: 5,
  HIGH: 4,
  DEFAULT: 3,
  LOW: 2,
  MIN: 1,
  NONE: 0,
};

export const SchedulableTriggerInputTypes = {
  DATE: 'date',
  TIME_INTERVAL: 'timeInterval',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

export function setNotificationHandler(handler: any) {
  mockNotificationState.notificationHandler = handler;
}

export async function getPermissionsAsync() {
  return { status: mockNotificationState.permissionStatus };
}

export async function requestPermissionsAsync() {
  return { status: mockNotificationState.permissionStatus };
}

export async function setNotificationChannelAsync(channelId: string, channel: any) {
  mockNotificationState.channelConfig = { channelId, ...channel };
}

export async function cancelAllScheduledNotificationsAsync() {
  mockNotificationState.cancelAllCount++;
  mockNotificationState.scheduledNotifications = [];
}

export async function scheduleNotificationAsync(request: any) {
  mockNotificationState.scheduledNotifications.push(request);
  return `mock_notif_${Date.now()}_${Math.random()}`;
}
