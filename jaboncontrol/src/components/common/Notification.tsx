import { useEffect } from 'react';

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

  return (
    <div
      className={`fixed bottom-5 right-5 bg-dark-surface border border-dark-border border-l-4 border-l-status-success rounded-lg px-4 py-3 text-sm z-40 transition-transform ${
        isVisible ? 'slide-in' : 'translate-x-full'
      }`}
    >
      {message}
    </div>
  );
}
