import {
  addDays,
  buildSeries,
  DOCUMENT_TYPE_KEYS,
  ON_TIME_GRACE_DAYS,
  seriesUnitFor,
  statsQuerySchema,
  type DocumentType,
  type IsoDate,
  type SeriesPoint,
  type StatsDto,
} from '@kontora/contracts';
import type { PipelineStage } from 'mongoose';
import type { z } from 'zod';
import { env } from '../../config/env.js';
import { dayRange, today } from '../../lib/time.js';
import { Visit } from '../../models/visit.model.js';

type StatsQuery = z.output<typeof statsQuerySchema>;

interface Facets {
  byDay: { _id: IsoDate; n: number }[];
  byType: { _id: DocumentType; n: number }[];
  byWeekday: { _id: number; n: number }[];
  byHour: { _id: number; n: number }[];
  clients: { n: number }[];
  processing: { avg: number | null }[];
  pickups: { due: number; onTime: number }[];
}

const OPENING_HOURS = { from: 8, to: 19 };

const matchRange = (from: IsoDate, to: IsoDate, type?: DocumentType): PipelineStage.Match => {
  const { start, end } = dayRange(from, to);
  return { $match: { date: { $gte: start, $lt: end }, ...(type && { type }) } };
};

/** Кількість візитів по днях (локальний календар установи). */
export async function countByDay(from: IsoDate, to: IsoDate, type?: DocumentType): Promise<Map<IsoDate, number>> {
  const timezone = env().APP_TIMEZONE;
  const rows = await Visit.aggregate<{ _id: IsoDate; n: number }>([
    matchRange(from, to, type),
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } }, n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.n]));
}

export async function dailySeries(from: IsoDate, to: IsoDate): Promise<SeriesPoint[]> {
  return buildSeries(from, to, await countByDay(from, to), 'day');
}

export async function getStats({ from, to, type }: StatsQuery): Promise<StatsDto> {
  const timezone = env().APP_TIMEZONE;
  const localDay = { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } };
  const asDate = (expr: unknown) => ({ $dateFromString: { dateString: expr, format: '%Y-%m-%d' } });
  const now = today();

  const [facets] = await Visit.aggregate<Facets>([
    matchRange(from, to, type),
    {
      $facet: {
        byDay: [{ $group: { _id: localDay, n: { $sum: 1 } } }],
        byType: [{ $group: { _id: '$type', n: { $sum: 1 } } }],
        byWeekday: [{ $group: { _id: { $isoDayOfWeek: { date: '$date', timezone } }, n: { $sum: 1 } } }],
        byHour: [{ $group: { _id: { $hour: { date: '$date', timezone } }, n: { $sum: 1 } } }],
        clients: [{ $group: { _id: '$client' } }, { $count: 'n' }],
        processing: [
          {
            $group: {
              _id: null,
              avg: { $avg: { $dateDiff: { startDate: asDate(localDay), endDate: asDate('$pickupDate'), unit: 'day' } } },
            },
          },
        ],
        pickups: [
          { $match: { pickupDate: { $lte: now } } },
          {
            $group: {
              _id: null,
              due: { $sum: 1 },
              onTime: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ['$issuedAt', null] },
                        {
                          $lte: [
                            { $dateDiff: { startDate: asDate('$pickupDate'), endDate: asDate('$issuedAt'), unit: 'day' } },
                            ON_TIME_GRACE_DAYS,
                          ],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  const f = facets!;
  const byTypeMap = new Map(f.byType.map((r) => [r._id, r.n]));
  const byWeekday = Array.from({ length: 7 }, (_, i) => f.byWeekday.find((r) => r._id === i + 1)?.n ?? 0);
  const byHour = Array.from({ length: OPENING_HOURS.to - OPENING_HOURS.from }, (_, i) => {
    const hour = OPENING_HOURS.from + i;
    return { hour, value: f.byHour.find((r) => r._id === hour)?.n ?? 0 };
  });
  const unit = seriesUnitFor(from, to);

  return {
    range: { from, to },
    unit,
    totals: {
      visits: f.byDay.reduce((sum, r) => sum + r.n, 0),
      clients: f.clients[0]?.n ?? 0,
      avgProcessingDays: Math.round((f.processing[0]?.avg ?? 0) * 10) / 10,
      due: f.pickups[0]?.due ?? 0,
      pickedUpOnTime: f.pickups[0]?.onTime ?? 0,
    },
    series: buildSeries(from, to, new Map(f.byDay.map((r) => [r._id, r.n])), unit),
    byType: DOCUMENT_TYPE_KEYS.map((t) => ({ type: t, value: byTypeMap.get(t) ?? 0 }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value),
    byWeekday,
    byHour,
  };
}

export const lastDays = (days: number, end = today()) => ({ from: addDays(end, -(days - 1)), to: end });
