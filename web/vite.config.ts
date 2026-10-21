import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/account': 'http://localhost:3000',
      '/payment': 'http://localhost:3000',
    },
  },
});
