import * as esbuild from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/extension', { recursive: true });

await esbuild.build({
  entryPoints: {
    'extension/popup': 'src/extension/popup.ts',
    'extension/options': 'src/extension/options.ts',
  },
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['chrome120'],
  outdir: 'dist',
  define: {
    DEBUG_MODE: 'false',
  },
  logLevel: 'info',
});

await Promise.all([
  cp('manifest.json', 'dist/manifest.json'),
  cp('src/extension/popup.html', 'dist/extension/popup.html'),
  cp('src/extension/options.html', 'dist/extension/options.html'),
]);
