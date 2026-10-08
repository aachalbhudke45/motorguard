// ============================================================================
// HARDWARE INTEGRATION (PENDING – hardware phase)
// The ESP32 will publish sensor packets (e.g. over HTTP, MQTT or straight into
// the Firestore "sensorReadings" collection). Each packet must match the
// reading shape below, then be passed to MotorContext's ingestReading().
//
// Expected packet:
// {
//   "timestamp": "2026-10-08T10:15:00Z",
//   "temperature": 65.2,   // °C   – DS18B20 / MLX90614
//   "vibration": 2.41,     // mm/s – ADXL345 / MPU6050 (RMS velocity)
//   "current": 4.80,       // A    – ACS712 / SCT-013
//   "voltage": 230,        // V    – ZMPT101B
//   "rpm": 1440,           // RPM  – IR / hall-effect sensor
//   "load": 62             // %    – derived from current vs rated current
// }
// ============================================================================

export const HARDWARE_STATUS = 'NOT_CONNECTED';

export const EXPECTED_SENSORS = [
  { name: 'Temperature Sensor', model: 'DS18B20 / MLX90614', measures: 'Winding & body temperature (°C)' },
  { name: 'Vibration Sensor', model: 'ADXL345 / MPU6050', measures: 'Vibration velocity (mm/s RMS)' },
  { name: 'Current Sensor', model: 'ACS712 / SCT-013', measures: 'Line current (A)' },
  { name: 'Voltage Sensor', model: 'ZMPT101B', measures: 'Supply voltage (V AC)' },
];

export const CONTROLLER = { name: 'ESP32 DevKit V1', link: 'Wi-Fi → Firebase / REST' };

/** Validates and normalises a packet from the ESP32. Returns null if invalid. */
export function parseHardwarePacket(packet) {
  const keys = ['temperature', 'vibration', 'current', 'voltage', 'rpm', 'load'];
  if (!packet || keys.some((k) => typeof packet[k] !== 'number' || Number.isNaN(packet[k]))) return null;
  return {
    id: `hw_${Date.now().toString(36)}`,
    timestamp: packet.timestamp || new Date().toISOString(),
    ...Object.fromEntries(keys.map((k) => [k, packet[k]])),
    source: 'HARDWARE',
    mode: 'hardware',
  };
}
