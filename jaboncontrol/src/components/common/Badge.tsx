interface BadgeProps {
  label: string;
  type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const badgeColors = {
  success: 'bg-status-success bg-opacity-10 text-status-success',
  warning: 'bg-accent-yellow bg-opacity-10 text-accent-yellow',
  danger: 'bg-status-danger bg-opacity-10 text-status-danger',
  info: 'bg-accent-blue bg-opacity-10 text-accent-blue',
  neutral: 'bg-dark-surface3 text-text-tertiary',
};

export function Badge({ label, type }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold ${badgeColors[type]}`}>
      {label}
    </span>
  );
}
