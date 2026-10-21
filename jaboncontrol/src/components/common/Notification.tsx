import { useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Notification({ message, isVisible, onClose }: NotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-md bg-white border border-dark-border rounded-md px-4 py-3 text-sm z-50 shadow-lg flex items-start gap-3"
    >
      <Info size={18} className="text-accent-blue shrink-0 mt-0.5" aria-hidden="true" />
      <span className="min-w-0 break-words flex-1">{message}</span>
      <button type="button" onClick={onClose} className="shrink-0 text-text-secondary" aria-label="Cerrar notificacion" title="Cerrar notificacion"><X size={17} /></button>
    </div>
  );
}
