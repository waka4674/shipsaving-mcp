# ShipSaving MCP Server

[![npm version](https://img.shields.io/npm/v/shipsaving-mcp.svg)](https://www.npmjs.com/package/shipsaving-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[中文文档](./README.zh-CN.md)

An MCP (Model Context Protocol) server that wraps the [ShipSaving](https://www.shipsaving.com) logistics REST API, enabling AI assistants like Claude to perform shipping operations through natural language.

## Features

- **Shipment Management** — Multi-carrier rate comparison, create shipments, pay & generate labels, void labels, track packages
- **Order Management** — Sync store orders, search, bulk label printing, mark as shipped, cancel
- **Address Book** — Query, create, and validate addresses
- **Package Templates** — Save and reuse package dimensions
- **Carriers** — List connected carrier accounts and available service levels
- **Store Integration** — List connected e-commerce stores (Shopify, etc.)
- **Analytics** — Total savings, shipping cost analysis
- **Billing** — Wallet balance, transaction history

## Quick Start

### Prerequisites

- Node.js 18+
- A ShipSaving App Key (get one at [ShipSaving](https://www.shipsaving.com) → Settings → API)

### Install with Claude Code CLI (Recommended)

```bash
claude mcp add shipsaving \
  -e SHIPSAVING_APP_KEY=sk_your_app_key \
  -- npx -y shipsaving-mcp
```

### Install with Claude Desktop

Edit your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "shipsaving": {
      "command": "npx",
      "args": ["-y", "shipsaving-mcp"],
      "env": {
        "SHIPSAVING_APP_KEY": "sk_your_app_key"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Verify Installation

```bash
claude mcp list
# shipsaving should show status: Connected
```

## Available Tools

### Shipment Management

| Tool | Description |
|------|-------------|
| `get_shipping_rates` | Compare rates across multiple carriers, marks cheapest & fastest |
| `create_draft_shipment` | Create a draft shipment (no payment yet) |
| `pay_shipment` | Pay for shipment and generate label |
| `void_label` | Void/refund an unused label |
| `search_shipments` | Search shipments by various criteria |
| `get_shipment_detail` | Get detailed shipment information |
| `track_shipment` | Track package by tracking number |
| `get_insurance_rates` | Query shipping insurance rates |

### Order Management

| Tool | Description |
|------|-------------|
| `search_orders` | Search orders by status, store, date, keywords |
| `get_order_detail` | Get order details |
| `create_order` | Manually create an order |
| `buy_label_from_order` | Purchase a label for an existing order |
| `mark_order_shipped` | Mark order as shipped |
| `cancel_order` | Cancel an order |
| `sync_store_orders` | Trigger store order sync |
| `get_order_tags` | List all order tags |

### Address Book

| Tool | Description |
|------|-------------|
| `list_addresses` | Query address book entries |
| `create_address` | Add a new address |
| `update_address` | Update an existing address |
| `validate_address` | Validate address deliverability |

### Package Templates

| Tool | Description |
|------|-------------|
| `list_packages` | List saved package templates |
| `list_predefined_packages` | List carrier-provided package types |
| `create_package` | Create a reusable package template |

### Carriers & Stores

| Tool | Description |
|------|-------------|
| `list_carriers` | List connected carrier accounts |
| `get_service_levels` | Query available service levels per carrier |
| `list_stores` | List connected e-commerce stores |

### Analytics & Billing

| Tool | Description |
|------|-------------|
| `get_total_savings` | View total savings with ShipSaving |
| `get_shipping_analysis` | Analyze shipping data over time |
| `get_wallet_info` | Query wallet balance |
| `get_transaction_history` | Query transaction records |

## Usage Examples

**Compare shipping rates:**
```
Compare rates from ZIP 90001 to 10001 for a 10x8x6 inch, 2 lb package
```

**Ship a package:**
```
Ship from John Smith, 123 Main St, Los Angeles, CA 90001
to Jane Doe, 456 Park Ave, New York, NY 10001
Package: 10x8x6 inches, 2 lbs, choose cheapest option
```

**Bulk label printing:**
```
Sync my Shopify orders, then print labels for all pending orders
using 6x6x6 inch boxes, 1 lb each, cheapest carrier, no insurance
```

**Track a package:**
```
Track package 1Z999AA10123456784
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SHIPSAVING_APP_KEY` | Yes | — | ShipSaving App Key (`sk_` prefix) |
| `SHIPSAVING_API_BASE_URL` | No | `https://app-gateway.shipsaving.com` | API base URL |
| `SHIPSAVING_TIMEOUT_MS` | No | `60000` | Request timeout in milliseconds |
| `SHIPSAVING_LOG_FILE` | No | — | Path to log file (logs go to stderr by default) |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Debug with MCP Inspector
SHIPSAVING_API_BASE_URL=https://app-gateway.shipsaving.com \
SHIPSAVING_APP_KEY=sk_your_app_key \
npx @modelcontextprotocol/inspector node dist/index.js
```

## Troubleshooting

**"command not found"** — Install Node.js 18+: [nodejs.org](https://nodejs.org)

**"Failed to connect"** — Try running the server manually to see error output:

```bash
SHIPSAVING_APP_KEY=sk_your_app_key npx -y shipsaving-mcp
```

If it hangs (waiting for input), the server started successfully. If it errors immediately, you'll see the issue.

To clear the npx cache:
```bash
rm -rf ~/.npm/_npx
```

## License

MIT
