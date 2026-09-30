import type { IsoDate } from './dates.js';
import type { DocumentType } from './documents.js';
import type { SeriesPoint, SeriesUnit } from './series.js';
import type { PickupStatus } from './status.js';

export type UserRole = 'admin' | 'registrar';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface ClientDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  createdAt: string;
}

export interface ClientSummaryDto extends ClientDto {
  visitsCount: number;
  pendingCount: number;
  lastVisitAt: string | null;
}

export interface ClientDetailsDto extends ClientDto {
  visits: VisitDto[];
}

export interface VisitDto {
  id: string;
  /** Номер візиту на кшталт К-2026/0148. */
  ref: string;
  client: Pick<ClientDto, 'id' | 'name' | 'phone'>;
  /** Момент візиту (ISO 8601, UTC). */
  date: string;
  type: DocumentType;
  pickupDate: IsoDate;
  issuedAt: IsoDate | null;
  pickupStatus: PickupStatus;
  note: string | null;
  createdAt: string;
}

export interface VisitCreatedDto {
  visit: VisitDto;
  /** true — клієнта створено; false — візит привʼязано до наявного клієнта. */
  clientCreated: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface StatsDto {
  range: { from: IsoDate; to: IsoDate };
  unit: SeriesUnit;
  totals: {
    visits: number;
    clients: number;
    avgProcessingDays: number;
    /** Документи з датою готовності в межах періоду, що вже настала. */
    due: number;
    pickedUpOnTime: number;
  };
  series: SeriesPoint[];
  byType: { type: DocumentType; value: number }[];
  /** Індекс 0 — понеділок … 6 — неділя. */
  byWeekday: number[];
  byHour: { hour: number; value: number }[];
}

export interface DashboardDto {
  today: IsoDate;
  counts: { todayVisits: number; pickupsToday: number; overdue: number; clients: number; inProgress: number };
  todayVisits: VisitDto[];
  upcomingPickups: VisitDto[];
  last14Days: SeriesPoint[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
