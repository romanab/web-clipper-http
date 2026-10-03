import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/extension', { recursive: true });
await Promise.all([
  cp('manifest.json', 'dist/manifest.json'),
  cp('src/extension/popup.html', 'dist/extension/popup.html'),
  cp('src/extension/options.html', 'dist/extension/options.html'),
]);
