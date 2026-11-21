import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { isDevicePaused, pauseDevice, resumeDevice, type DeviceState } from "./device";

export interface ControlServerOptions {
  onPause?: (deviceId: string) => void;
  onResume?: (deviceId: string) => void;
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

export async function handleControlRequest(
  req: IncomingMessage,
  res: ServerResponse,
  devices: DeviceState[],
  options: ControlServerOptions = {},
): Promise<void> {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const host = req.headers.host ?? "localhost";
    const url = new URL(req.url ?? "/", `http://${host}`);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    // GET /status or GET /devices
    if (
      req.method === "GET" &&
      (pathname === "/status" || pathname === "/devices" || pathname === "/")
    ) {
      const deviceStatus = devices.map((d) => ({
        id: d.id,
        name: d.name,
        paused: isDevicePaused(d),
      }));
      const pausedCount = deviceStatus.filter((d) => d.paused).length;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          total: devices.length,
          activeCount: devices.length - pausedCount,
          pausedCount,
          devices: deviceStatus,
        }),
      );
      return;
    }

    // GET /devices/:id
    const singleDeviceMatch = pathname.match(/^\/devices\/([^/?#]+)$/);
    if (req.method === "GET" && singleDeviceMatch) {
      const id = decodeURIComponent(singleDeviceMatch[1]);
      const device = devices.find((d) => d.id === id);
      if (!device) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Device ${id} not found` }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          id: device.id,
          name: device.name,
          paused: isDevicePaused(device),
        }),
      );
      return;
    }

    // POST /pause/:id, /devices/:id/pause, /pause, or /devices/pause
    const pauseMatch =
      pathname.match(/^\/pause\/([^/?#]+)$/) ?? pathname.match(/^\/devices\/([^/?#]+)\/pause$/);
    const isPauseEndpoint =
      Boolean(pauseMatch) || pathname === "/pause" || pathname === "/devices/pause";

    if (req.method === "POST" && isPauseEndpoint) {
      let deviceId = pauseMatch ? decodeURIComponent(pauseMatch[1]) : null;
      if (!deviceId) {
        deviceId = url.searchParams.get("id") ?? url.searchParams.get("deviceId");
      }
      if (!deviceId) {
        try {
          const bodyText = await readBody(req);
          if (bodyText) {
            const parsed = JSON.parse(bodyText) as { id?: string; deviceId?: string };
            deviceId = parsed.id ?? parsed.deviceId ?? null;
          }
        } catch {
          // ignore JSON parse error
        }
      } else {
        req.resume();
      }

      if (!deviceId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing device id" }));
        return;
      }

      pauseDevice(deviceId, devices);
      options.onPause?.(deviceId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          deviceId,
          paused: true,
          message: `Device ${deviceId} paused`,
        }),
      );
      return;
    }

    // POST /resume/:id, /devices/:id/resume, /resume, or /devices/resume
    const resumeMatch =
      pathname.match(/^\/resume\/([^/?#]+)$/) ?? pathname.match(/^\/devices\/([^/?#]+)\/resume$/);
    const isResumeEndpoint =
      Boolean(resumeMatch) || pathname === "/resume" || pathname === "/devices/resume";

    if (req.method === "POST" && isResumeEndpoint) {
      let deviceId = resumeMatch ? decodeURIComponent(resumeMatch[1]) : null;
      if (!deviceId) {
        deviceId = url.searchParams.get("id") ?? url.searchParams.get("deviceId");
      }
      if (!deviceId) {
        try {
          const bodyText = await readBody(req);
          if (bodyText) {
            const parsed = JSON.parse(bodyText) as { id?: string; deviceId?: string };
            deviceId = parsed.id ?? parsed.deviceId ?? null;
          }
        } catch {
          // ignore JSON parse error
        }
      } else {
        req.resume();
      }

      if (!deviceId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing device id" }));
        return;
      }

      resumeDevice(deviceId, devices);
      options.onResume?.(deviceId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          deviceId,
          paused: false,
          message: `Device ${deviceId} resumed`,
        }),
      );
      return;
    }

    req.resume();
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found", path: pathname }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error", message }));
    }
  }
}

export function createControlServer(
  devices: DeviceState[],
  options: ControlServerOptions = {},
): Server {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    void handleControlRequest(req, res, devices, options);
  });
}

export function startControlServer(
  devices: DeviceState[],
  port = 5001,
  host = "0.0.0.0",
): Server {
  const server = createControlServer(devices, {
    onPause: (id) => console.log(`[simulator] Paused device: ${id}`),
    onResume: (id) => console.log(`[simulator] Resumed device: ${id}`),
  });

  server.listen(port, host, () => {
    console.log(
      `[simulator] Control server listening on http://${host === "0.0.0.0" ? "localhost" : host}:${port}`,
    );
  });

  server.on("error", (err: Error) => {
    console.error(`[simulator] Control server error: ${err.message}`);
  });

  return server;
}
