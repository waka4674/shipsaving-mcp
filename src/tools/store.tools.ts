import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { get } from "../client.js";
import { formatError } from "../utils/errors.js";
import { formatList } from "../utils/format.js";

export function registerStoreTools(server: McpServer) {
  server.tool(
    "list_stores",
    "查询已连接的电商店铺列表",
    {},
    async () => {
      try {
        const data = await get<Record<string, unknown>[]>("/store/query_all");
        const items = Array.isArray(data) ? data : [];
        const table = formatList(items, [
          { key: "store_id", label: "ID" },
          { key: "nick_name", label: "店铺名" },
          { key: "platform", label: "平台" },
          { key: "status", label: "状态" },
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
}
