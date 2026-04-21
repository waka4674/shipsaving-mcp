import { describe, it, expect } from "vitest";
import { ApiError, formatError } from "../utils/errors.js";

describe("ApiError", () => {
  it("creates an error with code and message", () => {
    const err = new ApiError(404, "Not found");
    expect(err.code).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.name).toBe("ApiError");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("formatError", () => {
  it("returns friendly message for known codes", () => {
    expect(formatError(new ApiError(401, "unauthorized"))).toContain("Authentication failed");
    expect(formatError(new ApiError(402, "low balance"))).toContain("Insufficient balance");
    expect(formatError(new ApiError(403, "forbidden"))).toContain("Permission denied");
    expect(formatError(new ApiError(404, "missing"))).toContain("not found");
    expect(formatError(new ApiError(429, "throttled"))).toContain("Too many requests");
  });

  it("includes original message in parentheses for known codes", () => {
    const result = formatError(new ApiError(401, "bad token"));
    expect(result).toContain("(bad token)");
  });

  it("returns generic error for unknown codes", () => {
    const result = formatError(new ApiError(500, "server error"));
    expect(result).toBe("Error: server error");
  });

  it("handles non-ApiError errors", () => {
    const result = formatError(new Error("something broke"));
    expect(result).toContain("Unknown error");
    expect(result).toContain("something broke");
  });
});
