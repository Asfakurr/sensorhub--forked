import { sparklinePath } from '@/lib/sparkline';

export function Sparkline({
  values,
  width = 220,
  height = 44,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={sparklinePath(values, width, height)} fill="none" strokeWidth="2" />
    </svg>
  );
}
