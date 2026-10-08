import { useEffect, useState } from 'react';
import { Bell, Clock, Menu, Wifi } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import { fmtTime } from '../utils/format';
import { LiveIndicator, StatusBadge, Toggle } from './ui';

export default function Topbar({ title, onMenu, onNavigate }) {
  const { demoMode, setDemoMode, unreadCount, lastUpdated, current } = useMotor();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="no-print sticky top-0 z-20 border-b border-ink-700 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6">
        <button className="btn btn-ghost !px-2 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{title}</div>
          <div className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
            <Clock size={12} /> Last updated: <span className="font-mono text-slate-300">{fmtTime(lastUpdated)}</span>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <StatusBadge level={current.status} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/5 px-2.5 py-1 text-xs font-bold text-ok">
            <Wifi size={12} /> ONLINE
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5">
          <Toggle id="demo-top" checked={demoMode} onChange={setDemoMode} />
          <span className="hidden text-xs font-bold tracking-wider text-slate-300 sm:inline">DEMO MODE</span>
          {demoMode && <LiveIndicator />}
        </div>

        <div className="hidden font-mono text-sm text-slate-300 xl:block">{fmtTime(now.toISOString())}</div>

        <button className="relative rounded-lg border border-ink-700 bg-ink-900 p-2 text-slate-300 hover:text-white" onClick={() => onNavigate('alerts')} aria-label="Alerts">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-crit px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
