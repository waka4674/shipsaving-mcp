import { randomUUID } from "crypto";
import { config, getToken } from "./config.js";
import { ApiError } from "./utils/errors.js";

// MCP stdio transport occupies stdout; all logs must go to stderr and optionally to a log file
import { appendFileSync } from "fs";
const LOG_FILE = process.env.SHIPSAVING_LOG_FILE || "";
const logInfo = (msg: string) => {
  const line = `[INFO] ${new Date().toISOString()} ${msg}\n`;
  process.stderr.write(line);
  if (LOG_FILE) {
    try { appendFileSync(LOG_FILE, line); } catch { /* ignore */ }
  }
};

interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export async function apiRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  params?: Record<string, unknown>
): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, "App key not configured. Please set the SHIPSAVING_APP_KEY environment variable.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Fingerprint-Request-Id": randomUUID(),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let url = `${config.apiBaseUrl}${path}`;
  let body: string | undefined;

  if (method === "GET" && params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  } else if (method === "POST" && params) {
    body = JSON.stringify(params);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    console.error(`[API] ${method} ${url}`);
    if (body) console.error(`[API] Body: ${body}`);
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    const text = await response.text();
    logInfo(`[API] Response ${response.status}: ${text.substring(0, 500)}`);

    let json: ApiResponse<T>;
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      throw new ApiError(response.status, `Failed to parse response: ${text.substring(0, 200)}`);
    }

    const isSuccess = response.ok && (json.code === 200 || json.code === 0 || json.msg === "ok");
    logInfo(`[API] Response Data: ${JSON.stringify(json.data)}`);
    if (!isSuccess) {
      const code = json.code || response.status;
      const msg = json.msg || response.statusText;
      throw new ApiError(code, msg);
    }

    return json.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, "Request timed out. Please try again later.");
    }
    throw new ApiError(500, `Request failed: ${(error as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}

export function get<T = unknown>(
  path: string,
  params?: Record<string, unknown>
): Promise<T> {
  return apiRequest<T>("GET", path, params);
}

export function post<T = unknown>(
  path: string,
  data?: Record<string, unknown>
): Promise<T> {
  return apiRequest<T>("POST", path, data);
}
