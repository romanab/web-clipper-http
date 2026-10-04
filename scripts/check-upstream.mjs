import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const expected = JSON.parse(await readFile(new URL('../upstream.json', import.meta.url), 'utf8'));
const upstreamDir = new URL('../upstream/obsidian-clipper/', import.meta.url);
const packageJson = JSON.parse(await readFile(new URL('package.json', upstreamDir), 'utf8'));
const actualSha = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: upstreamDir,
  encoding: 'utf8',
}).trim();

const errors = [];
if (actualSha !== expected.sha) errors.push(`SHA: expected ${expected.sha}, got ${actualSha}`);
if (packageJson.version !== expected.version) errors.push(`version: expected ${expected.version}, got ${packageJson.version}`);

if (errors.length) {
  console.error('Upstream compatibility target mismatch:');
  for (const error of errors) console.error(`  - ${error}`);
  console.error('If this upgrade is intentional, run the full verify suite, then update upstream.json.');
  process.exit(1);
}

console.log(`Upstream OK: ${expected.repository}@${expected.version} (${actualSha.slice(0, 12)})`);
