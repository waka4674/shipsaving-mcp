export function formatCurrency(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return "-";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function getLocalTimezoneLabel(): string {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMin);
  const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
  const mm = String(absMin % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm} ${timeZone}`;
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMin = -d.getTimezoneOffset();
    const sign = offsetMin >= 0 ? "+" : "-";
    const absMin = Math.abs(offsetMin);
    const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
    const mm = String(absMin % 60).padStart(2, "0");
    const tzSuffix = `UTC${sign}${hh}:${mm}`;
    const formatted = new Intl.DateTimeFormat("zh-CN", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
    return `${formatted} (${tzSuffix})`;
  } catch {
    return dateStr;
  }
}

interface RateItem {
  rate_id?: string;
  account_name?: string;
  service_name?: string;
  price?: number | string;
  delivery_days?: number | string;
  delivery_date?: string;
  retail_price?: number | string;
  currency?: string;
}

export function formatRatesTable(
  rates: RateItem[],
  cheapest?: RateItem | null,
  fastest?: RateItem | null
): string {
  if (!rates || rates.length === 0) return "未找到可用运费报价。";

  const lines: string[] = [
    `| # | 承运商 | 服务 | 价格 | 预计天数 | 预计送达 | 原价 | 标签 |`,
    `|---|--------|------|------|----------|----------|------|------|`,
  ];

  rates.forEach((r, i) => {
    const carrier = r.account_name ?? "-";
    const service = r.service_name ?? "-";
    const currency = r.currency ?? "";
    const price = r.price != null ? `${currency} ${Number(r.price).toFixed(2)}` : "-";
    const days = r.delivery_days ?? "-";
    const deliveryDate = r.delivery_date ? r.delivery_date.substring(0, 10) : "-";
    const retailPrice = r.retail_price != null ? `${currency} ${Number(r.retail_price).toFixed(2)}` : "-";

    const tags: string[] = [];
    if (cheapest && r.rate_id === cheapest.rate_id) tags.push("💰最便宜");
    if (fastest && r.rate_id === fastest.rate_id) tags.push("⚡最快");

    lines.push(
      `| ${i + 1} | ${carrier} | ${service} | ${price} | ${days}天 | ${deliveryDate} | ${retailPrice} | ${tags.join(" ")} |`
    );
  });

  lines.push("");
  lines.push(`> 各方案 rate_id（用于 pay_shipment / create_shipment）：`);
  rates.forEach((r, i) => {
    if (r.rate_id) {
      lines.push(`> ${i + 1}. ${r.service_name ?? "-"}: \`${r.rate_id}\``);
    }
  });

  return lines.join("\n");
}

export function formatOrderDetail(order: Record<string, unknown>): string {
  const lines: string[] = [`## 订单详情`];
  const shipTo = order.to_address as Record<string, unknown> | undefined;
  const recipientName = shipTo ? `${shipTo.first_name ?? ""} ${shipTo.last_name ?? ""}`.trim() : "-";
  const fields: [string, string][] = [
    ["订单号", String(order.order_number ?? "-")],
    ["订单ID", String(order.order_id ?? "-")],
    ["状态", String(order.status ?? "-")],
    ["收件人", recipientName],
    ["金额", formatCurrency(order.amount as number)],
    ["创建时间", formatDate(order.created_at as string)],
  ];
  for (const [label, value] of fields) {
    lines.push(`- **${label}**: ${value}`);
  }
  return lines.join("\n");
}

export function formatShipmentDetail(shipment: Record<string, unknown>): string {
  const lines: string[] = [`## 运单详情`];
  const rateData = shipment.shipment_rate_data as Record<string, unknown> | undefined;
  const shipTo = shipment.ship_to as Record<string, unknown> | undefined;
  const recipient = shipTo ? `${shipTo.first_name ?? ""} ${shipTo.last_name ?? ""}`.trim() : "-";
  const fields: [string, string][] = [
    ["运单号", String(shipment.shipment_no ?? "-")],
    ["追踪号", String(shipment.tracking_no ?? "-")],
    ["承运商", String(shipment.carrier_code ?? "-")],
    ["服务", String(rateData?.service_name ?? shipment.service_level ?? "-")],
    ["运单状态", String(shipment.shipment_status ?? "-")],
    ["追踪状态", String(shipment.tracking_status ?? "-")],
    ["费用", formatCurrency(shipment.total_fee as number)],
    ["收件人", recipient],
    ["发货日期", formatDate(shipment.ship_date as string)],
    ["支付日期", formatDate(shipment.paid_date as string)],
  ];
  for (const [label, value] of fields) {
    lines.push(`- **${label}**: ${value}`);
  }
  const labelUrls = shipment.label_image_urls as string[] | null;
  if (labelUrls && labelUrls.length > 0) {
    lines.push(`- **面单**: ${labelUrls[0]}`);
  }
  return lines.join("\n");
}

export function formatList(
  items: Record<string, unknown>[],
  fields: { key: string; label: string }[]
): string {
  if (!items || items.length === 0) return "暂无数据。";

  const header = `| ${fields.map((f) => f.label).join(" | ")} |`;
  const sep = `| ${fields.map(() => "---").join(" | ")} |`;
  const rows = items.map(
    (item) =>
      `| ${fields.map((f) => String(item[f.key] ?? "-")).join(" | ")} |`
  );

  return [header, sep, ...rows].join("\n");
}
