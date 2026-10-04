# Web Clipper HTTP

A Chromium browser extension that uses the pinned Obsidian Web Clipper core to compile pages with Obsidian-compatible templates, then sends the compiled result to an HTTP endpoint instead of writing directly to an Obsidian vault.

## Status

Version `0.1.0` is release-ready. The release gate currently covers 16 tests across configuration, HTTP delivery, template storage, and the end-to-end upstream clipping integration. Release packaging is deterministic: rebuilding unchanged sources produces the same ZIP bytes/SHA-256.

The current tested upstream target is Obsidian Web Clipper `1.7.1` at commit `6d56d618b00bd970aa738d6a7a61edee27783e81`.

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

Only `src/clipper/adapter.ts` may import Obsidian Web Clipper internals. Application and destination code depend on local contracts so upstream changes stay contained. The upstream repository is kept unmodified as a pinned git submodule.

## Setup

Requirements: Git, Node.js 22, npm, and a Chromium-based browser that supports Manifest V3 extensions.

```sh
git clone --recurse-submodules <this-repository>
cd web-clipper-http
npm install
npm --prefix upstream/obsidian-clipper install
npm run build
```

If the repository was cloned without submodules, initialize them first:

```sh
git submodule update --init --recursive
```

Load `dist/` as an unpacked extension from the browser's extensions page with developer mode enabled.

## Configuration and use

Open **Web Clipper HTTP → Settings** and configure:

- **Endpoint URL** — required `http://` or `https://` destination. Local endpoints such as `http://localhost:8787/clips` are supported.
- **Bearer token** — optional. When set, requests include `Authorization: Bearer <token>`. Credentials embedded in the endpoint URL are rejected.
- **Payload** — `Compact` is the production default; `Full` includes the complete upstream compiler output and is intended for integrations/debugging that explicitly need it.

Requests time out after 15 seconds. Timeout, network, and non-2xx HTTP failures are reported separately.

The popup lets you choose the active template and clip the current page. Settings can also activate, rename, delete, import, and export templates. The final remaining template cannot be deleted.

## HTTP contract

Every clip is sent as `POST` with `Content-Type: application/json`.

### Compact mode

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

`frontmatter + content` reconstructs the generated note. Compact mode intentionally excludes `fullContent`, which duplicates those fields, and `variables`, which can contain large extracted HTML/source data.

### Full mode

Full mode preserves the complete local `CompiledClip`, including `fullContent` and the upstream compiler's `variables`. Use it only when the receiver explicitly needs extracted variables, HTML, or other source diagnostics; payloads can be substantially larger.

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

The extension imports the official Obsidian Web Clipper template JSON shape (`schemaVersion: "0.1.0"` for the currently tested upstream format). Obsidian exports do not contain the extension's internal template IDs, so a local ID is generated on import and stripped again on export.

Settings can:

- import one template object or an array of templates;
- skip exact duplicate imports;
- export installed templates in Obsidian-compatible form;
- choose the active template;
- rename a template;
- delete a template while preserving at least one installed template.

Template compilation itself remains upstream behavior: this project passes the selected template through the pinned Obsidian Web Clipper core rather than reimplementing its variable/filter semantics.

## Verification

```sh
npm run verify
```

`verify` checks the pinned upstream revision, builds upstream's API artifact, type-checks the local compatibility boundary, and runs the unit/integration suite.

A normal production build is:

```sh
npm run build
```

`build` runs verification before producing `dist/`.

## Release packaging

The complete local release gate is:

```sh
npm run release:check
```

This verifies, builds, and writes:

```text
releases/web-clipper-http-v0.1.0.zip
```

The ZIP writer uses sorted paths, stored entries, and a fixed ZIP timestamp so identical `dist/` contents produce identical archive bytes. Packaging fails if `package.json` and `manifest.json` versions differ.

To verify deterministic packaging manually:

```sh
sha256sum releases/web-clipper-http-v0.1.0.zip
npm run release:check
sha256sum releases/web-clipper-http-v0.1.0.zip
```

The hashes should match.

## CI

GitHub Actions checks out the repository with the upstream submodule, installs both dependency sets, runs `npm run verify`, builds/packages the extension, and uploads the release ZIP as a workflow artifact on pushes and pull requests.

## Upstream maintenance

The current compatibility target is:

- Repository: `obsidianmd/obsidian-clipper`
- Version: `1.7.1`
- Commit: `6d56d618b00bd970aa738d6a7a61edee27783e81`

Do not casually advance the submodule. `npm run check:upstream` ensures builds use the tested target. When the next real upstream release is available, use:

```sh
npm run update:upstream -- <new-tag>
```

The updater tests the candidate against the local compatibility suite before updating `upstream.json`. See `UPSTREAM.md` for the complete procedure.

## Project roadmap

See `TODO.md`. All currently actionable v0.1.0 hardening work is complete; the first real upstream-update validation is intentionally deferred until a newer Obsidian Web Clipper release exists.
