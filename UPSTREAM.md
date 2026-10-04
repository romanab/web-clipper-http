# Upstream strategy

This project consumes the Obsidian Web Clipper clipping engine through a single adapter boundary rather than modifying or forking the upstream extension.

## Compatibility target

The machine-readable tested target is `upstream.json`. The current target is:

- repository: `obsidianmd/obsidian-clipper`
- version: `1.7.1`
- SHA: `6d56d618b00bd970aa738d6a7a61edee27783e81`

`npm run check:upstream` fails if the submodule checkout or upstream package version differs from that target. This prevents an unnoticed submodule move from producing an unverified extension.

## Dependency policy

Until Obsidian publishes the clipping core as a stable package/export, use the complete upstream repository as the `upstream/obsidian-clipper` git submodule. Runtime code is consumed from upstream's own `build:api` artifact. Types are consumed through the local adapter boundary.

Do not make project-specific changes inside the upstream submodule. HTTP delivery, configuration, templates, and browser-extension UI belong in this repository.

## Boundary rule

Only `src/clipper/adapter.ts` may import code or types from `upstream/obsidian-clipper`. Everything else uses the local contracts in `src/types.ts` and the local destination/template interfaces.

The purpose of this boundary is to make upstream upgrades a compatibility exercise at one seam rather than a recurring fork merge.

## Normal build and verification

After cloning:

```sh
git submodule update --init --recursive
npm install
npm --prefix upstream/obsidian-clipper install
npm run verify
npm run build
```

`npm run verify` checks the upstream pin, builds upstream's API artifact, type-checks the compatibility boundary, and runs the unit/integration contracts. `npm run build` performs verification before creating the browser-extension bundle.

For a complete release build, including the deterministic ZIP artifact, run:

```sh
npm run release:check
```

## Updating upstream deliberately

The first real validation of this update workflow is intentionally deferred until a newer Obsidian Web Clipper release exists. Do not move the known-good `1.7.1` pin solely to manufacture an update test.

When a real release is available, perform the upgrade on a branch. The supported update command takes an upstream tag or commit SHA:

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
git status
```

For a release candidate, also run:

```sh
npm run release:check
```

Commit `upstream.json` and the `upstream/obsidian-clipper` submodule gitlink together. This makes every accepted upstream movement an explicit, reproducible compatibility decision.

## If an upstream upgrade breaks compatibility

The updater exits before changing `upstream.json` if the compatibility suite fails. Do not patch the upstream submodule to make the project pass.

Instead:

1. inspect the upstream API/template behavior change;
2. adapt `src/clipper/adapter.ts`, local compatibility declarations, and/or tests as necessary;
3. keep the change contained behind the local boundary;
4. rerun `npm run update:upstream -- <tag-or-sha>`;
5. accept the new pin only after the compatibility and release gates pass.

The integration test that clips fixture HTML through the upstream engine and adapter and verifies the HTTP payload is the primary behavioral compatibility contract for upstream upgrades.

## Future upstream package

If Obsidian later publishes a supported clipping-core package/API, replace the adapter runtime/type imports with that package while keeping the local `CompiledClip`, template-store, and destination contracts unchanged. The rest of the extension should not need to know how the clipping core is sourced.
