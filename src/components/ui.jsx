import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

const BADGE = {
  NORMAL: 'bg-ok/10 text-ok border-ok/40',
  OPTIMAL: 'bg-ok/10 text-ok border-ok/40',
  LOW: 'bg-ok/10 text-ok border-ok/40',
  INFO: 'bg-ok/10 text-ok border-ok/40',
  ONLINE: 'bg-ok/10 text-ok border-ok/40',
  WARNING: 'bg-warn/10 text-warn border-warn/40',
  MEDIUM: 'bg-warn/10 text-warn border-warn/40',
  PENDING: 'bg-warn/10 text-warn border-warn/40',
  CRITICAL: 'bg-crit/10 text-crit border-crit/50',
  HIGH: 'bg-crit/10 text-crit border-crit/50',
};

const DOT = {
  NORMAL: 'bg-ok shadow-glowok', OPTIMAL: 'bg-ok shadow-glowok', LOW: 'bg-ok shadow-glowok', INFO: 'bg-ok shadow-glowok', ONLINE: 'bg-ok shadow-glowok',
  WARNING: 'bg-warn shadow-glowwarn', MEDIUM: 'bg-warn shadow-glowwarn', PENDING: 'bg-warn shadow-glowwarn',
  CRITICAL: 'bg-crit shadow-glowcrit', HIGH: 'bg-crit shadow-glowcrit',
};

export function StatusDot({ level, pulse = false, className = '' }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[level] || 'bg-slate-500'} ${pulse ? 'dot-live' : ''} ${className}`} />;
}

export function StatusBadge({ level, label, size = 'sm', pulse }) {
  const sz = size === 'lg' ? 'px-3 py-1.5 text-sm' : size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold tracking-wider ${sz} ${BADGE[level] || 'border-ink-600 text-slate-300'}`}>
      <StatusDot level={level} pulse={pulse ?? level === 'CRITICAL'} className={size === 'xs' ? '!h-1.5 !w-1.5' : ''} />
      {label || level}
    </span>
  );
}

export function LiveIndicator({ active = true, label = 'LIVE' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-widest ${active ? 'border-crit/40 bg-crit/10 text-red-400' : 'border-ink-600 text-slate-500'}`}>
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-crit dot-live' : 'bg-slate-600'}`} />
      {label}
    </span>
  );
}

export function Card({ title, icon: Icon, right, children, className = '', bodyClass = 'card-pad' }) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-ink-700/70 px-4 py-3 sm:px-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            {Icon && <Icon size={16} className="text-accent" />}
            {title}
          </h3>
          {right}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Trend({ current, previous, decimals = 1, unit = '' }) {
  if (previous == null) return <span className="text-xs text-slate-500">—</span>;
  const diff = current - previous;
  const flat = Math.abs(diff) < 10 ** -decimals / 2 + 1e-9;
  const Icon = flat ? ArrowRight : diff > 0 ? ArrowUpRight : ArrowDownRight;
  const color = flat ? 'text-slate-400' : diff > 0 ? 'text-orange-300' : 'text-sky-300';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon size={14} />
      {flat ? 'Stable' : `${diff > 0 ? '+' : ''}${diff.toFixed(decimals)}${unit}`}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ value, level, className = '' }) {
  const color = level === 'CRITICAL' ? 'bg-crit' : level === 'WARNING' ? 'bg-warn' : 'bg-ok';
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-ink-700 ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2.5 select-none">
      <span className="relative">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-11 rounded-full border border-ink-600 bg-ink-800 transition peer-checked:border-ok/60 peer-checked:bg-ok/25 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-slate-400 transition peer-checked:translate-x-5 peer-checked:bg-ok" />
      </span>
      {label && <span className="text-sm font-medium text-slate-200">{label}</span>}
    </label>
  );
}
