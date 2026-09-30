/** Дата без часу у форматі YYYY-MM-DD. Використовується для «днів» установи (видача, фільтри, статистика). */
export type IsoDate = string;

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const DAY_MS = 86_400_000;

export const isIsoDate = (value: string): value is IsoDate =>
  ISO_DATE_RE.test(value) && toUtc(value).toISOString().startsWith(value);

const toUtc = (date: IsoDate): Date => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
};
const fromUtc = (date: Date): IsoDate => date.toISOString().slice(0, 10);

export const addDays = (date: IsoDate, days: number): IsoDate => fromUtc(new Date(toUtc(date).getTime() + days * DAY_MS));

/** Кількість днів від `from` до `to` (може бути відʼємною). */
export const diffDays = (to: IsoDate, from: IsoDate): number =>
  Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS);

/** День тижня за ISO: 1 — понеділок … 7 — неділя. */
export const isoWeekday = (date: IsoDate): number => ((toUtc(date).getUTCDay() + 6) % 7) + 1;

export const startOfIsoWeek = (date: IsoDate): IsoDate => addDays(date, 1 - isoWeekday(date));

/** Календарний день моменту `at` у часовому поясі `timeZone`. */
export const isoDateInZone = (at: Date, timeZone: string): IsoDate =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);

const zoneOffsetMs = (at: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
};

/** Момент початку дня `date` у часовому поясі `timeZone` (з урахуванням переходу на літній час). */
export const zonedDayStart = (date: IsoDate, timeZone: string): Date => {
  const guess = toUtc(date).getTime();
  const first = zoneOffsetMs(new Date(guess), timeZone);
  const second = zoneOffsetMs(new Date(guess - first), timeZone);
  return new Date(guess - second);
};

/** Напіввідкритий інтервал [from 00:00, to+1 00:00) у часовому поясі. */
export const zonedRange = (from: IsoDate, to: IsoDate, timeZone: string) => ({
  start: zonedDayStart(from, timeZone),
  end: zonedDayStart(addDays(to, 1), timeZone),
});
