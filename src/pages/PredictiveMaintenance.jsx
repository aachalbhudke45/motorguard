import { CalendarClock, CheckSquare, ClipboardList, ShieldAlert, Square, Stethoscope, Wrench, Lightbulb } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import { Card, PageHeader, StatusBadge } from '../components/ui';
import { actionItems, estimateDaysToMaintenance, recommend } from '../utils/healthEngine';
import { fmtDateTime, levelColor } from '../utils/format';

const CONDITION_LEVEL = { Healthy: 'NORMAL', 'Requires Inspection': 'WARNING', 'Immediate Attention': 'CRITICAL' };

export default function PredictiveMaintenance() {
  const { evaluation, readings, checklist, toggleChecklist, maintenanceLog } = useMotor();
  const days = estimateDaysToMaintenance(evaluation.health);
  const recentHealth = readings.slice(-10).map((r) => r.health);
  const slope = recentHealth.length > 1 ? (recentHealth[recentHealth.length - 1] - recentHealth[0]) / (recentHealth.length - 1) : 0;
  const trendText = slope < -1 ? 'Degrading' : slope > 1 ? 'Improving' : 'Stable';
  const done = checklist.filter((c) => c.done).length;

  return (
    <>
      <PageHeader title="Predictive Maintenance" subtitle="Risk assessment and recommendations generated from live sensor values." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card bodyClass="p-5">
          <div className="label flex items-center gap-2"><ShieldAlert size={14} /> Maintenance Risk</div>
          <div className="mt-4"><StatusBadge level={evaluation.risk} size="lg" /></div>
          <div className="mt-4 flex gap-1.5">
            {['LOW', 'MEDIUM', 'HIGH'].map((r) => (
              <div key={r} className={`h-1.5 flex-1 rounded-full ${r === evaluation.risk ? (r === 'LOW' ? 'bg-ok' : r === 'MEDIUM' ? 'bg-warn' : 'bg-crit') : 'bg-ink-700'}`} />
            ))}
          </div>
        </Card>
        <Card bodyClass="p-5">
          <div className="label flex items-center gap-2"><Stethoscope size={14} /> Motor Condition</div>
          <div className={`mt-4 text-xl font-extrabold ${levelColor(CONDITION_LEVEL[evaluation.condition])}`}>{evaluation.condition}</div>
          <div className="mt-2 text-xs text-slate-400">Health {evaluation.health}% · trend <b className="text-slate-200">{trendText}</b></div>
        </Card>
        <Card bodyClass="p-5">
          <div className="label flex items-center gap-2"><CalendarClock size={14} /> Next Maintenance</div>
          <div className={`metric mt-3 text-3xl ${days === 0 ? 'text-crit' : days < 15 ? 'text-warn' : 'text-white'}`}>
            {days === 0 ? 'NOW' : `${days} days`}
          </div>
          <div className="mt-1 text-xs text-slate-500">Estimated from current health score</div>
        </Card>
        <Card bodyClass="p-5">
          <div className="label flex items-center gap-2"><ClipboardList size={14} /> Checklist Progress</div>
          <div className="metric mt-3 text-3xl text-white">{done}/{checklist.length}</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(done / checklist.length) * 100}%` }} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card title="Recommendation" icon={Lightbulb}>
            <div className={`rounded-lg border p-4 ${evaluation.status === 'CRITICAL' ? 'border-crit/50 bg-crit/10' : evaluation.status === 'WARNING' ? 'border-warn/50 bg-warn/10' : 'border-ok/30 bg-ok/5'}`}>
              <StatusBadge level={evaluation.status} />
              <p className="mt-2.5 text-base font-medium leading-relaxed text-white">“{recommend(evaluation)}”</p>
            </div>
            <div className="label mt-5">Suggested actions</div>
            <ul className="mt-2 space-y-2">
              {actionItems(evaluation).map((a) => (
                <li key={a} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <Wrench size={15} className="mt-0.5 shrink-0 text-accent" /> {a}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Parameter Risk Breakdown" icon={ShieldAlert} bodyClass="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr><th className="px-5 py-3">Parameter</th><th className="px-5 py-3">Value</th><th className="px-5 py-3">Health</th><th className="px-5 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-ink-700/70">
                  {['temperature', 'vibration', 'current', 'load', 'voltage', 'rpm'].map((k) => (
                    <tr key={k}>
                      <td className="px-5 py-2.5 capitalize text-slate-200">{k === 'rpm' ? 'Speed (RPM)' : k}</td>
                      <td className="px-5 py-2.5 font-mono text-slate-300">{evaluation.params[k].value}</td>
                      <td className="px-5 py-2.5 font-mono text-slate-300">{evaluation.params[k].health != null ? `${evaluation.params[k].health}%` : '—'}</td>
                      <td className="px-5 py-2.5"><StatusBadge level={evaluation.params[k].level} size="xs" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card title="Maintenance Checklist" icon={ClipboardList}>
            <ul className="space-y-1">
              {checklist.map((c) => (
                <li key={c.id}>
                  <button onClick={() => toggleChecklist(c.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-ink-800">
                    {c.done ? <CheckSquare size={18} className="text-ok" /> : <Square size={18} className="text-slate-500" />}
                    <span className={c.done ? 'text-slate-200' : 'text-slate-400'}>{c.label}</span>
                    {c.auto && <span className="ml-auto rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">AUTO</span>}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Maintenance Log" icon={CalendarClock} bodyClass="p-2">
            {maintenanceLog.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">Tick a checklist item to record a maintenance entry.</p>
            ) : (
              <ul className="max-h-64 divide-y divide-ink-700/70 overflow-y-auto">
                {maintenanceLog.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="text-slate-300">{m.task} <span className={m.done ? 'text-ok' : 'text-warn'}>{m.done ? 'completed' : 'reopened'}</span></span>
                    <span className="shrink-0 font-mono text-[11px] text-slate-500">{fmtDateTime(m.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
