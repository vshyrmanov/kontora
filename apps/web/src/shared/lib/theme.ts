import { useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'kontora-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

const read = (): Theme => {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return media.matches ? 'dark' : 'light';
};

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  media.addEventListener('change', cb);
  return () => {
    listeners.delete(cb);
    media.removeEventListener('change', cb);
  };
};

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read);
  const toggle = useCallback(() => {
    const next: Theme = read() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* сховище недоступне — тема діє до перезавантаження */
    }
    listeners.forEach((l) => l());
  }, []);
  return { theme, toggle };
}
