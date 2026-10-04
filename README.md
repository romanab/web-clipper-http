# Web Clipper HTTP

A thin browser extension around the Obsidian Web Clipper core that compiles pages with Obsidian-compatible templates and sends the result to an HTTP endpoint.

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
local CompiledClip contract
    |
    v
Destination
    |
    v
HttpDestination -> HTTP endpoint
```

Only `src/clipper/adapter.ts` may import Obsidian Web Clipper internals. Application and destination code depend on local contracts so upstream changes stay contained.

## Setup

```sh
git clone --recurse-submodules <this-repository>
cd web-clipper-http
npm install
npm --prefix upstream/obsidian-clipper install
npm run build
```

Load `dist/` as an unpacked Chromium extension. Open the extension Settings page, configure the HTTP endpoint, optionally configure a bearer token, and import Obsidian Web Clipper template JSON as needed.

The endpoint must be an `http://` or `https://` URL. Credentials embedded in the URL are rejected. If a bearer token is configured, requests include `Authorization: Bearer <token>`. Requests time out after 15 seconds. Non-2xx responses, network failures, and timeouts are reported separately by the extension.

## HTTP contract

Every clip is sent as `POST` with `Content-Type: application/json`.

Compact mode is the production default:

```json
{
  "clip": {
    "noteName": "Example article",
    "frontmatter": "---\nsource: https://example.com/article\n---\n",
    "content": "Article markdown...",
    "properties": {
      "source": "https://example.com/article"
    },
    "sourceUrl": "https://example.com/article"
  },
  "context": {
    "sourceUrl": "https://example.com/article",
    "sourceTitle": "Example article"
  }
}
```

`frontmatter + content` is sufficient to reconstruct the generated note. Compact mode intentionally excludes `fullContent` (which duplicates those fields) and `variables` (which can contain large extracted HTML/source data).

Full mode sends the complete compiled clip, including `fullContent` and the upstream compiler's `variables`. Use it only when a receiver explicitly needs those diagnostics/source values.

### Minimal receiver

This dependency-free Node example accepts clips at `http://localhost:8787/clips`:

```js
import http from 'node:http';

http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/clips') {
    res.writeHead(404).end();
    return;
  }

  let body = '';
  req.setEncoding('utf8');
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const payload = JSON.parse(body);
    console.log(payload.clip.noteName);
    console.log(payload.clip.frontmatter + payload.clip.content);
    res.writeHead(204).end();
  });
}).listen(8787, '127.0.0.1');
```

## Templates

Settings can import official Obsidian Web Clipper template JSON, export installed templates, choose the active template, rename templates, and delete templates. Exact duplicate imports are skipped. Internal template IDs are not written into Obsidian-compatible exports.

## Verification and release packaging

```sh
npm run verify
npm run build
npm run package
```

`verify` checks the pinned upstream revision, builds its API artifact, type-checks the local boundary, and runs the tests. `build` verifies before producing `dist/`. `package` verifies/builds and then creates `releases/web-clipper-http-v<version>.zip`.

The ZIP writer uses sorted paths, stored entries, and a fixed ZIP timestamp so identical `dist/` contents produce identical archive bytes. Packaging also fails if `package.json` and `manifest.json` versions differ.

CI performs the same verification and packaging on pushes and pull requests and uploads the ZIP as a workflow artifact.

## Upstream compatibility target

- Repository: `obsidianmd/obsidian-clipper`
- Version: `1.7.1`
- Commit: `6d56d618b00bd970aa738d6a7a61edee27783e81`

See `UPSTREAM.md` for the deliberate update strategy. The first real test of the update workflow is intentionally deferred until the next upstream release rather than moving the known-good pin only to manufacture an upgrade test.
