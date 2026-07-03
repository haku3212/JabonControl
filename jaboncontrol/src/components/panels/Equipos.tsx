import { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EquipoForm } from '../forms/EquipoForm';
import { useAppContext } from '../../context/AppContext';
import type { EquipoApp, EquipoDocumento } from '../../types';

interface EquiposProps {
  onNewClick?: () => void;
}

// Traduce el estado interno a texto y color visual.
const estadoBadge: Record<string, { label: string; type: 'success' | 'warning' | 'danger' }> = {
  operativo: { label: 'Operativo', type: 'success' },
  mantenimiento: { label: 'Mantenimiento', type: 'warning' },
  reparacion: { label: 'Reparacion', type: 'warning' },
  fuera_servicio: { label: 'Fuera de servicio', type: 'danger' },
};

// Texto de respaldo cuando no hay imagen cargada.
function EquipmentImage({ equipo }: { equipo: EquipoApp }) {
  return (
    <div className="h-40 rounded border border-dark-border bg-dark-surface2 overflow-hidden flex items-center justify-center">
      {equipo.imagenData ? (
        <img src={equipo.imagenData} alt={equipo.nombre} className="w-full h-full object-cover" />
      ) : (
        <div className="text-center px-4">
          <div className="text-2xl font-bebas text-text-tertiary">{equipo.tipo}</div>
          <div className="text-xs text-text-tertiary mt-1">Sin imagen asociada</div>
        </div>
      )}
    </div>
  );
}

// Convierte especificaciones escritas linea por linea en una lista legible.
function SpecsList({ specs }: { specs?: string }) {
  // Si no hay especificaciones, mostramos una ayuda breve.
  if (!specs?.trim()) {
    return <div className="text-xs text-text-tertiary">Sin especificaciones registradas.</div>;
  }

  // Separamos por linea para respetar el formato del usuario.
  const lines = specs.split('\n').map((line) => line.trim()).filter(Boolean);

  return (
    <div className="space-y-1">
      {lines.map((line, index) => (
        <div key={index} className="text-xs text-text-secondary border-b border-dark-border last:border-0 pb-1 last:pb-0">
          {line}
        </div>
      ))}
    </div>
  );
}

// Muestra documentos guardados y permite abrirlos en otra pestaña.
function DocumentsList({ documentos }: { documentos?: EquipoDocumento[] }) {
  // Sin documentos, dejamos claro que todavia no hay respaldo digital.
  if (!documentos?.length) {
    return <div className="text-xs text-text-tertiary">Sin documentos adjuntos.</div>;
  }

  return (
    <div className="space-y-2">
      {documentos.map((documento) => (
        <div key={documento.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded border border-dark-border bg-dark-surface px-3 py-2">
          <div>
            <div className="text-sm text-text-primary break-all">{documento.nombre}</div>
            <div className="text-[11px] text-text-tertiary">
              {documento.tipo || 'Archivo'} - {(documento.tamano / 1024).toFixed(0)} KB - {documento.fechaSubida}
            </div>
          </div>
          <a
            href={documento.archivoData}
            download={documento.nombre}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-dark-surface3 rounded text-xs border border-dark-border hover:border-accent-yellow text-center"
          >
            Abrir
          </a>
        </div>
      ))}
    </div>
  );
}

export function Equipos({ onNewClick: _onNewClick }: EquiposProps) {
  // Leemos equipos y acciones CRUD locales desde el contexto.
  const { equipos, addEquipo, updateEquipo, deleteEquipo } = useAppContext();

  // Equipo seleccionado para ver ficha completa.
  const [detailEquipo, setDetailEquipo] = useState<EquipoApp | null>(null);

  // Equipo seleccionado para editar; null significa crear nuevo.
  const [editing, setEditing] = useState<EquipoApp | null>(null);

  // Controla apertura del formulario.
  const [showForm, setShowForm] = useState(false);

  // Abre el formulario en modo nuevo.
  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  // Elimina con confirmacion para evitar borrados accidentales.
  const handleEliminar = (id: string, nombre: string) => {
    if (confirm(`Eliminar el equipo "${nombre}"?`)) {
      deleteEquipo(id);
    }
  };

  // Guarda creando o actualizando segun exista editing.
  const handleSave = async (data: EquipoApp) => {
    if (editing) {
      updateEquipo(editing.id, data);
    } else {
      addEquipo(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Equipos</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">INVENTARIO, IMAGEN Y ESPECIFICACIONES TECNICAS</p>
        </div>
        <button onClick={openNew} className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 w-fit">
          + Agregar equipo
        </button>
      </div>

      {equipos.length === 0 ? (
        <Card title="Mis equipos">
          <div className="text-center py-8">
            <p className="text-sm text-text-secondary mb-1">No hay equipos registrados todavia</p>
            <p className="text-xs text-text-tertiary mb-4">Registra maquinaria con foto, responsable y especificaciones.</p>
            <button onClick={openNew} className="px-4 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90">
              Registrar primer equipo
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {equipos.map((equipo) => {
            // Elegimos el badge segun estado, con operativo como fallback.
            const badge = estadoBadge[equipo.estado] || estadoBadge.operativo;

            return (
              <Card key={equipo.id} title={equipo.nombre} badge={{ label: badge.label, type: badge.type }}>
                <div className="space-y-4 text-sm">
                  <EquipmentImage equipo={equipo} />

                  <div className="grid grid-cols-2 gap-2">
                    <Info label="Tipo" value={equipo.tipo || '-'} />
                    <Info label="Compra" value={equipo.fechaCompra || '-'} />
                    <Info label="Ubicacion" value={equipo.ubicacion || '-'} />
                    <Info label="Responsable" value={equipo.responsable || '-'} />
                  </div>

                  <div className="rounded border border-dark-border bg-dark-surface2 p-3">
                    <div className="text-xs font-mono text-text-tertiary uppercase mb-2">Especificaciones</div>
                    <SpecsList specs={equipo.especificaciones} />
                  </div>

                  <div className="rounded border border-dark-border bg-dark-surface2 p-3">
                    <div className="text-xs font-mono text-text-tertiary uppercase mb-2">Documentos</div>
                    <div className="text-xs text-text-secondary">{equipo.documentos?.length || 0} archivo(s) adjunto(s)</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setEditing(equipo);
                        setShowForm(true);
                      }}
                      className="flex-1 min-w-24 px-2 py-1.5 bg-dark-surface3 rounded text-xs border border-dark-border hover:border-accent-blue hover:text-accent-blue"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDetailEquipo(equipo)}
                      className="flex-1 min-w-24 px-2 py-1.5 bg-dark-surface3 rounded text-xs border border-dark-border hover:border-accent-yellow"
                    >
                      Detalles
                    </button>
                    <button
                      onClick={() => handleEliminar(equipo.id, equipo.nombre)}
                      className="px-2 py-1.5 bg-dark-surface3 rounded text-xs border border-dark-border hover:border-status-danger hover:text-status-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={Boolean(detailEquipo)} title={detailEquipo?.nombre || 'Detalle de equipo'} onClose={() => setDetailEquipo(null)}>
        {detailEquipo && (
          <div className="space-y-5">
            <EquipmentImage equipo={detailEquipo} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Info label="Tipo" value={detailEquipo.tipo || '-'} />
              <Info label="Estado" value={(estadoBadge[detailEquipo.estado] || estadoBadge.operativo).label} />
              <Info label="Ubicacion" value={detailEquipo.ubicacion || '-'} />
              <Info label="Responsable" value={detailEquipo.responsable || '-'} />
              <Info label="Fecha de compra" value={detailEquipo.fechaCompra || '-'} />
            </div>

            <div className="rounded border border-dark-border bg-dark-surface2 p-4">
              <div className="text-xs font-mono text-text-tertiary uppercase mb-2">Especificaciones tecnicas</div>
              <SpecsList specs={detailEquipo.especificaciones} />
            </div>

            <div className="rounded border border-dark-border bg-dark-surface2 p-4">
              <div className="text-xs font-mono text-text-tertiary uppercase mb-2">Documentacion adjunta</div>
              <DocumentsList documentos={detailEquipo.documentos} />
            </div>

            {detailEquipo.observaciones && (
              <div className="rounded border border-dark-border bg-dark-surface2 p-4">
                <div className="text-xs font-mono text-text-tertiary uppercase mb-2">Observaciones</div>
                <p className="text-sm text-text-secondary">{detailEquipo.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showForm} title={editing ? 'Editar equipo' : 'Nuevo equipo'} onClose={() => setShowForm(false)}>
        <EquipoForm initialData={editing} onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-dark-border bg-dark-surface2 px-3 py-2">
      <div className="text-[10px] font-mono text-text-tertiary uppercase">{label}</div>
      <div className="text-sm text-text-primary mt-1 break-words">{value}</div>
    </div>
  );
}
