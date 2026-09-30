import type {
  ClientDetailsDto,
  ClientDto,
  ClientInput,
  ClientSummaryDto,
  ClientUpdate,
  Paginated,
} from '@kontora/contracts';
import { clientsQuerySchema } from '@kontora/contracts';
import type { z } from 'zod';
import { conflict, notFound } from '../../lib/http-error.js';
import { paginated, skipOf } from '../../lib/paginate.js';
import { containsRegex, phoneDigits } from '../../lib/text.js';
import { Client } from '../../models/client.model.js';
import { Visit } from '../../models/visit.model.js';
import { toVisitDto, visitPopulate } from '../visits/visits.mapper.js';
import { toClientDto } from './clients.mapper.js';

type ClientsQuery = z.output<typeof clientsQuerySchema>;

export const searchFilter = (q?: string) => {
  if (!q) return {};
  const rx = containsRegex(q);
  const digits = phoneDigits(q);
  return { $or: [{ name: rx }, { email: rx }, ...(digits.length >= 3 ? [{ phoneDigits: containsRegex(digits) }] : [])] };
};

export async function listClients({ q, page, limit }: ClientsQuery): Promise<Paginated<ClientSummaryDto>> {
  const [result] = await Client.aggregate<{ items: (Parameters<typeof toClientDto>[0] & Counters)[]; total: { n: number }[] }>([
    { $match: searchFilter(q) },
    {
      $lookup: {
        from: Visit.collection.name,
        localField: '_id',
        foreignField: 'client',
        as: 'visits',
        pipeline: [{ $project: { date: 1, issuedAt: 1 } }],
      },
    },
    {
      $addFields: {
        visitsCount: { $size: '$visits' },
        pendingCount: { $size: { $filter: { input: '$visits', cond: { $eq: ['$$this.issuedAt', null] } } } },
        lastVisitAt: { $max: '$visits.date' },
      },
    },
    { $project: { visits: 0 } },
    { $sort: { lastVisitAt: -1, name: 1 } },
    { $facet: { items: [{ $skip: skipOf(page, limit) }, { $limit: limit }], total: [{ $count: 'n' }] } },
  ]);
  const items = (result?.items ?? []).map((c) => ({
    ...toClientDto(c),
    visitsCount: c.visitsCount,
    pendingCount: c.pendingCount,
    lastVisitAt: c.lastVisitAt ? c.lastVisitAt.toISOString() : null,
  }));
  return paginated(items, result?.total[0]?.n ?? 0, page, limit);
}

interface Counters {
  visitsCount: number;
  pendingCount: number;
  lastVisitAt: Date | null;
}

export async function getClient(id: string): Promise<ClientDetailsDto> {
  const client = await Client.findById(id).lean();
  if (!client) throw notFound('Клієнта');
  const visits = await Visit.find({ client: client._id }).sort({ date: -1 }).populate(visitPopulate).lean();
  return { ...toClientDto(client), visits: visits.map((v) => toVisitDto(v)) };
}

export async function createClient(input: ClientInput): Promise<ClientDto> {
  const digits = phoneDigits(input.phone);
  if (await Client.exists({ phoneDigits: digits })) throw conflict('Клієнт із таким телефоном уже є в базі');
  const client = await Client.create({ ...input, phoneDigits: digits });
  return toClientDto(client);
}

/** Повертає наявного клієнта за телефоном або створює нового. */
export async function findOrCreateClient(input: ClientInput): Promise<{ id: string; created: boolean }> {
  const digits = phoneDigits(input.phone);
  const result = await Client.findOneAndUpdate(
    { phoneDigits: digits },
    { $setOnInsert: { ...input, phoneDigits: digits } },
    { upsert: true, new: true, includeResultMetadata: true },
  );
  return { id: String(result.value!._id), created: !result.lastErrorObject?.updatedExisting };
}

export async function updateClient(id: string, patch: ClientUpdate): Promise<ClientDto> {
  const update: Record<string, unknown> = { ...patch };
  if (patch.phone) {
    const digits = phoneDigits(patch.phone);
    if (await Client.exists({ phoneDigits: digits, _id: { $ne: id } })) {
      throw conflict('Клієнт із таким телефоном уже є в базі');
    }
    update.phoneDigits = digits;
  }
  const client = await Client.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  if (!client) throw notFound('Клієнта');
  return toClientDto(client);
}
