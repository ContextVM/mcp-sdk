# Upstream Sync Procedure

Keep this fork close to upstream while preserving the ContextVM scope: a lightweight MCP SDK centered on stdio transport and retained protocol/server/client primitives.

This fork should track the upstream [`v1.x`](.git/config) line first, not [`main`](.git/config). Upstream [`main`](.git/config) has moved into broader `v2` and workspace restructuring that is not the baseline for this fork.

## Principles

- Prefer upstream [`v1.x`](.git/config) behavior for retained modules unless it conflicts with fork scope.
- Do not merge [`upstream/main`](.git/config) wholesale. Use it only as background context when a fix has not yet landed on [`v1.x`](.git/config).
- Do not reintroduce removed transports, HTTP/SSE/WebSocket surfaces, auth flows, browser-specific surfaces, examples, workspace restructuring, or extra runtime dependencies unless the fork strategy changes explicitly.
- Preserve upstream-compatible imports for the retained surface whenever possible.
- Prefer cherry-picking or manual ports of small upstream fixes over broad merges.
- Keep fork-specific changes small, isolated, and easy to review.

## Sync Steps

1. Fetch the latest upstream refs and compare this fork against [`upstream/v1.x`](.git/config) first.
2. Review ahead/behind counts and the commit list before changing code.
3. Identify small upstream fixes that map cleanly onto retained files such as [`src/server`](src/server), [`src/client`](src/client), [`src/shared`](src/shared), [`src/validation`](src/validation), [`src/types.ts`](src/types.ts), and retained task-related files.
4. Cherry-pick or manually port upstream fixes in small batches. Avoid broad merges unless the diff is already constrained to the retained surface.
5. Reject or trim any upstream changes that add removed transports, auth/server expansion, examples, monorepo/workspace structure, or dependency growth outside fork scope.
6. Verify public exports in [`package.json`](package.json) still match the retained modules and preserve expected upstream-style subpath imports.
7. Run targeted tests for the touched areas first, then broader package checks as needed.
8. Update [`README.md`](README.md) and related docs only when the retained fork behavior actually changes.

## Review Checklist

- Comparison was made against [`upstream/v1.x`](.git/config), not just [`upstream/main`](.git/config).
- Only commits relevant to the retained surface were selected.
- Retained entrypoints still build.
- Removed transports and related dependencies stay out of the package.
- HTTP/auth/example/workspace additions from upstream remain excluded unless intentionally adopted.
- Public import paths remain compatible for supported modules.
- Documentation still describes the fork accurately.

When in doubt, choose the smaller divergence from upstream [`v1.x`](.git/config) that still respects the fork boundaries.
