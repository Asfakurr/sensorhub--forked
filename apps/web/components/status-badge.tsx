import type { DeviceStatus } from '@sensorhub/shared';
import { formatDeviceStatus, getStatusBadgeClass } from '@/lib/status';

export function StatusBadge({
  status,
  className = '',
}: {
  status: DeviceStatus;
  className?: string;
}) {
  const badgeClass = [getStatusBadgeClass(status), className].filter(Boolean).join(' ');
  return (
    <span className={badgeClass} data-status={status}>
      {formatDeviceStatus(status)}
    </span>
  );
}
