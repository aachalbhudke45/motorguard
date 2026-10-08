import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Cloud, Cpu, Database, RotateCcw, Save, SlidersHorizontal, Wrench, Zap, CircleDashed } from 'lucide-react';
import { useMotor } from '../context/MotorContext';
import { Card, LiveIndicator, PageHeader, StatusBadge, Toggle } from '../components/ui';
import ConfirmModal from '../components/ConfirmModal';
import { CONTROLLER, EXPECTED_SENSORS } from '../services/hardwareService';
import { DEFAULT_SETTINGS } from '../config/constants';
import { dataService } from '../services/dataService';

const THRESHOLD_FIELDS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', step: 1 },
  { key: 'vibration', label: 'Vibration', unit: 'mm/s', step: 0.1 },
  { key: 'current', label: 'Current', unit: 'A', step: 0.1 },
  { key: 'load', label: 'Motor Load', unit: '%', step: 1 },
];

export default function Settings() {
  const { settings, updateSettings, demoMode, setDemoMode, resetSystem } = useMotor();
  // Draft holds only the fields edited via the form + Save button.
  const core = (x) => ({ thresholds: x.thresholds, motorName: x.motorName, motorLocation: x.motorLocation, ratedPower: x.ratedPower });
  const [draft, setDraft] = useState(() => core(settings));
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const coreKey = JSON.stringify(core(settings));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setDraft(core(settings)), [coreKey]);

  const errors = {};
  THRESHOLD_FIELDS.forEach(({ key }) => {
    const { warning, critical } = draft.thresholds[key];
    if (!(warning > 0) || !(critical > 0)) errors[key] = 'Enter positive numbers.';
    else if (warning >= critical) errors[key] = 'Warning must be lower than critical.';
  });
  if (!draft.motorName.trim()) errors.motorName = 'Motor name is required.';
  const valid = Object.keys(errors).length === 0;
  const dirty = JSON.stringify(draft) !== coreKey;

  const setThreshold = (key, field, value) =>
    setDraft((d) => ({ ...d, thresholds: { ...d.thresholds, [key]: { ...d.thresholds[key], [field]: value === '' ? '' : Number(value) } } }));

  const save = () => {
    if (!valid) return;
    updateSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setAlertPref = (k, v) => {
    const next = { ...settings.alerts, [k]: v };
    updateSettings({ alerts: next });
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Thresholds are used immediately by the health engine, alerts, history grading and reports."
        actions={
          <>
            {saved && <span className="flex items-center gap-1.5 text-sm font-semibold text-ok animate-fadein"><CheckCircle2 size={16} /> Saved</span>}
            <button className="btn btn-ghost" onClick={() => setConfirm('defaults')}><RotateCcw size={16} /> Restore Defaults</button>
            <button className="btn btn-primary" disabled={!valid || !dirty} onClick={save}><Save size={16} /> Save Settings</button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Alert Thresholds" icon={SlidersHorizontal}>
            <div className="grid gap-4 md:grid-cols-2">
              {THRESHOLD_FIELDS.map((f) => (
                <div key={f.key} className={`rounded-lg border p-4 ${errors[f.key] ? 'border-crit/50' : 'border-ink-700'} bg-ink-850`}>
                  <div className="text-sm font-semibold text-slate-200">{f.label} threshold <span className="text-slate-500">({f.unit})</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="text-xs text-warn">
                      Warning at ≥
                      <input type="number" step={f.step} className="input mt-1" value={draft.thresholds[f.key].warning}
                        onChange={(e) => setThreshold(f.key, 'warning', e.target.value)} />
                    </label>
                    <label className="text-xs text-crit">
                      Critical above
                      <input type="number" step={f.step} className="input mt-1" value={draft.thresholds[f.key].critical}
                        onChange={(e) => setThreshold(f.key, 'critical', e.target.value)} />
                    </label>
                  </div>
                  {errors[f.key] && <p className="mt-2 text-xs text-crit">{errors[f.key]}</p>}
                  <p className="mt-2 text-[11px] text-slate-500">
                    Default: warning {DEFAULT_SETTINGS.thresholds[f.key].warning}, critical {DEFAULT_SETTINGS.thresholds[f.key].critical}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Motor Details" icon={Wrench}>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-xs text-slate-400">
                Motor name
                <input className="input mt-1 !font-sans" value={draft.motorName} onChange={(e) => setDraft({ ...draft, motorName: e.target.value })} />
                {errors.motorName && <span className="mt-1 block text-crit">{errors.motorName}</span>}
              </label>
              <label className="text-xs text-slate-400">
                Location
                <input className="input mt-1 !font-sans" value={draft.motorLocation} onChange={(e) => setDraft({ ...draft, motorLocation: e.target.value })} />
              </label>
              <label className="text-xs text-slate-400">
                Rated power
                <input className="input mt-1 !font-sans" value={draft.ratedPower} onChange={(e) => setDraft({ ...draft, ratedPower: e.target.value })} />
              </label>
            </div>
          </Card>

          <Card title="Hardware Integration" icon={Cpu} right={<StatusBadge level="PENDING" label="🟡 NOT CONNECTED" />}>
            <div className="rounded-lg border border-warn/40 bg-warn/[0.07] p-4 text-sm text-slate-200">
              ESP32 / physical sensors will be connected in the hardware integration phase. All values currently shown in MotorGuard are generated by the software simulator.
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span className="text-slate-400">Controller: <b className="text-slate-200">{CONTROLLER.name}</b></span>
              <span className="text-slate-400">Planned link: <b className="text-slate-200">{CONTROLLER.link}</b></span>
            </div>
            <div className="label mt-5">Expected future sensors</div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {EXPECTED_SENSORS.map((s) => (
                <div key={s.name} className="flex items-start gap-3 rounded-lg border border-ink-700 bg-ink-850 p-3">
                  <CircleDashed size={18} className="mt-0.5 shrink-0 text-warn" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.model} · {s.measures}</div>
                    <div className="mt-1 text-[11px] font-bold tracking-wider text-warn">NOT CONNECTED</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Demo Mode" icon={Zap} right={demoMode && <LiveIndicator />}>
            <Toggle id="demo-settings" checked={demoMode} onChange={setDemoMode} label={demoMode ? 'Demo mode ON' : 'Demo mode OFF'} />
            <label className="mt-4 block text-xs text-slate-400">
              Reading interval: <b className="text-slate-200">{settings.demoInterval} s</b>
              <input type="range" min={3} max={5} step={1} value={settings.demoInterval}
                onChange={(e) => updateSettings({ demoInterval: Number(e.target.value) })} className="mt-2 w-full accent-cyan-400" />
            </label>
            <p className="mt-2 text-xs text-slate-500">Automatically generates realistic readings and occasionally drifts into the warning band to demonstrate alerts.</p>
          </Card>

          <Card title="Alert Settings" icon={Bell}>
            <div className="space-y-3.5">
              <Toggle id="al-crit" checked={settings.alerts.critical} onChange={(v) => setAlertPref('critical', v)} label="Critical alerts" />
              <Toggle id="al-warn" checked={settings.alerts.warning} onChange={(v) => setAlertPref('warning', v)} label="Warning alerts" />
              <Toggle id="al-info" checked={settings.alerts.info} onChange={(v) => setAlertPref('info', v)} label="Information alerts" />
              <Toggle id="al-pop" checked={settings.alerts.popups} onChange={(v) => setAlertPref('popups', v)} label="Pop-up notifications" />
              <Toggle id="al-snd" checked={settings.alerts.sound} onChange={(v) => setAlertPref('sound', v)} label="Alert sound" />
            </div>
          </Card>

          <Card title="Data Storage" icon={dataService.isCloud ? Cloud : Database}>
            <div className="text-sm text-slate-300">Backend: <b className="text-white">{dataService.backend}</b></div>
            <p className="mt-2 text-xs text-slate-500">
              {dataService.isCloud
                ? 'Readings, alerts, motor status and maintenance records are mirrored to Firestore.'
                : 'Firebase is not configured. Add credentials to a .env file (see .env.example) to enable cloud sync — no dashboard changes required.'}
            </p>
          </Card>

          <Card title="System" icon={RotateCcw}>
            <p className="text-xs text-slate-400">Restore normal sensor values and reset alerts, health, charts and history to the initial demo state.</p>
            <button className="btn btn-danger mt-3 w-full" onClick={() => setConfirm('reset')}><RotateCcw size={16} /> RESET SYSTEM</button>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={confirm === 'reset'}
        title="Reset the monitoring system?"
        message="Sensor values, alerts, health, charts and history will return to the initial demo state. Settings are kept."
        confirmLabel="Yes, reset system"
        onCancel={() => setConfirm(null)}
        onConfirm={() => { resetSystem(); setConfirm(null); }}
      />
      <ConfirmModal
        open={confirm === 'defaults'}
        title="Restore default settings?"
        message="Thresholds, motor details and alert preferences will return to factory defaults."
        confirmLabel="Restore defaults"
        danger={false}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { updateSettings(DEFAULT_SETTINGS); setConfirm(null); }}
      />
    </>
  );
}
