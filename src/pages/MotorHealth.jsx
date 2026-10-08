import { HeartPulse, Info, Thermometer, Waves, Weight, Zap, Scale } from 'lucide-react';
import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useMotor } from '../context/MotorContext';
import HealthGauge from '../components/HealthGauge';
import TrendChart from '../components/TrendChart';
import { Card, PageHeader, ProgressBar, StatusBadge } from '../components/ui';
import { explain, healthLabel } from '../utils/healthEngine';
import { levelHex } from '../utils/format';

const ITEMS = [
  { key: 'temperature', label: 'Temperature Health', icon: Thermometer, unit: '°C', dec: 1, weight: 30 },
  { key: 'vibration', label: 'Vibration Health', icon: Waves, unit: 'mm/s', dec: 2, weight: 30 },
  { key: 'current', label: 'Current Health', icon: Zap, unit: 'A', dec: 2, weight: 20 },
  { key: 'load', label: 'Load Health', icon: Weight, unit: '%', dec: 0, weight: 20 },
];

export default function MotorHealth() {
  const { current, evaluation, readings, settings } = useMotor();
  const p = evaluation.params;
  const t = settings.thresholds;
  const message = explain(evaluation);
  const normal = evaluation.status === 'NORMAL';

  return (
    <>
      <PageHeader title="Motor Health" subtitle="Rule-based health engine combining temperature, vibration, current and load." />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card title="Overall Health" icon={HeartPulse} className="lg:col-span-2">
          <HealthGauge value={current.health} label={current.healthLabel} size={250} stroke={18} />
          <div className="mt-2 flex justify-center"><StatusBadge level={current.status} label={`Motor ${current.status}`} /></div>
          <div className={`mt-5 flex gap-3 rounded-lg border p-3.5 text-sm ${normal ? 'border-ok/30 bg-ok/5 text-slate-200' : evaluation.status === 'CRITICAL' ? 'border-crit/40 bg-crit/10 text-slate-100' : 'border-warn/40 bg-warn/10 text-slate-100'}`}>
            <Info size={18} className={`shrink-0 ${normal ? 'text-ok' : evaluation.status === 'CRITICAL' ? 'text-crit' : 'text-warn'}`} />
            <p>{message}</p>
          </div>
        </Card>

        <Card title="Individual Health Indicators" icon={Scale} className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {ITEMS.map((it) => {
              const h = p[it.key].health;
              const lbl = healthLabel(h);
              const Icon = it.icon;
              return (
                <div key={it.key} className="rounded-lg border border-ink-700 bg-ink-850 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Icon size={16} className="text-accent" />{it.label}</span>
                    <StatusBadge level={p[it.key].level} size="xs" />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-20 w-20 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ v: h }]} startAngle={90} endAngle={-270}>
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar dataKey="v" cornerRadius={8} fill={levelHex(lbl)} background={{ fill: '#1c2a3d' }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <div className="metric text-2xl text-white">{h}%</div>
                      <div className="text-xs text-slate-400">
                        Reading <span className="font-mono text-slate-200">{Number(current[it.key]).toFixed(it.dec)} {it.unit}</span>
                      </div>
                      <div className="text-xs text-slate-500">Weight in score: {it.weight}%</div>
                    </div>
                  </div>
                  <ProgressBar className="mt-3" value={h} level={lbl} />
                  <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500">
                    <span>Warn ≥ {t[it.key].warning}</span><span>Crit &gt; {t[it.key].critical}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart readings={readings} dataKey="health" icon={HeartPulse} domain={[0, 100]} height={260} />
        </div>
        <Card title="How the score is calculated" icon={Info}>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <li>Each parameter gets a sub-score from 0–100 based on its thresholds:</li>
            <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ok" /> Below warning → 100 to 87</li>
            <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warn" /> Warning band → 87 to 60</li>
            <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-crit" /> Above critical → 60 down to 5</li>
            <li>Weighted average: Temperature 30%, Vibration 30%, Current 20%, Load 20%. Voltage/RPM deviations subtract a small penalty.</li>
            <li className="rounded-md bg-ink-850 p-2.5 font-mono text-xs">≥ 80% OPTIMAL · 55–79% WARNING · &lt; 55% CRITICAL</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
