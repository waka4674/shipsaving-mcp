import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get } from "../client.js";
import { formatError } from "../utils/errors.js";
import { formatCurrency, formatDateTime, formatList, getLocalTimezoneLabel } from "../utils/format.js";

export function registerBillingTools(server: McpServer) {
  server.tool(
    "get_wallet_info",
    "查询钱包余额信息",
    {},
    async () => {
      try {
        const data = await get<{ balance: number; default_payment_amount: number; open_recharge: number }>("/transaction/wallet/info");
        return {
          content: [{
            type: "text" as const,
            text: `钱包余额: ${formatCurrency(data.balance ?? 0)}\n自动充值金额: ${formatCurrency(data.default_payment_amount ?? 0)}\n自动充值: ${data.open_recharge ? "已开启" : "未开启"}`,
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: formatError(error) }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_transaction_history",
    "查询交易记录",
    {
      start_day: z.string().optional().describe("开始日期，UTC 格式"),
      end_day: z.string().optional().describe("结束日期，UTC 格式"),
      source_type: z.string().optional().describe("来源类型"),
      source_id: z.number().optional().describe("来源ID"),
      tracking_number: z.string().optional().describe("追踪号"),
      page: z.number().default(1).describe("页码"),
      page_size: z.number().default(20).describe("每页数量"),
    },
    async ({ start_day, end_day, source_type, source_id, tracking_number, page, page_size }) => {
      try {
        const data = await get<{ transaction_record_data: Record<string, unknown>[]; total_count: number }>(
          "/transaction/record/page",
          { start_day, end_day, source_type, source_id, tracking_number, page, page_size }
        );
        const records = (data.transaction_record_data ?? []).map((r) => ({
          ...r,
          created_at: formatDateTime(r.created_at as string),
        }));
        const total = data.total_count ?? 0;
        const table = formatList(records, [
          { key: "created_at", label: "时间" },
          { key: "record_source_type", label: "类型" },
          { key: "amount", label: "金额" },
          { key: "currency", label: "币种" },
          { key: "balance", label: "余额" },
          { key: "tracking_number", label: "追踪号" },
          { key: "note", label: "备注" },
        ]);
        return {
          content: [{ type: "text" as const, text: `共 ${total} 条（时间时区：${getLocalTimezoneLabel()}）\n\n${table}` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
