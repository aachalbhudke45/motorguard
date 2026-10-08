import { useEffect, useState } from 'react';
import { AlertOctagon, AlertTriangle, BellOff, CheckCircle2, Trash2, X } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import { Card, PageHeader } from '../components/ui';
import ConfirmModal from '../components/ConfirmModal';
import { fmtDateTime } from '../utils/format';

const SEV = {
  CRITICAL: { icon: AlertOctagon, label: '🔴 CRITICAL', cls: 'border-crit/50 bg-crit/[0.07]', text: 'text-crit' },
  WARNING: { icon: AlertTriangle, label: '🟡 WARNING', cls: 'border-warn/40 bg-warn/[0.06]', text: 'text-warn' },
  INFO: { icon: CheckCircle2, label: '🟢 INFORMATION', cls: 'border-ok/30 bg-ok/[0.05]', text: 'text-ok' },
};

export default function Alerts() {
  const { alerts, clearAlert, clearAllAlerts, markAllRead } = useMotor();
  const [filter, setFilter] = useState('ALL');
  const [confirm, setConfirm] = useState(false);

  // Opening the Alert Center marks everything as read.
  useEffect(() => {
    const t = setTimeout(markAllRead, 1500);
    return () => clearTimeout(t);
  }, [alerts.length, markAllRead]);

  const counts = {
    ALL: alerts.length,
    CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL').length,
    WARNING: alerts.filter((a) => a.severity === 'WARNING').length,
    INFO: alerts.filter((a) => a.severity === 'INFO').length,
  };
  const list = filter === 'ALL' ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <>
      <PageHeader
        title="Alert Center"
        subtitle="Alerts are generated automatically when sensor values cross the configured thresholds."
        actions={
          <button className="btn btn-ghost" disabled={!alerts.length} onClick={() => setConfirm(true)}>
            <Trash2 size={16} /> Clear All Alerts
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`card p-4 text-left transition ${filter === k ? 'ring-2 ring-accent/50' : 'hover:border-ink-600'}`}
          >
            <div className="label">{k === 'ALL' ? 'Active Alerts' : k === 'INFO' ? 'Information' : k}</div>
            <div className={`metric mt-1 text-3xl ${k === 'CRITICAL' ? 'text-crit' : k === 'WARNING' ? 'text-warn' : k === 'INFO' ? 'text-ok' : 'text-white'}`}>{counts[k]}</div>
          </button>
        ))}
      </div>

      <Card bodyClass="p-3 sm:p-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <BellOff size={38} className="text-slate-600" />
            <p className="mt-3 font-semibold text-slate-300">No {filter === 'ALL' ? '' : filter.toLowerCase() + ' '}alerts</p>
            <p className="mt-1 text-sm text-slate-500">Use “Simulate Fault” on the Dashboard to trigger a critical alert.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((a) => {
              const s = SEV[a.severity] || SEV.INFO;
              const Icon = s.icon;
              return (
                <li key={a.id} className={`animate-slidein rounded-xl border p-4 ${s.cls} ${a.summary && !a.read ? 'alert-flash' : ''}`}>
                  <div className="flex items-start gap-3">
                    <Icon size={22} className={`mt-0.5 shrink-0 ${s.text}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className={`text-xs font-extrabold tracking-widest ${s.text}`}>{s.label}</span>
                        {!a.read && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">NEW</span>}
                      </div>
                      <div className="mt-1 font-semibold text-white">{a.title}</div>
                      <p className="mt-0.5 text-sm text-slate-300">{a.message}</p>
                      <dl className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                        <div><dt className="inline text-slate-500">Sensor: </dt><dd className="inline text-slate-300">{a.sensor}</dd></div>
                        <div><dt className="inline text-slate-500">Value: </dt><dd className="inline font-mono text-slate-200">{a.value}</dd></div>
                        <div><dt className="inline text-slate-500">Time: </dt><dd className="inline font-mono text-slate-300">{fmtDateTime(a.timestamp)}</dd></div>
                      </dl>
                    </div>
                    <button className="btn btn-ghost !px-2.5 !py-1.5 text-xs" onClick={() => clearAlert(a.id)} title="Clear alert">
                      <X size={14} /> <span className="hidden sm:inline">Clear Alert</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ConfirmModal
        open={confirm}
        title="Clear all alerts?"
        message="All alerts will be removed from the Alert Center. Sensor history is not affected."
        confirmLabel="Clear all"
        onCancel={() => setConfirm(false)}
        onConfirm={() => { clearAllAlerts(); setConfirm(false); }}
      />
    </>
  );
}
