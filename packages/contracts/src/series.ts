import { addDays, diffDays, startOfIsoWeek, type IsoDate } from './dates.js';

export type SeriesUnit = 'day' | 'week' | 'month';
export interface SeriesPoint {
  /** Початок відрізка: день, понеділок тижня або перше число місяця. */
  key: IsoDate;
  value: number;
}

export const seriesUnitFor = (from: IsoDate, to: IsoDate): SeriesUnit => {
  const span = diffDays(to, from) + 1;
  return span <= 31 ? 'day' : span <= 200 ? 'week' : 'month';
};

const bucketKey = (date: IsoDate, unit: SeriesUnit): IsoDate =>
  unit === 'day' ? date : unit === 'week' ? startOfIsoWeek(date) : `${date.slice(0, 7)}-01`;

/** Перетворює кількості по днях на неперервний ряд (порожні дні — нулі), згрупований за одиницею. */
export const buildSeries = (
  from: IsoDate,
  to: IsoDate,
  countsByDay: ReadonlyMap<IsoDate, number>,
  unit: SeriesUnit = seriesUnitFor(from, to),
): SeriesPoint[] => {
  const points: SeriesPoint[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const key = bucketKey(day, unit);
    const last = points.at(-1);
    const value = countsByDay.get(day) ?? 0;
    if (last?.key === key) last.value += value;
    else points.push({ key, value });
  }
  return points;
};
