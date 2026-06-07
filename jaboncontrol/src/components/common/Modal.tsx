import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  hideFooter?: boolean;
  onSave?: () => void;
}

export function Modal({ isOpen, title, children, onClose, hideFooter = true, onSave }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between sticky top-0 bg-dark-surface z-10">
          <div className="text-xl font-bebas text-text-primary tracking-wider">
            {title}
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-dark-surface2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
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
