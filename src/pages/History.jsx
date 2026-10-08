import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, Database } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import { Card, PageHeader, StatusBadge } from '../components/ui';
import { fmtDateTime } from '../utils/format';

const PAGE_SIZE = 15;
const FILTERS = ['ALL', 'NORMAL', 'WARNING', 'CRITICAL'];

export default function History() {
  const { readings, backend } = useMotor();
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...readings]
      .reverse()
      .filter((r) => filter === 'ALL' || r.status === filter)
      .filter((r) => {
        if (!q) return true;
        const hay = `${fmtDateTime(r.timestamp)} ${r.temperature} ${r.vibration} ${r.current} ${r.voltage} ${r.rpm} ${r.load} ${r.health} ${r.status} ${r.mode}`.toLowerCase();
        return hay.includes(q);
      });
  }, [readings, filter, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const visible = rows.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);
  const count = (s) => (s === 'ALL' ? readings.length : readings.filter((r) => r.status === s).length);

  const exportCsv = () => {
    const head = ['Timestamp', 'Temperature (C)', 'Vibration (mm/s)', 'Current (A)', 'Voltage (V)', 'RPM', 'Load (%)', 'Health (%)', 'Status', 'Source'];
    const body = rows.map((r) => [r.timestamp, r.temperature, r.vibration, r.current, r.voltage, r.rpm, r.load, r.health, r.status, r.source].join(','));
    const blob = new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `motorguard-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader
        title="Monitoring History"
        subtitle={`${readings.length} readings stored · Storage: ${backend}`}
        actions={<button className="btn btn-primary" onClick={exportCsv} disabled={!rows.length}><Download size={16} /> Export CSV</button>}
      />

      <Card bodyClass="p-0">
        <div className="flex flex-col gap-3 border-b border-ink-700 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(0); }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wider transition ${
                  filter === f
                    ? f === 'CRITICAL' ? 'border-crit/60 bg-crit/15 text-crit' : f === 'WARNING' ? 'border-warn/60 bg-warn/15 text-warn' : f === 'NORMAL' ? 'border-ok/60 bg-ok/15 text-ok' : 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-ink-700 bg-ink-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f} <span className="ml-1 opacity-70">{count(f)}</span>
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input !pl-9 !font-sans" placeholder="Search time, value, status…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-ink-850/70 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Timestamp', 'Temperature', 'Vibration', 'Current', 'Voltage', 'RPM', 'Load', 'Health', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/60 font-mono">
              {visible.map((r) => (
                <tr key={r.id} className={`transition hover:bg-ink-800/60 ${r.status === 'CRITICAL' ? 'bg-crit/[0.05]' : r.status === 'WARNING' ? 'bg-warn/[0.04]' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-300">{fmtDateTime(r.timestamp)}</td>
                  <td className="px-4 py-2.5 text-slate-200">{r.temperature.toFixed(1)} °C</td>
                  <td className="px-4 py-2.5 text-slate-200">{r.vibration.toFixed(2)} mm/s</td>
                  <td className="px-4 py-2.5 text-slate-200">{r.current.toFixed(2)} A</td>
                  <td className="px-4 py-2.5 text-slate-200">{r.voltage} V</td>
                  <td className="px-4 py-2.5 text-slate-200">{r.rpm}</td>
                  <td className="px-4 py-2.5 text-slate-200">{r.load}%</td>
                  <td className="px-4 py-2.5 font-bold text-white">{r.health}%</td>
                  <td className="px-4 py-2.5 font-sans"><StatusBadge level={r.status} size="xs" /></td>
                </tr>
              ))}
              {!visible.length && (
                <tr><td colSpan={9} className="px-4 py-12 text-center font-sans text-slate-500"><Database className="mx-auto mb-2 text-slate-600" />No readings match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-ink-700 px-4 py-3 text-xs text-slate-400">
          <span>Showing {rows.length ? cur * PAGE_SIZE + 1 : 0}–{Math.min(rows.length, (cur + 1) * PAGE_SIZE)} of {rows.length}</span>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost !px-2 !py-1" disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
            <span className="font-mono">{cur + 1} / {pages}</span>
            <button className="btn btn-ghost !px-2 !py-1" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
          </div>
        </div>
      </Card>
    </>
  );
}
