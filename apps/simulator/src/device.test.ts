import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDevices,
  isDevicePaused,
  nextReading,
  pauseDevice,
  resetPausedDevices,
  resumeDevice,
} from './device';

// Deterministic "random" numbers so the tests never flake.
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('createDevices', () => {
  beforeEach(() => {
    resetPausedDevices();
  });

  it('creates numbered devices with names', () => {
    const devices = createDevices(3, seq(0.5));
    expect(devices.map((d) => d.id)).toEqual(['dev-001', 'dev-002', 'dev-003']);
    expect(devices[0].name).toBe('Boiler room');
  });

  it('marks created device as paused if pre-paused', () => {
    pauseDevice('dev-002');
    const devices = createDevices(3, seq(0.5));
    expect(devices[0].paused).toBe(false);
    expect(devices[1].paused).toBe(true);
    expect(isDevicePaused(devices[1])).toBe(true);
  });
});

describe('pauseDevice and resumeDevice', () => {
  beforeEach(() => {
    resetPausedDevices();
  });

  it('pauses a device and marks it as paused', () => {
    const devices = createDevices(2, seq(0.5));
    expect(isDevicePaused('dev-001')).toBe(false);
    expect(isDevicePaused(devices[0])).toBe(false);

    pauseDevice('dev-001', devices);

    expect(isDevicePaused('dev-001')).toBe(true);
    expect(isDevicePaused(devices[0])).toBe(true);
    expect(devices[0].paused).toBe(true);
    // Other devices remain active
    expect(isDevicePaused('dev-002')).toBe(false);
    expect(isDevicePaused(devices[1])).toBe(false);
  });

  it('resumes a paused device', () => {
    const devices = createDevices(2, seq(0.5));
    pauseDevice('dev-001', devices);
    expect(isDevicePaused('dev-001')).toBe(true);

    const resumed = resumeDevice('dev-001', devices);
    expect(resumed).toBe(true);
    expect(isDevicePaused('dev-001')).toBe(false);
    expect(isDevicePaused(devices[0])).toBe(false);
    expect(devices[0].paused).toBe(false);
  });

  it('identifies and allows skipping paused devices', () => {
    const devices = createDevices(3, seq(0.5));
    pauseDevice('dev-002', devices);

    const activeDevices = devices.filter((d) => !isDevicePaused(d));
    expect(activeDevices.map((d) => d.id)).toEqual(['dev-001', 'dev-003']);

    const pausedDevices = devices.filter((d) => isDevicePaused(d));
    expect(pausedDevices.map((d) => d.id)).toEqual(['dev-002']);
  });
});

describe('nextReading', () => {
  beforeEach(() => {
    resetPausedDevices();
  });

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

  it('preserves paused state when advancing next state', () => {
    const [device] = createDevices(1, seq(0.5));
    pauseDevice(device.id, [device]);
    const { state } = nextReading(device, seq(0.5));
    expect(state.paused).toBe(true);
    expect(isDevicePaused(state)).toBe(true);
  });
});

describe('drift', () => {
  beforeEach(() => {
    resetPausedDevices();
  });

  it('pulls readings back towards the baseline over time', () => {
    let [device] = createDevices(1, seq(0.5));
    device = { ...device, humidity: device.baseHumidity + 30 };
    for (let i = 0; i < 100; i++) device = nextReading(device, seq(0.5, 0.5, 0.5, 1)).state;
    expect(Math.abs(device.humidity - device.baseHumidity)).toBeLessThan(1);
  });
});
