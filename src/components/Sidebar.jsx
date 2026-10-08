import { Activity, BarChart3, Bell, FileText, Gauge, HeartPulse, History, LayoutDashboard, Settings, Wrench, X } from 'lucide-react';
import { APP_NAME, NAV_ITEMS } from '../config/constants';
import { useMotor } from '../context/MotorContext';
import { StatusDot } from './ui';

const ICONS = {
  dashboard: LayoutDashboard,
  live: Activity,
  health: HeartPulse,
  maintenance: Wrench,
  alerts: Bell,
  history: History,
  reports: FileText,
  settings: Settings,
};

export default function Sidebar({ active, onNavigate, mobileOpen, onClose }) {
  const { unreadCount, current, settings } = useMotor();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-700 bg-ink-900/95 backdrop-blur transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 border-b border-ink-700 px-5 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-accent/40 bg-accent/10">
            <Gauge size={22} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-extrabold tracking-[0.18em] text-white">{APP_NAME}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Motor Health System</div>
          </div>
          <button className="text-slate-400 hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="label px-3 pb-2 pt-1">Navigation</div>
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.id];
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-accent/10 text-white ring-1 ring-accent/30' : 'text-slate-400 hover:bg-ink-800 hover:text-slate-100'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-accent' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'alerts' && unreadCount > 0 && (
                  <span className="rounded-full bg-crit px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="m-3 rounded-lg border border-ink-700 bg-ink-850 p-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-slate-500" />
            <span className="truncate text-xs font-semibold text-slate-300">{settings.motorName}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Status</span>
            <span className="flex items-center gap-1.5 font-bold">
              <StatusDot level={current.status} pulse={current.status !== 'NORMAL'} />
              <span className={current.status === 'NORMAL' ? 'text-ok' : current.status === 'WARNING' ? 'text-warn' : 'text-crit'}>{current.status}</span>
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">Data source</span>
            <span className="font-semibold text-warn">Simulated</span>
          </div>
        </div>
      </aside>
    </>
  );
}
