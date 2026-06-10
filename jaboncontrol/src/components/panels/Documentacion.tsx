import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAppContext } from '../../context/AppContext';

interface DocumentacionProps {
  onNewClick?: () => void;
}

const tipoLabels: Record<string, string> = {
  permiso: 'Permiso/Licencia',
  'ficha-tecnica': 'Ficha Técnica',
  otro: 'Otro',
};

export function Documentacion({ onNewClick }: DocumentacionProps) {
  const { documentos, deleteDocumento } = useAppContext();
  const [docQR, setDocQR] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current && docQR) {
      qrRef.current.innerHTML = '';
      const datosQR = `DOC|${docQR}|VERIFICABLE`;
      QRCode.toCanvas(qrRef.current, datosQR, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      }).catch((err: unknown) => console.error('Error QR:', err));
    }
  }, [docQR]);

  const verDocumento = (doc: { archivo: string; archivoData?: string }) => {
    if (!doc.archivoData) {
      alert('Este documento no tiene archivo adjunto disponible');
      return;
    }
    // Abrir en nueva pestaña
    const win = window.open();
    if (win) {
      if (doc.archivoData.startsWith('data:application/pdf') || doc.archivoData.startsWith('data:image')) {
        win.document.write(
          `<iframe src="${doc.archivoData}" style="width:100%;height:100%;border:none;" title="${doc.archivo}"></iframe>`
        );
        win.document.title = doc.archivo;
      } else {
        // Tipos no visualizables: descargar directamente
        win.close();
        descargarDocumento(doc);
      }
    }
  };

  const descargarDocumento = (doc: { archivo: string; archivoData?: string }) => {
    if (!doc.archivoData) {
      alert('Este documento no tiene archivo adjunto disponible');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.archivoData;
    link.download = doc.archivo;
    link.click();
  };

  const handleEliminar = (id: string, nombre: string) => {
    if (confirm(`¿Eliminar el documento "${nombre}"?`)) {
      deleteDocumento(id);
    }
  };

  const estadoVencimiento = (vencimiento: string): { label: string; type: 'success' | 'warning' | 'danger' } => {
    if (!vencimiento) return { label: 'Sin vencimiento', type: 'success' };
    const dias = Math.ceil((new Date(vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return { label: 'Vencido', type: 'danger' };
    if (dias <= 30) return { label: 'Vence pronto', type: 'warning' };
    return { label: 'Vigente', type: 'success' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Documentación</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">PERMISOS, AMBIENTAL Y TÉCNICO</p>
        </div>
        <button
          onClick={onNewClick}
          className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
        >
          + Agregar Documento
        </button>
      </div>

      {/* MIS DOCUMENTOS SUBIDOS */}
      <Card title={`Mis Documentos (${documentos.length})`}>
        {documentos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-sm text-text-secondary mb-1">No hay documentos subidos todavía</p>
            <p className="text-xs text-text-tertiary mb-4">
              Sube tus permisos, fichas técnicas, historiales y más en PDF, Word, Excel o imágenes
            </p>
            <button
              onClick={onNewClick}
              className="px-4 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
            >
              📁 Subir mi primer documento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Documento', 'Tipo', 'Archivo', 'Subido', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="text-left px-2 py-2 text-xs font-mono text-text-tertiary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => {
                  const estado = estadoVencimiento(doc.vencimiento);
                  return (
                    <tr key={doc.id} className="border-b border-dark-border hover:bg-dark-surface2">
                      <td className="px-2 py-2 text-text-primary text-xs font-semibold">
                        {doc.nombre}
                        {doc.descripcion && (
                          <div className="text-text-tertiary font-normal mt-0.5">{doc.descripcion}</div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-text-secondary text-xs">{tipoLabels[doc.tipo] || doc.tipo}</td>
                      <td className="px-2 py-2 font-mono text-text-secondary text-xs">📄 {doc.archivo}</td>
                      <td className="px-2 py-2 font-mono text-text-secondary text-xs">{doc.fechaSubida}</td>
                      <td className="px-2 py-2">
                        <Badge label={estado.label} type={estado.type} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => verDocumento(doc)}
                            className="text-xs px-2 py-1 bg-dark-surface3 rounded border border-dark-border hover:border-accent-yellow"
                            title="Ver documento"
                          >
                            👁️ Ver
                          </button>
                          <button
                            onClick={() => descargarDocumento(doc)}
                            className="text-xs px-2 py-1 bg-dark-surface3 rounded border border-dark-border hover:border-accent-yellow"
                            title="Descargar"
                          >
                            ⬇️
                          </button>
                          <button
                            onClick={() => setDocQR(doc.nombre)}
                            className="text-xs px-2 py-1 bg-accent-yellow text-black rounded hover:bg-opacity-90"
                            title="Código QR"
                          >
                            📱
                          </button>
                          <button
                            onClick={() => handleEliminar(doc.id, doc.nombre)}
                            className="text-xs px-2 py-1 bg-dark-surface3 rounded border border-dark-border hover:border-status-danger hover:text-status-danger"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Permisos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Documento', 'Nivel', 'Vencimiento', 'Estado', ''].map((h) => (
                    <th key={h} className="text-left px-2 py-2 text-xs font-mono text-text-tertiary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { doc: 'Licencia Ambiental', nivel: 'Municipal', venc: '31/12/2026', est: 'success' },
                  { doc: 'Registro SENASAG', nivel: 'Nacional', venc: '15/08/2026', est: 'warning' },
                  { doc: 'Habilitación Depto', nivel: 'Departamental', venc: '30/06/2026', est: 'danger' },
                ].map((row) => (
                  <tr key={row.doc} className="border-b border-dark-border hover:bg-dark-surface2">
                    <td className="px-2 py-2 text-text-secondary text-xs">{row.doc}</td>
                    <td className="px-2 py-2 font-mono text-text-secondary text-xs">{row.nivel}</td>
                    <td className="px-2 py-2 font-mono text-text-secondary text-xs">{row.venc}</td>
                    <td className="px-2 py-2"><Badge label={row.est === 'success' ? 'Vigente' : row.est === 'warning' ? 'Por renovar' : 'Vence pronto'} type={row.est as 'success' | 'warning' | 'danger'} /></td>
                    <td className="px-2 py-2">
                      <button onClick={() => setDocQR(row.doc)} className="text-xs px-2 py-1 bg-accent-yellow text-black rounded hover:bg-opacity-90">📱 QR</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Fichas Técnicas">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Material', 'Documento', 'Fecha'].map((h) => (
                    <th key={h} className="text-left px-2 py-2 text-xs font-mono text-text-tertiary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { mat: 'NaOH', doc: 'Ficha seguridad MSDS', fecha: 'Ene 2026' },
                  { mat: 'Aceite almendra', doc: 'Certificado calidad', fecha: 'Mar 2026' },
                ].map((row) => (
                  <tr key={row.mat} className="border-b border-dark-border hover:bg-dark-surface2">
                    <td className="px-2 py-2 text-text-secondary text-xs">{row.mat}</td>
                    <td className="px-2 py-2 text-text-secondary text-xs">{row.doc}</td>
                    <td className="px-2 py-2 font-mono text-text-secondary text-xs">{row.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Ambiental">
          <div className="space-y-3">
            <div className="p-3 bg-status-success bg-opacity-10 rounded border-l-4 border-status-success">
              <div className="text-xs font-semibold mb-1">Plan de Manejo Ambiental</div>
              <p className="text-xs text-text-tertiary mb-2">Última actualización: Marzo 2026</p>
              <button
                onClick={onNewClick}
                className="text-xs px-2 py-1 bg-dark-surface3 rounded border border-dark-border hover:border-accent-yellow"
              >
                📁 Cargar documento
              </button>
            </div>
            <div className="p-3 bg-accent-blue bg-opacity-10 rounded border-l-4 border-accent-blue">
              <div className="text-xs font-semibold mb-1">Monitoreo de efluentes</div>
              <p className="text-xs text-text-tertiary mb-2">Informe mensual pendiente</p>
              <button
                onClick={onNewClick}
                className="text-xs px-2 py-1 bg-dark-surface3 rounded border border-dark-border hover:border-accent-yellow"
              >
                📁 Cargar informe
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal QR para Documentación */}
      {docQR && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={() => setDocQR(null)}>
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 max-w-md w-full fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-bebas text-accent-yellow">📱 Verificación - {docQR}</div>
              <button onClick={() => setDocQR(null)} className="text-xl text-text-tertiary hover:text-text-primary">✕</button>
            </div>

            <div className="bg-white p-4 rounded-lg flex justify-center mb-4">
              <div ref={qrRef}></div>
            </div>

            <div className="text-center text-xs text-text-secondary mb-4">
              <div className="font-mono">DOCUMENTO VERIFICABLE</div>
              <div className="text-text-tertiary">Escanear para validación digital</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (qrRef.current?.querySelector('canvas')) {
                    const canvas = qrRef.current.querySelector('canvas') as HTMLCanvasElement;
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `QR_${docQR}.png`;
                    link.click();
                  }
                }}
                className="flex-1 px-3 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
              >
                ⬇️ Descargar
              </button>
              <button
                onClick={() => setDocQR(null)}
                className="flex-1 px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
