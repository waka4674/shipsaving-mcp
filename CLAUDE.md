# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build      # compile TypeScript → dist/
npm start          # run compiled server (requires dist/ to exist)
```

To debug with MCP Inspector:
```bash
SHIPSAVING_API_BASE_URL=http://localhost:8098 \
SHIPSAVING_APP_KEY=sk_your_app_key_here \
npx @modelcontextprotocol/inspector node dist/index.js
```

**Important:** The project does not load `.env` files. All environment variables must be passed explicitly at startup, otherwise `SHIPSAVING_API_BASE_URL` falls back to the production URL `https://app-gateway.shipsaving.com`.

## Architecture

This is a TypeScript MCP server using stdio transport. It wraps the ShipSaving REST API as MCP tools so AI assistants can perform shipping operations.

**Request flow:**
1. `src/index.ts` — creates `McpServer`, calls `registerAllTools()`, starts stdio transport
2. `src/tools/index.ts` — aggregates all `register*Tools()` calls
3. Each tool file calls `server.tool(name, description, zodSchema, handler)`
4. Handlers call `get()` / `post()` from `src/client.ts`
5. `src/client.ts` — injects `Authorization: Bearer <appKey>` header, unwraps `{ code, msg, data }` response envelope, logs `[API] METHOD url` and `[API] Body: ...` to stderr
6. `src/config.ts` — reads `SHIPSAVING_APP_KEY` (falls back to `SHIPSAVING_API_TOKEN`), no `runtimeToken` or login flow

**Authentication:** appKey only (`sk_` prefix). Configured via `SHIPSAVING_APP_KEY` env var. The backend (`x-auth-service`) validates it against the `app_key` table, with Redis cache (TTL 1h).

**Adding a new tool:** add a `register*Tools(server)` function in `src/tools/`, import and call it in `src/tools/index.ts`. Follow the existing pattern — Zod schema for params, `get()`/`post()` for HTTP, `formatError()` in the catch block.

**Response formatting:** `src/utils/format.ts` contains `formatRatesTable()`, `formatShipmentDetail()`, `formatOrderDetail()`, `formatList()`. API responses use snake_case field names (e.g. `shipment_no`, `carrier_code`, `total_fee`).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SHIPSAVING_APP_KEY` | — | Required. appKey from `/api_auth/app_key/create` |
| `SHIPSAVING_API_BASE_URL` | `https://app-gateway.shipsaving.com` | Backend URL |
| `SHIPSAVING_TIMEOUT_MS` | `30000` | Request timeout in ms |

## Things to note
Execute automatically after each code change: SHIPSAVING_API_BASE_URL=https://app-gateway.shipsaving.com \
SHIPSAVING_APP_KEY=sk_your_app_key_here \
npx @modelcontextprotocol/inspector node dist/index.js