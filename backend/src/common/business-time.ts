export const BUSINESS_TIMEZONE = 'Atlantic/Canary';

// A time entry whose local clock-in is before this hour is "mañana";
// otherwise "tarde" (the two blocks of the Registro diario de jornada).
export const AFTERNOON_START_HOUR = 15;

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: BUSINESS_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// 'YYYY-MM-DD' of the instant in the business timezone.
export function toBusinessDate(instant: Date): string {
  return dateFormatter.format(instant);
}

// 'HH:mm' of the instant in the business timezone.
export function toBusinessTime(instant: Date): string {
  return timeFormatter.format(instant);
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Minutes the business timezone is ahead of UTC at that instant.
function offsetMinutes(instant: Date): number {
  const p = Object.fromEntries(partsFormatter.formatToParts(instant).map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

// The instant of a local business wall-clock date ('YYYY-MM-DD') and time
// ('HH:mm'). The second pass corrects the offset across a DST change.
export function fromBusinessDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const naive = Date.UTC(y, m - 1, d, h, min);
  let instant = naive - offsetMinutes(new Date(naive)) * 60000;
  instant = naive - offsetMinutes(new Date(instant)) * 60000;
  return new Date(instant);
}
