import { describe, expect, it } from 'vitest';
import { createDevices, nextReading } from './device';

// Deterministic "random" numbers so the tests never flake.
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('createDevices', () => {
  it('creates numbered devices with names', () => {
    const devices = createDevices(3, seq(0.5));
    expect(devices.map((d) => d.id)).toEqual(['dev-001', 'dev-002', 'dev-003']);
    expect(devices[0].name).toBe('Boiler room');
  });
});

describe('nextReading', () => {
  it('stays within physical bounds and drains the battery', () => {
    const [device] = createDevices(1, seq(0.5));
    const { state, reading } = nextReading(device, seq(0.9, 0.5, 0.5, 1));
    expect(reading.deviceId).toBe('dev-001');
    expect(state.battery).toBeLessThan(device.battery);
    expect(reading.humidity).toBeGreaterThanOrEqual(0);
    expect(reading.humidity).toBeLessThanOrEqual(100);
  });

  it('occasionally spikes the temperature', () => {
    const [device] = createDevices(1, seq(0.5));
    const { reading } = nextReading(device, seq(0.0, 0.5, 0.5, 0));
    expect(reading.temperature).toBeGreaterThan(device.temperature + 10);
  });
});

describe('drift', () => {
  it('pulls readings back towards the baseline over time', () => {
    let [device] = createDevices(1, seq(0.5));
    device = { ...device, humidity: device.baseHumidity + 30 };
    for (let i = 0; i < 100; i++) device = nextReading(device, seq(0.5, 0.5, 0.5, 1)).state;
    expect(Math.abs(device.humidity - device.baseHumidity)).toBeLessThan(1);
  });
});
