import { useState } from 'react';

interface DocumentoFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function DocumentoForm({ onSave, onCancel }: DocumentoFormProps) {
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'permiso' as 'permiso' | 'ficha-tecnica' | 'otro',
    descripcion: '',
    vencimiento: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!form.nombre || !file) {
      alert('Por favor ingrese el nombre y seleccione un archivo');
      return;
    }

    setLoading(true);
    try {
      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('tipo', form.tipo);
      formData.append('descripcion', form.descripcion);
      formData.append('vencimiento', form.vencimiento);
      formData.append('archivo', file);

      // Aquí iría la llamada al API para subir
      // Por ahora, simplemente lo guardamos en estado local
      await onSave({
        ...form,
        id: Date.now().toString(),
        archivo: file.name,
        fechaSubida: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      alert('Error al guardar el documento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Nombre del Documento *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Licencia Ambiental"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Tipo de Documento</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="permiso">Permiso/Licencia</option>
            <option value="ficha-tecnica">Ficha Técnica</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Vencimiento (opcional)</label>
          <input
            type="date"
            value={form.vencimiento}
            onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Descripción (opcional)</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Notas o detalles adicionales..."
            rows={3}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none resize-none"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Archivo *</label>
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm"
            />
            {file && <p className="text-xs text-accent-yellow mt-1">✅ {file.name}</p>}
          </div>
          <p className="text-xs text-text-tertiary mt-1">Formatos: PDF, DOC, XLS, JPG, PNG</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dark-border">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? '⏳ Guardando...' : '📁 Subir Documento'}
        </button>
      </div>
    </div>
  );
}
