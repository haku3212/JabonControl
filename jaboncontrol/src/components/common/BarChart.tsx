interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: 'yellow' | 'orange' | 'blue' | 'green';
  }>;
  height?: number;
  maxValue?: number;
}

const colorMap = {
  yellow: 'bg-accent-yellow',
  orange: 'bg-accent-orange',
  blue: 'bg-accent-blue',
  green: 'bg-status-success',
};

export function BarChart({ data, height = 80, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value));

  return (
    <div className="flex items-end gap-1.5 pt-2" style={{ height: `${height}px` }}>
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-sm transition-opacity hover:opacity-100 opacity-70 ${colorMap[item.color || 'yellow']}`}
            style={{ height: `${(item.value / max) * (height - 20)}px` }}
          />
          <span className="text-xs font-mono text-text-tertiary">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
