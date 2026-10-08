// ============================================================================
// SENSOR SIMULATOR
// Generates realistic motor readings for the demo. When the ESP32 hardware is
// connected, these functions are replaced by real sensor packets (see
// services/hardwareService.js) — the rest of the app does not change.
// ============================================================================

import { BASELINE } from '../config/constants';

const rand = (min, max) => min + Math.random() * (max - min);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

let idCounter = 0;
export const newId = (prefix = 'r') => `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

// Motor load is roughly proportional to current for a fixed supply voltage.
const loadFromCurrent = (current) => clamp(round((current / 7.75) * 100, 0), 5, 100);
// Induction motor slip: speed drops slightly as load increases.
const rpmFromLoad = (load) => Math.round(1490 - load * 0.8 + rand(-6, 6));

function build(values, mode = 'live') {
  return {
    id: newId(),
    timestamp: new Date().toISOString(),
    temperature: round(values.temperature, 1),
    vibration: round(values.vibration, 2),
    current: round(values.current, 2),
    voltage: Math.round(values.voltage),
    rpm: Math.round(values.rpm),
    load: Math.round(values.load),
    source: 'SIMULATED',
    mode,
  };
}

/**
 * Healthy reading: random-walk from the previous reading back towards the
 * baseline. After a fault this gives a believable gradual recovery.
 */
export function generateNormalReading(prev) {
  const p = prev || BASELINE;
  const pull = (current, target, rate, noise) => current + (target - current) * rate + rand(-noise, noise);
  const recovering = p.temperature > 72 || p.vibration > 3.8 || p.current > 5.8;
  const rate = recovering ? 0.75 : 0.35;

  const temperature = clamp(pull(p.temperature, BASELINE.temperature, rate, 1.4), 55, 70);
  const vibration = clamp(pull(p.vibration, BASELINE.vibration, rate, 0.25), 1.6, 3.5);
  const current = clamp(pull(p.current, BASELINE.current, rate, 0.25), 4.0, 5.6);
  const load = loadFromCurrent(current);
  return build({
    temperature,
    vibration,
    current,
    voltage: clamp(230 + rand(-4, 4), 222, 238),
    rpm: rpmFromLoad(load),
    load,
  });
}

/** Warning-band reading (used by Simulate Warning and random demo drift). */
export function generateWarningReading() {
  const pick = Math.random();
  const temperature = pick < 0.5 ? rand(72, 78) : rand(66, 69);
  const vibration = pick >= 0.3 ? rand(4.3, 5.6) : rand(3.0, 3.8);
  const current = rand(5.6, 6.6);
  const load = clamp(Math.round(rand(81, 88)), 0, 100);
  return build({ temperature, vibration, current, voltage: 230 + rand(-6, 3), rpm: rpmFromLoad(load), load }, 'warning');
}

/** Fault reading — abnormal motor condition. */
export function generateFaultReading() {
  const load = Math.round(rand(95, 100));
  return build(
    {
      temperature: rand(88, 95),
      vibration: rand(6.2, 8),
      current: rand(7.2, 9),
      voltage: 230 + rand(-10, -4),
      rpm: Math.round(1385 + rand(-25, 10)),
      load,
    },
    'fault',
  );
}

/** Demo mode: mostly normal, occasionally drifts into warning. */
export function generateDemoReading(prev) {
  const roll = Math.random();
  if (roll < 0.1) return { ...generateWarningReading(), mode: 'demo' };
  return { ...generateNormalReading(prev), mode: 'demo' };
}

/**
 * Initial historical data: 12 readings at 5-minute intervals ending "now",
 * climbing gently to the dashboard baseline (65 °C / 2.4 mm/s / 4.8 A).
 */
export function generateInitialHistory() {
  const seed = [
    [61.0, 1.95, 4.40, 229, 52],
    [61.8, 2.05, 4.48, 231, 54],
    [62.6, 2.10, 4.55, 230, 56],
    [63.0, 2.20, 4.60, 228, 57],
    [63.7, 2.24, 4.66, 232, 58],
    [64.2, 2.30, 4.70, 230, 59],
    [64.6, 2.34, 4.74, 230, 60],
    [65.6, 2.50, 4.90, 229, 63],
    [64.9, 2.42, 4.82, 231, 62],
    [64.5, 2.38, 4.78, 230, 61],
    [64.9, 2.41, 4.80, 230, 62],
    [65.0, 2.40, 4.80, 230, 62],
  ];
  const now = Date.now();
  return seed.map(([temperature, vibration, current, voltage, load], i) => ({
    id: `init_${i}`,
    timestamp: new Date(now - (seed.length - 1 - i) * 5 * 60 * 1000).toISOString(),
    temperature,
    vibration,
    current,
    voltage,
    rpm: 1490 - Math.round(load * 0.8) + (i % 3) - 1,
    load,
    source: 'SIMULATED',
    mode: 'initial',
  }));
}
