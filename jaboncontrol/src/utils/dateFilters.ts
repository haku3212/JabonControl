export interface DateRange {
  from: string;
  to: string;
}

export const defaultDateRange = (): DateRange => ({
  from: '',
  to: '',
});

export const isWithinDateRange = (date: string, range: DateRange) => {
  if (!date) return false;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
};

export const filterByDateRange = <T extends { fecha: string }>(items: T[], range: DateRange) => (
  items.filter((item) => isWithinDateRange(item.fecha, range))
);

export const rangeLabel = (range: DateRange) => {
  if (range.from && range.to) return `${range.from} a ${range.to}`;
  if (range.from) return `Desde ${range.from}`;
  if (range.to) return `Hasta ${range.to}`;
  return 'Todos los periodos';
};
