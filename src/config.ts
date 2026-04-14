export const config = {
  apiBaseUrl: process.env.SHIPSAVING_API_BASE_URL || "https://pro-service.shipsaving.us",
  appKey: process.env.SHIPSAVING_APP_KEY || process.env.SHIPSAVING_API_TOKEN || "",
  timeoutMs: parseInt(process.env.SHIPSAVING_TIMEOUT_MS || "60000", 10),
};

export function getToken(): string {
  return config.appKey;
}
