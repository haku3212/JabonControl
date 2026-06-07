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
  yellow: 'before:bg-accent-yellow',
  orange: 'before:bg-accent-orange',
  blue: 'before:bg-accent-blue',
  green: 'before:bg-status-success',
};

export function KPICard({ label, value, unit, color, delta }: KPICardProps) {
  return (
    <div className={`bg-dark-surface border border-dark-border rounded-lg p-5 relative overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-1 ${colorClasses[color]}`}>
      <div className="text-xs font-mono text-text-tertiary uppercase tracking-tight mb-1.5">
        {label}
      </div>
      <div className="text-4xl font-bebas text-text-primary leading-none">
        {value}
      </div>
      <div className="text-xs text-text-tertiary font-mono mt-1">
        {unit}
      </div>
      {delta && (
        <div className={`absolute top-5 right-5 text-xs font-mono ${delta.positive ? 'text-status-success' : 'text-status-danger'}`}>
          {delta.positive ? '▲' : '▼'} {Math.abs(delta.value)}%
        </div>
      )}
    </div>
  );
}
