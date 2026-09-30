import type { Paginated } from '@kontora/contracts';

export const skipOf = (page: number, limit: number) => (page - 1) * limit;

export const paginated = <T>(items: T[], total: number, page: number, limit: number): Paginated<T> => ({
  items,
  total,
  page,
  limit,
});
