import { getPickupStatus, type DocumentType, type VisitDto } from '@kontora/contracts';
import { today } from '../../lib/time.js';

export const visitPopulate = { path: 'client', select: 'name phone' } as const;

interface PopulatedVisit {
  _id: unknown;
  ref: string;
  client: unknown;
  date: Date;
  type: string;
  pickupDate: string;
  issuedAt?: string | null;
  note?: string | null;
  createdAt?: Date;
}

const clientRef = (client: unknown): VisitDto['client'] => {
  if (client && typeof client === 'object' && 'name' in client) {
    const c = client as { _id: unknown; name: string; phone: string };
    return { id: String(c._id), name: c.name, phone: c.phone };
  }
  return { id: String(client), name: 'Видалений клієнт', phone: '' };
};

export const toVisitDto = (v: PopulatedVisit, now = today()): VisitDto => {
  const issuedAt = v.issuedAt ?? null;
  return {
    id: String(v._id),
    ref: v.ref,
    client: clientRef(v.client),
    date: v.date.toISOString(),
    type: v.type as DocumentType,
    pickupDate: v.pickupDate,
    issuedAt,
    pickupStatus: getPickupStatus({ pickupDate: v.pickupDate, issuedAt }, now),
    note: v.note ?? null,
    createdAt: (v.createdAt ?? v.date).toISOString(),
  };
};
