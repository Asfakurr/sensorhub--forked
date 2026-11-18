import Link from 'next/link';

export default function DeviceNotFound() {
  return (
    <section>
      <h2>Device not found</h2>
      <p className="muted">
        No device with that id has reported yet. <Link href="/">Back to all devices</Link>
      </p>
    </section>
  );
}
