import { defineConfig } from 'astro/config';

// Static-output config — Vite resolves JSON imports at build time so the
// source data in src/data/ never lands in dist/.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
