interface KPICardProps {
  label: string;
  value: string | number;
  unit: string;
  color: 'yellow' | 'orange' | 'blue' | 'green';
  delta?: {
    value: number;
    positive: boolean;
  };
}

const colorClasses = {
  yellow: 'border-l-[#a08b44]',
  orange: 'border-l-[#9a6045]',
  blue: 'border-l-accent-blue',
  green: 'border-l-status-success',
};

export function KPICard({ label, value, unit, color, delta }: KPICardProps) {
  return (
    <div className={`bg-dark-surface border border-dark-border border-l-[3px] ${colorClasses[color]} rounded-md px-4 py-3 shadow-[0_1px_3px_rgba(36,35,33,0.04)]`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide truncate">
            {label}
          </div>
          <div className="mt-2 text-[1.7rem] font-semibold text-text-primary leading-none">
            {value}
          </div>
          <div className="text-xs text-text-tertiary mt-1">
            {unit}
          </div>
        </div>
        {delta && (
          <div className={`text-xs font-medium ${delta.positive ? 'text-status-success' : 'text-status-danger'}`}>
            {delta.positive ? '+' : '-'}{Math.abs(delta.value)}%
          </div>
        )}
      </div>
    </div>
  );
}
