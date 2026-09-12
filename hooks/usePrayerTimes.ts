import { useState, useEffect, useCallback } from 'react';
import { turkTakvimApi, ApiVakitResponse, ApiVakitItem, ApiCityInfo, extractApiText } from '../services/turkTakvimApi';
import { storageService } from '../services/storageService';
import { getLocalDateString } from '../utils/dateUtils';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries a flaky fetch a couple of times before giving up. A cold app start
 * can race the device's network stack (WiFi/cellular not fully up yet), which
 * otherwise looks identical to being genuinely offline.
 *
 * @param fetcher the fetch to attempt
 * @param attempts total attempts including the first
 * @param delayMs delay between attempts
 * @returns the first non-empty result, or null if every attempt failed
 */
async function fetchWithRetry<T>(
  fetcher: () => Promise<T | null>,
  attempts = 3,
  delayMs = 1500
): Promise<T | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await delay(delayMs);
    try {
      const result = await fetcher();
      if (result) return result;
    } catch (e) {
      console.error(`fetchWithRetry attempt ${attempt + 1}/${attempts} failed:`, e);
    }
  }
  return null;
}

export interface CalendarDetail {
  gununSozu?: string;
  gununOlayi?: string;
}

/**
 * Loads prayer times (+ city info) and today's calendar detail for a city.
 * Cached data is shown immediately (and kept on a failed refresh) so the
 * screen stays usable offline once a city has been fetched at least once.
 *
 * @param cityID Türk Takvimi city ID
 */
export function usePrayerTimes(cityID: string) {
  const [vakitList, setVakitList] = useState<ApiVakitItem[]>([]);
  const [todayVakit, setTodayVakit] = useState<ApiVakitItem | null>(null);
  const [tomorrowVakit, setTomorrowVakit] = useState<ApiVakitItem | null>(null);
  const [cityInfo, setCityInfo] = useState<ApiCityInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarDetail, setCalendarDetail] = useState<CalendarDetail>({});
  const [isOffline, setIsOffline] = useState(false);

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

    // Serve whatever is cached immediately, so the screen never shows blank
    // while the network request is in flight (or offline entirely).
    const cachedResponse = await storageService.getCachedVakitResponse(cityID);
    if (cachedResponse?.vakit?.length) {
      setVakitList(cachedResponse.vakit);
      findAndSetVakits(cachedResponse.vakit);
      setCityInfo(cachedResponse.cityinfo?.['@attributes'] ?? null);
    }
    const cachedCalendarDay = await storageService.getCachedCalendarDay(todayStr);
    if (cachedCalendarDay) {
      setCalendarDetail({
        gununSozu: extractApiText(cachedCalendarDay.GununSozu),
        gununOlayi: extractApiText(cachedCalendarDay.GununOlayi),
      });
    }
    if (!forceRefresh && cachedResponse) {
      setLoading(false);
    }

    const res = await fetchWithRetry<ApiVakitResponse>(async () => {
      const r = await turkTakvimApi.getPrayerTimes(cityID);
      return r && r.vakit && r.vakit.length > 0 ? r : null;
    });
    if (res) {
      await storageService.setCachedVakitResponse(cityID, res);
      setVakitList(res.vakit);
      findAndSetVakits(res.vakit);
      setCityInfo(res.cityinfo?.['@attributes'] ?? null);
    }
    setIsOffline(!res && !cachedResponse);

    const calendarRes = await fetchWithRetry(async () => {
      const list = await turkTakvimApi.getCalendarDetail(todayStr, todayStr);
      return list.length > 0 ? list[0] : null;
    }, 2);
    if (calendarRes) {
      await storageService.setCachedCalendarDay(todayStr, calendarRes);
      setCalendarDetail({
        gununSozu: extractApiText(calendarRes.GununSozu),
        gununOlayi: extractApiText(calendarRes.GununOlayi),
      });
    }
    // On failure, whatever calendar detail is already in state (fresh or cached) stays.

    setLoading(false);
    setRefreshing(false);
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
    cityInfo,
    calendarDetail,
    loading,
    refreshing,
    isOffline,
    onRefresh,
    fetchPrayerTimes,
  };
}
