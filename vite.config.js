import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import pkg from './package.json' with { type: 'json' };

// Offline cache for the hosted build. The cache name carries the release version, so every release
// replaces the old cache instead of serving stale files. The new worker waits until the player accepts
// the in-app "update available" prompt (it posts SKIP_WAITING).
function serviceWorker(version) {
  return {
    name: 'mnemos-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = ['./', ...Object.keys(bundle).map((f) => './' + f)];
      const src = `// Generated at build time by vite.config.js. Do not edit.
const CACHE = 'mnemos-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('mnemos-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request))));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: src });
    },
  };
}

// `--mode single` (or SINGLE=1) builds one self-contained HTML file for local review; otherwise a static folder for GitHub Pages.
export default defineConfig(({ mode }) => {
  const single = mode === 'single' || process.env.SINGLE === '1';
  return {
    base: './',
    define: { __APP_VERSION__: JSON.stringify(pkg.version), __SINGLE__: JSON.stringify(single) },
    plugins: [react(), ...(single ? [viteSingleFile()] : [serviceWorker(pkg.version)])],
    build: { outDir: single ? 'dist-single' : 'dist', copyPublicDir: !single },
    test: { environment: 'node' },
  };
});
