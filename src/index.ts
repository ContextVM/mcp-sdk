/**
 * @modelcontextprotocol/sdk - root entry point
 *
 * Re-exports the core public API so consumers can write:
 *   import { Client, Server, type RequestHandlerExtra } from "@modelcontextprotocol/sdk";
 *
 * Note: McpServer / ResourceTemplate live under "./server/mcp" to avoid an
 * export-name collision with the "ResourceTemplate" type in ./types.
 */

export * from './types.js';
export * from './shared/protocol.js';
export * from './shared/transport.js';
export * from './client/index.js';
export * from './server/index.js';
