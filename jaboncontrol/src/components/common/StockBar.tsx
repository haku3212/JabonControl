interface StockBarProps {
  label: string;
  percentage: number;
  quantity: string;
  color?: 'success' | 'warning' | 'danger';
}

const colorMap = {
  success: 'bg-status-success',
  warning: 'bg-accent-yellow',
  danger: 'bg-status-danger',
};

export function StockBar({ label, percentage, quantity, color = 'success' }: StockBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-24">{label}</span>
      <div className="flex-1 h-1 bg-dark-surface3 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-mono text-text-tertiary w-20 text-right">{quantity}</span>
    </div>
  );
}
