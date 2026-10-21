import type { DateRange } from '../../utils/dateFilters';
import { RotateCcw } from 'lucide-react';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="date-range">
      <label className="block">
        <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Desde</span>
        <input
          type="date"
          value={value.from}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
          className="bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Hasta</span>
        <input
          type="date"
          value={value.to}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
          className="bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
        />
      </label>
      <button
        onClick={() => onChange({ from: '', to: '' })}
        type="button"
        aria-label="Limpiar fechas"
        title="Limpiar fechas"
        className="icon-button mb-0.5"
      >
        <RotateCcw size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
