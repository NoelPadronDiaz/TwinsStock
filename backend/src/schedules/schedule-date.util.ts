// Pure calendar-date helpers. Dates are plain 'YYYY-MM-DD' strings (no
// time-of-day), so all arithmetic is done in UTC to avoid the server's local
// timezone shifting the calendar day.

export function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function parseDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return formatDate(new Date(parseDate(date).getTime() + days * 24 * 60 * 60 * 1000));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / (24 * 60 * 60 * 1000));
}

// 0 = Monday ... 6 = Sunday.
export function isoWeekday(date: string): number {
  const jsDay = parseDate(date).getUTCDay(); // 0 = Sunday ... 6 = Saturday
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = parseDate(from);
  const end = parseDate(to);
  while (cursor <= end) {
    dates.push(formatDate(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}
