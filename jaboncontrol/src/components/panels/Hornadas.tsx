import { Card } from '../common/Card';
import { KPICard } from '../common/KPICard';
import { Badge } from '../common/Badge';
import { useAppContext } from '../../context/AppContext';
import { generarReporteHornada } from '../../services/pdfService';

interface HornadasProps {
  onNewClick?: () => void;
}

export function Hornadas({ onNewClick }: HornadasProps = {}) {
  const { hornadas, kpis } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Producción por Hornadas</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">REGISTRO DE PRODUCCIÓN DIARIA</p>
        </div>
        <button
          onClick={onNewClick}
          className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
        >
          + Nueva Hornada
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Hornadas Hoy" value={hornadas.length} unit="completadas" color="yellow" />
        <KPICard label="Kg Producidos Hoy" value={kpis.produccionHoy} unit="kg jabón bruto" color="orange" />
        <KPICard
          label="Jabón Reciclado Hoy"
          value={Math.round(hornadas.reduce((sum, h) => sum + h.ingredientes.jabonRecicl, 0) / hornadas.length) || 0}
          unit="kg (estimado)"
          color="blue"
        />
      </div>

      <div className="space-y-4">
        {hornadas.map((hornada) => (
          <Card key={hornada.id} title={`HORNADA #${hornada.numero}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-bebas text-accent-yellow">{hornada.numero}</div>
                  <div className="text-xs text-text-tertiary font-mono mt-1">
                    {hornada.fecha} — {hornada.horaInicio}
                  </div>
                </div>
                <div className="flex gap-6 text-xs">
                  <div>
                    <div className="text-text-tertiary font-mono">OPERARIO</div>
                    <div className="text-text-primary">{hornada.operario}</div>
                  </div>
                  <div>
                    <div className="text-text-tertiary font-mono">RENDIMIENTO</div>
                    <div className="text-status-success">{hornada.rendimiento.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-text-tertiary font-mono">ESTADO</div>
                    <div className="mt-1"><Badge label="Completado" type="success" /></div>
                  </div>
                  <div>
                    <button
                      onClick={() => generarReporteHornada(hornada)}
                      className="px-2 py-1 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
                      title="Descargar reporte en PDF"
                    >
                      📄 PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-dark-surface2 p-3 rounded">
                <div className="text-center">
                  <div className="text-xs font-mono text-text-tertiary">SODA CÁUST.</div>
                  <div className="text-2xl font-bebas text-text-primary mt-1">{hornada.ingredientes.naohVolumen}</div>
                  <div className="text-xs text-text-tertiary font-mono">LTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono text-text-tertiary">SEBO FUND.</div>
                  <div className="text-2xl font-bebas text-text-primary mt-1">{hornada.ingredientes.seboFund}</div>
                  <div className="text-xs text-text-tertiary font-mono">KG</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono text-text-tertiary">ACEITES (LTS)</div>
                  <div className="text-2xl font-bebas text-text-primary mt-1">
                    {(hornada.ingredientes.aceiteQuem + hornada.ingredientes.aceiteCrudo + hornada.ingredientes.aceiteAlmendra).toFixed(1)}
                  </div>
                  <div className="text-xs text-text-tertiary font-mono">TOTAL</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono text-text-tertiary">PRODUCCIÓN</div>
                  <div className="text-2xl font-bebas text-accent-yellow mt-1">{hornada.produccionTotal}</div>
                  <div className="text-xs text-text-tertiary font-mono">KG TOTAL</div>
                </div>
              </div>

              {hornada.observaciones && (
                <div className="text-xs text-text-tertiary font-mono p-2 bg-dark-surface2 rounded">
                  OBS: {hornada.observaciones}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
