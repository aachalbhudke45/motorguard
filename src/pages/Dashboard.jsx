import { Activity, AlertTriangle, Gauge, HeartPulse, ShieldAlert, Thermometer, Waves, Wifi, Zap, Clock, Bell } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import ControlBar from '../components/ControlBar';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';
import ProjectStatus from '../components/ProjectStatus';
import HealthGauge from '../components/HealthGauge';
import { Card, PageHeader, StatusBadge, StatusDot } from '../components/ui';
import { recommend } from '../utils/healthEngine';
import { fmtDateTime, fmtTime, levelColor } from '../utils/format';

export default function Dashboard({ onNavigate }) {
  const { current, previous, evaluation, readings, settings, lastUpdated, alerts } = useMotor();
  const t = settings.thresholds;
  const p = evaluation.params;
  const recent = alerts.slice(0, 4);
  const banner = current.status !== 'NORMAL';

  return (
    <>
      <PageHeader
        title="Motor Overview"
        subtitle={`${settings.motorName} · ${settings.motorLocation}`}
        actions={
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={13} /> Last Updated: <span className="font-mono text-slate-200">{fmtDateTime(lastUpdated)}</span>
          </span>
        }
      />

      <ControlBar />

      {banner && (
        <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 animate-slidein ${current.status === 'CRITICAL' ? 'alert-flash border-crit/60 bg-crit/10' : 'border-warn/50 bg-warn/10'}`}>
          <AlertTriangle className={current.status === 'CRITICAL' ? 'text-crit' : 'text-warn'} size={22} />
          <div className="flex-1">
            <div className={`text-sm font-extrabold tracking-widest ${current.status === 'CRITICAL' ? 'text-crit' : 'text-warn'}`}>
              {current.status === 'CRITICAL' ? '🔴 CRITICAL' : '🟡 WARNING'}
            </div>
            <p className="mt-0.5 text-sm text-slate-200">{recommend(evaluation)}</p>
          </div>
          <button className="btn btn-ghost !py-1.5 text-xs" onClick={() => onNavigate('maintenance')}>View action plan</button>
        </div>
      )}

      {/* Status strip */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatusTile label="Motor Status" icon={Activity}>
          <span className={`flex items-center gap-2 text-2xl font-extrabold ${levelColor(current.status)}`}>
            <StatusDot level={current.status} pulse className="!h-3.5 !w-3.5" /> {current.status}
          </span>
        </StatusTile>
        <StatusTile label="Motor Health" icon={HeartPulse}>
          <span className={`metric text-3xl ${levelColor(current.healthLabel)}`}>{current.health}%</span>
          <span className="ml-2 text-xs font-bold text-slate-400">{current.healthLabel}</span>
        </StatusTile>
        <StatusTile label="Maintenance Risk" icon={ShieldAlert}>
          <StatusBadge level={evaluation.risk} size="lg" />
        </StatusTile>
        <StatusTile label="System" icon={Wifi}>
          <span className="flex items-center gap-2 text-2xl font-extrabold text-ok">
            <StatusDot level="ONLINE" className="!h-3.5 !w-3.5" /> ONLINE
          </span>
        </StatusTile>
      </div>

      {/* Sensor metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard icon={Thermometer} label="Temperature" value={current.temperature} unit="°C" level={p.temperature.level}
          range={`< ${t.temperature.warning} °C`} previous={previous?.temperature} accent="#f97316" />
        <MetricCard icon={Waves} label="Vibration" value={current.vibration} unit="mm/s" decimals={2} level={p.vibration.level}
          range={`< ${t.vibration.warning} mm/s`} previous={previous?.vibration} accent="#a78bfa" />
        <MetricCard icon={Zap} label="Current" value={current.current} unit="A" decimals={2} level={p.current.level}
          range={`< ${t.current.warning} A`} previous={previous?.current} accent="#22d3ee" />
        <MetricCard icon={Gauge} label="Voltage" value={current.voltage} unit="V" decimals={0} level={p.voltage.level}
          range="210 – 250 V" previous={previous?.voltage} accent="#60a5fa" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
          <TrendChart readings={readings} dataKey="temperature" thresholds={t.temperature} icon={Thermometer} height={190} />
          <TrendChart readings={readings} dataKey="vibration" thresholds={t.vibration} icon={Waves} height={190} />
          <TrendChart readings={readings} dataKey="current" thresholds={t.current} icon={Zap} height={190} />
          <TrendChart readings={readings} dataKey="health" icon={HeartPulse} height={190} domain={[0, 100]} />
        </div>

        <div className="space-y-4">
          <Card title="Overall Health" icon={HeartPulse} right={<button className="text-xs font-semibold text-accent hover:underline" onClick={() => onNavigate('health')}>Details →</button>}>
            <HealthGauge value={current.health} label={current.healthLabel} size={190} stroke={14} />
            <p className="mt-2 text-center text-xs text-slate-400">Condition: <b className="text-slate-200">{evaluation.condition}</b></p>
          </Card>

          <Card title="Recent Alerts" icon={Bell} right={<button className="text-xs font-semibold text-accent hover:underline" onClick={() => onNavigate('alerts')}>All alerts →</button>} bodyClass="p-2">
            {recent.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No active alerts.</p>
            ) : (
              <ul className="divide-y divide-ink-700/70">
                {recent.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5 px-2 py-2.5">
                    <StatusDot level={a.severity} className="mt-1.5" pulse={a.severity === 'CRITICAL'} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-100">{a.title}</div>
                      <div className="truncate text-xs text-slate-400">{a.message}</div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">{fmtTime(a.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <ProjectStatus />
        </div>
      </div>
    </>
  );
}

function StatusTile({ label, icon: Icon, children }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-slate-500" />
        <span className="label">{label}</span>
      </div>
      <div className="mt-3 flex min-h-[40px] items-center">{children}</div>
    </div>
  );
}
