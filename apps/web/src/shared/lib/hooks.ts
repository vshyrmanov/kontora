import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Фільтри сторінки живуть в URL: посиланням можна поділитися, «Назад» повертає попередній стан.
 * Зміна будь-якого фільтра скидає пагінацію.
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, params.get(key) ?? fallback]),
  ) as T;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const update = useCallback(
    (patch: Partial<T> & { page?: number }) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const isDefault = key === 'page' ? value === 1 : value === defaults[key];
            if (value === undefined || value === '' || isDefault) next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    // defaults — стабільний літерал на рівні модуля
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  );

  return { values, page, update };
}
