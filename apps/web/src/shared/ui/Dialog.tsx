import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Обгортка над нативним <dialog>: фокус-трап, Esc і backdrop з коробки. */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <>
          <div className="dlg-h">
            <h2>{title}</h2>
            <button type="button" className="btn icon ghost" onClick={onClose} aria-label="Закрити">
              <Icon name="close" />
            </button>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}
