import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm animate-fadein" onClick={onCancel}>
      <div className="card w-full max-w-md p-6 animate-slidein" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-start gap-4">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${danger ? 'bg-crit/15 text-crit' : 'bg-accent/15 text-accent'}`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-400">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
