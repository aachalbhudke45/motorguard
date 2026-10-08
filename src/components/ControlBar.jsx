import { useState } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Siren, Zap } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import ConfirmModal from './ConfirmModal';
import { LiveIndicator, Toggle } from './ui';

/** Simulation controls shared by Dashboard and Live Monitoring. */
export default function ControlBar({ compact = false }) {
  const { simulateLive, simulateWarning, simulateFault, demoMode, setDemoMode, resetSystem } = useMotor();
  const [confirm, setConfirm] = useState(false);
  const [flash, setFlash] = useState(null);

  const run = (fn, key) => {
    fn();
    setFlash(key);
    setTimeout(() => setFlash(null), 400);
  };

  return (
    <div className="card flex flex-wrap items-center gap-2 p-3">
      <button className={`btn btn-primary ${flash === 'live' ? 'scale-95' : ''}`} onClick={() => run(simulateLive, 'live')}>
        <RefreshCw size={16} className={flash === 'live' ? 'animate-spin' : ''} /> SIMULATE LIVE DATA
      </button>
      {!compact && (
        <button className="btn btn-warn" onClick={() => run(simulateWarning, 'warn')}>
          <AlertTriangle size={16} /> SIMULATE WARNING
        </button>
      )}
      <button className={`btn btn-danger ${flash === 'fault' ? 'scale-95' : ''}`} onClick={() => run(simulateFault, 'fault')}>
        <Siren size={16} /> 🚨 SIMULATE FAULT
      </button>

      <div className="mx-1 hidden h-8 w-px bg-ink-700 sm:block" />

      <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5">
        <Zap size={15} className={demoMode ? 'text-ok' : 'text-slate-500'} />
        <Toggle id={`demo-${compact ? 'c' : 'f'}`} checked={demoMode} onChange={setDemoMode} label="DEMO MODE" />
        {demoMode && <LiveIndicator />}
      </div>

      <button className="btn btn-ghost ml-auto" onClick={() => setConfirm(true)}>
        <RotateCcw size={16} /> RESET SYSTEM
      </button>

      <ConfirmModal
        open={confirm}
        title="Reset the monitoring system?"
        message="This restores normal sensor values, clears all alerts, resets motor health and restores charts and history to the initial demo state. Your settings are kept."
        confirmLabel="Yes, reset system"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          resetSystem();
          setConfirm(false);
        }}
      />
    </div>
  );
}
