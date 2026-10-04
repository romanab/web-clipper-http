# TODO

## v0.1.0 release readiness

Completed and verified locally:

- [x] Harden HTTP delivery.
  - 15-second request timeout using `AbortController`.
  - Distinct timeout, network, and non-2xx errors.
  - Tests for timeout and network failure behavior.
- [x] Stabilize the HTTP contract.
  - Compact `{ clip, context }` payload is the production default.
  - Compact mode excludes redundant `fullContent` and large `variables` data.
  - Full mode remains available when complete compiler output is required.
  - Bearer-token authentication and endpoint requirements documented.
  - Minimal dependency-free Node receiver documented.
- [x] Add Obsidian-compatible template management.
  - Official template JSON import/export.
  - Active template selection in popup and Settings.
  - Rename and delete controls; last template cannot be deleted.
  - Exact duplicate imports are skipped.
- [x] Add CI.
  - Recursive upstream submodule checkout.
  - Root and pinned-upstream dependency installation.
  - Verification, packaging, and ZIP artifact upload on pushes and pull requests.
- [x] Add deterministic release packaging.
  - ZIP from `dist/` uses sorted stored entries and a fixed timestamp.
  - Packaging rejects a `package.json` / `manifest.json` version mismatch.
  - `npm run release:check` verifies, builds, and packages.
  - Determinism has been manually confirmed by matching SHA-256 values across repeated release builds.
- [x] Pass the local v0.1.0 release gate.
  - 4 test files passed.
  - 16 tests passed.
  - Upstream API build and browser-extension bundle succeeded.
  - `releases/web-clipper-http-v0.1.0.zip` produced successfully.

## Upstream maintenance

- [ ] When the next `obsidianmd/obsidian-clipper` release is available, perform the first real upgrade through:

  ```sh
  npm run update:upstream -- <new-tag>
  ```

  Treat this as the validation of the upstream-update workflow. Do not move the current tested `1.7.1` pin merely to manufacture an upgrade test.

For every accepted upstream upgrade:

- [ ] Review adapter/API compatibility failures rather than modifying upstream source.
- [ ] Run `npm run verify` and `npm run build`.
- [ ] Review `git diff --submodule=log`.
- [ ] Commit `upstream.json` and the `upstream/obsidian-clipper` submodule gitlink together.

## Later / optional

- [ ] Consider additional destinations only through the `Destination` interface; do not couple them to clipping/template code.
- [ ] Consider per-destination custom headers if a concrete integration requires them.
- [ ] Consider explicit schema/version metadata for the HTTP contract if independent external receivers begin depending on it.
- [ ] Improve visual styling if the extension is prepared for wider distribution; current UI intentionally prioritizes function over presentation.
- [ ] Investigate bundle-size optimization only if the bundled upstream clipping engine becomes a practical distribution/performance issue.
- [ ] Revisit upstream integration if Obsidian publishes a supported clipping-core package/API; preserve the local adapter and destination boundaries.

## Architectural constraints

These are intentional constraints, not TODOs:

- Keep `obsidianmd/obsidian-clipper` unmodified as a pinned upstream submodule.
- Keep upstream-specific imports behind `src/clipper/adapter.ts`.
- Keep template selection independent of destination selection.
- Keep destinations behind the local `Destination` interface.
- Keep HTTP compact mode as the production default; full mode is for integrations/debugging that explicitly need extracted variables/source data.
- Prefer adapting the thin compatibility boundary when upstream changes rather than forking or patching upstream source.
