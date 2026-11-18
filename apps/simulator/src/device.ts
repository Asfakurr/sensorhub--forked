import type { CreateReadingInput } from '@sensorhub/shared';

export interface DeviceState {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  battery: number;
  /** Where this device's temperature and humidity drift back to. */
  baseTemperature: number;
  baseHumidity: number;
}

const NAMES = [
  'Boiler room',
  'Cold store',
  'Server rack',
  'Greenhouse',
  'Loading dock',
  'Lab bench',
];

export function createDevices(count: number, rand: () => number = Math.random): DeviceState[] {
  return Array.from({ length: count }, (_, i) => {
    const temperature = 18 + rand() * 8;
    const humidity = 35 + rand() * 20;
    return {
      id: `dev-${String(i + 1).padStart(3, '0')}`,
      name:
        NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ''),
      temperature,
      humidity,
      battery: 60 + rand() * 40,
      baseTemperature: temperature,
      baseHumidity: humidity,
    };
  });
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Advance one device by one tick: a small random walk that drifts back to the
 * device's baseline, a slow battery drain,
 * and a rare temperature spike so alert rules have something to catch.
 */
export function nextReading(
  state: DeviceState,
  rand: () => number = Math.random,
): { state: DeviceState; reading: CreateReadingInput } {
  const spike = rand() < 0.02 ? 15 : 0;
  const temperature = clamp(
    state.temperature + (rand() - 0.5) * 0.8 + (state.baseTemperature - state.temperature) * 0.05,
    -20,
    60,
  );
  const humidity = clamp(
    state.humidity + (rand() - 0.5) * 2 + (state.baseHumidity - state.humidity) * 0.05,
    0,
    100,
  );
  const battery = clamp(state.battery - rand() * 0.05, 0, 100);
  const next = { ...state, temperature, humidity, battery };
  return {
    state: next,
    reading: {
      deviceId: state.id,
      deviceName: state.name,
      deviceType: 'env-sensor',
      temperature: round1(temperature + spike),
      humidity: round1(humidity),
      battery: round1(battery),
      recordedAt: new Date().toISOString(),
    },
  };
}
