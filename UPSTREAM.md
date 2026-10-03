# Upstream strategy

This project consumes the Obsidian Web Clipper clipping engine through a single adapter boundary rather than modifying the upstream extension.

## Compatibility target

`obsidianmd/obsidian-clipper@6d56d618b00bd970aa738d6a7a61edee27783e81`

## Dependency policy

Until Obsidian publishes the clipping core as a stable package/export, use a pinned checkout of the complete upstream repository at `upstream/obsidian-clipper`.

Recommended local setup:

```sh
git submodule add https://github.com/obsidianmd/obsidian-clipper.git upstream/obsidian-clipper
git -C upstream/obsidian-clipper checkout 6d56d618b00bd970aa738d6a7a61edee27783e81
```

The GitHub connector used to bootstrap this repository cannot create gitlink/submodule entries directly, so the submodule itself must be added from a git client. The application architecture does not depend on this limitation.

## Boundary rule

Only `src/clipper/adapter.ts` may import code or types from `upstream/obsidian-clipper`. Everything else uses `src/types.ts`.

## Updating upstream

1. Fetch the new upstream revision.
2. Move the submodule pin.
3. Run type checking and contract tests.
4. If the contract fails, change only `src/clipper/adapter.ts` where possible.
5. Record the tested upstream SHA here.

If Obsidian later publishes a supported core package, replace the adapter imports with that package while keeping the local contracts and destination modules unchanged.
