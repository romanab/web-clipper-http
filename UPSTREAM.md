# Upstream strategy

This project consumes the Obsidian Web Clipper clipping engine through a single adapter boundary rather than modifying the upstream extension.

## Compatibility target

The machine-readable tested target is `upstream.json`. The current target is:

- repository: `obsidianmd/obsidian-clipper`
- version: `1.7.1`
- SHA: `6d56d618b00bd970aa738d6a7a61edee27783e81`

`npm run check:upstream` fails if the submodule checkout or upstream package version differs from that target. This prevents an unnoticed submodule move from producing an unverified extension.

## Dependency policy

Until Obsidian publishes the clipping core as a stable package/export, use the complete upstream repository as the `upstream/obsidian-clipper` git submodule. Runtime code is consumed from upstream's own `build:api` artifact. Types are consumed from the same pinned source tree.

## Boundary rule

Only `src/clipper/adapter.ts` may import code or types from `upstream/obsidian-clipper`. Everything else uses the local contracts in `src/types.ts`.

## Normal build and verification

After cloning:

```sh
git submodule update --init --recursive
npm install
npm --prefix upstream/obsidian-clipper install
npm run verify
npm run build
```

`npm run verify` checks the upstream pin, builds upstream's API artifact, type-checks our compatibility boundary, and runs our unit/integration contracts. `npm run build` runs that verification before creating the browser extension bundle.

## Updating upstream deliberately

Do upgrades on a branch. Do not edit `upstream.json` first; its mismatch is the guard that proves you actually moved upstream.

```sh
git -C upstream/obsidian-clipper fetch --tags origin
git -C upstream/obsidian-clipper checkout <new-tag-or-sha>
npm --prefix upstream/obsidian-clipper install
npm run typecheck
npm test
```

If compatibility breaks, adapt `src/clipper/adapter.ts` rather than leaking upstream types into the destination layer. Once type checking and tests pass, update the `sha` and `version` in `upstream.json`, run `npm run verify`, then commit both the submodule gitlink and `upstream.json` together.

The integration test clips fixture HTML through the upstream engine and adapter, then verifies the HTTP payload. That is the primary behavioral compatibility contract for upstream upgrades.

If Obsidian later publishes a supported core package, replace the adapter runtime/type imports with that package while keeping the local clip and destination contracts unchanged.
