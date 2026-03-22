# Minimal MCP Fork Plan for ContextVM

## Goal

Produce and maintain a lightweight fork of the MCP TypeScript SDK focused on the parts ContextVM actually needs:

- Protocol types and schemas
- Core client/server protocol runtime
- Shared transport abstractions
- `stdio` transport support
- Test utilities that support the retained surface

The fork should intentionally exclude HTTP- and web-facing features that add dependency weight without helping ContextVM:

- SSE transports
- Streamable HTTP transports
- Express/Hono integrations
- OAuth client/server helpers
- HTTP middleware and related auth plumbing
- Browser-oriented transport layers not required by ContextVM

## Why this fork exists

[`@contextvm/sdk`](sdk/package.json) currently depends on [`@modelcontextprotocol/sdk`](package.json). That gives ContextVM direct access to the MCP protocol layer, which is valuable, but it also pulls in a much larger runtime surface than ContextVM needs.

The upstream SDK is designed as a broad implementation package, not as a narrow protocol-core package. As a result, it includes HTTP transports, auth helpers, web adapters, and related dependencies that increase install weight and bundle size.

For ContextVM, the desired outcome is not a reimplementation of MCP, but a trimmed fork that preserves upstream protocol compatibility while removing unnecessary transport and web stacks.

## Product boundary

### Supported in the fork

- Protocol definitions and schemas
- Core message handling and protocol engine
- Base client/server runtime
- `stdio` transport
- In-memory transport for tests if it remains useful

### Explicit non-goals

- Full parity with upstream transport surface
- Web server integrations
- OAuth server implementation helpers
- Browser-focused networking features
- Shipping HTTP dependencies “just in case”

This scope should be documented and treated as policy. The fork is a protocol-core distribution, not a general-purpose MCP platform SDK.

## Architectural guidance

### 1. Prefer subtractive forking

The first iteration should preserve upstream structure and remove unsupported parts instead of redesigning the package.

Why:

- Smaller divergence from upstream
- Easier merges when protocol definitions evolve
- Faster identification of dependency roots
- Lower risk of introducing behavioral regressions in retained core logic

### 2. Preserve upstream file layout for retained modules

Retained files should stay as close as possible to upstream locations and names, especially core files such as:

- [`src/types.ts`](src/types.ts)
- [`src/spec.types.ts`](src/spec.types.ts)
- [`src/shared/protocol.ts`](src/shared/protocol.ts)
- [`src/shared/transport.ts`](src/shared/transport.ts)
- [`src/shared/stdio.ts`](src/shared/stdio.ts)
- [`src/client/index.ts`](src/client/index.ts)
- [`src/client/stdio.ts`](src/client/stdio.ts)
- [`src/server/index.ts`](src/server/index.ts)
- [`src/server/stdio.ts`](src/server/stdio.ts)
- [`src/inMemory.ts`](src/inMemory.ts)

This makes future upstream sync work much easier.

### 3. Separate upstream-syncable code from ContextVM-owned decisions

Treat the fork as two conceptual layers:

- **Upstream-syncable**: protocol types, shared protocol engine, base client/server runtime, stdio transport, retained tests
- **ContextVM-owned**: package exports, dependency pruning, release posture, documentation, CI guards, any ContextVM-specific adapters

This helps keep upstream merges mechanical while local policy remains explicit.

## Likely removal targets

These are the main modules that currently represent the dependency and maintenance burden ContextVM likely does not need:

- [`src/client/sse.ts`](src/client/sse.ts)
- [`src/client/streamableHttp.ts`](src/client/streamableHttp.ts)
- [`src/client/websocket.ts`](src/client/websocket.ts) if not needed
- [`src/client/auth.ts`](src/client/auth.ts)
- [`src/client/auth-extensions.ts`](src/client/auth-extensions.ts)
- [`src/client/middleware.ts`](src/client/middleware.ts)
- [`src/server/sse.ts`](src/server/sse.ts)
- [`src/server/streamableHttp.ts`](src/server/streamableHttp.ts)
- [`src/server/webStandardStreamableHttp.ts`](src/server/webStandardStreamableHttp.ts)
- [`src/server/express.ts`](src/server/express.ts)
- [`src/server/auth/`](src/server/auth)
- [`src/server/middleware/hostHeaderValidation.ts`](src/server/middleware/hostHeaderValidation.ts)
- [`src/validation/`](src/validation) if retained core does not require it
- HTTP/auth-related examples and tests

## Important coupling to resolve carefully

The fork should not delete modules blindly. Some upstream “core” files currently leak HTTP/auth concepts into otherwise reusable layers.

The most notable coupling found so far is in [`src/types.ts`](src/types.ts), which imports auth-related types from [`src/server/auth/types.ts`](src/server/auth/types.ts). That suggests a small internal decoupling step may be needed so protocol typing can remain while server-auth
implementation files are removed.

Rule of thumb:

- If a core file imports an unwanted module only for a small type, extract the type or replace the dependency with a minimal local abstraction.
- Avoid large rewrites inside protocol/runtime files.

## Dependency strategy

The goal is to reduce runtime dependencies to those strictly required by retained core behavior.

### Dependencies expected to disappear after transport/auth pruning

Examples from [`package.json`](package.json):

- [`express`](package.json:102)
- [`hono`](package.json:104)
- [`@hono/node-server`](package.json:94)
- [`cors`](package.json:98)
- [`raw-body`](package.json:108)
- [`content-type`](package.json:97)
- [`eventsource`](package.json:100)
- [`eventsource-parser`](package.json:101)
- [`jose`](package.json:105)
- [`pkce-challenge`](package.json:107)

### Packaging principles

- Keep the public export surface minimal
- Do not retain optional web dependencies in the main package
- Remove tests that force unwanted runtime dependencies to remain installed
- Add CI checks for banned dependencies so the fork does not drift back toward full upstream weight

## Export strategy

The fork should expose only the modules ContextVM genuinely needs.

Preferred shape:

- Root entrypoint for stable protocol/core runtime
- Narrow client/server entrypoints if retained
- Direct exports for `stdio` transport when useful
- Protocol types for advanced consumers

Avoid exposing many subpaths that imply support for features intentionally removed.

## Upstream sync strategy

The fork should be maintained with a branch model that preserves a clean upstream reference.

### Recommended branches

- `upstream/main-mirror`: tracks upstream with no local product edits
- `fork/minimal-core`: ContextVM’s maintained lightweight branch
- `fork/integration`: temporary branch for resolving incoming upstream merges

### Merge hygiene rules

- Avoid reformatting retained upstream files
- Keep pure deletions separate from semantic edits
- Make small commits by concern
- Preserve original paths for retained modules
- Document intentional divergence only where necessary

## Phased execution plan

### Phase 0 — Scope lock

- Document the fork’s goals, supported surface, and non-goals
- Decide package naming/versioning policy
- State that the fork targets upstream protocol compatibility, not transport parity

### Phase 1 — Inventory retained vs removable modules

- Build a keep/remove matrix for all source modules
- Identify transitive imports from retained modules into HTTP/auth modules
- Identify tests and examples tied only to removed functionality

### Phase 2 — First minimal build

- Reduce package exports to retained modules only
- Exclude or remove unsupported modules from compilation and packaging
- Keep protocol/core/stdio paths working with minimal code churn
- Update the test suite so only retained behavior is required

### Phase 3 — Dependency pruning

- Remove no-longer-used runtime dependencies
- Remove no-longer-used dev dependencies
- Verify that published output no longer references removed transport/auth packages
- Compare dependency footprint and bundle impact against upstream consumption

### Phase 4 — Sync hardening

- Add a documented upstream sync procedure
- Add contract tests for retained protocol behavior important to ContextVM
- Add CI checks for unsupported dependencies and exports

### Phase 5 — Optional later refinement

Only after the lightweight fork is stable:

- Consider internal package splitting if there is a real maintenance or distribution benefit
- Consider extracting a clearly named protocol-core package later

This should not be part of the first pass because it increases divergence.

## Immediate next actions

1. Create a keep/remove matrix for everything under [`src/`](src).
2. Identify the minimal retained dependency graph rooted at [`src/shared/protocol.ts`](src/shared/protocol.ts), [`src/client/index.ts`](src/client/index.ts), [`src/server/index.ts`](src/server/index.ts), [`src/client/stdio.ts`](src/client/stdio.ts), and
   [`src/server/stdio.ts`](src/server/stdio.ts).
3. Remove unsupported package exports from [`package.json`](package.json).
4. Delete or exclude unsupported tests/examples so dependency cleanup becomes straightforward.
5. Prune dependencies and add a CI guard for banned web/auth packages.

## Phase 1 inventory snapshot

### Keep/remove matrix for [`src/`](src)

| Path                                                                                             | Decision                                              | Reason                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`src/types.ts`](src/types.ts)                                                                   | Keep                                                  | Canonical protocol types and schemas; required by nearly all retained runtime modules.                               |
| [`src/spec.types.ts`](src/spec.types.ts)                                                         | Keep                                                  | Upstream-generated spec typing should remain syncable with minimal divergence.                                       |
| [`src/shared/protocol.ts`](src/shared/protocol.ts)                                               | Keep                                                  | Core protocol engine and request lifecycle handling.                                                                 |
| [`src/shared/transport.ts`](src/shared/transport.ts)                                             | Keep                                                  | Shared transport contract used by retained runtimes.                                                                 |
| [`src/shared/stdio.ts`](src/shared/stdio.ts)                                                     | Keep                                                  | Shared stdio helpers are directly aligned with the fork scope.                                                       |
| [`src/shared/responseMessage.ts`](src/shared/responseMessage.ts)                                 | Keep                                                  | Used by the retained protocol engine.                                                                                |
| [`src/shared/toolNameValidation.ts`](src/shared/toolNameValidation.ts)                           | Keep                                                  | Lightweight shared utility with no HTTP coupling observed.                                                           |
| [`src/shared/metadataUtils.ts`](src/shared/metadataUtils.ts)                                     | Keep                                                  | General protocol utility; no web-specific dependency observed.                                                       |
| [`src/shared/uriTemplate.ts`](src/shared/uriTemplate.ts)                                         | Keep                                                  | Protocol utility likely needed by retained type/runtime surface.                                                     |
| [`src/client/index.ts`](src/client/index.ts)                                                     | Keep with follow-up                                   | Core client runtime, but currently pulls validation providers by default.                                            |
| [`src/client/stdio.ts`](src/client/stdio.ts)                                                     | Keep                                                  | Required transport entrypoint.                                                                                       |
| [`src/server/index.ts`](src/server/index.ts)                                                     | Keep with follow-up                                   | Core server runtime, but currently pulls validation providers by default.                                            |
| [`src/server/stdio.ts`](src/server/stdio.ts)                                                     | Keep                                                  | Required transport entrypoint.                                                                                       |
| [`src/server/mcp.ts`](src/server/mcp.ts)                                                         | Keep pending validation audit                         | High-level server API may still be useful if it does not force HTTP/auth retention.                                  |
| [`src/server/completable.ts`](src/server/completable.ts)                                         | Keep pending validation audit                         | Appears core-adjacent and not transport-specific.                                                                    |
| [`src/server/zod-compat.ts`](src/server/zod-compat.ts)                                           | Keep                                                  | Required by retained client/server/protocol code.                                                                    |
| [`src/server/zod-json-schema-compat.ts`](src/server/zod-json-schema-compat.ts)                   | Keep                                                  | Required by retained protocol/task logic.                                                                            |
| [`src/inMemory.ts`](src/inMemory.ts)                                                             | Keep after auth-type decoupling                       | Useful for tests and non-network transport scenarios, but imports [`AuthInfo`](src/server/auth/types.ts:4).          |
| [`src/experimental/`](src/experimental)                                                          | Keep pending scope decision                           | Task support is embedded into retained core runtime; removing it would increase divergence.                          |
| [`src/validation/types.ts`](src/validation/types.ts)                                             | Keep candidate                                        | Small abstraction layer may remain even if AJV-specific provider becomes optional.                                   |
| [`src/validation/ajv-provider.ts`](src/validation/ajv-provider.ts)                               | Optional / move behind explicit export                | Needed only because retained client/server default to [`AjvJsonSchemaValidator`](src/validation/ajv-provider.ts:36). |
| [`src/validation/cfworker-provider.ts`](src/validation/cfworker-provider.ts)                     | Remove from default package surface                   | Not needed for stdio-first Node.js fork.                                                                             |
| [`src/validation/index.ts`](src/validation/index.ts)                                             | Reduce or remove                                      | Depends on whether generic validation abstraction remains public.                                                    |
| [`src/client/sse.ts`](src/client/sse.ts)                                                         | Remove                                                | HTTP/SSE transport outside fork scope.                                                                               |
| [`src/client/streamableHttp.ts`](src/client/streamableHttp.ts)                                   | Remove                                                | HTTP transport outside fork scope.                                                                                   |
| [`src/client/websocket.ts`](src/client/websocket.ts)                                             | Remove                                                | Non-stdio transport outside current scope.                                                                           |
| [`src/client/auth.ts`](src/client/auth.ts)                                                       | Remove                                                | OAuth/web auth surface outside scope.                                                                                |
| [`src/client/auth-extensions.ts`](src/client/auth-extensions.ts)                                 | Remove                                                | Auth-only extension surface outside scope.                                                                           |
| [`src/client/middleware.ts`](src/client/middleware.ts)                                           | Remove                                                | Middleware layer exists for removed web/auth flow.                                                                   |
| [`src/server/sse.ts`](src/server/sse.ts)                                                         | Remove                                                | HTTP/SSE server transport outside scope.                                                                             |
| [`src/server/streamableHttp.ts`](src/server/streamableHttp.ts)                                   | Remove                                                | HTTP server transport outside scope.                                                                                 |
| [`src/server/webStandardStreamableHttp.ts`](src/server/webStandardStreamableHttp.ts)             | Remove                                                | Web-standard HTTP transport outside scope.                                                                           |
| [`src/server/express.ts`](src/server/express.ts)                                                 | Remove                                                | Express integration is a direct non-goal.                                                                            |
| [`src/server/auth/`](src/server/auth)                                                            | Remove after type extraction                          | Full OAuth/auth server implementation is outside scope.                                                              |
| [`src/server/middleware/hostHeaderValidation.ts`](src/server/middleware/hostHeaderValidation.ts) | Remove                                                | HTTP middleware only.                                                                                                |
| [`src/shared/auth.ts`](src/shared/auth.ts)                                                       | Remove                                                | Shared auth protocol support is only needed by removed OAuth stack.                                                  |
| [`src/shared/auth-utils.ts`](src/shared/auth-utils.ts)                                           | Remove                                                | Auth-only helper layer.                                                                                              |
| [`src/examples/`](src/examples)                                                                  | Remove or move to separate branch during minimization | Examples currently anchor HTTP/auth transports and extra dependencies.                                               |
| [`src/__fixtures__/`](src/__fixtures__)                                                          | Keep selectively                                      | Retain only fixtures needed by stdio/core/in-memory tests.                                                           |
| [`src/__mocks__/pkce-challenge.ts`](src/__mocks__/pkce-challenge.ts)                             | Remove                                                | Exists only to support removed auth flow.                                                                            |

### Retained-core coupling findings

The first inventory pass shows two important coupling points that should be addressed before deleting HTTP/auth code:

1. [`src/types.ts`](src/types.ts:2) imports [`AuthInfo`](src/server/auth/types.ts:4).
    - This leaks server-auth typing into the top-level protocol schema surface.
    - Recommended fix: extract [`AuthInfo`](src/server/auth/types.ts:4) into a transport-neutral file such as `src/shared/auth-info.ts` or `src/types/auth.ts`, then re-export it from the auth area if upstream compatibility needs to be preserved.

2. [`src/shared/protocol.ts`](src/shared/protocol.ts:49) and [`src/inMemory.ts`](src/inMemory.ts:3) also import [`AuthInfo`](src/server/auth/types.ts:4).
    - This confirms the auth-type dependency is not isolated to [`src/types.ts`](src/types.ts:2).
    - Recommended fix: make request extra metadata depend on the extracted neutral type instead of the auth implementation directory.

### Validation coupling findings

The retained client and server runtimes currently assume AJV-backed validation by default:

- [`src/client/index.ts`](src/client/index.ts:54) imports [`AjvJsonSchemaValidator`](src/validation/ajv-provider.ts:36).
- [`src/server/index.ts`](src/server/index.ts:45) imports [`AjvJsonSchemaValidator`](src/validation/ajv-provider.ts:36).

This means the first minimal fork has two viable options:

- **Low-divergence option**: keep [`src/validation/ajv-provider.ts`](src/validation/ajv-provider.ts) and its required dependencies in the initial fork, then prune only HTTP/auth packages first.
- **More aggressive option**: change [`Client`](src/client/index.ts:234) and [`Server`](src/server/index.ts:129) so validator support is purely injected and no default AJV provider is imported at module load time.

Recommended sequence: take the low-divergence option first, finish transport/auth minimization, then decide whether AJV should remain or become an optional add-on package.

## First export reduction plan for [`package.json`](package.json)

### Exports to keep in the first minimal fork

- [`"."`](package.json:22) for the stable root runtime surface.
- [`"./client"`](package.json:26) for the retained low-level client runtime.
- [`"./server"`](package.json:30) for the retained low-level server runtime.
- [`"./experimental"`](package.json:46) only if task APIs remain public in the first pass.
- [`"./experimental/tasks"`](package.json:50) only if task APIs remain public in the first pass.

### Exports to remove in the first minimal fork

- [`"./validation"`](package.json:34) unless validation stays intentionally public.
- [`"./validation/ajv"`](package.json:38) if AJV support becomes internal-only.
- [`"./validation/cfworker"`](package.json:42) because cfworker support is out of scope.
- [`"./*"`](package.json:54) because it implicitly exports removed transports and auth modules.

### Safer replacement for wildcard exports

Replace the wildcard export with explicit subpaths only for supported modules. The likely first-pass list is:

- root entrypoint
- client entrypoint
- server entrypoint
- explicit stdio subpaths if consumers need them, such as `./client/stdio` and `./server/stdio`
- optional in-memory/testing subpath if intentionally supported

The key policy is that [`package.json`](package.json) should not advertise any path whose implementation is intentionally removed.

## Suggested README positioning

[`sdk/README.md`](sdk/README.md) should eventually describe the fork in concise product terms:

- ContextVM uses a minimal MCP TypeScript SDK fork
- The fork keeps protocol/core functionality and `stdio`
- HTTP and web/auth layers are intentionally excluded
- The fork is maintained to stay syncable with upstream protocol evolution

That framing is important because it sets the expectation that the fork is intentionally scoped, not incomplete.
