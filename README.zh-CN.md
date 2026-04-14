# Claude Code 接入 ShipSaving MCP 工具

## 简介

Claude Code 是 Anthropic 官方推出的 AI 编程助手 CLI 工具，支持通过 MCP（Model Context Protocol）协议扩展其能力。ShipSaving MCP 工具允许 Claude 等 AI 助手直接与 ShipSaving 物流平台交互，通过自然语言完成运费比价、发货下单、订单管理等操作。

## ShipSaving MCP 工具概述

ShipSaving MCP Server 提供了以下核心能力：

- **运单管理**：多承运商运费比价、创建运单、支付面单、作废面单、物流追踪
- **订单管理**：同步店铺订单、搜索订单、批量打单、标记发货、取消订单
- **地址管理**：查询地址簿、新建地址、验证地址合法性
- **包裹模板**：查询和创建包裹尺寸模板，快速复用
- **承运商**：查询已连接的承运商账户和可用服务级别
- **店铺管理**：查询已连接的电商店铺（Shopify 等）
- **报表分析**：节省金额统计、运费趋势分析
- **钱包账单**：余额查询、交易记录查询

## 接入步骤

### 1. 准备 ShipSaving App Key

登录 [ShipSaving](https://www.shipsaving.com) → 进入账户设置 → API → 创建 App Key（以 `sk_` 开头）

### 2. 安装并配置

**方式一：Claude Code CLI（推荐）**

生产环境：

```bash
claude mcp add shipsaving \
  -e SHIPSAVING_APP_KEY=sk_你的AppKey \
  -- npx -y shipsaving-mcp
```

测试环境：

```bash
claude mcp add shipsaving \
  -e SHIPSAVING_APP_KEY=sk_你的AppKey \
  -e SHIPSAVING_API_BASE_URL=https://test-service.shipsaving.us \
  -- npx -y shipsaving-mcp@beta
```

说明：
- `-e SHIPSAVING_APP_KEY=...` 设置认证密钥
- `-e SHIPSAVING_API_BASE_URL=...` 指定后端域名，测试环境需要传入，生产环境可省略
- `--scope user` 可选，加上后对当前用户全局生效

**方式二：Claude Desktop 配置文件**

打开配置文件：
- Mac：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows：`%APPDATA%\Claude\claude_desktop_config.json`

生产环境：

```json
{
  "mcpServers": {
    "shipsaving": {
      "command": "npx",
      "args": ["-y", "shipsaving-mcp"],
      "env": {
        "SHIPSAVING_APP_KEY": "sk_你的AppKey"
      }
    }
  }
}
```

测试环境：

```json
{
  "mcpServers": {
    "shipsaving": {
      "command": "npx",
      "args": ["-y", "shipsaving-mcp@beta"],
      "env": {
        "SHIPSAVING_APP_KEY": "sk_你的AppKey",
        "SHIPSAVING_API_BASE_URL": "https://test-service.shipsaving.us"
      }
    }
  }
}
```

保存后重启 Claude Desktop。

### 3. 验证安装

在终端执行以下命令，`shipsaving` 状态显示为 `Connected` 即为成功：

```bash
claude mcp list
```

### 4. 验证接入

重启 Claude Code 后，尝试以下指令验证是否接入成功：

```
帮我查询一下钱包余额
```

## 可用工具列表

### 运单管理

| 工具名称 | 功能描述 |
|---------|---------|
| `get_shipping_rates` | 多承运商运费比价，标记最便宜和最快选项 |
| `create_draft_shipment` | 创建运单草稿（不立即付款） |
| `pay_shipment` | 支付运单，生成面单 |
| `void_label` | 退款/作废未使用的面单 |
| `search_shipments` | 按条件搜索运单列表 |
| `get_shipment_detail` | 查看运单详细信息 |
| `track_shipment` | 通过追踪号查询物流状态 |
| `get_insurance_rates` | 查询运输保险价格 |

### 订单管理

| 工具名称 | 功能描述 |
|---------|---------|
| `search_orders` | 按状态、店铺、日期等条件搜索订单 |
| `get_order_detail` | 查看订单详细信息 |
| `create_order` | 手动创建订单 |
| `buy_label_from_order` | 对已有订单购买面单（打单） |
| `mark_order_shipped` | 标记订单为已发货 |
| `cancel_order` | 取消订单 |
| `sync_store_orders` | 手动触发店铺订单同步 |
| `get_order_tags` | 查询所有订单标签 |

### 地址管理

| 工具名称 | 功能描述 |
|---------|---------|
| `list_addresses` | 查询地址簿中的地址列表 |
| `create_address` | 在地址簿中新建地址 |
| `validate_address` | 验证地址是否合法、可达 |

### 包裹模板

| 工具名称 | 功能描述 |
|---------|---------|
| `list_packages` | 查询已保存的包裹尺寸模板 |
| `create_package` | 创建包裹模板，方便快速复用 |

### 承运商

| 工具名称 | 功能描述 |
|---------|---------|
| `list_carriers` | 查询已连接的承运商账户列表 |
| `get_service_levels` | 查询可用的承运商服务级别 |

### 店铺管理

| 工具名称 | 功能描述 |
|---------|---------|
| `list_stores` | 查询已连接的电商店铺列表 |

### 报表分析

| 工具名称 | 功能描述 |
|---------|---------|
| `get_total_savings` | 查看使用 ShipSaving 节省的总金额 |
| `get_shipping_analysis` | 按时间维度分析运费数据 |

### 钱包账单

| 工具名称 | 功能描述 |
|---------|---------|
| `get_wallet_info` | 查询钱包余额信息 |
| `get_transaction_history` | 查询交易记录 |

## 使用示例

**运费比价**
```
帮我查询从加州 90001 寄往纽约 10001 的运费，包裹 10x8x6 英寸，重量 2 磅
```

**发货下单**
```
帮我下单发货，寄件人：John Smith，123 Main St, Los Angeles, CA 90001；
收件人：Jane Doe，456 Park Ave, New York, NY 10001；
包裹 10x8x6 英寸，2 磅，选择最便宜的方式
```

**订单打单**
```
帮我对订单 12345 打单，发件人地址：123 Main St, Los Angeles, CA 90001，
包裹 6x6x6 英寸，重量 1 磅，不加保险，选最便宜的
```

**批量同步并打单**
```
请同步一下 Shopify 的所有订单，并把新增订单都进行发货，
尺寸默认 6x6x6 英寸，重量 1 磅，不加保险，选择最便宜的方式
```

**物流追踪**
```
帮我查询追踪号 1Z999AA10123456784 的物流状态
```

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|-------|------|
| `SHIPSAVING_APP_KEY` | 是 | — | ShipSaving App Key（`sk_` 开头） |
| `SHIPSAVING_API_BASE_URL` | 否 | `https://app-gateway.shipsaving.com` | API 地址 |
| `SHIPSAVING_TIMEOUT_MS` | 否 | `30000` | 请求超时时间（毫秒） |

## 问题排查

**提示命令不存在**

需要先安装 Node.js 18+：[https://nodejs.org](https://nodejs.org)

**安装后出现 Failed to connect**

1. 在终端手动执行命令，查看是否有报错：

```bash
SHIPSAVING_APP_KEY=sk_你的AppKey npx -y shipsaving-mcp
```

如果命令执行后卡住（等待请求），说明服务器启动成功。如果立即报错，可看到具体错误信息。

2. 清理 npx 缓存并重新安装：

```bash
rm -rf ~/.npm/_npx
```

3. 如果仍无法连接，请联系 ShipSaving 技术支持。

## 版本管理（测试版 vs 生产版）

ShipSaving MCP 通过 npm dist-tag 区分测试版和生产版，代码相同，域名通过环境变量控制。

| Tag | 安装方式 | 适用场景 |
|-----|---------|---------|
| `latest`（默认） | `npx shipsaving-mcp` | 生产环境 |
| `beta` | `npx shipsaving-mcp@beta` | 测试/开发环境 |

**测试环境接入：**

```bash
claude mcp add shipsaving \
  -e SHIPSAVING_APP_KEY=sk_你的AppKey \
  -e SHIPSAVING_API_BASE_URL=https://test-service.shipsaving.us \
  -- npx -y shipsaving-mcp@beta
```

**生产环境接入（默认，URL 可省略）：**

```bash
claude mcp add shipsaving \
  -e SHIPSAVING_APP_KEY=sk_你的AppKey \
  -- npx -y shipsaving-mcp
```

**发布新版本：**

```bash
# 发布测试版
npm version prerelease --preid=beta
npm publish --tag beta --registry https://registry.npmjs.org

# 发布生产版
npm version patch
npm publish --registry https://registry.npmjs.org
```

## License

MIT
