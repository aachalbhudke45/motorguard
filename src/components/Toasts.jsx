import { AlertOctagon, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import { fmtTime } from '../utils/format';

const STYLE = {
  CRITICAL: { icon: AlertOctagon, cls: 'border-crit/60 bg-[#1d0d10] alert-flash', text: 'text-crit' },
  WARNING: { icon: AlertTriangle, cls: 'border-warn/60 bg-[#1d160a]', text: 'text-warn' },
  INFO: { icon: CheckCircle2, cls: 'border-ok/50 bg-[#0b1a12]', text: 'text-ok' },
};

export default function Toasts({ onNavigate }) {
  const { toasts, dismissToast } = useMotor();
  return (
    <div className="no-print fixed right-4 top-20 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {toasts.map((t) => {
        const s = STYLE[t.severity] || STYLE.INFO;
        const Icon = s.icon;
        return (
          <div key={t.toastId} className={`animate-slidein rounded-xl border p-4 shadow-2xl ${s.cls}`} role="alert">
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 shrink-0 ${s.text}`} size={22} />
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-extrabold tracking-widest ${s.text}`}>
                  {t.severity === 'CRITICAL' ? '🚨 CRITICAL ALERT' : t.severity === 'WARNING' ? 'WARNING' : 'INFORMATION'}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">{t.title}</div>
                <p className="mt-1 text-sm text-slate-300">{t.message}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">{fmtTime(t.timestamp)}</span>
                  <button className="font-semibold text-accent hover:underline" onClick={() => { onNavigate('alerts'); dismissToast(t.toastId); }}>
                    View in Alert Center →
                  </button>
                </div>
              </div>
              <button onClick={() => dismissToast(t.toastId)} className="text-slate-500 hover:text-white" aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
