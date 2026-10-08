import { Card, StatusBadge, Trend } from './ui';

/** KPI tile used on Dashboard and Live Monitoring. */
export default function MetricCard({ icon: Icon, label, value, unit, decimals = 1, level, range, previous, accent = '#22d3ee', children }) {
  const glow = level === 'CRITICAL' ? 'border-crit/60 alert-flash' : level === 'WARNING' ? 'border-warn/50' : '';
  return (
    <Card className={`relative overflow-hidden transition-colors ${glow}`} bodyClass="p-4">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${accent}18`, color: accent }}>
              <Icon size={17} />
            </div>
          )}
          <span className="label">{label}</span>
        </div>
        {level && <StatusBadge level={level} size="xs" />}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="metric text-3xl text-white">{typeof value === 'number' ? value.toFixed(decimals) : value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        {range ? <span className="text-slate-500">Safe: <span className="font-mono text-slate-400">{range}</span></span> : <span />}
        {previous !== undefined && typeof value === 'number' && <Trend current={value} previous={previous} decimals={decimals} />}
      </div>
      {children}
    </Card>
  );
}
