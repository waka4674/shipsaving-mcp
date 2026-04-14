import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get, post } from "../client.js";
import { formatError } from "../utils/errors.js";
import { formatList } from "../utils/format.js";

export function registerPackageTools(server: McpServer) {
  server.tool(
    "list_packages",
    "查询已保存的包裹模板列表",
    {
      page: z.number().default(1).describe("页码"),
      page_size: z.number().default(50).describe("每页数量"),
      sort_field: z.string().default("id").describe("排序字段"),
    },
    async ({ page, page_size, sort_field }) => {
      try {
        const data = await get<{ package_data_list: Record<string, unknown>[]; total_count: number }>("/package/query", {
          page, page_size, sort_field,
        });
        const items = data.package_data_list ?? [];
        const total = data.total_count ?? 0;

        // 收集所有有 carrier_package_id 的包裹，查预定义包裹接口补充尺寸
        const hasPredefined = items.some((item) => item.carrier_package_id);
        let predefinedMap: Record<string, Record<string, unknown>> = {};
        if (hasPredefined) {
          try {
            const predefinedData = await get<Record<string, Record<string, unknown>[]>>("/package/query_predefined_packages");
            for (const packages of Object.values(predefinedData)) {
              for (const pkg of packages) {
                if (pkg.id != null) {
                  predefinedMap[String(pkg.id)] = pkg;
                }
              }
            }
          } catch { /* 查询失败不影响主流程 */ }
        }

        // 对预定义包裹填充描述信息
        for (const item of items) {
          if (item.carrier_package_id) {
            const predefined = predefinedMap[String(item.carrier_package_id)];
            if (predefined) {
              item.predefined_name = predefined.name;
              item.predefined_desc = predefined.desc;
            }
          }
        }

        const table = formatList(items, [
          { key: "id", label: "ID" },
          { key: "nick_name", label: "名称" },
          { key: "carrier_package_id", label: "预定义包裹ID" },
          { key: "predefined_name", label: "预定义包裹名称" },
          { key: "predefined_desc", label: "预定义包裹尺寸描述" },
          { key: "length", label: "长" },
          { key: "width", label: "宽" },
          { key: "height", label: "高" },
          { key: "weight", label: "重量" },
          { key: "dimension_unit", label: "长度单位" },
          { key: "weight_unit", label: "重量单位" },
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
    "list_predefined_packages",
    "查询承运商预定义包裹列表。返回按承运商分组的预定义包裹，包含尺寸和重量信息。用户发货时可通过 carrier_package_id 直接引用预定义包裹，无需手动填写尺寸。",
    {},
    async () => {
      try {
        const data = await get<Record<string, Record<string, unknown>[]>>("/package/query_predefined_packages");
        const lines: string[] = [];
        for (const [carrierCode, packages] of Object.entries(data)) {
          lines.push(`## ${carrierCode}`);
          const table = formatList(packages, [
            { key: "id", label: "ID (carrier_package_id)" },
            { key: "name", label: "名称" },
            { key: "code", label: "编码" },
            { key: "package_category", label: "类别" },
            { key: "length", label: "长" },
            { key: "width", label: "宽" },
            { key: "height", label: "高" },
            { key: "dimension_unit", label: "尺寸单位" },
            { key: "weight", label: "重量" },
            { key: "weight_unit", label: "重量单位" },
            { key: "desc", label: "描述" },
          ]);
          lines.push(table);
          lines.push("");
        }
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

  server.tool(
    "create_package",
    "创建包裹模板，方便下次快速使用",
    {
      nick_name: z.string().describe("模板名称"),
      length: z.number().describe("长度"),
      width: z.number().describe("宽度"),
      height: z.number().describe("高度"),
      weight: z.number().describe("重量"),
      dimension_unit: z.string().default("in").describe("长度单位，默认 in"),
      weight_unit: z.string().default("oz").describe("重量单位，默认 oz"),
      package_type: z.string().default("custom").describe("包裹类型，默认 custom"),
      package_category: z.enum(["box_or_thick_parcel", "poly_mailer"]).describe("包裹类别：box_or_thick_parcel（箱子/厚包裹）或 poly_mailer（塑料袋）"),
    },
    async (params) => {
      try {
        await post<boolean>("/package/create", params);
        return {
          content: [{ type: "text" as const, text: "包裹模板创建成功！" }],
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
