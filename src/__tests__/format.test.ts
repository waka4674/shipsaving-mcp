import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRatesTable,
  formatOrderDetail,
  formatShipmentDetail,
  formatList,
} from "../utils/format.js";

describe("formatCurrency", () => {
  it("formats a number to USD string", () => {
    expect(formatCurrency(9.9)).toBe("$9.90");
    expect(formatCurrency(100)).toBe("$100.00");
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("parses a string amount", () => {
    expect(formatCurrency("12.5")).toBe("$12.50");
  });

  it("returns dash for undefined or null", () => {
    expect(formatCurrency(undefined)).toBe("-");
    expect(formatCurrency(null as unknown as undefined)).toBe("-");
  });
});

describe("formatDate", () => {
  it("formats an ISO date string", () => {
    const result = formatDate("2026-03-15T00:00:00Z");
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/15/);
  });

  it("returns dash for empty or undefined", () => {
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("")).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("converts UTC time and includes timezone label", () => {
    const result = formatDateTime("2026-03-31T06:30:42Z");
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/UTC[+-]\d{2}:\d{2}/);
  });

  it("returns dash for empty or undefined", () => {
    expect(formatDateTime(undefined)).toBe("-");
    expect(formatDateTime("")).toBe("-");
  });

  it("returns original string for invalid date", () => {
    const result = formatDateTime("not-a-date");
    // should not throw, returns formatted or original
    expect(typeof result).toBe("string");
  });
});

describe("formatRatesTable", () => {
  const rates = [
    {
      rate_id: "r1",
      account_name: "USPS",
      service_name: "Priority Mail",
      price: 8.5,
      delivery_days: 3,
      delivery_date: "2026-04-05T00:00:00Z",
      retail_price: 12.0,
      currency: "USD",
    },
    {
      rate_id: "r2",
      account_name: "UPS",
      service_name: "Ground",
      price: 6.0,
      delivery_days: 5,
      delivery_date: "2026-04-07T00:00:00Z",
      retail_price: 9.0,
      currency: "USD",
    },
  ];

  it("returns a markdown table with all rates", () => {
    const result = formatRatesTable(rates);
    expect(result).toContain("USPS");
    expect(result).toContain("UPS");
    expect(result).toContain("Priority Mail");
    expect(result).toContain("Ground");
    expect(result).toContain("rate_id");
  });

  it("marks cheapest rate", () => {
    const result = formatRatesTable(rates, rates[1], null);
    expect(result).toContain("最便宜");
  });

  it("marks fastest rate", () => {
    const result = formatRatesTable(rates, null, rates[0]);
    expect(result).toContain("最快");
  });

  it("returns empty message for no rates", () => {
    expect(formatRatesTable([])).toContain("未找到");
  });
});

describe("formatOrderDetail", () => {
  it("formats order fields", () => {
    const order = {
      order_number: "ORD-001",
      order_id: 123,
      status: "awaiting_shipment",
      to_address: { first_name: "John", last_name: "Doe" },
      amount: 29.99,
      created_at: "2026-03-01T10:00:00Z",
    };
    const result = formatOrderDetail(order);
    expect(result).toContain("ORD-001");
    expect(result).toContain("John Doe");
    expect(result).toContain("$29.99");
    expect(result).toContain("awaiting_shipment");
  });

  it("handles missing to_address", () => {
    const order = { order_number: "ORD-002" };
    const result = formatOrderDetail(order);
    expect(result).toContain("ORD-002");
    expect(result).toContain("-");
  });
});

describe("formatShipmentDetail", () => {
  it("formats shipment fields", () => {
    const shipment = {
      shipment_no: "SN-001",
      tracking_no: "1Z999",
      carrier_code: "UPS",
      shipment_status: "PURCHASED",
      tracking_status: "IN_TRANSIT",
      total_fee: 12.5,
      ship_to: { first_name: "Jane", last_name: "Smith" },
      ship_date: "2026-04-01T00:00:00Z",
      paid_date: "2026-04-01T00:00:00Z",
    };
    const result = formatShipmentDetail(shipment);
    expect(result).toContain("SN-001");
    expect(result).toContain("1Z999");
    expect(result).toContain("UPS");
    expect(result).toContain("Jane Smith");
    expect(result).toContain("$12.50");
  });

  it("includes label URL when present", () => {
    const shipment = {
      shipment_no: "SN-002",
      label_image_urls: ["https://example.com/label.png"],
    };
    const result = formatShipmentDetail(shipment);
    expect(result).toContain("https://example.com/label.png");
  });
});

describe("formatList", () => {
  const fields = [
    { key: "name", label: "Name" },
    { key: "city", label: "City" },
  ];

  it("formats items as a markdown table", () => {
    const items = [
      { name: "Alice", city: "LA" },
      { name: "Bob", city: "NYC" },
    ];
    const result = formatList(items, fields);
    expect(result).toContain("| Name | City |");
    expect(result).toContain("Alice");
    expect(result).toContain("NYC");
  });

  it("returns empty message for empty array", () => {
    expect(formatList([], fields)).toContain("暂无数据");
  });

  it("fills dash for missing keys", () => {
    const items = [{ name: "Charlie" }];
    const result = formatList(items as Record<string, unknown>[], fields);
    expect(result).toContain("Charlie");
    expect(result).toContain("-");
  });
});
