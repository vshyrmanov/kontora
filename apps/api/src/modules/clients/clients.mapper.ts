import type { ClientDto } from '@kontora/contracts';

interface ClientLike {
  _id: unknown;
  name: string;
  phone: string;
  email?: string | null;
  note?: string | null;
  createdAt?: Date;
}

export const toClientDto = (c: ClientLike): ClientDto => ({
  id: String(c._id),
  name: c.name,
  phone: c.phone,
  email: c.email ?? null,
  note: c.note ?? null,
  createdAt: (c.createdAt ?? new Date(0)).toISOString(),
});
