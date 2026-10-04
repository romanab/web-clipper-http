# TODO

## Before v0.1.0 release

- [x] Harden HTTP delivery
  - Request timeout using `AbortController` (15 seconds by default).
  - Distinct timeout/network/non-2xx errors.
  - Tests for timeout and network failure behavior.

- [x] Document the HTTP contract
  - Default compact `{ clip, context }` payload.
  - `compact` versus `full` payload modes.
  - Bearer-token authentication and endpoint requirements.
  - Minimal dependency-free Node receiver example.

- [x] Add CI
  - Recursive upstream submodule checkout.
  - Root and pinned-upstream dependency installation.
  - `npm run verify`, packaging, and ZIP artifact upload on pushes and pull requests.

- [x] Add release packaging
  - Deterministic ZIP from `dist/` using sorted stored entries and a fixed timestamp.
  - Packaging rejects a `package.json` / `manifest.json` version mismatch.
  - `npm run package` verifies and builds before packaging.

## Upstream maintenance

- [ ] When the next `obsidianmd/obsidian-clipper` release is available, perform the first real upgrade through:

  ```sh
  npm run update:upstream -- <new-tag>
  ```

  Treat this as the validation of the upstream-update workflow. Do not move the current tested `1.7.1` pin merely to manufacture an upgrade test.

- [ ] For every accepted upstream upgrade:
  - Review adapter/API compatibility failures rather than modifying upstream source.
  - Run `npm run verify` and `npm run build`.
  - Review `git diff --submodule=log`.
  - Commit `upstream.json` and the submodule gitlink together.

## Template UX

- [x] Add template deletion while preventing deletion of the last template.
- [x] Add template renaming without changing the Obsidian-compatible export shape.
- [x] Make the active template explicit in Settings and allow activation there.
- [x] Skip exact duplicate templates during imports.

## Later / optional

- [ ] Consider additional destinations only through the `Destination` interface; do not couple them to clipping/template code.
- [ ] Consider per-destination custom headers if a concrete integration requires them.
- [ ] Consider schema/version metadata for the HTTP contract if external receivers begin depending on it independently.
- [ ] Revisit the upstream integration if Obsidian publishes a supported clipping-core package/API; preserve the local adapter and destination boundaries.

## Architectural constraints

These are intentional constraints, not TODOs:

- Keep `obsidianmd/obsidian-clipper` unmodified as a pinned upstream submodule.
- Keep upstream-specific imports behind `src/clipper/adapter.ts`.
- Keep template selection independent of destination selection.
- Keep HTTP compact mode as the production default; full mode is for integrations/debugging that explicitly need extracted variables/source data.
