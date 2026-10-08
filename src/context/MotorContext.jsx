// ============================================================================
// MOTOR CONTEXT – single source of truth for the whole application.
// Every reading (simulated today, ESP32 tomorrow) enters through
// ingestReading(), which evaluates health, raises alerts, updates history
// and persists via dataService.
// ============================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CHECKLIST, DEFAULT_SETTINGS, MAX_HISTORY } from '../config/constants';
import { evaluate, generateAlerts } from '../utils/healthEngine';
import {
  generateDemoReading,
  generateFaultReading,
  generateInitialHistory,
  generateNormalReading,
  generateWarningReading,
  newId,
} from '../utils/simulator';
import { dataService } from '../services/dataService';

const MotorContext = createContext(null);

function freshState(settings = DEFAULT_SETTINGS) {
  const now = new Date().toISOString();
  return {
    readings: generateInitialHistory(),
    alerts: [
      {
        id: newId('a'),
        severity: 'INFO',
        title: 'Monitoring Started',
        message: 'Software monitoring session started. Running on simulated sensor data.',
        sensor: 'System',
        parameter: 'system',
        value: '—',
        timestamp: now,
        read: false,
      },
    ],
    settings,
    checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
    maintenanceLog: [],
    demoMode: false,
    lastUpdated: now,
  };
}

function mergeSettings(saved) {
  if (!saved) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    thresholds: { ...DEFAULT_SETTINGS.thresholds, ...(saved.thresholds || {}) },
    alerts: { ...DEFAULT_SETTINGS.alerts, ...(saved.alerts || {}) },
  };
}

function loadInitial() {
  const saved = dataService.loadState();
  if (saved && Array.isArray(saved.readings) && saved.readings.length) {
    return { ...freshState(), ...saved, settings: mergeSettings(saved.settings), demoMode: false };
  }
  return freshState();
}

function beep(severity) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = severity === 'CRITICAL' ? 880 : 620;
    gain.gain.value = 0.06;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* audio not available */
  }
}

export function MotorProvider({ children }) {
  const [state, setState] = useState(loadInitial);
  const [toasts, setToasts] = useState([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist snapshot on every change.
  useEffect(() => {
    dataService.saveState(state);
  }, [state]);

  const { readings, settings } = state;
  const current = readings[readings.length - 1];

  // Evaluate every reading against the CURRENT thresholds, so a threshold
  // change in Settings immediately re-grades history, charts and reports.
  const evaluated = useMemo(
    () => readings.map((r) => ({ ...r, ...pick(evaluate(r, settings.thresholds)) })),
    [readings, settings.thresholds],
  );
  const evaluation = useMemo(() => evaluate(current, settings.thresholds), [current, settings.thresholds]);
  const previous = readings.length > 1 ? readings[readings.length - 2] : null;

  const pushToast = useCallback((alert) => {
    const id = newId('t');
    setToasts((t) => [...t.slice(-2), { ...alert, toastId: id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.toastId !== id)), 6000);
  }, []);

  const dismissToast = useCallback((toastId) => setToasts((t) => t.filter((x) => x.toastId !== toastId)), []);

  /** Single entry point for any new sensor reading. */
  const ingestReading = useCallback(
    (reading) => {
      const s = stateRef.current;
      const prevReading = s.readings[s.readings.length - 1];
      const prevEval = prevReading ? evaluate(prevReading, s.settings.thresholds) : null;
      const currEval = evaluate(reading, s.settings.thresholds);

      const prefs = s.settings.alerts;
      const allowed = (sev) =>
        (sev === 'CRITICAL' && prefs.critical) || (sev === 'WARNING' && prefs.warning) || (sev === 'INFO' && prefs.info);
      const newAlerts = generateAlerts(prevEval, currEval, reading)
        .filter((a) => allowed(a.severity))
        .map((a) => ({ ...a, id: newId('a'), read: false, readingId: reading.id }));

      setState((st) => ({
        ...st,
        readings: [...st.readings, reading].slice(-MAX_HISTORY),
        alerts: [...newAlerts, ...st.alerts].slice(0, 200),
        lastUpdated: reading.timestamp,
      }));

      dataService.saveReading(reading, currEval);
      dataService.saveMotorStatus(currEval, reading.timestamp);
      newAlerts.forEach((a) => dataService.saveAlert(a));

      if (newAlerts.length) {
        const top = newAlerts.find((a) => a.summary) || newAlerts.find((a) => a.severity === 'CRITICAL') || newAlerts[0];
        if (prefs.popups) pushToast(top);
        if (prefs.sound && top.severity !== 'INFO') beep(top.severity);
      }
      return currEval;
    },
    [pushToast],
  );

  const last = () => stateRef.current.readings[stateRef.current.readings.length - 1];
  const simulateLive = useCallback(() => ingestReading(generateNormalReading(last())), [ingestReading]);
  const simulateWarning = useCallback(() => ingestReading(generateWarningReading()), [ingestReading]);
  const simulateFault = useCallback(() => ingestReading(generateFaultReading()), [ingestReading]);

  // ----- Demo mode: auto-generate a reading every N seconds -----
  useEffect(() => {
    if (!state.demoMode) return undefined;
    const ms = Math.min(5, Math.max(3, Number(settings.demoInterval) || 4)) * 1000;
    const timer = setInterval(() => ingestReading(generateDemoReading(last())), ms);
    return () => clearInterval(timer);
  }, [state.demoMode, settings.demoInterval, ingestReading]);

  const setDemoMode = useCallback((on) => setState((s) => ({ ...s, demoMode: on })), []);

  // ----- Alerts -----
  const clearAlert = useCallback((id) => setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) })), []);
  const clearAllAlerts = useCallback(() => setState((s) => ({ ...s, alerts: [] })), []);
  const markAllRead = useCallback(() => setState((s) => ({ ...s, alerts: s.alerts.map((a) => ({ ...a, read: true })) })), []);

  // ----- Settings -----
  const updateSettings = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);
  const resetSettings = useCallback(() => setState((s) => ({ ...s, settings: DEFAULT_SETTINGS })), []);

  // ----- Maintenance checklist -----
  const toggleChecklist = useCallback((id) => {
    setState((s) => {
      const checklist = s.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
      const item = checklist.find((c) => c.id === id);
      const record = { id: newId('m'), task: item.label, done: item.done, timestamp: new Date().toISOString() };
      dataService.saveMaintenanceRecord(record);
      return { ...s, checklist, maintenanceLog: [record, ...s.maintenanceLog].slice(0, 50) };
    });
  }, []);

  // ----- Reset -----
  const resetSystem = useCallback(() => {
    setState((s) => freshState(s.settings));
    setToasts([]);
  }, []);

  const value = {
    readings: evaluated,
    current: { ...current, ...pick(evaluation) },
    previous,
    evaluation,
    alerts: state.alerts,
    unreadCount: state.alerts.filter((a) => !a.read && a.severity !== 'INFO').length,
    settings,
    checklist: state.checklist,
    maintenanceLog: state.maintenanceLog,
    demoMode: state.demoMode,
    lastUpdated: state.lastUpdated,
    toasts,
    backend: dataService.backend,
    ingestReading,
    simulateLive,
    simulateWarning,
    simulateFault,
    setDemoMode,
    clearAlert,
    clearAllAlerts,
    markAllRead,
    updateSettings,
    resetSettings,
    toggleChecklist,
    resetSystem,
    dismissToast,
  };

  return <MotorContext.Provider value={value}>{children}</MotorContext.Provider>;
}

function pick(e) {
  return { health: e.health, status: e.status, risk: e.risk, healthLabel: e.healthLabel };
}

export function useMotor() {
  const ctx = useContext(MotorContext);
  if (!ctx) throw new Error('useMotor must be used inside <MotorProvider>');
  return ctx;
}
