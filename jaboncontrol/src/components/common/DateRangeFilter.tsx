import type { DateRange } from '../../utils/dateFilters';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
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
        className="px-3 py-2 bg-dark-surface3 text-text-secondary text-xs rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow"
      >
        Limpiar
      </button>
    </div>
  );
}
