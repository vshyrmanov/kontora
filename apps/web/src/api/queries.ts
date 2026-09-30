import type { ClientsQuery, PickupsQuery, StatsQuery, VisitCreate, VisitsQuery } from '@kontora/contracts';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './endpoints';

export const keys = {
  dashboard: ['dashboard'] as const,
  clients: (q?: ClientsQuery) => (q ? (['clients', q] as const) : (['clients'] as const)),
  client: (id: string) => ['client', id] as const,
  visits: (q?: VisitsQuery) => (q ? (['visits', q] as const) : (['visits'] as const)),
  pickups: (q?: PickupsQuery) => (q ? (['pickups', q] as const) : (['pickups'] as const)),
  stats: (q?: StatsQuery) => (q ? (['stats', q] as const) : (['stats'] as const)),
};

/* ---------- Читання ---------- */
export const useDashboard = () => useQuery({ queryKey: keys.dashboard, queryFn: api.dashboard.get, refetchInterval: 60_000 });

export const useClients = (q: ClientsQuery, enabled = true) =>
  useQuery({ queryKey: keys.clients(q), queryFn: () => api.clients.list(q), placeholderData: keepPreviousData, enabled });

export const useClient = (id: string | undefined) =>
  useQuery({ queryKey: keys.client(id ?? ''), queryFn: () => api.clients.get(id!), enabled: Boolean(id) });

export const useVisits = (q: VisitsQuery) =>
  useQuery({ queryKey: keys.visits(q), queryFn: () => api.visits.list(q), placeholderData: keepPreviousData });

export const usePickups = (q: PickupsQuery) =>
  useQuery({ queryKey: keys.pickups(q), queryFn: () => api.pickups.list(q), placeholderData: keepPreviousData });

export const useStats = (q: StatsQuery) =>
  useQuery({ queryKey: keys.stats(q), queryFn: () => api.stats.get(q), placeholderData: keepPreviousData });

/* ---------- Зміни ---------- */
/** Візит або видача зачіпають усі зведення, тож після змін оновлюємо їх разом. */
const useInvalidateVisitData = () => {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      [keys.dashboard, keys.visits(), keys.pickups(), keys.clients(), keys.stats(), ['client']].map((queryKey) =>
        qc.invalidateQueries({ queryKey }),
      ),
    );
};

export const useCreateVisit = () => {
  const invalidate = useInvalidateVisitData();
  return useMutation({ mutationFn: (body: VisitCreate) => api.visits.create(body), onSuccess: invalidate });
};

export const useSetIssued = () => {
  const invalidate = useInvalidateVisitData();
  return useMutation({
    mutationFn: ({ id, issued }: { id: string; issued: boolean }) => (issued ? api.visits.issue(id) : api.visits.unissue(id)),
    onSuccess: invalidate,
  });
};

export const useDeleteVisit = () => {
  const invalidate = useInvalidateVisitData();
  return useMutation({ mutationFn: (id: string) => api.visits.remove(id), onSuccess: invalidate });
};
