import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerShipmentTools } from "./shipment.tools.js";
import { registerOrderTools } from "./order.tools.js";
import { registerAddressTools } from "./address.tools.js";
import { registerPackageTools } from "./package.tools.js";
import { registerCarrierTools } from "./carrier.tools.js";
import { registerStoreTools } from "./store.tools.js";
import { registerReportTools } from "./report.tools.js";
import { registerBillingTools } from "./billing.tools.js";

export function registerAllTools(server: McpServer) {
  registerShipmentTools(server);
  registerOrderTools(server);
  registerAddressTools(server);
  registerPackageTools(server);
  registerCarrierTools(server);
  registerStoreTools(server);
  registerReportTools(server);
  registerBillingTools(server);
}
