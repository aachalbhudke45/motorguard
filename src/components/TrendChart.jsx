import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_POINTS, PARAMETERS } from '../config/constants';
import { fmtTime } from '../utils/format';
import { Card, LiveIndicator } from './ui';

function ChartTooltip({ active, payload, unit, decimals }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const color = p.status === 'CRITICAL' ? 'text-crit' : p.status === 'WARNING' ? 'text-warn' : 'text-ok';
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="font-mono text-slate-400">{fmtTime(p.timestamp)}</div>
      <div className="mt-0.5 font-mono text-sm font-bold text-white">
        {Number(payload[0].value).toFixed(decimals)} {unit}
      </div>
      <div className={`font-bold ${color}`}>{p.status}</div>
    </div>
  );
}

/** Live trend chart for one parameter – shows the latest 20 readings. */
export default function TrendChart({ readings, dataKey, thresholds, height = 220, icon, live = true, domain }) {
  const meta = PARAMETERS[dataKey];
  const data = readings.slice(-CHART_POINTS).map((r) => ({ ...r, t: fmtTime(r.timestamp) }));
  const gid = `g-${dataKey}`;
  const latest = data[data.length - 1]?.[dataKey];

  return (
    <Card
      title={`${meta.label} Trend`}
      icon={icon}
      right={
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-white">
            {latest != null ? Number(latest).toFixed(meta.decimals) : '–'} <span className="text-xs text-slate-400">{meta.unit}</span>
          </span>
          {live && <LiveIndicator />}
        </div>
      }
      bodyClass="px-2 pb-3 pt-4"
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 14, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1c2a3d" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#28394f' }} minTickGap={28} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} domain={domain || ['auto', 'auto']} width={44} />
            <Tooltip content={<ChartTooltip unit={meta.unit} decimals={meta.decimals} />} cursor={{ stroke: '#475569', strokeDasharray: '3 3' }} />
            {thresholds && (
              <ReferenceLine y={thresholds.warning} stroke="#f59e0b" strokeDasharray="5 4" strokeOpacity={0.7}
                label={{ value: 'WARN', position: 'insideTopRight', fill: '#f59e0b', fontSize: 9 }} />
            )}
            {thresholds && (
              <ReferenceLine y={thresholds.critical} stroke="#ef4444" strokeDasharray="5 4" strokeOpacity={0.8}
                label={{ value: 'CRIT', position: 'insideTopRight', fill: '#ef4444', fontSize: 9 }} />
            )}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={meta.color}
              strokeWidth={2.2}
              fill={`url(#${gid})`}
              isAnimationActive
              animationDuration={500}
              dot={(props) => {
                const { cx, cy, payload, index } = props;
                const c = payload.status === 'CRITICAL' ? '#ef4444' : payload.status === 'WARNING' ? '#f59e0b' : null;
                if (!c && index !== data.length - 1) return <g key={index} />;
                return <circle key={index} cx={cx} cy={cy} r={c ? 4 : 3.5} fill={c || meta.color} stroke="#0b111b" strokeWidth={1.5} />;
              }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
