import { diffDays, type IsoDate } from './dates.js';

export const PICKUP_STATUSES = ['waiting', 'today', 'overdue', 'issued'] as const;
export type PickupStatus = (typeof PICKUP_STATUSES)[number];

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  waiting: 'Оформлюється',
  today: 'Видача сьогодні',
  overdue: 'Не забрали',
  issued: 'Видано',
};

export const getPickupStatus = (
  visit: { pickupDate: IsoDate; issuedAt: IsoDate | null },
  today: IsoDate,
): PickupStatus => {
  if (visit.issuedAt) return 'issued';
  const days = diffDays(visit.pickupDate, today);
  return days < 0 ? 'overdue' : days === 0 ? 'today' : 'waiting';
};

/** Документ забрали вчасно, якщо видали не пізніше ніж наступного дня після дати готовності. */
export const ON_TIME_GRACE_DAYS = 1;
