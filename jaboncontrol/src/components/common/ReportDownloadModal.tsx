import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import type { ReportOptions } from '../../services/pdfService';

interface ReportDownloadModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm: (options: ReportOptions) => void;
}

const defaultOptions: Required<Pick<ReportOptions, 'includeCompany' | 'includeDetails' | 'includeTotals' | 'includeNotes'>> = {
  includeCompany: true,
  includeDetails: true,
  includeTotals: true,
  includeNotes: false,
};

export function ReportDownloadModal({ isOpen, title, subtitle = '', onClose, onConfirm }: ReportDownloadModalProps) {
  const [reportTitle, setReportTitle] = useState(title);
  const [reportSubtitle, setReportSubtitle] = useState(subtitle);
  const [options, setOptions] = useState(defaultOptions);

  useEffect(() => {
    if (!isOpen) return;
    setReportTitle(title);
    setReportSubtitle(subtitle);
    setOptions(defaultOptions);
  }, [isOpen, title, subtitle]);

  const toggle = (key: keyof typeof defaultOptions) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const confirm = () => {
    onConfirm({
      title: reportTitle.trim() || title,
      subtitle: reportSubtitle.trim(),
      ...options,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Preparar PDF" onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Titulo</span>
            <input
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Subtitulo</span>
            <input
              value={reportSubtitle}
              onChange={(event) => setReportSubtitle(event.target.value)}
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Option label="Datos de empresa" checked={options.includeCompany} onChange={() => toggle('includeCompany')} />
          <Option label="Detalle / tabla" checked={options.includeDetails} onChange={() => toggle('includeDetails')} />
          <Option label="Totales destacados" checked={options.includeTotals} onChange={() => toggle('includeTotals')} />
          <Option label="Notas y firma" checked={options.includeNotes} onChange={() => toggle('includeNotes')} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-dark-border">
          <button
            onClick={onClose}
            className="px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border hover:border-accent-yellow"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90"
          >
            Descargar PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Option({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex items-center gap-3 rounded border px-3 py-3 cursor-pointer transition-colors ${checked ? 'border-accent-yellow bg-dark-surface2 text-text-primary' : 'border-dark-border text-text-tertiary hover:text-text-primary'}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-yellow-500" />
      <span className="text-sm">{label}</span>
    </label>
  );
}
