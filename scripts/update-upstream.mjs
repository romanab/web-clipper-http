import { execFileSync, spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const upstreamDir = new URL('../upstream/obsidian-clipper/', import.meta.url);
const targetFile = new URL('../upstream.json', import.meta.url);
const requestedRef = process.argv[2];

if (!requestedRef) {
  console.error('Usage: npm run update:upstream -- <tag-or-sha>');
  process.exit(2);
}

function git(args) {
  return execFileSync('git', args, { cwd: upstreamDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const before = JSON.parse(await readFile(targetFile, 'utf8'));
console.log(`Current tested upstream: ${before.version} (${before.sha.slice(0, 12)})`);
console.log(`Fetching ${before.repository}...`);
git(['fetch', '--tags', 'origin']);

git(['checkout', '--detach', requestedRef]);
const sha = git(['rev-parse', 'HEAD']);
const packageJson = JSON.parse(await readFile(new URL('package.json', upstreamDir), 'utf8'));
console.log(`Candidate upstream: ${packageJson.version} (${sha.slice(0, 12)})`);

console.log('Installing candidate upstream dependencies...');
run('npm', ['install'], upstreamDir);

console.log('Running compatibility suite against candidate (pin check intentionally skipped)...');
run('npm', ['--prefix', 'upstream/obsidian-clipper', 'run', 'build:api']);
run('npm', ['run', 'typecheck']);
run('npm', ['test']);

const next = {
  repository: before.repository,
  sha,
  version: packageJson.version,
};
await writeFile(targetFile, `${JSON.stringify(next, null, 2)}\n`);

console.log('\nCandidate passed. Updated upstream.json.');
console.log('Review the diff, then run: npm run verify && npm run build');
console.log('Commit upstream.json and the upstream/obsidian-clipper submodule gitlink together.');
