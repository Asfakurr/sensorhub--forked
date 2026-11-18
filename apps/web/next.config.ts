import type { NextConfig } from 'next';

// Where the NestJS API lives, as seen from the Next.js server.
// In Docker this is the compose service name; locally it's localhost.
const API_URL = process.env.API_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}`;

const nextConfig: NextConfig = {
  // Gzip buffers server-sent events; the dashboard needs them unbuffered.
  compress: false,
  async rewrites() {
    // The browser only ever talks to the dashboard. /api/* is proxied to NestJS,
    // so one Tailscale Funnel on port 3000 serves the whole app and the API
    // is never exposed on its own.
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
