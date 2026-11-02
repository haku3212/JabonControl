import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from './Modal';

export function DeleteFinancialModal({ title, record, description, onConfirm, onClose }: { title: string; record: string; description: string; onConfirm: (motivo: string) => Promise<void>; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const motivo = reason === 'Otro' ? details.trim() : `${reason}${details.trim() ? `: ${details.trim()}` : ''}`;
    if (!confirmed || motivo.length < 5 || motivo.length > 500) { setError('Confirme la operacion e indique un motivo de entre 5 y 500 caracteres.'); return; }
    setBusy(true); setError('');
    try { await onConfirm(motivo); }
    catch (err) { setError((err as Error).message || 'No se pudo completar la eliminacion.'); }
    finally { setBusy(false); }
  }
  return <Modal isOpen title={title} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} className="space-y-4">
      <p className="font-semibold text-sm break-words">{record}</p>
      <p className="text-sm text-text-secondary">{description}</p>
      <label className="block"><span className="block text-xs text-text-secondary mb-1.5">Motivo *</span><select aria-label="Motivo" required disabled={busy} value={reason} onChange={event => setReason(event.target.value)} className="w-full rounded border border-dark-border p-2 text-sm bg-white"><option value="">Seleccione un motivo</option>{['Registro de prueba', 'Registro duplicado', 'Error de registro', 'Otro'].map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="block"><span className="block text-xs text-text-secondary mb-1.5">Detalle{reason === 'Otro' ? ' *' : ''}</span><textarea disabled={busy} required={reason === 'Otro'} value={details} onChange={event => setDetails(event.target.value)} rows={3} maxLength={450} className="w-full rounded border border-dark-border p-2 text-sm bg-white" /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required disabled={busy} checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="contact-check mt-0.5" /><span>Confirmo que este es el registro que quiero eliminar.</span></label>
      {error && <p role="alert" className="text-sm text-status-danger border-l-4 border-status-danger pl-3 break-words">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-dark-border"><button type="button" disabled={busy} className="action-secondary" onClick={onClose}>Cancelar</button><button disabled={busy || !reason || !confirmed} className="action-primary !bg-status-danger"><Trash2 size={16} />{busy ? 'Eliminando...' : 'Eliminar registro'}</button></div>
    </form>
  </Modal>;
}
