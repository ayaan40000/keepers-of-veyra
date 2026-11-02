// Preview-only config: the app config plus JSX inside .js files (src/pixel/core.js uses JSX).
import base from '../../vite.config.js';
export default {
  ...base,
  root: new URL('../..', import.meta.url).pathname,
  esbuild: { loader: 'jsx', include: /\.[jt]sx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
};
