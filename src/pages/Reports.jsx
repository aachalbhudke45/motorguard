import { useMemo, useState } from 'react';
import { BarChart3, FileText, Printer, X, PieChart as PieIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMotor } from '../context/MotorContext';
import TrendChart from '../components/TrendChart';
import { Card, PageHeader } from '../components/ui';
import { avg, fmtDateTime, max, min } from '../utils/format';
import { recommend } from '../utils/healthEngine';
import { APP_NAME, APP_TAGLINE } from '../config/constants';

function useStats(readings, alerts) {
  return useMemo(() => {
    const col = (k) => readings.map((r) => r[k]);
    return {
      count: readings.length,
      from: readings[0]?.timestamp,
      to: readings[readings.length - 1]?.timestamp,
      avgTemp: avg(col('temperature')), maxTemp: max(col('temperature')), minTemp: min(col('temperature')),
      avgVib: avg(col('vibration')), maxVib: max(col('vibration')),
      avgCur: avg(col('current')), maxCur: max(col('current')),
      avgLoad: avg(col('load')),
      avgHealth: avg(col('health')), minHealth: min(col('health')),
      normal: readings.filter((r) => r.status === 'NORMAL').length,
      warnings: readings.filter((r) => r.status === 'WARNING').length,
      criticals: readings.filter((r) => r.status === 'CRITICAL').length,
      alertCount: alerts.filter((a) => a.severity !== 'INFO').length,
    };
  }, [readings, alerts]);
}

export default function Reports() {
  const { readings, alerts, settings, evaluation, current } = useMotor();
  const s = useStats(readings, alerts);
  const [showReport, setShowReport] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);

  const tiles = [
    ['Average Temperature', `${s.avgTemp.toFixed(1)} °C`],
    ['Maximum Temperature', `${s.maxTemp.toFixed(1)} °C`],
    ['Average Vibration', `${s.avgVib.toFixed(2)} mm/s`],
    ['Maximum Vibration', `${s.maxVib.toFixed(2)} mm/s`],
    ['Average Current', `${s.avgCur.toFixed(2)} A`],
    ['Average Health', `${s.avgHealth.toFixed(1)} %`],
    ['Number of Warnings', s.warnings, 'text-warn'],
    ['Critical Events', s.criticals, 'text-crit'],
  ];

  const t = settings.thresholds;
  const barData = [
    { name: 'Temp (°C)', Average: +s.avgTemp.toFixed(1), Maximum: +s.maxTemp.toFixed(1), Limit: t.temperature.critical },
    { name: 'Vib (mm/s ×10)', Average: +(s.avgVib * 10).toFixed(1), Maximum: +(s.maxVib * 10).toFixed(1), Limit: t.vibration.critical * 10 },
    { name: 'Current (A ×10)', Average: +(s.avgCur * 10).toFixed(1), Maximum: +(s.maxCur * 10).toFixed(1), Limit: t.current.critical * 10 },
    { name: 'Load (%)', Average: +s.avgLoad.toFixed(1), Maximum: max(readings.map((r) => r.load)), Limit: t.load.critical },
  ];
  const pieData = [
    { name: 'Normal', value: s.normal, color: '#22c55e' },
    { name: 'Warning', value: s.warnings, color: '#f59e0b' },
    { name: 'Critical', value: s.criticals, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const generate = () => {
    setGeneratedAt(new Date().toISOString());
    setShowReport(true);
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={`Motor Performance Summary · ${s.count} readings${s.from ? ` · ${fmtDateTime(s.from)} → ${fmtDateTime(s.to)}` : ''}`}
        actions={<button className="btn btn-primary" onClick={generate}><FileText size={16} /> Generate Report</button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([label, value, cls]) => (
          <div key={label} className="card p-4">
            <div className="label">{label}</div>
            <div className={`metric mt-2 text-2xl ${cls || 'text-white'}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card title="Average vs Maximum vs Critical Limit" icon={BarChart3} className="lg:col-span-3" bodyClass="px-2 pb-3 pt-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#1c2a3d" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#28394f' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.06)' }} contentStyle={{ background: '#0b111b', border: '1px solid #28394f', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Average" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Maximum" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Limit" fill="#ef4444" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Status Distribution" icon={PieIcon} className="lg:col-span-2" bodyClass="px-2 pb-3 pt-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3} stroke="#0b111b" strokeWidth={2}>
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0b111b', border: '1px solid #28394f', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <TrendChart readings={readings} dataKey="health" domain={[0, 100]} live={false} height={220} />
      </div>

      {showReport && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm animate-fadein">
          <div className="no-print mx-auto mb-3 flex max-w-3xl justify-end gap-2">
            <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Print / Save as PDF</button>
            <button className="btn btn-ghost" onClick={() => setShowReport(false)}><X size={16} /> Close</button>
          </div>
          <article id="print-report" className="mx-auto max-w-3xl rounded-lg bg-white p-8 text-slate-800 shadow-2xl sm:p-10">
            <header className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
              <div>
                <div className="text-2xl font-extrabold tracking-[0.2em] text-slate-900">{APP_NAME}</div>
                <div className="text-xs text-slate-500">{APP_TAGLINE}</div>
              </div>
              <div className="text-right text-xs text-slate-600">
                <div className="font-bold text-slate-900">MOTOR PERFORMANCE REPORT</div>
                <div>Generated: {fmtDateTime(generatedAt)}</div>
              </div>
            </header>

            <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div><b>Motor:</b> {settings.motorName}</div>
              <div><b>Location:</b> {settings.motorLocation}</div>
              <div><b>Rated power:</b> {settings.ratedPower}</div>
              <div><b>Readings analysed:</b> {s.count}</div>
              <div className="col-span-2"><b>Period:</b> {fmtDateTime(s.from)} → {fmtDateTime(s.to)}</div>
              <div className="col-span-2"><b>Data source:</b> Simulated sensor data (hardware integration pending)</div>
            </section>

            <h3 className="mt-6 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wider">Current Condition</h3>
            <table className="mt-2 w-full text-sm">
              <tbody>
                <tr><td className="py-1 text-slate-500">Motor status</td><td className="py-1 font-bold">{current.status}</td><td className="py-1 text-slate-500">Health score</td><td className="py-1 font-bold">{current.health}% ({current.healthLabel})</td></tr>
                <tr><td className="py-1 text-slate-500">Maintenance risk</td><td className="py-1 font-bold">{evaluation.risk}</td><td className="py-1 text-slate-500">Condition</td><td className="py-1 font-bold">{evaluation.condition}</td></tr>
                <tr><td className="py-1 text-slate-500">Temperature</td><td className="py-1">{current.temperature} °C</td><td className="py-1 text-slate-500">Vibration</td><td className="py-1">{current.vibration} mm/s</td></tr>
                <tr><td className="py-1 text-slate-500">Current</td><td className="py-1">{current.current} A</td><td className="py-1 text-slate-500">Voltage / RPM</td><td className="py-1">{current.voltage} V / {current.rpm}</td></tr>
              </tbody>
            </table>

            <h3 className="mt-6 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wider">Performance Summary</h3>
            <table className="mt-2 w-full border-collapse text-sm">
              <thead><tr className="bg-slate-100 text-left"><th className="border border-slate-300 px-3 py-1.5">Metric</th><th className="border border-slate-300 px-3 py-1.5">Value</th><th className="border border-slate-300 px-3 py-1.5">Critical limit</th></tr></thead>
              <tbody>
                {[
                  ['Average Temperature', `${s.avgTemp.toFixed(1)} °C`, `${t.temperature.critical} °C`],
                  ['Maximum Temperature', `${s.maxTemp.toFixed(1)} °C`, `${t.temperature.critical} °C`],
                  ['Average Vibration', `${s.avgVib.toFixed(2)} mm/s`, `${t.vibration.critical} mm/s`],
                  ['Maximum Vibration', `${s.maxVib.toFixed(2)} mm/s`, `${t.vibration.critical} mm/s`],
                  ['Average Current', `${s.avgCur.toFixed(2)} A`, `${t.current.critical} A`],
                  ['Average Health', `${s.avgHealth.toFixed(1)} %`, '55 %'],
                  ['Minimum Health', `${s.minHealth} %`, '55 %'],
                  ['Number of Warnings', s.warnings, '—'],
                  ['Number of Critical Events', s.criticals, '—'],
                  ['Alerts Raised', s.alertCount, '—'],
                ].map(([a, b, c]) => (
                  <tr key={a}><td className="border border-slate-300 px-3 py-1.5">{a}</td><td className="border border-slate-300 px-3 py-1.5 font-mono font-semibold">{b}</td><td className="border border-slate-300 px-3 py-1.5 font-mono text-slate-500">{c}</td></tr>
                ))}
              </tbody>
            </table>

            <h3 className="mt-6 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wider">Recommendation</h3>
            <p className="mt-2 text-sm">{recommend(evaluation)}</p>

            <footer className="mt-8 flex justify-between border-t border-slate-300 pt-3 text-[11px] text-slate-500">
              <span>Software prototype: 90% functional · Hardware sensor integration: pending</span>
              <span>{APP_NAME} © {new Date().getFullYear()}</span>
            </footer>
          </article>
        </div>
      )}
    </>
  );
}
