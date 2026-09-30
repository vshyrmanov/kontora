import type {
  AuthResponse,
  ClientDetailsDto,
  ClientDto,
  ClientInput,
  ClientsQuery,
  ClientSummaryDto,
  ClientUpdate,
  DashboardDto,
  LoginInput,
  Paginated,
  PickupsQuery,
  StatsDto,
  StatsQuery,
  UserDto,
  VisitCreate,
  VisitCreatedDto,
  VisitDto,
  VisitsQuery,
  VisitUpdate,
} from '@kontora/contracts';
import { http } from './http';

type Query = Record<string, string | number | undefined>;

/** Типізований клієнт REST API. Форми запитів і відповідей — із @kontora/contracts. */
export const api = {
  auth: {
    login: (body: LoginInput) => http<AuthResponse>('/auth/login', { method: 'POST', body }),
    me: () => http<UserDto>('/auth/me'),
  },
  dashboard: {
    get: () => http<DashboardDto>('/dashboard'),
  },
  clients: {
    list: (query: ClientsQuery) => http<Paginated<ClientSummaryDto>>('/clients', { query: query as Query }),
    get: (id: string) => http<ClientDetailsDto>(`/clients/${id}`),
    create: (body: ClientInput) => http<ClientDto>('/clients', { method: 'POST', body }),
    update: (id: string, body: ClientUpdate) => http<ClientDto>(`/clients/${id}`, { method: 'PATCH', body }),
  },
  visits: {
    list: (query: VisitsQuery) => http<Paginated<VisitDto>>('/visits', { query: query as Query }),
    get: (id: string) => http<VisitDto>(`/visits/${id}`),
    create: (body: VisitCreate) => http<VisitCreatedDto>('/visits', { method: 'POST', body }),
    update: (id: string, body: VisitUpdate) => http<VisitDto>(`/visits/${id}`, { method: 'PATCH', body }),
    remove: (id: string) => http<void>(`/visits/${id}`, { method: 'DELETE' }),
    issue: (id: string) => http<VisitDto>(`/visits/${id}/issue`, { method: 'POST' }),
    unissue: (id: string) => http<VisitDto>(`/visits/${id}/issue`, { method: 'DELETE' }),
  },
  pickups: {
    list: (query: PickupsQuery) => http<Paginated<VisitDto>>('/pickups', { query: query as Query }),
  },
  stats: {
    get: (query: StatsQuery) => http<StatsDto>('/stats', { query: query as Query }),
  },
};
