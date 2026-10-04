# Upstream strategy

This project consumes the Obsidian Web Clipper clipping engine through a single adapter boundary rather than modifying the upstream extension.

## Compatibility target

The machine-readable tested target is `upstream.json`. The current target is:

- repository: `obsidianmd/obsidian-clipper`
- version: `1.7.1`
- SHA: `6d56d618b00bd970aa738d6a7a61edee27783e81`

`npm run check:upstream` fails if the submodule checkout or upstream package version differs from that target. This prevents an unnoticed submodule move from producing an unverified extension.

## Dependency policy

Until Obsidian publishes the clipping core as a stable package/export, use the complete upstream repository as the `upstream/obsidian-clipper` git submodule. Runtime code is consumed from upstream's own `build:api` artifact. Types are consumed through the local adapter boundary.

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

Do upgrades on a branch. The supported update command takes a tag or commit SHA:

```sh
npm run update:upstream -- <tag-or-sha>
```

The updater:

1. fetches upstream tags;
2. checks out the requested upstream ref in detached-HEAD mode;
3. reads the candidate version and SHA;
4. installs the candidate upstream dependencies;
5. builds upstream's API artifact;
6. runs this project's typecheck and test suite against the candidate while deliberately bypassing the old pin check;
7. updates `upstream.json` only after those compatibility checks pass.

It does not commit anything. Review the resulting submodule and `upstream.json` changes, then run:

```sh
npm run verify
npm run build
git diff --submodule=log
```

Commit `upstream.json` and the `upstream/obsidian-clipper` submodule gitlink together. This makes every accepted upstream movement an explicit, reproducible compatibility decision.

If compatibility breaks, the updater exits before changing `upstream.json`. Adapt `src/clipper/adapter.ts` and/or the compatibility declarations and tests rather than leaking upstream types into the destination layer. Re-run the updater after the boundary is compatible.

The integration test clips fixture HTML through the upstream engine and adapter, then verifies the HTTP payload. That is the primary behavioral compatibility contract for upstream upgrades.

If Obsidian later publishes a supported core package, replace the adapter runtime/type imports with that package while keeping the local clip and destination contracts unchanged.
