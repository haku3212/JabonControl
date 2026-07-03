import { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { KPICard } from '../common/KPICard';
import { Badge } from '../common/Badge';
import { useAppContext } from '../../context/AppContext';
import { generarReporteHornada, generarReporteHornadasMensual } from '../../services/pdfService';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { defaultDateRange, filterByDateRange, rangeLabel } from '../../utils/dateFilters';

interface HornadasProps {
  onNewClick?: () => void;
}

const safeIngredients = (hornada: any) => ({
  naohVolumen: Number(hornada?.ingredientes?.naohVolumen ?? hornada?.naohVolumen ?? 0),
  seboFund: Number(hornada?.ingredientes?.seboFund ?? hornada?.seboFund ?? 0),
  aceiteQuem: Number(hornada?.ingredientes?.aceiteQuem ?? hornada?.aceiteQuem ?? 0),
  aceiteCrudo: Number(hornada?.ingredientes?.aceiteCrudo ?? hornada?.aceiteCrudo ?? 0),
  aceiteAlmendra: Number(hornada?.ingredientes?.aceiteAlmendra ?? hornada?.aceiteAlmendra ?? 0),
  agua: Number(hornada?.ingredientes?.agua ?? hornada?.agua ?? 0),
  jabonRecicl: Number(hornada?.ingredientes?.jabonRecicl ?? hornada?.jabonRecicl ?? 0),
});

export function Hornadas({ onNewClick }: HornadasProps = {}) {
  // deleteHornada permite quitar registros con confirmacion segura.
  const { hornadas, kpis, deleteHornada } = useAppContext();
  const [reportHornada, setReportHornada] = useState<any>(null);
  const [reportMensual, setReportMensual] = useState(false);
  const [dateRange, setDateRange] = useState(defaultDateRange());

  const normalized = useMemo(() => filterByDateRange(hornadas, dateRange).map((hornada) => ({
    ...hornada,
    ingredientes: safeIngredients(hornada),
    produccionTotal: Number(hornada.produccionTotal || 0),
    rendimiento: Number(hornada.rendimiento || 0),
  })), [hornadas, dateRange]);

  const promedio = normalized.length ? normalized.reduce((sum, h) => sum + h.rendimiento, 0) / normalized.length : 0;
  const reciclado = normalized.reduce((sum, h) => sum + h.ingredientes.jabonRecicl, 0);
  const mejor = normalized.reduce((best, h) => (h.rendimiento > (best?.rendimiento || 0) ? h : best), normalized[0]);

  // Evita borrados accidentales mostrando numero de hornada.
  const safeDelete = (hornada: any) => {
    if (!confirm(`Eliminar la hornada ${hornada.numero}?`)) return;
    deleteHornada(hornada.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Produccion por hornadas</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">REGISTRO DIARIO, INSUMOS Y RENDIMIENTO</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setReportMensual(true)} className="px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-semibold rounded border border-dark-border hover:border-accent-yellow">
            PDF mensual
          </button>
          <button onClick={onNewClick} className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 w-fit">
            + Nueva hornada
          </button>
        </div>
      </div>

      <Card title="Filtro de periodo">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="Hornadas" value={normalized.length} unit="registros" color="yellow" />
        <KPICard label="Kg producidos" value={kpis.produccionHoy} unit="kg bruto" color="orange" />
        <KPICard label="Rendimiento prom." value={`${promedio.toFixed(1)}%`} unit="promedio historico" color="green" />
        <KPICard label="Jabon reciclado" value={Math.round(reciclado)} unit="kg recuperados" color="blue" />
      </div>

      <Card title="Resumen de produccion" badge={{ label: mejor ? `Mejor: ${mejor.numero}` : 'Sin datos', type: mejor ? 'success' : 'neutral' }}>
        {normalized.length === 0 ? (
          <div className="py-10 text-center text-text-tertiary text-sm">No hay hornadas registradas todavia.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-28 border-b border-dark-border pb-3">
              {normalized.slice(-10).map((h) => (
                <div key={h.id} className="flex-1 min-w-8 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t bg-accent-yellow/80 hover:bg-accent-yellow transition-colors" style={{ height: `${Math.max(18, Math.min(100, h.produccionTotal / 4))}%` }} />
                  <span className="text-[10px] font-mono text-text-tertiary truncate max-w-12">{h.numero.replace('H-', '')}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Mini label="Ultima hornada" value={normalized[0]?.numero || '-'} detail={`${normalized[0]?.produccionTotal || 0} kg`} />
              <Mini label="Operario frecuente" value={normalized[0]?.operario || '-'} detail="segun ultimo registro" />
              <Mini label="Rendimiento maximo" value={`${(mejor?.rendimiento || 0).toFixed(1)}%`} detail={mejor?.numero || '-'} />
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {normalized.map((hornada) => {
          const ing = hornada.ingredientes;
          const aceites = ing.aceiteQuem + ing.aceiteCrudo + ing.aceiteAlmendra;

          return (
            <Card
              key={hornada.id}
              title={`Hornada ${hornada.numero}`}
              badge={{ label: hornada.rendimiento >= 95 ? 'Optima' : 'Revisar', type: hornada.rendimiento >= 95 ? 'success' : 'warning' }}
              action={
                <div className="flex gap-2">
                  <button onClick={() => setReportHornada(hornada)} className="px-2 py-1 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90">
                    PDF
                  </button>
                  <button onClick={() => safeDelete(hornada)} className="px-2 py-1 bg-dark-surface3 text-status-danger text-xs font-semibold rounded border border-dark-border hover:border-status-danger">
                    Eliminar
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-text-tertiary uppercase">Fecha / hora</div>
                    <div className="text-text-primary">{hornada.fecha} - {hornada.horaInicio || 'Sin hora'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-text-tertiary uppercase">Operario</div>
                    <div className="text-text-primary">{hornada.operario || 'Sin asignar'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-text-tertiary uppercase">Estado</div>
                    <div className="mt-1"><Badge label="Completado" type="success" /></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Metric label="NaOH" value={ing.naohVolumen} unit="lts" />
                  <Metric label="Sebo" value={ing.seboFund} unit="kg" />
                  <Metric label="Aceites" value={aceites.toFixed(1)} unit="lts" />
                  <Metric label="Produccion" value={hornada.produccionTotal} unit="kg" highlight />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-text-tertiary">Rendimiento</span>
                    <span className="text-status-success">{hornada.rendimiento.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-dark-surface3 overflow-hidden">
                    <div className="h-full bg-status-success" style={{ width: `${Math.min(100, hornada.rendimiento)}%` }} />
                  </div>
                </div>

                {hornada.observaciones && (
                  <div className="text-xs text-text-tertiary font-mono p-3 bg-dark-surface2 rounded border border-dark-border">
                    OBS: {hornada.observaciones}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ReportDownloadModal
        isOpen={Boolean(reportHornada)}
        title="Reporte de hornada"
        subtitle={reportHornada?.numero || ''}
        onClose={() => setReportHornada(null)}
        onConfirm={(options) => reportHornada && generarReporteHornada(reportHornada, options)}
      />
      <ReportDownloadModal
        isOpen={reportMensual}
        title="Reporte mensual de hornadas"
        subtitle={rangeLabel(dateRange)}
        onClose={() => setReportMensual(false)}
        onConfirm={(options) => generarReporteHornadasMensual(normalized, options)}
      />
    </div>
  );
}

function Mini({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded border border-dark-border bg-dark-surface2 px-4 py-3">
      <div className="text-xs font-mono text-text-tertiary uppercase">{label}</div>
      <div className="text-lg font-bebas text-text-primary mt-1">{value}</div>
      <div className="text-xs text-text-tertiary">{detail}</div>
    </div>
  );
}

function Metric({ label, value, unit, highlight = false }: { label: string; value: string | number; unit: string; highlight?: boolean }) {
  return (
    <div className="bg-dark-surface2 border border-dark-border rounded p-3 text-center">
      <div className="text-xs font-mono text-text-tertiary uppercase">{label}</div>
      <div className={`text-2xl font-bebas mt-1 ${highlight ? 'text-accent-yellow' : 'text-text-primary'}`}>{value}</div>
      <div className="text-[10px] text-text-tertiary font-mono uppercase">{unit}</div>
    </div>
  );
}
