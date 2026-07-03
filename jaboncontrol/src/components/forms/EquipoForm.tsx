import { useState } from 'react';
import type { EquipoDocumento } from '../../types';

interface EquipoFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export function EquipoForm({ onSave, onCancel, initialData }: EquipoFormProps) {
  // El formulario soporta crear y editar reutilizando initialData.
  const [form, setForm] = useState({
    nombre: initialData?.nombre || '',
    tipo: (initialData?.tipo || 'horno') as 'horno' | 'mezclador' | 'empacadora' | 'bascula' | 'otro',
    estado: (initialData?.estado || 'operativo') as 'operativo' | 'mantenimiento' | 'reparacion' | 'fuera_servicio',
    fechaCompra: initialData?.fechaCompra || '',
    ubicacion: initialData?.ubicacion || 'Planta Principal',
    responsable: initialData?.responsable || 'Admin',
    observaciones: initialData?.observaciones || '',
    imagenData: initialData?.imagenData || '',
    especificaciones: initialData?.especificaciones || '',
    documentos: (initialData?.documentos || []) as EquipoDocumento[],
  });

  // loading evita doble guardado mientras se procesa.
  const [loading, setLoading] = useState(false);

  // Lee una imagen local y la guarda como base64 para persistirla en localStorage.
  const handleImage = (file?: File) => {
    // Si el usuario no eligio archivo, no hacemos nada.
    if (!file) return;

    // Validamos que realmente sea una imagen.
    if (!file.type.startsWith('image/')) {
      alert('Seleccione un archivo de imagen.');
      return;
    }

    // Evitamos imagenes enormes porque localStorage tiene limite de espacio.
    if (file.size > 1024 * 1024 * 1.5) {
      alert('La imagen debe pesar menos de 1.5 MB.');
      return;
    }

    // FileReader convierte la imagen en data URL base64.
    const reader = new FileReader();

    // Cuando termina la lectura, guardamos la imagen en el estado del formulario.
    reader.onload = () => setForm((current) => ({ ...current, imagenData: String(reader.result || '') }));

    // Inicia la lectura del archivo.
    reader.readAsDataURL(file);
  };

  // Lee documentos del equipo, incluyendo escaneos en imagen o PDF.
  const handleDocuments = (files?: FileList | null) => {
    // Si no hay archivos seleccionados, salimos sin cambios.
    if (!files?.length) return;

    // Definimos formatos permitidos para evitar archivos peligrosos.
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

    // Recorremos cada archivo elegido por el usuario.
    Array.from(files).forEach((file) => {
      // Validamos que sea PDF o imagen escaneada.
      if (!allowedTypes.includes(file.type)) {
        alert(`El archivo "${file.name}" no es valido. Use PDF, PNG, JPG o WEBP.`);
        return;
      }

      // Limitamos el peso porque estos documentos se guardan en el navegador.
      if (file.size > 1024 * 1024 * 2) {
        alert(`El archivo "${file.name}" debe pesar menos de 2 MB.`);
        return;
      }

      // FileReader convierte el documento en data URL base64.
      const reader = new FileReader();

      // Al terminar, agregamos el documento a la lista del formulario.
      reader.onload = () => {
        const newDocument: EquipoDocumento = {
          id: `${Date.now()}-${file.name}`,
          nombre: file.name,
          tipo: file.type,
          tamano: file.size,
          archivoData: String(reader.result || ''),
          fechaSubida: new Date().toISOString().slice(0, 10),
        };

        setForm((current) => ({ ...current, documentos: [...current.documentos, newDocument] }));
      };

      // Inicia lectura del archivo seleccionado.
      reader.readAsDataURL(file);
    });
  };

  // Quita un documento del estado antes de guardar el equipo.
  const removeDocument = (id: string) => {
    setForm((current) => ({ ...current, documentos: current.documentos.filter((documento) => documento.id !== id) }));
  };

  // Guarda el equipo validando campos minimos.
  const handleSubmit = async () => {
    // Nombre es obligatorio porque identifica el equipo.
    if (!form.nombre.trim()) {
      alert('Por favor ingrese el nombre del equipo');
      return;
    }

    // Activamos loading antes de enviar.
    setLoading(true);

    try {
      // Mandamos todos los campos, manteniendo id cuando estamos editando.
      await onSave({
        ...form,
        id: initialData?.id || Date.now().toString(),
      });
    } catch (error) {
      alert('Error al guardar el equipo');
      console.error(error);
    } finally {
      // Siempre apagamos loading al terminar.
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Nombre del equipo *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Horno Industrial #1"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Tipo de equipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="horno">Horno</option>
            <option value="mezclador">Mezclador</option>
            <option value="empacadora">Empacadora</option>
            <option value="bascula">Bascula</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Estado</label>
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="operativo">Operativo</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="reparacion">Reparacion</option>
            <option value="fuera_servicio">Fuera de servicio</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Fecha de compra</label>
          <input
            type="date"
            value={form.fechaCompra}
            onChange={(e) => setForm({ ...form, fechaCompra: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Ubicacion</label>
          <input
            type="text"
            value={form.ubicacion}
            onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            placeholder="Ej: Planta Principal"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Responsable</label>
          <input
            type="text"
            value={form.responsable}
            onChange={(e) => setForm({ ...form, responsable: e.target.value })}
            placeholder="Nombre del responsable"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Imagen del equipo</label>
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 items-start">
            <div className="h-32 rounded border border-dark-border bg-dark-surface2 overflow-hidden flex items-center justify-center">
              {form.imagenData ? (
                <img src={form.imagenData} alt={form.nombre || 'Equipo'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-text-tertiary">Sin imagen</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImage(event.target.files?.[0])}
                className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
              />
              {form.imagenData && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imagenData: '' })}
                  className="px-3 py-2 bg-dark-surface3 text-status-danger text-xs rounded border border-dark-border hover:border-status-danger"
                >
                  Quitar imagen
                </button>
              )}
              <p className="text-xs text-text-tertiary">Recomendado: foto horizontal menor a 1.5 MB.</p>
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Especificaciones tecnicas</label>
          <textarea
            value={form.especificaciones}
            onChange={(e) => setForm({ ...form, especificaciones: e.target.value })}
            placeholder={'Ej:\nPotencia: 7.5 HP\nVoltaje: 220V\nCapacidad: 1000 L\nSerie: ABC-123'}
            rows={5}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none resize-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Documentacion del equipo</label>
          <div className="rounded border border-dark-border bg-dark-surface2 p-3 space-y-3">
            <input
              type="file"
              multiple
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(event) => {
                handleDocuments(event.target.files);
                event.currentTarget.value = '';
              }}
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
            <p className="text-xs text-text-tertiary">Puede subir facturas, garantias, manuales o documentos escaneados en PDF/JPG/PNG/WEBP. Maximo 2 MB por archivo.</p>

            {form.documentos.length > 0 && (
              <div className="space-y-2">
                {form.documentos.map((documento) => (
                  <div key={documento.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded border border-dark-border bg-dark-surface px-3 py-2">
                    <div>
                      <div className="text-sm text-text-primary break-all">{documento.nombre}</div>
                      <div className="text-[11px] text-text-tertiary">
                        {documento.tipo || 'Archivo'} - {(documento.tamano / 1024).toFixed(0)} KB - {documento.fechaSubida}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(documento.id)}
                      className="px-3 py-1.5 bg-dark-surface3 text-status-danger text-xs rounded border border-dark-border hover:border-status-danger"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            placeholder="Notas o detalles del equipo..."
            rows={3}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dark-border">
        <button onClick={onCancel} disabled={loading} className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow disabled:opacity-50">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar equipo'}
        </button>
      </div>
    </div>
  );
}
