import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { VisitFormDialog } from './VisitFormDialog';

interface VisitDialogApi {
  /** Відкриває форму запису; clientId — одразу обрати клієнта з бази. */
  openVisitDialog: (options?: { clientId?: string }) => void;
}

const VisitDialogContext = createContext<VisitDialogApi | null>(null);

export function VisitDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; clientId?: string; key: number }>({ open: false, key: 0 });

  const openVisitDialog = useCallback((options: { clientId?: string } = {}) => {
    setState((s) => ({ open: true, clientId: options.clientId, key: s.key + 1 }));
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const api = useMemo(() => ({ openVisitDialog }), [openVisitDialog]);

  return (
    <VisitDialogContext.Provider value={api}>
      {children}
      {/* key скидає стан форми при кожному відкритті */}
      <VisitFormDialog key={state.key} open={state.open} initialClientId={state.clientId} onClose={close} />
    </VisitDialogContext.Provider>
  );
}

export function useVisitDialog() {
  const ctx = useContext(VisitDialogContext);
  if (!ctx) throw new Error('useVisitDialog must be used inside <VisitDialogProvider>');
  return ctx;
}
