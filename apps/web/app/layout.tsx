import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SensorHub',
  description: 'Live telemetry from (simulated) embedded devices',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="dot" /> SensorHub
          </Link>
          <span className="muted">agentic dev training demo</span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
