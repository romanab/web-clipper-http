import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const releaseDir = path.join(root, 'releases');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));

if (packageJson.version !== manifest.version) {
  throw new Error(`Version mismatch: package.json=${packageJson.version}, manifest.json=${manifest.version}`);
}

async function filesUnder(dir, prefix = '') {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries.sort()) {
    const absolute = path.join(dir, entry);
    const relative = path.posix.join(prefix, entry);
    if ((await stat(absolute)).isDirectory()) files.push(...await filesUnder(absolute, relative));
    else files.push({ absolute, relative });
  }
  return files;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function localHeader(name, data, crc) {
  const nameBytes = Buffer.from(name);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0x0021, 12); // 1980-01-01 00:00:00
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(nameBytes.length, 26);
  return Buffer.concat([header, nameBytes, data]);
}

function centralHeader(name, data, crc, offset) {
  const nameBytes = Buffer.from(name);
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0x0021, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(data.length, 20);
  header.writeUInt32LE(data.length, 24);
  header.writeUInt16LE(nameBytes.length, 28);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, nameBytes]);
}

const files = await filesUnder(distDir);
const locals = [];
const centrals = [];
let offset = 0;
for (const file of files) {
  const data = await readFile(file.absolute);
  const crc = crc32(data);
  const local = localHeader(file.relative, data, crc);
  locals.push(local);
  centrals.push(centralHeader(file.relative, data, crc, offset));
  offset += local.length;
}

const central = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(central.length, 12);
end.writeUInt32LE(offset, 16);

await mkdir(releaseDir, { recursive: true });
const output = path.join(releaseDir, `web-clipper-http-v${packageJson.version}.zip`);
await rm(output, { force: true });
await writeFile(output, Buffer.concat([...locals, central, end]));
console.log(`Packaged ${files.length} files -> ${path.relative(root, output)}`);
