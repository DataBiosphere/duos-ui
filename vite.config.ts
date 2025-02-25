import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
  assetsInclude: ['**/*.md'],
  build: {
    outDir: 'build',
    target: 'es2022'
  },
  server: {
    host: 'local.dsde-dev.broadinstitute.org',
    port: 3000,
    https: (process.env.CI || process.env.CYPRESS) ? undefined : {
      key: 'server.key',
      cert: 'server.crt',
    },
  },
});
