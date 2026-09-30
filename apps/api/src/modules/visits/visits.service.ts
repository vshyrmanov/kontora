import {
  pickupsQuerySchema,
  visitsQuerySchema,
  type Paginated,
  type VisitCreate,
  type VisitCreatedDto,
  type VisitDto,
  type VisitUpdate,
} from '@kontora/contracts';
import type { FilterQuery } from 'mongoose';
import type { z } from 'zod';
import { badRequest, notFound } from '../../lib/http-error.js';
import { paginated, skipOf } from '../../lib/paginate.js';
import { containsRegex } from '../../lib/text.js';
import { dayRange, localDateOf, today } from '../../lib/time.js';
import { nextSequence } from '../../models/counter.model.js';
import { Client } from '../../models/client.model.js';
import { Visit, type VisitRecord } from '../../models/visit.model.js';
import { findOrCreateClient, searchFilter } from '../clients/clients.service.js';
import { toVisitDto, visitPopulate } from './visits.mapper.js';

type VisitsQuery = z.output<typeof visitsQuerySchema>;
type PickupsQuery = z.output<typeof pickupsQuerySchema>;

const formatRef = (year: string, seq: number) => `К-${year}/${String(seq).padStart(4, '0')}`;

const assertPickupAfterVisit = (visitDate: Date, pickupDate: string) => {
  if (pickupDate < localDateOf(visitDate)) throw badRequest('Дата отримання не може бути раніше за дату візиту');
};

/** Пошук за іменем/телефоном клієнта або номером візиту. */
const visitSearch = async (q?: string): Promise<FilterQuery<VisitRecord>> => {
  if (!q) return {};
  const clientIds = await Client.find(searchFilter(q)).distinct('_id');
  return { $or: [{ client: { $in: clientIds } }, { ref: containsRegex(q) }] };
};

export async function listVisits(query: VisitsQuery): Promise<Paginated<VisitDto>> {
  const { q, type, status, clientId, from, to, page, limit } = query;
  const now = new Date();
  const filter: FilterQuery<VisitRecord> = { ...(await visitSearch(q)) };
  if (type) filter.type = type;
  if (clientId) filter.client = clientId;
  const date: Record<string, Date> = {};
  if (from) date.$gte = dayRange(from, from).start;
  if (to) date.$lt = dayRange(to, to).end;
  if (status === 'planned') date.$gt = now;
  if (status === 'done') date.$lte = now;
  if (Object.keys(date).length) filter.date = date;

  const [items, total] = await Promise.all([
    Visit.find(filter).sort({ date: -1 }).skip(skipOf(page, limit)).limit(limit).populate(visitPopulate).lean(),
    Visit.countDocuments(filter),
  ]);
  return paginated(items.map((v) => toVisitDto(v)), total, page, limit);
}

export async function getVisit(id: string): Promise<VisitDto> {
  const visit = await Visit.findById(id).populate(visitPopulate).lean();
  if (!visit) throw notFound('Візит');
  return toVisitDto(visit);
}

export async function createVisit(input: VisitCreate, userId: string): Promise<VisitCreatedDto> {
  const date = new Date(input.date);
  assertPickupAfterVisit(date, input.pickupDate);

  let clientId: string;
  let clientCreated = false;
  if (input.clientId) {
    if (!(await Client.exists({ _id: input.clientId }))) throw notFound('Клієнта');
    clientId = input.clientId;
  } else {
    const result = await findOrCreateClient(input.newClient!);
    clientId = result.id;
    clientCreated = result.created;
  }

  const year = localDateOf(date).slice(0, 4);
  const ref = formatRef(year, await nextSequence(`visit-${year}`));
  const visit = await Visit.create({
    ref,
    client: clientId,
    date,
    type: input.type,
    pickupDate: input.pickupDate,
    note: input.note ?? null,
    createdBy: userId,
  });
  return { visit: await getVisit(String(visit._id)), clientCreated };
}

export async function updateVisit(id: string, patch: VisitUpdate): Promise<VisitDto> {
  const visit = await Visit.findById(id);
  if (!visit) throw notFound('Візит');
  if (patch.date) visit.date = new Date(patch.date);
  if (patch.type) visit.type = patch.type;
  if (patch.pickupDate) visit.pickupDate = patch.pickupDate;
  if (patch.note !== undefined) visit.note = patch.note;
  assertPickupAfterVisit(visit.date, visit.pickupDate);
  await visit.save();
  return getVisit(id);
}

export async function deleteVisit(id: string): Promise<void> {
  const result = await Visit.deleteOne({ _id: id });
  if (!result.deletedCount) throw notFound('Візит');
}

export async function setIssued(id: string, issued: boolean): Promise<VisitDto> {
  const visit = await Visit.findByIdAndUpdate(id, { issuedAt: issued ? today() : null }, { new: true })
    .populate(visitPopulate)
    .lean();
  if (!visit) throw notFound('Візит');
  return toVisitDto(visit);
}

export async function listPickups(query: PickupsQuery): Promise<Paginated<VisitDto>> {
  const { mode, q, from, to, page, limit } = query;
  const filter: FilterQuery<VisitRecord> = { ...(await visitSearch(q)) };
  if (mode === 'pending') filter.issuedAt = null;
  if (mode === 'issued') filter.issuedAt = { $ne: null };
  if (from || to) filter.pickupDate = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const direction = mode === 'pending' ? 1 : -1;
  const [items, total] = await Promise.all([
    Visit.find(filter)
      .sort({ pickupDate: direction, date: 1 })
      .skip(skipOf(page, limit))
      .limit(limit)
      .populate(visitPopulate)
      .lean(),
    Visit.countDocuments(filter),
  ]);
  return paginated(items.map((v) => toVisitDto(v)), total, page, limit);
}
