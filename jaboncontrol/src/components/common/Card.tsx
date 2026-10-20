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
  success: 'bg-[#eef6f0] text-status-success border-[#cfe3d4]',
  warning: 'bg-[#f8f3df] text-status-warning border-[#e6d9a3]',
  danger: 'bg-[#f8eeec] text-status-danger border-[#e2c3be]',
  info: 'bg-[#edf3f5] text-accent-blue border-[#c9dbe2]',
  neutral: 'bg-dark-surface3 text-text-secondary border-dark-border',
};

export function Card({ title, children, action, badge }: CardProps) {
  return (
    <section className="bg-dark-surface border border-dark-border rounded-md overflow-hidden shadow-[0_1px_3px_rgba(36,35,33,0.04)]">
      <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between bg-white">
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {title}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${badgeColors[badge.type]}`}>
              {badge.label}
            </span>
          )}
          {action}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </section>
  );
}
