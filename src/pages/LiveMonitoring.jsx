import { Activity, Gauge, HeartPulse, RotateCw, Thermometer, Waves, Weight, Zap, Radio } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import ControlBar from '../components/ControlBar';
import TrendChart from '../components/TrendChart';
import { Card, LiveIndicator, PageHeader, ProgressBar, StatusBadge, Trend } from '../components/ui';
import { fmtTime } from '../utils/format';

export default function LiveMonitoring() {
  const { current, previous, evaluation, readings, settings, demoMode, lastUpdated } = useMotor();
  const t = settings.thresholds;
  const p = evaluation.params;
  const prevHealth = readings.length > 1 ? readings[readings.length - 2].health : null;

  const rows = [
    { key: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°C', dec: 1, range: `< ${t.temperature.warning} °C`, max: t.temperature.critical * 1.25, color: '#f97316' },
    { key: 'vibration', label: 'Vibration', icon: Waves, unit: 'mm/s', dec: 2, range: `< ${t.vibration.warning} mm/s`, max: t.vibration.critical * 1.4, color: '#a78bfa' },
    { key: 'current', label: 'Current', icon: Zap, unit: 'A', dec: 2, range: `< ${t.current.warning} A`, max: t.current.critical * 1.35, color: '#22d3ee' },
    { key: 'voltage', label: 'Voltage', icon: Gauge, unit: 'V', dec: 0, range: '210 – 250 V', max: 280, color: '#60a5fa' },
    { key: 'rpm', label: 'Speed', icon: RotateCw, unit: 'RPM', dec: 0, range: '1380 – 1500 RPM', max: 1600, color: '#34d399' },
    { key: 'load', label: 'Motor Load', icon: Weight, unit: '%', dec: 0, range: `< ${t.load.warning} %`, max: 100, color: '#f472b6' },
  ];

  return (
    <>
      <PageHeader
        title="Live Monitoring"
        subtitle="Real-time parameter values, safe operating ranges and short-term trends."
        actions={
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <LiveIndicator active={demoMode} label={demoMode ? 'LIVE' : 'MANUAL'} />
            <span className="flex items-center gap-1"><Radio size={13} /> Source: <b className="text-warn">Simulated sensors</b></span>
            <span>Updated <span className="font-mono text-slate-200">{fmtTime(lastUpdated)}</span></span>
          </div>
        }
      />
      <ControlBar />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((r) => {
          const Icon = r.icon;
          const level = p[r.key].level;
          return (
            <Card key={r.key} bodyClass="p-4" className={level === 'CRITICAL' ? 'border-crit/60' : level === 'WARNING' ? 'border-warn/50' : ''}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Icon size={16} style={{ color: r.color }} /> {r.label}
                </span>
                <StatusBadge level={level} size="xs" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="metric text-3xl text-white">
                  {Number(current[r.key]).toFixed(r.dec)} <span className="text-sm font-medium text-slate-400">{r.unit}</span>
                </span>
                <Trend current={current[r.key]} previous={previous?.[r.key]} decimals={r.dec} />
              </div>
              <ProgressBar className="mt-3" value={(current[r.key] / r.max) * 100} level={level} />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Safe range</span>
                <span className="font-mono text-slate-400">{r.range}</span>
              </div>
            </Card>
          );
        })}

        <Card bodyClass="p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><HeartPulse size={16} className="text-ok" /> Motor Health</span>
            <StatusBadge level={current.healthLabel} size="xs" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="metric text-3xl text-white">{current.health}<span className="text-sm text-slate-400"> %</span></span>
            <Trend current={current.health} previous={prevHealth} decimals={0} unit="%" />
          </div>
          <ProgressBar className="mt-3" value={current.health} level={current.healthLabel} />
          <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Safe range</span><span className="font-mono text-slate-400">≥ 80 %</span></div>
        </Card>

        <Card bodyClass="p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Activity size={16} className="text-accent" /> Motor Status</span>
            <LiveIndicator active={demoMode} />
          </div>
          <div className="mt-4"><StatusBadge level={current.status} size="lg" /></div>
          <p className="mt-3 text-xs text-slate-400">
            Risk: <b className="text-slate-200">{evaluation.risk}</b> · {evaluation.criticalCount} critical, {evaluation.warningCount} warning parameter(s)
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TrendChart readings={readings} dataKey="temperature" thresholds={t.temperature} icon={Thermometer} />
        <TrendChart readings={readings} dataKey="vibration" thresholds={t.vibration} icon={Waves} />
        <TrendChart readings={readings} dataKey="current" thresholds={t.current} icon={Zap} />
        <TrendChart readings={readings} dataKey="health" icon={HeartPulse} domain={[0, 100]} />
      </div>
    </>
  );
}
