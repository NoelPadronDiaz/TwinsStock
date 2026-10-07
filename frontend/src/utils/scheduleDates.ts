// Calendar-date helpers for the schedule UI. Dates are plain 'YYYY-MM-DD'
// strings; all arithmetic uses UTC internally so the server's/browser's
// local timezone never shifts the calendar day.

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseISODate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date: string, days: number): string {
  return toISODate(new Date(parseISODate(date).getTime() + days * 24 * 60 * 60 * 1000));
}

// Monday of the week containing `date`.
export function getWeekStart(date: string): string {
  const d = parseISODate(date);
  const jsDay = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const isoDay = jsDay === 0 ? 6 : jsDay - 1; // 0 = Monday .. 6 = Sunday
  return addDays(toISODate(d), -isoDay);
}

export function getWeekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

// Weeks (each an array of 7 date strings) covering the whole month, padded
// with the trailing/leading days of neighboring months so every week is
// Monday-to-Sunday.
export function getMonthWeeks(year: number, month: number): string[][] {
  const { start, end } = getMonthRange(year, month);
  const firstWeekStart = getWeekStart(start);
  const lastWeekStart = getWeekStart(end);

  const weeks: string[][] = [];
  let cursor = firstWeekStart;
  while (cursor <= lastWeekStart) {
    weeks.push(getWeekDays(cursor));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const WEEKDAY_SHORT_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday] ?? '';
}

const MONTH_LABELS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function monthLabel(month: number): string {
  return MONTH_LABELS[month] ?? '';
}
