import type { DeviceStatus } from '@sensorhub/shared';

/** Format DeviceStatus for user display: "Online" | "Offline". */
export function formatDeviceStatus(status: DeviceStatus): string {
  return status === 'online' ? 'Online' : 'Offline';
}

/** CSS class name for the status badge. */
export function getStatusBadgeClass(status: DeviceStatus): string {
  return `status-badge status-${status}`;
}

/**
 * Format relative elapsed time since lastSeen: "12s ago", "3m ago", "2h ago", "1d ago".
 * Returns "never" if lastSeen is missing/empty, or "unknown" if invalid.
 */
export function formatLastSeen(
  lastSeen: string | Date | null | undefined,
  now: number = Date.now(),
): string {
  if (!lastSeen) return 'never';
  const timestamp =
    typeof lastSeen === 'string'
      ? new Date(lastSeen).getTime()
      : lastSeen instanceof Date
        ? lastSeen.getTime()
        : new Date(lastSeen).getTime();

  if (Number.isNaN(timestamp)) return 'unknown';

  const diffMs = now - timestamp;
  if (diffMs < 0) return 'just now';

  const s = Math.max(0, Math.round(diffMs / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
