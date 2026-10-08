// Central configuration for MotorGuard.
// Thresholds here are the factory defaults; users can override them in Settings.

export const APP_NAME = 'MOTORGUARD';
export const APP_TAGLINE = 'Smart Motor Health Monitoring & Predictive Maintenance System';

export const DEFAULT_SETTINGS = {
  motorName: 'Induction Motor M-01',
  motorLocation: 'Production Line A – Bay 3',
  ratedPower: '3.7 kW (5 HP)',
  thresholds: {
    temperature: { warning: 70, critical: 80 }, // °C
    vibration: { warning: 4, critical: 6 }, // mm/s RMS
    current: { warning: 6, critical: 7 }, // A
    load: { warning: 80, critical: 90 }, // %
  },
  alerts: {
    warning: true,
    critical: true,
    info: true,
    popups: true,
    sound: false,
  },
  demoInterval: 4, // seconds (3–5 recommended)
};

// Static metadata for each monitored parameter.
export const PARAMETERS = {
  temperature: { label: 'Temperature', unit: '°C', decimals: 1, sensor: 'Temperature Sensor', color: '#f97316' },
  vibration: { label: 'Vibration', unit: 'mm/s', decimals: 2, sensor: 'Vibration Sensor', color: '#a78bfa' },
  current: { label: 'Current', unit: 'A', decimals: 2, sensor: 'Current Sensor', color: '#22d3ee' },
  voltage: { label: 'Voltage', unit: 'V', decimals: 0, sensor: 'Voltage Sensor', color: '#60a5fa' },
  rpm: { label: 'Speed', unit: 'RPM', decimals: 0, sensor: 'Speed Encoder', color: '#34d399' },
  load: { label: 'Motor Load', unit: '%', decimals: 0, sensor: 'Derived (Current)', color: '#f472b6' },
  health: { label: 'Motor Health', unit: '%', decimals: 0, sensor: 'Health Engine', color: '#22c55e' },
};

// Fixed operating ranges for parameters that do not have user-editable thresholds.
export const FIXED_RANGES = {
  voltage: { min: 210, max: 250, nominal: 230 },
  rpm: { min: 1380, max: 1500, nominal: 1440 },
};

// Baseline healthy operating point (used for simulation and reset).
export const BASELINE = {
  temperature: 65,
  vibration: 2.4,
  current: 4.8,
  voltage: 230,
  rpm: 1440,
  load: 62,
};

export const MAX_HISTORY = 500;
export const CHART_POINTS = 20;

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'live', label: 'Live Monitoring' },
  { id: 'health', label: 'Motor Health' },
  { id: 'maintenance', label: 'Predictive Maintenance' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'history', label: 'History' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

export const DEFAULT_CHECKLIST = [
  { id: 'temp', label: 'Temperature monitoring', done: true, auto: true },
  { id: 'vib', label: 'Vibration monitoring', done: true, auto: true },
  { id: 'cur', label: 'Current monitoring', done: true, auto: true },
  { id: 'phys', label: 'Physical inspection', done: false },
  { id: 'calib', label: 'Sensor calibration', done: false },
  { id: 'lube', label: 'Bearing lubrication check', done: false },
  { id: 'align', label: 'Shaft alignment check', done: false },
];
