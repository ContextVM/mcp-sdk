/**
 * Client-side JSON Schema validation is opt-in.
 *
 * As of the lightweighting work, the `Client` no longer instantiates an
 * `AjvJsonSchemaValidator` by default. Consumers who want tool-output
 * validation must pass `jsonSchemaValidator` explicitly (importing
 * `AjvJsonSchemaValidator` from `@contextvm/mcp-sdk/validation/ajv`). When no
 * validator is provided, structured content returned by tools is accepted
 * without validation.
 *
 * These tests lock in that contract.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Client } from '../../src/client/index.js';
import { Server } from '../../src/server/index.js';
import { InMemoryTransport } from '../../src/inMemory.js';
import { AjvJsonSchemaValidator } from '../../src/validation/ajv-provider.js';
import {
    CallToolResultSchema,
    ListToolsRequestSchema,
    CallToolRequestSchema
} from '../../src/types.js';

const OUTPUT_SCHEMA = {
    type: 'object',
    properties: {
        value: { type: 'integer' }
    },
    required: ['value']
};

async function setup(opts: { jsonSchemaValidator?: AjvJsonSchemaValidator } = {}) {
    const server = new Server({ name: 'test-server', version: '1.0.0' }, { capabilities: { tools: {} } });

    // Expose a single tool whose outputSchema requires { value: integer }.
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: 'get-value',
                description: 'returns a value',
                inputSchema: { type: 'object', properties: {} },
                outputSchema: OUTPUT_SCHEMA
            }
        ]
    }));

    // The tool deliberately returns structuredContent that violates the schema
    // (wrong type for `value`).
    server.setRequestHandler(CallToolRequestSchema, async () => ({
        content: [{ type: 'text', text: 'ok' }],
        structuredContent: { value: 'not-an-integer' }
    }));

    const client = new Client(
        { name: 'test-client', version: '1.0.0' },
        { capabilities: {}, jsonSchemaValidator: opts.jsonSchemaValidator }
    );

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    return { client, server };
}

describe('Client JSON Schema validation (opt-in)', () => {
    test('without a validator: invalid structured content is accepted', async () => {
        const { client } = await setup(); // no jsonSchemaValidator

        await client.listTools();

        // No validator configured → the client returns the result as-is.
        const result = await client.callTool({ name: 'get-value', arguments: {} }, CallToolResultSchema);
        expect(result.structuredContent).toEqual({ value: 'not-an-integer' });
    });

    test('with a validator: invalid structured content is rejected', async () => {
        const { client } = await setup({ jsonSchemaValidator: new AjvJsonSchemaValidator() });

        await client.listTools();

        await expect(
            client.callTool({ name: 'get-value', arguments: {} }, CallToolResultSchema)
        ).rejects.toThrow(/does not match the tool's output schema/);
    });
});
