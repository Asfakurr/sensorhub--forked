import { beforeEach, describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createDevices, isDevicePaused, resetPausedDevices } from "./device";
import { handleControlRequest } from "./control";

function createMockReqRes(options: {
  method?: string;
  url?: string;
  body?: string;
}) {
  const req = new Readable({
    read() {
      if (options.body) {
        this.push(options.body);
      }
      this.push(null);
    },
  }) as unknown as IncomingMessage;
  req.method = options.method ?? "GET";
  req.url = options.url ?? "/";
  req.headers = { host: "localhost" };

  let statusCode = 200;
  const headers: Record<string, string> = {};
  let responseData = "";

  const res = {
    headersSent: false,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return res;
    },
    writeHead(status: number, hdrs?: Record<string, string>) {
      statusCode = status;
      this.headersSent = true;
      if (hdrs) {
        for (const [k, v] of Object.entries(hdrs)) {
          headers[k.toLowerCase()] = v;
        }
      }
      return res;
    },
    end(data?: string) {
      if (data) responseData += data;
      return res;
    },
  } as unknown as ServerResponse;

  return {
    req,
    res,
    getResponse: () => ({
      status: statusCode,
      headers,
      body: responseData,
      json: <T = unknown>() => JSON.parse(responseData) as T,
    }),
  };
}

describe("control server handler", () => {
  const devices = createDevices(3, () => 0.5);

  beforeEach(() => {
    resetPausedDevices();
    for (const d of devices) {
      d.paused = false;
    }
  });

  it("GET /status returns status of all simulated devices", async () => {
    const { req, res, getResponse } = createMockReqRes({ url: "/status" });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{
      status: string;
      total: number;
      activeCount: number;
      pausedCount: number;
      devices: Array<{ id: string; name: string; paused: boolean }>;
    }>();
    expect(data.status).toBe("ok");
    expect(data.total).toBe(3);
    expect(data.activeCount).toBe(3);
    expect(data.pausedCount).toBe(0);
    expect(data.devices).toHaveLength(3);
    expect(data.devices[0].id).toBe("dev-001");
    expect(data.devices[0].paused).toBe(false);
  });

  it("GET /devices returns device list", async () => {
    const { req, res, getResponse } = createMockReqRes({ url: "/devices" });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{ devices: Array<{ id: string }> }>();
    expect(data.devices).toHaveLength(3);
  });

  it("GET /devices/:id returns single device status", async () => {
    const { req, res, getResponse } = createMockReqRes({ url: "/devices/dev-001" });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{ id: string; name: string; paused: boolean }>();
    expect(data.id).toBe("dev-001");
    expect(data.paused).toBe(false);
  });

  it("GET /devices/:id returns 404 for unknown device", async () => {
    const { req, res, getResponse } = createMockReqRes({ url: "/devices/dev-999" });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(404);
  });

  it("POST /pause/:id pauses the target device", async () => {
    const { req, res, getResponse } = createMockReqRes({
      method: "POST",
      url: "/pause/dev-001",
    });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{ success: boolean; deviceId: string; paused: boolean }>();
    expect(data.success).toBe(true);
    expect(data.deviceId).toBe("dev-001");
    expect(data.paused).toBe(true);
    expect(isDevicePaused("dev-001")).toBe(true);
    expect(isDevicePaused(devices[0])).toBe(true);
  });

  it("POST /devices/:id/pause pauses the target device", async () => {
    const { req, res, getResponse } = createMockReqRes({
      method: "POST",
      url: "/devices/dev-002/pause",
    });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{ success: boolean; deviceId: string; paused: boolean }>();
    expect(data.success).toBe(true);
    expect(data.deviceId).toBe("dev-002");
    expect(data.paused).toBe(true);
    expect(isDevicePaused("dev-002")).toBe(true);
  });

  it("POST /resume/:id resumes a paused device", async () => {
    // First pause
    const pauseReq = createMockReqRes({ method: "POST", url: "/pause/dev-001" });
    await handleControlRequest(pauseReq.req, pauseReq.res, devices);

    // Then resume
    const { req, res, getResponse } = createMockReqRes({
      method: "POST",
      url: "/resume/dev-001",
    });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{ success: boolean; deviceId: string; paused: boolean }>();
    expect(data.success).toBe(true);
    expect(data.deviceId).toBe("dev-001");
    expect(data.paused).toBe(false);
    expect(isDevicePaused("dev-001")).toBe(false);
  });

  it("POST /devices/:id/resume resumes a paused device", async () => {
    // First pause
    const pauseReq = createMockReqRes({ method: "POST", url: "/devices/dev-003/pause" });
    await handleControlRequest(pauseReq.req, pauseReq.res, devices);

    // Then resume
    const { req, res, getResponse } = createMockReqRes({
      method: "POST",
      url: "/devices/dev-003/resume",
    });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{ success: boolean; deviceId: string; paused: boolean }>();
    expect(data.success).toBe(true);
    expect(data.deviceId).toBe("dev-003");
    expect(data.paused).toBe(false);
    expect(isDevicePaused("dev-003")).toBe(false);
  });

  it("POST /pause with JSON body pauses the device", async () => {
    const { req, res, getResponse } = createMockReqRes({
      method: "POST",
      url: "/pause",
      body: JSON.stringify({ deviceId: "dev-002" }),
    });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{ success: boolean; deviceId: string; paused: boolean }>();
    expect(data.success).toBe(true);
    expect(data.deviceId).toBe("dev-002");
    expect(isDevicePaused("dev-002")).toBe(true);
  });

  it("POST /pause?id=dev-001 pauses the device via query parameter", async () => {
    const { req, res, getResponse } = createMockReqRes({
      method: "POST",
      url: "/pause?id=dev-001",
    });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(200);
    const data = response.json<{ success: boolean; deviceId: string }>();
    expect(data.deviceId).toBe("dev-001");
    expect(isDevicePaused("dev-001")).toBe(true);
  });

  it("returns 400 when device id is missing", async () => {
    const { req, res, getResponse } = createMockReqRes({
      method: "POST",
      url: "/pause",
    });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(400);
  });

  it("returns 404 for unknown endpoints", async () => {
    const { req, res, getResponse } = createMockReqRes({ url: "/unknown" });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(404);
  });

  it("handles OPTIONS request with 204", async () => {
    const { req, res, getResponse } = createMockReqRes({ method: "OPTIONS", url: "/status" });
    await handleControlRequest(req, res, devices);
    const response = getResponse();
    expect(response.status).toBe(204);
  });
});
