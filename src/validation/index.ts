/**
 * JSON Schema validation
 *
 * This module provides configurable JSON Schema validation for the MCP SDK.
 *
 * - AjvJsonSchemaValidator: Best for Node.js (default, fastest)
 *   Import from: @modelcontextprotocol/sdk/validation/ajv
 *
 * @example
 * ```typescript
 * import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
 * const validator = new AjvJsonSchemaValidator();
 * ```
 *
 * @module validation
 */

// Core types only - implementations are exported via separate entry points
export type { JsonSchemaType, JsonSchemaValidator, JsonSchemaValidatorResult, jsonSchemaValidator } from './types.js';
