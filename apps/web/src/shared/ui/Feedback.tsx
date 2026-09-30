import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;

export const Loading = ({ height = 120 }: { height?: number }) => (
  <div className="skeleton" style={{ height }} role="status" aria-label="Завантаження" />
);

export const ErrorBox = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => (
  <div className="error-box" role="alert">
    <span>{error instanceof Error ? error.message : 'Не вдалося завантажити дані'}</span>
    {onRetry && (
      <button className="btn sm" onClick={onRetry}>
        Спробувати ще раз
      </button>
    )}
  </div>
);

/* ---------- Toast ---------- */
interface ToastOptions {
  tone?: 'default' | 'error';
  action?: { label: string; onClick: () => void };
}
interface ToastState extends ToastOptions {
  id: number;
  text: string;
}

const ToastContext = createContext<((text: string, options?: ToastOptions) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((text: string, options: ToastOptions = {}) => {
    setToast({ id: Date.now(), text, ...options });
  }, []);

  useEffect(() => {
    if (!toast) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer.current);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={`toast${toast.tone === 'error' ? ' error' : ''}`}>
            <span>{toast.text}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.onClick();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
