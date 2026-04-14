import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get, post } from "../client.js";
import { formatError } from "../utils/errors.js";
import { formatRatesTable, formatShipmentDetail, formatList } from "../utils/format.js";

const AddressSchema = z.object({
  first_name: z.string().describe("名"),
  last_name: z.string().describe("姓"),
  company_name: z.string().optional().default("").describe("公司名"),
  email: z.string().optional().default("").describe("邮箱"),
  phone: z.string().optional().default("").describe("电话"),
  street: z.string().describe("地址行1"),
  street2: z.string().optional().default("").describe("地址行2"),
  city: z.string().describe("城市"),
  state: z.string().describe("州/省代码"),
  zip_code: z.string().describe("邮编"),
  country: z.string().default("US").describe("国家代码，如 US / CA"),
  address_type: z.enum(["residential", "commercial"]).default("residential").describe("地址类型"),
  save_address: z.boolean().optional().default(false).describe("是否保存到地址簿"),
});

const PackageSchema = z.object({
  carrier_package_id: z.string().optional().describe("预定义包裹ID，如果使用预定义包裹则传此字段，尺寸由系统自动填充，无需再传 length/width/height"),
  length: z.number().optional().describe("长度（使用预定义包裹时可不传）"),
  width: z.number().optional().describe("宽度（使用预定义包裹时可不传）"),
  height: z.number().optional().describe("高度（使用预定义包裹时可不传）"),
  weight: z.number().describe("重量"),
  weight_unit: z.enum(["g", "oz", "lb", "kg"]).default("oz").describe("重量单位"),
  dimension_unit: z.enum(["cm", "in"]).default("in").describe("尺寸单位"),
  type: z.string().default("custom").describe("包裹类型"),
});

export function registerShipmentTools(server: McpServer) {
  server.tool(
    "get_shipping_rates",
    "获取多承运商运费报价比价。需提供寄件地址、收件地址、包裹信息和 ship_date。返回所有可用运费方案，标记最便宜和最快选项。",
    {
      from_address_data: AddressSchema.describe("寄件地址"),
      to_address_data: AddressSchema.describe("收件地址"),
      package_data: PackageSchema.describe("包裹信息"),
      ship_date: z.string().optional().describe("发货日期，ISO 8601 格式，如 2025-12-14T00:00:00+08:00"),
    },
    async ({ from_address_data, to_address_data, package_data, ship_date }) => {
      try {
        const data = await post<Record<string, unknown>>("/shipment/get_rates", {
          from_address_data,
          to_address_data,
          package_data,
          ship_date,
        });
        const rates = (data.shipment_rate_data as Record<string, unknown>[]) ?? [];
        const cheapest = data.cheapest as Record<string, unknown> | null;
        const fastest = data.fastest as Record<string, unknown> | null;
        return {
          content: [{ type: "text" as const, text: formatRatesTable(rates, cheapest, fastest) }],
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
    "search_shipments",
    "搜索运单列表，支持多种条件筛选",
    {
      shipment_no: z.string().optional().describe("运单号"),
      search_key: z.string().optional().describe("搜索关键字：支持 shipment id 精确搜索、tracking number 精确搜索、收件人姓名模糊搜索"),
      tracking_no: z.string().optional().describe("追踪号"),
      recipient_name: z.string().optional().describe("收件人姓名"),
      recipient_city: z.string().optional().describe("收件人城市"),
      label_print_type: z.string().optional().describe("label打印方式：label / qr_code / bar_code"),
      shipment_status: z.string().optional().describe("运单状态"),
      shipment_status_list: z.string().optional().describe("运单状态（多选，逗号分隔）"),
      tracking_status: z.string().optional().describe("承运商运单状态"),
      carrier_code: z.string().optional().describe("承运商代码，如 USPS / UPS"),
      account_id: z.number().optional().describe("承运商账户 ID"),
      provider_id: z.string().optional().describe("Provider ID"),
      store_name: z.string().optional().describe("店铺名字"),
      store_id: z.number().optional().describe("店铺 ID"),
      first_name: z.string().optional().describe("收件人名"),
      last_name: z.string().optional().describe("收件人姓"),
      destination_type: z.string().optional().describe("收件地址类型：DOMESTIC / INTERNATIONAL"),
      search_start_date: z.string().optional().describe("创建开始日期，如 2024-11-10T00:00:00Z"),
      search_end_date: z.string().optional().describe("创建结束日期，如 2024-11-10T00:00:00Z"),
      page: z.number().default(1).describe("页码"),
      page_size: z.number().default(50).describe("每页数量"),
    },
    async ({ shipment_no, search_key, tracking_no, recipient_name, recipient_city,
             label_print_type, shipment_status, shipment_status_list, tracking_status,
             carrier_code, account_id, provider_id, store_name, store_id,
             first_name, last_name, destination_type, search_start_date, search_end_date,
             page, page_size }) => {
      try {
        const data = await get<{ shipment_data_list: Record<string, unknown>[]; total_count: number }>("/shipment/search", {
          shipment_no, search_key, tracking_no, recipient_name, recipient_city,
          label_print_type, shipment_status, shipment_status_list, tracking_status,
          carrier_code, account_id, provider_id, store_name, store_id,
          first_name, last_name, destination_type, search_start_date, search_end_date,
          page, page_size,
        });
        const records = data.shipment_data_list ?? [];
        const total = data.total_count ?? 0;
        const table = formatList(records, [
          { key: "shipment_no", label: "运单号" },
          { key: "tracking_no", label: "追踪号" },
          { key: "carrier_code", label: "承运商" },
          { key: "service_level", label: "服务" },
          { key: "shipment_status", label: "状态" },
          { key: "total_fee", label: "费用" },
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
    "get_shipment_detail",
    "查看运单详细信息",
    {
      shipment_no: z.string().describe("运单号"),
    },
    async ({ shipment_no }) => {
      try {
        const data = await get<Record<string, unknown>>("/shipment/detail", {
          shipment_no,
        });
        return {
          content: [{ type: "text" as const, text: formatShipmentDetail(data) }],
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
    "track_shipment",
    "通过追踪号查询物流状态",
    {
      trackingNo: z.string().describe("快递追踪号"),
    },
    async ({ trackingNo }) => {
      try {
        const data = await get<Record<string, unknown>>("/shipment/detail/get_by_tracking_no", {
          tracking_no: trackingNo,
        });
        const detail = formatShipmentDetail(data);
        const events = (data.trackingEvents ?? data.tracking_events ?? []) as Record<string, unknown>[];
        let eventText = "";
        if (events.length > 0) {
          eventText = "\n\n### 物流轨迹\n";
          for (const e of events) {
            eventText += `- **${e.datetime ?? e.date ?? ""}** ${e.message ?? e.description ?? ""} (${e.location ?? ""})\n`;
          }
        }
        return {
          content: [{ type: "text" as const, text: `${detail}${eventText}` }],
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
    "get_insurance_rates",
    "查询保险价格。根据保额和服务等级返回保险费率信息。",
    {
      declared_value: z.number().describe("保额（投保金额）"),
      service_level: z.string().describe("服务等级代码，从 get_shipping_rates 返回结果中获取，如 USPS_GROUND_ADVANTAGE"),
    },
    async ({ declared_value, service_level }) => {
      try {
        const data = await get<Record<string, unknown>>("/shipment/insurance/rate", {
          declared_value,
          service_level,
        });
        const lines = [
          `承运商: ${data.carrier ?? ""}`,
          `服务等级: ${data.service_level ?? ""}`,
          `保额: ${data.declared_value ?? ""}`,
          `保险费: ${data.rate ?? ""}`,
          `费率ID: ${data.rate_id ?? ""}`,
        ];
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
    "create_draft_shipment",
    "标准下单流程第二步：创建运单草稿（不立即付款）。在 get_shipping_rates 之后、pay_shipment 之前调用。保存地址和包裹信息，等用户确认后再付款。",
    {
      from_address_data: AddressSchema.describe("寄件地址"),
      to_address_data: AddressSchema.describe("收件地址"),
      package_data: PackageSchema.describe("包裹信息"),
      cheapest_rate_id: z.string().optional().describe("最便宜报价的 rate_id（可从 get_shipping_rates 获取）"),
      label_print_type: z.enum(["common", "qrcode", "barcode"]).optional().describe("面单打印格式"),
      option_data: z.object({
        signature: z.enum(["signature", "adult_signature"]).optional().describe("签名要求：signature（普通签收）或 adult_signature（成人签收）"),
        custom_text_on_label_1: z.string().optional().describe("面单自定义文字行1（勾选 Custom text on label 后填写）"),
        custom_text_on_label_2: z.string().optional().describe("面单自定义文字行2（勾选 Custom text on label 后填写，可选）"),
        hazardous_materials: z.boolean().optional().describe("是否包含危险品或危险材料"),
        additional_handing: z.boolean().optional().describe("是否为异形或难处理货物（如管状、木箱、轮胎等）"),
      }).optional().describe("运单附加选项"),
    },
    async () => {
      return {
        content: [{ type: "text" as const, text: "This feature is currently under development. If you need to enable it, please contact the ShipSaving technical team." }],
      };
    }
  );

  server.tool(
    "pay_shipment",
    "对已选报价的运单进行支付，生成面单。可选附带保险信息。",
    {
      rate_id: z.string().describe("报价ID，从 get_shipping_rates 获取"),
      label_print_type: z.enum(["common", "qrcode", "barcode"]).optional().default("common").describe("面单打印格式"),
      insurance_data: z.object({
        coverage: z.number().describe("保额"),
        currency: z.string().optional().default("USD").describe("币种"),
        rate: z.number().optional().describe("保险费率"),
        rate_id: z.string().optional().describe("保险费率ID，从 get_insurance_rates 获取"),
        service_level: z.string().optional().describe("服务等级"),
        package_description: z.string().optional().describe("包裹描述"),
      }).optional().describe("保险信息（可选）"),
    },
    async () => {
      return {
        content: [{ type: "text" as const, text: "This feature is currently under development. If you need to enable it, please contact the ShipSaving technical team." }],
      };
    }
  );

  server.tool(
    "void_label",
    "退款/作废未使用的面单",
    {
      shipment_no: z.string().describe("运单号"),
    },
    async ({ shipment_no }) => {
      try {
        await get("/shipment/void_label", { shipment_no });
        return {
          content: [{ type: "text" as const, text: "面单已成功作废，退款将退回到钱包。" }],
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
