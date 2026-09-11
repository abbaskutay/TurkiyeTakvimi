import { useState, useEffect, useMemo } from 'react';
import { PrayerTime, DetailedPrayerTime } from '../types';

export interface CountdownInfo {
  name: string;
  id: string;
  h: string;
  m: string;
  s: string;
  progress: number;
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Custom hook that updates every second and calculates countdown info
 * for the next upcoming prayer or detailed prayer time.
 */
export function useTimer(
  activePage: number,
  mainPrayerTimes: PrayerTime[],
  flattenedGridTimes: DetailedPrayerTime[],
  tomorrowMainPrayerTimes: PrayerTime[],
  tomorrowGridTimes: DetailedPrayerTime[]
): { now: Date; countdownInfo: CountdownInfo; activePrayerId: string } {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activePrayerId = useMemo(() => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let active = mainPrayerTimes[mainPrayerTimes.length - 1]?.id || 'yatsi';
    for (let i = 0; i < mainPrayerTimes.length; i++) {
      if (timeToMinutes(mainPrayerTimes[i].time) > currentMinutes) {
        active = i === 0 ? mainPrayerTimes[mainPrayerTimes.length - 1].id : mainPrayerTimes[i - 1].id;
        break;
      }
    }
    return active;
  }, [now, mainPrayerTimes]);

  const countdownInfo = useMemo<CountdownInfo>(() => {
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();
    const targetSet = activePage === 0 ? mainPrayerTimes : flattenedGridTimes;

    let nextTime = targetSet.find(p => timeToMinutes(p.time) > currentMinutesTotal);
    let targetDate = new Date(now);

    if (!nextTime) {
      const tomorrowSet = activePage === 0 ? tomorrowMainPrayerTimes : tomorrowGridTimes;
      nextTime = tomorrowSet[0] || targetSet[0];
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const [h, m] = (nextTime?.time || '00:00').split(':').map(Number);
    targetDate.setHours(h, m, 0, 0);

    const diffMs = targetDate.getTime() - now.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));

    const pad = (n: number) => n.toString().padStart(2, '0');
    const totalDurationMs = 4 * 3600 * 1000;
    const progress = Math.max(0, Math.min(100, 100 - (diffMs / totalDurationMs) * 100));

    return {
      name: nextTime?.name || 'Vakit',
      id: nextTime?.id || 'vakit',
      h: pad(Math.floor(diffSec / 3600)),
      m: pad(Math.floor((diffSec % 3600) / 60)),
      s: pad(diffSec % 60),
      progress,
    };
  }, [now, activePage, mainPrayerTimes, flattenedGridTimes, tomorrowMainPrayerTimes, tomorrowGridTimes]);

  return { now, countdownInfo, activePrayerId };
}
