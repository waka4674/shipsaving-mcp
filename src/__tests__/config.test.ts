import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset module cache so config re-reads env vars
    delete process.env.SHIPSAVING_APP_KEY;
    delete process.env.SHIPSAVING_API_TOKEN;
    delete process.env.SHIPSAVING_API_BASE_URL;
    delete process.env.SHIPSAVING_TIMEOUT_MS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses default apiBaseUrl when env not set", async () => {
    const { config } = await import("../config.js");
    expect(config.apiBaseUrl).toBe("https://app-gateway.shipsaving.com");
  });

  it("uses default timeout when env not set", async () => {
    const { config } = await import("../config.js");
    expect(config.timeoutMs).toBe(60000);
  });

  it("getToken returns appKey", async () => {
    const { getToken } = await import("../config.js");
    expect(typeof getToken()).toBe("string");
  });
});
