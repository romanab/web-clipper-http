# TODO

## Before v0.1.0 release

- [ ] Harden HTTP delivery
  - Add a request timeout using `AbortController`.
  - Distinguish timeout/network failures from non-2xx HTTP responses in the popup.
  - Add tests for timeout and network failure behavior.

- [ ] Document the HTTP contract
  - Document the default compact `{ clip, context }` payload.
  - Document `compact` versus `full` payload modes.
  - Document bearer-token authentication and endpoint requirements.
  - Include a minimal receiver example.

- [ ] Add CI
  - Run `npm install` for this project and the pinned upstream submodule.
  - Run `npm run verify` on pushes and pull requests.
  - Ensure the upstream submodule is checked out recursively.

- [ ] Add release packaging
  - Produce a deterministic ZIP from `dist/`.
  - Keep the extension version synchronized with the release version.
  - Add a release/check command that verifies before packaging.

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

- [ ] Add template deletion.
- [ ] Add template renaming if it can be done without diverging from Obsidian-compatible import/export semantics.
- [ ] Make the active template explicit in Settings.
- [ ] Improve duplicate-template handling during imports.

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
