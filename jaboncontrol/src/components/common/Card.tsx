import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  badge?: {
    label: string;
    type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
}

const badgeColors = {
  success: 'bg-status-success bg-opacity-10 text-status-success',
  warning: 'bg-accent-yellow bg-opacity-10 text-accent-yellow',
  danger: 'bg-status-danger bg-opacity-10 text-status-danger',
  info: 'bg-accent-blue bg-opacity-10 text-accent-blue',
  neutral: 'bg-dark-surface3 text-text-tertiary',
};

export function Card({ title, children, action, badge }: CardProps) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-dark-border flex items-center justify-between">
        <div className="text-xs font-mono text-text-secondary uppercase tracking-widest">
          {title}
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold ${badgeColors[badge.type]}`}>
              ● {badge.label}
            </span>
          )}
          {action}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
