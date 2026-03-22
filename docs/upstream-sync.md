# Upstream Sync Procedure

Keep this fork close to upstream while preserving the ContextVM scope: a lightweight MCP SDK centered on stdio transport and retained protocol/server/client primitives.

## Principles

- Prefer upstream behavior and file structure unless it conflicts with fork scope.
- Do not reintroduce removed transports, auth flows, browser-specific surfaces, or extra runtime dependencies unless the fork strategy changes explicitly.
- Preserve upstream-compatible imports for the retained surface whenever possible.
- Keep fork-specific changes small, isolated, and easy to review.

## Sync Steps

1. Fetch the latest upstream changes and review the diff before merging.
2. Merge or cherry-pick upstream changes in small batches when practical.
3. Reapply fork constraints by removing or rejecting changes that expand beyond the retained stdio-focused surface.
4. Verify public exports in [`package.json`](package.json) still match the retained modules and preserve expected upstream-style subpath imports.
5. Run the test suite and any export or packaging checks before publishing.
6. Update [`README.md`](README.md) only when upstream changes affect documented fork behavior.

## Review Checklist

- Retained entrypoints still build.
- Removed transports and related dependencies stay out of the package.
- Public import paths remain compatible for supported modules.
- Documentation still describes the fork accurately.

When in doubt, choose the smaller divergence from upstream that still respects the fork boundaries.
