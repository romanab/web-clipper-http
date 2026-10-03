# Web Clipper HTTP

A thin browser-extension integration around the Obsidian Web Clipper core API that sends compiled clips to an HTTP endpoint without coupling destination logic to Obsidian.

## Architecture

```text
browser page
    |
    v
src/clipper/adapter.ts
    |
    v
obsidianmd/obsidian-clipper clip()
    |
    v
local ClipResult contract
    |
    v
Destination
    |
    v
HttpDestination -> HTTP endpoint
```

Only `src/clipper/adapter.ts` may import Obsidian Web Clipper internals. Application and destination code depend on local contracts. This keeps upstream changes contained.

## Upstream compatibility target

- Repository: `obsidianmd/obsidian-clipper`
- Commit: `6d56d618b00bd970aa738d6a7a61edee27783e81`

See `UPSTREAM.md` for the update strategy.

## Status

Architecture scaffold. Initial modules define the upstream boundary, destination contract, HTTP transport, and compatibility tests.
