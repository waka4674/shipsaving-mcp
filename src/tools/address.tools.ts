import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get, post } from "../client.js";
import { formatError } from "../utils/errors.js";
import { formatList } from "../utils/format.js";

export function registerAddressTools(server: McpServer) {
  server.tool(
    "list_addresses",
    "查询地址簿中的地址列表",
    {
      address_category: z.string().optional().describe("地址类型：ship_from / ship_to"),
      name: z.string().optional().describe("收件人姓名（first name 或 last name）"),
      phone: z.string().optional().describe("电话号码"),
      address_type: z.string().optional().describe("地址类型：residential / commercial"),
      verified: z.boolean().optional().describe("是否已验证"),
      page: z.number().default(1).describe("页码"),
      page_size: z.number().default(50).describe("每页数量"),
      sort_field: z.string().default("created_at").describe("排序字段"),
      order_by_direction: z.string().default("desc").describe("排序方向：asc / desc"),
    },
    async ({ address_category, name, phone, address_type, verified, page, page_size, sort_field, order_by_direction }) => {
      try {
        const data = await get<{ address_book_data_list: Record<string, unknown>[]; total_count: number }>("/address/query", {
          address_category, name, phone, address_type, verified, page, page_size, sort_field, order_by_direction,
        });
        const records = data.address_book_data_list ?? [];
        const total = data.total_count ?? 0;
        const table = formatList(records, [
          { key: "id", label: "ID" },
          { key: "first_name", label: "名" },
          { key: "last_name", label: "姓" },
          { key: "street", label: "地址" },
          { key: "city", label: "城市" },
          { key: "state", label: "州" },
          { key: "zip_code", label: "邮编" },
          { key: "country", label: "国家" },
        ]);
        return {
          content: [{ type: "text" as const, text: `共 ${total} 条\n\n${table}` }],
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
    "create_address",
    "在地址簿中新建地址",
    {
      first_name: z.string().describe("名"),
      last_name: z.string().describe("姓"),
      company_name: z.string().optional().describe("公司名"),
      email: z.string().optional().describe("邮箱"),
      phone: z.string().min(1).describe("电话（必填，不能为空）"),
      street: z.string().describe("地址行1"),
      street2: z.string().optional().describe("地址行2"),
      city: z.string().describe("城市"),
      state: z.string().describe("州/省"),
      zip_code: z.string().describe("邮编"),
      country: z.string().default("US").describe("国家代码"),
      address_type: z.string().describe("地址类型：residential(居住区) / commercial(商业区)"),
      address_category: z.string().describe("地址分类：ship_from（发件地址）/ ship_to（收件地址）"),
    },
    async (params) => {
      try {
        await post<boolean>("/address/create", params);
        return {
          content: [{ type: "text" as const, text: "地址创建成功！" }],
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
    "update_address",
    "编辑/更新地址簿中已有的地址",
    {
      id: z.number().describe("要更新的地址ID"),
      first_name: z.string().describe("名"),
      last_name: z.string().describe("姓"),
      phone: z.string().min(1).describe("电话（必填，不能为空）"),
      street: z.string().describe("地址行1"),
      city: z.string().describe("城市"),
      state: z.string().describe("州/省"),
      zip_code: z.string().describe("邮编"),
      country: z.string().describe("国家代码"),
      address_type: z.string().describe("地址类型：residential(居住区) / commercial(商业区)"),
      company_name: z.string().optional().describe("公司名称"),
      email: z.string().optional().describe("邮箱"),
      street2: z.string().optional().describe("地址行2"),
      is_default: z.boolean().optional().describe("是否设为默认地址"),
      force_create: z.boolean().optional().default(false).describe("客户强制保存地址（二次确认使用）"),
      latitude: z.number().optional().describe("地址纬度"),
      longitude: z.number().optional().describe("地址经度"),
    },
    async (params) => {
      try {
        await post<boolean>("/address/edit", params);
        return {
          content: [{ type: "text" as const, text: "地址更新成功！" }],
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
    "validate_address",
    "验证地址是否合法、可达",
    {
      street: z.string().describe("地址行1"),
      street2: z.string().optional().describe("地址行2"),
      city: z.string().describe("城市"),
      state: z.string().describe("州/省"),
      zip_code: z.string().describe("邮编"),
      country: z.string().default("US").describe("国家代码"),
    },
    async (params) => {
      try {
        const result = await post<{
          errored: boolean;
          corrected: boolean;
          standardized: boolean;
          residential: boolean | null;
          street: string | null;
          street2: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          country: string | null;
          errors: { message: string }[] | null;
          corrections: unknown | null;
        }>("/address/validate", params);

        if (result.errored) {
          const messages = (result.errors ?? []).map((e) => e.message).join("; ");
          return {
            content: [{ type: "text" as const, text: `❌ 地址验证失败：${messages || "未知错误"}` }],
            isError: true,
          };
        }

        const lines: string[] = ["✅ 地址验证通过！"];
        if (result.corrected || result.standardized) {
          lines.push("");
          lines.push("标准化地址：");
          if (result.street) lines.push(`  街道：${result.street}${result.street2 ? " " + result.street2 : ""}`);
          if (result.city) lines.push(`  城市：${result.city}, ${result.state} ${result.zip_code}`);
          if (result.country) lines.push(`  国家：${result.country}`);
        }
        if (result.residential !== null) {
          lines.push(`  类型：${result.residential ? "住宅 (Residential)" : "商业 (Commercial)"}`);
        }
        if (result.corrected) lines.push("  （地址已被自动修正）");

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
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
