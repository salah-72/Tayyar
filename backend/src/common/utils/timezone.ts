function offsetMinutes(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(
    g('year'),
    g('month') - 1,
    g('day'),
    g('hour'),
    g('minute'),
    g('second'),
  );
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

function startOfDayUtc(dateStr: string, tz: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const naive = Date.UTC(y, m - 1, d);
  let guess = naive - offsetMinutes(naive, tz) * 60000;
  guess = naive - offsetMinutes(guess, tz) * 60000; // تصحيح لو الفرق اتغير (توقيت صيفي)
  return guess;
}

export function dayRange(
  dateStr: string,
  tz: string,
): { from: Date; to: Date } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return {
    from: new Date(startOfDayUtc(dateStr, tz)),
    to: new Date(startOfDayUtc(next, tz)),
  };
}

export const todayIn = (tz: string, now = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
