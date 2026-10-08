// ============================================================================
// MOTOR HEALTH ENGINE
// Rule-based evaluation of sensor readings. Pure functions only — no React —
// so the same logic can later run on a server, a Cloud Function, or the ESP32
// gateway without changes.
// ============================================================================

import { FIXED_RANGES, PARAMETERS } from '../config/constants';

export const LEVEL = { NORMAL: 'NORMAL', WARNING: 'WARNING', CRITICAL: 'CRITICAL' };
export const SCORED_PARAMS = ['temperature', 'vibration', 'current', 'load'];

// Weight of each parameter in the overall health score (sums to 1).
const WEIGHTS = { temperature: 0.3, vibration: 0.3, current: 0.2, load: 0.2 };

/** Classify a thresholded parameter as NORMAL / WARNING / CRITICAL. */
export function classify(value, t) {
  if (value > t.critical) return LEVEL.CRITICAL;
  if (value >= t.warning) return LEVEL.WARNING;
  return LEVEL.NORMAL;
}

/** Classify voltage / RPM against a fixed min–max band. */
export function classifyRange(key, value) {
  const r = FIXED_RANGES[key];
  const tol = (r.max - r.min) * 0.15;
  if (value < r.min - tol || value > r.max + tol) return LEVEL.CRITICAL;
  if (value < r.min || value > r.max) return LEVEL.WARNING;
  return LEVEL.NORMAL;
}

/**
 * Per-parameter health (0–100).
 *  - Normal zone   : 100 → 87 (gentle quadratic penalty as value approaches warning)
 *  - Warning zone  : 87  → 60 (linear between warning and critical)
 *  - Critical zone : 60  → 5  (steep linear drop beyond critical)
 */
export function parameterHealth(value, t) {
  const v = Math.max(0, value);
  if (v < t.warning) {
    const r = v / t.warning;
    return 100 - 13 * r * r;
  }
  if (v <= t.critical) {
    const r = (v - t.warning) / (t.critical - t.warning || 1);
    return 87 - 27 * r;
  }
  const over = (v - t.critical) / (t.critical * 0.35);
  return Math.max(5, 60 - over * 40);
}

export function healthLabel(score) {
  if (score >= 80) return 'OPTIMAL';
  if (score >= 55) return 'WARNING';
  return 'CRITICAL';
}

/** Evaluate a raw reading and return everything the UI needs. */
export function evaluate(reading, thresholds) {
  const params = {};
  let weighted = 0;

  SCORED_PARAMS.forEach((key) => {
    const t = thresholds[key];
    const level = classify(reading[key], t);
    const health = parameterHealth(reading[key], t);
    params[key] = { value: reading[key], level, health: Math.round(health) };
    weighted += health * WEIGHTS[key];
  });

  ['voltage', 'rpm'].forEach((key) => {
    params[key] = { value: reading[key], level: classifyRange(key, reading[key]) };
  });

  // Voltage / RPM deviations do not drive the score heavily, but nudge it.
  let penalty = 0;
  ['voltage', 'rpm'].forEach((k) => {
    if (params[k].level === LEVEL.WARNING) penalty += 4;
    if (params[k].level === LEVEL.CRITICAL) penalty += 10;
  });

  const health = Math.max(0, Math.min(100, Math.round(weighted - penalty)));
  const levels = Object.values(params).map((p) => p.level);
  const criticalCount = levels.filter((l) => l === LEVEL.CRITICAL).length;
  const warningCount = levels.filter((l) => l === LEVEL.WARNING).length;

  let status = LEVEL.NORMAL;
  if (criticalCount > 0 || health < 55) status = LEVEL.CRITICAL;
  else if (warningCount > 0 || health < 80) status = LEVEL.WARNING;

  const risk = status === LEVEL.CRITICAL ? 'HIGH' : status === LEVEL.WARNING ? 'MEDIUM' : 'LOW';
  const condition =
    status === LEVEL.CRITICAL ? 'Immediate Attention' : status === LEVEL.WARNING ? 'Requires Inspection' : 'Healthy';

  return { params, health, healthLabel: healthLabel(health), status, risk, condition, criticalCount, warningCount };
}

const NAMES = {
  temperature: { WARNING: 'elevated temperature', CRITICAL: 'high temperature' },
  vibration: { WARNING: 'increasing vibration', CRITICAL: 'abnormal vibration' },
  current: { WARNING: 'elevated current draw', CRITICAL: 'overcurrent' },
  load: { WARNING: 'high motor load', CRITICAL: 'motor overload' },
  voltage: { WARNING: 'voltage deviation', CRITICAL: 'severe voltage fluctuation' },
  rpm: { WARNING: 'speed deviation', CRITICAL: 'abnormal speed' },
};

function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Human-readable explanation of current health (Motor Health page). */
export function explain(evaluation) {
  const { params, status } = evaluation;
  if (status === LEVEL.NORMAL) return 'Motor parameters are currently operating within the recommended range.';
  const crit = Object.keys(params).filter((k) => params[k].level === LEVEL.CRITICAL).map((k) => NAMES[k].CRITICAL);
  const warn = Object.keys(params).filter((k) => params[k].level === LEVEL.WARNING).map((k) => NAMES[k].WARNING);
  const parts = [];
  if (crit.length) parts.push(`${capitalise(joinList(crit))} ${crit.length > 1 ? 'are' : 'is'} beyond the critical limit`);
  if (warn.length) parts.push(`${crit.length ? joinList(warn) : capitalise(joinList(warn))} ${warn.length > 1 ? 'are' : 'is'} in the warning band`);
  if (!parts.length) return 'Overall health has dropped below the optimal band. Keep the motor under observation.';
  return `${parts.join('; ')}. Overall health is ${evaluation.health}% (${evaluation.healthLabel}).`;
}

/** Maintenance recommendation (Predictive Maintenance page + critical alert). */
export function recommend(evaluation) {
  const { params, status } = evaluation;
  if (status === LEVEL.NORMAL) return 'Motor is operating normally. Continue regular monitoring.';

  const bad = (k) => params[k].level !== LEVEL.NORMAL;
  if (status === LEVEL.CRITICAL) {
    const crit = Object.keys(params).filter((k) => params[k].level === LEVEL.CRITICAL).map((k) => NAMES[k].CRITICAL);
    if (!crit.length) return 'Overall motor health is critically low. Immediate motor inspection recommended.';
    return `${capitalise(joinList(crit))} detected. Immediate motor inspection recommended.`;
  }
  if (bad('vibration')) return 'Vibration is increasing. Preventive inspection is recommended — check bearings, mounting bolts and shaft alignment.';
  if (bad('temperature')) return 'Temperature is rising above normal. Check cooling fan, ventilation and lubrication during the next shift.';
  if (bad('current') || bad('load')) return 'Motor is drawing higher current than normal. Reduce load and inspect the driven equipment.';
  if (bad('voltage')) return 'Supply voltage is outside the nominal band. Have the electrical supply checked.';
  return 'Minor deviations detected. Preventive inspection is recommended.';
}

/** Detailed action items for the maintenance page. */
export function actionItems(evaluation) {
  const { params } = evaluation;
  const items = [];
  if (params.temperature.level !== LEVEL.NORMAL) items.push('Inspect cooling fan and clean ventilation openings', 'Verify winding insulation temperature');
  if (params.vibration.level !== LEVEL.NORMAL) items.push('Inspect bearings for wear and lubrication', 'Check mounting bolts and shaft alignment');
  if (params.current.level !== LEVEL.NORMAL) items.push('Measure phase currents for imbalance', 'Check for mechanical binding in driven load');
  if (params.load.level !== LEVEL.NORMAL) items.push('Reduce motor load to below 80% of rated capacity');
  if (params.voltage.level !== LEVEL.NORMAL) items.push('Check supply voltage and terminal connections');
  if (!items.length) items.push('Continue routine condition monitoring', 'Schedule next preventive maintenance as per plan');
  return items;
}

/** Estimated days until maintenance is due — simple degradation heuristic. */
export function estimateDaysToMaintenance(health) {
  if (health >= 90) return 45;
  if (health >= 80) return Math.round(20 + (health - 80) * 2.5);
  if (health >= 55) return Math.round(3 + (health - 55) * 0.7);
  return 0;
}

const ALERT_TITLES = {
  temperature: { WARNING: 'Elevated Temperature', CRITICAL: 'High Temperature' },
  vibration: { WARNING: 'High Vibration', CRITICAL: 'Abnormal Vibration' },
  current: { WARNING: 'Elevated Current', CRITICAL: 'Overcurrent' },
  load: { WARNING: 'High Motor Load', CRITICAL: 'Motor Overload' },
  voltage: { WARNING: 'Voltage Deviation', CRITICAL: 'Voltage Fault' },
  rpm: { WARNING: 'Speed Deviation', CRITICAL: 'Abnormal Speed' },
};

export function formatValue(key, value) {
  const p = PARAMETERS[key];
  return `${Number(value).toFixed(p.decimals)} ${p.unit}`;
}

/**
 * Compare previous and current evaluations and produce alerts only on
 * transitions (escalation or recovery) so the alert center is not flooded.
 */
export function generateAlerts(prevEval, currEval, reading) {
  const alerts = [];
  const ts = reading.timestamp;
  const rank = { NORMAL: 0, WARNING: 1, CRITICAL: 2 };

  Object.keys(currEval.params).forEach((key) => {
    const now = currEval.params[key].level;
    const before = prevEval ? prevEval.params[key].level : LEVEL.NORMAL;
    if (now !== LEVEL.NORMAL && rank[now] > rank[before]) {
      alerts.push({
        severity: now,
        title: ALERT_TITLES[key][now],
        message: `${formatValue(key, reading[key])} detected`,
        sensor: PARAMETERS[key].sensor,
        parameter: key,
        value: formatValue(key, reading[key]),
        timestamp: ts,
      });
    }
  });

  // Combined summary alert when the motor enters CRITICAL state.
  if (currEval.status === LEVEL.CRITICAL && (!prevEval || prevEval.status !== LEVEL.CRITICAL)) {
    alerts.unshift({
      severity: LEVEL.CRITICAL,
      title: 'CRITICAL ALERT – Motor Fault',
      message: recommend(currEval),
      sensor: 'Health Engine',
      parameter: 'health',
      value: `${currEval.health}% health`,
      timestamp: ts,
      summary: true,
    });
  }

  // Recovery notice.
  if (prevEval && prevEval.status !== LEVEL.NORMAL && currEval.status === LEVEL.NORMAL) {
    alerts.push({
      severity: 'INFO',
      title: 'Motor Returned to Normal',
      message: 'Motor returned to normal condition. All parameters within recommended range.',
      sensor: 'Health Engine',
      parameter: 'health',
      value: `${currEval.health}% health`,
      timestamp: ts,
    });
  }
  return alerts;
}
