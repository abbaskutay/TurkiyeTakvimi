import { useState, useEffect, useCallback } from 'react';
import { turkTakvimApi, ApiVakitItem, extractApiText } from '../services/turkTakvimApi';
import { storageService } from '../services/storageService';

function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface CalendarDetail {
  gununSozu?: string;
  gununOlayi?: string;
  arkayuzBaslik?: string;
  arkayuzYazi?: string;
}

export function usePrayerTimes(cityID: string) {
  const [vakitList, setVakitList] = useState<ApiVakitItem[]>([]);
  const [todayVakit, setTodayVakit] = useState<ApiVakitItem | null>(null);
  const [tomorrowVakit, setTomorrowVakit] = useState<ApiVakitItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarDetail, setCalendarDetail] = useState<CalendarDetail>({});

  const findAndSetVakits = useCallback((list: ApiVakitItem[]) => {
    const todayDate = new Date();
    const todayStr = getLocalDateString(todayDate);

    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrowDate);

    const matchedToday = list.find(v => v['@attributes']?.tarih === todayStr);
    const matchedTomorrow = list.find(v => v['@attributes']?.tarih === tomorrowStr);

    if (matchedToday) {
      setTodayVakit(matchedToday);
    } else if (list.length > 0) {
      setTodayVakit(list[0]);
    }

    if (matchedTomorrow) {
      setTomorrowVakit(matchedTomorrow);
    }
  }, []);

  const fetchPrayerTimes = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      setLoading(true);
    }
    const todayStr = getLocalDateString(new Date());

    try {
      if (!forceRefresh) {
        const cached = await storageService.getCachedVakitData(cityID);
        if (cached && cached.length > 0) {
          setVakitList(cached);
          findAndSetVakits(cached);
          setLoading(false);
        }
      }

      // Fetch Prayer Times from Türk Takvimi API
      const res = await turkTakvimApi.getPrayerTimes(cityID);
      if (res && res.vakit && res.vakit.length > 0) {
        await storageService.setCachedVakitData(cityID, res.vakit);
        setVakitList(res.vakit);
        findAndSetVakits(res.vakit);
      }

      // Fetch Calendar Detail (GununOlayi, GununSozu, Arkayuz)
      const calendarRes = await turkTakvimApi.getCalendarDetail(todayStr, todayStr);
      if (calendarRes && calendarRes.length > 0) {
        const cal = calendarRes[0];
        setCalendarDetail({
          gununSozu: extractApiText(cal.GununSozu),
          gununOlayi: extractApiText(cal.GununOlayi),
          arkayuzBaslik: extractApiText(cal.Arkayuz?.Baslik),
          arkayuzYazi: extractApiText(cal.Arkayuz?.Yazi),
        });
      }
    } catch (e) {
      console.error('Error fetching prayer times in usePrayerTimes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cityID, findAndSetVakits]);

  useEffect(() => {
    fetchPrayerTimes();
  }, [cityID, fetchPrayerTimes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrayerTimes(true);
  }, [fetchPrayerTimes]);

  return {
    vakitList,
    todayVakit,
    tomorrowVakit,
    calendarDetail,
    loading,
    refreshing,
    onRefresh,
    fetchPrayerTimes,
  };
}
