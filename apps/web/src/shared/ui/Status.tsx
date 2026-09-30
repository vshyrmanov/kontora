import { PICKUP_STATUS_LABELS, type PickupStatus, type VisitDto } from '@kontora/contracts';
import { fmtDayNumeric } from '../lib/format';

const TONE: Record<PickupStatus, 'ok' | 'warn' | 'bad' | 'info'> = {
  issued: 'ok',
  today: 'warn',
  overdue: 'bad',
  waiting: 'info',
};

export const StatusPill = ({ status }: { status: PickupStatus }) => (
  <span className={`pill ${TONE[status]}`}>{PICKUP_STATUS_LABELS[status]}</span>
);

export const IssuedStamp = ({ date }: { date: string }) => <span className="stamp">Видано {fmtDayNumeric(date)}</span>;

/** Статус візиту: запланований або статус документа. */
export function VisitStatus({ visit }: { visit: VisitDto }) {
  if (new Date(visit.date) > new Date()) return <span className="pill info">Заплановано</span>;
  if (visit.issuedAt) return <IssuedStamp date={visit.issuedAt} />;
  return <StatusPill status={visit.pickupStatus} />;
}
