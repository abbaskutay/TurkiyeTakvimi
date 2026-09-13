import { useState, useEffect, useMemo } from 'react';
import { PrayerTime, DetailedPrayerTime } from '../types';
import { timeToMinutes } from '../utils/dateUtils';

export interface CountdownInfo {
  name: string;
  id: string;
  h: string;
  m: string;
  s: string;
  progress: number;
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

  const chronologicalGridTimes = useMemo(() => {
    return [...flattenedGridTimes].sort(
      (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
    );
  }, [flattenedGridTimes]);

  const chronologicalTomorrowGridTimes = useMemo(() => {
    return [...tomorrowGridTimes].sort(
      (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
    );
  }, [tomorrowGridTimes]);

  const activePrayerId = useMemo(() => {
    const target = activePage === 0 ? mainPrayerTimes : chronologicalGridTimes;
    if (!target || target.length === 0) return 'yatsi';
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let active = target[target.length - 1]?.id || (activePage === 0 ? 'yatsi' : 'isa_sani');
    for (let i = 0; i < target.length; i++) {
      if (timeToMinutes(target[i].time) > currentMinutes) {
        active = i === 0 ? target[target.length - 1].id : target[i - 1].id;
        break;
      }
    }
    return active;
  }, [now, activePage, mainPrayerTimes, chronologicalGridTimes]);

  const countdownInfo = useMemo<CountdownInfo>(() => {
    const targetSet = activePage === 0 ? mainPrayerTimes : chronologicalGridTimes;
    const tomorrowSet = activePage === 0 ? tomorrowMainPrayerTimes : chronologicalTomorrowGridTimes;

    if (!targetSet || targetSet.length === 0) {
      return { name: 'Vakit', id: 'vakit', h: '00', m: '00', s: '00', progress: 0 };
    }

    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();

    let nextIndex = targetSet.findIndex(p => timeToMinutes(p.time) > currentMinutesTotal);
    let nextTime = nextIndex !== -1 ? targetSet[nextIndex] : undefined;
    let prevTime = nextIndex > 0 ? targetSet[nextIndex - 1] : undefined;

    let targetDate = new Date(now);
    let prevDate = new Date(now);

    if (!nextTime) {
      // Past the last prayer of the day (e.g. after Yatsı or after İşâ-i sânî)
      // -> next is tomorrow's first prayer
      nextTime = tomorrowSet[0] || targetSet[0];
      targetDate.setDate(targetDate.getDate() + 1);
      prevTime = targetSet[targetSet.length - 1];
    } else if (!prevTime) {
      // Before today's first prayer (between midnight and first prayer)
      // -> previous was yesterday's last prayer
      prevTime = targetSet[targetSet.length - 1];
      prevDate.setDate(prevDate.getDate() - 1);
    }

    const [h, m] = (nextTime?.time || '00:00').split(':').map(Number);
    targetDate.setHours(h, m, 0, 0);

    const [prevH, prevM] = (prevTime?.time || '00:00').split(':').map(Number);
    prevDate.setHours(prevH, prevM, 0, 0);

    const totalIntervalMs = Math.max(1000, targetDate.getTime() - prevDate.getTime());
    const elapsedMs = Math.max(0, now.getTime() - prevDate.getTime());
    const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
    const diffSec = Math.floor(diffMs / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const progress = Math.max(0, Math.min(100, Math.round((elapsedMs / totalIntervalMs) * 100)));

    return {
      name: nextTime?.name || 'Vakit',
      id: nextTime?.id || 'vakit',
      h: pad(Math.floor(diffSec / 3600)),
      m: pad(Math.floor((diffSec % 3600) / 60)),
      s: pad(diffSec % 60),
      progress,
    };
  }, [
    now,
    activePage,
    mainPrayerTimes,
    chronologicalGridTimes,
    tomorrowMainPrayerTimes,
    chronologicalTomorrowGridTimes,
  ]);

  return { now, countdownInfo, activePrayerId };
}
