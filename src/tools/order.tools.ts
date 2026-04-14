import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get, post } from "../client.js";
import { formatError } from "../utils/errors.js";
import { formatList } from "../utils/format.js";

export function registerOrderTools(server: McpServer) {
  server.tool(
    "search_orders",
    "搜索订单列表，支持按状态、店铺、日期、关键词等筛选。当用户提供了类似 ID 的内容（如订单号、追踪号、订单ID等），必须通过 hybrid 参数传入进行搜索。",
    {
      status: z.string().optional().describe("订单状态：AWAITING / SHIPPED / CANCEL"),
      store_id: z.number().optional().describe("店铺ID"),
      carrier_code: z.string().optional().describe("承运商代码（已发货订单）"),
      from_order_date: z.string().optional().describe("订单开始日期，如 2024-11-10T00:00:00Z"),
      to_order_date: z.string().optional().describe("订单结束日期，如 2024-11-10T00:00:00Z"),
      destination_type: z.string().optional().describe("收件地址类型：DOMESTIC / INTERNATIONAL"),
      filter_combined: z.boolean().optional().describe("筛选合并订单"),
      filter_split: z.boolean().optional().describe("筛选拆分订单"),
      item_name: z.string().optional().describe("商品名称"),
      item_sku: z.string().optional().describe("商品SKU"),
      to_city: z.string().optional().describe("收件城市"),
      hybrid: z.string().optional().describe("混合搜索：当用户提供任何类似 ID 的内容（订单号、追踪号、订单ID等）时，通过此参数传入。支持追踪号/订单号精确搜索、收件人姓名模糊搜索"),
      tag_ids: z.array(z.number()).optional().describe("标签ID列表"),
      has_order_note: z.boolean().optional().describe("是否有订单备注"),
      page_no: z.number().default(1).describe("页码"),
      page_size: z.number().default(50).describe("每页数量，最大200"),
    },
    async ({ status, store_id, carrier_code, from_order_date, to_order_date,
             destination_type, filter_combined, filter_split, item_name, item_sku,
             to_city, hybrid, tag_ids, has_order_note, page_no, page_size }) => {
      try {
        const data = await get<{ orders: Record<string, unknown>[]; count: number }>(
          "/order/search_orders",
          { status, store_id, carrier_code, from_order_date, to_order_date,
            destination_type, filter_combined, filter_split, item_name, item_sku,
            to_city, hybrid, tag_ids, has_order_note, page_no, page_size }
        );
        const records = data.orders ?? [];
        const total = data.count ?? 0;
        const table = formatList(records, [
          { key: "order_number", label: "订单号" },
          { key: "status", label: "状态" },
          { key: "order_id", label: "订单ID" },
          { key: "shipping_service", label: "运输服务" },
          { key: "amount", label: "金额" },
          { key: "order_date", label: "订单日期" },
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
    "get_order_detail",
    "查看订单详细信息",
    {
      order_id: z.number().describe("订单ID"),
    },
    async ({ order_id }) => {
      try {
        const data = await get<Record<string, unknown>>("/order/order_detail", { order_id });
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

  server.tool(
    "create_order",
    "手动创建订单。【重要】调用此接口前必须先准备好所有信息：1) 如果用户指定了地址簿ID，先调用 list_addresses 获取该地址的完整信息；2) 确认订单号、商品信息（名称、数量、单价）齐全；3) 缺少任何必填信息时必须先向用户询问，不得传空值调用接口。",
    {
      order_number: z.string().describe("订单号"),
      to_address: z.object({
        id: z.number().optional().describe("地址簿中的地址ID"),
        first_name: z.string().describe("收件人名"),
        last_name: z.string().describe("收件人姓"),
        company_name: z.string().optional().describe("公司名"),
        phone: z.string().optional().describe("电话"),
        email: z.string().optional().describe("邮箱"),
        street: z.string().describe("地址行1"),
        street2: z.string().optional().describe("地址行2"),
        city: z.string().describe("城市"),
        state: z.string().describe("州/省"),
        zip_code: z.string().describe("邮编"),
        country: z.string().describe("国家代码"),
        address_type: z.enum(["residential", "commercial"]).optional().describe("地址类型"),
        address_category: z.string().optional().describe("地址分类：ship_from / ship_to"),
        verified: z.boolean().optional().describe("是否已验证"),
        is_default: z.boolean().optional().describe("是否默认地址"),
        latitude: z.number().optional().describe("纬度"),
        longitude: z.number().optional().describe("经度"),
      }).describe("收件地址（必须传完整地址信息，即使引用地址簿也需要填入所有字段）"),
      order_items: z.array(z.object({
        item_name: z.string().describe("商品名称"),
        item_quantity: z.number().describe("数量"),
        item_unit_price: z.number().optional().describe("单价"),
        item_currency: z.string().optional().describe("商品币种"),
        item_sku: z.string().optional().describe("SKU"),
        item_url: z.string().optional().describe("商品图片链接"),
        item_weight: z.number().optional().describe("商品重量"),
        item_weight_unit: z.string().optional().describe("重量单位：LB / OZ / G / KG"),
      })).describe("订单商品列表"),
      amount: z.number().optional().describe("订单总金额"),
      currency: z.string().optional().describe("币种，如 USD"),
      order_date: z.string().optional().describe("订单日期，ISO 8601 格式，如 2026-04-11T09:36:01Z"),
      timezone: z.string().optional().describe("时区ID，如 Asia/Shanghai，为空则默认 UTC"),
    },
    async (params) => {
      try {
        await post("/order/create_onsite", params);
        return {
          content: [{ type: "text" as const, text: "订单创建成功！" }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: formatError(error) }],
          isError: true,
        };
      }
    }
  );

  const AddressSchema = z.object({
    first_name: z.string().describe("名"),
    last_name: z.string().describe("姓"),
    company_name: z.string().optional().describe("公司名"),
    email: z.string().optional().describe("邮箱"),
    phone: z.string().optional().describe("电话"),
    street: z.string().describe("地址行1"),
    street2: z.string().optional().describe("地址行2"),
    city: z.string().describe("城市"),
    state: z.string().describe("州/省代码"),
    zip_code: z.string().describe("邮编"),
    country: z.string().default("US").describe("国家代码"),
    address_type: z.enum(["residential", "commercial"]).optional().describe("地址类型"),
    save_address: z.boolean().optional().default(false).describe("是否保存到地址簿"),
  });

  server.tool(
    "buy_label_from_order",
    "通过已有订单打单（购买面单）。当用户要对订单打单时，必须使用此工具，不得使用 create_draft_shipment + pay_shipment 流程。需要先通过 get_shipping_rates 获取 rate_id。",
    {
      order_id: z.number().describe("订单ID"),
      rate_id: z.string().describe("报价ID，从 get_shipping_rates 获取"),
      from_address_data: AddressSchema.describe("寄件地址"),
      to_address_data: AddressSchema.describe("收件地址"),
      package_data: z.object({
        carrier_package_id: z.string().optional().describe("预定义包裹ID，如果使用预定义包裹则传此字段，尺寸由系统自动填充，无需再传 length/width/height"),
        type: z.string().default("custom").describe("包裹类型"),
        package_type: z.string().optional().describe("package_type"),
        package_category: z.string().optional().describe("包裹类别，如 box_or_thick_parcel"),
        length: z.number().optional().describe("长度（使用预定义包裹时可不传）"),
        width: z.number().optional().describe("宽度（使用预定义包裹时可不传）"),
        height: z.number().optional().describe("高度（使用预定义包裹时可不传）"),
        dimension_unit: z.enum(["in", "cm"]).default("in").describe("尺寸单位"),
        weight: z.number().describe("重量"),
        weight_unit: z.enum(["lb", "oz", "kg", "g"]).default("oz").describe("重量单位"),
      }).describe("包裹信息"),
      ship_date: z.string().optional().describe("发货日期，ISO 8601 格式，如 2026-03-31T13:37:24+08:00"),
      label_print_type: z.enum(["common", "qrcode", "barcode"]).optional().default("common").describe("面单打印格式"),
      international: z.boolean().optional().default(false).describe("是否为国际件"),
      option_data: z.object({
        signature: z.enum(["signature", "adult_signature"]).optional().describe("签名要求"),
        custom_text_on_label_1: z.string().optional().describe("面单自定义文字行1"),
        custom_text_on_label_2: z.string().optional().describe("面单自定义文字行2"),
        hazardous_materials: z.boolean().optional().describe("是否包含危险品"),
        additional_handing: z.boolean().optional().describe("是否为异形或难处理货物"),
      }).optional().describe("运单附加选项"),
    },
    async ({ order_id, rate_id, from_address_data, to_address_data, package_data,
             ship_date, label_print_type, international, option_data }) => {
      try {
        const result = await post<string>("/order/buy_label_from_order", {
          order_id, rate_id, from_address_data, to_address_data, package_data,
          ship_date, label_print_type, international, option_data,
        });
        return {
          content: [{ type: "text" as const, text: `面单购买成功！运单号: ${result ?? "-"}` }],
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
    "mark_order_shipped",
    "标记订单为已发货状态",
    {
      order_id: z.number().describe("订单ID"),
    },
    async ({ order_id }) => {
      try {
        await post("/order/change_to_shipped", { order_id });
        return {
          content: [{ type: "text" as const, text: "订单已标记为已发货。" }],
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
    "cancel_order",
    "取消订单",
    {
      order_id: z.number().describe("订单ID"),
    },
    async ({ order_id }) => {
      try {
        await post("/order/change_to_cancel", { order_id });
        return {
          content: [{ type: "text" as const, text: "订单已取消。" }],
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
    "sync_store_orders",
    "手动触发店铺订单同步。同步成功后，必须立即调用 search_orders（传入相同的 store_id，status 为 AWAITING）查询刚同步过来的订单并展示给用户。",
    {
      store_id: z.number().describe("店铺ID"),
      platform: z.string().describe("平台名称，如 shopify / ecwid"),
    },
    async ({ store_id, platform }) => {
      try {
        const taskId = await post<number>("/order/sync", { store_id, platform });
        return {
          content: [{ type: "text" as const, text: `订单同步已触发，任务ID: ${taskId ?? "-"}` }],
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
    "get_order_tags",
    "查询所有订单标签",
    {},
    async () => {
      try {
        const data = await get<Record<string, unknown>[]>("/order/tag/query_tags");
        const table = formatList(data ?? [], [
          { key: "id", label: "ID" },
          { key: "desc", label: "标签名" },
          { key: "color", label: "颜色" },
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
