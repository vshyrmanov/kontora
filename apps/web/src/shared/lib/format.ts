import { isoDateInZone, type IsoDate } from '@kontora/contracts';

export const APP_TIMEZONE = import.meta.env?.VITE_APP_TIMEZONE ?? 'Europe/Kyiv';

const dayFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' });
const longDayFormat = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
const dayMonthLong = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' });
const weekdayFormat = new Intl.DateTimeFormat('uk-UA', { weekday: 'long' });
const shortNumeric = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit' });
const monthFormat = new Intl.DateTimeFormat('uk-UA', { month: 'short' });
const timeFormat = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE });

/** IsoDate → Date опівдні UTC, щоб форматування не «з'їжджало» на сусідній день. */
const noon = (date: IsoDate) => new Date(`${date}T12:00:00Z`);

export const todayIso = (): IsoDate => isoDateInZone(new Date(), APP_TIMEZONE);
export const dayOf = (instant: string): IsoDate => isoDateInZone(new Date(instant), APP_TIMEZONE);

export const fmtDay = (date: IsoDate) => dayFormat.format(noon(date));
export const fmtDayLong = (date: IsoDate) => longDayFormat.format(noon(date));
export const fmtDayNumeric = (date: IsoDate) => shortNumeric.format(noon(date));
export const fmtMonth = (date: IsoDate) => monthFormat.format(noon(date));
export const fmtTime = (instant: string) => timeFormat.format(new Date(instant));
/** «середа, 30 вересня» — день тижня в називному відмінку. */
export const fmtToday = (date: IsoDate) => `${weekdayFormat.format(noon(date))}, ${dayMonthLong.format(noon(date))}`;

export const plural = (n: number, [one, few, many]: [string, string, string]) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

/** Значення для <input type="datetime-local"> з поточного часу, округлене до 15 хв вперед. */
export const nextSlotLocalInput = (now = new Date()) => {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Локальне значення datetime-local → ISO-момент з часовим поясом браузера. */
export const localInputToIso = (value: string) => new Date(value).toISOString();
