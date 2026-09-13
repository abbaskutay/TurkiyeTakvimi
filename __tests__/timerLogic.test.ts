import { describe, it } from 'node:test';
import assert from 'node:assert';

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function calculateActivePrayer(
  currentTimeStr: string,
  prayerTimes: { id: string; time: string }[]
): string {
  const currentMinutes = timeToMinutes(currentTimeStr);
  let active = prayerTimes[prayerTimes.length - 1]?.id || 'yatsi';
  for (let i = 0; i < prayerTimes.length; i++) {
    if (timeToMinutes(prayerTimes[i].time) > currentMinutes) {
      active = i === 0 ? prayerTimes[prayerTimes.length - 1].id : prayerTimes[i - 1].id;
      break;
    }
  }
  return active;
}

function calculateCountdown(
  now: Date,
  targetSet: { id: string; name: string; time: string }[],
  tomorrowSet: { id: string; name: string; time: string }[]
) {
  const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();

  let nextTime = targetSet.find(p => timeToMinutes(p.time) > currentMinutesTotal);
  let targetDate = new Date(now);

  if (!nextTime) {
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
    diffSec,
    progress,
    isTomorrow: !targetSet.some(p => timeToMinutes(p.time) > currentMinutesTotal),
  };
}

const mainTimes = [
  { id: 'imsak', name: 'İmsak', time: '05:10' },
  { id: 'gunes', name: 'Güneş', time: '06:40' },
  { id: 'ogle', name: 'Öğle', time: '13:05' },
  { id: 'ikindi', name: 'İkindi', time: '16:40' },
  { id: 'aksam', name: 'Akşam', time: '19:15' },
  { id: 'yatsi', name: 'Yatsı', time: '20:40' },
];

const gridTimes = [
  { id: 'imsak', name: 'İmsak', time: '05:10' },
  { id: 'sabah', name: 'Sabah', time: '05:30' },
  { id: 'gunes', name: 'Güneş', time: '06:40' },
  { id: 'israk', name: 'İşrak', time: '07:30' },
  { id: 'dahve', name: 'Dahve', time: '12:00' },
  { id: 'kerahet', name: 'Kerâhet', time: '12:40' },
  { id: 'ogle', name: 'Öğle', time: '13:05' },
  { id: 'asr_evvel', name: 'Asr-ı evvel', time: '16:40' },
  { id: 'asr_sani', name: 'Asr-ı sânî', time: '17:20' },
  { id: 'isfirar', name: 'İsfirâr', time: '18:50' },
  { id: 'aksam', name: 'Akşam', time: '19:15' },
  { id: 'istibak', name: 'İştibâk', time: '20:10' },
  { id: 'isa_evvel', name: 'İşâ-i evvel', time: '20:40' },
  { id: 'isa_sani', name: 'İşâ-i sânî', time: '21:00' },
  { id: 'gece_yarisi', name: 'Gece Yarısı', time: '00:10' },
  { id: 'teheccud', name: 'Teheccüd', time: '02:00' },
  { id: 'seher', name: 'Seher', time: '04:00' },
  { id: 'kible_saati', name: 'Kıble Saati', time: '11:35' },
];

describe('timerLogic - Active Prayer Resolution', () => {
  it('correctly resolves active prayer before imsak (02:00)', () => {
    assert.strictEqual(calculateActivePrayer('02:00', mainTimes), 'yatsi');
  });

  it('correctly resolves active prayer between imsak and gunes (06:00)', () => {
    assert.strictEqual(calculateActivePrayer('06:00', mainTimes), 'imsak');
  });

  it('correctly resolves active prayer between gunes and ogle (09:30)', () => {
    assert.strictEqual(calculateActivePrayer('09:30', mainTimes), 'gunes');
  });

  it('correctly resolves active prayer between ogle and ikindi (14:15)', () => {
    assert.strictEqual(calculateActivePrayer('14:15', mainTimes), 'ogle');
  });

  it('correctly resolves active prayer between ikindi and aksam (17:30)', () => {
    assert.strictEqual(calculateActivePrayer('17:30', mainTimes), 'ikindi');
  });

  it('correctly resolves active prayer between aksam and yatsi (20:00)', () => {
    assert.strictEqual(calculateActivePrayer('20:00', mainTimes), 'aksam');
  });

  it('correctly resolves active prayer after yatsi until midnight (22:15)', () => {
    assert.strictEqual(calculateActivePrayer('22:15', mainTimes), 'yatsi');
  });
});

describe('timerLogic - Countdown & Rollover', () => {
  it('computes countdown accurately within the same day', () => {
    // 12:05 -> Next is Öğle (13:05) -> exactly 1 hour remaining
    const testNow = new Date(2026, 8, 12, 12, 5, 0);
    const countdown = calculateCountdown(testNow, mainTimes, mainTimes);

    assert.strictEqual(countdown.id, 'ogle');
    assert.strictEqual(countdown.name, 'Öğle');
    assert.strictEqual(countdown.h, '01');
    assert.strictEqual(countdown.m, '00');
    assert.strictEqual(countdown.s, '00');
    assert.strictEqual(countdown.diffSec, 3600);
    assert.strictEqual(countdown.isTomorrow, false);
  });

  it('computes countdown with rollover to tomorrow when past yatsi', () => {
    // 22:40 -> Next is tomorrow's İmsak (05:10) -> 6 hours 30 mins
    const testNow = new Date(2026, 8, 12, 22, 40, 0);
    const countdown = calculateCountdown(testNow, mainTimes, mainTimes);

    assert.strictEqual(countdown.id, 'imsak');
    assert.strictEqual(countdown.isTomorrow, true);
    assert.strictEqual(countdown.h, '06');
    assert.strictEqual(countdown.m, '30');
    assert.strictEqual(countdown.s, '00');
    assert.strictEqual(countdown.diffSec, 6 * 3600 + 30 * 60);
  });

  it('clamps progress between 0 and 100', () => {
    const testNowFar = new Date(2026, 8, 12, 21, 0, 0); // 8+ hours before imsak
    const cFar = calculateCountdown(testNowFar, mainTimes, mainTimes);
    assert(cFar.progress >= 0 && cFar.progress <= 100);

    const testNowClose = new Date(2026, 8, 12, 13, 4, 30); // 30 seconds before ogle
    const cClose = calculateCountdown(testNowClose, mainTimes, mainTimes);
    assert(cClose.progress > 95 && cClose.progress <= 100);
  });
});

describe('timerLogic - 18 Vakit Active Prayer & Countdown', () => {
  const sortedGrid = [...gridTimes].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  it('correctly resolves active prayer across 18 periods', () => {
    assert.strictEqual(calculateActivePrayer('01:00', sortedGrid), 'gece_yarisi');
    assert.strictEqual(calculateActivePrayer('03:00', sortedGrid), 'teheccud');
    assert.strictEqual(calculateActivePrayer('04:30', sortedGrid), 'seher');
    assert.strictEqual(calculateActivePrayer('05:20', sortedGrid), 'imsak');
    assert.strictEqual(calculateActivePrayer('06:00', sortedGrid), 'sabah');
    assert.strictEqual(calculateActivePrayer('07:00', sortedGrid), 'gunes');
    assert.strictEqual(calculateActivePrayer('08:00', sortedGrid), 'israk');
    assert.strictEqual(calculateActivePrayer('11:45', sortedGrid), 'kible_saati');
    assert.strictEqual(calculateActivePrayer('12:15', sortedGrid), 'dahve');
    assert.strictEqual(calculateActivePrayer('12:50', sortedGrid), 'kerahet');
    assert.strictEqual(calculateActivePrayer('17:00', sortedGrid), 'asr_evvel');
    assert.strictEqual(calculateActivePrayer('18:00', sortedGrid), 'asr_sani');
    assert.strictEqual(calculateActivePrayer('22:00', sortedGrid), 'isa_sani');
  });

  it('computes 18-vakit countdown to next detailed period within the same day', () => {
    // 10:00 -> Next is Kıble Saati (11:35) -> 1h 35m
    const testNow1 = new Date(2026, 8, 12, 10, 0, 0);
    const c1 = calculateCountdown(testNow1, sortedGrid, sortedGrid);
    assert.strictEqual(c1.id, 'kible_saati');
    assert.strictEqual(c1.h, '01');
    assert.strictEqual(c1.m, '35');
    assert.strictEqual(c1.isTomorrow, false);

    // 11:40 -> Next is Dahve (12:00) -> 20m
    const testNow2 = new Date(2026, 8, 12, 11, 40, 0);
    const c2 = calculateCountdown(testNow2, sortedGrid, sortedGrid);
    assert.strictEqual(c2.id, 'dahve');
    assert.strictEqual(c2.h, '00');
    assert.strictEqual(c2.m, '20');
    assert.strictEqual(c2.isTomorrow, false);

    // 12:15 -> Next is Kerâhet (12:40) -> 25m
    const testNow3 = new Date(2026, 8, 12, 12, 15, 0);
    const c3 = calculateCountdown(testNow3, sortedGrid, sortedGrid);
    assert.strictEqual(c3.id, 'kerahet');
    assert.strictEqual(c3.h, '00');
    assert.strictEqual(c3.m, '25');
    assert.strictEqual(c3.isTomorrow, false);
  });

  it('computes 18-vakit countdown with rollover after isa_sani to tomorrow gece_yarisi', () => {
    // 22:00 -> Next is tomorrow Gece Yarısı (00:10) -> 2h 10m
    const testNow = new Date(2026, 8, 12, 22, 0, 0);
    const c = calculateCountdown(testNow, sortedGrid, sortedGrid);
    assert.strictEqual(c.id, 'gece_yarisi');
    assert.strictEqual(c.isTomorrow, true);
    assert.strictEqual(c.h, '02');
    assert.strictEqual(c.m, '10');
    assert.strictEqual(c.diffSec, 2 * 3600 + 10 * 60);
  });
});
