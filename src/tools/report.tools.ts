import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get } from "../client.js";
import { formatError } from "../utils/errors.js";
import { formatCurrency } from "../utils/format.js";

export function registerReportTools(server: McpServer) {
  server.tool(
    "get_total_savings",
    "查看使用 ShipSaving 节省的总金额",
    {},
    async () => {
      try {
        const data = await get<number>("/shipment/report/total_saving");
        return {
          content: [{
            type: "text" as const,
            text: `节省总金额: ${formatCurrency(data ?? 0)}`,
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
    "get_shipping_analysis",
    "按时间维度分析运费数据。调用前必须先询问用户选择时间范围，可选值：the_last_7_days（近7天）、the_last_30_days（近30天）、this_month（本月）、last_month（上月）、current_year（今年）、last_year（去年）。",
    {
      date_range: z.enum(["the_last_7_days", "the_last_30_days", "this_month", "last_month", "current_year", "last_year"])
        .describe("时间范围：the_last_7_days / the_last_30_days / this_month / last_month / current_year / last_year"),
    },
    async ({ date_range }) => {
      try {
        const data = await get<Record<string, unknown>>("/shipment/report/analysis_by_time", { date_range });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
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
