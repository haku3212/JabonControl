import { ReactNode, useEffect, useRef, useId } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  hideFooter?: boolean;
  onSave?: () => void;
}

export function Modal({ isOpen, title, children, onClose, hideFooter = true, onSave }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []).filter((element) => element.getClientRects().length > 0);
    (focusable()[0] || dialog)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); dialog?.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-2xl md:max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto fade-in mx-2 md:mx-0">
        {/* Header */}
        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-dark-border flex items-center justify-between sticky top-0 bg-dark-surface z-10">
          <div id={titleId} className="text-lg font-semibold text-text-primary truncate">
            {title}
          </div>
          <button
            aria-label="Cerrar formulario"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-dark-surface2 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-5">
          {children}
        </div>

        {/* Footer (opcional) */}
        {!hideFooter && onSave && (
          <div className="px-5 py-3.5 border-t border-dark-border flex justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90 transition-all"
            >
              💾 Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
