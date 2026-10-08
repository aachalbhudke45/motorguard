export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

export const fmtShortTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

export const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
export const max = (arr) => (arr.length ? Math.max(...arr) : 0);
export const min = (arr) => (arr.length ? Math.min(...arr) : 0);

export const levelColor = (level) =>
  ({ NORMAL: 'text-ok', OPTIMAL: 'text-ok', LOW: 'text-ok', WARNING: 'text-warn', MEDIUM: 'text-warn', CRITICAL: 'text-crit', HIGH: 'text-crit', INFO: 'text-ok' })[level] || 'text-slate-300';

export const levelHex = (level) =>
  ({ NORMAL: '#22c55e', OPTIMAL: '#22c55e', LOW: '#22c55e', INFO: '#22c55e', WARNING: '#f59e0b', MEDIUM: '#f59e0b', CRITICAL: '#ef4444', HIGH: '#ef4444' })[level] || '#94a3b8';
