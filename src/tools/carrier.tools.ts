import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { get } from "../client.js";
import { formatError } from "../utils/errors.js";
import { formatList } from "../utils/format.js";

export function registerCarrierTools(server: McpServer) {
  server.tool(
    "list_carriers",
    "查询已连接的承运商账户列表",
    {},
    async () => {
      try {
        const data = await get<Record<string, unknown>[]>("/carrier_account/query_all");
        const items = Array.isArray(data) ? data : [];
        const table = formatList(items, [
          { key: "id", label: "账户ID" },
          { key: "carrier_code", label: "承运商代码" },
          { key: "name", label: "承运商名称" },
          { key: "is_active", label: "已启用" },
        ]);
        return {
          content: [{ type: "text" as const, text: table }],
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
    "get_service_levels",
    "查询客户生效中的承运商服务级别",
    {},
    async () => {
      try {
        const data = await get<Record<string, unknown[]>>("/carrier_account/get_customer_service_level");
        const lines: string[] = [];
        for (const [carrier, levels] of Object.entries(data ?? {})) {
          lines.push(`\n**${carrier}**`);
          for (const level of levels as Record<string, unknown>[]) {
            lines.push(`- ${level.name ?? "-"} (${level.code ?? "-"})`);
          }
        }
        return {
          content: [{ type: "text" as const, text: lines.length ? lines.join("\n") : "暂无数据。" }],
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
